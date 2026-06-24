import { Head } from '@inertiajs/react';
import {
    ChevronRight, Layout, Zap, Shield, Clock, Building2,
    MapPin, Mail, Phone, CheckCircle2, ArrowRight, Send, Search, ChevronDown
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Welcome() {
    const [scrolled, setScrolled] = useState(false);
    // State FAQ
    const [openFaq, setOpenFaq] = useState<number | null>(0);

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
            <Head title="E-Magang - Dinas Kominfo Kota Madiun" />

            {/* Latar Belakang Utama Webild (Light Blue-ish White) */}
            <div className="min-h-screen bg-[#f5faff] text-[#001122] font-sans selection:bg-[#a8cce8] selection:text-[#001122] overflow-hidden relative">

                {/* Efek Cahaya Halus (Soft Glow) khas Webild SaaS di area atas */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-[#a8cce8]/30 to-transparent blur-3xl -z-10 pointer-events-none"></div>

                {/* 1. NAVIGATION BAR */}
                <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#f5faff]/80 backdrop-blur-md border-b border-[#e5e7eb] py-4 shadow-sm' : 'bg-transparent py-6'}`}>
                    <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">

                        {/* Logo Kombinasi Ikon & Teks */}
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-xl tracking-tight text-[#001122]">E-Magang.</span>
                        </div>

                        {/* Tautan Menu Tengah */}
                        <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#001122]/70">
                            <a href="#fitur" className="hover:text-[#001122] transition-colors">Fitur</a>
                            <a href="#instansi" className="hover:text-[#001122] transition-colors">Instansi OPD</a>
                            <a href="#alur" className="hover:text-[#001122] transition-colors">Alur Pendaftaran</a>
                            <a href="#faq" className="hover:text-[#001122] transition-colors">FAQ</a>
                            <a href="#daftar" className="hover:text-[#001122] transition-colors">Kontak</a>
                        </div>

                        {/* Aksi Kanan */}
                        <div className="flex items-center gap-6">
                            <button className="hidden md:block text-[15px] font-medium text-[#001122]/70 hover:text-[#001122] transition-colors">
                                Masuk Akun
                            </button>
                            {/* Tombol Primary: Pill-shape 9999px */}
                            <button className="px-6 py-2.5 rounded-full bg-[#001122] text-white text-[15px] font-medium hover:bg-[#001122]/80 transition-all">
                                Daftar Sekarang
                            </button>
                        </div>
                    </div>
                </nav>

                {/* 2. HERO SECTION */}
                <section className="relative pt-[160px] pb-20 px-6 max-w-[1200px] mx-auto flex flex-col items-center text-center">

                    {/* Badge Pengumuman (Pill) */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#e5e7eb] bg-white/60 backdrop-blur-sm text-[13px] font-medium text-[#001122]/70 mb-8 hover:bg-white hover:border-[#a8cce8] transition-all cursor-pointer shadow-sm">
                        <span className="flex h-2 w-2 rounded-full bg-[#a8cce8] animate-pulse"></span>
                        Portal Resmi Diskominfo Kota Madiun
                        <ChevronRight className="w-3.5 h-3.5" />
                    </div>

                    {/* Headline Utama */}
                    <h1 className="text-[42px] md:text-[68px] font-bold tracking-tight leading-[1.05] text-[#001122] max-w-4xl mb-6">
                        Pusat Kendali Karir <br className="hidden md:block" />
                        <span className="relative inline-block mt-2">
                            Digital Anda
                            {/* Garis bawah dekoratif ala SaaS */}
                            <svg className="absolute w-full h-3 -bottom-1.5 left-0 text-[#a8cce8] -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="6" fill="transparent" strokeLinecap="round"/>
                            </svg>
                        </span>
                    </h1>

                    {/* Deskripsi Sub-headline */}
                    <p className="text-[18px] md:text-[20px] text-[#001122]/60 max-w-2xl mb-10 leading-[1.6] font-light">
                        Kelola pendaftaran, pantau status verifikasi, dan temukan bidang penempatan yang tepat di instansi pemerintahan dalam satu platform cerdas.
                    </p>

                    {/* Grup Tombol Aksi */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#001122] text-white text-[16px] font-medium hover:bg-[#001122]/80 transition-all flex items-center justify-center gap-2 group">
                            Mulai Pengajuan Magang
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 rounded-full border border-[#e5e7eb] bg-white text-[#001122] text-[16px] font-medium hover:bg-[#f5faff] transition-all flex items-center justify-center gap-2 shadow-sm">
                            <Zap className="w-4 h-4 text-[#a8cce8] fill-[#a8cce8]/20" />
                            Pelajari Alur
                        </button>
                    </div>

                    {/* 3. MOCKUP DASHBOARD (Representasi Gambar Hero) */}
                    <div className="w-full max-w-5xl mt-24 relative group perspective-1000">
                        {/* Glow di belakang mockup */}
                        <div className="absolute inset-0 bg-[#a8cce8]/30 blur-[100px] rounded-full group-hover:bg-[#a8cce8]/40 transition-colors duration-500"></div>

                        {/* Bingkai Luar (Radius 16px) */}
                        <div className="relative rounded-[16px] border border-[#e5e7eb] bg-white p-2 md:p-3 shadow-2xl shadow-[#001122]/5 transform transition-transform duration-700 hover:-translate-y-2">
                            {/* Area Konten Dalam (Radius 8px sesuai panduan) */}
                            <div className="rounded-[8px] border border-[#e5e7eb]/50 bg-[#f5faff]/50 w-full aspect-[16/10] md:aspect-[21/9] flex flex-col overflow-hidden relative">

                                {/* Header Mockup */}
                                <div className="h-12 border-b border-[#e5e7eb]/50 bg-white flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#e5e7eb]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#e5e7eb]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#e5e7eb]"></div>
                                </div>

                                {/* Body Mockup (Pola Data) */}
                                <div className="p-6 flex gap-6 h-full opacity-70">
                                    {/* Sidebar Semu */}
                                    <div className="w-48 hidden md:flex flex-col gap-4 border-r border-[#e5e7eb]/50 pr-6">
                                        <div className="w-full h-8 rounded-md bg-[#a8cce8]/20"></div>
                                        <div className="w-3/4 h-4 rounded-md bg-[#e5e7eb]"></div>
                                        <div className="w-5/6 h-4 rounded-md bg-[#e5e7eb]"></div>
                                        <div className="w-2/3 h-4 rounded-md bg-[#e5e7eb]"></div>
                                    </div>
                                    {/* Konten Semu */}
                                    <div className="flex-1 flex flex-col gap-6">
                                        <div className="flex justify-between items-center">
                                            <div className="w-48 h-8 rounded-lg bg-[#e5e7eb]"></div>
                                            <div className="w-24 h-8 rounded-full bg-[#001122]/5"></div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1 h-24 rounded-[8px] border border-[#e5e7eb] bg-white"></div>
                                            <div className="flex-1 h-24 rounded-[8px] border border-[#e5e7eb] bg-white"></div>
                                            <div className="flex-1 h-24 rounded-[8px] border border-[#e5e7eb] bg-white"></div>
                                        </div>
                                        <div className="flex-1 w-full rounded-[8px] border border-[#e5e7eb] bg-white"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. FITUR UNGGULAN (WEBILD BENTO GRID STYLE) */}
                <section id="fitur" className="py-20 px-6 max-w-[1200px] mx-auto">

                    {/* Section Header */}
                    <div className="flex flex-col items-center text-center gap-2 mb-12 md:mb-16">
                        <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-[#e5e7eb] bg-white w-fit text-[#001122]/70 shadow-sm">
                            <p>Kenapa E-Magang?</p>
                        </div>
                        <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight leading-[1.15] text-[#001122] max-w-2xl text-balance">
                            Sistem Cerdas untuk Pengalaman Magang Terbaik
                        </h2>
                        <p className="text-[16px] md:text-[18px] text-[#001122]/60 max-w-2xl leading-relaxed text-balance mt-2">
                            Kami merancang platform ini untuk menghilangkan kerumitan birokrasi manual, mempercepat persetujuan, dan memberikan transparansi penuh.
                        </p>
                    </div>

                    {/* Bento Grid Layout (2 Top, 1 Bottom Wide) */}
                    <div className="flex flex-col gap-4 md:gap-6">

                        {/* Baris Atas (2 Kolom) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Kartu 1 */}
                            <div className="flex flex-col gap-4 p-6 md:p-8 border border-[#e5e7eb] bg-white rounded-[8px] hover:shadow-md transition-shadow duration-300">
                                <div className="w-12 h-12 rounded-[8px] bg-[#f5faff] border border-[#a8cce8]/40 flex items-center justify-center mb-2">
                                    <Clock className="w-6 h-6 text-[#106feb]" />
                                </div>
                                <h3 className="text-[22px] font-semibold leading-snug text-[#001122]">
                                    Validasi Real-time
                                </h3>
                                <p className="text-[16px] leading-relaxed text-[#001122]/60">
                                    Pantau status pengajuan Anda secara langsung. Sistem akan memberi notifikasi begitu berkas Anda disetujui oleh verifikator dan OPD terkait.
                                </p>
                            </div>

                            {/* Kartu 2 */}
                            <div className="flex flex-col gap-4 p-6 md:p-8 border border-[#e5e7eb] bg-white rounded-[8px] hover:shadow-md transition-shadow duration-300">
                                <div className="w-12 h-12 rounded-[8px] bg-[#f5faff] border border-[#a8cce8]/40 flex items-center justify-center mb-2">
                                    <Shield className="w-6 h-6 text-[#106feb]" />
                                </div>
                                <h3 className="text-[22px] font-semibold leading-snug text-[#001122]">
                                    Akses Dasbor Aman (Tanpa Sandi)
                                </h3>
                                <p className="text-[16px] leading-relaxed text-[#001122]/60">
                                    Lupakan rutinitas mereset kata sandi. Gunakan sistem OTP (One Time Password) via Email/WA untuk login yang instan dan terenkripsi.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* 4.5. DAFTAR INSTANSI / OPD SECTION (WEBILD STYLE) */}
                <section id="instansi" className="py-24 px-6 relative z-10 bg-white border-t border-[#e5e7eb]">
                    <div className="max-w-[1200px] mx-auto">

                        {/* Section Header */}
                        <div className="flex flex-col items-center text-center gap-2 mb-12">
                            <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-[#e5e7eb] bg-[#f5faff] w-fit text-[#001122]/70 shadow-sm">
                                <p>Direktori Instansi</p>
                            </div>
                            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight leading-[1.15] text-[#001122] mb-4">
                                Temukan Tempat Magangmu
                            </h2>
                            <p className="text-[16px] md:text-[18px] text-[#001122]/60 max-w-2xl mx-auto leading-relaxed">
                                Pilih dari 35 instansi Pemerintah Kota Madiun. Ketik nama dinas atau badan pada kolom pencarian di bawah.
                            </p>
                        </div>

                        {/* Search Bar (Pill Shape) */}
                        <div className="flex justify-center mb-12">
                            <div className="relative w-full max-w-2xl group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#001122]/40 w-5 h-5 group-focus-within:text-[#106feb] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari dinas, badan, atau kecamatan..."
                                    className="w-full bg-[#f5faff] border border-[#e5e7eb] rounded-full py-4 pl-14 pr-6 text-[15px] text-[#001122] placeholder:text-[#001122]/40 focus:outline-none focus:border-[#a8cce8] focus:ring-4 focus:ring-[#a8cce8]/20 transition-all shadow-sm"
                                    onChange={(e) => setSearchOpd(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Grid Kartu OPD (Radius 8px) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredOPD.length > 0 ? (
                                filteredOPD.map((opd, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white border border-[#e5e7eb] rounded-[8px] p-6 hover:border-[#a8cce8] hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-full cursor-default"
                                    >
                                        <div className="flex items-start gap-4 mb-6">
                                            {/* Ikon Instansi dengan Radius 8px */}
                                            <div className="w-12 h-12 rounded-[8px] bg-[#f5faff] border border-[#e5e7eb] flex items-center justify-center shrink-0 group-hover:bg-[#106feb]/10 group-hover:border-[#106feb]/20 transition-colors duration-300">
                                                <Building2 className="w-6 h-6 text-[#106feb]" />
                                            </div>
                                            <h3 className="text-[15px] font-semibold text-[#001122] leading-[1.5] group-hover:text-[#106feb] transition-colors duration-300">
                                                {opd}
                                            </h3>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                /* Tampilan Jika OPD Tidak Ditemukan */
                                <div className="col-span-full text-center py-12 bg-[#f5faff] border border-dashed border-[#e5e7eb] rounded-[8px]">
                                    <p className="text-[15px] text-[#001122]/60">Instansi "{searchOpd}" tidak ditemukan. Coba kata kunci lain.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </section>



                {/* 5. ALUR PENDAFTARAN (TIMELINE) */}
                <section id="alur" className="py-20 border-t border-[#e5e7eb] bg-white">
                    <div className="max-w-[1200px] mx-auto px-6">

                        {/* Section Header */}
                        <div className="flex flex-col items-center text-center gap-2 mb-16">
                            <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-[#e5e7eb] bg-[#f5faff] w-fit text-[#001122]/70">
                                <p>Cara Kerja</p>
                            </div>
                            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight leading-[1.15] text-[#001122] max-w-2xl">
                                4 Langkah Menuju Penempatan
                            </h2>
                        </div>

                        {/* Grid 4 Kolom untuk Alur */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                            {/* Tahap 1 */}
                            <div className="flex flex-col relative group">
                                {/* Garis Penghubung (Hanya muncul di Desktop) */}
                                <div className="hidden lg:block absolute top-6 left-12 w-full h-[1px] bg-[#e5e7eb] -z-10 group-last:hidden"></div>

                                <div className="w-12 h-12 rounded-[8px] bg-[#f5faff] border border-[#a8cce8]/50 flex items-center justify-center mb-6 text-[#106feb] font-bold text-xl group-hover:bg-[#001122] group-hover:text-white transition-colors duration-300">
                                    1
                                </div>
                                <h3 className="text-[18px] font-semibold text-[#001122] mb-3">Isi Formulir Publik</h3>
                                <p className="text-[15px] text-[#001122]/60 leading-relaxed">
                                    Lengkapi data diri dan instansi tujuan Anda. Sistem akan langsung membuatkan akun secara otomatis untuk Anda.
                                </p>
                            </div>

                            {/* Tahap 2 */}
                            <div className="flex flex-col relative group">
                                <div className="hidden lg:block absolute top-6 left-12 w-full h-[1px] bg-[#e5e7eb] -z-10 group-last:hidden"></div>

                                <div className="w-12 h-12 rounded-[8px] bg-[#f5faff] border border-[#a8cce8]/50 flex items-center justify-center mb-6 text-[#106feb] font-bold text-xl group-hover:bg-[#001122] group-hover:text-white transition-colors duration-300">
                                    2
                                </div>
                                <h3 className="text-[18px] font-semibold text-[#001122] mb-3">Proses Verifikasi</h3>
                                <p className="text-[15px] text-[#001122]/60 leading-relaxed">
                                    Data Anda dievaluasi secara berjenjang oleh Admin Kominfo lalu diteruskan ke Admin OPD yang dituju.
                                </p>
                            </div>

                            {/* Tahap 3 */}
                            <div className="flex flex-col relative group">
                                <div className="hidden lg:block absolute top-6 left-12 w-full h-[1px] bg-[#e5e7eb] -z-10 group-last:hidden"></div>

                                <div className="w-12 h-12 rounded-[8px] bg-[#f5faff] border border-[#a8cce8]/50 flex items-center justify-center mb-6 text-[#106feb] font-bold text-xl group-hover:bg-[#001122] group-hover:text-white transition-colors duration-300">
                                    3
                                </div>
                                <h3 className="text-[18px] font-semibold text-[#001122] mb-3">Login OTP Dasbor</h3>
                                <p className="text-[15px] text-[#001122]/60 leading-relaxed">
                                    Akses dasbor personal Anda menggunakan Email/WA tanpa kata sandi untuk mengunduh surat persetujuan.
                                </p>
                            </div>

                            {/* Tahap 4 */}
                            <div className="flex flex-col relative group">
                                <div className="w-12 h-12 rounded-[8px] bg-[#f5faff] border border-[#a8cce8]/50 flex items-center justify-center mb-6 text-[#106feb] font-bold text-xl group-hover:bg-[#001122] group-hover:text-white transition-colors duration-300">
                                    4
                                </div>
                                <h3 className="text-[18px] font-semibold text-[#001122] mb-3">Sertifikat & Evaluasi</h3>
                                <p className="text-[15px] text-[#001122]/60 leading-relaxed">
                                    Unggah laporan tugas akhir Anda dan isi survei layanan untuk mendapatkan e-Sertifikat kelulusan resmi.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* 5.5. FAQ SECTION (WEBILD STYLE) */}
                <section id="faq" className="py-24 px-6 bg-[#f5faff]">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="flex flex-col items-center text-center gap-2 mb-16">
                            <div className="px-3 py-1 mb-1 text-[14px] rounded-full border border-[#e5e7eb] bg-white w-fit text-[#001122]/70 shadow-sm">
                                <p>Bantuan & FAQ</p>
                            </div>
                            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight text-[#001122]">
                                Pertanyaan Umum
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                { q: "Apa itu E-Magang Kota Madiun?", a: "Platform digital resmi untuk mempermudah pendaftaran, verifikasi, dan pemantauan status magang siswa/mahasiswa di lingkungan instansi Pemerintah Kota Madiun." },
                                { q: "Apakah pendaftaran dikenakan biaya?", a: "Tidak. Seluruh layanan di E-Magang Kota Madiun adalah gratis bagi seluruh pelajar dan mahasiswa." },
                                { q: "Berapa lama proses verifikasi berkas?", a: "Biasanya memakan waktu 2-3 hari kerja. Anda akan mendapatkan notifikasi status melalui email atau WhatsApp yang terdaftar." },
                                { q: "Bagaimana cara mendapatkan e-Sertifikat?", a: "Setelah selesai melaksanakan magang, pastikan Anda telah mengunggah laporan tugas akhir dan mengisi survei evaluasi di dasbor akun Anda." }
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="bg-white border border-[#e5e7eb] rounded-[8px] overflow-hidden hover:border-[#a8cce8] transition-all duration-300"
                                >
                                    <button
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                    >
                                        <span className="text-[16px] font-semibold text-[#001122]">{item.q}</span>
                                        <ChevronDown className={`w-5 h-5 text-[#106feb] transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-40 border-t border-[#f5faff]' : 'max-h-0'}`}>
                                        <p className="p-6 pt-2 text-[15px] text-[#001122]/60 leading-relaxed">
                                            {item.a}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 6. KONTAK & FORM PENDAFTARAN */}
                <section id="daftar" className="py-24 px-6 bg-[#f5faff] border-t border-[#e5e7eb]">
                    <div className="max-w-[1200px] mx-auto grid lg:grid-cols-12 gap-12 items-start">

                        {/* --- SISI KIRI: INFORMASI KONTAK --- */}
                        <div className="lg:col-span-5 flex flex-col gap-8">
                            <div>
                                <div className="px-3 py-1 mb-4 text-[14px] rounded-full border border-[#e5e7eb] bg-white w-fit text-[#001122]/70 shadow-sm">
                                    <p>Mulai Sekarang</p>
                                </div>
                                <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight leading-[1.15] text-[#001122] mb-4 text-balance">
                                    Siap Mendaftar?
                                </h2>
                                <p className="text-[16px] md:text-[18px] text-[#001122]/60 leading-relaxed text-balance">
                                    Lengkapi formulir di samping. Sistem terintegrasi kami akan membuatkan akun dan meneruskan berkas Anda ke meja verifikator.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4 items-start bg-white p-5 rounded-[8px] border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
                                    <MapPin className="w-6 h-6 text-[#106feb] shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-[16px] font-semibold text-[#001122] mb-1">Alamat Kantor</h4>
                                        <p className="text-[15px] text-[#001122]/60 leading-relaxed">Jl. Perintis Kemerdekaan No.32, Kota Madiun, Jawa Timur 63117</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center bg-white p-5 rounded-[8px] border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
                                    <Mail className="w-6 h-6 text-[#106feb] shrink-0" />
                                    <div>
                                        <h4 className="text-[16px] font-semibold text-[#001122] mb-1">Email Layanan</h4>
                                        <p className="text-[15px] text-[#001122]/60">kominfo@madiunkota.go.id</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center bg-white p-5 rounded-[8px] border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
                                    <Phone className="w-6 h-6 text-[#106feb] shrink-0" />
                                    <div>
                                        <h4 className="text-[16px] font-semibold text-[#001122] mb-1">Telepon</h4>
                                        <p className="text-[15px] text-[#001122]/60">(0351) 467327</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- SISI KANAN: FORMULIR PENGAJUAN --- */}
                        <div className="lg:col-span-7 bg-white border border-[#e5e7eb] rounded-[8px] p-6 md:p-10 shadow-sm relative overflow-hidden">
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
                                            {/* Anda bisa menggunakan map daftarOPD di sini seperti sebelumnya */}
                                            <option value="1">Dinas Komunikasi dan Informatika</option>
                                            <option value="2">Dinas Pendidikan</option>
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
                                            className="absolute left-0 top-0 bottom-0 bg-[#106feb]/10 transition-all duration-75"
                                            style={{ width: `${isCaptchaVerified ? 100 : sliderValue}%` }}
                                        ></div>

                                        {/* Teks Instruksi */}
                                        <div className="absolute w-full text-center z-0 text-[15px] font-medium select-none pointer-events-none transition-colors">
                                            {isCaptchaVerified ? (
                                                <span className="text-[#106feb] flex items-center justify-center gap-2">
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
                                            className={`absolute z-10 h-[44px] w-[70px] bg-white border border-[#e5e7eb] rounded-full flex items-center justify-center pointer-events-none transition-all duration-75 shadow-sm ${isCaptchaVerified ? 'border-[#106feb] bg-[#106feb]' : ''}`}
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
                                <button
                                    type="submit"
                                    disabled={!isCaptchaVerified}
                                    className={`w-full py-4 text-[16px] font-medium rounded-full flex items-center justify-center gap-2 transition-all duration-300 mt-6 ${
                                        isCaptchaVerified
                                        ? "bg-[#001122] text-white hover:bg-[#001122]/80 cursor-pointer shadow-md"
                                        : "bg-[#e5e7eb] text-[#001122]/40 cursor-not-allowed"
                                    }`}
                                >
                                    <Send className="w-5 h-5" />
                                    Kirim Berkas Pengajuan Magang
                                </button>

                            </form>
                        </div>
                    </div>
                </section>

                {/* 7. FOOTER */}
                <footer className="bg-white border-t border-[#e5e7eb] py-12 px-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-[#001122] flex items-center justify-center">
                                <Layout className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-[#001122]">E-Magang.</span>
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

