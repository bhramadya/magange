import { motion } from 'motion/react';
import { Building2 } from 'lucide-react';

const instansiLogos = [
    'Diskominfo', 'Dinas Pendidikan', 'Dinas Kesehatan', 'BAPPEDA',
    'BKD', 'Dinas Sosial', 'Satpol PP', 'RSUD', 'Dinas Perhubungan',
    'Inspektorat', 'BPBD', 'Dinas Lingkungan Hidup', 'Disdukcapil',
    'Sekretariat Daerah',
];

export function LogoSlider() {
    return (
        <section className="overflow-hidden border-y border-slate-100 bg-white/60 py-16">
            <div className="relative">
                <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-32 bg-gradient-to-r from-brand-bg to-transparent" />
                <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-32 bg-gradient-to-l from-brand-bg to-transparent" />

                <motion.div
                    className="flex w-max gap-4"
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 30, ease: 'linear', repeat: Infinity, repeatType: 'loop' }}
                >
                    {[...instansiLogos, ...instansiLogos].map((logo, idx) => (
                        <div
                            key={idx}
                            className="group flex shrink-0 items-center gap-3 rounded-full border border-slate-100 bg-white px-6 py-3 shadow-[0_4px_20px_rgba(8,71,156,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-light hover:shadow-md cursor-pointer"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-brand-light/40 bg-brand-bg transition-colors duration-300 group-hover:border-transparent group-hover:bg-brand-primary">
                                <Building2 className="h-4 w-4 text-brand-primary transition-colors duration-300 group-hover:text-white" />
                            </div>
                            <span className="text-[15px] font-medium whitespace-nowrap text-brand-ink/70 transition-colors duration-300 group-hover:text-brand-ink">
                                {logo}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
