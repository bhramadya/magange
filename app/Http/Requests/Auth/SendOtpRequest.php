<?php

namespace App\Http\Requests\Auth;

use App\Rules\Recaptcha;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        // Captcha hanya wajib bila secret dikonfigurasi (produksi) — selaras
        // StoreApplicationRequest. Frontend mengirim token v3 action 'otp_send'.
        $captchaConfigured = ! empty(config('services.recaptcha.secret'));

        return [
            'email' => ['required', 'email', 'exists:users,email'],
            'recaptcha_token' => [$captchaConfigured ? 'required' : 'nullable', new Recaptcha($this->ip(), 'otp_send')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.exists' => 'Email tidak terdaftar dalam sistem.',
            'recaptcha_token.required' => 'Verifikasi captcha wajib diselesaikan.',
        ];
    }
}
