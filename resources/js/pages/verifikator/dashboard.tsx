import { Head } from '@inertiajs/react';
import {
    Search,
    Inbox,
    Send,
    CheckCircle2,
    XCircle,
    Building2,
    GraduationCap,
    Calendar,
    Clock,
    Loader2,
    ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import MagangLayout, { verifikatorNav } from '@/Layouts/magang-layout';
import { cn } from '@/lib/utils';
import { STATUS_META } from '@/types/magang';
import type { ApplicationStatus, InternshipApplication, MagangUser, Opd } from '@/types/magang';

/* =========================================================================
 *  DASBOR ADMIN VERIFIKATOR — E-MAGANG (Pemkot Madiun)
 *  Tugas verifikator: meninjau pengajuan masuk (`pending_verifikator`),
 *  lalu MENERUSKAN ke OPD (mengisi OPD tujuan, divisi, pembimbing lapangan,
 *  & penanggung jawab) atau MENOLAK dengan alasan.
 *
 *  FRONTEND ONLY. Tabel & form memakai MOCK + simulasi state. Rekan backend
 *  cukup mengirim props dari Inertia::render('verifikator/dashboard', [...])
 *  dan mengganti handler `submitForward`/`submitReject` dengan:
 *    router.post(`/verifikator/pengajuan/${id}/teruskan`, { opd_id, division, field_supervisor, person_in_charge })
 *    router.post(`/verifikator/pengajuan/${id}/tolak`,     { rejection_reason })
 * ========================================================================= */

/* ---- Util tanggal ---------------------------------------------------- */
function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

/* ---- Badge status ---------------------------------------------------- */
const TONE_BADGE: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
    const meta = STATUS_META[status];

    return (
        <Badge variant="outline" className={cn('rounded-full font-medium', TONE_BADGE[meta.tone])}>
            {meta.label}
        </Badge>
    );
}

/* ---- Data tiruan ----------------------------------------------------- */
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

function makeApp(partial: Partial<InternshipApplication> & Pick<InternshipApplication, 'id' | 'ticket_number' | 'status'>): InternshipApplication {
    return {
        tujuan_magang: 'Magang kompetensi keahlian',
        duration_months: 3,
        start_date: '2026-07-01',
        end_date: '2026-09-30',
        institution_name: 'Universitas Negeri Madiun',
        campus_supervisor: 'Dr. Bambang Sutrisno',
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
    makeApp({ id: 11, ticket_number: 'MGG-2026-0051', status: 'pending_verifikator', tujuan_magang: 'Pengembangan aplikasi web', institution_name: 'Universitas Negeri Madiun', campus_supervisor: 'Dr. Sri Wahyuni', created_at: '2026-06-24' }),
    makeApp({ id: 12, ticket_number: 'MGG-2026-0050', status: 'pending_verifikator', tujuan_magang: 'Desain grafis & multimedia', institution_name: 'SMK Negeri 1 Madiun', campus_supervisor: 'Agus Priyono, S.Kom', duration_months: 6, created_at: '2026-06-23' }),
    makeApp({ id: 13, ticket_number: 'MGG-2026-0048', status: 'pending_verifikator', tujuan_magang: 'Analisis data kepegawaian', institution_name: 'Politeknik Negeri Madiun', campus_supervisor: 'Ir. Hadi Santoso', created_at: '2026-06-22' }),
    makeApp({ id: 9, ticket_number: 'MGG-2026-0042', status: 'forwarded_opd', tujuan_magang: 'Administrasi jaringan', institution_name: 'Universitas Negeri Madiun', opd: MOCK_OPDS[0], division: 'Bidang Infrastruktur TIK', field_supervisor: 'Rudi Hartono, S.T', person_in_charge: 'Kepala Bidang IT', forwarded_at: '2026-06-21', created_at: '2026-06-19' }),
    makeApp({ id: 7, ticket_number: 'MGG-2026-0038', status: 'approved', tujuan_magang: 'Manajemen arsip digital', institution_name: 'Universitas Merdeka Madiun', opd: MOCK_OPDS[4], division: 'Bagian Umum', forwarded_at: '2026-06-18', opd_decision_at: '2026-06-20', created_at: '2026-06-16' }),
    makeApp({ id: 5, ticket_number: 'MGG-2026-0031', status: 'rejected', tujuan_magang: 'Penelitian sosial', institution_name: 'SMA Negeri 3 Madiun', rejection_reason: 'Kuota periode ini telah penuh.', created_at: '2026-06-14' }),
];

/* ---- Filter ---------------------------------------------------------- */
type FilterKey = 'pending_verifikator' | 'forwarded_opd' | 'done' | 'all';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'pending_verifikator', label: 'Menunggu Verifikasi' },
    { key: 'forwarded_opd', label: 'Diteruskan' },
    { key: 'done', label: 'Selesai Diproses' },
    { key: 'all', label: 'Semua' },
];

function matchFilter(app: InternshipApplication, filter: FilterKey): boolean {
    if (filter === 'all') {
        return true;
    }

    if (filter === 'pending_verifikator') {
        return app.status === 'pending_verifikator';
    }

    if (filter === 'forwarded_opd') {
        return app.status === 'forwarded_opd';
    }

    return ['approved', 'rejected', 'ongoing', 'completion_submitted', 'completed'].includes(app.status);
}

/* ---- Kartu statistik ------------------------------------------------- */
function StatCard({ icon: Icon, label, value, tone, delay }: { icon: typeof Inbox; label: string; value: number; tone: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: 'circOut' }}
            className="rounded-2xl border border-slate-200 bg-white p-5"
        >
            <div className={cn('mb-3 flex size-10 items-center justify-center rounded-xl', tone)}>
                <Icon className="size-5" />
            </div>
            <p className="text-2xl font-black text-[#12213e]">{value}</p>
            <p className="mt-0.5 text-sm text-slate-500">{label}</p>
        </motion.div>
    );
}

/* ---- Dialog tinjau --------------------------------------------------- */
type ReviewMode = 'forward' | 'reject';

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 py-2 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="text-right font-medium text-[#12213e]">{value}</span>
        </div>
    );
}

function ReviewDialog({
    app,
    opds,
    onClose,
    onForwarded,
    onRejected,
}: {
    app: InternshipApplication | null;
    opds: Opd[];
    onClose: () => void;
    onForwarded: (id: number) => void;
    onRejected: (id: number) => void;
}) {
    const [mode, setMode] = useState<ReviewMode>('forward');
    const [processing, setProcessing] = useState(false);

    // Form teruskan
    const [opdId, setOpdId] = useState('');
    const [division, setDivision] = useState('');
    const [fieldSupervisor, setFieldSupervisor] = useState('');
    const [personInCharge, setPersonInCharge] = useState('');

    // Form tolak
    const [reason, setReason] = useState('');

    const forwardValid = opdId && division.trim() && fieldSupervisor.trim() && personInCharge.trim();

    function submitForward() {
        if (!forwardValid || processing || !app) {
            return;
        }

        setProcessing(true);
        // TODO(backend): router.post(`/verifikator/pengajuan/${app.id}/teruskan`, { opd_id, division, field_supervisor, person_in_charge })
        setTimeout(() => {
            setProcessing(false);
            onForwarded(app.id);
        }, 800);
    }

    function submitReject() {
        if (!reason.trim() || processing || !app) {
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
        <Dialog open={!!app} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                {app && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                Tinjau Pengajuan
                                <span className="font-mono text-sm font-normal text-slate-400">{app.ticket_number}</span>
                            </DialogTitle>
                            <DialogDescription>Periksa detail pemohon sebelum meneruskan atau menolak.</DialogDescription>
                        </DialogHeader>

                        {/* Detail pemohon */}
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/60 px-4">
                            <DetailRow label="Asal Instansi" value={app.institution_name} />
                            <DetailRow label="Tujuan Magang" value={app.tujuan_magang} />
                            <DetailRow label="Durasi" value={`${app.duration_months} bulan`} />
                            <DetailRow label="Periode" value={`${formatDate(app.start_date)} – ${formatDate(app.end_date)}`} />
                            <DetailRow label="Pembimbing Kampus" value={app.campus_supervisor} />
                        </div>

                        {/* Toggle mode */}
                        <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => setMode('forward')}
                                className={cn(
                                    'flex-1 rounded-lg py-2 text-sm font-semibold transition',
                                    mode === 'forward' ? 'bg-white text-[#106feb] shadow-sm' : 'text-slate-500',
                                )}
                            >
                                Teruskan ke OPD
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('reject')}
                                className={cn(
                                    'flex-1 rounded-lg py-2 text-sm font-semibold transition',
                                    mode === 'reject' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500',
                                )}
                            >
                                Tolak
                            </button>
                        </div>

                        {mode === 'forward' ? (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-[#12213e]">OPD Tujuan</label>
                                    <Select value={opdId} onValueChange={setOpdId}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih OPD…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {opds.map((opd) => (
                                                <SelectItem key={opd.id} value={String(opd.id)}>
                                                    {opd.name} ({opd.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Field label="Divisi / Bidang" value={division} onChange={setDivision} placeholder="cth. Bidang Infrastruktur TIK" />
                                <Field label="Pembimbing Lapangan" value={fieldSupervisor} onChange={setFieldSupervisor} placeholder="Nama pembimbing dari OPD" />
                                <Field label="Penanggung Jawab" value={personInCharge} onChange={setPersonInCharge} placeholder="cth. Kepala Bidang" />

                                <button
                                    type="button"
                                    onClick={submitForward}
                                    disabled={!forwardValid || processing}
                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#106feb] text-sm font-bold text-white transition hover:bg-[#0b5ed0] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    Teruskan ke OPD
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-[#12213e]">Alasan Penolakan</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={4}
                                        placeholder="Jelaskan alasan penolakan agar pemohon memahaminya…"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={submitReject}
                                    disabled={!reason.trim() || processing}
                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                                    Tolak Pengajuan
                                </button>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#12213e]">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
            />
        </div>
    );
}

/* ---- Halaman --------------------------------------------------------- */
interface VerifikatorDashboardProps {
    user?: MagangUser;
    applications?: InternshipApplication[];
    opds?: Opd[];
}

export default function VerifikatorDashboard({
    user = MOCK_USER,
    applications = MOCK_APPLICATIONS,
    opds = MOCK_OPDS,
}: VerifikatorDashboardProps) {
    const [rows, setRows] = useState(applications);
    const [filter, setFilter] = useState<FilterKey>('pending_verifikator');
    const [query, setQuery] = useState('');
    const [active, setActive] = useState<InternshipApplication | null>(null);

    const stats = useMemo(
        () => ({
            pending: rows.filter((a) => a.status === 'pending_verifikator').length,
            forwarded: rows.filter((a) => a.status === 'forwarded_opd').length,
            approved: rows.filter((a) => a.status === 'approved').length,
            rejected: rows.filter((a) => a.status === 'rejected').length,
        }),
        [rows],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return rows.filter(
            (a) =>
                matchFilter(a, filter) &&
                (!q ||
                    a.ticket_number.toLowerCase().includes(q) ||
                    a.institution_name.toLowerCase().includes(q) ||
                    a.tujuan_magang.toLowerCase().includes(q)),
        );
    }, [rows, filter, query]);

    // Optimistic update setelah aksi (rekan backend mengganti dengan reload props).
    function applyStatus(id: number, status: ApplicationStatus) {
        setRows((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
        setActive(null);
    }

    return (
        <MagangLayout user={user} title="Verifikasi Pengajuan" active="dashboard" navItems={verifikatorNav}>
            <Head title="Dasbor Verifikator — E-Magang" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">Selamat datang, {user.name.split(' ')[0]} 👋</h2>
                    <p className="mt-1 text-sm text-slate-500">Tinjau pengajuan magang yang masuk dan teruskan ke OPD tujuan.</p>
                </div>

                {/* Statistik */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard icon={Inbox} label="Menunggu Verifikasi" value={stats.pending} tone="bg-amber-50 text-amber-600" delay={0} />
                    <StatCard icon={Send} label="Diteruskan ke OPD" value={stats.forwarded} tone="bg-blue-50 text-blue-600" delay={0.05} />
                    <StatCard icon={CheckCircle2} label="Disetujui OPD" value={stats.approved} tone="bg-emerald-50 text-emerald-600" delay={0.1} />
                    <StatCard icon={XCircle} label="Ditolak" value={stats.rejected} tone="bg-rose-50 text-rose-600" delay={0.15} />
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
                                    filter === f.key ? 'bg-[#106feb] text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative sm:w-64">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari tiket / instansi…"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                        />
                    </div>
                </div>

                {/* Tabel */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {/* Desktop */}
                    <table className="hidden w-full text-left text-sm md:table">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-3 font-semibold">No. Tiket</th>
                                <th className="px-5 py-3 font-semibold">Asal Instansi</th>
                                <th className="px-5 py-3 font-semibold">Tujuan</th>
                                <th className="px-5 py-3 font-semibold">Masuk</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((app) => (
                                <tr key={app.id} className="transition hover:bg-slate-50/60">
                                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#12213e]">{app.ticket_number}</td>
                                    <td className="px-5 py-3.5">{app.institution_name}</td>
                                    <td className="px-5 py-3.5 text-slate-600">{app.tujuan_magang}</td>
                                    <td className="px-5 py-3.5 text-slate-500">{formatDate(app.created_at)}</td>
                                    <td className="px-5 py-3.5"><StatusBadge status={app.status} /></td>
                                    <td className="px-5 py-3.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setActive(app)}
                                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#106feb] transition hover:bg-[#cddcef]/40"
                                        >
                                            Tinjau
                                            <ArrowRight className="size-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile */}
                    <div className="divide-y divide-slate-100 md:hidden">
                        {filtered.map((app) => (
                            <button
                                key={app.id}
                                type="button"
                                onClick={() => setActive(app)}
                                className="flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-slate-50/60"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs font-semibold text-[#12213e]">{app.ticket_number}</span>
                                    <StatusBadge status={app.status} />
                                </div>
                                <p className="flex items-center gap-1.5 text-sm font-medium text-[#12213e]">
                                    <Building2 className="size-3.5 text-slate-400" /> {app.institution_name}
                                </p>
                                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <GraduationCap className="size-3.5" /> {app.tujuan_magang}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><Calendar className="size-3" /> {formatDate(app.created_at)}</span>
                                    <span className="flex items-center gap-1"><Clock className="size-3" /> {app.duration_months} bln</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                            <Inbox className="size-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">Tidak ada pengajuan pada filter ini.</p>
                        </div>
                    )}
                </div>
            </div>

            <ReviewDialog
                app={active}
                opds={opds}
                onClose={() => setActive(null)}
                onForwarded={(id) => applyStatus(id, 'forwarded_opd')}
                onRejected={(id) => applyStatus(id, 'rejected')}
            />
        </MagangLayout>
    );
}
