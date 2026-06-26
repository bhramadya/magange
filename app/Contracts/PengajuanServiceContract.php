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
     * }  $validatedData
     */
    public function submit(array $validatedData, string $ipAddress): InternshipApplication;

    /**
     * Admin Verifikator meneruskan pengajuan ke OPD (isi data penempatan).
     * Guard: status harus pending_verifikator.
     *
     * @param  array{
     *     opd_id: int,
     *     division?: string|null,
     *     field_supervisor?: string|null,
     *     person_in_charge?: string|null,
     * }  $data
     */
    public function forwardToOpd(InternshipApplication $app, array $data, User $actor): void;

    /**
     * Admin OPD menyetujui pengajuan. Guard: status harus forwarded_opd.
     */
    public function approve(InternshipApplication $app, User $actor): void;

    /**
     * Tolak pengajuan (berlaku untuk status pending_verifikator atau forwarded_opd).
     */
    public function reject(InternshipApplication $app, User $actor, string $reason): void;
}
