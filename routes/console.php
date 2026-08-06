<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Transisi status magang otomatis setiap hari pukul 01:00 WIB.
//   approved → ongoing (tgl mulai tiba) | ongoing → completed (tgl selesai tiba)
// Zona waktu dipatok eksplisit: config('app.timezone') = UTC, jadi tanpa ini
// jadwalnya jatuh 08:00 WIB — bukan 01:00 seperti aturan bisnis (CLAUDE.md).
Schedule::command('magang:transition-statuses')
    ->dailyAt('01:00')
    ->timezone((string) config('app.schedule_timezone', 'UTC'));
