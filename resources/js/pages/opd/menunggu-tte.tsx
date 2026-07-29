import { Head, useForm } from '@inertiajs/react';
import type { ChangeEvent } from 'react';
import { StatusBadge } from '@/components/status-badge';
import MagangLayout, { opdNav } from '@/layouts/magang-layout';
import type { InternshipApplication, MagangUser, Opd } from '@/types/magang';
interface Props {
    user: MagangUser;
    opd: Opd;
    applications: InternshipApplication[];
}
export default function MenungguTte({ user, applications }: Props) {
    return (
        <MagangLayout
            user={user}
            title="Menunggu TTE"
            active="menunggu-tte"
            navItems={opdNav}
        >
            <Head title="Menunggu TTE" />
            <div className="space-y-4">
                <p className="text-sm text-slate-500">
                    Unduh draft, tanda tangani di luar sistem, lalu unggah PDF.
                    Email akan dikirim otomatis.
                </p>
                {applications.map((application) => (
                    <Row key={application.id} application={application} />
                ))}
            </div>
        </MagangLayout>
    );
}
function Row({ application }: { application: InternshipApplication }) {
    const { data, setData, post, processing } = useForm<{ file: File | null }>({
        file: null,
    });
    function upload(event: ChangeEvent<HTMLInputElement>) {
        setData('file', event.target.files?.[0] ?? null);
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-3">
                <div>
                    <p className="font-mono text-xs text-slate-400">
                        {application.ticket_number}
                    </p>
                    <h2 className="font-bold text-[#12213e]">
                        {application.applicant_name}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {application.institution_name}
                    </p>
                </div>
                <StatusBadge status={application.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <a
                    href={'/opd/menunggu-tte/' + application.id + '/draft'}
                    className="rounded-xl border border-[#106feb] px-3 py-2 text-sm font-semibold text-[#106feb]"
                >
                    Download Surat Penerimaan
                </a>
                <label className="cursor-pointer rounded-xl bg-[#106feb] px-3 py-2 text-sm font-semibold text-white">
                    Pilih PDF
                    <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={upload}
                    />
                </label>
                <button
                    type="button"
                    disabled={!data.file || processing}
                    onClick={() =>
                        post(
                            '/opd/menunggu-tte/' + application.id + '/unggah',
                            { forceFormData: true },
                        )
                    }
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                    Unggah
                </button>
            </div>
        </div>
    );
}
