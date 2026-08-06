<?php

namespace App\Http\Controllers\Opd;

use App\Contracts\PengajuanServiceContract;
use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Opd\ApproveApplicationRequest;
use App\Http\Requests\Verifikator\RejectApplicationRequest;
use App\Models\InternshipApplication;
use App\Models\OpdSigner;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function __construct(private PengajuanServiceContract $submissionService) {}

    public function approve(ApproveApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorize('update', $application);

        try {
            $this->submissionService->approve($application, $request->validated(), $request->user());
        } catch (DomainException $e) {
            // mis. kuota OPD penuh — tampilkan pesan ramah di dialog, bukan 500.
            return back()->withErrors(['division' => $e->getMessage()]);
        }

        if ($application->fresh()->status === ApplicationStatus::WaitingTte) {
            return back()
                ->with('success', 'Pengajuan disetujui. Unduh Surat Penerimaan untuk ditandatangani.')
                ->with('acceptanceDraftUrl', route('opd.menunggu-tte.draft.download', $application))
                ->with('acceptanceDraftName', 'Surat Penerimaan ('.$application->user->name.').pdf');
        }

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
     * Tarik pengajuan lama (disetujui tanpa penandatangan) ke Menunggu TTE.
     */
    public function reissueForTte(Request $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorize('update', $application);

        $signer = OpdSigner::query()
            ->where('opd_id', $request->user()->opd_id)
            ->findOrFail($request->integer('signer_id'));

        try {
            $this->submissionService->reissueForTte($application, $signer, $request->user());
        } catch (DomainException $e) {
            return back()->withErrors(['signer_id' => $e->getMessage()]);
        }

        return back()->with('success', 'Pengajuan ditarik ke Menunggu TTE. Unduh surat untuk ditandatangani.');
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
