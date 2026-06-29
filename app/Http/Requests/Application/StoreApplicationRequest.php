<?php

namespace App\Http\Requests\Application;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'whatsapp_number' => ['required', 'string', 'max:20', 'regex:/^[0-9\+\-\(\)\s]+$/'],
            'tujuan_magang' => ['required', 'string', 'max:1000'],
            'duration_months' => ['required', 'integer', 'min:1', 'max:12'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'institution_name' => ['required', 'string', 'max:255'],
            'campus_supervisor' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * Data tervalidasi dengan bentuk array tepat yang dibutuhkan
     * PengajuanServiceContract::submit() (string/int konkret, bukan mixed).
     *
     * @return array{
     *     name: string,
     *     email: string,
     *     whatsapp_number: string,
     *     tujuan_magang: string,
     *     duration_months: int,
     *     start_date: string,
     *     end_date: string,
     *     institution_name: string,
     *     campus_supervisor: string,
     * }
     */
    public function payload(): array
    {
        return [
            'name' => $this->string('name')->toString(),
            'email' => $this->string('email')->toString(),
            'whatsapp_number' => $this->string('whatsapp_number')->toString(),
            'tujuan_magang' => $this->string('tujuan_magang')->toString(),
            'duration_months' => $this->integer('duration_months'),
            'start_date' => $this->string('start_date')->toString(),
            'end_date' => $this->string('end_date')->toString(),
            'institution_name' => $this->string('institution_name')->toString(),
            'campus_supervisor' => $this->string('campus_supervisor')->toString(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'whatsapp_number.required' => 'Nomor WhatsApp wajib diisi.',
            'whatsapp_number.regex' => 'Nomor WhatsApp tidak valid.',
            'tujuan_magang.required' => 'Tujuan magang wajib diisi.',
            'duration_months.required' => 'Durasi magang wajib diisi.',
            'duration_months.min' => 'Durasi magang minimal 1 bulan.',
            'duration_months.max' => 'Durasi magang maksimal 12 bulan.',
            'start_date.required' => 'Tanggal mulai wajib diisi.',
            'start_date.after_or_equal' => 'Tanggal mulai tidak boleh lampau.',
            'end_date.required' => 'Tanggal selesai wajib diisi.',
            'end_date.after' => 'Tanggal selesai harus setelah tanggal mulai.',
            'institution_name.required' => 'Nama instansi asal wajib diisi.',
            'campus_supervisor.required' => 'Nama dosen pembimbing wajib diisi.',
        ];
    }
}
