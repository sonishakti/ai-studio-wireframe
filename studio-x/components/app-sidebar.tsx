"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Bot,
  Radio,
  Puzzle,
  Shield,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  Megaphone,
  Rocket,
  Hash,
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
  { label: "Realtime Services", href: "/realtime-services", icon: Radio },
  { label: "Integrations", href: "/integrations", icon: Puzzle },
  { label: "Deploy", href: "/deploy", icon: Rocket },
]

// Campaigns — omnichannel hub. A campaign owns multiple modalities (telephony,
// WhatsApp, web, SMS) and its analytics/calls live as tabs inside the campaign
// detail page. Phone numbers are managed here too because that's where they're
// assigned.
const NAV_CAMPAIGNS: NavItem[] = [
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Phone Numbers", href: "/campaigns/phone-numbers", icon: Hash },
]

const NAV_PROJECT: NavItem[] = [
  { label: "Project Settings", href: "/project/settings", icon: SlidersHorizontal },
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
      : item.href === "/campaigns"
        ? pathname === "/campaigns" || pathname.startsWith("/campaigns/new") || /^\/campaigns\/[^/]+$/.test(pathname)
        : pathname.startsWith(item.href)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
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
        {/* Flat top items: build → deploy progression */}
        <SidebarGroup>
          <SidebarMenu>
            {NAV_TOP.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Campaigns — omnichannel hub (campaigns + phone numbers) */}
        <CollapsibleGroup label="Campaigns" items={NAV_CAMPAIGNS} />

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
