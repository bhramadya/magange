<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string|null $description
 * @property bool $is_active
 * @property int $quota_total
 * @property int $quota_used
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'code', 'description', 'is_active', 'quota_total', 'quota_used'])]
class Opd extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'quota_total' => 'integer',
            'quota_used' => 'integer',
        ];
    }

    /**
     * Admin OPD yang bertugas di instansi ini.
     *
     * @return HasMany<User, $this>
     */
    public function admins(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Pengajuan magang yang ditempatkan di OPD ini.
     *
     * @return HasMany<InternshipApplication, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(InternshipApplication::class);
    }
}
