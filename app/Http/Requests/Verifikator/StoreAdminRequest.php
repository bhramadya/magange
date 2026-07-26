<?php

namespace App\Http\Requests\Verifikator;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Tambah sesama Admin Verifikator (R13). Password TIDAK diinput —
 * di-generate otomatis oleh AdminAccountService.
 */
class StoreAdminRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:50', 'regex:/^[a-zA-Z0-9._-]+$/', Rule::unique('users', 'username')],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'username.required' => 'Username wajib diisi.',
            'username.regex' => 'Username hanya boleh huruf, angka, titik, strip, dan garis bawah.',
            'username.unique' => 'Username sudah digunakan.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan.',
        ];
    }
}
