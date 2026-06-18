"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Local nav for the global Monitor hub. The sidebar collapsed Monitor /
// Call History into a single "Monitor" entry; these tabs are the
// cross-deployment rollup. Each surface is also scoped inside a campaign.
// "Sessions" = agent conversation sessions (Conversational AI), not RTC telemetry.
// (Chat History removed 2026-06-16 — not approved by product.)
const TABS = [
  { label: "Agents Overview", href: "/monitor" },
  { label: "Call History", href: "/calls" },
  { label: "Sessions", href: "/sessions" },
  { label: "Diagnostics", href: "/monitor/diagnostics" },
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
        {/* Realtime Services — an inline tab per design 05. RTE telemetry is
            per-minute usage, which lives in Billing, so this cross-links there
            (honors the locked IA: RTE = usage, not agent sessions). */}
        <Link
          href="/billing/usage"
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          Realtime Services
          <ArrowUpRight className="h-3 w-3 opacity-60" />
        </Link>
      </nav>
    </div>
  )
}
