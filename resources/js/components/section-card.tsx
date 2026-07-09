import type { LucideIcon } from 'lucide-react';

interface SectionCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    children: React.ReactNode;
}

export function SectionCard({
    icon: Icon,
    title,
    description,
    children,
}: SectionCardProps) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#cddcef]/50 text-[#106feb]">
                    <Icon className="size-5" />
                </span>
                <div>
                    <h2 className="text-base font-bold text-[#0a1628]">
                        {title}
                    </h2>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
            </div>
            <div className="mt-6">{children}</div>
        </section>
    );
}
