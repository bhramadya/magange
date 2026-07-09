<?php

use App\Models\InternshipApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * @return array<string, mixed>
 */
function validPengajuan(array $overrides = []): array
{
    return array_merge([
        'name' => 'Budi Santoso',
        'nis' => '2021001',
        'email' => 'budi@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'DINAS KOMUNIKASI DAN INFORMATIKA',
        'duration_months' => 3,
        'start_date' => now()->addMonth()->toDateString(),
        'end_date' => now()->addMonths(4)->toDateString(),
        'institution_name' => 'Universitas Negeri Madiun',
        'address' => 'Jl. Merdeka No. 1, Madiun',
        'campus_supervisor' => 'Dr. Andi',
        'guardian_name' => 'Slamet Santoso',
        'recaptcha_token' => 'test-token',
    ], $overrides);
}

test('reCAPTCHA sukses melewatkan pengajuan', function () {
    Queue::fake();
    config(['services.recaptcha.secret' => 'test-secret']);
    Http::fake(['*siteverify*' => Http::response(['success' => true])]);

    $response = $this->post('/pengajuan', validPengajuan());

    // Alur Fase 1: submit sukses mengarahkan ke login-otp (OTP terkirim).
    $response->assertRedirect(route('login.otp'));
    expect(InternshipApplication::count())->toBe(1);
});

test('reCAPTCHA gagal menolak pengajuan', function () {
    Queue::fake();
    config(['services.recaptcha.secret' => 'test-secret']);
    Http::fake(['*siteverify*' => Http::response(['success' => false])]);

    $response = $this->post('/pengajuan', validPengajuan());

    $response->assertSessionHasErrors('recaptcha_token');
    expect(InternshipApplication::count())->toBe(0);
});

test('field pendaftaran tambahan tersimpan termasuk pas foto', function () {
    Queue::fake();
    Storage::fake('local');

    $this->post('/pengajuan', validPengajuan([
        'photo' => UploadedFile::fake()->image('foto.jpg', 300, 400),
    ]));

    $app = InternshipApplication::firstOrFail();
    expect($app->nis)->toBe('2021001')
        ->and($app->address)->toBe('Jl. Merdeka No. 1, Madiun')
        ->and($app->guardian_name)->toBe('Slamet Santoso')
        ->and($app->photo_path)->not->toBeNull();
    Storage::disk('local')->assertExists($app->photo_path);
});

test('gerbang rate-limit memblokir pengajuan berlebih', function () {
    Queue::fake();

    // 5 pengajuan pertama lolos; ke-6 dalam window harus diblokir.
    for ($i = 0; $i < 5; $i++) {
        $this->post('/pengajuan', validPengajuan())->assertRedirect(route('login.otp'));
    }

    $response = $this->post('/pengajuan', validPengajuan());

    $response->assertSessionHasErrors('email');
    expect(InternshipApplication::count())->toBe(5);
});

test('durasi dihitung otomatis dari rentang tanggal', function () {
    Queue::fake();

    $this->post('/pengajuan', validPengajuan([
        'start_date' => now()->addMonth()->toDateString(),
        'end_date' => now()->addMonths(4)->toDateString(),
        'duration_months' => null,
    ]));

    expect(InternshipApplication::firstOrFail()->duration_months)->toBe(3);
});
