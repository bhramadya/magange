import { Head, router } from '@inertiajs/react';
import {
    Search,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Activity,
    Building2,
    GraduationCap,
    Calendar,
    Clock,
    Loader2,
    UserCog,
    Briefcase,
    ArrowRight,
    AlertTriangle,
    Sparkles,
    StickyNote,
    Users,
    Pencil,
    Award,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
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
import type { ApplicationStatus, InternshipApplication, MagangUser, Opd } from '@/types/magang';

/* =========================================================================
 *  DASBOR ADMIN OPD — E-MAGANG (Pemkot Madiun)
 *  OPD menerima pengajuan yang SUDAH DITERUSKAN verifikator (`forwarded_opd`)
 *  beserta divisi, pembimbing lapangan, & penanggung jawab. OPD memutuskan:
 *  MENYETUJUI (→ peserta mulai magang) atau MENOLAK dengan alasan.
 *
 *  Aksi form terhubung ke backend nyata (OpdSubmissionController) via Inertia:
 *    router.post(`/opd/pengajuan/${id}/approve`, { division, field_supervisor, person_in_charge })
 *    router.post(`/opd/pengajuan/${id}/reject`,  { rejection_reason })
 *  Props tabel dikirim dari Inertia::render('opd/dashboard', [...]) — hanya
 *  pengajuan milik OPD admin yang login. MOCK di bawah fallback pratinjau.
 * ========================================================================= */

/* ---- Util tanggal ---------------------------------------------------- */
function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

/* ---- Data tiruan ----------------------------------------------------- */
const THIS_OPD: Opd = { id: 1, name: 'Dinas Komunikasi dan Informatika', code: 'DISKOMINFO', quota: 10, quota_used: 4 };

const MOCK_USER: MagangUser = {
    id: 2,
    name: 'Budi Santoso',
    email: 'opd.diskominfo@madiunkota.go.id',
    whatsapp_number: '6281298765432',
    role: 'admin_opd',
};

function makeApp(
    partial: Partial<InternshipApplication> & Pick<InternshipApplication, 'id' | 'ticket_number' | 'status'>,
): InternshipApplication {
    return {
        applicant_name: 'Peserta Magang',
        applicant_email: 'peserta@example.com',
        applicant_whatsapp: '6281234567890',
        nis: '2101234567',
        address: 'Jl. Pahlawan No. 10, Madiun',
        guardian_name: 'Drs. Suparno',
        photo_url: null,
        tujuan_magang: 'Magang kompetensi keahlian',
        duration_months: 3,
        start_date: '2026-07-01',
        end_date: '2026-09-30',
        institution_name: 'Universitas Negeri Madiun',
        campus_supervisor: 'Dr. Bambang Sutrisno',
        opd: THIS_OPD,
        division: 'Bidang Infrastruktur TIK',
        field_supervisor: 'Rudi Hartono, S.T',
        person_in_charge: 'Kepala Bidang IT',
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
    makeApp({ id: 21, ticket_number: 'MGG-2026-0051', status: 'forwarded_opd', tujuan_magang: 'Pengembangan aplikasi web', institution_name: 'Universitas Negeri Madiun', division: 'Bidang Pengembangan Aplikasi', field_supervisor: 'Sari Dewi, S.Kom', person_in_charge: 'Kasubbag Aplikasi', forwarded_at: '2026-06-24' }),
    makeApp({ id: 22, ticket_number: 'MGG-2026-0050', status: 'forwarded_opd', tujuan_magang: 'Desain grafis & multimedia', institution_name: 'SMK Negeri 1 Madiun', division: 'Bidang Layanan Informasi Publik', field_supervisor: 'Andi Wijaya', person_in_charge: 'Kabid IKP', duration_months: 6, forwarded_at: '2026-06-23' }),
    makeApp({ id: 26, ticket_number: 'MGG-2026-0052', status: 'forwarded_opd', tujuan_magang: 'Analisis & visualisasi data layanan publik', institution_name: 'Politeknik Negeri Madiun', division: 'Bidang Statistik & Persandian', field_supervisor: 'Yudha Pratama, S.Si', person_in_charge: 'Kabid Statistik', forwarded_at: '2026-06-21' }),
    makeApp({ id: 23, ticket_number: 'MGG-2026-0042', status: 'ongoing', tujuan_magang: 'Administrasi jaringan', institution_name: 'Universitas Negeri Madiun', start_date: '2026-06-01', end_date: '2026-08-31', opd_decision_at: '2026-05-28', forwarded_at: '2026-05-25' }),
    makeApp({ id: 24, ticket_number: 'MGG-2026-0039', status: 'approved', tujuan_magang: 'Manajemen media sosial', institution_name: 'Universitas Merdeka Madiun', division: 'Bidang IKP', opd_decision_at: '2026-06-22', forwarded_at: '2026-06-20' }),
    makeApp({ id: 25, ticket_number: 'MGG-2026-0033', status: 'rejected', tujuan_magang: 'Riset keamanan siber', institution_name: 'Politeknik Negeri Madiun', rejection_reason: 'Bidang tidak tersedia pada periode ini.', opd_decision_at: '2026-06-18', forwarded_at: '2026-06-15' }),
];

/* ---- Filter ---------------------------------------------------------- */
// Urutan kiri→kanan: Perlu Keputusan, Disetujui, Sedang Magang, Selesai, Ditolak, Semua.
type FilterKey = 'forwarded_opd' | 'approved' | 'active' | 'completed' | 'rejected' | 'all';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'forwarded_opd', label: 'Perlu Keputusan' },
    { key: 'approved', label: 'Disetujui' },
    { key: 'active', label: 'Sedang Magang' },
    { key: 'completed', label: 'Selesai Magang' },
    { key: 'rejected', label: 'Ditolak' },
    { key: 'all', label: 'Semua' },
];

// Kartu statistik dipetakan 1:1 dengan filter (tanpa "Semua") agar jumlah,
// urutan, & label kartu selalu selaras dengan chip filter di bawahnya.
const STAT_CARDS: { key: Exclude<FilterKey, 'all'>; label: string; icon: typeof ClipboardCheck; tone: string }[] = [
    { key: 'forwarded_opd', label: 'Perlu Keputusan', icon: ClipboardCheck, tone: 'bg-amber-50 text-amber-600' },
    { key: 'approved', label: 'Disetujui', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
    { key: 'active', label: 'Sedang Magang', icon: Activity, tone: 'bg-violet-50 text-violet-600' },
    { key: 'completed', label: 'Selesai Magang', icon: Award, tone: 'bg-sky-50 text-sky-600' },
    { key: 'rejected', label: 'Ditolak', icon: XCircle, tone: 'bg-rose-50 text-rose-600' },
];

function matchFilter(app: InternshipApplication, filter: FilterKey): boolean {
    if (filter === 'all') {
        return true;
    }

    if (filter === 'forwarded_opd') {
        return app.status === 'forwarded_opd';
    }

    if (filter === 'approved') {
        return app.status === 'approved';
    }

    if (filter === 'active') {
        return ['ongoing', 'completion_submitted'].includes(app.status);
    }

    if (filter === 'completed') {
        return app.status === 'completed';
    }

    return app.status === 'rejected';
}

/* ---- Kartu statistik ------------------------------------------------- */
// Kartu berfungsi sebagai pintasan filter: klik → set filter terkait aktif.
function StatCard({ icon: Icon, label, value, tone, delay, active, onClick }: { icon: typeof ClipboardCheck; label: string; value: number; tone: string; delay: number; active: boolean; onClick: () => void }) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: 'circOut' }}
            className={cn(
                'rounded-2xl border bg-white p-5 text-left transition',
                active ? 'border-[#106feb] ring-2 ring-[#106feb]/20' : 'border-slate-200 hover:border-[#106feb]/40',
            )}
        >
            <div className={cn('mb-3 flex size-10 items-center justify-center rounded-xl', tone)}>
                <Icon className="size-5" />
            </div>
            <p className="text-2xl font-black text-[#12213e]">{value}</p>
            <p className="mt-0.5 text-sm text-slate-500">{label}</p>
        </motion.button>
    );
}

/* ---- Editor kuota OPD ------------------------------------------------ */
// Admin OPD hanya boleh mengubah kuota OPD-nya sendiri (Verifikator: semua).
// Preview memakai simulasi; backend nyata di PATCH /kuota/{opd}.
function QuotaEditor({ opd }: { opd: Opd }) {
    const used = opd.quota_used ?? 0;
    const [total, setTotal] = useState(opd.quota ?? 0);
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(String(opd.quota ?? 0));
    const [processing, setProcessing] = useState(false);

    const parsed = Number(value);
    const valid = Number.isInteger(parsed) && parsed >= used && parsed <= 1000;
    const sisa = Math.max(0, total - used);
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

    function save() {
        if (!valid || processing) {
            return;
        }

        setProcessing(true);
        // TODO(backend): router.patch(`/kuota/${opd.id}`, { quota_total: parsed })
        setTimeout(() => {
            setTotal(parsed);
            setProcessing(false);
            setEditing(false);
        }, 700);
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[#12213e]">
                        <Users className="size-4 text-[#106feb]" /> Kuota Magang OPD
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Terpakai {used} dari {total} kursi — sisa <span className="font-semibold text-emerald-600">{sisa}</span>.
                    </p>
                </div>
                {!editing && (
                    <button
                        type="button"
                        onClick={() => {
                            setValue(String(total));
                            setEditing(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#106feb] transition hover:bg-slate-50"
                    >
                        <Pencil className="size-3.5" /> Ubah Kuota
                    </button>
                )}
            </div>

            {/* Bar keterisian */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#106feb] transition-all" style={{ width: `${pct}%` }} />
            </div>

            {editing && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-[#12213e]">Total kuota baru</label>
                        <input
                            type="number"
                            min={used}
                            max={1000}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                        />
                        {!valid && (
                            <p className="text-xs text-rose-500">Kuota minimal {used} (yang sudah terpakai) dan maksimal 1000.</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={save}
                            disabled={!valid || processing}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#106feb] px-4 text-sm font-bold text-white transition hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                            Simpan
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Dialog keputusan ------------------------------------------------ */
type DecisionMode = 'approve' | 'reject';

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof UserCog }) {
    return (
        <div className="flex justify-between gap-4 py-2.5 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
                {Icon && <Icon className="size-3.5 text-slate-500" />}
                {label}
            </span>
            <span className="text-right font-semibold text-[#0a1628]">{value}</span>
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
            <label className="flex items-center gap-1.5 text-sm font-semibold text-[#0a1628]">
                {Icon && <Icon className="size-3.5 text-slate-500" />}
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-[#0a1628] outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
            />
        </div>
    );
}

function DecisionDialog({
    app,
    onClose,
    onApproved,
    onRejected,
    onCompleted,
}: {
    app: InternshipApplication | null;
    onClose: () => void;
    onApproved: (id: number) => void;
    onRejected: (id: number) => void;
    onCompleted: (id: number) => void;
}) {
    const [mode, setMode] = useState<DecisionMode>('approve');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reason, setReason] = useState('');

    // Penempatan kini diisi Admin OPD saat menyetujui (dipindah dari Verifikator).
    const [division, setDivision] = useState('');
    const [fieldSupervisor, setFieldSupervisor] = useState('');
    const [personInCharge, setPersonInCharge] = useState('');

    const approveValid = division.trim() && fieldSupervisor.trim() && personInCharge.trim();

    // Hanya pengajuan `forwarded_opd` yang bisa diputuskan.
    const decidable = app?.status === 'forwarded_opd';

    // Aktor "Selesai" #3 (Admin OPD): boleh menandai selesai saat peserta sudah
    // magang (ongoing) atau telah mengajukan penyelesaian (completion_submitted).
    const completable = app?.status === 'ongoing' || app?.status === 'completion_submitted';

    function submitApprove() {
        if (!approveValid || processing || !app) {
            return;
        }

        setError(null);
        setProcessing(true);
        router.post(
            `/opd/pengajuan/${app.id}/approve`,
            {
                division: division.trim(),
                field_supervisor: fieldSupervisor.trim(),
                person_in_charge: personInCharge.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => onApproved(app.id),
                onError: (errs) =>
                    setError(
                        errs.division ??
                            errs.field_supervisor ??
                            errs.person_in_charge ??
                            'Gagal menyetujui pengajuan.',
                    ),
                onFinish: () => setProcessing(false),
            },
        );
    }

    function submitReject() {
        if (!reason.trim() || processing || !app) {
            return;
        }

        setError(null);
        setProcessing(true);
        router.post(
            `/opd/pengajuan/${app.id}/reject`,
            { rejection_reason: reason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => onRejected(app.id),
                onError: (errs) => setError(errs.rejection_reason ?? 'Gagal menolak pengajuan.'),
                onFinish: () => setProcessing(false),
            },
        );
    }

    function submitComplete() {
        if (processing || !app) {
            return;
        }

        setError(null);
        setProcessing(true);
        router.post(
            `/opd/pengajuan/${app.id}/complete`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => onCompleted(app.id),
                onError: (errs) => setError(errs.status ?? 'Gagal menandai magang selesai.'),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <Dialog open={!!app} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto bg-white text-[#0a1628] sm:max-w-lg">
                {app && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-[#0a1628]">
                                Detail Pengajuan
                                <span className="font-mono text-sm font-normal text-slate-400">{app.ticket_number}</span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">Penempatan peserta ditetapkan oleh Admin OPD saat menyetujui.</DialogDescription>
                        </DialogHeader>

                        {/* Pas foto pemohon */}
                        {app.photo_url && (
                            <div className="flex justify-center">
                                <img
                                    src={app.photo_url}
                                    alt={`Pas foto ${app.applicant_name ?? 'pemohon'}`}
                                    className="h-40 w-32 rounded-xl border border-slate-200 object-cover shadow-sm"
                                />
                            </div>
                        )}

                        {/* Detail pemohon — seluruh data peserta magang */}
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
                            <DetailRow label="NIS / NIM" value={app.nis || '—'} />
                            <DetailRow label="Nama Lengkap" value={app.applicant_name || '—'} />
                            <DetailRow label="Asal Instansi" value={app.institution_name} />
                            <DetailRow label="Tujuan Magang" value={app.tujuan_magang} />
                            <DetailRow label="Jurusan" value={app.major || '—'} />
                            <DetailRow label="Alamat" value={app.address || '—'} />
                            <DetailRow label="Durasi" value={`${app.duration_months} bulan`} />
                            <DetailRow label="Periode" value={`${formatDate(app.start_date)} – ${formatDate(app.end_date)}`} />
                            <DetailRow label="Pembimbing Kampus" value={app.campus_supervisor} />
                            <DetailRow label="Penanggung Jawab" value={app.guardian_name || '—'} />
                            <DetailRow label="No. WhatsApp" value={app.applicant_whatsapp || '—'} />
                            <DetailRow label="Email" value={app.applicant_email || '—'} />
                            {/* Penempatan hanya tampil read-only setelah diputuskan. */}
                            {!decidable && (
                                <>
                                    <DetailRow label="Divisi / Bidang" value={app.division ?? '—'} icon={Briefcase} />
                                    <DetailRow label="Pembimbing Lapangan" value={app.field_supervisor ?? '—'} icon={UserCog} />
                                    <DetailRow label="Penanggung Jawab (OPD)" value={app.person_in_charge ?? '—'} icon={UserCog} />
                                </>
                            )}
                        </div>

                        {/* Keahlian peserta */}
                        <div className="rounded-xl border border-[#cddcef] bg-[#e8f2fe]/40 px-4 py-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#106feb]">
                                <Sparkles className="size-3.5" /> Keahlian / Keterampilan
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#12213e]">{app.skills || '—'}</p>
                        </div>

                        {/* Catatan dari Admin Verifikator */}
                        {app.verifikator_note && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                                    <StickyNote className="size-3.5" /> Catatan Admin Verifikator
                                </p>
                                <p className="mt-1 text-sm font-medium text-amber-900">{app.verifikator_note}</p>
                            </div>
                        )}

                        {decidable ? (
                            <>
                                {/* Toggle keputusan */}
                                <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setMode('approve')}
                                        className={cn(
                                            'flex-1 rounded-lg py-2 text-sm font-semibold transition',
                                            mode === 'approve' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500',
                                        )}
                                    >
                                        Setujui
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

                                {mode === 'approve' ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-500">
                                            Tetapkan penempatan peserta di{' '}
                                            <span className="font-semibold text-[#12213e]">{app.opd?.name ?? 'OPD Anda'}</span>.
                                            Data ini dikirim ke peserta dalam email persetujuan.
                                        </p>

                                        <Field label="Divisi / Bidang" value={division} onChange={setDivision} placeholder="cth. Bidang Infrastruktur TIK" icon={Briefcase} />
                                        <Field label="Pembimbing Lapangan" value={fieldSupervisor} onChange={setFieldSupervisor} placeholder="Nama pembimbing dari OPD" icon={UserCog} />
                                        <Field label="Penanggung Jawab" value={personInCharge} onChange={setPersonInCharge} placeholder="cth. Kepala Bidang" icon={UserCog} />

                                        {/* Peringatan kedatangan peserta */}
                                        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                            <p className="text-xs leading-relaxed text-amber-800">
                                                Notif ini akan dikirim ke peserta magang. Peserta akan datang berkunjung ke kantor setelah diterima pengajuan ini.
                                            </p>
                                        </div>

                                        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

                                        <button
                                            type="button"
                                            onClick={submitApprove}
                                            disabled={!approveValid || processing}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                            Setujui Pengajuan
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-[#0a1628]">Alasan Penolakan</label>
                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                rows={4}
                                                placeholder="Jelaskan alasan penolakan agar pemohon memahaminya…"
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-[#0a1628] outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15"
                                            />
                                        </div>
                                        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

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
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                <p className="mb-2 text-sm font-semibold text-[#12213e]">Status saat ini</p>
                                <StatusBadge status={app.status} />
                                {app.status === 'rejected' && app.rejection_reason && (
                                    <p className="mt-3 text-sm text-rose-600">Alasan: {app.rejection_reason}</p>
                                )}

                                {/* Aktor "Selesai" #3: Admin OPD menandai magang selesai. */}
                                {completable && (
                                    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                                        <p className="text-xs text-slate-500">
                                            Tandai magang peserta ini telah selesai. Status berubah menjadi “Selesai Magang”.
                                        </p>
                                        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
                                        <button
                                            type="button"
                                            onClick={submitComplete}
                                            disabled={processing}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                            Tandai Selesai Magang
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ---- Halaman --------------------------------------------------------- */
interface OpdDashboardProps {
    user?: MagangUser;
    opd?: Opd;
    applications?: InternshipApplication[];
}

export default function OpdDashboard({
    user = MOCK_USER,
    opd = THIS_OPD,
    applications = MOCK_APPLICATIONS,
}: OpdDashboardProps) {
    const [rows, setRows] = useState(applications);
    const [filter, setFilter] = useState<FilterKey>('forwarded_opd');
    const [query, setQuery] = useState('');
    const [active, setActive] = useState<InternshipApplication | null>(null);

    // Hitung per kartu memakai matchFilter yang sama dengan chip filter,
    // sehingga angka kartu = jumlah baris yang tampil saat filter itu dipilih.
    const counts = useMemo(
        () => Object.fromEntries(STAT_CARDS.map((c) => [c.key, rows.filter((a) => matchFilter(a, c.key)).length])) as Record<Exclude<FilterKey, 'all'>, number>,
        [rows],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return rows.filter(
            (a) =>
                matchFilter(a, filter) &&
                (!q ||
                    a.ticket_number.toLowerCase().includes(q) ||
                    (a.applicant_name ?? '').toLowerCase().includes(q) ||
                    a.institution_name.toLowerCase().includes(q) ||
                    a.tujuan_magang.toLowerCase().includes(q)),
        );
    }, [rows, filter, query]);

    // Optimistic update (rekan backend mengganti dengan reload props Inertia).
    function applyStatus(id: number, status: ApplicationStatus) {
        setRows((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
        setActive(null);
    }

    return (
        <MagangLayout user={user} title="Pengajuan Masuk OPD" active="dashboard" navItems={opdNav}>
            <Head title="Dasbor OPD — E-Magang" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">Selamat datang, {user.name.split(' ')[0]} 👋</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <Building2 className="size-4" /> {opd.name} ({opd.code})
                    </p>
                </div>

                {/* Statistik — selaras 1:1 dengan chip filter (klik untuk memfilter). */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {STAT_CARDS.map((c, i) => (
                        <StatCard
                            key={c.key}
                            icon={c.icon}
                            label={c.label}
                            value={counts[c.key]}
                            tone={c.tone}
                            delay={i * 0.05}
                            active={filter === c.key}
                            onClick={() => setFilter(c.key)}
                        />
                    ))}
                </div>

                {/* Kuota magang OPD — Admin OPD hanya boleh mengubah kuota OPD-nya sendiri. */}
                <QuotaEditor opd={opd} />

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
                                <th className="px-5 py-3 font-semibold">Nama Lengkap</th>
                                <th className="px-5 py-3 font-semibold">Asal Instansi</th>
                                <th className="px-5 py-3 font-semibold">Divisi</th>
                                <th className="px-5 py-3 font-semibold">Diteruskan</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((app) => (
                                <tr key={app.id} className="transition hover:bg-slate-50/60">
                                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#12213e]">{app.ticket_number}</td>
                                    <td className="px-5 py-3.5 font-medium text-[#12213e]">{app.applicant_name ?? '—'}</td>
                                    <td className="px-5 py-3.5">{app.institution_name}</td>
                                    <td className="px-5 py-3.5 text-slate-600">{app.division ?? '—'}</td>
                                    <td className="px-5 py-3.5 text-slate-500">{app.forwarded_at ? formatDate(app.forwarded_at) : '—'}</td>
                                    <td className="px-5 py-3.5"><StatusBadge status={app.status} /></td>
                                    <td className="px-5 py-3.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setActive(app)}
                                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#106feb] transition hover:bg-[#cddcef]/40"
                                        >
                                            {app.status === 'forwarded_opd' ? 'Putuskan' : 'Detail'}
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
                                <p className="text-sm font-bold text-[#12213e]">{app.applicant_name ?? '—'}</p>
                                <p className="flex items-center gap-1.5 text-sm font-medium text-[#12213e]">
                                    <Building2 className="size-3.5 text-slate-400" /> {app.institution_name}
                                </p>
                                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <GraduationCap className="size-3.5" /> {app.tujuan_magang}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><Calendar className="size-3" /> {app.forwarded_at ? formatDate(app.forwarded_at) : '—'}</span>
                                    <span className="flex items-center gap-1"><Clock className="size-3" /> {app.duration_months} bln</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                            <ClipboardCheck className="size-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">Tidak ada pengajuan pada filter ini.</p>
                        </div>
                    )}
                </div>
            </div>

            <DecisionDialog
                key={active?.id}
                app={active}
                onClose={() => setActive(null)}
                onApproved={(id) => applyStatus(id, 'approved')}
                onRejected={(id) => applyStatus(id, 'rejected')}
                onCompleted={(id) => applyStatus(id, 'completed')}
            />
        </MagangLayout>
    );
}
