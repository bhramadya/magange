<?php

namespace Database\Seeders;

use App\Models\Opd;
use Illuminate\Database\Seeder;

class OpdSeeder extends Seeder
{
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

        foreach ($opds as [$name, $code, $description]) {
            Opd::updateOrCreate(
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
        }
    }
}
