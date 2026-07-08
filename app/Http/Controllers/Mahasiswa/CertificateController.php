<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mahasiswa\SubmitSurveyRequest;
use App\Models\Certificate;
use App\Models\SatisfactionSurvey;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CertificateController extends Controller
{
    public function __construct(private CertificateService $certificateService) {}

    public function download(Certificate $certificate): StreamedResponse|RedirectResponse
    {
        $application = $certificate->application()->with('user')->first();

        if ($application === null) {
            abort(404);
        }

        Gate::authorize('view', $application);

        if ($certificate->is_download_locked) {
            return back()->withErrors(['certificate' => 'Sertifikat masih terkunci. Harap hubungi admin.']);
        }

        if (! Storage::disk('local')->exists($certificate->file_path)) {
            return back()->withErrors(['certificate' => 'File sertifikat tidak ditemukan.']);
        }

        return Storage::disk('local')->download(
            $certificate->file_path,
            $certificate->file_name,
        );
    }

    public function submitSurvey(SubmitSurveyRequest $request, Certificate $certificate): RedirectResponse
    {
        $application = $certificate->application()->with('user')->first();

        if ($application === null) {
            abort(404);
        }

        Gate::authorize('view', $application);

        $validated = $request->validated();

        SatisfactionSurvey::create([
            'application_id' => $application->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'submitted_at' => Date::now(),
        ]);

        // Survei wajib terkirim → buka kunci unduhan sertifikat (PRD Fase 4).
        $this->certificateService->unlock($certificate);

        return back()->with('success', 'Survei kepuasan berhasil dikirim. Terima kasih!');
    }
}
