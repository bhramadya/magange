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
     * Data tervalidasi dengan bentuk array tepat yang dibutuhkan
     * PengajuanServiceContract::forwardToOpd().
     *
     * @return array{opd_id: int, division: string, field_supervisor: string, person_in_charge: string}
     */
    public function payload(): array
    {
        return [
            'opd_id' => $this->integer('opd_id'),
            'division' => $this->string('division')->toString(),
            'field_supervisor' => $this->string('field_supervisor')->toString(),
            'person_in_charge' => $this->string('person_in_charge')->toString(),
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
