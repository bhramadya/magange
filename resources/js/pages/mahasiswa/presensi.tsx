import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    FileText,
    Image as ImageIcon,
    Plus,
    Search,
    Trash2,
    FileSpreadsheet,
    FileType2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import MagangLayout from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import type { MagangUser, PresensiEntry } from '@/types/magang';

/* =========================================================================
 *  ABSEN HARIAN PESERTA MAGANG (R22, dirombak batch 5)
 *  Absen 1x per hari: Status Kehadiran (Hadir/Izin/Sakit), Rincian
 *  Aktivitas, dan Dokumentasi Foto wajib 1–3 (maks 2MB/foto). Tanggal
 *  otomatis hari ini; jam absen dicatat backend dari created_at.
 *  Riwayat: search client-side + dialog detail; export Excel (CSV) & Word
 *  (HTML) di header card riwayat, kolom Tanggal/Status/Jam Absen/Rincian.
 * ========================================================================= */

interface PresensiProps {
    user?: MagangUser;
    entries?: PresensiEntry[];
    hasToday?: boolean;
}

const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Rangga Saputra',
    email: 'rangga.saputra@example.com',
    whatsapp_number: '081234567890',
    role: 'mahasiswa',
};

const STATUS_OPTIONS = [
    { value: 'hadir', label: 'Hadir' },
    { value: 'izin', label: 'Izin' },
    { value: 'sakit', label: 'Sakit' },
] as const;

const PRESENSI_META: Record<
    PresensiEntry['status'],
    { label: string; badge: string }
> = {
    hadir: { label: 'Hadir', badge: 'bg-emerald-100 text-emerald-700' },
    izin: { label: 'Izin', badge: 'bg-amber-100 text-amber-700' },
    sakit: { label: 'Sakit', badge: 'bg-rose-100 text-rose-700' },
};

interface Attachment {
    id: string;
    file: File | null;
    name: string;
}

let attachmentSeq = 0;

function generateId() {
    attachmentSeq += 1;

    return `att-${attachmentSeq}`;
}

function formatDateID(iso: string) {
    if (!iso) {
        return '';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(iso));
}

function formatTimeID(iso: string | null) {
    if (!iso) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9\s_-]/g, '').trim() || 'Peserta';
}

/* ---- dialog detail entri --------------------------------------------- */
function EntryDetailDialog({
    entry,
    onClose,
}: {
    entry: PresensiEntry | null;
    onClose: () => void;
}) {
    const meta = entry ? PRESENSI_META[entry.status] : null;

    return (
        <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto bg-white text-[#0a1628] sm:max-w-md">
                {entry && meta && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex flex-wrap items-center gap-2 text-[#0a1628]">
                                {formatDateID(entry.activity_date)}
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                        meta.badge,
                                    )}
                                >
                                    {meta.label}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Absen pukul {formatTimeID(entry.checked_in_at)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase">
                                Rincian Aktivitas
                            </p>
                            <p className="mt-1.5 text-sm whitespace-pre-line text-slate-700">
                                {entry.details}
                            </p>
                        </div>

                        {entry.attachments.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">
                                    Dokumentasi Foto
                                </p>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {entry.attachments.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group overflow-hidden rounded-xl border border-slate-200"
                                            title={file.name}
                                        >
                                            <img
                                                src={file.url}
                                                alt={file.name}
                                                loading="lazy"
                                                className="aspect-square w-full object-cover transition group-hover:scale-105"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function PresensiHarian({
    user = MOCK_USER,
    entries = [],
    hasToday = false,
}: PresensiProps) {
    const pageUser = (
        usePage().props as unknown as { auth?: { user?: MagangUser } }
    ).auth?.user;
    const currentUser = pageUser ?? user;

    const { data, setData, post, processing, errors, reset, transform } =
        useForm<{
            status: 'hadir' | 'izin' | 'sakit';
            details: string;
        }>({
            status: 'hadir',
            details: '',
        });
    // Error validasi `attachments` datang dari field yang di-inject transform()
    // sehingga tidak ada di tipe data form — baca lewat indeks longgar.
    const attachmentsError = (errors as Record<string, string | undefined>)
        .attachments;

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [query, setQuery] = useState('');
    const [activeEntry, setActiveEntry] = useState<PresensiEntry | null>(null);

    const addAttachment = () => {
        setAttachments((prev) =>
            prev.length >= 3
                ? prev
                : [...prev, { id: generateId(), file: null, name: '' }],
        );
    };

    const removeAttachment = (id: string) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    const updateAttachment = (id: string, file: File | null) => {
        setAttachments((prev) =>
            prev.map((a) =>
                a.id === id ? { ...a, file, name: file?.name ?? '' } : a,
            ),
        );
    };

    const pickedFiles = attachments
        .map((a) => a.file)
        .filter((f): f is File => f !== null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Foto dikirim sebagai array `attachments[]` (FormData) — wajib 1–3.
        transform((formData) => ({
            ...formData,
            attachments: pickedFiles,
        }));
        post('/presensi', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setAttachments([]);
            },
        });
    };

    // Search client-side pada tanggal / status / rincian.
    const filteredEntries = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return entries;
        }

        return entries.filter(
            (entry) =>
                entry.activity_date.includes(q) ||
                formatDateID(entry.activity_date).toLowerCase().includes(q) ||
                PRESENSI_META[entry.status].label.toLowerCase().includes(q) ||
                entry.details.toLowerCase().includes(q),
        );
    }, [entries, query]);

    const exportBaseName = `Aktivitas kegiatan magang ${sanitizeFilename(
        currentUser.name,
    )}`;

    // Export mencakup SELURUH riwayat presensi (bukan hasil filter search).
    const exportExcel = () => {
        const rows = [
            ['Tanggal', 'Status', 'Jam Absen', 'Rincian Aktivitas'],
            ...entries.map((row) => [
                row.activity_date,
                PRESENSI_META[row.status].label,
                formatTimeID(row.checked_in_at),
                row.details,
            ]),
        ];
        const csv = rows
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(','),
            )
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${exportBaseName}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportWord = () => {
        const bodyRows = entries
            .map(
                (row) =>
                    `<tr><td>${formatDateID(row.activity_date)}</td><td>${PRESENSI_META[row.status].label}</td><td>${formatTimeID(row.checked_in_at)}</td><td>${row.details}</td></tr>`,
            )
            .join('');
        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${exportBaseName}</title></head>
            <body>
                <h2>${exportBaseName}</h2>
                <table border='1' cellspacing='0' cellpadding='6'>
                    <tr><th>Tanggal</th><th>Status</th><th>Jam Absen</th><th>Rincian Aktivitas</th></tr>
                    ${bodyRows}
                </table>
            </body>
            </html>`;
        const blob = new Blob(['\ufeff', html], {
            type: 'application/msword',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${exportBaseName}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const inputClass =
        'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-[#12213e] transition-all placeholder:text-slate-400 hover:border-[#cddcef] focus:border-transparent focus:ring-2 focus:ring-[#0b4fb0] focus:outline-none';

    return (
        <MagangLayout
            user={currentUser}
            title="Presensi Harian"
            active="presensi"
        >
            <Head title="Presensi Harian" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">
                        Absen Harian
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Absen sekali setiap hari — pilih status kehadiran, catat
                        aktivitas, dan unggah dokumentasi foto.
                    </p>
                </div>

                {hasToday ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
                        <div>
                            <p className="text-sm font-bold text-emerald-800">
                                Anda sudah presensi hari ini ✓
                            </p>
                            <p className="text-xs text-emerald-700">
                                Presensi berikutnya dapat dilakukan besok.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div>
                            <label className="text-sm font-semibold text-[#12213e]">
                                Status Kehadiran{' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) =>
                                    setData(
                                        'status',
                                        e.target.value as typeof data.status,
                                    )
                                }
                                className={`${inputClass} mt-1.5`}
                                required
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        <div className="mt-5">
                            <label className="text-sm font-semibold text-[#12213e]">
                                Rincian Aktivitas{' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={data.details}
                                onChange={(e) =>
                                    setData('details', e.target.value)
                                }
                                rows={4}
                                className={`${inputClass} mt-1.5 resize-none`}
                                placeholder="Jelaskan aktivitas yang dilakukan hari ini..."
                                required
                            />
                            {errors.details && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.details}
                                </p>
                            )}
                        </div>

                        {/* Dokumentasi Foto wajib 1–3 */}
                        <div className="mt-5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-[#12213e]">
                                    Dokumentasi Foto{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={addAttachment}
                                    disabled={attachments.length >= 3}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#106feb]/10 px-3 py-1.5 text-xs font-semibold text-[#106feb] transition hover:bg-[#106feb]/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Plus className="size-3.5" /> Tambah Foto
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                                1–3 foto (JPG/PNG), maks 2MB/foto.
                            </p>
                            <div className="mt-3 space-y-3">
                                {attachments.length === 0 && (
                                    <p className="text-sm text-slate-400">
                                        Belum ada foto — minimal 1 foto wajib
                                        diunggah.
                                    </p>
                                )}
                                {attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                                    >
                                        <label className="flex flex-1 cursor-pointer items-center gap-3 overflow-hidden">
                                            <ImageIcon className="size-4 shrink-0 text-slate-400" />
                                            <span className="truncate text-sm text-slate-600">
                                                {att.name || 'Pilih foto...'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                className="hidden"
                                                onChange={(e) =>
                                                    updateAttachment(
                                                        att.id,
                                                        e.target.files?.[0] ??
                                                            null,
                                                    )
                                                }
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeAttachment(att.id)
                                            }
                                            className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {attachmentsError && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {attachmentsError}
                                </p>
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={
                                    processing || pickedFiles.length === 0
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-[#106feb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                            >
                                <FileText className="size-4" />
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Presensi'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Riwayat presensi — sumber data tombol Export di header. */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-[#12213e]">
                            Riwayat Presensi
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={exportExcel}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <FileSpreadsheet className="size-4 text-emerald-600" />
                                Export Excel
                            </button>
                            <button
                                type="button"
                                onClick={exportWord}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <FileType2 className="size-4 text-blue-600" />
                                Export Word
                            </button>
                        </div>
                    </div>

                    {/* Search client-side: tanggal / status / rincian */}
                    <div className="relative mt-4 sm:w-72">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari tanggal / status / rincian…"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                        />
                    </div>

                    {filteredEntries.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-400">
                            {entries.length === 0
                                ? 'Belum ada presensi tercatat.'
                                : 'Tidak ada presensi yang cocok.'}
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {filteredEntries.map((entry) => {
                                const meta = PRESENSI_META[entry.status];

                                return (
                                    <li key={entry.id}>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                setActiveEntry(entry)
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === 'Enter' ||
                                                    e.key === ' '
                                                ) {
                                                    e.preventDefault();
                                                    setActiveEntry(entry);
                                                }
                                            }}
                                            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#106feb]/40 hover:bg-white"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#12213e]">
                                                    {formatDateID(
                                                        entry.activity_date,
                                                    )}
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                                                            meta.badge,
                                                        )}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-xs font-normal text-slate-500">
                                                        Absen pukul{' '}
                                                        {formatTimeID(
                                                            entry.checked_in_at,
                                                        )}
                                                    </span>
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.delete(
                                                            `/presensi/${entry.id}`,
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }}
                                                    className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50"
                                                    aria-label="Hapus presensi"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-slate-600">
                                                {entry.details}
                                            </p>
                                            {entry.attachments.length > 0 && (
                                                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#106feb]">
                                                    <ImageIcon className="size-3.5" />
                                                    {entry.attachments.length}{' '}
                                                    foto dokumentasi
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            <EntryDetailDialog
                entry={activeEntry}
                onClose={() => setActiveEntry(null)}
            />
        </MagangLayout>
    );
}
