<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

/**
 * Verifikasi token Google reCAPTCHA v3 (invisible/score-based) ke endpoint
 * siteverify. Dipakai pada form pendaftaran publik, kirim OTP mahasiswa, dan
 * login admin (R2/R8). Token diambil frontend via grecaptcha.execute(siteKey,
 * {action}) — lihat resources/js/hooks/use-recaptcha-v3.ts.
 *
 * Diterima bila success == true DAN score >= services.recaptcha.min_score
 * (default 0.5). Bila `action` diberikan, action pada respons juga harus cocok.
 *
 * Bila secret belum dikonfigurasi (mis. lingkungan lokal tanpa kunci),
 * verifikasi dilewati agar pengembangan tidak terblokir — di produksi
 * secret WAJIB diisi sehingga token benar-benar diverifikasi.
 */
class Recaptcha implements ValidationRule
{
    private const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

    public function __construct(
        private ?string $ip = null,
        private ?string $action = null,
    ) {}

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

            return;
        }

        // v3: tolak skor di bawah ambang (bot-like). Respons v2 tanpa field
        // score tetap lolos di sini (kompatibel mundur).
        $score = $response->json('score');
        $minScore = (float) config('services.recaptcha.min_score', 0.5);

        if (is_numeric($score) && (float) $score < $minScore) {
            $fail('Verifikasi captcha gagal. Silakan coba lagi.');

            return;
        }

        // Cocokkan action bila diminta — mencegah token dari form lain dipakai ulang.
        if ($this->action !== null && $response->json('action') !== null && $response->json('action') !== $this->action) {
            $fail('Verifikasi captcha gagal. Silakan coba lagi.');
        }
    }
}
