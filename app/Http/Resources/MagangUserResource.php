<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Bentuk user untuk header/sidebar dasbor (selaras
 * `resources/js/types/magang.ts` -> MagangUser).
 *
 * @mixin User
 */
class MagangUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'whatsapp_number' => $this->whatsapp_number,
            'role' => $this->role->value,
            // Foto profil (disk privat) → route terproteksi milik user sendiri.
            'avatar_url' => $this->avatar_path !== null ? route('profile.avatar') : null,
        ];
    }
}
