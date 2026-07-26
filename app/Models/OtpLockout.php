<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Status lockout progresif login OTP per user.
 *
 * @property int $id
 * @property int $user_id
 * @property int $failed_attempts
 * @property int $lockout_level
 * @property CarbonImmutable|null $locked_until
 * @property CarbonImmutable|null $last_attempt_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['user_id', 'failed_attempts', 'lockout_level', 'locked_until', 'last_attempt_at'])]
class OtpLockout extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'failed_attempts' => 'integer',
            'lockout_level' => 'integer',
            'locked_until' => 'immutable_datetime',
            'last_attempt_at' => 'immutable_datetime',
        ];
    }

    /**
     * Pemilik lockout.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
