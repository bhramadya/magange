<?php

use App\Enums\RateLimitIdentifierType;
use App\Enums\UserRole;
use App\Jobs\SendOtpEmailJob;
use App\Models\FormRateLimit;
use App\Models\Opd;
use App\Models\OtpToken;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;

/**
 * Siapkan token OTP dengan kode plaintext yang diketahui (generate() memakai
 * kode acak yang tidak bisa dibaca, jadi untuk uji verifikasi kita seed manual).
 */
function seedOtpToken(User $user, string $otp = '123456'): void
{
    $user->forceFill(['password' => $otp])->save();

    OtpToken::create([
        'user_id' => $user->id,
        'token_hash' => Hash::make($otp),
        'expires_at' => now()->addMinutes(10),
    ]);
}

test('halaman login OTP tampil', function () {
    $this->get('/login-otp')->assertOk();
});

test('GET /login (tamu) dialihkan ke /login-otp', function () {
    $this->get('/login')->assertRedirect(route('login.otp'));
});

test('GET /login (sudah login) dialihkan menjauh oleh middleware guest', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/login');

    $response->assertRedirect();
    expect($response->headers->get('Location'))->not->toContain('/login-otp');
});

test('OTP dapat diminta untuk email terdaftar', function () {
    Queue::fake();

    $user = User::factory()->create(['email' => 'mahasiswa@example.com']);

    $response = $this->post('/login/otp/request', ['email' => 'mahasiswa@example.com']);

    $response->assertRedirect();
    $response->assertSessionHas('status');
    Queue::assertPushed(SendOtpEmailJob::class);

    expect(OtpToken::where('user_id', $user->id)->whereNull('used_at')->exists())->toBeTrue();
});

test('permintaan OTP gagal untuk email tidak terdaftar', function () {
    $this->post('/login/otp/request', ['email' => 'nobody@example.com'])
        ->assertSessionHasErrors('email');
});

test('permintaan OTP diblokir saat melewati batas rate limit', function () {
    Queue::fake();

    User::factory()->create(['email' => 'spam@example.com']);

    // Tiga percobaan dalam jendela 15 menit = batas maksimum tercapai.
    foreach (range(1, 3) as $ignored) {
        FormRateLimit::create([
            'ip_address' => '127.0.0.1',
            'identifier' => 'spam@example.com',
            'identifier_type' => RateLimitIdentifierType::Email,
            'action_type' => 'otp_request',
            'submitted_at' => now(),
        ]);
    }

    $response = $this->post('/login/otp/request', ['email' => 'spam@example.com']);

    $response->assertSessionHasErrors('email');
    Queue::assertNotPushed(SendOtpEmailJob::class);
});

test('verifikasi OTP gagal dengan kode salah', function () {
    User::factory()->create(['email' => 'user@example.com']);

    $this->post('/login/otp/verify', ['email' => 'user@example.com', 'otp' => '000000'])
        ->assertSessionHasErrors('otp');

    $this->assertGuest();
});

test('verifikasi OTP valid mengarahkan mahasiswa ke /dashboard', function () {
    $user = User::factory()->create([
        'email' => 'mhs@example.com',
        'role' => UserRole::Mahasiswa,
    ]);
    seedOtpToken($user);

    $response = $this->post('/login/otp/verify', ['email' => 'mhs@example.com', 'otp' => '123456']);

    $response->assertRedirect('/dashboard');
    $this->assertAuthenticatedAs($user);
});

test('verifikasi OTP valid mengarahkan verifikator ke /verifikator', function () {
    $user = User::factory()->verifikator()->create(['email' => 'verif@example.com']);
    seedOtpToken($user);

    $this->post('/login/otp/verify', ['email' => 'verif@example.com', 'otp' => '123456'])
        ->assertRedirect('/verifikator');
});

test('verifikasi OTP valid mengarahkan admin OPD ke /opd', function () {
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);
    $user = User::factory()->opdAdmin($opd->id)->create(['email' => 'opd@example.com']);
    seedOtpToken($user);

    $this->post('/login/otp/verify', ['email' => 'opd@example.com', 'otp' => '123456'])
        ->assertRedirect('/opd');
});
