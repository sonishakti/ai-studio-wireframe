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
  Phone,
  PhoneOutgoing,
  MessageCircle,
  Globe,
  Code2,
  ChevronDown,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
// 2026-06-20 (user Figma): "Deploy" is the top item — an expandable section whose
// children are the deploy channels (Phone Numbers · Batch Call · WhatsApp · Web
// Widget · Code), with /deploy itself as the hub home. Below it the labeled
// groups: BUILD (Agents · Integrations · Composer) · OBSERVE (Monitor) · MANAGE
// (Vendor Credentials · Realtime Services · Project Settings).

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

// Deploy hub channels — the expandable children under "Deploy".
const DEPLOY_CHANNELS: NavItem[] = [
  { label: "Phone Numbers", href: "/deploy/phone-numbers", icon: Phone },
  { label: "Batch Call", href: "/deploy/batch-calls", icon: PhoneOutgoing },
  { label: "WhatsApp", href: "/deploy/whatsapp", icon: MessageCircle },
  { label: "Web Widget", href: "/deploy/web-widget", icon: Globe },
  { label: "Code", href: "/deploy/code", icon: Code2 },
]

const NAV_BUILD: NavItem[] = [
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Integrations", href: "/integrations", icon: Library },
  { label: "Composer", href: "/composer", icon: Sparkles },
]

const NAV_OBSERVE: NavItem[] = [
  { label: "Monitor", href: "/monitor", icon: LineChart },
]

const NAV_MANAGE: NavItem[] = [
  { label: "Vendor Credentials", href: "/project/vendor-credentials", icon: Key },
  { label: "Realtime Services", href: "/realtime-services", icon: Radio },
  { label: "Project Settings", href: "/project/settings", icon: Settings2 },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function isItemActive(itemHref: string, pathname: string): boolean {
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

// Deploy — clickable hub (→ /deploy) with an expandable list of channels.
function DeploySection() {
  const pathname = usePathname()
  const hubActive = pathname === "/deploy"

  return (
    <Collapsible defaultOpen className="group/deploy">
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={hubActive} tooltip="Deploy">
          <Link href="/deploy">
            <Rocket className="h-4 w-4" />
            <span>Deploy</span>
          </Link>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction
            aria-label="Toggle deploy channels"
            className="transition-transform group-data-[state=open]/deploy:rotate-180"
          >
            <ChevronDown className="h-4 w-4" />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {DEPLOY_CHANNELS.map((c) => (
              <SidebarMenuSubItem key={c.href}>
                <SidebarMenuSubButton asChild isActive={isItemActive(c.href, pathname)}>
                  <Link href={c.href}>
                    <c.icon className="h-4 w-4" />
                    <span>{c.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
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
            href="/deploy"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="text-xl font-semibold lowercase tracking-tight">agora</span>
          </Link>
          <SidebarTrigger className="text-muted-foreground" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Deploy — hub + expandable channels */}
        <SidebarGroup>
          <SidebarMenu>
            <DeploySection />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Build — Agents · Integrations · Composer */}
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

        {/* Manage — vendor keys · RT services · project settings */}
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
