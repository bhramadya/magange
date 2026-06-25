<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $ticket_number
 * @property int $user_id
 * @property string $tujuan_magang
 * @property int $duration_months
 * @property Carbon $start_date
 * @property Carbon $end_date
 * @property string $institution_name
 * @property string $campus_supervisor
 * @property ApplicationStatus $status
 * @property int|null $opd_id
 * @property string|null $division
 * @property string|null $field_supervisor
 * @property string|null $person_in_charge
 * @property int|null $forwarded_by
 * @property Carbon|null $forwarded_at
 * @property int|null $opd_decision_by
 * @property Carbon|null $opd_decision_at
 * @property string|null $rejection_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'ticket_number',
    'user_id',
    'tujuan_magang',
    'duration_months',
    'start_date',
    'end_date',
    'institution_name',
    'campus_supervisor',
    'status',
    'opd_id',
    'division',
    'field_supervisor',
    'person_in_charge',
    'forwarded_by',
    'forwarded_at',
    'opd_decision_by',
    'opd_decision_at',
    'rejection_reason',
])]
class InternshipApplication extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ApplicationStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'forwarded_at' => 'datetime',
            'opd_decision_at' => 'datetime',
        ];
    }

    /**
     * Mahasiswa pemohon.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * OPD tujuan penempatan.
     *
     * @return BelongsTo<Opd, $this>
     */
    public function opd(): BelongsTo
    {
        return $this->belongsTo(Opd::class);
    }

    /**
     * Admin Verifikator yang meneruskan pengajuan.
     *
     * @return BelongsTo<User, $this>
     */
    public function forwardedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'forwarded_by');
    }

    /**
     * Admin OPD yang membuat keputusan ACC/Tolak.
     *
     * @return BelongsTo<User, $this>
     */
    public function opdDecisionBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opd_decision_by');
    }

    /**
     * Riwayat audit perubahan status.
     *
     * @return HasMany<ApplicationStatusLog, $this>
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(ApplicationStatusLog::class, 'application_id');
    }

    /**
     * Dokumen resmi (surat rekomendasi & surat selesai).
     *
     * @return HasMany<ApplicationDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class, 'application_id');
    }

    /**
     * Laporan akhir magang (1:1).
     *
     * @return HasOne<FinalReport, $this>
     */
    public function finalReport(): HasOne
    {
        return $this->hasOne(FinalReport::class, 'application_id');
    }

    /**
     * Survei kepuasan (1:1).
     *
     * @return HasOne<SatisfactionSurvey, $this>
     */
    public function survey(): HasOne
    {
        return $this->hasOne(SatisfactionSurvey::class, 'application_id');
    }
}
