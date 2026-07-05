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

            // Diisi peserta saat mendaftar.
            'major' => $this->major,
            'skills' => $this->skills,

            // Diisi Admin Verifikator saat meneruskan.
            'verifikator_note' => $this->verifikator_note,

            // Diisi Admin OPD saat menyetujui.
            'opd' => $this->whenLoaded('opd', fn () => $this->opd ? new OpdResource($this->opd) : null),
            'division' => $this->division,
            'field_supervisor' => $this->field_supervisor,
            'person_in_charge' => $this->person_in_charge,

            'rejection_reason' => $this->rejection_reason,
            'forwarded_at' => $this->forwarded_at?->toISOString(),
            'opd_decision_at' => $this->opd_decision_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),

            // Tahap penyelesaian (Fase 4).
            'final_report' => $this->whenLoaded('finalReport', fn () => $this->finalReport ? [
                'status' => $this->finalReport->status->value,
                'file_name' => $this->finalReport->file_name,
                'submitted_at' => $this->finalReport->submitted_at->toISOString(),
                'is_confirmed' => $this->finalReport->is_confirmed,
            ] : null, null),
            'survey_submitted' => $this->whenLoaded('survey', fn () => $this->survey !== null, false),
            'certificate_available' => $this->whenLoaded(
                'certificate',
                fn () => $this->certificate !== null && ! $this->certificate->is_download_locked,
                false,
            ),
        ];
    }
}
