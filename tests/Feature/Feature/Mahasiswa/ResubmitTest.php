<?php

use App\Enums\ApplicationStatus;
use App\Models\ApplicationStatusLog;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('ajukan ulang tiket rejected membuat tiket baru dengan data ter-copy', function () {
    Queue::fake();
    Storage::fake('local');
    $mahasiswa = User::factory()->create();

    Storage::disk('local')->put('applications/photos/foto.jpg', 'isi-foto');
    $old = InternshipApplication::factory()->create([
        'user_id' => $mahasiswa->id,
        'status' => ApplicationStatus::Rejected,
        'rejection_reason' => 'Kuota penuh',
        'photo_path' => 'applications/photos/foto.jpg',
        'skills' => 'Laravel, React',
    ]);

    $response = $this->actingAs($mahasiswa)
        ->post("/mahasiswa/pengajuan/{$old->id}/ajukan-ulang");

    $response->assertRedirect(route('mahasiswa.pengajuan'));

    $new = InternshipApplication::where('id', '!=', $old->id)->firstOrFail();
    expect($new->ticket_number)->not->toBe($old->ticket_number)
        ->and($new->status)->toBe(ApplicationStatus::PendingVerifikator)
        ->and($new->skills)->toBe('Laravel, React')
        ->and($new->institution_name)->toBe($old->institution_name)
        ->and($new->rejection_reason)->toBeNull()
        ->and($new->photo_path)->not->toBe($old->photo_path);

    // Berkas fisik ikut disalin, tiket lama tetap rejected.
    Storage::disk('local')->assertExists($new->photo_path);
    expect($old->refresh()->status)->toBe(ApplicationStatus::Rejected);

    // Audit log menyebut tiket lama.
    expect(ApplicationStatusLog::where('application_id', $new->id)
        ->where('notes', 'like', "%{$old->ticket_number}%")
        ->exists())->toBeTrue();
});

test('ajukan ulang ditolak bila status bukan rejected', function () {
    Queue::fake();
    $mahasiswa = User::factory()->create();
    $app = InternshipApplication::factory()->create([
        'user_id' => $mahasiswa->id,
        'status' => ApplicationStatus::PendingVerifikator,
    ]);

    $this->actingAs($mahasiswa)
        ->post("/mahasiswa/pengajuan/{$app->id}/ajukan-ulang")
        ->assertSessionHasErrors('resubmit');

    expect(InternshipApplication::count())->toBe(1);
});

test('ajukan ulang ditolak untuk tiket milik orang lain', function () {
    Queue::fake();
    $pemilik = User::factory()->create();
    $lain = User::factory()->create();
    $app = InternshipApplication::factory()->create([
        'user_id' => $pemilik->id,
        'status' => ApplicationStatus::Rejected,
    ]);

    $this->actingAs($lain)
        ->post("/mahasiswa/pengajuan/{$app->id}/ajukan-ulang")
        ->assertSessionHasErrors('resubmit');

    expect(InternshipApplication::count())->toBe(1);
});
