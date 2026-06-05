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
// 2026-06-05 IA (Vapi-informed, user-directed): three labeled groups rendered
// with uppercase SidebarGroupLabel headers — BUILD · OBSERVE · MANAGE — with
// Composer floating above and Search below. This REVERSES the earlier
// "no section-label headers" / "'Observe' header rejected" calls (CLAUDE.md).
// Build folds in the whole make-and-launch arc: Agents · Integrations ·
// Phone Numbers · Campaign.

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

// Build — the authoring workspace. "Deploy" is one destination for the whole
// go-live surface (Overview · Campaigns · Phone Numbers · Web Widget · API & SDK),
// replacing the old separate Phone Numbers + Campaign items (2026-06-05, Opt 3).
const NAV_BUILD: NavItem[] = [
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Integrations", href: "/integrations", icon: Library },
  { label: "Deploy", href: "/deploy", icon: Rocket },
]

// Observe — a single Monitor hub (tabs: Overview · Call History · Chat History ·
// Sessions, plus an "RTE usage →" outlink to /billing/usage). Sessions = agent
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
    // Deploy hub spans Overview (/deploy) + the channel pages (/deploy/widget,
    // /deploy/api) + Campaigns + Phone Numbers.
    return (
      pathname === "/deploy" ||
      pathname.startsWith("/deploy/") ||
      pathname.startsWith("/campaigns") ||
      pathname.startsWith("/phone-numbers")
    )
  }
  if (itemHref === "/monitor") {
    // Monitor hub spans Overview (/monitor) + Call/Chat History + agent Sessions.
    return pathname === "/monitor" || pathname.startsWith("/calls") || pathname.startsWith("/chats") || pathname.startsWith("/sessions")
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
              <Link href="/agents">
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

        {/* Build — Agents · Integrations · Phone Numbers · Campaign */}
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
