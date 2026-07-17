"use client"

import * as React from "react"
import { RadioCard, RadioCardGroup } from "@/components/wizard/radio-cards"
import type { StepProps } from "@/components/wizard/types"
import { typeLabel, type AgentType } from "@/lib/wizard-draft"

/**
 * Step 2 — Select agent type. Batch calls · Inbound · Code — batch leads because
 * campaign is the flagship channel (LEARNINGS §20, 2026-06-17). The choice
 * branches the Deploy step.
 *
 * Radio-cards without icons (Figma direction 2026-07-14): title + one support
 * line + the radio circle carry the choice; the rail owns iconography.
 */

const TYPES: { id: AgentType; title: string; desc: string }[] = [
  {
    id: "outbound",
    title: typeLabel("outbound"),
    desc: "Calls through a contact list you upload.",
  },
  {
    id: "inbound",
    title: typeLabel("inbound"),
    desc: "Answers a phone number 24/7, or a web widget.",
  },
  {
    id: "code",
    title: typeLabel("code"),
    desc: "Runs inside your own app. No phone number.",
  },
]

export function StepType({ draft, update, liveNote, displayType }: StepProps & {
  liveNote?: string
  /** UI-level selection override (owner 2026-07-17: never pre-select — the
   *  cards show no choice until the user makes one; `null` = show nothing
   *  selected even when draft.type is set, `undefined` = mirror the draft). */
  displayType?: AgentType | null
}) {
  return (
    // @container: reflow by the center column's real width (the shell can
    // leave it ~280px at xl viewports), not the viewport.
    <div className="@container space-y-5">
      <div className="space-y-1">
        {/* The question IS the heading (Figma 2026-07-14). */}
        <h4 className="text-base font-medium">
          How will {draft.name || "your agent"} handle calls?
        </h4>
        {/* Pre-click consequence for a LIVE agent: say what switching does BEFORE
            the click; the stash+Undo toast stays as the recovery layer (user-test
            P1: "ask me first, don't console me after"). */}
        {liveNote ? <p className="text-xs text-muted-foreground">{liveNote}</p> : null}
      </div>

      <RadioCardGroup
        value={(displayType === undefined ? draft.type : displayType) ?? ""}
        onValueChange={(v) => v && update({ type: v as AgentType })}
        aria-label="Agent type"
        className="gap-4 @2xl:grid-cols-4"
      >
        {TYPES.map((t) => (
          <RadioCard key={t.id} value={t.id} title={t.title} description={t.desc} />
        ))}
      </RadioCardGroup>
    </div>
  )
}
