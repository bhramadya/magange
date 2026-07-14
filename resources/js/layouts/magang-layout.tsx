import { Link } from '@inertiajs/react';
import {
    LayoutDashboard,
    FileText,
    Award,
    HelpCircle,
    Menu,
    LogOut,
    ChevronDown,
    Inbox,
    History,
    ClipboardCheck,
    Users,
    Ticket,
    ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { MagangUser } from '@/types/magang';

/* =========================================================================
 *  MAGANG LAYOUT
 *  Shell dasbor branded Pemkot Madiun (biru #106feb). Reusable untuk dasbor
 *  Mahasiswa / Verifikator / OPD — cukup ganti `navItems`.
 * ========================================================================= */

export interface MagangNavItem {
    key: string;
    title: string;
    href: string;
    icon: LucideIcon;
}

// Navigasi default untuk role Mahasiswa.
// Menu "Pengaturan" dihilangkan sepenuhnya (revisi mentor) agar tak rancu
// mengubah data profil sendiri — berlaku untuk semua role.
export const mahasiswaNav: MagangNavItem[] = [
    {
        key: 'dashboard',
        title: 'Dasbor',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        key: 'pengajuan',
        title: 'Pengajuan Saya',
        href: '/pengajuan',
        icon: FileText,
    },
    {
        key: 'penyelesaian',
        title: 'Penyelesaian',
        href: '/penyelesaian',
        icon: Award,
    },
    // `?role=` menandai peran saat pratinjau (belum ada auth) supaya halaman
    // Bantuan bersama menampilkan sidebar peran yang benar — lihat bantuan.tsx.
    {
        key: 'bantuan',
        title: 'Bantuan',
        href: '/bantuan?role=mahasiswa',
        icon: HelpCircle,
    },
    {
        key: 'lacak-publik',
        title: 'Lacak Status Publik',
        href: '/lacak',
        icon: Ticket,
    },
];

// Navigasi untuk role Admin Verifikator. Menu "Pengaturan" dihilangkan (lihat
// catatan di atas) — sama seperti mahasiswa & OPD.
export const verifikatorNav: MagangNavItem[] = [
    {
        key: 'dashboard',
        title: 'Dasbor',
        href: '/verifikator',
        icon: LayoutDashboard,
    },
    {
        key: 'masuk',
        title: 'Pengajuan Masuk',
        href: '/verifikator/masuk',
        icon: Inbox,
    },
    {
        key: 'laporan',
        title: 'Laporan',
        href: '/verifikator/laporan',
        icon: FileText,
    },
    {
        key: 'riwayat',
        title: 'Riwayat',
        href: '/verifikator/riwayat',
        icon: History,
    },
    {
        key: 'kuota',
        title: 'Kelola Kuota OPD',
        href: '/verifikator/kuota',
        icon: Users,
    },
    {
        key: 'faq',
        title: 'Kelola FAQ',
        href: '/verifikator/faq',
        icon: HelpCircle,
    },
    {
        key: 'bantuan',
        title: 'Bantuan',
        href: '/bantuan?role=admin_verifikator',
        icon: HelpCircle,
    },
    {
        key: 'lacak-publik',
        title: 'Lacak Status Publik',
        href: '/lacak',
        icon: Ticket,
    },
];

// Navigasi untuk role Admin OPD. Tanpa "Pengaturan" (lihat catatan di atas).
export const opdNav: MagangNavItem[] = [
    { key: 'dashboard', title: 'Dasbor', href: '/opd', icon: LayoutDashboard },
    {
        key: 'keputusan',
        title: 'Perlu Keputusan',
        href: '/opd/keputusan',
        icon: ClipboardCheck,
    },
    {
        key: 'peserta',
        title: 'Peserta Aktif',
        href: '/opd/peserta',
        icon: Users,
    },
    {
        key: 'bantuan',
        title: 'Bantuan',
        href: '/bantuan?role=admin_opd',
        icon: HelpCircle,
    },
    {
        key: 'lacak-publik',
        title: 'Lacak Status Publik',
        href: '/lacak',
        icon: Ticket,
    },
];

const ROLE_LABEL: Record<MagangUser['role'], string> = {
    mahasiswa: 'Peserta Magang',
    admin_verifikator: 'Admin Verifikator',
    admin_opd: 'Admin OPD',
};

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

function Brand() {
    return (
        <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#106feb] text-base font-black text-white shadow-sm">
                eM
            </div>
            <div className="leading-tight">
                <p className="text-sm font-bold text-[#0a1628]">E-Magang</p>
                <p className="text-[11px] font-medium text-slate-500">
                    Kota Madiun
                </p>
            </div>
        </Link>
    );
}

function NavList({
    items,
    active,
    onNavigate,
}: {
    items: MagangNavItem[];
    active: string;
    onNavigate?: () => void;
}) {
    return (
        <nav className="flex flex-col gap-1">
            {items.map((item) => {
                const isActive = item.key === active;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                            'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                            isActive
                                ? 'bg-[#106feb] text-white shadow-md shadow-[#106feb]/20'
                                : 'text-slate-600 hover:bg-[#cddcef]/40 hover:text-[#0a1628]',
                        )}
                    >
                        <Icon
                            className={cn(
                                'size-[18px] transition-transform duration-200 group-hover:scale-110',
                                isActive
                                    ? 'text-white'
                                    : 'text-slate-400 group-hover:text-[#106feb]',
                            )}
                        />
                        {item.title}
                    </Link>
                );
            })}
        </nav>
    );
}

export default function MagangLayout({
    user,
    title,
    active,
    navItems = mahasiswaNav,
    children,
}: {
    user: MagangUser;
    title: string;
    active: string;
    navItems?: MagangNavItem[];
    children: React.ReactNode;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);

    // Pratinjau belum punya auth; sertakan peran agar halaman Bantuan bersama
    // tetap memakai sidebar peran ini (bukan default mahasiswa).
    const bantuanHref = `/bantuan?role=${user.role}`;

    return (
        <div className="min-h-screen bg-slate-50 text-[#0a1628]">
            {/* ===== Sidebar desktop ===== */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
                <div className="px-2">
                    <Brand />
                </div>
                <div className="mt-8 flex-1">
                    <NavList items={navItems} active={active} />
                </div>
                <div className="rounded-3xl border border-[#cddcef] bg-gradient-to-br from-[#e8f2fe] to-white p-5 shadow-sm">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-[#106feb] text-white">
                        <Award className="size-5" />
                    </div>
                    <p className="mb-1 text-sm font-bold text-[#0a1628]">
                        Butuh Bantuan?
                    </p>
                    <p className="mb-4 text-xs leading-relaxed text-slate-600">
                        Hubungi admin jika ada kendala atau pertanyaan seputar
                        magang.
                    </p>
                    <Link
                        href={bantuanHref}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#106feb] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0b4fb0] hover:shadow-md"
                    >
                        Hubungi Admin
                    </Link>
                </div>
            </aside>

            {/* ===== Konten ===== */}
            <div className="lg:pl-64">
                {/* Topbar — oval glassmorphism */}
                <header className="sticky top-0 z-20 px-4 py-3 sm:px-6">
                    <div className="flex h-14 items-center gap-3 rounded-full border border-slate-200/60 bg-white/70 px-4 shadow-sm backdrop-blur-xl sm:px-5">
                        {/* Hamburger mobile */}
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger
                                className="inline-flex size-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100/80 lg:hidden"
                                aria-label="Buka menu"
                            >
                                <Menu className="size-5" />
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="w-72 bg-white p-6"
                            >
                                <SheetTitle className="sr-only">
                                    Menu Navigasi
                                </SheetTitle>
                                <Brand />
                                <div className="mt-8">
                                    <NavList
                                        items={navItems}
                                        active={active}
                                        onNavigate={() => setMobileOpen(false)}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>

                        <h1 className="text-base font-bold text-[#0a1628] sm:text-lg">
                            {title}
                        </h1>

                        <div className="ml-auto flex items-center gap-1 sm:gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="group flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-[#106feb]/8 focus-visible:ring-2 focus-visible:ring-[#0b4fb0]/40 focus-visible:outline-none">
                                    <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#106feb] to-[#0b4fb0] text-sm font-bold text-white shadow-sm">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.name}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            initials(user.name)
                                        )}
                                    </span>
                                    <span className="hidden text-left leading-tight sm:block">
                                        <span className="block text-sm font-semibold text-[#0a1628]">
                                            {user.name}
                                        </span>
                                        <span className="block text-[11px] text-slate-500">
                                            {ROLE_LABEL[user.role]}
                                        </span>
                                    </span>
                                    <ChevronDown className="hidden size-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={10}
                                    className="w-64 rounded-2xl border-[#0b4fb0] !bg-[#106feb] p-2 text-white shadow-[0_20px_50px_-12px_rgba(8,71,156,0.45)]"
                                >
                                    {/* Kartu profil mini — kaca putih transparan di atas biru */}
                                    <div className="mb-1 flex items-center gap-3 rounded-xl bg-white/10 p-3">
                                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-[#106feb] shadow-sm">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.name}
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                initials(user.name)
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-white">
                                                {user.name}
                                            </p>
                                            <p className="truncate text-xs text-white/70">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Badge peran — ikon & teks putih di atas biru */}
                                    <div className="mb-1.5 px-1">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
                                            <ShieldCheck className="size-3 text-white" />
                                            {ROLE_LABEL[user.role]}
                                        </span>
                                    </div>

                                    <DropdownMenuSeparator className="bg-white/20" />
                                    {/* Menu "Pengaturan" dihilangkan sepenuhnya (revisi mentor) untuk semua role. */}
                                    <DropdownMenuItem
                                        asChild
                                        className="cursor-pointer rounded-xl text-white focus:bg-white/15 focus:text-white"
                                    >
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="w-full cursor-pointer"
                                        >
                                            <LogOut className="size-4 text-white" />
                                            Keluar
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
                    {/* Animasi masuk halaman — fade + naik lembut tiap kali
                        dasbor dimuat, selaras dgn reveal di landing. */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
