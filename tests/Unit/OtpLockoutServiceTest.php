<?php

use App\Models\OtpLockout;
use App\Models\User;
use App\Services\OtpLockoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Date;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->service = new OtpLockoutService;
});

test('cooldown mengikuti deret Fibonacci per tingkat', function () {
    expect($this->service->cooldownMinutesForLevel(0))->toBe(0)
        ->and($this->service->cooldownMinutesForLevel(1))->toBe(1)
        ->and($this->service->cooldownMinutesForLevel(2))->toBe(1)
        ->and($this->service->cooldownMinutesForLevel(3))->toBe(2)
        ->and($this->service->cooldownMinutesForLevel(4))->toBe(3)
        ->and($this->service->cooldownMinutesForLevel(5))->toBe(5)
        ->and($this->service->cooldownMinutesForLevel(6))->toBe(8);
});

test('dua kegagalan pertama belum memicu lockout', function () {
    $user = User::factory()->create();

    expect($this->service->registerFailure($user))->toBeFalse()
        ->and($this->service->registerFailure($user))->toBeFalse()
        ->and($this->service->isLocked($user))->toBeFalse();
});

test('kegagalan ketiga memicu lockout dengan jeda 1 menit', function () {
    $user = User::factory()->create();

    $this->service->registerFailure($user);
    $this->service->registerFailure($user);

    expect($this->service->registerFailure($user))->toBeTrue()
        ->and($this->service->isLocked($user))->toBeTrue()
        ->and($this->service->secondsUntilUnlock($user))->toBeGreaterThan(0)
        ->and($this->service->secondsUntilUnlock($user))->toBeLessThanOrEqual(60);

    $lockout = OtpLockout::where('user_id', $user->id)->first();
    expect($lockout->lockout_level)->toBe(1)
        ->and($lockout->failed_attempts)->toBe(0); // direset setelah lockout
});

test('lockout kedua memakai jeda Fibonacci lebih lama', function () {
    $user = User::factory()->create();

    // Lockout tingkat 1 (jeda 1 menit).
    foreach (range(1, 3) as $ignored) {
        $this->service->registerFailure($user);
    }

    // Lewati masa lockout pertama.
    Date::setTestNow(now()->addMinutes(2));

    // Lockout tingkat 2 (jeda F(2) = 1 menit).
    foreach (range(1, 3) as $ignored) {
        $this->service->registerFailure($user);
    }

    $lockout = OtpLockout::where('user_id', $user->id)->first();
    expect($lockout->lockout_level)->toBe(2);

    Date::setTestNow();
});

test('reset menghapus lockout', function () {
    $user = User::factory()->create();

    foreach (range(1, 3) as $ignored) {
        $this->service->registerFailure($user);
    }

    $this->service->reset($user);

    expect($this->service->isLocked($user))->toBeFalse()
        ->and(OtpLockout::where('user_id', $user->id)->exists())->toBeFalse();
});

test('reset otomatis setelah 24 jam tanpa percobaan', function () {
    $user = User::factory()->create();

    foreach (range(1, 3) as $ignored) {
        $this->service->registerFailure($user);
    }

    expect($this->service->isLocked($user))->toBeTrue();

    // Lewati 25 jam tanpa percobaan → counter & lockout tereset otomatis.
    Date::setTestNow(now()->addHours(25));

    expect($this->service->isLocked($user))->toBeFalse()
        ->and($this->service->registerFailure($user))->toBeFalse(); // mulai dari nol lagi

    $lockout = OtpLockout::where('user_id', $user->id)->first();
    expect($lockout->failed_attempts)->toBe(1)
        ->and($lockout->lockout_level)->toBe(0);

    Date::setTestNow();
});
