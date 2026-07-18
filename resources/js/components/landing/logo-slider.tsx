import { Building2 } from 'lucide-react';
import { motion } from 'motion/react';

const instansiLogos = [
    'Diskominfo',
    'Dinas Pendidikan',
    'Dinas Kesehatan',
    'BAPPEDA',
    'BKD',
    'Dinas Sosial',
    'Satpol PP',
    'RSUD',
    'Dinas Perhubungan',
    'Inspektorat',
    'BPBD',
    'Dinas Lingkungan Hidup',
    'Disdukcapil',
    'Sekretariat Daerah',
];

export function LogoSlider() {
    return (
        <section className="overflow-hidden border-y border-slate-100 bg-white/60 py-16">
            <div className="relative">
                <div className="from-brand-bg pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-32 bg-gradient-to-r to-transparent" />
                <div className="from-brand-bg pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-32 bg-gradient-to-l to-transparent" />

                <motion.div
                    className="flex w-max gap-4"
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{
                        duration: 30,
                        ease: 'linear',
                        repeat: Infinity,
                        repeatType: 'loop',
                    }}
                >
                    {[...instansiLogos, ...instansiLogos].map((logo, idx) => (
                        <div
                            key={idx}
                            className="group hover:border-brand-light flex shrink-0 cursor-pointer items-center gap-3 rounded-full border border-slate-100 bg-white px-6 py-3 shadow-[0_4px_20px_rgba(8,71,156,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="border-brand-light/40 bg-brand-bg group-hover:bg-brand-primary flex h-8 w-8 items-center justify-center rounded-[8px] border transition-colors duration-300 group-hover:border-transparent">
                                <Building2 className="text-brand-primary h-4 w-4 transition-colors duration-300 group-hover:text-white" />
                            </div>
                            <span className="text-brand-ink/70 group-hover:text-brand-ink text-[15px] font-medium whitespace-nowrap transition-colors duration-300">
                                {logo}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
