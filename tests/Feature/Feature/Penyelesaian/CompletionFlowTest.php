<?php

use App\Enums\ApplicationStatus;
use App\Enums\ReportStatus;
use App\Models\Certificate;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
});

/**
 * Pengajuan milik $owner pada status Ongoing (siap masuk tahap penyelesaian).
 */
function ongoingApplicationFor(User $owner): InternshipApplication
{
    return InternshipApplication::factory()->create([
        'user_id' => $owner->id,
        'status' => ApplicationStatus::Ongoing,
    ]);
}

test('mahasiswa mengunggah laporan dengan konfirmasi menandai magang selesai', function () {
    Storage::fake('local');
    $mahasiswa = User::factory()->create();
    $app = ongoingApplicationFor($mahasiswa);

    $response = $this->actingAs($mahasiswa)->post("/mahasiswa/pengajuan/{$app->id}/laporan", [
        'file' => UploadedFile::fake()->create('laporan.pdf', 200, 'application/pdf'),
        'is_confirmed' => true,
    ]);

    $response->assertRedirect();
    expect($app->refresh()->status)->toBe(ApplicationStatus::Completed);
    $this->assertDatabaseHas('final_reports', [
        'application_id' => $app->id,
        'is_confirmed' => true,
    ]);
});

test('verifikator menyetujui laporan lalu menerbitkan sertifikat terkunci', function () {
    Storage::fake('local');
    $verifikator = User::factory()->verifikator()->create();
    $mahasiswa = User::factory()->create();
    $app = ongoingApplicationFor($mahasiswa);
    $report = FinalReport::create([
        'application_id' => $app->id,
        'file_name' => 'laporan.pdf',
        'file_path' => "reports/{$app->id}/laporan.pdf",
        'is_confirmed' => true,
        'status' => ReportStatus::Pending,
        'submitted_at' => now(),
    ]);

    $this->actingAs($verifikator)
        ->post("/verifikator/laporan/{$report->id}/approve")
        ->assertRedirect();
    expect($report->refresh()->status)->toBe(ReportStatus::Approved);

    $this->actingAs($verifikator)
        ->post("/verifikator/laporan/{$report->id}/sertifikat", [
            'file' => UploadedFile::fake()->create('sertifikat.pdf', 100, 'application/pdf'),
        ])
        ->assertRedirect();

    $certificate = Certificate::where('application_id', $app->id)->firstOrFail();
    expect($certificate->is_download_locked)->toBeTrue();
});

test('survei wajib membuka kunci unduhan sertifikat', function () {
    $mahasiswa = User::factory()->create();
    $app = ongoingApplicationFor($mahasiswa);
    $certificate = Certificate::create([
        'application_id' => $app->id,
        'file_name' => 'sertifikat.pdf',
        'file_path' => "certificates/{$app->id}/sertifikat.pdf",
        'is_download_locked' => true,
        'uploaded_by' => User::factory()->verifikator()->create()->id,
    ]);

    $this->actingAs($mahasiswa)
        ->post("/sertifikat/{$certificate->id}/survei", [
            'ratings' => [
                'bimbingan' => 5,
                'lingkungan' => 4,
                'relevansi' => 5,
                'fasilitas' => 4,
                'keseluruhan' => 5,
            ],
            'comment' => 'Pengalaman yang bermanfaat.',
        ])
        ->assertRedirect();

    expect($certificate->refresh()->is_download_locked)->toBeFalse();
    // Rata-rata (5+4+5+4+5)/5 = 4.6 -> dibulatkan 5.
    $this->assertDatabaseHas('satisfaction_surveys', [
        'application_id' => $app->id,
        'rating' => 5,
    ]);
});

test('unduh sertifikat: pemilik boleh, non-pemilik dilarang', function () {
    Storage::fake('local');
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $app = ongoingApplicationFor($owner);
    Storage::disk('local')->put("certificates/{$app->id}/sertifikat.pdf", 'PDF');
    $certificate = Certificate::create([
        'application_id' => $app->id,
        'file_name' => 'sertifikat.pdf',
        'file_path' => "certificates/{$app->id}/sertifikat.pdf",
        'is_download_locked' => false,
        'uploaded_by' => User::factory()->verifikator()->create()->id,
    ]);

    $this->actingAs($owner)
        ->get("/sertifikat/{$certificate->id}/download")
        ->assertOk();

    $this->actingAs($other)
        ->get("/sertifikat/{$certificate->id}/download")
        ->assertForbidden();
});

test('sertifikat terkunci tidak bisa diunduh', function () {
    $owner = User::factory()->create();
    $app = ongoingApplicationFor($owner);
    $certificate = Certificate::create([
        'application_id' => $app->id,
        'file_name' => 'sertifikat.pdf',
        'file_path' => "certificates/{$app->id}/sertifikat.pdf",
        'is_download_locked' => true,
        'uploaded_by' => User::factory()->verifikator()->create()->id,
    ]);

    $this->actingAs($owner)
        ->from('/penyelesaian')
        ->get("/sertifikat/{$certificate->id}/download")
        ->assertRedirect('/penyelesaian');
});

test('halaman review laporan verifikator dapat diakses', function () {
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)
        ->get('/verifikator/laporan')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('verifikator/reports/index'));
});

test('mahasiswa dilarang mengakses aksi verifikator laporan', function () {
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->get('/verifikator/laporan')->assertForbidden();
});
