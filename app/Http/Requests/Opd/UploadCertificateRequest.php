<?php

namespace App\Http\Requests\Opd;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Unggah e-sertifikat penyelesaian magang oleh Admin OPD (batch 5: menu
 * Laporan pindah total dari verifikator ke OPD). Kepemilikan report dicek
 * di Opd\ReportController::authorizeReport().
 */
class UploadCertificateRequest extends FormRequest
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
            'file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'File sertifikat wajib diunggah.',
            'file.file' => 'File yang diunggah tidak valid.',
            'file.mimes' => 'File harus berformat PDF.',
            'file.max' => 'Ukuran file maksimal 10 MB.',
        ];
    }
}
