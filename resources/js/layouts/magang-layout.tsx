import { Link } from '@inertiajs/react';
import {
    LayoutDashboard,
    FileText,
    Award,
    HelpCircle,
    Settings,
    Bell,
    Menu,
    LogOut,
    ChevronDown,
    Inbox,
    History,
    ClipboardCheck,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
export const mahasiswaNav: MagangNavItem[] = [
    { key: 'dashboard', title: 'Dasbor', href: '/dashboard', icon: LayoutDashboard },
    { key: 'pengajuan', title: 'Pengajuan Saya', href: '/pengajuan', icon: FileText },
    { key: 'penyelesaian', title: 'Penyelesaian', href: '/penyelesaian', icon: Award },
    { key: 'bantuan', title: 'Bantuan', href: '/bantuan', icon: HelpCircle },
    { key: 'pengaturan', title: 'Pengaturan', href: '/pengaturan', icon: Settings },
];

// Navigasi untuk role Admin Verifikator.
export const verifikatorNav: MagangNavItem[] = [
    { key: 'dashboard', title: 'Dasbor', href: '/verifikator', icon: LayoutDashboard },
    { key: 'masuk', title: 'Pengajuan Masuk', href: '/verifikator/masuk', icon: Inbox },
    { key: 'riwayat', title: 'Riwayat', href: '/verifikator/riwayat', icon: History },
    { key: 'bantuan', title: 'Bantuan', href: '/bantuan', icon: HelpCircle },
    { key: 'pengaturan', title: 'Pengaturan', href: '/pengaturan', icon: Settings },
];

// Navigasi untuk role Admin OPD.
export const opdNav: MagangNavItem[] = [
    { key: 'dashboard', title: 'Dasbor', href: '/opd', icon: LayoutDashboard },
    { key: 'keputusan', title: 'Perlu Keputusan', href: '/opd/keputusan', icon: ClipboardCheck },
    { key: 'peserta', title: 'Peserta Aktif', href: '/opd/peserta', icon: Users },
    { key: 'bantuan', title: 'Bantuan', href: '/bantuan', icon: HelpCircle },
    { key: 'pengaturan', title: 'Pengaturan', href: '/pengaturan', icon: Settings },
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#106feb] text-base font-black text-white shadow-sm">
                eM
            </div>
            <div className="leading-tight">
                <p className="text-sm font-bold text-[#12213e]">E-Magang</p>
                <p className="text-[11px] font-medium text-slate-500">Kota Madiun</p>
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
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-[#106feb] text-white shadow-sm shadow-[#106feb]/30'
                                : 'text-slate-600 hover:bg-[#cddcef]/40 hover:text-[#12213e]',
                        )}
                    >
                        <Icon className={cn('size-[18px]', isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#106feb]')} />
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

    return (
        <div className="min-h-screen bg-slate-50 text-[#12213e]">
            {/* ===== Sidebar desktop ===== */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
                <div className="px-2">
                    <Brand />
                </div>
                <div className="mt-8 flex-1">
                    <NavList items={navItems} active={active} />
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-[#106feb] to-[#0b4fb0] p-4 text-white">
                    <p className="text-sm font-semibold">Butuh bantuan?</p>
                    <p className="mt-1 text-xs text-white/80">Hubungi Dinas Kominfo Kota Madiun.</p>
                    <Link href="/bantuan" className="mt-3 inline-flex text-xs font-semibold underline underline-offset-2">
                        Pusat Bantuan
                    </Link>
                </div>
            </aside>

            {/* ===== Konten ===== */}
            <div className="lg:pl-64">
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
                    {/* Hamburger mobile */}
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger
                            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
                            aria-label="Buka menu"
                        >
                            <Menu className="size-5" />
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 bg-white p-6">
                            <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                            <Brand />
                            <div className="mt-8">
                                <NavList items={navItems} active={active} onNavigate={() => setMobileOpen(false)} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <h1 className="text-base font-bold sm:text-lg">{title}</h1>

                    <div className="ml-auto flex items-center gap-1 sm:gap-2">
                        <button
                            type="button"
                            className="relative inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                            aria-label="Notifikasi"
                        >
                            <Bell className="size-5" />
                            <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-slate-100">
                                <span className="flex size-9 items-center justify-center rounded-full bg-[#cddcef] text-sm font-bold text-[#106feb]">
                                    {initials(user.name)}
                                </span>
                                <span className="hidden text-left leading-tight sm:block">
                                    <span className="block text-sm font-semibold">{user.name}</span>
                                    <span className="block text-[11px] text-slate-500">{ROLE_LABEL[user.role]}</span>
                                </span>
                                <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <p className="text-sm font-semibold">{user.name}</p>
                                    <p className="text-xs font-normal text-slate-500">{user.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/pengaturan" className="cursor-pointer">
                                        <Settings className="size-4" />
                                        Pengaturan
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild variant="destructive">
                                    <Link href="/logout" method="post" as="button" className="w-full cursor-pointer">
                                        <LogOut className="size-4" />
                                        Keluar
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
            </div>
        </div>
    );
}
