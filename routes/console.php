<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Transisi status magang otomatis setiap hari pukul 01:00.
//   approved → ongoing (tgl mulai tiba) | ongoing → completed (tgl selesai tiba)
Schedule::command('magang:transition-statuses')->dailyAt('01:00');
