<?php

namespace App\Http\Controllers\Verifikator;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\MagangUserResource;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kelola User (R12): daftar akun mahasiswa (peserta magang) di dasbor
 * Admin Verifikator — status aktif, last_login, dan aksi nonaktifkan akun.
 * Akun nonaktif ditolak saat login OTP (OtpLoginController).
 */
class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->where('role', UserRole::Mahasiswa)
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->withCount('applications')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'whatsapp_number' => $user->whatsapp_number,
                'is_active' => $user->is_active,
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
                'applications_count' => $user->applications_count,
            ]);

        return Inertia::render('verifikator/users/index', [
            'user' => new MagangUserResource($request->user()),
            'users' => $users,
            'filters' => ['search' => $search !== '' ? $search : null],
        ]);
    }

    /**
     * Aktifkan/nonaktifkan akun mahasiswa. Akun nonaktif tidak bisa login OTP.
     */
    public function toggleActive(User $user): RedirectResponse
    {
        if ($user->role !== UserRole::Mahasiswa) {
            abort(404);
        }

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with(
            'success',
            $user->is_active ? 'Akun berhasil diaktifkan.' : 'Akun berhasil dinonaktifkan.',
        );
    }
}
