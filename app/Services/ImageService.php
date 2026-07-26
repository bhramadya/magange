<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\ImageManager;
use RuntimeException;
use Throwable;

/**
 * Normalisasi pas foto pendaftaran memakai Intervention Image:
 * perkecil sisi terpanjang, ubah ke JPEG terkompresi, lalu simpan ke
 * disk PRIVAT (local). Bila driver GD/Imagick tidak tersedia atau berkas
 * gagal didekode, jatuh kembali ke penyimpanan berkas asli agar
 * pendaftaran tidak pernah gagal hanya karena pemrosesan gambar.
 */
class ImageService
{
    /**
     * Sisi terpanjang maksimum hasil normalisasi (px).
     */
    private const MAX_DIMENSION = 1000;

    /**
     * Kualitas enkode JPEG hasil kompresi.
     */
    private const JPEG_QUALITY = 80;

    /**
     * Proses lalu simpan pas foto ke disk privat; kembalikan path tersimpan.
     */
    public function processAndStore(UploadedFile $file, string $directory): string
    {
        $manager = $this->createManager();

        if ($manager === null) {
            return $this->storeOriginal($file, $directory);
        }

        try {
            $encoded = $manager->decodePath((string) $file->getRealPath())
                ->scaleDown(self::MAX_DIMENSION, self::MAX_DIMENSION)
                ->encode(new JpegEncoder(quality: self::JPEG_QUALITY));

            $path = trim($directory, '/').'/'.Str::random(40).'.jpg';
            Storage::disk('local')->put($path, $encoded->toString());

            return $path;
        } catch (Throwable) {
            // Berkas tak terbaca sebagai gambar (mis. korup) — simpan apa adanya.
            return $this->storeOriginal($file, $directory);
        }
    }

    /**
     * Simpan berkas asli tanpa pemrosesan (fallback).
     */
    private function storeOriginal(UploadedFile $file, string $directory): string
    {
        $path = $file->store($directory, 'local');

        if ($path === false) {
            throw new RuntimeException('Gagal menyimpan pas foto ke disk privat.');
        }

        return $path;
    }

    /**
     * Pilih driver yang tersedia (GD lebih umum, Imagick sebagai alternatif).
     */
    private function createManager(): ?ImageManager
    {
        if (extension_loaded('gd')) {
            return new ImageManager(new GdDriver);
        }

        if (extension_loaded('imagick')) {
            return new ImageManager(new ImagickDriver);
        }

        return null;
    }
}
