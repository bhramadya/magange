<?php

namespace App\Http\Requests\Opd;

use App\Models\Opd;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Ubah kuota magang sebuah OPD. Hak akses (revisi mentor):
 *  - Admin OPD: hanya boleh mengubah kuota OPD-nya sendiri.
 *  - Admin Verifikator: boleh mengubah kuota semua OPD.
 * Selain itu ditolak 403 lewat authorize().
 */
class UpdateQuotaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        $opd = $this->route('opd');

        if ($user->role->value === 'admin_verifikator') {
            return true;
        }

        return $user->role->value === 'admin_opd'
            && $opd instanceof Opd
            && $user->opd_id === $opd->id;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $opd = $this->route('opd');
        $minimal = $opd instanceof Opd ? $opd->quota_used : 0;

        // Kuota tidak boleh di bawah jumlah yang sudah terpakai.
        return [
            'quota_total' => ['required', 'integer', "min:{$minimal}", 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'quota_total.required' => 'Kuota wajib diisi.',
            'quota_total.integer' => 'Kuota harus berupa angka.',
            'quota_total.min' => 'Kuota tidak boleh lebih kecil dari kuota yang sudah terpakai.',
        ];
    }
}
