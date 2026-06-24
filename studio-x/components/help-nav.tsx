"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Overview",         href: "/help" },
  { label: "Contact Support",  href: "/help/contact" },
  { label: "Contact Sales",    href: "/help/contact-sales" },
  { label: "My Tickets",       href: "/help/tickets" },
  { label: "What's New",       href: "/help/whats-new" },
]

export function HelpNav() {
  const pathname = usePathname()
  return (
    <div className="border-b bg-background px-6">
      <h1 className="text-xl font-semibold tracking-tight pt-4">Help Hub</h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        Docs, support tickets, release notes, and ways to reach us.
      </p>
      <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
        {TABS.map((tab) => {
          // Exact match or a true sub-path boundary, so `/help/contact` does
          // NOT prefix-match `/help/contact-sales` (both would highlight).
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/")
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
