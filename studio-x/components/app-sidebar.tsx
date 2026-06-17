"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  Library,
  Rocket,
  Settings2,
  Radio,
  Key,
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
// 2026-06-05 IA: three labeled groups with uppercase SidebarGroupLabel headers —
// BUILD · OBSERVE · MANAGE — Composer floating above, Search below.
//
// 2026-06-17 activation-revenue realignment (LEARNINGS §20): the center of
// gravity moved from building agents to getting live traffic. "Go Live" is now
// BUILD #1 and the app root; Agents is DEMOTED to a library beneath it. The agent
// is the engine, not the entry point — it's auto-provisioned and edited on demand
// from inside a deployment. Revenue = minutes on a live deployment, not a
// published artifact.

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

// Build — the make-and-launch arc, led by Go Live. "Go Live" is the deploy hub
// (Overview/first-run home · Inbound · Batch Calls · Phone Numbers · Web Widget ·
// Code); Agents is the reusable Stack+Persona library; Integrations are KB/MCP.
const NAV_BUILD: NavItem[] = [
  { label: "Go Live", href: "/deploy", icon: Rocket },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Integrations", href: "/integrations", icon: Library },
]

// Observe — a single Monitor hub (tabs: Overview · Call History · Sessions,
// plus an "RTE usage →" outlink to /billing/usage). Sessions = agent
// conversation runs (Conversational AI), not RTC telemetry.
const NAV_OBSERVE: NavItem[] = [
  { label: "Monitor", href: "/monitor", icon: LineChart },
]

// Manage — project-scoped administration. Account-scoped surfaces (Billing,
// Extensions, Developer, Help) live in the avatar dropdown / AccountSidebar.
const NAV_MANAGE: NavItem[] = [
  { label: "Project Settings", href: "/project/settings", icon: Settings2 },
  { label: "Realtime Services", href: "/realtime-services", icon: Radio },
  { label: "Vendor Credentials", href: "/project/vendor-credentials", icon: Key },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function isItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/deploy") {
    // Deploy hub: every surface now lives under /deploy/* (Inbound · Batch
    // Calls · Phone Numbers · Embed/Code — 2026-06-11 intent-first revamp).
    return pathname === "/deploy" || pathname.startsWith("/deploy/")
  }
  if (itemHref === "/monitor") {
    // Monitor hub spans Overview (/monitor) + Call History + agent Sessions.
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

function ComposerItem() {
  const pathname = usePathname()
  const active = pathname === "/composer"
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip="Composer">
        <Link href="/composer">
          <Sparkles className="h-4 w-4" />
          <span>Composer</span>
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
      {/* Logo / workspace header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/deploy">
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
        {/* Composer — opens command palette */}
        <SidebarGroup>
          <SidebarMenu>
            <ComposerItem />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Build — Go Live (lead) · Agents · Integrations */}
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

        {/* Manage — project-scoped settings · RT services · vendor keys */}
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
