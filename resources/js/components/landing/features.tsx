import { Clock, Shield, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { Reveal, staggerContainer, bentoItem } from '@/components/animations';

export function FeaturesSection() {
    return (
        <section
            id="fitur"
            className="mx-auto max-w-[1200px] px-6 py-24 md:py-32"
        >
            <Reveal className="mb-12 flex flex-col items-center gap-3 text-center md:mb-16">
                <div className="text-brand-ink/70 mb-1 w-fit rounded-full border border-slate-100 bg-white px-3 py-1 text-[14px] shadow-sm">
                    <p>Kenapa E-Magang?</p>
                </div>
                <h2 className="from-brand-ink to-brand-hover max-w-2xl bg-gradient-to-r bg-clip-text pb-[0.1em] text-[32px] leading-[1.15] font-bold tracking-tight text-balance text-transparent md:text-[48px]">
                    Kenapa E-Magang?
                </h2>
                <p className="text-brand-ink/60 mt-1 max-w-2xl text-[16px] leading-relaxed text-balance md:text-[18px]">
                    Kami merancang platform ini untuk menghilangkan kerumitan
                    birokrasi manual, mempercepat persetujuan, dan memberikan
                    transparansi penuh.
                </p>
            </Reveal>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                className="flex flex-col gap-5 md:gap-6"
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                    {/* Card 1 */}
                    <motion.div
                        variants={bentoItem}
                        whileHover={{ y: -8 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 22,
                        }}
                        className="group hover:border-brand-light flex h-full cursor-pointer flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-2xl md:p-10"
                    >
                        <div className="border-brand-hover/15 bg-brand-hover/8 group-hover:bg-brand-primary group-hover:shadow-brand-primary/30 mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:-rotate-3 group-hover:border-transparent group-hover:shadow-lg">
                            <Clock className="text-brand-hover h-7 w-7 transition-colors duration-300 group-hover:text-white" />
                        </div>
                        <h3 className="text-brand-ink text-[22px] leading-snug font-bold">
                            Validasi Real-time
                        </h3>
                        <p className="text-brand-ink/60 text-[16px] leading-relaxed">
                            Pantau status pengajuan Anda secara langsung. Sistem
                            akan memberi notifikasi begitu berkas Anda disetujui
                            oleh verifikator dan OPD terkait.
                        </p>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div
                        variants={bentoItem}
                        whileHover={{ y: -8 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 22,
                        }}
                        className="group hover:border-brand-light flex h-full cursor-pointer flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-2xl md:p-10"
                    >
                        <div className="border-brand-hover/15 bg-brand-hover/8 group-hover:bg-brand-primary group-hover:shadow-brand-primary/30 mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:-rotate-3 group-hover:border-transparent group-hover:shadow-lg">
                            <Shield className="text-brand-hover h-7 w-7 transition-colors duration-300 group-hover:text-white" />
                        </div>
                        <h3 className="text-brand-ink text-[22px] leading-snug font-bold">
                            Akses Dasbor Aman
                        </h3>
                        <p className="text-brand-ink/60 text-[16px] leading-relaxed">
                            Login via OTP email dan kontrol akses berbasis peran
                            (Mahasiswa, Verifikator, OPD) menjaga privasi data
                            Anda.
                        </p>
                    </motion.div>
                </div>

                {/* Card 3 — Full width */}
                <motion.div
                    variants={bentoItem}
                    whileHover={{ y: -8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className="group hover:border-brand-light relative flex cursor-pointer flex-col gap-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-2xl md:flex-row md:items-center md:gap-10 md:p-12"
                >
                    <div className="bg-brand-hover/10 pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] blur-2xl" />
                    <div className="flex-1">
                        <div className="bg-brand-hover/8 group-hover:bg-brand-primary group-hover:shadow-brand-primary/30 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:-rotate-3 group-hover:shadow-lg">
                            <Award className="text-brand-primary h-7 w-7 transition-colors duration-300 group-hover:text-white" />
                        </div>
                        <h3 className="text-brand-ink text-[24px] leading-snug font-bold md:text-[28px]">
                            e-Sertifikat Resmi
                        </h3>
                        <p className="text-brand-ink/60 max-w-2xl text-[16px] leading-relaxed md:text-[17px]">
                            Setelah menyelesaikan magang, unggah laporan akhir
                            dan isi survei untuk mendapatkan e-Sertifikat resmi
                            bertanda tangan digital.
                        </p>
                    </div>
                    <div className="relative shrink-0">
                        <div className="from-brand-light/30 ring-brand-light/30 flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br to-white/50 shadow-inner ring-1">
                            <div className="from-brand-bg flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br to-white shadow-sm">
                                <div className="text-center">
                                    <Award className="text-brand-hover mx-auto h-8 w-8" />
                                    <span className="text-brand-ink/60 mt-1 block text-[9px] font-bold">
                                        SERTIFIKAT
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}
