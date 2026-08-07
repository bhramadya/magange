<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use App\Models\OpdLetterTemplate;
use App\Models\OpdSigner;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Model;
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
        // Variabel penandatangan (R3a). Aditif: tidak masuk
        // REQUIRED_PLACEHOLDERS, jadi template lama tetap sah tanpa diedit.
        // Nilainya dibaca dari snapshot dokumen, bukan dari master penandatangan,
        // supaya surat lama tetap menyebut pejabat yang dulu menandatanganinya.
        '{penandatangan}',
        '{jabatan_penandatangan}',
        '{nip_penandatangan}',
        '{pangkat_penandatangan}',
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

        $signer = self::signerSnapshot($application, 'acceptance_signer_');
        $body = $this->renderBody($application, OpdLetterTemplate::TYPE_ACCEPTANCE, $signer);
        $pdf = Pdf::loadView('pdf.acceptance_letter', [
            'application' => $application,
            'body' => $body,
            'signer' => $signer,
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

        $signer = self::signerSnapshot($certificate, 'signer_');
        $body = $this->renderBody($application, OpdLetterTemplate::TYPE_CERTIFICATE, $signer);
        $pdf = Pdf::loadView('pdf.certificate', [
            'application' => $application,
            'certificate' => $certificate,
            'body' => $body,
            'signer' => $signer,
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

        $application->update($this->snapshotAttributes($signer, 'acceptance_signer_'));
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

        $certificate->update($this->snapshotAttributes($signer, 'signer_'));
    }

    /**
     * Snapshot penandatangan surat penyelesaian (Keputusan #5): pejabat diambil
     * saat suratnya dibuat, bukan dipinjam dari surat penerimaan — periode
     * magang bisa berbulan-bulan dan pimpinan OPD bisa berganti di tengahnya.
     * Sama seperti dua snapshot lainnya: ditulis SEKALI.
     */
    public function ensureCompletionSnapshot(FinalReport $report, ?OpdSigner $signer = null): void
    {
        if ($report->completion_signer_name !== null) {
            return;
        }

        $signer ??= $this->primarySigner($report->application);

        // Beda dari dua snapshot lain: surat penyelesaian tetap boleh terbit
        // walau OPD belum sempat mendaftarkan penandatangan (arsip lama,
        // pengajuan jalur legacy). Blok tanda tangannya jatuh ke garis kosong.
        if ($signer === null) {
            return;
        }

        $report->update($this->snapshotAttributes($signer, 'completion_signer_'));
    }

    /**
     * Petakan kolom penandatangan ke kolom snapshot berprefiks.
     *
     * @return array<string, mixed>
     */
    private function snapshotAttributes(OpdSigner $signer, string $prefix): array
    {
        $attributes = [$prefix.'id' => $signer->id];

        foreach (OpdSigner::SNAPSHOT_FIELDS as $field) {
            $attributes[$prefix.$field] = $signer->{$field};
        }

        return $attributes;
    }

    /**
     * Baca snapshot penandatangan pada sebuah dokumen menjadi bentuk siap
     * tampil: nama sudah bergelar, pangkat sudah digabung golongannya.
     *
     * Sumbernya selalu kolom snapshot (acceptance_signer_*, signer_*,
     * completion_signer_*) — bukan relasi ke opd_signers — supaya perubahan
     * data pejabat hari ini tidak menulis ulang surat yang sudah terbit.
     *
     * @return array{name: string|null, title: string|null, nip: string|null, nik: string|null, rank: string|null, on_behalf_of: string|null}
     */
    public static function signerSnapshot(Model $document, string $prefix): array
    {
        $get = fn (string $field): ?string => $document->getAttribute($prefix.$field);

        $name = $get('name');

        return [
            'name' => $name === null
                ? null
                : OpdSigner::formatName($get('degree_prefix'), $name, $get('degree_suffix')),
            'title' => $get('title'),
            'nip' => $get('nip'),
            'nik' => $get('nik'),
            'rank' => OpdSigner::formatRank($get('rank'), $get('rank_class')),
            'on_behalf_of' => $get('on_behalf_of'),
        ];
    }

    /**
     * @param  array<string, string|null>  $signer  hasil signerSnapshot()
     */
    private function renderBody(InternshipApplication $application, string $type, array $signer = []): string
    {
        $template = OpdLetterTemplate::query()
            ->where('opd_id', $application->opd_id)
            ->where('type', $type)
            ->value('body') ?? $this->defaultBody($type);

        return strtr($template, [
            '{nama_peserta}' => $application->user->name,
            '{asal_instansi}' => $application->institution_name,
            // ?? sudah bersemantik isset, jadi opd yang null tetap jatuh ke '-'
            // tanpa perlu ?-> (nullsafe di kiri ?? justru redundan).
            '{opd}' => $application->opd->name ?? '-',
            '{bidang}' => $application->division ?? '-',
            '{tanggal_mulai}' => $application->start_date->translatedFormat('d F Y'),
            '{tanggal_selesai}' => $application->end_date->translatedFormat('d F Y'),
            '{penandatangan}' => $signer['name'] ?? '-',
            '{jabatan_penandatangan}' => $signer['title'] ?? '-',
            '{nip_penandatangan}' => $signer['nip'] ?? '-',
            '{pangkat_penandatangan}' => $signer['rank'] ?? '-',
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
