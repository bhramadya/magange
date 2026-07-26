<?php

namespace App\Http\Resources;

use App\Models\Opd;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Bentuk OPD untuk frontend (selaras `resources/js/types/magang.ts` -> Opd).
 * Kolom DB `quota_total` dipetakan ke `quota` yang dipakai UI.
 *
 * @mixin Opd
 */
class OpdResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'kode_opd' => $this->kode_opd,
            'inisial_opd' => $this->inisial_opd,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'quota' => $this->quota_total,
            'quota_used' => $this->quota_used,
        ];
    }
}
