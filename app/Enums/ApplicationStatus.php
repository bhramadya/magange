<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case PendingVerifikator = 'pending_verifikator';
    case ForwardedOpd = 'forwarded_opd';
    case WaitingTte = 'waiting_tte';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Ongoing = 'ongoing';
    case CompletionSubmitted = 'completion_submitted';
    case NeedsCertificate = 'needs_certificate';
    case Completed = 'completed';

    /**
     * Status yang menandakan pengajuan masih berjalan — dipakai untuk
     * validasi "satu magang aktif" (StoreApplicationRequest + SubmissionService).
     *
     * @return list<ApplicationStatus>
     */
    public static function activeStatuses(): array
    {
        return [
            self::PendingVerifikator,
            self::ForwardedOpd,
            self::WaitingTte,
            self::Approved,
            self::Ongoing,
            self::CompletionSubmitted,
            self::NeedsCertificate,
        ];
    }

    /**
     * Label manusiawi untuk ditampilkan di dasbor/tiket.
     */
    public function label(): string
    {
        return match ($this) {
            self::PendingVerifikator => 'Tahap Verifikator Admin',
            self::ForwardedOpd => 'Tahap Admin OPD',
            self::WaitingTte => 'Menunggu TTE',
            self::Approved => 'Disetujui',
            self::Rejected => 'Ditolak',
            self::Ongoing => 'Sedang Magang',
            self::CompletionSubmitted => 'Diajukan Proses Selesai',
            self::NeedsCertificate => 'Perlu Sertifikat',
            self::Completed => 'Selesai',
        };
    }
}
