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
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
} from 'studio-x'
import {
  Bot,
  Wand2,
  Activity,
  Settings,
  KeyRound,
  ChevronsUpDown,
  AudioLines,
} from 'lucide-react'

// Flagship card: a full, realistic Studio_X sidebar — branded header with
// project switcher, grouped nav (BUILD / OBSERVE / MANAGE) with lucide icons
// and an active item, an attention badge, and a footer user chip.
export const Default = () => (
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
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Build</SidebarGroupLabel>
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
          <SidebarGroup>
            <SidebarGroupLabel>Observe</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Activity />
                    <span>Monitor</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>3</SidebarMenuBadge>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Settings />
                    <span>Project Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <KeyRound />
                    <span>Vendor Credentials</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
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
