<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\InternshipApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $applications = InternshipApplication::query()
            ->with(['opd', 'certificate'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $stats = Inertia::defer(fn () => [
            'pending' => InternshipApplication::where('user_id', $user->id)
                ->where('status', ApplicationStatus::PendingVerifikator)
                ->count(),
            'forwarded' => InternshipApplication::where('user_id', $user->id)
                ->where('status', ApplicationStatus::ForwardedOpd)
                ->count(),
            'approved' => InternshipApplication::where('user_id', $user->id)
                ->where('status', ApplicationStatus::Approved)
                ->count(),
            'ongoing' => InternshipApplication::where('user_id', $user->id)
                ->where('status', ApplicationStatus::Ongoing)
                ->count(),
            'completed' => InternshipApplication::where('user_id', $user->id)
                ->where('status', ApplicationStatus::Completed)
                ->count(),
        ]);

        return Inertia::render('mahasiswa/dashboard', [
            'applications' => $applications,
            'stats' => $stats,
        ]);
    }
}
