<?php

namespace App\Http\Controllers\Opd;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Opd\GenerateCertificateDraftRequest;
use App\Http\Requests\Opd\UploadSignedAcceptanceRequest;
use App\Http\Requests\Opd\UploadSignedCertificateRequest;
use App\Http\Resources\InternshipApplicationResource;
use App\Http\Resources\MagangUserResource;
use App\Http\Resources\OpdResource;
use App\Jobs\SendSignedAcceptanceLetterJob;
use App\Jobs\SendSignedCertificateJob;
use App\Models\ApplicationStatusLog;
use App\Models\Certificate;
use App\Models\InternshipApplication;
use App\Models\OpdSigner;
use App\Services\LetterDocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TteController extends Controller
{
    public function waiting(Request $request): Response
    {
        return $this->indexFor($request, ApplicationStatus::WaitingTte, 'opd/menunggu-tte');
    }

    public function certificates(Request $request): Response
    {
        return $this->indexFor($request, ApplicationStatus::NeedsCertificate, 'opd/perlu-sertifikat');
    }

    public function downloadAcceptanceDraft(Request $request, InternshipApplication $application): StreamedResponse
    {
        $this->authorizeApplication($request, $application);
        abort_if($application->acceptance_draft_path === null, 404);
        abort_if(! Storage::disk('local')->exists($application->acceptance_draft_path), 404);

        return Storage::disk('local')->download($application->acceptance_draft_path, 'Surat Penerimaan ('.$application->user->name.').pdf');
    }

    public function uploadAcceptance(UploadSignedAcceptanceRequest $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorizeApplication($request, $application);
        abort_unless($application->status === ApplicationStatus::WaitingTte, 422);

        $file = $request->file('file');
        abort_if($file === null, 422);
        $path = $file->store("acceptance-signed/{$application->id}", 'local');
        $next = $application->start_date->isPast() || $application->start_date->isToday()
            ? ApplicationStatus::Ongoing
            : ApplicationStatus::Approved;

        $application->update(['acceptance_signed_path' => $path, 'status' => $next]);
        $this->log($application, ApplicationStatus::WaitingTte, $next, $request, 'Surat penerimaan bertanda tangan diunggah.');
        SendSignedAcceptanceLetterJob::dispatch($application->fresh());

        return back()->with('success', 'Surat bertanda tangan diunggah dan dikirim ke peserta.');
    }

    public function generateCertificateDraft(GenerateCertificateDraftRequest $request, InternshipApplication $application, LetterDocumentService $letters): RedirectResponse
    {
        $this->authorizeApplication($request, $application);
        abort_unless($application->status === ApplicationStatus::NeedsCertificate, 422);

        $signer = $this->signerFor($request, $application);
        $certificate = Certificate::query()->firstOrCreate(
            ['application_id' => $application->id],
            [
                'file_name' => 'Sertifikat ('.$application->user->name.').pdf',
                'file_path' => '',
                'is_download_locked' => false,
                'uploaded_by' => $request->user()->id,
            ],
        );

        $letters->ensureCertificateSnapshot($certificate, $signer);
        $letters->generateCertificateDraft($certificate->fresh());

        return back()->with('success', 'Draft sertifikat berhasil dibuat.');
    }

    public function downloadCertificateDraft(Request $request, InternshipApplication $application): StreamedResponse
    {
        $this->authorizeApplication($request, $application);
        $certificate = $application->certificate;
        abort_if($certificate?->draft_path === null, 404);
        abort_if(! Storage::disk('local')->exists($certificate->draft_path), 404);

        return Storage::disk('local')->download($certificate->draft_path, 'Sertifikat ('.$application->user->name.').pdf');
    }

    public function uploadCertificate(UploadSignedCertificateRequest $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorizeApplication($request, $application);
        abort_unless($application->status === ApplicationStatus::NeedsCertificate, 422);
        $certificate = $application->certificate;
        abort_if($certificate === null || $certificate->signer_name === null, 422, 'Buat draft sertifikat terlebih dahulu.');

        $file = $request->file('file');
        abort_if($file === null, 422);
        $path = $file->store("certificates/{$application->id}", 'local');
        $certificate->update([
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'is_download_locked' => false,
            'uploaded_by' => $request->user()->id,
        ]);
        $application->update(['status' => ApplicationStatus::Completed]);
        $this->log($application, ApplicationStatus::NeedsCertificate, ApplicationStatus::Completed, $request, 'Sertifikat bertanda tangan diunggah dan dikirim ke peserta.');
        SendSignedCertificateJob::dispatch($certificate->fresh());

        return back()->with('success', 'Sertifikat bertanda tangan diunggah dan dikirim ke peserta.');
    }

    private function indexFor(Request $request, ApplicationStatus $status, string $page): Response
    {
        $applications = InternshipApplication::query()
            ->with(['user', 'opd', 'certificate'])
            ->where('opd_id', $request->user()->opd_id)
            ->where('status', $status)
            ->latest()
            ->get();

        return Inertia::render($page, [
            'user' => new MagangUserResource($request->user()),
            'opd' => new OpdResource($request->user()->opd),
            'applications' => InternshipApplicationResource::collection($applications),
            'signers' => $request->user()->opd->signers()
                ->orderByDesc('is_primary')
                ->orderBy('name')
                ->get(['id', 'name', 'title', 'nip', 'is_primary']),
        ]);
    }

    private function signerFor(Request $request, InternshipApplication $application): ?OpdSigner
    {
        $signerId = $request->integer('signer_id');

        if ($signerId !== 0) {
            return OpdSigner::query()->where('opd_id', $application->opd_id)->findOrFail($signerId);
        }

        return null;
    }

    private function authorizeApplication(Request $request, InternshipApplication $application): void
    {
        abort_unless($application->opd_id === $request->user()->opd_id, 403);
        $application->loadMissing(['user', 'certificate']);
    }

    private function log(InternshipApplication $application, ApplicationStatus $from, ApplicationStatus $to, Request $request, string $notes): void
    {
        ApplicationStatusLog::create([
            'application_id' => $application->id,
            'from_status' => $from->value,
            'to_status' => $to->value,
            'changed_by' => $request->user()->id,
            'notes' => $notes,
        ]);
    }
}
