<?php

namespace App\Services;

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

    public function __construct(private RateLimitService $rateLimit) {}

    /**
     * Terima pengajuan publik, buat user pemohon bila belum ada, lalu
     * buat tiket pengajuan berstatus pending_verifikator.
     *
     * @param  array{
     *     name: string,
     *     email: string,
     *     whatsapp_number?: string|null,
     *     tujuan_magang: string,
     *     duration_months: int,
     *     start_date: string,
     *     end_date: string,
     *     institution_name: string,
     *     campus_supervisor: string,
     * }  $validatedData
     */
    public function submit(array $validatedData, string $ipAddress): InternshipApplication
    {
        $application = DB::transaction(function () use ($validatedData): InternshipApplication {
            $user = User::firstOrCreate(
                ['email' => $validatedData['email']],
                [
                    'name' => $validatedData['name'],
                    'whatsapp_number' => $validatedData['whatsapp_number'] ?? null,
                    'role' => UserRole::Mahasiswa,
                    'is_active' => true,
                ],
            );

            $application = InternshipApplication::create([
                'ticket_number' => $this->generateTicketNumber(),
                'user_id' => $user->id,
                'tujuan_magang' => $validatedData['tujuan_magang'],
                'duration_months' => $validatedData['duration_months'],
                'start_date' => $validatedData['start_date'],
                'end_date' => $validatedData['end_date'],
                'institution_name' => $validatedData['institution_name'],
                'campus_supervisor' => $validatedData['campus_supervisor'],
                'status' => ApplicationStatus::PendingVerifikator,
            ]);

            $this->logStatus($application, null, ApplicationStatus::PendingVerifikator, $user, 'Pengajuan dibuat');

            return $application;
        });

        // Anti-spam: catat percobaan submit per email.
        $this->rateLimit->log($validatedData['email'], self::ACTION, $ipAddress);

        SendApplicationConfirmationJob::dispatch($application);

        return $application;
    }

    /**
     * Admin Verifikator meneruskan pengajuan ke OPD.
     *
     * @param  array{
     *     opd_id: int,
     *     division?: string|null,
     *     field_supervisor?: string|null,
     *     person_in_charge?: string|null,
     * }  $data
     */
    public function forwardToOpd(InternshipApplication $app, array $data, User $actor): void
    {
        $this->guardStatus($app, ApplicationStatus::PendingVerifikator);

        DB::transaction(function () use ($app, $data, $actor): void {
            $from = $app->status;

            $app->update([
                'opd_id' => $data['opd_id'],
                'division' => $data['division'] ?? null,
                'field_supervisor' => $data['field_supervisor'] ?? null,
                'person_in_charge' => $data['person_in_charge'] ?? null,
                'status' => ApplicationStatus::ForwardedOpd,
                'forwarded_by' => $actor->id,
                'forwarded_at' => Date::now(),
            ]);

            $this->logStatus($app, $from, ApplicationStatus::ForwardedOpd, $actor, 'Diteruskan ke OPD');
        });
    }

    /**
     * Admin OPD menyetujui pengajuan dan menambah kuota terpakai OPD.
     */
    public function approve(InternshipApplication $app, User $actor): void
    {
        $this->guardStatus($app, ApplicationStatus::ForwardedOpd);

        DB::transaction(function () use ($app, $actor): void {
            $from = $app->status;

            $app->update([
                'status' => ApplicationStatus::Approved,
                'opd_decision_by' => $actor->id,
                'opd_decision_at' => Date::now(),
            ]);

            if ($app->opd_id !== null) {
                Opd::whereKey($app->opd_id)->increment('quota_used');
            }

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
        User $actor,
        ?string $notes = null,
    ): void {
        ApplicationStatusLog::create([
            'application_id' => $app->id,
            'from_status' => $from?->value,
            'to_status' => $to->value,
            'changed_by' => $actor->id,
            'notes' => $notes,
        ]);
    }

    /**
     * Nomor tiket unik berformat MGG-{tahun}-{urut 4 digit}.
     */
    private function generateTicketNumber(): string
    {
        $year = Date::now()->year;

        $sequence = InternshipApplication::query()
            ->whereYear('created_at', $year)
            ->count() + 1;

        return sprintf('MGG-%d-%04d', $year, $sequence);
    }
}
