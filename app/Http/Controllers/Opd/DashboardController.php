<?php

namespace App\Http\Controllers\Opd;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\InternshipApplicationResource;
use App\Http\Resources\MagangUserResource;
use App\Http\Resources\OpdResource;
use App\Models\InternshipApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman-halaman (view) Admin OPD, di-scope ke OPD milik user login
 * ($user->opd_id). Aksi transisi status ada di SubmissionController.
 */
class DashboardController extends Controller
{
    /**
     * Dasbor OPD: seluruh pengajuan OPD ini + info kuota untuk editor kuota.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $applications = InternshipApplication::query()
            ->with(['user', 'opd', 'forwardedBy'])
            ->where('opd_id', $user->opd_id)
            ->latest()
            ->get();

        return Inertia::render('opd/dashboard', [
            'user' => new MagangUserResource($user),
            'opd' => new OpdResource($user->opd),
            'applications' => InternshipApplicationResource::collection($applications),
        ]);
    }

    /**
     * Perlu Keputusan: pengajuan yang diteruskan verifikator (forwarded_opd).
     */
    public function keputusan(Request $request): Response
    {
        $user = $request->user();

        $applications = InternshipApplication::query()
            ->with(['user', 'opd', 'forwardedBy'])
            ->where('opd_id', $user->opd_id)
            ->where('status', ApplicationStatus::ForwardedOpd)
            ->latest()
            ->get();

        return Inertia::render('opd/keputusan', [
            'user' => new MagangUserResource($user),
            'opd' => new OpdResource($user->opd),
            'applications' => InternshipApplicationResource::collection($applications),
        ]);
    }

    /**
     * Peserta Aktif: peserta yang sudah disetujui (approved) hingga selesai
     * magang di OPD ini. Dimulai dari status Approved — begitu Admin OPD ACC,
     * peserta langsung tampil (belum menunggu cron memindahkannya ke Ongoing).
     * Dibungkus bentuk Participant { student_name, application }.
     */
    public function peserta(Request $request): Response
    {
        $user = $request->user();

        $applications = InternshipApplication::query()
            ->with([
                'user', 'opd', 'finalReport', 'survey', 'certificate',
                // R6: rekam jejak progres tiket, urut kronologis + pelakunya.
                'statusLogs' => fn ($q) => $q->oldest('created_at'),
                'statusLogs.changedBy',
            ])
            ->where('opd_id', $user->opd_id)
            ->whereIn('status', [
                ApplicationStatus::Approved,
                ApplicationStatus::Ongoing,
                ApplicationStatus::CompletionSubmitted,
                ApplicationStatus::Completed,
            ])
            ->latest()
            ->get();

        $participants = $applications->map(fn (InternshipApplication $app): array => [
            'student_name' => $app->user->name,
            'application' => (new InternshipApplicationResource($app))->resolve($request),
        ])->all();

        return Inertia::render('opd/peserta', [
            'user' => new MagangUserResource($user),
            'opd' => new OpdResource($user->opd),
            'participants' => $participants,
        ]);
    }
}
