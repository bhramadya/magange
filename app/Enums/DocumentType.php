<?php

namespace App\Enums;

enum DocumentType: string
{
    case AcceptanceLetter = 'acceptance_letter';
    case CompletionLetter = 'completion_letter';

    /**
     * Label manusiawi untuk ditampilkan di UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::AcceptanceLetter => 'Surat Rekomendasi / Tanda Terima',
            self::CompletionLetter => 'Surat Selesai Magang',
        };
    }
}
