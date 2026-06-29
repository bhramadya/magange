<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanController extends Controller
{
    /**
     * Halaman pengaturan akun (profil + preferensi notifikasi).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return Inertia::render('pengaturan', [
            'user' => $user->toMagangArray(),
        ]);
    }

    /**
     * Perbarui data profil (nama & nomor WhatsApp).
     */
    public function updateProfil(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'whatsapp_number' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\-()\s]+$/'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'whatsapp_number' => $validated['whatsapp_number'] ?? null,
        ]);

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Simpan preferensi notifikasi ke kolom JSON users.notification_preferences.
     *
     * Di-merge dengan preferensi yang ada agar toggle parsial (mis. hanya
     * `ringkasan`) tidak menghapus preferensi lainnya.
     */
    public function updateNotifikasi(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $validated = $request->validate([
            'email_enabled' => ['sometimes', 'boolean'],
            'reminder_laporan' => ['sometimes', 'boolean'],
            'ringkasan' => ['sometimes', 'boolean'],
        ]);

        $user->update([
            'notification_preferences' => array_merge($user->notification_preferences ?? [], $validated),
        ]);

        return back()->with('success', 'Preferensi notifikasi disimpan.');
    }
}
