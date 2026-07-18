<?php

namespace App\Services;

use App\Contracts\OtpServiceContract;
use App\Jobs\SendOtpEmailJob;
use App\Models\OtpToken;
use App\Models\User;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class OtpService implements OtpServiceContract
{
    /**
     * Jendela & batas permintaan OTP.
     */
    private const MAX_REQUESTS = 3;

    private const WINDOW_MINUTES = 15;

    private const TTL_MINUTES = 5;

    private const ACTION = 'otp_request';

    public function __construct(private RateLimitService $rateLimit) {}

    /**
     * Buat OTP 6 digit, invalidasi token lama, simpan hash baru,
     * perbarui User::password (untuk login Fortify), dan catat ke rate-limit.
     */
    public function generate(User $user, string $ipAddress): OtpToken
    {
        $plainOtp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $token = DB::transaction(function () use ($user, $ipAddress, $plainOtp): OtpToken {
            // Invalidasi token aktif lama milik user ini.
            OtpToken::query()
                ->where('user_id', $user->id)
                ->whereNull('used_at')
                ->update(['used_at' => Date::now()]);

            // Password user = OTP aktif (cast 'hashed' meng-hash otomatis).
            $user->forceFill(['password' => $plainOtp])->save();

            $token = OtpToken::create([
                'user_id' => $user->id,
                'token_hash' => Hash::make($plainOtp),
                'expires_at' => Date::now()->addMinutes(self::TTL_MINUTES),
            ]);

            $this->rateLimit->log($user->email, self::ACTION, $ipAddress);

            return $token;
        });

        // Kirim OTP plaintext via email (queue 'emails') setelah commit.
        SendOtpEmailJob::dispatch($user, $plainOtp);

        return $token;
    }

    /**
     * Verifikasi OTP plaintext terhadap token aktif terbaru user.
     * Bila cocok, tandai token used_at agar tidak bisa dipakai ulang.
     */
    public function verify(User $user, string $plainOtp): bool
    {
        $token = OtpToken::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->where('expires_at', '>', Date::now())
            ->latest('id')
            ->first();

        if ($token === null) {
            return false;
        }

        if (! Hash::check($plainOtp, $token->token_hash)) {
            return false;
        }

        $token->update(['used_at' => Date::now()]);

        return true;
    }

    /**
     * Invalidasi semua token OTP aktif milik user (dipakai saat lockout dipicu).
     */
    public function invalidateActiveTokens(User $user): void
    {
        OtpToken::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->update(['used_at' => Date::now()]);
    }

    /**
     * Maks 3 permintaan OTP per email dalam 15 menit.
     */
    public function canRequest(string $email, string $ipAddress): bool
    {
        return $this->rateLimit->check($email, self::ACTION, self::MAX_REQUESTS, self::WINDOW_MINUTES);
    }
}
