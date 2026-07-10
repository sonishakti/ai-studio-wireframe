"use client"

import * as React from "react"
import { PhoneIncoming, PhoneOutgoing, Code2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StepProps } from "@/components/wizard/types"
import { typeLabel, type AgentType } from "@/lib/wizard-draft"

/**
 * Step 2 — Select agent type. Batch calls · Inbound · Code — batch leads because
 * campaign is the flagship channel (LEARNINGS §20, 2026-06-17). The choice
 * branches Step 4 (Configure) and unlocks Steps 3–5.
 */

const TYPES: {
  id: AgentType
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    id: "outbound",
    title: typeLabel("outbound"),
    desc: "Calls through a contact list you upload.",
    icon: PhoneOutgoing,
  },
  {
    id: "inbound",
    title: typeLabel("inbound"),
    desc: "Answers a phone number 24/7, or a web widget.",
    icon: PhoneIncoming,
  },
  {
    id: "code",
    title: typeLabel("code"),
    desc: "Runs inside your own app. No phone number.",
    icon: Code2,
  },
]

export function StepType({ draft, update, liveNote }: StepProps & { liveNote?: string }) {
  return (
    <div className="space-y-5">
      {/* No inner h2: the section header above already names this step. */}
      <p className="text-sm text-muted-foreground">
        How will {draft.name || "your agent"} reach people?
      </p>
      {/* Pre-click consequence for a LIVE agent: say what switching does BEFORE
          the click; the stash+Undo toast stays as the recovery layer (user-test
          P1: "ask me first, don't console me after"). */}
      {liveNote && (
        <p className="text-xs text-muted-foreground">{liveNote}</p>
      )}

      {/* Three across at 4/12 each. Compact two-line cards on the select-box
          scale — the icon sits inline with the title instead of in a 36px tile
          (owner 2026-07-10: these dwarfed every other control). */}
      <div className="grid grid-cols-12 gap-2">
        {TYPES.map((t) => {
          const Icon = t.icon
          const selected = draft.type === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ type: t.id })}
              aria-pressed={selected}
              className={cn(
                "col-span-12 flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors sm:col-span-4",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-accent/40",
              )}
            >
              <span className="flex w-full items-center gap-2">
                <Icon className={cn("h-4 w-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
              </span>
              <span className="text-xs text-muted-foreground">{t.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
