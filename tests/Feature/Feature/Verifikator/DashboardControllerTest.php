<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('verifikator dashboard renders unwrapped array props', function () {
    $verifikator = User::factory()->verifikator()->create();
    Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 5]);
    InternshipApplication::factory()->count(3)->create();

    $response = $this->actingAs($verifikator)->get('/verifikator');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('verifikator/dashboard')
        ->has('applications', 3)
        ->has('applications.0.ticket_number')
        ->has('applications.0.status')
        ->has('opds', 1)
        ->where('opds.0.quota', 5) // quota_total dipetakan -> quota
        ->where('user.role', 'admin_verifikator')
    );
});

test('pengajuan masuk only lists pending applications', function () {
    $verifikator = User::factory()->verifikator()->create();
    InternshipApplication::factory()->create(['status' => ApplicationStatus::PendingVerifikator]);
    InternshipApplication::factory()->create(['status' => ApplicationStatus::Rejected]);

    $response = $this->actingAs($verifikator)->get('/verifikator/masuk');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('verifikator/masuk')
        ->has('applications', 1)
        ->where('applications.0.status', 'pending_verifikator')
    );
});

test('riwayat excludes pending applications', function () {
    $verifikator = User::factory()->verifikator()->create();
    InternshipApplication::factory()->create(['status' => ApplicationStatus::PendingVerifikator]);
    InternshipApplication::factory()->create(['status' => ApplicationStatus::Rejected]);
    InternshipApplication::factory()->create(['status' => ApplicationStatus::Completed]);

    $response = $this->actingAs($verifikator)->get('/verifikator/riwayat');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('verifikator/riwayat')
        ->has('applications', 2)
    );
});

test('non-verifikator is forbidden from verifikator pages', function () {
    $mahasiswa = User::factory()->create(); // default role mahasiswa

    $this->actingAs($mahasiswa)->get('/verifikator')->assertForbidden();
    $this->actingAs($mahasiswa)->get('/verifikator/masuk')->assertForbidden();
    $this->actingAs($mahasiswa)->get('/verifikator/riwayat')->assertForbidden();
});

test('guest is redirected from verifikator dashboard', function () {
    $this->get('/verifikator')->assertRedirect();
});
