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
    avatar_url?: string | null; // foto profil (mahasiswa: dari pas foto pendaftaran)
}

export interface Opd {
    id: number;
    name: string;
    code: string;
    description?: string | null; // deskripsi OPD (opsional) — tampil di form Kelola OPD
    is_active?: boolean; // status aktif OPD
    // Kuota magang — tampil di card OPD halaman utama (inisiatif UX).
    quota?: number; // total kuota
    quota_used?: number; // sudah terpakai
    // Revisi baru: kode internal (angka) + inisial publik (string).
    kode_opd?: number | null;
    inisial_opd?: string | null;
}

export interface FinalReport {
    status: ReportStatus;
    file_name: string;
    submitted_at: string;
    is_confirmed: boolean;
}

// Sertifikat selesai magang — id dipakai untuk URL survei & unduh (Fase 4).
export interface Certificate {
    id: number;
    is_download_locked: boolean;
}

// FAQ dikelola Admin Verifikator, tampil di landing page publik.
export interface Faq {
    id: number;
    question: string;
    answer: string;
    sort_order: number;
    is_active: boolean;
}

// Satu baris rekam jejak status tiket (dari ApplicationStatusLog).
export interface ApplicationStatusLog {
    status: ApplicationStatus;
    note?: string | null;
    actor_name?: string | null; // pelaku transisi (null = sistem)
    created_at: string;
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

    // Data pemohon (dari relasi user) — tampil di tabel & pop-up admin.
    applicant_name?: string | null;
    applicant_email?: string | null;
    applicant_whatsapp?: string | null;

    // Diisi peserta saat mendaftar (welcome #daftar) — tampil di pop-up admin.
    nis?: string | null;
    address?: string | null;
    campus_supervisor_whatsapp?: string | null; // no. WA dosen/guru pembimbing
    guardian_name?: string | null; // nama penanggung jawab
    guardian_whatsapp?: string | null; // no. WA penanggung jawab
    photo_url?: string | null; // URL pas foto (disk privat, route terproteksi)

    // Berkas pendukung opsional ("jika ada") — disk privat, route terproteksi
    // pengajuan.dokumen (GET pengajuan/{application}/dokumen/{jenis}).
    surat_pengantar_url?: string | null;
    cv_url?: string | null;
    portfolio_url?: string | null;

    // Diisi peserta saat mendaftar (welcome #daftar).
    major?: string | null; // jurusan (opsional)
    skills?: string | null; // keahlian/keterampilan — tampil di card verifikator

    // Diisi Admin Verifikator saat meneruskan — catatan untuk dibaca Admin OPD.
    verifikator_note?: string | null;

    // Diisi Admin OPD saat menyetujui — null sebelum diputuskan OPD.
    opd: Opd | null;
    division: string | null;
    field_supervisor: string | null;
    person_in_charge: string | null;

    // Surat Keputusan penerimaan (di-generate backend saat OPD menyetujui;
    // nomor auto-increment + tanggal terbit STATIS — cetak ulang tidak berubah).
    sk_number?: string | null;
    sk_issued_at?: string | null; // ISO date

    // Surat penyelesaian magang (di-generate verifikator di menu laporan).
    completion_sk_number?: string | null;
    completion_sk_issued_at?: string | null;

    rejection_reason: string | null;
    forwarded_at: string | null;
    opd_decision_at: string | null;
    created_at: string;

    // Rekam jejak progres tiket (audit ApplicationStatusLog) — urut kronologis.
    status_logs?: ApplicationStatusLog[];

    // Tahap penyelesaian (Fase 4).
    final_report: FinalReport | null;
    survey_submitted: boolean;
    certificate?: Certificate | null; // sertifikat (terkunci) — null sebelum diunggah verifikator
    certificate_available: boolean; // true saat sertifikat sudah dibuka kuncinya
}

// Metadata tampilan per status: label Indonesia + warna badge konsisten.
export const STATUS_META: Record<
    ApplicationStatus,
    {
        label: string;
        tone: 'amber' | 'blue' | 'emerald' | 'rose' | 'violet' | 'slate';
    }
> = {
    pending_verifikator: { label: 'Menunggu Verifikasi', tone: 'amber' },
    forwarded_opd: { label: 'Diteruskan ke OPD', tone: 'blue' },
    approved: { label: 'Disetujui', tone: 'emerald' },
    rejected: { label: 'Ditolak', tone: 'rose' },
    ongoing: { label: 'Sedang Magang', tone: 'violet' },
    completion_submitted: { label: 'Penyelesaian Diajukan', tone: 'blue' },
    completed: { label: 'Selesai', tone: 'emerald' },
};
