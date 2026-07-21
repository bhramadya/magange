import { Head, router, useForm } from '@inertiajs/react';
import {
    Search,
    Users,
    Building2,
    GraduationCap,
    Briefcase,
    UserCog,
    CalendarDays,
    FileCheck2,
    FileBadge2,
    Award,
    CalendarCheck,
    CheckCircle2,
    ClipboardCheck,
    ExternalLink,
    Loader2,
    Upload,
    History,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { ApplicationDocuments } from '@/components/application-documents';
import { StatusBadge } from '@/components/status-badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import MagangLayout, { opdNav } from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import { STATUS_META } from '@/types/magang';
import type {
    InternshipApplication,
    MagangUser,
    Opd,
    PresensiEntry,
} from '@/types/magang';

/* =========================================================================
 *  OPD — KELOLA PESERTA (opd/peserta)
 *  Roster peserta magang di OPD ini yang sudah disetujui (sedang magang /
 *  mengajukan penyelesaian / selesai). Batch 5: menu Laporan pindah total
 *  ke sini — dialog detail memuat panel aksi laporan akhir (buka berkas,
 *  setujui, terbitkan sertifikat & surat penyelesaian via /opd/laporan/*)
 *  plus riwayat presensi peserta.
 * ========================================================================= */

// Pasangan data peserta: identitas (dari relasi user) + pengajuannya.
export interface Participant {
    student_name: string;
    application: InternshipApplication;
    presensi?: PresensiEntry[];
}

/* ---- util ------------------------------------------------------------ */
const REF_DATE = new Date('2026-06-25'); // acuan demo; backend pakai now()

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso));
}

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

// Persentase progres magang berdasar periode start–end terhadap tanggal acuan.
function progressPct(app: InternshipApplication): number {
    if (app.status === 'completed') {
        return 100;
    }

    const start = new Date(app.start_date).getTime();
    const end = new Date(app.end_date).getTime();
    const now = REF_DATE.getTime();

    if (now <= start) {
        return 0;
    }

    if (now >= end) {
        return 100;
    }

    return Math.round(((now - start) / (end - start)) * 100);
}

/* ---- mock ------------------------------------------------------------ */
const THIS_OPD: Opd = {
    id: 1,
    name: 'Dinas Komunikasi dan Informatika',
    code: 'DISKOMINFO',
};

const MOCK_USER: MagangUser = {
    id: 2,
    name: 'Budi Santoso',
    email: 'opd.diskominfo@madiunkota.go.id',
    whatsapp_number: '6281298765432',
    role: 'admin_opd',
};

function makeApp(
    partial: Partial<InternshipApplication> &
        Pick<InternshipApplication, 'id' | 'ticket_number' | 'status'>,
): InternshipApplication {
    return {
        tujuan_magang: 'Magang kompetensi keahlian',
        duration_months: 3,
        start_date: '2026-05-01',
        end_date: '2026-07-31',
        institution_name: 'Universitas Negeri Madiun',
        campus_supervisor: 'Dr. Bambang Sutrisno',
        opd: THIS_OPD,
        division: 'Bidang Infrastruktur TIK',
        field_supervisor: 'Rudi Hartono, S.T',
        person_in_charge: 'Kepala Bidang IT',
        rejection_reason: null,
        forwarded_at: '2026-04-25',
        opd_decision_at: '2026-04-28',
        created_at: '2026-04-20',
        final_report: null,
        survey_submitted: false,
        certificate_available: false,
        ...partial,
    };
}

const MOCK_PARTICIPANTS: Participant[] = [
    {
        student_name: 'Rangga Saputra',
        application: makeApp({
            id: 41,
            ticket_number: 'MGG-2026-0042',
            status: 'ongoing',
            tujuan_magang: 'Administrasi jaringan',
            institution_name: 'Universitas Negeri Madiun',
            division: 'Bidang Infrastruktur TIK',
            field_supervisor: 'Rudi Hartono, S.T',
            start_date: '2026-06-01',
            end_date: '2026-08-31',
        }),
    },
    {
        student_name: 'Putri Maharani',
        application: makeApp({
            id: 42,
            ticket_number: 'MGG-2026-0040',
            status: 'ongoing',
            tujuan_magang: 'Pengembangan aplikasi mobile',
            institution_name: 'Politeknik Negeri Madiun',
            division: 'Bidang Pengembangan Aplikasi',
            field_supervisor: 'Bayu Pratama, S.Kom',
            person_in_charge: 'Kasi Aplikasi',
            campus_supervisor: 'Ir. Hadi Santoso',
            start_date: '2026-05-15',
            end_date: '2026-08-15',
        }),
    },
    {
        student_name: 'Dimas Aryo Wibowo',
        application: makeApp({
            id: 43,
            ticket_number: 'MGG-2026-0036',
            status: 'completion_submitted',
            tujuan_magang: 'Manajemen media sosial',
            institution_name: 'Universitas Merdeka Madiun',
            division: 'Bidang Layanan Informasi Publik',
            field_supervisor: 'Andi Wijaya',
            person_in_charge: 'Kabid IKP',
            campus_supervisor: 'Dra. Lestari Handayani',
            start_date: '2026-04-01',
            end_date: '2026-06-30',
            final_report: {
                status: 'pending',
                file_name: 'laporan-akhir-dimas.pdf',
                submitted_at: '2026-06-22T10:00:00',
                is_confirmed: false,
            },
        }),
    },
    {
        student_name: 'Siti Nurhaliza',
        application: makeApp({
            id: 44,
            ticket_number: 'MGG-2026-0028',
            status: 'completed',
            tujuan_magang: 'Desain grafis',
            institution_name: 'SMK Negeri 1 Madiun',
            division: 'Bidang Layanan Informasi Publik',
            field_supervisor: 'Endah Sari, S.I.Kom',
            person_in_charge: 'Kasubag Humas',
            campus_supervisor: 'Agus Priyono, S.Kom',
            start_date: '2026-03-01',
            end_date: '2026-05-31',
            survey_submitted: true,
            certificate_available: true,
            final_report: {
                status: 'approved',
                file_name: 'laporan-akhir-siti.pdf',
                submitted_at: '2026-05-28T09:00:00',
                is_confirmed: true,
            },
        }),
    },
];

/* ---- filter ---------------------------------------------------------- */
type FilterKey = 'all' | 'approved' | 'ongoing' | 'completion' | 'completed';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'approved', label: 'Disetujui' },
    { key: 'ongoing', label: 'Sedang Magang' },
    { key: 'completion', label: 'Penyelesaian' },
    { key: 'completed', label: 'Selesai' },
];

function matchFilter(p: Participant, filter: FilterKey): boolean {
    const s = p.application.status;

    if (filter === 'all') {
        return true;
    }

    if (filter === 'approved') {
        return s === 'approved';
    }

    if (filter === 'ongoing') {
        return s === 'ongoing';
    }

    if (filter === 'completion') {
        return s === 'completion_submitted';
    }

    return s === 'completed';
}

/* ---- detail dialog --------------------------------------------------- */
function DetailRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon?: typeof UserCog;
}) {
    return (
        <div className="flex justify-between gap-4 py-2.5 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
                {Icon && <Icon className="size-3.5 text-slate-500" />}
                {label}
            </span>
            <span className="text-right font-semibold text-[#0a1628]">
                {value}
            </span>
        </div>
    );
}

/* ---- aksi tandai selesai (aktor "Selesai" #3: Admin OPD) ------------- */
function CompleteAction({
    endpoint,
    onDone,
}: {
    endpoint: string;
    onDone: () => void;
}) {
    const [confirming, setConfirming] = useState(false);
    const [processing, setProcessing] = useState(false);

    function submit() {
        setProcessing(true);
        router.post(
            endpoint,
            {},
            {
                preserveScroll: true,
                onSuccess: onDone,
                onFinish: () => setProcessing(false),
            },
        );
    }

    if (!confirming) {
        return (
            <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
                <CheckCircle2 className="size-4" /> Tandai Magang Selesai
            </button>
        );
    }

    return (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">
                Yakin menandai magang ini <strong>selesai</strong>? Peserta akan
                menerima notifikasi penyelesaian dan e-sertifikat diterbitkan.
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={submit}
                    disabled={processing}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                    {processing ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="size-4" />
                    )}
                    Ya, selesaikan
                </button>
                <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={processing}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white disabled:opacity-50"
                >
                    Batal
                </button>
            </div>
        </div>
    );
}

/* ---- panel aksi laporan akhir (batch 5: pindahan dari verifikator) ---- */
// Semua aksi menembak prefix /opd/laporan/{report} (Opd\ReportController);
// backend menolak 403 bila laporan bukan milik pengajuan OPD ini.

function ApproveReportButton({ reportId }: { reportId: number }) {
    const [processing, setProcessing] = useState(false);

    function submit() {
        setProcessing(true);
        router.post(
            `/opd/laporan/${reportId}/approve`,
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

        post(`/opd/laporan/${reportId}/sertifikat`, {
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

/**
 * Generate/unduh Surat Penyelesaian Magang. Nomor SK auto-increment dan
 * tanggal terbit ditetapkan SEKALI saat generate pertama; cetak/unduh ulang
 * tidak mengubah nomor maupun tanggal (idempoten di backend).
 */
function CompletionLetter({
    report,
}: {
    report: NonNullable<InternshipApplication['final_report']> & {
        id: number;
    };
}) {
    const [processing, setProcessing] = useState(false);
    const generated = Boolean(
        report.completion_sk_number ?? report.completion_letter_available,
    );

    function generate() {
        setProcessing(true);
        router.post(
            `/opd/laporan/${report.id}/surat-penyelesaian`,
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
                href={`/opd/laporan/${report.id}/surat-penyelesaian`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#106feb] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#0b4fb0]"
                title="Unduh ulang — nomor & tanggal terbit tidak berubah"
            >
                <FileBadge2 className="size-4" /> Unduh Surat Penyelesaian
            </a>
            <p className="text-center text-[11px] text-slate-400">
                No. {report.completion_sk_number ?? '—'}
                {report.completion_sk_issued_at
                    ? ` · terbit ${formatDate(report.completion_sk_issued_at)}`
                    : ''}
            </p>
        </div>
    );
}

/* ---- riwayat presensi peserta (batch 5) ------------------------------- */
const PRESENSI_META: Record<
    PresensiEntry['status'],
    { label: string; badge: string }
> = {
    hadir: { label: 'Hadir', badge: 'bg-emerald-100 text-emerald-700' },
    izin: { label: 'Izin', badge: 'bg-amber-100 text-amber-700' },
    sakit: { label: 'Sakit', badge: 'bg-rose-100 text-rose-700' },
};

function formatTime(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

function PresensiHistory({ entries }: { entries: PresensiEntry[] }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#12213e]">
                <CalendarCheck className="size-4 text-[#106feb]" /> Riwayat
                Presensi
                <span className="text-xs font-normal text-slate-400">
                    (31 hari terakhir)
                </span>
            </p>
            {entries.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                    Belum ada presensi.
                </p>
            ) : (
                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {entries.map((entry) => {
                        const meta = PRESENSI_META[entry.status];

                        return (
                            <li
                                key={entry.id}
                                className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5"
                            >
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-semibold text-[#12213e]">
                                        {formatDate(entry.activity_date)}
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
                                        {formatTime(entry.checked_in_at)}
                                    </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                                    {entry.details}
                                </p>
                                {entry.attachments.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {entry.attachments.map((file) => (
                                            <a
                                                key={file.id}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#106feb] ring-1 ring-slate-200 transition hover:bg-[#e8f2fe]"
                                            >
                                                <ExternalLink className="size-3" />
                                                {file.name}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

/* ---- rekam jejak progres tiket (audit ApplicationStatusLog) ----------- */
function StatusTimeline({ app }: { app: InternshipApplication }) {
    // Utamakan status_logs dari backend; bila belum ada, susun garis waktu
    // minimal dari timestamp yang tersedia agar tetap informatif.
    const events =
        app.status_logs && app.status_logs.length > 0
            ? app.status_logs
            : [
                  {
                      status: 'pending_verifikator' as const,
                      note: 'Pengajuan dibuat',
                      actor_name: null,
                      created_at: app.created_at,
                  },
                  ...(app.forwarded_at
                      ? [
                            {
                                status: 'forwarded_opd' as const,
                                note: app.verifikator_note ?? null,
                                actor_name: null,
                                created_at: app.forwarded_at,
                            },
                        ]
                      : []),
                  ...(app.opd_decision_at
                      ? [
                            {
                                status:
                                    app.status === 'rejected'
                                        ? ('rejected' as const)
                                        : ('approved' as const),
                                note: app.rejection_reason ?? null,
                                actor_name: null,
                                created_at: app.opd_decision_at,
                            },
                        ]
                      : []),
              ];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#12213e]">
                <History className="size-4 text-[#106feb]" /> Rekam Jejak Tiket
            </p>
            <ol className="mt-3 space-y-0">
                {events.map((ev, i) => {
                    const meta = STATUS_META[ev.status];
                    const last = i === events.length - 1;

                    return (
                        <li key={i} className="relative flex gap-3 pb-4">
                            {/* garis penghubung */}
                            {!last && (
                                <span
                                    aria-hidden
                                    className="absolute top-4 left-[5px] h-full w-px bg-slate-200"
                                />
                            )}
                            <span
                                className={cn(
                                    'relative mt-1 size-[11px] shrink-0 rounded-full ring-2',
                                    last
                                        ? 'bg-[#106feb] ring-[#cddcef]'
                                        : 'bg-slate-300 ring-slate-100',
                                )}
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#12213e]">
                                    {meta.label}
                                </p>
                                {ev.note && (
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {ev.note}
                                    </p>
                                )}
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    {formatDate(ev.created_at)}
                                    {ev.actor_name ? ` · ${ev.actor_name}` : ''}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function DetailDialog({
    participant,
    onClose,
}: {
    participant: Participant | null;
    onClose: () => void;
}) {
    const app = participant?.application ?? null;
    const canComplete =
        app?.status === 'ongoing' || app?.status === 'completion_submitted';

    return (
        <Dialog
            open={!!participant}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto bg-white text-[#0a1628] sm:max-w-lg">
                {participant && app && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex flex-wrap items-center gap-2 text-[#0a1628]">
                                {participant.student_name}
                                <StatusBadge status={app.status} />
                            </DialogTitle>
                            <DialogDescription className="font-mono text-slate-500">
                                {app.ticket_number}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Pas foto peserta (disk privat, route terproteksi) */}
                        {app.photo_url && (
                            <div className="flex justify-center">
                                <img
                                    src={app.photo_url}
                                    alt={`Pas foto ${participant.student_name}`}
                                    className="h-40 w-32 rounded-xl border border-slate-200 object-cover shadow-sm"
                                />
                            </div>
                        )}

                        {/* Seluruh data peserta — identitas + penempatan */}
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
                            <DetailRow
                                label="NIS / NIM"
                                value={app.nis || '—'}
                            />
                            <DetailRow
                                label="Asal Instansi"
                                value={app.institution_name}
                            />
                            <DetailRow
                                label="Tujuan Magang"
                                value={app.tujuan_magang}
                            />
                            <DetailRow
                                label="Jurusan"
                                value={app.major || '—'}
                            />
                            <DetailRow
                                label="Keahlian"
                                value={app.skills || '—'}
                            />
                            <DetailRow
                                label="Alamat"
                                value={app.address || '—'}
                            />
                            <DetailRow
                                label="No. WhatsApp"
                                value={app.applicant_whatsapp || '—'}
                            />
                            <DetailRow
                                label="Email"
                                value={app.applicant_email || '—'}
                            />
                            <DetailRow
                                label="Durasi"
                                value={`${app.duration_months} bulan`}
                            />
                            <DetailRow
                                label="Periode"
                                value={`${formatDate(app.start_date)} – ${formatDate(app.end_date)}`}
                            />
                            <DetailRow
                                label="Divisi / Bidang"
                                value={app.division ?? '—'}
                                icon={Briefcase}
                            />
                            <DetailRow
                                label="Pembimbing Lapangan"
                                value={app.field_supervisor ?? '—'}
                                icon={UserCog}
                            />
                            <DetailRow
                                label="Pembimbing Kampus"
                                value={app.campus_supervisor}
                                icon={GraduationCap}
                            />
                            <DetailRow
                                label="No. WA Pembimbing"
                                value={app.campus_supervisor_whatsapp || '—'}
                            />
                            <DetailRow
                                label="Penanggung Jawab"
                                value={app.person_in_charge ?? '—'}
                                icon={UserCog}
                            />
                            <DetailRow
                                label="No. SK Penerimaan"
                                value={app.sk_number ?? '—'}
                            />
                            <DetailRow
                                label="Tanggal Terbit SK"
                                value={
                                    app.sk_issued_at
                                        ? formatDate(app.sk_issued_at)
                                        : '—'
                                }
                            />
                        </div>

                        {/* Dokumen lampiran (surat pengantar / CV / portofolio) */}
                        <ApplicationDocuments app={app} />

                        {/* Rekam jejak progres tiket */}
                        <StatusTimeline app={app} />

                        {/* Riwayat presensi peserta (batch 5) */}
                        <PresensiHistory entries={participant.presensi ?? []} />

                        {app.final_report && (
                            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                                <p className="flex items-center gap-2 text-sm font-semibold text-[#12213e]">
                                    <FileCheck2 className="size-4 text-[#106feb]" />{' '}
                                    Laporan Akhir
                                </p>
                                <div>
                                    <p className="text-sm text-slate-600">
                                        {app.final_report.file_name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Diunggah{' '}
                                        {formatDate(
                                            app.final_report.submitted_at,
                                        )}{' '}
                                        ·{' '}
                                        {app.final_report.status === 'approved'
                                            ? 'Tervalidasi'
                                            : app.final_report.status ===
                                                'rejected'
                                              ? 'Ditolak'
                                              : 'Menunggu validasi'}
                                    </p>
                                </div>

                                {/* Panel aksi (batch 5: pindahan menu Laporan
                                    verifikator). Tombol tampil sesuai status. */}
                                {app.final_report.id != null && (
                                    <div className="space-y-3 border-t border-slate-100 pt-3">
                                        {app.final_report.report_url && (
                                            <a
                                                href={
                                                    app.final_report.report_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#106feb] transition hover:underline"
                                            >
                                                <ExternalLink className="size-4" />{' '}
                                                Buka Berkas Laporan
                                            </a>
                                        )}
                                        {app.final_report.status ===
                                            'pending' && (
                                            <ApproveReportButton
                                                reportId={app.final_report.id}
                                            />
                                        )}
                                        {app.final_report.status ===
                                            'approved' && (
                                            <UploadCertificate
                                                reportId={app.final_report.id}
                                            />
                                        )}
                                        <CompletionLetter
                                            report={{
                                                ...app.final_report,
                                                id: app.final_report.id,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {app.status === 'completed' &&
                            app.certificate_available && (
                                <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                    <Award className="size-4" /> Magang selesai
                                    — e-sertifikat telah terbit.
                                </p>
                            )}

                        {canComplete && (
                            <CompleteAction
                                key={app.id}
                                endpoint={`/opd/pengajuan/${app.id}/complete`}
                                onDone={onClose}
                            />
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ---- kartu peserta --------------------------------------------------- */
function ParticipantCard({
    participant,
    index,
    onOpen,
}: {
    participant: Participant;
    index: number;
    onOpen: () => void;
}) {
    const app = participant.application;
    const pct = progressPct(app);

    return (
        <motion.button
            type="button"
            onClick={onOpen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-[#106feb]/40 hover:shadow-sm"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#cddcef] text-sm font-bold text-[#106feb]">
                    {initials(participant.student_name)}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#12213e]">
                        {participant.student_name}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <Building2 className="size-3 shrink-0" />{' '}
                        {app.institution_name}
                    </p>
                </div>
                <StatusBadge status={app.status} />
            </div>

            <div className="space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-1.5">
                    <Briefcase className="size-3.5 shrink-0 text-slate-400" />{' '}
                    {app.division ?? '—'}
                </p>
                <p className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 shrink-0 text-slate-400" />{' '}
                    {formatDate(app.start_date)} – {formatDate(app.end_date)}
                </p>
            </div>

            {/* Progres periode */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                    <span>Progres magang</span>
                    <span>{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={cn(
                            'h-full rounded-full',
                            app.status === 'completed'
                                ? 'bg-emerald-500'
                                : 'bg-[#106feb]',
                        )}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        </motion.button>
    );
}

/* ---- halaman --------------------------------------------------------- */
interface PesertaProps {
    user?: MagangUser;
    opd?: Opd;
    participants?: Participant[];
}

export default function OpdPeserta({
    user = MOCK_USER,
    opd = THIS_OPD,
    participants = MOCK_PARTICIPANTS,
}: PesertaProps) {
    const [filter, setFilter] = useState<FilterKey>('all');
    const [query, setQuery] = useState('');
    const [active, setActive] = useState<Participant | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return participants.filter(
            (p) =>
                matchFilter(p, filter) &&
                (!q ||
                    p.student_name.toLowerCase().includes(q) ||
                    p.application.ticket_number.toLowerCase().includes(q) ||
                    p.application.institution_name.toLowerCase().includes(q)),
        );
    }, [participants, filter, query]);

    return (
        <MagangLayout
            user={user}
            title="Kelola Peserta"
            active="peserta"
            navItems={opdNav}
        >
            <Head title="Kelola Peserta — OPD" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-[#12213e]">
                            Peserta Magang
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <Building2 className="size-4" /> {opd.name} (
                            {opd.code})
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#cddcef]/50 px-3.5 py-1.5 text-sm font-semibold text-[#106feb]">
                        <Users className="size-4" />
                        {participants.length} peserta
                    </span>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1.5">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setFilter(f.key)}
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
                            placeholder="Cari nama / instansi…"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                        />
                    </div>
                </div>

                {/* Roster */}
                {filtered.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {filtered.map((p, i) => (
                            <ParticipantCard
                                key={p.application.id}
                                participant={p}
                                index={i}
                                onOpen={() => setActive(p)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                        <Users className="size-10 text-slate-300" />
                        <p className="text-sm font-semibold text-[#12213e]">
                            Belum ada peserta pada filter ini.
                        </p>
                        <p className="text-sm text-slate-500">
                            Peserta muncul setelah pengajuan disetujui.
                        </p>
                    </div>
                )}
            </div>

            <DetailDialog
                participant={active}
                onClose={() => setActive(null)}
            />
        </MagangLayout>
    );
}
