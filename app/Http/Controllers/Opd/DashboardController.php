<?php

namespace App\Http\Controllers\Opd;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Mahasiswa\PresensiController;
use App\Http\Resources\InternshipApplicationResource;
use App\Http\Resources\MagangUserResource;
use App\Http\Resources\OpdResource;
use App\Models\InternshipApplication;
use App\Models\OpdPlacementOption;
use App\Models\OpdSigner;
use App\Models\PresensiLog;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Date;
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
            ->with(['user', 'opd', 'forwardedBy', 'certificate'])
            ->where('opd_id', $user->opd_id)
            ->latest()
            ->get();

        return Inertia::render('opd/dashboard', [
            'user' => new MagangUserResource($user),
            'opd' => new OpdResource($user->opd),
            'applications' => InternshipApplicationResource::collection($applications),
            'signers' => $this->signers($request),
            'placementOptions' => $this->placementOptions($request),
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
            'signers' => $this->signers($request),
            'placementOptions' => $this->placementOptions($request),
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
                ApplicationStatus::WaitingTte,
                ApplicationStatus::Approved,
                ApplicationStatus::Ongoing,
                ApplicationStatus::CompletionSubmitted,
                ApplicationStatus::NeedsCertificate,
                ApplicationStatus::Completed,
            ])
            ->latest()
            ->get();

        $participants = $applications->map(fn (InternshipApplication $app): array => [
            'student_name' => $app->user->name,
            'application' => (new InternshipApplicationResource($app))->resolve($request),
            // Batch 5 (#5): admin OPD melihat riwayat presensi peserta —
            // ringkasan 31 hari terakhir milik user pemilik pengajuan.
            'presensi' => PresensiLog::query()
                ->where('user_id', $app->user_id)
                ->where('activity_date', '>=', Date::today()->subDays(31))
                ->with('attachments')
                ->orderByDesc('activity_date')
                ->get()
                ->map(fn (PresensiLog $log): array => PresensiController::entryPayload($log))
                ->values()
                ->all(),
        ])->all();

        return Inertia::render('opd/peserta', [
            'user' => new MagangUserResource($user),
            'opd' => new OpdResource($user->opd),
            'participants' => $participants,
            // Dipakai tombol "Buat Surat Ber-TTE" untuk pengajuan lama yang
            // disetujui tanpa snapshot penandatangan.
            'signers' => $this->signers($request),
        ]);
    }

    /**
     * Daftar penandatangan OPD ini, utama lebih dulu.
     *
     * @return Collection<int, OpdSigner>
     */
    private function signers(Request $request): Collection
    {
        return $request->user()->opd->signers()
            ->orderByDesc('is_primary')
            ->orderBy('name')
            ->get(['id', 'name', 'title', 'nip', 'is_primary']);
    }

    /**
     * Master penempatan dikelompokkan per jenis; kunci array sama dengan nama
     * kolom pengajuan (division / field_supervisor / person_in_charge) supaya
     * form keputusan tinggal memetakan langsung.
     *
     * @return array<string, list<array{id: int, name: string}>>
     */
    private function placementOptions(Request $request): array
    {
        $grouped = OpdPlacementOption::query()
            ->where('opd_id', $request->user()->opd_id)
            ->orderBy('name')
            ->get(['id', 'type', 'name'])
            ->groupBy('type');

        $payload = [];

        foreach (OpdPlacementOption::types() as $type) {
            $payload[$type] = array_values(
                $grouped->get($type, collect())
                    ->map(fn (OpdPlacementOption $option): array => [
                        'id' => $option->id,
                        'name' => $option->name,
                    ])
                    ->all(),
            );
        }

        return $payload;
    }
}
