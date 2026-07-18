<?php

use App\Models\Opd;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('verifikator dapat melihat daftar OPD', function () {
    $verifikator = User::factory()->verifikator()->create();
    Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 8, 'quota_used' => 2]);

    $response = $this->actingAs($verifikator)->get('/verifikator/opd');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('verifikator/opd/index')
        ->has('opds', 1)
        ->where('opds.0.code', 'DKI')
        ->where('opds.0.quota', 8)
        ->where('opds.0.quota_used', 2)
    );
});

test('verifikator dapat menambah OPD baru dengan kuota_used 0', function () {
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)
        ->post('/verifikator/opd', [
            'name' => 'Dinas Pendidikan',
            'code' => 'DISDIK',
            'quota_total' => 12,
            'is_active' => true,
        ])
        ->assertRedirect(route('verifikator.opd.index'));

    $this->assertDatabaseHas('opds', [
        'code' => 'DISDIK',
        'quota_total' => 12,
        'quota_used' => 0,
    ]);
});

test('kode OPD wajib unik saat menambah', function () {
    $verifikator = User::factory()->verifikator()->create();
    Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);

    $this->actingAs($verifikator)
        ->post('/verifikator/opd', ['name' => 'Lain', 'code' => 'DKI', 'quota_total' => 5])
        ->assertSessionHasErrors('code');

    expect(Opd::where('code', 'DKI')->count())->toBe(1);
});

test('verifikator dapat mengubah OPD', function () {
    $verifikator = User::factory()->verifikator()->create();
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 8, 'quota_used' => 2]);

    $this->actingAs($verifikator)
        ->put("/verifikator/opd/{$opd->id}", [
            'name' => 'Dinas Kominfo Statistik',
            'code' => 'DISKOMINFO',
            'quota_total' => 20,
            'is_active' => true,
        ])
        ->assertRedirect(route('verifikator.opd.index'));

    $this->assertDatabaseHas('opds', [
        'id' => $opd->id,
        'name' => 'Dinas Kominfo Statistik',
        'code' => 'DISKOMINFO',
        'quota_total' => 20,
    ]);
});

test('kuota tidak boleh diturunkan di bawah kuota terpakai', function () {
    $verifikator = User::factory()->verifikator()->create();
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 8, 'quota_used' => 5]);

    $this->actingAs($verifikator)
        ->put("/verifikator/opd/{$opd->id}", [
            'name' => 'Dinas Kominfo',
            'code' => 'DKI',
            'quota_total' => 3,
        ])
        ->assertSessionHasErrors('quota_total');

    $this->assertDatabaseHas('opds', ['id' => $opd->id, 'quota_total' => 8]);
});

test('OPD tanpa peserta dapat dihapus', function () {
    $verifikator = User::factory()->verifikator()->create();
    $opd = Opd::create(['name' => 'Dinas Kosong', 'code' => 'KOSONG', 'is_active' => true, 'quota_total' => 5, 'quota_used' => 0]);

    $this->actingAs($verifikator)
        ->delete("/verifikator/opd/{$opd->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('opds', ['id' => $opd->id]);
});

test('OPD dengan peserta tidak dapat dihapus', function () {
    $verifikator = User::factory()->verifikator()->create();
    $opd = Opd::create(['name' => 'Dinas Isi', 'code' => 'ISI', 'is_active' => true, 'quota_total' => 5, 'quota_used' => 3]);

    $this->actingAs($verifikator)
        ->delete("/verifikator/opd/{$opd->id}")
        ->assertSessionHas('error');

    $this->assertDatabaseHas('opds', ['id' => $opd->id]);
});

test('admin OPD tidak boleh mengakses kelola OPD (403)', function () {
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);
    $opdAdmin = User::factory()->opdAdmin($opd->id)->create();

    $this->actingAs($opdAdmin)->get('/verifikator/opd')->assertForbidden();
    $this->actingAs($opdAdmin)->post('/verifikator/opd', [
        'name' => 'X', 'code' => 'X', 'quota_total' => 1,
    ])->assertForbidden();
});
