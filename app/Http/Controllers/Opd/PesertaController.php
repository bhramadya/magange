<?php

namespace App\Http\Controllers\Opd;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PesertaController extends Controller
{
    /**
     * Peserta aktif OPD ini. Nama peserta dikirim terpisah sesuai kontrak
     * Participant = { student_name, application }.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $participants = InternshipApplication::query()
            ->with(['opd', 'user', 'finalReport', 'survey', 'certificate'])
            ->where('opd_id', $user->opd_id)
            ->whereIn('status', [
                ApplicationStatus::Approved,
                ApplicationStatus::Ongoing,
                ApplicationStatus::Completed,
            ])
            ->latest()
            ->get()
            ->map(fn (InternshipApplication $application): array => [
                'student_name' => $application->user->name,
                'application' => $application->toMagangArray(),
            ])
            ->all();

        return Inertia::render('opd/peserta', [
            'user' => $user->toMagangArray(),
            'participants' => $participants,
        ]);
    }
}
