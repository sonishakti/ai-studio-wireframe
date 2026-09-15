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
import { CampaignLaunchFields, InboundEndCallRow } from "@/components/wizard/step-call-settings"
import { openAdvanced } from "@/components/wizard/advanced-settings-sheet"
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
// One truthful genesis row, nothing else (user-test 2026-08-10 S3: five
// fabricated "by you" edits invented an audit trail the user never produced —
// worst on an agent imported twenty minutes ago). Real edits appear as real
// deploys happen; a wireframe must not seed history.
const VERSION_SEED: { property: string; hoursAgo: number; old: string; next: string; by: string }[] = [
  { property: "Agent created", hoursAgo: 0, old: ", ", next: "version 1", by: "you" },
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
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => openAdvanced("call")}>
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Advanced settings
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setHistoryOpen(true)}>
          <History className="h-3.5 w-3.5" aria-hidden /> Version history
        </Button>
      </div>

      <SectionRows>
        {/* Batch asks one thing here: when to start. The contact list and the
            number it dials from were already chosen in Deployment, and asking
            again read as a trap (owner 2026-09-15). Retries and concurrency
            are in Advanced settings. */}
        {batch && draft.campaigns[0] && (
          <SectionRow id="wz-4-launch" label="When to start" hint="Calling begins when you deploy, or at the time you set.">
            <CampaignLaunchFields
              campaign={draft.campaigns[0]}
              onChange={(patch) => update({ campaigns: draft.campaigns.map((c, i) => (i === 0 ? { ...c, ...patch } : c)) })}
            />
          </SectionRow>
        )}
        {/* Inbound hot path (Figma 2919-59124): End call + the Advanced
            Settings door — the full rules live in the sheet. */}
        {inbound && (
          <InboundEndCallRow draft={draft} update={update} onOpenAdvanced={() => openAdvanced("call")} />
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
              Every deployed change to {draft.name || "this agent"}. Your unsaved edits ship as the next version.
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
                No versions yet. Your first deploy records version 1.
              </p>
            )}
            <p className="pt-3 text-xs text-muted-foreground">
              Wireframe data: versions are recorded on every deploy, one row per changed property.
            </p>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}
