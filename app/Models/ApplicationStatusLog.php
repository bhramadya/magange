<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $application_id
 * @property string|null $from_status
 * @property string $to_status
 * @property int $changed_by
 * @property string|null $notes
 * @property Carbon|null $created_at
 */
#[Fillable(['application_id', 'from_status', 'to_status', 'changed_by', 'notes'])]
class ApplicationStatusLog extends Model
{
    /**
     * Tabel ini hanya memiliki kolom created_at.
     */
    const UPDATED_AT = null;

    /**
     * Pengajuan yang dicatat.
     *
     * @return BelongsTo<InternshipApplication, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(InternshipApplication::class, 'application_id');
    }

    /**
     * User yang memicu perubahan status.
     *
     * @return BelongsTo<User, $this>
     */
    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
