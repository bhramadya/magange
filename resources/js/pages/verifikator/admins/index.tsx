import { Head, router, useForm } from '@inertiajs/react';
import {
    KeyRound,
    Loader2,
    Mail,
    Plus,
    Search,
    Trash2,
    UserCog,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { GeneratedCredentialsDialog } from '@/components/generated-credentials-dialog';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import type { MagangUser } from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — KELOLA ADMIN (verifikator/admins/index)
 *  CRUD akun sesama Admin Verifikator. Mekanisme kredensial sama dengan
 *  Kelola OPD: password di-generate backend → flash `generatedCredentials`
 *  → dialog salin; pemilik akun dipaksa ganti password saat login pertama.
 *  Akun sendiri tidak bisa dihapus.
 *
 *  Props dari Inertia::render('verifikator/admins/index', [
 *    'admins' => koleksi akun admin_verifikator { data },
 *  ]).
 * ========================================================================= */

interface AdminRow {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    is_active?: boolean;
    last_login_at?: string | null;
}

interface Collection<T> {
    data: T[];
}

interface AdminsIndexProps {
    user?: MagangUser;
    admins?: Collection<AdminRow> | AdminRow[];
}

const MOCK_ADMIN: MagangUser = {
    id: 1,
    name: 'Dewi Anggraini',
    email: 'verifikator@madiunkota.go.id',
    whatsapp_number: '6281234567890',
    role: 'admin_verifikator',
};

const MOCK_ADMINS: AdminRow[] = [
    {
        id: 1,
        name: 'Dewi Anggraini',
        username: 'verifikator',
        email: 'verifikator@madiunkota.go.id',
        is_active: true,
        last_login_at: '2026-06-24T07:55:00',
    },
    {
        id: 5,
        name: 'Bagus Prakoso',
        username: 'verifikator2',
        email: 'verifikator2@madiunkota.go.id',
        is_active: true,
        last_login_at: null,
    },
];

function formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#12213e] placeholder:text-slate-400 focus:border-[#106feb] focus:outline-none focus:ring-2 focus:ring-[#106feb]/15';

/** Form tambah admin — password TIDAK diinput, di-generate backend. */
function CreateAdminForm({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        username: string;
        email: string;
    }>({ name: '', username: '', email: '' });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/verifikator/admins', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-[#cddcef] bg-[#e8f2fe]/40 p-5"
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#12213e]">
                    Tambah Admin Verifikator
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600"
                    title="Tutup form"
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <label
                        htmlFor="admin-name"
                        className="text-xs font-medium text-[#12213e]"
                    >
                        Nama Lengkap
                    </label>
                    <input
                        id="admin-name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={`mt-1 ${inputClass}`}
                        placeholder="Nama admin"
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-rose-600">
                            {errors.name}
                        </p>
                    )}
                </div>
                <div>
                    <label
                        htmlFor="admin-username"
                        className="text-xs font-medium text-[#12213e]"
                    >
                        Username
                    </label>
                    <input
                        id="admin-username"
                        type="text"
                        value={data.username}
                        onChange={(e) => setData('username', e.target.value)}
                        className={`mt-1 ${inputClass}`}
                        placeholder="username login"
                    />
                    {errors.username && (
                        <p className="mt-1 text-xs text-rose-600">
                            {errors.username}
                        </p>
                    )}
                </div>
                <div>
                    <label
                        htmlFor="admin-email"
                        className="text-xs font-medium text-[#12213e]"
                    >
                        Email
                    </label>
                    <input
                        id="admin-email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className={`mt-1 ${inputClass}`}
                        placeholder="email@madiunkota.go.id"
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-rose-600">
                            {errors.email}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#106feb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                >
                    {processing ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Plus className="size-4" />
                    )}
                    Buat Akun
                </button>
                <p className="text-xs text-slate-500">
                    Password dibuat otomatis dan ditampilkan sekali setelah akun
                    tersimpan.
                </p>
            </div>
        </form>
    );
}

/** Reset password admin lain — konfirmasi inline, hasil via flash dialog. */
function ResetPasswordButton({ adminId }: { adminId: number }) {
    const [confirming, setConfirming] = useState(false);
    const [processing, setProcessing] = useState(false);

    if (!confirming) {
        return (
            <button
                type="button"
                onClick={() => setConfirming(true)}
                title="Buat password baru untuk admin ini"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-amber-600 transition hover:bg-amber-50"
            >
                <KeyRound className="size-4" /> Reset Password
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
                    router.post(
                        `/verifikator/admins/${adminId}/reset-password`,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => setConfirming(false),
                            onFinish: () => setProcessing(false),
                        },
                    );
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
                {processing && <Loader2 className="size-3.5 animate-spin" />}
                Ya, reset
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

function DeleteButton({
    adminId,
    disabled,
}: {
    adminId: number;
    disabled: boolean;
}) {
    const [confirming, setConfirming] = useState(false);
    const [processing, setProcessing] = useState(false);

    if (disabled) {
        return (
            <span
                title="Anda tidak dapat menghapus akun sendiri"
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
                    router.delete(`/verifikator/admins/${adminId}`, {
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

export default function VerifikatorAdmins({
    user = MOCK_ADMIN,
    admins = MOCK_ADMINS,
}: AdminsIndexProps) {
    const list = Array.isArray(admins) ? admins : admins.data;
    const [query, setQuery] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Pencarian client-side: nama / username / email.
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return list;
        }

        return list.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                (a.username ?? '').toLowerCase().includes(q) ||
                a.email.toLowerCase().includes(q),
        );
    }, [list, query]);

    return (
        <MagangLayout
            user={user}
            title="Kelola Admin"
            active="admins"
            navItems={verifikatorNav}
        >
            <Head title="Kelola Admin — Verifikator" />

            {/* Dialog kredensial (flash generatedCredentials) */}
            <GeneratedCredentialsDialog />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#12213e]">
                            Kelola Admin
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Kelola akun Admin Verifikator. Password dibuat
                            otomatis oleh sistem dan wajib diganti pemilik akun
                            saat login pertama.
                        </p>
                    </div>
                    {!showForm && (
                        <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#106feb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b4fb0]"
                        >
                            <Plus className="size-4" /> Tambah Admin
                        </button>
                    )}
                </div>

                {showForm && (
                    <CreateAdminForm onClose={() => setShowForm(false)} />
                )}

                {/* Pencarian */}
                <div className="relative sm:w-72">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari nama / username / email…"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                    />
                </div>

                <div className="space-y-3">
                    {filtered.map((admin) => {
                        const self = admin.id === user.id;

                        return (
                            <div
                                key={admin.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-bold text-[#12213e]">
                                                {admin.name}
                                            </p>
                                            {admin.username && (
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-500">
                                                    {admin.username}
                                                </span>
                                            )}
                                            {self && (
                                                <span className="rounded-full bg-[#e8f2fe] px-2.5 py-0.5 text-xs font-semibold text-[#106feb]">
                                                    Anda
                                                </span>
                                            )}
                                            <span
                                                className={cn(
                                                    'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                                    admin.is_active !== false
                                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                        : 'bg-slate-50 text-slate-500 ring-slate-200',
                                                )}
                                            >
                                                {admin.is_active !== false
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </span>
                                        </div>
                                        <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                                            <Mail className="size-3.5 shrink-0" />
                                            {admin.email}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Login terakhir:{' '}
                                            {admin.last_login_at
                                                ? formatDateTime(
                                                      admin.last_login_at,
                                                  )
                                                : 'belum pernah'}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                                        <ResetPasswordButton
                                            adminId={admin.id}
                                        />
                                        <DeleteButton
                                            adminId={admin.id}
                                            disabled={self}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <UserCog className="size-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">
                                Tidak ada admin yang cocok.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MagangLayout>
    );
}
