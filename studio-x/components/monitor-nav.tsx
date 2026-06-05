"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Local nav for the global Monitor hub. The sidebar collapsed Monitor /
// Call History / Chat History into a single "Monitor" entry; these tabs are
// the cross-deployment rollup. Each surface is also scoped inside a campaign.
// "Sessions" = agent conversation sessions (Conversational AI), not RTC telemetry.
const TABS = [
  { label: "Overview", href: "/monitor" },
  { label: "Call History", href: "/calls" },
  { label: "Chat History", href: "/chats" },
  { label: "Sessions", href: "/sessions" },
]

export function MonitorNav({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="border-b bg-background px-6">
      <div className="flex items-center justify-between gap-3 pt-4">
        <h1 className="text-xl font-semibold tracking-tight">Monitor</h1>
        {action}
      </div>
      <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/monitor"
              ? pathname === "/monitor"
              : pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
        {/* RTE = per-minute usage. Cross-link to the canonical usage page
            (Realtime Services links here too — single destination, not a dupe). */}
        <Link
          href="/billing/usage"
          className="ml-auto flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap"
        >
          RTE usage
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </nav>
    </div>
  )
}
