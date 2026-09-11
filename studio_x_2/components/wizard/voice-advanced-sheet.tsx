"use client"

import * as React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { SectionRows } from "@/components/wizard/section-row"
import { StepAdvanced } from "@/components/wizard/step-advanced"
import { TurnTakingRow } from "@/components/wizard/turn-taking-row"
import { ListeningRows } from "@/components/wizard/listening-rows"
import type { AgentDraft } from "@/lib/wizard-draft"
import type { StepProps } from "@/components/wizard/types"

/**
 * VoiceAdvancedSheet — "Agent Speech Settings" (Figma 2916-3435): turn
 * detection, start/end of speech, interruptions, attention & filters. Models
 * and architecture moved INLINE into Voice & Models ("Or Configure models
 * manually") per the same frame set, so this sheet is speech-only.
 */
export function VoiceAdvancedSheet({
  open,
  onOpenChange,
  draft,
  update,
}: StepProps & {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Kept for call-site compatibility — models no longer live here. */
  onStackChange?: (stack: AgentDraft["stack"]) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">Agent Speech Settings</SheetTitle>
          <p className="text-sm text-muted-foreground">
            How {draft.name || "your agent"} listens, takes turns, and speaks.
          </p>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <SectionRows>
            {/* Design Tracker 02: the preset row and the Listening group sit
                ABOVE the raw rows, which keep the state. A realtime model owns
                turn-taking natively — no preset row there. */}
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
        </div>

        {/* Figma: an explicit Done, not just the X. */}
        <div className="shrink-0 border-t border-border px-5 py-3">
          <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
