import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    GraduationCap,
    Layout,
    Loader2,
    LogIn,
    Mail,
    MapPin,
    Phone,
    Search,
    SearchX,
    Send,
    ShieldCheck,
    Ticket,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
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

// Tautan navigasi versi tamu — menuju seksi di landing (welcome). Karena
// halaman ini rute terpisah (/lacak), href memakai prefiks '/#...' agar
// membawa pengunjung kembali ke beranda lalu men-scroll ke seksi terkait.
const GUEST_NAV_LINKS = [
    { href: '/#fitur', label: 'Fitur' },
    { href: '/#instansi', label: 'OPD' },
    { href: '/#alur', label: 'Alur Pendaftaran' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/#daftar', label: 'Kontak' },
];

/* -------------------------------------------------------------------------
 *  Tombol CTA "sliding" khas landing (welcome.tsx AnimatedButton) — overlay
 *  geser dari kiri saat hover, badge ikon panah kontras dinamis. Diporting
 *  agar navbar tamu identik dengan halaman utama.
 * ----------------------------------------------------------------------- */
function AnimatedButton({
    children,
    href,
    className = '',
}: {
    children: React.ReactNode;
    href: string;
    className?: string;
}) {
    return (
        <motion.a
            href={href}
            whileTap={{ scale: 0.97 }}
            className={`group relative inline-flex items-center justify-between gap-3 overflow-hidden rounded-full bg-[#106feb] py-1 pr-1 pl-6 text-sm shadow-lg shadow-[#106feb]/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-[#106feb]/35 focus-visible:ring-2 focus-visible:ring-[#0b4fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5faff] focus-visible:outline-none ${className}`}
        >
            <span
                aria-hidden
                className="absolute inset-0 z-0 -translate-x-[101%] bg-[#cddcef] transition-transform duration-500 ease-out group-hover:translate-x-0"
            />
            <span className="relative z-10 font-semibold text-white transition-colors duration-500 ease-out group-hover:text-[#0a1628]">
                {children}
            </span>
            <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#cddcef] text-[#106feb] transition-colors duration-500 ease-out group-hover:bg-[#106feb] group-hover:text-white">
                <ArrowUpRight className="size-4 transition-transform duration-500 ease-out group-hover:rotate-45" />
            </span>
        </motion.a>
    );
}

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
 *
 *  Desain: SATU bahasa visual dengan landing (latar #f5faff + glow blobs,
 *  wordmark gradien, kartu rounded-3xl, tombol gradien biru).
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
    // User login (MagangUserResource, dengan avatar_url) — null bila tamu.
    // Dipakai header dasbor agar foto profil tampil sama seperti halaman lain.
    user?: MagangUser | null;
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
                                          ? 'bg-[#106feb] text-white shadow-lg shadow-[#106feb]/30'
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
                                          ? 'text-[#0a1628]'
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
            <dd className="mt-0.5 text-sm font-semibold text-[#0a1628]">
                {value ?? (
                    <span className="text-slate-400">— belum ditentukan</span>
                )}
            </dd>
        </div>
    );
}

type LookupState = 'idle' | 'loading' | 'found' | 'notfound';

export default function Lacak({ application, ticket, user }: LacakProps) {
    const [query, setQuery] = useState<string>(ticket ?? '');
    const [loading, setLoading] = useState(false);
    // State navbar tamu (mengikuti welcome.tsx): pill mengecil saat scroll,
    // panel menu melayang untuk mobile/tablet.
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Konteks autentikasi. Utamakan prop `user` dari controller (bentuk
    // MagangUserResource dengan avatar_url — sama seperti halaman dasbor lain)
    // dengan fallback shared prop auth.user (tanpa avatar_url). Bila login —
    // halaman dibuka via menu "Lacak Status Publik" di dasbor — kita sembunyikan
    // chrome tamu (CTA "Masuk") dan bungkus dengan MagangLayout agar terasa
    // sebagai halaman dasbor native (Task 8). Tamu (dari homepage) tetap versi publik.
    const sharedAuthUser =
        usePage<{ auth: { user: MagangUser | null } }>().props.auth?.user ??
        null;
    const authUser = user ?? sharedAuthUser;
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
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#106feb] to-[#0b4fb0] text-white shadow-[0_12px_30px_-6px_rgba(20,99,208,0.55)]">
                    <Ticket className="size-7" />
                </div>
                <h1 className="bg-gradient-to-r from-[#0a1628] to-[#0b4fb0] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
                    Lacak Status Permohonan
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#0a1628]/55">
                    Masukkan nomor tiket yang Anda terima saat mengajukan magang
                    untuk melihat perkembangan terkini.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-7 flex flex-col gap-3 sm:flex-row"
                >
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#0a1628]/40" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="MGG-2026-123456"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pr-4 pl-11 text-sm font-medium tracking-wide uppercase transition-all outline-none placeholder:tracking-normal placeholder:text-slate-400 placeholder:normal-case hover:border-[#cddcef] focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!query.trim() || state === 'loading'}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#106feb] to-[#0b4fb0] px-6 text-sm font-bold text-white shadow-lg shadow-[#106feb]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#106feb]/35 focus-visible:ring-2 focus-visible:ring-[#0b4fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5faff] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
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

                <p className="mt-3 text-xs text-[#0a1628]/45">
                    Format nomor tiket:{' '}
                    <span className="font-mono font-semibold text-[#0a1628]/60">
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
                            className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm"
                        >
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                                <SearchX className="size-7" />
                            </div>
                            <h2 className="mt-4 text-lg font-bold text-[#0a1628]">
                                Tiket tidak ditemukan
                            </h2>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-[#0a1628]/55">
                                Periksa kembali nomor tiket Anda. Pastikan
                                formatnya sesuai, mis.{' '}
                                <span className="font-mono font-semibold text-[#0a1628]">
                                    MGG-2026-123456
                                </span>
                                .
                            </p>
                            <Link
                                href="/#daftar"
                                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#106feb] to-[#0b4fb0] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#106feb]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
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
                            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#cddcef]/25 blur-3xl" />
                                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">
                                            Nomor Tiket
                                        </p>
                                        <p className="font-mono text-lg font-black tracking-tight text-[#106feb]">
                                            {result.ticket_number}
                                        </p>
                                    </div>
                                    <StatusBadge status={result.status} />
                                </div>
                                <p className="relative mt-3 border-t border-slate-100 pt-3 text-xs text-[#0a1628]/55">
                                    Diajukan pada{' '}
                                    {formatDate(result.created_at)} ·{' '}
                                    {result.institution_name}
                                </p>
                            </div>

                            {/* Penolakan */}
                            {result.status === 'rejected' && (
                                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
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
                                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                        <h3 className="text-base font-bold text-[#0a1628]">
                                            Perkembangan Permohonan
                                        </h3>
                                        <p className="mt-0.5 text-sm text-[#0a1628]/55">
                                            Status diperbarui otomatis di setiap
                                            tahap.
                                        </p>
                                        <div className="mt-6">
                                            <StatusTimeline
                                                status={result.status}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Detail */}
                                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                    <h3 className="text-base font-bold text-[#0a1628]">
                                        Detail
                                    </h3>
                                    <dl className="mt-4 grid grid-cols-1 gap-4">
                                        <DetailRow
                                            label="Bidang / Tujuan"
                                            value={result.tujuan_magang}
                                        />
                                        <DetailRow
                                            label="OPD Penempatan"
                                            value={result.opd?.name ?? null}
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
                                <div className="rounded-3xl border border-[#cddcef]/60 bg-gradient-to-br from-[#e8f2fe] to-white p-5 text-center">
                                    <p className="text-sm text-[#0a1628]/70">
                                        Sudah memiliki akun? Masuk untuk
                                        mengelola permohonan dan mengunggah
                                        laporan akhir.
                                    </p>
                                    <Link
                                        href={otpLogin.url()}
                                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#106feb] ring-1 ring-[#106feb]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#106feb] hover:text-white hover:shadow-lg hover:shadow-[#106feb]/25"
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
            <Head title="Lacak Status — E-Magang Kota Madiun">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div
                className="relative min-h-screen overflow-hidden bg-[#f5faff] text-[#0a1628] selection:bg-[#cddcef] selection:text-[#0a1628]"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                {/* Efek cahaya halus (soft glow) khas landing di area atas */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-full max-w-[1000px] -translate-x-1/2 bg-gradient-to-b from-[#cddcef]/30 to-transparent blur-3xl"
                />

                {/* ===== NAVBAR — Oval Floating (Glassmorphism), identik welcome ===== */}
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: 'circOut' }}
                    className="fixed top-5 left-1/2 z-[1000] w-[90%] max-w-[1200px] -translate-x-1/2"
                >
                    <div
                        className={`relative flex items-center justify-between rounded-full border border-white/20 bg-white/70 backdrop-blur-md transition-all duration-300 ${scrolled ? 'p-1.5 shadow-[0_12px_40px_rgba(8,71,156,0.14)] xl:p-2' : 'p-2 shadow-lg shadow-[#106feb]/5 xl:p-3'}`}
                    >
                        {/* Logo (kiri) */}
                        <Link
                            href="/"
                            className="bg-gradient-to-r from-[#0a1628] to-[#0b4fb0] bg-clip-text pl-4 text-xl tracking-tight text-transparent transition-opacity duration-300 hover:opacity-80"
                        >
                            E-Magang
                        </Link>

                        {/* Tautan navigasi inline (tengah) — hanya desktop (lg+).
                            Underline tumbuh dari tengah + warna beralih biru saat hover. */}
                        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
                            {GUEST_NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="group relative rounded-full px-4 py-2 text-sm font-medium text-[#0a1628]/70 transition-colors duration-300 hover:text-[#106feb] focus-visible:ring-2 focus-visible:ring-[#0b4fb0]/50 focus-visible:outline-none"
                                >
                                    {link.label}
                                    <span
                                        aria-hidden
                                        className="absolute inset-x-4 bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-[#106feb] transition-transform duration-300 ease-out group-hover:scale-x-100"
                                    />
                                </a>
                            ))}
                        </nav>

                        {/* Aksi kanan: Masuk (desktop) + CTA sliding + hamburger (mobile) */}
                        <div className="flex items-center gap-2 xl:gap-3">
                            <Link
                                href={otpLogin.url()}
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#0a1628]/70 transition-colors duration-300 hover:text-[#106feb] focus-visible:ring-2 focus-visible:ring-[#0b4fb0]/50 focus-visible:outline-none lg:inline-flex"
                            >
                                Masuk
                            </Link>

                            <AnimatedButton href="/#daftar">
                                Daftar
                            </AnimatedButton>

                            {/* Hamburger — hanya mobile/tablet (< lg) */}
                            <button
                                onClick={() => setMobileMenuOpen((v) => !v)}
                                className="relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-[#106feb] text-white shadow-md shadow-[#106feb]/30 transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#0b4fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5faff] focus-visible:outline-none lg:hidden"
                                aria-label="Buka menu navigasi"
                                aria-expanded={mobileMenuOpen}
                            >
                                <div className="flex flex-col gap-1">
                                    <span
                                        className={`h-0.5 w-4 rounded-full bg-white transition-all duration-300 ${mobileMenuOpen ? 'translate-y-[3px] rotate-45' : ''}`}
                                    />
                                    <span
                                        className={`h-0.5 w-4 rounded-full bg-white transition-all duration-300 ${mobileMenuOpen ? '-translate-y-[3px] -rotate-45' : ''}`}
                                    />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Dropdown panel melayang (semua menu + Lacak Tiket + Masuk) */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                                transition={{ duration: 0.25, ease: 'circOut' }}
                                className="mt-3 overflow-hidden rounded-3xl border border-white/30 bg-white/80 shadow-[0_20px_50px_rgba(8,71,156,0.12)] backdrop-blur-md"
                            >
                                <div className="flex flex-col gap-1 px-4 py-4">
                                    {GUEST_NAV_LINKS.map((link) => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
                                            className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#0a1628]/70 transition-colors hover:bg-[#106feb]/5 hover:text-[#106feb] focus-visible:bg-[#106feb]/5 focus-visible:text-[#106feb] focus-visible:outline-none"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    {/* Lacak Tiket — halaman saat ini (rute /lacak) */}
                                    <Link
                                        href={lacak.url()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="mt-1 flex items-center gap-2 rounded-xl border-t border-slate-100 px-3 pt-3.5 pb-2.5 text-[15px] font-medium text-[#106feb]"
                                    >
                                        <Ticket className="size-4" /> Lacak
                                        Tiket
                                    </Link>
                                    <Link
                                        href={otpLogin.url()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-[#0a1628]/70 transition-colors hover:bg-[#106feb]/5 hover:text-[#106feb] focus-visible:bg-[#106feb]/5 focus-visible:text-[#106feb] focus-visible:outline-none"
                                    >
                                        Masuk Akun
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.nav>

                <main className="relative mx-auto max-w-3xl px-5 pt-[130px] pb-16 sm:px-6 sm:pt-[150px]">
                    {/* Glow blobs premium di belakang konten (senada hero landing) */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
                    >
                        <div className="absolute top-4 left-1/4 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[#0b4fb0]/15 blur-[120px]" />
                        <div className="absolute top-10 right-1/4 h-[320px] w-[320px] translate-x-1/2 rounded-full bg-[#106feb]/15 blur-[120px]" />
                    </div>

                    {content}

                    {/* Penanda kepercayaan */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 text-[12px] font-medium text-[#0a1628]/55">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-white/60 px-3 py-1.5 shadow-sm backdrop-blur-md">
                            <ShieldCheck className="size-3.5 text-[#106feb]" />
                            Tanpa Login
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-white/60 px-3 py-1.5 shadow-sm backdrop-blur-md">
                            <CheckCircle2 className="size-3.5 text-[#106feb]" />
                            Status Real-time
                        </span>
                    </div>
                </main>

                {/* ===== FOOTER — selaras landing (welcome.tsx) ===== */}
                <footer className="relative overflow-hidden bg-[#020c1b] px-6 pt-16 pb-10 text-white">
                    <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#106feb]/60 to-transparent"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[640px] max-w-[90vw] -translate-x-1/2 rounded-full bg-[#0b4fb0]/15 blur-[140px]"
                    />
                    <Building2
                        aria-hidden
                        className="pointer-events-none absolute -right-8 -bottom-12 h-64 w-64 text-white/[0.025]"
                    />

                    <div className="relative mx-auto max-w-7xl">
                        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
                            {/* Kolom brand */}
                            <div className="md:col-span-5">
                                <div className="mb-5 flex items-center gap-2.5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#106feb] to-[#0b4fb0] shadow-[0_10px_24px_-8px_rgba(20,99,208,0.7)]">
                                        <Layout className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="bg-gradient-to-r from-white via-white to-[#cddcef] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
                                        E-Magang.
                                    </span>
                                </div>
                                <p className="max-w-sm text-[15px] leading-relaxed text-white/55">
                                    Portal resmi pendaftaran magang Pemerintah
                                    Kota Madiun. Satu pintu untuk menghubungkan
                                    pelajar dan mahasiswa dengan instansi
                                    pemerintah secara mudah, transparan, dan
                                    gratis.
                                </p>
                                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/70">
                                    <ShieldCheck className="h-4 w-4 text-[#106feb]" />
                                    Layanan Resmi Diskominfo Kota Madiun
                                </div>
                            </div>

                            {/* Kolom navigasi */}
                            <div className="md:col-span-3">
                                <h4 className="mb-5 text-[13px] font-bold tracking-wider text-white/40 uppercase">
                                    Navigasi
                                </h4>
                                <ul className="flex flex-col gap-3.5">
                                    {GUEST_NAV_LINKS.map((link) => (
                                        <li key={link.href}>
                                            <a
                                                href={link.href}
                                                className="group relative inline-flex items-center text-[15px] text-white/60 transition-colors hover:text-white"
                                            >
                                                <ArrowRight
                                                    aria-hidden
                                                    className="absolute left-0 h-3.5 w-3.5 -translate-x-1 text-[#106feb] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                                                />
                                                <span className="transition-transform duration-300 group-hover:translate-x-5">
                                                    {link.label}
                                                </span>
                                            </a>
                                        </li>
                                    ))}
                                    <li>
                                        <Link
                                            href={lacak.url()}
                                            className="group relative inline-flex items-center text-[15px] text-white/60 transition-colors hover:text-white"
                                        >
                                            <ArrowRight
                                                aria-hidden
                                                className="absolute left-0 h-3.5 w-3.5 -translate-x-1 text-[#106feb] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                                            />
                                            <span className="transition-transform duration-300 group-hover:translate-x-5">
                                                Lacak Tiket
                                            </span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Kolom kontak */}
                            <div className="md:col-span-4">
                                <h4 className="mb-5 text-[13px] font-bold tracking-wider text-white/40 uppercase">
                                    Hubungi Kami
                                </h4>
                                <ul className="flex flex-col gap-4">
                                    <li className="flex items-start gap-3 text-[15px] text-white/60">
                                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#106feb]" />
                                        <span className="leading-relaxed">
                                            Jl. Perintis Kemerdekaan No.32, Kota
                                            Madiun, Jawa Timur 63117
                                        </span>
                                    </li>
                                    <li>
                                        <a
                                            href="mailto:kominfo@madiunkota.go.id"
                                            className="flex items-center gap-3 text-[15px] text-white/60 transition-colors hover:text-white"
                                        >
                                            <Mail className="h-5 w-5 shrink-0 text-[#106feb]" />
                                            kominfo@madiunkota.go.id
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="tel:0351467327"
                                            className="flex items-center gap-3 text-[15px] text-white/60 transition-colors hover:text-white"
                                        >
                                            <Phone className="h-5 w-5 shrink-0 text-[#106feb]" />
                                            (0351) 467327
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                            <p className="text-center text-[14px] text-white/45 sm:text-left">
                                © {new Date().getFullYear()} Dinas Komunikasi
                                dan Informatika Kota Madiun. Hak cipta
                                dilindungi.
                            </p>
                            <div className="flex items-center gap-6 text-[14px] text-white/45">
                                <a
                                    href="#"
                                    className="transition-colors hover:text-white"
                                >
                                    Kebijakan Privasi
                                </a>
                                <a
                                    href="#"
                                    className="transition-colors hover:text-white"
                                >
                                    Syarat &amp; Ketentuan
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
