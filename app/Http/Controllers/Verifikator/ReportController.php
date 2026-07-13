<?php

namespace App\Http\Controllers\Verifikator;

use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\UploadCertificateRequest;
use App\Http\Resources\MagangUserResource;
use App\Models\FinalReport;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private CertificateService $certificateService) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status');

        $query = FinalReport::query()
            ->with(['application.user', 'application.opd', 'reviewedBy']);

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $reports = $query->latest('submitted_at')->paginate(20);

        return Inertia::render('verifikator/reports/index', [
            'user' => new MagangUserResource($request->user()),
            'reports' => $reports,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    /**
     * Sajikan berkas laporan akhir (disk privat) agar Admin Verifikator dapat
     * meninjaunya. Tampil inline supaya PDF terbuka di tab baru.
     */
    public function downloadReport(FinalReport $report): StreamedResponse
    {
        abort_if(
            $report->file_path === null || ! Storage::disk('local')->exists($report->file_path),
            404,
        );

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
}
