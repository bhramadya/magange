<?php

namespace App\Http\Requests\Opd;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Penempatan (divisi/pembimbing/penanggung jawab) kini diisi Admin OPD saat
 * menyetujui — dipindahkan dari Admin Verifikator sesuai revisi alur.
 */
class ApproveApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'admin_opd';
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
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
            'division.required' => 'Bidang penempatan wajib diisi.',
            'field_supervisor.required' => 'Nama pembimbing lapangan wajib diisi.',
            'person_in_charge.required' => 'Nama penanggung jawab wajib diisi.',
        ];
    }
}
