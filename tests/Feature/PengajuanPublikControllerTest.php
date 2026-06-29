<?php

use App\Enums\ApplicationStatus;
use App\Enums\RateLimitIdentifierType;
use App\Jobs\SendApplicationConfirmationJob;
use App\Models\FormRateLimit;
use App\Models\InternshipApplication;
use Illuminate\Support\Facades\Queue;

/**
 * @param  array<string, mixed>  $override
 * @return array<string, mixed>
 */
function validPengajuan(array $override = []): array
{
    return array_merge([
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Belajar pengembangan web di lingkungan pemerintahan.',
        'duration_months' => 3,
        'start_date' => now()->addWeek()->format('Y-m-d'),
        'end_date' => now()->addWeek()->addMonths(3)->format('Y-m-d'),
        'institution_name' => 'Universitas Negeri Madiun',
        'campus_supervisor' => 'Dr. Andi Wijaya',
    ], $override);
}

test('pengajuan publik berhasil membuat application dengan tiket MGG', function () {
    Queue::fake();

    $response = $this->post('/pengajuan', validPengajuan());

    $response->assertRedirect('/');
    $response->assertSessionHas('success');

    expect(InternshipApplication::count())->toBe(1);

    $application = InternshipApplication::first();
    expect($application->status)->toBe(ApplicationStatus::PendingVerifikator)
        ->and($application->ticket_number)->toMatch('/^MGG-\d{4}-\d{4,}$/');

    Queue::assertPushed(SendApplicationConfirmationJob::class);
});

test('pengajuan diblokir saat melewati batas harian', function () {
    Queue::fake();

    // Tiga pengajuan dari email yang sama dalam 24 jam = batas tercapai.
    foreach (range(1, 3) as $ignored) {
        FormRateLimit::create([
            'ip_address' => '127.0.0.1',
            'identifier' => 'budi@example.com',
            'identifier_type' => RateLimitIdentifierType::Email,
            'action_type' => 'submit_pengajuan',
            'submitted_at' => now(),
        ]);
    }

    $response = $this->post('/pengajuan', validPengajuan());

    $response->assertSessionHasErrors('email');
    expect(InternshipApplication::count())->toBe(0);
    Queue::assertNotPushed(SendApplicationConfirmationJob::class);
});

test('pengajuan menolak tanggal selesai sebelum tanggal mulai', function () {
    $response = $this->post('/pengajuan', validPengajuan([
        'start_date' => now()->addMonths(3)->format('Y-m-d'),
        'end_date' => now()->addWeek()->format('Y-m-d'),
    ]));

    $response->assertSessionHasErrors('end_date');
    expect(InternshipApplication::count())->toBe(0);
});
