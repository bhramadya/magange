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
 * @property string|null $username Username login admin (mahasiswa null)
 * @property string|null $whatsapp_number
 * @property string|null $avatar_path Foto profil (disk privat local)
 * @property string|null $password Hash OTP aktif – diperbarui tiap sesi login
 * @property UserRole $role
 * @property int|null $opd_id
 * @property bool $is_active
 * @property bool $must_change_password Wajib ganti password saat login pertama (akun admin auto-generate)
 * @property Carbon|null $last_login_at Waktu login sukses terakhir
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Opd|null $opd
 */
#[Fillable(['name', 'email', 'username', 'whatsapp_number', 'avatar_path', 'password', 'role', 'opd_id', 'is_active', 'must_change_password', 'last_login_at'])]
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
            'must_change_password' => 'boolean',
            'last_login_at' => 'datetime',
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
}
