<?php

namespace App\Enums;

enum UserRole: string
{
    case Mahasiswa = 'mahasiswa';
    case AdminVerifikator = 'admin_verifikator';
    case AdminOpd = 'admin_opd';

    /**
     * Label manusiawi untuk ditampilkan di UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Mahasiswa => 'Mahasiswa / Pelajar',
            self::AdminVerifikator => 'Admin Verifikator',
            self::AdminOpd => 'Admin OPD',
        };
    }
}
