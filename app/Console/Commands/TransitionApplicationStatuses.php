<?php

namespace App\Console\Commands;

use App\Contracts\PengajuanServiceContract;
use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Date;
use Throwable;

/**
 * Transisi status pengajuan berbasis tanggal, dijalankan harian via scheduler:
 *   - approved → ongoing   bila tanggal mulai (start_date) sudah tiba.
 *   - ongoing  → completed bila batas akhir (end_date) sudah lewat/tiba.
 *
 * Dipakai <= (bukan ==) agar tetap mengejar bila scheduler sempat absen sehari.
 */
class TransitionApplicationStatuses extends Command
{
    protected $signature = 'magang:transition-statuses';

    protected $description = 'Ubah status magang otomatis berdasarkan tanggal mulai & selesai';

    public function handle(PengajuanServiceContract $service): int
    {
        $today = Date::now()->startOfDay();

        $startedCount = 0;
        $completedCount = 0;

        // approved → ongoing (tanggal mulai sudah tiba)
        InternshipApplication::query()
            ->where('status', ApplicationStatus::Approved)
            ->whereDate('start_date', '<=', $today)
            ->each(function (InternshipApplication $app) use ($service, &$startedCount): void {
                try {
                    $service->startOngoing($app);
                    $startedCount++;
                } catch (Throwable $e) {
                    $this->error("Gagal memulai magang #{$app->id}: {$e->getMessage()}");
                }
            });

        // ongoing → completed (batas akhir sudah tiba/lewat)
        InternshipApplication::query()
            ->where('status', ApplicationStatus::Ongoing)
            ->whereDate('end_date', '<=', $today)
            ->each(function (InternshipApplication $app) use ($service, &$completedCount): void {
                try {
                    $service->complete($app);
                    $completedCount++;
                } catch (Throwable $e) {
                    $this->error("Gagal menyelesaikan magang #{$app->id}: {$e->getMessage()}");
                }
            });

        $this->info("Selesai: {$startedCount} mulai magang, {$completedCount} selesai magang.");

        return self::SUCCESS;
    }
}
