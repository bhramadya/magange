import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

/* =========================================================================
 *  DATE PICKER — kalender popover kustom (Indonesia locale).
 *  Klik di mana saja pada field → kalender muncul → pilih tanggal →
 *  kolom otomatis terisi (format Indonesia, mis. \"25 Juni 2026\").
 *  Nilai disimpan dalam ISO (yyyy-mm-dd); mendukung batas minimum (min).
 * ========================================================================= */

const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatTanggalID(iso: string) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${NAMA_BULAN[m - 1]} ${y}`;
}

interface DatePickerProps {
    value: string;
    onChange: (iso: string) => void;
    min?: string;
    placeholder?: string;
}

export function DatePicker({
    value,
    onChange,
    min,
    placeholder = 'Pilih tanggal',
}: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() =>
        value ? new Date(`${value}T00:00:00`) : new Date(),
    );
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function handlePointer(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', handlePointer);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayISO = toISODate(new Date());

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const goMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => {
                    if (!open && value) setViewDate(new Date(`${value}T00:00:00`));
                    setOpen((o) => !o);
                }}
                className={`flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3.5 text-left text-[15px] transition-all focus:ring-2 focus:ring-brand-hover focus:outline-none cursor-pointer ${
                    open ? 'border-transparent ring-2 ring-brand-hover' : 'border-slate-200'
                } ${value ? 'text-brand-ink' : 'text-brand-ink/40'}`}
            >
                <span>{value ? formatTanggalID(value) : placeholder}</span>
                <Calendar
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        open ? 'text-brand-hover' : 'text-brand-ink/40'
                    }`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute top-[calc(100%+8px)] left-0 z-30 w-[300px] rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_20px_50px_-12px_rgba(8,71,156,0.25)]"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => goMonth(-1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-ink/60 transition-colors hover:bg-brand-bg hover:text-brand-hover cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-[14px] font-semibold text-brand-ink">
                                {NAMA_BULAN[month]} {year}
                            </span>
                            <button
                                type="button"
                                onClick={() => goMonth(1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-ink/60 transition-colors hover:bg-brand-bg hover:text-brand-hover cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mb-1 grid grid-cols-7 gap-1">
                            {NAMA_HARI.map((h) => (
                                <span
                                    key={h}
                                    className="flex h-8 items-center justify-center text-[11px] font-semibold text-brand-ink/35 uppercase"
                                >
                                    {h}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {cells.map((d, i) => {
                                if (d === null) return <span key={`empty-${i}`} />;
                                const iso = toISODate(new Date(year, month, d));
                                const disabled = min ? iso < min : false;
                                const selected = iso === value;
                                const isToday = iso === todayISO;

                                return (
                                    <button
                                        key={iso}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                            onChange(iso);
                                            setOpen(false);
                                        }}
                                        className={`flex h-9 items-center justify-center rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                                            selected
                                                ? 'bg-brand-primary text-white shadow-sm'
                                                : disabled
                                                  ? 'cursor-not-allowed text-brand-ink/20'
                                                  : isToday
                                                    ? 'bg-brand-bg text-brand-hover hover:bg-[#e7f0fc]'
                                                    : 'text-brand-ink/70 hover:bg-brand-bg hover:text-brand-hover'
                                        }`}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
