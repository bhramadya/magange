import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />

            <main className="w-full bg-slate-50 min-h-screen">
                <header className="flex h-16 items-center px-4 border-b bg-white shadow-sm">
                    <SidebarTrigger />
                    <span className="ml-4 font-semibold text-lg text-slate-800">
                        Sistem Manajemen E-Magang
                    </span>
                </header>

                <div className="p-6 md:p-8">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
