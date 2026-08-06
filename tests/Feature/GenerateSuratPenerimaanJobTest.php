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

test('the sent email really carries the pdf as an attachment', function () {
    // Sengaja TANPA Mail::fake(): fake tidak pernah membangun pesan Symfony,
    // jadi lampiran yang hilang/rusak lolos begitu saja (tes di atas hanya
    // memeriksa string pdfPath). Transport 'array' (phpunit.xml) menyimpan
    // pesan yang sudah jadi, sehingga lampirannya bisa diperiksa sungguhan.
    Storage::fake('local');

    $app = approvedApplication();

    (new GenerateJobAcceptanceLetter($app))->handle();

    $message = Mail::mailer('array')->getSymfonyTransport()->messages()->last()->getOriginalMessage();
    $attachments = $message->getAttachments();

    expect($attachments)->toHaveCount(2);
    $pdf = collect($attachments)->first(
        fn ($attachment) => $attachment->getMediaType().'/'.$attachment->getMediaSubtype() === 'application/pdf'
    );
    $logo = collect($attachments)->first(
        fn ($attachment) => $attachment->getMediaType().'/'.$attachment->getMediaSubtype() === 'image/png'
    );

    expect($pdf)->not->toBeNull()
        ->and($pdf->getFilename())->toBe("surat-penerimaan-{$app->ticket_number}.pdf")
        // Isinya benar-benar PDF, bukan lampiran kosong/nol byte.
        ->and($pdf->getBody())->toStartWith('%PDF');
    expect($logo)->not->toBeNull();

    // Logo email disematkan inline (CID), bukan di-fetch dari APP_URL, jadi
    // email tetap menampilkan gambar walau APP_URL lokal/ngrok tidak hidup.
    expect($message->getHtmlBody())
        ->toContain('cid:')
        ->not->toContain('images/Lambang_Kota_Madiun.png');
});

test('job fails loudly when the pdf cannot be stored instead of emailing a letterless notice', function () {
    Mail::fake();

    // Disk 'local' punya 'throw' => false: put() gagal = false, bukan exception.
    $disk = Mockery::mock();
    $disk->shouldReceive('put')->once()->andReturnFalse();
    $disk->shouldReceive('exists')->andReturnFalse();
    Storage::shouldReceive('disk')->with('local')->andReturn($disk);

    $app = approvedApplication();

    expect(fn () => (new GenerateJobAcceptanceLetter($app))->handle())
        ->toThrow(RuntimeException::class);

    // Tidak ada email tanpa lampiran, dan path palsu tidak tercatat di pengajuan.
    Mail::assertNothingSent();
    expect($app->refresh()->surat_penerimaan_path)->toBeNull();
});

test('job is queued on the emails queue with retry settings', function () {
    $app = approvedApplication();
    $job = new GenerateJobAcceptanceLetter($app);

    expect($job->queue)->toBe('emails')
        ->and($job->tries)->toBe(3)
        ->and($job->backoff)->toBe([30, 60, 120]);
});
