"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  Library,
  Settings2,
  Radio,
  Sparkles,
  TextSearch,
  LineChart,
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

import { ProjectSwitcher } from "@/components/project-switcher"
import { AccountAvatarButton } from "@/components/account-avatar-button"

/** Open the global command palette from anywhere. */
function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sx:open-command-palette"))
  }
}

// ─── nav structure ───────────────────────────────────────────────────────────
//
// 2026-06-23 agent-unification: "My Agents" is the single home (app root) — it
// absorbs the old Deploy hub + Agents library. The agent is the unified thing;
// channels and reusable modules hang off it. Integrations is the modules hub
// (Knowledge · MCP · Connectors · Vendor Credentials · Channels) — Vendor
// Credentials moved OUT of Manage; the Deploy channel pages became Channels.

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_BUILD: NavItem[] = [
  { label: "Integrations", href: "/integrations", icon: Library },
  { label: "Composer", href: "/composer", icon: Sparkles },
]

const NAV_OBSERVE: NavItem[] = [
  { label: "Monitor", href: "/monitor", icon: LineChart },
]

const NAV_MANAGE: NavItem[] = [
  { label: "Realtime Services", href: "/realtime-services", icon: Radio },
  { label: "Project Settings", href: "/project/settings", icon: Settings2 },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function isItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/agents") {
    // My Agents is the home — also active at root and on the legacy deploy paths.
    return pathname === "/agents" || pathname.startsWith("/agents/") || pathname.startsWith("/deploy")
  }
  if (itemHref === "/monitor") {
    return pathname === "/monitor" || pathname.startsWith("/calls") || pathname.startsWith("/sessions")
  }
  return pathname === itemHref || pathname.startsWith(itemHref + "/")
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = isItemActive(item.href, pathname)

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

function SearchItem() {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip="Search (⌘K)"
        onClick={openCommandPalette}
        className="cursor-pointer border border-border text-muted-foreground hover:text-foreground"
      >
        <TextSearch className="h-4 w-4" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="text-xs font-mono tracking-wider">⌘K</kbd>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// ─── main export ─────────────────────────────────────────────────────────────

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      {/* Logo + collapse toggle */}
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <Link
            href="/agents"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="text-xl font-semibold lowercase tracking-tight">agora</span>
          </Link>
          <SidebarTrigger className="text-muted-foreground" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* My Agents — the single home (app root) */}
        <SidebarGroup>
          <SidebarMenu>
            <NavLink item={{ label: "My Agents", href: "/agents", icon: Bot }} />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Build — Integrations (modules hub) · Composer */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">Build</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_BUILD.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Observe — global Monitor hub */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">Observe</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_OBSERVE.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Manage — RT services · project settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">Manage</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_MANAGE.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Search ⌘K */}
        <SidebarGroup>
          <SidebarMenu>
            <SearchItem />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: project switcher + account avatar */}
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
