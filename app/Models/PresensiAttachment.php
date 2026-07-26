<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Lampiran log presensi harian (revisi #22) — disk privat, bisa lebih dari satu.
 *
 * @property int $id
 * @property int $presensi_log_id
 * @property string $path
 * @property string $original_name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read PresensiLog $log
 */
#[Fillable(['presensi_log_id', 'path', 'original_name'])]
class PresensiAttachment extends Model
{
    /**
     * @return BelongsTo<PresensiLog, $this>
     */
    public function log(): BelongsTo
    {
        return $this->belongsTo(PresensiLog::class, 'presensi_log_id');
    }
}
