<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

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

test('pengajuan page includes pasfoto and supporting document entries', function () {
    Queue::fake();
    Storage::fake('local');

    $user = User::factory()->create();
    $photoPath = UploadedFile::fake()->create('foto.jpg', 50, 'image/jpeg')->storeAs('applications/photos', 'foto.jpg', 'local');
    $suratPath = UploadedFile::fake()->create('surat.pdf', 50, 'application/pdf')->storeAs('applications/documents', 'surat.pdf', 'local');

    InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'photo_path' => $photoPath,
        'surat_pengantar_path' => $suratPath,
        'cv_path' => null,
        'portfolio_path' => null,
    ]);

    $response = $this->actingAs($user)->get('/pengajuan');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('mahasiswa/pengajuan')
        ->where('documents.0.label', 'Pas Foto')
        ->where('documents.0.kind', 'image')
        ->where('documents.1.label', 'Surat Pengantar')
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
