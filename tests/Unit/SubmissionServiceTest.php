<?php

use App\Enums\ApplicationStatus;
use App\Enums\UserRole;
use App\Jobs\GenerateJobAcceptanceLetter;
use App\Jobs\SendApplicationConfirmationJob;
use App\Jobs\SendJobRejectionEmail;
use App\Models\ApplicationStatusLog;
use App\Models\Opd;
use App\Models\User;
use App\Services\RateLimitService;
use App\Services\SubmissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->service = new SubmissionService(new RateLimitService);
});

/**
 * @return array<string, mixed>
 */
function pengajuanPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Web development',
        'duration_months' => 3,
        'start_date' => '2026-07-01',
        'end_date' => '2026-09-30',
        'institution_name' => 'Universitas Negeri Madiun',
        'campus_supervisor' => 'Dr. Andi',
    ], $overrides);
}

test('submit creates a pending application for a new user', function () {
    Queue::fake();

    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');

    expect($app->status)->toBe(ApplicationStatus::PendingVerifikator)
        ->and($app->ticket_number)->toStartWith('MGG-')
        ->and(User::where('email', 'budi@example.com')->where('role', UserRole::Mahasiswa)->exists())->toBeTrue()
        ->and(ApplicationStatusLog::where('application_id', $app->id)->where('to_status', 'pending_verifikator')->exists())->toBeTrue();

    Queue::assertPushed(SendApplicationConfirmationJob::class);
});

test('submit reuses an existing user by email', function () {
    Queue::fake();
    $user = User::factory()->create(['email' => 'budi@example.com']);

    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');

    expect($app->user_id)->toBe($user->id)
        ->and(User::where('email', 'budi@example.com')->count())->toBe(1);
});

test('forwardToOpd moves a pending application to the OPD', function () {
    Queue::fake();
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI']);
    $verifikator = User::factory()->verifikator()->create();
    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');

    $this->service->forwardToOpd($app, [
        'opd_id' => $opd->id,
        'division' => 'IT',
        'field_supervisor' => 'Pak Joko',
        'person_in_charge' => 'Bu Sari',
    ], $verifikator);

    $app->refresh();

    expect($app->status)->toBe(ApplicationStatus::ForwardedOpd)
        ->and($app->opd_id)->toBe($opd->id)
        ->and($app->division)->toBe('IT')
        ->and($app->forwarded_by)->toBe($verifikator->id)
        ->and($app->forwarded_at)->not->toBeNull();
});

test('forwardToOpd rejects an application that is not pending verifikator', function () {
    Queue::fake();
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI']);
    $verifikator = User::factory()->verifikator()->create();
    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');
    $app->update(['status' => ApplicationStatus::Approved]);

    $this->service->forwardToOpd($app, ['opd_id' => $opd->id], $verifikator);
})->throws(DomainException::class);

test('approve accepts a forwarded application and increments the OPD quota', function () {
    Queue::fake();
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'quota_total' => 5]);
    $verifikator = User::factory()->verifikator()->create();
    $opdAdmin = User::factory()->opdAdmin($opd->id)->create();
    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');
    $this->service->forwardToOpd($app, ['opd_id' => $opd->id], $verifikator);

    $this->service->approve($app, $opdAdmin);

    $app->refresh();

    expect($app->status)->toBe(ApplicationStatus::Approved)
        ->and($app->opd_decision_by)->toBe($opdAdmin->id)
        ->and($app->opd_decision_at)->not->toBeNull()
        ->and($opd->refresh()->quota_used)->toBe(1);

    Queue::assertPushed(GenerateJobAcceptanceLetter::class);
});

test('approve rejects an application not forwarded to the OPD', function () {
    Queue::fake();
    $opdAdmin = User::factory()->create();
    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');

    $this->service->approve($app, $opdAdmin);
})->throws(DomainException::class);

test('reject marks a pending application rejected with a reason', function () {
    Queue::fake();
    $verifikator = User::factory()->verifikator()->create();
    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');

    $this->service->reject($app, $verifikator, 'Berkas tidak lengkap');

    $app->refresh();

    expect($app->status)->toBe(ApplicationStatus::Rejected)
        ->and($app->rejection_reason)->toBe('Berkas tidak lengkap')
        ->and($app->opd_decision_by)->toBe($verifikator->id);

    Queue::assertPushed(SendJobRejectionEmail::class);
});

test('reject is not allowed once an application is completed', function () {
    Queue::fake();
    $verifikator = User::factory()->verifikator()->create();
    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');
    $app->update(['status' => ApplicationStatus::Completed]);

    $this->service->reject($app, $verifikator, 'apa pun');
})->throws(DomainException::class);
