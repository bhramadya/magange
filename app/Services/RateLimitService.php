<?php

namespace App\Services;

use App\Enums\RateLimitIdentifierType;
use App\Models\FormRateLimit;
use Illuminate\Support\Facades\Date;

class RateLimitService
{
    /**
     * Apakah aksi ini masih di bawah batas?
     * true  = boleh lanjut (jumlah percobaan < $max dalam jendela waktu)
     * false = sudah melewati batas.
     */
    public function check(string $identifier, string $actionType, int $max, int $windowMinutes): bool
    {
        $since = Date::now()->subMinutes($windowMinutes);

        $attempts = FormRateLimit::query()
            ->where('identifier', $identifier)
            ->where('action_type', $actionType)
            ->where('submitted_at', '>=', $since)
            ->count();

        return $attempts < $max;
    }

    /**
     * Catat satu percobaan aksi untuk keperluan rate-limiting.
     */
    public function log(string $identifier, string $actionType, string $ip): void
    {
        FormRateLimit::create([
            'ip_address' => $ip,
            'identifier' => $identifier,
            'identifier_type' => $this->guessIdentifierType($identifier),
            'action_type' => $actionType,
            'submitted_at' => Date::now(),
        ]);
    }

    /**
     * Tebak tipe identifier dari isinya (email mengandung '@').
     */
    private function guessIdentifierType(string $identifier): RateLimitIdentifierType
    {
        return str_contains($identifier, '@')
            ? RateLimitIdentifierType::Email
            : RateLimitIdentifierType::Whatsapp;
    }
}
