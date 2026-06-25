<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case PendingVerifikator = 'pending_verifikator';
    case ForwardedOpd = 'forwarded_opd';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Ongoing = 'ongoing';
    case CompletionSubmitted = 'completion_submitted';
    case Completed = 'completed';

    /**
     * Label manusiawi untuk ditampilkan di dasbor/tiket.
     */
    public function label(): string
    {
        return match ($this) {
            self::PendingVerifikator => 'Tahap Verifikator Admin',
            self::ForwardedOpd => 'Tahap Admin OPD',
            self::Approved => 'Disetujui',
            self::Rejected => 'Ditolak',
            self::Ongoing => 'Sedang Magang',
            self::CompletionSubmitted => 'Diajukan Proses Selesai',
            self::Completed => 'Selesai',
        };
    }
}
