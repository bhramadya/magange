<?php

namespace App\Http\Controllers\Verifikator;

use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\UploadCertificateRequest;
use App\Http\Resources\MagangUserResource;
use App\Models\FinalReport;
use App\Services\CertificateService;
use App\Services\SkNumberService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        private CertificateService $certificateService,
        private SkNumberService $skNumbers,
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $search = trim((string) $request->query('search', ''));

        $query = FinalReport::query()
            ->with(['application.user', 'application.opd', 'reviewedBy']);

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        // R14: pencarian server-side pada tiket / nama peserta / instansi.
        if ($search !== '') {
            $query->whereHas('application', function ($q) use ($search): void {
                $q->where('ticket_number', 'ilike', "%{$search}%")
                    ->orWhere('institution_name', 'ilike', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'ilike', "%{$search}%"));
            });
        }

        $reports = $query->latest('submitted_at')->paginate(20)->withQueryString();

        return Inertia::render('verifikator/reports/index', [
            'user' => new MagangUserResource($request->user()),
            'reports' => $reports,
            'filters' => [
                'status' => $status,
                'search' => $search !== '' ? $search : null,
            ],
        ]);
    }

    /**
     * Sajikan berkas laporan akhir (disk privat) agar Admin Verifikator dapat
     * meninjaunya. Tampil inline supaya PDF terbuka di tab baru.
     */
    public function downloadReport(FinalReport $report): StreamedResponse
    {
        abort_if(! Storage::disk('local')->exists($report->file_path), 404);

        return Storage::disk('local')->response($report->file_path, $report->file_name);
    }

    public function approve(Request $request, FinalReport $report): RedirectResponse
    {
        $report->update([
            'status' => ReportStatus::Approved,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => Date::now(),
        ]);

        return back()->with('success', 'Laporan berhasil disetujui.');
    }

    public function uploadCertificate(UploadCertificateRequest $request, FinalReport $report): RedirectResponse
    {
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
    public function generateCompletionLetter(FinalReport $report): RedirectResponse
    {
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
    public function downloadCompletionLetter(FinalReport $report): StreamedResponse
    {
        abort_if($report->completion_letter_path === null, 404, 'Surat penyelesaian belum diterbitkan.');
        abort_if(! Storage::disk('local')->exists($report->completion_letter_path), 404);

        return Storage::disk('local')->response(
            $report->completion_letter_path,
            "surat-penyelesaian-{$report->application->ticket_number}.pdf",
        );
    }
}
