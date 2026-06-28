<?php

namespace App\Services;

use App\Enums\ApplicationStatus;
use App\Jobs\SendJobCertificateNotification;
use App\Models\ApplicationStatusLog;
use App\Models\Certificate;
use App\Models\FinalReport;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class CertificateService
{
    /**
     * Unggah sertifikat selesai magang untuk sebuah laporan akhir.
     * File disimpan di disk privat (storage/app/private/certificates/{id}),
     * sertifikat dibuat terkunci, dan status pengajuan menjadi completed.
     */
    public function uploadCertificate(FinalReport $report, UploadedFile $file, User $actor): Certificate
    {
        return DB::transaction(function () use ($report, $file, $actor): Certificate {
            $applicationId = $report->application_id;

            $path = $file->store("certificates/{$applicationId}", 'local');

            $certificate = Certificate::create([
                'application_id' => $applicationId,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'is_download_locked' => true,
                'uploaded_by' => $actor->id,
            ]);

            $application = $report->application()->first();

            if ($application !== null) {
                $from = $application->status;

                $application->update(['status' => ApplicationStatus::Completed]);

                ApplicationStatusLog::create([
                    'application_id' => $applicationId,
                    'from_status' => $from->value,
                    'to_status' => ApplicationStatus::Completed->value,
                    'changed_by' => $actor->id,
                    'notes' => 'Sertifikat diunggah',
                ]);
            }

            return $certificate;
        });
    }

    /**
     * Buka kunci unduhan sertifikat agar bisa diakses mahasiswa.
     */
    public function unlock(Certificate $certificate): void
    {
        $certificate->update(['is_download_locked' => false]);

        // Beri tahu mahasiswa bahwa sertifikat siap diunduh.
        SendJobCertificateNotification::dispatch($certificate);
    }
}
