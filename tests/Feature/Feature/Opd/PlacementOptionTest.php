<?php

use App\Models\Opd;
use App\Models\OpdPlacementOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * Master penempatan (kartu "Kelola OPD" di dasbor): bidang, pembimbing
 * lapangan, penanggung jawab. Hanya nama — ketiganya tidak menandatangani
 * dokumen apa pun, berbeda dari `opd_signers` di menu Kelola Surat.
 */
function penempatanOpd(): Opd
{
    return Opd::create(['name' => 'Dinas Kearsipan', 'code' => 'ARSIP', 'quota_total' => 5]);
}

test('admin OPD bisa menambah, mengubah, dan menghapus data penempatan', function () {
    $opd = penempatanOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();

    $this->actingAs($admin)->post('/opd/penempatan', [
        'type' => OpdPlacementOption::TYPE_DIVISION,
        'name' => 'Bidang Arsip',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $option = $opd->placementOptions()->firstOrFail();
    expect($option->type)->toBe(OpdPlacementOption::TYPE_DIVISION)
        ->and($option->name)->toBe('Bidang Arsip');

    $this->actingAs($admin)->put("/opd/penempatan/{$option->id}", ['name' => 'Bidang Kearsipan'])
        ->assertRedirect()->assertSessionHasNoErrors();
    expect($option->refresh()->name)->toBe('Bidang Kearsipan');

    $this->actingAs($admin)->delete("/opd/penempatan/{$option->id}")->assertRedirect();
    expect($opd->placementOptions()->count())->toBe(0);
});

test('nama penempatan unik per OPD dan per jenis', function () {
    $opd = penempatanOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();

    $this->actingAs($admin)->post('/opd/penempatan', [
        'type' => OpdPlacementOption::TYPE_FIELD_SUPERVISOR,
        'name' => 'Sari Dewi',
    ])->assertSessionHasNoErrors();

    // Nama sama pada jenis sama → ditolak.
    $this->actingAs($admin)->post('/opd/penempatan', [
        'type' => OpdPlacementOption::TYPE_FIELD_SUPERVISOR,
        'name' => 'Sari Dewi',
    ])->assertSessionHasErrors('name');

    // Nama sama pada JENIS BERBEDA tetap boleh — satu orang bisa jadi
    // pembimbing lapangan sekaligus penanggung jawab.
    $this->actingAs($admin)->post('/opd/penempatan', [
        'type' => OpdPlacementOption::TYPE_PERSON_IN_CHARGE,
        'name' => 'Sari Dewi',
    ])->assertSessionHasNoErrors();

    expect($opd->placementOptions()->count())->toBe(2);
});

test('jenis penempatan di luar daftar ditolak', function () {
    $opd = penempatanOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();

    $this->actingAs($admin)->post('/opd/penempatan', [
        'type' => 'penandatangan',
        'name' => 'Bukan Jenis Sah',
    ])->assertSessionHasErrors('type');

    expect($opd->placementOptions()->count())->toBe(0);
});

test('admin OPD lain tidak bisa menyentuh master penempatan milik OPD ini', function () {
    $opd = penempatanOpd();
    $option = OpdPlacementOption::create([
        'opd_id' => $opd->id,
        'type' => OpdPlacementOption::TYPE_DIVISION,
        'name' => 'Bidang Arsip',
    ]);
    $penyusup = User::factory()->opdAdmin(
        Opd::create(['name' => 'Dinas Pendidikan', 'code' => 'DPK'])->id,
    )->create();

    $this->actingAs($penyusup)->put("/opd/penempatan/{$option->id}", ['name' => 'Diretas'])->assertForbidden();
    $this->actingAs($penyusup)->delete("/opd/penempatan/{$option->id}")->assertForbidden();
    expect($option->refresh()->name)->toBe('Bidang Arsip');

    // Verifikator bukan pemilik master ini.
    $this->actingAs(User::factory()->verifikator()->create())
        ->post('/opd/penempatan', ['type' => OpdPlacementOption::TYPE_DIVISION, 'name' => 'X'])
        ->assertForbidden();
});

test('dasbor dan halaman keputusan mengirim master penempatan terkelompok per jenis', function () {
    $opd = penempatanOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    OpdPlacementOption::create([
        'opd_id' => $opd->id,
        'type' => OpdPlacementOption::TYPE_DIVISION,
        'name' => 'Bidang Arsip',
    ]);

    foreach (['/opd', '/opd/keputusan'] as $url) {
        $this->actingAs($admin)->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('user.name')
                // Kunci array WAJIB sama dengan nama kolom pengajuan — komponen
                // membaca placementOptions.division dst. secara langsung.
                ->has('placementOptions.division', 1)
                ->has('placementOptions.field_supervisor')
                ->has('placementOptions.person_in_charge'));
    }
});
