import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      {/* DashboardSidebar swaps between AppSidebar (project) and
          AccountSidebar (billing/extensions/preferences/developer/help/
          notifications) based on the current pathname. */}
      <DashboardSidebar />
      <SidebarInset>
        {/* Header is full-width of SidebarInset (sticky, with backdrop blur) */}
        <DashboardHeader />

        {/*
          Content area:
          - Full width by default on every screen size, so cards never look
            half-empty on standard 1080p–1440p monitors
          - Capped at max-w-screen-2xl (1536px) on ultra-wide so tables don't
            stretch unreadably on 4K displays
          - Pages may still narrow themselves with `max-w-3xl` etc. when the
            content is genuinely reading-width (release notes, license lists)
        */}
        <div className="flex flex-col flex-1 w-full max-w-screen-2xl mx-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
