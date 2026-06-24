import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from 'studio-x'
import { AudioLines } from 'lucide-react'

// Features SidebarMenuSkeleton: the loading placeholder rows shown while nav
// data streams in — icon-leading skeletons with varied-width text bars.
export const Loading = () => (
  <div className="flex h-[560px] w-72">
    <SidebarProvider>
      <Sidebar collapsible="none" className="border-r">
        <SidebarHeader>
          <div className="flex items-center gap-2 rounded-md p-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <AudioLines className="size-4" />
            </div>
            <span className="truncate text-sm font-semibold">Studio_X</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Build</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  </div>
)

// Text-only variant — no leading icon square, just the label skeleton bars.
export const TextOnly = () => (
  <div className="flex h-[560px] w-72">
    <SidebarProvider>
      <Sidebar collapsible="none" className="border-r">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Loading agents…</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  </div>
)
