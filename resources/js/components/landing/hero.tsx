import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import {
    Building2,
    CheckCircle2,
    ShieldCheck,
    ArrowRight,
    Ticket,
    Sparkles,
    Award,
    Timer,
} from 'lucide-react';
import { AnimatedButton } from '@/components/animated-button';
import { OrbitImage } from './orbit-image';
import { CountUp, heroContainer, heroItem, staggerContainer, staggerItem } from '@/components/animations';

const statistik = [
    { value: 35, suffix: '', label: 'Instansi OPD Tersedia', icon: Building2 },
    { value: 4, suffix: '', label: 'Langkah Pendaftaran', icon: Sparkles },
    { value: 100, suffix: '%', label: 'Gratis Tanpa Biaya', icon: Award },
    { value: 3, suffix: ' Hari', label: 'Estimasi Verifikasi', icon: Timer },
];

export function HeroSection() {
    return (
        <section className="relative mx-auto flex max-w-[1200px] flex-col items-center overflow-visible px-6 pt-[140px] pb-20 text-center">
            {/* Glow Blobs */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-10 left-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand-hover/25 blur-[120px]" />
                <div className="absolute top-24 right-1/4 h-[360px] w-[360px] translate-x-1/2 rounded-full bg-brand-primary/20 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 h-[300px] w-[520px] -translate-x-1/2 rounded-full bg-brand-light/30 blur-[120px]" />
            </div>

            <div className="relative flex w-full flex-col items-center">
                {/* Orbit Images */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-[44%] -z-[5] hidden -translate-y-1/2 xl:block"
                >
                    <div className="relative mx-auto h-0 w-0">
                        <OrbitImage src="/images/orbit/avatar-1.webp" alt="" radius={430} size={64} duration={26} startAngle={0} />
                        <OrbitImage src="/images/orbit/brand-2.webp" alt="" radius={470} size={56} duration={32} startAngle={70} reverse delay={0.2} />
                        <OrbitImage src="/images/orbit/avatar-3.webp" alt="" radius={400} size={60} duration={24} startAngle={150} delay={0.35} />
                        <OrbitImage src="/images/orbit/brand-4.webp" alt="" radius={500} size={52} duration={36} startAngle={210} reverse delay={0.15} />
                        <OrbitImage src="/images/orbit/avatar-2.webp" alt="" radius={360} size={58} duration={22} startAngle={285} delay={0.5} />
                        <OrbitImage src="/images/orbit/brand-1.webp" alt="" radius={520} size={54} duration={40} startAngle={330} reverse delay={0.3} />
                    </div>
                </div>

                <motion.div
                    variants={heroContainer}
                    initial="hidden"
                    animate="show"
                    className="relative z-10 flex flex-col items-center"
                >
                    {/* Badge */}
                    <motion.div
                        variants={heroItem}
                        className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-brand-primary/15 bg-white/70 px-4 py-2 text-[13px] font-semibold tracking-wide text-brand-ink/70 shadow-[0_4px_20px_rgba(16,111,235,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:bg-white cursor-pointer"
                    >
                        <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary opacity-60" />
                            <span className="relative inline-flex size-2 rounded-full bg-gradient-to-br from-brand-primary to-brand-hover" />
                        </span>
                        Portal Resmi Kota Madiun
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={heroItem}
                        className="mb-6 max-w-4xl bg-gradient-to-r from-brand-ink to-brand-hover bg-clip-text text-[44px] leading-[1.05] font-bold tracking-tight text-transparent md:text-[72px] lg:text-[80px]"
                    >
                        Pusat Kendali Karir{' '}
                        <br className="hidden md:block" />
                        <span className="relative mt-2 inline-block leading-[1.15]">
                            <span className="relative z-10 bg-gradient-to-r from-brand-primary via-brand-hover to-brand-primary bg-clip-text pb-[0.15em] text-transparent">
                                Digital Anda
                            </span>
                            <motion.span
                                aria-hidden
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.7, delay: 0.9, ease: 'circOut' }}
                                className="absolute bottom-0 left-0 h-[6px] w-full origin-left rounded-full bg-gradient-to-r from-brand-primary to-brand-hover"
                            />
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={heroItem}
                        className="mb-10 max-w-2xl text-[18px] leading-[1.6] font-medium text-brand-ink/60 md:text-[20px]"
                    >
                        Kelola pendaftaran, pantau status verifikasi, dan temukan bidang penempatan yang tepat di instansi pemerintahan dalam satu platform cerdas.
                    </motion.p>

                    <motion.div variants={heroItem} className="flex flex-col items-center gap-4 sm:flex-row">
                        <AnimatedButton as="a" href="#daftar" className="w-full sm:w-auto">
                            Mulai Pengajuan Magang
                        </AnimatedButton>
                        <AnimatedButton as="a" href="#alur" variant="inverted" className="w-full sm:w-auto">
                            Pelajari Alur
                        </AnimatedButton>
                    </motion.div>

                    <motion.div variants={heroItem} className="mt-5">
                        <Link
                            href="/lacak"
                            className="group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-brand-ink/60 transition-colors duration-300 hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-hover/50 focus-visible:outline-none"
                        >
                            <Ticket className="h-4 w-4 text-brand-primary" />
                            Sudah mengajukan? Lacak status tiket
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </motion.div>

                    {/* Trust Bar */}
                    <motion.div
                        variants={heroItem}
                        className="mt-10 flex flex-wrap items-center justify-center gap-3 text-[13px] font-medium text-brand-ink/70"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-light hover:bg-white cursor-pointer">
                            <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                            100% Gratis Tanpa Biaya
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-light hover:bg-white cursor-pointer">
                            <ShieldCheck className="h-4 w-4 text-brand-primary" />
                            Data Terlindungi
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-light hover:bg-white cursor-pointer">
                            <Building2 className="h-4 w-4 text-brand-primary" />
                            35 Instansi Resmi
                        </span>
                    </motion.div>
                </motion.div>
            </div>

            {/* Main Visual */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9, ease: 'circOut' }}
                className="group relative mt-24 w-full max-w-md md:max-w-2xl lg:max-w-4xl"
            >
                <div className="absolute -inset-4 -z-10 rounded-[40px] bg-brand-hover/20 blur-[80px]" />
                <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white shadow-[0_20px_40px_-12px_rgba(8,71,156,0.25),0_40px_80px_-20px_rgba(20,99,208,0.3)] transition-transform duration-700 hover:-translate-y-2">
                    <img
                        src="/images/dasbor.png"
                        alt="Gedung Pemerintah Kota Madiun"
                        loading="lazy"
                        onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            const fallback = img.nextElementSibling;
                            if (fallback) fallback.classList.remove('hidden');
                        }}
                        className="aspect-[4/3] w-full object-cover lg:aspect-[16/9]"
                    />
                    <div className="hidden aspect-[4/3] w-full flex-col items-center justify-center bg-gradient-to-br from-brand-ink via-brand-hover to-brand-light lg:aspect-[16/9]">
                        <div className="flex flex-col items-center gap-3 text-white/90">
                            <Building2 className="h-12 w-12" />
                            <span className="text-[15px] font-medium">Gedung Pemerintah Kota Madiun</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Strip */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                className="mt-20 grid w-full max-w-4xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
            >
                {statistik.map((s) => (
                    <motion.div
                        key={s.label}
                        variants={staggerItem}
                        className="group flex flex-col items-center gap-2 rounded-3xl border border-slate-100 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-light hover:shadow-lg"
                    >
                        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-light/50 text-brand-primary transition-all duration-300 group-hover:-rotate-3 group-hover:bg-brand-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand-primary/30">
                            <s.icon className="size-5" />
                        </span>
                        <span className="mt-1 text-3xl font-bold tracking-tight text-brand-ink">
                            <CountUp to={s.value} suffix={s.suffix} />
                        </span>
                        <span className="text-[13px] leading-tight font-medium text-brand-ink/55">
                            {s.label}
                        </span>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
