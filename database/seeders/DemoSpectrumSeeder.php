<?php

namespace Database\Seeders;

use App\Enums\ApplicationStatus;
use App\Enums\UserRole;
use App\Models\ApplicationStatusLog;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\OpdSigner;
use App\Models\User;
use App\Services\DemoStatusService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * Simulasi tiket untuk demo — satu tiket per status yang diminta mentor:
 * Menunggu TTE, Perlu Sertifikat, dan Perlu Keputusan (Tahap Admin OPD).
 *
 * TIDAK dimasukkan ke DatabaseSeeder: dijalankan manual via
 * `php artisan db:seed --class=DemoSpectrumSeeder`.
 *
 * Seluruh pergerakan status lewat DemoStatusService → SubmissionService
 * (bukan update(['status']) mentah), jadi data demo punya status-log,
 * snapshot penandatangan, dan draft PDF seperti data sungguhan.
 */
class DemoSpectrumSeeder extends Seeder
{
    private const DEMO_OPD_CODE = 'DEMO';

    public function run(): void
    {
        $opd = $this->demoOpd();
        $signer = $opd->signers()->where('is_primary', true)->first() ?? $opd->signers()->first();
        $verifikator = $this->demoUser('demo.verifikator@madiunkota.go.id', 'Verifikator Demo', UserRole::AdminVerifikator);
        $opdAdmin = $this->demoUser('demo.opd@madiunkota.go.id', 'Admin OPD Demo', UserRole::AdminOpd, $opd->id);

        $service = app(DemoStatusService::class);

        // 1. Menunggu TTE — pengajuan sudah disetujui OPD, draft surat tercetak.
        $this->ticket(
            service: $service,
            tiket: 'MGG-2026-900101',
            email: 'demo.menunggu.tte@example.com',
            name: 'Dewi Lestari',
            nis: '2301001',
            opd: $opd,
            opdAdmin: $opdAdmin,
            verifikator: $verifikator,
            signer: $signer,
            startDate: '2026-08-01',
            endDate: '2026-10-31',
            target: ApplicationStatus::WaitingTte,
        );

        // 2. Perlu Sertifikat — periode magang sudah berakhir, menunggu
        //    sertifikat bertanda tangan. Tanggal mulai di masa lalu agar
        //    jalur TTE melaju ke ongoing (bukan approved).
        $this->ticket(
            service: $service,
            tiket: 'MGG-2026-900102',
            email: 'demo.perlu.sertifikat@example.com',
            name: 'Rizky Ramadhan',
            nis: '2301002',
            opd: $opd,
            opdAdmin: $opdAdmin,
            verifikator: $verifikator,
            signer: $signer,
            startDate: '2026-03-02',
            endDate: '2026-06-30',
            target: ApplicationStatus::NeedsCertificate,
        );

        // 3. Perlu Keputusan — diteruskan verifikator, menunggu keputusan OPD.
        $this->ticket(
            service: $service,
            tiket: 'MGG-2026-900103',
            email: 'demo.perlu.keputusan@example.com',
            name: 'Siti Nurhaliza',
            nis: '2301003',
            opd: $opd,
            opdAdmin: $opdAdmin,
            verifikator: $verifikator,
            signer: $signer,
            startDate: '2026-09-01',
            endDate: '2026-11-30',
            target: ApplicationStatus::ForwardedOpd,
        );

        if ($this->command !== null) {
            $this->command->info('Demo spektrum status siap: MGG-2026-900101 (Menunggu TTE), '
                .'MGG-2026-900102 (Perlu Sertifikat), MGG-2026-900103 (Perlu Keputusan).');
        }
    }

    /**
     * OPD demo dengan kop surat + penandatangan — syarat wajib agar approve
     * tidak diblokir gate TTE.
     */
    private function demoOpd(): Opd
    {
        $opd = Opd::updateOrCreate(
            ['code' => self::DEMO_OPD_CODE],
            [
                'name' => 'Dinas Demo Kota Madiun',
                'description' => 'OPD contoh untuk simulasi status (data demo)',
                'is_active' => true,
                'quota_total' => 20,
                'letterhead_address' => 'Jalan Pahlawan Nomor 37, Kota Madiun, Kode Pos: 63139, Jawa Timur',
                'letterhead_phone' => '(0351) 467327',
                'letterhead_email' => 'demo@madiunkota.go.id',
            ],
        );

        $opd->signers()->firstOrCreate(
            ['opd_id' => $opd->id, 'name' => 'Penandatangan Demo'],
            [
                'title' => 'Kepala Dinas Demo',
                'nip' => '197501012001011001',
                'is_primary' => true,
            ],
        );

        return $opd;
    }

    private function demoUser(string $email, string $name, UserRole $role, ?int $opdId = null): User
    {
        return User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'username' => $role === UserRole::AdminVerifikator ? 'demo-verifikator' : 'demo-opd',
                'password' => Hash::make('demo123456'),
                'role' => $role,
                'opd_id' => $opdId,
                'is_active' => true,
            ],
        );
    }

    /**
     * Buat satu tiket mahasiswa dan gerakkan ke status target via service.
     * Idempoten: dilewati bila tiket sudah ada.
     */
    private function ticket(
        DemoStatusService $service,
        string $tiket,
        string $email,
        string $name,
        string $nis,
        Opd $opd,
        User $opdAdmin,
        User $verifikator,
        OpdSigner $signer,
        string $startDate,
        string $endDate,
        ApplicationStatus $target,
    ): void {
        if (InternshipApplication::where('ticket_number', $tiket)->exists()) {
            return;
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'whatsapp_number' => '08'.random_int(1000000000, 9999999999),
                'role' => UserRole::Mahasiswa,
                'is_active' => true,
            ],
        );

        $app = InternshipApplication::create([
            'ticket_number' => $tiket,
            'user_id' => $user->id,
            'nis' => $nis,
            'tujuan_magang' => 'Pengembangan aplikasi sistem informasi',
            'duration_months' => (int) round(Carbon::parse($startDate)->diffInMonths(Carbon::parse($endDate)->addDay())),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'institution_name' => 'Politeknik Negeri Madiun',
            'major' => 'Teknik Informatika',
            'skills' => 'Pemrograman web, desain antarmuka, analisis data',
            'address' => 'Jl. Melati No. 10, Kota Madiun',
            'campus_supervisor' => 'Dr. Ahmad Fauzi, M.Kom',
            'campus_supervisor_whatsapp' => '081234567890',
            'photo_path' => 'applications/photos/demo-pasfoto.png',
            'status' => ApplicationStatus::PendingVerifikator,
            'opd_id' => $opd->id,
        ]);

        ApplicationStatusLog::create([
            'application_id' => $app->id,
            'from_status' => null,
            'to_status' => ApplicationStatus::PendingVerifikator->value,
            'changed_by' => $user->id,
            'notes' => 'Pengajuan dibuat',
        ]);

        $service->moveTo($app, $target, $verifikator, $opdAdmin, $signer);
    }
}
