"use client"

import * as React from "react"
import { Rocket, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { publishBlocks, channelTarget, primaryChannel, hasChannel, activeCampaigns, type AgentDraft } from "@/lib/wizard-draft"
import { stackLine, stackEstimateFor } from "@/lib/campaign-data"
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

      {/* Review card (proposal 2639-102124): mono-labeled facts, values
          right-aligned, the full-width Deploy INSIDE the card — deploying is
          the end of this journey, not a header shortcut. */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <dl className="divide-y divide-border">
          <ReviewRow label="Channel" value={draft.channels.length ? channelTarget(draft) : "Not set yet"} />
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
          {/* Outcome first, destination second. Code deploys stay on this page
              (the snippets need the minted ID); everything else opens Monitor. */}
          {live
            ? batchOnly
              ? `Starts ${campaignCount > 1 ? `${campaignCount} campaign runs` : "your campaign run"} after one confirmation. Opens Monitor.`
              : codeOnly
              ? `Updates the agent your app connects to. You stay on this page.`
              : `Your changes take effect on the next call. Opens Monitor.`
            : codeOnly
            ? `Creates the agent ID for the snippets above. You stay on this page.`
            : hasChannel(draft, "batch") && campaignCount > 0
            ? `Puts ${agentName} live${campaignCount > 1 ? ` and starts ${campaignCount} campaign runs` : " and starts your campaign run"}. Opens Monitor.`
            : `Puts ${agentName} live. Opens Monitor.`}
        </p>
        {/* Off-switch pointer (user-test 2026-07-29): a header Pause is vetoed,
            so the fine print names where the existing one lives. */}
        <p className="text-xs text-muted-foreground/80">
          To take this agent offline, use Pause in the ⋯ menu on its row in All Agents.
        </p>
      </section>
    </div>
  )
}

/** Quiet label + right-aligned value over hairlines (Plain Form review). */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2.5 py-2 first:pt-0 last:pb-0">
      <dt className="min-w-0 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-right text-sm">{value}</dd>
    </div>
  )
}
