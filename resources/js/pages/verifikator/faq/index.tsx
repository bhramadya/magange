import { Head, Link, router } from '@inertiajs/react';
import { HelpCircle, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import { cn } from '@/lib/utils';
import type { Faq, MagangUser } from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — KELOLA FAQ (verifikator/faq/index)
 *  CRUD FAQ yang tampil di landing page publik. Props dari FaqController@index:
 *  `faqs` (paginator Laravel). Default mock agar halaman tampil tanpa backend.
 * ========================================================================= */

interface Paginated<T> {
    data: T[];
}

interface FaqIndexProps {
    user?: MagangUser;
    faqs?: Paginated<Faq>;
}

const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Dewi Anggraini',
    email: 'verifikator@madiunkota.go.id',
    whatsapp_number: '6281234567890',
    role: 'admin_verifikator',
};

const MOCK_FAQS: Paginated<Faq> = {
    data: [
        {
            id: 1,
            question: 'Apa itu E-Magang Kota Madiun?',
            answer: 'Platform digital resmi untuk pendaftaran magang.',
            sort_order: 1,
            is_active: true,
        },
        {
            id: 2,
            question: 'Apakah pendaftaran dikenakan biaya?',
            answer: 'Tidak. Seluruh layanan gratis.',
            sort_order: 2,
            is_active: true,
        },
    ],
};

function DeleteButton({ faqId }: { faqId: number }) {
    const [confirming, setConfirming] = useState(false);
    const [processing, setProcessing] = useState(false);

    if (!confirming) {
        return (
            <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
                <Trash2 className="size-4" /> Hapus
            </button>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5">
            <button
                type="button"
                disabled={processing}
                onClick={() => {
                    setProcessing(true);
                    router.delete(`/verifikator/faq/${faqId}`, {
                        preserveScroll: true,
                        onFinish: () => setProcessing(false),
                    });
                }}
                className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
                Ya, hapus
            </button>
            <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
                Batal
            </button>
        </span>
    );
}

export default function FaqIndex({
    user = MOCK_USER,
    faqs = MOCK_FAQS,
}: FaqIndexProps) {
    return (
        <MagangLayout
            user={user}
            title="Kelola FAQ"
            active="faq"
            navItems={verifikatorNav}
        >
            <Head title="Kelola FAQ — Verifikator" />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#12213e]">
                            Kelola FAQ
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Pertanyaan yang tampil di halaman utama publik.
                        </p>
                    </div>
                    <Link
                        href="/verifikator/faq/create"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#106feb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b4fb0]"
                    >
                        <Plus className="size-4" /> Tambah FAQ
                    </Link>
                </div>

                <div className="space-y-3">
                    {faqs.data.map((faq) => (
                        <div
                            key={faq.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                                            #{faq.sort_order}
                                        </span>
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                                faq.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                    : 'bg-slate-50 text-slate-500 ring-slate-200',
                                            )}
                                        >
                                            {faq.is_active ? (
                                                <Eye className="size-3" />
                                            ) : (
                                                <EyeOff className="size-3" />
                                            )}
                                            {faq.is_active
                                                ? 'Aktif'
                                                : 'Nonaktif'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-[#12213e]">
                                        {faq.question}
                                    </p>
                                    <p className="line-clamp-2 text-xs text-slate-500">
                                        {faq.answer}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <Link
                                        href={`/verifikator/faq/${faq.id}/edit`}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#106feb] transition hover:bg-[#cddcef]/30"
                                    >
                                        <Pencil className="size-4" /> Edit
                                    </Link>
                                    <DeleteButton faqId={faq.id} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {faqs.data.length === 0 && (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <HelpCircle className="size-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">
                                Belum ada FAQ. Tambahkan yang pertama.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MagangLayout>
    );
}
