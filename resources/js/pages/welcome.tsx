import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    Layout,
    Shield,
    Clock,
    Building2,
    MapPin,
    Mail,
    Phone,
    CheckCircle2,
    ArrowRight,
    ArrowUpRight,
    Send,
    Search,
    ChevronDown,
    ShieldCheck,
    Sparkles,
    Award,
    Timer,
    FileText,
    SearchCheck,
    Key,
    Download,
    Info,
    Calendar,
    ChevronLeft,
    ImagePlus,
    Users,
    Star,
    Quote,
    X,
    Ticket,
} from 'lucide-react';
import { motion, AnimatePresence, useInView, animate } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { useRecaptchaV3 } from '@/hooks/use-recaptcha-v3';

/* =========================================================================
 *  ANIMATION HELPERS (Framer Motion)
 * ========================================================================= */

// Scroll Reveal: fade + slide-up saat section masuk ke viewport.
// Memakai easing 'circOut' agar transisi terasa organik & mewah.
function Reveal({
    children,
    className,
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay, ease: 'circOut' }}
        >
            {children}
        </motion.div>
    );
}

// Stagger Container: membungkus daftar agar anak-anaknya muncul satu per satu.
const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
};

// Stagger Item: tiap elemen anak muncul dengan fade + slide-up organik.
const staggerItem = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'circOut' as const },
    },
};

// Animated Statistics: count-up dari 0 ke target saat masuk viewport.
// Memperbarui DOM secara langsung agar tidak memicu render per-frame.
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    useEffect(() => {
        const node = ref.current;

        if (!inView || !node) {
            return;
        }

        const controls = animate(0, to, {
            duration: 2,
            ease: 'easeOut',
            onUpdate(value) {
                node.textContent = `${Math.round(value)}${suffix}`;
            },
        });

        return () => controls.stop();
    }, [inView, to, suffix]);

    return <span ref={ref}>{`0${suffix}`}</span>;
}

function AnimatedButton({
    children,
    as = 'button',
    href,
    variant = 'default',
    type,
    disabled = false,
    className = '',
    onClick,
}: {
    children: React.ReactNode;
    as?: 'button' | 'a' | 'link';
    href?: string;
    variant?: 'default' | 'inverted';
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
}) {
    const isInverted = variant === 'inverted';

    // Skema warna 3-lapis. Kunci efek "sliding": badge & teks WAJIB berganti
    // warna kontras seiring overlay menutupi base, agar lingkaran ikon tidak
    // "hilang" melebur ke dalam overlay yang sewarna.
    //
    //                       │ base (diam)          │ hover (overlay penuh)
    // ─────────────────────┼──────────────────────┼───────────────────────
    //  default  background │ biru   #106feb        │ overlay #cddcef
    //           teks        │ putih                 │ gelap  #0a1628
    //           badge       │ #cddcef + panah biru  │ biru   + panah putih
    //  inverted background │ #cddcef               │ overlay biru #106feb
    //           teks        │ gelap  #0a1628        │ putih
    //           badge       │ biru   + panah putih  │ #cddcef + panah biru
    const baseBg = isInverted ? 'bg-[#cddcef]' : 'bg-[#106feb]';
    const baseText = isInverted ? 'text-[#0a1628]' : 'text-white';
    const hoverText = isInverted
        ? 'group-hover:text-white'
        : 'group-hover:text-[#0a1628]';
    const fill = isInverted ? 'bg-[#106feb]' : 'bg-[#cddcef]';
    // Badge berganti warna agar selalu kontras dengan lapisan di bawahnya saat itu.
    const badgeBg = isInverted
        ? 'bg-[#106feb] group-hover:bg-[#cddcef]'
        : 'bg-[#cddcef] group-hover:bg-[#106feb]';
    const arrowColor = isInverted
        ? 'text-white group-hover:text-[#106feb]'
        : 'text-[#106feb] group-hover:text-white';

    const content = (
        <>
            {/* LAPIS 2 — Overlay geser: menutupi background dari kiri → kanan saat hover.
                Durasi & easing identik dengan transisi teks/badge agar sinkron. */}
            <span
                aria-hidden
                className={`absolute inset-0 z-0 ${fill} -translate-x-[101%] transition-transform duration-500 ease-out group-hover:translate-x-0`}
            />
            {/* LAPIS 3 — Label: warna teks berubah dinamis saat overlay menutupi */}
            <span
                className={`relative z-10 font-semibold transition-colors duration-500 ease-out ${baseText} ${hoverText}`}
            >
                {children}
            </span>
            {/* LAPIS 3 — Badge ikon panah (lingkaran sempurna) di kanan, kontras dinamis */}
            <span
                className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ease-out ${badgeBg} ${arrowColor}`}
            >
                <ArrowUpRight className="size-4 transition-transform duration-500 ease-out group-hover:rotate-45" />
            </span>
        </>
    );

    const shared = `group relative inline-flex items-center justify-between gap-3 overflow-hidden rounded-full py-1 pl-6 pr-1 text-sm ${baseBg} shadow-lg shadow-[#106feb]/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-[#106feb]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b4fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5faff] ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`;

    if (as === 'link' && href) {
        return (
            <Link href={href} onClick={onClick} className={shared}>
                {content}
            </Link>
        );
    }

    if (as === 'a') {
        return (
            <motion.a
                href={href}
                onClick={onClick}
                whileTap={{ scale: 0.97 }}
                className={shared}
            >
                {content}
            </motion.a>
        );
    }

    return (
        <motion.button
            type={type}
            disabled={disabled}
            onClick={onClick}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            className={shared}
        >
            {content}
        </motion.button>
    );
}

// Stagger khusus Hero: judul → sub-judul → tombol muncul berurutan (slide-up).
const heroContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
};

const heroItem = {
    hidden: { opacity: 0, y: 28 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: 'circOut' as const },
    },
};

// Bento Item: tiap kartu muncul dengan fade-in + scale-up halus saat scroll.
const bentoItem = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.55, ease: 'circOut' as const },
    },
};

/* =========================================================================
 *  ORBIT IMAGE — aset gambar asli (webild) yang mengorbit mengelilingi H1.
 *  Mekanika 4 lapis agar gambar tetap TEGAK (upright) saat berputar:
 *   1. ring   : motion.div di titik pusat, ukuran 0, berputar 360° (linear).
 *   2. radius : div statis dengan translateX(r) → menempatkan gambar di tepi
 *               orbit; ikut berputar karena induknya (ring) berputar.
 *   3. upright: motion.div counter-rotate -360° (durasi & easing identik)
 *               sehingga rotasi bersih = 0 → gambar tidak ikut miring.
 *   4. float  : osilasi y halus di dalam frame yang sudah tegak → gerak
 *               organik "melayang".
 *  Arah (reverse) & sudut awal (startAngle) berbeda tiap gambar agar sebaran
 *  merata dan tidak seragam.
 * ========================================================================= */
function OrbitImage({
    src,
    alt,
    radius,
    size,
    duration,
    startAngle = 0,
    reverse = false,
    delay = 0,
}: {
    src: string;
    alt: string;
    radius: number;
    size: number;
    duration: number;
    startAngle?: number;
    reverse?: boolean;
    delay?: number;
}) {
    const dir = reverse ? -1 : 1;

    return (
        <motion.div
            aria-hidden
            className="absolute top-1/2 left-1/2 h-0 w-0"
            initial={{ rotate: startAngle, opacity: 0 }}
            animate={{ rotate: startAngle + dir * 360, opacity: 1 }}
            transition={{
                rotate: { duration, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 0.8, delay },
            }}
        >
            {/* Lapis radius: dorong gambar ke tepi orbit */}
            <div style={{ transform: `translateX(${radius}px)` }}>
                {/* Lapis upright: counter-rotate agar gambar selalu tegak */}
                <motion.div
                    initial={{ rotate: -startAngle }}
                    animate={{ rotate: -startAngle - dir * 360 }}
                    transition={{ duration, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: size,
                        height: size,
                        marginLeft: -size / 2,
                        marginTop: -size / 2,
                    }}
                >
                    {/* Lapis float: melayang lembut dalam frame tegak */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay,
                        }}
                        className="h-full w-full overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_12px_30px_-8px_rgba(8,71,156,0.35)] backdrop-blur-sm"
                    >
                        <img
                            src={src}
                            alt={alt}
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
}

/* =========================================================================
 *  DATE PICKER — kalender popover kustom.
 *  Klik di mana saja pada field → kalender muncul → pilih tanggal →
 *  kolom otomatis terisi (format Indonesia, mis. "25 Juni 2026").
 *  Nilai disimpan dalam ISO (yyyy-mm-dd); mendukung batas minimum (min).
 * ========================================================================= */
const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const NAMA_BULAN = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
}

function formatTanggalID(iso: string) {
    if (!iso) {
        return '';
    }

    const [y, m, d] = iso.split('-').map(Number);

    return `${d} ${NAMA_BULAN[m - 1]} ${y}`;
}

function DatePicker({
    value,
    onChange,
    min,
    placeholder = 'Pilih tanggal',
}: {
    value: string;
    onChange: (iso: string) => void;
    min?: string;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() =>
        value ? new Date(`${value}T00:00:00`) : new Date(),
    );
    const ref = useRef<HTMLDivElement>(null);

    // Tutup popover saat klik di luar atau menekan Escape.
    useEffect(() => {
        if (!open) {
            return;
        }

        function handlePointer(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handlePointer);
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('mousedown', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayISO = toISODate(new Date());

    const cells: (number | null)[] = [];

    for (let i = 0; i < firstWeekday; i++) {
        cells.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(d);
    }

    const goMonth = (delta: number) =>
        setViewDate(new Date(year, month + delta, 1));

    return (
        <div ref={ref} className="relative">
            {/* Field pemicu — seluruh area dapat diklik untuk membuka kalender. */}
            <button
                type="button"
                onClick={() => {
                    if (!open && value) {
                        setViewDate(new Date(`${value}T00:00:00`));
                    }

                    setOpen((o) => !o);
                }}
                className={`flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3.5 text-left text-[15px] transition-all focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none ${open ? 'border-transparent ring-2 ring-[#0b4fb0]' : 'border-slate-200'} ${value ? 'text-[#0a1628]' : 'text-[#0a1628]/40'}`}
            >
                <span>{value ? formatTanggalID(value) : placeholder}</span>
                <Calendar
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${open ? 'text-[#0b4fb0]' : 'text-[#0a1628]/40'}`}
                />
            </button>

            {/* Popover kalender */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute top-[calc(100%+8px)] left-0 z-30 w-[300px] rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_20px_50px_-12px_rgba(8,71,156,0.25)]"
                    >
                        {/* Navigasi bulan */}
                        <div className="mb-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => goMonth(-1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0a1628]/60 transition-colors hover:bg-[#f5faff] hover:text-[#0b4fb0]"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-[14px] font-semibold text-[#0a1628]">
                                {NAMA_BULAN[month]} {year}
                            </span>
                            <button
                                type="button"
                                onClick={() => goMonth(1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0a1628]/60 transition-colors hover:bg-[#f5faff] hover:text-[#0b4fb0]"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Nama hari */}
                        <div className="mb-1 grid grid-cols-7 gap-1">
                            {NAMA_HARI.map((h) => (
                                <span
                                    key={h}
                                    className="flex h-8 items-center justify-center text-[11px] font-semibold text-[#0a1628]/35 uppercase"
                                >
                                    {h}
                                </span>
                            ))}
                        </div>

                        {/* Grid tanggal */}
                        <div className="grid grid-cols-7 gap-1">
                            {cells.map((d, i) => {
                                if (d === null) {
                                    return <span key={`empty-${i}`} />;
                                }

                                const iso = toISODate(new Date(year, month, d));
                                const disabled = min ? iso < min : false;
                                const selected = iso === value;
                                const isToday = iso === todayISO;

                                return (
                                    <button
                                        key={iso}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                            onChange(iso);
                                            setOpen(false);
                                        }}
                                        className={`flex h-9 items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                                            selected
                                                ? 'bg-[#106feb] text-white shadow-sm'
                                                : disabled
                                                  ? 'cursor-not-allowed text-[#0a1628]/20'
                                                  : isToday
                                                    ? 'bg-[#f5faff] text-[#0b4fb0] hover:bg-[#e7f0fc]'
                                                    : 'text-[#0a1628]/70 hover:bg-[#f5faff] hover:text-[#0b4fb0]'
                                        }`}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface WelcomeFaq {
    id: number;
    question: string;
    answer: string;
}

interface WelcomeOpd {
    id: number;
    name: string;
    code: string;
    // Tag kompetensi: kolom opds.description (dipisah koma) — batch 5.
    description?: string | null;
    quota: number;
    quota_used: number;
}

interface WelcomeTestimonial {
    id: number;
    rating: number;
    comment: string;
    name: string;
    institution?: string | null;
}

interface WelcomeProps {
    faqs?: WelcomeFaq[];
    opds?: WelcomeOpd[];
    testimonials?: WelcomeTestimonial[];
}

export default function Welcome({
    faqs = [],
    opds = [],
    testimonials = [],
}: WelcomeProps) {
    const [scrolled, setScrolled] = useState(false);
    // State tanggal magang — disimpan ISO (yyyy-mm-dd), ditampilkan format Indonesia.
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');

    // Site key reCAPTCHA dari shared props (HandleInertiaRequests).
    const recaptchaSiteKey =
        (usePage().props as { recaptchaSiteKey?: string }).recaptchaSiteKey ??
        '';

    // Formulir pendaftaran publik → POST /pengajuan (multipart karena pas foto).
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        setError,
        clearErrors,
        transform,
    } = useForm<{
        name: string;
        nis: string;
        institution_name: string;
        tujuan_magang: string;
        major: string;
        skills: string;
        address: string;
        start_date: string;
        end_date: string;
        campus_supervisor: string;
        campus_supervisor_whatsapp: string;
        whatsapp_number: string;
        email: string;
        photo: File | null;
        surat_pengantar: File | null;
        cv: File | null;
        portfolio: File | null;
        recaptcha_token: string;
    }>({
        name: '',
        nis: '',
        institution_name: '',
        tujuan_magang: '',
        major: '',
        skills: '',
        address: '',
        start_date: '',
        end_date: '',
        campus_supervisor: '',
        campus_supervisor_whatsapp: '',
        whatsapp_number: '',
        email: '',
        photo: null,
        surat_pengantar: null,
        cv: null,
        portfolio: null,
        recaptcha_token: '',
    });

    // State unggah pas foto — simpan nama berkas + URL pratinjau (object URL).
    const [pasFotoNama, setPasFotoNama] = useState('');
    const [pasFotoPreview, setPasFotoPreview] = useState('');

    // Batas ukuran berkas (selaras StoreApplicationRequest): pas foto/dokumen
    // 2MB, khusus portofolio 10MB.
    const MAX_2MB = 2 * 1024 * 1024;
    const MAX_10MB = 10 * 1024 * 1024;

    const handlePasFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.size > MAX_2MB) {
            setError('photo', 'Ukuran file maksimal 2MB.');
            e.target.value = '';

            return;
        }

        clearErrors('photo');
        setData('photo', file);
        setPasFotoNama(file.name);
        setPasFotoPreview((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev);
            }

            return URL.createObjectURL(file);
        });
    };

    // Berkas pendukung opsional ("jika ada"): Surat Pengantar / CV / Portofolio.
    const [suratPengantarNama, setSuratPengantarNama] = useState('');
    const [cvNama, setCvNama] = useState('');
    const [portfolioNama, setPortfolioNama] = useState('');

    const handleBerkas =
        (
            field: 'surat_pengantar' | 'cv' | 'portfolio',
            setNama: (value: string) => void,
        ) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] ?? null;

            // Validasi ukuran sisi klien: dokumen 2MB, portofolio 10MB.
            const maxBytes = field === 'portfolio' ? MAX_10MB : MAX_2MB;

            if (file && file.size > maxBytes) {
                setError(
                    field,
                    `Ukuran file maksimal ${field === 'portfolio' ? '10MB' : '2MB'}.`,
                );
                e.target.value = '';

                return;
            }

            clearErrors(field);
            setData(field, file);
            setNama(file?.name ?? '');
        };
    // State FAQ
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // FAQ dari DB (dikelola verifikator); fallback ke set default bila kosong.
    const faqList: { q: string; a: string }[] =
        faqs.length > 0
            ? faqs.map((f) => ({ q: f.question, a: f.answer }))
            : [
                  {
                      q: 'Apa itu E-Magang Kota Madiun?',
                      a: 'Platform digital resmi untuk mempermudah pendaftaran, verifikasi, dan pemantauan status magang siswa/mahasiswa di lingkungan instansi Pemerintah Kota Madiun.',
                  },
                  {
                      q: 'Apakah pendaftaran dikenakan biaya?',
                      a: 'Tidak. Seluruh layanan di E-Magang Kota Madiun adalah gratis bagi seluruh pelajar dan mahasiswa.',
                  },
                  {
                      q: 'Berapa lama proses verifikasi berkas?',
                      a: 'Biasanya memakan waktu 2-3 hari kerja. Anda akan mendapatkan notifikasi status melalui email atau WhatsApp yang terdaftar.',
                  },
                  {
                      q: 'Berapa lama durasi magang yang diperbolehkan?',
                      a: 'Durasi magang fleksibel mulai dari 1 hingga 6 bulan, menyesuaikan dengan kurikulum atau kebutuhan dari instansi pendidikan Anda.',
                  },
                  {
                      q: 'Apakah magang ini bisa dilakukan secara remote/WFH?',
                      a: 'Seluruh pelaksanaan magang mengikuti kebijakan operasional masing-masing OPD tujuan, namun mayoritas dilaksanakan secara WFO (On-Site) dengan jam kerja kantor pemerintah.',
                  },
                  {
                      q: 'Bagaimana cara mendapatkan e-Sertifikat?',
                      a: 'Setelah selesai melaksanakan magang, pastikan Anda telah mengunggah laporan tugas akhir dan mengisi survei evaluasi di dasbor akun Anda.',
                  },
              ];
    // State menu mobile (Dropdown Menu dengan AnimatePresence)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // --- reCAPTCHA v3 (invisible): execute saat submit, token ke form ---
    const executeRecaptcha = useRecaptchaV3(recaptchaSiteKey, 'daftar');

    const handleSubmitPengajuan = (e: React.FormEvent) => {
        e.preventDefault();

        // Ambil token v3 dulu (skor dihitung Google saat execute), baru POST
        // via transform agar token segar ikut tanpa menunggu re-render state.
        void executeRecaptcha().then((token) => {
            transform((current) => ({
                ...current,
                recaptcha_token: token,
            }));

            post('/pengajuan', {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setPasFotoNama('');
                    setPasFotoPreview('');
                    setSuratPengantarNama('');
                    setCvNama('');
                    setPortfolioNama('');
                    setTanggalMulai('');
                    setTanggalSelesai('');
                },
            });
        });
    };

    // State Fitur Pencarian OPD
    const [searchOpd, setSearchOpd] = useState('');

    // Daftar 35 OPD — tiap instansi dipetakan ke Tag Kompetensi sesuai bidangnya.
    // Tag membantu pelamar memilih penempatan yang relevan dengan jurusan/keahlian.
    const daftarOPD = [
        {
            name: 'BADAN KEPEGAWAIAN DAERAH',
            tags: ['SDM / Kepegawaian', 'Administrasi'],
        },
        {
            name: 'BADAN KESATUAN BANGSA DAN POLITIK',
            tags: ['Politik & Pemerintahan', 'Sosial'],
        },
        {
            name: 'BADAN PENANGGULANGAN BENCANA DAERAH',
            tags: ['Manajemen Bencana', 'Kesehatan'],
        },
        { name: 'BADAN PENDAPATAN DAERAH', tags: ['Akuntansi', 'Perpajakan'] },
        {
            name: 'BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH',
            tags: ['Akuntansi', 'Administrasi'],
        },
        {
            name: 'BADAN PERENCANAAN DAN PEMBANGUNAN DAERAH',
            tags: ['Perencanaan', 'Analisis Data'],
        },
        { name: 'BAGIAN HUKUM', tags: ['Hukum', 'Administrasi'] },
        { name: 'BAGIAN ORGANISASI', tags: ['Manajemen', 'Administrasi'] },
        {
            name: 'BAGIAN PEMERINTAHAN UMUM',
            tags: ['Administrasi Publik', 'Pemerintahan'],
        },
        {
            name: 'BAGIAN PENGADAAN BARANG/JASA DAN ADMINISTRASI PEMBANGUNAN',
            tags: ['Pengadaan', 'Administrasi'],
        },
        {
            name: 'BAGIAN PEREKONOMIAN DAN KESEJAHTERAAN RAKYAT',
            tags: ['Ekonomi', 'Sosial'],
        },
        { name: 'BAGIAN UMUM', tags: ['Tata Usaha', 'Administrasi'] },
        {
            name: 'DINAS KEBUDAYAAN, PARIWISATA, KEPEMUDAAN DAN OLAHRAGA',
            tags: ['Pariwisata', 'Seni & Budaya'],
        },
        {
            name: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL',
            tags: ['Administrasi Publik', 'Manajemen Data'],
        },
        {
            name: 'DINAS KESEHATAN DAN KELUARGA BERENCANA',
            tags: ['Kesehatan', 'Administrasi Publik'],
        },
        {
            name: 'DINAS KOMUNIKASI DAN INFORMATIKA',
            tags: ['IT / Software', 'Humas & Jurnalistik'],
        },
        { name: 'DINAS LINGKUNGAN HIDUP', tags: ['Lingkungan', 'Sains'] },
        {
            name: 'DINAS PEKERJAAN UMUM DAN TATA RUANG',
            tags: ['Teknik Sipil', 'Arsitektur'],
        },
        {
            name: 'DINAS PENANAMAN MODAL, PELAYANAN TERPADU SATU PINTU, KOPERASI DAN USAHA MIKRO',
            tags: ['Ekonomi', 'Pelayanan Publik'],
        },
        { name: 'DINAS PENDIDIKAN', tags: ['Pendidikan', 'Administrasi'] },
        { name: 'DINAS PERDAGANGAN', tags: ['Ekonomi', 'Bisnis'] },
        { name: 'DINAS PERHUBUNGAN', tags: ['Transportasi', 'Teknik'] },
        {
            name: 'DINAS PERPUSTAKAAN DAN KEARSIPAN',
            tags: ['Kearsipan', 'Literasi'],
        },
        {
            name: 'DINAS PERTANIAN DAN KETAHANAN PANGAN',
            tags: ['Pertanian', 'Sains'],
        },
        {
            name: 'DINAS PERUMAHAN DAN KAWASAN PERMUKIMAN',
            tags: ['Teknik Sipil', 'Tata Ruang'],
        },
        {
            name: 'DINAS SOSIAL, PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK',
            tags: ['Sosial', 'Pemberdayaan'],
        },
        { name: 'DINAS TENAGA KERJA', tags: ['SDM / Kepegawaian', 'Sosial'] },
        { name: 'INSPEKTORAT', tags: ['Audit', 'Akuntansi'] },
        {
            name: 'KECAMATAN KARTOHARJO',
            tags: ['Pemerintahan', 'Pelayanan Publik'],
        },
        {
            name: 'KECAMATAN MANGUHARJO',
            tags: ['Pemerintahan', 'Pelayanan Publik'],
        },
        { name: 'KECAMATAN TAMAN', tags: ['Pemerintahan', 'Pelayanan Publik'] },
        {
            name: 'RUMAH SAKIT UMUM DAERAH',
            tags: ['Kesehatan', 'Administrasi'],
        },
        { name: 'SATUAN POLISI PAMONG PRAJA', tags: ['Keamanan', 'Hukum'] },
        { name: 'SEKRETARIAT DAERAH', tags: ['Pemerintahan', 'Administrasi'] },
        { name: 'SEKRETARIAT DPRD', tags: ['Legislatif', 'Administrasi'] },
    ];

    // Sumber tunggal daftar OPD = prop `opds` (OpdResource → tabel opds), agar
    // OPD baru yang ditambahkan Verifikator LANGSUNG tampil di halaman utama.
    // Tag Kompetensi dirender dari kolom `description` (dipisah koma) yang
    // dikelola Verifikator/Admin OPD; kamus statis tagsByName hanya fallback
    // saat description kosong (dan daftar statis = pratinjau tanpa backend).
    const tagsByName = new Map(daftarOPD.map((o) => [o.name, o.tags]));
    const tagsFromDescription = (description?: string | null): string[] =>
        (description ?? '')
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag !== '');
    const opdWithQuota =
        opds.length > 0
            ? opds.map((real) => {
                  const dynamicTags = tagsFromDescription(real.description);

                  return {
                      name: real.name,
                      tags:
                          dynamicTags.length > 0
                              ? dynamicTags
                              : (tagsByName.get(real.name) ?? [
                                    'Administrasi',
                                    'Pelayanan Publik',
                                ]),
                      quota: real.quota ?? 0,
                      quotaUsed: real.quota_used ?? 0,
                  };
              })
            : daftarOPD.map((opd) => ({ ...opd, quota: 0, quotaUsed: 0 }));

    const filteredOPD = opdWithQuota.filter((opd) =>
        opd.name.toLowerCase().includes(searchOpd.toLowerCase()),
    );

    // Tautan navigasi (dipakai ulang oleh navbar desktop & menu mobile)
    const navLinks = [
        { href: '#fitur', label: 'Fitur' },
        { href: '#instansi', label: 'OPD' },
        { href: '#alur', label: 'Alur Pendaftaran' },
        // Tautan testimoni hanya muncul bila ada testimonial (section kondisional).
        ...(testimonials.length > 0
            ? [{ href: '#testimonial', label: 'Testimoni' }]
            : []),
        { href: '#faq', label: 'FAQ' },
        { href: '#daftar', label: 'Kontak' },
    ];
    // "Lacak Tiket" sengaja TIDAK dimasukkan ke navLinks: ia rute (/lacak),
    // bukan anchor seksi. Diakses lewat: tautan tersier di hero, tautan di
    // footer, dan item khusus di menu mobile — agar nav tengah tetap 6 anchor.

    // Logo instansi untuk Infinite Logo Slider (abbreviasi dari daftar OPD resmi)
    const instansiLogos = [
        'Diskominfo',
        'Dinas Pendidikan',
        'Dinas Kesehatan',
        'BAPPEDA',
        'BKD',
        'Dinas Sosial',
        'Satpol PP',
        'RSUD',
        'Dinas Perhubungan',
        'Inspektorat',
        'BPBD',
        'Dinas Lingkungan Hidup',
        'Disdukcapil',
        'Sekretariat Daerah',
    ];

    // Statistik dengan count-up (angka bersumber dari konten/fakta layanan)
    const statistik = [
        {
            value: 35,
            suffix: '',
            label: 'Instansi OPD Tersedia',
            icon: Building2,
        },
        { value: 4, suffix: '', label: 'Langkah Pendaftaran', icon: Sparkles },
        { value: 100, suffix: '%', label: 'Gratis Tanpa Biaya', icon: Award },
        {
            value: 3,
            suffix: ' Hari',
            label: 'Estimasi Verifikasi',
            icon: Timer,
        },
    ];

    // Efek untuk mengubah Navbar saat di-scroll
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Head title="E-Magang - Dinas Kominfo Kota Madiun">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* Latar Belakang Utama Webild (Light Blue-ish White) */}
            <div
                className="relative min-h-screen overflow-hidden bg-[#f5faff] text-[#0a1628] selection:bg-[#cddcef] selection:text-[#0a1628]"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                {/* Efek Cahaya Halus (Soft Glow) khas Webild SaaS di area atas */}
                <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-full max-w-[1000px] -translate-x-1/2 bg-gradient-to-b from-[#cddcef]/30 to-transparent blur-3xl"></div>

                {/* 1. NAVIGATION BAR — Oval Floating (Glassmorphism) */}
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

                        {/* Tautan Navigasi Inline (tengah) — hanya desktop (lg+).
                            Underline tumbuh dari tengah + warna beralih ke biru saat hover. */}
                        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
                            {navLinks.map((link) => {
                                // Route Inertia untuk href absolut (mis. /lacak),
                                // anchor <a> untuk tautan seksi (#...).
                                const NavEl = link.href.startsWith('/')
                                    ? Link
                                    : 'a';

                                return (
                                    <NavEl
                                        key={link.href}
                                        href={link.href}
                                        className="group relative rounded-full px-4 py-2 text-sm font-medium text-[#0a1628]/70 transition-colors duration-300 hover:text-[#106feb] focus-visible:ring-2 focus-visible:ring-[#0b4fb0]/50 focus-visible:outline-none"
                                    >
                                        {link.label}
                                        <span
                                            aria-hidden
                                            className="absolute inset-x-4 bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-[#106feb] transition-transform duration-300 ease-out group-hover:scale-x-100"
                                        />
                                    </NavEl>
                                );
                            })}
                        </nav>

                        {/* Aksi Kanan: Masuk (desktop) + CTA Sliding + Hamburger (mobile) */}
                        <div className="flex items-center gap-2 xl:gap-3">
                            {/* Tautan Masuk Akun — hanya desktop (lg+) */}
                            <Link
                                href="/login-otp"
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#0a1628]/70 transition-colors duration-300 hover:text-[#106feb] focus-visible:ring-2 focus-visible:ring-[#0b4fb0]/50 focus-visible:outline-none lg:inline-flex"
                            >
                                Masuk
                            </Link>

                            {/* Tombol CTA dengan animasi sliding overlay */}
                            <AnimatedButton as="a" href="#daftar">
                                Daftar
                            </AnimatedButton>

                            {/* Tombol Hamburger — hanya mobile/tablet (< lg) */}
                            <button
                                onClick={() => setMobileMenuOpen((v) => !v)}
                                className="relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-[#106feb] text-white shadow-md shadow-[#106feb]/30 transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#0b4fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5faff] focus-visible:outline-none lg:hidden"
                                aria-label="Buka menu navigasi"
                                aria-expanded={mobileMenuOpen}
                            >
                                <div className="flex flex-col gap-1">
                                    <span
                                        className={`h-0.5 w-4 rounded-full bg-white transition-all duration-300 ${mobileMenuOpen ? 'translate-y-[3px] rotate-45' : ''}`}
                                    ></span>
                                    <span
                                        className={`h-0.5 w-4 rounded-full bg-white transition-all duration-300 ${mobileMenuOpen ? '-translate-y-[3px] -rotate-45' : ''}`}
                                    ></span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Dropdown Panel Melayang (berisi semua menu + Masuk Akun) */}
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
                                    {navLinks.map((link) => {
                                        const NavEl = link.href.startsWith('/')
                                            ? Link
                                            : 'a';

                                        return (
                                            <NavEl
                                                key={link.href}
                                                href={link.href}
                                                onClick={() =>
                                                    setMobileMenuOpen(false)
                                                }
                                                className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#0a1628]/70 transition-colors hover:bg-[#106feb]/5 hover:text-[#106feb] focus-visible:bg-[#106feb]/5 focus-visible:text-[#106feb] focus-visible:outline-none"
                                            >
                                                {link.label}
                                            </NavEl>
                                        );
                                    })}
                                    {/* Lacak Tiket — rute /lacak, dipisah divider dari anchor seksi */}
                                    <Link
                                        href="/lacak"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="mt-1 flex items-center gap-2 rounded-xl border-t border-slate-100 px-3 pt-3.5 pb-2.5 text-[15px] font-medium text-[#0a1628]/70 transition-colors hover:bg-[#106feb]/5 hover:text-[#106feb] focus-visible:bg-[#106feb]/5 focus-visible:text-[#106feb] focus-visible:outline-none"
                                    >
                                        <Ticket className="size-4" /> Lacak
                                        Tiket
                                    </Link>
                                    <Link
                                        href="/login-otp"
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

                {/* 2. HERO SECTION */}
                <section className="relative mx-auto flex max-w-[1200px] flex-col items-center overflow-visible px-6 pt-[140px] pb-20 text-center">
                    {/* Glow Blobs premium di belakang teks & foto */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10"
                    >
                        <div className="absolute top-10 left-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#0b4fb0]/25 blur-[120px]"></div>
                        <div className="absolute top-24 right-1/4 h-[360px] w-[360px] translate-x-1/2 rounded-full bg-[#106feb]/20 blur-[120px]"></div>
                        <div className="absolute top-1/2 left-1/2 h-[300px] w-[520px] -translate-x-1/2 rounded-full bg-[#cddcef]/30 blur-[120px]"></div>
                    </div>

                    {/* Wadah relatif: jadi titik acuan orbit yang mengelilingi heading */}
                    <div className="relative flex w-full flex-col items-center">
                        {/* Lapisan ORBIT — aset asli webild mengorbit di sekitar H1.
                            Hanya tampil di layar lebar (lg+) agar tidak menutupi teks
                            pada perangkat sempit. Dipusatkan pada blok heading. */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-[44%] -z-[5] hidden -translate-y-1/2 xl:block"
                        >
                            <div className="relative mx-auto h-0 w-0">
                                <OrbitImage
                                    src="/images/orbit/avatar-1.webp"
                                    alt=""
                                    radius={430}
                                    size={64}
                                    duration={26}
                                    startAngle={0}
                                />
                                <OrbitImage
                                    src="/images/orbit/brand-2.webp"
                                    alt=""
                                    radius={470}
                                    size={56}
                                    duration={32}
                                    startAngle={70}
                                    reverse
                                    delay={0.2}
                                />
                                <OrbitImage
                                    src="/images/orbit/avatar-3.webp"
                                    alt=""
                                    radius={400}
                                    size={60}
                                    duration={24}
                                    startAngle={150}
                                    delay={0.35}
                                />
                                <OrbitImage
                                    src="/images/orbit/brand-4.webp"
                                    alt=""
                                    radius={500}
                                    size={52}
                                    duration={36}
                                    startAngle={210}
                                    reverse
                                    delay={0.15}
                                />
                                <OrbitImage
                                    src="/images/orbit/avatar-2.webp"
                                    alt=""
                                    radius={360}
                                    size={58}
                                    duration={22}
                                    startAngle={285}
                                    delay={0.5}
                                />
                                <OrbitImage
                                    src="/images/orbit/brand-1.webp"
                                    alt=""
                                    radius={520}
                                    size={54}
                                    duration={40}
                                    startAngle={330}
                                    reverse
                                    delay={0.3}
                                />
                            </div>
                        </div>

                        {/* Konten teks Hero dengan staggerChildren (judul → sub → tombol) */}
                        <motion.div
                            variants={heroContainer}
                            initial="hidden"
                            animate="show"
                            className="relative z-10 flex flex-col items-center"
                        >
                            {/* Badge Pengumuman (Pill) — dot gradien + cincin ping */}
                            <motion.div
                                variants={heroItem}
                                className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#106feb]/15 bg-white/70 px-4 py-2 text-[13px] font-semibold tracking-wide text-[#0a1628]/70 shadow-[0_4px_20px_rgba(16,111,235,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#106feb]/30 hover:bg-white"
                            >
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#106feb] opacity-60" />
                                    <span className="relative inline-flex size-2 rounded-full bg-gradient-to-br from-[#106feb] to-[#0b4fb0]" />
                                </span>
                                Portal Resmi Kota Madiun
                            </motion.div>

                            {/* Headline Utama — Inter Bold, gradien #0a1628 → #0b4fb0 */}
                            <motion.h1
                                variants={heroItem}
                                className="mb-6 max-w-4xl bg-gradient-to-r from-[#0a1628] to-[#0b4fb0] bg-clip-text text-[44px] leading-[1.05] font-bold tracking-tight text-transparent md:text-[72px] lg:text-[80px]"
                            >
                                Pusat Kendali Karir{' '}
                                <br className="hidden md:block" />
                                <span className="relative mt-2 inline-block leading-[1.15]">
                                    <span className="relative z-10 bg-gradient-to-r from-[#106feb] via-[#0b4fb0] to-[#106feb] bg-clip-text pb-[0.15em] text-transparent">
                                        Digital Anda
                                    </span>
                                    {/* Garis bawah tumbuh dari kiri saat hero muncul */}
                                    <motion.span
                                        aria-hidden
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{
                                            duration: 0.7,
                                            delay: 0.9,
                                            ease: 'circOut',
                                        }}
                                        className="absolute bottom-0 left-0 h-[6px] w-full origin-left rounded-full bg-gradient-to-r from-[#106feb] to-[#0b4fb0]"
                                    />
                                </span>
                            </motion.h1>

                            {/* Deskripsi Sub-headline */}
                            <motion.p
                                variants={heroItem}
                                className="mb-10 max-w-2xl text-[18px] leading-[1.6] font-medium text-[#0a1628]/60 md:text-[20px]"
                            >
                                Kelola pendaftaran, pantau status verifikasi,
                                dan temukan bidang penempatan yang tepat di
                                instansi pemerintahan dalam satu platform
                                cerdas.
                            </motion.p>

                            {/* Grup Tombol Aksi */}
                            <motion.div
                                variants={heroItem}
                                className="flex flex-col items-center gap-4 sm:flex-row"
                            >
                                <AnimatedButton
                                    as="a"
                                    href="#daftar"
                                    className="w-full sm:w-auto"
                                >
                                    Mulai Pengajuan Magang
                                </AnimatedButton>
                                <AnimatedButton
                                    as="a"
                                    href="#alur"
                                    variant="inverted"
                                    className="w-full sm:w-auto"
                                >
                                    Pelajari Alur
                                </AnimatedButton>
                            </motion.div>

                            {/* Tautan tersier — pintasan lacak status bagi pendaftar
                                yang sudah punya tiket (rute /lacak, bukan tombol besar). */}
                            <motion.div variants={heroItem} className="mt-5">
                                <Link
                                    href="/lacak"
                                    className="group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[#0a1628]/60 transition-colors duration-300 hover:text-[#106feb] focus-visible:ring-2 focus-visible:ring-[#0b4fb0]/50 focus-visible:outline-none"
                                >
                                    <Ticket className="h-4 w-4 text-[#106feb]" />
                                    Sudah mengajukan? Lacak status tiket
                                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </Link>
                            </motion.div>

                            {/* Baris penanda kepercayaan — chip pill konsisten dgn badge, hover naik */}
                            <motion.div
                                variants={heroItem}
                                className="mt-10 flex flex-wrap items-center justify-center gap-3 text-[13px] font-medium text-[#0a1628]/70"
                            >
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cddcef] hover:bg-white">
                                    <CheckCircle2 className="h-4 w-4 text-[#106feb]" />
                                    100% Gratis Tanpa Biaya
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cddcef] hover:bg-white">
                                    <ShieldCheck className="h-4 w-4 text-[#106feb]" />
                                    Data Terlindungi
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cddcef] hover:bg-white">
                                    <Building2 className="h-4 w-4 text-[#106feb]" />
                                    35 Instansi Resmi
                                </span>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* 3. VISUAL UTAMA — Foto Gedung (scale 0.95 → 1 saat scroll) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.9, ease: 'circOut' }}
                        className="group relative mt-24 w-full max-w-md md:max-w-2xl lg:max-w-4xl"
                    >
                        {/* Soft Layered Shadow (efek kedalaman 3D) */}
                        <div className="absolute -inset-4 -z-10 rounded-[40px] bg-[#0b4fb0]/20 blur-[80px]"></div>

                        <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white shadow-[0_20px_40px_-12px_rgba(8,71,156,0.25),0_40px_80px_-20px_rgba(20,99,208,0.3)] transition-transform duration-700 hover:-translate-y-2">
                            <img
                                src="/images/dasbor.png"
                                alt="Gedung Pemerintah Kota Madiun"
                                loading="lazy"
                                onError={(e) => {
                                    // Fallback elegan bila foto belum tersedia di /public/images.
                                    const img = e.currentTarget;
                                    img.style.display = 'none';
                                    const fallback = img.nextElementSibling;

                                    if (fallback) {
                                        fallback.classList.remove('hidden');
                                    }
                                }}
                                className="aspect-[4/3] w-full object-cover lg:aspect-[16/9]"
                            />
                            {/* Placeholder gradien (di-unhide oleh onError bila gambar gagal dimuat) */}
                            <div className="hidden aspect-[4/3] w-full flex-col items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0b4fb0] to-[#cddcef] lg:aspect-[16/9]">
                                <div className="flex flex-col items-center gap-3 text-white/90">
                                    <Building2 className="h-12 w-12" />
                                    <span className="text-[15px] font-medium">
                                        Gedung Pemerintah Kota Madiun
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 2.5. STRIP STATISTIK — angka count-up saat masuk viewport */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-80px' }}
                        className="mt-20 grid w-full max-w-4xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
                    >
                        {statistik.map((s) => (
                            <motion.div
                                key={s.label}
                                variants={staggerItem}
                                className="group flex flex-col items-center gap-2 rounded-3xl border border-slate-100 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#cddcef] hover:shadow-lg"
                            >
                                <span className="flex size-11 items-center justify-center rounded-2xl bg-[#cddcef]/50 text-[#106feb] transition-all duration-300 group-hover:-rotate-3 group-hover:bg-[#106feb] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#106feb]/30">
                                    <s.icon className="size-5" />
                                </span>
                                <span className="mt-1 text-3xl font-bold tracking-tight text-[#0a1628]">
                                    <CountUp to={s.value} suffix={s.suffix} />
                                </span>
                                <span className="text-[13px] leading-tight font-medium text-[#0a1628]/55">
                                    {s.label}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* 3.5. INFINITE LOGO SLIDER (Instansi) */}
                <section className="overflow-hidden border-y border-slate-100 bg-white/60 py-16">
                    {/* Track bergerak terus-menerus (infinite loop seamless) */}
                    <div className="relative">
                        {/* Fade tepi kiri & kanan */}
                        <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-32 bg-gradient-to-r from-[#f5faff] to-transparent"></div>
                        <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-32 bg-gradient-to-l from-[#f5faff] to-transparent"></div>

                        <motion.div
                            className="flex w-max gap-4"
                            animate={{ x: ['0%', '-50%'] }}
                            transition={{
                                duration: 30,
                                ease: 'linear',
                                repeat: Infinity,
                                repeatType: 'loop',
                            }}
                        >
                            {[...instansiLogos, ...instansiLogos].map(
                                (logo, idx) => (
                                    <div
                                        key={idx}
                                        className="group flex shrink-0 items-center gap-3 rounded-full border border-slate-100 bg-white px-6 py-3 shadow-[0_4px_20px_rgba(8,71,156,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cddcef] hover:shadow-md"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#cddcef]/40 bg-[#f5faff] transition-colors duration-300 group-hover:border-transparent group-hover:bg-[#106feb]">
                                            <Building2 className="h-4 w-4 text-[#106feb] transition-colors duration-300 group-hover:text-white" />
                                        </div>
                                        <span className="text-[15px] font-medium whitespace-nowrap text-[#0a1628]/70 transition-colors duration-300 group-hover:text-[#0a1628]">
                                            {logo}
                                        </span>
                                    </div>
                                ),
                            )}
                        </motion.div>
                    </div>
                </section>

                {/* 4. FITUR UNGGULAN (WEBILD BENTO GRID STYLE) */}
                <section
                    id="fitur"
                    className="mx-auto max-w-[1200px] px-6 py-24 md:py-32"
                >
                    {/* Section Header — judul gradien #0a1628 → #0b4fb0 */}
                    <Reveal className="mb-12 flex flex-col items-center gap-3 text-center md:mb-16">
                        <div className="mb-1 w-fit rounded-full border border-slate-100 bg-white px-3 py-1 text-[14px] text-[#0a1628]/70 shadow-sm">
                            <p>Kenapa E-Magang?</p>
                        </div>
                        <h2 className="max-w-2xl bg-gradient-to-r from-[#0a1628] to-[#0b4fb0] bg-clip-text pb-[0.1em] text-[32px] leading-[1.15] font-bold tracking-tight text-balance text-transparent md:text-[48px]">
                            Kenapa E-Magang?
                        </h2>
                        <p className="mt-1 max-w-2xl text-[16px] leading-relaxed text-balance text-[#0a1628]/60 md:text-[18px]">
                            Kami merancang platform ini untuk menghilangkan
                            kerumitan birokrasi manual, mempercepat persetujuan,
                            dan memberikan transparansi penuh.
                        </p>
                    </Reveal>

                    {/* Bento Grid (2 kolom atas + 1 kolom lebar bawah) — stagger + scale-up */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-80px' }}
                        className="flex flex-col gap-5 md:gap-6"
                    >
                        {/* Baris Atas — 2 kolom (stack jadi 1 kolom di mobile) */}
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                            {/* Kartu 1 — Validasi Real-time */}
                            <motion.div
                                variants={bentoItem}
                                whileHover={{ y: -12 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 22,
                                }}
                                className="group flex h-full flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#cddcef] hover:shadow-2xl md:p-10"
                            >
                                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0b4fb0]/15 bg-[#0b4fb0]/8 transition-all duration-300 group-hover:-rotate-3 group-hover:border-transparent group-hover:bg-[#106feb] group-hover:shadow-lg group-hover:shadow-[#106feb]/30">
                                    <Clock className="h-7 w-7 text-[#0b4fb0] transition-colors duration-300 group-hover:text-white" />
                                </div>
                                <h3 className="text-[22px] leading-snug font-bold text-[#0a1628]">
                                    Validasi Real-time
                                </h3>
                                <p className="text-[16px] leading-relaxed text-[#0a1628]/60">
                                    Pantau status pengajuan Anda secara
                                    langsung. Sistem akan memberi notifikasi
                                    begitu berkas Anda disetujui oleh
                                    verifikator dan OPD terkait.
                                </p>
                            </motion.div>

                            {/* Kartu 2 — Akses Dasbor Aman */}
                            <motion.div
                                variants={bentoItem}
                                whileHover={{ y: -12 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 22,
                                }}
                                className="group flex h-full flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#cddcef] hover:shadow-2xl md:p-10"
                            >
                                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0b4fb0]/15 bg-[#0b4fb0]/8 transition-all duration-300 group-hover:-rotate-3 group-hover:border-transparent group-hover:bg-[#106feb] group-hover:shadow-lg group-hover:shadow-[#106feb]/30">
                                    <Shield className="h-7 w-7 text-[#0b4fb0] transition-colors duration-300 group-hover:text-white" />
                                </div>
                                <h3 className="text-[22px] leading-snug font-bold text-[#0a1628]">
                                    Akses Dasbor Aman (Tanpa Sandi)
                                </h3>
                                <p className="text-[16px] leading-relaxed text-[#0a1628]/60">
                                    Lupakan rutinitas mereset kata sandi.
                                    Gunakan sistem OTP (One Time Password) via
                                    Email untuk login yang instan dan
                                    terenkripsi.
                                </p>
                            </motion.div>
                        </div>

                        {/* Baris Bawah — kartu lebar full width (E-Sertifikat TTE) */}
                        <motion.div
                            variants={bentoItem}
                            whileHover={{ y: -12 }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 22,
                            }}
                            className="group relative flex flex-col gap-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#cddcef] hover:shadow-2xl md:flex-row md:items-center md:gap-10 md:p-12"
                        >
                            {/* Konten teks */}
                            <div className="flex flex-col gap-4 md:flex-1">
                                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0b4fb0]/15 bg-[#0b4fb0]/8 transition-all duration-300 group-hover:-rotate-3 group-hover:border-transparent group-hover:bg-[#106feb] group-hover:shadow-lg group-hover:shadow-[#106feb]/30">
                                    <Award className="h-7 w-7 text-[#0b4fb0] transition-colors duration-300 group-hover:text-white" />
                                </div>
                                <h3 className="text-[24px] leading-snug font-bold text-[#0a1628] md:text-[28px]">
                                    E-Sertifikat Resmi Ber-TTE
                                </h3>
                                <p className="max-w-2xl text-[16px] leading-relaxed text-[#0a1628]/60 md:text-[17px]">
                                    Begitu masa magang selesai dan laporan
                                    disetujui, e-Sertifikat resmi dengan Tanda
                                    Tangan Elektronik (TTE) dari Diskominfo akan
                                    diterbitkan langsung ke dasbor Anda, siap
                                    digunakan untuk portofolio karir.
                                </p>
                            </div>

                            {/* Visual — ilustrasi kartu sertifikat ber-TTE */}
                            <div className="relative shrink-0 md:w-[320px]">
                                {/* Blob biru lembut di belakang ilustrasi */}
                                <div
                                    aria-hidden
                                    className="absolute -inset-6 -z-10 rounded-[3rem] bg-[#0b4fb0]/10 blur-2xl"
                                />
                                <div className="relative rounded-3xl border border-slate-100 bg-gradient-to-br from-[#f5faff] to-white p-6 shadow-lg transition-transform duration-500 group-hover:-rotate-2">
                                    {/* Header sertifikat */}
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b4fb0]">
                                                <Building2 className="h-5 w-5 text-white" />
                                            </div>
                                            <span className="text-[12px] leading-tight font-semibold text-[#0a1628]/70">
                                                Diskominfo
                                                <br />
                                                Kota Madiun
                                            </span>
                                        </div>
                                        <ShieldCheck className="h-7 w-7 text-[#0b4fb0]" />
                                    </div>
                                    {/* Garis-garis konten sertifikat */}
                                    <div className="mb-6 space-y-2.5">
                                        <div className="h-2.5 w-3/4 rounded-full bg-[#0b4fb0]/15" />
                                        <div className="h-2.5 w-full rounded-full bg-slate-100" />
                                        <div className="h-2.5 w-5/6 rounded-full bg-slate-100" />
                                    </div>
                                    {/* Footer: badge TTE terverifikasi */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-[#0b4fb0]/15 bg-[#0b4fb0]/8 px-3 py-2">
                                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0b4fb0]" />
                                        <span className="text-[13px] font-semibold text-[#0b4fb0]">
                                            Tertanda Elektronik (TTE) —
                                            Terverifikasi
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </section>

                {/* 4.5. DAFTAR INSTANSI / OPD SECTION (WEBILD STYLE) */}
                <section
                    id="instansi"
                    className="relative z-10 border-t border-slate-100 bg-white px-6 py-24 md:py-32"
                >
                    <div className="mx-auto max-w-[1200px]">
                        {/* Section Header */}
                        <Reveal className="mb-12 flex flex-col items-center gap-2 text-center">
                            <div className="mb-1 w-fit rounded-full border border-slate-100 bg-[#f5faff] px-3 py-1 text-[14px] text-[#0a1628]/70 shadow-sm">
                                <p>Direktori Instansi</p>
                            </div>
                            <h2 className="mb-4 bg-gradient-to-r from-[#0a1628] via-[#106feb] to-[#cddcef] bg-clip-text text-[32px] leading-[1.15] font-extrabold tracking-tight text-transparent md:text-[42px]">
                                Temukan Tempat Magangmu
                            </h2>
                            <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-[#0a1628]/60 md:text-[18px]">
                                Pilih dari 35 instansi Pemerintah Kota Madiun.
                                Ketik nama dinas atau badan pada kolom pencarian
                                di bawah.
                            </p>
                        </Reveal>

                        {/* Search Bar (Pill — modern, ikon kiri, ring fokus #0b4fb0) */}
                        <div className="mb-12 flex justify-center">
                            <div className="group relative w-full max-w-2xl">
                                <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-[#0a1628]/40 transition-colors group-focus-within:text-[#0b4fb0]" />
                                <input
                                    type="text"
                                    value={searchOpd}
                                    placeholder="Cari dinas, badan, atau bidang kompetensi..."
                                    className="w-full rounded-full border border-slate-200 bg-white py-4 pr-14 pl-14 text-[15px] text-[#0a1628] shadow-sm transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                    onChange={(e) =>
                                        setSearchOpd(e.target.value)
                                    }
                                />
                                {/* Tombol bersihkan — muncul lembut saat kolom terisi */}
                                <AnimatePresence>
                                    {searchOpd && (
                                        <motion.button
                                            type="button"
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }}
                                            transition={{ duration: 0.15 }}
                                            onClick={() => setSearchOpd('')}
                                            aria-label="Bersihkan pencarian"
                                            className="absolute top-1/2 right-4 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#f5faff] text-[#0a1628]/50 transition-colors hover:bg-[#106feb] hover:text-white focus-visible:bg-[#106feb] focus-visible:text-white focus-visible:outline-none"
                                        >
                                            <X className="h-4 w-4" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Grid Kartu OPD — layout animation: kartu tersaring keluar/masuk
                            dengan transisi halus (AnimatePresence) + stagger saat pertama scroll. */}
                        {filteredOPD.length > 0 ? (
                            <motion.div
                                layout
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, margin: '-80px' }}
                                className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
                            >
                                <AnimatePresence mode="popLayout">
                                    {filteredOPD.map((opd) => (
                                        <motion.div
                                            key={opd.name}
                                            layout
                                            variants={staggerItem}
                                            initial="hidden"
                                            animate="show"
                                            exit={{
                                                opacity: 0,
                                                scale: 0.9,
                                                transition: { duration: 0.2 },
                                            }}
                                            whileHover={{ y: -8 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 24,
                                            }}
                                            className="group relative flex h-full cursor-default flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-500 hover:border-[#0b4fb0]/20 hover:shadow-[0_30px_70px_-20px_rgba(20,99,208,0.35)]"
                                        >
                                            {/* Aura glow — muncul lembut saat hover */}
                                            <div
                                                aria-hidden
                                                className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gradient-to-br from-[#0b4fb0]/25 to-[#cddcef]/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                                            />

                                            {/* Garis aksen atas — "menggambar" dari kiri saat hover */}
                                            <div
                                                aria-hidden
                                                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[#106feb] via-[#0b4fb0] to-[#cddcef] transition-transform duration-500 ease-out group-hover:scale-x-100"
                                            />

                                            {/* Watermark ikon instansi */}
                                            <Building2
                                                aria-hidden
                                                className="pointer-events-none absolute -right-5 -bottom-7 h-32 w-32 text-[#0b4fb0]/[0.04] transition-all duration-500 group-hover:scale-110 group-hover:text-[#0b4fb0]/[0.07]"
                                            />

                                            {/* Header kartu: ikon + nama instansi */}
                                            <div className="relative flex items-start gap-4">
                                                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-gradient-to-br from-[#f5faff] to-[#e7f0fc] shadow-sm transition-all duration-500 group-hover:border-transparent group-hover:from-[#106feb] group-hover:to-[#0b4fb0] group-hover:shadow-[0_10px_24px_-8px_rgba(20,99,208,0.6)]">
                                                    <Building2 className="h-6 w-6 text-[#0b4fb0] transition-colors duration-500 group-hover:text-white" />
                                                </div>
                                                <h3 className="mt-1 text-[15px] leading-[1.5] font-semibold text-[#0a1628] transition-colors duration-300 group-hover:text-[#0b4fb0]">
                                                    {opd.name}
                                                </h3>
                                            </div>

                                            {/* Ketersediaan kuota magang */}
                                            {(() => {
                                                const sisa = Math.max(
                                                    0,
                                                    opd.quota - opd.quotaUsed,
                                                );
                                                const penuh = sisa === 0;

                                                return (
                                                    <div className="relative mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-[#f5faff] px-4 py-2.5">
                                                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#0a1628]/60">
                                                            <Users className="h-3.5 w-3.5 text-[#0b4fb0]" />{' '}
                                                            Kuota Magang
                                                        </span>
                                                        <span
                                                            className={
                                                                penuh
                                                                    ? 'rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600'
                                                                    : 'rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600'
                                                            }
                                                        >
                                                            {sisa} tersisa
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* Tag Kompetensi — badge biru muda, dipetakan per bidang */}
                                            <div className="relative mt-auto flex flex-wrap items-center gap-2 pt-6">
                                                {opd.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full border border-[#0b4fb0]/10 bg-[#f5faff] px-3 py-1 text-[10px] font-bold tracking-wide text-[#106feb] uppercase transition-colors duration-300 group-hover:border-[#0b4fb0]/20 group-hover:bg-[#e7f0fc]"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            /* Tampilan Jika OPD Tidak Ditemukan */
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-3xl border border-dashed border-slate-200 bg-[#f5faff] py-12 text-center"
                            >
                                <p className="text-[15px] text-[#0a1628]/60">
                                    Instansi "{searchOpd}" tidak ditemukan. Coba
                                    kata kunci lain.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* 5. ALUR PENDAFTARAN (TIMELINE) */}
                <section
                    id="alur"
                    className="border-t border-slate-100 bg-white py-24 md:py-32"
                >
                    <div className="mx-auto max-w-[1200px] px-6">
                        {/* Section Header */}
                        <Reveal className="mb-16 flex flex-col items-center gap-2 text-center">
                            <div className="mb-1 w-fit rounded-full border border-slate-100 bg-[#f5faff] px-3 py-1 text-[14px] text-[#0a1628]/70 shadow-sm">
                                <p>Cara Kerja</p>
                            </div>
                            <h2 className="max-w-2xl bg-gradient-to-r from-[#0a1628] via-[#106feb] to-[#cddcef] bg-clip-text text-[32px] leading-[1.15] font-extrabold tracking-tight text-transparent md:text-[42px]">
                                4 Langkah Menuju Penempatan
                            </h2>
                        </Reveal>

                        {/* Wrapper relatif — menampung garis penghubung "Draw Line" di belakang kartu */}
                        <div className="relative">
                            {/* Garis Penghubung Antar Langkah (Desktop) — animasi Draw Line dari kiri ke kanan.
                                Garis dotted biru muda; tertutup kartu putih & hanya tampak di sela antar langkah. */}
                            <motion.div
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{
                                    duration: 1.2,
                                    ease: 'easeInOut',
                                    delay: 0.2,
                                }}
                                style={{
                                    backgroundImage:
                                        'repeating-linear-gradient(to right, #cddcef 0 8px, transparent 8px 18px)',
                                }}
                                className="pointer-events-none absolute top-[88px] right-[12%] left-[12%] hidden h-[2px] origin-left lg:block"
                            />

                            {/* Grid 4 Kolom untuk Alur (stagger kiri → kanan saat scroll) */}
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, margin: '-80px' }}
                                className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
                            >
                                {[
                                    {
                                        num: '01',
                                        title: 'Isi Formulir & Unggah Dokumen',
                                        icon: FileText,
                                        desc: (
                                            <>
                                                Isi formulir pendaftaran dan
                                                unggah dokumen wajib seperti{' '}
                                                <strong className="font-semibold text-[#0a1628]">
                                                    Surat Pengantar
                                                </strong>{' '}
                                                dari Sekolah/Kampus serta{' '}
                                                <strong className="font-semibold text-[#0a1628]">
                                                    CV/Portofolio
                                                </strong>{' '}
                                                terbaru.
                                            </>
                                        ),
                                    },
                                    {
                                        num: '02',
                                        title: 'Proses Verifikasi',
                                        icon: SearchCheck,
                                        desc: (
                                            <>
                                                Berkas Anda akan diverifikasi
                                                secara teliti oleh tim internal
                                                dalam waktu{' '}
                                                <strong className="font-semibold text-[#0a1628]">
                                                    maksimal 3x24 jam kerja
                                                </strong>
                                                .
                                            </>
                                        ),
                                    },
                                    {
                                        num: '03',
                                        title: 'Login OTP Dasbor',
                                        icon: Key,
                                        desc: (
                                            <>
                                                Akses dasbor personal Anda
                                                menggunakan{' '}
                                                <strong className="font-bold text-[#0b4fb0]">
                                                    OTP
                                                </strong>{' '}
                                                via Email tanpa kata sandi untuk
                                                mengunduh surat persetujuan.
                                            </>
                                        ),
                                    },
                                    {
                                        num: '04',
                                        title: 'E-Sertifikat & Evaluasi',
                                        icon: Award,
                                        desc: (
                                            <>
                                                Unggah laporan tugas akhir Anda
                                                dan isi survei layanan untuk
                                                mendapatkan{' '}
                                                <strong className="font-bold text-[#0b4fb0]">
                                                    E-Sertifikat
                                                </strong>{' '}
                                                kelulusan resmi.
                                            </>
                                        ),
                                    },
                                ].map((step) => (
                                    <motion.div
                                        key={step.num}
                                        variants={staggerItem}
                                        whileHover={{ scale: 1.05 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 22,
                                        }}
                                        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-[#cddcef] hover:shadow-xl"
                                    >
                                        {/* Angka besar latar belakang (Inter Bold, biru muda transparan) */}
                                        <span className="pointer-events-none absolute -top-2 right-5 text-[88px] leading-none font-extrabold tracking-tighter text-[#0b4fb0]/10 transition-colors duration-300 select-none group-hover:text-[#0b4fb0]/15">
                                            {step.num}
                                        </span>

                                        {/* Ikon Langkah — fill biru brand + putih saat hover (motif seragam) */}
                                        <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-[#f5faff] text-[#0a1628]/40 transition-all duration-300 group-hover:-rotate-3 group-hover:border-transparent group-hover:bg-[#106feb] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#106feb]/30">
                                            <step.icon className="h-7 w-7" />
                                        </div>

                                        <h3 className="relative mb-3 text-[18px] font-bold text-[#0a1628]">
                                            {step.title}
                                        </h3>
                                        <p className="relative text-[15px] leading-relaxed text-[#0a1628]/60">
                                            {step.desc}
                                        </p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Tombol Unduh Panduan — center, sliding animation (overlay putih
                            menggeser menutupi background biru; badge ikon membalik kontras). */}
                        <Reveal className="mt-16 flex justify-center">
                            <a
                                href="#"
                                download
                                className="group relative inline-flex items-center justify-between gap-3 overflow-hidden rounded-full bg-[#106feb] py-2 pr-2 pl-7 shadow-lg shadow-[#106feb]/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-[#106feb]/35 focus-visible:ring-2 focus-visible:ring-[#0b4fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5faff] focus-visible:outline-none"
                            >
                                {/* LAPIS — overlay putih geser dari kanan → kiri */}
                                <span
                                    aria-hidden
                                    className="absolute inset-0 z-0 translate-x-full bg-white transition-transform duration-500 ease-out group-hover:translate-x-0"
                                />
                                <span className="relative z-10 text-[15px] font-semibold text-white transition-colors duration-500 ease-out group-hover:text-[#106feb]">
                                    Unduh Panduan Lengkap
                                </span>
                                {/* Lingkaran putih berisi ikon — membalik jadi biru saat overlay menutupi */}
                                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#106feb] transition-colors duration-500 ease-out group-hover:bg-[#106feb] group-hover:text-white">
                                    <Download className="size-[18px]" />
                                </span>
                            </a>
                        </Reveal>
                    </div>
                </section>

                {/* 5.5. FAQ SECTION (WEBILD STYLE) */}
                <section id="faq" className="bg-[#f5faff] px-6 py-24 md:py-32">
                    <div className="mx-auto max-w-[1200px]">
                        <Reveal className="mb-16 flex flex-col items-center gap-2 text-center">
                            <div className="mb-1 w-fit rounded-full border border-slate-100 bg-white px-3 py-1 text-[14px] text-[#0a1628]/70 shadow-sm">
                                <p>Bantuan & FAQ</p>
                            </div>
                            <h2 className="bg-gradient-to-r from-[#0a1628] to-[#0b4fb0] bg-clip-text text-[32px] font-extrabold tracking-tight text-transparent md:text-[42px]">
                                Pertanyaan Umum
                            </h2>
                        </Reveal>

                        <div className="mx-auto flex max-w-3xl flex-col gap-4">
                            {faqList.map((item, index) => (
                                <Reveal key={index} delay={index * 0.06}>
                                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(8,71,156,0.05)] transition-all duration-300 hover:border-[#cddcef] hover:shadow-[0_16px_40px_rgba(8,71,156,0.08)]">
                                        <button
                                            onClick={() =>
                                                setOpenFaq(
                                                    openFaq === index
                                                        ? null
                                                        : index,
                                                )
                                            }
                                            className="group flex w-full items-center justify-between gap-4 p-6 text-left transition-colors duration-300 hover:bg-[#f5faff]/70 focus-visible:ring-2 focus-visible:ring-[#0b4fb0] focus-visible:outline-none focus-visible:ring-inset"
                                        >
                                            <span
                                                className={`text-[16px] font-bold transition-colors duration-300 ${openFaq === index ? 'text-[#106feb]' : 'text-[#0a1628] group-hover:text-[#0b4fb0]'}`}
                                            >
                                                {item.q}
                                            </span>
                                            <span
                                                className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${openFaq === index ? 'rotate-180 bg-[#106feb] text-white shadow-md shadow-[#106feb]/30' : 'bg-[#106feb]/10 text-[#106feb] group-hover:bg-[#106feb]/20'}`}
                                            >
                                                <ChevronDown className="h-5 w-5" />
                                            </span>
                                        </button>
                                        {/* Micro-interaction: AnimatePresence untuk transisi halus accordion */}
                                        <AnimatePresence initial={false}>
                                            {openFaq === index && (
                                                <motion.div
                                                    initial={{
                                                        height: 0,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        height: 'auto',
                                                        opacity: 1,
                                                    }}
                                                    exit={{
                                                        height: 0,
                                                        opacity: 0,
                                                    }}
                                                    transition={{
                                                        duration: 0.3,
                                                        ease: 'easeInOut',
                                                    }}
                                                    className="overflow-hidden border-t border-[#f5faff]"
                                                >
                                                    <p className="p-6 pt-4 text-[15px] leading-relaxed text-[#0a1628]/60">
                                                        {item.a}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 5.75. TESTIMONIAL — dari survei kepuasan peserta yang telah selesai */}
                {testimonials.length > 0 && (
                    <section
                        id="testimonial"
                        className="border-t border-slate-100 bg-white px-6 py-24 md:py-32"
                    >
                        <div className="mx-auto max-w-[1200px]">
                            <Reveal className="mb-16 flex flex-col items-center gap-2 text-center">
                                <div className="mb-1 w-fit rounded-full border border-slate-100 bg-[#f5faff] px-3 py-1 text-[14px] text-[#0a1628]/70 shadow-sm">
                                    <p>Testimoni Peserta</p>
                                </div>
                                <h2 className="bg-gradient-to-r from-[#0a1628] to-[#0b4fb0] bg-clip-text text-[32px] font-extrabold tracking-tight text-transparent md:text-[42px]">
                                    Kata Mereka yang Telah Magang
                                </h2>
                                <p className="max-w-xl text-[15px] text-[#0a1628]/60">
                                    Umpan balik jujur dari peserta setelah
                                    menyelesaikan magang di lingkungan
                                    Pemerintah Kota Madiun.
                                </p>
                            </Reveal>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {testimonials.map((t, index) => (
                                    <Reveal key={t.id} delay={index * 0.06}>
                                        <figure className="group flex h-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgba(8,71,156,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#cddcef] hover:shadow-[0_20px_50px_-12px_rgba(20,99,208,0.18)]">
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className="flex gap-0.5"
                                                    aria-label={`Rating ${t.rating} dari 5`}
                                                >
                                                    {Array.from({
                                                        length: 5,
                                                    }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <Quote className="h-6 w-6 text-[#cddcef] transition-colors duration-300 group-hover:text-[#106feb]/40" />
                                            </div>
                                            <blockquote className="flex-1 text-[15px] leading-relaxed text-[#0a1628]/70">
                                                “{t.comment}”
                                            </blockquote>
                                            <figcaption className="flex items-center gap-3 border-t border-slate-100 pt-2">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#106feb]/10 text-sm font-bold text-[#106feb] transition-colors duration-300 group-hover:bg-[#106feb] group-hover:text-white">
                                                    {t.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-[#0a1628]">
                                                        {t.name}
                                                    </p>
                                                    {t.institution && (
                                                        <p className="truncate text-xs text-[#0a1628]/50">
                                                            {t.institution}
                                                        </p>
                                                    )}
                                                </div>
                                            </figcaption>
                                        </figure>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 6. KONTAK & FORM PENDAFTARAN */}
                <section
                    id="daftar"
                    className="border-t border-slate-100 bg-[#f5faff] px-6 py-24 md:py-32"
                >
                    {/* Header terpusat */}
                    <Reveal className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3 text-center md:mb-12">
                        <div className="w-fit rounded-full border border-slate-100 bg-white px-3 py-1 text-[14px] text-[#0a1628]/70 shadow-sm">
                            <p>Mulai Sekarang</p>
                        </div>
                        <h2 className="bg-gradient-to-r from-[#0a1628] to-[#0b4fb0] bg-clip-text text-[32px] leading-[1.15] font-extrabold tracking-tight text-balance text-transparent md:text-[42px]">
                            Siap Mendaftar?
                        </h2>
                        <p className="text-[16px] leading-relaxed text-balance text-[#0a1628]/60 md:text-[18px]">
                            Lengkapi formulir di bawah ini. Sistem terintegrasi
                            kami akan membuatkan akun dan mengirimkan berkas
                            Anda ke meja verifikasi.
                        </p>
                    </Reveal>

                    {/* Kartu Formulir — satu-satunya kartu, terpusat */}
                    <Reveal delay={0.1} className="mx-auto max-w-3xl">
                        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_24px_rgba(8,71,156,0.06)] md:p-10 md:shadow-[0_20px_60px_rgba(8,71,156,0.08)]">
                            {/* Efek Cahaya Halus di Pojok Kanan Form */}
                            <div className="pointer-events-none absolute -top-24 -right-24 h-[300px] w-[300px] rounded-full bg-[#cddcef]/20 blur-[80px]"></div>

                            <form
                                onSubmit={handleSubmitPengajuan}
                                className="relative z-10 flex flex-col gap-6"
                            >
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {/* Input: NIS / NIM */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            NIS / NIM
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={15}
                                            value={data.nis}
                                            onChange={(e) =>
                                                // Alfanumerik (huruf+angka), maks 15 karakter.
                                                setData(
                                                    'nis',
                                                    e.target.value
                                                        .replace(
                                                            /[^a-zA-Z0-9]/g,
                                                            '',
                                                        )
                                                        .slice(0, 15),
                                                )
                                            }
                                            placeholder="Nomor Induk Siswa/Mahasiswa"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                        />
                                    </div>
                                    {/* Input: Nama Lengkap */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            Nama Lengkap
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            placeholder="Nama lengkap sesuai KTP/Kartu Pelajar"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    {/* Input: Instansi Asal */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            Asal Sekolah / Kampus
                                        </label>
                                        <input
                                            type="text"
                                            value={data.institution_name}
                                            onChange={(e) =>
                                                setData(
                                                    'institution_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: Universitas Brawijaya"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                        />
                                    </div>
                                    {/* Input: Tujuan Bidang */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            Tujuan Bidang OPD
                                        </label>
                                        <select
                                            value={data.tujuan_magang}
                                            onChange={(e) =>
                                                setData(
                                                    'tujuan_magang',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                        >
                                            <option value="">
                                                -- Pilih Instansi / Bidang --
                                            </option>
                                            {/* OPD dari DB bila tersedia; fallback daftar statis. */}
                                            {(opds.length > 0
                                                ? opds.map((o) => o.name)
                                                : daftarOPD.map((o) => o.name)
                                            ).map((name, idx) => (
                                                <option key={idx} value={name}>
                                                    {name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Input: Jurusan (opsional) */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[14px] font-semibold text-[#0a1628]">
                                        Jurusan{' '}
                                        <span className="font-normal text-[#0a1628]/40">
                                            (opsional)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.major}
                                        onChange={(e) =>
                                            setData('major', e.target.value)
                                        }
                                        placeholder="Contoh: Teknik Informatika / Multimedia"
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                    />
                                </div>

                                {/* Input: Keahlian / Keterampilan */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[14px] font-semibold text-[#0a1628]">
                                        Keahlian / Keterampilan
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={data.skills}
                                        onChange={(e) =>
                                            setData('skills', e.target.value)
                                        }
                                        placeholder="Sebutkan keahlian atau keterampilan yang dikuasai, mis. desain grafis, pemrograman web, analisis data…"
                                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                    />
                                    <p className="text-[12px] text-[#0a1628]/45">
                                        Membantu admin menempatkanmu di bidang
                                        yang sesuai.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[14px] font-semibold text-[#0a1628]">
                                        Alamat Lengkap
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={data.address}
                                        onChange={(e) =>
                                            setData('address', e.target.value)
                                        }
                                        placeholder="Alamat domisili lengkap beserta RT/RW, kelurahan, dan kecamatan"
                                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                    />
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            Tanggal Mulai
                                        </label>
                                        <DatePicker
                                            value={tanggalMulai}
                                            min={toISODate(new Date())}
                                            placeholder="Pilih tanggal mulai"
                                            onChange={(iso) => {
                                                setTanggalMulai(iso);
                                                setData('start_date', iso);

                                                // Reset tanggal selesai bila jadi lebih awal dari tanggal mulai baru.
                                                if (
                                                    tanggalSelesai &&
                                                    tanggalSelesai < iso
                                                ) {
                                                    setTanggalSelesai('');
                                                    setData('end_date', '');
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            Tanggal Selesai
                                        </label>
                                        <DatePicker
                                            value={tanggalSelesai}
                                            min={
                                                tanggalMulai ||
                                                toISODate(new Date())
                                            }
                                            placeholder="Pilih tanggal selesai"
                                            onChange={(iso) => {
                                                setTanggalSelesai(iso);
                                                setData('end_date', iso);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            Nama Dosen / Guru Pembimbing
                                        </label>
                                        <input
                                            type="text"
                                            value={data.campus_supervisor}
                                            onChange={(e) =>
                                                setData(
                                                    'campus_supervisor',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Nama lengkap pembimbing berserta gelar"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            No. WA Dosen/Guru Pembimbing
                                        </label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={
                                                data.campus_supervisor_whatsapp
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'campus_supervisor_whatsapp',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: 081234567890"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            Nomor WhatsApp Anda
                                        </label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={data.whatsapp_number}
                                            onChange={(e) =>
                                                setData(
                                                    'whatsapp_number',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: 081234567890"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#0a1628]">
                                            Email Aktif Anda
                                        </label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                            placeholder="Gunakan email utama Anda"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] transition-all placeholder:text-[#0a1628]/40 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Input: Pas Foto — dropzone dengan pratinjau thumbnail */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[14px] font-semibold text-[#0a1628]">
                                        Pas Foto
                                    </label>
                                    <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-[#f5faff] px-4 py-4 transition-colors hover:border-[#0b4fb0] hover:bg-[#e7f0fc]">
                                        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                            {pasFotoPreview ? (
                                                <img
                                                    src={pasFotoPreview}
                                                    alt="Pratinjau pas foto"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <ImagePlus className="h-6 w-6 text-[#0b4fb0] transition-transform duration-300 group-hover:scale-110" />
                                            )}
                                        </span>
                                        <span className="flex flex-col">
                                            <span className="text-[14px] font-medium text-[#0a1628]">
                                                {pasFotoNama ||
                                                    'Unggah Pas Foto Anda'}
                                            </span>
                                            <span className="text-[12px] text-[#0a1628]/50">
                                                Format JPG/PNG, latar polos,
                                                maks. 2MB.
                                            </span>
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg"
                                            onChange={handlePasFoto}
                                            className="hidden"
                                        />
                                    </label>
                                    {errors.photo && (
                                        <p className="text-[13px] text-rose-600">
                                            {errors.photo}
                                        </p>
                                    )}
                                </div>

                                {/* --- Berkas pendukung opsional ("jika ada") --- */}
                                <div className="mt-6 flex flex-col gap-3">
                                    <label className="text-[14px] font-semibold text-[#0a1628]">
                                        Berkas Pendukung{' '}
                                        <span className="font-normal text-[#0a1628]/50">
                                            (opsional)
                                        </span>
                                    </label>

                                    {[
                                        {
                                            field: 'surat_pengantar' as const,
                                            label: 'Surat Pengantar',
                                            nama: suratPengantarNama,
                                            setNama: setSuratPengantarNama,
                                            accept: '.pdf,.doc,.docx',
                                            hint: 'PDF/Word, maks. 2MB',
                                        },
                                        {
                                            field: 'cv' as const,
                                            label: 'CV',
                                            nama: cvNama,
                                            setNama: setCvNama,
                                            accept: '.pdf,.doc,.docx',
                                            hint: 'PDF/Word, maks. 2MB',
                                        },
                                        {
                                            field: 'portfolio' as const,
                                            label: 'Portofolio',
                                            nama: portfolioNama,
                                            setNama: setPortfolioNama,
                                            accept: '.pdf,.doc,.docx,.zip,.png,.jpg,.jpeg',
                                            hint: 'PDF/Word/ZIP/gambar, maks. 10MB',
                                        },
                                    ].map((berkas) => (
                                        <div
                                            key={berkas.field}
                                            className="flex flex-col gap-1.5"
                                        >
                                            <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-[#f5faff] px-4 py-3.5 transition-colors hover:border-[#0b4fb0] hover:bg-[#e7f0fc]">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                                                    <FileText className="h-5 w-5 text-[#0b4fb0] transition-transform duration-300 group-hover:scale-110" />
                                                </span>
                                                <span className="flex min-w-0 flex-col">
                                                    <span className="text-[14px] font-medium text-[#0a1628]">
                                                        {berkas.label}
                                                    </span>
                                                    <span className="truncate text-[12px] text-[#0a1628]/50">
                                                        {berkas.nama ||
                                                            berkas.hint}
                                                    </span>
                                                </span>
                                                <input
                                                    type="file"
                                                    accept={berkas.accept}
                                                    onChange={handleBerkas(
                                                        berkas.field,
                                                        berkas.setNama,
                                                    )}
                                                    className="hidden"
                                                />
                                            </label>
                                            {errors[berkas.field] && (
                                                <p className="text-[13px] text-rose-600">
                                                    {errors[berkas.field]}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* --- reCAPTCHA v3 (invisible) — gerbang anti-bot Fase 1.
                                        Skor dihitung otomatis saat tombol kirim ditekan
                                        (grecaptcha.execute), tanpa checkbox. --- */}
                                <div className="mt-6 border-t border-[#e5e7eb] pt-8">
                                    {recaptchaSiteKey ? (
                                        <p className="text-[13px] leading-relaxed text-[#0a1628]/60">
                                            Formulir ini dilindungi reCAPTCHA
                                            v3. Verifikasi berjalan otomatis
                                            saat Anda menekan tombol kirim —
                                            tidak perlu mencentang apa pun.
                                        </p>
                                    ) : (
                                        <p className="text-[13px] text-amber-600">
                                            Kunci reCAPTCHA belum dikonfigurasi.
                                            Hubungi administrator.
                                        </p>
                                    )}

                                    {errors.recaptcha_token && (
                                        <p className="mt-2 text-[13px] text-rose-600">
                                            {errors.recaptcha_token}
                                        </p>
                                    )}
                                </div>

                                {/* Ringkasan galat validasi lain (mis. email/durasi/tanggal). */}
                                {Object.keys(errors).filter(
                                    (k) => k !== 'recaptcha_token',
                                ).length > 0 && (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                                        <p className="text-[13px] font-semibold text-rose-700">
                                            Periksa kembali isian berikut:
                                        </p>
                                        <ul className="mt-1 list-disc pl-5 text-[13px] text-rose-600">
                                            {Object.entries(errors)
                                                .filter(
                                                    ([k]) =>
                                                        k !== 'recaptcha_token',
                                                )
                                                .map(([k, msg]) => (
                                                    <li key={k}>{msg}</li>
                                                ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Informasi Penting — nomor WhatsApp aktif untuk akun & OTP */}
                                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#f5faff] px-4 py-3.5">
                                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0b4fb0]" />
                                    <p className="text-[13px] leading-relaxed text-[#0a1628]/60">
                                        Pastikan alamat E-Mail yang Anda
                                        masukkan adalah E-Mail aktif, karena
                                        akun dasbor dan link OTP akan dikirimkan
                                        ke alamat tersebut.
                                    </p>
                                </div>

                                {/* Tombol Submit — Sliding Animation (overlay #cddcef geser
                                        dari kiri menutupi background biru #106feb).
                                        v3: token diambil otomatis saat submit, tombol
                                        selalu aktif kecuali sedang mengirim. */}
                                <motion.button
                                    type="submit"
                                    disabled={processing}
                                    whileTap={
                                        !processing
                                            ? { scale: 0.98 }
                                            : undefined
                                    }
                                    className={`group relative mt-2 flex w-full items-center justify-between gap-3 overflow-hidden rounded-full py-1.5 pr-1.5 pl-7 transition-shadow duration-300 ${
                                        !processing
                                            ? 'cursor-pointer bg-[#106feb] shadow-lg shadow-[#106feb]/30 hover:shadow-xl hover:shadow-[#106feb]/40'
                                            : 'cursor-not-allowed bg-[#e5e7eb]'
                                    }`}
                                >
                                    {/* Overlay #cddcef geser dari kiri */}
                                    {!processing && (
                                        <span
                                            aria-hidden
                                            className="absolute inset-0 z-0 -translate-x-[101%] bg-[#cddcef] transition-transform duration-500 ease-out group-hover:translate-x-0"
                                        />
                                    )}
                                    <span
                                        className={`relative z-10 text-[16px] font-semibold transition-colors duration-500 ease-out ${!processing ? 'text-white group-hover:text-[#0a1628]' : 'text-[#0a1628]/40'}`}
                                    >
                                        {processing
                                            ? 'Mengirim…'
                                            : 'Kirim Berkas Pengajuan Magang'}
                                    </span>
                                    {/* Lingkaran ikon — membalik kontras saat overlay menutupi */}
                                    <span
                                        className={`relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ease-out ${!processing ? 'bg-[#cddcef] text-[#106feb] group-hover:bg-[#106feb] group-hover:text-white' : 'bg-white/60 text-[#0a1628]/30'}`}
                                    >
                                        <Send className="size-5 transition-transform duration-500 ease-out group-hover:translate-x-0.5" />
                                    </span>
                                </motion.button>
                            </form>
                        </div>
                    </Reveal>

                    {/* Info Kontak — strip ringan terpusat di bawah formulir */}
                    <Reveal className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
                        <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#cddcef] hover:shadow-md">
                            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#106feb]" />
                            <div className="min-w-0">
                                <h4 className="mb-1 text-[14px] font-bold text-[#0a1628]">
                                    Alamat Kantor
                                </h4>
                                <p className="text-[13px] leading-relaxed text-[#0a1628]/60">
                                    Jl. Perintis Kemerdekaan No.32, Kota Madiun,
                                    Jawa Timur 63117
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#cddcef] hover:shadow-md">
                            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#106feb]" />
                            <div className="min-w-0">
                                <h4 className="mb-1 text-[14px] font-bold text-[#0a1628]">
                                    Email Layanan
                                </h4>
                                <p className="text-[13px] break-words text-[#0a1628]/60">
                                    kominfo@madiunkota.go.id
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#cddcef] hover:shadow-md">
                            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#106feb]" />
                            <div className="min-w-0">
                                <h4 className="mb-1 text-[14px] font-bold text-[#0a1628]">
                                    Telepon
                                </h4>
                                <p className="text-[13px] text-[#0a1628]/60">
                                    (0351) 467327
                                </p>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* 7. FOOTER */}
                <footer className="relative overflow-hidden bg-[#020c1b] px-6 pt-20 pb-10 text-white">
                    {/* Aksen garis gradien di tepi atas */}
                    <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#106feb]/60 to-transparent"
                    />
                    {/* Glow lembut */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[640px] max-w-[90vw] -translate-x-1/2 rounded-full bg-[#0b4fb0]/15 blur-[140px]"
                    />
                    {/* Watermark ikon besar */}
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
                                    {navLinks.map((link) => {
                                        const NavEl = link.href.startsWith('/')
                                            ? Link
                                            : 'a';

                                        return (
                                            <li key={link.href}>
                                                <NavEl
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
                                                </NavEl>
                                            </li>
                                        );
                                    })}
                                    {/* Lacak Tiket — rute /lacak (bukan anchor seksi) */}
                                    <li>
                                        <Link
                                            href="/lacak"
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

                        {/* Garis pemisah + bottom bar */}
                        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
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
