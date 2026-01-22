"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { Separator } from "@/components/ui/separator"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="min-h-screen xl:h-screen xl:overflow-hidden">
      <AdminSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-muted-foreground text-sm font-medium">Admin</span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
