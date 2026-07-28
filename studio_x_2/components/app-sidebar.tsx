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
import { allOpenIssues } from "@/lib/diagnostics"

/** Open the global command palette from anywhere. */
function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sx:open-command-palette"))
  }
}

// ─── nav structure ───────────────────────────────────────────────────────────
//
// 2026-06-24 full-rebuild IA (5 jobs: build · fix · launch · campaign · fix
// errors). Agents is the entry point of BUILD (app root) — it absorbs the old
// Go-Live hub; channels are launched from an agent's hero/Deploy step.
// Integrations is renamed "Resources" and moves to MANAGE — it's the shared
// modules inventory (Knowledge · MCP · Connectors · Vendor Credentials ·
// Deployment Channels), not part of the build path. Monitor (OBSERVE) carries a
// badge of open critical issues so "fix errors" is visible from the nav.

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_BUILD: NavItem[] = [
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Composer", href: "/composer", icon: Sparkles },
]

const NAV_OBSERVE: NavItem[] = [
  { label: "Monitor", href: "/monitor", icon: LineChart },
]

const NAV_MANAGE: NavItem[] = [
  { label: "Resources", href: "/integrations", icon: Library },
  { label: "Realtime Services", href: "/realtime-services", icon: Radio },
  { label: "Project Settings", href: "/project/settings", icon: Settings2 },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function isItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/agents") {
    // Agents is the BUILD entry point + app root — also active across the agent
    // editor and the deploy wizards (which are launched from an agent).
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
        </Link>
      </SidebarMenuButton>
      {item.badge && (
        // Severity, not notifications: destructive styling + a label so the
        // number explains itself (heuristic-eval #23). Its OWN link (a badge
        // nested in the item link can't be one): straight to the
        // needs-attention queue, pre-filtered to critical (user-test
        // 2026-07-28 P1 — the bare number was unexplained and unclickable).
        <Link
          href="/monitor/diagnostics?sev=critical"
          title={`${item.badge} calls need attention`}
          aria-label={`${item.badge} calls need attention — open the needs-attention queue`}
          className="absolute right-1 top-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden"
        >
          <Badge variant="destructive" className="text-xs px-1.5 py-0">
            {item.badge}
          </Badge>
        </Link>
      )}
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
  // Badge "fix errors" onto Monitor: the count of open critical issues across
  // deployments that have carried traffic. Deterministic (seeded), so it's
  // hydration-safe to compute on the client.
  const openCriticals = React.useMemo(
    () => allOpenIssues().filter((a) => a.issue.severity === "critical").length,
    [],
  )
  const observeItems: NavItem[] = NAV_OBSERVE.map((item) =>
    item.href === "/monitor" && openCriticals > 0
      ? { ...item, badge: String(openCriticals) }
      : item,
  )

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
        {/* Build — Agents (entry point + app root) · Composer */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">Build</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_BUILD.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Observe — global Monitor hub (badge = open critical issues) */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">Observe</SidebarGroupLabel>
          <SidebarMenu>
            {observeItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Manage — Resources (modules inventory) · RT services · project settings */}
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
