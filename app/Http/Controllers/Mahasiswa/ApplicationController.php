<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Contracts\PengajuanServiceContract;
use App\Http\Controllers\Controller;
use App\Http\Requests\Application\StoreApplicationRequest;
use App\Models\InternshipApplication;
use App\Models\Opd;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function __construct(private PengajuanServiceContract $submissionService) {}

    public function create(): Response
    {
        $opds = Opd::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('mahasiswa/application/create', [
            'opds' => $opds,
        ]);
    }

    public function store(StoreApplicationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $application = $this->submissionService->submit($validated, $request->ip());

        return redirect()->route('lacak')
            ->with('success', 'Pengajuan berhasil dikirim dengan nomor tiket: '.$application->ticket_number);
    }

    public function track(Request $request): Response
    {
        $email = $request->query('email');

        $applications = $email !== null
            ? InternshipApplication::query()
                ->whereHas('user', fn ($q) => $q->where('email', $email))
                ->with(['opd', 'user'])
                ->latest()
                ->get()
            : collect();

        return Inertia::render('lacak', [
            'applications' => $applications,
            'email' => $email,
        ]);
    }
}
