"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  CreditCard,
  Store,
  Settings,
  Code2,
  HelpCircle,
  Bell,
  Sun,
  Moon,
  LogOut,
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
  SidebarSeparator,
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

// ─── account nav — 6 items, no nesting ──────────────────────────────────────
//
// Every item here is a HUB. Sub-pages live as tabs INSIDE the hub
// (BillingNav, DeveloperNav, HelpNav) — not as nested sidebar items.
// This is the "if it deserves to be a tab in a page" principle applied:
// 15 sidebar items collapse to 6.
//
//   • Billing             → tabs: Overview · Plans · Subscriptions · Invoices ·
//                                 Transactions · Payment Methods
//   • Extensions Marketplace
//   • Preferences
//   • Developer Hub       → tabs: Overview · RESTful API · Webhooks · Audit Logs ·
//                                 SDK Toolkit · Service Accounts · Licensing
//   • Help Hub            → tabs: Overview · Contact Support · Contact Sales ·
//                                 My Tickets · What's New
//   • Notifications
// ─────────────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ACCOUNT: NavItem[] = [
  { label: "Billing",                href: "/billing",     icon: CreditCard },
  { label: "Extensions Marketplace", href: "/extensions",  icon: Store      },
  { label: "Preferences",            href: "/preferences", icon: Settings   },
]

const NAV_DEV_SUPPORT: NavItem[] = [
  { label: "Developer Hub", href: "/developer",     icon: Code2      },
  { label: "Help Hub",      href: "/help",          icon: HelpCircle },
  { label: "Notifications", href: "/notifications", icon: Bell       },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = pathname === item.href || pathname.startsWith(item.href + "/")
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function AccountUserMenu() {
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
            <span className="truncate text-xs text-muted-foreground">soni28shakti@gmail.com</span>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side="top" align="start" sideOffset={8}>
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Signed in as
        </DropdownMenuLabel>
        <DropdownMenuItem className="cursor-default focus:bg-accent/40">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Shakti Soni</p>
            <p className="text-xs text-muted-foreground truncate">soni28shakti@gmail.com</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark"
            ? <Sun className="h-4 w-4 text-muted-foreground" />
            : <Moon className="h-4 w-4 text-muted-foreground" />}
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

export function AccountSidebar() {
  return (
    <Sidebar variant="inset">
      {/* ← Back to project */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/agents">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Back to project</span>
                  <span className="truncate text-xs text-muted-foreground">My first project</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ACCOUNT.map((item) => <NavLink key={item.href} item={item} />)}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Developer & Support</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_DEV_SUPPORT.map((item) => <NavLink key={item.href} item={item} />)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AccountUserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
