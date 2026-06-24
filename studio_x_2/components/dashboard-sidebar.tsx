"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AccountSidebar } from "@/components/account-sidebar"

// Route prefixes that are account-scoped (cross-project, tied to the user).
// Anything matching these will see the AccountSidebar instead of the
// project-scoped AppSidebar.
const ACCOUNT_PREFIXES = [
  "/billing",
  "/extensions",
  "/preferences",
  "/developer",
  "/help",
  "/notifications",
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const isAccount = ACCOUNT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  )

  return isAccount ? <AccountSidebar /> : <AppSidebar />
}
