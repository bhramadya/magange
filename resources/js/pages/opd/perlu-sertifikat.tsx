import { Head, useForm } from '@inertiajs/react';
import type { ChangeEvent } from 'react';
import { StatusBadge } from '@/components/status-badge';
import MagangLayout, { opdNav } from '@/layouts/magang-layout';
import type {
    InternshipApplication,
    MagangUser,
    Opd,
    Signer,
} from '@/types/magang';

interface Props {
    user: MagangUser;
    opd: Opd;
    applications: InternshipApplication[];
    signers: Signer[];
}
export default function PerluSertifikat({
    user,
    applications,
    signers,
}: Props) {
    return (
        <MagangLayout
            user={user}
            title="Perlu Sertifikat"
            active="perlu-sertifikat"
            navItems={opdNav}
        >
            <Head title="Perlu Sertifikat" />
            <div className="space-y-4">
                <p className="text-sm text-slate-500">
                    Pilih penandatangan, buat draft, lalu unggah PDF yang telah
                    ditandatangani.
                </p>
                {applications.map((application) => (
                    <Row
                        key={application.id}
                        application={application}
                        signers={signers}
                    />
                ))}
            </div>
        </MagangLayout>
    );
}
function Row({
    application,
    signers,
}: {
    application: InternshipApplication;
    signers: Signer[];
}) {
    const { data, setData, post, processing } = useForm<{
        signer_id: string;
        file: File | null;
    }>({
        signer_id: String(
            signers.find((signer) => signer.is_primary)?.id ?? '',
        ),
        file: null,
    });
    function selectFile(event: ChangeEvent<HTMLInputElement>) {
        setData('file', event.target.files?.[0] ?? null);
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between gap-3">
                <div>
                    <p className="font-mono text-xs text-slate-400">
                        {application.ticket_number}
                    </p>
                    <h2 className="font-bold text-[#12213e]">
                        {application.applicant_name}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {application.start_date} – {application.end_date}
                    </p>
                </div>
                <StatusBadge status={application.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <select
                    value={data.signer_id}
                    onChange={(event) =>
                        setData('signer_id', event.target.value)
                    }
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                    <option value="">Pilih penandatangan</option>
                    {signers.map((signer) => (
                        <option key={signer.id} value={signer.id}>
                            {signer.title} — {signer.name}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    disabled={!data.signer_id || processing}
                    onClick={() =>
                        post(
                            '/opd/perlu-sertifikat/' +
                                application.id +
                                '/draft',
                        )
                    }
                    className="rounded-xl border border-[#106feb] px-3 py-2 text-sm font-semibold text-[#106feb]"
                >
                    Buat Draft
                </button>
                <a
                    href={'/opd/perlu-sertifikat/' + application.id + '/draft'}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                >
                    Download Draft
                </a>
                <label className="cursor-pointer rounded-xl bg-[#106feb] px-3 py-2 text-sm font-semibold text-white">
                    Pilih PDF
                    <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={selectFile}
                    />
                </label>
                <button
                    type="button"
                    disabled={!data.file || processing}
                    onClick={() =>
                        post(
                            '/opd/perlu-sertifikat/' +
                                application.id +
                                '/unggah',
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
