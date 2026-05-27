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
  ChevronRight,
  Sparkles,
  Gauge,
  SlidersHorizontal,
  Rocket,
} from "lucide-react"

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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { ProjectSwitcher } from "@/components/project-switcher"
import { AccountAvatarButton } from "@/components/account-avatar-button"

// ─── nav structure ───────────────────────────────────────────────────────────

const NAV_TOP: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Deploy", href: "/deploy", icon: Rocket },
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
  const storageKey = `sx:sidebar-group:${label}`

  // Initialise from localStorage if present, otherwise fall back to
  // defaultOpen OR being-on-an-active-route. /evaluate Issue 11 fix.
  const [open, setOpen] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return anyActive || defaultOpen
    const stored = window.localStorage.getItem(storageKey)
    if (stored === null) return anyActive || defaultOpen
    return stored === "1"
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(storageKey, open ? "1" : "0")
  }, [open, storageKey])

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

      {/* Footer: project switcher (left) + account avatar (right) */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1.5">
            <ProjectSwitcher />
            <AccountAvatarButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
