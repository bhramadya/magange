import { Skeleton } from '@/components/ui/skeleton';

/* =========================================================================
 *  DASHBOARD SKELETON — komponen loading state untuk halaman-halaman dasbor.
 *  Dipakai saat data masih dimuat dari backend (Inertia deferred props).
 *  Setiap varian mewakili pola layout yang umum di dasbor Mahasiswa,
 *  Verifikator, dan OPD.
 * ========================================================================= */

/** Grid stat cards (4 kolom) — skeleton untuk StatCard. */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <Skeleton className="size-12 rounded-xl" />
                    <Skeleton className="mt-4 h-4 w-20" />
                    <Skeleton className="mt-1 h-8 w-32" />
                </div>
            ))}
        </div>
    );
}

/** Kartu detail — skeleton untuk SectionCard / panel detail. */
export function DetailCardSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-3 w-56" />
            <div className="mt-4 space-y-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="mt-0.5 h-4 w-48" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Tabel — skeleton untuk tabel daftar pengajuan (Verifikator/OPD). */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="flex gap-4 pb-3 border-b border-slate-100">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-4 py-3 border-b border-slate-50 last:border-0">
                    {Array.from({ length: cols }).map((_, c) => (
                        <Skeleton key={c} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

/** Timeline — skeleton untuk status timeline mahasiswa. */
export function TimelineSkeleton({ steps = 4 }: { steps?: number }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-3 w-56" />
            <div className="mt-6 space-y-6">
                {Array.from({ length: steps }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                        <Skeleton className="size-9 shrink-0 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="mt-1 h-3 w-48" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Halaman dasbor lengkap — skeleton cepat untuk seluruh halaman. */
export function DashboardPageSkeleton({
    showTimeline = true,
    tableRows,
}: {
    showTimeline?: boolean;
    tableRows?: number;
}) {
    return (
        <div className="space-y-6">
            <StatCardsSkeleton />
            <div className="grid gap-6 lg:grid-cols-3">
                <div className={`${showTimeline ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    {showTimeline ? (
                        <TimelineSkeleton />
                    ) : tableRows ? (
                        <TableSkeleton rows={tableRows} />
                    ) : (
                        <TableSkeleton />
                    )}
                </div>
                {showTimeline && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="mt-1 h-3 w-48" />
                            <Skeleton className="mt-4 h-24 w-full rounded-xl" />
                        </div>
                        <DetailCardSkeleton rows={3} />
                    </div>
                )}
            </div>
        </div>
    );
}
