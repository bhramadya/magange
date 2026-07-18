import { Link } from '@inertiajs/react';
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
import { motion } from 'motion/react';
import { AnimatedButton } from '@/components/animated-button';
import {
    CountUp,
    heroContainer,
    heroItem,
    staggerContainer,
    staggerItem,
} from '@/components/animations';
import { OrbitImage } from './orbit-image';

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
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
            >
                <div className="bg-brand-hover/25 absolute top-10 left-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[120px]" />
                <div className="bg-brand-primary/20 absolute top-24 right-1/4 h-[360px] w-[360px] translate-x-1/2 rounded-full blur-[120px]" />
                <div className="bg-brand-light/30 absolute top-1/2 left-1/2 h-[300px] w-[520px] -translate-x-1/2 rounded-full blur-[120px]" />
            </div>

            <div className="relative flex w-full flex-col items-center">
                {/* Orbit Images */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-[44%] -z-[5] hidden -translate-y-1/2 xl:block"
                >
                    <div className="relative mx-auto h-0 w-0">
                        <OrbitImage
                            src="/images/orbit/avatar-1.webp"
                            alt=""
                            radius={430}
                            size={64}
                            duration={26}
                            startAngle={0}
                        />
                        <OrbitImage
                            src="/images/orbit/brand-2.webp"
                            alt=""
                            radius={470}
                            size={56}
                            duration={32}
                            startAngle={70}
                            reverse
                            delay={0.2}
                        />
                        <OrbitImage
                            src="/images/orbit/avatar-3.webp"
                            alt=""
                            radius={400}
                            size={60}
                            duration={24}
                            startAngle={150}
                            delay={0.35}
                        />
                        <OrbitImage
                            src="/images/orbit/brand-4.webp"
                            alt=""
                            radius={500}
                            size={52}
                            duration={36}
                            startAngle={210}
                            reverse
                            delay={0.15}
                        />
                        <OrbitImage
                            src="/images/orbit/avatar-2.webp"
                            alt=""
                            radius={360}
                            size={58}
                            duration={22}
                            startAngle={285}
                            delay={0.5}
                        />
                        <OrbitImage
                            src="/images/orbit/brand-1.webp"
                            alt=""
                            radius={520}
                            size={54}
                            duration={40}
                            startAngle={330}
                            reverse
                            delay={0.3}
                        />
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
                        className="border-brand-primary/15 text-brand-ink/70 hover:border-brand-primary/30 mb-8 inline-flex cursor-pointer items-center gap-2.5 rounded-full border bg-white/70 px-4 py-2 text-[13px] font-semibold tracking-wide shadow-[0_4px_20px_rgba(16,111,235,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                    >
                        <span className="relative flex size-2">
                            <span className="bg-brand-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
                            <span className="from-brand-primary to-brand-hover relative inline-flex size-2 rounded-full bg-gradient-to-br" />
                        </span>
                        Portal Resmi Kota Madiun
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={heroItem}
                        className="from-brand-ink to-brand-hover mb-6 max-w-4xl bg-gradient-to-r bg-clip-text text-[44px] leading-[1.05] font-bold tracking-tight text-transparent md:text-[72px] lg:text-[80px]"
                    >
                        Pusat Kendali Karir <br className="hidden md:block" />
                        <span className="relative mt-2 inline-block leading-[1.15]">
                            <span className="from-brand-primary via-brand-hover to-brand-primary relative z-10 bg-gradient-to-r bg-clip-text pb-[0.15em] text-transparent">
                                Digital Anda
                            </span>
                            <motion.span
                                aria-hidden
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                    duration: 0.7,
                                    delay: 0.9,
                                    ease: 'circOut',
                                }}
                                className="from-brand-primary to-brand-hover absolute bottom-0 left-0 h-[6px] w-full origin-left rounded-full bg-gradient-to-r"
                            />
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={heroItem}
                        className="text-brand-ink/60 mb-10 max-w-2xl text-[18px] leading-[1.6] font-medium md:text-[20px]"
                    >
                        Kelola pendaftaran, pantau status verifikasi, dan
                        temukan bidang penempatan yang tepat di instansi
                        pemerintahan dalam satu platform cerdas.
                    </motion.p>

                    <motion.div
                        variants={heroItem}
                        className="flex flex-col items-center gap-4 sm:flex-row"
                    >
                        <AnimatedButton
                            as="a"
                            href="#daftar"
                            className="w-full sm:w-auto"
                        >
                            Mulai Pengajuan Magang
                        </AnimatedButton>
                        <AnimatedButton
                            as="a"
                            href="#alur"
                            variant="inverted"
                            className="w-full sm:w-auto"
                        >
                            Pelajari Alur
                        </AnimatedButton>
                    </motion.div>

                    <motion.div variants={heroItem} className="mt-5">
                        <Link
                            href="/lacak"
                            className="group text-brand-ink/60 hover:text-brand-primary focus-visible:ring-brand-hover/50 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-300 focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <Ticket className="text-brand-primary h-4 w-4" />
                            Sudah mengajukan? Lacak status tiket
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </motion.div>

                    {/* Trust Bar */}
                    <motion.div
                        variants={heroItem}
                        className="text-brand-ink/70 mt-10 flex flex-wrap items-center justify-center gap-3 text-[13px] font-medium"
                    >
                        <span className="hover:border-brand-light inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-100 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white">
                            <CheckCircle2 className="text-brand-primary h-4 w-4" />
                            100% Gratis Tanpa Biaya
                        </span>
                        <span className="hover:border-brand-light inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-100 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white">
                            <ShieldCheck className="text-brand-primary h-4 w-4" />
                            Data Terlindungi
                        </span>
                        <span className="hover:border-brand-light inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-100 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white">
                            <Building2 className="text-brand-primary h-4 w-4" />
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
                <div className="bg-brand-hover/20 absolute -inset-4 -z-10 rounded-[40px] blur-[80px]" />
                <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white shadow-[0_20px_40px_-12px_rgba(8,71,156,0.25),0_40px_80px_-20px_rgba(20,99,208,0.3)] transition-transform duration-700 hover:-translate-y-2">
                    <img
                        src="/images/dasbor.png"
                        alt="Gedung Pemerintah Kota Madiun"
                        loading="lazy"
                        onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            const fallback = img.nextElementSibling;

                            if (fallback) {
                                fallback.classList.remove('hidden');
                            }
                        }}
                        className="aspect-[4/3] w-full object-cover lg:aspect-[16/9]"
                    />
                    <div className="from-brand-ink via-brand-hover to-brand-light hidden aspect-[4/3] w-full flex-col items-center justify-center bg-gradient-to-br lg:aspect-[16/9]">
                        <div className="flex flex-col items-center gap-3 text-white/90">
                            <Building2 className="h-12 w-12" />
                            <span className="text-[15px] font-medium">
                                Gedung Pemerintah Kota Madiun
                            </span>
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
                        className="group hover:border-brand-light flex flex-col items-center gap-2 rounded-3xl border border-slate-100 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                        <span className="bg-brand-light/50 text-brand-primary group-hover:bg-brand-primary group-hover:shadow-brand-primary/30 flex size-11 items-center justify-center rounded-2xl transition-all duration-300 group-hover:-rotate-3 group-hover:text-white group-hover:shadow-lg">
                            <s.icon className="size-5" />
                        </span>
                        <span className="text-brand-ink mt-1 text-3xl font-bold tracking-tight">
                            <CountUp to={s.value} suffix={s.suffix} />
                        </span>
                        <span className="text-brand-ink/55 text-[13px] leading-tight font-medium">
                            {s.label}
                        </span>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
