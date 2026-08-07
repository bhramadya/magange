<?php

namespace App\Console\Commands;

use App\Enums\ApplicationStatus;
use App\Enums\UserRole;
use App\Models\InternshipApplication;
use App\Models\User;
use App\Services\DemoStatusService;
use Illuminate\Console\Command;
use InvalidArgumentException;

/**
 * Pindahkan satu tiket ke status demo (Menunggu TTE, Perlu Sertifikat, atau
 * Perlu Keputusan) lewat SubmissionService — bukan update status mentah.
 *
 * Gunakan setelah DemoSpectrumSeeder: pilih tiket yang ada lalu minta status
 * demo yang diinginkan.
 *
 *   php artisan magang:demo-status MGG-2026-900101 waiting_tte
 *
 * Diblokir di produksi (guard): jangan pernah menjalankan di environment
 * production.
 */
class DemoTransitionCommand extends Command
{
    protected $signature = 'magang:demo-status {tiket} {status}';

    protected $description = 'Pindahkan satu tiket ke status demo (waiting_tte | needs_certificate | forwarded_opd)';

    public function handle(DemoStatusService $service): int
    {
        if (app()->isProduction()) {
            $this->error('Perintah ini tidak boleh dijalankan di lingkungan produksi.');

            return self::FAILURE;
        }

        $status = ApplicationStatus::tryFrom($this->argument('status'));

        if ($status === null) {
            $this->error("Status '{$this->argument('status')}' tidak dikenal.");

            return self::FAILURE;
        }

        $app = InternshipApplication::where('ticket_number', $this->argument('tiket'))->first();

        if ($app === null) {
            $this->error("Tiket '{$this->argument('tiket')}' tidak ditemukan.");

            return self::FAILURE;
        }

        if ($app->opd_id === null) {
            $this->error("Tiket '{$app->ticket_number}' belum ditempatkan ke OPD.");

            return self::FAILURE;
        }

        $verifikator = User::query()
            ->where('role', UserRole::AdminVerifikator)
            ->where('is_active', true)
            ->first();

        $opdAdmin = User::query()
            ->where('role', UserRole::AdminOpd)
            ->where('opd_id', $app->opd_id)
            ->where('is_active', true)
            ->first();

        $signer = $app->opd?->signers()
            ->where('is_primary', true)
            ->first() ?? $app->opd?->signers()->first();

        if ($verifikator === null || $opdAdmin === null || $signer === null) {
            $this->error('Aktor demo tidak lengkap. Jalankan DemoSpectrumSeeder terlebih dahulu: '
                .'php artisan db:seed --class=DemoSpectrumSeeder');

            return self::FAILURE;
        }

        try {
            $service->moveTo($app, $status, $verifikator, $opdAdmin, $signer);
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Tiket {$app->ticket_number} sekarang berstatus {$app->fresh()->status->label()}.");

        return self::SUCCESS;
    }
}
