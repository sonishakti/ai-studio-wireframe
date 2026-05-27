"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Bot,
  Radio,
  Puzzle,
  Phone,
  Megaphone,
  PhoneCall,
  Activity,
  KeyRound,
  Shield,
  Bell,
  Settings,
  CreditCard,
  Store,
  Code2,
  HelpCircle,
  LogOut,
  ChevronRight,
  Search,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Gauge,
  SlidersHorizontal,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// ─── nav structure ───────────────────────────────────────────────────────────

const NAV_TOP: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Realtime Services", href: "/realtime-services", icon: Radio },
  { label: "Integrations", href: "/integrations", icon: Puzzle },
]

const NAV_TELEPHONY: NavItem[] = [
  { label: "Phone Numbers", href: "/telephony/phone-numbers", icon: Phone },
  { label: "Campaigns", href: "/telephony/campaigns", icon: Megaphone },
]

// Insights — unified destination for "what happened in this project?"
// Co-locates Monitor (performance), Calls (history) and Usage (consumption)
// because journeys 1–4 cross all three (see HANDOFF.md IA decision).
const NAV_INSIGHTS: NavItem[] = [
  { label: "Monitor", href: "/monitor", icon: Activity },
  { label: "Calls", href: "/calls", icon: PhoneCall },
  { label: "Usage", href: "/usage", icon: Gauge },
]

const NAV_PROJECT: NavItem[] = [
  { label: "Project Settings", href: "/project/settings", icon: SlidersHorizontal },
  { label: "Project Credentials", href: "/project/credentials", icon: KeyRound },
  { label: "Vendor Credentials", href: "/project/vendor-credentials", icon: Shield },
]

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active =
    item.href === "/home"
      ? pathname === "/home"
      : pathname.startsWith(item.href)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
              {item.badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function CollapsibleGroup({
  label,
  items,
  defaultOpen = true,
}: {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}) {
  const pathname = usePathname()
  const anyActive = items.some((i) => pathname.startsWith(i.href))
  const [open, setOpen] = React.useState(anyActive || defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarGroup className="py-0">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer select-none hover:text-foreground transition-colors">
            {label}
            <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu>
            {items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

// ─── footer user menu ─────────────────────────────────────────────────────────

function UserMenu() {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src="" alt="User" />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              SS
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Shakti Soni</span>
            <span className="truncate text-xs text-muted-foreground">
              soni28shakti@gmail.com
            </span>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        side="top"
        align="start"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Workspace
        </DropdownMenuLabel>
        <DropdownMenuItem>
          <span className="font-medium text-sm">Default Project</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">Free</Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          Extensions Marketplace
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          Developer Hub ↗
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          Help Hub ↗
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" asChild>
          <Link href="/preferences">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          onClick={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" />
          )}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── main export ─────────────────────────────────────────────────────────────

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      {/* Logo / workspace header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Studio_X</span>
                  <span className="truncate text-xs text-muted-foreground">Agora</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Flat top items */}
        <SidebarGroup>
          <SidebarMenu>
            {NAV_TOP.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Telephony — deployment surfaces */}
        <CollapsibleGroup label="Telephony" items={NAV_TELEPHONY} />

        <SidebarSeparator />

        {/* Insights — "what happened" surfaces (Monitor + Calls + Usage) */}
        <CollapsibleGroup label="Insights" items={NAV_INSIGHTS} />

        <SidebarSeparator />

        {/* Project — configuration surfaces */}
        <CollapsibleGroup label="Project" items={NAV_PROJECT} />
      </SidebarContent>

      {/* Footer: user menu */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
