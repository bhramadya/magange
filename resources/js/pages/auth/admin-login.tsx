import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Lock, ShieldCheck, User2, Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';

/* =========================================================================
 *  LOGIN ADMIN — E-MAGANG (Pemkot Madiun)
 *  Login konvensional Username + Password, TERPISAH dari alur OTP mahasiswa.
 *  Khusus Admin Verifikator & Admin OPD.
 *
 *  POST → /admin/login (name: admin.login.attempt)
 * ========================================================================= */

export default function AdminLogin() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/admin/login');
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-[#0a1628]">
            <Head title="Login Admin" />

            <div className="w-full max-w-md">
                <Link
                    href="/"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#106feb]"
                >
                    <ArrowLeft className="size-4" /> Kembali ke beranda
                </Link>

                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    {/* Header brand */}
                    <div className="mb-7 flex flex-col items-center text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#106feb] text-white shadow-md shadow-[#106feb]/25">
                            <ShieldCheck className="size-7" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-[#0a1628]">Login Admin</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Khusus Admin Verifikator &amp; Admin OPD E-Magang Kota Madiun.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label htmlFor="username" className="text-sm font-semibold text-[#0a1628]">
                                Username
                            </label>
                            <div className="relative">
                                <User2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="cth. verifikator"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                                />
                            </div>
                            {errors.username && <p className="text-xs font-medium text-rose-600">{errors.username}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-semibold text-[#0a1628]">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                                />
                            </div>
                            {errors.password && <p className="text-xs font-medium text-rose-600">{errors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#106feb] text-sm font-bold text-white shadow-sm transition hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                            Masuk
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        Peserta magang?{' '}
                        <Link href="/login-otp" className="font-semibold text-[#106feb] hover:underline">
                            Masuk dengan OTP email
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
