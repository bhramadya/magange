<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('mahasiswa dashboard returns the latest own application', function () {
    $user = User::factory()->create();
    InternshipApplication::factory()->create(['user_id' => $user->id, 'status' => ApplicationStatus::Ongoing]);
    InternshipApplication::factory()->create(); // milik user lain

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('mahasiswa/dashboard')
        ->has('application.ticket_number')
        ->where('application.status', 'ongoing')
        ->where('user.role', 'mahasiswa')
    );
});

test('mahasiswa dashboard tolerates having no application', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('mahasiswa/dashboard')
        ->where('application', null)
    );
});

test('pengajuan page includes documents array', function () {
    $user = User::factory()->create();
    InternshipApplication::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get('/pengajuan');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('mahasiswa/pengajuan')
        ->has('documents')
        ->has('application.ticket_number')
    );
});

test('penyelesaian page renders for mahasiswa', function () {
    $user = User::factory()->create();
    InternshipApplication::factory()->create(['user_id' => $user->id, 'status' => ApplicationStatus::CompletionSubmitted]);

    $response = $this->actingAs($user)->get('/penyelesaian');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('mahasiswa/penyelesaian'));
});

test('admin roles are forbidden from mahasiswa pages', function () {
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)->get('/dashboard')->assertForbidden();
    $this->actingAs($verifikator)->get('/pengajuan')->assertForbidden();
    $this->actingAs($verifikator)->get('/penyelesaian')->assertForbidden();
});
