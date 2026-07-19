<?php

namespace App\Http\Requests\Mahasiswa;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Simpan Log Presensi Harian (revisi #22). Lampiran boleh lebih dari satu
 * (attachments[]), masing-masing maks 5MB — PDF/Word/gambar/ZIP.
 */
class StorePresensiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'mahasiswa';
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'activity_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'details' => ['required', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => ['file', 'mimes:pdf,doc,docx,xls,xlsx,jpeg,jpg,png,zip', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'activity_date.required' => 'Tanggal wajib diisi.',
            'start_time.required' => 'Jam mulai wajib diisi.',
            'start_time.date_format' => 'Format jam mulai tidak valid.',
            'end_time.required' => 'Jam selesai wajib diisi.',
            'end_time.date_format' => 'Format jam selesai tidak valid.',
            'end_time.after' => 'Jam selesai harus setelah jam mulai.',
            'details.required' => 'Rincian aktivitas wajib diisi.',
            'attachments.max' => 'Lampiran maksimal 10 berkas.',
            'attachments.*.mimes' => 'Lampiran harus PDF, Word, Excel, gambar, atau ZIP.',
            'attachments.*.max' => 'Ukuran tiap lampiran maksimal 5MB.',
        ];
    }
}
