<?php

namespace Database\Seeders;

use App\Models\Opd;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OpdSeeder extends Seeder
{
    /**
     * Kop surat awal. Alamat & telepon sengaja seragam (alamat Balai Kota) —
     * ini data awal agar instalasi baru bisa langsung dipakai, bukan data
     * resmi tiap OPD. Admin OPD menggantinya lewat halaman Kelola Surat.
     */
    private const LETTERHEAD_ADDRESS = 'Jalan Pahlawan Nomor 37, Kota Madiun, Kode Pos: 63139, Jawa Timur';

    private const LETTERHEAD_PHONE = '(0351) 467327';

    /**
     * 35 OPD resmi Pemerintah Kota Madiun (selaras dengan direktori landing page).
     */
    public function run(): void
    {
        $opds = [
            ['BADAN KEPEGAWAIAN DAERAH', 'BKD', 'SDM / Kepegawaian, Administrasi'],
            ['BADAN KESATUAN BANGSA DAN POLITIK', 'BAKESBANGPOL', 'Politik & Pemerintahan, Sosial'],
            ['BADAN PENANGGULANGAN BENCANA DAERAH', 'BPBD', 'Manajemen Bencana, Kesehatan'],
            ['BADAN PENDAPATAN DAERAH', 'BAPENDA', 'Akuntansi, Perpajakan'],
            ['BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH', 'BPKAD', 'Akuntansi, Administrasi'],
            ['BADAN PERENCANAAN DAN PEMBANGUNAN DAERAH', 'BAPPEDA', 'Perencanaan, Analisis Data'],
            ['BAGIAN HUKUM', 'BAG-HUKUM', 'Hukum, Administrasi'],
            ['BAGIAN ORGANISASI', 'BAG-ORG', 'Manajemen, Administrasi'],
            ['BAGIAN PEMERINTAHAN UMUM', 'BAG-PUM', 'Administrasi Publik, Pemerintahan'],
            ['BAGIAN PENGADAAN BARANG/JASA DAN ADMINISTRASI PEMBANGUNAN', 'BAG-PBJ', 'Pengadaan, Administrasi'],
            ['BAGIAN PEREKONOMIAN DAN KESEJAHTERAAN RAKYAT', 'BAG-EKBANG', 'Ekonomi, Sosial'],
            ['BAGIAN UMUM', 'BAG-UMUM', 'Tata Usaha, Administrasi'],
            ['DINAS KEBUDAYAAN, PARIWISATA, KEPEMUDAAN DAN OLAHRAGA', 'DISBUDPARPORA', 'Pariwisata, Seni & Budaya'],
            ['DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL', 'DISDUKCAPIL', 'Administrasi Publik, Manajemen Data'],
            ['DINAS KESEHATAN DAN KELUARGA BERENCANA', 'DINKES-KB', 'Kesehatan, Administrasi Publik'],
            ['DINAS KOMUNIKASI DAN INFORMATIKA', 'DISKOMINFO', 'IT / Software, Humas & Jurnalistik'],
            ['DINAS LINGKUNGAN HIDUP', 'DLH', 'Lingkungan, Sains'],
            ['DINAS PEKERJAAN UMUM DAN TATA RUANG', 'DPUTR', 'Teknik Sipil, Arsitektur'],
            ['DINAS PENANAMAN MODAL, PELAYANAN TERPADU SATU PINTU, KOPERASI DAN USAHA MIKRO', 'DPMPTSP', 'Ekonomi, Pelayanan Publik'],
            ['DINAS PENDIDIKAN', 'DISDIK', 'Pendidikan, Administrasi'],
            ['DINAS PERDAGANGAN', 'DISDAG', 'Ekonomi, Bisnis'],
            ['DINAS PERHUBUNGAN', 'DISHUB', 'Transportasi, Teknik'],
            ['DINAS PERPUSTAKAAN DAN KEARSIPAN', 'DISPUSIP', 'Kearsipan, Literasi'],
            ['DINAS PERTANIAN DAN KETAHANAN PANGAN', 'DPKP', 'Pertanian, Sains'],
            ['DINAS PERUMAHAN DAN KAWASAN PERMUKIMAN', 'DISPERKIM', 'Teknik Sipil, Tata Ruang'],
            ['DINAS SOSIAL, PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK', 'DINSOS-P3A', 'Sosial, Pemberdayaan'],
            ['DINAS TENAGA KERJA', 'DISNAKER', 'SDM / Kepegawaian, Sosial'],
            ['INSPEKTORAT', 'INSPEKTORAT', 'Audit, Akuntansi'],
            ['KECAMATAN KARTOHARJO', 'KEC-KARTOHARJO', 'Pemerintahan, Pelayanan Publik'],
            ['KECAMATAN MANGUHARJO', 'KEC-MANGUHARJO', 'Pemerintahan, Pelayanan Publik'],
            ['KECAMATAN TAMAN', 'KEC-TAMAN', 'Pemerintahan, Pelayanan Publik'],
            ['RUMAH SAKIT UMUM DAERAH', 'RSUD', 'Kesehatan, Administrasi'],
            ['SATUAN POLISI PAMONG PRAJA', 'SATPOLPP', 'Keamanan, Hukum'],
            ['SEKRETARIAT DAERAH', 'SETDA', 'Pemerintahan, Administrasi'],
            ['SEKRETARIAT DPRD', 'SETWAN', 'Legislatif, Administrasi'],
        ];

        foreach ($opds as $urutan => [$name, $code, $description]) {
            $opd = Opd::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'description' => $description,
                    'is_active' => true,
                    // Kuota awal default agar OPD bisa langsung menyetujui pengajuan
                    // (tanpa ini quota_total=0 -> approve selalu "kuota penuh").
                    'quota_total' => 10,
                ],
            );

            $this->siapkanSurat($opd, $urutan);
        }
    }

    /**
     * Lengkapi kop surat + satu penandatangan utama.
     *
     * Bukan kelengkapan kosmetik: gate ACC (`ApproveApplicationRequest`)
     * MENOLAK persetujuan bila OPD belum punya penandatangan atau salah satu
     * kolom kop masih kosong. Tanpa langkah ini, instalasi baru tidak bisa
     * meng-ACC satu pengajuan pun — jebakan onboarding yang sama dengan
     * penyebab empat tes merah pada P0.
     *
     * Sengaja hanya MENGISI YANG KOSONG: data ini dikelola admin lewat halaman
     * Kelola Surat, jadi seeder yang dijalankan ulang tidak boleh menimpanya.
     */
    private function siapkanSurat(Opd $opd, int $urutan): void
    {
        $slug = Str::lower(str_replace(['/', ' '], '-', $opd->code));

        $opd->fill([
            'letterhead_address' => $opd->letterhead_address ?: self::LETTERHEAD_ADDRESS,
            'letterhead_phone' => $opd->letterhead_phone ?: self::LETTERHEAD_PHONE,
            'letterhead_email' => $opd->letterhead_email ?: "{$slug}@madiunkota.go.id",
        ])->save();

        if ($opd->signers()->exists()) {
            return;
        }

        $opd->signers()->create([
            'name' => 'Penandatangan '.$opd->code,
            'title' => $this->jabatan($opd->name),
            // NIP contoh berformat 18 digit; dibuat berbeda per OPD supaya
            // mudah dibedakan saat memeriksa dokumen hasil demo.
            'nip' => sprintf('1975%02d011999%03d1001', ($urutan % 12) + 1, $urutan + 1),
            'is_primary' => true,
        ]);
    }

    /**
     * Jabatan pimpinan diturunkan dari nama OPD — "Kepala Dinas ...",
     * "Camat ...", "Inspektur", dan seterusnya.
     */
    private function jabatan(string $name): string
    {
        $judul = Str::title(Str::lower($name));

        return match (true) {
            str_starts_with($name, 'BADAN ') => 'Kepala '.$judul,
            str_starts_with($name, 'BAGIAN ') => 'Kepala '.$judul,
            str_starts_with($name, 'DINAS ') => 'Kepala '.$judul,
            str_starts_with($name, 'KECAMATAN ') => 'Camat '.Str::title(Str::lower(Str::after($name, 'KECAMATAN '))),
            str_starts_with($name, 'SATUAN ') => 'Kepala '.$judul,
            $name === 'INSPEKTORAT' => 'Inspektur Kota Madiun',
            $name === 'RUMAH SAKIT UMUM DAERAH' => 'Direktur Rumah Sakit Umum Daerah',
            $name === 'SEKRETARIAT DAERAH' => 'Sekretaris Daerah',
            $name === 'SEKRETARIAT DPRD' => 'Sekretaris DPRD',
            default => 'Kepala '.$judul,
        };
    }
}
