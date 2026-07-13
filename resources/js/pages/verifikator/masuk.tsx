import { Head } from '@inertiajs/react';
import {
    Search,
    Inbox,
    Send,
    XCircle,
    Loader2,
    Building2,
    GraduationCap,
    Calendar,
    Clock,
    Sparkles,
    MousePointerClick,
    ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import type { InternshipApplication, MagangUser, Opd } from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — KOTAK MASUK (verifikator/masuk)
 *  Antrian fokus pengajuan berstatus `pending_verifikator`. Tata letak
 *  master-detail: daftar di kiri, panel tinjau (teruskan/tolak) di kanan —
 *  berbeda dari dasbor yang memakai dialog.
 *
 *  FRONTEND ONLY. Rekan backend mengganti handler simulasi dengan:
 *    router.post(`/verifikator/pengajuan/${id}/teruskan`, { opd_id, division, field_supervisor, person_in_charge })
 *    router.post(`/verifikator/pengajuan/${id}/tolak`,     { rejection_reason })
 * ========================================================================= */

/* ---- util ------------------------------------------------------------ */
function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso));
}

function waitingDays(iso: string): number {
    const created = new Date(iso).getTime();
    const now = new Date('2026-06-25').getTime(); // tanggal acuan demo; backend pakai now()

    return Math.max(0, Math.floor((now - created) / 86_400_000));
}

/* ---- mock ------------------------------------------------------------ */
const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Dewi Anggraini',
    email: 'verifikator@madiunkota.go.id',
    whatsapp_number: '6281234567890',
    role: 'admin_verifikator',
};

const MOCK_OPDS: Opd[] = [
    { id: 1, name: 'Dinas Komunikasi dan Informatika', code: 'DISKOMINFO' },
    { id: 2, name: 'Dinas Pendidikan', code: 'DISDIK' },
    { id: 3, name: 'Dinas Kesehatan', code: 'DINKES' },
    { id: 4, name: 'Badan Kepegawaian Daerah', code: 'BKD' },
    { id: 5, name: 'Sekretariat Daerah', code: 'SETDA' },
];

function makeApp(
    partial: Partial<InternshipApplication> &
        Pick<InternshipApplication, 'id' | 'ticket_number'>,
): InternshipApplication {
    return {
        status: 'pending_verifikator',
        tujuan_magang: 'Magang kompetensi keahlian',
        duration_months: 3,
        start_date: '2026-07-01',
        end_date: '2026-09-30',
        institution_name: 'Universitas Negeri Madiun',
        campus_supervisor: 'Dr. Bambang Sutrisno',
        major: 'Teknik Informatika',
        skills: 'React, Laravel, desain UI/UX, manajemen basis data',
        verifikator_note: null,
        opd: null,
        division: null,
        field_supervisor: null,
        person_in_charge: null,
        rejection_reason: null,
        forwarded_at: null,
        opd_decision_at: null,
        created_at: '2026-06-20',
        final_report: null,
        survey_submitted: false,
        certificate_available: false,
        ...partial,
    };
}

const MOCK_APPLICATIONS: InternshipApplication[] = [
    makeApp({
        id: 21,
        ticket_number: 'MGG-2026-0054',
        tujuan_magang: 'Pengembangan aplikasi web internal',
        institution_name: 'Universitas Negeri Madiun',
        campus_supervisor: 'Dr. Sri Wahyuni, M.Kom',
        major: 'Teknik Informatika',
        skills: 'React, Laravel, REST API, PostgreSQL',
        created_at: '2026-06-24',
    }),
    makeApp({
        id: 22,
        ticket_number: 'MGG-2026-0053',
        tujuan_magang: 'Desain grafis & konten media sosial',
        institution_name: 'SMK Negeri 1 Madiun',
        campus_supervisor: 'Agus Priyono, S.Kom',
        major: 'Multimedia',
        skills: 'Adobe Photoshop, Illustrator, copywriting, fotografi',
        duration_months: 6,
        created_at: '2026-06-23',
    }),
    makeApp({
        id: 23,
        ticket_number: 'MGG-2026-0052',
        tujuan_magang: 'Analisis data kepegawaian',
        institution_name: 'Politeknik Negeri Madiun',
        campus_supervisor: 'Ir. Hadi Santoso',
        major: 'Statistika',
        skills: 'Excel lanjutan, Python, visualisasi data, Power BI',
        created_at: '2026-06-21',
    }),
    makeApp({
        id: 24,
        ticket_number: 'MGG-2026-0049',
        tujuan_magang: 'Pengelolaan arsip digital perkantoran',
        institution_name: 'Universitas Merdeka Madiun',
        campus_supervisor: 'Dra. Lestari Handayani',
        major: 'Administrasi Perkantoran',
        skills: 'Manajemen arsip, Microsoft Office, ketelitian dokumen',
        duration_months: 4,
        created_at: '2026-06-19',
    }),
];

/* ---- sub-komponen ---------------------------------------------------- */
function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 py-2 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="text-right font-medium text-[#12213e]">
                {value}
            </span>
        </div>
    );
}

type ReviewMode = 'forward' | 'reject';

// Panel tinjau diberi key={app.id} di pemanggil agar state form fresh tiap pilihan.
function ReviewPanel({
    app,
    opds,
    onForwarded,
    onRejected,
}: {
    app: InternshipApplication;
    opds: Opd[];
    onForwarded: (id: number) => void;
    onRejected: (id: number) => void;
}) {
    const [mode, setMode] = useState<ReviewMode>('forward');
    const [processing, setProcessing] = useState(false);

    const [opdId, setOpdId] = useState('');
    const [note, setNote] = useState('');
    const [reason, setReason] = useState('');

    const forwardValid = Boolean(opdId);

    function submitForward() {
        if (!forwardValid || processing) {
            return;
        }

        setProcessing(true);
        // TODO(backend): router.post(`/verifikator/pengajuan/${app.id}/teruskan`, { opd_id, verifikator_note: note })
        setTimeout(() => {
            setProcessing(false);
            onForwarded(app.id);
        }, 800);
    }

    function submitReject() {
        if (!reason.trim() || processing) {
            return;
        }

        setProcessing(true);
        // TODO(backend): router.post(`/verifikator/pengajuan/${app.id}/tolak`, { rejection_reason: reason })
        setTimeout(() => {
            setProcessing(false);
            onRejected(app.id);
        }, 800);
    }

    return (
        <div className="space-y-5">
            <div>
                <p className="font-mono text-xs font-semibold text-slate-400">
                    {app.ticket_number}
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-[#12213e]">
                    {app.institution_name}
                </h3>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/60 px-4">
                <DetailRow label="Tujuan Magang" value={app.tujuan_magang} />
                <DetailRow label="Jurusan" value={app.major ?? '—'} />
                <DetailRow
                    label="Durasi"
                    value={`${app.duration_months} bulan`}
                />
                <DetailRow
                    label="Periode"
                    value={`${formatDate(app.start_date)} – ${formatDate(app.end_date)}`}
                />
                <DetailRow
                    label="Pembimbing Kampus"
                    value={app.campus_supervisor}
                />
                <DetailRow label="Masuk" value={formatDate(app.created_at)} />
            </div>

            {/* Keahlian / keterampilan peserta — diisi saat mendaftar. */}
            <div className="rounded-xl border border-[#cddcef] bg-[#e8f2fe]/40 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#106feb] uppercase">
                    <GraduationCap className="size-3.5" /> Keahlian /
                    Keterampilan
                </p>
                <p className="mt-1 text-sm font-medium text-[#12213e]">
                    {app.skills || '—'}
                </p>
            </div>

            {/* Toggle mode */}
            <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                <button
                    type="button"
                    onClick={() => setMode('forward')}
                    className={cn(
                        'flex-1 rounded-lg py-2 text-sm font-semibold transition',
                        mode === 'forward'
                            ? 'bg-white text-[#106feb] shadow-sm'
                            : 'text-slate-500',
                    )}
                >
                    Teruskan ke OPD
                </button>
                <button
                    type="button"
                    onClick={() => setMode('reject')}
                    className={cn(
                        'flex-1 rounded-lg py-2 text-sm font-semibold transition',
                        mode === 'reject'
                            ? 'bg-white text-rose-600 shadow-sm'
                            : 'text-slate-500',
                    )}
                >
                    Tolak
                </button>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'forward' ? (
                    <motion.div
                        key="forward"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4"
                    >
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#12213e]">
                                OPD Tujuan
                            </label>
                            <Select value={opdId} onValueChange={setOpdId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih OPD…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {opds.map((opd) => (
                                        <SelectItem
                                            key={opd.id}
                                            value={String(opd.id)}
                                        >
                                            {opd.name} ({opd.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#12213e]">
                                Catatan khusus dari Admin Verifikator
                                <span className="ml-1 font-normal text-slate-400">
                                    (opsional)
                                </span>
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={4}
                                placeholder="Catatan ini akan dibaca Admin OPD saat menerima pengajuan, mis. rekomendasi penempatan atau hal yang perlu diperhatikan…"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#0a1628] transition outline-none placeholder:text-slate-400 focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={submitForward}
                            disabled={!forwardValid || processing}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#106feb] text-sm font-bold text-white transition hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Send className="size-4" />
                            )}
                            Teruskan ke OPD
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="reject"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4"
                    >
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#12213e]">
                                Alasan Penolakan
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                placeholder="Jelaskan alasan penolakan agar pemohon memahaminya…"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#0a1628] transition outline-none placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={submitReject}
                            disabled={!reason.trim() || processing}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <XCircle className="size-4" />
                            )}
                            Tolak Pengajuan
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---- halaman --------------------------------------------------------- */
interface MasukProps {
    user?: MagangUser;
    applications?: InternshipApplication[];
    opds?: Opd[];
}

export default function VerifikatorMasuk({
    user = MOCK_USER,
    applications = MOCK_APPLICATIONS,
    opds = MOCK_OPDS,
}: MasukProps) {
    // Hanya pengajuan menunggu verifikasi yang masuk antrian ini.
    const initialQueue = useMemo(
        () => applications.filter((a) => a.status === 'pending_verifikator'),
        [applications],
    );

    const [queue, setQueue] = useState(initialQueue);
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(
        initialQueue[0]?.id ?? null,
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return queue;
        }

        return queue.filter(
            (a) =>
                a.ticket_number.toLowerCase().includes(q) ||
                a.institution_name.toLowerCase().includes(q) ||
                a.tujuan_magang.toLowerCase().includes(q),
        );
    }, [queue, query]);

    const selected = queue.find((a) => a.id === selectedId) ?? null;

    // Hapus dari antrian + pilih item berikutnya (rekan backend akan reload props).
    function removeFromQueue(id: number, message: string) {
        const remaining = queue.filter((a) => a.id !== id);

        setQueue(remaining);
        setSelectedId(remaining[0]?.id ?? null);
        toast.success(message);
    }

    return (
        <MagangLayout
            user={user}
            title="Kotak Masuk"
            active="masuk"
            navItems={verifikatorNav}
        >
            <Head title="Kotak Masuk — Verifikator" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-[#12213e]">
                            Kotak Masuk
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Pengajuan baru yang menunggu verifikasi. Tinjau lalu
                            teruskan ke OPD atau tolak.
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
                        <Inbox className="size-4" />
                        {queue.length} menunggu
                    </span>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                    {/* ===== Daftar antrian ===== */}
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari tiket / instansi…"
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                            />
                        </div>

                        {filtered.length > 0 ? (
                            <div className="space-y-2.5">
                                {filtered.map((app) => {
                                    const isActive = app.id === selectedId;
                                    const days = waitingDays(app.created_at);

                                    return (
                                        <button
                                            key={app.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedId(app.id)
                                            }
                                            className={cn(
                                                'flex w-full flex-col gap-2 rounded-2xl border bg-white p-4 text-left transition',
                                                isActive
                                                    ? 'border-[#106feb] ring-2 ring-[#106feb]/20'
                                                    : 'border-slate-200 hover:border-[#106feb]/40 hover:bg-slate-50/60',
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-xs font-semibold text-[#12213e]">
                                                    {app.ticket_number}
                                                </span>
                                                {days >= 3 && (
                                                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                                                        {days} hari
                                                    </span>
                                                )}
                                            </div>
                                            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#12213e]">
                                                <Building2 className="size-3.5 shrink-0 text-slate-400" />{' '}
                                                {app.institution_name}
                                            </p>
                                            <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <GraduationCap className="size-3.5 shrink-0" />{' '}
                                                {app.tujuan_magang}
                                            </p>
                                            {app.skills && (
                                                <p className="line-clamp-1 flex items-center gap-1.5 rounded-lg bg-[#e8f2fe]/60 px-2 py-1 text-[11px] font-medium text-[#106feb]">
                                                    <Sparkles className="size-3 shrink-0" />{' '}
                                                    {app.skills}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-3" />{' '}
                                                    {formatDate(app.created_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3" />{' '}
                                                    {app.duration_months} bln
                                                </span>
                                                <ChevronRight
                                                    className={cn(
                                                        'ml-auto size-4',
                                                        isActive
                                                            ? 'text-[#106feb]'
                                                            : 'text-slate-300',
                                                    )}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                                <Inbox className="size-10 text-slate-300" />
                                <p className="text-sm font-semibold text-[#12213e]">
                                    {queue.length === 0
                                        ? 'Kotak masuk kosong'
                                        : 'Tidak ada hasil pencarian'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {queue.length === 0
                                        ? 'Semua pengajuan sudah ditinjau.'
                                        : 'Coba kata kunci lain.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ===== Panel tinjau ===== */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                            {selected ? (
                                <ReviewPanel
                                    key={selected.id}
                                    app={selected}
                                    opds={opds}
                                    onForwarded={(id) =>
                                        removeFromQueue(
                                            id,
                                            'Pengajuan diteruskan ke OPD.',
                                        )
                                    }
                                    onRejected={(id) =>
                                        removeFromQueue(
                                            id,
                                            'Pengajuan ditolak.',
                                        )
                                    }
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-3 py-16 text-center">
                                    <span className="flex size-14 items-center justify-center rounded-2xl bg-[#cddcef]/40 text-[#106feb]">
                                        <MousePointerClick className="size-6" />
                                    </span>
                                    <p className="text-sm font-semibold text-[#12213e]">
                                        Pilih pengajuan untuk ditinjau
                                    </p>
                                    <p className="max-w-xs text-sm text-slate-500">
                                        Detail pemohon dan formulir keputusan
                                        akan muncul di sini.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MagangLayout>
    );
}
