import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    GraduationCap,
    Loader2,
    LogIn,
    Search,
    SearchX,
    Send,
    Ticket,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import MagangLayout, {
    mahasiswaNav,
    verifikatorNav,
    opdNav,
} from '@/layouts/magang-layout';
import type { MagangNavItem } from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import { lacak } from '@/routes';
import { otp as otpLogin } from '@/routes/login';
import type {
    ApplicationStatus,
    MagangUser,
    Opd,
    UserRole,
} from '@/types/magang';

// Navigasi sidebar mengikuti peran pengguna saat halaman dibuka dari dasbor.
const NAV_BY_ROLE: Record<UserRole, MagangNavItem[]> = {
    mahasiswa: mahasiswaNav,
    admin_verifikator: verifikatorNav,
    admin_opd: opdNav,
};

/* =========================================================================
 *  LACAK STATUS PUBLIK — E-MAGANG (Pemkot Madiun)
 *  Halaman TANPA login: pemohon memasukkan NOMOR TIKET (format
 *  MGG-YYYY-NNNNNN dari form pengajuan) untuk melihat status & timeline.
 *
 *  Wiring backend (pola a, sesuai HANDOFF-BACKEND.md):
 *    GET /lacak?tiket=... → Inertia::render('lacak', { application, ticket })
 *    `application` = null bila tiket tidak ditemukan. Pencarian dilakukan
 *    server-side lewat router.get('/lacak', { tiket }) — frontend hanya
 *    menampilkan field aman yang dikirim controller (TANPA data pribadi).
 * ========================================================================= */

// Bentuk aman untuk pelacakan publik — subset InternshipApplication tanpa
// data pribadi pemohon/dokumen. Dibentuk oleh ApplicationController::track.
interface PublicApplication {
    id: number;
    ticket_number: string;
    status: ApplicationStatus;
    tujuan_magang: string;
    institution_name: string;
    duration_months: number;
    start_date: string | null;
    end_date: string | null;
    opd: Pick<Opd, 'id' | 'name' | 'code'> | null;
    division: string | null;
    rejection_reason: string | null;
    created_at: string | null;
}

interface LacakProps {
    // Hasil pencarian dari controller. null bila tiket tidak ditemukan;
    // undefined bila halaman dibuka tanpa `?tiket=`.
    application?: PublicApplication | null;
    ticket?: string | null;
}

/* ---- util tanggal & format ------------------------------------------- */
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

/* ---- timeline (selaras dasbor mahasiswa) ------------------------------ */
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
                        <div className="relative flex flex-col items-center">
                            <span
                                className={cn(
                                    'flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white',
                                    done
                                        ? 'bg-emerald-500 text-white'
                                        : active
                                          ? 'bg-[#106feb] text-white'
                                          : 'bg-slate-100 text-slate-400',
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'size-[18px]',
                                        active && 'animate-spin',
                                    )}
                                />
                            </span>
                            {!isLast && (
                                <span
                                    className={cn(
                                        'mt-1 w-0.5 flex-1',
                                        done
                                            ? 'bg-emerald-400'
                                            : 'bg-slate-200',
                                    )}
                                />
                            )}
                        </div>

                        <div className="pt-1">
                            <p
                                className={cn(
                                    'text-sm font-semibold',
                                    done
                                        ? 'text-emerald-700'
                                        : active
                                          ? 'text-[#12213e]'
                                          : 'text-slate-400',
                                )}
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

type LookupState = 'idle' | 'loading' | 'found' | 'notfound';

export default function Lacak({ application, ticket }: LacakProps) {
    const [query, setQuery] = useState<string>(ticket ?? '');
    const [loading, setLoading] = useState(false);

    // Konteks autentikasi (shared prop Inertia). Bila pengguna sudah login —
    // halaman dibuka via menu "Lacak Status Publik" di dasbor — kita sembunyikan
    // chrome tamu (CTA "Masuk") dan bungkus dengan MagangLayout agar terasa
    // sebagai halaman dasbor native (Task 8). Tamu (dari homepage) tetap versi publik.
    const authUser =
        usePage<{ auth: { user: MagangUser | null } }>().props.auth?.user ??
        null;
    const isAuthed = authUser !== null;

    // Sudah mencari bila controller menerima `?tiket=` (ticket ter-set),
    // terlepas dari ketemu (application) atau tidak (application = null).
    const searched = ticket != null && ticket !== '';
    const result = application ?? null;
    const state: LookupState = loading
        ? 'loading'
        : !searched
          ? 'idle'
          : result
            ? 'found'
            : 'notfound';

    // Pencarian dijalankan server-side: navigasi Inertia ke /lacak?tiket=...
    // Controller mengembalikan props { application, ticket } yang aman.
    function lookup(raw: string) {
        const tiket = raw.trim().toUpperCase();

        if (!tiket) {
            return;
        }

        setQuery(tiket);
        setLoading(true);
        router.get(
            lacak.url(),
            { tiket },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoading(false),
            },
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        lookup(query);
    }

    // Konten inti (form pencarian + hasil) — dipakai ulang oleh versi tamu & dasbor.
    const content = (
        <>
            {/* Judul + pencarian */}
            <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#cddcef]/50 text-[#106feb]">
                    <Ticket className="size-7" />
                </div>
                <h1 className="text-2xl font-black text-[#12213e] sm:text-3xl">
                    Lacak Status Permohonan
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Masukkan nomor tiket yang Anda terima saat mengajukan magang
                    untuk melihat perkembangan terkini.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-7 flex flex-col gap-3 sm:flex-row"
                >
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="MGG-2026-123456"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-11 text-sm font-medium tracking-wide uppercase transition outline-none placeholder:tracking-normal placeholder:normal-case focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!query.trim() || state === 'loading'}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#106feb] px-6 text-sm font-bold text-white shadow-sm shadow-[#106feb]/30 transition hover:bg-[#0b5ed0] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {state === 'loading' ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Mencari…
                            </>
                        ) : (
                            <>
                                <Search className="size-4" />
                                Lacak
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-3 text-xs text-slate-400">
                    Format nomor tiket:{' '}
                    <span className="font-mono font-semibold text-slate-500">
                        MGG-2026-123456
                    </span>
                </p>
            </div>

            {/* Hasil */}
            <div className="mt-10">
                <AnimatePresence mode="wait">
                    {state === 'notfound' && (
                        <motion.div
                            key="notfound"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
                        >
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                                <SearchX className="size-7" />
                            </div>
                            <h2 className="mt-4 text-lg font-bold text-[#12213e]">
                                Tiket tidak ditemukan
                            </h2>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                Periksa kembali nomor tiket Anda. Pastikan
                                formatnya sesuai, mis.{' '}
                                <span className="font-mono font-semibold text-[#12213e]">
                                    MGG-2026-123456
                                </span>
                                .
                            </p>
                            <Link
                                href="/#daftar"
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#106feb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b5ed0]"
                            >
                                Ajukan Magang Baru{' '}
                                <ArrowRight className="size-4" />
                            </Link>
                        </motion.div>
                    )}

                            {state === 'found' && result && (
                                <motion.div
                                    key="found"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{
                                        duration: 0.3,
                                        ease: 'circOut',
                                    }}
                                    className="space-y-6"
                                >
                                    {/* Ringkasan tiket */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-slate-500">
                                                    Nomor Tiket
                                                </p>
                                                <p className="font-mono text-lg font-black tracking-tight text-[#106feb]">
                                                    {result.ticket_number}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={result.status}
                                            />
                                        </div>
                                        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                            Diajukan pada{' '}
                                            {formatDate(result.created_at)} ·{' '}
                                            {result.institution_name}
                                        </p>
                                    </div>

                            {/* Penolakan */}
                            {result.status === 'rejected' && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                                    <div className="flex items-center gap-2 text-rose-700">
                                        <AlertTriangle className="size-5" />
                                        <p className="text-sm font-bold">
                                            Permohonan Ditolak
                                        </p>
                                    </div>
                                    <p className="mt-2 text-sm text-rose-700/90">
                                        {result.rejection_reason ??
                                            'Mohon maaf, permohonan Anda belum dapat disetujui.'}
                                    </p>
                                </div>
                            )}

                                    <div className="grid gap-6 lg:grid-cols-3">
                                        {/* Timeline */}
                                        <div className="lg:col-span-2">
                                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                                <h3 className="text-base font-bold text-[#12213e]">
                                                    Perkembangan Permohonan
                                                </h3>
                                                <p className="mt-0.5 text-sm text-slate-500">
                                                    Status diperbarui otomatis
                                                    di setiap tahap.
                                                </p>
                                                <div className="mt-6">
                                                    <StatusTimeline
                                                        status={result.status}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detail */}
                                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                            <h3 className="text-base font-bold text-[#12213e]">
                                                Detail
                                            </h3>
                                            <dl className="mt-4 grid grid-cols-1 gap-4">
                                                <DetailRow
                                                    label="Bidang / Tujuan"
                                                    value={result.tujuan_magang}
                                                />
                                                <DetailRow
                                                    label="OPD Penempatan"
                                                    value={
                                                        result.opd?.name ?? null
                                                    }
                                                />
                                                <DetailRow
                                                    label="Bidang Penempatan"
                                                    value={result.division}
                                                />
                                                <DetailRow
                                                    label="Periode"
                                                    value={`${formatDate(result.start_date)} – ${formatDate(result.end_date)}`}
                                                />
                                            </dl>
                                        </div>
                                    </div>

                            {!isAuthed && (
                                <div className="rounded-2xl bg-[#cddcef]/30 p-5 text-center">
                                    <p className="text-sm text-slate-600">
                                        Sudah memiliki akun? Masuk untuk
                                        mengelola permohonan dan mengunggah
                                        laporan akhir.
                                    </p>
                                    <Link
                                        href={otpLogin.url()}
                                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#106feb] ring-1 ring-[#106feb]/20 transition hover:bg-[#106feb] hover:text-white"
                                    >
                                        <LogIn className="size-4" />
                                        Masuk ke Akun
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );

    // Versi dasbor: dibuka via menu "Lacak Status Publik" oleh pengguna login.
    // Dibungkus MagangLayout (header + nav dasbor), tanpa chrome tamu.
    if (isAuthed && authUser) {
        return (
            <MagangLayout
                user={authUser}
                title="Lacak Status Publik"
                active="lacak-publik"
                navItems={NAV_BY_ROLE[authUser.role] ?? mahasiswaNav}
            >
                <Head title="Lacak Status Publik" />
                <div className="mx-auto max-w-3xl">{content}</div>
            </MagangLayout>
        );
    }

    // Versi publik (tamu, dari homepage/navbar/footer): shell mandiri + CTA masuk.
    return (
        <>
            <Head title="Lacak Status — E-Magang Kota Madiun" />

            <div className="min-h-screen bg-slate-50 text-[#12213e]">
                {/* ===== Header ===== */}
                <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:px-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[#106feb] text-base font-black text-white shadow-sm">
                                eM
                            </div>
                            <div className="leading-tight">
                                <p className="text-sm font-bold text-[#12213e]">
                                    E-Magang
                                </p>
                                <p className="text-[11px] font-medium text-slate-500">
                                    Kota Madiun
                                </p>
                            </div>
                        </Link>
                        <Link
                            href={otpLogin.url()}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#106feb] hover:underline"
                        >
                            <LogIn className="size-4" />
                            Masuk
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
                    {content}
                </main>
            </div>
        </>
    );
}
