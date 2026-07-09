import type { LucideIcon } from 'lucide-react';

interface DetailRowProps {
    icon: LucideIcon;
    label: string;
    value: string | React.ReactNode;
}

export function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
    return (
        <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                <Icon className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {label}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[#0a1628]">
                    {value}
                </p>
            </div>
        </div>
    );
}
