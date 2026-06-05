"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  Library,
  Phone,
  Megaphone,
  Settings2,
  Radio,
  Key,
  Sparkles,
  TextSearch,
  LineChart,
  PhoneCall,
  MessagesSquare,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
// Per the Figma "Design Theme and UI" reference: items + grouping match the
// Composer / Build / Deploy / Insights / Project clusters, but rendered as
// flat sections separated by dividers — no uppercase BUILD/DEPLOY/INSIGHTS
// label headers (per CLAUDE.md "Don't re-litigate" — section labels rejected).

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_BUILD: NavItem[] = [
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Integrations", href: "/integrations", icon: Library },
]

const NAV_DEPLOY: NavItem[] = [
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Phone Numbers", href: "/campaigns/phone-numbers", icon: Phone },
]

// Observe — collapsed to a single Monitor hub. Monitor is the cross-deployment
// rollup (its own tabs: Overview · Call History · Chat History · Sessions); the
// primary home for "what happened" is now inside each campaign. One entry keeps
// the sidebar lean and makes the campaign the deployment surface.
const NAV_OBSERVE: NavItem[] = [
  { label: "Monitor", href: "/monitor", icon: LineChart },
]

const NAV_PROJECT: NavItem[] = [
  { label: "Project Settings", href: "/project/settings", icon: Settings2 },
  { label: "Realtime Services", href: "/realtime-services", icon: Radio },
  { label: "Vendor Credentials", href: "/project/vendor-credentials", icon: Key },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function isItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/campaigns") {
    // Match /campaigns root, /campaigns/new, /campaigns/[id] but NOT /campaigns/phone-numbers
    if (pathname === "/campaigns") return true
    if (pathname.startsWith("/campaigns/phone-numbers")) return false
    return pathname.startsWith("/campaigns/")
  }
  if (itemHref === "/monitor") {
    // Monitor hub spans Overview (/monitor) + the Call/Chat History tabs.
    return pathname === "/monitor" || pathname.startsWith("/calls") || pathname.startsWith("/chats")
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

        {/* Build — Agents, Integrations */}
        <SidebarGroup>
          <SidebarMenu>
            {NAV_BUILD.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Run — the call-centre: Campaigns + Phone Numbers */}
        <SidebarGroup>
          <SidebarMenu>
            {NAV_DEPLOY.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Observe — global monitoring: Monitor, Call History, Chat History */}
        <SidebarGroup>
          <SidebarMenu>
            {NAV_OBSERVE.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Project — Settings, Realtime Services (with Sessions tab), Vendor Credentials */}
        <SidebarGroup>
          <SidebarMenu>
            {NAV_PROJECT.map((item) => (
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
