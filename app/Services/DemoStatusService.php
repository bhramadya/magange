<?php

namespace App\Services;

use App\Enums\ApplicationStatus;
use App\Models\ApplicationStatusLog;
use App\Models\InternshipApplication;
use App\Models\OpdSigner;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

/**
 * Menggerakkan sebuah pengajuan menuju status demo lewat jalur yang sama
 * dengan data sungguhan: SubmissionService untuk transisi yang dimilikinya
 * (forward, approve dengan signer), dan langkah "unggah surat ber-TTE" yang
 * direplikasi dari TteController::uploadAcceptance untuk menjembatani
 * waiting_tte → ongoing.
 *
 * Dipakai oleh DemoSpectrumSeeder dan DemoTransitionCommand supaya data demo
 * punya status-log, snapshot penandatangan, dan draft PDF seperti aslinya —
 * bukan update(['status' => ...]) mentah.
 */
class DemoStatusService
{
    public function __construct(private readonly SubmissionService $submission) {}

    /**
     * Pindahkan pengajuan ke target status demo.
     *
     * Hanya mendukung pergerakan maju dalam alur: pending_verifikator →
     * forwarded_opd → waiting_tte → ongoing → needs_certificate. Status di
     * luar alur ini (rejected/completed) tidak dapat dicapai di sini.
     */
    public function moveTo(
        InternshipApplication $app,
        ApplicationStatus $target,
        User $verifikator,
        User $opdAdmin,
        OpdSigner $signer,
    ): void {
        $targets = [
            ApplicationStatus::ForwardedOpd,
            ApplicationStatus::WaitingTte,
            ApplicationStatus::NeedsCertificate,
        ];

        if (! in_array($target, $targets, true)) {
            throw new \InvalidArgumentException(
                "Status demo {$target->value} tidak didukung. Gunakan salah satu: "
                .implode(', ', array_map(fn (ApplicationStatus $s): string => $s->value, $targets)),
            );
        }

        $this->forwardIfNeeded($app, $verifikator);
        $this->approveIfNeeded($app, $opdAdmin, $signer, $target);
        $this->signIfNeeded($app, $opdAdmin, $target);

        if ($target === ApplicationStatus::NeedsCertificate && $app->status === ApplicationStatus::Ongoing) {
            $this->submission->needsCertificate($app, $opdAdmin);
        }
    }

    private function forwardIfNeeded(InternshipApplication $app, User $verifikator): void
    {
        if ($app->status !== ApplicationStatus::PendingVerifikator) {
            return;
        }

        if ($app->opd_id === null) {
            throw new \InvalidArgumentException(
                'Tiket belum ditempatkan ke OPD, tidak dapat diteruskan.',
            );
        }

        $this->submission->forwardToOpd($app, ['opd_id' => $app->opd_id], $verifikator);
    }

    private function approveIfNeeded(
        InternshipApplication $app,
        User $opdAdmin,
        OpdSigner $signer,
        ApplicationStatus $target,
    ): void {
        if ($target === ApplicationStatus::ForwardedOpd) {
            return;
        }

        if ($app->status !== ApplicationStatus::ForwardedOpd) {
            return;
        }

        $this->submission->approve($app, [
            'division' => 'Bidang Teknologi Informasi',
            'field_supervisor' => 'Pembimbing Lapangan Demo',
            'person_in_charge' => 'Koordinator Magang',
            'signer_id' => $signer->id,
        ], $opdAdmin);
    }

    /**
     * Replikasi TteController::uploadAcceptance: simpan surat ber-TTE dan
     * lanjutkan ke ongoing (atau approved bila belum mulai).
     */
    private function signIfNeeded(
        InternshipApplication $app,
        User $opdAdmin,
        ApplicationStatus $target,
    ): void {
        if ($target !== ApplicationStatus::NeedsCertificate) {
            return;
        }

        if ($app->status !== ApplicationStatus::WaitingTte) {
            return;
        }

        $path = "acceptance-signed/{$app->id}/demo-surat-ttd.pdf";
        Storage::disk('local')->put($path, 'Surat penerimaan bertanda tangan (demo).');

        $next = $app->start_date->isPast() || $app->start_date->isToday()
            ? ApplicationStatus::Ongoing
            : ApplicationStatus::Approved;

        $app->update(['acceptance_signed_path' => $path, 'status' => $next]);

        ApplicationStatusLog::create([
            'application_id' => $app->id,
            'from_status' => ApplicationStatus::WaitingTte->value,
            'to_status' => $next->value,
            'changed_by' => $opdAdmin->id,
            'notes' => 'Surat penerimaan bertanda tangan diunggah (demo).',
        ]);
    }
}
