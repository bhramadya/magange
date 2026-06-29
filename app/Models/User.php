<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $whatsapp_number
 * @property array<string, mixed>|null $notification_preferences
 * @property string|null $password Hash OTP aktif – diperbarui tiap sesi login
 * @property UserRole $role
 * @property int|null $opd_id
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Opd|null $opd
 */
#[Fillable(['name', 'email', 'whatsapp_number', 'notification_preferences', 'password', 'role', 'opd_id', 'is_active'])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'notification_preferences' => 'array',
        ];
    }

    /**
     * OPD tempat admin ini bertugas (khusus role admin_opd).
     *
     * @return BelongsTo<Opd, $this>
     */
    public function opd(): BelongsTo
    {
        return $this->belongsTo(Opd::class);
    }

    /**
     * Pengajuan magang yang dibuat oleh user ini (khusus mahasiswa).
     *
     * @return HasMany<InternshipApplication, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(InternshipApplication::class);
    }

    /**
     * Token OTP milik user ini.
     *
     * @return HasMany<OtpToken, $this>
     */
    public function otpTokens(): HasMany
    {
        return $this->hasMany(OtpToken::class);
    }

    /**
     * Helper cek peran.
     */
    public function hasRole(UserRole $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Serialisasi sesuai kontrak frontend resources/js/types/magang.ts (MagangUser).
     *
     * @return array{id: int, name: string, email: string, whatsapp_number: string|null, role: string}
     */
    public function toMagangArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'whatsapp_number' => $this->whatsapp_number,
            'role' => $this->role->value,
        ];
    }
}
