<?php

namespace App\Http\Controllers;

use App\Http\Resources\MagangUserResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman statis yang dipakai bersama semua peran (Bantuan & Pengaturan).
 * Tetap tipis: hanya menyuntik user yang sedang login untuk header/sidebar
 * dasbor — selaras MagangUserResource (lihat resources/js/types/magang.ts).
 * Tanpa ini, halaman jatuh ke MOCK_USER dan menampilkan nama yang salah.
 */
class SharedPageController extends Controller
{
    public function bantuan(Request $request): Response
    {
        return Inertia::render('bantuan', [
            'user' => new MagangUserResource($request->user()),
        ]);
    }

    public function pengaturan(Request $request): Response
    {
        return Inertia::render('pengaturan', [
            'user' => new MagangUserResource($request->user()),
        ]);
    }
}
