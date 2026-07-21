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
 *
 * Decision tiles (Lazyweb design-improve 2026-07-20, F3): the channel pick is
 * the decision that determines first paid minutes, so each card carries a
 * "Best for" line and the currently-live channel wears its Live mark ON the
 * card — the consequence is visible at the point of choice, not buried in a
 * sentence above.
 */

const TYPES: { id: AgentType; title: string; desc: string; bestFor: string }[] = [
  {
    id: "outbound",
    title: typeLabel("outbound"),
    desc: "Calls through a contact list you upload.",
    bestFor: "Outreach, reminders, surveys",
  },
  {
    id: "inbound",
    title: typeLabel("inbound"),
    desc: "Answers a phone number 24/7, or a web widget.",
    bestFor: "Support lines, front desk, after-hours",
  },
  {
    id: "code",
    title: typeLabel("code"),
    desc: "Runs inside your own app. No phone number.",
    bestFor: "In-app assistants, custom stacks",
  },
]

export function StepType({ draft, update, liveNote, displayType, liveType }: StepProps & {
  liveNote?: string
  /** UI-level selection override (owner 2026-07-17: never pre-select — the
   *  cards show no choice until the user makes one; `null` = show nothing
   *  selected even when draft.type is set, `undefined` = mirror the draft). */
  displayType?: AgentType | null
  /** The DEPLOYED channel of a live agent — its card wears the Live mark so
   *  "which one is carrying traffic" is answered on the tile itself. */
  liveType?: AgentType | null
}) {
  return (
    // The question lives in the row LABEL now ([label | content] anatomy,
    // owner 2026-07-21) — this component is the pure RHS: consequence banner
    // (live agents) + the channel cards.
    <div className="space-y-4">
      {/* Pre-click consequence for a LIVE agent: say what switching does BEFORE
          the click; the stash+Undo toast stays as the recovery layer. A muted
          caption was skimmed past (user-test 2026-07-21 verification, P0 #2) —
          warning-toned so the consequence registers at the point of choice,
          with the keep-both alternative on the same line. */}
      {liveNote ? (
        <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-foreground">
          {liveNote}{" "}
          <a href="/agents/new/edit" className="underline underline-offset-2 text-muted-foreground hover:text-foreground">
            Want both channels? Create a second agent instead.
          </a>
        </p>
      ) : null}

      <RadioCardGroup
        value={(displayType === undefined ? draft.type : displayType) ?? ""}
        onValueChange={(v) => v && update({ type: v as AgentType })}
        aria-label="Agent type"
        className="gap-4 @2xl:grid-cols-4"
      >
        {TYPES.map((t) => (
          <RadioCard
            key={t.id}
            value={t.id}
            title={
              t.id === liveType ? (
                <span className="flex items-center gap-2">
                  {t.title}
                  <span className="flex items-center gap-1 text-xs font-medium text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden /> Live
                  </span>
                </span>
              ) : (
                t.title
              )
            }
            description={
              <>
                {t.desc}
                <span className="mt-1 block text-xs text-muted-foreground/70">Best for: {t.bestFor}</span>
              </>
            }
          />
        ))}
      </RadioCardGroup>

      {/* BYO-telephony stated BEFORE the channel choice, not as caller-ID fine
          print mid-flow (repeat S2 across four 2026-07-21 test rounds): a
          first-timer without a number must learn the wall before investing in
          prompt + CSV work. */}
      <p className="text-xs text-muted-foreground">
        Phone channels are bring-your-own number — Agora doesn&apos;t sell numbers. Connect your
        carrier&apos;s via SIP in{" "}
        <a href="/integrations?tab=channels" className="underline underline-offset-2 hover:text-foreground">
          Resources › Deployment Channels
        </a>
        . Code / SDK and the web widget need none.
      </p>
    </div>
  )
}
