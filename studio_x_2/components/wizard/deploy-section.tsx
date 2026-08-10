"use client"

import * as React from "react"
import { SlidersHorizontal, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { SectionRow, SectionRows } from "@/components/wizard/section-row"
import { CampaignsCard } from "@/components/wizard/campaigns-card"
import {
  InboundCallSettings, InboundEndCallRow, HangupSettings, PacingSettings, TransferSettings,
} from "@/components/wizard/step-call-settings"
import { HostingRegionRow } from "@/components/wizard/hosting-region"
import { StepAnalysis } from "@/components/wizard/step-analysis"
import { StepPublish } from "@/components/wizard/step-publish"
import { hasChannel } from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/** Wireframe seed for the version-history table (property · when · old → new
 *  · who) — the shape the owner proposed 2026-07-28. Dates are OFFSETS from
 *  now, resolved at render, so a mock agent's history always postdates its
 *  existence; a never-deployed draft shows NO rows — fixed "by you" dates had
 *  fresh drafts showing edits that predate the agent (user-test 2026-07-30). */
const VERSION_SEED: { property: string; hoursAgo: number; old: string; next: string; by: string }[] = [
  { property: "Model tier", hoursAgo: 26, old: "Agora Balanced", next: "Agora Cheapest", by: "you" },
  { property: "System prompt", hoursAgo: 78, old: "…escalate to a human.", next: "…escalate to a human if asked.", by: "you" },
  // "you" everywhere — a fresh single-user account must never imply a stranger
  // edited its agent (user-test 2026-07-29; was a seeded teammate email).
  { property: "Max call duration", hoursAgo: 140, old: "240 s", next: "300 s", by: "you" },
  { property: "Voicemail detection", hoursAgo: 141, old: "Off", next: "On", by: "you" },
  { property: "Voice", hoursAgo: 305, old: "Aria (ElevenLabs)", next: "Jenny (Azure)", by: "you" },
]

/** "2026-07-30 14:02" — the table's existing date idiom, local time. */
function fmtWhen(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

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
  const [inboundAdvOpen, setInboundAdvOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  // A draft that has never deployed has no versions — an agentId is only
  // minted by the first deploy, so its presence is the honest signal.
  const deployedBefore = !!draft.agentId
  const versionRows = React.useMemo(
    () =>
      deployedBefore
        ? VERSION_SEED.map((v) => ({ ...v, date: fmtWhen(new Date(Date.now() - v.hoursAgo * 3_600_000)) }))
        : [],
    [deployedBefore],
  )
  const batch = hasChannel(draft, "batch")
  const inbound = hasChannel(draft, "inbound")
  const session = hasChannel(draft, "code") && draft.channels.length === 1

  return (
    <div className="space-y-6">
      {/* Campaign-run management — full width (the 50/50 CSV grid needs it). */}
      {batch && (
        <div className="space-y-2">
          <CampaignsCard draft={draft} update={update} />
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setBehaviorOpen(true)}>
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Advanced Settings
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setHistoryOpen(true)}>
              <History className="h-3.5 w-3.5" aria-hidden /> Version history
            </Button>
          </div>
        </div>
      )}
      {!batch && (
        <div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setHistoryOpen(true)}>
            <History className="h-3.5 w-3.5" aria-hidden /> Version history
          </Button>
        </div>
      )}

      <SectionRows>
        {/* Inbound hot path (Figma 2919-59124): End call + the Advanced
            Settings door — the full rules live in the sheet. */}
        {inbound && (
          <InboundEndCallRow draft={draft} update={update} onOpenAdvanced={() => setInboundAdvOpen(true)} />
        )}

        {/* Hosting Region lives in Go Live for inbound + code (Figma
            2919-59124 / 2919-59592); batch runs carry their own numbers. */}
        {!batch && <HostingRegionRow draft={draft} update={update} />}

        {/* Structured outputs — what each call/session records and extracts. */}
        <SectionRow
          id="wz-4-outputs"
          label={session ? "Deployment and Structured Output Settings" : "Structured outputs"}
          hint={session
            ? "What each session records. Results appear in Sessions."
            : "What each call records. Results appear in Call History."}
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

      {/* Version history (owner 2026-07-28, proposed): the simple table —
          property · when · old → new · who. Mock rows; unsaved edits deploy
          as the next version. */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent
          side="right"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-base">Version history</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Every deployed change to {draft.name || "this agent"} — your unsaved edits ship as the next version.
            </p>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {versionRows.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Changed</TableHead>
                      <TableHead>Old → New</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versionRows.map((v) => (
                      <TableRow key={`${v.property}-${v.date}`}>
                        <TableCell className="font-medium">{v.property}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{v.date}</TableCell>
                        <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                          <span className="line-through decoration-muted-foreground/50">{v.old}</span>{" "}
                          <span className="text-foreground">→ {v.next}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{v.by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Fresh draft: nothing has deployed, so nothing predates it.
              <p className="text-sm text-muted-foreground">
                No versions yet — your first deploy records version 1.
              </p>
            )}
            <p className="pt-3 text-xs text-muted-foreground">
              Wireframe data — versions are recorded on every deploy, one row per changed property.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Agent-level batch behavior — off the hot path (Figma 2872-2895). */}
      <Sheet open={behaviorOpen} onOpenChange={setBehaviorOpen}>
        <SheetContent
          side="right"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-base">Advanced Settings</SheetTitle>
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
          <div className="shrink-0 border-t border-border px-5 py-3">
            <Button className="w-full" onClick={() => setBehaviorOpen(false)}>Done</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Inbound advanced settings (Figma 2924-104389). */}
      <Sheet open={inboundAdvOpen} onOpenChange={setInboundAdvOpen}>
        <SheetContent
          side="right"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-base">Advanced Settings</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Agent-level rules that every inbound call follows.
            </p>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <SectionRows>
              <InboundCallSettings draft={draft} update={update} />
            </SectionRows>
          </div>
          <div className="shrink-0 border-t border-border px-5 py-3">
            <Button className="w-full" onClick={() => setInboundAdvOpen(false)}>Done</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
