import { Head, useForm } from '@inertiajs/react';
import { KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import type { FormEvent } from 'react';

/* =========================================================================
 *  GANTI PASSWORD WAJIB — E-MAGANG (Pemkot Madiun)
 *  Ditampilkan saat admin (OPD / Verifikator) login pertama kali dengan
 *  password hasil auto-generate (users.must_change_password = true).
 *  Backend memblokir akses dasbor sampai password baru disimpan.
 *
 *  POST → /admin/password-baru { password, password_confirmation }
 * ========================================================================= */

export default function ForcePassword() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/admin/password-baru');
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-[#0a1628]">
            <Head title="Ganti Password" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'circOut' }}
                className="w-full max-w-md"
            >
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    {/* Header brand */}
                    <div className="mb-7 flex flex-col items-center text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/25">
                            <KeyRound className="size-7" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-[#0a1628]">
                            Ganti Password Anda
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Anda masuk dengan password sementara. Demi keamanan,
                            buat password baru sebelum melanjutkan ke dasbor.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Password baru */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="password"
                                className="text-sm font-semibold text-[#0a1628]"
                            >
                                Password Baru
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="password"
                                    type="password"
                                    autoFocus
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder="Minimal 8 karakter"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm transition outline-none hover:border-[#cddcef] focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-xs font-medium text-rose-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Konfirmasi */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="password_confirmation"
                                className="text-sm font-semibold text-[#0a1628]"
                            >
                                Ulangi Password Baru
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="••••••••"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm transition outline-none hover:border-[#cddcef] focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                                />
                            </div>
                            {errors.password_confirmation && (
                                <p className="text-xs font-medium text-rose-600">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={
                                processing ||
                                !data.password ||
                                !data.password_confirmation
                            }
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#106feb] text-sm font-bold text-white shadow-sm transition hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="size-4" />
                            )}
                            Simpan &amp; Lanjut ke Dasbor
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
