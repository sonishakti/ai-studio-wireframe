"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Local nav for the global Monitor hub. The sidebar collapsed Monitor /
// Call History into a single "Monitor" entry; these tabs are the
// cross-deployment rollup. Each surface is also scoped inside a campaign.
// "Sessions" = agent conversation sessions (Conversational AI), not RTC telemetry.
// (Chat History removed 2026-06-16 — not approved by product.)
const TABS = [
  { label: "Overview", href: "/monitor" },
  { label: "Call History", href: "/calls" },
  { label: "Sessions", href: "/sessions" },
  { label: "Diagnostics", href: "/monitor/diagnostics" },
]

export function MonitorNav({ action, subtitle }: { action?: React.ReactNode; subtitle?: string }) {
  const pathname = usePathname()
  return (
    <div className="border-b bg-background px-6">
      <div className="flex items-center justify-between gap-3 pt-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Monitor</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {/* RTE = per-minute usage (lives in Billing). Not a tab — a quiet
              wayfinding nudge for anyone hunting for Realtime usage. */}
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/billing/usage">
              Looking for usage? <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {action}
        </div>
      </div>
      <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto" aria-label="Monitor sections">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/monitor"
              ? pathname === "/monitor"
              : pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
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
      </nav>
    </div>
  )
}
