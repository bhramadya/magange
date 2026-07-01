import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            // Dasbor role (mahasiswa/verifikator/opd) memakai MagangLayout sendiri.
            case name.startsWith('mahasiswa/'):
            case name.startsWith('verifikator/'):
            case name.startsWith('opd/'):
                return null;
            // Login OTP branded (split-screen) mengelola layout sendiri.
            case name === 'auth/otp-login':
                return null;
            // Login admin branded (Username + Password) — layout sendiri.
            case name === 'auth/admin-login':
                return null;
            // Lacak status publik (tanpa login) — branded sendiri.
            case name === 'lacak':
                return null;
            // Pusat Bantuan — membungkus MagangLayout sendiri (nav mengikuti role).
            case name === 'bantuan':
                return null;
            // Pengaturan — membungkus MagangLayout sendiri (nav mengikuti role).
            case name === 'pengaturan':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
