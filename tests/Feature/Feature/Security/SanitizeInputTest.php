<?php

use App\Models\InternshipApplication;
use App\Models\Opd;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

/**
 * R7 — Sanitasi global input (middleware SanitizeInput):
 * tag <script>, atribut on*, dan URI javascript: dibersihkan; karakter
 * strip (-) dan tanda baca umum tetap lolos.
 */
function sanitizePayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Budi Santoso',
        'nis' => 'A2021001',
        'email' => 'budi@example.com',
        'whatsapp_number' => '08123456789',
        'tujuan_magang' => 'Dinas Kominfo',
        'duration_months' => 3,
        'start_date' => now()->addMonth()->toDateString(),
        'end_date' => now()->addMonths(4)->toDateString(),
        'institution_name' => 'Universitas Negeri Madiun',
        'address' => 'Jl. Merdeka No. 1, Madiun',
        'campus_supervisor' => 'Dr. Andi',
        'campus_supervisor_whatsapp' => '081311112222',
    ], $overrides);
}

test('input berisi script tag tersimpan bersih', function () {
    Queue::fake();
    Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);

    $this->post('/pengajuan', sanitizePayload([
        'skills' => 'Desain<script>alert(1)</script> grafis',
        'address' => '<a href="javascript:alert(1)" onclick="steal()">Jl. Merdeka No. 1</a>',
    ]))->assertRedirect();

    $app = InternshipApplication::firstOrFail();
    expect($app->skills)->toBe('Desain grafis')
        ->and($app->skills)->not->toContain('<script>')
        ->and($app->address)->not->toContain('javascript:')
        ->and($app->address)->not->toContain('onclick');
});

test('karakter strip dan tanda baca umum tetap utuh', function () {
    Queue::fake();
    Opd::create(['name' => 'Dinas Kominfo', 'code' => 'DKI', 'is_active' => true]);

    $this->post('/pengajuan', sanitizePayload([
        'major' => 'D-3 Teknik Informatika',
        'skills' => 'React, Laravel & PostgreSQL (tingkat lanjut) - 3 tahun',
    ]))->assertRedirect();

    $app = InternshipApplication::firstOrFail();
    expect($app->major)->toBe('D-3 Teknik Informatika')
        ->and($app->skills)->toBe('React, Laravel & PostgreSQL (tingkat lanjut) - 3 tahun');
});
