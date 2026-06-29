<?php

namespace App\Http\Controllers;

use App\Contracts\PengajuanServiceContract;
use App\Http\Requests\Application\StoreApplicationRequest;
use App\Services\RateLimitService;
use Illuminate\Http\RedirectResponse;

class PengajuanPublikController extends Controller
{
    /**
     * Aksi rate-limit untuk form pendaftaran publik — selaras dengan yang
     * dicatat SubmissionService::submit().
     */
    private const ACTION = 'submit_pengajuan';

    public function __construct(
        private PengajuanServiceContract $submissionService,
        private RateLimitService $rateLimit,
    ) {}

    /**
     * Terima pengajuan magang dari form publik (welcome.tsx #daftar).
     * Buat InternshipApplication berstatus pending_verifikator + kirim tiket.
     */
    public function store(StoreApplicationRequest $request): RedirectResponse
    {
        $data = $request->payload();

        // Anti-spam: maksimal 3 pengajuan per email dalam 24 jam.
        if (! $this->rateLimit->check($data['email'], self::ACTION, 3, 1440)) {
            return back()->withErrors([
                'email' => 'Batas pengajuan harian tercapai. Silakan coba lagi besok.',
            ]);
        }

        $application = $this->submissionService->submit($data, $request->ip() ?? '');

        return redirect('/')->with('success', 'Pengajuan berhasil! Tiket: '.$application->ticket_number);
    }
}
