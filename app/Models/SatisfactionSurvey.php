<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $application_id
 * @property int $rating
 * @property string|null $comment
 * @property Carbon $submitted_at
 * @property Carbon|null $created_at
 */
#[Fillable(['application_id', 'rating', 'comment', 'submitted_at'])]
class SatisfactionSurvey extends Model
{
    /**
     * Tabel ini hanya memiliki kolom created_at.
     */
    const UPDATED_AT = null;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * Pengajuan pemilik survei.
     *
     * @return BelongsTo<InternshipApplication, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(InternshipApplication::class, 'application_id');
    }
}
