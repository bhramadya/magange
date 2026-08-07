import type { InternshipApplication } from '@/types/magang';

/**
 * Klasifikasi progres masa magang berdasar periode start–end terhadap tanggal
 * acuan (default: hari ini). Dipakai bersama oleh dasbor OPD, halaman Kelola
 * Peserta, dasbor Mahasiswa, dan dasbor Verifikator supaya aturannya tidak
 * bercabang di empat tempat.
 *
 * Prioritas klasifikasi:
 *   1. status completed            → `selesai`
 *   2. end < hari ini & status masih ongoing → `lewat_batas` (cron belum jalan)
 *   3. start > hari ini            → `belum_mulai`
 *   4. selebihnya                  → `aktif`
 */
export type ProgressState = 'belum_mulai' | 'aktif' | 'selesai' | 'lewat_batas';

export function classifyProgress(
    app: Pick<InternshipApplication, 'start_date' | 'end_date' | 'status'>,
    now = new Date(),
): ProgressState {
    if (app.status === 'completed') {
        return 'selesai';
    }

    const start = new Date(app.start_date).getTime();
    const end = new Date(app.end_date).getTime();
    const ts = now.getTime();

    if (ts > end) {
        return 'lewat_batas';
    }

    if (ts < start) {
        return 'belum_mulai';
    }

    return 'aktif';
}

/**
 * Persentase progres berdasar hari yang sudah lewat terhadap total periode.
 * Selesai → 100; belum mulai → 0; lewat batas → cap 100.
 */
export function calcProgressPct(
    app: Pick<InternshipApplication, 'start_date' | 'end_date' | 'status'>,
    now = new Date(),
): number {
    if (app.status === 'completed') {
        return 100;
    }

    const start = new Date(app.start_date).getTime();
    const end = new Date(app.end_date).getTime();
    const ts = now.getTime();

    if (ts <= start) {
        return 0;
    }

    if (ts >= end) {
        return 100;
    }

    return Math.round(((ts - start) / (end - start)) * 100);
}

export interface ProgressMeta {
    label: string;
    barClass: string;
    textClass: string;
}

/**
 * Metadata tampilan per state. Warna mengikuti permintaan mentor; label teks
 * (bukan warna saja) untuk aksesibilitas.
 */
export const PROGRESS_META: Record<ProgressState, ProgressMeta> = {
    belum_mulai: {
        label: 'Belum mulai',
        barClass: 'bg-slate-400',
        textClass: 'text-slate-500',
    },
    aktif: {
        label: 'Sedang berlangsung',
        barClass: 'bg-[#106feb]',
        textClass: 'text-[#106feb]',
    },
    selesai: {
        label: 'Selesai',
        barClass: 'bg-emerald-500',
        textClass: 'text-emerald-600',
    },
    lewat_batas: {
        label: 'Lewat batas',
        barClass: 'bg-rose-500',
        textClass: 'text-rose-600',
    },
};

/**
 * Atribut ARIA untuk progressbar: role + value + label teks (bukan warna
 * saja) supaya status terbaca pembaca layar.
 */
export function progressA11y(
    app: Pick<InternshipApplication, 'start_date' | 'end_date' | 'status'>,
    now = new Date(),
): {
    role: string;
    'aria-valuenow': number;
    'aria-valuemin': number;
    'aria-valuemax': number;
    'aria-label': string;
} {
    const state = classifyProgress(app, now);
    const value = calcProgressPct(app, now);

    return {
        role: 'progressbar',
        'aria-valuenow': value,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': `Progres magang: ${PROGRESS_META[state].label} (${value} persen)`,
    };
}
