import {
    PROGRESS_META,
    calcProgressPct,
    classifyProgress,
    progressA11y,
} from '@/lib/internship-progress';
import { cn } from '@/lib/utils';
import type { InternshipApplication } from '@/types/magang';

interface ProgressBarProps {
    app: Pick<InternshipApplication, 'start_date' | 'end_date' | 'status'>;
    refDate?: Date;
    className?: string;
}

/**
 * Batang progres masa magang dengan aksesibilitas (role="progressbar" +
 * aria-valuenow/min/max) dan label teks per state — bukan warna saja.
 */
export function ProgressBar({ app, refDate, className }: ProgressBarProps) {
    const pct = calcProgressPct(app, refDate);
    const state = classifyProgress(app, refDate);
    const meta = PROGRESS_META[state];
    const a11y = progressA11y(app, refDate);

    return (
        <div className={cn('space-y-1', className)}>
            <div className="flex items-center justify-between text-[11px] font-medium">
                <span className={meta.textClass}>{meta.label}</span>
                <span className="text-slate-400 tabular-nums">{pct}%</span>
            </div>
            <div
                role={a11y.role}
                aria-valuenow={a11y['aria-valuenow']}
                aria-valuemin={a11y['aria-valuemin']}
                aria-valuemax={a11y['aria-valuemax']}
                aria-label={a11y['aria-label']}
                className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
            >
                <div
                    className={cn('h-full rounded-full', meta.barClass)}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
