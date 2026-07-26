<?php

namespace App\Http\Controllers\Verifikator;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Mahasiswa\PresensiController;
use App\Http\Resources\MagangUserResource;
use App\Models\InternshipApplication;
use App\Models\PresensiLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kelola User (R12): daftar akun mahasiswa (peserta magang) di dasbor
 * Admin Verifikator — status aktif, last_login, dan aksi nonaktifkan akun.
 * Akun nonaktif ditolak saat login OTP (OtpLoginController).
 * Batch 5 (#3): payload per user memuat detail untuk dialog — foto,
 * pengajuan terakhir (maks 5), dan ringkasan presensi 31 hari terakhir.
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
            ->with([
                'applications' => fn ($q) => $q->with('opd')->latest()->limit(5),
            ])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(function (User $user): array {
                // Foto profil: pas foto pendaftaran terakhir, dilayani route
                // pengajuan.foto (policy view — verifikator boleh semua).
                // Route profile/avatar tidak bisa dipakai admin (self-only).
                $photoApplication = $user->applications
                    ->first(fn (InternshipApplication $app): bool => $app->photo_path !== null);

                $presensi = PresensiLog::query()
                    ->where('user_id', $user->id)
                    ->where('activity_date', '>=', Date::today()->subDays(31))
                    ->with('attachments')
                    ->orderByDesc('activity_date')
                    ->get()
                    ->map(fn (PresensiLog $log): array => PresensiController::entryPayload($log))
                    ->values()
                    ->all();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'whatsapp_number' => $user->whatsapp_number,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at?->toIso8601String(),
                    'created_at' => $user->created_at?->toIso8601String(),
                    'applications_count' => $user->applications_count,
                    'avatar_url' => $photoApplication !== null
                        ? route('pengajuan.foto', $photoApplication)
                        : null,
                    'applications' => $user->applications->map(fn (InternshipApplication $app): array => [
                        'ticket_number' => $app->ticket_number,
                        'status' => $app->status->value,
                        'opd_name' => $app->opd?->name,
                        'institution_name' => $app->institution_name,
                        'created_at' => $app->created_at?->toIso8601String(),
                    ])->values()->all(),
                    'presensi' => $presensi,
                ];
            });

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
