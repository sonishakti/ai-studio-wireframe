"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ComposerChat } from "@/components/composer-chat"

/**
 * Global Composer slide-over.
 *
 * Mount once in the dashboard layout. Any component can open it by
 * dispatching the window event:
 *
 *   window.dispatchEvent(new CustomEvent("sx:open-composer"))
 *
 * The panel sets a context chip from the current route so the assistant
 * has page-level context for debug/guidance questions.
 */
export function ComposerPanelMount() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener("sx:open-composer", onOpen as EventListener)
    return () => window.removeEventListener("sx:open-composer", onOpen as EventListener)
  }, [])

  // Don't double-overlay when the user is already on the full /composer page.
  const isOnComposer = pathname === "/composer"
  if (isOnComposer) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="sm:max-w-[480px] w-full p-0 flex flex-col"
        showCloseButton={false}
      >
        <ComposerChat
          compact
          contextChip={contextChipFor(pathname)}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

/** Open the global Composer panel from anywhere. */
export function openComposerPanel() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sx:open-composer"))
  }
}

// ─── Route → context chip mapping ────────────────────────────────────────────

function contextChipFor(pathname: string): string | undefined {
  if (pathname.startsWith("/agents/") && pathname.endsWith("/edit")) return "Agent editor"
  if (pathname === "/agents") return "Agents"
  if (pathname === "/deploy/batch-calls") return "Batch Calls"
  if (pathname.startsWith("/deploy/batch-calls/new")) return "New batch"
  if (pathname === "/monitor") return "Monitor"
  if (pathname === "/calls") return "Call History"
  if (pathname === "/deploy/inbound") return "Inbound"
  if (pathname === "/deploy/phone-numbers") return "Phone Numbers"
  if (pathname.startsWith("/deploy/phone-numbers/")) return "Phone Number"
  if (/^\/deploy\/batch-calls\/[^/]+$/.test(pathname)) return "Batch detail"
  if (/^\/deploy\/inbound\/[^/]+$/.test(pathname)) return "Inbound detail"
  if (pathname === "/sessions") return "Sessions"
  if (pathname === "/realtime-services") return "Realtime Services"
  if (pathname.startsWith("/project/")) return "Project"
  if (pathname.startsWith("/billing")) return "Billing"
  if (pathname === "/integrations") return "Integrations"
  return undefined
}
