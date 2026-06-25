import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock,
    Copy,
    FileText,
    GraduationCap,
    Loader2,
    PartyPopper,
    Send,
    Target,
    Upload,
    User,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

/* =========================================================================
 *  FORM PENGAJUAN PUBLIK — E-MAGANG (Pemkot Madiun)
 *  Halaman TANPA login: calon peserta mengajukan permohonan magang. Setelah
 *  terkirim, sistem menghasilkan NOMOR TIKET untuk pelacakan status.
 *
 *  Alur wizard 4 langkah + layar sukses:
 *    1) Data Diri        2) Asal Pendidikan
 *    3) Rencana Magang   4) Dokumen → Tinjau & Kirim → Tiket
 *
 *  FRONTEND ONLY. `handleSubmit` memakai simulasi lokal supaya halaman bisa
 *  dipratinjau tanpa backend. Rekan backend cukup mengganti handler dengan
 *  unggahan multipart Inertia (ada File, jadi forceFormData):
 *
 *    router.post('/pengajuan', formData, { forceFormData: true })
 *      // payload: PengajuanPayload (lihat interface di bawah)
 *      // sukses → controller redirect ke /pengajuan/{ticket}/terkirim
 *
 *  Field penempatan (opd, division, field_supervisor, person_in_charge)
 *  TIDAK ada di form ini — diisi Admin Verifikator saat meneruskan.
 * ========================================================================= */

type StepKey = 'diri' | 'pendidikan' | 'rencana' | 'dokumen';

type EducationLevel = 'sma_smk' | 'd3' | 'd4' | 's1' | 's2';

// Bentuk data yang dikirim ke backend (selaras InternshipApplication + data pemohon).
export interface PengajuanPayload {
    full_name: string;
    email: string;
    whatsapp_number: string;
    student_id: string; // NIM / NIS
    education_level: EducationLevel;
    institution_name: string;
    study_program: string; // jurusan / program studi
    campus_supervisor: string; // pembimbing dari kampus/sekolah
    tujuan_magang: string; // bidang / tujuan yang diminati
    start_date: string; // YYYY-MM-DD
    duration_months: number;
    cover_letter: File | null; // surat pengantar (wajib)
    proposal: File | null; // proposal (opsional)
    cv: File | null; // CV / daftar riwayat hidup (opsional)
}

interface PengajuanBaruProps {
    // Opsi durasi yang diizinkan (bulan). Default 1–6 bila backend belum mengirim.
    durationOptions?: number[];
}

const STEPS: { key: StepKey; title: string; subtitle: string; icon: typeof User }[] = [
    { key: 'diri', title: 'Data Diri', subtitle: 'Identitas pemohon', icon: User },
    { key: 'pendidikan', title: 'Asal Pendidikan', subtitle: 'Instansi & pembimbing', icon: GraduationCap },
    { key: 'rencana', title: 'Rencana Magang', subtitle: 'Bidang & jadwal', icon: Target },
    { key: 'dokumen', title: 'Dokumen', subtitle: 'Berkas & kirim', icon: FileText },
];

const EDUCATION_LABEL: Record<EducationLevel, string> = {
    sma_smk: 'SMA / SMK / Sederajat',
    d3: 'Diploma 3 (D3)',
    d4: 'Diploma 4 (D4)',
    s1: 'Sarjana (S1)',
    s2: 'Magister (S2)',
};

const initialForm: PengajuanPayload = {
    full_name: '',
    email: '',
    whatsapp_number: '',
    student_id: '',
    education_level: 's1',
    institution_name: '',
    study_program: '',
    campus_supervisor: '',
    tujuan_magang: '',
    start_date: '',
    duration_months: 3,
    cover_letter: null,
    proposal: null,
    cv: null,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---- util tanggal & format ------------------------------------------- */
function addMonths(iso: string, months: number): string {
    if (!iso) {
        return '';
    }

    const d = new Date(iso);
    d.setMonth(d.getMonth() + months);

    return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
    if (!iso) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export default function PengajuanBaru({ durationOptions = [1, 2, 3, 4, 5, 6] }: PengajuanBaruProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [form, setForm] = useState<PengajuanPayload>(initialForm);
    const [agree, setAgree] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [ticket, setTicket] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const step = STEPS[stepIndex];
    const endDate = useMemo(() => addMonths(form.start_date, form.duration_months), [form.start_date, form.duration_months]);

    function set<K extends keyof PengajuanPayload>(key: K, value: PengajuanPayload[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function onFile(key: 'cover_letter' | 'proposal' | 'cv', e: ChangeEvent<HTMLInputElement>) {
        set(key, e.target.files?.[0] ?? null);
    }

    /* ---- validasi per langkah (gerbang tombol "Lanjut") -------------- */
    const stepValid = useMemo<boolean>(() => {
        switch (step.key) {
            case 'diri':
                return (
                    form.full_name.trim().length > 2 &&
                    EMAIL_RE.test(form.email.trim()) &&
                    form.whatsapp_number.trim().length >= 9
                );
            case 'pendidikan':
                return (
                    form.institution_name.trim().length > 2 &&
                    form.study_program.trim().length > 1 &&
                    form.campus_supervisor.trim().length > 2
                );
            case 'rencana':
                return form.tujuan_magang.trim().length > 3 && form.start_date !== '' && form.duration_months > 0;
            case 'dokumen':
                return form.cover_letter !== null && agree;
            default:
                return false;
        }
    }, [step.key, form, agree]);

    function next() {
        if (!stepValid) {
            return;
        }

        if (stepIndex < STEPS.length - 1) {
            setStepIndex((i) => i + 1);
        }
    }

    function back() {
        if (stepIndex > 0) {
            setStepIndex((i) => i - 1);
        }
    }

    function handleSubmit() {
        if (!stepValid || processing) {
            return;
        }

        setProcessing(true);

        // TODO(backend): bangun FormData lalu
        //   router.post('/pengajuan', data, { forceFormData: true, onSuccess: ... })
        // Controller membuat nomor tiket & status awal `pending_verifikator`,
        // lalu redirect ke halaman terkirim.
        setTimeout(() => {
            const year = new Date().getFullYear();
            const rand = Math.floor(100000 + Math.random() * 900000);
            setTicket(`EMG-${year}-${rand}`);
            setProcessing(false);
        }, 1100);
    }

    function copyTicket() {
        if (!ticket) {
            return;
        }

        navigator.clipboard?.writeText(ticket);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }

    return (
        <>
            <Head title="Ajukan Magang — E-Magang Kota Madiun" />

            <div className="min-h-screen bg-slate-50 text-[#12213e]">
                {/* ===== Header ===== */}
                <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:px-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[#106feb] text-base font-black text-white shadow-sm">
                                eM
                            </div>
                            <div className="leading-tight">
                                <p className="text-sm font-bold text-[#12213e]">E-Magang</p>
                                <p className="text-[11px] font-medium text-slate-500">Kota Madiun</p>
                            </div>
                        </Link>
                        <Link
                            href="/login"
                            className="text-sm font-semibold text-[#106feb] hover:underline"
                        >
                            Sudah punya akun?
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
                    <AnimatePresence mode="wait">
                        {ticket ? (
                            /* ============ LAYAR SUKSES ============ */
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35, ease: 'circOut' }}
                                className="mx-auto max-w-lg text-center"
                            >
                                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                    <PartyPopper className="size-8" />
                                </div>
                                <h1 className="text-2xl font-black text-[#12213e] sm:text-3xl">Permohonan Terkirim!</h1>
                                <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
                                    Permohonan magang Anda telah kami terima dan akan diverifikasi oleh Dinas Kominfo
                                    Kota Madiun. Simpan nomor tiket berikut untuk melacak status.
                                </p>

                                <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Nomor Tiket Anda
                                    </p>
                                    <div className="mt-2 flex items-center justify-center gap-3">
                                        <span className="font-mono text-2xl font-black tracking-tight text-[#106feb]">
                                            {ticket}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={copyTicket}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                        >
                                            {copied ? (
                                                <>
                                                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                    Disalin
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3.5" />
                                                    Salin
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                                        Notifikasi perkembangan juga dikirim ke{' '}
                                        <span className="font-semibold text-[#12213e]">{form.email}</span> dan WhatsApp{' '}
                                        <span className="font-semibold text-[#12213e]">{form.whatsapp_number}</span>.
                                    </p>
                                </div>

                                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                    <Link
                                        href={`/lacak?tiket=${ticket}`}
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#106feb] px-6 text-sm font-bold text-white shadow-sm shadow-[#106feb]/30 transition hover:bg-[#0b5ed0]"
                                    >
                                        Lacak Status
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    <Link
                                        href="/"
                                        className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#12213e] transition hover:bg-slate-50"
                                    >
                                        Kembali ke Beranda
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            /* ============ WIZARD FORM ============ */
                            <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="mb-8">
                                    <h1 className="text-2xl font-black text-[#12213e] sm:text-3xl">Ajukan Magang</h1>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Lengkapi formulir berikut. Tidak perlu akun — Anda akan menerima nomor tiket
                                        untuk melacak status permohonan.
                                    </p>
                                </div>

                                {/* Stepper */}
                                <ol className="mb-8 flex items-center">
                                    {STEPS.map((s, i) => {
                                        const Icon = s.icon;
                                        const done = i < stepIndex;
                                        const current = i === stepIndex;

                                        return (
                                            <li key={s.key} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div
                                                        className={cn(
                                                            'flex size-10 items-center justify-center rounded-xl border-2 transition-colors',
                                                            done && 'border-[#106feb] bg-[#106feb] text-white',
                                                            current && 'border-[#106feb] bg-[#cddcef]/40 text-[#106feb]',
                                                            !done && !current && 'border-slate-200 bg-white text-slate-300',
                                                        )}
                                                    >
                                                        {done ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            'hidden text-[11px] font-semibold sm:block',
                                                            current ? 'text-[#12213e]' : 'text-slate-400',
                                                        )}
                                                    >
                                                        {s.title}
                                                    </span>
                                                </div>
                                                {i < STEPS.length - 1 && (
                                                    <div
                                                        className={cn(
                                                            'mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mb-5',
                                                            i < stepIndex ? 'bg-[#106feb]' : 'bg-slate-200',
                                                        )}
                                                    />
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>

                                {/* Kartu form */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                                    <div className="mb-6">
                                        <h2 className="text-lg font-bold text-[#12213e]">{step.title}</h2>
                                        <p className="text-sm text-slate-500">{step.subtitle}</p>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={step.key}
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -12 }}
                                            transition={{ duration: 0.25, ease: 'circOut' }}
                                        >
                                            {/* ---- Langkah 1: Data Diri ---- */}
                                            {step.key === 'diri' && (
                                                <div className="grid gap-5 sm:grid-cols-2">
                                                    <Field className="sm:col-span-2" label="Nama Lengkap" required>
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            placeholder="Sesuai KTP / Kartu Pelajar"
                                                            value={form.full_name}
                                                            onChange={(e) => set('full_name', e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </Field>
                                                    <Field label="Email" required>
                                                        <input
                                                            type="email"
                                                            inputMode="email"
                                                            placeholder="nama@email.com"
                                                            value={form.email}
                                                            onChange={(e) => set('email', e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </Field>
                                                    <Field label="Nomor WhatsApp" required>
                                                        <input
                                                            type="tel"
                                                            inputMode="tel"
                                                            placeholder="08xxxxxxxxxx"
                                                            value={form.whatsapp_number}
                                                            onChange={(e) => set('whatsapp_number', e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </Field>
                                                    <Field className="sm:col-span-2" label="NIM / NIS" hint="Opsional">
                                                        <input
                                                            type="text"
                                                            placeholder="Nomor induk mahasiswa/siswa"
                                                            value={form.student_id}
                                                            onChange={(e) => set('student_id', e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </Field>
                                                </div>
                                            )}

                                            {/* ---- Langkah 2: Asal Pendidikan ---- */}
                                            {step.key === 'pendidikan' && (
                                                <div className="grid gap-5 sm:grid-cols-2">
                                                    <Field className="sm:col-span-2" label="Jenjang Pendidikan" required>
                                                        <select
                                                            value={form.education_level}
                                                            onChange={(e) => set('education_level', e.target.value as EducationLevel)}
                                                            className={inputCls}
                                                        >
                                                            {(Object.keys(EDUCATION_LABEL) as EducationLevel[]).map((lvl) => (
                                                                <option key={lvl} value={lvl}>
                                                                    {EDUCATION_LABEL[lvl]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </Field>
                                                    <Field className="sm:col-span-2" label="Nama Instansi Pendidikan" required>
                                                        <input
                                                            type="text"
                                                            placeholder="Universitas / Sekolah asal"
                                                            value={form.institution_name}
                                                            onChange={(e) => set('institution_name', e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </Field>
                                                    <Field label="Jurusan / Program Studi" required>
                                                        <input
                                                            type="text"
                                                            placeholder="mis. Teknik Informatika"
                                                            value={form.study_program}
                                                            onChange={(e) => set('study_program', e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </Field>
                                                    <Field label="Dosen / Guru Pembimbing" required>
                                                        <input
                                                            type="text"
                                                            placeholder="Pembimbing dari kampus/sekolah"
                                                            value={form.campus_supervisor}
                                                            onChange={(e) => set('campus_supervisor', e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </Field>
                                                </div>
                                            )}

                                            {/* ---- Langkah 3: Rencana Magang ---- */}
                                            {step.key === 'rencana' && (
                                                <div className="grid gap-5 sm:grid-cols-2">
                                                    <Field
                                                        className="sm:col-span-2"
                                                        label="Bidang / Tujuan Magang"
                                                        hint="Penempatan final ditentukan verifikator"
                                                        required
                                                    >
                                                        <input
                                                            type="text"
                                                            placeholder="mis. Pengembangan Aplikasi, Desain Grafis, Jaringan"
                                                            value={form.tujuan_magang}
                                                            onChange={(e) => set('tujuan_magang', e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </Field>
                                                    <Field label="Tanggal Mulai" required>
                                                        <input
                                                            type="date"
                                                            value={form.start_date}
                                                            onChange={(e) => set('start_date', e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </Field>
                                                    <Field label="Durasi" required>
                                                        <select
                                                            value={form.duration_months}
                                                            onChange={(e) => set('duration_months', Number(e.target.value))}
                                                            className={inputCls}
                                                        >
                                                            {durationOptions.map((m) => (
                                                                <option key={m} value={m}>
                                                                    {m} bulan
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </Field>
                                                    <div className="rounded-xl bg-[#cddcef]/30 px-4 py-3 sm:col-span-2">
                                                        <div className="flex items-center gap-2 text-sm text-[#12213e]">
                                                            <CalendarDays className="size-4 text-[#106feb]" />
                                                            <span className="font-medium">Perkiraan selesai:</span>
                                                            <span className="font-bold">{formatDate(endDate)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ---- Langkah 4: Dokumen & Tinjau ---- */}
                                            {step.key === 'dokumen' && (
                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <FileInput
                                                            label="Surat Pengantar"
                                                            hint="Wajib · PDF maks. 2 MB"
                                                            file={form.cover_letter}
                                                            onChange={(e) => onFile('cover_letter', e)}
                                                            onClear={() => set('cover_letter', null)}
                                                        />
                                                        <FileInput
                                                            label="Proposal Magang"
                                                            hint="Opsional · PDF"
                                                            file={form.proposal}
                                                            onChange={(e) => onFile('proposal', e)}
                                                            onClear={() => set('proposal', null)}
                                                        />
                                                        <FileInput
                                                            label="CV / Daftar Riwayat Hidup"
                                                            hint="Opsional · PDF"
                                                            file={form.cv}
                                                            onChange={(e) => onFile('cv', e)}
                                                            onClear={() => set('cv', null)}
                                                        />
                                                    </div>

                                                    {/* Ringkasan */}
                                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                            Ringkasan Permohonan
                                                        </p>
                                                        <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
                                                            <SummaryRow icon={User} label="Pemohon" value={form.full_name} />
                                                            <SummaryRow icon={Building2} label="Instansi" value={form.institution_name} />
                                                            <SummaryRow icon={Target} label="Bidang" value={form.tujuan_magang} />
                                                            <SummaryRow icon={Clock} label="Durasi" value={`${form.duration_months} bulan`} />
                                                            <SummaryRow icon={CalendarDays} label="Mulai" value={formatDate(form.start_date)} />
                                                            <SummaryRow icon={CalendarDays} label="Selesai" value={formatDate(endDate)} />
                                                        </dl>
                                                    </div>

                                                    <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={agree}
                                                            onChange={(e) => setAgree(e.target.checked)}
                                                            className="mt-0.5 size-4 rounded border-slate-300 text-[#106feb] focus:ring-[#106feb]"
                                                        />
                                                        <span>
                                                            Saya menyatakan data yang diisi benar dan menyetujui{' '}
                                                            <Link href="/syarat" className="font-semibold text-[#106feb] hover:underline">
                                                                syarat & ketentuan
                                                            </Link>{' '}
                                                            program magang Pemerintah Kota Madiun.
                                                        </span>
                                                    </label>
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Navigasi */}
                                    <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
                                        {stepIndex > 0 ? (
                                            <button
                                                type="button"
                                                onClick={back}
                                                disabled={processing}
                                                className="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                                            >
                                                <ArrowLeft className="size-4" />
                                                Kembali
                                            </button>
                                        ) : (
                                            <Link
                                                href="/"
                                                className="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                                            >
                                                <ArrowLeft className="size-4" />
                                                Batal
                                            </Link>
                                        )}

                                        {stepIndex < STEPS.length - 1 ? (
                                            <button
                                                type="button"
                                                onClick={next}
                                                disabled={!stepValid}
                                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#106feb] px-6 text-sm font-bold text-white shadow-sm shadow-[#106feb]/30 transition hover:bg-[#0b5ed0] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Lanjut
                                                <ArrowRight className="size-4" />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSubmit}
                                                disabled={!stepValid || processing}
                                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#106feb] px-6 text-sm font-bold text-white shadow-sm shadow-[#106feb]/30 transition hover:bg-[#0b5ed0] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {processing ? (
                                                    <>
                                                        <Loader2 className="size-4 animate-spin" />
                                                        Mengirim…
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="size-4" />
                                                        Kirim Permohonan
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </>
    );
}

/* =========================================================================
 *  Sub-komponen
 * ========================================================================= */

const inputCls =
    'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15';

function Field({
    label,
    hint,
    required,
    className,
    children,
}: {
    label: string;
    hint?: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-[#12213e]">
                    {label}
                    {required && <span className="text-rose-500"> *</span>}
                </label>
                {hint && <span className="text-xs text-slate-400">· {hint}</span>}
            </div>
            {children}
        </div>
    );
}

function FileInput({
    label,
    hint,
    file,
    onChange,
    onClear,
}: {
    label: string;
    hint: string;
    file: File | null;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#12213e]">{label}</span>
                <span className="text-xs text-slate-400">· {hint}</span>
            </div>
            {file ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#106feb]/30 bg-[#cddcef]/20 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <FileText className="size-5 shrink-0 text-[#106feb]" />
                        <span className="truncate text-sm font-medium text-[#12213e]">{file.name}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-500"
                        aria-label={`Hapus ${label}`}
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 transition hover:border-[#106feb] hover:bg-[#cddcef]/10">
                    <Upload className="size-5 text-slate-400" />
                    <span>
                        Pilih berkas <span className="font-medium text-[#106feb]">PDF</span>
                    </span>
                    <input type="file" accept="application/pdf" onChange={onChange} className="hidden" />
                </label>
            )}
        </div>
    );
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-slate-400" />
            <dt className="text-slate-500">{label}:</dt>
            <dd className="min-w-0 truncate font-semibold text-[#12213e]">{value || '—'}</dd>
        </div>
    );
}
