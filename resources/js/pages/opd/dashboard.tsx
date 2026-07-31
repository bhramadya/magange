import { Head, router, usePage } from '@inertiajs/react';
import {
    Search,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    ChevronDown,
    FileSignature,
    Settings2,
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
    Plus,
    Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import {
    destroy as destroyPlacement,
    store as storePlacement,
    update as updatePlacement,
} from '@/actions/App/Http/Controllers/Opd/PlacementOptionController';
import { ApplicationDocuments } from '@/components/application-documents';
import { StatusBadge } from '@/components/status-badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import MagangLayout, { opdNav } from '@/layouts/magang-layout';
import { opdReadiness } from '@/lib/opd-readiness';
import { cn } from '@/lib/utils';
import type {
    ApplicationStatus,
    InternshipApplication,
    MagangUser,
    Opd,
    PlacementOption,
    PlacementOptions,
    Signer,
} from '@/types/magang';

/* =========================================================================
 *  DASBOR ADMIN OPD — E-MAGANG (Pemkot Madiun)
 *  OPD menerima pengajuan yang SUDAH DITERUSKAN verifikator (`forwarded_opd`)
 *  beserta catatan khusus verifikator. OPD memutuskan: MENYETUJUI (mengisi
 *  divisi, pembimbing lapangan, & penanggung jawab → peserta mulai magang)
 *  atau MENOLAK dengan alasan.
 *
 *  Aksi form terhubung ke backend nyata (OpdSubmissionController) via Inertia:
 *    router.post(`/opd/pengajuan/${id}/approve`, { division, field_supervisor, person_in_charge })
 *    router.post(`/opd/pengajuan/${id}/reject`,  { rejection_reason })
 *  Props tabel dikirim dari Inertia::render('opd/dashboard', [...]) — hanya
 *  pengajuan milik OPD admin yang login. MOCK di bawah fallback pratinjau.
 * ========================================================================= */

/* ---- Util tanggal ---------------------------------------------------- */
function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso));
}

/* ---- Data tiruan ----------------------------------------------------- */
const THIS_OPD: Opd = {
    id: 1,
    name: 'Dinas Komunikasi dan Informatika',
    code: 'DISKOMINFO',
    quota: 10,
    quota_used: 4,
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
        applicant_name: 'Peserta Magang',
        applicant_email: 'peserta@example.com',
        applicant_whatsapp: '6281234567890',
        nis: '2101234567',
        address: 'Jl. Pahlawan No. 10, Madiun',
        campus_supervisor_whatsapp: '6281234500001',
        major: 'Teknik Informatika',
        skills: 'React, Laravel, REST API, PostgreSQL',
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
    makeApp({
        id: 21,
        ticket_number: 'MGG-2026-0051',
        status: 'forwarded_opd',
        tujuan_magang: 'Pengembangan aplikasi web',
        institution_name: 'Universitas Negeri Madiun',
        division: 'Bidang Pengembangan Aplikasi',
        field_supervisor: 'Sari Dewi, S.Kom',
        person_in_charge: 'Kasubbag Aplikasi',
        forwarded_at: '2026-06-24',
    }),
    makeApp({
        id: 22,
        ticket_number: 'MGG-2026-0050',
        status: 'forwarded_opd',
        tujuan_magang: 'Desain grafis & multimedia',
        institution_name: 'SMK Negeri 1 Madiun',
        division: 'Bidang Layanan Informasi Publik',
        field_supervisor: 'Andi Wijaya',
        person_in_charge: 'Kabid IKP',
        duration_months: 6,
        forwarded_at: '2026-06-23',
    }),
    makeApp({
        id: 26,
        ticket_number: 'MGG-2026-0052',
        status: 'forwarded_opd',
        tujuan_magang: 'Analisis & visualisasi data layanan publik',
        institution_name: 'Politeknik Negeri Madiun',
        division: 'Bidang Statistik & Persandian',
        field_supervisor: 'Yudha Pratama, S.Si',
        person_in_charge: 'Kabid Statistik',
        forwarded_at: '2026-06-21',
    }),
    makeApp({
        id: 23,
        ticket_number: 'MGG-2026-0042',
        status: 'ongoing',
        tujuan_magang: 'Administrasi jaringan',
        institution_name: 'Universitas Negeri Madiun',
        start_date: '2026-06-01',
        end_date: '2026-08-31',
        opd_decision_at: '2026-05-28',
        forwarded_at: '2026-05-25',
    }),
    makeApp({
        id: 24,
        ticket_number: 'MGG-2026-0039',
        status: 'approved',
        tujuan_magang: 'Manajemen media sosial',
        institution_name: 'Universitas Merdeka Madiun',
        division: 'Bidang IKP',
        opd_decision_at: '2026-06-22',
        forwarded_at: '2026-06-20',
    }),
    makeApp({
        id: 25,
        ticket_number: 'MGG-2026-0033',
        status: 'rejected',
        tujuan_magang: 'Riset keamanan siber',
        institution_name: 'Politeknik Negeri Madiun',
        rejection_reason: 'Bidang tidak tersedia pada periode ini.',
        opd_decision_at: '2026-06-18',
        forwarded_at: '2026-06-15',
    }),
];

/* ---- Filter ---------------------------------------------------------- */
// Urutan kiri→kanan: Perlu Keputusan, Disetujui, Sedang Magang, Selesai, Ditolak, Semua.
type FilterKey =
    | 'forwarded_opd'
    | 'waiting_tte'
    | 'needs_certificate'
    | 'approved'
    | 'active'
    | 'completed'
    | 'rejected'
    | 'all';

// Label status khusus perspektif OPD: pengajuan yang diteruskan verifikator
// tampil sebagai "Perlu Keputusan" (bukan "Diteruskan ke OPD"). Status lain
// memakai label default dari STATUS_META.
const OPD_STATUS_LABEL: Partial<Record<ApplicationStatus, string>> = {
    forwarded_opd: 'Perlu Keputusan',
};

/*
 * SATU sumber kebenaran untuk filter. Sebelumnya ada DUA permukaan kontrol
 * (5 kartu statistik + 8 chip) yang menulis state `filter` yang sama padahal
 * isinya beda — kartu tak punya Menunggu TTE / Perlu Sertifikat / Semua,
 * sehingga mengeklik chip bisa membuat tak ada kartu yang tampak aktif.
 * Kini dipisah menurut PERAN, bukan diduplikasi:
 *   ACTION_FILTERS → tahap yang menuntut tindakan admin (kartu besar, atas)
 *   STATUS_FILTERS → penelusuran riwayat (chip kecil, di toolbar tabel)
 * Urutan baca kiri→kanan lalu atas→bawah tetap mengikuti aturan CLAUDE.md:
 * Perlu Keputusan, Menunggu TTE, Perlu Sertifikat, Disetujui, Sedang Magang,
 * Selesai Magang, Ditolak, Semua.
 */
type ActionFilterKey = 'forwarded_opd' | 'waiting_tte' | 'needs_certificate';

const ACTION_FILTERS: {
    key: ActionFilterKey;
    label: string;
    caption: string;
    icon: typeof ClipboardCheck;
    iconTone: string;
    activeTone: string;
}[] = [
    {
        key: 'forwarded_opd',
        label: 'Perlu Keputusan',
        caption: 'Setujui atau tolak pengajuan',
        icon: ClipboardCheck,
        // "Perlu Keputusan" wajib berlatar kuning (aturan CLAUDE.md).
        iconTone: 'bg-amber-100 text-amber-700',
        activeTone: 'border-amber-400 ring-2 ring-amber-300/50',
    },
    {
        key: 'waiting_tte',
        label: 'Menunggu TTE',
        caption: 'Unggah surat bertanda tangan',
        icon: FileSignature,
        iconTone: 'bg-[#cddcef] text-[#0b4fb0]',
        activeTone: 'border-[#106feb] ring-2 ring-[#106feb]/30',
    },
    {
        key: 'needs_certificate',
        label: 'Perlu Sertifikat',
        caption: 'Unggah sertifikat bertanda tangan',
        icon: Award,
        iconTone: 'bg-violet-100 text-violet-700',
        activeTone: 'border-violet-400 ring-2 ring-violet-300/50',
    },
];

const STATUS_FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'approved', label: 'Disetujui' },
    { key: 'active', label: 'Sedang Magang' },
    { key: 'completed', label: 'Selesai Magang' },
    { key: 'rejected', label: 'Ditolak' },
    { key: 'all', label: 'Semua' },
];

// Dipakai untuk menghitung badge angka di SEMUA kontrol filter sekaligus,
// termasuk "Semua" (yang dulu tak punya angka).
const ALL_FILTER_KEYS: FilterKey[] = [
    ...ACTION_FILTERS.map((f) => f.key),
    ...STATUS_FILTERS.map((f) => f.key),
];

const FILTER_LABEL: Record<FilterKey, string> = {
    ...Object.fromEntries(ACTION_FILTERS.map((f) => [f.key, f.label])),
    ...Object.fromEntries(STATUS_FILTERS.map((f) => [f.key, f.label])),
} as Record<FilterKey, string>;

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

    if (filter === 'waiting_tte' || filter === 'needs_certificate') {
        return app.status === filter;
    }

    if (filter === 'active') {
        return ['ongoing', 'completion_submitted'].includes(app.status);
    }

    if (filter === 'completed') {
        return app.status === 'completed';
    }

    return app.status === 'rejected';
}

/* ---- Kontrol filter -------------------------------------------------- */
/*
 * Kartu "Butuh Tindakan": tahap yang benar-benar menuntut aksi admin.
 * Sekaligus pintasan filter (klik → tabel di bawah ikut tersaring), jadi
 * angka pada kartu SELALU sama dengan jumlah baris yang tampil.
 * Hover sengaja hanya mengubah warna/border — tanpa translate/scale — supaya
 * tidak menggeser layout (baris kartu dipakai untuk memindai angka).
 */
function ActionCard({
    filter,
    value,
    active,
    onClick,
    delay,
}: {
    filter: (typeof ACTION_FILTERS)[number];
    value: number;
    active: boolean;
    onClick: () => void;
    delay: number;
}) {
    const Icon = filter.icon;

    return (
        <motion.button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: 'circOut' }}
            className={cn(
                'flex cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors duration-200',
                'focus-visible:ring-4 focus-visible:ring-[#106feb]/25 focus-visible:outline-none',
                active
                    ? filter.activeTone
                    : 'border-slate-200 hover:border-[#106feb]/40 hover:bg-slate-50/70',
            )}
        >
            <span
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl',
                    filter.iconTone,
                )}
            >
                <Icon className="size-5" />
            </span>
            <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#12213e] tabular-nums">
                        {value}
                    </span>
                    <span className="truncate text-sm font-bold text-[#12213e]">
                        {filter.label}
                    </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {filter.caption}
                </span>
            </span>
        </motion.button>
    );
}

// Chip status pasif (penelusuran riwayat). Angka ikut ditampilkan supaya chip
// tak lagi butuh kartu statistik terpisah sebagai sumber angka.
function StatusChip({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors duration-200',
                'focus-visible:ring-4 focus-visible:ring-[#106feb]/25 focus-visible:outline-none',
                active
                    ? 'bg-[#106feb] text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
        >
            {label}
            <span
                className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums',
                    active
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 text-slate-500',
                )}
            >
                {count}
            </span>
        </button>
    );
}

/* ---- Editor kuota OPD ------------------------------------------------ */
// Admin OPD hanya boleh mengubah kuota OPD-nya sendiri (Verifikator: semua).
// Tersambung ke backend nyata: PATCH /kuota/{opd}.
function QuotaEditor({ opd }: { opd: Opd }) {
    const used = opd.quota_used ?? 0;
    const [total, setTotal] = useState(opd.quota ?? 0);
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(String(opd.quota ?? 0));
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parsed = Number(value);
    const valid = Number.isInteger(parsed) && parsed >= used && parsed <= 1000;
    const sisa = Math.max(0, total - used);
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

    function save() {
        if (!valid || processing) {
            return;
        }

        setError(null);
        setProcessing(true);
        // Admin OPD hanya boleh kuota OPD-nya sendiri (403 di UpdateQuotaRequest).
        router.patch(
            `/kuota/${opd.id}`,
            { quota_total: parsed },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setTotal(parsed);
                    setEditing(false);
                },
                onError: (errs) =>
                    setError(errs.quota_total ?? 'Gagal memperbarui kuota.'),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[#12213e]">
                        <Users className="size-4 text-[#106feb]" /> Kuota Magang
                        OPD
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Sisa{' '}
                        <span className="font-semibold text-emerald-600">
                            {sisa} kursi
                        </span>{' '}
                        — terpakai {used}.
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
                <div
                    className="h-full rounded-full bg-[#106feb] transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>

            {editing && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-[#12213e]">
                            Total kuota baru
                        </label>
                        <input
                            type="number"
                            min={used}
                            max={1000}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                        />
                        {!valid && (
                            <p className="text-xs text-rose-500">
                                Kuota minimal {used} (yang sudah terpakai) dan
                                maksimal 1000.
                            </p>
                        )}
                        {error && (
                            <p className="text-xs font-medium text-rose-600">
                                {error}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={save}
                            disabled={!valid || processing}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#106feb] px-4 text-sm font-bold text-white transition hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="size-4" />
                            )}
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

/* ---- Editor tag OPD -------------------------------------------------- */
// Tag kompetensi (kolom description, dipisah koma) — tampil di landing page.
// Admin OPD hanya boleh mengubah tag OPD-nya sendiri (403 di UpdateOpdTagRequest).
// Tersambung ke backend nyata: PATCH /opd-tag/{opd}.
function TagEditor({ opd }: { opd: Opd }) {
    const [saved, setSaved] = useState(opd.description ?? '');
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(opd.description ?? '');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const tags = saved
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '');

    function save() {
        if (processing) {
            return;
        }

        setError(null);
        setProcessing(true);
        router.patch(
            `/opd-tag/${opd.id}`,
            { description: value },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSaved(value);
                    setEditing(false);
                },
                onError: (errs) =>
                    setError(errs.description ?? 'Gagal memperbarui tag.'),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[#12213e]">
                        <Sparkles className="size-4 text-[#106feb]" /> Tag
                        Kompetensi
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Tampil di kartu OPD halaman utama — pisahkan dengan
                        koma.
                    </p>
                </div>
                {!editing && (
                    <button
                        type="button"
                        onClick={() => {
                            setValue(saved);
                            setEditing(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#106feb] transition hover:bg-slate-50"
                    >
                        <Pencil className="size-3.5" /> Ubah Tag
                    </button>
                )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.length > 0 ? (
                    tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-[#106feb]/10 px-3 py-1 text-xs font-semibold text-[#0b4fb0]"
                        >
                            {tag}
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-slate-400">
                        Belum ada tag — halaman utama memakai tag bawaan.
                    </span>
                )}
            </div>

            {editing && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-[#12213e]">
                            Tag (pisahkan dengan koma)
                        </label>
                        <input
                            type="text"
                            value={value}
                            maxLength={1000}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="mis. Teknologi Informasi, Administrasi"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                        />
                        {error && (
                            <p className="text-xs font-medium text-rose-600">
                                {error}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={save}
                            disabled={processing}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#106feb] px-4 text-sm font-bold text-white transition hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="size-4" />
                            )}
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

/* ---- Master penempatan (bidang / pembimbing / penanggung jawab) --------
 * Menggantikan Data Surat & Penandatangan yang PINDAH ke menu Kelola Surat.
 * Ketiga daftar ini hanya berisi NAMA: pembimbing lapangan & penanggung jawab
 * tidak menandatangani dokumen apa pun (itu urusan penandatangan di Kelola
 * Surat). Pola CRUD-nya menyalin Kelola FAQ: daftar + edit inline + hapus
 * dua langkah.
 */
type PlacementType = 'division' | 'field_supervisor' | 'person_in_charge';

function PlacementOptionRow({ option }: { option: PlacementOption }) {
    const [editing, setEditing] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [value, setValue] = useState(option.name);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (editing) {
        return (
            <div className="rounded-xl border border-[#cddcef] bg-[#e8f2fe]/40 p-2.5">
                <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                />
                {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
                <div className="mt-2 flex items-center gap-1.5">
                    <button
                        type="button"
                        disabled={processing || value.trim() === ''}
                        onClick={() => {
                            setProcessing(true);
                            setError(null);
                            router.put(
                                updatePlacement.url(option.id),
                                { name: value.trim() },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => setEditing(false),
                                    onError: (errs) =>
                                        setError(
                                            errs.name ?? 'Gagal menyimpan.',
                                        ),
                                    onFinish: () => setProcessing(false),
                                },
                            );
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#106feb] px-2.5 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                    >
                        {processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="size-4" />
                        )}
                        Simpan
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setValue(option.name);
                            setError(null);
                            setEditing(false);
                        }}
                        className="cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                    >
                        Batal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <span className="min-w-0 truncate text-sm text-[#12213e]">
                {option.name}
            </span>
            <span className="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    aria-label={`Edit ${option.name}`}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                >
                    <Pencil className="size-4" />
                </button>
                {!confirming ? (
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        aria-label={`Hapus ${option.name}`}
                        className="cursor-pointer rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50"
                    >
                        <Trash2 className="size-4" />
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => {
                                setProcessing(true);
                                router.delete(destroyPlacement.url(option.id), {
                                    preserveScroll: true,
                                    onFinish: () => setProcessing(false),
                                });
                            }}
                            className="cursor-pointer rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                        >
                            Ya, hapus
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
                        >
                            Batal
                        </button>
                    </>
                )}
            </span>
        </div>
    );
}

function PlacementOptionEditor({
    type,
    title,
    hint,
    icon: Icon,
    options,
}: {
    type: PlacementType;
    title: string;
    hint: string;
    icon: typeof Briefcase;
    options: PlacementOption[];
}) {
    const [value, setValue] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function tambah() {
        if (value.trim() === '' || processing) {
            return;
        }

        setProcessing(true);
        setError(null);
        router.post(
            storePlacement.url(),
            { type, name: value.trim() },
            {
                preserveScroll: true,
                onSuccess: () => setValue(''),
                onError: (errs) => setError(errs.name ?? 'Gagal menambahkan.'),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-1.5 text-sm font-bold text-[#12213e]">
                <Icon className="size-4 text-[#106feb]" /> {title}
            </p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>

            <div className="mt-3 space-y-2">
                {options.map((option) => (
                    <PlacementOptionRow key={option.id} option={option} />
                ))}
                {options.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-center text-xs text-slate-500">
                        Belum ada data — tambahkan di bawah.
                    </p>
                )}
            </div>

            <div className="mt-3 flex items-start gap-2">
                <span className="flex-1">
                    <label htmlFor={`tambah-${type}`} className="sr-only">
                        Tambah {title}
                    </label>
                    <input
                        id={`tambah-${type}`}
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                tambah();
                            }
                        }}
                        maxLength={255}
                        placeholder="Tambah nama baru…"
                        className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                    />
                    {error && (
                        <span className="mt-1 block text-xs text-rose-600">
                            {error}
                        </span>
                    )}
                </span>
                <button
                    type="button"
                    onClick={tambah}
                    disabled={value.trim() === '' || processing}
                    className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#106feb] px-3 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                >
                    {processing ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Plus className="size-4" />
                    )}
                    Tambah
                </button>
            </div>
        </div>
    );
}

/* ---- Dialog keputusan ------------------------------------------------ */
/* ---- Kelola OPD (kartu dasbor, dapat dilipat) ------------------------- */
/*
 * Tetap kartu di dasbor (aturan CLAUDE.md: BUKAN menu sidebar tersendiri),
 * tetapi dilipat & dipindah ke BAWAH tabel. Alasannya: keempat editor di
 * dalamnya adalah setelan yang jarang diubah, sementara sebelumnya mereka
 * menempati ruang paling berharga di antara statistik dan daftar kerja —
 * itu sumber utama kesan "penuh". Ringkasan pada kepala kartu menjaga
 * informasinya tetap terbaca tanpa perlu dibuka.
 */
function KelolaOpdPanel({
    opd,
    placementOptions,
}: {
    opd: Opd;
    placementOptions: PlacementOptions;
}) {
    const [open, setOpen] = useState(false);

    const tagCount = (opd.description ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean).length;
    // Data Surat & Penandatangan sekarang di menu Kelola Surat, jadi ringkasan
    // ini menyebut master penempatan sebagai gantinya.
    const summary = [
        `Kuota ${opd.quota_used ?? 0}/${opd.quota ?? 0}`,
        `${tagCount} tag kompetensi`,
        `${placementOptions.division.length} bidang`,
        `${placementOptions.field_supervisor.length} pembimbing`,
        `${placementOptions.person_in_charge.length} penanggung jawab`,
    ].join(' · ');

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <section className="overflow-hidden rounded-3xl border border-[#cddcef] bg-[#e8f2fe]/40">
                <CollapsibleTrigger
                    className={cn(
                        'flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors duration-200',
                        'hover:bg-[#cddcef]/25 focus-visible:ring-4 focus-visible:ring-[#106feb]/25 focus-visible:outline-none',
                    )}
                >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#106feb] ring-1 ring-[#cddcef]">
                        <Settings2 className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-base font-black text-[#12213e]">
                            Kelola OPD
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {summary}
                        </span>
                    </span>
                    <span className="hidden text-sm font-semibold text-[#106feb] sm:inline">
                        {open ? 'Tutup' : 'Buka'}
                    </span>
                    <ChevronDown
                        aria-hidden
                        className={cn(
                            'size-4 shrink-0 text-[#106feb] transition-transform duration-200',
                            open && 'rotate-180',
                        )}
                    />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="grid gap-4 border-t border-[#cddcef] p-4 lg:grid-cols-2">
                        <QuotaEditor opd={opd} />
                        <TagEditor opd={opd} />
                        <PlacementOptionEditor
                            type="division"
                            title="Bidang / Penempatan"
                            hint="Pilihan bidang penempatan peserta saat menyetujui pengajuan."
                            icon={Briefcase}
                            options={placementOptions.division}
                        />
                        <PlacementOptionEditor
                            type="field_supervisor"
                            title="Pembimbing Lapangan"
                            hint="Nama saja — pembimbing lapangan tidak menandatangani dokumen."
                            icon={UserCog}
                            options={placementOptions.field_supervisor}
                        />
                        <PlacementOptionEditor
                            type="person_in_charge"
                            title="Penanggung Jawab"
                            hint="Nama saja — penanggung jawab tidak menandatangani dokumen."
                            icon={Users}
                            options={placementOptions.person_in_charge}
                        />
                    </div>
                </CollapsibleContent>
            </section>
        </Collapsible>
    );
}

type DecisionMode = 'approve' | 'reject';

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

/**
 * `options` (opsional) = master penempatan dari Kelola OPD. Dirender sebagai
 * `<datalist>`: admin bisa MEMILIH dari daftar atau tetap mengetik nama baru
 * — kasus mendadak tidak terhalang harus mendaftarkan master lebih dulu.
 */
function Field({
    label,
    value,
    onChange,
    placeholder,
    icon: Icon,
    options,
    listId,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    icon?: typeof UserCog;
    options?: PlacementOption[];
    listId?: string;
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
                list={options && options.length > 0 ? listId : undefined}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-[#0a1628] transition outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
            />
            {options && options.length > 0 && (
                <datalist id={listId}>
                    {options.map((option) => (
                        <option key={option.id} value={option.name} />
                    ))}
                </datalist>
            )}
        </div>
    );
}

function DecisionDialog({
    app,
    onClose,
    onApproved,
    onRejected,
    onCompleted,
    signers,
    placementOptions,
    opdReady,
}: {
    app: InternshipApplication | null;
    onClose: () => void;
    onApproved: (id: number) => void;
    onRejected: (id: number) => void;
    onCompleted: (id: number) => void;
    signers: Signer[];
    placementOptions: PlacementOptions;
    opdReady: { ready: boolean; missing: string[] };
}) {
    const [mode, setMode] = useState<DecisionMode>('approve');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reason, setReason] = useState('');

    // Penempatan kini diisi Admin OPD saat menyetujui (dipindah dari Verifikator).
    const [division, setDivision] = useState('');
    const [fieldSupervisor, setFieldSupervisor] = useState('');
    const [personInCharge, setPersonInCharge] = useState('');
    const [signerId, setSignerId] = useState(
        String(signers.find((signer) => signer.is_primary)?.id ?? ''),
    );

    // Penandatangan WAJIB: tanpa itu backend jatuh ke jalur lama (status
    // langsung `approved` + email otomatis) sehingga pengajuan tak pernah
    // masuk Menunggu TTE — persis bug yang diperbaiki batch ini.
    const approveValid =
        opdReady.ready &&
        division.trim() &&
        fieldSupervisor.trim() &&
        personInCharge.trim() &&
        signerId;

    // Hanya pengajuan `forwarded_opd` yang bisa diputuskan.
    const decidable = app?.status === 'forwarded_opd';

    // Aktor "Selesai" #3 (Admin OPD): boleh menandai selesai saat peserta sudah
    // magang (ongoing) atau telah mengajukan penyelesaian (completion_submitted).
    const completable =
        app?.status === 'ongoing' || app?.status === 'completion_submitted';

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
                signer_id: signerId || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => onApproved(app.id),
                onError: (errs) =>
                    setError(
                        errs.division ??
                            errs.field_supervisor ??
                            errs.person_in_charge ??
                            errs.signer_id ??
                            errs.letterhead ??
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
                onError: (errs) =>
                    setError(
                        errs.rejection_reason ?? 'Gagal menolak pengajuan.',
                    ),
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
                onError: (errs) =>
                    setError(errs.status ?? 'Gagal menandai magang selesai.'),
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
                                <span className="font-mono text-sm font-normal text-slate-400">
                                    {app.ticket_number}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Penempatan peserta ditetapkan oleh Admin OPD
                                saat menyetujui.
                            </DialogDescription>
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
                            <DetailRow
                                label="NIS / NIM"
                                value={app.nis || '—'}
                            />
                            <DetailRow
                                label="Nama Lengkap"
                                value={app.applicant_name || '—'}
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
                                label="Alamat"
                                value={app.address || '—'}
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
                                label="Pembimbing Kampus"
                                value={app.campus_supervisor}
                            />
                            <DetailRow
                                label="No. WA Pembimbing"
                                value={app.campus_supervisor_whatsapp || '—'}
                            />
                            <DetailRow
                                label="No. WhatsApp"
                                value={app.applicant_whatsapp || '—'}
                            />
                            <DetailRow
                                label="Email"
                                value={app.applicant_email || '—'}
                            />
                            {/* Penempatan hanya tampil read-only setelah diputuskan. */}
                            {!decidable && (
                                <>
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
                                        label="Penanggung Jawab (OPD)"
                                        value={app.person_in_charge ?? '—'}
                                        icon={UserCog}
                                    />
                                    {/* No. SK penerimaan — dibuat sekali saat ACC,
                                        cetak ulang tidak mengubah nomor/tanggal. */}
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
                                </>
                            )}
                        </div>

                        {/* Keahlian peserta */}
                        <div className="rounded-xl border border-[#cddcef] bg-[#e8f2fe]/40 px-4 py-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#106feb] uppercase">
                                <Sparkles className="size-3.5" /> Keahlian /
                                Keterampilan
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#12213e]">
                                {app.skills || '—'}
                            </p>
                        </div>

                        {/* Berkas pendukung opsional (surat pengantar / CV / portofolio) */}
                        <ApplicationDocuments app={app} />

                        {/* Catatan dari Admin Verifikator */}
                        {app.verifikator_note && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                                    <StickyNote className="size-3.5" /> Catatan
                                    Admin Verifikator
                                </p>
                                <p className="mt-1 text-sm font-medium text-amber-900">
                                    {app.verifikator_note}
                                </p>
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

                                {mode === 'approve' ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-500">
                                            Tetapkan penempatan peserta di{' '}
                                            <span className="font-semibold text-[#12213e]">
                                                {app.opd?.name ?? 'OPD Anda'}
                                            </span>
                                            . Setelah disetujui, unduh draft
                                            surat untuk proses TTE.
                                        </p>

                                        {!opdReady.ready && (
                                            <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                                                <p className="text-xs leading-relaxed text-rose-800">
                                                    Belum bisa menyetujui:{' '}
                                                    {opdReady.missing.join(
                                                        ' dan ',
                                                    )}{' '}
                                                    belum siap. Lengkapi lebih
                                                    dahulu di menu{' '}
                                                    <a
                                                        href="/opd/surat"
                                                        className="font-bold underline"
                                                    >
                                                        Kelola Surat
                                                    </a>
                                                    .
                                                </p>
                                            </div>
                                        )}

                                        <Field
                                            label="Divisi / Bidang"
                                            value={division}
                                            onChange={setDivision}
                                            placeholder="cth. Bidang Infrastruktur TIK"
                                            icon={Briefcase}
                                            options={placementOptions.division}
                                            listId="dlg-divisi"
                                        />
                                        <Field
                                            label="Pembimbing Lapangan"
                                            value={fieldSupervisor}
                                            onChange={setFieldSupervisor}
                                            placeholder="Nama pembimbing dari OPD"
                                            icon={UserCog}
                                            options={
                                                placementOptions.field_supervisor
                                            }
                                            listId="dlg-pembimbing"
                                        />
                                        <Field
                                            label="Penanggung Jawab"
                                            value={personInCharge}
                                            onChange={setPersonInCharge}
                                            placeholder="cth. Kepala Bidang"
                                            icon={UserCog}
                                            options={
                                                placementOptions.person_in_charge
                                            }
                                            listId="dlg-penanggung-jawab"
                                        />
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-[#0a1628]">
                                                Penandatangan{' '}
                                                <span className="text-rose-600">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={signerId}
                                                onChange={(event) =>
                                                    setSignerId(
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm"
                                            >
                                                <option value="">
                                                    {signers.length > 0
                                                        ? 'Pilih penandatangan'
                                                        : 'Belum ada penandatangan'}
                                                </option>
                                                {signers.map((signer) => (
                                                    <option
                                                        key={signer.id}
                                                        value={signer.id}
                                                    >
                                                        {signer.title} —{' '}
                                                        {signer.name}, NIP{' '}
                                                        {signer.nip}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Peringatan kedatangan peserta */}
                                        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                            <p className="text-xs leading-relaxed text-amber-800">
                                                Email belum dikirim pada tahap
                                                ini. Peserta menerima surat
                                                setelah PDF bertanda tangan
                                                diunggah melalui Menunggu TTE.
                                            </p>
                                        </div>

                                        {error && (
                                            <p className="text-sm font-medium text-rose-600">
                                                {error}
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            onClick={submitApprove}
                                            disabled={
                                                !approveValid || processing
                                            }
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="size-4" />
                                            )}
                                            Setujui Pengajuan
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-[#0a1628]">
                                                Alasan Penolakan
                                            </label>
                                            <textarea
                                                value={reason}
                                                onChange={(e) =>
                                                    setReason(e.target.value)
                                                }
                                                rows={4}
                                                placeholder="Jelaskan alasan penolakan agar pemohon memahaminya…"
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-[#0a1628] transition outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15"
                                            />
                                        </div>
                                        {error && (
                                            <p className="text-sm font-medium text-rose-600">
                                                {error}
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            onClick={submitReject}
                                            disabled={
                                                !reason.trim() || processing
                                            }
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <XCircle className="size-4" />
                                            )}
                                            Tolak Pengajuan
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                <p className="mb-2 text-sm font-semibold text-[#12213e]">
                                    Status saat ini
                                </p>
                                <StatusBadge
                                    status={app.status}
                                    label={OPD_STATUS_LABEL[app.status]}
                                />
                                {app.status === 'rejected' &&
                                    app.rejection_reason && (
                                        <p className="mt-3 text-sm text-rose-600">
                                            Alasan: {app.rejection_reason}
                                        </p>
                                    )}

                                {/* Aktor "Selesai" #3: Admin OPD menandai magang selesai. */}
                                {completable && (
                                    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                                        <p className="text-xs text-slate-500">
                                            Tandai magang peserta ini telah
                                            selesai. Status berubah menjadi
                                            “Selesai Magang”.
                                        </p>
                                        {error && (
                                            <p className="text-sm font-medium text-rose-600">
                                                {error}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={submitComplete}
                                            disabled={processing}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="size-4" />
                                            )}
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
const EMPTY_PLACEMENT_OPTIONS: PlacementOptions = {
    division: [],
    field_supervisor: [],
    person_in_charge: [],
};

interface OpdDashboardProps {
    user?: MagangUser;
    opd?: Opd;
    applications?: InternshipApplication[];
    signers?: Signer[];
    placementOptions?: PlacementOptions;
}

export default function OpdDashboard({
    user = MOCK_USER,
    opd = THIS_OPD,
    applications = MOCK_APPLICATIONS,
    signers = [],
    placementOptions = EMPTY_PLACEMENT_OPTIONS,
}: OpdDashboardProps) {
    const { acceptanceDraftUrl, acceptanceDraftName } = usePage<{
        acceptanceDraftUrl?: string;
        acceptanceDraftName?: string;
    }>().props;
    const [showDraftPopup, setShowDraftPopup] = useState(
        Boolean(acceptanceDraftUrl),
    );
    const [rows, setRows] = useState(applications);
    const [filter, setFilter] = useState<FilterKey>('forwarded_opd');
    const [query, setQuery] = useState('');
    const [active, setActive] = useState<InternshipApplication | null>(null);

    // Kesiapan OPD untuk menyetujui (penandatangan + Data Surat) — cermin
    // gate backend di ApproveApplicationRequest.
    const opdReady = useMemo(() => opdReadiness(opd, signers), [opd, signers]);

    // Semua angka (kartu maupun chip) dihitung dengan matchFilter yang sama
    // dipakai tabel, jadi angka pada kontrol = jumlah baris yang tampil saat
    // filter itu dipilih — termasuk "Semua", yang dulu tak punya angka.
    const counts = useMemo(
        () =>
            Object.fromEntries(
                ALL_FILTER_KEYS.map((key) => [
                    key,
                    rows.filter((a) => matchFilter(a, key)).length,
                ]),
            ) as Record<FilterKey, number>,
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
        setRows((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status } : a)),
        );
        setActive(null);
    }

    return (
        <MagangLayout
            user={user}
            title="Pengajuan Masuk OPD"
            active="dashboard"
            navItems={opdNav}
        >
            <Head title="Dasbor OPD — E-Magang" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">
                        Selamat datang, {user.name.split(' ')[0]}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <Building2 className="size-4" /> {opd.name} ({opd.code})
                    </p>
                </div>

                {/* Butuh Tindakan — hanya tahap yang menuntut aksi admin. */}
                <section aria-labelledby="butuh-tindakan">
                    <h3
                        id="butuh-tindakan"
                        className="mb-2.5 text-xs font-bold tracking-wide text-slate-500 uppercase"
                    >
                        Butuh tindakan
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {ACTION_FILTERS.map((f, i) => (
                            <ActionCard
                                key={f.key}
                                filter={f}
                                value={counts[f.key]}
                                delay={i * 0.05}
                                active={filter === f.key}
                                onClick={() => setFilter(f.key)}
                            />
                        ))}
                    </div>
                </section>

                {/* Daftar pengajuan + toolbar status/pencarian. */}
                <section
                    aria-labelledby="daftar-pengajuan"
                    className="space-y-3"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h3
                                id="daftar-pengajuan"
                                className="text-lg font-black text-[#12213e]"
                            >
                                Daftar Pengajuan
                            </h3>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Menampilkan {filtered.length} dari {rows.length}{' '}
                                pengajuan · filter{' '}
                                <span className="font-semibold text-[#12213e]">
                                    {FILTER_LABEL[filter]}
                                </span>
                            </p>
                        </div>

                        <div className="relative sm:w-64">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <label className="sr-only" htmlFor="cari-pengajuan">
                                Cari pengajuan
                            </label>
                            <input
                                id="cari-pengajuan"
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari tiket / instansi…"
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {STATUS_FILTERS.map((f) => (
                            <StatusChip
                                key={f.key}
                                label={f.label}
                                count={counts[f.key]}
                                active={filter === f.key}
                                onClick={() => setFilter(f.key)}
                            />
                        ))}
                    </div>

                    {/* Tabel */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Desktop */}
                        <table className="hidden w-full text-left text-sm md:table">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">
                                        No. Tiket
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Nama Lengkap
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Asal Instansi
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Divisi
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Diteruskan
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((app) => (
                                    <tr
                                        key={app.id}
                                        className="transition hover:bg-slate-50/60"
                                    >
                                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#12213e]">
                                            {app.ticket_number}
                                        </td>
                                        <td className="px-5 py-3.5 font-medium text-[#12213e]">
                                            {app.applicant_name ?? '—'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {app.institution_name}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">
                                            {app.division ?? '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500">
                                            {app.forwarded_at
                                                ? formatDate(app.forwarded_at)
                                                : '—'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge
                                                status={app.status}
                                                label={
                                                    OPD_STATUS_LABEL[app.status]
                                                }
                                            />
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setActive(app)}
                                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#106feb] transition hover:bg-[#cddcef]/40"
                                            >
                                                {app.status === 'forwarded_opd'
                                                    ? 'Putuskan'
                                                    : 'Detail'}
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
                                        <span className="font-mono text-xs font-semibold text-[#12213e]">
                                            {app.ticket_number}
                                        </span>
                                        <StatusBadge
                                            status={app.status}
                                            label={OPD_STATUS_LABEL[app.status]}
                                        />
                                    </div>
                                    <p className="text-sm font-bold text-[#12213e]">
                                        {app.applicant_name ?? '—'}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-sm font-medium text-[#12213e]">
                                        <Building2 className="size-3.5 text-slate-400" />{' '}
                                        {app.institution_name}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <GraduationCap className="size-3.5" />{' '}
                                        {app.tujuan_magang}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="size-3" />{' '}
                                            {app.forwarded_at
                                                ? formatDate(app.forwarded_at)
                                                : '—'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="size-3" />{' '}
                                            {app.duration_months} bln
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                                <ClipboardCheck className="size-10 text-slate-300" />
                                <p className="text-sm font-medium text-slate-500">
                                    {query.trim()
                                        ? `Tidak ada hasil untuk “${query.trim()}” pada filter ${FILTER_LABEL[filter]}.`
                                        : `Tidak ada pengajuan berstatus ${FILTER_LABEL[filter]}.`}
                                </p>
                                {query.trim() && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery('')}
                                        className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-[#106feb] transition-colors hover:bg-[#cddcef]/40"
                                    >
                                        Hapus pencarian
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Setelan OPD ditaruh paling bawah & terlipat: jarang diubah,
                    jadi tak boleh mendorong daftar kerja ke bawah layar. */}
                <KelolaOpdPanel opd={opd} placementOptions={placementOptions} />
            </div>

            <DecisionDialog
                key={active?.id}
                app={active}
                onClose={() => setActive(null)}
                onApproved={(id) => applyStatus(id, 'approved')}
                onRejected={(id) => applyStatus(id, 'rejected')}
                onCompleted={(id) => applyStatus(id, 'completed')}
                signers={signers}
                placementOptions={placementOptions}
                opdReady={opdReady}
            />
            {showDraftPopup && acceptanceDraftUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-black text-[#12213e]">
                            Download Surat Penerimaan
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {acceptanceDraftName}
                        </p>
                        <div className="mt-5 flex gap-2">
                            <a
                                href={acceptanceDraftUrl}
                                className="flex-1 rounded-xl bg-[#106feb] px-4 py-2.5 text-center text-sm font-bold text-white"
                            >
                                Download
                            </a>
                            <button
                                type="button"
                                onClick={() => setShowDraftPopup(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                            >
                                Nanti
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MagangLayout>
    );
}
