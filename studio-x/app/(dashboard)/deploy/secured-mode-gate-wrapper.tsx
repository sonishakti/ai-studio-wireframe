"use client"

import { usePathname } from "next/navigation"
import { SecuredModeGate } from "@/components/secured-mode-banner"

/**
 * Client wrapper for the deploy layout. Hides the gate on the /deploy hub
 * page itself (which is just a channel picker — gate makes more sense on
 * the specific channel setup pages).
 */
export function DeploySecuredModeGate() {
  const pathname = usePathname()
  // Don't gate the hub itself — only the per-channel setup pages.
  if (pathname === "/deploy") return null

  // STUB — in production this comes from the project state
  const securedModeEnabled = false
  return (
    <div className="px-6 pt-6">
      <SecuredModeGate enabled={securedModeEnabled} />
    </div>
  )
}
