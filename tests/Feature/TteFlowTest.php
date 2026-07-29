<?php

use App\Enums\ApplicationStatus;
use App\Jobs\GenerateJobAcceptanceLetter;
use App\Jobs\SendSignedAcceptanceLetterJob;
use App\Jobs\SendSignedCertificateJob;
use App\Models\Certificate;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\OpdSigner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

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

test('approval with signer creates a draft and waits for TTE without queuing email', function () {
    Storage::fake('local');
    Queue::fake();
    $opd = tteOpd();
    $admin = User::factory()->opdAdmin($opd->id)->create();
    $signer = OpdSigner::create(['opd_id' => $opd->id, 'name' => 'Budi Santoso', 'title' => 'Kepala Dinas', 'nip' => '198001012001011001', 'is_primary' => true]);
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
    $signer = OpdSigner::create(['opd_id' => $opd->id, 'name' => 'Budi Santoso', 'title' => 'Kepala Dinas', 'nip' => '198001012001011001', 'is_primary' => true]);
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
