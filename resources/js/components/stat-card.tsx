import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: number | string;
    trend?: string;
    trendUp?: boolean;
}

export function StatCard({ icon: Icon, label, value, trend, trendUp }: StatCardProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl bg-[#cddcef]/50 text-[#106feb]">
                    <Icon className="size-6" />
                </span>
                {trend && (
                    <span className={`text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-[#0a1628]">{value}</p>
        </div>
    );
}
