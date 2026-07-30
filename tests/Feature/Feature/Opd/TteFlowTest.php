<?php

use App\Enums\ApplicationStatus;
use App\Jobs\GenerateJobAcceptanceLetter;
use App\Jobs\SendSignedAcceptanceLetterJob;
use App\Jobs\SendSignedCertificateJob;
use App\Models\Certificate;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\OpdLetterTemplate;
use App\Models\OpdSigner;
use App\Models\User;
use App\Services\LetterDocumentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * Alur TTE (prompt/QUEUE/2026-07-29-batch.md): surat penerimaan & sertifikat
 * ditandatangani manual di luar sistem, lalu diunggah — email ke peserta baru
 * dikirim SETELAH unggahan, bukan saat keputusan/akhir periode.
 */
function tteOpd(): Opd
{
    return Opd::create([
        'name' => 'Dinas Kearsipan',
        'code' => 'ARSIP',
        'quota_total' => 5,
        'letterhead_address' => 'Jl. Pemuda No. 1, Madiun',
        'letterhead_phone' => '(0351) 123456',
        'letterhead_email' => 'arsip@madiunkota.go.id',
    ]);
}

function tteSigner(Opd $opd, string $name = 'Budi Santoso', bool $isPrimary = true): OpdSigner
{
    return OpdSigner::create([
        'opd_id' => $opd->id,
        'name' => $name,
        'title' => 'Kepala Dinas',
        'nip' => '198001012001011001',
        'is_primary' => $isPrimary,
    ]);
}

test('approval with signer creates a draft and waits for TTE without queuing email', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $signer = tteSigner($opd);
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::ForwardedOpd,
        'start_date' => now()->addWeek()->toDateString(),
    ]);

    $this->actingAs($admin)->post("/opd/pengajuan/{$application->id}/approve", [
        'division' => 'Bidang Arsip',
        'field_supervisor' => 'Sari',
        'person_in_charge' => 'Kepala Bidang',
        'signer_id' => $signer->id,
    ])->assertRedirect();

    $application->refresh();
    expect($application->status)->toBe(ApplicationStatus::WaitingTte)
        ->and($application->acceptance_signer_name)->toBe('Budi Santoso')
        ->and($application->acceptance_draft_path)->not->toBeNull();
    Storage::disk('local')->assertExists((string) $application->acceptance_draft_path);
    Queue::assertNotPushed(GenerateJobAcceptanceLetter::class);
    Queue::assertNotPushed(SendSignedAcceptanceLetterJob::class);
});

test('signed uploads send documents and finish their respective TTE stages', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $signer = tteSigner($opd);
    $acceptance = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::WaitingTte,
        'start_date' => now()->addWeek()->toDateString(),
        'acceptance_signer_name' => $signer->name,
    ]);

    $this->actingAs($admin)->post("/opd/menunggu-tte/{$acceptance->id}/unggah", [
        'file' => UploadedFile::fake()->create('signed-acceptance.pdf', 50, 'application/pdf'),
    ])->assertRedirect();
    expect($acceptance->refresh()->status)->toBe(ApplicationStatus::Approved);
    Queue::assertPushed(SendSignedAcceptanceLetterJob::class);

    $certificateApplication = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::NeedsCertificate,
    ]);
    $this->actingAs($admin)->post("/opd/perlu-sertifikat/{$certificateApplication->id}/draft", ['signer_id' => $signer->id])->assertRedirect();
    $certificate = Certificate::where('application_id', $certificateApplication->id)->firstOrFail();
    expect($certificate->draft_path)->not->toBeNull();

    $this->actingAs($admin)->post("/opd/perlu-sertifikat/{$certificateApplication->id}/unggah", [
        'file' => UploadedFile::fake()->create('signed-certificate.pdf', 50, 'application/pdf'),
    ])->assertRedirect();
    expect($certificateApplication->refresh()->status)->toBe(ApplicationStatus::Completed);
    Queue::assertPushed(SendSignedCertificateJob::class);
});

/*
|--------------------------------------------------------------------------
| Halaman TTE harus mengirim SEMUA prop yang dibaca komponennya
|--------------------------------------------------------------------------
| Ketiga halaman ini membungkus dirinya dengan MagangLayout, yang membaca
| user.role/user.name. Prop `user` yang lupa dikirim TIDAK menghasilkan error
| server — halamannya 200 tapi render React melempar TypeError dan layar tampil
| kosong (blank putih). Persis itu yang terjadi pada /opd/surat, jadi ketiga
| halaman dijaga di sini.
*/

test('halaman menunggu tte, perlu sertifikat, dan kelola surat mengirim prop user untuk MagangLayout', function () {
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();

    foreach (['/opd/menunggu-tte', '/opd/perlu-sertifikat', '/opd/surat'] as $url) {
        $this->actingAs($admin)->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('user.name')
                ->has('user.role')
                ->has('opd.name'));
    }
});

test('halaman kelola surat mengirim template kedua jenis beserta daftar placeholder', function () {
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    OpdLetterTemplate::create([
        'opd_id' => $opd->id,
        'type' => OpdLetterTemplate::TYPE_ACCEPTANCE,
        'body' => 'Template tersimpan {nama_peserta} {opd} {tanggal_mulai} {tanggal_selesai}.',
    ]);

    $this->actingAs($admin)->get('/opd/surat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('opd/surat')
            // Kunci array HARUS 'acceptance'/'certificate' — komponen membaca
            // templates.acceptance dan requiredPlaceholders[type] langsung.
            ->where('templates.acceptance', 'Template tersimpan {nama_peserta} {opd} {tanggal_mulai} {tanggal_selesai}.')
            ->has('templates.certificate')
            ->has('placeholders', count(LetterDocumentService::PLACEHOLDERS))
            ->has('requiredPlaceholders.acceptance')
            ->has('requiredPlaceholders.certificate'));
});

/*
|--------------------------------------------------------------------------
| Bagian 1 — kartu "Kelola OPD": Data Surat + daftar Penandatangan
|--------------------------------------------------------------------------
*/

test('data surat kop tersimpan dari kartu Kelola OPD', function () {
    $opd = Opd::create(['name' => 'Dinas Kearsipan', 'code' => 'ARSIP']);
    $admin = User::factory()->opdAdmin($opd->id)->create();

    $this->actingAs($admin)->patch('/opd/data-surat', [
        'letterhead_address' => 'Jl. Pahlawan No. 37, Madiun',
        'letterhead_phone' => '(0351) 467613',
        'letterhead_email' => 'arsip@madiunkota.go.id',
    ])->assertRedirect();

    $opd->refresh();
    expect($opd->letterhead_address)->toBe('Jl. Pahlawan No. 37, Madiun')
        ->and($opd->letterhead_phone)->toBe('(0351) 467613')
        ->and($opd->letterhead_email)->toBe('arsip@madiunkota.go.id');
});

test('penandatangan pertama otomatis jadi utama dan bisa digantikan penandatangan baru', function () {
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();

    // Orang pertama tidak perlu menandai is_primary — dia satu-satunya.
    $this->actingAs($admin)->post('/opd/penandatangan', [
        'name' => 'Budi Santoso',
        'title' => 'Kepala Dinas',
        'nip' => '198001012001011001',
    ])->assertRedirect();

    $pertama = $opd->signers()->firstOrFail();
    expect($pertama->is_primary)->toBeTrue();

    // Skenario Plt: orang kedua ditandai utama, yang lama harus turun.
    $this->actingAs($admin)->post('/opd/penandatangan', [
        'name' => 'Siti Aminah',
        'title' => 'Plt. Kepala Dinas',
        'nip' => '198505052010012002',
        'is_primary' => true,
    ])->assertRedirect();

    expect($opd->signers()->count())->toBe(2)
        ->and($pertama->refresh()->is_primary)->toBeFalse()
        ->and($opd->signers()->where('is_primary', true)->value('name'))->toBe('Siti Aminah');
});

test('admin OPD hanya bisa mengelola data surat OPD-nya sendiri', function () {
    $opdSendiri = tteOpd();
    $opdLain = Opd::create(['name' => 'Dinas Pendidikan', 'code' => 'DPK', 'letterhead_phone' => '(0351) 000000']);
    $admin = User::factory()->opdAdmin($opdSendiri->id)->create();

    // Endpoint tak menerima id OPD — selalu OPD milik admin yang login,
    // jadi OPD lain tak bisa disentuh lewat jalur ini sama sekali.
    $this->actingAs($admin)->patch('/opd/data-surat', ['letterhead_phone' => '(0351) 111111'])
        ->assertRedirect();

    expect($opdSendiri->refresh()->letterhead_phone)->toBe('(0351) 111111')
        ->and($opdLain->refresh()->letterhead_phone)->toBe('(0351) 000000');

    // Role lain sama sekali tak boleh masuk.
    $this->actingAs(User::factory()->verifikator()->create())
        ->patch('/opd/data-surat', ['letterhead_phone' => '(0351) 222222'])
        ->assertForbidden();
});

/*
|--------------------------------------------------------------------------
| Bagian 2 — "Kelola Surat": template body + placeholder
|--------------------------------------------------------------------------
*/

test('template surat tersimpan per jenis dan placeholder wajib tidak boleh dihapus', function () {
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();

    $body = 'Peserta {nama_peserta} diterima magang di {opd} sejak {tanggal_mulai} hingga {tanggal_selesai}.';
    $this->actingAs($admin)->put('/opd/surat/template', [
        'type' => OpdLetterTemplate::TYPE_ACCEPTANCE,
        'body' => $body,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(OpdLetterTemplate::where('opd_id', $opd->id)->where('type', OpdLetterTemplate::TYPE_ACCEPTANCE)->value('body'))
        ->toBe($body);

    // {nama_peserta} dibuang → ditolak, template lama tetap utuh.
    $this->actingAs($admin)->put('/opd/surat/template', [
        'type' => OpdLetterTemplate::TYPE_ACCEPTANCE,
        'body' => 'Peserta diterima magang di {opd} sejak {tanggal_mulai} hingga {tanggal_selesai}.',
    ])->assertSessionHasErrors('body');

    expect(OpdLetterTemplate::where('opd_id', $opd->id)->where('type', OpdLetterTemplate::TYPE_ACCEPTANCE)->value('body'))
        ->toBe($body);

    // Template sertifikat terpisah dari template surat penerimaan.
    $this->actingAs($admin)->put('/opd/surat/template', [
        'type' => OpdLetterTemplate::TYPE_CERTIFICATE,
        'body' => '{nama_peserta} telah selesai magang di {opd}, {tanggal_mulai} – {tanggal_selesai}.',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(OpdLetterTemplate::where('opd_id', $opd->id)->count())->toBe(2);
});

test('body surat penerimaan memakai template OPD dengan placeholder tersubstitusi', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $signer = tteSigner($opd);
    OpdLetterTemplate::create([
        'opd_id' => $opd->id,
        'type' => OpdLetterTemplate::TYPE_ACCEPTANCE,
        'body' => 'Kami menerima {nama_peserta} dari {asal_instansi} di {opd} bidang {bidang}, {tanggal_mulai} s.d. {tanggal_selesai}.',
    ]);

    $mahasiswa = User::factory()->create(['name' => 'Faalih Fadhlurrohmaan']);
    $application = InternshipApplication::factory()->create([
        'user_id' => $mahasiswa->id,
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::WaitingTte,
        'institution_name' => 'Universitas Brawijaya',
        'division' => 'Bidang Arsip',
        'start_date' => '2026-08-01',
        'end_date' => '2026-08-31',
        'acceptance_signer_id' => $signer->id,
        'acceptance_signer_name' => $signer->name,
        'acceptance_signer_title' => $signer->title,
        'acceptance_signer_nip' => $signer->nip,
    ]);

    // DomPDF mengompresi stream PDF-nya, jadi isi surat dibaca dari data yang
    // masuk ke view — bukan dari byte PDF.
    $captured = [];
    View::composer('pdf.acceptance_letter', function ($view) use (&$captured): void {
        $captured = $view->getData();
    });

    app(LetterDocumentService::class)->generateAcceptanceDraft($application);

    expect($captured['body'])
        ->toContain('Faalih Fadhlurrohmaan')
        ->toContain('Universitas Brawijaya')
        ->toContain('Dinas Kearsipan')
        ->toContain('Bidang Arsip')
        ->toContain('01 August 2026')
        ->toContain('31 August 2026')
        ->not->toContain('{nama_peserta}')
        ->not->toContain('{tanggal_selesai}');
});

test('kop surat memakai data OPD dinamis dan logo Pemkot yang tetap statis', function () {
    $opd = tteOpd();
    $application = InternshipApplication::factory()->create(['opd_id' => $opd->id]);

    $html = View::make('pdf.partials.letterhead', [
        'application' => $application->load('opd'),
    ])->render();

    expect($html)
        ->toContain('Dinas Kearsipan')
        ->toContain('Jl. Pemuda No. 1, Madiun')
        ->toContain('(0351) 123456')
        ->toContain('arsip@madiunkota.go.id')
        ->toContain('P E M E R I N T A H');

    // Logo kota dipasang lewat GD; di lingkungan tanpa GD blok img memang
    // dilewati agar generate PDF tak pernah gagal (lihat CLAUDE.md).
    if (function_exists('imagecreatefrompng')) {
        expect($html)->toContain('Lambang_Kota_Madiun.png');
    }
});

/*
|--------------------------------------------------------------------------
| Bagian 5 — snapshot penandatangan
|--------------------------------------------------------------------------
*/

test('snapshot penandatangan bertahan walau daftar penandatangan OPD berubah', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $lama = tteSigner($opd);
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::ForwardedOpd,
        'start_date' => now()->addWeek()->toDateString(),
    ]);

    $this->actingAs($admin)->post("/opd/pengajuan/{$application->id}/approve", [
        'division' => 'Bidang Arsip',
        'field_supervisor' => 'Sari',
        'person_in_charge' => 'Kepala Bidang',
        'signer_id' => $lama->id,
    ])->assertRedirect();

    // Kepala Dinas berganti: penandatangan utama baru + yang lama dihapus.
    $baru = tteSigner($opd, 'Siti Aminah');
    $lama->update(['is_primary' => false]);
    $lama->delete();

    // Cetak ulang draft tidak boleh menulis ulang snapshot ke pejabat baru.
    app(LetterDocumentService::class)->generateAcceptanceDraft($application->fresh());

    $application->refresh();
    expect($application->acceptance_signer_name)->toBe('Budi Santoso')
        ->and($application->acceptance_signer_nip)->toBe('198001012001011001')
        ->and($application->acceptance_signer_name)->not->toBe($baru->name);
});

/*
|--------------------------------------------------------------------------
| Bagian 4 — akhir periode: perlu sertifikat, bukan langsung selesai
|--------------------------------------------------------------------------
*/

test('akhir periode magang menjadikan status perlu sertifikat, bukan selesai magang', function () {
    Queue::fake();
    $opd = tteOpd();
    $signer = tteSigner($opd);
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::Ongoing,
        'start_date' => now()->subMonth()->toDateString(),
        'end_date' => now()->toDateString(),
        'acceptance_signer_id' => $signer->id,
        'acceptance_signer_name' => $signer->name,
        'acceptance_signer_title' => $signer->title,
        'acceptance_signer_nip' => $signer->nip,
    ]);

    $this->artisan('magang:transition-statuses')->assertSuccessful();

    expect($application->refresh()->status)->toBe(ApplicationStatus::NeedsCertificate);
    expect($application->statusLogs()->where('to_status', ApplicationStatus::NeedsCertificate->value)->exists())->toBeTrue();
});

test('pengajuan lama tanpa snapshot TTE tetap langsung selesai saat periode berakhir', function () {
    Queue::fake();
    $opd = tteOpd();
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::Ongoing,
        'start_date' => now()->subMonth()->toDateString(),
        'end_date' => now()->toDateString(),
        'acceptance_signer_name' => null,
    ]);

    $this->artisan('magang:transition-statuses')->assertSuccessful();

    expect($application->refresh()->status)->toBe(ApplicationStatus::Completed);
});

/*
|--------------------------------------------------------------------------
| Guard: kepemilikan OPD & urutan langkah
|--------------------------------------------------------------------------
*/

test('admin OPD lain tidak bisa mengunduh draft atau mengunggah dokumen TTE', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $opdLain = Opd::create(['name' => 'Dinas Pendidikan', 'code' => 'DPK', 'quota_total' => 5]);
    $penyusup = User::factory()->opdAdmin($opdLain->id)->create();
    $signer = tteSigner($opd);
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::WaitingTte,
        'start_date' => now()->addWeek()->toDateString(),
        'acceptance_signer_name' => $signer->name,
        'acceptance_draft_path' => 'acceptance-draft/1/draft.pdf',
    ]);
    Storage::disk('local')->put('acceptance-draft/1/draft.pdf', '%PDF-fake');

    $this->actingAs($penyusup)->get("/opd/menunggu-tte/{$application->id}/draft")->assertForbidden();
    $this->actingAs($penyusup)->post("/opd/menunggu-tte/{$application->id}/unggah", [
        'file' => UploadedFile::fake()->create('signed.pdf', 20, 'application/pdf'),
    ])->assertForbidden();

    expect($application->refresh()->status)->toBe(ApplicationStatus::WaitingTte);
    Queue::assertNotPushed(SendSignedAcceptanceLetterJob::class);
});

test('sertifikat bertanda tangan tak bisa diunggah sebelum draftnya dibuat', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    tteSigner($opd);
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::NeedsCertificate,
    ]);

    $this->actingAs($admin)->post("/opd/perlu-sertifikat/{$application->id}/unggah", [
        'file' => UploadedFile::fake()->create('signed-certificate.pdf', 50, 'application/pdf'),
    ])->assertStatus(422);

    expect($application->refresh()->status)->toBe(ApplicationStatus::NeedsCertificate);
    Queue::assertNotPushed(SendSignedCertificateJob::class);
});
