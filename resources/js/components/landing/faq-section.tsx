import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
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
    { q: 'Apa itu E-Magang Kota Madiun?', a: 'Platform digital resmi untuk mempermudah pendaftaran, verifikasi, dan pemantauan status magang siswa/mahasiswa di lingkungan instansi Pemerintah Kota Madiun.' },
    { q: 'Apakah pendaftaran dikenakan biaya?', a: 'Tidak. Seluruh layanan di E-Magang Kota Madiun adalah gratis bagi seluruh pelajar dan mahasiswa.' },
    { q: 'Berapa lama proses verifikasi berkas?', a: 'Biasanya memakan waktu 2-3 hari kerja. Anda akan mendapatkan notifikasi status melalui email atau WhatsApp yang terdaftar.' },
    { q: 'Berapa lama durasi magang yang diperbolehkan?', a: 'Durasi magang fleksibel mulai dari 1 hingga 6 bulan, menyesuaikan dengan kurikulum atau kebutuhan dari instansi pendidikan Anda.' },
    { q: 'Apakah magang ini bisa dilakukan secara remote/WFH?', a: 'Seluruh pelaksanaan magang mengikuti kebijakan operasional masing-masing OPD tujuan, namun mayoritas dilaksanakan secara WFO (On-Site) dengan jam kerja kantor pemerintah.' },
    { q: 'Bagaimana cara mendapatkan e-Sertifikat?', a: 'Setelah selesai melaksanakan magang, pastikan Anda telah mengunggah laporan tugas akhir dan mengisi survei evaluasi di dasbor akun Anda.' },
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
                <div className="mb-1 w-fit rounded-full border border-slate-100 bg-brand-bg px-3 py-1 text-[14px] text-brand-ink/70 shadow-sm">
                    <p>Pertanyaan Umum</p>
                </div>
                <h2 className="bg-gradient-to-r from-brand-ink via-brand-primary to-brand-light bg-clip-text text-[32px] leading-[1.15] font-extrabold tracking-tight text-transparent md:text-[42px]">
                    Pertanyaan yang Sering Diajukan
                </h2>
            </Reveal>

            <div className="mt-12 space-y-3">
                {faqList.map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                        <div
                            key={idx}
                            className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md focus-within:ring-2 focus-within:ring-brand-primary/40"
                        >
                            <button
                                onClick={() => setOpenFaq(isOpen ? null : idx)}
                                className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors cursor-pointer"
                                aria-expanded={isOpen}
                            >
                                <span className="pr-4 text-[15px] font-semibold text-brand-ink transition-colors duration-300 group-hover:text-brand-primary">
                                    {faq.q}
                                </span>
                                <ChevronDown
                                    className={`size-5 shrink-0 text-slate-400 transition-transform duration-300 ${
                                        isOpen ? 'rotate-180 text-brand-primary' : ''
                                    }`}
                                />
                            </button>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <p className="border-t border-slate-100 px-6 pb-5 pt-4 text-[15px] leading-relaxed text-brand-ink/60">
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
