<?php

namespace App\Http\Requests\Verifikator;

use App\Models\Opd;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Ubah OPD (Admin Verifikator). Kuota tidak boleh di bawah jumlah yang sudah
 * terpakai (selaras UpdateQuotaRequest). Kode tetap unik, kecuali dirinya.
 */
class UpdateOpdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'admin_verifikator';
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $opd = $this->route('opd');
        $minimal = $opd instanceof Opd ? $opd->quota_used : 0;
        $opdId = $opd instanceof Opd ? $opd->id : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('opds', 'code')->ignore($opdId)],
            'kode_opd' => ['nullable', 'integer', 'min:0', Rule::unique('opds', 'kode_opd')->ignore($opdId)],
            'inisial_opd' => ['nullable', 'string', 'max:30'],
            'description' => ['nullable', 'string', 'max:1000'],
            'quota_total' => ['required', 'integer', "min:{$minimal}", 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama OPD wajib diisi.',
            'code.required' => 'Kode OPD wajib diisi.',
            'code.unique' => 'Kode OPD sudah digunakan.',
            'kode_opd.integer' => 'Kode OPD internal harus berupa angka.',
            'kode_opd.unique' => 'Kode OPD internal sudah digunakan.',
            'quota_total.required' => 'Kuota wajib diisi.',
            'quota_total.integer' => 'Kuota harus berupa angka.',
            'quota_total.min' => 'Kuota tidak boleh lebih kecil dari kuota yang sudah terpakai.',
        ];
    }
}
