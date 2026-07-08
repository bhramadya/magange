<?php

namespace App\Http\Controllers\Verifikator;

use App\Contracts\PengajuanServiceContract;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\ForwardApplicationRequest;
use App\Http\Requests\Verifikator\RejectApplicationRequest;
use App\Models\InternshipApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PengajuanController extends Controller
{
    public function __construct(private PengajuanServiceContract $submissionService) {}

    public function forward(ForwardApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $validated = $request->validated();

        $this->submissionService->forwardToOpd($application, $validated, $request->user());

        return back()->with('success', 'Pengajuan berhasil diteruskan ke OPD.');
    }

    public function reject(RejectApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $validated = $request->validated();

        $this->submissionService->reject($application, $request->user(), $validated['rejection_reason']);

        return back()->with('success', 'Pengajuan berhasil ditolak.');
    }

    /**
     * Tandai magang selesai (salah satu dari 4 aktor: Admin Verifikator).
     */
    public function complete(Request $request, InternshipApplication $application): RedirectResponse
    {
        $this->submissionService->complete($application, $request->user(), 'Diselesaikan oleh Admin Verifikator');

        return back()->with('success', 'Magang ditandai selesai.');
    }
}
