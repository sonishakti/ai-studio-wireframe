import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from 'studio-x'
import { Bot, Wand2, ChevronsUpDown, AudioLines } from 'lucide-react'

// Features SidebarHeader: the branded top region holding the product mark and
// the project switcher chip, separated from the nav below.
export const Header = () => (
  <div className="flex h-[560px] w-72">
    <SidebarProvider>
      <Sidebar collapsible="none" className="border-r">
        <SidebarHeader>
          <div className="flex items-center gap-2 rounded-md p-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <AudioLines className="size-4" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">Studio_X</span>
              <span className="truncate text-xs text-muted-foreground">
                Acme Voice AI
              </span>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </div>
        </SidebarHeader>
        <SidebarSeparator />
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  </div>
)
