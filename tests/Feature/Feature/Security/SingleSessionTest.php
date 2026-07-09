<?php

use App\Models\OtpToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('login OTP menghapus sesi user di perangkat lain', function () {
    $user = User::factory()->create(['email' => 'mhs@example.com']);

    // Sesi "perangkat lama" milik user pada tabel sessions.
    DB::table('sessions')->insert([
        'id' => 'old-device-session',
        'user_id' => $user->id,
        'ip_address' => '10.0.0.1',
        'user_agent' => 'OldBrowser',
        'payload' => base64_encode(serialize([])),
        'last_activity' => now()->getTimestamp(),
    ]);

    // Siapkan OTP aktif via service (hash tersimpan di token + User::password).
    $plainOtp = '123456';
    $user->forceFill(['password' => $plainOtp])->save();
    OtpToken::create([
        'user_id' => $user->id,
        'token_hash' => Hash::make($plainOtp),
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->post('/otp/verify', [
        'email' => 'mhs@example.com',
        'otp' => $plainOtp,
    ])->assertRedirect();

    // Sesi perangkat lama harus sudah dihapus.
    expect(DB::table('sessions')->where('id', 'old-device-session')->exists())->toBeFalse();
    $this->assertAuthenticatedAs($user);
});

test('guard 403 tetap: browser sudah login akun lain menolak verify OTP akun berbeda', function () {
    $accountA = User::factory()->create(['email' => 'a@example.com']);
    $accountB = User::factory()->create(['email' => 'b@example.com']);

    $plainOtp = '654321';
    $accountB->forceFill(['password' => $plainOtp])->save();
    OtpToken::create([
        'user_id' => $accountB->id,
        'token_hash' => Hash::make($plainOtp),
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->actingAs($accountA)
        ->post('/otp/verify', [
            'email' => 'b@example.com',
            'otp' => $plainOtp,
        ])
        ->assertForbidden();
});
