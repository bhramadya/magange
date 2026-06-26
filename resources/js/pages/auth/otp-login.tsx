import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Mail,
    ShieldCheck,
    Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

/* =========================================================================
 *  LOGIN OTP — E-MAGANG (Pemkot Madiun)
 *  Alur 2 langkah tanpa password:
 *    1) Peserta memasukkan email  → backend kirim kode OTP 6 digit.
 *    2) Peserta memasukkan kode    → backend verifikasi & buat sesi.
 *
 *  FRONTEND ONLY. Handler di bawah memakai simulasi state lokal supaya
 *  halaman bisa dipratinjau tanpa backend. Rekan backend cukup mengganti
 *  `handleRequestOtp` & `handleVerifyOtp` dengan panggilan Inertia:
 *
 *    router.post('/login/otp/request', { email })           // langkah 1
 *    router.post('/login/otp/verify',  { email, code })     // langkah 2
 *
 *  Props `status` & `errors` opsional bila controller mengembalikannya.
 * ========================================================================= */

type Step = 'email' | 'code';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

interface OtpLoginProps {
    status?: string;
}

export default function OtpLogin({ status }: OtpLoginProps) {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendIn, setResendIn] = useState(0);

    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
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

    // Fokus otomatis ke kotak pertama saat masuk langkah kode.
    useEffect(() => {
        if (step === 'code') {
            inputsRef.current[0]?.focus();
        }
    }, [step]);

    /* ---- Langkah 1: minta OTP ---------------------------------------- */
    function handleRequestOtp(e: React.FormEvent) {
        e.preventDefault();

        if (!emailValid || processing) {
            return;
        }

        setError(null);
        setProcessing(true);

        // TODO(backend): router.post('/login/otp/request', { email }, {...})
        setTimeout(() => {
            setProcessing(false);
            setStep('code');
            setResendIn(RESEND_SECONDS);
        }, 900);
    }

    /* ---- Langkah 2: verifikasi OTP ----------------------------------- */
    function handleVerifyOtp(e?: React.FormEvent) {
        e?.preventDefault();

        if (!codeComplete || processing) {
            return;
        }

        setError(null);
        setProcessing(true);

        // TODO(backend): router.post('/login/otp/verify', { email, code: codeValue }, {...})
        setTimeout(() => {
            setProcessing(false);

            // Demo: kode "000000" dianggap salah agar UI error terlihat.
            if (codeValue === '000000') {
                setError('Kode yang dimasukkan salah atau telah kedaluwarsa.');
                setCode(Array(OTP_LENGTH).fill(''));
                inputsRef.current[0]?.focus();

                return;
            }

            window.location.href = '/dashboard';
        }, 900);
    }

    function handleResend() {
        if (resendIn > 0 || processing) {
            return;
        }

        setError(null);
        setCode(Array(OTP_LENGTH).fill(''));
        setResendIn(RESEND_SECONDS);
        inputsRef.current[0]?.focus();
        // TODO(backend): router.post('/login/otp/request', { email })
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
        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);

        if (!digits) {
            return;
        }

        const next = Array(OTP_LENGTH).fill('');
        digits.split('').forEach((d, i) => (next[i] = d));
        setCode(next);
        inputsRef.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
    }

    return (
        <>
            <Head title="Masuk — E-Magang Kota Madiun" />

            <div className="grid min-h-screen lg:grid-cols-2">
                {/* ===== Panel brand (kiri, desktop) ===== */}
                <aside className="relative hidden overflow-hidden bg-[#12213e] lg:flex lg:flex-col lg:justify-between lg:p-12">
                    {/* ornamen */}
                    <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#106feb]/30 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-[#106feb]/20 blur-3xl" />

                    <Link href="/" className="relative flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-[#106feb] text-base font-black text-white shadow-lg">
                            eM
                        </div>
                        <div className="leading-tight text-white">
                            <p className="text-sm font-bold">E-Magang</p>
                            <p className="text-[11px] font-medium text-white/60">Pemerintah Kota Madiun</p>
                        </div>
                    </Link>

                    <div className="relative max-w-md text-white">
                        <h2 className="text-3xl font-black leading-tight">
                            Satu pintu untuk seluruh proses magang Anda.
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-white/70">
                            Ajukan permohonan, pantau status verifikasi, hingga unduh e-sertifikat —
                            semua terpusat dan transparan dalam satu akun.
                        </p>

                        <ul className="mt-8 space-y-3">
                            {[
                                'Tanpa password — masuk cukup dengan kode OTP',
                                'Lacak status pengajuan secara real-time',
                                'Sertifikat digital resmi Dinas Kominfo',
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                                    <CheckCircle2 className="size-5 shrink-0 text-[#cddcef]" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="relative text-xs text-white/40">
                        © {2026} Dinas Komunikasi dan Informatika Kota Madiun.
                    </p>
                </aside>

                {/* ===== Panel form (kanan) ===== */}
                <main className="flex items-center justify-center bg-slate-50 px-5 py-12 sm:px-8">
                    <div className="w-full max-w-sm">
                        {/* Brand mobile */}
                        <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[#106feb] text-base font-black text-white shadow-sm">
                                eM
                            </div>
                            <div className="leading-tight">
                                <p className="text-sm font-bold text-[#12213e]">E-Magang</p>
                                <p className="text-[11px] font-medium text-slate-500">Kota Madiun</p>
                            </div>
                        </Link>

                        {status && (
                            <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
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
                                    transition={{ duration: 0.3, ease: 'circOut' }}
                                >
                                    <div className="mb-8">
                                        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#cddcef]/60 text-[#106feb]">
                                            <Mail className="size-6" />
                                        </div>
                                        <h1 className="text-2xl font-black text-[#12213e]">Masuk ke akun Anda</h1>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Masukkan email terdaftar. Kami akan mengirim kode verifikasi 6 digit.
                                        </p>
                                    </div>

                                    <form onSubmit={handleRequestOtp} className="space-y-5">
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-semibold text-[#12213e]">
                                                Alamat Email
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                autoFocus
                                                autoComplete="email"
                                                inputMode="email"
                                                placeholder="nama@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                                            />
                                        </div>

                                        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

                                        <button
                                            type="submit"
                                            disabled={!emailValid || processing}
                                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#106feb] text-sm font-bold text-white shadow-sm shadow-[#106feb]/30 transition hover:bg-[#0b5ed0] disabled:cursor-not-allowed disabled:opacity-50"
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

                                    <p className="mt-8 text-center text-sm text-slate-500">
                                        Belum punya akun?{' '}
                                        <Link href="/#daftar" className="font-semibold text-[#106feb] hover:underline">
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
                                    transition={{ duration: 0.3, ease: 'circOut' }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('email');
                                            setError(null);
                                        }}
                                        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#12213e]"
                                    >
                                        <ArrowLeft className="size-4" />
                                        Ubah email
                                    </button>

                                    <div className="mb-8">
                                        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#cddcef]/60 text-[#106feb]">
                                            <ShieldCheck className="size-6" />
                                        </div>
                                        <h1 className="text-2xl font-black text-[#12213e]">Masukkan kode verifikasi</h1>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Kami mengirim 6 digit kode ke{' '}
                                            <span className="font-semibold text-[#12213e]">{email}</span>.
                                        </p>
                                    </div>

                                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                                        <div className="flex justify-between gap-2" onPaste={handlePaste}>
                                            {code.map((digit, i) => (
                                                <input
                                                    key={i}
                                                    ref={(el) => {
                                                        inputsRef.current[i] = el;
                                                    }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => setDigit(i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                                    onFocus={(e) => e.target.select()}
                                                    className={cn(
                                                        'size-12 rounded-xl border bg-white text-center text-lg font-bold text-[#12213e] outline-none transition focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15',
                                                        error ? 'border-rose-300' : 'border-slate-200',
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

                                        <button
                                            type="submit"
                                            disabled={!codeComplete || processing}
                                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#106feb] text-sm font-bold text-white shadow-sm shadow-[#106feb]/30 transition hover:bg-[#0b5ed0] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    Memverifikasi…
                                                </>
                                            ) : (
                                                'Verifikasi & Masuk'
                                            )}
                                        </button>
                                    </form>

                                    <p className="mt-8 text-center text-sm text-slate-500">
                                        Tidak menerima kode?{' '}
                                        {resendIn > 0 ? (
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
                </main>
            </div>
        </>
    );
}
