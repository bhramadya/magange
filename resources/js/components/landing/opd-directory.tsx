import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, X, Building2, Users } from 'lucide-react';
import { Reveal, staggerContainer, staggerItem } from '@/components/animations';

interface OpdData {
    id: number;
    name: string;
    code: string;
    quota: number;
    quota_used: number;
}

interface OpdDirectoryProps {
    opds: OpdData[];
}

const daftarOPD: { name: string; tags: string[] }[] = [
    { name: 'BADAN KEPEGAWAIAN DAERAH', tags: ['SDM / Kepegawaian', 'Administrasi'] },
    { name: 'BADAN KESATUAN BANGSA DAN POLITIK', tags: ['Politik & Pemerintahan', 'Sosial'] },
    { name: 'BADAN PENANGGULANGAN BENCANA DAERAH', tags: ['Manajemen Bencana', 'Kesehatan'] },
    { name: 'BADAN PENDAPATAN DAERAH', tags: ['Akuntansi', 'Perpajakan'] },
    { name: 'BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH', tags: ['Akuntansi', 'Administrasi'] },
    { name: 'BADAN PERENCANAAN DAN PEMBANGUNAN DAERAH', tags: ['Perencanaan', 'Analisis Data'] },
    { name: 'BAGIAN HUKUM', tags: ['Hukum', 'Administrasi'] },
    { name: 'BAGIAN ORGANISASI', tags: ['Manajemen', 'Administrasi'] },
    { name: 'BAGIAN PEMERINTAHAN UMUM', tags: ['Administrasi Publik', 'Pemerintahan'] },
    { name: 'BAGIAN PENGADAAN BARANG/JASA DAN ADMINISTRASI PEMBANGUNAN', tags: ['Pengadaan', 'Administrasi'] },
    { name: 'BAGIAN PEREKONOMIAN DAN KESEJAHTERAAN RAKYAT', tags: ['Ekonomi', 'Sosial'] },
    { name: 'BAGIAN UMUM', tags: ['Tata Usaha', 'Administrasi'] },
    { name: 'DINAS KEBUDAYAAN, PARIWISATA, KEPEMUDAAN DAN OLAHRAGA', tags: ['Pariwisata', 'Seni & Budaya'] },
    { name: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL', tags: ['Administrasi Publik', 'Manajemen Data'] },
    { name: 'DINAS KESEHATAN DAN KELUARGA BERENCANA', tags: ['Kesehatan', 'Administrasi Publik'] },
    { name: 'DINAS KOMUNIKASI DAN INFORMATIKA', tags: ['IT / Software', 'Humas & Jurnalistik'] },
    { name: 'DINAS LINGKUNGAN HIDUP', tags: ['Lingkungan', 'Sains'] },
    { name: 'DINAS PEKERJAAN UMUM DAN TATA RUANG', tags: ['Teknik Sipil', 'Arsitektur'] },
    { name: 'DINAS PENANAMAN MODAL, PELAYANAN TERPADU SATU PINTU, KOPERASI DAN USAHA MIKRO', tags: ['Ekonomi', 'Pelayanan Publik'] },
    { name: 'DINAS PENDIDIKAN', tags: ['Pendidikan', 'Administrasi'] },
    { name: 'DINAS PERDAGANGAN', tags: ['Ekonomi', 'Bisnis'] },
    { name: 'DINAS PERHUBUNGAN', tags: ['Transportasi', 'Teknik'] },
    { name: 'DINAS PERPUSTAKAAN DAN KEARSIPAN', tags: ['Kearsipan', 'Literasi'] },
    { name: 'DINAS PERTANIAN DAN KETAHANAN PANGAN', tags: ['Pertanian', 'Sains'] },
    { name: 'DINAS PERUMAHAN DAN KAWASAN PERMUKIMAN', tags: ['Teknik Sipil', 'Tata Ruang'] },
    { name: 'DINAS SOSIAL, PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK', tags: ['Sosial', 'Pemberdayaan'] },
    { name: 'DINAS TENAGA KERJA', tags: ['SDM / Kepegawaian', 'Sosial'] },
    { name: 'INSPEKTORAT', tags: ['Audit', 'Akuntansi'] },
    { name: 'KECAMATAN KARTOHARJO', tags: ['Pemerintahan', 'Pelayanan Publik'] },
    { name: 'KECAMATAN MANGUHARJO', tags: ['Pemerintahan', 'Pelayanan Publik'] },
    { name: 'KECAMATAN TAMAN', tags: ['Pemerintahan', 'Pelayanan Publik'] },
    { name: 'RUMAH SAKIT UMUM DAERAH', tags: ['Kesehatan', 'Administrasi'] },
    { name: 'SATUAN POLISI PAMONG PRAJA', tags: ['Keamanan', 'Hukum'] },
    { name: 'SEKRETARIAT DAERAH', tags: ['Pemerintahan', 'Administrasi'] },
    { name: 'SEKRETARIAT DPRD', tags: ['Legislatif', 'Administrasi'] },
];

export function OpdDirectory({ opds }: OpdDirectoryProps) {
    const [searchOpd, setSearchOpd] = useState('');

    const quotaByName = new Map(opds.map((o) => [o.name, o]));
    const opdWithQuota = daftarOPD.map((opd) => {
        const real = quotaByName.get(opd.name);
        return { ...opd, quota: real?.quota ?? 0, quotaUsed: real?.quota_used ?? 0 };
    });

    const filteredOPD = opdWithQuota.filter((opd) =>
        opd.name.toLowerCase().includes(searchOpd.toLowerCase()),
    );

    return (
        <section id="instansi" className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
            <Reveal className="mb-12 flex flex-col items-center gap-3 text-center md:mb-16">
                <div className="mb-1 w-fit rounded-full border border-slate-100 bg-brand-bg px-3 py-1 text-[14px] text-brand-ink/70 shadow-sm">
                    <p>Instansi Tujuan</p>
                </div>
                <h2 className="mb-4 bg-gradient-to-r from-brand-ink via-brand-primary to-brand-light bg-clip-text text-[32px] leading-[1.15] font-extrabold tracking-tight text-transparent md:text-[42px]">
                    Pilih OPD Tujuan Anda
                </h2>
                <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-brand-ink/60 md:text-[18px]">
                    Kami bermitra dengan 35 instansi pemerintah daerah. Temukan OPD yang sesuai dengan minat dan bidang studi Anda.
                </p>
            </Reveal>

            {/* Search Bar */}
            <div className="group relative mx-auto mb-12 max-w-xl focus-within:mb-8">
                <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-brand-ink/40 transition-colors group-focus-within:text-brand-hover" />
                <input
                    type="text"
                    placeholder="Cari instansi OPD..."
                    value={searchOpd}
                    onChange={(e) => setSearchOpd(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-white py-4 pr-14 pl-14 text-[15px] text-brand-ink shadow-sm transition-all placeholder:text-brand-ink/40 hover:border-brand-light focus:border-transparent focus:ring-2 focus:ring-brand-hover focus:outline-none"
                />
                {searchOpd && (
                    <button
                        onClick={() => setSearchOpd('')}
                        className="absolute top-1/2 right-4 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-brand-bg text-brand-ink/50 transition-colors hover:bg-brand-primary hover:text-white focus-visible:bg-brand-primary focus-visible:text-white focus-visible:outline-none cursor-pointer"
                        aria-label="Hapus pencarian"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            {/* OPD Grid */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                {filteredOPD.map((opd) => (
                    <motion.div
                        key={opd.name}
                        variants={staggerItem}
                        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-500 hover:border-brand-hover/20 hover:shadow-[0_30px_70px_-20px_rgba(20,99,208,0.35)] focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:outline-none"
                        tabIndex={0}
                        role="button"
                    >
                        {/* Hover glow */}
                        <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gradient-to-br from-brand-hover/25 to-brand-light/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-brand-primary via-brand-hover to-brand-light transition-transform duration-500 ease-out group-hover:scale-x-100" />
                        <Building2 className="pointer-events-none absolute -right-5 -bottom-7 h-32 w-32 text-brand-hover/[0.04] transition-all duration-500 group-hover:scale-110 group-hover:text-brand-hover/[0.07]" />

                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-gradient-to-br from-brand-bg to-[#e7f0fc] shadow-sm transition-all duration-500 group-hover:border-transparent group-hover:from-brand-primary group-hover:to-brand-hover group-hover:shadow-[0_10px_24px_-8px_rgba(20,99,208,0.6)]">
                            <Building2 className="h-6 w-6 text-brand-hover transition-colors duration-500 group-hover:text-white" />
                        </div>

                        <h3 className="mt-1 text-[15px] leading-[1.5] font-semibold text-brand-ink transition-colors duration-300 group-hover:text-brand-hover">
                            {opd.name}
                        </h3>

                        {/* Quota bar */}
                        <div className="mt-3 flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-brand-hover" />
                            <span className="text-[12px] font-medium text-brand-ink/60">
                                Kuota: {opd.quotaUsed}/{opd.quota}
                            </span>
                        </div>

                        {/* Tags */}
                        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                            {opd.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border border-brand-hover/10 bg-brand-bg px-3 py-1 text-[10px] font-bold tracking-wide text-brand-primary uppercase transition-colors duration-300 group-hover:border-brand-hover/20 group-hover:bg-[#e7f0fc]"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {filteredOPD.length === 0 && (
                <div className="mt-8 text-center text-sm text-slate-500">
                    Tidak ada OPD yang cocok dengan pencarian &quot;{searchOpd}&quot;.
                </div>
            )}
        </section>
    );
}
