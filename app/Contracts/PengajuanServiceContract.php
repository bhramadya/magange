<?php

namespace App\Contracts;

use App\Models\InternshipApplication;
use App\Models\User;

interface PengajuanServiceContract
{
    /**
     * Terima pengajuan magang publik: buat/temukan user pemohon,
     * buat InternshipApplication berstatus pending_verifikator, catat log,
     * dan dispatch notifikasi.
     *
     * @param  array{
     *     name: string,
     *     email: string,
     *     whatsapp_number?: string|null,
     *     tujuan_magang: string,
     *     duration_months: int,
     *     start_date: string,
     *     end_date: string,
     *     institution_name: string,
     *     campus_supervisor: string,
     *     major?: string|null,
     *     skills?: string|null,
     * }  $validatedData
     */
    public function submit(array $validatedData, string $ipAddress): InternshipApplication;

    /**
     * Admin Verifikator meneruskan pengajuan ke OPD beserta catatan khusus.
     * Penempatan diisi Admin OPD saat approve(). Guard: status pending_verifikator.
     *
     * @param  array{
     *     opd_id: int,
     *     verifikator_note?: string|null,
     * }  $data
     */
    public function forwardToOpd(InternshipApplication $app, array $data, User $actor): void;

    /**
     * Admin OPD menyetujui pengajuan & menetapkan penempatan.
     * Guard: status harus forwarded_opd.
     *
     * @param  array{
     *     division: string,
     *     field_supervisor: string,
     *     person_in_charge: string,
     * }  $data
     */
    public function approve(InternshipApplication $app, array $data, User $actor): void;

    /**
     * Tolak pengajuan (berlaku untuk status pending_verifikator atau forwarded_opd).
     */
    public function reject(InternshipApplication $app, User $actor, string $reason): void;

    /**
     * Mulai magang: approved → ongoing. Dipicu sistem (cron) saat tanggal mulai
     * tiba, atau manual oleh admin. actor null = perubahan otomatis sistem.
     */
    public function startOngoing(InternshipApplication $app, ?User $actor = null): void;

    /**
     * Selesaikan magang → completed. Bisa dieksekusi 4 pihak: sistem (cron,
     * actor null), Admin Verifikator, Admin OPD, atau peserta. Diizinkan dari
     * status ongoing atau completion_submitted.
     */
    public function complete(InternshipApplication $app, ?User $actor = null, ?string $note = null): void;
}
