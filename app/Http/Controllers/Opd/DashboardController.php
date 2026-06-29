<?php

namespace App\Http\Controllers\Opd;

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

        $stats = Inertia::defer(fn () => [
            'pending' => InternshipApplication::where('opd_id', $user->opd_id)
                ->where('status', ApplicationStatus::ForwardedOpd)
                ->count(),
            'approved' => InternshipApplication::where('opd_id', $user->opd_id)
                ->where('status', ApplicationStatus::Approved)
                ->count(),
            'ongoing' => InternshipApplication::where('opd_id', $user->opd_id)
                ->where('status', ApplicationStatus::Ongoing)
                ->count(),
            'completed' => InternshipApplication::where('opd_id', $user->opd_id)
                ->where('status', ApplicationStatus::Completed)
                ->count(),
        ]);

        $recentApplications = InternshipApplication::query()
            ->with(['user', 'opd', 'forwardedBy'])
            ->where('opd_id', $user->opd_id)
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('opd/dashboard', [
            'stats' => $stats,
            'recentApplications' => $recentApplications,
        ]);
    }
}
