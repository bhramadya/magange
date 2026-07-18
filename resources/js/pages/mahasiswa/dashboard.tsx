import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    Clock,
    FileText,
    CheckCircle2,
    Loader2,
    Upload,
    Download,
    AlertTriangle,
    ArrowRight,
    Send,
    ClipboardCheck,
    GraduationCap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBadge } from '@/components/status-badge';
import MagangLayout from '@/layouts/magang-layout';
import type {
    ApplicationStatus,
    InternshipApplication,
    MagangUser,
} from '@/types/magang';
import { STATUS_META } from '@/types/magang';

/* =========================================================================
 *  DASBOR MAHASISWA
 *  Props dikirim dari controller Inertia (rekan backend). Default mock di
 *  bawah membuat halaman tetap tampil saat dikembangkan tanpa backend.
 * ========================================================================= */

interface DashboardProps {
    user?: MagangUser;
    application?: InternshipApplication | null;
}

// ---- Mock untuk pengembangan frontend (dihapus saat props backend tersedia) ----
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

/* ---------------------------------- util ---------------------------------- */

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(iso));
}

/* --------------------------------- timeline -------------------------------- */

const TIMELINE_STEPS = [
    {
        title: 'Pengajuan Terkirim',
        desc: 'Berkas pendaftaran diterima sistem.',
        icon: Send,
    },
    {
        title: 'Verifikasi Admin',
        desc: 'Admin Verifikator memeriksa kelengkapan.',
        icon: ClipboardCheck,
    },
    {
        title: 'Persetujuan OPD',
        desc: 'OPD tujuan menyetujui penempatan.',
        icon: Building2,
    },
    {
        title: 'Pelaksanaan Magang',
        desc: 'Periode magang sedang berjalan.',
        icon: GraduationCap,
    },
    {
        title: 'Laporan & Survei',
        desc: 'Unggah laporan akhir dan isi survei.',
        icon: FileText,
    },
    {
        title: 'Selesai — e-Sertifikat',
        desc: 'Sertifikat siap diunduh.',
        icon: CheckCircle2,
    },
];

// Indeks tahap aktif per status.
const STEP_OF_STATUS: Record<ApplicationStatus, number> = {
    pending_verifikator: 1,
    forwarded_opd: 2,
    approved: 3,
    ongoing: 3,
    completion_submitted: 4,
    completed: 6,
    rejected: 1,
};

function StatusTimeline({ status }: { status: ApplicationStatus }) {
    const current = STEP_OF_STATUS[status];
    const isRejected = status === 'rejected';

    return (
        <ol className="relative">
            {TIMELINE_STEPS.map((step, i) => {
                const done = i < current;
                const active = i === current && !isRejected;
                const Icon = active ? Loader2 : done ? CheckCircle2 : step.icon;
                const isLast = i === TIMELINE_STEPS.length - 1;

                return (
                    <li key={step.title} className="flex gap-4 pb-6 last:pb-0">
                        {/* rel garis + node */}
                        <div className="relative flex flex-col items-center">
                            <span
                                className={`flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                                    done
                                        ? 'bg-emerald-500 text-white'
                                        : active
                                          ? 'bg-[#106feb] text-white'
                                          : 'bg-slate-100 text-slate-400'
                                }`}
                            >
                                <Icon
                                    className={`size-[18px] ${active ? 'animate-spin' : ''}`}
                                />
                            </span>
                            {!isLast && (
                                <span
                                    className={`mt-1 w-0.5 flex-1 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`}
                                />
                            )}
                        </div>

                        <div className="pt-1">
                            <p
                                className={`text-sm font-semibold ${
                                    done
                                        ? 'text-emerald-700'
                                        : active
                                          ? 'text-[#12213e]'
                                          : 'text-slate-400'
                                }`}
                            >
                                {step.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {step.desc}
                            </p>
                            {active && (
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

/* ------------------------------- stat cards -------------------------------- */

function StatCard({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: typeof Clock;
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cddcef] hover:shadow-md">
            <div
                className={`flex size-10 items-center justify-center rounded-xl transition-colors duration-300 ${
                    accent
                        ? 'bg-[#106feb] text-white'
                        : 'bg-[#cddcef]/40 text-[#106feb] group-hover:bg-[#106feb] group-hover:text-white'
                }`}
            >
                <Icon className="size-5" />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-0.5 text-sm font-bold text-[#12213e]">{value}</p>
        </div>
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

/* ------------------------------- action panel ------------------------------ */

function ActionPanel({ application }: { application: InternshipApplication }) {
    if (application.status === 'rejected') {
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
                <Link
                    href="/#daftar"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                    Ajukan Ulang <ArrowRight className="size-4" />
                </Link>
            </div>
        );
    }

    if (
        application.status === 'ongoing' ||
        application.status === 'completion_submitted'
    ) {
        const submitted = application.status === 'completion_submitted';

        return (
            <div className="rounded-2xl border border-[#cddcef] bg-gradient-to-br from-[#106feb] to-[#0b4fb0] p-5 text-white">
                <p className="text-sm font-bold">Tahap Penyelesaian</p>
                <p className="mt-1 text-sm text-white/85">
                    {submitted
                        ? 'Laporan sudah diunggah. Menunggu validasi Admin Verifikator.'
                        : 'Setelah magang selesai, unggah laporan akhir dan isi survei untuk membuka e-Sertifikat.'}
                </p>
                <Link
                    href="/penyelesaian"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#106feb] hover:bg-white/90"
                >
                    <Upload className="size-4" />{' '}
                    {submitted
                        ? 'Lihat Status Laporan'
                        : 'Unggah Laporan Akhir'}
                </Link>
            </div>
        );
    }

    if (application.status === 'completed') {
        return (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="size-5" />
                    <p className="text-sm font-bold">Magang Selesai</p>
                </div>
                <p className="mt-2 text-sm text-emerald-700/90">
                    Selamat! Anda telah menyelesaikan magang. e-Sertifikat Anda
                    siap diunduh.
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

    if (application.status === 'approved') {
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
                Pengajuan Anda sedang ditinjau. Status akan diperbarui dan
                notifikasi dikirim via email/WhatsApp.
            </p>
        </div>
    );
}

/* --------------------------------- page ------------------------------------ */

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#cddcef]/40 text-[#106feb]">
                <FileText className="size-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#12213e]">
                Belum ada pengajuan magang
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
                Anda belum mengajukan permohonan magang. Mulai sekarang dan
                pantau seluruh prosesnya dari dasbor ini.
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

export default function MahasiswaDashboard({
    user = MOCK_USER,
    application = MOCK_APPLICATION,
}: DashboardProps) {
    return (
        <MagangLayout user={user} title="Dasbor" active="dashboard">
            <Head title="Dasbor" />

            {/* Sambutan */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm text-slate-500">
                        Selamat datang kembali,
                    </p>
                    <h2 className="text-2xl font-black text-[#12213e]">
                        {user.name}
                    </h2>
                </div>
                {application && (
                    <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            No. Tiket:{' '}
                            <span className="text-[#106feb]">
                                {application.ticket_number}
                            </span>
                        </span>
                        <StatusBadge status={application.status} />
                    </div>
                )}
            </div>

            {!application ? (
                <div className="mt-8">
                    <EmptyState />
                </div>
            ) : (
                <>
                    {/* Stat cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'circOut' }}
                        className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
                    >
                        <StatCard
                            icon={Clock}
                            label="Status Saat Ini"
                            value={STATUS_META[application.status].label}
                            accent
                        />
                        <StatCard
                            icon={Building2}
                            label="OPD Tujuan"
                            value={
                                application.opd
                                    ? application.opd.code
                                    : 'Belum ditentukan'
                            }
                        />
                        <StatCard
                            icon={CalendarDays}
                            label="Durasi"
                            value={`${application.duration_months} Bulan`}
                        />
                        <StatCard
                            icon={GraduationCap}
                            label="Periode"
                            value={`${formatDate(application.start_date)} – ${formatDate(application.end_date)}`}
                        />
                    </motion.div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        {/* Timeline */}
                        <div className="lg:col-span-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-base font-bold text-[#12213e]">
                                    Lacak Status Pengajuan
                                </h3>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    Pantau perjalanan magang Anda dari awal
                                    hingga sertifikat.
                                </p>
                                <div className="mt-6">
                                    <StatusTimeline
                                        status={application.status}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Aksi + detail */}
                        <div className="flex flex-col gap-6">
                            <ActionPanel application={application} />

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-base font-bold text-[#12213e]">
                                    Detail Pengajuan
                                </h3>
                                <dl className="mt-4 grid grid-cols-1 gap-4">
                                    <DetailRow
                                        label="Tujuan Magang"
                                        value={application.tujuan_magang}
                                    />
                                    <DetailRow
                                        label="Asal Instansi"
                                        value={application.institution_name}
                                    />
                                    <DetailRow
                                        label="Pembimbing Kampus/Sekolah"
                                        value={application.campus_supervisor}
                                    />
                                    <DetailRow
                                        label="OPD Penempatan"
                                        value={application.opd?.name ?? null}
                                    />
                                    <DetailRow
                                        label="Bidang Penempatan"
                                        value={application.division}
                                    />
                                    <DetailRow
                                        label="Penanggung Jawab"
                                        value={application.person_in_charge}
                                    />
                                </dl>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </MagangLayout>
    );
}
