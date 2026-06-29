<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();
});

test('verifikator dapat meneruskan pengajuan ke OPD', function () {
    $verifikator = User::factory()->verifikator()->create();
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);
    $application = InternshipApplication::factory()->create(['status' => ApplicationStatus::PendingVerifikator]);

    $this->actingAs($verifikator)
        ->post("/verifikator/pengajuan/{$application->id}/teruskan", [
            'opd_id' => $opd->id,
            'division' => 'Bidang Pengembangan Aplikasi',
            'field_supervisor' => 'Bayu Pratama, S.Kom.',
            'person_in_charge' => 'Kepala Bidang TIK',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($application->fresh()->status)->toBe(ApplicationStatus::ForwardedOpd)
        ->and($application->fresh()->opd_id)->toBe($opd->id);
});

test('verifikator dapat menolak pengajuan', function () {
    $verifikator = User::factory()->verifikator()->create();
    $application = InternshipApplication::factory()->create(['status' => ApplicationStatus::PendingVerifikator]);

    $this->actingAs($verifikator)
        ->post("/verifikator/pengajuan/{$application->id}/tolak", [
            'rejection_reason' => 'Berkas tidak lengkap dan tidak memenuhi persyaratan.',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($application->fresh()->status)->toBe(ApplicationStatus::Rejected);
});

test('tidak bisa meneruskan pengajuan yang sudah diteruskan', function () {
    $verifikator = User::factory()->verifikator()->create();
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);
    $application = InternshipApplication::factory()->forwardedTo($opd->id)->create();

    $this->actingAs($verifikator)
        ->post("/verifikator/pengajuan/{$application->id}/teruskan", [
            'opd_id' => $opd->id,
            'division' => 'Bidang Lain',
            'field_supervisor' => 'Orang Lain',
            'person_in_charge' => 'PJ Lain',
        ])
        ->assertSessionHasErrors('status');

    // Status tidak berubah dari forwarded_opd.
    expect($application->fresh()->status)->toBe(ApplicationStatus::ForwardedOpd);
});

test('mahasiswa tidak boleh mengakses kotak masuk verifikator', function () {
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->get('/verifikator/masuk')->assertForbidden();
});
