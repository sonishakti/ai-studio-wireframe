"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// ─── Deploy hub nav ───────────────────────────────────────────────────────────
//
// 2026-06-11 IA revamp: intent-first, not channel-first. The hub's surfaces are
// the two deployment intents (Inbound = answer, Batch Calls = outbound CSV
// dialing), the number inventory, and Embed/Code for non-telephony placement.
// One deployment = one agent on one channel; the channel is picked inside the
// intent flow, never as a top-level tab.
// See references/ia-revamp-agent-vs-deployment.md.
const TABS = [
  { label: "Overview", href: "/deploy" },
  { label: "Inbound", href: "/deploy/inbound" },
  { label: "Batch Calls", href: "/deploy/batch-calls" },
  { label: "Phone Numbers", href: "/deploy/phone-numbers" },
  { label: "Web Widget", href: "/deploy/web-widget" },
  { label: "Code", href: "/deploy/code" },
]

function isTabActive(href: string, pathname: string): boolean {
  // Overview only matches the hub root exactly (every surface lives under
  // /deploy/*, so a prefix match would keep Overview perpetually active).
  if (href === "/deploy") return pathname === "/deploy"
  return pathname === href || pathname.startsWith(href + "/")
}

export function DeployNav({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="border-b bg-background px-6">
      <div className="flex items-center justify-between gap-3 pt-4">
        <h1 className="text-xl font-semibold tracking-tight">Deploy</h1>
        {action}
      </div>
      <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
        {TABS.map((tab) => {
          const active = isTabActive(tab.href, pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                active
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
