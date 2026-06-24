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
  SidebarFooter,
  SidebarInset,
} from 'studio-x'
import { Bot, Wand2, Activity, Settings, AudioLines } from 'lucide-react'

// SidebarProvider is the context root every sidebar part depends on. This card
// shows what it enables: a sidebar laid out beside its main content area
// (SidebarInset), with the provider supplying width vars + open/collapsed state.
export const WithContent = () => (
  <div className="flex h-[560px] w-full">
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
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings />
                <span>Project Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <div className="flex flex-col gap-3 p-6">
          <h2 className="text-lg font-semibold">Agents</h2>
          <p className="text-sm text-muted-foreground">
            The provider keeps the sidebar and this content region in sync —
            shared width tokens, open/collapsed state, and the ⌘B toggle.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Aria</p>
              <p className="text-xs text-muted-foreground">Live · inbound</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Support Bot</p>
              <p className="text-xs text-muted-foreground">Draft</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  </div>
)
