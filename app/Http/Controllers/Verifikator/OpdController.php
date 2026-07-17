<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikator\StoreOpdRequest;
use App\Http\Requests\Verifikator\UpdateOpdRequest;
use App\Http\Resources\MagangUserResource;
use App\Http\Resources\OpdResource;
use App\Models\Opd;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kelola OPD (Admin Verifikator) — CRUD penuh menggantikan halaman kuota saja.
 * Pola mengikuti Verifikator\FaqController. Kuota tetap dihormati: kuota_total
 * tak boleh di bawah kuota_used, dan OPD hanya bisa dihapus bila kuota_used = 0.
 */
class OpdController extends Controller
{
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

        Opd::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'description' => $validated['description'] ?? null,
            'quota_total' => $validated['quota_total'],
            'quota_used' => 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('verifikator.opd.index')
            ->with('success', 'OPD berhasil ditambahkan.');
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
