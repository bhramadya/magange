<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\InvalidatesOtherSessions;
use App\Contracts\OtpServiceContract;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\User;
use App\Services\OtpLockoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class OtpLoginController extends Controller
{
    use InvalidatesOtherSessions;

    public function __construct(
        private OtpServiceContract $otpService,
        private OtpLockoutService $lockout,
    ) {}

    public function showForm(Request $request): Response
    {
        // Setelah submit form pendaftaran, controller pengajuan mem-flash `email`
        // (+ status) agar halaman ini lompat ke langkah kode dengan email terisi.
        return Inertia::render('auth/otp-login', [
            'prefillEmail' => $request->session()->get('email'),
            'status' => $request->session()->get('status'),
            // Sisa detik lockout (flash dari send/verify) → hitung mundur live.
            'lockoutSeconds' => $request->session()->get('lockoutSeconds'),
        ]);
    }

    public function sendOtp(SendOtpRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->firstOrFail();

        // R12: akun yang dinonaktifkan Admin Verifikator ditolak login.
        if (! $user->is_active) {
            return back()->withErrors([
                'email' => 'Akun Anda dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.',
            ]);
        }

        // Lockout progresif: setelah 3x salah input, kirim ulang diblokir
        // selama jeda deret Fibonacci sesuai tingkat lockout.
        $seconds = $this->lockout->secondsUntilUnlock($user);

        if ($seconds > 0) {
            return back()
                ->with('lockoutSeconds', $seconds)
                ->withErrors(['email' => $this->lockoutMessage($seconds)]);
        }

        if (! $this->otpService->canRequest($validated['email'], $request->ip())) {
            return back()->withErrors([
                'email' => 'Terlalu banyak permintaan OTP. Coba lagi dalam 15 menit.',
            ]);
        }

        $this->otpService->generate($user, $request->ip());

        return back()->with('status', 'Kode OTP telah dikirim ke email Anda.');
    }

    public function verifyOtp(VerifyOtpRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        // Sedang terkunci → tolak verifikasi sampai jeda kirim ulang habis.
        if ($user !== null) {
            $seconds = $this->lockout->secondsUntilUnlock($user);

            if ($seconds > 0) {
                return back()
                    ->with('lockoutSeconds', $seconds)
                    ->withErrors(['otp' => $this->lockoutMessage($seconds)]);
            }
        }

        if ($user === null || ! $this->otpService->verify($user, $validated['otp'])) {
            if ($user !== null) {
                // Catat kegagalan; bila mencapai batas, invalidasi token aktif
                // agar user WAJIB kirim ulang setelah jeda lockout.
                $triggered = $this->lockout->registerFailure($user);

                if ($triggered) {
                    $this->otpService->invalidateActiveTokens($user);
                    $remaining = $this->lockout->secondsUntilUnlock($user);

                    return back()
                        ->with('lockoutSeconds', $remaining)
                        ->withErrors(['otp' => $this->lockoutMessage($remaining)]);
                }
            }

            return back()->withErrors([
                'otp' => 'Kode OTP tidak valid atau sudah kedaluwarsa.',
            ]);
        }

        // Single session per browser: tolak bila browser ini sudah login akun lain.
        if (Auth::check() && Auth::id() !== $user->id) {
            abort(403, 'Browser ini sudah login dengan akun lain. Silakan logout terlebih dahulu.');
        }

        // R12: akun nonaktif tidak boleh masuk meski OTP-nya benar.
        if (! $user->is_active) {
            return back()->withErrors([
                'email' => 'Akun Anda dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.',
            ]);
        }

        // Login sukses → reset lockout.
        $this->lockout->reset($user);

        // Audit login (R12): catat waktu login sukses terakhir.
        $user->forceFill(['last_login_at' => Date::now()])->save();

        Auth::login($user, remember: true);

        $request->session()->regenerate();

        // Single session lintas-perangkat: tendang sesi user di perangkat lain.
        $this->invalidateOtherSessions($request, $user);

        return $this->redirectByRole($user->role);
    }

    /**
     * Pesan lockout ramah pengguna dengan sisa waktu tunggu.
     */
    private function lockoutMessage(int $seconds): string
    {
        if ($seconds >= 60) {
            $minutes = (int) ceil($seconds / 60);

            return "Terlalu banyak percobaan salah. Coba kirim ulang kode dalam {$minutes} menit.";
        }

        return "Terlalu banyak percobaan salah. Coba kirim ulang kode dalam {$seconds} detik.";
    }

    private function redirectByRole(UserRole $role): RedirectResponse
    {
        return match ($role) {
            UserRole::Mahasiswa => redirect()->route('dashboard'),
            UserRole::AdminVerifikator => redirect('/verifikator'),
            UserRole::AdminOpd => redirect('/opd'),
        };
    }
}
