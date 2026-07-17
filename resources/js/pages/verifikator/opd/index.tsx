import { Head, Link, router } from '@inertiajs/react';
import { Building2, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import type { MagangUser, Opd } from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — KELOLA OPD (verifikator/opd/index)
 *  CRUD OPD (menggantikan halaman "Kelola Kuota OPD" lama). Props dari
 *  OpdController@index: `opds` (koleksi OpdResource, dibungkus { data }).
 *  Hapus hanya tersedia bila kuota_used = 0 (integritas peserta magang).
 * ========================================================================= */

interface Collection<T> {
    data: T[];
}

interface OpdIndexProps {
    user?: MagangUser;
    opds?: Collection<Opd> | Opd[];
}

const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Dewi Anggraini',
    email: 'verifikator@madiunkota.go.id',
    whatsapp_number: '6281234567890',
    role: 'admin_verifikator',
};

const MOCK_OPDS: Opd[] = [
    {
        id: 1,
        name: 'Dinas Komunikasi dan Informatika',
        code: 'DISKOMINFO',
        quota: 10,
        quota_used: 4,
    },
    {
        id: 2,
        name: 'Badan Kepegawaian Daerah',
        code: 'BKD',
        quota: 4,
        quota_used: 0,
    },
];

function DeleteButton({
    opdId,
    disabled,
}: {
    opdId: number;
    disabled: boolean;
}) {
    const [confirming, setConfirming] = useState(false);
    const [processing, setProcessing] = useState(false);

    if (disabled) {
        return (
            <span
                title="OPD dengan peserta magang tidak dapat dihapus"
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-300"
            >
                <Trash2 className="size-4" /> Hapus
            </span>
        );
    }

    if (!confirming) {
        return (
            <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
                <Trash2 className="size-4" /> Hapus
            </button>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5">
            <button
                type="button"
                disabled={processing}
                onClick={() => {
                    setProcessing(true);
                    router.delete(`/verifikator/opd/${opdId}`, {
                        preserveScroll: true,
                        onFinish: () => setProcessing(false),
                    });
                }}
                className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
                Ya, hapus
            </button>
            <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
                Batal
            </button>
        </span>
    );
}

export default function OpdIndex({
    user = MOCK_USER,
    opds = MOCK_OPDS,
}: OpdIndexProps) {
    const list = Array.isArray(opds) ? opds : opds.data;

    return (
        <MagangLayout
            user={user}
            title="Kelola OPD"
            active="opd"
            navItems={verifikatorNav}
        >
            <Head title="Kelola OPD — Verifikator" />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#12213e]">
                            Kelola OPD
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Kelola daftar Organisasi Perangkat Daerah beserta
                            kuota magangnya. Kuota tidak boleh lebih kecil dari
                            jumlah yang sudah terpakai.
                        </p>
                    </div>
                    <Link
                        href="/verifikator/opd/create"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#106feb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b4fb0]"
                    >
                        <Plus className="size-4" /> Tambah OPD
                    </Link>
                </div>

                <div className="space-y-3">
                    {list.map((opd) => {
                        const used = opd.quota_used ?? 0;
                        const total = opd.quota ?? 0;
                        const sisa = Math.max(0, total - used);

                        return (
                            <div
                                key={opd.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                                                {opd.code}
                                            </span>
                                            {opd.is_active === false && (
                                                <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </div>
                                        <p className="flex items-center gap-1.5 text-sm font-bold text-[#12213e]">
                                            <Building2 className="size-4 shrink-0 text-slate-400" />
                                            {opd.name}
                                        </p>
                                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Users className="size-3.5" /> Kuota{' '}
                                            {total} • sisa{' '}
                                            <span className="font-semibold text-emerald-600">
                                                {sisa} kursi
                                            </span>{' '}
                                            • terpakai {used}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Link
                                            href={`/verifikator/opd/${opd.id}/edit`}
                                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#106feb] transition hover:bg-[#cddcef]/30"
                                        >
                                            <Pencil className="size-4" /> Edit
                                        </Link>
                                        <DeleteButton
                                            opdId={opd.id}
                                            disabled={used > 0}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {list.length === 0 && (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <Building2 className="size-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">
                                Belum ada OPD. Tambahkan yang pertama.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MagangLayout>
    );
}
