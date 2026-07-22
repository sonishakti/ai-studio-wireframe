"use client"

import * as React from "react"
import { Rocket, ArrowRight, AudioLines, PhoneIncoming, PhoneOutgoing, Globe, Code2, Layers, Gauge, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { publishBlocks, channelTarget, typeLabel, type AgentDraft } from "@/lib/wizard-draft"
import { stackLine, stackEstimateFor } from "@/lib/campaign-data"
import { getVoiceArtifact } from "@/lib/voice-artifacts"

/**
 * The Deploy step's REVIEW + GO-LIVE block (below the channel block since
 * 2026-07-13 — deploy is one step, not two). A read-only summary of everything
 * configured + the Deploy CTA. Testing lives on the always-present left
 * identity card ("Talk to…"), so this block is purely review-then-deploy — no
 * duplicate agent widget here. The CTA is gated by `publishBlocks`, surfaced
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
  /** Host-computed CTA label so all three deploy buttons (rail, sub-lg strip,
   *  this block) say the same thing — e.g. "Launch batch calls" when a live
   *  agent is being REPOINTED, where a bare "Redeploy" read as re-publishing
   *  the old channel (user-test #7, D1 S3). */
  ctaLabel?: string
  /** Jump to the step whose drawer fixes a blocker. */
  onFix: (step: number) => void
}) {
  const voice = draft.voice ? getVoiceArtifact(draft.voice.id) : undefined
  const agentName = draft.name || voice?.name || "your agent"
  const blocks = publishBlocks(draft)
  const est = stackEstimateFor(draft.stack)

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
        <dl className="space-y-2.5">
          <ReviewRow icon={typeIcon(draft)} label="Type"
            value={draft.type ? `${typeLabel(draft.type)} · ${channelTarget(draft)}` : "Not set yet"} />
          <ReviewRow icon={Layers} label="Models" value={stackLine(draft.stack, { full: true })} />
          <ReviewRow icon={AudioLines} label="Voice"
            value={voice ? `${voice.name} · ${voice.tagline}` : "Not set yet"} />
          <ReviewRow icon={DollarSign} label="Cost" value={`~$${est.costPerMin.toFixed(2)}/min`} />
          <ReviewRow icon={Gauge} label="Latency" value={`~${est.latencyMs} ms to first word`} />
        </dl>
        {/* No hard lock: Deploy is always clickable. If something's unfinished
            the ramp above lists each fix; a toast still points to the first. */}
        <Button size="lg" className="w-full gap-2" onClick={onPublish}>
          <Rocket className="h-4 w-4" aria-hidden /> {ctaLabel ?? (live ? "Redeploy" : "Deploy")}
        </Button>
        <p className="text-sm text-muted-foreground">
          {/* Outcome first, destination second — one sentence each, no
              narration (owner 2026-07-17). Code deploys stay on this page
              (the snippets need the minted ID); everything else opens
              Monitor. The promise always matches the CTA (user-test #12). */}
          {live
            ? draft.type === "outbound"
              ? `Starts calling your list after one confirmation. Opens Monitor.`
              : draft.type === "code"
              ? `Updates the agent your app connects to. You stay on this page.`
              : `Your changes take effect on the next call. Opens Monitor.`
            : draft.type === "code"
            ? `Creates the agent ID for the snippets above. You stay on this page.`
            : `Puts ${agentName} live. Opens Monitor.`}
        </p>
      </section>
    </div>
  )
}

/** Mono uppercase label + right-aligned value (proposal review card). */
function ReviewRow({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-baseline gap-2.5">
      <dt className="flex min-w-0 shrink-0 items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right text-sm">{value}</dd>
    </div>
  )
}

function typeIcon(d: AgentDraft) {
  if (d.type === "outbound") return PhoneOutgoing
  if (d.type === "code") return Code2
  if (d.type === "inbound" && d.config.inbound?.mode === "web") return Globe
  return PhoneIncoming
}
