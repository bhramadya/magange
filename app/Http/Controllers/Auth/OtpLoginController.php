<?php

namespace App\Http\Controllers\Auth;

use App\Contracts\OtpServiceContract;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OtpLoginController extends Controller
{
    public function __construct(private OtpServiceContract $otpService) {}

    public function showForm(): Response
    {
        return Inertia::render('auth/otp-login');
    }

    public function sendOtp(SendOtpRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->firstOrFail();

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

        if ($user === null || ! $this->otpService->verify($user, $validated['otp'])) {
            return back()->withErrors([
                'otp' => 'Kode OTP tidak valid atau sudah kedaluwarsa.',
            ]);
        }

        // Single session per browser: tolak bila browser ini sudah login akun lain.
        if (Auth::check() && Auth::id() !== $user->id) {
            abort(403, 'Browser ini sudah login dengan akun lain. Silakan logout terlebih dahulu.');
        }

        Auth::login($user, remember: true);

        $request->session()->regenerate();

        return $this->redirectByRole($user->role);
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
