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
        // Eksplisit: tanpa ini `quota_used` bernilai null di memori (default 0
        // hanya berlaku di DB), sehingga assert "kuota tidak berubah" gagal
        // membandingkan null vs 0 padahal perilakunya benar.
        'quota_used' => 0,
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

/*
|--------------------------------------------------------------------------
| Gate ACC: penandatangan + Data Surat wajib sebelum menyetujui
|--------------------------------------------------------------------------
| Bug yang ditutup di sini: `signer_id` dulu hanya wajib BILA OPD sudah punya
| penandatangan, dan SubmissionService memilih status semata-mata dari
| "$signer === null". Akibatnya OPD yang belum sempat mendaftarkan
| penandatangan bisa meng-ACC, pengajuan langsung `approved` + email otomatis
| berkop generik, dan TIDAK PERNAH muncul di Menunggu TTE.
*/

test('ACC ditolak bila penandatangan tidak dipilih dan pengajuan tetap di antrean', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    tteSigner($opd);
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::ForwardedOpd,
    ]);
    $kuotaAwal = $opd->quota_used;

    $this->actingAs($admin)->post("/opd/pengajuan/{$application->id}/approve", [
        'division' => 'Bidang Arsip',
        'field_supervisor' => 'Sari',
        'person_in_charge' => 'Kepala Bidang',
    ])->assertSessionHasErrors('signer_id');

    expect($application->refresh()->status)->toBe(ApplicationStatus::ForwardedOpd)
        ->and($application->acceptance_signer_name)->toBeNull()
        ->and($opd->refresh()->quota_used)->toBe($kuotaAwal);
    Queue::assertNotPushed(GenerateJobAcceptanceLetter::class);
});

test('ACC ditolak bila OPD belum punya penandatangan sama sekali', function () {
    Storage::fake('local');
    Queue::fake();
    // OPD dengan kop lengkap tapi tanpa satu pun penandatangan.
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::ForwardedOpd,
    ]);

    $this->actingAs($admin)->post("/opd/pengajuan/{$application->id}/approve", [
        'division' => 'Bidang Arsip',
        'field_supervisor' => 'Sari',
        'person_in_charge' => 'Kepala Bidang',
    ])->assertSessionHasErrors('signer_id');

    expect($application->refresh()->status)->toBe(ApplicationStatus::ForwardedOpd);
    Queue::assertNotPushed(GenerateJobAcceptanceLetter::class);
});

test('ACC ditolak bila Data Surat OPD belum lengkap', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = Opd::create(['name' => 'Dinas Kearsipan', 'code' => 'ARSIP', 'quota_total' => 5]);
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $signer = tteSigner($opd);
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::ForwardedOpd,
    ]);

    $this->actingAs($admin)->post("/opd/pengajuan/{$application->id}/approve", [
        'division' => 'Bidang Arsip',
        'field_supervisor' => 'Sari',
        'person_in_charge' => 'Kepala Bidang',
        'signer_id' => $signer->id,
    ])->assertSessionHasErrors('letterhead');

    expect($application->refresh()->status)->toBe(ApplicationStatus::ForwardedOpd);
    Queue::assertNotPushed(GenerateJobAcceptanceLetter::class);
});

test('ACC lengkap membuat pengajuan tampil di daftar Menunggu TTE', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $signer = tteSigner($opd);
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::ForwardedOpd,
    ]);

    $this->actingAs($admin)->post("/opd/pengajuan/{$application->id}/approve", [
        'division' => 'Bidang Arsip',
        'field_supervisor' => 'Sari',
        'person_in_charge' => 'Kepala Bidang',
        'signer_id' => $signer->id,
    ])->assertSessionHasNoErrors();

    expect($application->refresh()->status)->toBe(ApplicationStatus::WaitingTte);

    $this->actingAs($admin)->get('/opd/menunggu-tte')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('applications', 1));
});

test('pengajuan lama tanpa penandatangan bisa ditarik kembali ke Menunggu TTE', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $signer = tteSigner($opd);
    $opd->update(['quota_used' => 1]);
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::Approved,
        'sk_number' => '503.11/1/401.106/2026',
        'acceptance_signer_name' => null,
    ]);

    $this->actingAs($admin)->post("/opd/pengajuan/{$application->id}/tarik-tte", [
        'signer_id' => $signer->id,
    ])->assertSessionHasNoErrors();

    $application->refresh();
    expect($application->status)->toBe(ApplicationStatus::WaitingTte)
        ->and($application->acceptance_signer_name)->toBe('Budi Santoso')
        ->and($application->acceptance_draft_path)->not->toBeNull()
        // Kuota sudah dihitung saat approve & nomor SK sudah terbit — keduanya
        // tidak boleh berubah karena penarikan ini.
        ->and($opd->refresh()->quota_used)->toBe(1)
        ->and($application->sk_number)->toBe('503.11/1/401.106/2026');

    // Pengajuan yang SUDAH punya snapshot tidak boleh ditarik lagi.
    $this->actingAs($admin)->post("/opd/pengajuan/{$application->id}/tarik-tte", [
        'signer_id' => $signer->id,
    ])->assertSessionHasErrors('signer_id');
});

/*
|--------------------------------------------------------------------------
| Kelola Surat: CRUD penandatangan + arsip dokumen bertanda tangan
|--------------------------------------------------------------------------
*/

test('penandatangan bisa diubah, dijadikan utama, dan dihapus tanpa merusak snapshot dokumen lama', function () {
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $lama = tteSigner($opd);
    $baru = tteSigner($opd, 'Siti Aminah', false);

    // Dokumen lama menyimpan snapshot, bukan referensi hidup.
    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::WaitingTte,
        'acceptance_signer_id' => $lama->id,
        'acceptance_signer_name' => $lama->name,
        'acceptance_signer_title' => $lama->title,
        'acceptance_signer_nip' => $lama->nip,
    ]);

    // Ubah data.
    $this->actingAs($admin)->put("/opd/penandatangan/{$baru->id}", [
        'name' => 'Siti Aminah, S.H.',
        'title' => 'Plt. Kepala Dinas',
        'nip' => '198505052010012002',
    ])->assertRedirect()->assertSessionHasNoErrors();
    expect($baru->refresh()->name)->toBe('Siti Aminah, S.H.');

    // Jadikan utama → yang lama turun.
    $this->actingAs($admin)->put("/opd/penandatangan/{$baru->id}", [
        'name' => 'Siti Aminah, S.H.',
        'title' => 'Plt. Kepala Dinas',
        'nip' => '198505052010012002',
        'is_primary' => true,
    ])->assertRedirect();
    expect($baru->refresh()->is_primary)->toBeTrue()
        ->and($lama->refresh()->is_primary)->toBeFalse();

    // Hapus yang lama → snapshot pada pengajuan tetap menyebut dia.
    $this->actingAs($admin)->delete("/opd/penandatangan/{$lama->id}")->assertRedirect();
    expect($opd->signers()->count())->toBe(1)
        ->and($application->refresh()->acceptance_signer_name)->toBe('Budi Santoso')
        ->and($application->acceptance_signer_id)->toBeNull();
});

test('admin OPD lain tidak bisa mengubah atau menghapus penandatangan', function () {
    $opd = tteOpd();
    $signer = tteSigner($opd);
    $opdLain = Opd::create(['name' => 'Dinas Pendidikan', 'code' => 'DPK']);
    $penyusup = User::factory()->opdAdmin($opdLain->id)->create();

    $this->actingAs($penyusup)->put("/opd/penandatangan/{$signer->id}", [
        'name' => 'Penyusup',
        'title' => 'Kepala Dinas',
        'nip' => '1',
    ])->assertForbidden();
    $this->actingAs($penyusup)->delete("/opd/penandatangan/{$signer->id}")->assertForbidden();

    expect($signer->refresh()->name)->toBe('Budi Santoso');
});

test('arsip Kelola Surat hanya memuat dokumen OPD sendiri dan bisa dicari lewat nomor SK', function () {
    Storage::fake('local');
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $opdLain = Opd::create(['name' => 'Dinas Pendidikan', 'code' => 'DPK']);

    $milikKita = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::Ongoing,
        'sk_number' => '503.11/7/401.106/2026',
        'acceptance_signed_path' => 'acceptance-signed/1/surat.pdf',
    ]);
    InternshipApplication::factory()->create([
        'opd_id' => $opdLain->id,
        'status' => ApplicationStatus::Ongoing,
        'sk_number' => '503.11/9/401.106/2026',
        'acceptance_signed_path' => 'acceptance-signed/2/surat.pdf',
    ]);
    // Draft sertifikat (file_path masih kosong) belum masuk arsip.
    Certificate::create([
        'application_id' => $milikKita->id,
        'file_name' => 'Sertifikat.pdf',
        'file_path' => '',
        'is_download_locked' => false,
        'uploaded_by' => $admin->id,
    ]);

    // Sertifikat SIAP milik pengajuan lain di OPD ini, nomor SK-nya berbeda.
    // Ini yang menangkap bug korelasi: grup OR di dalam whereHas yang tidak
    // dibungkus membuat sertifikat ini muncul untuk nomor SK APA PUN.
    $lain = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::Completed,
        'sk_number' => '503.11/8/401.106/2026',
    ]);
    Certificate::create([
        'application_id' => $lain->id,
        'file_name' => 'Sertifikat.pdf',
        'file_path' => 'certificates/'.$lain->id.'/sertifikat.pdf',
        'is_download_locked' => false,
        'uploaded_by' => $admin->id,
    ]);

    // Surat penerimaan milik kita + sertifikat siap; milik OPD lain & draft
    // kosong tidak ikut.
    $this->actingAs($admin)->get('/opd/surat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('signers')
            ->has('documents', 2));

    // Nomor SK milik OPD lain tidak boleh ditemukan dari sini.
    $this->actingAs($admin)->get('/opd/surat?cari=503.11/9')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('documents', 0)->where('filters.cari', '503.11/9'));

    // Pencarian nomor SK surat penerimaan tidak boleh ikut menarik sertifikat
    // bernomor SK lain.
    $this->actingAs($admin)->get('/opd/surat?cari=503.11/7')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('documents', 1)
            ->where('documents.0.sk_number', '503.11/7/401.106/2026')
            ->where('documents.0.type', 'acceptance'));

    $this->actingAs($admin)->get('/opd/surat?cari=503.11/8')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('documents', 1)
            ->where('documents.0.type', 'certificate'));
});

test('unduhan arsip menolak dokumen milik OPD lain', function () {
    Storage::fake('local');
    $opd = tteOpd();
    $opdLain = Opd::create(['name' => 'Dinas Pendidikan', 'code' => 'DPK']);
    $penyusup = User::factory()->opdAdmin($opdLain->id)->create();
    $admin = User::factory()->opdAdmin($opd->id)->create();

    $application = InternshipApplication::factory()->create([
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::Ongoing,
        'acceptance_signed_path' => 'acceptance-signed/1/surat.pdf',
    ]);
    Storage::disk('local')->put('acceptance-signed/1/surat.pdf', '%PDF-fake');

    $this->actingAs($penyusup)->get("/opd/surat/arsip/{$application->id}/penerimaan")->assertForbidden();
    $this->actingAs($admin)->get("/opd/surat/arsip/{$application->id}/penerimaan")->assertOk();
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
