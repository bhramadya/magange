<?php

namespace App\Http\Controllers;

use App\Models\InternshipApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Menyajikan pas foto pemohon dari disk PRIVAT (local) untuk ditampilkan pada
 * pop-up tinjau Admin Verifikator & Admin OPD. Otorisasi memakai policy `view`
 * pengajuan: Verifikator boleh semua, OPD hanya pengajuan miliknya.
 */
class ApplicationPhotoController extends Controller
{
    public function show(InternshipApplication $application): StreamedResponse|RedirectResponse
    {
        Gate::authorize('view', $application);

        if ($application->photo_path === null || ! Storage::disk('local')->exists($application->photo_path)) {
            abort(404);
        }

        // Tampilkan inline (bukan unduh) agar bisa dirender sebagai <img>.
        return Storage::disk('local')->response($application->photo_path);
    }
}
