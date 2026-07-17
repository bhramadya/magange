<?php

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * Payload minimal valid untuk POST /pengajuan.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function pengajuanFormPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Belajar web development',
        'duration_months' => 3,
        'start_date' => now()->addMonth()->toDateString(),
        'end_date' => now()->addMonths(4)->toDateString(),
        'institution_name' => 'Universitas Negeri Madiun',
        'address' => 'Jl. Merdeka No. 1, Madiun',
        'campus_supervisor' => 'Dr. Andi',
        'campus_supervisor_whatsapp' => '081311112222',
        'guardian_name' => 'Slamet Santoso',
        'guardian_whatsapp' => '081333334444',
    ], $overrides);
}

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

    $response = $this->post('/pengajuan', pengajuanFormPayload());

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

    $this->post('/pengajuan', pengajuanFormPayload([
        'name' => 'New User',
        'email' => 'newuser@example.com',
        'tujuan_magang' => 'Test',
        'duration_months' => 2,
        'end_date' => now()->addMonths(3)->toDateString(),
        'institution_name' => 'Test University',
        'guardian_name' => 'Wali Test',
    ]));

    expect(User::where('email', 'newuser@example.com')->exists())->toBeTrue();
});

test('application submission reuses existing user', function () {
    Queue::fake();

    $existingUser = User::factory()->create(['email' => 'existing@example.com']);

    $this->post('/pengajuan', pengajuanFormPayload([
        'name' => 'Updated Name',
        'email' => 'existing@example.com',
        'tujuan_magang' => 'Test',
        'duration_months' => 2,
        'end_date' => now()->addMonths(3)->toDateString(),
        'institution_name' => 'Test University',
        'guardian_name' => 'Wali Test',
    ]));

    expect(User::where('email', 'existing@example.com')->count())->toBe(1);

    $application = InternshipApplication::first();
    expect($application->user_id)->toBe($existingUser->id);
});

test('lacak looks up an application by ticket number', function () {
    $user = User::factory()->create();
    $application = InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'ticket_number' => 'MGG-2026-000123',
    ]);

    $response = $this->get('/lacak?tiket=MGG-2026-000123');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('lacak')
        ->where('ticket', 'MGG-2026-000123')
        ->where('application.ticket_number', 'MGG-2026-000123')
        ->where('application.status', $application->status->value)
    );
});

test('lacak returns null application for unknown ticket', function () {
    $response = $this->get('/lacak?tiket=MGG-2026-999999');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('lacak')
        ->where('application', null)
        ->where('ticket', 'MGG-2026-999999')
    );
});

test('lacak without a ticket renders an idle page', function () {
    $response = $this->get('/lacak');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('lacak')
        ->where('application', null)
        ->where('ticket', null)
    );
});

test('lacak does not expose applicant personal data publicly', function () {
    $user = User::factory()->create([
        'name' => 'Budi Rahasia',
        'email' => 'rahasia@example.com',
    ]);
    InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'ticket_number' => 'MGG-2026-000200',
        'nis' => '123456',
        'address' => 'Jl. Rahasia No. 9',
        'campus_supervisor' => 'Dr. Rahasia',
    ]);

    $response = $this->get('/lacak?tiket=MGG-2026-000200');

    $response->assertInertia(fn ($page) => $page
        ->where('application.ticket_number', 'MGG-2026-000200')
        ->missing('application.applicant_name')
        ->missing('application.applicant_email')
        ->missing('application.nis')
        ->missing('application.address')
        ->missing('application.campus_supervisor')
        ->missing('application.photo_url')
    );
});

test('application persists optional major and skills', function () {
    Queue::fake();

    $this->post('/pengajuan', pengajuanFormPayload([
        'name' => 'Sari Dewi',
        'email' => 'sari@example.com',
        'tujuan_magang' => 'Belajar UI/UX',
        'major' => 'Teknik Informatika',
        'skills' => 'Figma, React, penulisan teknis',
    ]));

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

test('registration stores optional supporting documents', function () {
    Queue::fake();
    Storage::fake('local');

    $this->post('/pengajuan', pengajuanFormPayload([
        'surat_pengantar' => UploadedFile::fake()->create('pengantar.pdf', 120, 'application/pdf'),
        'cv' => UploadedFile::fake()->create('cv.pdf', 120, 'application/pdf'),
        'portfolio' => UploadedFile::fake()->create('porto.pdf', 120, 'application/pdf'),
    ]))->assertRedirect(route('login.otp'));

    $application = InternshipApplication::first();

    expect($application->surat_pengantar_path)->not->toBeNull();
    expect($application->cv_path)->not->toBeNull();
    expect($application->portfolio_path)->not->toBeNull();

    Storage::disk('local')->assertExists($application->surat_pengantar_path);
    Storage::disk('local')->assertExists($application->cv_path);
    Storage::disk('local')->assertExists($application->portfolio_path);
});

test('supporting documents are optional', function () {
    Queue::fake();
    Storage::fake('local');

    $this->post('/pengajuan', pengajuanFormPayload())->assertRedirect(route('login.otp'));

    $application = InternshipApplication::first();
    expect($application->surat_pengantar_path)->toBeNull();
    expect($application->cv_path)->toBeNull();
    expect($application->portfolio_path)->toBeNull();
});

test('registration rejects an oversized supporting document', function () {
    Queue::fake();
    Storage::fake('local');

    $response = $this->post('/pengajuan', pengajuanFormPayload([
        'cv' => UploadedFile::fake()->create('cv.pdf', 3000, 'application/pdf'), // >2MB
    ]));

    $response->assertSessionHasErrors('cv');
});

test('registration rejects an oversized surat pengantar', function () {
    Queue::fake();
    Storage::fake('local');

    $response = $this->post('/pengajuan', pengajuanFormPayload([
        'surat_pengantar' => UploadedFile::fake()->create('pengantar.pdf', 3000, 'application/pdf'), // >2MB
    ]));

    $response->assertSessionHasErrors('surat_pengantar');
});

test('registration rejects an oversized portfolio', function () {
    Queue::fake();
    Storage::fake('local');

    $response = $this->post('/pengajuan', pengajuanFormPayload([
        'portfolio' => UploadedFile::fake()->create('porto.pdf', 11000, 'application/pdf'), // >10MB
    ]));

    $response->assertSessionHasErrors('portfolio');
});

test('registration accepts a portfolio between 2MB and 10MB', function () {
    Queue::fake();
    Storage::fake('local');

    $this->post('/pengajuan', pengajuanFormPayload([
        'portfolio' => UploadedFile::fake()->create('porto.pdf', 5000, 'application/pdf'), // ±5MB
    ]))->assertRedirect(route('login.otp'));

    expect(InternshipApplication::first()->portfolio_path)->not->toBeNull();
});

test('registration photo becomes the user avatar', function () {
    Queue::fake();
    Storage::fake('local');

    $this->post('/pengajuan', pengajuanFormPayload([
        'email' => 'foto@example.com',
        'photo' => UploadedFile::fake()->create('foto.jpg', 200, 'image/jpeg'),
    ]))->assertRedirect(route('login.otp'));

    $application = InternshipApplication::first();
    $user = $application->user;

    expect($user->avatar_path)->not->toBeNull();
    expect($user->avatar_path)->toBe($application->photo_path);
    Storage::disk('local')->assertExists($user->avatar_path);
});

test('profile avatar route streams the current users avatar', function () {
    Storage::fake('local');

    $path = UploadedFile::fake()->create('a.jpg', 200, 'image/jpeg')->store('applications/photos', 'local');
    $user = User::factory()->create(['avatar_path' => $path]);

    $this->actingAs($user)->get(route('profile.avatar'))->assertOk();
});

test('profile avatar returns 404 when the user has none', function () {
    $user = User::factory()->create(['avatar_path' => null]);

    $this->actingAs($user)->get(route('profile.avatar'))->assertNotFound();
});
