<?php

use App\Contracts\OtpServiceContract;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('login form is displayed', function () {
    $response = $this->get('/login-otp');

    $response->assertOk();
});

test('otp can be requested for existing user', function () {
    $user = User::factory()->create(['email' => 'test@example.com']);

    Queue::fake();

    $response = $this->post('/otp/send', [
        'email' => 'test@example.com',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('status');
});

test('otp request fails for non-existent email', function () {
    $response = $this->post('/otp/send', [
        'email' => 'nonexistent@example.com',
    ]);

    $response->assertSessionHasErrors('email');
});

test('otp verification logs in user and redirects by role', function () {
    $mahasiswa = User::factory()->create([
        'email' => 'mahasiswa@example.com',
        'role' => UserRole::Mahasiswa,
    ]);

    $otpService = app(OtpServiceContract::class);
    $otpService->generate($mahasiswa, '127.0.0.1');

    // Get the plaintext OTP from the user's password (it's set during generate)
    $mahasiswa->refresh();

    $response = $this->post('/otp/verify', [
        'email' => 'mahasiswa@example.com',
        'otp' => '123456', // UserFactory default OTP
    ]);

    $response->assertRedirect('/dashboard');
    $this->assertAuthenticatedAs($mahasiswa);
});

test('otp verification fails with invalid code', function () {
    $user = User::factory()->create(['email' => 'test@example.com']);

    $response = $this->post('/otp/verify', [
        'email' => 'test@example.com',
        'otp' => '000000',
    ]);

    $response->assertSessionHasErrors('otp');
    $this->assertGuest();
});

test('admin verifikator redirects to verifikator dashboard', function () {
    $admin = User::factory()->verifikator()->create(['email' => 'admin@example.com']);

    $otpService = app(OtpServiceContract::class);
    $otpService->generate($admin, '127.0.0.1');

    $response = $this->post('/otp/verify', [
        'email' => 'admin@example.com',
        'otp' => '123456',
    ]);

    $response->assertRedirect('/verifikator');
});

test('admin opd redirects to opd dashboard', function () {
    $opd = \App\Models\Opd::create(['name' => 'Test OPD', 'code' => 'TEST']);
    $admin = User::factory()->opdAdmin($opd->id)->create(['email' => 'opd@example.com']);

    $otpService = app(OtpServiceContract::class);
    $otpService->generate($admin, '127.0.0.1');

    $response = $this->post('/otp/verify', [
        'email' => 'opd@example.com',
        'otp' => '123456',
    ]);

    $response->assertRedirect('/opd');
});
