<?php

use App\Models\FormRateLimit;
use App\Models\OtpToken;
use App\Models\User;
use App\Services\OtpService;
use App\Services\RateLimitService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
    $this->service = new OtpService(new RateLimitService);
});

test('generate creates an active token, updates the password, and logs the request', function () {
    $user = User::factory()->create(['password' => null]);

    $token = $this->service->generate($user, '127.0.0.1');

    expect($token->user_id)->toBe($user->id)
        ->and($token->token_hash)->not->toBeNull()
        ->and($token->used_at)->toBeNull()
        ->and($token->expires_at->isFuture())->toBeTrue()
        ->and($token->expires_at->lte(now()->addMinutes(5)))->toBeTrue()
        ->and($user->refresh()->password)->not->toBeNull()
        ->and(FormRateLimit::where('identifier', $user->email)->count())->toBe(1);
});

test('generate invalidates previously active tokens', function () {
    $user = User::factory()->create();
    $old = $this->service->generate($user, '127.0.0.1');

    $this->service->generate($user, '127.0.0.1');

    expect($old->refresh()->used_at)->not->toBeNull()
        ->and(OtpToken::where('user_id', $user->id)->whereNull('used_at')->count())->toBe(1);
});

test('verify returns true for a matching otp and marks it used', function () {
    $user = User::factory()->create();
    $token = OtpToken::create([
        'user_id' => $user->id,
        'token_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(5),
    ]);

    expect($this->service->verify($user, '123456'))->toBeTrue()
        ->and($token->refresh()->used_at)->not->toBeNull();
});

test('verify returns false for a wrong otp', function () {
    $user = User::factory()->create();
    OtpToken::create([
        'user_id' => $user->id,
        'token_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(5),
    ]);

    expect($this->service->verify($user, '000000'))->toBeFalse();
});

test('verify returns false for an expired token', function () {
    $user = User::factory()->create();
    OtpToken::create([
        'user_id' => $user->id,
        'token_hash' => Hash::make('123456'),
        'expires_at' => now()->subMinute(),
    ]);

    expect($this->service->verify($user, '123456'))->toBeFalse();
});

test('canRequest becomes false after three requests in the window', function () {
    $user = User::factory()->create();

    foreach (range(1, 3) as $ignored) {
        $this->service->generate($user, '127.0.0.1');
    }

    expect($this->service->canRequest($user->email, '127.0.0.1'))->toBeFalse();
});
