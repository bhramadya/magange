<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\InternshipApplication;
use App\Models\OpdLetterTemplate;
use App\Models\OpdSigner;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class LetterDocumentService
{
    /**
     * Placeholder yang boleh dipakai pada kedua template surat.
     *
     * @var array<int, string>
     */
    public const PLACEHOLDERS = [
        '{nama_peserta}',
        '{asal_instansi}',
        '{opd}',
        '{bidang}',
        '{tanggal_mulai}',
        '{tanggal_selesai}',
    ];

    /**
     * Placeholder minimal menjaga setiap surat tetap menyebut peserta dan
     * periode magang, walaupun admin mengubah seluruh narasi di sekitarnya.
     *
     * @var array<string, array<int, string>>
     */
    public const REQUIRED_PLACEHOLDERS = [
        OpdLetterTemplate::TYPE_ACCEPTANCE => [
            '{nama_peserta}',
            '{opd}',
            '{tanggal_mulai}',
            '{tanggal_selesai}',
        ],
        OpdLetterTemplate::TYPE_CERTIFICATE => [
            '{nama_peserta}',
            '{opd}',
            '{tanggal_mulai}',
            '{tanggal_selesai}',
        ],
    ];

    public function generateAcceptanceDraft(InternshipApplication $application): string
    {
        $application->loadMissing('user', 'opd');

        $this->ensureAcceptanceSnapshot($application);

        $body = $this->renderBody($application, OpdLetterTemplate::TYPE_ACCEPTANCE);
        $pdf = Pdf::loadView('pdf.acceptance_letter', [
            'application' => $application,
            'body' => $body,
            'letterNumber' => sprintf('SM/%d/%05d', $application->created_at->year, $application->id),
        ]);

        $path = "acceptance-draft/{$application->id}/Surat Penerimaan ({$application->user->name}).pdf";
        $this->storePdf($path, $pdf->output());

        $application->update([
            'acceptance_draft_path' => $path,
            // Path lama dipertahankan sebagai alias draft untuk kompatibilitas.
            'surat_penerimaan_path' => $path,
        ]);

        return $path;
    }

    public function generateCertificateDraft(Certificate $certificate): string
    {
        $certificate->loadMissing('application.user', 'application.opd');

        $application = $certificate->application;
        $this->ensureCertificateSnapshot($certificate);

        $body = $this->renderBody($application, OpdLetterTemplate::TYPE_CERTIFICATE);
        $pdf = Pdf::loadView('pdf.certificate', [
            'application' => $application,
            'certificate' => $certificate,
            'body' => $body,
        ]);

        $path = "certificate-draft/{$application->id}/Sertifikat ({$application->user->name}).pdf";
        $this->storePdf($path, $pdf->output());

        $certificate->update(['draft_path' => $path]);

        return $path;
    }

    public function defaultBody(string $type): string
    {
        return match ($type) {
            OpdLetterTemplate::TYPE_ACCEPTANCE => <<<'TEXT'
Dengan ini menerangkan bahwa {nama_peserta} dari {asal_instansi} diterima untuk melaksanakan magang pada {opd}, bidang {bidang}, pada periode {tanggal_mulai} sampai dengan {tanggal_selesai}.

Demikian surat penerimaan ini dibuat untuk dipergunakan sebagaimana mestinya.
TEXT,
            OpdLetterTemplate::TYPE_CERTIFICATE => <<<'TEXT'
Dengan ini menerangkan bahwa {nama_peserta} dari {asal_instansi} telah menyelesaikan program magang pada {opd}, bidang {bidang}, pada periode {tanggal_mulai} sampai dengan {tanggal_selesai}.

Sertifikat ini diberikan sebagai penghargaan atas partisipasi peserta dalam program magang.
TEXT,
            default => throw new RuntimeException('Jenis template surat tidak dikenal.'),
        };
    }

    public function ensureAcceptanceSnapshot(InternshipApplication $application, ?OpdSigner $signer = null): void
    {
        if ($application->acceptance_signer_name !== null) {
            return;
        }

        $signer ??= $this->primarySigner($application);

        if ($signer === null) {
            throw new RuntimeException('OPD belum memiliki penandatangan utama.');
        }

        $application->update([
            'acceptance_signer_id' => $signer->id,
            'acceptance_signer_name' => $signer->name,
            'acceptance_signer_title' => $signer->title,
            'acceptance_signer_nip' => $signer->nip,
        ]);
    }

    public function ensureCertificateSnapshot(Certificate $certificate, ?OpdSigner $signer = null): void
    {
        if ($certificate->signer_name !== null) {
            return;
        }

        $signer ??= $this->primarySigner($certificate->application);

        if ($signer === null) {
            throw new RuntimeException('OPD belum memiliki penandatangan utama.');
        }

        $certificate->update([
            'signer_id' => $signer->id,
            'signer_name' => $signer->name,
            'signer_title' => $signer->title,
            'signer_nip' => $signer->nip,
        ]);
    }

    private function renderBody(InternshipApplication $application, string $type): string
    {
        $template = OpdLetterTemplate::query()
            ->where('opd_id', $application->opd_id)
            ->where('type', $type)
            ->value('body') ?? $this->defaultBody($type);

        return strtr($template, [
            '{nama_peserta}' => $application->user->name,
            '{asal_instansi}' => $application->institution_name,
            '{opd}' => $application->opd?->name ?? '-',
            '{bidang}' => $application->division ?? '-',
            '{tanggal_mulai}' => $application->start_date->translatedFormat('d F Y'),
            '{tanggal_selesai}' => $application->end_date->translatedFormat('d F Y'),
        ]);
    }

    private function primarySigner(InternshipApplication $application): ?OpdSigner
    {
        return OpdSigner::query()
            ->where('opd_id', $application->opd_id)
            ->orderByDesc('is_primary')
            ->orderBy('id')
            ->first();
    }

    private function storePdf(string $path, string $contents): void
    {
        $disk = Storage::disk('local');

        if ($disk->put($path, $contents) === false || ! $disk->exists($path)) {
            throw new RuntimeException("PDF draft gagal disimpan ke disk lokal ({$path}).");
        }
    }
}
