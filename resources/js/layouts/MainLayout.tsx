import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar />

            <main className="min-h-screen w-full bg-slate-50">
                <header className="flex h-16 items-center border-b bg-white px-4 shadow-sm">
                    <SidebarTrigger />
                    <span className="ml-4 text-lg font-semibold text-slate-800">
                        Sistem Manajemen E-Magang
                    </span>
                </header>

                <div className="p-6 md:p-8">{children}</div>
            </main>
        </SidebarProvider>
    );
}
