import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket } from 'lucide-react';
import { useState } from 'react';
import { AnimatedButton } from '@/components/animated-button';

interface NavLink {
    href: string;
    label: string;
}

interface NavbarProps {
    navLinks: NavLink[];
    scrolled: boolean;
}

export function Navbar({ navLinks, scrolled }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'circOut' }}
            className="fixed top-5 left-1/2 z-[1000] w-[90%] max-w-[1200px] -translate-x-1/2"
        >
            <div
                className={`relative flex items-center justify-between rounded-full border border-white/20 bg-white/70 backdrop-blur-md transition-all duration-300 ${
                    scrolled
                        ? 'p-1.5 shadow-[0_12px_40px_rgba(8,71,156,0.14)] xl:p-2'
                        : 'p-2 shadow-lg shadow-brand-primary/5 xl:p-3'
                }`}
            >
                <Link
                    href="/"
                    className="bg-gradient-to-r from-brand-ink to-brand-hover bg-clip-text pl-4 text-xl tracking-tight text-transparent transition-opacity duration-300 hover:opacity-80"
                >
                    E-Magang
                </Link>

                <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
                    {navLinks.map((link) => {
                        const NavEl = link.href.startsWith('/') ? Link : 'a';
                        return (
                            <NavEl
                                key={link.href}
                                href={link.href}
                                className="group relative rounded-full px-4 py-2 text-sm font-medium text-brand-ink/70 transition-colors duration-300 hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-hover/50 focus-visible:outline-none"
                            >
                                {link.label}
                                <span
                                    aria-hidden
                                    className="absolute inset-x-4 bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-brand-primary transition-transform duration-300 ease-out group-hover:scale-x-100"
                                />
                            </NavEl>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2 xl:gap-3">
                    <Link
                        href="/login-otp"
                        className="hidden rounded-full px-4 py-2 text-sm font-medium text-brand-ink/70 transition-colors duration-300 hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-hover/50 focus-visible:outline-none lg:inline-flex"
                    >
                        Masuk
                    </Link>

                    <AnimatedButton as="a" href="#daftar">
                        Daftar
                    </AnimatedButton>

                    <button
                        onClick={() => setMobileMenuOpen((v) => !v)}
                        className="relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-brand-primary text-white shadow-md shadow-brand-primary/30 transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-hover focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg focus-visible:outline-none lg:hidden"
                        aria-label="Buka menu navigasi"
                        aria-expanded={mobileMenuOpen}
                    >
                        <div className="flex flex-col gap-1">
                            <span
                                className={`h-0.5 w-4 rounded-full bg-white transition-all duration-300 ${
                                    mobileMenuOpen ? 'translate-y-[3px] rotate-45' : ''
                                }`}
                            />
                            <span
                                className={`h-0.5 w-4 rounded-full bg-white transition-all duration-300 ${
                                    mobileMenuOpen ? '-translate-y-[3px] -rotate-45' : ''
                                }`}
                            />
                        </div>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: 'circOut' }}
                        className="mt-3 overflow-hidden rounded-3xl border border-white/30 bg-white/80 shadow-[0_20px_50px_rgba(8,71,156,0.12)] backdrop-blur-md"
                    >
                        <div className="flex flex-col gap-1 px-4 py-4">
                            {navLinks.map((link) => {
                                const NavEl = link.href.startsWith('/') ? Link : 'a';
                                return (
                                    <NavEl
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-brand-ink/70 transition-colors hover:bg-brand-primary/5 hover:text-brand-primary focus-visible:bg-brand-primary/5 focus-visible:text-brand-primary focus-visible:outline-none"
                                    >
                                        {link.label}
                                    </NavEl>
                                );
                            })}
                            <Link
                                href="/lacak"
                                onClick={() => setMobileMenuOpen(false)}
                                className="mt-1 flex items-center gap-2 rounded-xl border-t border-slate-100 px-3 pt-3.5 pb-2.5 text-[15px] font-medium text-brand-ink/70 transition-colors hover:bg-brand-primary/5 hover:text-brand-primary focus-visible:bg-brand-primary/5 focus-visible:text-brand-primary focus-visible:outline-none"
                            >
                                <Ticket className="size-4" /> Lacak Tiket
                            </Link>
                            <Link
                                href="/login-otp"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-brand-ink/70 transition-colors hover:bg-brand-primary/5 hover:text-brand-primary focus-visible:bg-brand-primary/5 focus-visible:text-brand-primary focus-visible:outline-none"
                            >
                                Masuk Akun
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
