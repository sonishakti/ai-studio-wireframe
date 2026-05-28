"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { track, Events } from "@/lib/analytics"

/**
 * Right-side button in the sidebar footer.
 *
 * Click opens a dropdown menu listing the AccountSidebar destinations so
 * users can pick exactly where they're going (Billing / Extensions / etc.)
 * Each selection navigates and the layout swaps the sidebar to AccountSidebar.
 *
 * This replaces the prior "navigate-to-Preferences-and-hope" behavior that
 * /evaluate flagged as P1 (Issue 1: mystery meat avatar).
 */
export function AccountAvatarButton() {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="default"
              className="!w-9 !h-9 shrink-0 justify-center !p-0"
              onClick={() => track(Events.account_menu_opened)}
            >
              <Avatar className="h-7 w-7 rounded-lg">
                <AvatarImage src="" alt="" />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                  SS
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Account menu</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          Account menu
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent className="w-60" side="top" align="end" sideOffset={8}>
        <DropdownMenuLabel className="cursor-default focus:bg-transparent">
          <p className="text-sm font-medium leading-none">Shakti Soni</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">soni28shakti@gmail.com</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/billing" className="gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" /> Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/extensions" className="gap-2">
            <Store className="h-4 w-4 text-muted-foreground" /> Extensions Marketplace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/preferences" className="gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" /> Preferences
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/developer" className="gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" /> Developer Hub
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help" className="gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" /> Help Hub
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" /> Notifications
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2"
          onSelect={(e) => {
            e.preventDefault()
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" />
          )}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          <kbd className="ml-auto text-xs font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded">d</kbd>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
