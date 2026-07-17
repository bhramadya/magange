import { motion } from 'motion/react';

/* =========================================================================
 *  ORBIT IMAGE — aset gambar asli yang mengorbit mengelilingi heading hero.
 *  Mekanika 4 lapis agar gambar tetap TEGAK (upright) saat berputar:
 *   1. ring   : motion.div di titik pusat, ukuran 0, berputar 360° (linear).
 *   2. radius : div statis dengan translateX(r) → menempatkan gambar di tepi
 *               orbit; ikut berputar karena induknya (ring) berputar.
 *   3. upright: motion.div counter-rotate -360° (durasi & easing identik)
 *               sehingga rotasi bersih = 0 → gambar tidak ikut miring.
 *   4. float  : osilasi y halus di dalam frame yang sudah tegak → gerak
 *               organik \"melayang\".
 *  Arah (reverse) & sudut awal (startAngle) berbeda tiap gambar agar sebaran
 *  merata dan tidak seragam.
 *
 *  Hanya ditampilkan di layar lebar (xl+). HORMATI prefers-reduced-motion.
 * ========================================================================= */

interface OrbitImageProps {
    src: string;
    alt: string;
    radius: number;
    size: number;
    duration: number;
    startAngle?: number;
    reverse?: boolean;
    delay?: number;
}

export function OrbitImage({
    src,
    alt,
    radius,
    size,
    duration,
    startAngle = 0,
    reverse = false,
    delay = 0,
}: OrbitImageProps) {
    const dir = reverse ? -1 : 1;

    return (
        <motion.div
            aria-hidden
            className="absolute top-1/2 left-1/2 h-0 w-0 motion-safe-only"
            initial={{ rotate: startAngle, opacity: 0 }}
            animate={{ rotate: startAngle + dir * 360, opacity: 1 }}
            transition={{
                rotate: { duration, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 0.8, delay },
            }}
        >
            <div style={{ transform: `translateX(${radius}px)` }}>
                <motion.div
                    initial={{ rotate: -startAngle }}
                    animate={{ rotate: -startAngle - dir * 360 }}
                    transition={{ duration, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: size,
                        height: size,
                        marginLeft: -size / 2,
                        marginTop: -size / 2,
                    }}
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay,
                        }}
                        className="h-full w-full overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_12px_30px_-8px_rgba(8,71,156,0.35)] backdrop-blur-sm"
                    >
                        <img
                            src={src}
                            alt={alt}
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
}
