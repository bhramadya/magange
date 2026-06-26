<?php

use App\Enums\ApplicationStatus;
use App\Enums\ReportStatus;
use App\Models\Certificate;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use App\Models\User;
use App\Services\CertificateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
    $this->service = new CertificateService;
});

function ongoingApplication(): InternshipApplication
{
    $user = User::factory()->create();

    return InternshipApplication::create([
        'ticket_number' => 'MGG-2026-0001',
        'user_id' => $user->id,
        'tujuan_magang' => 'Web development',
        'duration_months' => 3,
        'start_date' => '2026-07-01',
        'end_date' => '2026-09-30',
        'institution_name' => 'Universitas Negeri Madiun',
        'campus_supervisor' => 'Dr. Andi',
        'status' => ApplicationStatus::Ongoing,
    ]);
}

test('uploadCertificate stores the file, locks it, and completes the application', function () {
    Storage::fake('local');
    $actor = User::factory()->create();
    $app = ongoingApplication();
    $report = FinalReport::create([
        'application_id' => $app->id,
        'file_name' => 'laporan.pdf',
        'file_path' => 'reports/laporan.pdf',
        'is_confirmed' => true,
        'status' => ReportStatus::Approved,
        'submitted_at' => now(),
    ]);
    $file = UploadedFile::fake()->create('sertifikat.pdf', 100, 'application/pdf');

    $certificate = $this->service->uploadCertificate($report, $file, $actor);

    expect($certificate->is_download_locked)->toBeTrue()
        ->and($certificate->application_id)->toBe($app->id)
        ->and($certificate->uploaded_by)->toBe($actor->id)
        ->and($certificate->file_name)->toBe('sertifikat.pdf')
        ->and(str_starts_with($certificate->file_path, "certificates/{$app->id}/"))->toBeTrue()
        ->and($app->refresh()->status)->toBe(ApplicationStatus::Completed);

    Storage::disk('local')->assertExists($certificate->file_path);
});

test('unlock clears the download lock', function () {
    $actor = User::factory()->create();
    $app = ongoingApplication();
    $certificate = Certificate::create([
        'application_id' => $app->id,
        'file_name' => 'sertifikat.pdf',
        'file_path' => "certificates/{$app->id}/sertifikat.pdf",
        'is_download_locked' => true,
        'uploaded_by' => $actor->id,
    ]);

    $this->service->unlock($certificate);

    expect($certificate->refresh()->is_download_locked)->toBeFalse();
});
