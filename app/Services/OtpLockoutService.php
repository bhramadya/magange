<?php

namespace App\Services;

use App\Models\OtpLockout;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Date;

/**
 * Lockout progresif login OTP.
 *
 * Aturan (revisi mentor):
 *  - 3x salah input OTP → wajib kirim ulang; token aktif diinvalidasi oleh
 *    pemanggil, dan jeda kirim ulang naik mengikuti deret Fibonacci per
 *    tingkat lockout: 1, 1, 2, 3, 5, 8, … menit.
 *  - Counter direset saat login sukses ATAU 24 jam tanpa percobaan
 *    (mana lebih dulu terjadi).
 */
class OtpLockoutService
{
    /**
     * Salah input maksimum sebelum lockout dipicu.
     */
    private const MAX_ATTEMPTS = 3;

    /**
     * Reset otomatis bila tidak ada percobaan selama durasi ini.
     */
    private const IDLE_RESET_HOURS = 24;

    /**
     * Jeda kirim ulang (menit) per tingkat lockout: F(1), F(2), F(3), …
     * lockout_level 1 → 1 menit, 2 → 1, 3 → 2, 4 → 3, 5 → 5, 6 → 8, …
     */
    public function cooldownMinutesForLevel(int $level): int
    {
        if ($level <= 0) {
            return 0;
        }

        $a = 1;
        $b = 1;

        for ($i = 1; $i < $level; $i++) {
            [$a, $b] = [$b, $a + $b];
        }

        return $a;
    }

    /**
     * Catat satu kegagalan verifikasi OTP. Bila mencapai batas, naikkan
     * tingkat lockout dan set jeda kirim ulang. Kembalikan true bila
     * lockout baru saja dipicu oleh kegagalan ini.
     */
    public function registerFailure(User $user): bool
    {
        $lockout = $this->freshLockout($user);

        $lockout->failed_attempts++;
        $lockout->last_attempt_at = Date::now();

        $triggered = false;

        if ($lockout->failed_attempts >= self::MAX_ATTEMPTS) {
            $lockout->lockout_level++;
            $lockout->failed_attempts = 0;
            $minutes = $this->cooldownMinutesForLevel($lockout->lockout_level);
            $lockout->locked_until = Date::now()->addMinutes($minutes);
            $triggered = true;
        }

        $lockout->save();

        return $triggered;
    }

    /**
     * Apakah user sedang dalam masa lockout (belum boleh kirim ulang)?
     */
    public function isLocked(User $user): bool
    {
        return $this->lockedUntil($user) !== null;
    }

    /**
     * Waktu berakhirnya lockout, atau null bila tidak sedang terkunci.
     */
    public function lockedUntil(User $user): ?CarbonInterface
    {
        $lockout = $this->freshLockout($user);

        if ($lockout->locked_until === null) {
            return null;
        }

        return $lockout->locked_until->isFuture() ? $lockout->locked_until : null;
    }

    /**
     * Sisa detik hingga kirim ulang diperbolehkan (0 bila sudah boleh).
     */
    public function secondsUntilUnlock(User $user): int
    {
        $until = $this->lockedUntil($user);

        if ($until === null) {
            return 0;
        }

        return max(0, (int) ceil(Date::now()->diffInSeconds($until, absolute: false)));
    }

    /**
     * Reset lockout (login sukses). Baris dihapus agar tabel tetap ramping.
     */
    public function reset(User $user): void
    {
        OtpLockout::query()->where('user_id', $user->id)->delete();
    }

    /**
     * Ambil baris lockout user, terapkan reset otomatis 24 jam idle, lalu
     * kembalikan instance (belum tentu tersimpan). Selalu mengembalikan model.
     */
    private function freshLockout(User $user): OtpLockout
    {
        $lockout = OtpLockout::query()->firstOrNew(['user_id' => $user->id]);

        $last = $lockout->last_attempt_at;

        // Reset otomatis: tak ada percobaan selama 24 jam → mulai dari nol.
        if ($last !== null && $last->lte(Date::now()->subHours(self::IDLE_RESET_HOURS))) {
            $lockout->failed_attempts = 0;
            $lockout->lockout_level = 0;
            $lockout->locked_until = null;
            $lockout->last_attempt_at = null;
        }

        return $lockout;
    }
}
