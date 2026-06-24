"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Overview", href: "/billing" },
  { label: "Usage", href: "/billing/usage" },
  { label: "Plans", href: "/billing/plans" },
  { label: "Subscriptions", href: "/billing/subscriptions" },
  { label: "Invoices", href: "/billing/invoices" },
  { label: "Transactions", href: "/billing/transactions" },
  { label: "Payment Methods", href: "/billing/payment-methods" },
]

export function BillingNav() {
  const pathname = usePathname()
  return (
    <div className="border-b bg-background px-6">
      <h1 className="text-xl font-semibold tracking-tight pt-4">Billing</h1>
      <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/billing"
              ? pathname === "/billing"
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
