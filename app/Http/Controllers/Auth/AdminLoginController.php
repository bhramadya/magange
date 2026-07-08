<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\InvalidatesOtherSessions;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AdminLoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Login admin konvensional (Username + Password) terpisah dari alur OTP
 * mahasiswa. Hanya untuk role admin_verifikator & admin_opd.
 */
class AdminLoginController extends Controller
{
    use InvalidatesOtherSessions;

    public function showForm(): Response
    {
        return Inertia::render('auth/admin-login');
    }

    public function authenticate(AdminLoginRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::query()
            ->where('username', $validated['username'])
            ->whereIn('role', [UserRole::AdminVerifikator, UserRole::AdminOpd])
            ->first();

        if ($user === null || ! Hash::check($validated['password'], (string) $user->password)) {
            throw ValidationException::withMessages([
                'username' => 'Username atau password salah.',
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'username' => 'Akun ini tidak aktif.',
            ]);
        }

        // Single session per browser: tolak bila browser ini sudah login akun lain.
        if (Auth::check() && Auth::id() !== $user->id) {
            abort(403, 'Browser ini sudah login dengan akun lain. Silakan logout terlebih dahulu.');
        }

        Auth::login($user, remember: true);

        $request->session()->regenerate();

        // Single session lintas-perangkat: tendang sesi user di perangkat lain.
        $this->invalidateOtherSessions($request, $user);

        return $user->role === UserRole::AdminVerifikator
            ? redirect('/verifikator')
            : redirect('/opd');
    }
}
