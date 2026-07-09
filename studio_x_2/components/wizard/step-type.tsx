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
    desc: "Your agent calls through a contact list you upload, one person at a time.",
    icon: PhoneOutgoing,
  },
  {
    id: "inbound",
    title: typeLabel("inbound"),
    desc: "Your agent answers on a phone number, 24/7, or as a web widget on your site.",
    icon: PhoneIncoming,
  },
  {
    id: "code",
    title: typeLabel("code"),
    desc: "Run the agent inside your own app via the SDK or API. No phone number required.",
    icon: Code2,
  },
]

export function StepType({ draft, update }: StepProps) {
  return (
    <div className="space-y-5">
      {/* No inner h2: the section header above already names this step. */}
      <p className="text-sm text-muted-foreground">
        How will {draft.name || "your agent"} reach people? You can change this any time.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
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
                "relative flex flex-col gap-3 rounded-lg border p-4 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-accent/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {selected && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
