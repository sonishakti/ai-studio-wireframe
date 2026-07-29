"use client"

import * as React from "react"
import { KeyRound, Code2 } from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { SectionRows } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { StackModelsDetail, StackModelPicker } from "@/components/wizard/stack-config"
import { StepAdvanced, HistoryField } from "@/components/wizard/step-advanced"
import { getVoiceArtifact, type VoiceArtifact } from "@/lib/voice-artifacts"
import type { AgentDraft } from "@/lib/wizard-draft"
import type { StepProps } from "@/components/wizard/types"

/**
 * VoiceAdvancedSheet — everything the Voice section keeps OFF the hot path
 * (v4 IA, 2026-07-28): model architecture (cascading vs realtime), the manual
 * STT/LLM/TTS vendor picks, conversation history, and the speech tuning
 * (turn-taking · attention & filters). One slide-out, two labeled groups —
 * the customize-rarely path shouldn't cost two affordances.
 */
export function VoiceAdvancedSheet({
  open,
  onOpenChange,
  draft,
  update,
  onStackChange,
}: StepProps & {
  open: boolean
  onOpenChange: (o: boolean) => void
  onStackChange: (stack: AgentDraft["stack"]) => void
}) {
  const persona: VoiceArtifact | undefined = React.useMemo(
    () => (draft.voice ? getVoiceArtifact(draft.voice.id) : undefined),
    [draft.voice],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">Advanced — models &amp; speech</SheetTitle>
          <p className="text-sm text-muted-foreground">
            The full stack behind the tier: architecture, vendors, and how {draft.name || "your agent"} listens and speaks.
          </p>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-5">
          <section className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Models &amp; architecture</p>
            <StackModelsDetail stack={draft.stack} onChange={onStackChange} showPicker={false} hideTitle />
            {/* STT → LLM → TTS stacked top to bottom (owner 2026-07-29). */}
            <StackModelPicker stack={draft.stack} onChange={onStackChange} personaName={persona?.name} hideTitle stacked />
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <InfoHint label="Using your own vendor accounts?">
                Add keys in{" "}
                <a href="/integrations?tab=credentials" className="underline underline-offset-2">
                  Resources › Credentials
                </a>{" "}
                — the ASR, LLM, and TTS you pick here will use them.
              </InfoHint>
            </div>
            <HistoryField
              id="wz-adv-history"
              value={draft.advanced}
              onChange={(advanced) => update({ advanced })}
            />
            {/* Power door (owner 2026-07-29: "give any advanced setting
                control here, eg adding custom config"). */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("sx:open-config-drawer", { cancelable: true }))}
              className="flex w-full items-center gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-left text-sm transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Code2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Custom config (JSON)</span>
                <span className="block text-xs text-muted-foreground">Edit the whole agent as JSON — overridden fields lock in the UI.</span>
              </span>
            </button>
          </section>

          <section className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Speech tuning</p>
            <SectionRows>
              <StepAdvanced
                value={draft.advanced}
                onChange={(advanced) => update({ advanced })}
                realtime={draft.stack.pipeline === "mllm"}
                showHistory={false}
              />
            </SectionRows>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
