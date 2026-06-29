<?php

namespace App\Http\Controllers\Verifikator;

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
        $stats = Inertia::defer(fn () => [
            'pending' => InternshipApplication::where('status', ApplicationStatus::PendingVerifikator)->count(),
            'forwarded' => InternshipApplication::where('status', ApplicationStatus::ForwardedOpd)->count(),
            'approved' => InternshipApplication::where('status', ApplicationStatus::Approved)->count(),
            'rejected' => InternshipApplication::where('status', ApplicationStatus::Rejected)->count(),
            'completed' => InternshipApplication::where('status', ApplicationStatus::Completed)->count(),
        ]);

        $recentApplications = InternshipApplication::query()
            ->with(['user', 'opd'])
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('verifikator/dashboard', [
            'stats' => $stats,
            'recentApplications' => $recentApplications,
        ]);
    }
}
