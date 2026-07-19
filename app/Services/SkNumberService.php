<?php

namespace App\Services;

use App\Models\SkCounter;
use Illuminate\Support\Facades\Date;

/**
 * Generator Nomor SK auto-increment (R4/R5, R9) dengan format mengikuti acuan
 * kop surat Pemkot Madiun: `503.11/{urut}/401.106/{tahun}`,
 * mis. "503.11/21/401.106/2026".
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
     * Panggil HANYA di dalam DB::transaction.
     */
    public function next(string $key): string
    {
        $counter = SkCounter::query()
            ->where('key', $key)
            ->lockForUpdate()
            ->first();

        if ($counter === null) {
            $counter = SkCounter::create(['key' => $key, 'next_number' => 1]);
            // Kunci baris yang baru dibuat agar increment di bawah aman.
            $counter = SkCounter::query()->whereKey($counter->id)->lockForUpdate()->firstOrFail();
        }

        $number = $counter->next_number;
        $counter->update(['next_number' => $number + 1]);

        return sprintf(
            '%s/%d/%s/%d',
            self::CLASSIFICATION,
            $number,
            self::UNIT_CODE,
            Date::now()->year,
        );
    }

    /**
     * Atur start number counter (mis. mulai dari 40). Dipakai admin verifikator.
     */
    public function setStart(string $key, int $startNumber): void
    {
        SkCounter::updateOrCreate(['key' => $key], ['next_number' => $startNumber]);
    }

    /**
     * Nilai counter saat ini (nomor yang akan dipakai berikutnya).
     */
    public function current(string $key): int
    {
        return SkCounter::query()->where('key', $key)->value('next_number') ?? 1;
    }
}
