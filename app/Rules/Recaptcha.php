<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

/**
 * Verifikasi token Google reCAPTCHA v2 (checkbox) ke endpoint siteverify.
 * Dipakai pada form pendaftaran publik sebagai gerbang anti-bot (Fase 1).
 *
 * Bila secret belum dikonfigurasi (mis. lingkungan lokal tanpa kunci),
 * verifikasi dilewati agar pengembangan tidak terblokir — di produksi
 * secret WAJIB diisi sehingga token benar-benar diverifikasi.
 */
class Recaptcha implements ValidationRule
{
    private const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

    public function __construct(private ?string $ip = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $secret = config('services.recaptcha.secret');

        // Tanpa secret (lokal/dev), lewati verifikasi.
        if (empty($secret)) {
            return;
        }

        if (! is_string($value) || $value === '') {
            $fail('Verifikasi captcha wajib diselesaikan.');

            return;
        }

        $response = Http::asForm()->post(self::VERIFY_URL, array_filter([
            'secret' => $secret,
            'response' => $value,
            'remoteip' => $this->ip,
        ]));

        if (! $response->ok() || $response->json('success') !== true) {
            $fail('Verifikasi captcha gagal. Silakan coba lagi.');
        }
    }
}
