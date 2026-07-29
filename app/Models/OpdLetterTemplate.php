<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['opd_id', 'type', 'body'])]
class OpdLetterTemplate extends Model
{
    public const TYPE_ACCEPTANCE = 'acceptance';

    public const TYPE_CERTIFICATE = 'certificate';

    /**
     * @return BelongsTo<Opd, $this>
     */
    public function opd(): BelongsTo
    {
        return $this->belongsTo(Opd::class);
    }
}
