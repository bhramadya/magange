import { Head, router } from '@inertiajs/react';
import {
    Building2,
    CalendarCheck,
    CircleCheck,
    CircleOff,
    ExternalLink,
    FileText,
    GraduationCap,
    Loader2,
    Mail,
    Phone,
    Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import type {
    ApplicationStatus,
    MagangUser,
    PresensiEntry,
} from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — KELOLA USER (verifikator/users/index)
 *  Daftar akun mahasiswa/peserta (role: mahasiswa) — pemantauan + aktivasi.
 *  User dibuat otomatis saat pengajuan diterima, jadi TIDAK ada tombol
 *  tambah; aksi yang tersedia hanya aktif/nonaktifkan akun.
 *  Batch 5 (#3): kartu clickable → UserDetailDialog berisi identitas,
 *  daftar pengajuan (maks 5 terakhir), dan riwayat presensi 31 hari.
 *
 *  Props dari Inertia::render('verifikator/users/index', [
 *    'users'   => paginator akun mahasiswa (+ applications, presensi),
 *    'filters' => ['search' => ?string],
 *  ]). Search dijalankan server-side (?search=) karena datanya paginated.
 * ========================================================================= */

interface UserApplicationRow {
    ticket_number: string;
    status: ApplicationStatus;
    opd_name?: string | null;
    institution_name?: string | null;
    created_at?: string | null;
}

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
    // Batch 5 (#3): detail untuk dialog.
    avatar_url?: string | null;
    applications?: UserApplicationRow[];
    presensi?: PresensiEntry[];
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

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso));
}

function formatTime(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
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

/* ---- dialog detail user (batch 5 #3) ---------------------------------- */
const PRESENSI_META: Record<
    PresensiEntry['status'],
    { label: string; badge: string }
> = {
    hadir: { label: 'Hadir', badge: 'bg-emerald-100 text-emerald-700' },
    izin: { label: 'Izin', badge: 'bg-amber-100 text-amber-700' },
    sakit: { label: 'Sakit', badge: 'bg-rose-100 text-rose-700' },
};

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 py-2.5 text-sm">
            <span className="font-medium text-slate-600">{label}</span>
            <span className="text-right font-semibold text-[#0a1628]">
                {value}
            </span>
        </div>
    );
}

function UserDetailDialog({
    row,
    onClose,
}: {
    row: UserRow | null;
    onClose: () => void;
}) {
    const active = row?.is_active !== false;

    return (
        <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto bg-white text-[#0a1628] sm:max-w-lg">
                {row && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex flex-wrap items-center gap-2 text-[#0a1628]">
                                {row.name}
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                        active
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                            : 'bg-slate-50 text-slate-500 ring-slate-200',
                                    )}
                                >
                                    {active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Detail akun peserta magang
                            </DialogDescription>
                        </DialogHeader>

                        {/* Foto profil (pas foto pendaftaran, disk privat) */}
                        {row.avatar_url && (
                            <div className="flex justify-center">
                                <img
                                    src={row.avatar_url}
                                    alt={`Foto ${row.name}`}
                                    className="h-40 w-32 rounded-xl border border-slate-200 object-cover shadow-sm"
                                />
                            </div>
                        )}

                        {/* Identitas */}
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
                            <DetailRow label="Email" value={row.email} />
                            <DetailRow
                                label="No. WhatsApp"
                                value={row.whatsapp_number || '—'}
                            />
                            <DetailRow
                                label="Terdaftar"
                                value={
                                    row.created_at
                                        ? formatDate(row.created_at)
                                        : '—'
                                }
                            />
                            <DetailRow
                                label="Login terakhir"
                                value={
                                    row.last_login_at
                                        ? formatDateTime(row.last_login_at)
                                        : 'belum pernah'
                                }
                            />
                        </div>

                        {/* Daftar pengajuan (maks 5 terakhir) */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-[#12213e]">
                                <FileText className="size-4 text-[#106feb]" />{' '}
                                Pengajuan
                                {row.applications_count != null && (
                                    <span className="text-xs font-normal text-slate-400">
                                        ({row.applications_count} total)
                                    </span>
                                )}
                            </p>
                            {(row.applications ?? []).length === 0 ? (
                                <p className="mt-2 text-sm text-slate-500">
                                    Belum ada pengajuan.
                                </p>
                            ) : (
                                <ul className="mt-3 space-y-2">
                                    {(row.applications ?? []).map((app) => (
                                        <li
                                            key={app.ticket_number}
                                            className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-xs font-semibold text-[#12213e]">
                                                    {app.ticket_number}
                                                </span>
                                                <StatusBadge
                                                    status={app.status}
                                                />
                                            </div>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                <Building2 className="size-3 shrink-0" />
                                                {app.opd_name ??
                                                    'Belum ditempatkan'}
                                                {app.institution_name
                                                    ? ` · ${app.institution_name}`
                                                    : ''}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Riwayat presensi (31 hari terakhir) */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-[#12213e]">
                                <CalendarCheck className="size-4 text-[#106feb]" />{' '}
                                Riwayat Presensi
                                <span className="text-xs font-normal text-slate-400">
                                    (31 hari terakhir)
                                </span>
                            </p>
                            {(row.presensi ?? []).length === 0 ? (
                                <p className="mt-2 text-sm text-slate-500">
                                    Belum ada presensi.
                                </p>
                            ) : (
                                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                                    {(row.presensi ?? []).map((entry) => {
                                        // Fallback bila status tak dikenal /
                                        // null (data presensi lama) — jangan
                                        // biarkan 1 baris rusak me-crash dialog.
                                        const meta =
                                            PRESENSI_META[entry.status] ?? {
                                                label:
                                                    entry.status ||
                                                    'Tidak diketahui',
                                                badge: 'bg-slate-100 text-slate-700',
                                            };

                                        return (
                                            <li
                                                key={entry.id}
                                                className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5"
                                            >
                                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="font-semibold text-[#12213e]">
                                                        {formatDate(
                                                            entry.activity_date,
                                                        )}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 font-semibold',
                                                            meta.badge,
                                                        )}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-slate-400">
                                                        Absen pukul{' '}
                                                        {formatTime(
                                                            entry.checked_in_at,
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                                                    {entry.details}
                                                </p>
                                                {entry.attachments.length >
                                                    0 && (
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        {entry.attachments.map(
                                                            (file) => (
                                                                <a
                                                                    key={
                                                                        file.id
                                                                    }
                                                                    href={
                                                                        file.url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#106feb] ring-1 ring-slate-200 transition hover:bg-[#e8f2fe]"
                                                                >
                                                                    <ExternalLink className="size-3" />
                                                                    {file.name}
                                                                </a>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function VerifikatorUsers({
    user = MOCK_ADMIN,
    users = MOCK_USERS,
    filters = {},
}: UsersIndexProps) {
    const [query, setQuery] = useState(filters.search ?? '');
    const [active, setActive] = useState<UserRow | null>(null);
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
                        pengajuan diterima — klik kartu untuk melihat detail,
                        pengajuan, dan riwayat presensi peserta.
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
                        const rowActive = row.is_active !== false;

                        return (
                            <div
                                key={row.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#106feb]/40 hover:shadow-sm"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setActive(row)}
                                        className="flex min-w-0 items-start gap-3 text-left"
                                    >
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
                                                        rowActive
                                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                            : 'bg-slate-50 text-slate-500 ring-slate-200',
                                                    )}
                                                >
                                                    {rowActive
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
                                    </button>
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

            <UserDetailDialog row={active} onClose={() => setActive(null)} />
        </MagangLayout>
    );
}
