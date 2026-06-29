<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Dasbor mahasiswa: pengajuan terbaru milik user yang login.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $application = InternshipApplication::query()
            ->with(['opd', 'finalReport', 'survey', 'certificate'])
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        return Inertia::render('mahasiswa/dashboard', [
            'user' => $user->toMagangArray(),
            'application' => $application?->toMagangArray(),
        ]);
    }
}
