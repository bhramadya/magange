<?php

namespace App\Http\Controllers\Opd;

use App\Contracts\PengajuanServiceContract;
use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\RejectApplicationRequest;
use App\Models\InternshipApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    public function __construct(private PengajuanServiceContract $submissionService) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $status = $request->query('status');

        $query = InternshipApplication::query()
            ->with(['user', 'opd', 'forwardedBy'])
            ->where('opd_id', $user->opd_id);

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $applications = $query->latest()->paginate(20);

        return Inertia::render('opd/pengajuan/index', [
            'applications' => $applications,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function show(InternshipApplication $application): Response
    {
        $this->authorize('view', $application);

        $application->load(['user', 'opd', 'forwardedBy', 'opdDecisionBy', 'statusLogs.changedBy']);

        return Inertia::render('opd/pengajuan/show', [
            'application' => $application,
        ]);
    }

    public function approve(Request $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorize('update', $application);

        $this->submissionService->approve($application, $request->user());

        return back()->with('success', 'Pengajuan berhasil disetujui.');
    }

    public function reject(RejectApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorize('update', $application);

        $validated = $request->validated();

        $this->submissionService->reject($application, $request->user(), $validated['rejection_reason']);

        return back()->with('success', 'Pengajuan berhasil ditolak.');
    }
}
