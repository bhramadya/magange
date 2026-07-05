import { Head, router } from '@inertiajs/react';
import {
    Search,
    History,
    Send,
    XCircle,
    Building2,
    GraduationCap,
    Calendar,
    ArrowRight,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
import type { InternshipApplication, MagangUser, Opd } from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — RIWAYAT (verifikator/riwayat)
 *  Arsip read-only pengajuan yang sudah diproses verifikator (diteruskan /
 *  ditolak) beserta lanjutannya. Tidak ada aksi — hanya telusur & lihat.
 *
 *  FRONTEND ONLY. Rekan backend kirim props dari
 *  Inertia::render('verifikator/riwayat', ['applications' => ...]).
 * ========================================================================= */

/* ---- util ------------------------------------------------------------ */
function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

// Keputusan yang diambil verifikator atas sebuah pengajuan.
function decisionOf(app: InternshipApplication): { kind: 'forwarded' | 'rejected'; label: string; at: string | null } {
    if (app.status === 'rejected' && !app.forwarded_at) {
        return { kind: 'rejected', label: 'Ditolak', at: app.created_at };
    }

    return { kind: 'forwarded', label: 'Diteruskan ke OPD', at: app.forwarded_at };
}

/* ---- mock ------------------------------------------------------------ */
const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Dewi Anggraini',
    email: 'verifikator@madiunkota.go.id',
    whatsapp_number: '6281234567890',
    role: 'admin_verifikator',
};

const OPDS: Opd[] = [
    { id: 1, name: 'Dinas Komunikasi dan Informatika', code: 'DISKOMINFO' },
    { id: 2, name: 'Dinas Pendidikan', code: 'DISDIK' },
    { id: 5, name: 'Sekretariat Daerah', code: 'SETDA' },
];

function makeApp(
    partial: Partial<InternshipApplication> & Pick<InternshipApplication, 'id' | 'ticket_number' | 'status'>,
): InternshipApplication {
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
    makeApp({ id: 9, ticket_number: 'MGG-2026-0042', status: 'forwarded_opd', tujuan_magang: 'Administrasi jaringan', institution_name: 'Universitas Negeri Madiun', opd: OPDS[0], division: 'Bidang Infrastruktur TIK', field_supervisor: 'Rudi Hartono, S.T', person_in_charge: 'Kepala Bidang IT', forwarded_at: '2026-06-21', created_at: '2026-06-19' }),
    makeApp({ id: 7, ticket_number: 'MGG-2026-0038', status: 'approved', tujuan_magang: 'Manajemen arsip digital', institution_name: 'Universitas Merdeka Madiun', opd: OPDS[2], division: 'Bagian Umum', field_supervisor: 'Sutomo, S.Sos', person_in_charge: 'Kabag Umum', forwarded_at: '2026-06-18', opd_decision_at: '2026-06-20', created_at: '2026-06-16' }),
    makeApp({ id: 6, ticket_number: 'MGG-2026-0035', status: 'ongoing', tujuan_magang: 'Pengembangan aplikasi mobile', institution_name: 'Politeknik Negeri Madiun', opd: OPDS[0], division: 'Bidang Pengembangan Aplikasi', field_supervisor: 'Bayu Pratama, S.Kom', person_in_charge: 'Kasi Aplikasi', forwarded_at: '2026-06-12', opd_decision_at: '2026-06-15', created_at: '2026-06-10' }),
    makeApp({ id: 5, ticket_number: 'MGG-2026-0031', status: 'rejected', tujuan_magang: 'Penelitian sosial', institution_name: 'SMA Negeri 3 Madiun', rejection_reason: 'Berkas surat pengantar tidak lengkap dan kuota periode ini telah penuh.', created_at: '2026-06-14' }),
    makeApp({ id: 4, ticket_number: 'MGG-2026-0028', status: 'completed', tujuan_magang: 'Desain grafis', institution_name: 'SMK Negeri 1 Madiun', opd: OPDS[1], division: 'Humas', field_supervisor: 'Endah Sari, S.I.Kom', person_in_charge: 'Kasubag Humas', forwarded_at: '2026-05-20', opd_decision_at: '2026-05-22', created_at: '2026-05-18' }),
    makeApp({ id: 3, ticket_number: 'MGG-2026-0019', status: 'rejected', tujuan_magang: 'Magang akuntansi', institution_name: 'Universitas Negeri Madiun', forwarded_at: '2026-05-10', opd: OPDS[2], division: 'Keuangan', opd_decision_at: '2026-05-13', rejection_reason: 'Ditolak OPD: tidak ada formasi pembimbing.', created_at: '2026-05-08' }),
];

/* ---- filter ---------------------------------------------------------- */
type FilterKey = 'all' | 'forwarded' | 'rejected' | 'done';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'forwarded', label: 'Diteruskan' },
    { key: 'rejected', label: 'Ditolak' },
    { key: 'done', label: 'Selesai Magang' },
];

function matchFilter(app: InternshipApplication, filter: FilterKey): boolean {
    if (filter === 'all') {
        return true;
    }

    if (filter === 'rejected') {
        return app.status === 'rejected';
    }

    if (filter === 'done') {
        return app.status === 'completed';
    }

    // 'forwarded' — semua yang pernah diteruskan & masih dalam alur OPD/magang.
    return ['forwarded_opd', 'approved', 'ongoing', 'completion_submitted'].includes(app.status);
}

/* ---- detail dialog --------------------------------------------------- */
function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 py-2.5 text-sm">
            <span className="font-medium text-slate-600">{label}</span>
            <span className="text-right font-semibold text-[#0a1628]">{value}</span>
        </div>
    );
}

/* ---- aksi tandai selesai (aktor "Selesai" #2: Admin Verifikator) ----- */
function CompleteAction({ endpoint, onDone }: { endpoint: string; onDone: () => void }) {
    const [confirming, setConfirming] = useState(false);
    const [processing, setProcessing] = useState(false);

    function submit() {
        setProcessing(true);
        router.post(endpoint, {}, {
            preserveScroll: true,
            onSuccess: onDone,
            onFinish: () => setProcessing(false),
        });
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
                Yakin menandai magang ini <strong>selesai</strong>? Peserta akan menerima notifikasi
                penyelesaian dan e-sertifikat diterbitkan.
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={submit}
                    disabled={processing}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                    {processing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
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

function DetailDialog({ app, onClose }: { app: InternshipApplication | null; onClose: () => void }) {
    const canComplete = app?.status === 'ongoing' || app?.status === 'completion_submitted';

    return (
        <Dialog open={!!app} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto bg-white text-[#0a1628] sm:max-w-lg">
                {app && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex flex-wrap items-center gap-2 text-[#0a1628]">
                                Detail Riwayat
                                <span className="font-mono text-sm font-normal text-slate-400">{app.ticket_number}</span>
                                <StatusBadge status={app.status} />
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">Arsip keputusan — hanya dapat dilihat.</DialogDescription>
                        </DialogHeader>

                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
                            <DetailRow label="Asal Instansi" value={app.institution_name} />
                            <DetailRow label="Tujuan Magang" value={app.tujuan_magang} />
                            <DetailRow label="Pembimbing Kampus" value={app.campus_supervisor} />
                            <DetailRow label="Diajukan" value={formatDate(app.created_at)} />
                            {app.forwarded_at && <DetailRow label="Diteruskan" value={formatDate(app.forwarded_at)} />}
                            {app.opd && <DetailRow label="OPD Tujuan" value={`${app.opd.name} (${app.opd.code})`} />}
                            {app.division && <DetailRow label="Divisi / Bidang" value={app.division} />}
                            {app.field_supervisor && <DetailRow label="Pembimbing Lapangan" value={app.field_supervisor} />}
                            {app.person_in_charge && <DetailRow label="Penanggung Jawab" value={app.person_in_charge} />}
                        </div>

                        {app.rejection_reason && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-rose-600">Alasan Penolakan</p>
                                <p className="mt-1 text-sm text-rose-700">{app.rejection_reason}</p>
                            </div>
                        )}

                        {canComplete && (
                            <CompleteAction
                                key={app.id}
                                endpoint={`/verifikator/pengajuan/${app.id}/complete`}
                                onDone={onClose}
                            />
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ---- halaman --------------------------------------------------------- */
interface RiwayatProps {
    user?: MagangUser;
    applications?: InternshipApplication[];
}

export default function VerifikatorRiwayat({ user = MOCK_USER, applications = MOCK_APPLICATIONS }: RiwayatProps) {
    const [filter, setFilter] = useState<FilterKey>('all');
    const [query, setQuery] = useState('');
    const [active, setActive] = useState<InternshipApplication | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return applications.filter(
            (a) =>
                matchFilter(a, filter) &&
                (!q ||
                    a.ticket_number.toLowerCase().includes(q) ||
                    a.institution_name.toLowerCase().includes(q) ||
                    a.tujuan_magang.toLowerCase().includes(q)),
        );
    }, [applications, filter, query]);

    return (
        <MagangLayout user={user} title="Riwayat" active="riwayat" navItems={verifikatorNav}>
            <Head title="Riwayat — Verifikator" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">Riwayat Verifikasi</h2>
                    <p className="mt-1 text-sm text-slate-500">Arsip pengajuan yang telah Anda proses. Klik baris untuk melihat detail.</p>
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
                                <th className="px-5 py-3 font-semibold">Keputusan</th>
                                <th className="px-5 py-3 font-semibold">Tanggal</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((app) => {
                                const decision = decisionOf(app);

                                return (
                                    <tr key={app.id} className="cursor-pointer transition hover:bg-slate-50/60" onClick={() => setActive(app)}>
                                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#12213e]">{app.ticket_number}</td>
                                        <td className="px-5 py-3.5">{app.institution_name}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', decision.kind === 'rejected' ? 'text-rose-600' : 'text-[#106feb]')}>
                                                {decision.kind === 'rejected' ? <XCircle className="size-4" /> : <Send className="size-4" />}
                                                {decision.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500">{decision.at ? formatDate(decision.at) : '—'}</td>
                                        <td className="px-5 py-3.5"><StatusBadge status={app.status} /></td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#106feb]">
                                                Detail <ArrowRight className="size-3.5" />
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Mobile */}
                    <div className="divide-y divide-slate-100 md:hidden">
                        {filtered.map((app) => {
                            const decision = decisionOf(app);

                            return (
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
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className={cn('flex items-center gap-1 font-medium', decision.kind === 'rejected' ? 'text-rose-600' : 'text-[#106feb]')}>
                                            {decision.kind === 'rejected' ? <XCircle className="size-3" /> : <Send className="size-3" />}
                                            {decision.label}
                                        </span>
                                        {decision.at && <span className="flex items-center gap-1 text-slate-400"><Calendar className="size-3" /> {formatDate(decision.at)}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                            <History className="size-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">Belum ada riwayat pada filter ini.</p>
                        </div>
                    )}
                </div>
            </div>

            <DetailDialog app={active} onClose={() => setActive(null)} />
        </MagangLayout>
    );
}
