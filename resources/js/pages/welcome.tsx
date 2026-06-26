import { Head, Link } from '@inertiajs/react';
import {
    ChevronRight, Layout, Shield, Clock, Building2,
    MapPin, Mail, Phone, CheckCircle2, ArrowRight, ArrowUpRight, Send, Search, ChevronDown,
    Menu, X, ShieldCheck, Sparkles, Award, Timer,
    FileText, SearchCheck, Key, Download, Info,
    Calendar, ChevronLeft, ImagePlus
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, animate } from 'motion/react';

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
    //           teks        │ putih                 │ gelap  #12213e
    //           badge       │ #cddcef + panah biru  │ biru   + panah putih
    //  inverted background │ #cddcef               │ overlay biru #106feb
    //           teks        │ gelap  #12213e        │ putih
    //           badge       │ biru   + panah putih  │ #cddcef + panah biru
    const baseBg = isInverted ? 'bg-[#cddcef]' : 'bg-[#106feb]';
    const baseText = isInverted ? 'text-[#12213e]' : 'text-white';
    const hoverText = isInverted ? 'group-hover:text-white' : 'group-hover:text-[#12213e]';
    const fill = isInverted ? 'bg-[#106feb]' : 'bg-[#cddcef]';
    // Badge berganti warna agar selalu kontras dengan lapisan di bawahnya saat itu.
    const badgeBg = isInverted ? 'bg-[#106feb] group-hover:bg-[#cddcef]' : 'bg-[#cddcef] group-hover:bg-[#106feb]';
    const arrowColor = isInverted ? 'text-white group-hover:text-[#106feb]' : 'text-[#106feb] group-hover:text-white';

    const content = (
        <>
            {/* LAPIS 2 — Overlay geser: menutupi background dari kiri → kanan saat hover.
                Durasi & easing identik dengan transisi teks/badge agar sinkron. */}
            <span
                aria-hidden
                className={`absolute inset-0 z-0 ${fill} -translate-x-[101%] transition-transform duration-500 ease-out group-hover:translate-x-0`}
            />
            {/* LAPIS 3 — Label: warna teks berubah dinamis saat overlay menutupi */}
            <span className={`relative z-10 font-semibold transition-colors duration-500 ease-out ${baseText} ${hoverText}`}>
                {children}
            </span>
            {/* LAPIS 3 — Badge ikon panah (lingkaran sempurna) di kanan, kontras dinamis */}
            <span className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ease-out ${badgeBg} ${arrowColor}`}>
                <ArrowUpRight className="size-4 transition-transform duration-500 ease-out group-hover:rotate-45" />
            </span>
        </>
    );

    const shared = `group relative inline-flex items-center justify-between gap-3 overflow-hidden rounded-full py-1 pl-6 pr-1 text-sm ${baseBg} shadow-lg shadow-[#106feb]/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-[#106feb]/35 ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`;

    if (as === 'link' && href) {
        return (
            <Link href={href} onClick={onClick} className={shared}>
                {content}
            </Link>
        );
    }

    if (as === 'a') {
        return (
            <motion.a href={href} onClick={onClick} whileTap={{ scale: 0.97 }} className={shared}>
                {content}
            </motion.a>
        );
    }

    return (
        <motion.button type={type} disabled={disabled} onClick={onClick} whileTap={disabled ? undefined : { scale: 0.97 }} className={shared}>
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
            className="absolute left-1/2 top-1/2 h-0 w-0"
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
                    style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
                >
                    {/* Lapis float: melayang lembut dalam frame tegak */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}
                        className="h-full w-full overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_12px_30px_-8px_rgba(8,71,156,0.35)] backdrop-blur-sm"
                    >
                        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
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
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
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
    const [viewDate, setViewDate] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));
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

    const goMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));

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
                className={`flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3.5 text-left text-[15px] transition-all focus:outline-none focus:ring-2 focus:ring-[#1463d0] ${open ? 'border-transparent ring-2 ring-[#1463d0]' : 'border-slate-200'} ${value ? 'text-[#001122]' : 'text-[#001122]/40'}`}
            >
                <span>{value ? formatTanggalID(value) : placeholder}</span>
                <Calendar className={`h-[18px] w-[18px] shrink-0 transition-colors ${open ? 'text-[#1463d0]' : 'text-[#001122]/40'}`} />
            </button>

            {/* Popover kalender */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute left-0 top-[calc(100%+8px)] z-30 w-[300px] rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_20px_50px_-12px_rgba(8,71,156,0.25)]"
                    >
                        {/* Navigasi bulan */}
                        <div className="mb-3 flex items-center justify-between">
                            <button type="button" onClick={() => goMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#001122]/60 transition-colors hover:bg-[#f5faff] hover:text-[#1463d0]">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-[14px] font-semibold text-[#001122]">{NAMA_BULAN[month]} {year}</span>
                            <button type="button" onClick={() => goMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#001122]/60 transition-colors hover:bg-[#f5faff] hover:text-[#1463d0]">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Nama hari */}
                        <div className="mb-1 grid grid-cols-7 gap-1">
                            {NAMA_HARI.map((h) => (
                                <span key={h} className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase text-[#001122]/35">{h}</span>
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
                                                    ? 'cursor-not-allowed text-[#001122]/20'
                                                    : isToday
                                                        ? 'bg-[#f5faff] text-[#1463d0] hover:bg-[#e7f0fc]'
                                                        : 'text-[#001122]/70 hover:bg-[#f5faff] hover:text-[#1463d0]'
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

export default function Welcome() {
    const [scrolled, setScrolled] = useState(false);
    // Loading screen — tampil saat halaman pertama dimuat, lalu menyingkap hero.
    const [isLoading, setIsLoading] = useState(true);
    // State tanggal magang — disimpan ISO (yyyy-mm-dd), ditampilkan format Indonesia.
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');

    // State unggah pas foto — simpan nama berkas + URL pratinjau (object URL).
    const [pasFotoNama, setPasFotoNama] = useState('');
    const [pasFotoPreview, setPasFotoPreview] = useState('');

    const handlePasFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setPasFotoNama(file.name);
        setPasFotoPreview((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev);
            }
            return URL.createObjectURL(file);
        });
    };
    // State FAQ
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    // State menu mobile (Dropdown Menu dengan AnimatePresence)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // --- TAMBAHKAN KODE INI (Logika Slider Captcha) ---
    const [sliderValue, setSliderValue] = useState(0);
    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        setSliderValue(value);
        if (value >= 95) { // Jika digeser sampai 95%, otomatis mengunci ke 100%
            setIsCaptchaVerified(true);
            setSliderValue(100);
        }
    };
    // --------------------------------------------------

    // State Fitur Pencarian OPD
    const [searchOpd, setSearchOpd] = useState("");

    // Daftar 35 OPD — tiap instansi dipetakan ke Tag Kompetensi sesuai bidangnya.
    // Tag membantu pelamar memilih penempatan yang relevan dengan jurusan/keahlian.
    const daftarOPD = [
        { name: "BADAN KEPEGAWAIAN DAERAH", tags: ["SDM / Kepegawaian", "Administrasi"] },
        { name: "BADAN KESATUAN BANGSA DAN POLITIK", tags: ["Politik & Pemerintahan", "Sosial"] },
        { name: "BADAN PENANGGULANGAN BENCANA DAERAH", tags: ["Manajemen Bencana", "Kesehatan"] },
        { name: "BADAN PENDAPATAN DAERAH", tags: ["Akuntansi", "Perpajakan"] },
        { name: "BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH", tags: ["Akuntansi", "Administrasi"] },
        { name: "BADAN PERENCANAAN DAN PEMBANGUNAN DAERAH", tags: ["Perencanaan", "Analisis Data"] },
        { name: "BAGIAN HUKUM", tags: ["Hukum", "Administrasi"] },
        { name: "BAGIAN ORGANISASI", tags: ["Manajemen", "Administrasi"] },
        { name: "BAGIAN PEMERINTAHAN UMUM", tags: ["Administrasi Publik", "Pemerintahan"] },
        { name: "BAGIAN PENGADAAN BARANG/JASA DAN ADMINISTRASI PEMBANGUNAN", tags: ["Pengadaan", "Administrasi"] },
        { name: "BAGIAN PEREKONOMIAN DAN KESEJAHTERAAN RAKYAT", tags: ["Ekonomi", "Sosial"] },
        { name: "BAGIAN UMUM", tags: ["Tata Usaha", "Administrasi"] },
        { name: "DINAS KEBUDAYAAN, PARIWISATA, KEPEMUDAAN DAN OLAHRAGA", tags: ["Pariwisata", "Seni & Budaya"] },
        { name: "DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL", tags: ["Administrasi Publik", "Manajemen Data"] },
        { name: "DINAS KESEHATAN DAN KELUARGA BERENCANA", tags: ["Kesehatan", "Administrasi Publik"] },
        { name: "DINAS KOMUNIKASI DAN INFORMATIKA", tags: ["IT / Software", "Humas & Jurnalistik"] },
        { name: "DINAS LINGKUNGAN HIDUP", tags: ["Lingkungan", "Sains"] },
        { name: "DINAS PEKERJAAN UMUM DAN TATA RUANG", tags: ["Teknik Sipil", "Arsitektur"] },
        { name: "DINAS PENANAMAN MODAL, PELAYANAN TERPADU SATU PINTU, KOPERASI DAN USAHA MIKRO", tags: ["Ekonomi", "Pelayanan Publik"] },
        { name: "DINAS PENDIDIKAN", tags: ["Pendidikan", "Administrasi"] },
        { name: "DINAS PERDAGANGAN", tags: ["Ekonomi", "Bisnis"] },
        { name: "DINAS PERHUBUNGAN", tags: ["Transportasi", "Teknik"] },
        { name: "DINAS PERPUSTAKAAN DAN KEARSIPAN", tags: ["Kearsipan", "Literasi"] },
        { name: "DINAS PERTANIAN DAN KETAHANAN PANGAN", tags: ["Pertanian", "Sains"] },
        { name: "DINAS PERUMAHAN DAN KAWASAN PERMUKIMAN", tags: ["Teknik Sipil", "Tata Ruang"] },
        { name: "DINAS SOSIAL, PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK", tags: ["Sosial", "Pemberdayaan"] },
        { name: "DINAS TENAGA KERJA", tags: ["SDM / Kepegawaian", "Sosial"] },
        { name: "INSPEKTORAT", tags: ["Audit", "Akuntansi"] },
        { name: "KECAMATAN KARTOHARJO", tags: ["Pemerintahan", "Pelayanan Publik"] },
        { name: "KECAMATAN MANGUHARJO", tags: ["Pemerintahan", "Pelayanan Publik"] },
        { name: "KECAMATAN TAMAN", tags: ["Pemerintahan", "Pelayanan Publik"] },
        { name: "RUMAH SAKIT UMUM DAERAH", tags: ["Kesehatan", "Administrasi"] },
        { name: "SATUAN POLISI PAMONG PRAJA", tags: ["Keamanan", "Hukum"] },
        { name: "SEKRETARIAT DAERAH", tags: ["Pemerintahan", "Administrasi"] },
        { name: "SEKRETARIAT DPRD", tags: ["Legislatif", "Administrasi"] },
    ];

    const filteredOPD = daftarOPD.filter(opd => opd.name.toLowerCase().includes(searchOpd.toLowerCase()));

    // Tautan navigasi (dipakai ulang oleh navbar desktop & menu mobile)
    const navLinks = [
        { href: "#fitur", label: "Fitur" },
        { href: "#instansi", label: "Instansi OPD" },
        { href: "#alur", label: "Alur Pendaftaran" },
        { href: "#faq", label: "FAQ" },
        { href: "#daftar", label: "Kontak" },
    ];

    // Logo instansi untuk Infinite Logo Slider (abbreviasi dari daftar OPD resmi)
    const instansiLogos = [
        "Diskominfo", "Dinas Pendidikan", "Dinas Kesehatan", "BAPPEDA", "BKD",
        "Dinas Sosial", "Satpol PP", "RSUD", "Dinas Perhubungan", "Inspektorat",
        "BPBD", "Dinas Lingkungan Hidup", "Disdukcapil", "Sekretariat Daerah",
    ];

    // Statistik dengan count-up (angka bersumber dari konten/fakta layanan)
    const statistik = [
        { value: 35, suffix: "", label: "Instansi OPD Tersedia", icon: Building2 },
        { value: 4, suffix: "", label: "Langkah Pendaftaran", icon: Sparkles },
        { value: 100, suffix: "%", label: "Gratis Tanpa Biaya", icon: Award },
        { value: 3, suffix: " Hari", label: "Estimasi Verifikasi", icon: Timer },
    ];

    // Efek untuk mengubah Navbar saat di-scroll
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Sembunyikan loading screen setelah animasi singkat & kunci scroll selama tampil.
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isLoading ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isLoading]);



    return (
        <>
            <Head title="E-Magang - Dinas Kominfo Kota Madiun">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* 0. LOADING SCREEN — menyingkap ke atas saat selesai (curtain reveal) */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="loading-screen"
                        initial={{ opacity: 1 }}
                        exit={{ y: '-100%' }}
                        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f5faff] px-6"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                        {/* Glow halus di belakang konten */}
                        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] max-w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1463d0]/15 blur-[120px]" />

                        {/* Mark ikon brand + ring berputar */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: 'circOut' }}
                            className="relative mb-8 flex items-center justify-center"
                        >
                            <motion.span
                                aria-hidden
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.1, ease: 'linear', repeat: Infinity }}
                                className="absolute h-[88px] w-[88px] rounded-full border-[3px] border-[#1463d0]/15 border-t-[#106feb] md:h-[104px] md:w-[104px]"
                            />
                            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#106feb] to-[#1463d0] shadow-[0_12px_30px_-6px_rgba(20,99,208,0.6)] md:h-20 md:w-20">
                                <Building2 className="h-8 w-8 text-white md:h-9 md:w-9" />
                            </span>
                        </motion.div>

                        {/* Wordmark */}
                        <motion.h2
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15, ease: 'circOut' }}
                            className="bg-gradient-to-r from-[#12213e] to-[#1463d0] bg-clip-text text-[28px] font-bold tracking-tight text-transparent md:text-[34px]"
                        >
                            E-Magang
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25, ease: 'circOut' }}
                            className="mt-1 text-center text-[13px] font-medium text-[#001122]/50 md:text-[14px]"
                        >
                            Portal Magang Pemerintah Kota Madiun
                        </motion.p>

                        {/* Progress bar — mengisi kiri → kanan */}
                        <div className="mt-8 h-[5px] w-[180px] overflow-hidden rounded-full bg-[#1463d0]/10 md:w-[220px]">
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '0%' }}
                                transition={{ duration: 1.7, delay: 0.3, ease: 'easeInOut' }}
                                className="h-full w-full rounded-full bg-gradient-to-r from-[#106feb] to-[#1463d0]"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Latar Belakang Utama Webild (Light Blue-ish White) */}
            <div
                className="min-h-screen bg-[#f5faff] text-[#001122] selection:bg-[#a8cce8] selection:text-[#001122] overflow-hidden relative"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >

                {/* Efek Cahaya Halus (Soft Glow) khas Webild SaaS di area atas */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-[#a8cce8]/30 to-transparent blur-3xl -z-10 pointer-events-none"></div>

                {/* 1. NAVIGATION BAR — Oval Floating (Glassmorphism) */}
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: 'circOut' }}
                    className="fixed z-[1000] top-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px]"
                >
                    <div className={`flex items-center justify-between p-2 xl:p-3 rounded-full backdrop-blur-md bg-white/70 border border-white/20 transition-shadow duration-300 ${scrolled ? 'shadow-[0_12px_40px_rgba(8,71,156,0.14)]' : 'shadow-lg shadow-[#106feb]/5'}`}>

                        {/* Logo (kiri) */}
                        <Link href="/" className="pl-4 text-xl tracking-tight bg-gradient-to-r from-[#12213e] to-[#1463d0] bg-clip-text text-transparent">
                            E-Magang
                        </Link>

                        {/* Aksi Kanan: CTA Sliding + Hamburger */}
                        <div className="flex items-center gap-2 xl:gap-3">
                            {/* Tombol CTA dengan animasi sliding overlay */}
                            <AnimatedButton as="a" href="#daftar">
                                Daftar
                            </AnimatedButton>

                            {/* Tombol Hamburger — background biru #106feb, ikon putih */}
                            <button
                                onClick={() => setMobileMenuOpen((v) => !v)}
                                className="relative flex items-center justify-center size-10 rounded-full bg-[#106feb] text-white cursor-pointer shadow-md shadow-[#106feb]/30 hover:brightness-110 transition-all"
                                aria-label="Buka menu navigasi"
                                aria-expanded={mobileMenuOpen}
                            >
                                <div className="flex flex-col gap-1">
                                    <span className={`w-4 h-0.5 rounded-full bg-white transition-all duration-300 ${mobileMenuOpen ? 'translate-y-[3px] rotate-45' : ''}`}></span>
                                    <span className={`w-4 h-0.5 rounded-full bg-white transition-all duration-300 ${mobileMenuOpen ? '-translate-y-[3px] -rotate-45' : ''}`}></span>
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
                                className="mt-3 rounded-3xl backdrop-blur-md bg-white/80 border border-white/30 shadow-[0_20px_50px_rgba(8,71,156,0.12)] overflow-hidden"
                            >
                                <div className="px-4 py-4 flex flex-col gap-1">
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="py-2.5 px-3 rounded-xl text-[15px] font-medium text-[#001122]/70 hover:text-[#106feb] hover:bg-[#106feb]/5 transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    <Link
                                        href="/login-otp"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="mt-1 py-2.5 px-3 rounded-xl text-left text-[15px] font-medium text-[#001122]/70 hover:text-[#106feb] hover:bg-[#106feb]/5 transition-colors"
                                    >
                                        Masuk Akun
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.nav>

                {/* 2. HERO SECTION */}
                <section className="relative pt-[140px] pb-20 px-6 max-w-[1200px] mx-auto flex flex-col items-center text-center overflow-visible">

                    {/* Glow Blobs premium di belakang teks & foto */}
                    <div aria-hidden className="pointer-events-none absolute -z-10 inset-0">
                        <div className="absolute top-10 left-1/4 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-[#1463d0]/25 blur-[120px]"></div>
                        <div className="absolute top-24 right-1/4 translate-x-1/2 w-[360px] h-[360px] rounded-full bg-[#8b5cf6]/20 blur-[120px]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[520px] h-[300px] rounded-full bg-[#a8cce8]/30 blur-[120px]"></div>
                    </div>

                    {/* Wadah relatif: jadi titik acuan orbit yang mengelilingi heading */}
                    <div className="relative flex w-full flex-col items-center">

                        {/* Lapisan ORBIT — aset asli webild mengorbit di sekitar H1.
                            Hanya tampil di layar lebar (lg+) agar tidak menutupi teks
                            pada perangkat sempit. Dipusatkan pada blok heading. */}
                        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[44%] -z-[5] hidden -translate-y-1/2 xl:block">
                            <div className="relative mx-auto h-0 w-0">
                                <OrbitImage src="/images/orbit/avatar-1.webp" alt="" radius={430} size={64} duration={26} startAngle={0} />
                                <OrbitImage src="/images/orbit/brand-2.webp" alt="" radius={470} size={56} duration={32} startAngle={70} reverse delay={0.2} />
                                <OrbitImage src="/images/orbit/avatar-3.webp" alt="" radius={400} size={60} duration={24} startAngle={150} delay={0.35} />
                                <OrbitImage src="/images/orbit/brand-4.webp" alt="" radius={500} size={52} duration={36} startAngle={210} reverse delay={0.15} />
                                <OrbitImage src="/images/orbit/avatar-2.webp" alt="" radius={360} size={58} duration={22} startAngle={285} delay={0.5} />
                                <OrbitImage src="/images/orbit/brand-1.webp" alt="" radius={520} size={54} duration={40} startAngle={330} reverse delay={0.3} />
                            </div>
                        </div>

                    {/* Konten teks Hero dengan staggerChildren (judul → sub → tombol) */}
                    <motion.div
                        variants={heroContainer}
                        initial="hidden"
                        animate="show"
                        className="relative z-10 flex flex-col items-center"
                    >
                        {/* Badge Pengumuman (Pill) */}
                        <motion.div
                            variants={heroItem}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-100 bg-white/60 backdrop-blur-md text-[13px] font-medium text-[#001122]/70 mb-8 hover:bg-white hover:border-[#a8cce8] transition-all shadow-sm"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-[#106feb] animate-pulse"></span>
                            Portal Resmi Diskominfo Kota Madiun
                            <ChevronRight className="w-3.5 h-3.5" />
                        </motion.div>

                        {/* Headline Utama — Inter Bold, gradien #12213e → #1463d0 */}
                        <motion.h1
                            variants={heroItem}
                            className="text-[42px] md:text-[68px] font-bold tracking-tight leading-[1.05] max-w-4xl mb-6 bg-gradient-to-r from-[#12213e] to-[#1463d0] bg-clip-text text-transparent"
                        >
                            Pusat Kendali Karir <br className="hidden md:block" />
                            <span className="relative mt-2 inline-block leading-[1.15]">
                                <span className="relative z-10 bg-gradient-to-r from-[#106feb] via-[#1463d0] to-[#3b82f6] bg-clip-text pb-[0.15em] text-transparent">
                                    Digital Anda
                                </span>
                            </span>
                        </motion.h1>

                        {/* Deskripsi Sub-headline */}
                        <motion.p
                            variants={heroItem}
                            className="text-[18px] md:text-[20px] text-[#001122]/60 max-w-2xl mb-10 leading-[1.6] font-medium"
                        >
                            Kelola pendaftaran, pantau status verifikasi, dan temukan bidang penempatan yang tepat di instansi pemerintahan dalam satu platform cerdas.
                        </motion.p>

                        {/* Grup Tombol Aksi */}
                        <motion.div
                            variants={heroItem}
                            className="flex flex-col sm:flex-row items-center gap-4"
                        >
                            <AnimatedButton as="a" href="#daftar" className="w-full sm:w-auto">
                                Mulai Pengajuan Magang
                            </AnimatedButton>
                            <AnimatedButton as="a" href="#alur" variant="inverted" className="w-full sm:w-auto">
                                Pelajari Alur
                            </AnimatedButton>
                        </motion.div>

                        {/* Baris penanda kepercayaan — memperkuat keyakinan calon pendaftar */}
                        <motion.div
                            variants={heroItem}
                            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] font-medium text-[#001122]/55"
                        >
                            <span className="inline-flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#106feb]" />
                                100% Gratis Tanpa Biaya
                            </span>
                            <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[#001122]/20 sm:inline-block" />
                            <span className="inline-flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-[#106feb]" />
                                Data Terlindungi
                            </span>
                            <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[#001122]/20 sm:inline-block" />
                            <span className="inline-flex items-center gap-2">
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
                        viewport={{ once: true, margin: '80px' }}
                        transition={{ duration: 0.9, ease: 'circOut' }}
                        className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mt-24 relative group"
                    >
                        {/* Soft Layered Shadow (efek kedalaman 3D) */}
                        <div className="absolute -inset-4 bg-[#1463d0]/20 blur-[80px] rounded-[40px] -z-10"></div>

                        <div className="relative rounded-3xl overflow-hidden border border-white/40 bg-white shadow-[0_20px_40px_-12px_rgba(8,71,156,0.25),0_40px_80px_-20px_rgba(20,99,208,0.3)] transition-transform duration-700 hover:-translate-y-2">
                            <img
                                src="/images/gedung-pemerintahan.png"
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
                                className="w-full aspect-[4/3] lg:aspect-[16/9] object-cover"
                            />
                            {/* Placeholder gradien (di-unhide oleh onError bila gambar gagal dimuat) */}
                            <div className="hidden w-full aspect-[4/3] lg:aspect-[16/9] bg-gradient-to-br from-[#12213e] via-[#1463d0] to-[#a8cce8] flex-col items-center justify-center">
                                <div className="flex flex-col items-center gap-3 text-white/90">
                                    <Building2 className="w-12 h-12" />
                                    <span className="text-[15px] font-medium">Gedung Pemerintah Kota Madiun</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* 3.5. INFINITE LOGO SLIDER (Instansi) */}
                <section className="py-16 border-y border-slate-100 bg-white/60 overflow-hidden">


                    {/* Track bergerak terus-menerus (infinite loop seamless) */}
                    <div className="relative">
                        {/* Fade tepi kiri & kanan */}
                        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#f5faff] to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#f5faff] to-transparent z-10 pointer-events-none"></div>

                        <motion.div
                            className="flex gap-4 w-max"
                            animate={{ x: ['0%', '-50%'] }}
                            transition={{ duration: 30, ease: 'linear', repeat: Infinity, repeatType: 'loop' }}
                        >
                            {[...instansiLogos, ...instansiLogos].map((logo, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 shrink-0 px-6 py-3 rounded-full border border-slate-100 bg-white shadow-[0_4px_20px_rgba(8,71,156,0.04)]"
                                >
                                    <div className="w-8 h-8 rounded-[8px] bg-[#f5faff] border border-[#a8cce8]/40 flex items-center justify-center">
                                        <Building2 className="w-4 h-4 text-[#2563eb]" />
                                    </div>
                                    <span className="text-[15px] font-medium text-[#001122]/70 whitespace-nowrap">{logo}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* 4. FITUR UNGGULAN (WEBILD BENTO GRID STYLE) */}
                <section id="fitur" className="py-24 md:py-32 px-6 max-w-[1200px] mx-auto">

                    {/* Section Header — judul gradien #12213e → #1463d0 */}
                    <Reveal className="flex flex-col items-center text-center gap-3 mb-12 md:mb-16">
                        <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-slate-100 bg-white w-fit text-[#001122]/70 shadow-sm">
                            <p>Kenapa E-Magang?</p>
                        </div>
                        <h2 className="text-[32px] md:text-[48px] font-bold tracking-tight leading-[1.15] max-w-2xl text-balance bg-gradient-to-r from-[#12213e] to-[#1463d0] bg-clip-text pb-[0.1em] text-transparent">
                            Kenapa E-Magang?
                        </h2>
                        <p className="text-[16px] md:text-[18px] text-[#001122]/60 max-w-2xl leading-relaxed text-balance mt-1">
                            Kami merancang platform ini untuk menghilangkan kerumitan birokrasi manual, mempercepat persetujuan, dan memberikan transparansi penuh.
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            {/* Kartu 1 — Validasi Real-time */}
                            <motion.div
                                variants={bentoItem}
                                whileHover={{ y: -12 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="group h-full flex flex-col gap-4 p-8 md:p-10 border border-slate-100 bg-white rounded-[2.5rem] shadow-sm transition-shadow duration-300 hover:shadow-2xl"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-[#1463d0]/8 border border-[#1463d0]/15 flex items-center justify-center mb-2 transition-colors duration-300 group-hover:bg-[#1463d0]/12">
                                    <Clock className="w-7 h-7 text-[#1463d0]" />
                                </div>
                                <h3 className="text-[22px] font-bold leading-snug text-[#001122]">
                                    Validasi Real-time
                                </h3>
                                <p className="text-[16px] leading-relaxed text-[#001122]/60">
                                    Pantau status pengajuan Anda secara langsung. Sistem akan memberi notifikasi begitu berkas Anda disetujui oleh verifikator dan OPD terkait.
                                </p>
                            </motion.div>

                            {/* Kartu 2 — Akses Dasbor Aman */}
                            <motion.div
                                variants={bentoItem}
                                whileHover={{ y: -12 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="group h-full flex flex-col gap-4 p-8 md:p-10 border border-slate-100 bg-white rounded-[2.5rem] shadow-sm transition-shadow duration-300 hover:shadow-2xl"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-[#1463d0]/8 border border-[#1463d0]/15 flex items-center justify-center mb-2 transition-colors duration-300 group-hover:bg-[#1463d0]/12">
                                    <Shield className="w-7 h-7 text-[#1463d0]" />
                                </div>
                                <h3 className="text-[22px] font-bold leading-snug text-[#001122]">
                                    Akses Dasbor Aman (Tanpa Sandi)
                                </h3>
                                <p className="text-[16px] leading-relaxed text-[#001122]/60">
                                    Lupakan rutinitas mereset kata sandi. Gunakan sistem OTP (One Time Password) via Email/WA untuk login yang instan dan terenkripsi.
                                </p>
                            </motion.div>
                        </div>

                        {/* Baris Bawah — kartu lebar full width (E-Sertifikat TTE) */}
                        <motion.div
                            variants={bentoItem}
                            whileHover={{ y: -12 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            className="group relative overflow-hidden flex flex-col md:flex-row md:items-center gap-8 md:gap-10 p-8 md:p-12 border border-slate-100 bg-white rounded-[2.5rem] shadow-sm transition-shadow duration-300 hover:shadow-2xl"
                        >
                            {/* Konten teks */}
                            <div className="flex flex-col gap-4 md:flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-[#1463d0]/8 border border-[#1463d0]/15 flex items-center justify-center mb-2 transition-colors duration-300 group-hover:bg-[#1463d0]/12">
                                    <Award className="w-7 h-7 text-[#1463d0]" />
                                </div>
                                <h3 className="text-[24px] md:text-[28px] font-bold leading-snug text-[#001122]">
                                    E-Sertifikat Resmi Ber-TTE
                                </h3>
                                <p className="text-[16px] md:text-[17px] leading-relaxed text-[#001122]/60 max-w-2xl">
                                    Begitu masa magang selesai dan laporan disetujui, e-Sertifikat resmi dengan Tanda Tangan Elektronik (TTE) dari Diskominfo akan diterbitkan langsung ke dasbor Anda, siap digunakan untuk portofolio karir.
                                </p>
                            </div>

                            {/* Visual — ilustrasi kartu sertifikat ber-TTE */}
                            <div className="relative shrink-0 md:w-[320px]">
                                {/* Blob biru lembut di belakang ilustrasi */}
                                <div aria-hidden className="absolute -inset-6 -z-10 rounded-[3rem] bg-[#1463d0]/10 blur-2xl" />
                                <div className="relative rounded-[1.75rem] border border-slate-100 bg-gradient-to-br from-[#f5faff] to-white p-6 shadow-lg transition-transform duration-500 group-hover:-rotate-2">
                                    {/* Header sertifikat */}
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-xl bg-[#1463d0] flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-[12px] font-semibold text-[#001122]/70 leading-tight">Diskominfo<br />Kota Madiun</span>
                                        </div>
                                        <ShieldCheck className="w-7 h-7 text-[#1463d0]" />
                                    </div>
                                    {/* Garis-garis konten sertifikat */}
                                    <div className="space-y-2.5 mb-6">
                                        <div className="h-2.5 w-3/4 rounded-full bg-[#1463d0]/15" />
                                        <div className="h-2.5 w-full rounded-full bg-slate-100" />
                                        <div className="h-2.5 w-5/6 rounded-full bg-slate-100" />
                                    </div>
                                    {/* Footer: badge TTE terverifikasi */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-[#1463d0]/15 bg-[#1463d0]/8 px-3 py-2">
                                        <CheckCircle2 className="w-5 h-5 text-[#1463d0] shrink-0" />
                                        <span className="text-[13px] font-semibold text-[#1463d0]">Tertanda Elektronik (TTE) — Terverifikasi</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    </motion.div>
                </section>

                {/* 4.5. DAFTAR INSTANSI / OPD SECTION (WEBILD STYLE) */}
                <section id="instansi" className="py-24 md:py-32 px-6 relative z-10 bg-white border-t border-slate-100">
                    <div className="max-w-[1200px] mx-auto">

                        {/* Section Header */}
                        <Reveal className="flex flex-col items-center text-center gap-2 mb-12">
                            <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-slate-100 bg-[#f5faff] w-fit text-[#001122]/70 shadow-sm">
                                <p>Direktori Instansi</p>
                            </div>
                            <h2 className="text-[32px] md:text-[42px] font-extrabold tracking-tight leading-[1.15] mb-4 bg-gradient-to-r from-[#001122] via-[#2563eb] to-[#a8cce8] bg-clip-text text-transparent">
                                Temukan Tempat Magangmu
                            </h2>
                            <p className="text-[16px] md:text-[18px] text-[#001122]/60 max-w-2xl mx-auto leading-relaxed">
                                Pilih dari 35 instansi Pemerintah Kota Madiun. Ketik nama dinas atau badan pada kolom pencarian di bawah.
                            </p>
                        </Reveal>

                        {/* Search Bar (Pill — modern, ikon kiri, ring fokus #1463d0) */}
                        <div className="flex justify-center mb-12">
                            <div className="relative w-full max-w-2xl group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#001122]/40 w-5 h-5 group-focus-within:text-[#1463d0] transition-colors pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchOpd}
                                    placeholder="Cari dinas, badan, atau bidang kompetensi..."
                                    className="w-full bg-white border border-slate-200 rounded-full py-4 pl-14 pr-6 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all shadow-sm"
                                    onChange={(e) => setSearchOpd(e.target.value)}
                                />
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
                                viewport={{ once: true, margin: '-40px' }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                            >
                                <AnimatePresence mode="popLayout">
                                    {filteredOPD.map((opd) => (
                                        <motion.div
                                            key={opd.name}
                                            layout
                                            variants={staggerItem}
                                            initial="hidden"
                                            animate="show"
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                            whileHover={{ y: -8 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                                            className="group relative flex flex-col h-full overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-500 hover:border-[#1463d0]/20 hover:shadow-[0_30px_70px_-20px_rgba(20,99,208,0.35)] cursor-default"
                                        >
                                            {/* Aura glow — muncul lembut saat hover */}
                                            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-[#1463d0]/25 to-[#a8cce8]/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                                            {/* Garis aksen atas — "menggambar" dari kiri saat hover */}
                                            <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[#106feb] via-[#1463d0] to-[#a8cce8] transition-transform duration-500 ease-out group-hover:scale-x-100" />

                                            {/* Watermark ikon instansi */}
                                            <Building2 aria-hidden className="pointer-events-none absolute -bottom-7 -right-5 h-32 w-32 text-[#1463d0]/[0.04] transition-all duration-500 group-hover:scale-110 group-hover:text-[#1463d0]/[0.07]" />

                                            {/* Header kartu: ikon + nama instansi */}
                                            <div className="relative flex items-start gap-4">
                                                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-gradient-to-br from-[#f5faff] to-[#e7f0fc] shadow-sm transition-all duration-500 group-hover:border-transparent group-hover:from-[#106feb] group-hover:to-[#1463d0] group-hover:shadow-[0_10px_24px_-8px_rgba(20,99,208,0.6)]">
                                                    <Building2 className="h-6 w-6 text-[#1463d0] transition-colors duration-500 group-hover:text-white" />
                                                </div>
                                                <h3 className="mt-1 text-[15px] font-semibold leading-[1.5] text-[#001122] transition-colors duration-300 group-hover:text-[#1463d0]">
                                                    {opd.name}
                                                </h3>
                                            </div>

                                            {/* Tag Kompetensi — badge biru muda, dipetakan per bidang */}
                                            <div className="relative mt-auto flex flex-wrap items-center gap-2 pt-6">
                                                {opd.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full border border-[#1463d0]/10 bg-[#f5faff] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#106feb] transition-colors duration-300 group-hover:border-[#1463d0]/20 group-hover:bg-[#e7f0fc]"
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
                                className="text-center py-12 bg-[#f5faff] border border-dashed border-slate-200 rounded-3xl"
                            >
                                <p className="text-[15px] text-[#001122]/60">Instansi "{searchOpd}" tidak ditemukan. Coba kata kunci lain.</p>
                            </motion.div>
                        )}

                    </div>
                </section>



                {/* 5. ALUR PENDAFTARAN (TIMELINE) */}
                <section id="alur" className="py-24 md:py-32 border-t border-slate-100 bg-white">
                    <div className="max-w-[1200px] mx-auto px-6">

                        {/* Section Header */}
                        <Reveal className="flex flex-col items-center text-center gap-2 mb-16">
                            <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-slate-100 bg-[#f5faff] w-fit text-[#001122]/70 shadow-sm">
                                <p>Cara Kerja</p>
                            </div>
                            <h2 className="text-[32px] md:text-[42px] font-extrabold tracking-tight leading-[1.15] max-w-2xl bg-gradient-to-r from-[#001122] via-[#2563eb] to-[#a8cce8] bg-clip-text text-transparent">
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
                                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
                                style={{ backgroundImage: 'repeating-linear-gradient(to right, #a8cce8 0 8px, transparent 8px 18px)' }}
                                className="hidden lg:block absolute top-[88px] left-[12%] right-[12%] h-[2px] origin-left pointer-events-none"
                            />

                            {/* Grid 4 Kolom untuk Alur (stagger kiri → kanan saat scroll) */}
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, margin: '-80px' }}
                                className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                            >

                                {[
                                    { num: "01", title: "Isi Formulir & Unggah Dokumen", icon: FileText, desc: <>Isi formulir pendaftaran dan unggah dokumen wajib seperti <strong className="font-semibold text-[#001122]">Surat Pengantar</strong> dari Sekolah/Kampus serta <strong className="font-semibold text-[#001122]">CV/Portofolio</strong> terbaru.</> },
                                    { num: "02", title: "Proses Verifikasi", icon: SearchCheck, desc: <>Berkas Anda akan diverifikasi secara teliti oleh tim internal dalam waktu <strong className="font-semibold text-[#001122]">maksimal 3x24 jam kerja</strong>.</> },
                                    { num: "03", title: "Login OTP Dasbor", icon: Key, desc: <>Akses dasbor personal Anda menggunakan <strong className="font-bold text-[#1463d0]">OTP</strong> via Email/WA tanpa kata sandi untuk mengunduh surat persetujuan.</> },
                                    { num: "04", title: "E-Sertifikat & Evaluasi", icon: Award, desc: <>Unggah laporan tugas akhir Anda dan isi survei layanan untuk mendapatkan <strong className="font-bold text-[#1463d0]">E-Sertifikat</strong> kelulusan resmi.</> },
                                ].map((step) => (
                                    <motion.div
                                        key={step.num}
                                        variants={staggerItem}
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                        className="group relative flex flex-col h-full bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm overflow-hidden"
                                    >
                                        {/* Angka besar latar belakang (Inter Bold, biru muda transparan) */}
                                        <span className="absolute -top-2 right-5 text-[88px] font-extrabold leading-none tracking-tighter text-[#1463d0]/10 select-none pointer-events-none">
                                            {step.num}
                                        </span>

                                        {/* Ikon Langkah — abu-abu, berubah biru cerah saat hover */}
                                        <div className="relative w-14 h-14 rounded-2xl bg-[#f5faff] border border-slate-100 flex items-center justify-center mb-6 text-[#001122]/40 group-hover:text-[#1463d0] group-hover:border-[#1463d0]/20 transition-colors duration-300">
                                            <step.icon className="w-7 h-7" />
                                        </div>

                                        <h3 className="relative text-[18px] font-bold text-[#001122] mb-3">{step.title}</h3>
                                        <p className="relative text-[15px] text-[#001122]/60 leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </motion.div>
                                ))}

                            </motion.div>
                        </div>

                        {/* Tombol Unduh Panduan — center, sliding animation (overlay putih
                            menggeser menutupi background biru; badge ikon membalik kontras). */}
                        <Reveal className="flex justify-center mt-16">
                            <a
                                href="#"
                                download
                                className="group relative inline-flex items-center justify-between gap-3 overflow-hidden rounded-full bg-[#106feb] py-2 pl-7 pr-2 shadow-lg shadow-[#106feb]/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-[#106feb]/35"
                            >
                                {/* LAPIS — overlay putih geser dari kanan → kiri */}
                                <span
                                    aria-hidden
                                    className="absolute inset-0 z-0 bg-white translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0"
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
                <section id="faq" className="py-24 md:py-32 px-6 bg-[#f5faff]">
                    <div className="max-w-[1200px] mx-auto">
                        <Reveal className="flex flex-col items-center text-center gap-2 mb-16">
                            <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-slate-100 bg-white w-fit text-[#001122]/70 shadow-sm">
                                <p>Bantuan & FAQ</p>
                            </div>
                            <h2 className="text-[32px] md:text-[42px] font-extrabold tracking-tight bg-gradient-to-r from-[#12213e] to-[#1463d0] bg-clip-text text-transparent">
                                Pertanyaan Umum
                            </h2>
                        </Reveal>

                        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                            {[
                                { q: "Apa itu E-Magang Kota Madiun?", a: "Platform digital resmi untuk mempermudah pendaftaran, verifikasi, dan pemantauan status magang siswa/mahasiswa di lingkungan instansi Pemerintah Kota Madiun." },
                                { q: "Apakah pendaftaran dikenakan biaya?", a: "Tidak. Seluruh layanan di E-Magang Kota Madiun adalah gratis bagi seluruh pelajar dan mahasiswa." },
                                { q: "Berapa lama proses verifikasi berkas?", a: "Biasanya memakan waktu 2-3 hari kerja. Anda akan mendapatkan notifikasi status melalui email atau WhatsApp yang terdaftar." },
                                { q: "Berapa lama durasi magang yang diperbolehkan?", a: "Durasi magang fleksibel mulai dari 1 hingga 6 bulan, menyesuaikan dengan kurikulum atau kebutuhan dari instansi pendidikan Anda." },
                                { q: "Apakah magang ini bisa dilakukan secara remote/WFH?", a: "Seluruh pelaksanaan magang mengikuti kebijakan operasional masing-masing OPD tujuan, namun mayoritas dilaksanakan secara WFO (On-Site) dengan jam kerja kantor pemerintah." },
                                { q: "Bagaimana cara mendapatkan e-Sertifikat?", a: "Setelah selesai melaksanakan magang, pastikan Anda telah mengunggah laporan tugas akhir dan mengisi survei evaluasi di dasbor akun Anda." }
                            ].map((item, index) => (
                                <Reveal key={index} delay={index * 0.06}>
                                    <div
                                        className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(8,71,156,0.05)] hover:border-[#a8cce8] transition-colors duration-300"
                                    >
                                        <button
                                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                            className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                        >
                                            <span className="text-[16px] font-bold text-[#001122]">{item.q}</span>
                                            <ChevronDown className={`w-5 h-5 text-[#2563eb] shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                                        </button>
                                        {/* Micro-interaction: AnimatePresence untuk transisi halus accordion */}
                                        <AnimatePresence initial={false}>
                                            {openFaq === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="overflow-hidden border-t border-[#f5faff]"
                                                >
                                                    <p className="p-6 pt-4 text-[15px] text-[#001122]/60 leading-relaxed">
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

                {/* 6. KONTAK & FORM PENDAFTARAN */}
                <section id="daftar" className="py-24 md:py-32 px-6 bg-white border-t border-slate-100">
                    {/* Banner penutup — sudut sangat membulat, background biru muda fresh,
                        padding lega, fade-in saat masuk viewport. */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.8, ease: 'circOut' }}
                        className="max-w-[1200px] mx-auto rounded-[3rem] bg-gradient-to-br from-[#f5faff] via-[#f5faff] to-[#e7f0fc] border border-slate-100 shadow-sm md:shadow-[0_30px_80px_rgba(8,71,156,0.06)] py-16 md:py-20 px-6 md:px-12"
                    >
                    <div className="grid lg:grid-cols-12 gap-12 items-start">

                        {/* --- SISI KIRI: INFORMASI KONTAK --- */}
                        <Reveal className="lg:col-span-5 flex flex-col gap-8">
                            <div>
                                <div className="px-3 py-1 mb-4 text-[14px] rounded-full border border-slate-100 bg-white w-fit text-[#001122]/70 shadow-sm">
                                    <p>Mulai Sekarang</p>
                                </div>
                                <h2 className="text-[32px] md:text-[42px] font-extrabold tracking-tight leading-[1.15] mb-4 text-balance bg-gradient-to-r from-[#12213e] to-[#1463d0] bg-clip-text text-transparent">
                                    Siap Mendaftar?
                                </h2>
                                <p className="text-[16px] md:text-[18px] text-[#001122]/60 leading-relaxed text-balance">
                                    Lengkapi formulir di samping. Sistem terintegrasi kami akan membuatkan akun dan mengirimkan berkas Anda ke meja verifikasi.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <motion.div
                                    whileHover={{ y: -6, transition: { duration: 0.3 } }}
                                    className="flex gap-4 items-start bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(8,71,156,0.05)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.1)] transition-shadow"
                                >
                                    <MapPin className="w-6 h-6 text-[#2563eb] shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-[16px] font-bold text-[#001122] mb-1">Alamat Kantor</h4>
                                        <p className="text-[15px] text-[#001122]/60 leading-relaxed">Jl. Perintis Kemerdekaan No.32, Kota Madiun, Jawa Timur 63117</p>
                                    </div>
                                </motion.div>
                                <motion.div
                                    whileHover={{ y: -6, transition: { duration: 0.3 } }}
                                    className="flex gap-4 items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(8,71,156,0.05)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.1)] transition-shadow"
                                >
                                    <Mail className="w-6 h-6 text-[#2563eb] shrink-0" />
                                    <div>
                                        <h4 className="text-[16px] font-bold text-[#001122] mb-1">Email Layanan</h4>
                                        <p className="text-[15px] text-[#001122]/60">kominfo@madiunkota.go.id</p>
                                    </div>
                                </motion.div>
                                <motion.div
                                    whileHover={{ y: -6, transition: { duration: 0.3 } }}
                                    className="flex gap-4 items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(8,71,156,0.05)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.1)] transition-shadow"
                                >
                                    <Phone className="w-6 h-6 text-[#2563eb] shrink-0" />
                                    <div>
                                        <h4 className="text-[16px] font-bold text-[#001122] mb-1">Telepon</h4>
                                        <p className="text-[15px] text-[#001122]/60">(0351) 467327</p>
                                    </div>
                                </motion.div>
                            </div>
                        </Reveal>

                        {/* --- SISI KANAN: FORMULIR PENGAJUAN --- */}
                        <Reveal delay={0.1} className="lg:col-span-7">
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-10 shadow-[0_20px_60px_rgba(8,71,156,0.08)] relative overflow-hidden">
                                {/* Efek Cahaya Halus di Pojok Kanan Form */}
                                <div className="absolute -right-20 -top-20 w-[300px] h-[300px] bg-[#a8cce8]/20 rounded-full blur-[80px] pointer-events-none"></div>

                                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6 relative z-10">

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        {/* Input: NIS / NIM */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">NIS / NIM</label>
                                            <input
                                                type="text"
                                                placeholder="Nomor Induk Siswa/Mahasiswa"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all"
                                            />
                                        </div>
                                        {/* Input: Nama Lengkap */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                placeholder="Nama lengkap sesuai KTP/Kartu Pelajar"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        {/* Input: Instansi Asal */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Asal Sekolah / Kampus</label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: Universitas Brawijaya"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all"
                                            />
                                        </div>
                                        {/* Input: Tujuan Bidang */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Tujuan Bidang OPD</label>
                                            <select className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#001122] focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all appearance-none cursor-pointer">
                                                <option value="">-- Pilih Instansi / Bidang --</option>
                                                {/* Menggunakan daftar OPD resmi (35 instansi) */}
                                                {daftarOPD.map((opd, idx) => (
                                                    <option key={idx} value={idx + 1}>{opd.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#001122]">Alamat Lengkap</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Alamat domisili lengkap beserta RT/RW, kelurahan, dan kecamatan"
                                            className="w-full resize-none bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Tanggal Mulai</label>
                                            <DatePicker
                                                value={tanggalMulai}
                                                min={toISODate(new Date())}
                                                placeholder="Pilih tanggal mulai"
                                                onChange={(iso) => {
                                                    setTanggalMulai(iso);
                                                    // Reset tanggal selesai bila jadi lebih awal dari tanggal mulai baru.
                                                    if (tanggalSelesai && tanggalSelesai < iso) {
                                                        setTanggalSelesai('');
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Tanggal Selesai</label>
                                            <DatePicker
                                                value={tanggalSelesai}
                                                min={tanggalMulai || toISODate(new Date())}
                                                placeholder="Pilih tanggal selesai"
                                                onChange={setTanggalSelesai}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Nama Dosen / Guru Pembimbing</label>
                                            <input
                                                type="text"
                                                placeholder="Nama lengkap pembimbing berserta gelar"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Nama Penanggung Jawab</label>
                                            <input
                                                type="text"
                                                placeholder="Nama orang tua / wali yang dapat dihubungi"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Nomor WhatsApp</label>
                                            <input
                                                type="tel"
                                                placeholder="Contoh: 081234567890"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Email Aktif</label>
                                            <input
                                                type="email"
                                                placeholder="Gunakan email utama Anda"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:ring-2 focus:ring-[#1463d0] focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Input: Pas Foto — dropzone dengan pratinjau thumbnail */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#001122]">Pas Foto</label>
                                        <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-[#f5faff] px-4 py-4 transition-colors hover:border-[#1463d0] hover:bg-[#e7f0fc]">
                                            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                {pasFotoPreview ? (
                                                    <img src={pasFotoPreview} alt="Pratinjau pas foto" className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImagePlus className="h-6 w-6 text-[#1463d0] transition-transform duration-300 group-hover:scale-110" />
                                                )}
                                            </span>
                                            <span className="flex flex-col">
                                                <span className="text-[14px] font-medium text-[#001122]">{pasFotoNama || 'Unggah Pas Foto Anda'}</span>
                                                <span className="text-[12px] text-[#001122]/50">Format JPG/PNG, latar polos, maks. 2MB.</span>
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg"
                                                onChange={handlePasFoto}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {/* --- SAAS LIGHT MODE SLIDER CAPTCHA --- */}
                                    <div className="mt-6 pt-8 border-t border-[#e5e7eb]">
                                        <label className="text-[14px] font-semibold text-[#001122] mb-3 block">Validasi Anti-Spam</label>

                                        <div className="relative w-full h-[56px] bg-[#f5faff] border border-[#e5e7eb] rounded-full overflow-hidden flex items-center group shadow-inner">

                                            {/* Background Pengisi */}
                                            <div
                                                className="absolute left-0 top-0 bottom-0 bg-[#2563eb]/10 transition-all duration-75"
                                                style={{ width: `${isCaptchaVerified ? 100 : sliderValue}%` }}
                                            ></div>

                                            {/* Teks Instruksi */}
                                            <div className="absolute w-full text-center z-0 text-[15px] font-medium select-none pointer-events-none transition-colors">
                                                {isCaptchaVerified ? (
                                                    <span className="text-[#2563eb] flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5" /> Terverifikasi
                                                    </span>
                                                ) : (
                                                    <span className="text-[#001122]/40 group-hover:text-[#001122]/60">
                                                        Geser untuk memverifikasi &gt;&gt;
                                                    </span>
                                                )}
                                            </div>

                                            {/* Input Range Murni */}
                                            <input
                                                type="range"
                                                min="0" max="100"
                                                value={isCaptchaVerified ? 100 : sliderValue}
                                                onChange={handleSliderChange}
                                                disabled={isCaptchaVerified}
                                                className={`absolute z-20 w-full h-full opacity-0 cursor-ew-resize ${isCaptchaVerified ? 'pointer-events-none' : ''}`}
                                            />

                                            {/* Gagang Slider (Pill) */}
                                            <div
                                                className={`absolute z-10 h-[44px] w-[70px] bg-white border border-[#e5e7eb] rounded-full flex items-center justify-center pointer-events-none transition-all duration-75 shadow-sm ${isCaptchaVerified ? 'border-[#2563eb] bg-[#2563eb]' : ''}`}
                                                style={{ left: `calc(${isCaptchaVerified ? 100 : sliderValue}% - ${isCaptchaVerified ? 74 : (sliderValue * 0.74) + 6}px)` }}
                                            >
                                                {isCaptchaVerified ? (
                                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                                ) : (
                                                    <ArrowRight className="w-6 h-6 text-[#001122]/40" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informasi Penting — nomor WhatsApp aktif untuk akun & OTP */}
                                    <div className="flex items-start gap-3 mt-6 rounded-2xl bg-[#f5faff] border border-slate-200 px-4 py-3.5">
                                        <Info className="w-5 h-5 text-[#1463d0] shrink-0 mt-0.5" />
                                        <p className="text-[13px] text-[#001122]/60 leading-relaxed">
                                            Pastikan alamay E-Mail yang Anda masukkan adalah E-Mail aktif, karena akun dasbor dan link OTP akan dikirimkan ke nomor tersebut.
                                        </p>
                                    </div>

                                    {/* Tombol Submit — Sliding Animation (overlay #cddcef geser
                                        dari kiri menutupi background biru #106feb). */}
                                    <motion.button
                                        type="submit"
                                        disabled={!isCaptchaVerified}
                                        whileTap={isCaptchaVerified ? { scale: 0.98 } : undefined}
                                        className={`group relative w-full overflow-hidden rounded-full py-1.5 pl-7 pr-1.5 mt-2 flex items-center justify-between gap-3 transition-shadow duration-300 ${
                                            isCaptchaVerified
                                            ? "bg-[#106feb] shadow-lg shadow-[#106feb]/30 hover:shadow-xl hover:shadow-[#106feb]/40 cursor-pointer"
                                            : "bg-[#e5e7eb] cursor-not-allowed"
                                        }`}
                                    >
                                        {/* Overlay #cddcef geser dari kiri (hanya saat captcha terverifikasi) */}
                                        {isCaptchaVerified && (
                                            <span
                                                aria-hidden
                                                className="absolute inset-0 z-0 bg-[#cddcef] -translate-x-[101%] transition-transform duration-500 ease-out group-hover:translate-x-0"
                                            />
                                        )}
                                        <span className={`relative z-10 text-[16px] font-semibold transition-colors duration-500 ease-out ${isCaptchaVerified ? "text-white group-hover:text-[#12213e]" : "text-[#001122]/40"}`}>
                                            Kirim Berkas Pengajuan Magang
                                        </span>
                                        {/* Lingkaran ikon — membalik kontras saat overlay menutupi */}
                                        <span className={`relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ease-out ${isCaptchaVerified ? "bg-[#cddcef] text-[#106feb] group-hover:bg-[#106feb] group-hover:text-white" : "bg-white/60 text-[#001122]/30"}`}>
                                            <Send className="size-5 transition-transform duration-500 ease-out group-hover:translate-x-0.5" />
                                        </span>
                                    </motion.button>

                                </form>
                            </div>
                        </Reveal>
                    </div>
                    </motion.div>
                </section>

                {/* 7. FOOTER */}
                <footer className="relative overflow-hidden bg-[#020c1b] px-6 pt-20 pb-10 text-white">
                    {/* Aksen garis gradien di tepi atas */}
                    <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563eb]/60 to-transparent" />
                    {/* Glow lembut */}
                    <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[640px] max-w-[90vw] -translate-x-1/2 rounded-full bg-[#1463d0]/15 blur-[140px]" />
                    {/* Watermark ikon besar */}
                    <Building2 aria-hidden className="pointer-events-none absolute -bottom-12 -right-8 h-64 w-64 text-white/[0.025]" />

                    <div className="relative mx-auto max-w-7xl">
                        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
                            {/* Kolom brand */}
                            <div className="md:col-span-5">
                                <div className="mb-5 flex items-center gap-2.5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#106feb] to-[#1463d0] shadow-[0_10px_24px_-8px_rgba(20,99,208,0.7)]">
                                        <Layout className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="bg-gradient-to-r from-white via-white to-[#a8cce8] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">E-Magang.</span>
                                </div>
                                <p className="max-w-sm text-[15px] leading-relaxed text-white/55">
                                    Portal resmi pendaftaran magang Pemerintah Kota Madiun. Satu pintu untuk menghubungkan pelajar dan mahasiswa dengan instansi pemerintah secara mudah, transparan, dan gratis.
                                </p>
                                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/70">
                                    <ShieldCheck className="h-4 w-4 text-[#3b82f6]" />
                                    Layanan Resmi Diskominfo Kota Madiun
                                </div>
                            </div>

                            {/* Kolom navigasi */}
                            <div className="md:col-span-3">
                                <h4 className="mb-5 text-[13px] font-bold uppercase tracking-wider text-white/40">Navigasi</h4>
                                <ul className="flex flex-col gap-3.5">
                                    {navLinks.map((link) => (
                                        <li key={link.href}>
                                            <a href={link.href} className="group relative inline-flex items-center text-[15px] text-white/60 transition-colors hover:text-white">
                                                <ArrowRight aria-hidden className="absolute left-0 h-3.5 w-3.5 -translate-x-1 text-[#3b82f6] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                                                <span className="transition-transform duration-300 group-hover:translate-x-5">{link.label}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Kolom kontak */}
                            <div className="md:col-span-4">
                                <h4 className="mb-5 text-[13px] font-bold uppercase tracking-wider text-white/40">Hubungi Kami</h4>
                                <ul className="flex flex-col gap-4">
                                    <li className="flex items-start gap-3 text-[15px] text-white/60">
                                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#3b82f6]" />
                                        <span className="leading-relaxed">Jl. Perintis Kemerdekaan No.32, Kota Madiun, Jawa Timur 63117</span>
                                    </li>
                                    <li>
                                        <a href="mailto:kominfo@madiunkota.go.id" className="flex items-center gap-3 text-[15px] text-white/60 transition-colors hover:text-white">
                                            <Mail className="h-5 w-5 shrink-0 text-[#3b82f6]" />
                                            kominfo@madiunkota.go.id
                                        </a>
                                    </li>
                                    <li>
                                        <a href="tel:0351467327" className="flex items-center gap-3 text-[15px] text-white/60 transition-colors hover:text-white">
                                            <Phone className="h-5 w-5 shrink-0 text-[#3b82f6]" />
                                            (0351) 467327
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Garis pemisah + bottom bar */}
                        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                            <p className="text-center text-[14px] text-white/45 sm:text-left">
                                © {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kota Madiun. Hak cipta dilindungi.
                            </p>
                            <div className="flex items-center gap-6 text-[14px] text-white/45">
                                <a href="#" className="transition-colors hover:text-white">Kebijakan Privasi</a>
                                <a href="#" className="transition-colors hover:text-white">Syarat &amp; Ketentuan</a>
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}
