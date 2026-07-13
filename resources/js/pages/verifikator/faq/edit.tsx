import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import MagangLayout, { verifikatorNav } from '@/layouts/magang-layout';
import type { Faq, MagangUser } from '@/types/magang';

/* =========================================================================
 *  VERIFIKATOR — EDIT FAQ (verifikator/faq/edit)
 *  Prefilled dari prop `faq` → PUT verifikator.faq.update.
 * ========================================================================= */

interface FaqEditProps {
    user?: MagangUser;
    faq: Faq;
}

const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Dewi Anggraini',
    email: 'verifikator@madiunkota.go.id',
    whatsapp_number: '6281234567890',
    role: 'admin_verifikator',
};

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#12213e] placeholder:text-slate-400 focus:border-[#106feb] focus:outline-none focus:ring-2 focus:ring-[#106feb]/15';

export default function FaqEdit({ user = MOCK_USER, faq }: FaqEditProps) {
    const { data, setData, put, processing, errors } = useForm<{
        question: string;
        answer: string;
        sort_order: number;
        is_active: boolean;
    }>({
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sort_order,
        is_active: faq.is_active,
    });

    return (
        <MagangLayout
            user={user}
            title="Edit FAQ"
            active="faq"
            navItems={verifikatorNav}
        >
            <Head title="Edit FAQ — Verifikator" />

            <div className="mx-auto max-w-2xl space-y-6">
                <Link
                    href="/verifikator/faq"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#106feb]"
                >
                    <ArrowLeft className="size-4" /> Kembali ke daftar
                </Link>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-black text-[#12213e]">
                        Edit FAQ
                    </h2>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            put(`/verifikator/faq/${faq.id}`);
                        }}
                        className="mt-5 space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="question"
                                className="text-sm font-medium text-[#12213e]"
                            >
                                Pertanyaan
                            </label>
                            <input
                                id="question"
                                type="text"
                                value={data.question}
                                onChange={(e) =>
                                    setData('question', e.target.value)
                                }
                                className={`mt-1.5 ${inputClass}`}
                            />
                            {errors.question && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.question}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="answer"
                                className="text-sm font-medium text-[#12213e]"
                            >
                                Jawaban
                            </label>
                            <textarea
                                id="answer"
                                rows={5}
                                value={data.answer}
                                onChange={(e) =>
                                    setData('answer', e.target.value)
                                }
                                className={`mt-1.5 resize-none ${inputClass}`}
                            />
                            {errors.answer && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.answer}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="sort_order"
                                    className="text-sm font-medium text-[#12213e]"
                                >
                                    Urutan tampil
                                </label>
                                <input
                                    id="sort_order"
                                    type="number"
                                    min={0}
                                    value={data.sort_order}
                                    onChange={(e) =>
                                        setData(
                                            'sort_order',
                                            Number(e.target.value),
                                        )
                                    }
                                    className={`mt-1.5 ${inputClass}`}
                                />
                                {errors.sort_order && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {errors.sort_order}
                                    </p>
                                )}
                            </div>
                            <label className="flex cursor-pointer items-center gap-2.5 sm:mt-7">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) =>
                                        setData('is_active', e.target.checked)
                                    }
                                    className="size-4 rounded border-slate-300 text-[#106feb] focus:ring-[#106feb]"
                                />
                                <span className="text-sm text-slate-600">
                                    Tampilkan di halaman utama
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#106feb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b4fb0] disabled:opacity-50"
                            >
                                {processing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Save className="size-4" />
                                )}
                                Simpan Perubahan
                            </button>
                            <Link
                                href="/verifikator/faq"
                                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                            >
                                Batal
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </MagangLayout>
    );
}
