<?php

namespace App\Http\Controllers\Verifikator;

use App\Contracts\PengajuanServiceContract;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\ForwardApplicationRequest;
use App\Http\Requests\Verifikator\RejectApplicationRequest;
use App\Models\InternshipApplication;
use App\Models\Opd;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengajuanController extends Controller
{
    public function __construct(private PengajuanServiceContract $submissionService) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status');

        $query = InternshipApplication::query()
            ->with(['user', 'opd', 'forwardedBy']);

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $applications = $query->latest()->paginate(20);

        $opds = Opd::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('verifikator/pengajuan/index', [
            'applications' => $applications,
            'opds' => $opds,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function show(InternshipApplication $application): Response
    {
        $application->load(['user', 'opd', 'forwardedBy', 'opdDecisionBy', 'statusLogs.changedBy']);

        $opds = Opd::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('verifikator/pengajuan/show', [
            'application' => $application,
            'opds' => $opds,
        ]);
    }

    public function forward(ForwardApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $validated = $request->payload();

        $this->submissionService->forwardToOpd($application, $validated, $request->user());

        return back()->with('success', 'Pengajuan berhasil diteruskan ke OPD.');
    }

    public function reject(RejectApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $validated = $request->validated();

        $this->submissionService->reject($application, $request->user(), $validated['rejection_reason']);

        return back()->with('success', 'Pengajuan berhasil ditolak.');
    }
}
