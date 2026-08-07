<?php

namespace App\Http\Requests\Opd;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOpdSignerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'admin_opd';
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'nip' => ['required', 'string', 'max:50'],
            'nik' => ['nullable', 'string', 'digits:16'],
            'degree_prefix' => ['nullable', 'string', 'max:50'],
            'degree_suffix' => ['nullable', 'string', 'max:50'],
            'rank' => ['nullable', 'string', 'max:100'],
            'rank_class' => ['nullable', 'string', 'max:20'],
            'on_behalf_of' => ['nullable', 'string', 'max:255'],
            'is_primary' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama penandatangan wajib diisi.',
            'title.required' => 'Jabatan wajib diisi.',
            'nip.required' => 'NIP wajib diisi.',
            'nik.digits' => 'NIK harus terdiri dari 16 digit.',
        ];
    }
}
