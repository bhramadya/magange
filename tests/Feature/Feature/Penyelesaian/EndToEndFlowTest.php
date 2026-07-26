<?php

use App\Enums\ApplicationStatus;
use App\Jobs\GenerateJobAcceptanceLetter;
use App\Jobs\SendApplicationConfirmationJob;
use App\Jobs\SendJobRejectionEmail;
use App\Models\Certificate;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * Payload form pendaftaran publik yang valid (selaras StoreApplicationRequest).
 *
 * @return array<string, mixed>
 */
function e2ePengajuan(array $overrides = []): array
{
    return array_merge([
        'name' => 'Budi Santoso',
        'nis' => '2021001',
        'email' => 'budi@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Pengembangan aplikasi web',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonths(3)->toDateString(),
        'institution_name' => 'Universitas Negeri Madiun',
        'address' => 'Jl. Merdeka No. 1, Madiun',
        'campus_supervisor' => 'Dr. Andi',
        'campus_supervisor_whatsapp' => '081311112222',
        'major' => 'Teknik Informatika',
        'skills' => 'React, Laravel',
    ], $overrides);
}

function e2eOpdAdmin(Opd $opd): User
{
    return User::factory()->create([
        'role' => 'admin_opd',
        'opd_id' => $opd->id,
        'is_active' => true,
    ]);
}

test('alur lengkap: daftar -> teruskan -> setujui -> cron mulai -> laporan -> sertifikat -> survei -> unduh', function () {
    Queue::fake();
    Storage::fake('local');

    $opd = Opd::create(['name' => 'Diskominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 5]);
    $verifikator = User::factory()->verifikator()->create();
    $opdAdmin = e2eOpdAdmin($opd);

    // 1) Pendaftaran publik → buat akun + pengajuan pending, arahkan ke login-otp.
    $this->post('/pengajuan', e2ePengajuan())
        ->assertRedirect(route('login.otp'));

    Queue::assertPushed(SendApplicationConfirmationJob::class);
    $app = InternshipApplication::firstOrFail();
    $mahasiswa = User::where('email', 'budi@example.com')->firstOrFail();
    expect($app->status)->toBe(ApplicationStatus::PendingVerifikator);

    // 2) Verifikator meneruskan ke OPD.
    $this->actingAs($verifikator)
        ->post("/verifikator/pengajuan/{$app->id}/forward", [
            'opd_id' => $opd->id,
            'verifikator_note' => 'Kandidat kuat.',
        ])->assertRedirect();
    expect($app->fresh()->status)->toBe(ApplicationStatus::ForwardedOpd);

    // 3) OPD menyetujui + menetapkan penempatan → kuota bertambah, surat dikirim.
    $this->actingAs($opdAdmin)
        ->post("/opd/pengajuan/{$app->id}/approve", [
            'division' => 'Bidang TIK',
            'field_supervisor' => 'Rudi',
            'person_in_charge' => 'Kabid IT',
        ])->assertRedirect();
    expect($app->fresh()->status)->toBe(ApplicationStatus::Approved)
        ->and($opd->fresh()->quota_used)->toBe(1);
    Queue::assertPushed(GenerateJobAcceptanceLetter::class);

    // 4) Cron harian: tanggal mulai = hari ini → Sedang Magang.
    $this->artisan('magang:transition-statuses')->assertSuccessful();
    expect($app->fresh()->status)->toBe(ApplicationStatus::Ongoing);

    // 5) Peserta unggah laporan + konfirmasi selesai (aktor "Selesai" #4).
    $this->actingAs($mahasiswa)
        ->post("/mahasiswa/pengajuan/{$app->id}/laporan", [
            'file' => UploadedFile::fake()->create('laporan.pdf', 100, 'application/pdf'),
            'is_confirmed' => true,
        ])->assertRedirect();
    expect($app->fresh()->status)->toBe(ApplicationStatus::Completed);
    $report = FinalReport::where('application_id', $app->id)->firstOrFail();

    // 6) Admin OPD menyetujui laporan + mengunggah sertifikat (terkunci) —
    //    batch 5: menu Laporan pindah total dari verifikator ke OPD.
    $this->actingAs($opdAdmin)
        ->post("/opd/laporan/{$report->id}/approve")
        ->assertRedirect();
    $this->actingAs($opdAdmin)
        ->post("/opd/laporan/{$report->id}/sertifikat", [
            'file' => UploadedFile::fake()->create('sertifikat.pdf', 100, 'application/pdf'),
        ])->assertRedirect();
    $certificate = Certificate::where('application_id', $app->id)->firstOrFail();
    expect($certificate->is_download_locked)->toBeTrue();

    // 7) Survei wajib membuka kunci unduhan.
    $this->actingAs($mahasiswa)
        ->post("/sertifikat/{$certificate->id}/survei", [
            'ratings' => ['bimbingan' => 5, 'lingkungan' => 4, 'relevansi' => 5, 'fasilitas' => 4, 'keseluruhan' => 5],
            'comment' => 'Pengalaman bermanfaat.',
        ])->assertRedirect();
    expect($certificate->fresh()->is_download_locked)->toBeFalse();

    // 8) Unduh sertifikat berhasil.
    $this->actingAs($mahasiswa)
        ->get("/sertifikat/{$certificate->id}/download")
        ->assertOk();
});

test('alur tolak verifikator: status Ditolak + email penolakan dikirim', function () {
    Queue::fake();
    $verifikator = User::factory()->verifikator()->create();

    $this->post('/pengajuan', e2ePengajuan(['email' => 'tolak-v@example.com']))->assertRedirect();
    $app = InternshipApplication::firstOrFail();

    $this->actingAs($verifikator)
        ->post("/verifikator/pengajuan/{$app->id}/reject", [
            'rejection_reason' => 'Berkas tidak lengkap dan tidak memenuhi syarat.',
        ])->assertRedirect();

    expect($app->fresh()->status)->toBe(ApplicationStatus::Rejected);
    Queue::assertPushed(SendJobRejectionEmail::class);
});

test('alur tolak OPD: status Ditolak + email penolakan dikirim', function () {
    Queue::fake();
    $opd = Opd::create(['name' => 'Diskominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 5]);
    $verifikator = User::factory()->verifikator()->create();
    $opdAdmin = e2eOpdAdmin($opd);

    $this->post('/pengajuan', e2ePengajuan(['email' => 'tolak-o@example.com']))->assertRedirect();
    $app = InternshipApplication::firstOrFail();

    $this->actingAs($verifikator)
        ->post("/verifikator/pengajuan/{$app->id}/forward", ['opd_id' => $opd->id])
        ->assertRedirect();

    $this->actingAs($opdAdmin)
        ->post("/opd/pengajuan/{$app->id}/reject", [
            'rejection_reason' => 'Kuota bidang terkait sudah penuh untuk periode ini.',
        ])->assertRedirect();

    expect($app->fresh()->status)->toBe(ApplicationStatus::Rejected);
    Queue::assertPushed(SendJobRejectionEmail::class);
});
