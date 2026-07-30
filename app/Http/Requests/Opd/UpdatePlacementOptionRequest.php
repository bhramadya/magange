<?php

namespace App\Http\Requests\Opd;

use App\Models\OpdPlacementOption;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlacementOptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'admin_opd';
    }

    /**
     * Jenis tidak bisa diubah (pindah kategori = hapus lalu tambah), jadi
     * aturan unik memakai jenis milik baris yang sedang diedit.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $option = $this->route('option');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('opd_placement_options', 'name')
                    ->where('opd_id', $this->user()?->opd_id)
                    ->where('type', $option instanceof OpdPlacementOption ? $option->type : null)
                    ->ignore($option instanceof OpdPlacementOption ? $option->id : null),
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
