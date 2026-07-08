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
            // Catatan khusus Verifikator utk dibaca Admin OPD (opsional).
            'verifikator_note' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Payload tervalidasi sesuai kontrak PengajuanServiceContract::forwardToOpd().
     *
     * @return array{opd_id: int, verifikator_note?: string|null}
     */
    public function validated($key = null, $default = null): array
    {
        /** @var array{opd_id: int, verifikator_note?: string|null} $validated */
        $validated = parent::validated();

        return $validated;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'opd_id.required' => 'OPD penempatan wajib dipilih.',
            'opd_id.exists' => 'OPD yang dipilih tidak valid.',
        ];
    }
}
