import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    FileText,
    Plus,
    Trash2,
    Download,
    FileSpreadsheet,
    FileWord,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import MagangLayout from '@/layouts/magang-layout';
import type { MagangUser } from '@/types/magang';

/* =========================================================================
 *  PRESENSI HARIAN PESERTA MAGANG (R22)
 *  Input: Tanggal, Jam Mulai, Jam Selesai, Rincian Aktivitas, Lampiran.
 *  Export: Excel (CSV) & Word (HTML) dengan nama file dinamis.
 * ========================================================================= */

interface PresensiProps {
    user?: MagangUser;
}

const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Rangga Saputra',
    email: 'rangga.saputra@example.com',
    whatsapp_number: '081234567890',
    role: 'mahasiswa',
};

interface Attachment {
    id: string;
    file: File | null;
    name: string;
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDateID(iso: string) {
    if (!iso) return '';
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(iso));
}

function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9\s_-]/g, '').trim() || 'Peserta';
}

export default function PresensiHarian({ user = MOCK_USER }: PresensiProps) {
    const pageUser = (usePage().props as { auth?: { user?: MagangUser } }).auth
        ?.user;
    const currentUser = pageUser ?? user;

    const { data, setData, post, processing, errors, reset } = useForm<{
        activity_date: string;
        start_time: string;
        end_time: string;
        details: string;
    }>({
        activity_date: '',
        start_time: '',
        end_time: '',
        details: '',
    });

    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const addAttachment = () => {
        setAttachments((prev) => [...prev, { id: generateId(), file: null, name: '' }]);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Lampiran multiple dikirim sebagai array files melalui FormData.
        post('/presensi', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setAttachments([]);
            },
        });
    };

    const exportBaseName = `Aktivitas kegiatan magang ${sanitizeFilename(
        currentUser.name,
    )}`;

    const exportExcel = () => {
        const rows = [
            ['Tanggal', 'Jam Mulai', 'Jam Selesai', 'Rincian Aktivitas'],
            [data.activity_date, data.start_time, data.end_time, data.details],
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
        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${exportBaseName}</title></head>
            <body>
                <h2>${exportBaseName}</h2>
                <table border='1' cellspacing='0' cellpadding='6'>
                    <tr><td><b>Tanggal</b></td><td>${formatDateID(
                        data.activity_date,
                    )}</td></tr>
                    <tr><td><b>Jam Mulai</b></td><td>${data.start_time}</td></tr>
                    <tr><td><b>Jam Selesai</b></td><td>${data.end_time}</td></tr>
                    <tr><td><b>Rincian Aktivitas</b></td><td>${data.details}</td></tr>
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
        <MagangLayout user={currentUser} title="Presensi Harian" active="presensi">
            <Head title="Presensi Harian" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">
                        Log Presensi Harian
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Catat aktivitas magang harian Anda beserta lampiran
                        pendukung.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="grid gap-5 md:grid-cols-3">
                        <div>
                            <label className="text-sm font-semibold text-[#12213e]">
                                Tanggal{' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative mt-1.5">
                                <Calendar className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={data.activity_date}
                                    onChange={(e) =>
                                        setData('activity_date', e.target.value)
                                    }
                                    className={`${inputClass} pl-10`}
                                    required
                                />
                            </div>
                            {errors.activity_date && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.activity_date}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-[#12213e]">
                                Jam Mulai{' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative mt-1.5">
                                <Clock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="time"
                                    value={data.start_time}
                                    onChange={(e) =>
                                        setData('start_time', e.target.value)
                                    }
                                    className={`${inputClass} pl-10`}
                                    required
                                />
                            </div>
                            {errors.start_time && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.start_time}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-[#12213e]">
                                Jam Selesai{' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative mt-1.5">
                                <Clock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="time"
                                    value={data.end_time}
                                    onChange={(e) =>
                                        setData('end_time', e.target.value)
                                    }
                                    className={`${inputClass} pl-10`}
                                    required
                                />
                            </div>
                            {errors.end_time && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.end_time}
                                </p>
                            )}
                        </div>
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

                    {/* Lampiran multiple */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-[#12213e]">
                                Lampiran File
                            </label>
                            <button
                                type="button"
                                onClick={addAttachment}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#106feb]/10 px-3 py-1.5 text-xs font-semibold text-[#106feb] transition hover:bg-[#106feb]/20"
                            >
                                <Plus className="size-3.5" /> Tambah Lampiran
                            </button>
                        </div>
                        <div className="mt-3 space-y-3">
                            {attachments.length === 0 && (
                                <p className="text-sm text-slate-400">
                                    Belum ada lampiran.
                                </p>
                            )}
                            {attachments.map((att) => (
                                <div
                                    key={att.id}
                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                                >
                                    <label className="flex flex-1 cursor-pointer items-center gap-3 overflow-hidden">
                                        <Upload className="size-4 shrink-0 text-slate-400" />
                                        <span className="truncate text-sm text-slate-600">
                                            {att.name || 'Pilih file...'}
                                        </span>
                                        <input
                                            type="file"
                                            name={`attachments[${att.id}]`}
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
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#106feb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                        >
                            <FileText className="size-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Presensi'}
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={exportExcel}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <FileSpreadsheet className="size-4 text-emerald-600" />
                                Export Excel
                            </button>
                            <button
                                type="button"
                                onClick={exportWord}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <FileWord className="size-4 text-blue-600" />
                                Export Word
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </MagangLayout>
    );
}
