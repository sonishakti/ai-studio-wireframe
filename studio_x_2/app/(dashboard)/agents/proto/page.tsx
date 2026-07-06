"use client"

/**
 * THROWAWAY arrangement-judging harness — five re-arrangements of the builder
 * landing, toggled with ?v=1..5 (floating switcher). Same content inventory
 * (components/proto/shared.tsx); only the reading order / grouping /
 * hierarchy differ. Deleted once a winner ships to AgentWizard.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { VariantNarrative } from "@/components/proto/builder-v1"
import { VariantGrouped } from "@/components/proto/builder-v2"
import { VariantSpecSheet } from "@/components/proto/builder-v3"
import { VariantStepper } from "@/components/proto/builder-v4"
import { VariantTiles } from "@/components/proto/builder-v5"

const VARIANTS = [
  { v: 1, name: "Narrative column", C: VariantNarrative },
  { v: 2, name: "Grouped chunks", C: VariantGrouped },
  { v: 3, name: "Spec sheet", C: VariantSpecSheet },
  { v: 4, name: "Focus stepper", C: VariantStepper },
  { v: 5, name: "Dashboard tiles", C: VariantTiles },
]

export default function ProtoPage() {
  const [v, setV] = React.useState(1)
  React.useEffect(() => {
    const n = parseInt(new URLSearchParams(window.location.search).get("v") ?? "1", 10)
    if (n >= 1 && n <= 5) setV(n)
  }, [])
  const Active = VARIANTS.find((x) => x.v === v)?.C ?? VariantNarrative

  return (
    <div className="relative flex-1">
      <Active />
      {/* Floating switcher */}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-popover/95 px-2 py-1.5 shadow-lg backdrop-blur">
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
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              v === x.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            V{x.v}
          </button>
        ))}
        <span className="px-2 text-xs text-muted-foreground">{VARIANTS.find((x) => x.v === v)?.name}</span>
      </div>
    </div>
  )
}
