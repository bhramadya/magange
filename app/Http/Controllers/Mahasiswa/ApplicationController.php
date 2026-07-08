<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Contracts\PengajuanServiceContract;
use App\Http\Controllers\Controller;
use App\Http\Requests\Application\StoreApplicationRequest;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Services\RateLimitService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    /**
     * Gerbang rate-limit form pendaftaran (flowchart Fase 1): maks 5 pengajuan
     * per email dalam 60 menit → "akses blokir sementara".
     */
    private const SUBMIT_ACTION = 'submit_pengajuan';

    private const MAX_SUBMITS = 5;

    private const WINDOW_MINUTES = 60;

    public function __construct(
        private PengajuanServiceContract $submissionService,
        private RateLimitService $rateLimit,
    ) {}

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

        // Gerbang rate-limit: blokir sementara bila terlalu banyak percobaan.
        if (! $this->rateLimit->check($validated['email'], self::SUBMIT_ACTION, self::MAX_SUBMITS, self::WINDOW_MINUTES)) {
            return back()
                ->withInput()
                ->withErrors(['email' => 'Terlalu banyak pengajuan dari email ini. Silakan coba lagi nanti.']);
        }

        // Simpan pas foto (opsional) ke disk privat sebelum membuat pengajuan.
        if ($request->hasFile('photo')) {
            $validated['photo_path'] = $request->file('photo')->store('applications/photos', 'local');
        }

        $application = $this->submissionService->submit($validated, $request->ip());

        // Alur Fase 1: OTP sudah dikirim otomatis oleh service. Arahkan ke
        // halaman login-otp dengan email ter-isi, agar peserta langsung memasukkan
        // kode tanpa mengetik email lagi lalu masuk ke dasbor.
        return redirect()->route('login.otp')
            ->with('email', $validated['email'])
            ->with('status', 'Pengajuan berhasil dikirim (tiket: '.$application->ticket_number.'). Kami telah mengirim kode OTP ke email Anda.');
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
