<?php

namespace App\Http\Requests\Verifikator;

use Illuminate\Foundation\Http\FormRequest;

class ForwardApplicationRequest extends FormRequest
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
            'opd_id' => ['required', 'integer', 'exists:opds,id'],
            'division' => ['required', 'string', 'max:255'],
            'field_supervisor' => ['required', 'string', 'max:255'],
            'person_in_charge' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'opd_id.required' => 'OPD penempatan wajib dipilih.',
            'opd_id.exists' => 'OPD yang dipilih tidak valid.',
            'division.required' => 'Bidang penempatan wajib diisi.',
            'field_supervisor.required' => 'Nama pembimbing lapangan wajib diisi.',
            'person_in_charge.required' => 'Nama penanggung jawab wajib diisi.',
        ];
    }
}
