<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $opd_id
 * @property string $name
 * @property string|null $degree_prefix Gelar depan (Dr., Ir.)
 * @property string|null $degree_suffix Gelar belakang (S.Kom., M.M.)
 * @property string $title
 * @property string|null $rank Pangkat (Pembina Tingkat I)
 * @property string|null $rank_class Golongan (IV/b)
 * @property string|null $on_behalf_of Keterangan "a.n. ..."
 * @property string $nip
 * @property string|null $nik
 * @property bool $is_primary
 */
#[Fillable([
    'opd_id',
    'name',
    'degree_prefix',
    'degree_suffix',
    'title',
    'rank',
    'rank_class',
    'on_behalf_of',
    'nip',
    'nik',
    'is_primary',
])]
class OpdSigner extends Model
{
    /**
     * Kolom yang ikut disalin ke snapshot dokumen, dipetakan
     * "kolom di opd_signers" => "akhiran kolom snapshot".
     *
     * Dipakai LetterDocumentService agar penambahan variabel penandatangan
     * berikutnya cukup diubah di satu tempat, bukan di tiga method snapshot.
     *
     * @var array<int, string>
     */
    public const SNAPSHOT_FIELDS = [
        'name',
        'title',
        'nip',
        'nik',
        'degree_prefix',
        'degree_suffix',
        'rank',
        'rank_class',
        'on_behalf_of',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    /**
     * Nama lengkap bergelar: "Dr. Budi Santoso, S.Kom., M.M.".
     * Gelar belakang dipisah koma, gelar depan cukup spasi — konvensi surat
     * dinas. Keduanya opsional, jadi data lama tetap tampil apa adanya.
     */
    public function formattedName(): string
    {
        return self::formatName($this->degree_prefix, $this->name, $this->degree_suffix);
    }

    /**
     * Padanan formattedName() untuk data snapshot (yang bukan model OpdSigner).
     */
    public static function formatName(?string $prefix, ?string $name, ?string $suffix): string
    {
        $full = trim(($prefix ?? '').' '.($name ?? ''));

        if (($suffix ?? '') !== '') {
            $full .= ', '.$suffix;
        }

        return $full;
    }

    /**
     * Pangkat + golongan pada satu baris: "Pembina Tingkat I (IV/b)".
     * Mengembalikan null bila keduanya kosong, supaya view bisa melewatinya.
     */
    public static function formatRank(?string $rank, ?string $rankClass): ?string
    {
        $rank = trim((string) $rank);
        $rankClass = trim((string) $rankClass);

        return match (true) {
            $rank !== '' && $rankClass !== '' => "{$rank} ({$rankClass})",
            $rank !== '' => $rank,
            $rankClass !== '' => $rankClass,
            default => null,
        };
    }

    /**
     * @return BelongsTo<Opd, $this>
     */
    public function opd(): BelongsTo
    {
        return $this->belongsTo(Opd::class);
    }
}
