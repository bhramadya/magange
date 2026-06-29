<?php

namespace App\Http\Controllers\Opd;

use App\Contracts\PengajuanServiceContract;
use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\RejectApplicationRequest;
use App\Models\InternshipApplication;
use App\Models\User;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class KeputusanController extends Controller
{
    public function __construct(private PengajuanServiceContract $submissionService) {}

    /**
     * Pengajuan yang perlu keputusan OPD: status forwarded_opd, scoped ke OPD ini.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $forwarded = InternshipApplication::query()
            ->with(['opd', 'user', 'finalReport', 'survey', 'certificate'])
            ->where('opd_id', $user->opd_id)
            ->where('status', ApplicationStatus::ForwardedOpd)
            ->latest()
            ->get()
            ->map(fn (InternshipApplication $application): array => $application->toMagangArray())
            ->all();

        $opd = $user->opd;

        return Inertia::render('opd/keputusan', [
            'user' => $user->toMagangArray(),
            'opd' => $opd !== null ? [
                'id' => $opd->id,
                'name' => $opd->name,
                'code' => $opd->code,
            ] : null,
            'applications' => $forwarded,
        ]);
    }

    /**
     * Setujui pengajuan (scoped: hanya milik OPD admin ini).
     */
    public function setujui(Request $request, InternshipApplication $application): RedirectResponse
    {
        $actor = $request->user();

        if (! $actor instanceof User) {
            abort(401);
        }

        Gate::authorize('update', $application);

        try {
            $this->submissionService->approve($application, $actor);
        } catch (DomainException $exception) {
            return back()->withErrors(['status' => $exception->getMessage()]);
        }

        return back()->with('success', 'Pengajuan disetujui.');
    }

    /**
     * Tolak pengajuan (scoped: hanya milik OPD admin ini).
     */
    public function tolak(RejectApplicationRequest $request, InternshipApplication $application): RedirectResponse
    {
        $actor = $request->user();

        if (! $actor instanceof User) {
            abort(401);
        }

        Gate::authorize('update', $application);

        try {
            $this->submissionService->reject($application, $actor, $request->string('rejection_reason')->toString());
        } catch (DomainException $exception) {
            return back()->withErrors(['status' => $exception->getMessage()]);
        }

        return back()->with('success', 'Pengajuan ditolak.');
    }
}
