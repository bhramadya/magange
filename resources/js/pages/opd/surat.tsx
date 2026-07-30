import { Head, router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    FileSignature,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Search,
    Star,
    Trash2,
    UserRoundPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    destroySigner,
    storeSigner,
    updateLetterhead,
    updateSigner,
    updateTemplate,
} from '@/actions/App/Http/Controllers/Opd/LetterController';
import MagangLayout, { opdNav } from '@/layouts/magang-layout';
import type { MagangUser, Opd, Signer } from '@/types/magang';

type TemplateType = 'acceptance' | 'certificate';
type Tab = 'data' | 'template' | 'arsip';

/**
 * Satu baris arsip = satu dokumen yang SUDAH ditandatangani & diunggah,
 * baik surat penerimaan (melekat pada pengajuan) maupun sertifikat.
 */
interface SignedDocument {
    key: string;
    type: 'acceptance' | 'certificate';
    type_label: string;
    sk_number: string | null;
    participant: string | null;
    ticket_number: string | null;
    issued_at: string | null;
    download_url: string;
}

interface Props {
    user: MagangUser;
    opd: Opd;
    signers: Signer[];
    templates: Record<TemplateType, string>;
    placeholders: string[];
    requiredPlaceholders: Record<TemplateType, string[]>;
    documents: SignedDocument[];
    filters: { cari: string };
}

const inputClass =
    'h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15';

const TABS: { key: Tab; label: string }[] = [
    { key: 'data', label: 'Data & Penandatangan' },
    { key: 'template', label: 'Template Surat' },
    { key: 'arsip', label: 'Arsip Dokumen TTE' },
];

function tabClass(active: boolean): string {
    return active
        ? 'cursor-pointer rounded-xl bg-[#106feb] px-4 py-2 text-sm font-semibold text-white'
        : 'cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50';
}

/* ---- Data Surat (kop) -------------------------------------------------
 * Sebelumnya tiga input polos di kartu Kelola OPD: tanpa label, tanpa nilai
 * tersimpan yang terlihat, tanpa pesan error — sehingga kegagalan simpan
 * tampak seperti "data hilang entah ke mana". Kini mode baca + mode ubah.
 */
function LetterheadSection({ opd }: { opd: Opd }) {
    const [editing, setEditing] = useState(false);
    const [address, setAddress] = useState(opd.letterhead_address ?? '');
    const [phone, setPhone] = useState(opd.letterhead_phone ?? '');
    const [email, setEmail] = useState(opd.letterhead_email ?? '');
    const [processing, setProcessing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const rows = [
        { icon: MapPin, label: 'Alamat', value: opd.letterhead_address },
        { icon: Phone, label: 'Telepon', value: opd.letterhead_phone },
        { icon: Mail, label: 'Pos-el', value: opd.letterhead_email },
    ];
    const lengkap = rows.every((row) => (row.value ?? '').trim() !== '');

    function save() {
        setProcessing(true);
        setErrors({});
        router.patch(
            updateLetterhead.url(),
            {
                letterhead_address: address,
                letterhead_phone: phone,
                letterhead_email: email,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditing(false);
                    setSaved(true);
                },
                onError: (errs) => setErrors(errs),
                onFinish: () => setProcessing(false),
            },
        );
    }

    function batal() {
        setAddress(opd.letterhead_address ?? '');
        setPhone(opd.letterhead_phone ?? '');
        setEmail(opd.letterhead_email ?? '');
        setErrors({});
        setEditing(false);
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[#12213e]">
                        <FileText className="size-4 text-[#106feb]" /> Data Surat
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Dipakai sebagai kop pada Surat Penerimaan dan
                        Sertifikat. Logo Pemkot Madiun sama untuk semua OPD.
                    </p>
                </div>
                {!editing && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#106feb] transition hover:bg-[#e8f2fe]"
                    >
                        <Pencil className="size-4" />{' '}
                        {lengkap ? 'Ubah' : 'Lengkapi'}
                    </button>
                )}
            </div>

            {!editing && (
                <div className="mt-4 space-y-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#12213e]">
                        <Building2 className="size-4 text-slate-400" />
                        {opd.name}
                    </p>
                    {rows.map((row) => (
                        <p
                            key={row.label}
                            className="flex items-start gap-2 text-sm text-slate-600"
                        >
                            <row.icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
                            <span>
                                <span className="text-slate-400">
                                    {row.label}:{' '}
                                </span>
                                {(row.value ?? '').trim() !== '' ? (
                                    row.value
                                ) : (
                                    <span className="text-rose-600">
                                        Belum diisi
                                    </span>
                                )}
                            </span>
                        </p>
                    ))}
                    {!lengkap && (
                        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                            Data Surat wajib lengkap sebelum pengajuan bisa
                            disetujui — kop surat tidak boleh terbit setengah
                            jadi.
                        </p>
                    )}
                    {saved && lengkap && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="size-4" /> Tersimpan.
                        </p>
                    )}
                </div>
            )}

            {editing && (
                <div className="mt-4 grid gap-3">
                    <div>
                        <label
                            htmlFor="letterhead_address"
                            className="text-sm font-semibold text-[#12213e]"
                        >
                            Alamat
                        </label>
                        <input
                            id="letterhead_address"
                            value={address}
                            onChange={(event) =>
                                setAddress(event.target.value)
                            }
                            placeholder="mis. Jl. Perintis Kemerdekaan No. 32, Madiun"
                            className={`mt-1 ${inputClass}`}
                        />
                        {errors.letterhead_address && (
                            <p className="mt-1 text-xs text-rose-600">
                                {errors.letterhead_address}
                            </p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="letterhead_phone"
                            className="text-sm font-semibold text-[#12213e]"
                        >
                            Telepon
                        </label>
                        <input
                            id="letterhead_phone"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="mis. (0351) 123456"
                            className={`mt-1 ${inputClass}`}
                        />
                        {errors.letterhead_phone && (
                            <p className="mt-1 text-xs text-rose-600">
                                {errors.letterhead_phone}
                            </p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="letterhead_email"
                            className="text-sm font-semibold text-[#12213e]"
                        >
                            Pos-el
                        </label>
                        <input
                            id="letterhead_email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="mis. bkd@madiunkota.go.id"
                            className={`mt-1 ${inputClass}`}
                        />
                        {errors.letterhead_email && (
                            <p className="mt-1 text-xs text-rose-600">
                                {errors.letterhead_email}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={save}
                            disabled={processing}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#106feb] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="size-4" />
                            )}
                            Simpan Data Surat
                        </button>
                        <button
                            type="button"
                            onClick={batal}
                            className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

/* ---- Penandatangan (CRUD, pola Kelola FAQ) --------------------------- */
function SignerRow({ signer }: { signer: Signer }) {
    const [editing, setEditing] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [name, setName] = useState(signer.name);
    const [title, setTitle] = useState(signer.title);
    const [nip, setNip] = useState(signer.nip);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function simpan(jadikanUtama = false) {
        setProcessing(true);
        setErrors({});
        router.put(
            updateSigner.url(signer.id),
            {
                name,
                title,
                nip,
                is_primary: jadikanUtama || signer.is_primary,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditing(false),
                onError: (errs) => setErrors(errs),
                onFinish: () => setProcessing(false),
            },
        );
    }

    if (editing) {
        return (
            <div className="rounded-2xl border border-[#cddcef] bg-[#e8f2fe]/40 p-4">
                <div className="grid gap-2 sm:grid-cols-3">
                    <div>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Nama"
                            className={inputClass}
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-rose-600">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div>
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Jabatan"
                            className={inputClass}
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-rose-600">
                                {errors.title}
                            </p>
                        )}
                    </div>
                    <div>
                        <input
                            value={nip}
                            onChange={(event) => setNip(event.target.value)}
                            placeholder="NIP"
                            className={inputClass}
                        />
                        {errors.nip && (
                            <p className="mt-1 text-xs text-rose-600">
                                {errors.nip}
                            </p>
                        )}
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => simpan()}
                        disabled={processing || !name || !title || !nip}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#106feb] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
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
                            setName(signer.name);
                            setTitle(signer.title);
                            setNip(signer.nip);
                            setErrors({});
                            setEditing(false);
                        }}
                        className="cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                    >
                        Batal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#12213e]">
                    {signer.name}
                    {signer.is_primary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <Star className="size-3" /> Utama
                        </span>
                    )}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                    {signer.title} · NIP {signer.nip}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                {!signer.is_primary && (
                    <button
                        type="button"
                        onClick={() => simpan(true)}
                        disabled={processing}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#106feb] transition hover:bg-[#e8f2fe] disabled:opacity-50"
                    >
                        <Star className="size-4" /> Jadikan Utama
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                    <Pencil className="size-4" /> Edit
                </button>
                {!confirming ? (
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                        <Trash2 className="size-4" /> Hapus
                    </button>
                ) : (
                    <span className="inline-flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => {
                                setProcessing(true);
                                router.delete(destroySigner.url(signer.id), {
                                    preserveScroll: true,
                                    onFinish: () => setProcessing(false),
                                });
                            }}
                            className="cursor-pointer rounded-lg bg-rose-600 px-2.5 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                        >
                            Ya, hapus
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                        >
                            Batal
                        </button>
                    </span>
                )}
            </div>
        </div>
    );
}

function SignerSection({ signers }: { signers: Signer[] }) {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [nip, setNip] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function tambah() {
        setProcessing(true);
        setErrors({});
        router.post(
            storeSigner.url(),
            { name, title, nip, is_primary: signers.length === 0 },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setName('');
                    setTitle('');
                    setNip('');
                    setShowForm(false);
                },
                onError: (errs) => setErrors(errs),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[#12213e]">
                        <UserRoundPlus className="size-4 text-[#106feb]" />{' '}
                        Penandatangan
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Pejabat yang berhak menandatangani surat penerimaan &
                        sertifikat. Penandatangan <b>Utama</b> dipakai sebagai
                        pilihan bawaan saat menyetujui pengajuan.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm((value) => !value)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#106feb] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0b4fb0]"
                >
                    <Plus className="size-4" /> Tambah Penandatangan
                </button>
            </div>

            {showForm && (
                <div className="mt-4 rounded-2xl border border-[#cddcef] bg-[#e8f2fe]/40 p-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                        <div>
                            <input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Nama"
                                className={inputClass}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <input
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="Jabatan, mis. Kepala Dinas"
                                className={inputClass}
                            />
                            {errors.title && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.title}
                                </p>
                            )}
                        </div>
                        <div>
                            <input
                                value={nip}
                                onChange={(event) => setNip(event.target.value)}
                                placeholder="NIP"
                                className={inputClass}
                            />
                            {errors.nip && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.nip}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={tambah}
                        disabled={!name || !title || !nip || processing}
                        className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#106feb] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                    >
                        {processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Plus className="size-4" />
                        )}
                        Tambah
                    </button>
                </div>
            )}

            <div className="mt-4 space-y-3">
                {signers.map((signer) => (
                    <SignerRow key={signer.id} signer={signer} />
                ))}
                {signers.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                        <UserRoundPlus className="mx-auto size-10 text-slate-300" />
                        <p className="mt-2 text-sm font-semibold text-[#12213e]">
                            Belum ada penandatangan
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Pengajuan belum bisa disetujui sebelum ada
                            penandatangan.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

/* ---- Arsip dokumen bertanda tangan ----------------------------------- */
function ArsipSection({
    documents,
    cari,
}: {
    documents: SignedDocument[];
    cari: string;
}) {
    const [value, setValue] = useState(cari);

    function submit() {
        router.get(
            '/opd/surat',
            { cari: value },
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[#12213e]">
                        <FileSignature className="size-4 text-[#106feb]" />{' '}
                        Arsip Dokumen Bertanda Tangan
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Surat penerimaan & sertifikat yang sudah ditandatangani
                        dan diunggah.
                    </p>
                </div>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                    className="relative"
                >
                    <label htmlFor="cari-sk" className="sr-only">
                        Cari nomor SK
                    </label>
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                        id="cari-sk"
                        type="search"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder="Cari nomor SK…"
                        className="h-11 w-full rounded-xl border border-slate-300 pr-3 pl-9 text-sm outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15 sm:w-72"
                    />
                </form>
            </div>

            <div className="mt-4 space-y-3">
                {documents.map((document) => (
                    <div
                        key={document.key}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#12213e]">
                                <span
                                    className={
                                        document.type === 'acceptance'
                                            ? 'rounded-full bg-[#e8f2fe] px-2 py-0.5 text-[11px] font-semibold text-[#0b4fb0]'
                                            : 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700'
                                    }
                                >
                                    {document.type_label}
                                </span>
                                {document.participant}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                No. SK {document.sk_number ?? '—'} ·{' '}
                                {document.ticket_number}
                                {document.issued_at &&
                                    ' · ' +
                                        new Date(
                                            document.issued_at,
                                        ).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                            </p>
                        </div>
                        <a
                            href={document.download_url}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#106feb] ring-1 ring-[#cddcef] transition hover:bg-[#e8f2fe]"
                        >
                            <FileText className="size-4" /> Unduh
                        </a>
                    </div>
                ))}
                {documents.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                        <FileSignature className="mx-auto size-10 text-slate-300" />
                        <p className="mt-2 text-sm font-semibold text-[#12213e]">
                            {cari
                                ? 'Tidak ada dokumen yang cocok'
                                : 'Belum ada dokumen bertanda tangan'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {cari
                                ? 'Coba nomor SK lain, atau kosongkan pencarian.'
                                : 'Dokumen muncul di sini setelah diunggah dari menu Menunggu TTE / Perlu Sertifikat.'}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default function Surat({
    user,
    opd,
    signers,
    templates,
    placeholders,
    requiredPlaceholders,
    documents,
    filters,
}: Props) {
    // Buka langsung tab Arsip bila halaman diakses lewat pencarian nomor SK.
    const [tab, setTab] = useState<Tab>(filters.cari ? 'arsip' : 'data');
    const [type, setType] = useState<TemplateType>('acceptance');
    const [body, setBody] = useState(templates.acceptance);
    const [processing, setProcessing] = useState(false);
    const [templateError, setTemplateError] = useState<string | null>(null);

    const ringkasan = useMemo(() => {
        const kop = [
            opd.letterhead_address,
            opd.letterhead_phone,
            opd.letterhead_email,
        ].every((value) => (value ?? '').trim() !== '')
            ? 'Data Surat lengkap'
            : 'Data Surat belum lengkap';

        return `${kop} · ${signers.length} penandatangan · ${documents.length} dokumen ber-TTE`;
    }, [opd, signers.length, documents.length]);

    function changeType(next: TemplateType) {
        setType(next);
        setBody(templates[next]);
        setTemplateError(null);
    }

    function save() {
        setProcessing(true);
        setTemplateError(null);
        router.put(
            updateTemplate.url(),
            { type, body },
            {
                preserveScroll: true,
                onError: (errs) => setTemplateError(errs.body ?? null),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <MagangLayout
            user={user}
            title="Kelola Surat"
            active="surat"
            navItems={opdNav}
        >
            <Head title="Kelola Surat" />
            <div className="space-y-5">
                <div>
                    <h2 className="text-xl font-black text-[#12213e]">
                        Kelola Surat {opd.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{ringkasan}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {TABS.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            aria-pressed={tab === item.key}
                            onClick={() => setTab(item.key)}
                            className={tabClass(tab === item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {tab === 'data' && (
                    <div className="space-y-4">
                        <LetterheadSection opd={opd} />
                        <SignerSection signers={signers} />
                    </div>
                )}

                {tab === 'template' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => changeType('acceptance')}
                                className={tabClass(type === 'acceptance')}
                            >
                                Surat Penerimaan
                            </button>
                            <button
                                type="button"
                                onClick={() => changeType('certificate')}
                                className={tabClass(type === 'certificate')}
                            >
                                Sertifikat
                            </button>
                        </div>
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-semibold text-[#12213e]">
                                Placeholder tersedia
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Kop surat dan blok tanda tangan tidak diedit di
                                sini — keduanya diambil dari tab Data &
                                Penandatangan.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {placeholders.map((placeholder) => (
                                    <button
                                        type="button"
                                        key={placeholder}
                                        onClick={() =>
                                            setBody(
                                                (value) =>
                                                    value +
                                                    (value ? ' ' : '') +
                                                    placeholder,
                                            )
                                        }
                                        className="cursor-pointer rounded-full bg-[#e8f2fe] px-3 py-1 text-xs font-semibold text-[#106feb] transition hover:bg-[#cddcef]"
                                    >
                                        {placeholder}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-slate-500">
                                Wajib: {requiredPlaceholders[type].join(', ')}
                            </p>
                            <textarea
                                value={body}
                                onChange={(event) =>
                                    setBody(event.target.value)
                                }
                                rows={14}
                                className="mt-4 w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                            />
                            {templateError && (
                                <p className="mt-2 text-xs text-rose-600">
                                    {templateError}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={save}
                                disabled={processing}
                                className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#106feb] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                            >
                                {processing && (
                                    <Loader2 className="size-4 animate-spin" />
                                )}
                                Simpan Template
                            </button>
                        </section>
                    </div>
                )}

                {tab === 'arsip' && (
                    <ArsipSection documents={documents} cari={filters.cari} />
                )}
            </div>
        </MagangLayout>
    );
}
