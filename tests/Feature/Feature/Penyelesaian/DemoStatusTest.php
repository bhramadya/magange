<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Database\Seeders\DemoSpectrumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function demoSeed(): void
{
    Queue::fake();
    Storage::fake('local');

    (new DemoSpectrumSeeder)->run();
}

test('seeder membuat tiga tiket demo pada status yang diminta via SubmissionService', function () {
    demoSeed();

    $menungguTte = InternshipApplication::where('ticket_number', 'MGG-2026-900101')->firstOrFail();
    $perluSertifikat = InternshipApplication::where('ticket_number', 'MGG-2026-900102')->firstOrFail();
    $perluKeputusan = InternshipApplication::where('ticket_number', 'MGG-2026-900103')->firstOrFail();

    expect($menungguTte->status)->toBe(ApplicationStatus::WaitingTte)
        ->and($perluSertifikat->status)->toBe(ApplicationStatus::NeedsCertificate)
        ->and($perluKeputusan->status)->toBe(ApplicationStatus::ForwardedOpd);

    // Data demo punya snapshot penandatangan + status-log + draft PDF
    // seperti data sungguhan (bukan sekadar status diubah mentah).
    expect($menungguTte->acceptance_signer_name)->not->toBeNull()
        ->and($menungguTte->acceptance_draft_path)->not->toBeNull()
        ->and($menungguTte->statusLogs()->count())->toBeGreaterThanOrEqual(3);

    expect($perluSertifikat->acceptance_signer_name)->not->toBeNull()
        ->and($perluSertifikat->acceptance_draft_path)->not->toBeNull()
        ->and($perluSertifikat->acceptance_signed_path)->not->toBeNull()
        ->and($perluSertifikat->statusLogs()->count())->toBeGreaterThanOrEqual(5);

    expect($perluKeputusan->statusLogs()->count())->toBeGreaterThanOrEqual(2);
});

test('seeder idempoten: dijalankan ulang tidak menggandakan tiket', function () {
    demoSeed();
    demoSeed();

    expect(InternshipApplication::count())->toBe(3)
        ->and(InternshipApplication::where('ticket_number', 'MGG-2026-900101')->count())->toBe(1);
});

test('command memindahkan tiket ke status demo', function () {
    demoSeed();

    $app = InternshipApplication::where('ticket_number', 'MGG-2026-900103')->firstOrFail();
    expect($app->status)->toBe(ApplicationStatus::ForwardedOpd);

    $this->artisan('magang:demo-status', ['tiket' => 'MGG-2026-900103', 'status' => 'waiting_tte'])
        ->assertSuccessful();

    $app->refresh();
    expect($app->status)->toBe(ApplicationStatus::WaitingTte)
        ->and($app->acceptance_signer_name)->not->toBeNull();
});

test('command menolak status yang tidak dikenal', function () {
    demoSeed();

    $this->artisan('magang:demo-status', ['tiket' => 'MGG-2026-900103', 'status' => 'completed'])
        ->assertFailed();

    $app = InternshipApplication::where('ticket_number', 'MGG-2026-900103')->firstOrFail();
    expect($app->status)->toBe(ApplicationStatus::ForwardedOpd);
});

test('command menolak tiket yang tidak ditemukan', function () {
    demoSeed();

    $this->artisan('magang:demo-status', ['tiket' => 'MGG-2026-999999', 'status' => 'waiting_tte'])
        ->assertFailed();
});

test('command diblokir di lingkungan produksi', function () {
    demoSeed();

    $this->app->instance('env', 'production');

    $this->artisan('magang:demo-status', ['tiket' => 'MGG-2026-900103', 'status' => 'waiting_tte'])
        ->assertFailed();

    $app = InternshipApplication::where('ticket_number', 'MGG-2026-900103')->firstOrFail();
    expect($app->status)->toBe(ApplicationStatus::ForwardedOpd);
});

test('command butuh aktor demo bila tiket belum punya OPD', function () {
    Queue::fake();
    Storage::fake('local');

    $app = InternshipApplication::factory()->create();

    $this->artisan('magang:demo-status', ['tiket' => $app->ticket_number, 'status' => 'waiting_tte'])
        ->assertFailed();
});

test('command butuh aktor demo bila verifikator/opd-admin/signer belum ada', function () {
    Queue::fake();
    Storage::fake('local');

    $opd = Opd::create(['name' => 'OPD Kosong', 'code' => 'EMPTY', 'is_active' => true, 'quota_total' => 5]);

    $app = InternshipApplication::factory()->create(['opd_id' => $opd->id]);

    $this->artisan('magang:demo-status', ['tiket' => $app->ticket_number, 'status' => 'waiting_tte'])
        ->assertFailed();
});

test('aktornya role yang benar', function () {
    demoSeed();

    expect(User::where('email', 'demo.verifikator@madiunkota.go.id')->exists())->toBeTrue()
        ->and(User::where('email', 'demo.opd@madiunkota.go.id')->exists())->toBeTrue()
        ->and(User::where('email', 'demo.menunggu.tte@example.com')->exists())->toBeTrue();
});
