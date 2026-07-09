<?php

namespace App\Http\Responses;

use App\Enums\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

/**
 * Arahkan admin ke dasbor sesuai perannya setelah login Fortify berhasil.
 * Verifikator → /verifikator, OPD → /opd. (Home Fortify default `/dashboard`
 * hanya untuk mahasiswa, jadi tak dipakai di sini.)
 */
class AdminLoginResponse implements LoginResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        $target = match (Auth::user()?->role) {
            UserRole::AdminVerifikator => '/verifikator',
            UserRole::AdminOpd => '/opd',
            default => '/dashboard',
        };

        return redirect()->intended($target);
    }
}
