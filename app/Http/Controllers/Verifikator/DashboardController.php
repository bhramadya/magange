<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Dasbor verifikator: seluruh pengajuan (deferred — bisa besar).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return Inertia::render('verifikator/dashboard', [
            'user' => $user->toMagangArray(),
            'applications' => Inertia::defer(fn (): array => InternshipApplication::query()
                ->with(['opd', 'finalReport', 'survey', 'certificate'])
                ->latest()
                ->get()
                ->map(fn (InternshipApplication $application): array => $application->toMagangArray())
                ->all()),
        ]);
    }
}
