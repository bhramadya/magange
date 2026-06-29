<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();
});

test('admin OPD tidak bisa menyetujui pengajuan OPD lain (403)', function () {
    $opdA = Opd::create(['name' => 'OPD A', 'code' => 'AAA', 'is_active' => true, 'quota_total' => 10, 'quota_used' => 0]);
    $opdB = Opd::create(['name' => 'OPD B', 'code' => 'BBB', 'is_active' => true, 'quota_total' => 10, 'quota_used' => 0]);
    $adminB = User::factory()->opdAdmin($opdB->id)->create();
    $application = InternshipApplication::factory()->forwardedTo($opdA->id)->create();

    $this->actingAs($adminB)
        ->post("/opd/pengajuan/{$application->id}/setujui")
        ->assertForbidden();

    expect($application->fresh()->status)->toBe(ApplicationStatus::ForwardedOpd);
});

test('admin OPD dapat menyetujui pengajuan miliknya', function () {
    $opd = Opd::create(['name' => 'OPD A', 'code' => 'AAA', 'is_active' => true, 'quota_total' => 10, 'quota_used' => 0]);
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $application = InternshipApplication::factory()->forwardedTo($opd->id)->create();

    $this->actingAs($admin)
        ->post("/opd/pengajuan/{$application->id}/setujui")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($application->fresh()->status)->toBe(ApplicationStatus::Approved);
    expect($opd->fresh()->quota_used)->toBe(1);
});

test('admin OPD dapat menolak pengajuan miliknya', function () {
    $opd = Opd::create(['name' => 'OPD A', 'code' => 'AAA', 'is_active' => true, 'quota_total' => 10, 'quota_used' => 0]);
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $application = InternshipApplication::factory()->forwardedTo($opd->id)->create();

    $this->actingAs($admin)
        ->post("/opd/pengajuan/{$application->id}/tolak", [
            'rejection_reason' => 'Kuota magang untuk periode ini telah penuh.',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($application->fresh()->status)->toBe(ApplicationStatus::Rejected);
});
