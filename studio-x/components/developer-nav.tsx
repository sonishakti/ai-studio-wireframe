"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Overview",        href: "/developer" },
  { label: "RESTful API",     href: "/developer/restful-api" },
  { label: "Webhooks",        href: "/developer/webhooks" },
  { label: "Audit Logs",      href: "/developer/audit-logs" },
  { label: "SDK Toolkit",     href: "/developer/toolkit" },
  { label: "Service Accounts", href: "/developer/aa-credentials" },
  { label: "Licensing",       href: "/developer/licensing" },
]

export function DeveloperNav({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname()
  const activeTab =
    TABS.find((t) =>
      t.href === "/developer"
        ? pathname === "/developer"
        : pathname.startsWith(t.href),
    ) ?? TABS[0]
  return (
    <div className="border-b bg-background px-6">
      <div className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Developer Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Developer Hub / {activeTab.label}
          </p>
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto" aria-label="Developer Hub sections">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/developer"
              ? pathname === "/developer"
              : pathname.startsWith(tab.href)
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
