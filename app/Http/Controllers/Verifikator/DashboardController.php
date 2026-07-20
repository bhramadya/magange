<?php

namespace App\Http\Controllers\Verifikator;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\InternshipApplicationResource;
use App\Http\Resources\MagangUserResource;
use App\Http\Resources\OpdResource;
use App\Models\InternshipApplication;
use App\Models\Opd;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman-halaman (view) Admin Verifikator. Aksi transisi status ada di
 * PengajuanController; controller ini hanya me-render dasbor + daftar.
 */
class DashboardController extends Controller
{
    /**
     * Dasbor ringkas: seluruh pengajuan terbaru + OPD untuk form teruskan.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('verifikator/dashboard', [
            'user' => new MagangUserResource($request->user()),
            'applications' => InternshipApplicationResource::collection($this->recentApplications()),
            'opds' => OpdResource::collection($this->activeOpds()),
        ]);
    }

    /**
     * Pengajuan Masuk: antrian menunggu verifikasi (pending_verifikator).
     */
    public function masuk(Request $request): Response
    {
        $applications = InternshipApplication::query()
            ->with(['user', 'opd'])
            ->where('status', ApplicationStatus::PendingVerifikator)
            ->latest()
            ->get();

        return Inertia::render('verifikator/masuk', [
            'user' => new MagangUserResource($request->user()),
            'applications' => InternshipApplicationResource::collection($applications),
            'opds' => OpdResource::collection($this->activeOpds()),
        ]);
    }

    /**
     * Riwayat keputusan: pengajuan yang sudah diproses (bukan pending).
     */
    public function riwayat(Request $request): Response
    {
        $applications = InternshipApplication::query()
            ->with(['user', 'opd'])
            ->whereNot('status', ApplicationStatus::PendingVerifikator)
            ->latest()
            ->get();

        return Inertia::render('verifikator/riwayat', [
            'user' => new MagangUserResource($request->user()),
            'applications' => InternshipApplicationResource::collection($applications),
        ]);
    }

    /**
     * Kelola Kuota OPD: Verifikator dapat mengubah kuota seluruh OPD.
     * (Dipindah dari panel bawah dasbor ke halaman/menu sidebar tersendiri.)
     */
    public function kuota(Request $request): Response
    {
        return Inertia::render('verifikator/kuota', [
            'user' => new MagangUserResource($request->user()),
            'opds' => OpdResource::collection($this->activeOpds()),
        ]);
    }

    /**
     * Seluruh pengajuan untuk dasbor. TANPA limit: kartu statistik & chip
     * filter dihitung frontend dari koleksi ini — bila dipotong (dulu
     * limit 50), hitungan dasbor tidak cocok dengan halaman Pengajuan
     * Masuk/Riwayat yang mengambil semua baris (bug masalah.txt #1).
     *
     * @return Collection<int, InternshipApplication>
     */
    private function recentApplications()
    {
        return InternshipApplication::query()
            ->with(['user', 'opd'])
            ->latest()
            ->get();
    }

    /**
     * @return Collection<int, Opd>
     */
    private function activeOpds()
    {
        return Opd::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }
}
