<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Menyajikan foto profil pengguna yang sedang login dari disk PRIVAT (local).
 * Untuk mahasiswa, foto ini otomatis berasal dari pas foto pendaftaran
 * (User::avatar_path). Selalu terkait pengguna terautentikasi — tanpa parameter
 * agar tak bisa dipakai mengintip avatar pengguna lain.
 */
class ProfileAvatarController extends Controller
{
    public function show(Request $request): StreamedResponse
    {
        $user = $request->user();

        abort_if(
            $user === null
                || $user->avatar_path === null
                || ! Storage::disk('local')->exists($user->avatar_path),
            404,
        );

        // Inline agar bisa dirender sebagai <img>.
        return Storage::disk('local')->response($user->avatar_path);
    }
}
