"use client"

import * as React from "react"
import { Rocket, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { publishBlocks, channelTarget, primaryChannel, activeCampaigns, draftHosting, MOCK_CSV_ROWS, type AgentDraft } from "@/lib/wizard-draft"
import { stackLine, stackEstimateFor } from "@/lib/campaign-data"
import { hostingSummary } from "@/lib/hosting-regions"
import { getVoiceArtifact } from "@/lib/voice-artifacts"

/**
 * Go Live's REVIEW + DEPLOY block. A read-only summary of everything
 * configured + the Deploy CTA. The CTA is gated by `publishBlocks`, surfaced
 * as a "Fix this →" ramp (never a hard-disabled button). Deploy → host fires
 * deployment_went_live + time_to_live, clears the draft, lands on Monitor.
 */
export function StepPublish({
  draft,
  onPublish,
  live,
  ctaLabel,
  onFix,
}: {
  draft: AgentDraft
  onPublish: () => void
  /** Agent already deployed: the CTA reads "Redeploy" so this step and the
   *  rail's deploy block never disagree (user-test P0 #3). */
  live?: boolean
  /** Host-computed CTA label so every deploy button says the same thing. */
  ctaLabel?: string
  /** Jump to the section that fixes a blocker. */
  onFix: (step: number) => void
}) {
  const voice = draft.voice ? getVoiceArtifact(draft.voice.id) : undefined
  const agentName = draft.name || voice?.name || "your agent"
  const blocks = publishBlocks(draft)
  const est = stackEstimateFor(draft.stack)
  const primary = primaryChannel(draft)
  const batchOnly = primary === "batch"
  const codeOnly = primary === "code"
  const campaignCount = activeCampaigns(draft).length
  const run = draft.campaigns[0]
  const contacts = run?.contacts ?? (run?.csvName ? MOCK_CSV_ROWS : 0)

  return (
    <div className="space-y-5">

      {blocks.length > 0 && (
        <div className="space-y-2.5 rounded-md border border-warning/40 bg-warning/5 p-3.5">
          <p className="text-sm leading-relaxed text-foreground">
            A few things still need input before you can deploy {agentName}.
          </p>
          <ul className="space-y-1.5">
            {blocks.map((b) => (
              <li
                key={b.reason}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/50 px-3 py-2"
              >
                <span className="text-sm text-foreground">{b.reason}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 gap-1 text-primary hover:text-primary"
                  onClick={() => onFix(b.step)}
                >
                  {b.action} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mono-labeled facts over hairlines. No card: nothing else in this
          section has one, and a container here read as a different kind of
          object (owner 2026-09-15). */}
      <section className="space-y-4">
        <dl className="divide-y divide-border">
          <ReviewRow label="Deployed to" value={draft.channels.length ? channelTarget(draft) : "Not set yet"} />
          {batchOnly && (
            <ReviewRow
              label="Calling"
              value={contacts > 0 ? `${contacts.toLocaleString()} contacts · ${run?.csvName ?? "contact list"}` : "No contact list yet"}
            />
          )}
          <ReviewRow label="Models" value={stackLine(draft.stack, { full: true })} />
          <ReviewRow label="Voice" value={voice ? `${voice.name} · ${voice.tagline}` : "Not set yet"} />
          <ReviewRow label="Cost" value={`~$${est.costPerMin.toFixed(2)}/min`} />
          <ReviewRow label="Latency" value={`~${est.latencyMs} ms to first word`} />
        </dl>
        {/* No hard lock: Deploy is always clickable. If something's unfinished
            the ramp above lists each fix; a toast still points to the first. */}
        <Button size="lg" className="sx-rocket-hover w-full gap-2" onClick={onPublish}>
          <Rocket className="h-4 w-4" aria-hidden /> {ctaLabel ?? (live ? "Redeploy" : "Deploy")}
        </Button>
        <p className="text-sm text-muted-foreground">
          {codeOnly
            ? "Creates the agent ID for the snippets above. You stay on this page."
            : live
            ? "Your changes take effect on the next call."
            : batchOnly
            ? "Starts calling after one confirmation."
            : `Puts ${agentName} live.`}
        </p>
      </section>
    </div>
  )
}

/** Mono uppercase label + right-aligned value over hairlines (Figma). */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2.5 py-2 first:pt-0 last:pb-0">
      <dt className="min-w-0 shrink-0 font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-right text-sm">{value}</dd>
    </div>
  )
}
