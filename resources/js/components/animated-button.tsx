import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

/* =========================================================================
 *  ANIMATED BUTTON — tombol dengan efek sliding overlay (brand Pemkot Madiun).
 *  Skema warna 3-lapis: badge & teks berganti kontras seiring overlay
 *  menutupi base, agar lingkaran ikon tidak \"hilang\" melebur ke overlay.
 *
 *                       │ base (diam)          │ hover (overlay penuh)
 * ─────────────────────┼──────────────────────┼───────────────────────
 *  default  background │ biru   #106feb        │ overlay #cddcef
 *           teks        │ putih                 │ gelap  #0a1628
 *           badge       │ #cddcef + panah biru  │ biru   + panah putih
 *  inverted background │ #cddcef               │ overlay biru #106feb
 *           teks        │ gelap  #0a1628        │ putih
 *           badge       │ biru   + panah putih  │ #cddcef + panah biru
 * ========================================================================= */

interface AnimatedButtonProps {
    children: React.ReactNode;
    as?: 'button' | 'a' | 'link';
    href?: string;
    variant?: 'default' | 'inverted';
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
}

export function AnimatedButton({
    children,
    as = 'button',
    href,
    variant = 'default',
    type,
    disabled = false,
    className = '',
    onClick,
}: AnimatedButtonProps) {
    const isInverted = variant === 'inverted';

    const baseBg = isInverted ? 'bg-brand-light' : 'bg-brand-primary';
    const baseText = isInverted ? 'text-brand-ink' : 'text-white';
    const hoverText = isInverted
        ? 'group-hover:text-white'
        : 'group-hover:text-brand-ink';
    const fill = isInverted ? 'bg-brand-primary' : 'bg-brand-light';
    const badgeBg = isInverted
        ? 'bg-brand-primary group-hover:bg-brand-light'
        : 'bg-brand-light group-hover:bg-brand-primary';
    const arrowColor = isInverted
        ? 'text-white group-hover:text-brand-primary'
        : 'text-brand-primary group-hover:text-white';

    const content = (
        <>
            <span
                aria-hidden
                className={`absolute inset-0 z-0 ${fill} -translate-x-[101%] transition-transform duration-500 ease-out group-hover:translate-x-0`}
            />
            <span
                className={`relative z-10 font-semibold transition-colors duration-500 ease-out ${baseText} ${hoverText}`}
            >
                {children}
            </span>
            <span
                className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ease-out ${badgeBg} ${arrowColor}`}
            >
                <ArrowUpRight className="size-4 transition-transform duration-500 ease-out group-hover:rotate-45" />
            </span>
        </>
    );

    const shared = `group relative inline-flex items-center justify-between gap-3 overflow-hidden rounded-full py-1 pl-6 pr-1 text-sm ${baseBg} shadow-lg shadow-brand-primary/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-brand-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-hover focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`;

    if (as === 'link' && href) {
        return (
            <Link href={href} onClick={onClick} className={shared}>
                {content}
            </Link>
        );
    }

    if (as === 'a') {
        return (
            <motion.a
                href={href}
                onClick={onClick}
                whileTap={{ scale: 0.97 }}
                className={shared}
            >
                {content}
            </motion.a>
        );
    }

    return (
        <motion.button
            type={type}
            disabled={disabled}
            onClick={onClick}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            className={shared}
        >
            {content}
        </motion.button>
    );
}
