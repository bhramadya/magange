<?php

namespace App\Http\Controllers\Verifikator;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatController extends Controller
{
    /**
     * Riwayat keputusan: pengajuan yang sudah diputuskan / berjalan / selesai.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $archived = InternshipApplication::query()
            ->with(['opd', 'user', 'finalReport', 'survey', 'certificate'])
            ->whereIn('status', [
                ApplicationStatus::Approved,
                ApplicationStatus::Rejected,
                ApplicationStatus::Ongoing,
                ApplicationStatus::Completed,
            ])
            ->latest()
            ->get()
            ->map(fn (InternshipApplication $application): array => $application->toMagangArray())
            ->all();

        return Inertia::render('verifikator/riwayat', [
            'user' => $user->toMagangArray(),
            'applications' => $archived,
        ]);
    }
}
