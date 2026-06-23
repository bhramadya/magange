import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Home, FileText, Activity, Award } from "lucide-react"

// Daftar menu khusus Dasbor User (Anak Magang)
const items = [
    { title: "Dasbor Utama", url: "#", icon: Home },
    { title: "Pengajuan Magang", url: "#", icon: FileText },
    { title: "Lacak Tiket", url: "#", icon: Activity },
    { title: "Laporan & Sertifikat", url: "#", icon: Award },
]

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                        E-Magang Diskominfo
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="mt-4">
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon className="w-5 h-5 text-gray-600" />
                                            <span className="font-medium text-gray-700">{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
