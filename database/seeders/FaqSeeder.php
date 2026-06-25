<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Faq;
use App\Models\User;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    /**
     * FAQ awal (selaras dengan konten landing page). created_by mengacu
     * ke Admin Verifikator yang dibuat oleh AdminSeeder.
     */
    public function run(): void
    {
        $author = User::where('role', UserRole::AdminVerifikator)->first();

        if ($author === null) {
            return;
        }

        $faqs = [
            ['Apa itu E-Magang Kota Madiun?', 'Platform digital resmi untuk mempermudah pendaftaran, verifikasi, dan pemantauan status magang siswa/mahasiswa di lingkungan instansi Pemerintah Kota Madiun.'],
            ['Apakah pendaftaran dikenakan biaya?', 'Tidak. Seluruh layanan di E-Magang Kota Madiun adalah gratis bagi seluruh pelajar dan mahasiswa.'],
            ['Berapa lama proses verifikasi berkas?', 'Biasanya memakan waktu 2-3 hari kerja. Anda akan mendapatkan notifikasi status melalui email atau WhatsApp yang terdaftar.'],
            ['Berapa lama durasi magang yang diperbolehkan?', 'Durasi magang fleksibel mulai dari 1 hingga 6 bulan, menyesuaikan dengan kurikulum atau kebutuhan dari instansi pendidikan Anda.'],
            ['Apakah magang ini bisa dilakukan secara remote/WFH?', 'Seluruh pelaksanaan magang mengikuti kebijakan operasional masing-masing OPD tujuan, namun mayoritas dilaksanakan secara WFO (On-Site) dengan jam kerja kantor pemerintah.'],
            ['Bagaimana cara mendapatkan e-Sertifikat?', 'Setelah selesai melaksanakan magang, pastikan Anda telah mengunggah laporan tugas akhir dan mengisi survei evaluasi di dasbor akun Anda.'],
        ];

        foreach ($faqs as $index => [$question, $answer]) {
            Faq::updateOrCreate(
                ['question' => $question],
                [
                    'answer' => $answer,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                    'created_by' => $author->id,
                ],
            );
        }
    }
}
