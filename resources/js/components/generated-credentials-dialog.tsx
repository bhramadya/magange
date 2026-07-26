import { usePage } from '@inertiajs/react';
import { Check, Copy, KeyRound, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useClipboard } from '@/hooks/use-clipboard';

/**
 * Dialog kredensial akun hasil auto-generate (Kelola OPD / Kelola Admin).
 * Backend mengirim flash `generatedCredentials: { username, password }`
 * setelah store/reset-password — password plaintext hanya muncul SEKALI di
 * flash ini, jadi dialog menyediakan tombol salin dan peringatan simpan.
 * Pengguna baru dipaksa mengganti password saat login pertama.
 */
export interface GeneratedCredentials {
    username: string;
    password: string;
}

function CopyField({ label, value }: { label: string; value: string }) {
    const [, copy] = useClipboard();
    const [copied, setCopied] = useState(false);

    return (
        <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {label}
            </p>
            <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-[#12213e]">
                    {value}
                </code>
                <button
                    type="button"
                    onClick={() => {
                        void copy(value).then((ok) => {
                            if (ok) {
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }
                        });
                    }}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-[#106feb] hover:text-[#106feb]"
                    title={`Salin ${label}`}
                >
                    {copied ? (
                        <Check className="size-4 text-emerald-600" />
                    ) : (
                        <Copy className="size-4" />
                    )}
                </button>
            </div>
        </div>
    );
}

export function GeneratedCredentialsDialog() {
    // Flash prop dari backend (store / reset-password akun OPD & admin).
    const credentials = (
        usePage().props as {
            generatedCredentials?: GeneratedCredentials | null;
        }
    ).generatedCredentials;

    // Dialog dibuka saat flash hadir; ditutup manual oleh pengguna.
    const [dismissed, setDismissed] = useState(false);
    // Reset dismissed bila kredensial baru datang (pola adjust-during-render).
    const [prev, setPrev] = useState(credentials);

    if (credentials !== prev) {
        setPrev(credentials);
        setDismissed(false);
    }

    const open = Boolean(credentials) && !dismissed;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && setDismissed(true)}>
            <DialogContent className="bg-white text-[#0a1628] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#0a1628]">
                        <KeyRound className="size-5 text-[#106feb]" />
                        Kredensial Akun Dibuat
                    </DialogTitle>
                    <DialogDescription>
                        Bagikan kredensial ini kepada pemilik akun. Password
                        hanya ditampilkan <strong>sekali</strong> — salin dan
                        simpan sekarang.
                    </DialogDescription>
                </DialogHeader>

                {credentials && (
                    <div className="space-y-4">
                        <CopyField
                            label="Username"
                            value={credentials.username}
                        />
                        <CopyField
                            label="Password"
                            value={credentials.password}
                        />

                        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                            <p className="text-xs leading-relaxed text-amber-800">
                                Saat login pertama, pemilik akun akan diminta
                                mengganti password ini dengan password baru
                                miliknya sendiri.
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
