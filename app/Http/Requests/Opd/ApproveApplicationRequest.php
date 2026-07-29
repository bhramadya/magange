<?php

namespace App\Http\Requests\Opd;

use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'signer_id' => [
                Rule::requiredIf(fn (): bool => (bool) $this->user()?->opd?->signers()->exists()),
                'nullable',
                'integer',
                Rule::exists('opd_signers', 'id')->where(
                    fn (Builder $query): Builder => $query->where('opd_id', $this->user()?->opd_id),
                ),
            ],
        ];
    }

    /**
     * Payload tervalidasi sesuai kontrak PengajuanServiceContract::approve().
     *
     * @return array{division: string, field_supervisor: string, person_in_charge: string, signer_id?: int|null}
     */
    public function validated($key = null, $default = null): array
    {
        /** @var array{division: string, field_supervisor: string, person_in_charge: string} $validated */
        $validated = parent::validated();

        return $validated;
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
