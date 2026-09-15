"use client"

import * as React from "react"
import { Code2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { SectionRow, SectionRows } from "@/components/wizard/section-row"
import { StepAdvanced, HistoryField } from "@/components/wizard/step-advanced"
import { TurnTakingRow } from "@/components/wizard/turn-taking-row"
import { ListeningRows } from "@/components/wizard/listening-rows"
import { HangupSettings, PacingSettings, TransferSettings, CampaignDialingFields } from "@/components/wizard/step-call-settings"
import type { StepProps } from "@/components/wizard/types"

/**
 * Advanced settings — ONE panel, not five sheets (owner 2026-09-15).
 *
 * The builder had an Advanced Settings door in Voice & Models, another in
 * Deployment, a conversation-history field loose inside the model expander and
 * a Custom Config door beside it. Four hiding places, and the user was expected
 * to remember which one held what.
 *
 * So: one panel, one list, with every group named on the left. A section's
 * "Advanced settings" button opens this same panel scrolled to its group — the
 * anchor changes where you land, never what is available.
 */

export type AdvancedAnchor = "speech" | "models" | "call"

/** Open the panel from anywhere, landing on a group. Same event idiom as the
 *  config drawer, so no prop has to be threaded through five components. */
export function openAdvanced(anchor: AdvancedAnchor) {
  window.dispatchEvent(new CustomEvent("sx:open-advanced", { detail: anchor }))
}

const GROUPS: { id: AdvancedAnchor; label: string; holds: string }[] = [
  { id: "speech", label: "Speech and turn-taking", holds: "When it starts talking, when it stops, how it handles interruptions, what it listens for" },
  { id: "models", label: "Models", holds: "How much conversation it keeps in context, and the raw engine config" },
  { id: "call", label: "Call behaviour", holds: "Silence, hang-up, pacing, transfer to a human, and how hard a batch run dials" },
]

export function AdvancedSettingsSheet({
  open,
  onOpenChange,
  anchor = "speech",
  draft,
  update,
}: StepProps & {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Which group to land on. Everything stays reachable either way. */
  anchor?: AdvancedAnchor
}) {
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState<AdvancedAnchor>(anchor)

  const goTo = React.useCallback((id: AdvancedAnchor) => {
    setActive(id)
    const el = bodyRef.current?.querySelector<HTMLElement>(`#adv-${id}`)
    el?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [])

  // Landing: the anchor decides where you start, after the sheet has laid out.
  React.useEffect(() => {
    if (!open) return
    setActive(anchor)
    const t = window.setTimeout(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>(`#adv-${anchor}`)
      el?.scrollIntoView({ block: "start" })
    }, 60)
    return () => window.clearTimeout(t)
  }, [open, anchor])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">Advanced settings</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Everything {draft.name || "this agent"} can do that the main flow does not ask for.
          </p>
        </SheetHeader>

        <div className="flex min-h-0 flex-1">
          {/* The contents page. Nothing is hidden behind a door you have to
              guess at: every group is named here with what it holds. */}
          <nav className="hidden w-56 shrink-0 overflow-y-auto border-r border-border p-3 sm:block" aria-label="Advanced settings">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => goTo(g.id)}
                aria-current={active === g.id ? "true" : undefined}
                className={cn(
                  "mb-1 block w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active === g.id && "bg-accent/60",
                )}
              >
                <span className="block text-sm font-medium">{g.label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{g.holds}</span>
              </button>
            ))}
          </nav>

          <div ref={bodyRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-5">
            <section id="adv-speech" className="scroll-mt-4">
              <h3 className="pb-1 text-sm font-semibold">Speech and turn-taking</h3>
              <SectionRows>
                {/* A realtime model owns turn-taking natively, so no preset row. */}
                {draft.stack.pipeline !== "mllm" && (
                  <TurnTakingRow value={draft.advanced} onChange={(advanced) => update({ advanced })} />
                )}
                <ListeningRows
                  value={draft.advanced}
                  onChange={(advanced) => update({ advanced })}
                  agentId={draft.agentId}
                />
                <StepAdvanced
                  value={draft.advanced}
                  onChange={(advanced) => update({ advanced })}
                  realtime={draft.stack.pipeline === "mllm"}
                  showHistory={false}
                  agentId={draft.agentId}
                />
              </SectionRows>
            </section>

            <section id="adv-models" className="mt-8 scroll-mt-4 border-t border-border pt-6">
              <h3 className="pb-1 text-sm font-semibold">Models</h3>
              <SectionRows>
                <SectionRow
                  label="Conversation history"
                  hint="How much of the call the agent keeps in context. More history costs more per turn."
                >
                  <HistoryField
                    id="adv-history"
                    value={draft.advanced}
                    onChange={(advanced) => update({ advanced })}
                  />
                </SectionRow>
                <SectionRow
                  label="Custom config"
                  hint="The raw engine config as JSON. Sections you override here lock in the builder until you empty them."
                >
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false)
                      window.dispatchEvent(new CustomEvent("sx:open-config-drawer", { cancelable: true }))
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-left text-sm transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Code2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 font-medium">Edit config JSON</span>
                  </button>
                </SectionRow>
              </SectionRows>
            </section>

            <section id="adv-call" className="mt-8 scroll-mt-4 border-t border-border pt-6">
              <h3 className="pb-1 text-sm font-semibold">Call behaviour</h3>
              <SectionRows>
                <HangupSettings draft={draft} update={update} />
                <PacingSettings draft={draft} update={update} />
                <TransferSettings draft={draft} update={update} />
                {/* Batch only: how hard it dials. Kept off the main flow, but
                    findable from the contents list beside it. */}
                {draft.channels[0] === "batch" && draft.campaigns[0] && (
                  <SectionRow label="Dialling" hint="How many calls run at once, and what happens when nobody answers.">
                    <CampaignDialingFields
                      campaign={draft.campaigns[0]}
                      onChange={(p) => update({ campaigns: draft.campaigns.map((c, i) => (i === 0 ? { ...c, ...p } : c)) })}
                    />
                  </SectionRow>
                )}
              </SectionRows>
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-border px-5 py-3">
          <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
