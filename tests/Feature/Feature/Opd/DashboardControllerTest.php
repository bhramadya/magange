<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function opdAdmin(): array
{
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 8, 'quota_used' => 2]);
    $user = User::factory()->opdAdmin($opd->id)->create();

    return [$user, $opd];
}

test('opd dashboard is scoped to the admin own opd and unwraps props', function () {
    [$user, $opd] = opdAdmin();
    $otherOpd = Opd::create(['name' => 'Dinas Lain', 'code' => 'LAIN', 'is_active' => true]);

    InternshipApplication::factory()->count(2)->create(['opd_id' => $opd->id, 'status' => ApplicationStatus::ForwardedOpd]);
    InternshipApplication::factory()->create(['opd_id' => $otherOpd->id, 'status' => ApplicationStatus::ForwardedOpd]);

    $response = $this->actingAs($user)->get('/opd');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('opd/dashboard')
        ->has('applications', 2) // hanya OPD sendiri
        ->where('opd.quota', 8)
        ->where('opd.quota_used', 2)
        ->where('user.role', 'admin_opd')
    );
});

test('opd keputusan lists only forwarded applications for this opd', function () {
    [$user, $opd] = opdAdmin();
    InternshipApplication::factory()->create(['opd_id' => $opd->id, 'status' => ApplicationStatus::ForwardedOpd]);
    InternshipApplication::factory()->create(['opd_id' => $opd->id, 'status' => ApplicationStatus::Approved]);

    $response = $this->actingAs($user)->get('/opd/keputusan');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('opd/keputusan')
        ->has('applications', 1)
        ->where('applications.0.status', 'forwarded_opd')
    );
});

test('opd peserta wraps active interns as participants', function () {
    [$user, $opd] = opdAdmin();
    $intern = User::factory()->create(['name' => 'Ani Peserta']);
    InternshipApplication::factory()->create(['opd_id' => $opd->id, 'user_id' => $intern->id, 'status' => ApplicationStatus::Ongoing]);
    InternshipApplication::factory()->create(['opd_id' => $opd->id, 'status' => ApplicationStatus::ForwardedOpd]); // bukan peserta aktif

    $response = $this->actingAs($user)->get('/opd/peserta');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('opd/peserta')
        ->has('participants', 1)
        ->where('participants.0.student_name', 'Ani Peserta')
        ->has('participants.0.application.ticket_number')
    );
});

test('non-opd is forbidden from opd pages', function () {
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)->get('/opd')->assertForbidden();
    $this->actingAs($verifikator)->get('/opd/keputusan')->assertForbidden();
    $this->actingAs($verifikator)->get('/opd/peserta')->assertForbidden();
});
