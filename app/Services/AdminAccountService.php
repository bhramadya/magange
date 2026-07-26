<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Auto-generate akun admin (R10/R13): buat akun OPD/verifikator dengan
 * password acak sekali-tampil (flash generatedCredentials) dan paksa ganti
 * password pada login pertama (users.must_change_password).
 */
class AdminAccountService
{
    /**
     * Buat akun Admin OPD untuk OPD baru. Username diambil dari inisial/kode
     * OPD (di-slug, dipastikan unik dengan sufiks angka).
     *
     * @return array{user: User, username: string, password: string}
     */
    public function createOpdAccount(Opd $opd): array
    {
        $username = $this->uniqueUsername($opd->inisial_opd ?: $opd->code);
        $password = Str::password(12);

        $user = User::create([
            'name' => "Admin {$opd->name}",
            'email' => "{$username}@magang.madiun.go.id",
            'username' => $username,
            'password' => $password,
            'role' => UserRole::AdminOpd,
            'opd_id' => $opd->id,
            'is_active' => true,
            'must_change_password' => true,
        ]);

        return ['user' => $user, 'username' => $username, 'password' => $password];
    }

    /**
     * Buat akun Admin Verifikator baru (R13) dengan password auto-generate.
     *
     * @return array{user: User, username: string, password: string}
     */
    public function createVerifikatorAccount(string $name, string $username, ?string $email): array
    {
        $password = Str::password(12);

        $user = User::create([
            'name' => $name,
            'email' => $email ?: "{$username}@magang.madiun.go.id",
            'username' => $username,
            'password' => $password,
            'role' => UserRole::AdminVerifikator,
            'is_active' => true,
            'must_change_password' => true,
        ]);

        return ['user' => $user, 'username' => $username, 'password' => $password];
    }

    /**
     * Reset password akun admin: regenerate acak + wajib ganti saat login.
     *
     * @return array{username: string, password: string}
     */
    public function resetPassword(User $user): array
    {
        $password = Str::password(12);

        $user->forceFill([
            'password' => $password,
            'must_change_password' => true,
        ])->save();

        return ['username' => (string) $user->username, 'password' => $password];
    }

    /**
     * Slug username unik dari kode/inisial OPD (huruf kecil, tanpa spasi).
     */
    private function uniqueUsername(string $base): string
    {
        $slug = Str::slug($base, '_');
        $slug = $slug !== '' ? $slug : 'admin_opd';

        $candidate = $slug;
        $suffix = 1;

        while (User::where('username', $candidate)->exists()) {
            $candidate = "{$slug}_".(++$suffix);
        }

        return $candidate;
    }
}
