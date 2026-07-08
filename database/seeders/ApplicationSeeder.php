<?php

namespace Database\Seeders;

use App\Enums\ApplicationStatus;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Models\Certificate;
use App\Models\FinalReport;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\SatisfactionSurvey;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Data demo pengajuan untuk menguji ketiga dasbor (Verifikator, OPD, Mahasiswa).
 * Sebagian besar ditempatkan di DISKOMINFO agar Admin OPD DISKOMINFO melihat
 * spektrum status lengkap: Perlu Keputusan → Disetujui → Sedang Magang →
 * Selesai Magang → Ditolak. Idempotent: dilewati bila sudah ada pengajuan.
 */
class ApplicationSeeder extends Seeder
{
    public function run(): void
    {
        if (InternshipApplication::query()->exists()) {
            return;
        }

        $diskominfo = Opd::where('code', 'DISKOMINFO')->first();
        $disdik = Opd::where('code', 'DISDIK')->first();
        $verifikator = User::where('email', 'verifikator@madiunkota.go.id')->first();

        if ($diskominfo === null || $verifikator === null) {
            return; // OpdSeeder/AdminSeeder belum jalan.
        }

        $opdAdmin = User::where('opd_id', $diskominfo->id)
            ->where('role', UserRole::AdminOpd)
            ->first();

        $ticket = 51;

        // 1) Menunggu verifikasi (belum ada OPD tujuan).
        $this->makeApplication($ticket--, 'Andi Pratama', 'andi.pratama@student.ac.id', [
            'tujuan_magang' => 'Pengembangan aplikasi web internal',
            'major' => 'Teknik Informatika',
            'skills' => 'Laravel, React, PostgreSQL',
            'status' => ApplicationStatus::PendingVerifikator,
        ]);

        $this->makeApplication($ticket--, 'Siti Nurhaliza', 'siti.nur@student.ac.id', [
            'tujuan_magang' => 'Desain grafis & konten media sosial',
            'major' => 'Desain Komunikasi Visual',
            'skills' => 'Figma, Adobe Illustrator, Copywriting',
            'status' => ApplicationStatus::PendingVerifikator,
        ]);

        // 2) Diteruskan ke DISKOMINFO — "Perlu Keputusan" bagi Admin OPD.
        $this->makeApplication($ticket--, 'Budi Santoso', 'budi.santoso@student.ac.id', [
            'tujuan_magang' => 'Administrasi jaringan & infrastruktur',
            'major' => 'Teknik Komputer',
            'skills' => 'Jaringan, Linux, Mikrotik',
            'status' => ApplicationStatus::ForwardedOpd,
            'opd_id' => $diskominfo->id,
            'verifikator_note' => 'Berkas lengkap, kandidat sesuai kebutuhan bidang TIK.',
            'forwarded_by' => $verifikator->id,
            'forwarded_at' => now()->subDays(2),
        ]);

        $this->makeApplication($ticket--, 'Dewi Lestari', 'dewi.lestari@student.ac.id', [
            'tujuan_magang' => 'Manajemen data kepegawaian',
            'major' => 'Sistem Informasi',
            'skills' => 'Excel, SQL, Analisis Data',
            'status' => ApplicationStatus::ForwardedOpd,
            'opd_id' => $diskominfo->id,
            'verifikator_note' => 'Direkomendasikan untuk bagian pengolahan data.',
            'forwarded_by' => $verifikator->id,
            'forwarded_at' => now()->subDay(),
        ]);

        // 3) Disetujui — menunggu tanggal mulai.
        $this->makeApplication($ticket--, 'Rizky Ramadhan', 'rizky.r@student.ac.id', [
            'tujuan_magang' => 'Pengembangan portal berita OPD',
            'major' => 'Teknik Informatika',
            'skills' => 'Vue, Tailwind, REST API',
            'status' => ApplicationStatus::Approved,
            'opd_id' => $diskominfo->id,
            'start_date' => now()->addWeek()->toDateString(),
            'end_date' => now()->addWeek()->addMonths(3)->toDateString(),
            'division' => 'Bidang Layanan E-Government',
            'field_supervisor' => 'Rudi Hartono, S.Kom',
            'person_in_charge' => 'Kepala Bidang IKP',
            'forwarded_by' => $verifikator->id,
            'forwarded_at' => now()->subDays(10),
            'opd_decision_by' => $opdAdmin?->id,
            'opd_decision_at' => now()->subDays(8),
        ]);

        // 4) Sedang magang (ongoing).
        $this->makeApplication($ticket--, 'Putri Ayu', 'putri.ayu@student.ac.id', [
            'tujuan_magang' => 'Produksi konten multimedia',
            'major' => 'Ilmu Komunikasi',
            'skills' => 'Videografi, Editing, Sosial Media',
            'status' => ApplicationStatus::Ongoing,
            'opd_id' => $diskominfo->id,
            'start_date' => now()->subWeeks(2)->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
            'division' => 'Bidang Informasi & Komunikasi Publik',
            'field_supervisor' => 'Sinta Dewi, S.I.Kom',
            'person_in_charge' => 'Kepala Bidang IKP',
            'forwarded_by' => $verifikator->id,
            'forwarded_at' => now()->subMonth(),
            'opd_decision_by' => $opdAdmin?->id,
            'opd_decision_at' => now()->subWeeks(3),
        ]);

        // 5) Ditolak.
        $this->makeApplication($ticket--, 'Fajar Nugroho', 'fajar.n@student.ac.id', [
            'tujuan_magang' => 'Penelitian sosial masyarakat',
            'major' => 'Sosiologi',
            'skills' => 'Wawancara, Analisis Kualitatif',
            'status' => ApplicationStatus::Rejected,
            'opd_id' => $diskominfo->id,
            'rejection_reason' => 'Bidang keahlian tidak sesuai dengan kebutuhan OPD saat ini.',
            'forwarded_by' => $verifikator->id,
            'forwarded_at' => now()->subDays(20),
            'opd_decision_by' => $opdAdmin?->id,
            'opd_decision_at' => now()->subDays(18),
        ]);

        // 6) Selesai magang — lengkap dengan laporan, sertifikat, & survei
        //    (survei ber-rating tinggi + komentar → tampil sebagai testimonial).
        $completed = $this->makeApplication($ticket--, 'Maya Anggraini', 'maya.a@student.ac.id', [
            'tujuan_magang' => 'Pengembangan dashboard analitik',
            'institution_name' => 'Universitas Negeri Madiun',
            'major' => 'Sistem Informasi',
            'skills' => 'Power BI, Python, SQL',
            'status' => ApplicationStatus::Completed,
            'opd_id' => $diskominfo->id,
            'start_date' => now()->subMonths(4)->toDateString(),
            'end_date' => now()->subMonth()->toDateString(),
            'division' => 'Bidang Layanan E-Government',
            'field_supervisor' => 'Rudi Hartono, S.Kom',
            'person_in_charge' => 'Kepala Bidang IKP',
            'forwarded_by' => $verifikator->id,
            'forwarded_at' => now()->subMonths(5),
            'opd_decision_by' => $opdAdmin?->id,
            'opd_decision_at' => now()->subMonths(5),
        ]);

        $report = FinalReport::create([
            'application_id' => $completed->id,
            'file_name' => 'laporan-akhir-maya.pdf',
            'file_path' => "reports/{$completed->id}/laporan-akhir-maya.pdf",
            'is_confirmed' => true,
            'status' => ReportStatus::Approved,
            'reviewed_by' => $verifikator->id,
            'reviewed_at' => now()->subWeeks(3),
            'submitted_at' => now()->subMonth(),
        ]);

        Certificate::create([
            'application_id' => $completed->id,
            'file_name' => 'sertifikat-maya.pdf',
            'file_path' => "certificates/{$completed->id}/sertifikat-maya.pdf",
            'is_download_locked' => false, // sudah dibuka karena survei terisi
            'uploaded_by' => $verifikator->id,
        ]);

        SatisfactionSurvey::create([
            'application_id' => $completed->id,
            'rating' => 5,
            'ratings' => [
                'bimbingan' => 5,
                'lingkungan' => 5,
                'relevansi' => 4,
                'fasilitas' => 5,
                'keseluruhan' => 5,
            ],
            'comment' => 'Pengalaman magang yang sangat berharga. Pembimbing suportif dan tugasnya relevan dengan bidang studi saya.',
            'submitted_at' => now()->subWeeks(2),
        ]);

        unset($report);

        // 7) Satu pengajuan diteruskan ke OPD lain (DISDIK) untuk variasi data.
        if ($disdik !== null) {
            $this->makeApplication($ticket--, 'Galih Saputra', 'galih.s@student.ac.id', [
                'tujuan_magang' => 'Administrasi data pendidikan',
                'major' => 'Manajemen Pendidikan',
                'skills' => 'Administrasi, Excel',
                'status' => ApplicationStatus::ForwardedOpd,
                'opd_id' => $disdik->id,
                'verifikator_note' => 'Cocok untuk bagian tata usaha.',
                'forwarded_by' => $verifikator->id,
                'forwarded_at' => now()->subDays(3),
            ]);
        }
    }

    /**
     * Buat 1 user mahasiswa + pengajuannya. Field default diisi realistis;
     * dapat ditimpa lewat $overrides (status, opd, penempatan, tanggal, dst).
     *
     * @param  array<string, mixed>  $overrides
     */
    private function makeApplication(int $ticketSeq, string $name, string $email, array $overrides): InternshipApplication
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'whatsapp_number' => '0812'.str_pad((string) $ticketSeq, 8, '0', STR_PAD_LEFT),
                'role' => UserRole::Mahasiswa,
                'is_active' => true,
            ],
        );

        $start = Carbon::now()->addWeek()->toDateString();
        $end = Carbon::now()->addWeek()->addMonths(3)->toDateString();

        return InternshipApplication::create(array_merge([
            'ticket_number' => sprintf('MGG-2026-%04d', $ticketSeq),
            'user_id' => $user->id,
            'nis' => '21'.str_pad((string) $ticketSeq, 6, '0', STR_PAD_LEFT),
            'tujuan_magang' => 'Magang kompetensi keahlian',
            'duration_months' => 3,
            'start_date' => $start,
            'end_date' => $end,
            'institution_name' => 'Universitas Negeri Madiun',
            'address' => 'Jl. Pahlawan No. '.$ticketSeq.', Kota Madiun',
            'campus_supervisor' => 'Dr. Bambang Sutrisno, M.Kom',
            'guardian_name' => 'Drs. Suparno',
            'status' => ApplicationStatus::PendingVerifikator,
        ], $overrides));
    }
}
