<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

/**
 * Scheduler dipatok 01:00 Asia/Jakarta, sementara app.timezone tetap UTC —
 * artinya command jalan pada 18:00 UTC HARI SEBELUMNYA. "Hari ini" di dalam
 * command karena itu harus dibaca dalam waktu setempat; kalau memakai
 * Date::now() polos, seluruh transisi tertunda satu hari penuh.
 */
test('transisi memakai tanggal WIB, bukan UTC, saat cron jalan 01:00 WIB', function () {
    Queue::fake();

    // 15 Juli 2026 18:30 UTC = 16 Juli 2026 01:30 WIB.
    $this->travelTo('2026-07-15 18:30:00');

    $mulaiHariIniWib = InternshipApplication::factory()->create([
        'status' => ApplicationStatus::Approved,
        'start_date' => '2026-07-16',
        'end_date' => '2026-10-16',
    ]);

    $selesaiHariIniWib = InternshipApplication::factory()->create([
        'status' => ApplicationStatus::Ongoing,
        'start_date' => '2026-04-16',
        'end_date' => '2026-07-16',
    ]);

    $this->artisan('magang:transition-statuses')->assertSuccessful();

    expect($mulaiHariIniWib->fresh()->status)->toBe(ApplicationStatus::Ongoing)
        ->and($selesaiHariIniWib->fresh()->status)->toBe(ApplicationStatus::Completed);
});

test('pengajuan yang belum mulai tidak ikut tersapu', function () {
    Queue::fake();

    $this->travelTo('2026-07-15 18:30:00');

    $besok = InternshipApplication::factory()->create([
        'status' => ApplicationStatus::Approved,
        'start_date' => '2026-07-17',
        'end_date' => '2026-10-17',
    ]);

    $this->artisan('magang:transition-statuses')->assertSuccessful();

    expect($besok->fresh()->status)->toBe(ApplicationStatus::Approved);
});
