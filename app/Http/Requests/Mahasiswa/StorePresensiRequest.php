<?php

namespace App\Http\Requests\Mahasiswa;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Absen Harian (batch 5): status hadir/izin/sakit, rincian aktivitas, dan
 * Dokumentasi Foto wajib 1–3 gambar @2MB. Tanggal TIDAK dari input —
 * controller men-set today(); duplikat hari yang sama ditolak di controller.
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
            'status' => ['required', 'in:hadir,izin,sakit'],
            'details' => ['required', 'string', 'max:5000'],
            'attachments' => ['required', 'array', 'min:1', 'max:3'],
            'attachments.*' => ['file', 'image', 'mimes:jpeg,jpg,png', 'max:2048'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Status kehadiran wajib dipilih.',
            'status.in' => 'Status kehadiran harus Hadir, Izin, atau Sakit.',
            'details.required' => 'Rincian aktivitas wajib diisi.',
            'attachments.required' => 'Dokumentasi foto wajib diunggah (minimal 1).',
            'attachments.min' => 'Dokumentasi foto minimal 1 berkas.',
            'attachments.max' => 'Dokumentasi foto maksimal 3 berkas.',
            'attachments.*.image' => 'Dokumentasi harus berupa gambar.',
            'attachments.*.mimes' => 'Dokumentasi harus JPG atau PNG.',
            'attachments.*.max' => 'Ukuran tiap foto maksimal 2MB.',
        ];
    }
}
