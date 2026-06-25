import { Head, Link } from '@inertiajs/react';
import {
    ChevronRight, Layout, Shield, Clock, Building2,
    MapPin, Mail, Phone, CheckCircle2, ArrowRight, ArrowUpRight, Send, Search, ChevronDown,
    Menu, X, ShieldCheck, Sparkles, Award, Timer
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, animate } from 'motion/react';
import { login, register } from '@/routes';

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

/* =========================================================================
 *  ANIMATED BUTTON (Sliding-overlay hover — sesuai blueprint referensi)
 *  - default : background biru #106feb, teks putih, badge panah #cddcef di
 *              kanan. Saat hover, overlay #cddcef bergeser dari kiri menutupi
 *              seluruh background → teks berubah jadi hitam.
 *  - inverted: skema warna dibalik (base terang, overlay & badge biru).
 *  Mendukung render sebagai <button>, <a>, atau Inertia <Link> (as="link").
 * ========================================================================= */
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

    // Skema warna: base = warna diam, fill = warna overlay saat hover penuh.
    const baseBg = isInverted ? 'bg-[#cddcef]' : 'bg-[#106feb]';
    const baseText = isInverted ? 'text-[#12213e]' : 'text-white';
    const hoverText = isInverted ? 'group-hover:text-white' : 'group-hover:text-black';
    const fill = isInverted ? 'bg-[#106feb]' : 'bg-[#cddcef]';
    const badgeBg = isInverted ? 'bg-[#106feb]' : 'bg-[#cddcef]';
    const arrowColor = isInverted ? 'text-white' : 'text-[#106feb]';

    const content = (
        <>
            {/* Overlay geser: menutupi background dari kiri → kanan saat hover */}
            <span
                aria-hidden
                className={`absolute inset-0 z-0 ${fill} -translate-x-[101%] transition-transform duration-500 ease-out group-hover:translate-x-0`}
            />
            {/* Label: warna teks berubah dinamis saat overlay menutupi */}
            <span className={`relative z-10 font-semibold transition-colors duration-500 ease-out ${baseText} ${hoverText}`}>
                {children}
            </span>
            {/* Badge ikon panah (lingkaran) di kanan */}
            <span className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${badgeBg} ${arrowColor}`}>
                <ArrowUpRight className="size-4" />
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

export default function Welcome() {
    const [scrolled, setScrolled] = useState(false);
    // State FAQ
    const [openFaq, setOpenFaq] = useState<number | null>(0);
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

    // Daftar 35 OPD
    const daftarOPD = [
        "BADAN KEPEGAWAIAN DAERAH", "BADAN KESATUAN BANGSA DAN POLITIK", "BADAN PENANGGULANGAN BENCANA DAERAH",
        "BADAN PENDAPATAN DAERAH", "BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH", "BADAN PERENCANAAN DAN PEMBANGUNAN DAERAH",
        "BAGIAN HUKUM", "BAGIAN ORGANISASI", "BAGIAN PEMERINTAHAN UMUM", "BAGIAN PENGADAAN BARANG/JASA DAN ADMINISTRASI PEMBANGUNAN",
        "BAGIAN PEREKONOMIAN DAN KESEJAHTERAAN RAKYAT", "BAGIAN UMUM", "DINAS KEBUDAYAAN, PARIWISATA, KEPEMUDAAN DAN OLAHRAGA",
        "DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL", "DINAS KESEHATAN DAN KELUARGA BERENCANA", "DINAS KOMUNIKASI DAN INFORMATIKA",
        "DINAS LINGKUNGAN HIDUP", "DINAS PEKERJAAN UMUM DAN TATA RUANG", "DINAS PENANAMAN MODAL, PELAYANAN TERPADU SATU PINTU, KOPERASI DAN USAHA MIKRO",
        "DINAS PENDIDIKAN", "DINAS PERDAGANGAN", "DINAS PERHUBUNGAN", "DINAS PERPUSTAKAAN DAN KEARSIPAN",
        "DINAS PERTANIAN DAN KETAHANAN PANGAN", "DINAS PERUMAHAN DAN KAWASAN PERMUKIMAN", "DINAS SOSIAL, PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK",
        "DINAS TENAGA KERJA", "INSPEKTORAT", "KECAMATAN KARTOHARJO", "KECAMATAN MANGUHARJO", "KECAMATAN TAMAN",
        "RUMAH SAKIT UMUM DAERAH", "SATUAN POLISI PAMONG PRAJA", "SEKRETARIAT DAERAH", "SEKRETARIAT DPRD"
    ];

    const filteredOPD = daftarOPD.filter(opd => opd.toLowerCase().includes(searchOpd.toLowerCase()));

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
                            <AnimatedButton as="link" href={register()}>
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
                                        href={login()}
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
                <section className="relative pt-[180px] pb-20 px-6 max-w-[1200px] mx-auto flex flex-col items-center text-center overflow-visible">

                    {/* Glow Blobs premium di belakang teks & foto */}
                    <div aria-hidden className="pointer-events-none absolute -z-10 inset-0">
                        <div className="absolute top-10 left-1/4 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-[#1463d0]/25 blur-[120px]"></div>
                        <div className="absolute top-24 right-1/4 translate-x-1/2 w-[360px] h-[360px] rounded-full bg-[#8b5cf6]/20 blur-[120px]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[520px] h-[300px] rounded-full bg-[#a8cce8]/30 blur-[120px]"></div>
                    </div>

                    {/* Konten teks Hero dengan staggerChildren (judul → sub → tombol) */}
                    <motion.div
                        variants={heroContainer}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col items-center"
                    >
                        {/* Badge Pengumuman (Pill) */}
                        <motion.div
                            variants={heroItem}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-100 bg-white/60 backdrop-blur-md text-[13px] font-medium text-[#001122]/70 mb-8 hover:bg-white hover:border-[#a8cce8] transition-all cursor-pointer shadow-sm"
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
                            <span className="relative inline-block mt-2">
                                Digital Anda
                                {/* Garis bawah dekoratif ala SaaS */}
                                <svg className="absolute w-full h-3 -bottom-1.5 left-0 text-[#a8cce8] -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="6" fill="transparent" strokeLinecap="round"/>
                                </svg>
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
                            <AnimatedButton className="w-full sm:w-auto">
                                Mulai Pengajuan Magang
                            </AnimatedButton>
                            <AnimatedButton variant="inverted" className="w-full sm:w-auto">
                                Pelajari Alur
                            </AnimatedButton>
                        </motion.div>
                    </motion.div>

                    {/* 3. VISUAL UTAMA — Foto Gedung (scale 0.95 → 1 saat scroll) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.9, ease: 'circOut' }}
                        className="w-full max-w-5xl mt-24 relative group"
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
                                className="w-full aspect-[16/10] md:aspect-[21/9] object-cover"
                            />
                            {/* Placeholder gradien (di-unhide oleh onError bila gambar gagal dimuat) */}
                            <div className="hidden w-full aspect-[16/10] md:aspect-[21/9] bg-gradient-to-br from-[#12213e] via-[#1463d0] to-[#a8cce8] flex-col items-center justify-center">
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
                    <Reveal className="max-w-[1200px] mx-auto px-6 mb-8">
                        <p className="text-center text-[14px] font-semibold uppercase tracking-wider text-[#001122]/40">
                            Terintegrasi dengan 35 Instansi Pemerintah Kota Madiun
                        </p>
                    </Reveal>

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

                    {/* Section Header */}
                    <Reveal className="flex flex-col items-center text-center gap-2 mb-12 md:mb-16">
                        <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-slate-100 bg-white w-fit text-[#001122]/70 shadow-sm">
                            <p>Kenapa E-Magang?</p>
                        </div>
                        <h2 className="text-[32px] md:text-[42px] font-extrabold tracking-tight leading-[1.15] max-w-2xl text-balance bg-gradient-to-r from-[#001122] via-[#2563eb] to-[#a8cce8] bg-clip-text text-transparent">
                            Sistem Cerdas untuk Pengalaman Magang Terbaik
                        </h2>
                        <p className="text-[16px] md:text-[18px] text-[#001122]/60 max-w-2xl leading-relaxed text-balance mt-2">
                            Kami merancang platform ini untuk menghilangkan kerumitan birokrasi manual, mempercepat persetujuan, dan memberikan transparansi penuh.
                        </p>
                    </Reveal>

                    {/* Bento Grid Layout (2 Top, 1 Bottom Wide) — stagger satu per satu */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-80px' }}
                        className="flex flex-col gap-4 md:gap-6"
                    >

                        {/* Baris Atas (2 Kolom) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Kartu 1 */}
                            <motion.div
                                variants={staggerItem}
                                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                className="h-full flex flex-col gap-4 p-8 md:p-10 border border-slate-100 bg-white rounded-3xl shadow-[0_10px_40px_rgba(8,71,156,0.06)] hover:shadow-[0_20px_60px_rgba(37,99,235,0.12)] hover:border-[#a8cce8] transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5faff] to-[#a8cce8]/30 border border-[#a8cce8]/40 flex items-center justify-center mb-2">
                                    <Clock className="w-6 h-6 text-[#2563eb]" />
                                </div>
                                <h3 className="text-[22px] font-bold leading-snug text-[#001122]">
                                    Validasi Real-time
                                </h3>
                                <p className="text-[16px] leading-relaxed text-[#001122]/60">
                                    Pantau status pengajuan Anda secara langsung. Sistem akan memberi notifikasi begitu berkas Anda disetujui oleh verifikator dan OPD terkait.
                                </p>
                            </motion.div>

                            {/* Kartu 2 */}
                            <motion.div
                                variants={staggerItem}
                                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                className="h-full flex flex-col gap-4 p-8 md:p-10 border border-slate-100 bg-white rounded-3xl shadow-[0_10px_40px_rgba(8,71,156,0.06)] hover:shadow-[0_20px_60px_rgba(37,99,235,0.12)] hover:border-[#a8cce8] transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5faff] to-[#a8cce8]/30 border border-[#a8cce8]/40 flex items-center justify-center mb-2">
                                    <Shield className="w-6 h-6 text-[#2563eb]" />
                                </div>
                                <h3 className="text-[22px] font-bold leading-snug text-[#001122]">
                                    Akses Dasbor Aman (Tanpa Sandi)
                                </h3>
                                <p className="text-[16px] leading-relaxed text-[#001122]/60">
                                    Lupakan rutinitas mereset kata sandi. Gunakan sistem OTP (One Time Password) via Email/WA untuk login yang instan dan terenkripsi.
                                </p>
                            </motion.div>
                        </div>

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

                        {/* Search Bar (Pill Shape) */}
                        <div className="flex justify-center mb-12">
                            <div className="relative w-full max-w-2xl group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#001122]/40 w-5 h-5 group-focus-within:text-[#2563eb] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari dinas, badan, atau kecamatan..."
                                    className="w-full bg-[#f5faff] border border-slate-100 rounded-full py-4 pl-14 pr-6 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:border-[#a8cce8] focus:ring-4 focus:ring-[#a8cce8]/20 transition-all shadow-sm"
                                    onChange={(e) => setSearchOpd(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Grid Kartu OPD (Stagger satu per satu) */}
                        <motion.div
                            key={searchOpd}
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-40px' }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {filteredOPD.length > 0 ? (
                                filteredOPD.map((opd) => (
                                    <motion.div
                                        key={opd}
                                        variants={staggerItem}
                                        whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                        className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgba(8,71,156,0.05)] hover:border-[#a8cce8] hover:shadow-[0_20px_50px_rgba(37,99,235,0.12)] transition-all duration-300 group flex flex-col justify-between h-full cursor-default"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Ikon Instansi */}
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5faff] to-[#a8cce8]/20 border border-slate-100 flex items-center justify-center shrink-0 group-hover:from-[#2563eb]/10 group-hover:border-[#2563eb]/20 transition-colors duration-300">
                                                <Building2 className="w-6 h-6 text-[#2563eb]" />
                                            </div>
                                            <h3 className="text-[15px] font-semibold text-[#001122] leading-[1.5] group-hover:text-[#2563eb] transition-colors duration-300">
                                                {opd}
                                            </h3>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                /* Tampilan Jika OPD Tidak Ditemukan */
                                <div className="col-span-full text-center py-12 bg-[#f5faff] border border-dashed border-slate-200 rounded-3xl">
                                    <p className="text-[15px] text-[#001122]/60">Instansi "{searchOpd}" tidak ditemukan. Coba kata kunci lain.</p>
                                </div>
                            )}
                        </motion.div>

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

                        {/* Grid 4 Kolom untuk Alur (stagger satu per satu) */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-80px' }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        >

                            {[
                                { num: "1", title: "Isi Formulir Publik", desc: "Lengkapi data diri dan instansi tujuan Anda. Sistem akan langsung membuatkan akun secara otomatis untuk Anda.", line: true },
                                { num: "2", title: "Proses Verifikasi", desc: "Data Anda dievaluasi secara berjenjang oleh Admin Kominfo lalu diteruskan ke Admin OPD yang dituju.", line: true },
                                { num: "3", title: "Login OTP Dasbor", desc: "Akses dasbor personal Anda menggunakan Email/WA tanpa kata sandi untuk mengunduh surat persetujuan.", line: true },
                                { num: "4", title: "Sertifikat & Evaluasi", desc: "Unggah laporan tugas akhir Anda dan isi survei layanan untuk mendapatkan e-Sertifikat kelulusan resmi.", line: false },
                            ].map((step) => (
                                <motion.div
                                    key={step.num}
                                    variants={staggerItem}
                                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                    className="flex flex-col relative group h-full"
                                >
                                    {/* Garis Penghubung (Hanya muncul di Desktop) */}
                                    {step.line && (
                                        <div className="hidden lg:block absolute top-6 left-12 w-full h-[1px] bg-gradient-to-r from-[#a8cce8] to-transparent -z-10"></div>
                                    )}

                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5faff] to-[#a8cce8]/30 border border-[#a8cce8]/50 flex items-center justify-center mb-6 text-[#2563eb] font-extrabold text-xl group-hover:bg-gradient-to-br group-hover:from-[#001122] group-hover:to-[#2563eb] group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm">
                                        {step.num}
                                    </div>
                                    <h3 className="text-[18px] font-bold text-[#001122] mb-3">{step.title}</h3>
                                    <p className="text-[15px] text-[#001122]/60 leading-relaxed">
                                        {step.desc}
                                    </p>
                                </motion.div>
                            ))}

                        </motion.div>
                    </div>
                </section>

                {/* 5.5. FAQ SECTION (WEBILD STYLE) */}
                <section id="faq" className="py-24 md:py-32 px-6 bg-[#f5faff]">
                    <div className="max-w-[1200px] mx-auto">
                        <Reveal className="flex flex-col items-center text-center gap-2 mb-16">
                            <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-slate-100 bg-white w-fit text-[#001122]/70 shadow-sm">
                                <p>Bantuan & FAQ</p>
                            </div>
                            <h2 className="text-[32px] md:text-[42px] font-extrabold tracking-tight bg-gradient-to-r from-[#001122] via-[#2563eb] to-[#a8cce8] bg-clip-text text-transparent">
                                Pertanyaan Umum
                            </h2>
                        </Reveal>

                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                { q: "Apa itu E-Magang Kota Madiun?", a: "Platform digital resmi untuk mempermudah pendaftaran, verifikasi, dan pemantauan status magang siswa/mahasiswa di lingkungan instansi Pemerintah Kota Madiun." },
                                { q: "Apakah pendaftaran dikenakan biaya?", a: "Tidak. Seluruh layanan di E-Magang Kota Madiun adalah gratis bagi seluruh pelajar dan mahasiswa." },
                                { q: "Berapa lama proses verifikasi berkas?", a: "Biasanya memakan waktu 2-3 hari kerja. Anda akan mendapatkan notifikasi status melalui email atau WhatsApp yang terdaftar." },
                                { q: "Bagaimana cara mendapatkan e-Sertifikat?", a: "Setelah selesai melaksanakan magang, pastikan Anda telah mengunggah laporan tugas akhir dan mengisi survei evaluasi di dasbor akun Anda." }
                            ].map((item, index) => (
                                <Reveal key={index} delay={(index % 2) * 0.08}>
                                    <div
                                        className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(8,71,156,0.05)] hover:border-[#a8cce8] transition-colors duration-300"
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
                <section id="daftar" className="py-24 md:py-32 px-6 bg-[#f5faff] border-t border-slate-100">
                    <div className="max-w-[1200px] mx-auto grid lg:grid-cols-12 gap-12 items-start">

                        {/* --- SISI KIRI: INFORMASI KONTAK --- */}
                        <Reveal className="lg:col-span-5 flex flex-col gap-8">
                            <div>
                                <div className="px-3 py-1 mb-4 text-[14px] rounded-full border border-slate-100 bg-white w-fit text-[#001122]/70 shadow-sm">
                                    <p>Mulai Sekarang</p>
                                </div>
                                <h2 className="text-[32px] md:text-[42px] font-extrabold tracking-tight leading-[1.15] mb-4 text-balance bg-gradient-to-r from-[#001122] via-[#2563eb] to-[#a8cce8] bg-clip-text text-transparent">
                                    Siap Mendaftar?
                                </h2>
                                <p className="text-[16px] md:text-[18px] text-[#001122]/60 leading-relaxed text-balance">
                                    Lengkapi formulir di samping. Sistem terintegrasi kami akan membuatkan akun dan meneruskan berkas Anda ke meja verifikator.
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
                                        {/* Input: Instansi Asal */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Asal Kampus / Sekolah</label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: Universitas Brawijaya"
                                                className="w-full bg-[#f5faff] border border-[#e5e7eb] rounded-[8px] px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:border-[#a8cce8] focus:ring-4 focus:ring-[#a8cce8]/20 transition-all"
                                            />
                                        </div>
                                        {/* Input: Tujuan Bidang */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Tujuan Bidang OPD</label>
                                            <select className="w-full bg-[#f5faff] border border-[#e5e7eb] rounded-[8px] px-4 py-3.5 text-[15px] text-[#001122] focus:outline-none focus:border-[#a8cce8] focus:ring-4 focus:ring-[#a8cce8]/20 transition-all appearance-none cursor-pointer">
                                                <option value="">-- Pilih Instansi / Bidang --</option>
                                                {/* Menggunakan daftar OPD resmi (35 instansi) */}
                                                {daftarOPD.map((opd, idx) => (
                                                    <option key={idx} value={idx + 1}>{opd}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Tanggal Mulai</label>
                                            <input
                                                type="date"
                                                className="w-full bg-[#f5faff] border border-[#e5e7eb] rounded-[8px] px-4 py-3.5 text-[15px] text-[#001122] focus:outline-none focus:border-[#a8cce8] focus:ring-4 focus:ring-[#a8cce8]/20 transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Tanggal Selesai</label>
                                            <input
                                                type="date"
                                                className="w-full bg-[#f5faff] border border-[#e5e7eb] rounded-[8px] px-4 py-3.5 text-[15px] text-[#001122] focus:outline-none focus:border-[#a8cce8] focus:ring-4 focus:ring-[#a8cce8]/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-semibold text-[#001122]">Nama Dosen / Guru Pembimbing</label>
                                        <input
                                            type="text"
                                            placeholder="Nama lengkap pembimbing berserta gelar"
                                            className="w-full bg-[#f5faff] border border-[#e5e7eb] rounded-[8px] px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:border-[#a8cce8] focus:ring-4 focus:ring-[#a8cce8]/20 transition-all"
                                        />
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Nomor WhatsApp</label>
                                            <input
                                                type="tel"
                                                placeholder="Contoh: 081234567890"
                                                className="w-full bg-[#f5faff] border border-[#e5e7eb] rounded-[8px] px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:border-[#a8cce8] focus:ring-4 focus:ring-[#a8cce8]/20 transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[14px] font-semibold text-[#001122]">Email Aktif</label>
                                            <input
                                                type="email"
                                                placeholder="Gunakan email utama Anda"
                                                className="w-full bg-[#f5faff] border border-[#e5e7eb] rounded-[8px] px-4 py-3.5 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:border-[#a8cce8] focus:ring-4 focus:ring-[#a8cce8]/20 transition-all"
                                            />
                                        </div>
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

                                    {/* Tombol Submit */}
                                    <motion.button
                                        type="submit"
                                        disabled={!isCaptchaVerified}
                                        whileHover={isCaptchaVerified ? { scale: 1.02 } : undefined}
                                        whileTap={isCaptchaVerified ? { scale: 0.98 } : undefined}
                                        className={`w-full py-4 text-[16px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 mt-6 ${
                                            isCaptchaVerified
                                            ? "bg-gradient-to-r from-[#001122] via-[#1e4fd1] to-[#2563eb] text-white hover:brightness-110 cursor-pointer shadow-lg shadow-[#2563eb]/30 hover:shadow-xl hover:shadow-[#2563eb]/40"
                                            : "bg-[#e5e7eb] text-[#001122]/40 cursor-not-allowed"
                                        }`}
                                    >
                                        <Send className="w-5 h-5" />
                                        Kirim Berkas Pengajuan Magang
                                    </motion.button>

                                </form>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* 7. FOOTER */}
                <footer className="bg-white border-t border-slate-100 py-12 px-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#001122] to-[#2563eb] flex items-center justify-center">
                                <Layout className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[#001122] via-[#2563eb] to-[#a8cce8] bg-clip-text text-transparent">E-Magang.</span>
                        </div>
                        <p className="text-[15px] text-[#001122]/50 font-medium">
                            © {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kota Madiun.
                        </p>
                    </div>
                </footer>

            </div>
        </>
    );
}
