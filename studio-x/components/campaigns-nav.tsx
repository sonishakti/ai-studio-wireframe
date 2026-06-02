"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Campaigns", href: "/campaigns" },
  { label: "Phone Numbers", href: "/campaigns/phone-numbers" },
]

export function CampaignsNav() {
  const pathname = usePathname()
  return (
    <div className="border-b bg-background px-6">
      <h1 className="text-xl font-semibold tracking-tight pt-4">Campaigns</h1>
      <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/campaigns"
              ? pathname === "/campaigns"
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
      </nav>
    </div>
  )
}
