import { Head, router, useForm } from '@inertiajs/react';
import {
    FileText,
    Search,
    CheckCircle2,
    Clock,
    XCircle,
    Building2,
    GraduationCap,
    Upload,
    Loader2,
    Award,
    ClipboardCheck,
    FileBadge2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import type { MagangUser, ReportStatus } from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — REVIEW LAPORAN (verifikator/reports/index)
 *  Tinjau laporan akhir peserta, setujui, lalu unggah e-sertifikat (Fase 4).
 *  Sertifikat yang diunggah berstatus terkunci sampai peserta mengisi survei.
 *
 *  Props dari Inertia::render('verifikator/reports/index', [
 *    'reports' => FinalReport paginator (with application.user, application.opd),
 *    'filters' => ['status' => ?string],
 *  ]). Default mock membuat halaman tetap tampil tanpa backend.
 * ========================================================================= */

/* ---- bentuk baris laporan (model FinalReport mentah + relasi) --------- */
interface ReportRow {
    id: number;
    file_name: string;
    status: ReportStatus;
    submitted_at: string;
    is_confirmed: boolean;
    // Surat Penyelesaian Magang (kop Kominfo) — nomor SK auto-increment +
    // tanggal terbit STATIS; terisi setelah surat pertama kali di-generate.
    completion_sk_number?: string | null;
    completion_sk_issued_at?: string | null;
    application: {
        id: number;
        ticket_number: string;
        institution_name: string;
        user?: { name: string } | null;
        opd?: { name: string; code: string } | null;
    } | null;
}

// Laravel length-aware paginator (hanya field yang dipakai).
interface Paginated<T> {
    data: T[];
}

interface ReportsProps {
    user?: MagangUser;
    reports?: Paginated<ReportRow>;
    filters?: { status?: string | null };
}

/* ---- util ------------------------------------------------------------ */
function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso));
}

const STATUS_META: Record<
    ReportStatus,
    { label: string; tone: string; Icon: typeof Clock }
> = {
    pending: {
        label: 'Menunggu Review',
        tone: 'bg-blue-50 text-blue-700 ring-blue-200',
        Icon: Clock,
    },
    approved: {
        label: 'Disetujui',
        tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        Icon: CheckCircle2,
    },
    rejected: {
        label: 'Perlu Revisi',
        tone: 'bg-rose-50 text-rose-700 ring-rose-200',
        Icon: XCircle,
    },
};

function ReportStatusBadge({ status }: { status: ReportStatus }) {
    const { label, tone, Icon } = STATUS_META[status];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                tone,
            )}
        >
            <Icon className="size-3.5" /> {label}
        </span>
    );
}

/* ---- mock ------------------------------------------------------------ */
const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Dewi Anggraini',
    email: 'verifikator@madiunkota.go.id',
    whatsapp_number: '6281234567890',
    role: 'admin_verifikator',
};

const MOCK_REPORTS: Paginated<ReportRow> = {
    data: [
        {
            id: 12,
            file_name: 'Laporan-Akhir-Rangga.pdf',
            status: 'pending',
            submitted_at: '2026-09-28',
            is_confirmed: true,
            application: {
                id: 42,
                ticket_number: 'MGG-2026-0042',
                institution_name: 'Universitas Negeri Madiun',
                user: { name: 'Rangga Saputra' },
                opd: {
                    name: 'Dinas Komunikasi dan Informatika',
                    code: 'DISKOMINFO',
                },
            },
        },
        {
            id: 11,
            file_name: 'Laporan-Akhir-Siti.pdf',
            status: 'approved',
            submitted_at: '2026-09-20',
            is_confirmed: true,
            application: {
                id: 38,
                ticket_number: 'MGG-2026-0038',
                institution_name: 'Universitas Merdeka Madiun',
                user: { name: 'Siti Rahma' },
                opd: { name: 'Sekretariat Daerah', code: 'SETDA' },
            },
        },
    ],
};

/* ---- aksi: setujui laporan ------------------------------------------- */
function ApproveButton({ reportId }: { reportId: number }) {
    const [processing, setProcessing] = useState(false);

    function submit() {
        setProcessing(true);
        router.post(
            `/verifikator/laporan/${reportId}/approve`,
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
            onClick={submit}
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
            {processing ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <ClipboardCheck className="size-4" />
            )}
            Setujui Laporan
        </button>
    );
}

/* ---- aksi: unggah sertifikat (multipart) ----------------------------- */
function UploadCertificate({ reportId }: { reportId: number }) {
    const { setData, post, processing, reset } = useForm<{ file: File | null }>(
        { file: null },
    );
    const [fileName, setFileName] = useState<string | null>(null);

    function onFile(e: ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setData('file', f);
        setFileName(f?.name ?? null);
    }

    function submit(e: FormEvent) {
        e.preventDefault();

        if (!fileName) {
            return;
        }

        post(`/verifikator/laporan/${reportId}/sertifikat`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset('file');
                setFileName(null);
            },
        });
    }

    return (
        <form
            onSubmit={submit}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
            <label
                htmlFor={`cert-${reportId}`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-[#106feb] hover:bg-[#cddcef]/20"
            >
                <Upload className="size-4 text-[#106feb]" />
                {fileName ?? 'Pilih PDF sertifikat'}
                <input
                    id={`cert-${reportId}`}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={onFile}
                />
            </label>
            <button
                type="submit"
                disabled={!fileName || processing}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#106feb] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {processing ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <Award className="size-4" />
                )}
                Terbitkan Sertifikat
            </button>
        </form>
    );
}

/* ---- aksi: surat penyelesaian magang (kop Kominfo) -------------------- */
/**
 * Generate/unduh Surat Penyelesaian Magang. Nomor SK auto-increment dan
 * tanggal terbit ditetapkan SEKALI saat generate pertama; cetak/unduh ulang
 * tidak mengubah nomor maupun tanggal (idempoten di backend).
 */
function CompletionLetter({ report }: { report: ReportRow }) {
    const [processing, setProcessing] = useState(false);
    const generated = Boolean(report.completion_sk_number);

    function generate() {
        setProcessing(true);
        router.post(
            `/verifikator/laporan/${report.id}/surat-penyelesaian`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    if (!generated) {
        return (
            <button
                type="button"
                onClick={generate}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#106feb] bg-white px-3.5 py-2 text-sm font-semibold text-[#106feb] transition hover:bg-[#e8f2fe] disabled:opacity-50"
                title="Terbitkan Surat Penyelesaian Magang (kop Dinas Kominfo)"
            >
                {processing ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <FileBadge2 className="size-4" />
                )}
                Terbitkan Surat Penyelesaian
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-1.5">
            <a
                href={`/verifikator/laporan/${report.id}/surat-penyelesaian`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#106feb] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#0b4fb0]"
                title="Unduh ulang — nomor & tanggal terbit tidak berubah"
            >
                <FileBadge2 className="size-4" /> Unduh Surat Penyelesaian
            </a>
            <p className="text-center text-[11px] text-slate-400">
                No. {report.completion_sk_number}
                {report.completion_sk_issued_at
                    ? ` · terbit ${formatDate(report.completion_sk_issued_at)}`
                    : ''}
            </p>
        </div>
    );
}

/* ---- halaman --------------------------------------------------------- */
type FilterKey = 'all' | ReportStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'pending', label: 'Menunggu Review' },
    { key: 'approved', label: 'Disetujui' },
    { key: 'rejected', label: 'Perlu Revisi' },
];

export default function VerifikatorReports({
    user = MOCK_USER,
    reports = MOCK_REPORTS,
    filters = {},
}: ReportsProps) {
    const [filter, setFilter] = useState<FilterKey>(
        (filters.status as FilterKey) ?? 'all',
    );
    const [query, setQuery] = useState('');

    // Filter status difilter server-side lewat ?status=; ganti tab → kunjungi ulang.
    function changeFilter(key: FilterKey) {
        setFilter(key);
        router.get(
            '/verifikator/laporan',
            key === 'all' ? {} : { status: key },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();

        return reports.data.filter((r) => {
            if (!q) {
                return true;
            }

            const app = r.application;

            return (
                r.file_name.toLowerCase().includes(q) ||
                (app?.ticket_number.toLowerCase().includes(q) ?? false) ||
                (app?.user?.name.toLowerCase().includes(q) ?? false) ||
                (app?.institution_name.toLowerCase().includes(q) ?? false)
            );
        });
    }, [reports.data, query]);

    return (
        <MagangLayout
            user={user}
            title="Laporan"
            active="laporan"
            navItems={verifikatorNav}
        >
            <Head title="Review Laporan — Verifikator" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">
                        Review Laporan Akhir
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Tinjau laporan peserta, setujui, lalu terbitkan
                        e-sertifikat. Sertifikat terkunci sampai peserta mengisi
                        survei.
                    </p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1.5">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => changeFilter(f.key)}
                                className={cn(
                                    'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                                    filter === f.key
                                        ? 'bg-[#106feb] text-white shadow-sm'
                                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative sm:w-64">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari peserta / tiket…"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                        />
                    </div>
                </div>

                {/* Daftar laporan */}
                <div className="space-y-4">
                    {rows.map((r) => (
                        <div
                            key={r.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs font-semibold text-[#12213e]">
                                            {r.application?.ticket_number ??
                                                '—'}
                                        </span>
                                        <ReportStatusBadge status={r.status} />
                                    </div>
                                    <p className="flex items-center gap-1.5 text-sm font-bold text-[#12213e]">
                                        <GraduationCap className="size-4 text-slate-400" />
                                        {r.application?.user?.name ?? 'Peserta'}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Building2 className="size-3.5" />
                                        {r.application?.opd?.name ??
                                            r.application?.institution_name ??
                                            '—'}
                                    </p>
                                    <a
                                        href={`/verifikator/laporan/${r.id}/berkas`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#106feb] hover:underline"
                                        title="Buka berkas laporan akhir"
                                    >
                                        <FileText className="size-3.5" />{' '}
                                        {r.file_name}
                                    </a>
                                    <p className="text-xs text-slate-400">
                                        Diunggah {formatDate(r.submitted_at)}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-col items-stretch gap-2">
                                    {r.status === 'pending' && (
                                        <ApproveButton reportId={r.id} />
                                    )}
                                    {r.status === 'approved' && (
                                        <>
                                            <UploadCertificate
                                                reportId={r.id}
                                            />
                                            {/* Surat Penyelesaian Magang (kop Kominfo) */}
                                            <CompletionLetter report={r} />
                                        </>
                                    )}
                                    {r.status === 'rejected' && (
                                        <span className="text-xs font-medium text-rose-500">
                                            Menunggu revisi peserta
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {rows.length === 0 && (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <FileText className="size-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">
                                Belum ada laporan pada filter ini.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MagangLayout>
    );
}
