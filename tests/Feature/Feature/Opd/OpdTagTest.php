<?php

use App\Models\Opd;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Batch 5 revisi #1: tag kompetensi OPD (kolom description) — sumber tag
 * kartu OPD di landing page. PATCH /opd-tag/{opd}: Admin OPD hanya
 * miliknya, Verifikator semua.
 */
test('admin OPD mengubah tag OPD-nya sendiri', function () {
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI']);
    $admin = User::factory()->opdAdmin($opd->id)->create();

    $this->actingAs($admin)
        ->patch("/opd-tag/{$opd->id}", ['description' => 'Teknologi Informasi, Administrasi'])
        ->assertRedirect();

    expect($opd->refresh()->description)->toBe('Teknologi Informasi, Administrasi');
});

test('admin OPD dilarang mengubah tag OPD lain', function () {
    $opdSendiri = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI']);
    $opdLain = Opd::create(['name' => 'Dinas Pendidikan', 'code' => 'DPK', 'description' => 'Pendidikan']);
    $admin = User::factory()->opdAdmin($opdSendiri->id)->create();

    $this->actingAs($admin)
        ->patch("/opd-tag/{$opdLain->id}", ['description' => 'Diubah paksa'])
        ->assertForbidden();

    expect($opdLain->refresh()->description)->toBe('Pendidikan');
});

test('verifikator boleh mengubah tag semua OPD, tag boleh dikosongkan', function () {
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'description' => 'Lama']);
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)
        ->patch("/opd-tag/{$opd->id}", ['description' => null])
        ->assertRedirect();

    expect($opd->refresh()->description)->toBeNull();
});

test('mahasiswa dilarang mengubah tag OPD', function () {
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI']);
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)
        ->patch("/opd-tag/{$opd->id}", ['description' => 'X'])
        ->assertForbidden();
});
