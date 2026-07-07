"use client"

/**
 * THROWAWAY judging harness — round 2 (master-detail direction, 2026-07-07):
 * ten arrangements of "5-step unbroken list card + selected-step config card",
 * toggled with ?v=1..10. Same data (components/proto/shared.tsx); the axes are
 * breadcrumb/progress treatment, list density, and detail-card structure.
 * Deleted once the winner ships to AgentWizard.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { MasterP1 } from "@/components/proto/master-p1"
import { MasterP2 } from "@/components/proto/master-p2"
import { MasterP3 } from "@/components/proto/master-p3"
import { MasterP4 } from "@/components/proto/master-p4"
import { MasterP5 } from "@/components/proto/master-p5"
import { MasterP6 } from "@/components/proto/master-p6"
import { MasterP7 } from "@/components/proto/master-p7"
import { MasterP8 } from "@/components/proto/master-p8"
import { MasterP9 } from "@/components/proto/master-p9"
import { MasterP10 } from "@/components/proto/master-p10"

const VARIANTS = [
  { v: 1, name: "Mail mirror", C: MasterP1 },
  { v: 2, name: "List-as-breadcrumb", C: MasterP2 },
  { v: 3, name: "Top trail + slim list", C: MasterP3 },
  { v: 4, name: "Stepper only", C: MasterP4 },
  { v: 5, name: "Rich rows + rail", C: MasterP5 },
  { v: 6, name: "Up-next teaser", C: MasterP6 },
  { v: 7, name: "Identity in list card", C: MasterP7 },
  { v: 8, name: "Detail + collapsed rest", C: MasterP8 },
  { v: 9, name: "Scroll-spy all-upfront", C: MasterP9 },
  { v: 10, name: "In-card breadcrumb", C: MasterP10 },
]

export default function ProtoPage() {
  const [v, setV] = React.useState(1)
  const [mode, setMode] = React.useState<"live" | "draft">("live")
  React.useEffect(() => {
    const n = parseInt(new URLSearchParams(window.location.search).get("v") ?? "1", 10)
    if (n >= 1 && n <= 10) setV(n)
  }, [])
  const Active = VARIANTS.find((x) => x.v === v)?.C ?? MasterP1
  const ActiveAny = Active as React.ComponentType<{ mode?: "live" | "draft" }>

  return (
    <div className="relative flex-1">
      <ActiveAny mode={mode} />
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border bg-popover/95 px-2 py-1.5 shadow-lg backdrop-blur">
        {VARIANTS.map((x) => (
          <button
            key={x.v}
            type="button"
            onClick={() => {
              setV(x.v)
              const url = new URL(window.location.href)
              url.searchParams.set("v", String(x.v))
              window.history.replaceState({}, "", url)
            }}
            className={cn(
              "rounded-full px-2 py-1 text-xs font-medium transition-colors",
              v === x.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {x.v}
          </button>
        ))}
        <span className="px-2 text-xs text-muted-foreground">{VARIANTS.find((x) => x.v === v)?.name}</span>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "live" ? "draft" : "live"))}
          className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "live" ? "Live" : "Draft"}
        </button>
      </div>
    </div>
  )
}
