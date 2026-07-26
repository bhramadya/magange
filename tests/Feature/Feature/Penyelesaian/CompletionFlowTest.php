<?php

use App\Enums\ApplicationStatus;
use App\Enums\ReportStatus;
use App\Models\Certificate;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use App\Models\Opd;
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
 * OPD + admin-nya untuk aksi laporan (batch 5: laporan dikelola Admin OPD).
 *
 * @return array{0: Opd, 1: User}
 */
function opdWithAdmin(string $code = 'DKI'): array
{
    $opd = Opd::create(['name' => "OPD {$code}", 'code' => $code]);
    $admin = User::factory()->opdAdmin($opd->id)->create();

    return [$opd, $admin];
}

/**
 * Pengajuan milik $owner pada status Ongoing di OPD tertentu.
 */
function ongoingApplicationFor(User $owner, ?Opd $opd = null): InternshipApplication
{
    return InternshipApplication::factory()->create([
        'user_id' => $owner->id,
        'opd_id' => $opd?->id,
        'status' => ApplicationStatus::Ongoing,
    ]);
}

/**
 * Laporan akhir pending untuk sebuah pengajuan.
 */
function pendingReportFor(InternshipApplication $app): FinalReport
{
    return FinalReport::create([
        'application_id' => $app->id,
        'file_name' => 'laporan.pdf',
        'file_path' => "reports/{$app->id}/laporan.pdf",
        'is_confirmed' => true,
        'status' => ReportStatus::Pending,
        'submitted_at' => now(),
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

test('admin OPD menyetujui laporan lalu menerbitkan sertifikat terkunci', function () {
    Storage::fake('local');
    [$opd, $adminOpd] = opdWithAdmin();
    $mahasiswa = User::factory()->create();
    $app = ongoingApplicationFor($mahasiswa, $opd);
    $report = pendingReportFor($app);

    $this->actingAs($adminOpd)
        ->post("/opd/laporan/{$report->id}/approve")
        ->assertRedirect();
    expect($report->refresh()->status)->toBe(ReportStatus::Approved);

    $this->actingAs($adminOpd)
        ->post("/opd/laporan/{$report->id}/sertifikat", [
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

test('admin OPD dapat membuka berkas laporan akhir peserta di OPD-nya', function () {
    Storage::fake('local');
    [$opd, $adminOpd] = opdWithAdmin();
    $app = ongoingApplicationFor(User::factory()->create(), $opd);
    Storage::disk('local')->put("reports/{$app->id}/laporan.pdf", 'PDF');
    $report = pendingReportFor($app);

    $this->actingAs($adminOpd)
        ->get("/opd/laporan/{$report->id}/berkas")
        ->assertOk();
});

test('admin OPD lain dilarang mengakses laporan bukan miliknya', function () {
    Storage::fake('local');
    [$opd] = opdWithAdmin('DKI');
    [, $adminOpdLain] = opdWithAdmin('DPK');
    $app = ongoingApplicationFor(User::factory()->create(), $opd);
    Storage::disk('local')->put("reports/{$app->id}/laporan.pdf", 'PDF');
    $report = pendingReportFor($app);

    $this->actingAs($adminOpdLain)
        ->get("/opd/laporan/{$report->id}/berkas")
        ->assertForbidden();
    $this->actingAs($adminOpdLain)
        ->post("/opd/laporan/{$report->id}/approve")
        ->assertForbidden();
    expect($report->refresh()->status)->toBe(ReportStatus::Pending);
});

test('verifikator dan mahasiswa dilarang mengakses aksi laporan OPD', function () {
    [$opd] = opdWithAdmin();
    $mahasiswa = User::factory()->create();
    $verifikator = User::factory()->verifikator()->create();
    $app = ongoingApplicationFor($mahasiswa, $opd);
    $report = pendingReportFor($app);

    // Batch 5: menu Laporan pindah TOTAL ke OPD — verifikator kini 403.
    $this->actingAs($verifikator)
        ->get("/opd/laporan/{$report->id}/berkas")
        ->assertForbidden();
    $this->actingAs($mahasiswa)
        ->get("/opd/laporan/{$report->id}/berkas")
        ->assertForbidden();
});

test('route lama verifikator/laporan sudah tidak ada', function () {
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)->get('/verifikator/laporan')->assertNotFound();
});
