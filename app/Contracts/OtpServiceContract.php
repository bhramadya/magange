<?php

namespace App\Contracts;

use App\Models\OtpToken;
use App\Models\User;

interface OtpServiceContract
{
    /**
     * Buat OTP 6 digit baru untuk user, simpan hash-nya di otp_tokens
     * sekaligus perbarui User::password, lalu catat percobaan ke rate-limit.
     */
    public function generate(User $user, string $ipAddress): OtpToken;

    /**
     * Verifikasi OTP plaintext terhadap token aktif user.
     * Mengembalikan true bila cocok & belum kedaluwarsa (lalu tandai used_at).
     */
    public function verify(User $user, string $plainOtp): bool;

    /**
     * Invalidasi semua token OTP aktif milik user (mis. saat lockout dipicu
     * sehingga user wajib kirim ulang kode).
     */
    public function invalidateActiveTokens(User $user): void;

    /**
     * Cek apakah email/IP ini masih boleh meminta OTP
     * (maks 3 permintaan dalam 15 menit).
     */
    public function canRequest(string $email, string $ipAddress): bool;
}
