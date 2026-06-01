"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Services", href: "/realtime-services" },
  { label: "Sessions", href: "/realtime-services/sessions" },
]

export function RealtimeNav() {
  const pathname = usePathname()
  return (
    <div className="border-b bg-background px-6">
      <h1 className="text-xl font-semibold tracking-tight pt-4">Realtime Services</h1>
      <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/realtime-services"
              ? pathname === "/realtime-services"
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
