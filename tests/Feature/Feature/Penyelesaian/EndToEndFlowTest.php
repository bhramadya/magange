<?php

use App\Enums\ApplicationStatus;
use App\Jobs\GenerateJobAcceptanceLetter;
use App\Jobs\SendApplicationConfirmationJob;
use App\Jobs\SendJobRejectionEmail;
use App\Jobs\SendSignedAcceptanceLetterJob;
use App\Jobs\SendSignedCertificateJob;
use App\Models\Certificate;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\OpdSigner;
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

    // OPD siap-ACC: kop surat lengkap + penandatangan (syarat wajib approve).
    $opd = Opd::create([
        'name' => 'Diskominfo',
        'code' => 'DKI',
        'is_active' => true,
        'quota_total' => 5,
        'letterhead_address' => 'Jl. Perintis Kemerdekaan No. 32, Madiun',
        'letterhead_phone' => '(0351) 467327',
        'letterhead_email' => 'kominfo@madiunkota.go.id',
    ]);
    $signer = OpdSigner::create([
        'opd_id' => $opd->id,
        'name' => 'Budi Santoso',
        'title' => 'Kepala Dinas',
        'nip' => '198001012001011001',
        'is_primary' => true,
    ]);
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

    // 3) OPD menyetujui + menetapkan penempatan → kuota bertambah, draft surat
    //    dicetak, TAPI email belum dikirim: pengajuan masuk antrean Menunggu TTE.
    $this->actingAs($opdAdmin)
        ->post("/opd/pengajuan/{$app->id}/approve", [
            'division' => 'Bidang TIK',
            'field_supervisor' => 'Rudi',
            'person_in_charge' => 'Kabid IT',
            'signer_id' => $signer->id,
        ])->assertRedirect();
    expect($app->fresh()->status)->toBe(ApplicationStatus::WaitingTte)
        ->and($app->fresh()->acceptance_draft_path)->not->toBeNull()
        ->and($opd->fresh()->quota_used)->toBe(1);
    Queue::assertNotPushed(GenerateJobAcceptanceLetter::class);

    // 3b) Surat ditandatangani di luar sistem lalu diunggah → email baru dikirim.
    //     Tanggal mulai = hari ini, jadi statusnya langsung Sedang Magang.
    $this->actingAs($opdAdmin)
        ->post("/opd/menunggu-tte/{$app->id}/unggah", [
            'file' => UploadedFile::fake()->create('surat-ttd.pdf', 100, 'application/pdf'),
        ])->assertRedirect();
    expect($app->fresh()->status)->toBe(ApplicationStatus::Ongoing);
    Queue::assertPushed(SendSignedAcceptanceLetterJob::class);

    // 4) Cron harian idempoten: tiket yang sudah Sedang Magang tidak berubah.
    $this->artisan('magang:transition-statuses')->assertSuccessful();
    expect($app->fresh()->status)->toBe(ApplicationStatus::Ongoing);

    // 5) Peserta unggah laporan + konfirmasi selesai (aktor "Selesai" #4).
    //    Pengajuan ber-snapshot TTE TIDAK langsung `completed` — ia menunggu
    //    sertifikat bertanda tangan lebih dahulu (arti baru `completed`).
    $this->actingAs($mahasiswa)
        ->post("/mahasiswa/pengajuan/{$app->id}/laporan", [
            'file' => UploadedFile::fake()->create('laporan.pdf', 100, 'application/pdf'),
            'is_confirmed' => true,
        ])->assertRedirect();
    expect($app->fresh()->status)->toBe(ApplicationStatus::NeedsCertificate);
    $report = FinalReport::where('application_id', $app->id)->firstOrFail();

    // 6) Admin OPD menyetujui laporan akhir (batch 5: menu Laporan pindah
    //    total dari verifikator ke OPD).
    $this->actingAs($opdAdmin)
        ->post("/opd/laporan/{$report->id}/approve")
        ->assertRedirect();

    // 7) Draft sertifikat dibuat (snapshot penandatangan ikut tertulis).
    $this->actingAs($opdAdmin)
        ->post("/opd/perlu-sertifikat/{$app->id}/draft", ['signer_id' => $signer->id])
        ->assertRedirect();
    $certificate = Certificate::where('application_id', $app->id)->firstOrFail();
    expect($certificate->draft_path)->not->toBeNull()
        ->and($certificate->signer_name)->toBe('Budi Santoso');

    // 8) Sertifikat bertanda tangan diunggah → Selesai Magang + email terkirim.
    $this->actingAs($opdAdmin)
        ->post("/opd/perlu-sertifikat/{$app->id}/unggah", [
            'file' => UploadedFile::fake()->create('sertifikat-ttd.pdf', 100, 'application/pdf'),
        ])->assertRedirect();
    expect($app->fresh()->status)->toBe(ApplicationStatus::Completed);
    Queue::assertPushed(SendSignedCertificateJob::class);

    // 9) Peserta bisa mengunduh sertifikatnya.
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
