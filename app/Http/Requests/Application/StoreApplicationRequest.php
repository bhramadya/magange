<?php

namespace App\Http\Requests\Application;

use App\Rules\Recaptcha;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Hitung durasi (bulan) dari rentang tanggal bila frontend tak mengirimnya.
     * Form publik hanya meminta tanggal mulai/selesai (flowchart Fase 1).
     */
    protected function prepareForValidation(): void
    {
        if ($this->filled('start_date') && $this->filled('end_date') && ! $this->filled('duration_months')) {
            try {
                $start = Carbon::parse((string) $this->input('start_date'));
                $end = Carbon::parse((string) $this->input('end_date'));
                $months = (int) $start->diffInMonths($end);

                $this->merge([
                    'duration_months' => max(1, min(12, $months ?: 1)),
                ]);
            } catch (\Throwable) {
                // Biarkan validasi tanggal menangani input tak valid.
            }
        }
    }

    /**
     * @return array<string, array<int, mixed>|ValidationRule>
     */
    public function rules(): array
    {
        // Captcha hanya wajib bila secret dikonfigurasi (produksi). Tanpa secret
        // (lokal/test) token boleh kosong & verifikasi dilewati oleh Rule.
        $captchaConfigured = ! empty(config('services.recaptcha.secret'));

        return [
            'name' => ['required', 'string', 'max:255'],
            'nis' => ['nullable', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255'],
            'whatsapp_number' => ['required', 'string', 'max:20', 'regex:/^[0-9\+\-\(\)\s]+$/'],
            'tujuan_magang' => ['required', 'string', 'max:1000'],
            'duration_months' => ['required', 'integer', 'min:1', 'max:12'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'institution_name' => ['required', 'string', 'max:255'],
            // Alamat & Penanggung Jawab tampil sebagai field wajib di form (hanya
            // Jurusan yang opsional) — validasi diselaraskan dengan UI.
            'address' => ['required', 'string', 'max:1000'],
            'campus_supervisor' => ['required', 'string', 'max:255'],
            'campus_supervisor_whatsapp' => ['required', 'string', 'max:20', 'regex:/^[0-9\+\-\(\)\s]+$/'],
            'guardian_name' => ['required', 'string', 'max:255'],
            'guardian_whatsapp' => ['required', 'string', 'max:20', 'regex:/^[0-9\+\-\(\)\s]+$/'],
            'major' => ['nullable', 'string', 'max:255'],
            'skills' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:2048'],
            // Berkas pendukung opsional ("jika ada"). Dokumen: PDF/Word maks 2MB;
            // Portofolio juga menerima gambar/ZIP dengan batas lebih longgar (10MB).
            'surat_pengantar' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:2048'],
            'cv' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:2048'],
            'portfolio' => ['nullable', 'file', 'mimes:pdf,doc,docx,zip,jpeg,jpg,png', 'max:10240'],
            // Gerbang anti-bot (flowchart Fase 1): token reCAPTCHA v2 checkbox.
            'recaptcha_token' => [$captchaConfigured ? 'required' : 'nullable', new Recaptcha($this->ip())],
        ];
    }

    /**
     * Payload tervalidasi untuk PengajuanServiceContract::submit().
     * Buang `recaptcha_token` & berkas (photo/surat_pengantar/cv/portfolio,
     * ditangani terpisah oleh controller).
     *
     * @return array{
     *     name: string,
     *     nis?: string|null,
     *     email: string,
     *     whatsapp_number: string,
     *     tujuan_magang: string,
     *     duration_months: int,
     *     start_date: string,
     *     end_date: string,
     *     institution_name: string,
     *     address: string,
     *     campus_supervisor: string,
     *     campus_supervisor_whatsapp: string,
     *     guardian_name: string,
     *     guardian_whatsapp: string,
     *     major?: string|null,
     *     skills?: string|null,
     * }
     */
    public function validated($key = null, $default = null): array
    {
        /** @var array{name: string, nis?: string|null, email: string, whatsapp_number: string, tujuan_magang: string, duration_months: int, start_date: string, end_date: string, institution_name: string, address: string, campus_supervisor: string, campus_supervisor_whatsapp: string, guardian_name: string, guardian_whatsapp: string, major?: string|null, skills?: string|null} $validated */
        $validated = collect(parent::validated())
            ->except(['recaptcha_token', 'photo', 'surat_pengantar', 'cv', 'portfolio'])
            ->all();

        return $validated;
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
            'address.required' => 'Alamat lengkap wajib diisi.',
            'campus_supervisor.required' => 'Nama dosen pembimbing wajib diisi.',
            'campus_supervisor_whatsapp.required' => 'Nomor WA dosen/guru pembimbing wajib diisi.',
            'campus_supervisor_whatsapp.regex' => 'Nomor WA dosen/guru pembimbing tidak valid.',
            'guardian_name.required' => 'Nama penanggung jawab wajib diisi.',
            'guardian_whatsapp.required' => 'Nomor WA penanggung jawab wajib diisi.',
            'guardian_whatsapp.regex' => 'Nomor WA penanggung jawab tidak valid.',
            'photo.image' => 'Pas foto harus berupa gambar.',
            'photo.mimes' => 'Pas foto harus berformat JPG atau PNG.',
            'photo.max' => 'Ukuran pas foto maksimal 2 MB.',
            'surat_pengantar.mimes' => 'Surat Pengantar harus berformat PDF atau Word.',
            'surat_pengantar.max' => 'Ukuran Surat Pengantar maksimal 2MB.',
            'cv.mimes' => 'CV harus berformat PDF atau Word.',
            'cv.max' => 'Ukuran CV maksimal 2MB.',
            'portfolio.mimes' => 'Portofolio harus berformat PDF, Word, ZIP, atau gambar.',
            'portfolio.max' => 'Ukuran Portofolio maksimal 10MB.',
            'recaptcha_token.required' => 'Verifikasi captcha wajib diselesaikan.',
        ];
    }
}
