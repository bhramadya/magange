<?php

namespace App\Http\Controllers;

use App\Models\InternshipApplication;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Menyajikan berkas pendukung pendaftaran (Surat Pengantar / CV / Portofolio)
 * dari disk PRIVAT (local). Otorisasi memakai policy `view` pengajuan:
 * pemilik (mahasiswa) boleh berkas sendiri, Verifikator semua, OPD hanya
 * pengajuan miliknya — sama seperti ApplicationPhotoController.
 */
class ApplicationDocumentController extends Controller
{
    /**
     * Peta jenis dokumen (segmen URL) → kolom path pada pengajuan.
     */
    private const TYPE_COLUMNS = [
        'surat-pengantar' => 'surat_pengantar_path',
        'cv' => 'cv_path',
        'portofolio' => 'portfolio_path',
    ];

    public function show(InternshipApplication $application, string $type): StreamedResponse
    {
        Gate::authorize('view', $application);

        $column = self::TYPE_COLUMNS[$type] ?? null;

        if ($column === null) {
            abort(404);
        }

        /** @var string|null $path */
        $path = $application->{$column};

        if ($path === null || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        // Tampilkan inline (bukan unduh paksa) agar PDF/gambar bisa dipratinjau.
        return Storage::disk('local')->response($path);
    }
}
