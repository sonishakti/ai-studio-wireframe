"use client"

import * as React from "react"
import { Rocket, ArrowRight, AudioLines, PhoneIncoming, PhoneOutgoing, Globe, Code2, Mic, PhoneOff, Layers, Gauge } from "lucide-react"
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
  onFix,
  talking,
  onToggleTalk,
}: {
  draft: AgentDraft
  onPublish: () => void
  /** Agent already deployed: the CTA reads "Redeploy" so this step and the
   *  rail's deploy block never disagree (user-test P0 #3). */
  live?: boolean
  /** Jump to the step whose drawer fixes a blocker. */
  onFix: (step: number) => void
  /** Mirror of the identity card's Talk toggle — the card can be occluded by
   *  this drawer on small screens, so testing must work from HERE too (#21). */
  talking: boolean
  onToggleTalk: () => void
}) {
  const voice = draft.voice ? getVoiceArtifact(draft.voice.id) : undefined
  const agentName = draft.name || voice?.name || "your agent"
  const blocks = publishBlocks(draft)

  return (
    <div className="space-y-5">
      {/* No inner h2: the section header above already names this step. */}
      <p className="text-sm text-muted-foreground">
        Review {agentName}, then {live ? "redeploy to apply your changes" : "deploy it"}. Talk to it any time, here or from the sidebar.
      </p>

      {talking ? (
        <Button variant="destructive" size="sm" className="gap-1.5" onClick={onToggleTalk}>
          <PhoneOff className="h-4 w-4" aria-hidden /> End test
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="max-w-full gap-1.5" onClick={onToggleTalk}>
          <Mic className="h-4 w-4 shrink-0" aria-hidden /> <span className="truncate">Talk to {agentName}</span>
        </Button>
      )}

      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-semibold">Deployment summary</p>
        <dl className="space-y-2.5 text-sm">
          <SummaryRow icon={AudioLines} label="Voice">
            {voice?.name ?? "Not set yet"}
            {voice && <span className="text-muted-foreground"> · {voice.tagline}</span>}
          </SummaryRow>
          <SummaryRow icon={Layers} label="Models">
            {stackLine(draft.stack, { full: true })}
          </SummaryRow>
          {/* The two numbers that matter at the moment of commitment (judge
              harvest: surface cost + latency ON the deploy step, not only in
              Step 1's estimate line). */}
          <SummaryRow icon={Gauge} label="Estimate">
            ~{stackEstimateFor(draft.stack).latencyMs} ms to first word
            <span className="text-muted-foreground"> · ~${stackEstimateFor(draft.stack).costPerMin.toFixed(2)}/min</span>
          </SummaryRow>
          <SummaryRow icon={typeIcon(draft)} label="Type">
            {draft.type ? typeLabel(draft.type) : "Not set yet"}
            {draft.type && <span className="text-muted-foreground"> · {channelTarget(draft)}</span>}
          </SummaryRow>
          {(draft.knowledge.length > 0 || draft.mcp.length > 0) && (
            <SummaryRow icon={Code2} label="Attached">
              {[
                draft.knowledge.length ? `${draft.knowledge.length} knowledge` : null,
                draft.mcp.length ? `${draft.mcp.length} connector${draft.mcp.length > 1 ? "s" : ""}` : null,
              ].filter(Boolean).join(" · ") || "None"}
            </SummaryRow>
          )}
        </dl>
      </section>

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

      <div className="space-y-1.5">
        {/* No hard lock: Deploy is always clickable. If something's unfinished the
            ramp above lists each fix; a toast still points to the first. */}
        <Button size="lg" className="w-full gap-2 sm:w-auto" onClick={onPublish}>
          <Rocket className="h-4 w-4" aria-hidden /> {live ? "Redeploy" : "Deploy agent"}
        </Button>
        <p className="text-sm text-muted-foreground">
          {live
            ? `Redeploying applies your edits to live traffic. You'll land on Monitor to watch it.`
            : `Deploying starts real traffic for ${agentName}. You'll land on Monitor to watch it.`}
        </p>
      </div>
    </div>
  )
}

function SummaryRow({
  icon: Icon, label, children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-1 flex-wrap items-baseline gap-x-1.5">
        <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="text-sm">{children}</dd>
      </div>
    </div>
  )
}

function typeIcon(d: AgentDraft) {
  if (d.type === "outbound") return PhoneOutgoing
  if (d.type === "code") return Code2
  if (d.type === "inbound" && d.config.inbound?.mode === "web") return Globe
  return PhoneIncoming
}
