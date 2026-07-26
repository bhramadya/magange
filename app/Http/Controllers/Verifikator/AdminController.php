<?php

namespace App\Http\Controllers\Verifikator;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\StoreAdminRequest;
use App\Http\Resources\MagangUserResource;
use App\Models\User;
use App\Services\AdminAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kelola Admin (R13): CRUD sesama Admin Verifikator. Mekanisme sama dengan
 * Kelola OPD (R10): password auto-generate (flash generatedCredentials) +
 * wajib ganti password saat login pertama. Tidak boleh menghapus akun sendiri.
 */
class AdminController extends Controller
{
    public function __construct(private AdminAccountService $accounts) {}

    public function index(Request $request): Response
    {
        $admins = User::query()
            ->where('role', UserRole::AdminVerifikator)
            ->orderBy('name')
            ->get()
            ->map(fn (User $admin): array => [
                'id' => $admin->id,
                'name' => $admin->name,
                'username' => $admin->username,
                'email' => $admin->email,
                'is_active' => $admin->is_active,
                'last_login_at' => $admin->last_login_at?->toIso8601String(),
            ]);

        return Inertia::render('verifikator/admins/index', [
            'user' => new MagangUserResource($request->user()),
            'admins' => $admins,
        ]);
    }

    public function store(StoreAdminRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $account = $this->accounts->createVerifikatorAccount(
            $validated['name'],
            $validated['username'],
            $validated['email'] ?? null,
        );

        return back()
            ->with('success', 'Akun admin berhasil ditambahkan.')
            ->with('generatedCredentials', [
                'username' => $account['username'],
                'password' => $account['password'],
            ]);
    }

    public function resetPassword(User $user): RedirectResponse
    {
        if ($user->role !== UserRole::AdminVerifikator) {
            abort(404);
        }

        $credentials = $this->accounts->resetPassword($user);

        return back()
            ->with('success', 'Password akun admin berhasil direset.')
            ->with('generatedCredentials', $credentials);
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->role !== UserRole::AdminVerifikator) {
            abort(404);
        }

        // Larang menghapus akun sendiri (guard UI juga ada, backend tetap jaga).
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        $user->delete();

        return back()->with('success', 'Akun admin berhasil dihapus.');
    }
}
