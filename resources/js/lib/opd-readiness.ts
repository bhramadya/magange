import type { Opd, Signer } from '@/types/magang';

/**
 * Cermin frontend dari gate `ApproveApplicationRequest::after()`: sebuah OPD
 * baru boleh menyetujui pengajuan bila sudah punya penandatangan DAN Data
 * Surat (alamat/telepon/pos-el) lengkap. Dipakai bersama oleh dasbor OPD dan
 * halaman Perlu Keputusan supaya aturannya tidak bercabang di dua tempat.
 */
export interface OpdReadiness {
    ready: boolean;
    missing: string[];
}

export function opdReadiness(opd: Opd, signers: Signer[]): OpdReadiness {
    const missing: string[] = [];

    if (signers.length === 0) {
        missing.push('Penandatangan');
    }

    const letterheadLengkap = [
        opd.letterhead_address,
        opd.letterhead_phone,
        opd.letterhead_email,
    ].every((value) => (value ?? '').trim() !== '');

    if (!letterheadLengkap) {
        missing.push('Data Surat');
    }

    return { ready: missing.length === 0, missing };
}
