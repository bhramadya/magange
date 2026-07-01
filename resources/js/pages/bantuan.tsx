import { Head, Link, usePage } from '@inertiajs/react';
import {
    Search,
    ChevronDown,
    FileText,
    ShieldCheck,
    Building2,
    Award,
    MapPin,
    Phone,
    Mail,
    Clock,
    MessageCircle,
    HelpCircle,
    LifeBuoy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import MagangLayout, { mahasiswaNav, verifikatorNav, opdNav } from '@/layouts/magang-layout';
import type { MagangNavItem } from '@/layouts/magang-layout';
import type { MagangUser, UserRole } from '@/types/magang';

/* =========================================================================
 *  PUSAT BANTUAN (BANTUAN)
 *  Halaman bersama untuk semua role (Mahasiswa / Verifikator / OPD). Navigasi
 *  sidebar menyesuaikan role pengguna. Konten statis (FAQ + panduan + kontak)
 *  — tidak butuh data backend; props `user` cukup untuk header & nav.
 * ========================================================================= */

interface BantuanProps {
    user?: MagangUser;
}

// ---- Mock untuk pengembangan frontend (dihapus saat props backend tersedia) ----
const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Rangga Saputra',
    email: 'rangga.saputra@example.com',
    whatsapp_number: '081234567890',
    role: 'mahasiswa',
};

// Navigasi sidebar mengikuti role pengguna yang sedang login.
const NAV_BY_ROLE: Record<UserRole, MagangNavItem[]> = {
    mahasiswa: mahasiswaNav,
    admin_verifikator: verifikatorNav,
    admin_opd: opdNav,
};

/* ------------------------------- data konten ------------------------------ */

interface FlowStep {
    icon: LucideIcon;
    title: string;
    desc: string;
}

const FLOW_STEPS: FlowStep[] = [
    {
        icon: FileText,
        title: 'Ajukan Permohonan',
        desc: 'Isi formulir pengajuan online dan unggah surat pengantar dari kampus/sekolah. Anda akan menerima nomor tiket untuk pelacakan.',
    },
    {
        icon: ShieldCheck,
        title: 'Verifikasi Berkas',
        desc: 'Admin Verifikator memeriksa kelengkapan berkas, lalu meneruskan permohonan ke OPD tujuan yang sesuai.',
    },
    {
        icon: Building2,
        title: 'Keputusan OPD',
        desc: 'OPD tujuan menyetujui atau menolak. Bila disetujui, Anda mendapat penempatan divisi dan pembimbing lapangan.',
    },
    {
        icon: Award,
        title: 'Magang & Sertifikat',
        desc: 'Jalani magang sesuai periode. Setelah selesai, unggah laporan akhir dan isi survei untuk membuka e-sertifikat.',
    },
];

interface FaqItem {
    category: string;
    q: string;
    a: string;
}

const FAQS: FaqItem[] = [
    {
        category: 'Pengajuan',
        q: 'Bagaimana cara mengajukan permohonan magang?',
        a: 'Buka halaman "Ajukan Magang", lengkapi data diri, asal pendidikan, rencana magang, lalu unggah surat pengantar dari kampus/sekolah Anda (format PDF). Setelah dikirim, Anda akan menerima nomor tiket.',
    },
    {
        category: 'Pengajuan',
        q: 'Dokumen apa saja yang perlu disiapkan?',
        a: 'Surat pengantar dari institusi pendidikan bersifat wajib. Proposal magang dan CV bersifat opsional namun disarankan untuk memperkuat permohonan. Semua dokumen dalam format PDF.',
    },
    {
        category: 'Pengajuan',
        q: 'Apakah saya bisa mengajukan ke lebih dari satu OPD?',
        a: 'Permohonan diajukan satu kali. OPD tujuan ditetapkan oleh Admin Verifikator berdasarkan kesesuaian bidang. Anda tidak memilih OPD secara langsung pada formulir.',
    },
    {
        category: 'Verifikasi & OPD',
        q: 'Berapa lama proses verifikasi berlangsung?',
        a: 'Verifikasi berkas umumnya memerlukan 1–3 hari kerja. Setelah diteruskan ke OPD, keputusan persetujuan menyesuaikan kebijakan masing-masing OPD.',
    },
    {
        category: 'Verifikasi & OPD',
        q: 'Apa yang terjadi jika permohonan saya ditolak?',
        a: 'Anda akan melihat alasan penolakan pada halaman status. Anda dapat memperbaiki berkas sesuai catatan tersebut dan mengajukan permohonan baru.',
    },
    {
        category: 'Selama Magang',
        q: 'Bagaimana cara melacak status permohonan saya?',
        a: 'Gunakan menu "Pengajuan Saya" setelah login, atau halaman "Lacak Status" dengan memasukkan nomor tiket Anda untuk melihat perkembangan terbaru.',
    },
    {
        category: 'Selama Magang',
        q: 'Siapa pembimbing saya selama magang?',
        a: 'Pembimbing lapangan ditetapkan oleh OPD saat permohonan disetujui dan dapat dilihat pada detail penempatan di halaman "Pengajuan Saya".',
    },
    {
        category: 'Penyelesaian & Sertifikat',
        q: 'Bagaimana cara memperoleh e-sertifikat?',
        a: 'Pada halaman "Penyelesaian", unggah laporan akhir Anda. Setelah laporan divalidasi, isi survei wajib. e-Sertifikat akan terbuka untuk diunduh setelah survei selesai.',
    },
    {
        category: 'Penyelesaian & Sertifikat',
        q: 'Laporan akhir saya belum tervalidasi, apa yang harus dilakukan?',
        a: 'Validasi laporan dilakukan oleh pembimbing/OPD. Mohon menunggu proses ini. Anda akan dapat melanjutkan ke tahap survei setelah laporan disetujui.',
    },
    {
        category: 'Akun',
        q: 'Saya tidak menerima kode OTP saat login. Bagaimana?',
        a: 'Pastikan alamat email yang dimasukkan benar dan periksa folder spam. Tunggu hitungan mundur selesai, lalu gunakan tombol "Kirim Ulang". Jika tetap bermasalah, hubungi Dinas Kominfo.',
    },
];

/* --------------------------------- utils ---------------------------------- */

function matches(item: FaqItem, query: string): boolean {
    const q = query.trim().toLowerCase();

    if (!q) {
        return true;
    }

    return (item.q + ' ' + item.a + ' ' + item.category).toLowerCase().includes(q);
}

/* ------------------------------- komponen --------------------------------- */

function FaqRow({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
            >
                <span className="flex-1 text-sm font-semibold text-[#12213e]">{item.q}</span>
                <ChevronDown
                    className={`size-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {/* Animasi tinggi halus via grid-rows tanpa mengukur DOM. */}
            <div className={`grid transition-all duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </div>
            </div>
        </div>
    );
}

function ContactCard({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: string; href?: string }) {
    const body = (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#106feb]/40">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#cddcef]/50 text-[#106feb]">
                <Icon className="size-5" />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-0.5 text-sm font-semibold break-words text-[#12213e]">{value}</p>
            </div>
        </div>
    );

    if (href) {
        return (
            <a href={href} target="_blank" rel="noreferrer">
                {body}
            </a>
        );
    }

    return body;
}

/* --------------------------------- page ----------------------------------- */

export default function Bantuan({ user = MOCK_USER }: BantuanProps) {
    const [query, setQuery] = useState('');
    const [openKey, setOpenKey] = useState<string | null>(null);

    // Halaman Bantuan dipakai bersama semua peran lewat satu rute `/bantuan`.
    // Selama pratinjau (belum ada auth), peran dibawa via query `?role=` dari
    // sidebar tiap dasbor agar menu sidebar tetap sesuai peran asal — tanpa ini
    // props `user` default ke mock mahasiswa dan sidebar "pindah" ke mahasiswa.
    // Saat backend siap, `user.role` asli jadi acuan bila query tak ada.
    const { url } = usePage();
    const roleFromQuery = new URLSearchParams(url.split('?')[1] ?? '').get('role');
    const effectiveRole: UserRole = roleFromQuery && roleFromQuery in NAV_BY_ROLE ? (roleFromQuery as UserRole) : user.role;

    const navItems = NAV_BY_ROLE[effectiveRole] ?? mahasiswaNav;

    // Kelompokkan FAQ per kategori setelah difilter pencarian.
    const grouped = useMemo(() => {
        const result: Record<string, FaqItem[]> = {};

        for (const item of FAQS) {
            if (!matches(item, query)) {
                continue;
            }

            (result[item.category] ??= []).push(item);
        }

        return result;
    }, [query]);

    const hasResults = Object.keys(grouped).length > 0;

    return (
        <MagangLayout user={user} title="Pusat Bantuan" active="bantuan" navItems={navItems}>
            <Head title="Pusat Bantuan" />

            <div className="space-y-8">
                {/* ===== Hero + pencarian ===== */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#106feb] to-[#0b4fb0] px-6 py-8 text-white sm:px-10 sm:py-10"
                >
                    <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                        <LifeBuoy className="size-4" />
                        Pusat Bantuan E-Magang
                    </div>
                    <h2 className="mt-3 text-2xl font-black sm:text-3xl">Ada yang bisa kami bantu?</h2>
                    <p className="mt-2 max-w-xl text-sm text-white/80">
                        Temukan jawaban seputar pengajuan, verifikasi, hingga penerbitan sertifikat magang di lingkungan Pemerintah Kota Madiun.
                    </p>

                    <div className="relative mt-6 max-w-xl">
                        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari pertanyaan, mis. 'sertifikat' atau 'OTP'…"
                            className="w-full rounded-2xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-[#12213e] shadow-lg outline-none ring-2 ring-transparent placeholder:text-slate-400 focus:ring-white/60"
                        />
                    </div>
                </motion.section>

                {/* ===== Panduan alur magang ===== */}
                <section>
                    <h3 className="text-lg font-bold text-[#12213e]">Panduan Alur Magang</h3>
                    <p className="mt-1 text-sm text-slate-500">Empat tahap utama dari pengajuan hingga sertifikat.</p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {FLOW_STEPS.map((step, i) => {
                            const Icon = step.icon;

                            return (
                                <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-5">
                                    <span className="absolute right-4 top-4 text-3xl font-black text-slate-100">{i + 1}</span>
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#cddcef]/50 text-[#106feb]">
                                        <Icon className="size-5" />
                                    </span>
                                    <p className="mt-4 text-sm font-bold text-[#12213e]">{step.title}</p>
                                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{step.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ===== FAQ ===== */}
                <section>
                    <h3 className="text-lg font-bold text-[#12213e]">Pertanyaan yang Sering Diajukan</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {query.trim()
                            ? `Hasil pencarian untuk "${query.trim()}"`
                            : 'Pilih pertanyaan untuk melihat jawabannya.'}
                    </p>

                    {hasResults ? (
                        <div className="mt-4 space-y-6">
                            {Object.entries(grouped).map(([category, items]) => (
                                <div key={category}>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{category}</p>
                                    <div className="space-y-2.5">
                                        {items.map((item) => {
                                            const key = item.q;

                                            return (
                                                <FaqRow
                                                    key={key}
                                                    item={item}
                                                    open={openKey === key}
                                                    onToggle={() => setOpenKey(openKey === key ? null : key)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <HelpCircle className="size-6" />
                            </span>
                            <p className="mt-3 text-sm font-semibold text-[#12213e]">Tidak ada hasil untuk "{query.trim()}"</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Coba kata kunci lain, atau hubungi kami langsung di bawah ini.
                            </p>
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="mt-4 rounded-xl bg-[#106feb] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0b4fb0]"
                            >
                                Tampilkan semua pertanyaan
                            </button>
                        </div>
                    )}
                </section>

                {/* ===== Kontak ===== */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold text-[#12213e]">Masih butuh bantuan?</h3>
                        <p className="text-sm text-slate-500">
                            Hubungi Dinas Komunikasi dan Informatika Kota Madiun pada jam operasional.
                        </p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <ContactCard
                            icon={MapPin}
                            label="Alamat"
                            value="Jl. Perintis Kemerdekaan No. 32, Kota Madiun, Jawa Timur"
                        />
                        <ContactCard icon={Phone} label="Telepon" value="(0351) 467-327" href="tel:0351467327" />
                        <ContactCard icon={Mail} label="Email" value="kominfo@madiunkota.go.id" href="mailto:kominfo@madiunkota.go.id" />
                        <ContactCard icon={Clock} label="Jam Operasional" value="Senin–Jumat, 07.30–16.00 WIB" />
                    </div>

                    <a
                        href="https://wa.me/6281234567890"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                        <MessageCircle className="size-4" />
                        Chat via WhatsApp
                    </a>
                </section>

                {/* Pintasan navigasi cepat */}
                <p className="text-center text-sm text-slate-500">
                    Siap mengajukan magang?{' '}
                    <Link href="/pengajuan" className="font-semibold text-[#106feb] hover:underline">
                        Lihat pengajuan saya
                    </Link>
                </p>
            </div>
        </MagangLayout>
    );
}
