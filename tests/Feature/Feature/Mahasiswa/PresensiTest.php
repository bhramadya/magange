<?php

use App\Models\PresensiLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('mahasiswa menyimpan presensi dengan lampiran multiple', function () {
    Storage::fake('local');
    $mahasiswa = User::factory()->create();

    $response = $this->actingAs($mahasiswa)->post('/presensi', [
        'activity_date' => now()->toDateString(),
        'start_time' => '08:00',
        'end_time' => '16:00',
        'details' => 'Membantu input data pengajuan magang.',
        'attachments' => [
            UploadedFile::fake()->create('bukti-1.pdf', 100, 'application/pdf'),
            UploadedFile::fake()->create('bukti-2.jpg', 100, 'image/jpeg'),
        ],
    ]);

    $response->assertRedirect();
    $log = PresensiLog::firstOrFail();
    expect($log->user_id)->toBe($mahasiswa->id)
        ->and($log->attachments)->toHaveCount(2);

    foreach ($log->attachments as $attachment) {
        Storage::disk('local')->assertExists($attachment->path);
    }
});

test('jam selesai harus setelah jam mulai', function () {
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->post('/presensi', [
        'activity_date' => now()->toDateString(),
        'start_time' => '16:00',
        'end_time' => '08:00',
        'details' => 'Salah jam.',
    ])->assertSessionHasErrors('end_time');

    expect(PresensiLog::count())->toBe(0);
});

test('halaman presensi mengirim riwayat entri milik sendiri saja', function () {
    $mahasiswa = User::factory()->create();
    $lain = User::factory()->create();

    PresensiLog::create([
        'user_id' => $mahasiswa->id,
        'activity_date' => now()->toDateString(),
        'start_time' => '08:00',
        'end_time' => '16:00',
        'details' => 'Milik saya.',
    ]);
    PresensiLog::create([
        'user_id' => $lain->id,
        'activity_date' => now()->toDateString(),
        'start_time' => '08:00',
        'end_time' => '16:00',
        'details' => 'Milik orang lain.',
    ]);

    $this->actingAs($mahasiswa)->get('/presensi')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('mahasiswa/presensi')
            ->has('entries', 1)
            ->where('entries.0.details', 'Milik saya.')
        );
});

test('lampiran presensi orang lain tidak bisa diakses', function () {
    Storage::fake('local');
    $pemilik = User::factory()->create();
    $lain = User::factory()->create();

    $this->actingAs($pemilik)->post('/presensi', [
        'activity_date' => now()->toDateString(),
        'start_time' => '08:00',
        'end_time' => '16:00',
        'details' => 'Dengan lampiran.',
        'attachments' => [UploadedFile::fake()->create('bukti.pdf', 50, 'application/pdf')],
    ]);

    $log = PresensiLog::firstOrFail();
    $attachment = $log->attachments()->firstOrFail();

    $this->actingAs($pemilik)->get("/presensi/{$log->id}/lampiran/{$attachment->id}")->assertOk();
    $this->actingAs($lain)->get("/presensi/{$log->id}/lampiran/{$attachment->id}")->assertForbidden();
});

test('mahasiswa dapat menghapus presensi miliknya beserta lampiran', function () {
    Storage::fake('local');
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->post('/presensi', [
        'activity_date' => now()->toDateString(),
        'start_time' => '08:00',
        'end_time' => '16:00',
        'details' => 'Akan dihapus.',
        'attachments' => [UploadedFile::fake()->create('bukti.pdf', 50, 'application/pdf')],
    ]);

    $log = PresensiLog::firstOrFail();
    $path = $log->attachments()->firstOrFail()->path;

    $this->actingAs($mahasiswa)->delete("/presensi/{$log->id}")->assertRedirect();

    expect(PresensiLog::count())->toBe(0);
    Storage::disk('local')->assertMissing($path);
});
