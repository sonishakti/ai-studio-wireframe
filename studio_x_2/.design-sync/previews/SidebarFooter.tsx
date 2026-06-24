import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarFooter,
} from 'studio-x'
import { Bot, Wand2, Activity, ChevronsUpDown } from 'lucide-react'

// Features SidebarFooter: the pinned bottom region with the signed-in user
// chip (avatar, name, email, switcher affordance) below the nav.
export const Footer = () => (
  <div className="flex h-[560px] w-72">
    <SidebarProvider>
      <Sidebar collapsible="none" className="border-r">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <Bot />
                    <span>Agents</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Wand2 />
                    <span>Composer</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Activity />
                    <span>Monitor</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="flex items-center gap-2 rounded-md p-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              JD
            </div>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-medium">Jordan Diaz</span>
              <span className="truncate text-xs text-muted-foreground">
                jordan@acme.ai
              </span>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  </div>
)
