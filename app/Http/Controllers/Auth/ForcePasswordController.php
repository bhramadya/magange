<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\PasswordValidationRules;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Ganti password wajib saat login pertama (R10): admin OPD/verifikator yang
 * dibuat dengan password auto-generate (users.must_change_password = true)
 * dipaksa ke halaman ini oleh middleware password.changed sebelum bisa
 * membuka dasbor.
 */
class ForcePasswordController extends Controller
{
    use PasswordValidationRules;

    public function show(Request $request): Response|RedirectResponse
    {
        // Sudah tidak wajib ganti → langsung ke dasbor sesuai role.
        if (! $request->user()->must_change_password) {
            return $this->redirectByRole($request);
        }

        return Inertia::render('auth/force-password');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'password' => $this->passwordRules(),
        ], [
            'password.required' => 'Password baru wajib diisi.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $request->user()->forceFill([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ])->save();

        return $this->redirectByRole($request)
            ->with('success', 'Password berhasil diperbarui.');
    }

    private function redirectByRole(Request $request): RedirectResponse
    {
        return match ($request->user()->role) {
            UserRole::AdminVerifikator => redirect('/verifikator'),
            UserRole::AdminOpd => redirect('/opd'),
            UserRole::Mahasiswa => redirect()->route('dashboard'),
        };
    }
}
