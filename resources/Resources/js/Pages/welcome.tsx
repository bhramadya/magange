import MainLayout from "../Layouts/MainLayout";
import { Head } from '@inertiajs/react';
import { Globe, ChevronDown, Rocket, Shield, Terminal, Building2, Search, ArrowRight, UserPlus, ShieldCheck, KeyRound, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';


export default function Welcome() {
    // 1. State Navbar
    const [scrolled, setScrolled] = useState(false);

    // 2. State Fitur Pencarian OPD
    const [searchOpd, setSearchOpd] = useState("");

    // 3. Daftar Lengkap 35 OPD Kota Madiun
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

    // Logika Filter Pencarian
    const filteredOPD = daftarOPD.filter(opd => opd.toLowerCase().includes(searchOpd.toLowerCase()));

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Head title="E-Magang - Dinas Kominfo Kota Madiun" />

            {/* Latar Belakang Cosmic Canvas / Deep Indigo */}
            <div className="min-h-screen bg-deep-indigo text-paper-white font-alibabapuhuiti-2 selection:bg-mint-pulse selection:text-carbon overflow-hidden relative">

                {/* 1. ANNOUNCEMENT BAR (Sesuai Referensi) */}
                {/* <div className="w-full bg-signal-violet py-2 text-center text-caption md:text-body-sm text-paper-white relative z-50">
                    <span className="opacity-90">Sistem E-Magang Diskominfo Kota Madiun telah resmi diluncurkan! </span>
                    <a href="#daftar" className="underline decoration-mint-pulse underline-offset-4 hover:text-mint-pulse transition-colors font-bold ml-1">
                        Pelajari lebih lanjut.
                    </a>
                </div> */}

                {/* 2. NAVIGATION BAR */}
                <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-deep-indigo/95 backdrop-blur-md border-b border-signal-violet/30 py-4' : 'bg-transparent py-6'}`}>
                    <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-mint-pulse flex items-center justify-center">
                                <Terminal className="w-5 h-5 text-deep-indigo" />
                            </div>
                            <span className="font-extrabold text-heading-sm tracking-wide">E-Magang</span>
                        </div>

                        {/* Center Links */}
                        <div className="hidden lg:flex items-center gap-8 text-body font-medium text-paper-white">
                            <a href="#alur" className="flex items-center gap-1 hover:text-mint-pulse transition-colors">
                                Alur Pendaftaran <ChevronDown className="w-4 h-4 opacity-70" />
                            </a>
                            <a href="#bidang" className="flex items-center gap-1 hover:text-mint-pulse transition-colors">
                                Bidang OPD <ChevronDown className="w-4 h-4 opacity-70" />
                            </a>
                            <a href="#faq" className="hover:text-mint-pulse transition-colors">FAQ</a>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-6">
                            <button className="hidden md:flex items-center gap-2 text-body-sm hover:text-mint-pulse transition-colors">
                                <Globe className="w-4 h-4" />
                                <span>Indonesia</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>

                            {/* Pill Ghost Button */}
                            <button className="px-6 py-2.5 rounded-full-2 border-2 border-mint-pulse text-mint-pulse font-bold text-body hover:bg-mint-pulse hover:text-deep-indigo transition-colors duration-300">
                                Masuk / Daftar
                            </button>
                        </div>
                    </div>
                </nav>

                {/* 3. HERO SECTION */}
                <section className="relative pt-[180px] pb-[113px] flex flex-col items-center text-center px-6 min-h-[90vh] justify-center">

                    {/* Background Gradients untuk Kedalaman Kosmik */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-signal-violet/30 rounded-full blur-[120px] pointer-events-none"></div>

                    {/* Konten Teks Hero */}
                    <div className="relative z-10 max-w-[1200px] mx-auto flex flex-col items-center">
                        <h1 className="text-[56px] md:text-display font-[800] leading-[1.0] text-paper-white mb-6 max-w-4xl tracking-tight">
                            Mulai Petualangan <br /> Karir Digitalmu
                        </h1>
                        <p className="text-subheading font-[400] text-mint-pulse mb-12 max-w-2xl">
                            Kelola pendaftaran, temukan bidang penempatan yang tepat, dan selesaikan magangmu di Dinas Kominfo Kota Madiun dalam satu platform terpusat.
                        </p>

                        {/* Pill Primary Button */}
                        <button className="px-8 py-4 bg-mint-pulse text-deep-indigo font-bold text-[18px] rounded-full-2 hover:bg-paper-white transition-colors duration-300 shadow-[0_0_20px_rgba(121,239,189,0.3)]">
                            Ajukan Magang Sekarang
                        </button>
                    </div>

                    {/* 4. ELEMEN ISOMETRIK MELAYANG (Mockup) */}
                    {/* Karena kita belum memiliki aset gambar 3D-nya, kita buat visualisasinya menggunakan elemen CSS dan Icon */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                        {/* Elemen Kiri Atas */}
                        <div className="absolute top-[20%] left-[10%] animate-float">
                            <div className="w-24 h-24 bg-carbon/80 border border-signal-violet rounded-3xl flex items-center justify-center rotate-12 backdrop-blur-sm">
                                <Rocket className="w-10 h-10 text-mint-pulse" />
                            </div>
                        </div>

                        {/* Elemen Kanan Tengah */}
                        <div className="absolute top-[40%] right-[12%] animate-float-delayed">
                            <div className="w-32 h-40 bg-carbon/90 border-2 border-mint-pulse rounded-2xl flex flex-col items-center justify-center -rotate-12 backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 w-full h-8 bg-signal-violet/20 border-b border-signal-violet/50"></div>
                                <Shield className="w-12 h-12 text-paper-white mt-4" />
                            </div>
                        </div>

                        {/* Elemen Kiri Bawah (Kecil) */}
                        <div className="absolute bottom-[25%] left-[20%] animate-float-delayed">
                            <div className="w-12 h-12 bg-mint-pulse rounded-xl rotate-45 opacity-80"></div>
                        </div>
                    </div>

                </section>

                {/* 4. DAFTAR INSTANSI / OPD SECTION */}
                <section id="bidang" className="py-[113px] px-6 relative z-10 border-t border-signal-violet/20 bg-deep-indigo">
                    <div className="max-w-[1200px] mx-auto">

                        {/* Judul Section (Sesuai Aturan SafePal: 48px, Weight 800, Centered) */}
                        <div className="text-center mb-[80px]">
                            <h2 className="text-[32px] md:text-[48px] font-[800] text-paper-white leading-[1.17] mb-4">
                                Temukan Tempat Magangmu
                            </h2>
                            <p className="text-[16px] md:text-[18px] font-[400] text-steel-gray max-w-2xl mx-auto leading-[1.56]">
                                Pilih dari 35 instansi Pemerintah Kota Madiun yang tersedia. Ketik nama dinas atau badan pada kolom pencarian di bawah untuk menemukan tujuan secara cepat.
                            </p>
                        </div>

                        {/* Search Bar (Radius 100px Pill) */}
                        <div className="flex justify-center mb-12">
                            <div className="relative w-full max-w-2xl">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-steel-gray w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Cari dinas, badan, atau kecamatan..."
                                    className="w-full bg-carbon border-2 border-signal-violet/30 rounded-full-2 py-4 pl-14 pr-6 text-paper-white placeholder:text-steel-gray focus:outline-none focus:border-mint-pulse focus:bg-deep-indigo transition-all duration-300 text-[16px]"
                                    onChange={(e) => setSearchOpd(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Grid Kartu OPD (Radius 24px, Tanpa Shadow) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredOPD.length > 0 ? (
                                filteredOPD.map((opd, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-carbon border border-signal-violet/20 rounded-[24px] p-6 hover:border-mint-pulse transition-colors duration-300 group flex flex-col justify-between h-full cursor-default"
                                    >
                                        <div className="flex items-start gap-4 mb-8">
                                            {/* Ikon Instansi dengan Radius 12px (Bawaan SafePal Nav Radius) */}
                                            <div className="w-12 h-12 rounded-[12px] bg-signal-violet/10 border border-signal-violet/30 flex items-center justify-center shrink-0 group-hover:bg-mint-pulse/10 group-hover:border-mint-pulse transition-colors duration-300">
                                                <Building2 className="w-6 h-6 text-mint-pulse" />
                                            </div>
                                            <h3 className="text-[16px] font-[700] text-paper-white leading-[1.5] group-hover:text-mint-pulse transition-colors duration-300">
                                                {opd}
                                            </h3>
                                        </div>

                                        {/* Status Badge (12px radius, Mint fill) */}
                                        <div className="flex justify-between items-end mt-auto">
                                            <span className="inline-flex items-center px-3 py-1.5 bg-mint-pulse/10 text-mint-pulse text-[12px] font-[700] rounded-full border border-mint-pulse/20">
                                                Tersedia
                                            </span>
                                            <ArrowRight className="w-5 h-5 text-signal-violet group-hover:text-mint-pulse group-hover:translate-x-1 transition-all duration-300" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                /* Tampilan Jika OPD Tidak Ditemukan */
                                <div className="col-span-full text-center py-12 border border-dashed border-signal-violet/30 rounded-[24px]">
                                    <p className="text-[16px] text-steel-gray">Instansi "{searchOpd}" tidak ditemukan. Coba kata kunci lain.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </section>

                {/* 5. ALUR PENDAFTARAN (VIOLET SECTION BANNER) */}
                {/* Menggunakan full-bleed Signal Violet background sesuai Design System */}
                <section id="alur" className="py-[113px] px-6 relative z-10 bg-signal-violet">
                    <div className="max-w-[1200px] mx-auto">

                        {/* Heading Section */}
                        <div className="text-center mb-[80px]">
                            <h2 className="text-[32px] md:text-[48px] font-[800] text-paper-white leading-[1.17] mb-4">
                                Alur Integrasi E-Magang
                            </h2>
                            <p className="text-[16px] md:text-[18px] font-[400] text-paper-white/80 max-w-2xl mx-auto leading-[1.56]">
                                Mulai dari pengisian formulir hingga sertifikat kelulusan. Kami memotong birokrasi manual dan menggantinya dengan otomatisasi penuh.
                            </p>
                        </div>

                        {/* Grid 4 Kolom Alur (Kartu Putih di Atas Latar Ungu) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                            {/* Tahap 1 */}
                            <div className="bg-paper-white rounded-[24px] p-6 md:p-8 flex flex-col relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                                {/* Watermark Angka Besar di Belakang */}
                                <span className="absolute -right-4 -top-8 text-[120px] font-[900] text-lavender-mist/50 pointer-events-none select-none z-0">
                                    1
                                </span>

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-[12px] bg-lavender-mist flex items-center justify-center mb-6 group-hover:bg-signal-violet group-hover:scale-110 transition-all duration-300">
                                        <UserPlus className="w-6 h-6 text-signal-violet group-hover:text-paper-white transition-colors" />
                                    </div>
                                    <h3 className="text-[20px] md:text-[24px] font-[800] text-carbon mb-3 leading-[1.2]">
                                        Daftar & Otomasi Akun
                                    </h3>
                                    <p className="text-[14px] md:text-[16px] text-steel-gray font-[400] leading-[1.57]">
                                        Isi formulir pengajuan publik dan lewati validasi Captcha. Sistem akan mendeteksi Email/WA Anda dan membuatkan akun secara otomatis.
                                    </p>
                                </div>
                            </div>

                            {/* Tahap 2 */}
                            <div className="bg-paper-white rounded-[24px] p-6 md:p-8 flex flex-col relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                                <span className="absolute -right-4 -top-8 text-[120px] font-[900] text-lavender-mist/50 pointer-events-none select-none z-0">
                                    2
                                </span>

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-[12px] bg-lavender-mist flex items-center justify-center mb-6 group-hover:bg-signal-violet group-hover:scale-110 transition-all duration-300">
                                        <ShieldCheck className="w-6 h-6 text-signal-violet group-hover:text-paper-white transition-colors" />
                                    </div>
                                    <h3 className="text-[20px] md:text-[24px] font-[800] text-carbon mb-3 leading-[1.2]">
                                        Verifikasi Bertingkat
                                    </h3>
                                    <p className="text-[14px] md:text-[16px] text-steel-gray font-[400] leading-[1.57]">
                                        Data dievaluasi oleh Admin Verifikator, lalu diteruskan ke Admin OPD terkait. Jika disetujui, PDF persetujuan dikirim otomatis ke Email.
                                    </p>
                                </div>
                            </div>

                            {/* Tahap 3 */}
                            <div className="bg-paper-white rounded-[24px] p-6 md:p-8 flex flex-col relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                                <span className="absolute -right-4 -top-8 text-[120px] font-[900] text-lavender-mist/50 pointer-events-none select-none z-0">
                                    3
                                </span>

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-[12px] bg-lavender-mist flex items-center justify-center mb-6 group-hover:bg-signal-violet group-hover:scale-110 transition-all duration-300">
                                        <KeyRound className="w-6 h-6 text-signal-violet group-hover:text-paper-white transition-colors" />
                                    </div>
                                    <h3 className="text-[20px] md:text-[24px] font-[800] text-carbon mb-3 leading-[1.2]">
                                        Login Dasbor via OTP
                                    </h3>
                                    <p className="text-[14px] md:text-[16px] text-steel-gray font-[400] leading-[1.57]">
                                        Akses dasbor tanpa menghafal kata sandi. Cukup masukkan email, terima kode OTP (One Time Password), dan pantau status tiket Anda secara real-time.
                                    </p>
                                </div>
                            </div>

                            {/* Tahap 4 */}
                            <div className="bg-paper-white rounded-[24px] p-6 md:p-8 flex flex-col relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                                <span className="absolute -right-4 -top-8 text-[120px] font-[900] text-lavender-mist/50 pointer-events-none select-none z-0">
                                    4
                                </span>

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-[12px] bg-lavender-mist flex items-center justify-center mb-6 group-hover:bg-signal-violet group-hover:scale-110 transition-all duration-300">
                                        <GraduationCap className="w-6 h-6 text-signal-violet group-hover:text-paper-white transition-colors" />
                                    </div>
                                    <h3 className="text-[20px] md:text-[24px] font-[800] text-carbon mb-3 leading-[1.2]">
                                        Sertifikat & Evaluasi
                                    </h3>
                                    <p className="text-[14px] md:text-[16px] text-steel-gray font-[400] leading-[1.57]">
                                        Unggah laporan akhir magang Anda. Isi form survei kepuasan dengan rating bintang untuk membuka kunci unduhan e-sertifikat resmi Anda.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* 6. KONTAK & FORM PENDAFTARAN */}
                <section id="daftar" className="py-[113px] px-6 relative z-10 bg-deep-indigo">
                    <div className="max-w-[1200px] mx-auto grid lg:grid-cols-12 gap-12 items-start">

                        {/* --- SISI KIRI: INFORMASI KONTAK --- */}
                        <div className="lg:col-span-5 space-y-12">
                            <div>
                                <h2 className="text-[32px] md:text-[48px] font-[800] text-paper-white leading-[1.17] mb-4 tracking-tight">
                                    Siap Bergabung?
                                </h2>
                                <p className="text-[16px] font-[400] text-steel-gray leading-[1.57]">
                                    Lengkapi formulir di samping dengan data yang valid. Sistem kami yang terintegrasi akan langsung membuatkan akun untuk Anda dan meneruskan berkas ke meja verifikator.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-4 items-start bg-carbon p-6 rounded-[24px] border border-signal-violet/20">
                                    <MapPin className="w-6 h-6 text-mint-pulse shrink-0" />
                                    <div>
                                        <h4 className="text-[14px] font-[700] text-paper-white mb-1">Alamat Kantor</h4>
                                        <p className="text-[14px] font-[400] text-steel-gray leading-[1.5]">Jl. Perintis Kemerdekaan No.32, Kota Madiun, Jawa Timur 63117</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center bg-carbon p-6 rounded-[24px] border border-signal-violet/20">
                                    <Mail className="w-6 h-6 text-mint-pulse shrink-0" />
                                    <div>
                                        <h4 className="text-[14px] font-[700] text-paper-white mb-1">Email Layanan</h4>
                                        <p className="text-[14px] font-[400] text-steel-gray leading-[1.5]">kominfo@madiunkota.go.id</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center bg-carbon p-6 rounded-[24px] border border-signal-violet/20">
                                    <Phone className="w-6 h-6 text-mint-pulse shrink-0" />
                                    <div>
                                        <h4 className="text-[14px] font-[700] text-paper-white mb-1">Telepon</h4>
                                        <p className="text-[14px] font-[400] text-steel-gray leading-[1.5]">(0351) 467327</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- SISI KANAN: FORMULIR PENGAJUAN (CARD) --- */}
                        <div className="lg:col-span-7 bg-carbon border border-signal-violet/30 rounded-[24px] p-8 md:p-10 relative overflow-hidden">
                            {/* Efek Cahaya Halus di Pojok Kanan Form */}
                            <div className="absolute -right-20 -top-20 w-[300px] h-[300px] bg-signal-violet/10 rounded-full blur-[80px] pointer-events-none"></div>

                            <form onSubmit={(e) => e.preventDefault()} className="space-y-6 relative z-10">

                                <div className="grid sm:grid-cols-2 gap-6">
                                    {/* Input: Instansi Asal */}
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-[700] text-steel-gray uppercase tracking-widest pl-4">Asal Kampus / Sekolah</label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Universitas Brawijaya"
                                            className="w-full bg-deep-indigo border-2 border-signal-violet/20 rounded-[100px] px-6 py-3.5 text-[14px] text-paper-white placeholder:text-steel-gray focus:outline-none focus:border-mint-pulse transition-colors"
                                        />
                                    </div>
                                    {/* Input: Tujuan Bidang */}
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-[700] text-steel-gray uppercase tracking-widest pl-4">Tujuan Bidang OPD</label>
                                        {/* Menggunakan custom select agar bentuknya mengikuti pill shape 100px */}
                                        <select className="w-full bg-deep-indigo border-2 border-signal-violet/20 rounded-[100px] px-6 py-3.5 text-[14px] text-steel-gray focus:text-paper-white focus:outline-none focus:border-mint-pulse transition-colors appearance-none cursor-pointer">
                                            <option value="">-- Pilih Instansi / Bidang --</option>
                                            {daftarOPD.map((opd, idx) => (
                                                <option key={idx} value={opd} className="bg-carbon text-paper-white">{opd}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Input: Durasi & Tanggal */}
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-[700] text-steel-gray uppercase tracking-widest pl-4">Tanggal Mulai</label>
                                        <input
                                            type="date"
                                            className="w-full bg-deep-indigo border-2 border-signal-violet/20 rounded-[100px] px-6 py-3.5 text-[14px] text-steel-gray focus:text-paper-white focus:outline-none focus:border-mint-pulse transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-[700] text-steel-gray uppercase tracking-widest pl-4">Tanggal Selesai</label>
                                        <input
                                            type="date"
                                            className="w-full bg-deep-indigo border-2 border-signal-violet/20 rounded-[100px] px-6 py-3.5 text-[14px] text-steel-gray focus:text-paper-white focus:outline-none focus:border-mint-pulse transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                {/* Input: Nama Pembimbing */}
                                <div className="space-y-2">
                                    <label className="text-[12px] font-[700] text-steel-gray uppercase tracking-widest pl-4">Nama Dosen / Guru Pembimbing</label>
                                    <input
                                        type="text"
                                        placeholder="Nama lengkap pembimbing berserta gelar"
                                        className="w-full bg-deep-indigo border-2 border-signal-violet/20 rounded-[100px] px-6 py-3.5 text-[14px] text-paper-white placeholder:text-steel-gray focus:outline-none focus:border-mint-pulse transition-colors"
                                    />
                                </div>

                                {/* Input: Keamanan Akun (Sesuai PRD) */}
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-[700] text-steel-gray uppercase tracking-widest pl-4">Nomor WhatsApp</label>
                                        <input
                                            type="tel"
                                            pattern="[0-9]*"
                                            placeholder="Contoh: 081234567890"
                                            className="w-full bg-deep-indigo border-2 border-signal-violet/20 rounded-[100px] px-6 py-3.5 text-[14px] text-paper-white placeholder:text-steel-gray focus:outline-none focus:border-mint-pulse transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-[700] text-steel-gray uppercase tracking-widest pl-4">Email Aktif</label>
                                        <input
                                            type="email"
                                            placeholder="Gunakan email utama Anda"
                                            className="w-full bg-deep-indigo border-2 border-signal-violet/20 rounded-[100px] px-6 py-3.5 text-[14px] text-paper-white placeholder:text-steel-gray focus:outline-none focus:border-mint-pulse transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* --- CUSTOM SLIDER CAPTCHA (SafePal Pill Style) --- */}
                                <div className="mt-8 pt-6 border-t border-signal-violet/20">
                                    <div className="flex justify-between items-center mb-4 px-2">
                                        <span className="text-[12px] font-[700] text-steel-gray uppercase tracking-widest">Validasi Anti-Spam</span>
                                    </div>

                                    {/* Track Slider Captcha */}
                                    <div className="relative w-full h-[56px] bg-deep-indigo border-2 border-signal-violet/30 rounded-[100px] overflow-hidden flex items-center group">

                                        {/* Background Pengisi yang Mengikuti Laju Slider */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 bg-mint-pulse/20 transition-all duration-75"
                                            style={{ width: `${isCaptchaVerified ? 100 : sliderValue}%` }}
                                        ></div>

                                        {/* Teks Instruksi di Tengah */}
                                        <div className="absolute w-full text-center z-0 text-[14px] font-[800] uppercase tracking-wider select-none pointer-events-none">
                                            {isCaptchaVerified ? (
                                                <span className="text-mint-pulse flex items-center justify-center gap-2">
                                                    <CheckCircle2 className="w-5 h-5" /> Terverifikasi
                                                </span>
                                            ) : (
                                                <span className="text-steel-gray group-hover:text-paper-white/50 transition-colors">
                                                    Geser untuk memverifikasi &gt;&gt;&gt;
                                                </span>
                                            )}
                                        </div>

                                        {/* Input Range Murni (Invisible) untuk Interaksi Mulus */}
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={isCaptchaVerified ? 100 : sliderValue}
                                            onChange={handleSliderChange}
                                            disabled={isCaptchaVerified}
                                            className={`absolute z-20 w-full h-full opacity-0 cursor-ew-resize ${isCaptchaVerified ? 'pointer-events-none' : ''}`}
                                        />

                                        {/* Thumb/Gagang Slider Custom (Bentuk Pil) */}
                                        <div
                                            className={`absolute z-10 h-[44px] w-[72px] bg-mint-pulse rounded-[100px] flex items-center justify-center pointer-events-none transition-all duration-75 shadow-sm ${isCaptchaVerified ? 'bg-terminal-green' : ''}`}
                                            style={{
                                                // Kalkulasi agar Thumb tidak keluar jalur saat berada di angka 100%
                                                left: `calc(${isCaptchaVerified ? 100 : sliderValue}% - ${isCaptchaVerified ? 76 : (sliderValue * 0.76) + 4}px)`
                                            }}
                                        >
                                            {isCaptchaVerified ? (
                                                <CheckCircle2 className="w-6 h-6 text-carbon" />
                                            ) : (
                                                <ArrowRight className="w-6 h-6 text-carbon" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tombol Submit Utama */}
                                <button
                                    type="submit"
                                    disabled={!isCaptchaVerified}
                                    className={`w-full py-4 text-[16px] font-[800] rounded-[100px] flex items-center justify-center gap-2 transition-all duration-300 mt-8 ${
                                        isCaptchaVerified
                                        ? "bg-mint-pulse text-carbon hover:bg-paper-white hover:scale-[1.02] cursor-pointer"
                                        : "bg-signal-violet/20 text-steel-gray border border-signal-violet/30 cursor-not-allowed"
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
                <footer className="border-t border-signal-violet/20 px-6 py-12 bg-deep-indigo text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Terminal className="w-5 h-5 text-mint-pulse" />
                        <span className="font-[800] text-[18px] text-paper-white tracking-widest uppercase">E-Magang</span>
                    </div>
                    <p className="text-[14px] text-steel-gray font-[400] max-w-md mx-auto">
                        © {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kota Madiun.<br/>
                        Terintegrasi dan dijamin keamanannya.
                    </p>
                </footer>

            </div>
        </MainLayout>
    );
};

export default MyPage;
