<?php

namespace App\Http\Requests\Verifikator;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Tambah OPD baru (Admin Verifikator). Verifikator berhak mengelola seluruh
 * OPD — otorisasi role ditangani middleware route (role:admin_verifikator).
 */
class StoreOpdRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('opds', 'code')],
            'description' => ['nullable', 'string', 'max:1000'],
            'quota_total' => ['required', 'integer', 'min:0', 'max:1000'],
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
            'quota_total.required' => 'Kuota wajib diisi.',
            'quota_total.integer' => 'Kuota harus berupa angka.',
            'quota_total.min' => 'Kuota tidak boleh negatif.',
        ];
    }
}
