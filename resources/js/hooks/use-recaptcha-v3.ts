import { useCallback, useEffect } from 'react';

/**
 * Google reCAPTCHA v3 (invisible) — dimuat sekali via script Google saat
 * runtime, lalu `execute(action)` dipanggil tepat sebelum submit form untuk
 * memperoleh token skor. Token dikirim ke backend pada field
 * `recaptcha_token` dan diverifikasi di App\Rules\Recaptcha.
 *
 * Bila site key kosong (mis. dev lokal tanpa kunci), `execute` mengembalikan
 * string kosong dan backend melewati verifikasi — pengembangan tidak
 * terblokir.
 */
declare global {
    interface Window {
        grecaptcha?: {
            ready: (cb: () => void) => void;
            execute: (
                siteKey: string,
                opts: { action: string },
            ) => Promise<string>;
        };
    }
}

const SCRIPT_ID = 'recaptcha-api-v3';

export function useRecaptchaV3(siteKey: string | undefined, action: string) {
    // Muat script api.js?render={siteKey} sekali untuk seluruh halaman.
    useEffect(() => {
        if (!siteKey || document.getElementById(SCRIPT_ID)) {
            return;
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    }, [siteKey]);

    /**
     * Ambil token v3 untuk `action`; '' bila captcha tidak dikonfigurasi
     * atau script belum/gagal termuat (backend akan menolak bila secret
     * terpasang — pengguna cukup mencoba lagi).
     */
    return useCallback(async (): Promise<string> => {
        if (!siteKey || !window.grecaptcha?.execute) {
            return '';
        }

        try {
            await new Promise<void>((resolve) =>
                window.grecaptcha!.ready(resolve),
            );

            return await window.grecaptcha.execute(siteKey, { action });
        } catch {
            return '';
        }
    }, [siteKey, action]);
}
