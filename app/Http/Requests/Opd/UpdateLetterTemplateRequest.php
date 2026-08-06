<?php

namespace App\Http\Requests\Opd;

use App\Models\OpdLetterTemplate;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLetterTemplateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'admin_opd';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'in:'.OpdLetterTemplate::TYPE_ACCEPTANCE.','.OpdLetterTemplate::TYPE_CERTIFICATE],
            'body' => ['required', 'string', 'max:10000'],
        ];
    }
}
