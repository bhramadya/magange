import { Head, router } from '@inertiajs/react';
import {
    CircleCheck,
    CircleOff,
    GraduationCap,
    Loader2,
    Mail,
    Phone,
    Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import type { MagangUser } from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — KELOLA USER (verifikator/users/index)
 *  Daftar akun mahasiswa/peserta (role: mahasiswa) — pemantauan + aktivasi.
 *  User dibuat otomatis saat pengajuan diterima, jadi TIDAK ada tombol
 *  tambah; aksi yang tersedia hanya aktif/nonaktifkan akun.
 *
 *  Props dari Inertia::render('verifikator/users/index', [
 *    'users'   => paginator akun mahasiswa,
 *    'filters' => ['search' => ?string],
 *  ]). Search dijalankan server-side (?search=) karena datanya paginated.
 * ========================================================================= */

interface UserRow {
    id: number;
    name: string;
    email: string;
    whatsapp_number?: string | null;
    is_active?: boolean;
    last_login_at?: string | null;
    created_at?: string;
    // Jumlah pengajuan milik user (withCount di backend) — opsional.
    applications_count?: number;
}

interface Paginated<T> {
    data: T[];
}

interface UsersIndexProps {
    user?: MagangUser;
    users?: Paginated<UserRow>;
    filters?: { search?: string | null };
}

const MOCK_ADMIN: MagangUser = {
    id: 1,
    name: 'Dewi Anggraini',
    email: 'verifikator@madiunkota.go.id',
    whatsapp_number: '6281234567890',
    role: 'admin_verifikator',
};

const MOCK_USERS: Paginated<UserRow> = {
    data: [
        {
            id: 11,
            name: 'Rangga Saputra',
            email: 'rangga@student.unm.ac.id',
            whatsapp_number: '6281234500011',
            is_active: true,
            last_login_at: '2026-06-24T08:12:00',
            created_at: '2026-04-28',
            applications_count: 1,
        },
        {
            id: 12,
            name: 'Putri Maharani',
            email: 'putri@pnm.ac.id',
            whatsapp_number: '6281234500012',
            is_active: true,
            last_login_at: null,
            created_at: '2026-05-02',
            applications_count: 1,
        },
        {
            id: 13,
            name: 'Dimas Aryo Wibowo',
            email: 'dimas@unmer-madiun.ac.id',
            whatsapp_number: '6281234500013',
            is_active: false,
            last_login_at: '2026-05-30T14:40:00',
            created_at: '2026-03-20',
            applications_count: 2,
        },
    ],
};

function formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

/** Aktif ⇄ nonaktifkan akun mahasiswa (PATCH toggle-active). */
function ToggleActiveButton({ row }: { row: UserRow }) {
    const [processing, setProcessing] = useState(false);
    const active = row.is_active !== false;

    function toggle() {
        setProcessing(true);
        router.patch(
            `/verifikator/users/${row.id}/toggle-active`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={processing}
            title={active ? 'Nonaktifkan akun' : 'Aktifkan kembali akun'}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition disabled:opacity-50',
                active
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-emerald-600 hover:bg-emerald-50',
            )}
        >
            {processing ? (
                <Loader2 className="size-4 animate-spin" />
            ) : active ? (
                <CircleOff className="size-4" />
            ) : (
                <CircleCheck className="size-4" />
            )}
            {active ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
    );
}

export default function VerifikatorUsers({
    user = MOCK_ADMIN,
    users = MOCK_USERS,
    filters = {},
}: UsersIndexProps) {
    const [query, setQuery] = useState(filters.search ?? '');
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Search server-side (?search=) dengan debounce — data paginated.
    function onSearch(value: string) {
        setQuery(value);

        if (debounce.current) {
            clearTimeout(debounce.current);
        }

        debounce.current = setTimeout(() => {
            router.get(
                '/verifikator/users',
                value.trim() ? { search: value.trim() } : {},
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 350);
    }

    useEffect(
        () => () => {
            if (debounce.current) {
                clearTimeout(debounce.current);
            }
        },
        [],
    );

    return (
        <MagangLayout
            user={user}
            title="Kelola User"
            active="users"
            navItems={verifikatorNav}
        >
            <Head title="Kelola User — Verifikator" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">
                        Kelola User
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Daftar akun peserta magang. Akun dibuat otomatis saat
                        pengajuan diterima — di sini Anda memantau dan
                        mengaktif/nonaktifkan akses login peserta.
                    </p>
                </div>

                {/* Pencarian */}
                <div className="relative sm:w-72">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Cari nama / email…"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                    />
                </div>

                <div className="space-y-3">
                    {users.data.map((row) => {
                        const active = row.is_active !== false;

                        return (
                            <div
                                key={row.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#cddcef] text-sm font-bold text-[#106feb]">
                                            {initials(row.name)}
                                        </span>
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-sm font-bold text-[#12213e]">
                                                    {row.name}
                                                </p>
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                                        active
                                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                            : 'bg-slate-50 text-slate-500 ring-slate-200',
                                                    )}
                                                >
                                                    {active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </span>
                                            </div>
                                            <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                                                <Mail className="size-3.5 shrink-0" />
                                                {row.email}
                                            </p>
                                            {row.whatsapp_number && (
                                                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Phone className="size-3.5 shrink-0" />
                                                    {row.whatsapp_number}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-slate-400">
                                                {row.applications_count != null
                                                    ? `${row.applications_count} pengajuan · `
                                                    : ''}
                                                Login terakhir:{' '}
                                                {row.last_login_at
                                                    ? formatDateTime(
                                                          row.last_login_at,
                                                      )
                                                    : 'belum pernah'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <ToggleActiveButton row={row} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {users.data.length === 0 && (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <GraduationCap className="size-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">
                                Tidak ada user yang cocok.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MagangLayout>
    );
}
