<?php

namespace App\Services;

use App\Contracts\OtpServiceContract;
use App\Contracts\PengajuanServiceContract;
use App\Enums\ApplicationStatus;
use App\Enums\UserRole;
use App\Jobs\GenerateJobAcceptanceLetter;
use App\Jobs\SendApplicationConfirmationJob;
use App\Jobs\SendJobRejectionEmail;
use App\Models\ApplicationStatusLog;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;

class SubmissionService implements PengajuanServiceContract
{
    private const ACTION = 'submit_pengajuan';

    public function __construct(
        private RateLimitService $rateLimit,
        private OtpServiceContract $otpService,
    ) {}

    /**
     * Terima pengajuan publik, buat user pemohon bila belum ada, lalu
     * buat tiket pengajuan berstatus pending_verifikator.
     *
     * @param  array{
     *     name: string,
     *     nis?: string|null,
     *     email: string,
     *     whatsapp_number?: string|null,
     *     tujuan_magang: string,
     *     duration_months: int,
     *     start_date: string,
     *     end_date: string,
     *     institution_name: string,
     *     address?: string|null,
     *     campus_supervisor: string,
     *     guardian_name?: string|null,
     *     major?: string|null,
     *     skills?: string|null,
     *     photo_path?: string|null,
     *     surat_pengantar_path?: string|null,
     *     cv_path?: string|null,
     *     portfolio_path?: string|null,
     * }  $validatedData
     */
    public function submit(array $validatedData, string $ipAddress): InternshipApplication
    {
        $submitter = null;

        $application = DB::transaction(function () use ($validatedData, &$submitter): InternshipApplication {
            $user = User::firstOrCreate(
                ['email' => $validatedData['email']],
                [
                    'name' => $validatedData['name'],
                    'whatsapp_number' => $validatedData['whatsapp_number'] ?? null,
                    // Pas foto pendaftaran otomatis jadi foto profil (Task 4).
                    'avatar_path' => $validatedData['photo_path'] ?? null,
                    'role' => UserRole::Mahasiswa,
                    'is_active' => true,
                ],
            );

            // Peserta lama yang mendaftar ulang & mengunggah pas foto, tapi belum
            // punya foto profil: adopsi pas foto terbaru sebagai foto profil.
            if (($validatedData['photo_path'] ?? null) !== null && $user->avatar_path === null) {
                $user->update(['avatar_path' => $validatedData['photo_path']]);
            }

            $application = InternshipApplication::create([
                'ticket_number' => $this->generateTicketNumber(),
                'user_id' => $user->id,
                'nis' => $validatedData['nis'] ?? null,
                'tujuan_magang' => $validatedData['tujuan_magang'],
                'duration_months' => $validatedData['duration_months'],
                'start_date' => $validatedData['start_date'],
                'end_date' => $validatedData['end_date'],
                'institution_name' => $validatedData['institution_name'],
                'address' => $validatedData['address'] ?? null,
                'campus_supervisor' => $validatedData['campus_supervisor'],
                'guardian_name' => $validatedData['guardian_name'] ?? null,
                'major' => $validatedData['major'] ?? null,
                'skills' => $validatedData['skills'] ?? null,
                'photo_path' => $validatedData['photo_path'] ?? null,
                'surat_pengantar_path' => $validatedData['surat_pengantar_path'] ?? null,
                'cv_path' => $validatedData['cv_path'] ?? null,
                'portfolio_path' => $validatedData['portfolio_path'] ?? null,
                'status' => ApplicationStatus::PendingVerifikator,
            ]);

            $this->logStatus($application, null, ApplicationStatus::PendingVerifikator, $user, 'Pengajuan dibuat');

            $submitter = $user;

            return $application;
        });

        // Anti-spam: catat percobaan submit per email.
        $this->rateLimit->log($validatedData['email'], self::ACTION, $ipAddress);

        SendApplicationConfirmationJob::dispatch($application);

        // Alur Fase 1: langsung kirim OTP ke email pemohon supaya ia bisa masuk
        // ke dasbor tanpa memasukkan email lagi (halaman login-otp lompat ke
        // langkah kode). Hormati batas permintaan OTP; abaikan bila terlampaui.
        if ($submitter !== null && $this->otpService->canRequest($submitter->email, $ipAddress)) {
            $this->otpService->generate($submitter, $ipAddress);
        }

        return $application;
    }

    /**
     * Admin Verifikator meneruskan pengajuan ke OPD beserta catatan khusus.
     * Penempatan (divisi/pembimbing/penanggung jawab) TIDAK lagi diisi di sini —
     * itu menjadi tugas Admin OPD saat menyetujui (lihat approve()).
     *
     * @param  array{
     *     opd_id: int,
     *     verifikator_note?: string|null,
     * }  $data
     */
    public function forwardToOpd(InternshipApplication $app, array $data, User $actor): void
    {
        $this->guardStatus($app, ApplicationStatus::PendingVerifikator);

        DB::transaction(function () use ($app, $data, $actor): void {
            $from = $app->status;

            $app->update([
                'opd_id' => $data['opd_id'],
                'verifikator_note' => $data['verifikator_note'] ?? null,
                'status' => ApplicationStatus::ForwardedOpd,
                'forwarded_by' => $actor->id,
                'forwarded_at' => Date::now(),
            ]);

            $this->logStatus($app, $from, ApplicationStatus::ForwardedOpd, $actor, 'Diteruskan ke OPD');
        });
    }

    /**
     * Admin OPD menyetujui pengajuan, menetapkan penempatan, dan menambah
     * kuota terpakai OPD.
     *
     * @param  array{
     *     division: string,
     *     field_supervisor: string,
     *     person_in_charge: string,
     * }  $data
     */
    public function approve(InternshipApplication $app, array $data, User $actor): void
    {
        $this->guardStatus($app, ApplicationStatus::ForwardedOpd);

        DB::transaction(function () use ($app, $data, $actor): void {
            $from = $app->status;

            // Kunci baris OPD agar cek & increment kuota bebas race condition.
            // Menyetujui saat kuota penuh akan membuat quota_used > quota_total
            // (inkonsistensi yang tampil sebagai "sisa negatif" di landing page).
            if ($app->opd_id !== null) {
                $opd = Opd::whereKey($app->opd_id)->lockForUpdate()->firstOrFail();

                if ($opd->quota_used >= $opd->quota_total) {
                    throw new DomainException(
                        "Kuota OPD {$opd->name} sudah penuh ({$opd->quota_used}/{$opd->quota_total}).",
                    );
                }

                $opd->increment('quota_used');
            }

            $app->update([
                'division' => $data['division'],
                'field_supervisor' => $data['field_supervisor'],
                'person_in_charge' => $data['person_in_charge'],
                'status' => ApplicationStatus::Approved,
                'opd_decision_by' => $actor->id,
                'opd_decision_at' => Date::now(),
            ]);

            $this->logStatus($app, $from, ApplicationStatus::Approved, $actor, 'Disetujui OPD');
        });

        GenerateJobAcceptanceLetter::dispatch($app);
    }

    /**
     * Tolak pengajuan pada tahap verifikator maupun OPD.
     */
    public function reject(InternshipApplication $app, User $actor, string $reason): void
    {
        if (! in_array($app->status, [ApplicationStatus::PendingVerifikator, ApplicationStatus::ForwardedOpd], true)) {
            throw new DomainException(
                "Pengajuan berstatus {$app->status->value} tidak bisa ditolak.",
            );
        }

        DB::transaction(function () use ($app, $actor, $reason): void {
            $from = $app->status;

            $app->update([
                'status' => ApplicationStatus::Rejected,
                'opd_decision_by' => $actor->id,
                'opd_decision_at' => Date::now(),
                'rejection_reason' => $reason,
            ]);

            $this->logStatus($app, $from, ApplicationStatus::Rejected, $actor, $reason);
        });

        SendJobRejectionEmail::dispatch($app);
    }

    /**
     * Mulai magang: approved → ongoing. Dipicu Sistem (cron) saat tanggal mulai
     * tiba, atau manual oleh admin. actor null = perubahan otomatis sistem.
     */
    public function startOngoing(InternshipApplication $app, ?User $actor = null): void
    {
        $this->guardStatus($app, ApplicationStatus::Approved);

        DB::transaction(function () use ($app, $actor): void {
            $from = $app->status;

            $app->update(['status' => ApplicationStatus::Ongoing]);

            $this->logStatus(
                $app,
                $from,
                ApplicationStatus::Ongoing,
                $actor,
                $actor === null ? 'Mulai magang (otomatis oleh sistem)' : 'Mulai magang',
            );
        });
    }

    /**
     * Selesaikan magang → completed. Bisa dieksekusi 4 pihak: Sistem (cron,
     * actor null), Admin Verifikator, Admin OPD, atau peserta (saat unggah
     * laporan). Diizinkan dari status ongoing atau completion_submitted.
     */
    public function complete(InternshipApplication $app, ?User $actor = null, ?string $note = null): void
    {
        if (! in_array($app->status, [ApplicationStatus::Ongoing, ApplicationStatus::CompletionSubmitted], true)) {
            throw new DomainException(
                "Pengajuan berstatus {$app->status->value} tidak bisa diselesaikan.",
            );
        }

        DB::transaction(function () use ($app, $actor, $note): void {
            $from = $app->status;

            $app->update(['status' => ApplicationStatus::Completed]);

            $this->logStatus(
                $app,
                $from,
                ApplicationStatus::Completed,
                $actor,
                $note ?? ($actor === null ? 'Selesai magang (otomatis oleh sistem)' : 'Magang diselesaikan'),
            );
        });
    }

    /**
     * Pastikan status saat ini sesuai yang diharapkan, atau lempar exception.
     */
    private function guardStatus(InternshipApplication $app, ApplicationStatus $expected): void
    {
        if ($app->status !== $expected) {
            throw new DomainException(
                "Aksi membutuhkan status {$expected->value}, status saat ini {$app->status->value}.",
            );
        }
    }

    /**
     * Catat perubahan status ke audit trail.
     */
    private function logStatus(
        InternshipApplication $app,
        ?ApplicationStatus $from,
        ApplicationStatus $to,
        ?User $actor,
        ?string $notes = null,
    ): void {
        ApplicationStatusLog::create([
            'application_id' => $app->id,
            'from_status' => $from?->value,
            'to_status' => $to->value,
            'changed_by' => $actor?->id,
            'notes' => $notes,
        ]);
    }

    /**
     * Nomor tiket unik berformat MGG-{tahun}-{urut 6 digit}, mis. MGG-2026-000042.
     */
    private function generateTicketNumber(): string
    {
        $year = Date::now()->year;

        $sequence = InternshipApplication::query()
            ->whereYear('created_at', $year)
            ->count() + 1;

        return sprintf('MGG-%d-%06d', $year, $sequence);
    }
}
