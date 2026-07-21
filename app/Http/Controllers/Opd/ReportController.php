<?php

namespace App\Http\Controllers\Opd;

use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Opd\UploadCertificateRequest;
use App\Models\FinalReport;
use App\Services\CertificateService;
use App\Services\SkNumberService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Penyelesaian magang oleh Admin OPD (batch 5: pindahan total dari
 * Verifikator\ReportController): tinjau laporan akhir, unggah sertifikat
 * (terkunci sampai survei), terbitkan Surat Penyelesaian ber-kop Kominfo.
 * Tanpa halaman index — datanya lewat halaman Kelola Peserta (opd/peserta).
 * Setiap aksi diguard kepemilikan: report harus milik pengajuan OPD ini.
 */
class ReportController extends Controller
{
    public function __construct(
        private CertificateService $certificateService,
        private SkNumberService $skNumbers,
    ) {}

    /**
     * Sajikan berkas laporan akhir (disk privat) agar Admin OPD dapat
     * meninjaunya. Tampil inline supaya PDF terbuka di tab baru.
     */
    public function downloadReport(Request $request, FinalReport $report): StreamedResponse
    {
        $this->authorizeReport($request, $report);
        abort_if(! Storage::disk('local')->exists($report->file_path), 404);

        return Storage::disk('local')->response($report->file_path, $report->file_name);
    }

    public function approve(Request $request, FinalReport $report): RedirectResponse
    {
        $this->authorizeReport($request, $report);

        $report->update([
            'status' => ReportStatus::Approved,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => Date::now(),
        ]);

        return back()->with('success', 'Laporan berhasil disetujui.');
    }

    public function uploadCertificate(UploadCertificateRequest $request, FinalReport $report): RedirectResponse
    {
        $this->authorizeReport($request, $report);

        $file = $request->file('file');

        if ($file === null) {
            return back()->withErrors(['file' => 'File sertifikat tidak ditemukan.']);
        }

        $this->certificateService->uploadCertificate($report, $file, $request->user());

        return back()->with('success', 'Sertifikat berhasil diunggah.');
    }

    /**
     * Generate Surat Penyelesaian Magang ber-kop Kominfo (R9). Idempoten:
     * nomor SK & tanggal terbit di-set SEKALI — klik ulang tidak mengubah
     * nomor/tanggal, hanya meregenerasi arsip bila hilang.
     */
    public function generateCompletionLetter(Request $request, FinalReport $report): RedirectResponse
    {
        $this->authorizeReport($request, $report);

        $report->loadMissing('application.user', 'application.opd');

        if ($report->completion_sk_number === null) {
            DB::transaction(function () use ($report): void {
                $report->update([
                    'completion_sk_number' => $this->skNumbers->next(SkNumberService::KEY_COMPLETION),
                    'completion_sk_issued_at' => Date::today(),
                ]);
            });
        }

        // Render & arsipkan PDF ke disk privat (regenerasi bila belum ada).
        if ($report->completion_letter_path === null || ! Storage::disk('local')->exists($report->completion_letter_path)) {
            $pdf = Pdf::loadView('pdf.completion_letter', ['report' => $report]);

            $path = "completion-letter/{$report->id}/surat-penyelesaian-{$report->application->ticket_number}.pdf";
            Storage::disk('local')->put($path, $pdf->output());

            $report->update(['completion_letter_path' => $path]);
        }

        return back()->with('success', "Surat penyelesaian diterbitkan (No. {$report->completion_sk_number}).");
    }

    /**
     * Unduh Surat Penyelesaian Magang dari arsip disk privat.
     */
    public function downloadCompletionLetter(Request $request, FinalReport $report): StreamedResponse
    {
        $this->authorizeReport($request, $report);

        abort_if($report->completion_letter_path === null, 404, 'Surat penyelesaian belum diterbitkan.');
        abort_if(! Storage::disk('local')->exists($report->completion_letter_path), 404);

        return Storage::disk('local')->response(
            $report->completion_letter_path,
            "surat-penyelesaian-{$report->application->ticket_number}.pdf",
        );
    }

    /**
     * Guard kepemilikan: laporan harus milik pengajuan yang ditempatkan
     * di OPD admin yang login. Admin OPD lain → 403.
     */
    private function authorizeReport(Request $request, FinalReport $report): void
    {
        $report->loadMissing('application');

        abort_unless($report->application->opd_id === $request->user()->opd_id, 403);
    }
}
