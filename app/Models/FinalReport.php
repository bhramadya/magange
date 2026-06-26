<?php

namespace App\Models;

use App\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $application_id
 * @property string $file_name
 * @property string $file_path
 * @property bool $is_confirmed
 * @property ReportStatus $status
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 * @property Carbon $submitted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'application_id',
    'file_name',
    'file_path',
    'is_confirmed',
    'status',
    'reviewed_by',
    'reviewed_at',
    'submitted_at',
])]
class FinalReport extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ReportStatus::class,
            'is_confirmed' => 'boolean',
            'reviewed_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * Pengajuan pemilik laporan.
     *
     * @return BelongsTo<InternshipApplication, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(InternshipApplication::class, 'application_id');
    }

    /**
     * Admin Verifikator yang mereview laporan.
     *
     * @return BelongsTo<User, $this>
     */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
