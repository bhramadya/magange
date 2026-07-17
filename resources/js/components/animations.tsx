import { motion, useInView, animate } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/* =========================================================================
 *  ANIMATION HELPERS (Motion React)
 *  Scroll-triggered reveal, stagger containers, and animated counters.
 *  Semua komponen menghormati prefers-reduced-motion.
 * ========================================================================= */

// Scroll Reveal: fade + slide-up saat section masuk ke viewport.
// Memakai easing 'circOut' agar transisi terasa organik & mewah.
export function Reveal({
    children,
    className,
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const reduced = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={reduced ? undefined : { duration: 0.7, delay, ease: 'circOut' }}
        >
            {children}
        </motion.div>
    );
}

// Stagger Container: membungkus daftar agar anak-anaknya muncul satu per satu.
export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
};

// Stagger Item: tiap elemen anak muncul dengan fade + slide-up organik.
export const staggerItem = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'circOut' as const },
    },
};

// Stagger khusus Hero: judul → sub-judul → tombol muncul berurutan (slide-up).
export const heroContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
};

export const heroItem = {
    hidden: { opacity: 0, y: 28 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: 'circOut' as const },
    },
};

// Bento Item: tiap kartu muncul dengan fade-in + scale-up halus saat scroll.
export const bentoItem = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.55, ease: 'circOut' as const },
    },
};

// Animated Statistics: count-up dari 0 ke target saat masuk viewport.
// Memperbarui DOM secara langsung agar tidak memicu render per-frame.
export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    useEffect(() => {
        const node = ref.current;

        if (!inView || !node) {
            return;
        }

        const controls = animate(0, to, {
            duration: 2,
            ease: 'easeOut',
            onUpdate(value) {
                node.textContent = `${Math.round(value)}${suffix}`;
            },
        });

        return () => controls.stop();
    }, [inView, to, suffix]);

    return <span ref={ref}>{`0${suffix}`}</span>;
}
