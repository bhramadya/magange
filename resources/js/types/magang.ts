/* =========================================================================
 *  TIPE DOMAIN E-MAGANG
 *  Selaras dengan model & enum backend (app/Models, app/Enums). Dipakai
 *  bersama oleh dasbor Mahasiswa, Verifikator, dan OPD. Rekan backend cukup
 *  mengirim props sesuai bentuk ini dari controller Inertia.
 * ========================================================================= */

// Status pengajuan — string-backed, identik dengan App\Enums\ApplicationStatus.
export type ApplicationStatus =
    | 'pending_verifikator'
    | 'forwarded_opd'
    | 'approved'
    | 'rejected'
    | 'ongoing'
    | 'completion_submitted'
    | 'completed';

export type UserRole = 'mahasiswa' | 'admin_verifikator' | 'admin_opd';

export type ReportStatus = 'pending' | 'approved' | 'rejected';

export interface MagangUser {
    id: number;
    name: string;
    email: string;
    whatsapp_number: string | null;
    role: UserRole;
}

export interface Opd {
    id: number;
    name: string;
    code: string;
    // Kuota magang — tampil di card OPD halaman utama (inisiatif UX).
    quota?: number; // total kuota
    quota_used?: number; // sudah terpakai
}

export interface FinalReport {
    status: ReportStatus;
    file_name: string;
    submitted_at: string;
    is_confirmed: boolean;
}

export interface InternshipApplication {
    id: number;
    ticket_number: string;
    tujuan_magang: string;
    duration_months: number;
    start_date: string; // ISO date (YYYY-MM-DD)
    end_date: string;
    institution_name: string;
    campus_supervisor: string; // pembimbing dari kampus/sekolah (diisi siswa)
    status: ApplicationStatus;

    // Diisi peserta saat mendaftar (welcome #daftar).
    major?: string | null; // jurusan (opsional)
    skills?: string; // keahlian/keterampilan — tampil di card verifikator

    // Diisi Admin Verifikator saat meneruskan — catatan untuk dibaca Admin OPD.
    verifikator_note?: string | null;

    // Diisi Admin OPD saat menyetujui — null sebelum diputuskan OPD.
    opd: Opd | null;
    division: string | null;
    field_supervisor: string | null;
    person_in_charge: string | null;

    rejection_reason: string | null;
    forwarded_at: string | null;
    opd_decision_at: string | null;
    created_at: string;

    // Tahap penyelesaian (Fase 4).
    final_report: FinalReport | null;
    survey_submitted: boolean;
    certificate_available: boolean;
}

// Metadata tampilan per status: label Indonesia + warna badge konsisten.
export const STATUS_META: Record<
    ApplicationStatus,
    { label: string; tone: 'amber' | 'blue' | 'emerald' | 'rose' | 'violet' | 'slate' }
> = {
    pending_verifikator: { label: 'Menunggu Verifikasi', tone: 'amber' },
    forwarded_opd: { label: 'Diteruskan ke OPD', tone: 'blue' },
    approved: { label: 'Disetujui OPD', tone: 'emerald' },
    rejected: { label: 'Ditolak', tone: 'rose' },
    ongoing: { label: 'Sedang Magang', tone: 'violet' },
    completion_submitted: { label: 'Penyelesaian Diajukan', tone: 'blue' },
    completed: { label: 'Selesai', tone: 'emerald' },
};
