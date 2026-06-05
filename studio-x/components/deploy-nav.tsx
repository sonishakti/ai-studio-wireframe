"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// ─── Deploy hub nav ───────────────────────────────────────────────────────────
//
// Option 3 (2026-06-05, user-directed): one "Deploy" destination replaces the
// old top-level "Phone Numbers" + "Campaign" sidebar items and unifies every way
// an agent goes live. Tabs map to the REAL surfaces only — WhatsApp / SMS / Slack
// are added *inside* a campaign (via the wizard, which is where the old
// /deploy/{sms,whatsapp,slack} routes redirect), so they surface under Overview +
// Campaigns rather than as standalone tabs. "Campaign" stays the word for the
// outbound batch; the inbound-copy cleanup ("inbound campaign" → connection) is a
// separate pass.
const TABS = [
  { label: "Overview", href: "/deploy" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Phone Numbers", href: "/phone-numbers" },
  { label: "Web Widget", href: "/deploy/widget" },
  { label: "API & SDK", href: "/deploy/api" },
]

function isTabActive(href: string, pathname: string): boolean {
  // Overview only matches the hub root exactly (every channel page lives under
  // /deploy/*, so a prefix match would keep Overview perpetually active).
  if (href === "/deploy") return pathname === "/deploy"
  return pathname === href || pathname.startsWith(href + "/")
}

export function DeployNav({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="border-b bg-background px-6">
      <div className="flex items-center justify-between gap-3 pt-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Deploy
        </span>
        {action}
      </div>
      <nav className="flex items-center gap-1 mt-2 -mb-px overflow-x-auto">
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
