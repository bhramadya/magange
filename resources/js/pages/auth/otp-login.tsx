import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    GraduationCap,
    Mail,
    ShieldCheck,
    Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { useRecaptchaV3 } from '@/hooks/use-recaptcha-v3';
import { cn } from '@/lib/utils';

/* =========================================================================
 *  LOGIN OTP — E-MAGANG (Pemkot Madiun)
 *  Alur 2 langkah tanpa password:
 *    1) Peserta memasukkan email  → backend kirim kode OTP 6 digit.
 *    2) Peserta memasukkan kode    → backend verifikasi & buat sesi.
 *
 *  Terhubung ke backend nyata (OtpLoginController) via Inertia:
 *    router.post('/otp/send',   { email })          // langkah 1
 *    router.post('/otp/verify', { email, otp })     // langkah 2
 *
 *  Sukses langkah 1  → controller flash `status`, kita pindah ke langkah kode.
 *  Sukses langkah 2  → controller redirect sesuai peran (dashboard/verifikator/opd).
 *  Gagal             → errors.email (langkah 1) / errors.otp (langkah 2).
 *
 *  Desain: kartu terpusat di atas latar biru muda (#f5faff) — SATU bahasa
 *  visual dengan landing page (glow blobs, wordmark gradien, tombol biru).
 * ========================================================================= */

type Step = 'email' | 'code';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

interface OtpLoginProps {
    status?: string;
    // Diisi controller setelah submit form pendaftaran → langsung ke langkah kode.
    prefillEmail?: string | null;
    // Sisa detik lockout progresif (flash) → hitung mundur live di UI.
    lockoutSeconds?: number | null;
    errors?: Record<string, string>;
}

/** Format sisa lockout Indonesia: "2 menit 15 detik" / "45 detik". */
function formatLockout(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;

    if (m > 0 && s > 0) {
        return `${m} menit ${s} detik`;
    }

    if (m > 0) {
        return `${m} menit`;
    }

    return `${s} detik`;
}

export default function OtpLogin({
    status,
    prefillEmail,
    lockoutSeconds,
    errors,
}: OtpLoginProps) {
    const [step, setStep] = useState<Step>(prefillEmail ? 'code' : 'email');
    const [email, setEmail] = useState(prefillEmail ?? '');
    const [code, setCode] = useState<string[]>(() =>
        Array(OTP_LENGTH).fill(''),
    );
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendIn, setResendIn] = useState(prefillEmail ? RESEND_SECONDS : 0);
    // Lockout progresif (Fibonacci): sisa detik dari server, dihitung mundur live.
    const [lockLeft, setLockLeft] = useState(lockoutSeconds ?? 0);
    // Sinkronkan saat server mengirim nilai lockout baru (pola "adjust state
    // during render" — tanpa effect, tanpa render ganda kaskade).
    const [prevLockout, setPrevLockout] = useState(lockoutSeconds ?? 0);

    if ((lockoutSeconds ?? 0) !== prevLockout) {
        setPrevLockout(lockoutSeconds ?? 0);
        setLockLeft(lockoutSeconds ?? 0);
    }

    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    // reCAPTCHA v3 (invisible): token diambil saat kirim OTP (anti-bot login).
    const recaptchaSiteKey = (
        usePage().props as {
            recaptchaSiteKey?: string;
        }
    ).recaptchaSiteKey;
    const executeRecaptcha = useRecaptchaV3(recaptchaSiteKey, 'otp_send');

    const emailValid = useMemo(
        () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
        [email],
    );
    const codeValue = code.join('');
    const codeComplete = codeValue.length === OTP_LENGTH;

    // Hitung mundur tombol kirim ulang.
    useEffect(() => {
        if (resendIn <= 0) {
            return;
        }

        const t = setTimeout(() => setResendIn((s) => s - 1), 1000);

        return () => clearTimeout(t);
    }, [resendIn]);

    // Sinkronkan sisa lockout dari server (flash prop berubah tiap respons).
    // Hitung mundur lockout progresif.
    useEffect(() => {
        if (lockLeft <= 0) {
            return;
        }

        const t = setTimeout(() => setLockLeft((s) => s - 1), 1000);

        return () => clearTimeout(t);
    }, [lockLeft]);

    // Fokus otomatis ke kotak pertama saat masuk langkah kode.
    useEffect(() => {
        if (step === 'code') {
            inputsRef.current[0]?.focus();
        }
    }, [step]);

    // Error yang ditampilkan: prioritaskan hasil handler lokal (router.post
    // onError), lalu error yang datang lewat props Inertia (redirect back server).
    // Selama lockout progresif, tampilkan hitung mundur live menggantikan pesan statis.
    const locked = lockLeft > 0;
    const shownError = locked
        ? `Terlalu banyak percobaan salah. Coba lagi dalam ${formatLockout(lockLeft)}.`
        : (error ?? errors?.otp ?? errors?.email ?? null);

    /* ---- Langkah 1: minta OTP ---------------------------------------- */
    function handleRequestOtp(e: React.FormEvent) {
        e.preventDefault();

        if (!emailValid || processing || locked) {
            return;
        }

        setError(null);
        setProcessing(true);

        // Token reCAPTCHA v3 diambil dulu (invisible), lalu POST.
        void executeRecaptcha().then((token) => {
            router.post(
                '/otp/send',
                { email: email.trim(), recaptcha_token: token },
                {
                    preserveScroll: true,
                    // Controller flash `status` bila sukses → pindah ke langkah kode.
                    onSuccess: () => {
                        setStep('code');
                        setResendIn(RESEND_SECONDS);
                    },
                    onError: (errs) => {
                        setError(
                            errs.recaptcha_token ??
                                errs.email ??
                                'Gagal mengirim kode. Coba lagi.',
                        );
                    },
                    onFinish: () => setProcessing(false),
                },
            );
        });
    }

    /* ---- Langkah 2: verifikasi OTP ----------------------------------- */
    function handleVerifyOtp(e?: React.FormEvent) {
        e?.preventDefault();

        if (!codeComplete || processing || locked) {
            return;
        }

        setError(null);
        setProcessing(true);

        router.post(
            '/otp/verify',
            { email: email.trim(), otp: codeValue },
            {
                preserveScroll: true,
                // Sukses → controller redirect sesuai peran (tak ada callback sukses di sini).
                onError: (errs) => {
                    setError(
                        errs.otp ??
                            errs.email ??
                            'Kode tidak valid atau telah kedaluwarsa.',
                    );
                    setCode(Array(OTP_LENGTH).fill(''));
                    inputsRef.current[0]?.focus();
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    function handleResend() {
        if (resendIn > 0 || processing || locked) {
            return;
        }

        setError(null);
        setCode(Array(OTP_LENGTH).fill(''));
        setProcessing(true);

        void executeRecaptcha().then((token) => {
            router.post(
                '/otp/send',
                { email: email.trim(), recaptcha_token: token },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setResendIn(RESEND_SECONDS);
                        inputsRef.current[0]?.focus();
                    },
                    onError: (errs) => {
                        setError(
                            errs.recaptcha_token ??
                                errs.email ??
                                'Gagal mengirim ulang kode. Coba lagi.',
                        );
                    },
                    onFinish: () => setProcessing(false),
                },
            );
        });
    }

    /* ---- Input OTP: ketik, hapus, navigasi panah, tempel ------------- */
    function setDigit(index: number, value: string) {
        const digit = value.replace(/\D/g, '').slice(-1);
        setCode((prev) => {
            const next = [...prev];
            next[index] = digit;

            return next;
        });

        if (digit && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    }

    function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputsRef.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    }

    function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
        e.preventDefault();
        const digits = e.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, OTP_LENGTH);

        if (!digits) {
            return;
        }

        const next = Array(OTP_LENGTH).fill('');
        digits.split('').forEach((d, i) => (next[i] = d));
        setCode(next);
        inputsRef.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
    }

    // Kelas bersama untuk tombol aksi utama (gradien biru + hover terangkat).
    const primaryBtn =
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#106feb] to-[#0b4fb0] text-sm font-bold text-white shadow-lg shadow-[#106feb]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#106feb]/35 focus-visible:ring-2 focus-visible:ring-[#0b4fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';

    return (
        <>
            <Head title="Masuk — E-Magang Kota Madiun">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div
                className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5faff] px-5 py-12 text-[#0a1628] selection:bg-[#cddcef] selection:text-[#0a1628]"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                {/* Glow blobs latar — konsisten dengan hero landing */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10"
                >
                    <div className="absolute -top-24 left-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#0b4fb0]/20 blur-[120px]" />
                    <div className="absolute top-1/3 right-1/4 h-[360px] w-[360px] translate-x-1/2 rounded-full bg-[#106feb]/15 blur-[120px]" />
                    <div className="absolute bottom-0 left-1/2 h-[300px] w-[520px] -translate-x-1/2 rounded-full bg-[#cddcef]/25 blur-[120px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'circOut' }}
                    className="w-full max-w-md"
                >
                    {/* Kembali ke beranda */}
                    <Link
                        href="/"
                        className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#0a1628]/60 transition-colors hover:text-[#106feb] focus-visible:ring-2 focus-visible:ring-[#0b4fb0]/50 focus-visible:outline-none"
                    >
                        <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                        Kembali ke beranda
                    </Link>

                    {/* Kartu autentikasi */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-8 shadow-[0_20px_60px_rgba(8,71,156,0.12)] backdrop-blur-sm md:p-10">
                        {/* glow lembut di pojok kartu */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -top-20 -right-20 h-[240px] w-[240px] rounded-full bg-[#cddcef]/30 blur-[80px]"
                        />

                        {/* Brand — badge ikon gradien + wordmark */}
                        <div className="relative mb-8 flex flex-col items-center text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#106feb] to-[#0b4fb0] shadow-[0_12px_30px_-6px_rgba(20,99,208,0.6)]">
                                <GraduationCap className="size-7 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-[#0a1628] to-[#0b4fb0] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
                                E-Magang
                            </span>
                            <span className="mt-0.5 text-[13px] font-medium text-[#0a1628]/50">
                                Portal Magang Pemerintah Kota Madiun
                            </span>
                        </div>

                        {status && (
                            <div className="relative mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                <CheckCircle2 className="size-4 shrink-0" />
                                {status}
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {step === 'email' ? (
                                <motion.div
                                    key="email"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{
                                        duration: 0.3,
                                        ease: 'circOut',
                                    }}
                                    className="relative"
                                >
                                    <div className="mb-6 text-center">
                                        <h1 className="text-xl font-bold text-[#0a1628]">
                                            Masuk ke akun Anda
                                        </h1>
                                        <p className="mx-auto mt-1.5 max-w-xs text-sm text-[#0a1628]/55">
                                            Masukkan email terdaftar. Kami akan
                                            mengirim kode verifikasi 6 digit.
                                        </p>
                                    </div>

                                    <form
                                        onSubmit={handleRequestOtp}
                                        className="space-y-5"
                                    >
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="email"
                                                className="text-sm font-semibold text-[#0a1628]"
                                            >
                                                Alamat Email
                                            </label>
                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#0a1628]/40" />
                                                <input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    autoFocus
                                                    autoComplete="email"
                                                    inputMode="email"
                                                    placeholder="nama@email.com"
                                                    value={email}
                                                    onChange={(e) =>
                                                        setEmail(e.target.value)
                                                    }
                                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pr-4 pl-12 text-sm text-[#0a1628] transition-all outline-none placeholder:text-slate-400 hover:border-[#cddcef] focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                                                />
                                            </div>
                                        </div>

                                        {shownError && (
                                            <p className="text-sm font-medium text-rose-600">
                                                {shownError}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={
                                                !emailValid ||
                                                processing ||
                                                locked
                                            }
                                            className={primaryBtn}
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    Mengirim kode…
                                                </>
                                            ) : (
                                                <>
                                                    Kirim Kode OTP
                                                    <ArrowRight className="size-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <p className="mt-8 text-center text-sm text-[#0a1628]/55">
                                        Belum punya akun?{' '}
                                        <Link
                                            href="/#daftar"
                                            className="font-semibold text-[#106feb] hover:underline"
                                        >
                                            Ajukan magang
                                        </Link>
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="code"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 16 }}
                                    transition={{
                                        duration: 0.3,
                                        ease: 'circOut',
                                    }}
                                    className="relative"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('email');
                                            setError(null);
                                        }}
                                        className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#0a1628]/55 transition hover:text-[#106feb]"
                                    >
                                        <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                                        Ubah email
                                    </button>

                                    <div className="mb-6 text-center">
                                        <h1 className="text-xl font-bold text-[#0a1628]">
                                            Masukkan kode verifikasi
                                        </h1>
                                        <p className="mx-auto mt-1.5 max-w-xs text-sm text-[#0a1628]/55">
                                            Kami mengirim 6 digit kode ke{' '}
                                            <span className="font-semibold text-[#0a1628]">
                                                {email}
                                            </span>
                                            .
                                        </p>
                                    </div>

                                    <form
                                        onSubmit={handleVerifyOtp}
                                        className="space-y-6"
                                    >
                                        <div
                                            className="flex justify-between gap-2"
                                            onPaste={handlePaste}
                                        >
                                            {code.map((digit, i) => (
                                                <input
                                                    key={i}
                                                    ref={(el) => {
                                                        inputsRef.current[i] =
                                                            el;
                                                    }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    autoFocus={i === 0}
                                                    value={digit}
                                                    onChange={(e) =>
                                                        setDigit(
                                                            i,
                                                            e.target.value,
                                                        )
                                                    }
                                                    onKeyDown={(e) =>
                                                        handleKeyDown(i, e)
                                                    }
                                                    onFocus={(e) =>
                                                        e.target.select()
                                                    }
                                                    className={cn(
                                                        'size-12 rounded-2xl border-2 bg-white text-center text-lg font-bold text-[#0a1628] transition-all outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15',
                                                        error
                                                            ? 'border-rose-300'
                                                            : digit
                                                              ? 'border-[#106feb]/50'
                                                              : 'border-slate-200 hover:border-[#cddcef]',
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        {shownError && (
                                            <p className="text-sm font-medium text-rose-600">
                                                {shownError}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={
                                                !codeComplete ||
                                                processing ||
                                                locked
                                            }
                                            className={primaryBtn}
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    Memverifikasi…
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="size-4" />
                                                    Verifikasi &amp; Masuk
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <p className="mt-8 text-center text-sm text-[#0a1628]/55">
                                        Tidak menerima kode?{' '}
                                        {locked ? (
                                            <span className="font-semibold text-slate-400">
                                                Kirim ulang dalam{' '}
                                                {formatLockout(lockLeft)}
                                            </span>
                                        ) : resendIn > 0 ? (
                                            <span className="font-semibold text-slate-400">
                                                Kirim ulang dalam {resendIn}s
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                className="font-semibold text-[#106feb] hover:underline"
                                            >
                                                Kirim ulang kode
                                            </button>
                                        )}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Baris penanda kepercayaan — chip pill konsisten dgn landing */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-[12px] font-medium text-[#0a1628]/55">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-white/60 px-3 py-1.5 shadow-sm backdrop-blur-md">
                            <ShieldCheck className="size-3.5 text-[#106feb]" />
                            Tanpa Password
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-white/60 px-3 py-1.5 shadow-sm backdrop-blur-md">
                            <CheckCircle2 className="size-3.5 text-[#106feb]" />
                            Data Terlindungi
                        </span>
                    </div>

                    <p className="mt-6 text-center text-xs text-[#0a1628]/40">
                        © 2026 Dinas Komunikasi dan Informatika Kota Madiun.
                    </p>
                </motion.div>
            </div>
        </>
    );
}
