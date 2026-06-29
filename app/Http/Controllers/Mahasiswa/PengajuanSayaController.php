<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengajuanSayaController extends Controller
{
    /**
     * Halaman "Pengajuan Saya": detail pengajuan terbaru + dokumen resmi.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $application = InternshipApplication::query()
            ->with(['opd', 'finalReport', 'survey', 'certificate', 'documents'])
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        // Dokumen dikirim terpisah (BUKAN field model) sesuai kontrak
        // ApplicationDocument = { label, file_name, url? }.
        $documents = $application === null ? [] : $application->documents
            ->map(fn ($document): array => [
                'label' => $document->type->label(),
                'file_name' => $document->file_name,
                'url' => null,
            ])
            ->all();

        return Inertia::render('mahasiswa/pengajuan', [
            'user' => $user->toMagangArray(),
            'application' => $application?->toMagangArray(),
            'documents' => $documents,
        ]);
    }
}
