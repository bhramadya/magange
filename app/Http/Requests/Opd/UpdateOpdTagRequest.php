<?php

namespace App\Http\Requests\Opd;

use App\Models\Opd;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Ubah tag kompetensi (kolom description, dipisah koma) sebuah OPD.
 * Hak akses meniru UpdateQuotaRequest:
 *  - Admin OPD: hanya OPD-nya sendiri.
 *  - Admin Verifikator: semua OPD.
 */
class UpdateOpdTagRequest extends FormRequest
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
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'description.max' => 'Tag maksimal 1000 karakter.',
        ];
    }
}
