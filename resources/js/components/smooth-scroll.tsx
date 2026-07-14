import { ReactLenis } from 'lenis/react';
import { useEffect, useState } from 'react';

/* =========================================================================
 *  SMOOTH SCROLL (Lenis)
 *  Membungkus seluruh aplikasi (dipasang di app.tsx → withApp) sehingga
 *  scroll halus berlaku di SETIAP halaman. `anchors: true` membuat klik
 *  tautan seksi (mis. #daftar, #faq) meluncur mulus, bukan lompat.
 *
 *  Menghormati prefers-reduced-motion: bila pengguna meminta gerak minimal,
 *  Lenis tidak diaktifkan (scroll native) agar aksesibel.
 * ========================================================================= */
export default function SmoothScroll({
    children,
}: {
    children: React.ReactNode;
}) {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(mq.matches);

        update();
        mq.addEventListener('change', update);

        return () => mq.removeEventListener('change', update);
    }, []);

    if (reducedMotion) {
        return <>{children}</>;
    }

    return (
        <ReactLenis
            root
            options={{
                // Durasi & easing meniru inersia halus khas situs modern.
                duration: 1.1,
                easing: (t: number) =>
                    Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                anchors: true,
            }}
        >
            {children}
        </ReactLenis>
    );
}
