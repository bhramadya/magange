import { STATUS_META  } from '@/types/magang';
import type {ApplicationStatus} from '@/types/magang';

interface StatusBadgeProps {
    status: ApplicationStatus;
    className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const { label, tone } = STATUS_META[status];

    const toneClasses = {
        amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
        violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
        slate: 'bg-slate-50 text-slate-700 ring-slate-600/20',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]} ${className}`}
        >
            <span className={`size-1.5 rounded-full ${tone === 'amber' ? 'bg-amber-500' : tone === 'blue' ? 'bg-blue-500' : tone === 'emerald' ? 'bg-emerald-500' : tone === 'rose' ? 'bg-rose-500' : tone === 'violet' ? 'bg-violet-500' : 'bg-slate-500'}`} />
            {label}
        </span>
    );
}
