import { Head, Link, router } from '@inertiajs/react';
import {
    Send,
    ClipboardCheck,
    Building2,
    GraduationCap,
    FileText,
    CheckCircle2,
    Loader2,
    XCircle,
    Clock,
    Download,
    Upload,
    AlertTriangle,
    ArrowRight,
    Search,
    FileDown,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import MagangLayout from '@/layouts/magang-layout';
import type { InternshipApplication, MagangUser } from '@/types/magang';

/* =========================================================================
 *  PENGAJUAN SAYA (Mahasiswa) — detail & riwayat versi login
 *  Versi lengkap dari kartu di dasbor: riwayat aktivitas bertimestamp,
 *  detail pemohon + penempatan, daftar dokumen, dan aksi kontekstual.
 *
 *  Halaman ini memerlukan login. Props dikirim controller Inertia (rekan
 *  backend). Default mock membuat halaman tetap tampil tanpa backend.
 *  Nama komponen "mahasiswa/pengajuan" → tercakup `case name.startsWith
 *  ('mahasiswa/')` di app.tsx (membungkus MagangLayout sendiri). URL rute
 *  tetap `/pengajuan`.
 * ========================================================================= */

// Dokumen pendukung pengajuan — bukan bagian InternshipApplication (field
// dokumen tak ada di tipe domain), jadi dikirim sebagai prop terpisah.
//   Backend: sertakan array ini dari berkas yang diunggah saat pengajuan.
export interface ApplicationDocument {
    label: string;
    file_name: string;
    url?: string;
    kind?: 'image' | 'document';
}

interface PengajuanProps {
    user?: MagangUser;
    application?: InternshipApplication | null;
    documents?: ApplicationDocument[];
}

/* -------------------------------- mock ------------------------------------- */

const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Rangga Saputra',
    email: 'rangga.saputra@example.com',
    whatsapp_number: '081234567890',
    role: 'mahasiswa',
};

const MOCK_APPLICATION: InternshipApplication = {
    id: 1,
    ticket_number: 'MGG-2026-0042',
    tujuan_magang:
        'Mempelajari pengelolaan infrastruktur jaringan dan pengembangan aplikasi internal di lingkungan pemerintahan.',
    duration_months: 3,
    start_date: '2026-07-01',
    end_date: '2026-09-30',
    institution_name: 'Universitas Negeri Madiun',
    campus_supervisor: 'Dr. Indah Permatasari, M.Kom.',
    status: 'ongoing',
    opd: {
        id: 16,
        name: 'DINAS KOMUNIKASI DAN INFORMATIKA',
        code: 'DISKOMINFO',
    },
    division: 'Bidang Pengembangan Aplikasi',
    field_supervisor: 'Bayu Pratama, S.Kom.',
    person_in_charge: 'Bayu Pratama, S.Kom.',
    rejection_reason: null,
    forwarded_at: '2026-06-20T09:00:00',
    opd_decision_at: '2026-06-23T14:30:00',
    created_at: '2026-06-18T08:15:00',
    final_report: null,
    survey_submitted: false,
    certificate_available: false,
};

const MOCK_DOCUMENTS: ApplicationDocument[] = [
    { label: 'Surat Pengantar', file_name: 'surat-pengantar-rangga.pdf' },
    { label: 'Proposal Magang', file_name: 'proposal-magang.pdf' },
    { label: 'Curriculum Vitae', file_name: 'cv-rangga-saputra.pdf' },
];

/* -------------------------------- util ------------------------------------- */

function formatDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(iso));
}

function formatDateTime(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

/* ----------------------- riwayat aktivitas (timeline) ---------------------- */

type EventState = 'done' | 'current' | 'rejected' | 'upcoming';

interface ActivityEvent {
    title: string;
    detail: string;
    at: string | null;
    icon: typeof Send;
    state: EventState;
}

// Bangun daftar peristiwa dari status + timestamp pengajuan.
function buildEvents(app: InternshipApplication): ActivityEvent[] {
    const s = app.status;
    const rejectedAtVerif = s === 'rejected' && !app.forwarded_at;
    const rejectedAtOpd = s === 'rejected' && !!app.forwarded_at;

    const events: ActivityEvent[] = [
        {
            title: 'Pengajuan Dikirim',
            detail: 'Berkas pendaftaran diterima sistem dan masuk antrean verifikasi.',
            at: app.created_at,
            icon: Send,
            state: 'done',
        },
    ];

    // Verifikasi Admin
    if (rejectedAtVerif) {
        events.push({
            title: 'Pengajuan Ditolak',
            detail:
                app.rejection_reason ??
                'Pengajuan belum dapat disetujui oleh Admin Verifikator.',
            at: app.opd_decision_at,
            icon: XCircle,
            state: 'rejected',
        });

        return events;
    }

    events.push({
        title: 'Diverifikasi & Diteruskan',
        detail: app.opd
            ? `Admin Verifikator meneruskan pengajuan ke ${app.opd.name}.`
            : 'Admin Verifikator memeriksa kelengkapan berkas.',
        at: app.forwarded_at,
        icon: ClipboardCheck,
        state: app.forwarded_at ? 'done' : 'current',
    });

    // Keputusan OPD
    if (rejectedAtOpd) {
        events.push({
            title: 'Ditolak OPD',
            detail:
                app.rejection_reason ??
                'OPD tujuan belum dapat menerima penempatan ini.',
            at: app.opd_decision_at,
            icon: XCircle,
            state: 'rejected',
        });

        return events;
    }

    const opdDecided =
        s === 'approved' ||
        s === 'ongoing' ||
        s === 'completion_submitted' ||
        s === 'completed';
    events.push({
        title: 'Disetujui OPD',
        detail: app.division
            ? `Penempatan: ${app.division}.`
            : 'OPD tujuan menyetujui penempatan.',
        at: app.opd_decision_at,
        icon: Building2,
        state: opdDecided
            ? 'done'
            : s === 'forwarded_opd'
              ? 'current'
              : 'upcoming',
    });

    // Pelaksanaan
    const ongoingOrLater =
        s === 'ongoing' || s === 'completion_submitted' || s === 'completed';
    events.push({
        title: 'Pelaksanaan Magang',
        detail: `Periode ${formatDate(app.start_date)} – ${formatDate(app.end_date)}.`,
        at: app.start_date,
        icon: GraduationCap,
        state:
            s === 'completed'
                ? 'done'
                : ongoingOrLater
                  ? 'current'
                  : 'upcoming',
    });

    // Laporan & survei
    const reportDone = s === 'completed';
    events.push({
        title: 'Laporan & Survei',
        detail: 'Unggah laporan akhir dan isi survei untuk membuka e-Sertifikat.',
        at: app.final_report?.submitted_at ?? null,
        icon: FileText,
        state: reportDone
            ? 'done'
            : s === 'completion_submitted'
              ? 'current'
              : 'upcoming',
    });

    // Selesai
    events.push({
        title: 'Selesai — e-Sertifikat',
        detail: 'Magang selesai dan e-Sertifikat siap diunduh.',
        at: null,
        icon: CheckCircle2,
        state: s === 'completed' ? 'current' : 'upcoming',
    });

    return events;
}

function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
    return (
        <ol className="relative">
            {events.map((ev, i) => {
                const isLast = i === events.length - 1;
                const Icon =
                    ev.state === 'current'
                        ? Loader2
                        : ev.state === 'done'
                          ? CheckCircle2
                          : ev.state === 'rejected'
                            ? XCircle
                            : ev.icon;

                const node =
                    ev.state === 'done'
                        ? 'bg-emerald-500 text-white'
                        : ev.state === 'current'
                          ? 'bg-[#106feb] text-white'
                          : ev.state === 'rejected'
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-100 text-slate-400';

                const line =
                    ev.state === 'done' ? 'bg-emerald-400' : 'bg-slate-200';
                const titleColor =
                    ev.state === 'done'
                        ? 'text-emerald-700'
                        : ev.state === 'current'
                          ? 'text-[#12213e]'
                          : ev.state === 'rejected'
                            ? 'text-rose-700'
                            : 'text-slate-400';

                return (
                    <li key={ev.title} className="flex gap-4 pb-6 last:pb-0">
                        <div className="relative flex flex-col items-center">
                            <span
                                className={`flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${node}`}
                            >
                                <Icon
                                    className={`size-[18px] ${ev.state === 'current' ? 'animate-spin' : ''}`}
                                />
                            </span>
                            {!isLast && (
                                <span className={`mt-1 w-0.5 flex-1 ${line}`} />
                            )}
                        </div>

                        <div className="pt-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <p
                                    className={`text-sm font-semibold ${titleColor}`}
                                >
                                    {ev.title}
                                </p>
                                {ev.at && (
                                    <span className="text-[11px] font-medium text-slate-400">
                                        · {formatDateTime(ev.at)}
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {ev.detail}
                            </p>
                            {ev.state === 'current' && (
                                <span className="mt-1.5 inline-block text-[11px] font-medium text-[#106feb]">
                                    Sedang berlangsung
                                </span>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

/* --------------------------------- detail ---------------------------------- */

function DetailRow({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[#12213e]">
                {value ?? (
                    <span className="text-slate-400">— belum ditentukan</span>
                )}
            </dd>
        </div>
    );
}

/* ------------------------------- aksi kontekstual -------------------------- */

function ActionPanel({ application }: { application: InternshipApplication }) {
    const s = application.status;
    const [resubmitting, setResubmitting] = useState(false);

    if (s === 'rejected') {
        // Ajukan Ulang: data pengajuan lama di-copy backend menjadi tiket
        // baru (status pending_verifikator). Tiket ditolak tidak bisa diedit.
        const resubmit = () => {
            setResubmitting(true);
            router.post(
                `/mahasiswa/pengajuan/${application.id}/ajukan-ulang`,
                {},
                {
                    preserveScroll: true,
                    // Endpoint belum tersedia (backend menyusul) → fallback
                    // ke form pendaftaran publik agar tombol tetap berguna.
                    onError: () => router.visit('/#daftar'),
                    onFinish: () => setResubmitting(false),
                },
            );
        };

        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle className="size-5" />
                    <p className="text-sm font-bold">Pengajuan Ditolak</p>
                </div>
                <p className="mt-2 text-sm text-rose-700/90">
                    {application.rejection_reason ??
                        'Mohon maaf, pengajuan Anda belum dapat disetujui.'}
                </p>
                <button
                    type="button"
                    onClick={resubmit}
                    disabled={resubmitting}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                    {resubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Ajukan Ulang <ArrowRight className="size-4" />
                </button>
                <p className="mt-2 text-xs text-rose-600/80">
                    Data pengajuan Anda akan disalin menjadi tiket baru dan
                    kembali masuk antrean verifikasi.
                </p>
            </div>
        );
    }

    if (s === 'ongoing' || s === 'completion_submitted') {
        const submitted = s === 'completion_submitted';

        return (
            <div className="rounded-2xl border border-[#cddcef] bg-gradient-to-br from-[#106feb] to-[#0b4fb0] p-5 text-white">
                <p className="text-sm font-bold">Tahap Penyelesaian</p>
                <p className="mt-1 text-sm text-white/85">
                    {submitted
                        ? 'Laporan sudah diunggah. Menunggu validasi Admin Verifikator.'
                        : 'Magang sedang berjalan. Setelah selesai, unggah laporan & isi survei.'}
                </p>
                <Link
                    href="/penyelesaian"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#106feb] hover:bg-white/90"
                >
                    <Upload className="size-4" />{' '}
                    {submitted ? 'Lihat Status Laporan' : 'Ke Penyelesaian'}
                </Link>
            </div>
        );
    }

    if (s === 'completed') {
        return (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="size-5" />
                    <p className="text-sm font-bold">Magang Selesai</p>
                </div>
                <p className="mt-2 text-sm text-emerald-700/90">
                    e-Sertifikat Anda siap diunduh di halaman Penyelesaian.
                </p>
                <Link
                    href="/penyelesaian"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                    <Download className="size-4" /> Unduh e-Sertifikat
                </Link>
            </div>
        );
    }

    if (s === 'approved') {
        return (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="size-5" />
                    <p className="text-sm font-bold">Pengajuan Disetujui</p>
                </div>
                <p className="mt-2 text-sm text-emerald-700/90">
                    Selamat! Pengajuan Anda disetujui OPD. Magang dimulai pada{' '}
                    {formatDate(application.start_date)} — silakan hadir di
                    kantor OPD penempatan sesuai jadwal.
                </p>
                <Link
                    href={`/lacak?tiket=${application.ticket_number}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
                >
                    <Search className="size-4" /> Lacak status publik
                </Link>
            </div>
        );
    }

    // pending_verifikator / forwarded_opd → menunggu peninjauan
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-[#106feb]">
                <Clock className="size-5" />
                <p className="text-sm font-bold text-[#12213e]">
                    Sedang Diproses
                </p>
            </div>
            <p className="mt-2 text-sm text-slate-500">
                Pengajuan Anda sedang ditinjau. Notifikasi perubahan status
                dikirim via email/WhatsApp.
            </p>
            <Link
                href={`/lacak?tiket=${application.ticket_number}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#106feb] hover:underline"
            >
                <Search className="size-4" /> Lacak status publik
            </Link>
        </div>
    );
}

/* --------------------------------- dokumen --------------------------------- */

function DocumentItem({ doc }: { doc: ApplicationDocument }) {
    const isImage = doc.kind === 'image';

    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#cddcef]/40 text-[#106feb]">
                {isImage && doc.url ? (
                    <img
                        src={doc.url}
                        alt={doc.label}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <FileText className="size-5" />
                )}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#12213e]">
                    {doc.label}
                </p>
                <p className="truncate text-xs text-slate-500">
                    {doc.file_name}
                </p>
            </div>
            {doc.url ? (
                <a
                    href={doc.url}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-[#cddcef]/40 hover:text-[#106feb]"
                    aria-label={`Unduh ${doc.label}`}
                >
                    <FileDown className="size-4" />
                </a>
            ) : (
                <span className="shrink-0 text-[11px] font-medium text-slate-400">
                    Terunggah
                </span>
            )}
        </div>
    );
}

/* -------------------------------- empty ------------------------------------ */

function EmptyState() {
    return (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#cddcef]/40 text-[#106feb]">
                <FileText className="size-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#12213e]">
                Belum ada pengajuan
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
                Anda belum mengajukan permohonan magang. Mulai sekarang dan
                pantau prosesnya di sini.
            </p>
            <Link
                href="/#daftar"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#106feb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b4fb0]"
            >
                Ajukan Magang <ArrowRight className="size-4" />
            </Link>
        </div>
    );
}

/* ================================= PAGE =================================== */

export default function Pengajuan({
    user = MOCK_USER,
    application = MOCK_APPLICATION,
    documents = MOCK_DOCUMENTS,
}: PengajuanProps) {
    if (!application) {
        return (
            <MagangLayout user={user} title="Pengajuan Saya" active="pengajuan">
                <Head title="Pengajuan Saya" />
                <EmptyState />
            </MagangLayout>
        );
    }

    const events = buildEvents(application);

    return (
        <MagangLayout user={user} title="Pengajuan Saya" active="pengajuan">
            <Head title="Pengajuan Saya" />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-500">
                        Detail permohonan magang Anda
                    </p>
                    <h2 className="text-2xl font-black text-[#12213e]">
                        Pengajuan Saya
                    </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                        No. Tiket:{' '}
                        <span className="text-[#106feb]">
                            {application.ticket_number}
                        </span>
                    </span>
                    <StatusBadge status={application.status} />
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Kiri: riwayat + dokumen */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'circOut' }}
                    className="flex flex-col gap-6 lg:col-span-2"
                >
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-base font-bold text-[#12213e]">
                            Riwayat Aktivitas
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Perjalanan pengajuan Anda lengkap dengan waktu
                            kejadian.
                        </p>
                        <div className="mt-6">
                            <ActivityTimeline events={events} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-base font-bold text-[#12213e]">
                            Dokumen Pengajuan
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Berkas yang Anda lampirkan saat mengajukan.
                        </p>
                        {documents.length > 0 ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {documents.map((doc) => (
                                    <DocumentItem key={doc.label} doc={doc} />
                                ))}
                            </div>
                        ) : (
                            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                Tidak ada dokumen terlampir.
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Kanan: aksi + detail */}
                <div className="flex flex-col gap-6">
                    <ActionPanel application={application} />

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-base font-bold text-[#12213e]">
                            Detail Pemohon
                        </h3>
                        <dl className="mt-4 grid grid-cols-1 gap-4">
                            {application.nis && (
                                <DetailRow
                                    label="NIS / NIM"
                                    value={application.nis}
                                />
                            )}
                            <DetailRow
                                label="Tujuan Magang"
                                value={application.tujuan_magang}
                            />
                            <DetailRow
                                label="Asal Instansi"
                                value={application.institution_name}
                            />
                            {application.major && (
                                <DetailRow
                                    label="Jurusan"
                                    value={application.major}
                                />
                            )}
                            {application.skills && (
                                <DetailRow
                                    label="Keahlian / Keterampilan"
                                    value={application.skills}
                                />
                            )}
                            {application.address && (
                                <DetailRow
                                    label="Alamat Domisili"
                                    value={application.address}
                                />
                            )}
                            <DetailRow
                                label="Pembimbing Kampus/Sekolah"
                                value={application.campus_supervisor}
                            />
                            {application.campus_supervisor_whatsapp && (
                                <DetailRow
                                    label="No. WA Dosen/Guru Pembimbing"
                                    value={
                                        application.campus_supervisor_whatsapp
                                    }
                                />
                            )}
                            {application.guardian_name && (
                                <DetailRow
                                    label="Penanggung Jawab / Wali"
                                    value={application.guardian_name}
                                />
                            )}
                            {application.guardian_whatsapp && (
                                <DetailRow
                                    label="No. WA Penanggung Jawab"
                                    value={application.guardian_whatsapp}
                                />
                            )}
                            <DetailRow
                                label="Durasi"
                                value={`${application.duration_months} Bulan`}
                            />
                            <DetailRow
                                label="Periode"
                                value={`${formatDate(application.start_date)} – ${formatDate(application.end_date)}`}
                            />
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-base font-bold text-[#12213e]">
                            Penempatan
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Ditetapkan Admin Verifikator saat diteruskan ke OPD.
                        </p>
                        <dl className="mt-4 grid grid-cols-1 gap-4">
                            <DetailRow
                                label="OPD Penempatan"
                                value={application.opd?.name ?? null}
                            />
                            <DetailRow
                                label="Bidang/Divisi"
                                value={application.division}
                            />
                            <DetailRow
                                label="Pembimbing Lapangan"
                                value={application.field_supervisor}
                            />
                            <DetailRow
                                label="Penanggung Jawab"
                                value={application.person_in_charge}
                            />
                        </dl>
                    </div>
                </div>
            </div>
        </MagangLayout>
    );
}
