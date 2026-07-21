<?php

namespace App\Http\Resources;

use App\Models\InternshipApplication;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Bentuk pengajuan magang untuk frontend (selaras
 * `resources/js/types/magang.ts` -> InternshipApplication). Dipakai bersama
 * dasbor Mahasiswa, Verifikator, dan OPD sehingga bentuk props konsisten.
 *
 * Relasi (opd, finalReport, survey, certificate) dipetakan lewat whenLoaded
 * agar controller mengontrol eager-load & tidak memicu query N+1.
 *
 * @mixin InternshipApplication
 */
class InternshipApplicationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'tujuan_magang' => $this->tujuan_magang,
            'duration_months' => $this->duration_months,
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'institution_name' => $this->institution_name,
            'campus_supervisor' => $this->campus_supervisor,
            'status' => $this->status->value,

            // Data pemohon (dari relasi user) — tampil di tabel & pop-up admin.
            'applicant_name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'applicant_email' => $this->whenLoaded('user', fn () => $this->user?->email),
            'applicant_whatsapp' => $this->whenLoaded('user', fn () => $this->user?->whatsapp_number),

            // URL pas foto (disk privat) bila ada — dilayani route terproteksi.
            'photo_url' => $this->photo_path !== null ? route('pengajuan.foto', $this->resource) : null,

            // Berkas pendukung pendaftaran (disk privat) — route terproteksi
            // pengajuan.dokumen, otorisasi policy view (sama seperti pas foto).
            'surat_pengantar_url' => $this->surat_pengantar_path !== null
                ? route('pengajuan.dokumen', [$this->resource, 'surat-pengantar'])
                : null,
            'cv_url' => $this->cv_path !== null
                ? route('pengajuan.dokumen', [$this->resource, 'cv'])
                : null,
            'portfolio_url' => $this->portfolio_path !== null
                ? route('pengajuan.dokumen', [$this->resource, 'portofolio'])
                : null,

            // Diisi peserta saat mendaftar.
            'nis' => $this->nis,
            'address' => $this->address,
            'campus_supervisor_whatsapp' => $this->campus_supervisor_whatsapp,
            'major' => $this->major,
            'skills' => $this->skills,

            // Diisi Admin Verifikator saat meneruskan.
            'verifikator_note' => $this->verifikator_note,

            // Diisi Admin OPD saat menyetujui.
            'opd' => $this->whenLoaded('opd', fn () => $this->opd ? new OpdResource($this->opd) : null),
            'division' => $this->division,
            'field_supervisor' => $this->field_supervisor,
            'person_in_charge' => $this->person_in_charge,
            // Nomor SK surat penerimaan (R5): di-set sekali saat approve.
            'sk_number' => $this->sk_number,
            'sk_issued_at' => $this->sk_issued_at?->toDateString(),

            'rejection_reason' => $this->rejection_reason,
            'forwarded_at' => $this->forwarded_at?->toISOString(),
            'opd_decision_at' => $this->opd_decision_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),

            // Rekam jejak progres tiket (R6) — hanya bila relasi dimuat.
            'status_logs' => $this->whenLoaded(
                'statusLogs',
                fn () => $this->statusLogs->map(fn ($log): array => [
                    'status' => $log->to_status,
                    'note' => $log->notes,
                    'actor_name' => $log->changedBy?->name,
                    'created_at' => $log->created_at?->toISOString(),
                ])->values()->all(),
            ),

            // Tahap penyelesaian (Fase 4; field aksi OPD ditambah batch 5 —
            // report_url menunjuk route opd.laporan.berkas, hanya bisa
            // dibuka Admin OPD pemilik penempatan).
            'final_report' => $this->whenLoaded('finalReport', fn () => $this->finalReport ? [
                'id' => $this->finalReport->id,
                'status' => $this->finalReport->status->value,
                'file_name' => $this->finalReport->file_name,
                'submitted_at' => $this->finalReport->submitted_at->toISOString(),
                'is_confirmed' => $this->finalReport->is_confirmed,
                'report_url' => route('opd.laporan.berkas', $this->finalReport),
                'completion_sk_number' => $this->finalReport->completion_sk_number,
                'completion_sk_issued_at' => $this->finalReport->completion_sk_issued_at?->toDateString(),
                'completion_letter_available' => $this->finalReport->completion_letter_path !== null,
            ] : null, null),
            'survey_submitted' => $this->whenLoaded('survey', fn () => $this->survey !== null, false),
            'certificate' => $this->whenLoaded('certificate', fn () => $this->certificate ? [
                'id' => $this->certificate->id,
                'is_download_locked' => $this->certificate->is_download_locked,
            ] : null, null),
            'certificate_available' => $this->whenLoaded(
                'certificate',
                fn () => $this->certificate !== null && ! $this->certificate->is_download_locked,
                false,
            ),
        ];
    }
}
