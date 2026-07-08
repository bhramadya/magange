<?php

namespace App\Http\Controllers\Opd;

use App\Contracts\PengajuanServiceContract;
use App\Http\Controllers\Controller;
use App\Http\Requests\Opd\ApproveApplicationRequest;
use App\Http\Requests\Verifikator\RejectApplicationRequest;
use App\Models\InternshipApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function __construct(private PengajuanServiceContract $submissionService) {}

    public function approve(ApproveApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorize('update', $application);

        $this->submissionService->approve($application, $request->validated(), $request->user());

        return back()->with('success', 'Pengajuan berhasil disetujui.');
    }

    public function reject(RejectApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorize('update', $application);

        $validated = $request->validated();

        $this->submissionService->reject($application, $request->user(), $validated['rejection_reason']);

        return back()->with('success', 'Pengajuan berhasil ditolak.');
    }

    /**
     * Tandai magang selesai (salah satu dari 4 aktor: Admin OPD).
     */
    public function complete(Request $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorize('update', $application);

        $this->submissionService->complete($application, $request->user(), 'Diselesaikan oleh Admin OPD');

        return back()->with('success', 'Magang ditandai selesai.');
    }
}
