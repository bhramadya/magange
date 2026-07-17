import { FileText, Paperclip } from 'lucide-react';
import type { InternshipApplication } from '@/types/magang';

/**
 * Daftar berkas pendukung pendaftaran (Surat Pengantar / CV / Portofolio)
 * untuk panel/dialog tinjau admin. Berkas bersifat opsional ("jika ada") —
 * hanya tautan yang tersedia yang dirender; bila tidak ada sama sekali,
 * tampil keterangan kosong. URL berasal dari route terproteksi
 * `pengajuan.dokumen` (disk privat), dibuka di tab baru.
 */
export function ApplicationDocuments({
    app,
}: {
    app: Pick<
        InternshipApplication,
        'surat_pengantar_url' | 'cv_url' | 'portfolio_url'
    >;
}) {
    const docs = [
        { label: 'Surat Pengantar', url: app.surat_pengantar_url },
        { label: 'CV', url: app.cv_url },
        { label: 'Portofolio', url: app.portfolio_url },
    ].filter((d): d is { label: string; url: string } => Boolean(d.url));

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <Paperclip className="size-3.5" /> Berkas Pendukung
            </p>
            {docs.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                    {docs.map((doc) => (
                        <a
                            key={doc.label}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#cddcef] bg-white px-3 py-1.5 text-xs font-semibold text-[#106feb] transition hover:bg-[#e8f2fe]"
                        >
                            <FileText className="size-3.5" /> {doc.label}
                        </a>
                    ))}
                </div>
            ) : (
                <p className="mt-1 text-sm text-slate-400">
                    Tidak ada berkas diunggah.
                </p>
            )}
        </div>
    );
}
