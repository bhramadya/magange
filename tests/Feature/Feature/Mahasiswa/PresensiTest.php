<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\PresensiLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * Payload absen harian valid (batch 5): status + rincian + foto wajib.
 *
 * @return array<string, mixed>
 */
function presensiPayload(array $overrides = []): array
{
    return array_merge([
        'status' => 'hadir',
        'details' => 'Membantu input data pengajuan magang.',
        'attachments' => [
            UploadedFile::fake()->create('dokumentasi-1.jpg', 100, 'image/jpeg'),
        ],
    ], $overrides);
}

test('mahasiswa absen harian dengan dokumentasi foto', function () {
    Storage::fake('local');
    $mahasiswa = User::factory()->create();

    $response = $this->actingAs($mahasiswa)->post('/presensi', presensiPayload([
        'attachments' => [
            UploadedFile::fake()->create('dokumentasi-1.jpg', 100, 'image/jpeg'),
            UploadedFile::fake()->create('dokumentasi-2.png', 100, 'image/png'),
        ],
    ]));

    $response->assertRedirect();
    $log = PresensiLog::firstOrFail();
    expect($log->user_id)->toBe($mahasiswa->id)
        ->and($log->status)->toBe('hadir')
        ->and($log->activity_date->toDateString())->toBe(now()->toDateString())
        ->and($log->attachments)->toHaveCount(2);

    foreach ($log->attachments as $attachment) {
        Storage::disk('local')->assertExists($attachment->path);
    }
});

test('dokumentasi foto wajib minimal 1 dan maksimal 3', function () {
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->post('/presensi', presensiPayload([
        'attachments' => [],
    ]))->assertSessionHasErrors('attachments');

    $this->actingAs($mahasiswa)->post('/presensi', presensiPayload([
        'attachments' => [
            UploadedFile::fake()->create('a.jpg', 10, 'image/jpeg'),
            UploadedFile::fake()->create('b.jpg', 10, 'image/jpeg'),
            UploadedFile::fake()->create('c.jpg', 10, 'image/jpeg'),
            UploadedFile::fake()->create('d.jpg', 10, 'image/jpeg'),
        ],
    ]))->assertSessionHasErrors('attachments');

    expect(PresensiLog::count())->toBe(0);
});

test('lampiran selain gambar atau di atas 2MB ditolak', function () {
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->post('/presensi', presensiPayload([
        'attachments' => [UploadedFile::fake()->create('bukti.pdf', 100, 'application/pdf')],
    ]))->assertSessionHasErrors('attachments.0');

    $this->actingAs($mahasiswa)->post('/presensi', presensiPayload([
        'attachments' => [UploadedFile::fake()->create('besar.jpg', 3000, 'image/jpeg')],
    ]))->assertSessionHasErrors('attachments.0');

    expect(PresensiLog::count())->toBe(0);
});

test('status kehadiran wajib hadir, izin, atau sakit', function () {
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->post('/presensi', presensiPayload([
        'status' => 'bolos',
    ]))->assertSessionHasErrors('status');

    expect(PresensiLog::count())->toBe(0);
});

test('presensi hanya bisa sekali per hari', function () {
    Storage::fake('local');
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->post('/presensi', presensiPayload())->assertRedirect();

    $this->actingAs($mahasiswa)
        ->post('/presensi', presensiPayload(['status' => 'izin']))
        ->assertSessionHasErrors('status');

    expect(PresensiLog::count())->toBe(1);
});

test('halaman presensi mengirim riwayat entri milik sendiri + hasToday', function () {
    $mahasiswa = User::factory()->create();
    $lain = User::factory()->create();

    PresensiLog::create([
        'user_id' => $mahasiswa->id,
        'activity_date' => now()->toDateString(),
        'status' => 'hadir',
        'details' => 'Milik saya.',
    ]);
    PresensiLog::create([
        'user_id' => $lain->id,
        'activity_date' => now()->toDateString(),
        'status' => 'izin',
        'details' => 'Milik orang lain.',
    ]);

    $this->actingAs($mahasiswa)->get('/presensi')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('mahasiswa/presensi')
            ->has('entries', 1)
            ->where('entries.0.details', 'Milik saya.')
            ->where('entries.0.status', 'hadir')
            ->where('hasToday', true)
        );
});

test('lampiran presensi: pemilik dan verifikator boleh, mahasiswa lain dilarang', function () {
    Storage::fake('local');
    $pemilik = User::factory()->create();
    $lain = User::factory()->create();
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($pemilik)->post('/presensi', presensiPayload());

    $log = PresensiLog::firstOrFail();
    $attachment = $log->attachments()->firstOrFail();

    $this->actingAs($pemilik)->get("/presensi/{$log->id}/lampiran/{$attachment->id}")->assertOk();
    $this->actingAs($lain)->get("/presensi/{$log->id}/lampiran/{$attachment->id}")->assertForbidden();
    $this->actingAs($verifikator)->get("/presensi/{$log->id}/lampiran/{$attachment->id}")->assertOk();
});

test('lampiran presensi: admin OPD hanya bila user punya pengajuan di OPD-nya', function () {
    Storage::fake('local');
    $pemilik = User::factory()->create();

    $opdMilik = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI']);
    $opdLain = Opd::create(['name' => 'Dinas Pendidikan', 'code' => 'DPK']);
    $adminOpd = User::factory()->opdAdmin($opdMilik->id)->create();
    $adminOpdLain = User::factory()->opdAdmin($opdLain->id)->create();

    InternshipApplication::factory()->create([
        'user_id' => $pemilik->id,
        'opd_id' => $opdMilik->id,
        'status' => ApplicationStatus::Ongoing,
    ]);

    $this->actingAs($pemilik)->post('/presensi', presensiPayload());
    $log = PresensiLog::firstOrFail();
    $attachment = $log->attachments()->firstOrFail();

    $this->actingAs($adminOpd)->get("/presensi/{$log->id}/lampiran/{$attachment->id}")->assertOk();
    $this->actingAs($adminOpdLain)->get("/presensi/{$log->id}/lampiran/{$attachment->id}")->assertForbidden();
});

test('mahasiswa dapat menghapus presensi miliknya beserta lampiran', function () {
    Storage::fake('local');
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->post('/presensi', presensiPayload([
        'details' => 'Akan dihapus.',
    ]));

    $log = PresensiLog::firstOrFail();
    $path = $log->attachments()->firstOrFail()->path;

    $this->actingAs($mahasiswa)->delete("/presensi/{$log->id}")->assertRedirect();

    expect(PresensiLog::count())->toBe(0);
    Storage::disk('local')->assertMissing($path);
});
