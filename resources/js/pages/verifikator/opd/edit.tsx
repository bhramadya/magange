import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import type { MagangUser, Opd } from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — EDIT OPD (verifikator/opd/edit)
 *  Prefilled dari prop `opd` → PUT verifikator.opd.update. Kuota minimal =
 *  kuota_used (tak boleh diturunkan di bawah yang sudah terpakai).
 * ========================================================================= */

interface OpdEditProps {
    user?: MagangUser;
    opd: Opd;
}

const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Dewi Anggraini',
    email: 'verifikator@madiunkota.go.id',
    whatsapp_number: '6281234567890',
    role: 'admin_verifikator',
};

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#12213e] placeholder:text-slate-400 focus:border-[#106feb] focus:outline-none focus:ring-2 focus:ring-[#106feb]/15';

export default function OpdEdit({ user = MOCK_USER, opd }: OpdEditProps) {
    const used = opd.quota_used ?? 0;

    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        code: string;
        kode_opd: string;
        inisial_opd: string;
        description: string;
        quota_total: number;
        is_active: boolean;
    }>({
        name: opd.name,
        code: opd.code,
        kode_opd: opd.kode_opd != null ? String(opd.kode_opd) : '',
        inisial_opd: opd.inisial_opd ?? '',
        description: opd.description ?? '',
        quota_total: opd.quota ?? 0,
        is_active: opd.is_active ?? true,
    });

    return (
        <MagangLayout
            user={user}
            title="Edit OPD"
            active="opd"
            navItems={verifikatorNav}
        >
            <Head title="Edit OPD — Verifikator" />

            <div className="mx-auto max-w-2xl space-y-6">
                <Link
                    href="/verifikator/opd"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#106feb]"
                >
                    <ArrowLeft className="size-4" /> Kembali ke daftar
                </Link>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-black text-[#12213e]">
                        Edit OPD
                    </h2>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            put(`/verifikator/opd/${opd.id}`);
                        }}
                        className="mt-5 space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="name"
                                className="text-sm font-medium text-[#12213e]"
                            >
                                Nama OPD
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className={`mt-1.5 ${inputClass}`}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="code"
                                className="text-sm font-medium text-[#12213e]"
                            >
                                Kode OPD
                            </label>
                            <input
                                id="code"
                                type="text"
                                value={data.code}
                                onChange={(e) =>
                                    setData('code', e.target.value)
                                }
                                className={`mt-1.5 ${inputClass}`}
                            />
                            {errors.code && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        {/* Revisi baru: kode internal (angka) + inisial publik */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="kode_opd"
                                    className="text-sm font-medium text-[#12213e]"
                                >
                                    Kode OPD (angka, internal)
                                </label>
                                <input
                                    id="kode_opd"
                                    type="text"
                                    inputMode="numeric"
                                    value={data.kode_opd}
                                    onChange={(e) =>
                                        setData(
                                            'kode_opd',
                                            e.target.value.replace(/\D/g, ''),
                                        )
                                    }
                                    className={`mt-1.5 ${inputClass}`}
                                    placeholder="Contoh: 401"
                                />
                                {errors.kode_opd && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {errors.kode_opd}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="inisial_opd"
                                    className="text-sm font-medium text-[#12213e]"
                                >
                                    Inisial OPD (publik)
                                </label>
                                <input
                                    id="inisial_opd"
                                    type="text"
                                    value={data.inisial_opd}
                                    onChange={(e) =>
                                        setData('inisial_opd', e.target.value)
                                    }
                                    className={`mt-1.5 ${inputClass}`}
                                    placeholder="Contoh: KOMINFO"
                                />
                                {errors.inisial_opd && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {errors.inisial_opd}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="text-sm font-medium text-[#12213e]"
                            >
                                Tag{' '}
                                <span className="font-normal text-slate-400">
                                    (opsional)
                                </span>
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                className={`mt-1.5 resize-none ${inputClass}`}
                                placeholder="tambahkan tag (pisahkan dengan koma)"
                            />
                            {errors.description && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="quota_total"
                                    className="text-sm font-medium text-[#12213e]"
                                >
                                    Kuota total
                                </label>
                                <input
                                    id="quota_total"
                                    type="number"
                                    min={used}
                                    max={1000}
                                    value={data.quota_total}
                                    onChange={(e) =>
                                        setData(
                                            'quota_total',
                                            Number(e.target.value),
                                        )
                                    }
                                    className={`mt-1.5 ${inputClass}`}
                                />
                                <p className="mt-1 text-xs text-slate-400">
                                    Terpakai {used} • tidak boleh di bawah
                                    jumlah terpakai
                                </p>
                                {errors.quota_total && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {errors.quota_total}
                                    </p>
                                )}
                            </div>
                            <label className="flex cursor-pointer items-center gap-2.5 sm:mt-7">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) =>
                                        setData('is_active', e.target.checked)
                                    }
                                    className="size-4 rounded border-slate-300 text-[#106feb] focus:ring-[#106feb]"
                                />
                                <span className="text-sm text-slate-600">
                                    OPD aktif
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#106feb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                            >
                                {processing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Save className="size-4" />
                                )}
                                Simpan
                            </button>
                            <Link
                                href="/verifikator/opd"
                                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                            >
                                Batal
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </MagangLayout>
    );
}
