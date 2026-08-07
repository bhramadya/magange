<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $application_id
 * @property string $file_name
 * @property string $file_path
 * @property bool $is_download_locked
 * @property int $uploaded_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'application_id',
    'file_name',
    'file_path',
    'is_download_locked',
    'uploaded_by',
    'draft_path',
    'signer_id',
    'signer_name',
    'signer_title',
    'signer_nip',
    'signer_nik',
    'signer_degree_prefix',
    'signer_degree_suffix',
    'signer_rank',
    'signer_rank_class',
    'signer_on_behalf_of',
])]
class Certificate extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_download_locked' => 'boolean',
        ];
    }

    /**
     * Pengajuan pemilik sertifikat.
     *
     * @return BelongsTo<InternshipApplication, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(InternshipApplication::class, 'application_id');
    }

    /**
     * Admin yang mengunggah sertifikat.
     *
     * @return BelongsTo<User, $this>
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * @return BelongsTo<OpdSigner, $this>
     */
    public function signer(): BelongsTo
    {
        return $this->belongsTo(OpdSigner::class);
    }
}
