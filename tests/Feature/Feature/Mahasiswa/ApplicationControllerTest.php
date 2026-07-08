<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('application form displays available opds', function () {
    Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);

    $response = $this->get('/pengajuan/baru');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('mahasiswa/application/create')
        ->has('opds', 1)
    );
})->skip('Halaman form khusus mahasiswa/application/create belum dibuat; form pendaftaran hidup ada di welcome.tsx (#daftar).');

test('user can submit a new application', function () {
    Queue::fake();

    $response = $this->post('/pengajuan', [
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Belajar web development',
        'duration_months' => 3,
        'start_date' => now()->addMonth()->toDateString(),
        'end_date' => now()->addMonths(4)->toDateString(),
        'institution_name' => 'Universitas Negeri Madiun',
        'campus_supervisor' => 'Dr. Andi',
    ]);

    // Alur Fase 1: setelah submit, peserta diarahkan ke login-otp (OTP terkirim).
    $response->assertRedirect(route('login.otp'));
    $response->assertSessionHas('email', 'budi@example.com');

    expect(InternshipApplication::count())->toBe(1);

    $application = InternshipApplication::first();
    expect($application->status)->toBe(ApplicationStatus::PendingVerifikator);
    expect($application->ticket_number)->toStartWith('MGG-');
});

test('application submission creates user if not exists', function () {
    Queue::fake();

    $this->post('/pengajuan', [
        'name' => 'New User',
        'email' => 'newuser@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Test',
        'duration_months' => 2,
        'start_date' => now()->addMonth()->toDateString(),
        'end_date' => now()->addMonths(3)->toDateString(),
        'institution_name' => 'Test University',
        'campus_supervisor' => 'Dr. Test',
    ]);

    expect(User::where('email', 'newuser@example.com')->exists())->toBeTrue();
});

test('application submission reuses existing user', function () {
    Queue::fake();

    $existingUser = User::factory()->create(['email' => 'existing@example.com']);

    $this->post('/pengajuan', [
        'name' => 'Updated Name',
        'email' => 'existing@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Test',
        'duration_months' => 2,
        'start_date' => now()->addMonth()->toDateString(),
        'end_date' => now()->addMonths(3)->toDateString(),
        'institution_name' => 'Test University',
        'campus_supervisor' => 'Dr. Test',
    ]);

    expect(User::where('email', 'existing@example.com')->count())->toBe(1);

    $application = InternshipApplication::first();
    expect($application->user_id)->toBe($existingUser->id);
});

test('track page filters applications by email', function () {
    $user = User::factory()->create(['email' => 'track@example.com']);

    InternshipApplication::factory()->create(['user_id' => $user->id]);
    InternshipApplication::factory()->create(); // Different user

    $response = $this->get('/lacak?email=track@example.com');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('lacak')
        ->has('applications', 1)
        ->where('email', 'track@example.com')
    );
});

test('application persists optional major and skills', function () {
    Queue::fake();

    $this->post('/pengajuan', [
        'name' => 'Sari Dewi',
        'email' => 'sari@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Belajar UI/UX',
        'duration_months' => 3,
        'start_date' => now()->addMonth()->toDateString(),
        'end_date' => now()->addMonths(4)->toDateString(),
        'institution_name' => 'Universitas Negeri Madiun',
        'campus_supervisor' => 'Dr. Andi',
        'major' => 'Teknik Informatika',
        'skills' => 'Figma, React, penulisan teknis',
    ]);

    $application = InternshipApplication::first();
    expect($application->major)->toBe('Teknik Informatika');
    expect($application->skills)->toBe('Figma, React, penulisan teknis');
});

test('application requires valid dates', function () {
    $response = $this->post('/pengajuan', [
        'name' => 'Test',
        'email' => 'test@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Test',
        'duration_months' => 2,
        'start_date' => now()->addMonths(4)->toDateString(),
        'end_date' => now()->addMonth()->toDateString(), // End before start
        'institution_name' => 'Test University',
        'campus_supervisor' => 'Dr. Test',
    ]);

    $response->assertSessionHasErrors('end_date');
});
