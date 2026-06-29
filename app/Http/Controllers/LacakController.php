<?php

namespace App\Http\Controllers;

use App\Models\InternshipApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LacakController extends Controller
{
    /**
     * Lacak status pengajuan publik berdasarkan nomor tiket (?tiket=).
     * Tanpa parameter tiket → halaman pencarian kosong.
     */
    public function index(Request $request): Response
    {
        $ticket = trim((string) $request->query('tiket', ''));

        if ($ticket === '') {
            return Inertia::render('lacak', [
                'ticket' => null,
                'application' => null,
            ]);
        }

        $application = InternshipApplication::query()
            ->with('opd')
            ->where('ticket_number', $ticket)
            ->first();

        return Inertia::render('lacak', [
            'ticket' => $ticket,
            'application' => $application !== null ? $this->transformApplication($application) : null,
        ]);
    }

    /**
     * Bentuk objek sesuai kontrak resources/js/types/magang.ts (InternshipApplication).
     *
     * @return array<string, mixed>
     */
    private function transformApplication(InternshipApplication $application): array
    {
        return [
            'id' => $application->id,
            'ticket_number' => $application->ticket_number,
            'tujuan_magang' => $application->tujuan_magang,
            'duration_months' => $application->duration_months,
            'start_date' => $application->start_date->format('Y-m-d'),
            'end_date' => $application->end_date->format('Y-m-d'),
            'institution_name' => $application->institution_name,
            'campus_supervisor' => $application->campus_supervisor,
            'status' => $application->status->value,
            'opd' => $application->opd !== null ? [
                'id' => $application->opd->id,
                'name' => $application->opd->name,
                'code' => $application->opd->code,
            ] : null,
            'division' => $application->division,
            'field_supervisor' => $application->field_supervisor,
            'person_in_charge' => $application->person_in_charge,
            'rejection_reason' => $application->rejection_reason,
            'forwarded_at' => $application->forwarded_at?->toIso8601String(),
            'opd_decision_at' => $application->opd_decision_at?->toIso8601String(),
            'created_at' => $application->created_at?->toIso8601String(),
            'final_report' => null,
            'survey_submitted' => false,
            'certificate_available' => false,
        ];
    }
}
