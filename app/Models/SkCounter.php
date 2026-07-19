<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Counter nomor SK per jenis surat (R4/R5, R9).
 * key: 'acceptance' (surat penerimaan) | 'completion' (surat penyelesaian).
 *
 * @property int $id
 * @property string $key
 * @property int $next_number
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['key', 'next_number'])]
class SkCounter extends Model {}
