"use client"

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

export function DeveloperNav() {
  const pathname = usePathname()
  return (
    <div className="border-b bg-background px-6">
      <h1 className="text-xl font-semibold tracking-tight pt-4">Developer Hub</h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        APIs, webhooks, SDKs, audit logs, and licensing for builders.
      </p>
      <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/developer"
              ? pathname === "/developer"
              : pathname.startsWith(tab.href)
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
      </nav>
    </div>
  )
}
