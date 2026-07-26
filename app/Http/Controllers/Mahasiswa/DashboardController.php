<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Http\Resources\InternshipApplicationResource;
use App\Http\Resources\MagangUserResource;
use App\Models\ApplicationDocument;
use App\Models\InternshipApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman-halaman (view) Mahasiswa, di-scope ke pengajuan milik user login.
 * Aksi unggah laporan ada di ReportController.
 */
class DashboardController extends Controller
{
    /**
     * Dasbor mahasiswa: pengajuan terbaru + ringkasan status.
     */
    public function index(Request $request): Response
    {
        $application = $this->latestApplication($request, ['opd', 'certificate', 'finalReport', 'survey']);

        return Inertia::render('mahasiswa/dashboard', [
            'user' => new MagangUserResource($request->user()),
            'application' => $application ? new InternshipApplicationResource($application) : null,
        ]);
    }

    /**
     * Pengajuan Saya: pengajuan terbaru + dokumen terlampir.
     */
    public function pengajuan(Request $request): Response
    {
        $application = $this->latestApplication($request, ['opd', 'documents']);

        $documents = $application ? $this->applicationDocuments($application) : [];

        return Inertia::render('mahasiswa/pengajuan', [
            'user' => new MagangUserResource($request->user()),
            'application' => $application ? new InternshipApplicationResource($application) : null,
            'documents' => $documents,
        ]);
    }

    /**
     * Penyelesaian & sertifikat: pengajuan pada tahap akhir.
     */
    public function penyelesaian(Request $request): Response
    {
        $application = $this->latestApplication($request, ['opd', 'finalReport', 'survey', 'certificate']);

        return Inertia::render('mahasiswa/penyelesaian', [
            'user' => new MagangUserResource($request->user()),
            'application' => $application ? new InternshipApplicationResource($application) : null,
        ]);
    }

    /**
     * Dokumen read-only yang ditampilkan di Pengajuan Saya.
     *
     * @return array<int, array{label: string, file_name: string, url?: string, kind?: string}>
     */
    private function applicationDocuments(InternshipApplication $application): array
    {
        $documents = [];

        if ($application->photo_path !== null) {
            $documents[] = [
                'label' => 'Pas Foto',
                'file_name' => basename($application->photo_path),
                'url' => route('pengajuan.foto', $application),
                'kind' => 'image',
            ];
        }

        foreach ([
            'surat_pengantar_path' => ['Surat Pengantar', 'surat-pengantar'],
            'cv_path' => ['Curriculum Vitae', 'cv'],
            'portfolio_path' => ['Portofolio', 'portofolio'],
        ] as $column => [$label, $type]) {
            $path = $application->{$column};

            if ($path === null) {
                continue;
            }

            $documents[] = [
                'label' => $label,
                'file_name' => basename((string) $path),
                'url' => route('pengajuan.dokumen', [$application, $type]),
            ];
        }

        return array_merge(
            $documents,
            $application->documents->map(fn (ApplicationDocument $doc): array => [
                'label' => $doc->type->label(),
                'file_name' => $doc->file_name,
                'url' => Storage::disk('local')->exists($doc->file_path) ? Storage::disk('local')->url($doc->file_path) : null,
            ])->all(),
        );
    }

    /**
     * Pengajuan terbaru milik user login (atau null).
     *
     * @param  array<int, string>  $with
     */
    private function latestApplication(Request $request, array $with = []): ?InternshipApplication
    {
        return InternshipApplication::query()
            ->with($with)
            ->where('user_id', $request->user()->id)
            ->latest()
            ->first();
    }
}
