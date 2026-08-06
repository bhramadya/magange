<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pilihan penempatan yang dipakai Admin OPD saat menyetujui pengajuan.
 * Nilai `type` sengaja sama dengan nama kolom di `internship_applications`
 * supaya pemetaan ke form keputusan tidak butuh terjemahan.
 *
 * @property int $id
 * @property int $opd_id
 * @property string $type
 * @property string $name
 */
#[Fillable(['opd_id', 'type', 'name'])]
class OpdPlacementOption extends Model
{
    /** Bidang/divisi penempatan peserta. */
    public const TYPE_DIVISION = 'division';

    /** Pembimbing lapangan — tidak menandatangani dokumen. */
    public const TYPE_FIELD_SUPERVISOR = 'field_supervisor';

    /** Penanggung jawab — tidak menandatangani dokumen. */
    public const TYPE_PERSON_IN_CHARGE = 'person_in_charge';

    /**
     * @return list<string>
     */
    public static function types(): array
    {
        return [self::TYPE_DIVISION, self::TYPE_FIELD_SUPERVISOR, self::TYPE_PERSON_IN_CHARGE];
    }

    /**
     * @return BelongsTo<Opd, $this>
     */
    public function opd(): BelongsTo
    {
        return $this->belongsTo(Opd::class);
    }
}
