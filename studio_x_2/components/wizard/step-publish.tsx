"use client"

import * as React from "react"
import { Rocket, ArrowRight, AudioLines, PhoneIncoming, PhoneOutgoing, Globe, Code2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentSphere } from "@/components/agent-test-panel"
import { track, Events } from "@/lib/analytics"
import { getVoiceArtifact } from "@/lib/voice-artifacts"
import { publishBlocks, channelTarget, type AgentDraft } from "@/lib/wizard-draft"

/**
 * Step 5 — Test & Publish.
 *
 * Testing lives HERE (not earlier) so the agent under test has full context —
 * voice + prompt + channel — and you're never talking to a half-built "generic
 * agent". Left: a read-only summary of everything configured + the Publish CTA
 * (gated by `publishBlockReason`). Right: talk to it. Publish → host fires the
 * north-star deployment_went_live + time_to_live, clears the draft, lands on
 * Monitor.
 */
export function StepPublish({
  draft,
  onPublish,
  onFix,
}: {
  draft: AgentDraft
  onPublish: () => void
  /** Jump to the step whose drawer fixes a publish blocker. */
  onFix: (step: number) => void
}) {
  const [connected, setConnected] = React.useState(false)
  const voice = draft.voice ? getVoiceArtifact(draft.voice.id) : undefined
  const agentName = draft.name || voice?.name || "your agent"
  const blocks = publishBlocks(draft)

  const toggleTest = () => {
    if (connected) {
      track(Events.agent_test_ended, { channel: draft.type ?? "unknown", agent_id: draft.agentId ?? "new", duration_sec: 42 })
      setConnected(false)
    } else {
      track(Events.agent_test_started, { channel: draft.type ?? "unknown", agent_id: draft.agentId ?? "new" })
      setConnected(true)
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Test &amp; publish</h2>
        <p className="text-sm text-muted-foreground">
          Talk to {agentName} with everything wired up, then put it live.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Summary + publish */}
        <div className="space-y-4">
          <section className="space-y-3 rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-semibold">Ready to publish</p>
            <dl className="space-y-2.5 text-sm">
              <SummaryRow icon={AudioLines} label="Voice">
                {voice?.name ?? "Not set yet"}
                {voice && <span className="text-muted-foreground"> · {voice.tagline}</span>}
              </SummaryRow>
              <SummaryRow icon={typeIcon(draft)} label="Type">
                {draft.type ? <span className="capitalize">{draft.type}</span> : "Not set yet"}
                {draft.type && <span className="text-muted-foreground"> · {channelTarget(draft)}</span>}
              </SummaryRow>
              {(draft.knowledge.length > 0 || draft.mcp.length > 0) && (
                <SummaryRow icon={Code2} label="Attached">
                  {[
                    draft.knowledge.length ? `${draft.knowledge.length} knowledge` : null,
                    draft.mcp.length ? `${draft.mcp.length} connector${draft.mcp.length > 1 ? "s" : ""}` : null,
                  ].filter(Boolean).join(" · ") || "—"}
                </SummaryRow>
              )}
            </dl>
          </section>

          {blocks.length > 0 && (
            <div className="space-y-2.5 rounded-md border border-warning/40 bg-warning/5 p-3.5">
              <p className="text-sm leading-relaxed text-foreground">
                <span className="font-medium">You&apos;re at the last step.</span>{" "}
                A few things still need input before you can publish {agentName}.
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
            {/* No hard lock: Publish is always clickable. If something's unfinished
                the ramp above lists each fix; a toast still points to the first. */}
            <Button size="lg" className="w-full gap-2 sm:w-auto" onClick={onPublish}>
              <Rocket className="h-4 w-4" aria-hidden /> Publish agent
            </Button>
            <p className="text-sm text-muted-foreground">
              Publishing makes {agentName} start taking traffic — you&apos;ll land on Monitor to watch it.
            </p>
          </div>
        </div>

        {/* Talk to it */}
        <aside className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card/40 p-6">
          <Badge variant="secondary" className="max-w-full truncate px-3 py-1 text-xs">{agentName}</Badge>
          <p className="text-sm font-medium text-muted-foreground">
            {connected ? "Connected" : "Agent disconnected"}
          </p>
          <AgentSphere size={120} active={connected} />
          <Button size="sm" variant={connected ? "outline" : "default"} className="mt-2" onClick={toggleTest}>
            {connected ? "End test" : "Test agent"}
          </Button>
          {draft.greeting && (
            <p className="line-clamp-3 text-center text-sm text-muted-foreground">
              Opens with: &ldquo;{draft.greeting}&rdquo;
            </p>
          )}
        </aside>
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
