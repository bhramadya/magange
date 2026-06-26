<?php

namespace App\Models;

use App\Enums\RateLimitIdentifierType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $ip_address
 * @property string $identifier
 * @property RateLimitIdentifierType $identifier_type
 * @property string|null $action_type
 * @property Carbon $submitted_at
 */
#[Fillable(['ip_address', 'identifier', 'identifier_type', 'action_type', 'submitted_at'])]
class FormRateLimit extends Model
{
    /**
     * Tabel ini tidak memakai kolom created_at/updated_at standar.
     */
    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'identifier_type' => RateLimitIdentifierType::class,
            'submitted_at' => 'datetime',
        ];
    }
}
