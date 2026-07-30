import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { updateTemplate } from '@/actions/App/Http/Controllers/Opd/LetterController';
import MagangLayout, { opdNav } from '@/layouts/magang-layout';
import type { MagangUser, Opd } from '@/types/magang';

type TemplateType = 'acceptance' | 'certificate';

interface Props {
    user: MagangUser;
    opd: Opd;
    templates: Record<TemplateType, string>;
    placeholders: string[];
    requiredPlaceholders: Record<TemplateType, string[]>;
}

export default function Surat({
    user,
    opd,
    templates,
    placeholders,
    requiredPlaceholders,
}: Props) {
    const [type, setType] = useState<TemplateType>('acceptance');
    const [body, setBody] = useState(templates.acceptance);
    const [processing, setProcessing] = useState(false);

    function changeType(next: TemplateType) {
        setType(next);
        setBody(templates[next]);
    }
    function save() {
        setProcessing(true);
        router.put(
            updateTemplate.url(),
            { type, body },
            { preserveScroll: true, onFinish: () => setProcessing(false) },
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
                        Template Surat {opd.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Kop surat dan tanda tangan ditentukan dari Kelola OPD.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => changeType('acceptance')}
                        className={
                            type === 'acceptance'
                                ? 'rounded-xl bg-[#106feb] px-4 py-2 text-sm font-semibold text-white'
                                : 'rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200'
                        }
                    >
                        Surat Penerimaan
                    </button>
                    <button
                        type="button"
                        onClick={() => changeType('certificate')}
                        className={
                            type === 'certificate'
                                ? 'rounded-xl bg-[#106feb] px-4 py-2 text-sm font-semibold text-white'
                                : 'rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200'
                        }
                    >
                        Sertifikat
                    </button>
                </div>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-[#12213e]">
                        Placeholder tersedia
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
                                className="rounded-full bg-[#e8f2fe] px-3 py-1 text-xs font-semibold text-[#106feb]"
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
                        onChange={(event) => setBody(event.target.value)}
                        rows={14}
                        className="mt-4 w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15"
                    />
                    <button
                        type="button"
                        onClick={save}
                        disabled={processing}
                        className="mt-3 rounded-xl bg-[#106feb] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                        Simpan Template
                    </button>
                </section>
            </div>
        </MagangLayout>
    );
}
