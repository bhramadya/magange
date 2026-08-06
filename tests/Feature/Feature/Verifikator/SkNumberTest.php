<?php

use App\Enums\ApplicationStatus;
use App\Enums\ReportStatus;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\OpdSigner;
use App\Models\SkCounter;
use App\Models\User;
use App\Services\SkNumberService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function skForwardedApplication(Opd $opd): InternshipApplication
{
    return InternshipApplication::factory()->create([
        'status' => ApplicationStatus::ForwardedOpd,
        'opd_id' => $opd->id,
    ]);
}

// ---------------------------------------------------------------------------
// R4/R5 — Nomor SK surat penerimaan saat OPD approve
// ---------------------------------------------------------------------------

test('approve OPD men-generate sk_number + sk_issued_at sekali', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 5]);
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $signer = skSigner($opd);
    $app = skForwardedApplication($opd);

    $this->actingAs($admin)->post("/opd/pengajuan/{$app->id}/approve", [
        'division' => 'Aplikasi',
        'field_supervisor' => 'Pak Budi',
        'person_in_charge' => 'Bu Sari',
        'signer_id' => $signer->id,
    ])->assertRedirect();

    // Penomoran SK terjadi di SubmissionService::approve, jadi tetap berlaku
    // walau alur TTE membawa status ke waiting_tte (bukan langsung approved).
    $app->refresh();
    expect($app->sk_number)->toBe('503.11/1/401.106/'.now()->year)
        ->and($app->sk_issued_at?->toDateString())->toBe(now()->toDateString())
        ->and($app->status)->toBe(ApplicationStatus::WaitingTte);
});

test('nomor SK auto-increment antar approve + start number bisa diatur', function () {
    Storage::fake('local');
    Queue::fake();
    Storage::fake('local');
    $service = app(SkNumberService::class);
    $service->setStart(SkNumberService::KEY_ACCEPTANCE, 40);

    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 5]);
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $signer = skSigner($opd);

    foreach ([40, 41] as $expected) {
        $app = skForwardedApplication($opd);
        $this->actingAs($admin)->post("/opd/pengajuan/{$app->id}/approve", [
            'division' => 'Aplikasi',
            'field_supervisor' => 'Pak Budi',
            'person_in_charge' => 'Bu Sari',
            'signer_id' => $signer->id,
        ]);

        expect($app->refresh()->sk_number)->toBe("503.11/{$expected}/401.106/".now()->year);
    }
});

test('endpoint sk-counter mengatur start number (hanya verifikator)', function () {
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)
        ->patch('/verifikator/sk-counter', ['key' => 'acceptance', 'start_number' => 40])
        ->assertRedirect();

    expect(SkCounter::where('key', 'acceptance')->value('next_number'))->toBe(40);

    $mahasiswa = User::factory()->create();
    $this->actingAs($mahasiswa)
        ->patch('/verifikator/sk-counter', ['key' => 'acceptance', 'start_number' => 1])
        ->assertForbidden();
});

// ---------------------------------------------------------------------------
// R9 — Surat Penyelesaian Magang (nomor & tanggal statis, idempoten)
// Batch 5: aksinya kini milik Admin OPD di /opd/laporan/*.
// ---------------------------------------------------------------------------

test('generate surat penyelesaian: nomor statis walau diklik ulang', function () {
    Storage::fake('local');
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true, 'quota_total' => 5]);
    $adminOpd = User::factory()->opdAdmin($opd->id)->create();
    $mahasiswa = User::factory()->create();
    $app = InternshipApplication::factory()->create([
        'user_id' => $mahasiswa->id,
        'opd_id' => $opd->id,
        'status' => ApplicationStatus::Completed,
    ]);
    $report = FinalReport::create([
        'application_id' => $app->id,
        'file_name' => 'laporan.pdf',
        'file_path' => "reports/{$app->id}/laporan.pdf",
        'is_confirmed' => true,
        'status' => ReportStatus::Approved,
        'submitted_at' => now(),
    ]);

    $this->actingAs($adminOpd)
        ->post("/opd/laporan/{$report->id}/surat-penyelesaian")
        ->assertRedirect();

    $report->refresh();
    $firstNumber = $report->completion_sk_number;
    expect($firstNumber)->not->toBeNull()
        ->and($report->completion_letter_path)->not->toBeNull();
    Storage::disk('local')->assertExists($report->completion_letter_path);

    // Klik ulang → nomor & tanggal TIDAK berubah.
    $this->actingAs($adminOpd)
        ->post("/opd/laporan/{$report->id}/surat-penyelesaian");

    expect($report->refresh()->completion_sk_number)->toBe($firstNumber);

    // Unduhan tersedia.
    $this->actingAs($adminOpd)
        ->get("/opd/laporan/{$report->id}/surat-penyelesaian")
        ->assertOk();
});
