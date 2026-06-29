<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Enums\ApplicationStatus;
use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use App\Models\SatisfactionSurvey;
use App\Models\User;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PenyelesaianController extends Controller
{
    public function __construct(private CertificateService $certificateService) {}

    /**
     * Halaman penyelesaian: unggah laporan, isi survei, unduh sertifikat.
     */
    public function index(Request $request): Response
    {
        $user = $this->user($request);

        $application = $this->latestApplication($user->id);

        return Inertia::render('mahasiswa/penyelesaian', [
            'user' => $user->toMagangArray(),
            'application' => $application?->toMagangArray(),
        ]);
    }

    /**
     * Unggah laporan akhir (disimpan di disk privat) → status completion_submitted.
     */
    public function uploadLaporan(Request $request): RedirectResponse
    {
        $user = $this->user($request);

        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ]);

        $application = $this->latestApplication($user->id);

        if ($application === null) {
            abort(404);
        }

        $file = $request->file('file');

        if (! $file instanceof UploadedFile) {
            abort(422);
        }

        $path = $file->store("laporan/{$application->id}", 'local');

        FinalReport::updateOrCreate(
            ['application_id' => $application->id],
            [
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'is_confirmed' => false,
                'status' => ReportStatus::Pending,
                'submitted_at' => Date::now(),
            ],
        );

        $application->update(['status' => ApplicationStatus::CompletionSubmitted]);

        return back()->with('success', 'Laporan berhasil diunggah.');
    }

    /**
     * Simpan survei kepuasan. Model menyimpan satu kolom `rating` integer,
     * jadi ratings multi-dimensi dari frontend dirata-ratakan.
     */
    public function submitSurvei(Request $request): RedirectResponse
    {
        $user = $this->user($request);

        $validated = $request->validate([
            'ratings' => ['required', 'array', 'min:1'],
            'ratings.*' => ['integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        $application = $this->latestApplication($user->id);

        if ($application === null) {
            abort(404);
        }

        /** @var array<int|string, int> $ratings */
        $ratings = $validated['ratings'];
        $average = (int) round(array_sum($ratings) / count($ratings));

        SatisfactionSurvey::firstOrCreate(
            ['application_id' => $application->id],
            [
                'rating' => $average,
                'comment' => $validated['comment'] ?? null,
                'submitted_at' => Date::now(),
            ],
        );

        // Buka kunci unduhan sertifikat bila sudah diunggah Admin OPD.
        $certificate = Certificate::where('application_id', $application->id)->first();

        if ($certificate !== null) {
            $this->certificateService->unlock($certificate);
        }

        return back()->with('success', 'Survei berhasil. Sertifikat siap diunduh.');
    }

    /**
     * Unduh sertifikat — hanya milik sendiri & setelah kunci dibuka.
     */
    public function downloadSertifikat(Request $request): StreamedResponse
    {
        $user = $this->user($request);

        $application = $this->latestApplication($user->id);

        if ($application === null) {
            abort(404);
        }

        $certificate = Certificate::where('application_id', $application->id)->first();

        if ($certificate === null) {
            abort(404);
        }

        if ($certificate->is_download_locked) {
            abort(403);
        }

        return Storage::disk('local')->download($certificate->file_path, 'Sertifikat_Magang.pdf');
    }

    /**
     * Pengajuan terbaru milik user.
     */
    private function latestApplication(int $userId): ?InternshipApplication
    {
        return InternshipApplication::query()
            ->with(['opd', 'finalReport', 'survey', 'certificate'])
            ->where('user_id', $userId)
            ->latest()
            ->first();
    }

    /**
     * User terautentikasi (dijamin oleh middleware auth + role).
     */
    private function user(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }
}
