<?php

namespace App\Http\Requests\Opd;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateCertificateDraftRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'admin_opd';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Wajib & ter-scope ke OPD sendiri: sertifikat tak boleh terbit
            // tanpa penandatangan, dan id milik OPD lain harus ditolak di
            // level validasi (bukan hanya di TteController::signerFor).
            'signer_id' => [
                'required',
                'integer',
                Rule::exists('opd_signers', 'id')->where(
                    fn (Builder $query): Builder => $query->where('opd_id', $this->user()?->opd_id),
                ),
            ],
        ];
    }
}
