import { useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    MapPin,
    Mail,
    Phone,
    Clock,
    ImagePlus,
    Upload,
    ArrowUpRight,
} from 'lucide-react';
import { useState } from 'react';
import { useRecaptchaV3 } from '@/hooks/use-recaptcha-v3';
import { DatePicker } from './date-picker';

const MAX_2MB = 2 * 1024 * 1024;
const MAX_10MB = 10 * 1024 * 1024;

export function RegistrationForm() {
    const recaptchaSiteKey =
        (usePage().props as { recaptchaSiteKey?: string }).recaptchaSiteKey ??
        '';

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        setError,
        clearErrors,
        transform,
    } = useForm({
        name: '',
        nis: '',
        institution_name: '',
        tujuan_magang: '',
        major: '',
        skills: '',
        address: '',
        start_date: '',
        end_date: '',
        campus_supervisor: '',
        campus_supervisor_whatsapp: '',
        whatsapp_number: '',
        email: '',
        photo: null as File | null,
        surat_pengantar: null as File | null,
        cv: null as File | null,
        portfolio: null as File | null,
        recaptcha_token: '',
    });

    const [pasFotoNama, setPasFotoNama] = useState('');
    const [pasFotoPreview, setPasFotoPreview] = useState('');
    const [suratPengantarNama, setSuratPengantarNama] = useState('');
    const [cvNama, setCvNama] = useState('');
    const [portfolioNama, setPortfolioNama] = useState('');
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');

    // reCAPTCHA v3 invisible — token dieksekusi saat submit (action 'daftar').
    const executeRecaptcha = useRecaptchaV3(
        recaptchaSiteKey || undefined,
        'daftar',
    );

    const handlePasFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.size > MAX_2MB) {
            setError('photo', 'Ukuran file maksimal 2MB.');
            e.target.value = '';

            return;
        }

        clearErrors('photo');
        setData('photo', file);
        setPasFotoNama(file.name);
        setPasFotoPreview((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev);
            }

            return URL.createObjectURL(file);
        });
    };

    const handleBerkas =
        (
            field: 'surat_pengantar' | 'cv' | 'portfolio',
            setNama: (v: string) => void,
        ) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] ?? null;
            const maxBytes = field === 'portfolio' ? MAX_10MB : MAX_2MB;

            if (file && file.size > maxBytes) {
                setError(
                    field,
                    `Ukuran file maksimal ${field === 'portfolio' ? '10MB' : '2MB'}.`,
                );
                e.target.value = '';

                return;
            }

            clearErrors(field);
            setData(field, file);
            setNama(file?.name ?? '');
        };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void executeRecaptcha().then((token) => {
            transform((current) => ({ ...current, recaptcha_token: token }));
            post('/pengajuan', {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setPasFotoNama('');
                    setPasFotoPreview('');
                    setSuratPengantarNama('');
                    setCvNama('');
                    setPortfolioNama('');
                    setTanggalMulai('');
                    setTanggalSelesai('');
                },
            });
        });
    };

    const inputClass =
        'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-brand-ink transition-all placeholder:text-brand-ink/40 hover:border-brand-light focus:border-transparent focus:ring-2 focus:ring-brand-hover focus:outline-none';

    return (
        <section
            id="daftar"
            className="mx-auto max-w-[1200px] px-6 py-24 md:py-32"
        >
            <div className="grid gap-12 lg:grid-cols-5">
                {/* Left: Contact Info */}
                <div className="lg:col-span-2">
                    <div className="bg-brand-bg text-brand-ink/70 mb-1 w-fit rounded-full border border-slate-100 px-3 py-1 text-[14px] shadow-sm">
                        <p>Hubungi Kami</p>
                    </div>
                    <h2 className="from-brand-ink via-brand-primary to-brand-light bg-gradient-to-r bg-clip-text text-[32px] leading-[1.15] font-extrabold tracking-tight text-transparent md:text-[42px]">
                        Ajukan Magang Sekarang
                    </h2>
                    <p className="text-brand-ink/60 mt-4 max-w-md text-[16px] leading-relaxed">
                        Isi formulir di samping dan kami akan memproses
                        pengajuan magang Anda. Pastikan data yang diisi benar
                        dan lengkap.
                    </p>

                    <div className="mt-8 space-y-4">
                        {[
                            {
                                icon: MapPin,
                                label: 'Alamat',
                                value: 'Jl. Pahlawan No.1, Madiun, Jawa Timur',
                            },
                            {
                                icon: Phone,
                                label: 'Telepon',
                                value: '(0351) 456789',
                            },
                            {
                                icon: Mail,
                                label: 'Email',
                                value: 'magang@madiunkota.go.id',
                            },
                            {
                                icon: Clock,
                                label: 'Jam Kerja',
                                value: 'Sen–Jum, 07:30–16:00',
                            },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-3">
                                <span className="bg-brand-light/40 text-brand-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                                    <Icon className="size-[18px]" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">
                                        {label}
                                    </p>
                                    <p className="text-brand-ink text-sm font-medium">
                                        {value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info tambahan */}
                    <div className="border-brand-light/60 from-brand-subtler mt-8 rounded-2xl border bg-gradient-to-br to-white p-5">
                        <p className="text-brand-primary flex items-center gap-2 text-sm font-semibold">
                            <Building2 className="size-4" /> Pastikan Berkas
                            Lengkap
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            Siapkan pas foto, surat pengantar dari institusi,
                            CV, dan portofolio (jika ada) sebelum mengisi
                            formulir.
                        </p>
                    </div>
                </div>

                {/* Right: Form */}
                <form onSubmit={handleSubmit} className="lg:col-span-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        <h3 className="text-brand-ink text-lg font-bold">
                            Data Diri
                        </h3>

                        <div className="mt-5 space-y-5">
                            {/* Upload Pas Foto */}
                            <div>
                                <label className="text-brand-ink text-sm font-semibold">
                                    Pas Foto{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <label className="hover:border-brand-primary hover:bg-brand-light/20 mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors">
                                    {pasFotoPreview ? (
                                        <img
                                            src={pasFotoPreview}
                                            alt="Preview"
                                            className="h-24 w-24 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <>
                                            <span className="bg-brand-light/40 text-brand-primary flex size-11 items-center justify-center rounded-xl">
                                                <ImagePlus className="size-5" />
                                            </span>
                                            <span className="text-brand-ink/60 mt-2 text-sm font-medium">
                                                Klik untuk unggah pas foto
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                Format JPG/PNG, maks. 2MB
                                            </span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        className="hidden"
                                        onChange={handlePasFoto}
                                    />
                                </label>
                                {pasFotoNama && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        {pasFotoNama}
                                    </p>
                                )}
                                {errors.photo && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {errors.photo}
                                    </p>
                                )}
                            </div>

                            {[
                                {
                                    field: 'name' as const,
                                    label: 'Nama Lengkap',
                                    required: true,
                                    placeholder: 'Nama sesuai identitas',
                                },
                                {
                                    field: 'nis' as const,
                                    label: 'NIS / NIM',
                                    required: true,
                                },
                                {
                                    field: 'email' as const,
                                    label: 'Email',
                                    type: 'email',
                                    required: true,
                                    placeholder: 'contoh@email.com',
                                },
                                {
                                    field: 'whatsapp_number' as const,
                                    label: 'No. WhatsApp',
                                    required: true,
                                    placeholder: '08xxxxxxxxxx',
                                },
                                {
                                    field: 'institution_name' as const,
                                    label: 'Asal Sekolah/Instansi',
                                    required: true,
                                },
                                {
                                    field: 'tujuan_magang' as const,
                                    label: 'Tujuan Magang',
                                    required: true,
                                },
                                {
                                    field: 'major' as const,
                                    label: 'Jurusan (opsional)',
                                    required: false,
                                },
                                {
                                    field: 'skills' as const,
                                    label: 'Keahlian / Keterampilan (opsional)',
                                    as: 'textarea',
                                    required: false,
                                },
                                {
                                    field: 'address' as const,
                                    label: 'Alamat Lengkap',
                                    as: 'textarea',
                                    required: true,
                                },
                                {
                                    field: 'campus_supervisor' as const,
                                    label: 'Pembimbing Kampus/Sekolah',
                                    required: true,
                                },
                                {
                                    field: 'campus_supervisor_whatsapp' as const,
                                    label: 'No. WA Dosen/Guru Pembimbing',
                                    required: true,
                                },
                            ].map(
                                ({
                                    field,
                                    label,
                                    required,
                                    type,
                                    placeholder,
                                    as: asType,
                                }) => (
                                    <div key={field}>
                                        <label className="text-brand-ink text-sm font-semibold">
                                            {label}{' '}
                                            {required && (
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            )}
                                        </label>
                                        {asType === 'textarea' ? (
                                            <textarea
                                                value={data[field] as string}
                                                onChange={(e) =>
                                                    setData(
                                                        field,
                                                        e.target.value,
                                                    )
                                                }
                                                className={`mt-1 ${inputClass} resize-none`}
                                                rows={3}
                                                placeholder={placeholder}
                                            />
                                        ) : (
                                            <input
                                                type={type ?? 'text'}
                                                value={data[field] as string}
                                                onChange={(e) =>
                                                    setData(
                                                        field,
                                                        e.target.value,
                                                    )
                                                }
                                                className={`mt-1 ${inputClass}`}
                                                placeholder={placeholder}
                                            />
                                        )}
                                        {errors[field] && (
                                            <p className="mt-1 text-xs text-rose-500">
                                                {errors[field]}
                                            </p>
                                        )}
                                    </div>
                                ),
                            )}

                            {/* Tanggal */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-brand-ink text-sm font-semibold">
                                        Tanggal Mulai{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <DatePicker
                                            value={tanggalMulai}
                                            onChange={(v) => {
                                                setTanggalMulai(v);
                                                setData('start_date', v);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-brand-ink text-sm font-semibold">
                                        Tanggal Selesai{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <DatePicker
                                            value={tanggalSelesai}
                                            onChange={(v) => {
                                                setTanggalSelesai(v);
                                                setData('end_date', v);
                                            }}
                                            min={tanggalMulai}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dokumen pendukung */}
                        <h3 className="text-brand-ink mt-8 text-lg font-bold">
                            Dokumen Pendukung (opsional)
                        </h3>
                        <div className="mt-4 space-y-4">
                            {[
                                {
                                    field: 'surat_pengantar' as const,
                                    label: 'Surat Pengantar',
                                    nama: suratPengantarNama,
                                    setNama: setSuratPengantarNama,
                                    handler: handleBerkas(
                                        'surat_pengantar',
                                        setSuratPengantarNama,
                                    ),
                                },
                                {
                                    field: 'cv' as const,
                                    label: 'Curriculum Vitae (CV)',
                                    nama: cvNama,
                                    setNama: setCvNama,
                                    handler: handleBerkas('cv', setCvNama),
                                },
                                {
                                    field: 'portfolio' as const,
                                    label: 'Portofolio (jika ada, maks. 10MB)',
                                    nama: portfolioNama,
                                    setNama: setPortfolioNama,
                                    handler: handleBerkas(
                                        'portfolio',
                                        setPortfolioNama,
                                    ),
                                },
                            ].map(({ field, label, nama, handler }) => (
                                <div key={field}>
                                    <label className="text-brand-ink text-sm font-semibold">
                                        {label}
                                    </label>
                                    <label className="hover:border-brand-light mt-1 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition-colors">
                                        <Upload className="text-brand-primary size-5 shrink-0" />
                                        <span className="text-brand-ink/60 text-sm">
                                            {nama || 'Pilih file...'}
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handler}
                                        />
                                    </label>
                                    {errors[field] && (
                                        <p className="mt-1 text-xs text-rose-500">
                                            {errors[field]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* reCAPTCHA v3 (invisible) + Submit */}
                        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="group bg-brand-primary shadow-brand-primary/25 hover:shadow-brand-primary/35 focus-visible:ring-brand-hover focus-visible:ring-offset-brand-bg relative inline-flex w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-full py-2 pr-2 pl-7 text-sm shadow-lg transition-shadow duration-300 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
                            >
                                <span
                                    aria-hidden
                                    className="bg-brand-light absolute inset-0 z-0 -translate-x-[101%] transition-transform duration-500 ease-out group-hover:translate-x-0"
                                />
                                <span className="group-hover:text-brand-primary relative z-10 text-[15px] font-semibold text-white transition-colors duration-500 ease-out">
                                    {processing
                                        ? 'Mengirim...'
                                        : 'Kirim Pengajuan'}
                                </span>
                                <span className="text-brand-primary group-hover:bg-brand-primary relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-white transition-colors duration-500 ease-out group-hover:text-white">
                                    {processing ? (
                                        <svg
                                            className="size-5 animate-spin"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                    ) : (
                                        <ArrowUpRight className="size-5 transition-transform duration-500 ease-out group-hover:rotate-45" />
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
}
