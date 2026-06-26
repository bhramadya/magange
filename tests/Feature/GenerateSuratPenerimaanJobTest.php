<?php

use App\Enums\ApplicationStatus;
use App\Jobs\GenerateJobAcceptanceLetter;
use App\Mail\AcceptanceLetterMail;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function approvedApplication(): InternshipApplication
{
    $user = User::factory()->create();
    $opd = Opd::create([
        'name' => 'Dinas Komunikasi dan Informatika',
        'code' => 'KOMINFO',
        'is_active' => true,
        'quota_total' => 10,
        'quota_used' => 1,
    ]);

    return InternshipApplication::create([
        'ticket_number' => 'MGG-2026-0007',
        'user_id' => $user->id,
        'tujuan_magang' => 'Pengembangan web',
        'duration_months' => 3,
        'start_date' => '2026-07-01',
        'end_date' => '2026-09-30',
        'institution_name' => 'Universitas Negeri Madiun',
        'campus_supervisor' => 'Dr. Andi',
        'status' => ApplicationStatus::Approved,
        'opd_id' => $opd->id,
        'division' => 'Bidang Persandian',
        'field_supervisor' => 'Budi Santoso',
    ]);
}

test('job generates the pdf, stores it, records the path, and emails it', function () {
    Storage::fake('local');
    Mail::fake();

    $app = approvedApplication();

    (new GenerateJobAcceptanceLetter($app))->handle();

    $expectedPath = "acceptance-letter/{$app->id}/surat-penerimaan-{$app->ticket_number}.pdf";

    // PDF tersimpan di disk privat.
    Storage::disk('local')->assertExists($expectedPath);

    // Isi file benar-benar PDF.
    expect(Storage::disk('local')->get($expectedPath))->toStartWith('%PDF');

    // Path tercatat di pengajuan.
    expect($app->refresh()->surat_penerimaan_path)->toBe($expectedPath);

    // Email surat penerimaan dikirim ke pemohon dengan lampiran.
    Mail::assertSent(AcceptanceLetterMail::class, function (AcceptanceLetterMail $mail) use ($app) {
        return $mail->hasTo($app->user->email)
            && $mail->application->is($app)
            && $mail->pdfPath === $app->surat_penerimaan_path;
    });
});

test('job is queued on the emails queue with retry settings', function () {
    $app = approvedApplication();
    $job = new GenerateJobAcceptanceLetter($app);

    expect($job->queue)->toBe('emails')
        ->and($job->tries)->toBe(3)
        ->and($job->backoff)->toBe([30, 60, 120]);
});
