import { Head } from '@inertiajs/react';
import {
    Search,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Loader2,
    Building2,
    Calendar,
    Clock,
    Briefcase,
    UserCog,
    GraduationCap,
    Sparkles,
    StickyNote,
    AlertTriangle,
    MousePointerClick,
    ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import MagangLayout, { opdNav } from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import type { InternshipApplication, MagangUser, Opd } from '@/types/magang';

/* =========================================================================
 *  OPD — PERLU KEPUTUSAN (opd/keputusan)
 *  Antrian fokus pengajuan berstatus `forwarded_opd` yang diteruskan
 *  verifikator ke OPD ini. Tata letak master-detail: daftar di kiri, panel
 *  keputusan (setujui/tolak) di kanan — berbeda dari dasbor (dialog).
 *
 *  FRONTEND ONLY. Rekan backend mengganti handler simulasi dengan:
 *    router.post(`/opd/pengajuan/${id}/setujui`, {})
 *    router.post(`/opd/pengajuan/${id}/tolak`,   { rejection_reason })
 *  Backend hanya mengirim pengajuan milik OPD admin yang login.
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
    const at = new Date(iso).getTime();
    const now = new Date('2026-06-25').getTime(); // acuan demo; backend pakai now()

    return Math.max(0, Math.floor((now - at) / 86_400_000));
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
        Pick<InternshipApplication, 'id' | 'ticket_number'>,
): InternshipApplication {
    return {
        status: 'forwarded_opd',
        tujuan_magang: 'Magang kompetensi keahlian',
        duration_months: 3,
        start_date: '2026-07-01',
        end_date: '2026-09-30',
        institution_name: 'Universitas Negeri Madiun',
        campus_supervisor: 'Dr. Bambang Sutrisno',
        major: 'Teknik Informatika',
        skills: 'React, Laravel, REST API, PostgreSQL',
        verifikator_note:
            'Berkas lengkap & sesuai. Kandidat kuat untuk tim pengembangan aplikasi.',
        opd: THIS_OPD,
        // Penempatan diisi Admin OPD saat menyetujui — null saat masih antrian.
        division: null,
        field_supervisor: null,
        person_in_charge: null,
        rejection_reason: null,
        forwarded_at: '2026-06-21',
        opd_decision_at: null,
        created_at: '2026-06-19',
        final_report: null,
        survey_submitted: false,
        certificate_available: false,
        ...partial,
    };
}

const MOCK_APPLICATIONS: InternshipApplication[] = [
    makeApp({
        id: 31,
        ticket_number: 'MGG-2026-0055',
        tujuan_magang: 'Pengembangan aplikasi web internal',
        institution_name: 'Universitas Negeri Madiun',
        major: 'Teknik Informatika',
        skills: 'React, Laravel, REST API, PostgreSQL',
        verifikator_note:
            'Berkas lengkap & sesuai. Kandidat kuat untuk tim pengembangan aplikasi.',
        campus_supervisor: 'Dr. Sri Wahyuni, M.Kom',
        forwarded_at: '2026-06-24',
    }),
    makeApp({
        id: 32,
        ticket_number: 'MGG-2026-0053',
        tujuan_magang: 'Desain grafis & konten media sosial',
        institution_name: 'SMK Negeri 1 Madiun',
        major: 'Multimedia',
        skills: 'Adobe Photoshop, Illustrator, copywriting, fotografi',
        verifikator_note:
            'Cocok untuk bidang layanan informasi publik / media sosial.',
        campus_supervisor: 'Agus Priyono, S.Kom',
        duration_months: 6,
        forwarded_at: '2026-06-23',
    }),
    makeApp({
        id: 33,
        ticket_number: 'MGG-2026-0052',
        tujuan_magang: 'Analisis & visualisasi data layanan publik',
        institution_name: 'Politeknik Negeri Madiun',
        major: 'Statistika',
        skills: 'Excel lanjutan, Python, visualisasi data, Power BI',
        verifikator_note:
            'Pertimbangkan penempatan di bidang Statistik & Persandian.',
        campus_supervisor: 'Ir. Hadi Santoso',
        forwarded_at: '2026-06-21',
    }),
];

/* ---- sub-komponen ---------------------------------------------------- */
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
        <div className="flex justify-between gap-4 py-2 text-sm">
            <span className="flex items-center gap-1.5 text-slate-500">
                {Icon && <Icon className="size-3.5" />}
                {label}
            </span>
            <span className="text-right font-medium text-[#12213e]">
                {value}
            </span>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    icon: Icon,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    icon?: typeof UserCog;
}) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-[#12213e]">
                {Icon && <Icon className="size-3.5 text-slate-400" />}
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#0a1628] transition outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
        </div>
    );
}

type DecisionMode = 'approve' | 'reject';

// Panel diberi key={app.id} di pemanggil agar state form fresh tiap pilihan.
function DecisionPanel({
    app,
    onApproved,
    onRejected,
}: {
    app: InternshipApplication;
    onApproved: (id: number) => void;
    onRejected: (id: number) => void;
}) {
    const [mode, setMode] = useState<DecisionMode>('approve');
    const [processing, setProcessing] = useState(false);
    const [reason, setReason] = useState('');

    // Penempatan kini diisi Admin OPD saat menyetujui (dipindah dari Verifikator).
    const [division, setDivision] = useState('');
    const [fieldSupervisor, setFieldSupervisor] = useState('');
    const [personInCharge, setPersonInCharge] = useState('');

    const approveValid =
        division.trim() && fieldSupervisor.trim() && personInCharge.trim();

    function submitApprove() {
        if (!approveValid || processing) {
            return;
        }

        setProcessing(true);
        // TODO(backend): router.post(`/opd/pengajuan/${app.id}/setujui`, { division, field_supervisor, person_in_charge })
        setTimeout(() => {
            setProcessing(false);
            onApproved(app.id);
        }, 800);
    }

    function submitReject() {
        if (!reason.trim() || processing) {
            return;
        }

        setProcessing(true);
        // TODO(backend): router.post(`/opd/pengajuan/${app.id}/tolak`, { rejection_reason: reason })
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
            </div>

            {/* Keahlian peserta */}
            <div className="rounded-xl border border-[#cddcef] bg-[#e8f2fe]/40 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#106feb] uppercase">
                    <Sparkles className="size-3.5" /> Keahlian / Keterampilan
                </p>
                <p className="mt-1 text-sm font-medium text-[#12213e]">
                    {app.skills || '—'}
                </p>
            </div>

            {/* Catatan dari Admin Verifikator */}
            {app.verifikator_note && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                        <StickyNote className="size-3.5" /> Catatan Admin
                        Verifikator
                    </p>
                    <p className="mt-1 text-sm font-medium text-amber-900">
                        {app.verifikator_note}
                    </p>
                </div>
            )}

            {/* Toggle keputusan */}
            <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                <button
                    type="button"
                    onClick={() => setMode('approve')}
                    className={cn(
                        'flex-1 rounded-lg py-2 text-sm font-semibold transition',
                        mode === 'approve'
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-slate-500',
                    )}
                >
                    Setujui
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
                {mode === 'approve' ? (
                    <motion.div
                        key="approve"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4"
                    >
                        <p className="text-sm text-slate-500">
                            Tetapkan penempatan peserta di{' '}
                            <span className="font-semibold text-[#12213e]">
                                {app.opd?.name ?? 'OPD Anda'}
                            </span>
                            . Data ini dikirim ke peserta dalam email
                            persetujuan.
                        </p>

                        <Field
                            label="Divisi / Bidang"
                            value={division}
                            onChange={setDivision}
                            placeholder="cth. Bidang Infrastruktur TIK"
                            icon={Briefcase}
                        />
                        <Field
                            label="Pembimbing Lapangan"
                            value={fieldSupervisor}
                            onChange={setFieldSupervisor}
                            placeholder="Nama pembimbing dari OPD"
                            icon={UserCog}
                        />
                        <Field
                            label="Penanggung Jawab"
                            value={personInCharge}
                            onChange={setPersonInCharge}
                            placeholder="cth. Kepala Bidang"
                            icon={UserCog}
                        />

                        {/* Peringatan kedatangan peserta */}
                        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                            <p className="text-xs leading-relaxed text-amber-800">
                                Notif ini akan dikirim ke peserta magang.
                                Peserta akan datang berkunjung ke kantor setelah
                                diterima pengajuan ini.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={submitApprove}
                            disabled={!approveValid || processing}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="size-4" />
                            )}
                            Setujui Pengajuan
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
interface KeputusanProps {
    user?: MagangUser;
    opd?: Opd;
    applications?: InternshipApplication[];
}

export default function OpdKeputusan({
    user = MOCK_USER,
    opd = THIS_OPD,
    applications = MOCK_APPLICATIONS,
}: KeputusanProps) {
    const initialQueue = useMemo(
        () => applications.filter((a) => a.status === 'forwarded_opd'),
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

    function removeFromQueue(id: number, message: string) {
        const remaining = queue.filter((a) => a.id !== id);

        setQueue(remaining);
        setSelectedId(remaining[0]?.id ?? null);
        toast.success(message);
    }

    return (
        <MagangLayout
            user={user}
            title="Perlu Keputusan"
            active="keputusan"
            navItems={opdNav}
        >
            <Head title="Perlu Keputusan — OPD" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-[#12213e]">
                            Perlu Keputusan
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <Building2 className="size-4" /> {opd.name} (
                            {opd.code})
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
                        <ClipboardCheck className="size-4" />
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
                                    const days = app.forwarded_at
                                        ? waitingDays(app.forwarded_at)
                                        : 0;

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
                                                    {app.forwarded_at
                                                        ? formatDate(
                                                              app.forwarded_at,
                                                          )
                                                        : '—'}
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
                                <ClipboardCheck className="size-10 text-slate-300" />
                                <p className="text-sm font-semibold text-[#12213e]">
                                    {queue.length === 0
                                        ? 'Tidak ada antrian 🎉'
                                        : 'Tidak ada hasil pencarian'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {queue.length === 0
                                        ? 'Semua pengajuan sudah diputuskan.'
                                        : 'Coba kata kunci lain.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ===== Panel keputusan ===== */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                            {selected ? (
                                <DecisionPanel
                                    key={selected.id}
                                    app={selected}
                                    onApproved={(id) =>
                                        removeFromQueue(
                                            id,
                                            'Pengajuan disetujui. Peserta dapat mulai magang.',
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
                                        Pilih pengajuan untuk diputuskan
                                    </p>
                                    <p className="max-w-xs text-sm text-slate-500">
                                        Detail penempatan dan tombol keputusan
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
