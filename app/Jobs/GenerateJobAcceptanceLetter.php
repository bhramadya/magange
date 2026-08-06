<?php

namespace App\Jobs;

use App\Mail\AcceptanceLetterMail;
use App\Models\InternshipApplication;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

/**
 * Generate PDF surat penerimaan magang via DomPDF, simpan ke disk privat,
 * catat path-nya di pengajuan, lalu kirim email dengan PDF terlampir.
 */
class GenerateJobAcceptanceLetter implements ShouldQueue
{
    use Queueable;

    /**
     * @var int
     */
    public $tries = 3;

    /**
     * @var array<int, int>
     */
    public $backoff = [30, 60, 120];

    public function __construct(
        public InternshipApplication $application,
    ) {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        $application = $this->application->loadMissing('user', 'opd');

        $year = $application->created_at->year;
        $letterNumber = sprintf('SM/%d/%05d', $year, $application->id);

        $pdf = Pdf::loadView('pdf.acceptance_letter', [
            'application' => $application,
            'letterNumber' => $letterNumber,
        ]);

        $path = "acceptance-letter/{$application->id}/surat-penerimaan-{$application->ticket_number}.pdf";

        $contents = $pdf->output();
        $disk = Storage::disk('local');

        $stored = $disk->put($path, $contents);

        // Disk 'local' dikonfigurasi 'throw' => false, jadi put() yang gagal
        // (izin tulis, disk penuh) hanya mengembalikan false — TANPA exception.
        // Tanpa cek ini job lanjut: path tercatat di DB seolah surat ada, lalu
        // Attachment::fromStorageDisk membaca null dan meledak jauh di belakang
        // dengan TypeError "body ... got null" yang tidak menyebut surat sama
        // sekali. Gagal di sini supaya penyebabnya kelihatan di failed_jobs.
        if ($stored === false || ! $disk->exists($path)) {
            throw new RuntimeException(
                "Surat penerimaan {$application->ticket_number} gagal disimpan ke disk 'local' ({$path}); email tidak dikirim.",
            );
        }

        $application->update(['surat_penerimaan_path' => $path]);

        Mail::to($application->user->email)
            ->send(new AcceptanceLetterMail($application, $path));

        // Jejak untuk menjawab "email diterima tapi PDF-nya tidak ada":
        // baris ini membuktikan lampiran ikut terkirim beserta ukurannya.
        Log::info('Surat penerimaan terkirim', [
            'application_id' => $application->id,
            'ticket_number' => $application->ticket_number,
            'to' => $application->user->email,
            'path' => $path,
            'bytes' => strlen($contents),
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('GenerateJobAcceptanceLetter gagal', [
            'application_id' => $this->application->id,
            'error' => $exception?->getMessage(),
        ]);
    }
}
