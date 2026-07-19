<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\TransformsRequest;

/**
 * Sanitasi global input teks (R7, anti-XSS): bersihkan tag <script>, atribut
 * event-handler (on*=), dan URI javascript: dari semua input string sebelum
 * mencapai validasi/penyimpanan. Karakter strip (-) dan tanda baca umum tetap
 * lolos ("D-3 Teknik" utuh).
 *
 * Catatan: React/Blade sudah meng-escape saat render, jadi middleware ini
 * TIDAK meng-escape HTML (tidak double-escape) — hanya membuang pola
 * berbahaya yang tak pernah sah pada input form aplikasi ini.
 */
class SanitizeInput extends TransformsRequest
{
    /**
     * @param  string  $key
     * @param  mixed  $value
     */
    protected function transform($key, $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        // Password sengaja dilewati: tidak dirender di mana pun dan mengubah
        // karakternya akan diam-diam mengubah kredensial pengguna.
        if (in_array($key, ['password', 'password_confirmation', 'current_password'], true)) {
            return $value;
        }

        // 1) Buang blok <script>...</script> beserta isinya.
        $value = (string) preg_replace('#<script\b[^>]*>.*?</script\s*>#is', '', $value);
        // Tag <script> yang tidak tertutup.
        $value = (string) preg_replace('#</?script\b[^>]*>#i', '', $value);

        // 2) Buang atribut event-handler inline (onclick=, onerror=, dst.).
        $value = (string) preg_replace('/\son\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $value);

        // 3) Netralkan URI javascript: (mis. href="javascript:alert(1)").
        $value = (string) preg_replace('/javascript\s*:/i', '', $value);

        return $value;
    }
}
