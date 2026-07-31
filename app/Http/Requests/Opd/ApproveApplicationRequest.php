<?php

namespace App\Http\Requests\Opd;

use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Penempatan (divisi/pembimbing/penanggung jawab) kini diisi Admin OPD saat
 * menyetujui — dipindahkan dari Admin Verifikator sesuai revisi alur.
 *
 * Penandatangan WAJIB: tanpa itu approve jatuh ke jalur lama (status langsung
 * `approved` + email otomatis berkop generik) sehingga pengajuan tak pernah
 * masuk Menunggu TTE. Data kop surat juga wajib lengkap supaya PDF yang
 * ditandatangani tidak terbit dengan kop setengah jadi.
 */
class ApproveApplicationRequest extends FormRequest
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
            'division' => ['required', 'string', 'max:255'],
            'field_supervisor' => ['required', 'string', 'max:255'],
            'person_in_charge' => ['required', 'string', 'max:255'],
            'signer_id' => [
                'required',
                'integer',
                Rule::exists('opd_signers', 'id')->where(
                    fn (Builder $query): Builder => $query->where('opd_id', $this->user()?->opd_id),
                ),
            ],
        ];
    }

    /**
     * Kesiapan OPD dicek setelah aturan field: penandatangan harus sudah
     * terdaftar dan Data Surat (alamat/telepon/pos-el) sudah terisi, keduanya
     * dikelola di menu Kelola Surat.
     *
     * @return list<callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $opd = $this->user()?->opd;

                if ($opd === null) {
                    return;
                }

                if (! $opd->signers()->exists()) {
                    $validator->errors()->add(
                        'signer_id',
                        'OPD belum memiliki penandatangan. Tambahkan lebih dahulu di menu Kelola Surat.',
                    );
                }

                $letterheadKosong = blank($opd->letterhead_address)
                    || blank($opd->letterhead_phone)
                    || blank($opd->letterhead_email);

                if ($letterheadKosong) {
                    $validator->errors()->add(
                        'letterhead',
                        'Data Surat (alamat, telepon, pos-el) belum lengkap. Lengkapi di menu Kelola Surat sebelum menyetujui pengajuan.',
                    );
                }
            },
        ];
    }

    /**
     * Payload tervalidasi sesuai kontrak PengajuanServiceContract::approve().
     *
     * @return array{division: string, field_supervisor: string, person_in_charge: string, signer_id: int}
     */
    public function validated($key = null, $default = null): array
    {
        /** @var array{division: string, field_supervisor: string, person_in_charge: string, signer_id: int} $validated */
        $validated = parent::validated();

        return $validated;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'division.required' => 'Bidang penempatan wajib diisi.',
            'field_supervisor.required' => 'Nama pembimbing lapangan wajib diisi.',
            'person_in_charge.required' => 'Nama penanggung jawab wajib diisi.',
            'signer_id.required' => 'Penandatangan wajib dipilih.',
            'signer_id.exists' => 'Penandatangan tidak ditemukan pada OPD ini.',
        ];
    }
}
