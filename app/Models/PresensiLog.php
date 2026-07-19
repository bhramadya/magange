<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Log Presensi Harian peserta magang (revisi #22).
 *
 * @property int $id
 * @property int $user_id
 * @property Carbon $activity_date
 * @property string $start_time
 * @property string $end_time
 * @property string $details
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Collection<int, PresensiAttachment> $attachments
 */
#[Fillable(['user_id', 'activity_date', 'start_time', 'end_time', 'details'])]
class PresensiLog extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'activity_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<PresensiAttachment, $this>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(PresensiAttachment::class);
    }
}
