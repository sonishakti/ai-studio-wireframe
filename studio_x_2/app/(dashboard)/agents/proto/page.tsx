"use client"

/**
 * THROWAWAY judging harness — round 3 (composition concepts, 2026-07-07):
 * five compositions of the builder, toggled with ?c=1..5 plus a Live/Draft
 * mode toggle. Same content (components/proto/shared.tsx); the axes are page
 * composition, density, and how the persistent elements (steps, agent, deploy
 * state) stay in fold. Deleted once the winner ships to AgentWizard.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { ConceptC1 } from "@/components/proto/concept-c1"
import { ConceptC2 } from "@/components/proto/concept-c2"
import { ConceptC3 } from "@/components/proto/concept-c3"
import { ConceptC4 } from "@/components/proto/concept-c4"
import { ConceptC5 } from "@/components/proto/concept-c5"
import type { ProtoMode } from "@/components/proto/shared"

const CONCEPTS = [
  { c: 1, name: "Cockpit rail", C: ConceptC1 },
  { c: 2, name: "Command strip", C: ConceptC2 },
  { c: 3, name: "Split canvas", C: ConceptC3 },
  { c: 4, name: "Inspector", C: ConceptC4 },
  { c: 5, name: "Scroll-spy one-pager", C: ConceptC5 },
]

export default function ProtoPage() {
  const [c, setC] = React.useState(1)
  const [mode, setMode] = React.useState<ProtoMode>("live")
  React.useEffect(() => {
    const n = parseInt(new URLSearchParams(window.location.search).get("c") ?? "1", 10)
    if (n >= 1 && n <= 5) setC(n)
  }, [])
  const Active = (CONCEPTS.find((x) => x.c === c)?.C ?? ConceptC1) as React.ComponentType<{ mode: ProtoMode }>

  return (
    <div className="relative flex-1" data-fluid>
      <Active mode={mode} />
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border bg-popover/95 px-2 py-1.5 shadow-lg backdrop-blur">
        {CONCEPTS.map((x) => (
          <button
            key={x.c}
            type="button"
            onClick={() => {
              setC(x.c)
              const url = new URL(window.location.href)
              url.searchParams.set("c", String(x.c))
              window.history.replaceState({}, "", url)
            }}
            className={cn(
              "rounded-full px-2 py-1 text-xs font-medium transition-colors",
              c === x.c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {x.c}
          </button>
        ))}
        <span className="px-2 text-xs text-muted-foreground">{CONCEPTS.find((x) => x.c === c)?.name}</span>
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
