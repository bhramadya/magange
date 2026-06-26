<?php

use App\Enums\RateLimitIdentifierType;
use App\Models\FormRateLimit;
use App\Services\RateLimitService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->service = new RateLimitService;
});

test('check returns true when under the limit', function () {
    expect($this->service->check('budi@example.com', 'otp_request', 3, 15))->toBeTrue();
});

test('check returns false once the limit is reached', function () {
    foreach (range(1, 3) as $ignored) {
        $this->service->log('budi@example.com', 'otp_request', '127.0.0.1');
    }

    expect($this->service->check('budi@example.com', 'otp_request', 3, 15))->toBeFalse();
});

test('check ignores attempts outside the time window', function () {
    FormRateLimit::create([
        'ip_address' => '127.0.0.1',
        'identifier' => 'budi@example.com',
        'identifier_type' => RateLimitIdentifierType::Email,
        'action_type' => 'otp_request',
        'submitted_at' => now()->subMinutes(30),
    ]);

    expect($this->service->check('budi@example.com', 'otp_request', 1, 15))->toBeTrue();
});

test('log records an attempt and infers the identifier type', function () {
    $this->service->log('budi@example.com', 'otp_request', '10.0.0.1');
    $this->service->log('08123456789', 'otp_request', '10.0.0.1');

    $email = FormRateLimit::where('identifier', 'budi@example.com')->sole();
    $whatsapp = FormRateLimit::where('identifier', '08123456789')->sole();

    expect($email->identifier_type)->toBe(RateLimitIdentifierType::Email)
        ->and($email->action_type)->toBe('otp_request')
        ->and($email->ip_address)->toBe('10.0.0.1')
        ->and($whatsapp->identifier_type)->toBe(RateLimitIdentifierType::Whatsapp);
});
