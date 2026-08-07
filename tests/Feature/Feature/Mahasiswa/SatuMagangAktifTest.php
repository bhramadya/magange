<?php

use App\Contracts\PengajuanServiceContract;
use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * R2c — satu mahasiswa hanya boleh punya SATU magang aktif, dan tidak boleh
 * mendaftar lagi setelah menyelesaikan satu program magang.
 *
 * Aturannya ditegakkan dua lapis (endpoint pendaftaran terbuka untuk umum):
 *   1. StoreApplicationRequest::after()  → galat validasi di field `email`;
 *   2. SubmissionService::submit()/resubmit() → DomainException.
 * `rejected` sengaja TIDAK memblokir.
 *
 * @return array<string, mixed>
 */
function satuMagangPengajuan(array $overrides = []): array
{
    return array_merge([
        'name' => 'Budi Santoso',
        'nis' => '2021001',
        'email' => 'budi@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Pengembangan aplikasi web',
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addMonths(3)->toDateString(),
        'institution_name' => 'Universitas Negeri Madiun',
        'address' => 'Jl. Merdeka No. 1, Madiun',
        'campus_supervisor' => 'Dr. Andi',
        'campus_supervisor_whatsapp' => '081311112222',
        'major' => 'Teknik Informatika',
        'skills' => 'React, Laravel',
    ], $overrides);
}

function satuMagangUser(string $email = 'budi@example.com'): User
{
    return User::factory()->create(['email' => $email]);
}

// ---------------------------------------------------------------------------
// Pendaftaran baru
// ---------------------------------------------------------------------------

test('pendaftaran kedua ditolak selama pengajuan lama masih aktif', function (ApplicationStatus $status) {
    Queue::fake();
    $user = satuMagangUser();
    $lama = InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => $status,
    ]);

    $this->post('/pengajuan', satuMagangPengajuan())
        ->assertSessionHasErrors('email');

    // Tidak ada baris baru — pengajuan lama tetap satu-satunya.
    expect(InternshipApplication::count())->toBe(1)
        ->and(InternshipApplication::first()->id)->toBe($lama->id);
})->with([
    'pending_verifikator' => ApplicationStatus::PendingVerifikator,
    'forwarded_opd' => ApplicationStatus::ForwardedOpd,
    'waiting_tte' => ApplicationStatus::WaitingTte,
    'approved' => ApplicationStatus::Approved,
    'ongoing' => ApplicationStatus::Ongoing,
    'completion_submitted' => ApplicationStatus::CompletionSubmitted,
    'needs_certificate' => ApplicationStatus::NeedsCertificate,
]);

test('pesan galat menyebut nomor tiket yang sedang berjalan', function () {
    Queue::fake();
    $user = satuMagangUser();
    $lama = InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Ongoing,
    ]);

    $this->post('/pengajuan', satuMagangPengajuan())
        ->assertSessionHasErrors([
            'email' => "Email ini masih memiliki pengajuan magang yang sedang berjalan (tiket {$lama->ticket_number}). Selesaikan atau tunggu keputusannya sebelum mendaftar lagi.",
        ]);
});

test('alumni magang (completed) tidak boleh mendaftar lagi', function () {
    Queue::fake();
    $user = satuMagangUser();
    InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Completed,
    ]);

    $this->post('/pengajuan', satuMagangPengajuan())
        ->assertSessionHasErrors([
            'email' => 'Email ini sudah pernah menyelesaikan program magang. Pendaftaran ulang tidak diperbolehkan.',
        ]);

    expect(InternshipApplication::count())->toBe(1);
});

test('pengajuan ditolak tidak memblokir pendaftaran baru', function () {
    Queue::fake();
    $user = satuMagangUser();
    InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Rejected,
    ]);

    $this->post('/pengajuan', satuMagangPengajuan())
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('login.otp'));

    expect(InternshipApplication::where('user_id', $user->id)->count())->toBe(2);
});

test('email yang belum pernah mendaftar tetap lolos', function () {
    Queue::fake();

    $this->post('/pengajuan', satuMagangPengajuan(['email' => 'baru@example.com']))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('login.otp'));

    expect(InternshipApplication::count())->toBe(1);
});

// ---------------------------------------------------------------------------
// Lapis kedua: guard domain di service (tanpa lewat FormRequest)
// ---------------------------------------------------------------------------

test('guard service menolak submit walau validasi request dilewati', function () {
    Queue::fake();
    $user = satuMagangUser();
    InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Ongoing,
    ]);

    $service = app(PengajuanServiceContract::class);

    expect(fn () => $service->submit([
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Pengembangan aplikasi web',
        'duration_months' => 3,
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addMonths(3)->toDateString(),
        'institution_name' => 'Universitas Negeri Madiun',
        'address' => 'Jl. Merdeka No. 1, Madiun',
        'campus_supervisor' => 'Dr. Andi',
        'campus_supervisor_whatsapp' => '081311112222',
    ], '127.0.0.1'))->toThrow(DomainException::class);

    expect(InternshipApplication::count())->toBe(1);
});

test('galat lapis kedua tampil sebagai pesan di field email, bukan 500', function () {
    Queue::fake();

    // Endpoint /pengajuan publik: dua POST bersamaan dari email yang sama
    // sama-sama lolos StoreApplicationRequest, lalu yang kedua kena guard
    // domain di dalam service. Kondisi balapan itu tidak bisa dibuat andal
    // lewat HTTP, jadi lapisannya diuji langsung: service melempar, controller
    // wajib menerjemahkannya jadi galat validasi.
    $this->mock(PengajuanServiceContract::class)
        ->shouldReceive('submit')
        ->once()
        ->andThrow(new DomainException('Email ini masih memiliki pengajuan magang yang sedang berjalan.'));

    $this->post('/pengajuan', satuMagangPengajuan())
        ->assertRedirect()
        ->assertSessionHasErrors([
            'email' => 'Email ini masih memiliki pengajuan magang yang sedang berjalan.',
        ]);
});

// ---------------------------------------------------------------------------
// Ajukan Ulang
// ---------------------------------------------------------------------------

test('ajukan ulang tetap jalan bila tidak ada pengajuan aktif lain', function () {
    Queue::fake();
    Storage::fake('local');
    $user = satuMagangUser();
    $ditolak = InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Rejected,
    ]);

    $this->actingAs($user)
        ->post("/mahasiswa/pengajuan/{$ditolak->id}/ajukan-ulang")
        ->assertRedirect(route('mahasiswa.pengajuan'));

    expect(InternshipApplication::count())->toBe(2);
});

test('ajukan ulang ditolak bila sudah punya pengajuan aktif lain', function () {
    Queue::fake();
    $user = satuMagangUser();
    $ditolak = InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Rejected,
    ]);
    InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Ongoing,
    ]);

    $this->actingAs($user)
        ->post("/mahasiswa/pengajuan/{$ditolak->id}/ajukan-ulang")
        ->assertSessionHasErrors('resubmit');

    expect(InternshipApplication::count())->toBe(2);
});

test('ajukan ulang ditolak bila peserta sudah pernah menyelesaikan magang', function () {
    Queue::fake();
    $user = satuMagangUser();
    $ditolak = InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Rejected,
    ]);
    InternshipApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Completed,
    ]);

    $this->actingAs($user)
        ->post("/mahasiswa/pengajuan/{$ditolak->id}/ajukan-ulang")
        ->assertSessionHasErrors('resubmit');

    expect(InternshipApplication::count())->toBe(2);
});
