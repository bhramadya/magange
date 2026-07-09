<?php

use App\Enums\UserRole;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

/*
 * Login admin (Username + Password) dilayani Fortify di /admin/login.
 * Hanya role admin_verifikator & admin_opd yang aktif yang boleh masuk;
 * mahasiswa memakai alur OTP terpisah.
 */

test('admin login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('verifikator can authenticate and is redirected to its dashboard', function () {
    $user = User::factory()->verifikator()->create([
        'username' => 'verifikator',
        'password' => Hash::make('rahasia123'),
    ]);

    $response = $this->post(route('login.store'), [
        'username' => 'verifikator',
        'password' => 'rahasia123',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect('/verifikator');
});

test('opd admin can authenticate and is redirected to its dashboard', function () {
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);
    $user = User::factory()->opdAdmin($opd->id)->create([
        'username' => 'opd-diskominfo',
        'password' => Hash::make('rahasia123'),
    ]);

    $response = $this->post(route('login.store'), [
        'username' => 'opd-diskominfo',
        'password' => 'rahasia123',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect('/opd');
});

test('mahasiswa can not authenticate through the admin login', function () {
    $user = User::factory()->create([
        'username' => null,
        'role' => UserRole::Mahasiswa,
    ]);

    $this->post(route('login.store'), [
        'username' => (string) $user->email,
        'password' => '123456',
    ]);

    $this->assertGuest();
});

test('inactive admin can not authenticate', function () {
    User::factory()->verifikator()->create([
        'username' => 'nonaktif',
        'password' => Hash::make('rahasia123'),
        'is_active' => false,
    ]);

    $this->post(route('login.store'), [
        'username' => 'nonaktif',
        'password' => 'rahasia123',
    ]);

    $this->assertGuest();
});

test('admin can not authenticate with invalid password', function () {
    User::factory()->verifikator()->create([
        'username' => 'verifikator',
        'password' => Hash::make('rahasia123'),
    ]);

    $this->post(route('login.store'), [
        'username' => 'verifikator',
        'password' => 'password-salah',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->verifikator()->create(['username' => 'verifikator']);

    $response = $this->actingAs($user)->post(route('logout'));

    $response->assertRedirect(route('home'));

    $this->assertGuest();
});

test('admin logins are rate limited', function () {
    User::factory()->verifikator()->create([
        'username' => 'verifikator',
        'password' => Hash::make('rahasia123'),
    ]);

    RateLimiter::increment(md5('login'.implode('|', ['verifikator', '127.0.0.1'])), amount: 5);

    $response = $this->post(route('login.store'), [
        'username' => 'verifikator',
        'password' => 'password-salah',
    ]);

    $response->assertTooManyRequests();
});
