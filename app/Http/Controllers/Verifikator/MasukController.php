<?php

namespace App\Http\Controllers\Verifikator;

use App\Contracts\PengajuanServiceContract;
use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\ForwardApplicationRequest;
use App\Http\Requests\Verifikator\RejectApplicationRequest;
use App\Models\InternshipApplication;
use App\Models\User;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MasukController extends Controller
{
    public function __construct(private PengajuanServiceContract $submissionService) {}

    /**
     * Kotak masuk verifikator: hanya pengajuan berstatus pending_verifikator.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $pending = InternshipApplication::query()
            ->with(['opd', 'user', 'finalReport', 'survey', 'certificate'])
            ->where('status', ApplicationStatus::PendingVerifikator)
            ->latest()
            ->get()
            ->map(fn (InternshipApplication $application): array => $application->toMagangArray())
            ->all();

        return Inertia::render('verifikator/masuk', [
            'user' => $user->toMagangArray(),
            'applications' => $pending,
        ]);
    }

    /**
     * Teruskan pengajuan ke OPD (isi data penempatan).
     */
    public function teruskan(ForwardApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $actor = $request->user();

        if (! $actor instanceof User) {
            abort(401);
        }

        try {
            $this->submissionService->forwardToOpd($application, $request->payload(), $actor);
        } catch (DomainException $exception) {
            return back()->withErrors(['status' => $exception->getMessage()]);
        }

        return back()->with('success', 'Pengajuan diteruskan ke OPD.');
    }

    /**
     * Tolak pengajuan pada tahap verifikator.
     */
    public function tolak(RejectApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $actor = $request->user();

        if (! $actor instanceof User) {
            abort(401);
        }

        try {
            $this->submissionService->reject($application, $actor, $request->string('rejection_reason')->toString());
        } catch (DomainException $exception) {
            return back()->withErrors(['status' => $exception->getMessage()]);
        }

        return back()->with('success', 'Pengajuan ditolak.');
    }
}
