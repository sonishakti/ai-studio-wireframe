"use client"

import * as React from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { SectionRow, SectionRows } from "@/components/wizard/section-row"
import { CampaignsCard } from "@/components/wizard/campaigns-card"
import {
  InboundCallSettings, HangupSettings, PacingSettings, TransferSettings,
} from "@/components/wizard/step-call-settings"
import { StepAnalysis } from "@/components/wizard/step-analysis"
import { StepPublish } from "@/components/wizard/step-publish"
import { hasChannel } from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/**
 * Section 4 — GO LIVE, the DEPLOY PANEL (v4 IA, 2026-07-28): everything
 * deployment-related lives here — batch CAMPAIGN MANAGEMENT (several per
 * agent: own CSV, caller ID, language, schedule; re-run; parallel), the
 * inbound call settings that used to follow the number pick, STRUCTURED
 * OUTPUTS (transcripts · recording · post-call extraction), and review &
 * deploy. Agent-level batch behavior (hang-up · pacing · transfer) sits in a
 * slide-out off the hot path.
 */
export function DeploySection({
  draft,
  update,
  live,
  deployCta,
  onPublish,
  onFix,
  publishRegionRef,
}: StepProps & {
  live: boolean
  deployCta?: string
  onPublish: () => void
  onFix: (step: number) => void
  publishRegionRef: React.Ref<HTMLDivElement>
}) {
  const [behaviorOpen, setBehaviorOpen] = React.useState(false)
  const batch = hasChannel(draft, "batch")
  const inbound = hasChannel(draft, "inbound")
  const session = hasChannel(draft, "code") && draft.channels.length === 1

  return (
    <div className="space-y-6">
      {/* Campaign management — full width (the 50/50 CSV grid needs it). */}
      {batch && (
        <div className="space-y-2">
          <CampaignsCard draft={draft} update={update} />
          <div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setBehaviorOpen(true)}>
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Batch call behavior — hang-up, pacing &amp; transfer
            </Button>
          </div>
        </div>
      )}

      <SectionRows>
        {/* Inbound settings live in the deploy panel (owner 2026-07-28: "the
            settings that came after selecting the phone number" move here). */}
        {inbound && <InboundCallSettings draft={draft} update={update} />}

        {/* Structured outputs — what each call/session records and extracts. */}
        <SectionRow
          id="wz-4-outputs"
          label="Structured outputs"
          hint={session
            ? "What each session records — transcripts, recording, success evaluation, and the data points extracted. Results appear in Sessions."
            : "What each call records — transcripts, recording, success evaluation, and the data points extracted. Results appear in Call History."}
        >
          <StepAnalysis
            value={draft.analysis}
            onChange={(analysis) => update({ analysis })}
            channel={session ? "session" : "call"}
            hideIntro
          />
        </SectionRow>

        <SectionRow id="wz-4-review" label="Review & deploy">
          {/* publishRegionRef feeds the one-primary rule: while this go-live
              CTA is on screen, the header Deploy demotes. */}
          <div ref={publishRegionRef}>
            <StepPublish
              draft={draft}
              live={live}
              ctaLabel={deployCta}
              onPublish={onPublish}
              onFix={onFix}
            />
          </div>
        </SectionRow>
      </SectionRows>

      {/* Agent-level batch behavior — off the hot path. */}
      <Sheet open={behaviorOpen} onOpenChange={setBehaviorOpen}>
        <SheetContent
          side="right"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-base">Batch call behavior</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Agent-level rules every campaign follows — per-campaign window, concurrency,
              and retries live on each campaign.
            </p>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <SectionRows>
              <HangupSettings draft={draft} update={update} />
              <PacingSettings draft={draft} update={update} />
              <TransferSettings draft={draft} update={update} />
            </SectionRows>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
