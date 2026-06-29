<?php

namespace App\Http\Controllers\Verifikator;

use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\UploadCertificateRequest;
use App\Models\FinalReport;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

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
            'reports' => $reports,
            'filters' => [
                'status' => $status,
            ],
        ]);
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
