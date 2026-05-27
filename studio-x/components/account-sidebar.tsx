"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  CheckSquare,
  CreditCard,
  Store,
  Settings,
  Lock,
  Code2,
  Webhook,
  ScrollText,
  Wrench,
  Key,
  HelpCircle,
  Ticket,
  Sparkles,
  MessageCircle,
  Bell,
  ChevronRight,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
import { cn } from "@/lib/utils"

// ─── account nav structure (matches Figma node 6667:6992) ────────────────────

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

// "View all plans" is the only item with expandable sub-items in the Figma —
// they show product-level subscription destinations.
const PLAN_PRODUCTS = [
  { label: "Agent Studio",    href: "/billing/plans?product=agent-studio" },
  { label: "RTC Pre-paid",    href: "/billing/plans?product=rtc-prepaid"  },
  { label: "Signaling",       href: "/billing/plans?product=signaling"    },
  { label: "Chat",            href: "/billing/plans?product=chat"         },
]

const NAV_ACCOUNT: NavItem[] = [
  { label: "Billing",                href: "/billing",        icon: CreditCard },
  { label: "Extensions Marketplace", href: "/extensions",     icon: Store      },
  { label: "Preferences",            href: "/preferences",    icon: Settings   },
]

const NAV_DEVELOPER: NavItem[] = [
  { label: "RESTful API",     href: "/developer/restful-api",     icon: Code2     },
  { label: "Webhooks",        href: "/developer/webhooks",        icon: Webhook   },
  { label: "Audit Logs",      href: "/developer/audit-logs",      icon: ScrollText },
  { label: "SDK Toolkit",     href: "/developer/toolkit",         icon: Wrench    },
  { label: "AA Credentials",  href: "/developer/aa-credentials",  icon: Key       },
  { label: "Licensing",       href: "/developer/licensing",       icon: Lock      },
]

const NAV_HELP: NavItem[] = [
  { label: "Help Hub",        href: "/help",              icon: HelpCircle    },
  { label: "Contact Support", href: "/help/contact",      icon: MessageCircle },
  { label: "My Tickets",      href: "/help/tickets",      icon: Ticket        },
  { label: "What's New",      href: "/help/whats-new",    icon: Sparkles      },
  { label: "Notifications",   href: "/notifications",     icon: Bell          },
]

// ─── shared NavLink ──────────────────────────────────────────────────────────

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

// ─── plans group (with collapsed sub-items, like Figma) ──────────────────────

function PlansGroup() {
  const pathname = usePathname()
  const onPlansPage = pathname.startsWith("/billing/plans")

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={onPlansPage} tooltip="View all plans">
        <Link href="/billing/plans">
          <CheckSquare className="h-4 w-4" />
          <span>View all plans</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuSub>
        {PLAN_PRODUCTS.map((p) => (
          <SidebarMenuSubItem key={p.href}>
            <SidebarMenuSubButton asChild>
              <Link href={p.href}>{p.label}</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    </SidebarMenuItem>
  )
}

// ─── user menu (still needed at footer for theme + log out) ─────────────────

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
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
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

// ─── main export ─────────────────────────────────────────────────────────────

export function AccountSidebar() {
  return (
    <Sidebar variant="inset">
      {/* Header: ← Back to project */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/home">
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
        {/* ACCOUNT */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarMenu>
            <PlansGroup />
            {NAV_ACCOUNT.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* DEVELOPER SETTINGS */}
        <SidebarGroup>
          <SidebarGroupLabel>Developer Settings</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_DEVELOPER.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* HELP */}
        <SidebarGroup>
          <SidebarGroupLabel>Help & Support</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_HELP.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: account user menu (still has theme/log out) */}
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
