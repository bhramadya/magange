<?php

namespace App\Http\Requests\Opd;

use App\Models\OpdPlacementOption;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlacementOptionRequest extends FormRequest
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
            'type' => ['required', Rule::in(OpdPlacementOption::types())],
            'name' => [
                'required',
                'string',
                'max:255',
                // Unik per (OPD, jenis) supaya daftar pilihan tidak berisi
                // nama kembar yang membingungkan saat memutuskan pengajuan.
                Rule::unique('opd_placement_options', 'name')
                    ->where('opd_id', $this->user()?->opd_id)
                    ->where('type', $this->input('type')),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'name.unique' => 'Nama ini sudah ada di daftar.',
        ];
    }
}
