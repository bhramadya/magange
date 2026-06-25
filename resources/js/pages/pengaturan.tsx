import { Head, Link } from '@inertiajs/react';
import {
    User,
    Bell,
    Palette,
    ShieldCheck,
    Save,
    Sun,
    Moon,
    Monitor,
    LogOut,
    Check,
    Building2,
    GraduationCap,
    Phone,
    Mail,
    Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import type { MagangNavItem } from '@/layouts/magang-layout';
import MagangLayout, { mahasiswaNav, verifikatorNav, opdNav } from '@/layouts/magang-layout';
import type { MagangUser, UserRole } from '@/types/magang';

/* =========================================================================
 *  PENGATURAN (PENGATURAN)
 *  Halaman bersama untuk semua role (Mahasiswa / Verifikator / OPD). Navigasi
 *  sidebar & field profil menyesuaikan role pengguna. Login memakai OTP via
 *  email, jadi tidak ada manajemen kata sandi — keamanan berpusat pada email.
 *
 *  Frontend-only: render penuh dengan mock default. Rekan backend cukup
 *  mengirim prop `user` lalu mengganti handler simpan dengan:
 *    router.patch('/pengaturan/profil',    { name, whatsapp_number, ...extra })
 *    router.patch('/pengaturan/notifikasi', { email_status, reminder_laporan, ringkasan })
 * ========================================================================= */

interface PengaturanProps {
    user?: MagangUser;
}

// ---- Mock untuk pengembangan frontend (dihapus saat props backend tersedia) ----
const MOCK_USER: MagangUser = {
    id: 1,
    name: 'Rangga Saputra',
    email: 'rangga.saputra@example.com',
    whatsapp_number: '081234567890',
    role: 'mahasiswa',
};

// Navigasi sidebar mengikuti role pengguna yang sedang login.
const NAV_BY_ROLE: Record<UserRole, MagangNavItem[]> = {
    mahasiswa: mahasiswaNav,
    admin_verifikator: verifikatorNav,
    admin_opd: opdNav,
};

const ROLE_LABEL: Record<UserRole, string> = {
    mahasiswa: 'Peserta Magang',
    admin_verifikator: 'Admin Verifikator',
    admin_opd: 'Admin OPD',
};

/* ------------------------- field profil per-role -------------------------- */

interface ExtraField {
    key: string;
    label: string;
    icon: LucideIcon;
    placeholder: string;
    value: string;
}

// Field tambahan di luar nama/email/WhatsApp, berbeda tiap role.
const EXTRA_FIELDS: Record<UserRole, ExtraField[]> = {
    mahasiswa: [
        { key: 'institution', label: 'Asal Instansi', icon: Building2, placeholder: 'Universitas / Sekolah', value: 'Universitas Negeri Madiun' },
        { key: 'major', label: 'Program Studi / Jurusan', icon: GraduationCap, placeholder: 'Jurusan', value: 'Teknik Informatika' },
    ],
    admin_verifikator: [
        { key: 'position', label: 'Jabatan', icon: Briefcase, placeholder: 'Jabatan', value: 'Staf Verifikasi' },
        { key: 'unit', label: 'Unit Kerja', icon: Building2, placeholder: 'Unit kerja', value: 'Dinas Kominfo Kota Madiun' },
    ],
    admin_opd: [
        { key: 'position', label: 'Jabatan', icon: Briefcase, placeholder: 'Jabatan', value: 'Kepala Sub Bagian' },
        { key: 'opd', label: 'OPD', icon: Building2, placeholder: 'Organisasi Perangkat Daerah', value: 'Dinas Komunikasi dan Informatika' },
    ],
};

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

/* ------------------------------- komponen UI ------------------------------ */

// Kartu seksi dengan judul + ikon.
function SectionCard({
    icon: Icon,
    title,
    desc,
    children,
}: {
    icon: LucideIcon;
    title: string;
    desc: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#cddcef]/50 text-[#106feb]">
                    <Icon className="size-5" />
                </span>
                <div>
                    <h2 className="text-base font-bold text-[#12213e]">{title}</h2>
                    <p className="text-sm text-slate-500">{desc}</p>
                </div>
            </div>
            <div className="mt-5">{children}</div>
        </section>
    );
}

// Toggle on/off (pengganti shadcn switch yang belum tersedia).
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                checked ? 'bg-[#106feb]' : 'bg-slate-300'
            }`}
        >
            <span
                className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                    checked ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}

// Baris field berlabel ikon.
function Field({
    icon: Icon,
    label,
    children,
}: {
    icon: LucideIcon;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Icon className="size-3.5" />
                {label}
            </Label>
            {children}
        </div>
    );
}

interface ThemeOption {
    value: Appearance;
    label: string;
    icon: LucideIcon;
}

const THEME_OPTIONS: ThemeOption[] = [
    { value: 'light', label: 'Terang', icon: Sun },
    { value: 'dark', label: 'Gelap', icon: Moon },
    { value: 'system', label: 'Sistem', icon: Monitor },
];

/* --------------------------------- halaman -------------------------------- */

export default function Pengaturan({ user = MOCK_USER }: PengaturanProps) {
    const navItems = NAV_BY_ROLE[user.role] ?? mahasiswaNav;
    const { appearance, updateAppearance } = useAppearance();

    // ---- state profil (mock; backend mengganti dengan data asli) ----
    const [name, setName] = useState(user.name);
    const [whatsapp, setWhatsapp] = useState(user.whatsapp_number ?? '');
    const [extra, setExtra] = useState<Record<string, string>>(() =>
        Object.fromEntries(EXTRA_FIELDS[user.role].map((f) => [f.key, f.value])),
    );
    const [savingProfile, setSavingProfile] = useState(false);

    // ---- state notifikasi (mock) ----
    const [notifEmailStatus, setNotifEmailStatus] = useState(true);
    const [notifReminder, setNotifReminder] = useState(true);
    const [notifRingkasan, setNotifRingkasan] = useState(false);

    function saveProfile() {
        setSavingProfile(true);
        // TODO(backend): router.patch('/pengaturan/profil', { name, whatsapp_number: whatsapp, ...extra }, { onFinish })
        setTimeout(() => {
            setSavingProfile(false);
            toast.success('Profil berhasil diperbarui.');
        }, 800);
    }

    function saveNotif(next: { email?: boolean; reminder?: boolean; ringkasan?: boolean }) {
        // TODO(backend): router.patch('/pengaturan/notifikasi', { email_status, reminder_laporan, ringkasan })
        if (next.email !== undefined) {
setNotifEmailStatus(next.email);
}

        if (next.reminder !== undefined) {
setNotifReminder(next.reminder);
}

        if (next.ringkasan !== undefined) {
setNotifRingkasan(next.ringkasan);
}

        toast.success('Preferensi notifikasi disimpan.');
    }

    return (
        <MagangLayout user={user} title="Pengaturan" active="pengaturan" navItems={navItems}>
            <Head title="Pengaturan" />

            <div className="space-y-6">
                {/* ===== Hero ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#106feb] to-[#0b4fb0] p-6 text-white sm:p-8"
                >
                    <div className="flex items-center gap-4">
                        <span className="flex size-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black backdrop-blur">
                            {initials(user.name)}
                        </span>
                        <div>
                            <h1 className="text-xl font-black sm:text-2xl">{user.name}</h1>
                            <p className="text-sm text-white/80">
                                {ROLE_LABEL[user.role]} &middot; {user.email}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* ===== Profil ===== */}
                <SectionCard icon={User} title="Profil" desc="Perbarui informasi data diri Anda.">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field icon={User} label="Nama Lengkap">
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
                        </Field>

                        <Field icon={Mail} label="Email">
                            <Input
                                value={user.email}
                                readOnly
                                disabled
                                className="cursor-not-allowed bg-slate-50 text-slate-500"
                            />
                        </Field>

                        <Field icon={Phone} label="No. WhatsApp">
                            <Input
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="08xxxxxxxxxx"
                                inputMode="numeric"
                            />
                        </Field>

                        {EXTRA_FIELDS[user.role].map((f) => (
                            <Field key={f.key} icon={f.icon} label={f.label}>
                                <Input
                                    value={extra[f.key] ?? ''}
                                    onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))}
                                    placeholder={f.placeholder}
                                />
                            </Field>
                        ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-400">Email tidak dapat diubah karena dipakai untuk login OTP.</p>
                        <Button
                            onClick={saveProfile}
                            disabled={savingProfile}
                            className="bg-[#106feb] hover:bg-[#0b4fb0]"
                        >
                            <Save className="size-4" />
                            {savingProfile ? 'Menyimpan…' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </SectionCard>

                {/* ===== Tampilan ===== */}
                <SectionCard icon={Palette} title="Tampilan" desc="Pilih tema antarmuka sesuai kenyamanan Anda.">
                    <div className="grid gap-3 sm:grid-cols-3">
                        {THEME_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = appearance === opt.value;

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => updateAppearance(opt.value)}
                                    className={`relative flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                                        isActive
                                            ? 'border-[#106feb] bg-[#cddcef]/30'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <span
                                        className={`flex size-9 items-center justify-center rounded-lg ${
                                            isActive ? 'bg-[#106feb] text-white' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <Icon className="size-[18px]" />
                                    </span>
                                    <span className="text-sm font-semibold text-[#12213e]">{opt.label}</span>
                                    {isActive && <Check className="ml-auto size-4 text-[#106feb]" />}
                                </button>
                            );
                        })}
                    </div>
                </SectionCard>

                {/* ===== Notifikasi ===== */}
                <SectionCard icon={Bell} title="Notifikasi" desc="Atur pemberitahuan yang ingin Anda terima.">
                    <div className="divide-y divide-slate-100">
                        <NotifRow
                            title="Status pengajuan via email"
                            desc="Kabar saat pengajuan diverifikasi, diteruskan, disetujui, atau ditolak."
                            checked={notifEmailStatus}
                            onChange={(v) => saveNotif({ email: v })}
                        />
                        <NotifRow
                            title="Pengingat laporan akhir"
                            desc="Ingatkan saya menjelang batas akhir pengunggahan laporan."
                            checked={notifReminder}
                            onChange={(v) => saveNotif({ reminder: v })}
                        />
                        <NotifRow
                            title="Ringkasan mingguan"
                            desc="Rangkuman aktivitas akun dikirim setiap pekan."
                            checked={notifRingkasan}
                            onChange={(v) => saveNotif({ ringkasan: v })}
                        />
                    </div>
                </SectionCard>

                {/* ===== Keamanan & Akun ===== */}
                <SectionCard icon={ShieldCheck} title="Keamanan & Akun" desc="Login akun ini menggunakan kode OTP via email.">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                <ShieldCheck className="size-5" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-[#12213e]">Login tanpa kata sandi</p>
                                <p className="text-xs text-slate-500">
                                    Kode verifikasi dikirim ke <span className="font-medium">{user.email}</span> setiap masuk.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-400">Keluar dari sesi pada perangkat ini.</p>
                        <Button asChild variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                            <Link href="/logout" method="post" as="button">
                                <LogOut className="size-4" />
                                Keluar
                            </Link>
                        </Button>
                    </div>
                </SectionCard>
            </div>
        </MagangLayout>
    );
}

// Baris pengaturan notifikasi dengan toggle.
function NotifRow({
    title,
    desc,
    checked,
    onChange,
}: {
    title: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
            <div>
                <p className="text-sm font-semibold text-[#12213e]">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
            <Toggle checked={checked} onChange={onChange} label={title} />
        </div>
    );
}
