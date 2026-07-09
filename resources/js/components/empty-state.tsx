import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Icon className="size-8" />
            </div>
            <h3 className="text-lg font-semibold text-[#0a1628]">{title}</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
                {description}
            </p>
            {actionLabel && actionHref && (
                <Button
                    asChild
                    className="mt-6 bg-[#106feb] hover:bg-[#0b4fb0]"
                >
                    <Link href={actionHref}>{actionLabel}</Link>
                </Button>
            )}
        </div>
    );
}
