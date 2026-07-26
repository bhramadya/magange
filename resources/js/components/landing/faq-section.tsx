import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Reveal } from '@/components/animations';

interface FaqData {
    id: number;
    question: string;
    answer: string;
}

interface FaqSectionProps {
    faqs: FaqData[];
}

const DEFAULT_FAQS = [
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

export function FaqSection({ faqs }: FaqSectionProps) {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqList: { q: string; a: string }[] =
        faqs.length > 0
            ? faqs.map((f) => ({ q: f.question, a: f.answer }))
            : DEFAULT_FAQS;

    return (
        <section id="faq" className="mx-auto max-w-[800px] px-6 py-24 md:py-32">
            <Reveal className="flex flex-col items-center gap-2">
                <div className="bg-brand-bg text-brand-ink/70 mb-1 w-fit rounded-full border border-slate-100 px-3 py-1 text-[14px] shadow-sm">
                    <p>Pertanyaan Umum</p>
                </div>
                <h2 className="from-brand-ink via-brand-primary to-brand-light bg-gradient-to-r bg-clip-text text-[32px] leading-[1.15] font-extrabold tracking-tight text-transparent md:text-[42px]">
                    Pertanyaan yang Sering Diajukan
                </h2>
            </Reveal>

            <div className="mt-12 space-y-3">
                {faqList.map((faq, idx) => {
                    const isOpen = openFaq === idx;

                    return (
                        <div
                            key={idx}
                            className="group focus-within:ring-brand-primary/40 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 focus-within:ring-2 hover:shadow-md"
                        >
                            <button
                                onClick={() => setOpenFaq(isOpen ? null : idx)}
                                className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left transition-colors"
                                aria-expanded={isOpen}
                            >
                                <span className="text-brand-ink group-hover:text-brand-primary pr-4 text-[15px] font-semibold transition-colors duration-300">
                                    {faq.q}
                                </span>
                                <ChevronDown
                                    className={`size-5 shrink-0 text-slate-400 transition-transform duration-300 ${
                                        isOpen
                                            ? 'text-brand-primary rotate-180'
                                            : ''
                                    }`}
                                />
                            </button>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            ease: 'easeInOut',
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-brand-ink/60 border-t border-slate-100 px-6 pt-4 pb-5 text-[15px] leading-relaxed">
                                            {faq.a}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
