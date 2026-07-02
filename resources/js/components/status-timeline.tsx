import { CheckCircle2, Clock, Send, FileCheck, Award, XCircle } from 'lucide-react';
import type { ApplicationStatus } from '@/types/magang';

const TIMELINE_STEPS = [
    { key: 'pending_verifikator', label: 'Menunggu Verifikasi', icon: Clock },
    { key: 'forwarded_opd', label: 'Diteruskan ke OPD', icon: Send },
    { key: 'approved', label: 'Disetujui OPD', icon: CheckCircle2 },
    { key: 'ongoing', label: 'Sedang Magang', icon: FileCheck },
    { key: 'completion_submitted', label: 'Penyelesaian Diajukan', icon: FileCheck },
    { key: 'completed', label: 'Selesai', icon: Award },
] as const;

const STEP_INDEX: Record<ApplicationStatus, number> = {
    pending_verifikator: 0,
    forwarded_opd: 1,
    approved: 2,
    ongoing: 3,
    completion_submitted: 4,
    completed: 5,
    rejected: -1,
};

interface StatusTimelineProps {
    currentStatus: ApplicationStatus;
    className?: string;
}

export function StatusTimeline({ currentStatus, className = '' }: StatusTimelineProps) {
    if (currentStatus === 'rejected') {
        return (
            <div className={`flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 ${className}`}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <XCircle className="size-5" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-rose-900">Pengajuan Ditolak</p>
                    <p className="text-xs text-rose-700">Proses tidak dapat dilanjutkan.</p>
                </div>
            </div>
        );
    }

    const currentIndex = STEP_INDEX[currentStatus];

    return (
        <div className={`space-y-4 ${className}`}>
            {TIMELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx < currentIndex;
                const isActive = idx === currentIndex;

                return (
                    <div key={step.key} className="flex items-start gap-4">
                        <div className="relative flex flex-col items-center">
                            <span
                                className={`flex size-10 items-center justify-center rounded-full ring-4 ring-white ${
                                    isDone
                                        ? 'bg-emerald-500 text-white'
                                        : isActive
                                          ? 'bg-[#106feb] text-white'
                                          : 'bg-slate-100 text-slate-400'
                                }`}
                            >
                                <Icon className="size-5" />
                            </span>
                            {idx < TIMELINE_STEPS.length - 1 && (
                                <div
                                    className={`mt-2 h-12 w-0.5 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`}
                                />
                            )}
                        </div>
                        <div className="flex-1 pt-1">
                            <p className={`text-sm font-semibold ${isActive ? 'text-[#106feb]' : isDone ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {step.label}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
