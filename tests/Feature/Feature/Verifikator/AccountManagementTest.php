<?php

use App\Models\Opd;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// R10 — Auto-generate akun OPD + reset password + force change password
// ---------------------------------------------------------------------------

test('menambah OPD ikut membuat akun admin OPD + flash kredensial', function () {
    $verifikator = User::factory()->verifikator()->create();

    $response = $this->actingAs($verifikator)->post('/verifikator/opd', [
        'name' => 'Dinas Pendidikan',
        'code' => 'DISDIK',
        'inisial_opd' => 'DISDIK',
        'quota_total' => 10,
        'is_active' => true,
    ]);

    $response->assertRedirect(route('verifikator.opd.index'));
    $response->assertSessionHas('generatedCredentials', fn ($credentials) => is_array($credentials)
        && $credentials['username'] === 'disdik'
        && is_string($credentials['password'])
        && strlen($credentials['password']) === 12);

    $opd = Opd::where('code', 'DISDIK')->firstOrFail();
    $account = User::where('username', 'disdik')->firstOrFail();

    expect($account->role->value)->toBe('admin_opd')
        ->and($account->opd_id)->toBe($opd->id)
        ->and($account->must_change_password)->toBeTrue();
});

test('reset password akun OPD me-regenerate password + wajib ganti', function () {
    $verifikator = User::factory()->verifikator()->create();
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);
    $account = User::factory()->opdAdmin($opd->id)->create(['must_change_password' => false]);
    $oldPassword = $account->password;

    $response = $this->actingAs($verifikator)->post("/verifikator/opd/{$opd->id}/reset-password");

    $response->assertSessionHas('generatedCredentials');
    $account->refresh();
    expect($account->password)->not->toBe($oldPassword)
        ->and($account->must_change_password)->toBeTrue();
});

test('admin dengan must_change_password dipaksa ke halaman ganti password', function () {
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);
    $admin = User::factory()->opdAdmin($opd->id)->create(['must_change_password' => true]);

    $this->actingAs($admin)->get('/opd')->assertRedirect(route('password.force.show'));
});

test('setelah ganti password, admin bisa membuka dasbor lagi', function () {
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);
    $admin = User::factory()->opdAdmin($opd->id)->create(['must_change_password' => true]);

    $this->actingAs($admin)
        ->post('/admin/password-baru', [
            'password' => 'PasswordBaru#123',
            'password_confirmation' => 'PasswordBaru#123',
        ])
        ->assertRedirect('/opd');

    expect($admin->refresh()->must_change_password)->toBeFalse();

    $this->actingAs($admin)->get('/opd')->assertOk();
});

// ---------------------------------------------------------------------------
// R12 — Kelola User (akun mahasiswa)
// ---------------------------------------------------------------------------

test('kelola user menampilkan akun mahasiswa dengan search server-side', function () {
    $verifikator = User::factory()->verifikator()->create();
    User::factory()->create(['name' => 'Budi Santoso', 'email' => 'budi@example.com']);
    User::factory()->create(['name' => 'Siti Aminah', 'email' => 'siti@example.com']);

    $response = $this->actingAs($verifikator)->get('/verifikator/users?search=budi');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('verifikator/users/index')
        ->has('users.data', 1)
        ->where('users.data.0.name', 'Budi Santoso')
        ->where('filters.search', 'budi')
    );
});

test('toggle-active menonaktifkan akun dan memblokir login OTP', function () {
    $verifikator = User::factory()->verifikator()->create();
    $mahasiswa = User::factory()->create(['is_active' => true]);

    $this->actingAs($verifikator)
        ->patch("/verifikator/users/{$mahasiswa->id}/toggle-active")
        ->assertRedirect();

    expect($mahasiswa->refresh()->is_active)->toBeFalse();

    // Akun nonaktif ditolak saat minta OTP.
    $this->post('/otp/send', ['email' => $mahasiswa->email])
        ->assertSessionHasErrors('email');
});

test('kelola user tertutup untuk admin OPD', function () {
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);
    $adminOpd = User::factory()->opdAdmin($opd->id)->create();

    $this->actingAs($adminOpd)->get('/verifikator/users')->assertForbidden();
});

// ---------------------------------------------------------------------------
// R13 — Kelola Admin (sesama verifikator)
// ---------------------------------------------------------------------------

test('menambah admin verifikator: password auto-generate + flash kredensial', function () {
    $verifikator = User::factory()->verifikator()->create();

    $response = $this->actingAs($verifikator)->post('/verifikator/admins', [
        'name' => 'Verifikator Dua',
        'username' => 'verif2',
    ]);

    $response->assertSessionHas('generatedCredentials', fn ($credentials) => $credentials['username'] === 'verif2'
        && strlen($credentials['password']) === 12);

    $account = User::where('username', 'verif2')->firstOrFail();
    expect($account->role->value)->toBe('admin_verifikator')
        ->and($account->must_change_password)->toBeTrue();
});

test('verifikator tidak dapat menghapus akun sendiri', function () {
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)
        ->delete("/verifikator/admins/{$verifikator->id}")
        ->assertSessionHas('error');

    expect(User::whereKey($verifikator->id)->exists())->toBeTrue();
});

test('verifikator dapat menghapus sesama admin', function () {
    $verifikator = User::factory()->verifikator()->create();
    $lain = User::factory()->verifikator()->create(['username' => 'verif-lain', 'email' => 'lain@example.com']);

    $this->actingAs($verifikator)
        ->delete("/verifikator/admins/{$lain->id}")
        ->assertSessionHas('success');

    expect(User::whereKey($lain->id)->exists())->toBeFalse();
});
