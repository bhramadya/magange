<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Contracts\PengajuanServiceContract;
use App\Enums\ApplicationStatus;
use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Mahasiswa\UploadReportRequest;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Date;

class ReportController extends Controller
{
    public function __construct(private PengajuanServiceContract $submissionService) {}

    public function store(UploadReportRequest $request, InternshipApplication $application): RedirectResponse
    {
        $this->authorize('update', $application);

        $validated = $request->validated();

        $file = $request->file('file');

        if ($file === null) {
            return back()->withErrors(['file' => 'File laporan tidak ditemukan.']);
        }

        $path = $file->store("reports/{$application->id}", 'local');

        FinalReport::create([
            'application_id' => $application->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'is_confirmed' => $validated['is_confirmed'],
            'status' => ReportStatus::Pending,
            'submitted_at' => Date::now(),
        ]);

        // Aktor "Selesai" #4: peserta menekan tombol selesai saat unggah laporan.
        // Hanya bila magang sedang berjalan / penyelesaian sudah diajukan.
        if (
            $validated['is_confirmed']
            && in_array($application->status, [ApplicationStatus::Ongoing, ApplicationStatus::CompletionSubmitted], true)
        ) {
            $this->submissionService->complete($application, $request->user(), 'Diselesaikan oleh peserta saat unggah laporan');

            return back()->with('success', 'Laporan akhir terkirim & magang ditandai selesai.');
        }

        return back()->with('success', 'Laporan akhir berhasil diunggah dan menunggu review.');
    }
}
