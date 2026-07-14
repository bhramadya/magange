import { Head, Link, router } from '@inertiajs/react';
import {
    Upload,
    FileText,
    CheckCircle2,
    Loader2,
    Lock,
    Star,
    Award,
    Download,
    AlertTriangle,
    ClipboardList,
    ArrowRight,
    Clock,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import MagangLayout from '@/layouts/magang-layout';
import type {
    FinalReport,
    InternshipApplication,
    MagangUser,
} from '@/types/magang';

/* =========================================================================
 *  HALAMAN PENYELESAIAN (Mahasiswa) — Fase 4
 *  Alur 3 tahap berurutan, tiap tahap tergembok sampai tahap sebelumnya
 *  tuntas:
 *    1) Unggah Laporan Akhir (PDF) → divalidasi Admin Verifikator
 *    2) Isi Survei Wajib          → terbuka setelah laporan disetujui
 *    3) Unduh e-Sertifikat        → terbuka setelah survei terkirim & terbit
 *
 *  Halaman ini memerlukan login. Props {user, application} dikirim controller
 *  Inertia (rekan backend). Default mock di bawah membuat halaman tetap
 *  tampil saat dikembangkan tanpa backend.
 *
 *  Nama komponen "mahasiswa/penyelesaian" → otomatis tercakup oleh
 *  `case name.startsWith('mahasiswa/')` di app.tsx (membungkus MagangLayout
 *  sendiri). URL rute tetap `/penyelesaian` (controller backend yang memetakan).
 * ========================================================================= */

/* ------------------------- payload untuk backend --------------------------- */

// Tahap 1 — unggah laporan akhir (ada File → multipart).
//   router.post('/penyelesaian/laporan', formData, { forceFormData: true })
export interface ReportUploadPayload {
    final_report: File | null;
}

// Tahap 2 — kirim survei wajib.
//   router.post('/penyelesaian/survei', { ratings, comment })
export interface SurveyPayload {
    ratings: Record<string, number>;
    comment: string;
}

interface PenyelesaianProps {
    user?: MagangUser;
    application?: InternshipApplication | null;
}

/* -------------------------- pertanyaan survei ------------------------------ */

const SURVEY_QUESTIONS: { key: string; text: string }[] = [
    { key: 'bimbingan', text: 'Kualitas bimbingan dari pembimbing lapangan' },
    { key: 'lingkungan', text: 'Lingkungan dan suasana kerja di OPD' },
    { key: 'relevansi', text: 'Relevansi tugas dengan bidang studi Anda' },
    { key: 'fasilitas', text: 'Fasilitas yang disediakan selama magang' },
    { key: 'keseluruhan', text: 'Kepuasan Anda secara keseluruhan' },
];

const RATING_LABEL: Record<number, string> = {
    1: 'Sangat kurang',
    2: 'Kurang',
    3: 'Cukup',
    4: 'Baik',
    5: 'Sangat baik',
};

/* -------------------------------- mock ------------------------------------- */

const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Rangga Saputra',
    email: 'rangga.saputra@example.com',
    whatsapp_number: '081234567890',
    role: 'mahasiswa',
};

const MOCK_APPLICATION: InternshipApplication = {
    id: 1,
    ticket_number: 'MGG-2026-0042',
    tujuan_magang:
        'Mempelajari pengelolaan infrastruktur jaringan dan pengembangan aplikasi internal di lingkungan pemerintahan.',
    duration_months: 3,
    start_date: '2026-07-01',
    end_date: '2026-09-30',
    institution_name: 'Universitas Negeri Madiun',
    campus_supervisor: 'Dr. Indah Permatasari, M.Kom.',
    status: 'ongoing',
    opd: {
        id: 16,
        name: 'DINAS KOMUNIKASI DAN INFORMATIKA',
        code: 'DISKOMINFO',
    },
    division: 'Bidang Pengembangan Aplikasi',
    field_supervisor: 'Bayu Pratama, S.Kom.',
    person_in_charge: 'Bayu Pratama, S.Kom.',
    rejection_reason: null,
    forwarded_at: '2026-06-20T09:00:00',
    opd_decision_at: '2026-06-23T14:30:00',
    created_at: '2026-06-18T08:15:00',
    final_report: null,
    survey_submitted: false,
    certificate: null,
    certificate_available: false,
};

/* -------------------------------- util ------------------------------------- */

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(iso));
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ============================= sub-komponen ================================ */

/* ---- header tahap (nomor + judul + lencana status) ---- */

type StageState = 'locked' | 'active' | 'done';

function StageHeader({
    index,
    title,
    subtitle,
    state,
}: {
    index: number;
    title: string;
    subtitle: string;
    state: StageState;
}) {
    return (
        <div className="flex items-start gap-4">
            <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                    state === 'done'
                        ? 'bg-emerald-500 text-white'
                        : state === 'active'
                          ? 'bg-[#106feb] text-white'
                          : 'bg-slate-100 text-slate-400'
                }`}
            >
                {state === 'done' ? (
                    <CheckCircle2 className="size-5" />
                ) : state === 'locked' ? (
                    <Lock className="size-4" />
                ) : (
                    index
                )}
            </span>
            <div className="min-w-0">
                <h3
                    className={`text-base font-bold ${state === 'locked' ? 'text-slate-400' : 'text-[#12213e]'}`}
                >
                    {title}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            </div>
        </div>
    );
}

/* ---- kartu pembungkus tiap tahap ---- */

function StageCard({
    state,
    children,
}: {
    state: StageState;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`rounded-2xl border bg-white p-6 transition-colors ${
                state === 'active'
                    ? 'border-[#106feb]/40 ring-1 ring-[#106feb]/15'
                    : 'border-slate-200'
            } ${state === 'locked' ? 'opacity-75' : ''}`}
        >
            {children}
        </div>
    );
}

/* ---- input bintang survei ---- */

function StarRating({
    value,
    onChange,
}: {
    value: number;
    onChange: (v: number) => void;
}) {
    const [hover, setHover] = useState(0);
    const shown = hover || value;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        className="rounded-md p-0.5 transition-transform hover:scale-110"
                        aria-label={`${n} bintang`}
                    >
                        <Star
                            className={`size-6 ${n <= shown ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        />
                    </button>
                ))}
            </div>
            <span className="text-xs font-medium text-slate-500">
                {shown ? RATING_LABEL[shown] : 'Belum dinilai'}
            </span>
        </div>
    );
}

/* ---- ringkasan dokumen laporan yang terunggah ---- */

function ReportFileCard({ report }: { report: FinalReport }) {
    const tone =
        report.status === 'approved'
            ? {
                  wrap: 'border-emerald-200 bg-emerald-50',
                  icon: 'bg-emerald-500',
                  text: 'text-emerald-700',
                  label: 'Disetujui',
              }
            : report.status === 'rejected'
              ? {
                    wrap: 'border-rose-200 bg-rose-50',
                    icon: 'bg-rose-500',
                    text: 'text-rose-700',
                    label: 'Perlu Revisi',
                }
              : {
                    wrap: 'border-blue-200 bg-blue-50',
                    icon: 'bg-[#106feb]',
                    text: 'text-blue-700',
                    label: 'Menunggu Validasi',
                };

    return (
        <div
            className={`flex items-center gap-3 rounded-xl border p-3.5 ${tone.wrap}`}
        >
            <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-white ${tone.icon}`}
            >
                <FileText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#12213e]">
                    {report.file_name}
                </p>
                <p className="text-xs text-slate-500">
                    Diunggah {formatDate(report.submitted_at)}
                </p>
            </div>
            <span className={`shrink-0 text-xs font-bold ${tone.text}`}>
                {tone.label}
            </span>
        </div>
    );
}

/* ================================= PAGE =================================== */

export default function Penyelesaian({
    user = MOCK_USER,
    application = MOCK_APPLICATION,
}: PenyelesaianProps) {
    // ---- state turunan langsung dari props (Inertia reload props tiap sukses) ----
    const report = application?.final_report ?? null;
    const surveySubmitted = application?.survey_submitted ?? false;
    const certificate = application?.certificate ?? null;
    const certAvailable = application?.certificate_available ?? false;

    // ---- form unggah ----
    const [file, setFile] = useState<File | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [uploading, setUploading] = useState(false);

    // ---- form survei ----
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [comment, setComment] = useState('');
    const [sendingSurvey, setSendingSurvey] = useState(false);

    // ---- gerbang tahap ----
    const reportRejected = report?.status === 'rejected';
    const hasReport = report !== null;

    const stage1: StageState = reportRejected
        ? 'active'
        : hasReport
          ? 'done'
          : 'active';
    // Survei terbuka setelah Admin Verifikator menerbitkan sertifikat (terkunci).
    const stage2: StageState = surveySubmitted
        ? 'done'
        : certificate
          ? 'active'
          : 'locked';
    const stage3: StageState =
        certAvailable && surveySubmitted ? 'active' : 'locked';

    const surveyValid = useMemo(
        () => SURVEY_QUESTIONS.every((q) => (ratings[q.key] ?? 0) > 0),
        [ratings],
    );

    /* ------------------------------ handlers ------------------------------- */

    function onFile(e: ChangeEvent<HTMLInputElement>) {
        setFile(e.target.files?.[0] ?? null);
    }

    function handleUpload() {
        if (!file || !confirmed || !application) {
            return;
        }

        setUploading(true);
        // Aktor "Selesai" #4: unggah laporan + konfirmasi → tandai selesai.
        router.post(
            `/mahasiswa/pengajuan/${application.id}/laporan`,
            { file, is_confirmed: true },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setFile(null);
                    setConfirmed(false);
                },
                onFinish: () => setUploading(false),
            },
        );
    }

    function handleSubmitSurvey() {
        if (!surveyValid || !certificate) {
            return;
        }

        // Kirim rating per-aspek (5 pertanyaan); rata-rata dihitung server-side.
        const payloadRatings = Object.fromEntries(
            SURVEY_QUESTIONS.map((q) => [q.key, ratings[q.key] ?? 0]),
        );

        setSendingSurvey(true);
        router.post(
            `/sertifikat/${certificate.id}/survei`,
            { ratings: payloadRatings, comment },
            {
                preserveScroll: true,
                onFinish: () => setSendingSurvey(false),
            },
        );
    }

    /* ----------------------------- tanpa magang ---------------------------- */

    const eligible =
        application &&
        (application.status === 'ongoing' ||
            application.status === 'completion_submitted' ||
            application.status === 'completed');

    if (!eligible) {
        return (
            <MagangLayout
                user={user}
                title="Penyelesaian"
                active="penyelesaian"
            >
                <Head title="Penyelesaian" />
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[#cddcef]/40 text-[#106feb]">
                        <Award className="size-7" />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-[#12213e]">
                        Tahap penyelesaian belum tersedia
                    </h2>
                    <p className="mt-1 max-w-md text-sm text-slate-500">
                        Halaman ini terbuka saat magang Anda telah berjalan.
                        Unggah laporan akhir, isi survei, lalu unduh
                        e-Sertifikat di sini ketika periode magang berakhir.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#106feb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b4fb0]"
                    >
                        Ke Dasbor <ArrowRight className="size-4" />
                    </Link>
                </div>
            </MagangLayout>
        );
    }

    /* -------------------------------- render ------------------------------- */

    const completedAll = certAvailable && surveySubmitted;

    return (
        <MagangLayout user={user} title="Penyelesaian" active="penyelesaian">
            <Head title="Penyelesaian Magang" />

            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm text-slate-500">
                        Tahap akhir magang Anda
                    </p>
                    <h2 className="text-2xl font-black text-[#12213e]">
                        Penyelesaian &amp; Sertifikat
                    </h2>
                </div>
                <span className="self-start rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 sm:self-auto">
                    No. Tiket:{' '}
                    <span className="text-[#106feb]">
                        {application.ticket_number}
                    </span>
                </span>
            </div>

            {/* Banner ringkas progres */}
            <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                    {
                        label: 'Laporan',
                        done: hasReport && !reportRejected,
                        active: stage1 === 'active',
                    },
                    {
                        label: 'Survei',
                        done: surveySubmitted,
                        active: stage2 === 'active',
                    },
                    {
                        label: 'Sertifikat',
                        done: completedAll,
                        active: stage3 === 'active',
                    },
                ].map((s, i) => (
                    <div
                        key={s.label}
                        className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold ${
                            s.done
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : s.active
                                  ? 'border-[#106feb]/40 bg-[#cddcef]/30 text-[#106feb]'
                                  : 'border-slate-200 bg-white text-slate-400'
                        }`}
                    >
                        <span className="mr-1">{i + 1}.</span>
                        {s.label}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col gap-5">
                {/* ============== TAHAP 1 — LAPORAN ============== */}
                <StageCard state={stage1}>
                    <StageHeader
                        index={1}
                        title="Unggah Laporan Akhir"
                        subtitle="Format PDF, maksimal 10 MB. Akan divalidasi Admin Verifikator."
                        state={stage1}
                    />

                    <div className="mt-5">
                        {hasReport && !reportRejected ? (
                            <div className="space-y-3">
                                <ReportFileCard report={report} />
                                {report.status === 'pending' && (
                                    <p className="flex items-center gap-2 text-xs text-slate-500">
                                        <Clock className="size-4 text-[#106feb]" />
                                        Laporan sedang ditinjau Admin
                                        Verifikator. Anda akan diberi tahu via
                                        email/WhatsApp.
                                    </p>
                                )}
                                {report.status === 'approved' && (
                                    <p className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                                        <CheckCircle2 className="size-4" />
                                        Laporan disetujui. Lanjutkan ke
                                        pengisian survei di bawah.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reportRejected && report && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                                        <p className="flex items-center gap-2 text-sm font-bold text-rose-700">
                                            <AlertTriangle className="size-4" />{' '}
                                            Laporan perlu direvisi
                                        </p>
                                        <p className="mt-1 text-xs text-rose-700/90">
                                            Admin Verifikator meminta perbaikan.
                                            Silakan unggah ulang versi revisi.
                                        </p>
                                    </div>
                                )}

                                <label
                                    htmlFor="laporan-file"
                                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-[#106feb] hover:bg-[#cddcef]/20"
                                >
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#cddcef]/50 text-[#106feb]">
                                        <Upload className="size-5" />
                                    </span>
                                    {file ? (
                                        <span className="mt-3 text-sm font-semibold text-[#12213e]">
                                            {file.name}{' '}
                                            <span className="font-normal text-slate-500">
                                                ({formatBytes(file.size)})
                                            </span>
                                        </span>
                                    ) : (
                                        <>
                                            <span className="mt-3 text-sm font-semibold text-[#12213e]">
                                                Klik untuk memilih berkas
                                            </span>
                                            <span className="mt-0.5 text-xs text-slate-500">
                                                Laporan akhir dalam format PDF
                                            </span>
                                        </>
                                    )}
                                    <input
                                        id="laporan-file"
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={onFile}
                                    />
                                </label>

                                {/* Konfirmasi penyelesaian — aktor "Selesai" #4 (PRD). */}
                                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={confirmed}
                                        onChange={(e) =>
                                            setConfirmed(e.target.checked)
                                        }
                                        className="mt-0.5 size-4 rounded border-slate-300 text-[#106feb] focus:ring-[#106feb]"
                                    />
                                    <span className="text-xs text-slate-600">
                                        Saya konfirmasi telah menyelesaikan
                                        seluruh periode magang dan laporan ini
                                        bersifat final. Mengunggah akan menandai
                                        magang saya <strong>selesai</strong>.
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={!file || !confirmed || uploading}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#106feb] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />{' '}
                                            Mengunggah…
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="size-4" />{' '}
                                            {reportRejected
                                                ? 'Unggah Revisi'
                                                : 'Unggah Laporan'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </StageCard>

                {/* ============== TAHAP 2 — SURVEI ============== */}
                <StageCard state={stage2}>
                    <StageHeader
                        index={2}
                        title="Isi Survei Wajib"
                        subtitle="Penilaian pengalaman magang Anda. Wajib diisi untuk membuka e-Sertifikat."
                        state={stage2}
                    />

                    <AnimatePresence mode="wait">
                        {stage2 === 'locked' && (
                            <motion.p
                                key="survey-locked"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500"
                            >
                                <Lock className="size-4" />
                                Survei terbuka setelah Admin Verifikator
                                menyetujui laporan & menerbitkan sertifikat
                                Anda.
                            </motion.p>
                        )}

                        {stage2 === 'active' && (
                            <motion.div
                                key="survey-form"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-5 space-y-5"
                            >
                                {SURVEY_QUESTIONS.map((q, i) => (
                                    <div
                                        key={q.key}
                                        className="flex flex-col gap-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <p className="text-sm font-medium text-[#12213e]">
                                            <span className="mr-1.5 text-slate-400">
                                                {i + 1}.
                                            </span>
                                            {q.text}
                                        </p>
                                        <StarRating
                                            value={ratings[q.key] ?? 0}
                                            onChange={(v) =>
                                                setRatings((prev) => ({
                                                    ...prev,
                                                    [q.key]: v,
                                                }))
                                            }
                                        />
                                    </div>
                                ))}

                                <div>
                                    <label
                                        htmlFor="survey-comment"
                                        className="text-sm font-medium text-[#12213e]"
                                    >
                                        Saran &amp; masukan{' '}
                                        <span className="font-normal text-slate-400">
                                            (opsional)
                                        </span>
                                    </label>
                                    <textarea
                                        id="survey-comment"
                                        value={comment}
                                        onChange={(e) =>
                                            setComment(e.target.value)
                                        }
                                        rows={3}
                                        placeholder="Bagikan pengalaman atau saran Anda selama magang…"
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#12213e] placeholder:text-slate-400 focus:border-[#106feb] focus:ring-2 focus:ring-[#106feb]/15 focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSubmitSurvey}
                                    disabled={!surveyValid || sendingSurvey}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#106feb] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b4fb0] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                >
                                    {sendingSurvey ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />{' '}
                                            Mengirim…
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardList className="size-4" />{' '}
                                            Kirim Survei
                                        </>
                                    )}
                                </button>
                                {!surveyValid && (
                                    <p className="text-xs text-slate-400">
                                        Mohon nilai seluruh pertanyaan terlebih
                                        dahulu.
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {stage2 === 'done' && (
                            <motion.p
                                key="survey-done"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                            >
                                <CheckCircle2 className="size-4" />
                                Terima kasih! Survei Anda sudah terkirim.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </StageCard>

                {/* ============== TAHAP 3 — SERTIFIKAT ============== */}
                <StageCard state={stage3}>
                    <StageHeader
                        index={3}
                        title="Unduh e-Sertifikat"
                        subtitle="Sertifikat resmi penyelesaian magang Pemerintah Kota Madiun."
                        state={stage3}
                    />

                    <div className="mt-5">
                        {!surveySubmitted ? (
                            <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                <Lock className="size-4" />
                                Sertifikat terbuka setelah survei wajib Anda
                                terkirim.
                            </p>
                        ) : !certAvailable ? (
                            <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                <Clock className="size-4" />
                                Sertifikat sedang disiapkan. Anda akan diberi
                                tahu saat siap diunduh.
                            </p>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, ease: 'circOut' }}
                                className="overflow-hidden rounded-2xl border border-[#cddcef] bg-gradient-to-br from-[#106feb] to-[#0b4fb0] p-6 text-white"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
                                        <Award className="size-6" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold">
                                            Selamat, magang Anda selesai!
                                        </p>
                                        <p className="text-xs text-white/80">
                                            e-Sertifikat resmi Anda telah terbit
                                            dan siap diunduh.
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={
                                        certificate
                                            ? `/sertifikat/${certificate.id}/download`
                                            : '#'
                                    }
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#106feb] transition-colors hover:bg-white/90"
                                >
                                    <Download className="size-4" /> Unduh
                                    e-Sertifikat
                                </a>
                            </motion.div>
                        )}
                    </div>
                </StageCard>
            </div>

            {/* Ringkasan magang (konteks) */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-[#12213e]">
                    Ringkasan Magang
                </h3>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-medium text-slate-500">
                            OPD Penempatan
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[#12213e]">
                            {application.opd?.name ?? '—'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-slate-500">
                            Bidang
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[#12213e]">
                            {application.division ?? '—'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-slate-500">
                            Periode
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[#12213e]">
                            {formatDate(application.start_date)} –{' '}
                            {formatDate(application.end_date)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-slate-500">
                            Pembimbing Lapangan
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[#12213e]">
                            {application.field_supervisor ?? '—'}
                        </dd>
                    </div>
                </dl>
            </div>
        </MagangLayout>
    );
}
