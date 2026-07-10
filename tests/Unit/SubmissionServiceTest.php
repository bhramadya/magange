<?php

use App\Enums\ApplicationStatus;
use App\Enums\UserRole;
use App\Jobs\GenerateJobAcceptanceLetter;
use App\Jobs\SendApplicationConfirmationJob;
use App\Jobs\SendJobRejectionEmail;
use App\Models\ApplicationStatusLog;
use App\Models\Opd;
use App\Models\User;
use App\Services\OtpService;
use App\Services\RateLimitService;
use App\Services\SubmissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $rateLimit = new RateLimitService;
    $this->service = new SubmissionService($rateLimit, new OtpService($rateLimit));
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
        'verifikator_note' => 'Kandidat kuat, berkas lengkap.',
    ], $verifikator);

    $app->refresh();

    expect($app->status)->toBe(ApplicationStatus::ForwardedOpd)
        ->and($app->opd_id)->toBe($opd->id)
        ->and($app->verifikator_note)->toBe('Kandidat kuat, berkas lengkap.')
        // Penempatan belum diisi di tahap ini — itu tugas Admin OPD saat approve.
        ->and($app->division)->toBeNull()
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

    $this->service->approve($app, [
        'division' => 'Bidang Aplikasi',
        'field_supervisor' => 'Pak Joko',
        'person_in_charge' => 'Bu Sari',
    ], $opdAdmin);

    $app->refresh();

    expect($app->status)->toBe(ApplicationStatus::Approved)
        ->and($app->division)->toBe('Bidang Aplikasi')
        ->and($app->field_supervisor)->toBe('Pak Joko')
        ->and($app->person_in_charge)->toBe('Bu Sari')
        ->and($app->opd_decision_by)->toBe($opdAdmin->id)
        ->and($app->opd_decision_at)->not->toBeNull()
        ->and($opd->refresh()->quota_used)->toBe(1);

    Queue::assertPushed(GenerateJobAcceptanceLetter::class);
});

test('approve refuses when the OPD quota is already full', function () {
    Queue::fake();
    // Kuota penuh: quota_used == quota_total. Approve tidak boleh menembus batas.
    $opd = Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'quota_total' => 1, 'quota_used' => 1]);
    $verifikator = User::factory()->verifikator()->create();
    $opdAdmin = User::factory()->opdAdmin($opd->id)->create();
    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');
    $this->service->forwardToOpd($app, ['opd_id' => $opd->id], $verifikator);

    expect(fn () => $this->service->approve($app, [
        'division' => 'Bidang Aplikasi',
        'field_supervisor' => 'Pak Joko',
        'person_in_charge' => 'Bu Sari',
    ], $opdAdmin))->toThrow(DomainException::class);

    // Tidak ada efek samping: kuota tak bertambah, status tetap forwarded.
    expect($opd->refresh()->quota_used)->toBe(1)
        ->and($app->refresh()->status)->toBe(ApplicationStatus::ForwardedOpd);

    Queue::assertNotPushed(GenerateJobAcceptanceLetter::class);
});

test('approve rejects an application not forwarded to the OPD', function () {
    Queue::fake();
    $opdAdmin = User::factory()->create();
    $app = $this->service->submit(pengajuanPayload(), '127.0.0.1');

    $this->service->approve($app, [
        'division' => 'Bidang Aplikasi',
        'field_supervisor' => 'Pak Joko',
        'person_in_charge' => 'Bu Sari',
    ], $opdAdmin);
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
