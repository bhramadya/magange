import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Loader2, Pencil, Users } from 'lucide-react';
import { useState } from 'react';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import type { MagangUser, Opd } from '@/types/magang';

/* =========================================================================
 *  KELOLA KUOTA OPD — E-MAGANG (Pemkot Madiun) · Admin Verifikator
 *  Dipindah dari panel bawah dasbor ke menu sidebar tersendiri (revisi mentor).
 *  Verifikator berhak mengubah kuota SEMUA OPD → PATCH /kuota/{opd}.
 * ========================================================================= */

/* ---- Data tiruan (fallback pratinjau bila props kosong) -------------- */
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
        name: 'Dinas Pendidikan',
        code: 'DISDIK',
        quota: 8,
        quota_used: 2,
    },
    { id: 3, name: 'Dinas Kesehatan', code: 'DINKES', quota: 6, quota_used: 6 },
    {
        id: 4,
        name: 'Badan Kepegawaian Daerah',
        code: 'BKD',
        quota: 4,
        quota_used: 1,
    },
    {
        id: 5,
        name: 'Sekretariat Daerah',
        code: 'SETDA',
        quota: 12,
        quota_used: 5,
    },
];

/* ---- Baris editor kuota per-OPD -------------------------------------- */
function OpdQuotaRow({ opd }: { opd: Opd }) {
    const used = opd.quota_used ?? 0;
    const [total, setTotal] = useState(opd.quota ?? 0);
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(String(opd.quota ?? 0));
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parsed = Number(value);
    const valid = Number.isInteger(parsed) && parsed >= used && parsed <= 1000;
    const sisa = Math.max(0, total - used);

    function save() {
        if (!valid || processing) {
            return;
        }

        setError(null);
        setProcessing(true);
        router.patch(
            `/kuota/${opd.id}`,
            { quota_total: parsed },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setTotal(parsed);
                    setEditing(false);
                },
                onError: (errs) =>
                    setError(errs.quota_total ?? 'Gagal memperbarui kuota.'),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#12213e]">
                    {opd.name}
                </p>
                <p className="text-xs text-slate-500">
                    {opd.code} • sisa{' '}
                    <span className="font-semibold text-emerald-600">
                        {sisa} kursi
                    </span>{' '}
                    • terpakai {used}
                </p>
                {error && (
                    <p className="mt-1 text-xs font-medium text-rose-600">
                        {error}
                    </p>
                )}
            </div>
            {editing ? (
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min={used}
                        max={1000}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                    />
                    <button
                        type="button"
                        onClick={save}
                        disabled={!valid || processing}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#106feb] px-3 text-xs font-bold text-white transition hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="size-3.5" />
                        )}{' '}
                        Simpan
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setEditing(false);
                            setError(null);
                        }}
                        className="h-9 rounded-lg px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
                    >
                        Batal
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        setValue(String(total));
                        setEditing(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#106feb] transition hover:bg-slate-50"
                >
                    <Pencil className="size-3.5" /> Ubah
                </button>
            )}
        </div>
    );
}

/* ---- Halaman --------------------------------------------------------- */
interface VerifikatorKuotaProps {
    user?: MagangUser;
    opds?: Opd[];
}

export default function VerifikatorKuota({
    user = MOCK_USER,
    opds = MOCK_OPDS,
}: VerifikatorKuotaProps) {
    return (
        <MagangLayout
            user={user}
            title="Kelola Kuota OPD"
            active="kuota"
            navItems={verifikatorNav}
        >
            <Head title="Kelola Kuota OPD — E-Magang" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">
                        Kelola Kuota OPD
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Sebagai Admin Verifikator, Anda dapat mengubah kuota
                        magang seluruh OPD. Kuota tidak boleh lebih kecil dari
                        jumlah yang sudah terpakai.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-1 flex items-center gap-1.5">
                        <Users className="size-4 text-[#106feb]" />
                        <h3 className="text-sm font-bold text-[#12213e]">
                            Daftar Kuota
                        </h3>
                    </div>
                    <p className="mb-4 text-xs text-slate-500">
                        Klik “Ubah” untuk menyesuaikan total kuota tiap OPD.
                    </p>
                    <div className="divide-y divide-slate-100">
                        {opds.map((opd) => (
                            <OpdQuotaRow key={opd.id} opd={opd} />
                        ))}
                    </div>
                </div>
            </div>
        </MagangLayout>
    );
}
