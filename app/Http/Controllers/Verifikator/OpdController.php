<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\StoreOpdRequest;
use App\Http\Requests\Verifikator\UpdateOpdRequest;
use App\Http\Resources\MagangUserResource;
use App\Http\Resources\OpdResource;
use App\Models\Opd;
use App\Models\User;
use App\Services\AdminAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kelola OPD (Admin Verifikator) — CRUD penuh menggantikan halaman kuota saja.
 * Pola mengikuti Verifikator\FaqController. Kuota tetap dihormati: kuota_total
 * tak boleh di bawah kuota_used, dan OPD hanya bisa dihapus bila kuota_used = 0.
 *
 * R10: menambah OPD sekaligus membuat akun Admin OPD dengan password
 * auto-generate (flash generatedCredentials, tampil sekali) + tombol reset
 * password. Akun wajib ganti password saat login pertama.
 */
class OpdController extends Controller
{
    public function __construct(private AdminAccountService $accounts) {}

    public function index(Request $request): Response
    {
        $opds = Opd::query()
            ->orderBy('name')
            ->get();

        return Inertia::render('verifikator/opd/index', [
            'user' => new MagangUserResource($request->user()),
            'opds' => OpdResource::collection($opds),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('verifikator/opd/create', [
            'user' => new MagangUserResource($request->user()),
        ]);
    }

    public function store(StoreOpdRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Buat OPD + akun admin-nya secara atomik (R10).
        $credentials = DB::transaction(function () use ($validated): array {
            $opd = Opd::create([
                'name' => $validated['name'],
                'code' => $validated['code'],
                'kode_opd' => $validated['kode_opd'] ?? null,
                'inisial_opd' => $validated['inisial_opd'] ?? null,
                'description' => $validated['description'] ?? null,
                'quota_total' => $validated['quota_total'],
                'quota_used' => 0,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $account = $this->accounts->createOpdAccount($opd);

            return ['username' => $account['username'], 'password' => $account['password']];
        });

        return redirect()->route('verifikator.opd.index')
            ->with('success', 'OPD berhasil ditambahkan.')
            ->with('generatedCredentials', $credentials);
    }

    /**
     * Reset password akun Admin OPD (R10): regenerate password acak, wajib
     * diganti saat login berikutnya. Kredensial tampil sekali via flash.
     */
    public function resetPassword(Opd $opd): RedirectResponse
    {
        $account = User::query()
            ->where('opd_id', $opd->id)
            ->where('role', 'admin_opd')
            ->first();

        if ($account === null) {
            return back()->with('error', 'OPD ini belum memiliki akun admin.');
        }

        $credentials = $this->accounts->resetPassword($account);

        return back()
            ->with('success', 'Password akun OPD berhasil direset.')
            ->with('generatedCredentials', $credentials);
    }

    public function edit(Request $request, Opd $opd): Response
    {
        return Inertia::render('verifikator/opd/edit', [
            'user' => new MagangUserResource($request->user()),
            'opd' => new OpdResource($opd),
        ]);
    }

    public function update(UpdateOpdRequest $request, Opd $opd): RedirectResponse
    {
        $validated = $request->validated();

        $opd->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'kode_opd' => $validated['kode_opd'] ?? null,
            'inisial_opd' => $validated['inisial_opd'] ?? null,
            'description' => $validated['description'] ?? null,
            'quota_total' => $validated['quota_total'],
            'is_active' => $validated['is_active'] ?? $opd->is_active,
        ]);

        return redirect()->route('verifikator.opd.index')
            ->with('success', 'OPD berhasil diperbarui.');
    }

    public function destroy(Opd $opd): RedirectResponse
    {
        // Jaga integritas: OPD dengan peserta yang sudah disetujui tak boleh dihapus.
        if ($opd->quota_used > 0) {
            return back()->with('error', 'OPD tidak dapat dihapus karena sudah memiliki peserta magang.');
        }

        $opd->delete();

        return back()->with('success', 'OPD berhasil dihapus.');
    }
}
