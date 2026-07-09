<?php

namespace App\Http\Requests\Mahasiswa;

use Illuminate\Foundation\Http\FormRequest;

class SubmitSurveyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'mahasiswa';
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        // Survei 5 aspek: tiap aspek 1–5 bintang. Nilai agregat `rating`
        // (rata-rata) dihitung server-side di controller, bukan dari klien.
        return [
            'ratings' => ['required', 'array', 'size:5'],
            'ratings.*' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ratings.required' => 'Rating survei wajib diisi.',
            'ratings.size' => 'Semua aspek survei wajib dinilai.',
            'ratings.*.required' => 'Setiap aspek wajib dinilai.',
            'ratings.*.integer' => 'Rating harus berupa angka.',
            'ratings.*.min' => 'Rating minimal 1 bintang.',
            'ratings.*.max' => 'Rating maksimal 5 bintang.',
            'comment.max' => 'Komentar maksimal 500 karakter.',
        ];
    }
}
