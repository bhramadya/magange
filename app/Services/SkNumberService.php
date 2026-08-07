<?php

namespace App\Services;

use App\Models\Opd;
use App\Models\SkCounter;
use Illuminate\Support\Facades\Date;

/**
 * Generator Nomor SK auto-increment (R4/R5, R9) dengan format mengikuti acuan
 * kop surat Pemkot Madiun: `503.11/{urut}/{kode-unit}/{tahun}`,
 * mis. "503.11/21/401.106/2026".
 *
 * Sejak Keputusan #4 (Batch D): nomor dihitung per OPD. Kode unit memakai
 * `opds.letter_code` (default `401.106`), dan counter dipisah per OPD pada
 * tabel sk_counters (`key` = "acceptance:{opd_id}" / "completion:{opd_id}").
 * Panggilan tanpa opd (mis. seeder/verifikator) memakai key global lama.
 *
 * Nomor diambil dari tabel sk_counters (baris per jenis surat) dengan
 * lockForUpdate agar bebas race condition — WAJIB dipanggil dari dalam
 * DB::transaction pemanggil. Start number dapat diatur admin (setStart).
 */
class SkNumberService
{
    public const KEY_ACCEPTANCE = 'acceptance';

    public const KEY_COMPLETION = 'completion';

    /** Kode klasifikasi & kode unit pada format nomor SK (acuan kopsurat). */
    private const CLASSIFICATION = '503.11';

    private const UNIT_CODE = '401.106';

    /**
     * Ambil nomor SK berikutnya untuk jenis surat, lalu naikkan counter.
     * Bila $opdId diberikan, counter & kode unit dipisah per OPD.
     * Panggil HANYA di dalam DB::transaction.
     */
    public function next(string $key, ?int $opdId = null): string
    {
        $counterKey = $this->counterKey($key, $opdId);

        $counter = SkCounter::query()
            ->where('key', $counterKey)
            ->lockForUpdate()
            ->first();

        if ($counter === null) {
            $counter = SkCounter::create(['key' => $counterKey, 'next_number' => 1]);
            // Kunci baris yang baru dibuat agar increment di bawah aman.
            $counter = SkCounter::query()->whereKey($counter->id)->lockForUpdate()->firstOrFail();
        }

        $number = $counter->next_number;
        $counter->update(['next_number' => $number + 1]);

        return sprintf(
            '%s/%d/%s/%d',
            self::CLASSIFICATION,
            $number,
            $opdId !== null
                ? (Opd::whereKey($opdId)->value('letter_code') ?? self::UNIT_CODE)
                : self::UNIT_CODE,
            Date::now()->year,
        );
    }

    /**
     * Atur start number counter (mis. mulai dari 40). Dipakai admin verifikator.
     * Bila $opdId diberikan, mengatur counter milik OPD itu saja.
     */
    public function setStart(string $key, int $startNumber, ?int $opdId = null): void
    {
        SkCounter::updateOrCreate(['key' => $this->counterKey($key, $opdId)], ['next_number' => $startNumber]);
    }

    /**
     * Nilai counter saat ini (nomor yang akan dipakai berikutnya).
     */
    public function current(string $key, ?int $opdId = null): int
    {
        return SkCounter::query()->where('key', $this->counterKey($key, $opdId))->value('next_number') ?? 1;
    }

    private function counterKey(string $key, ?int $opdId): string
    {
        return $opdId === null ? $key : "{$key}:{$opdId}";
    }
}
