"use client"

import * as React from "react"
import { Rocket, AlertTriangle, AudioLines, PhoneIncoming, PhoneOutgoing, Globe, Code2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentSphere } from "@/components/agent-test-panel"
import { track, Events } from "@/lib/analytics"
import { getVoiceArtifact } from "@/lib/voice-artifacts"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import { publishBlockReason, type AgentDraft } from "@/lib/wizard-draft"

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
}: {
  draft: AgentDraft
  onPublish: () => void
}) {
  const [connected, setConnected] = React.useState(false)
  const voice = draft.voice ? getVoiceArtifact(draft.voice.id) : undefined
  const agentName = draft.name || voice?.name || "Your agent"
  const blockReason = publishBlockReason(draft)

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
            <p className="text-sm font-semibold">Ready to go live</p>
            <dl className="space-y-2.5 text-sm">
              <SummaryRow icon={AudioLines} label="Voice">
                {voice?.name ?? "—"}
                {voice && <span className="text-muted-foreground"> · {voice.tagline}</span>}
              </SummaryRow>
              <SummaryRow icon={typeIcon(draft)} label="Type">
                <span className="capitalize">{draft.type ?? "—"}</span>
                <span className="text-muted-foreground"> · {channelTarget(draft)}</span>
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

          {blockReason && (
            <div className="flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-xs leading-relaxed text-foreground">{blockReason}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Button size="lg" className="w-full gap-2 sm:w-auto" disabled={!!blockReason} onClick={onPublish}>
              <Rocket className="h-4 w-4" /> Publish &amp; go live
            </Button>
            <p className="text-xs text-muted-foreground">
              Publishing makes {agentName} start taking traffic — you&apos;ll land on Monitor to watch it.
            </p>
          </div>
        </div>

        {/* Talk to it */}
        <aside className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card/40 p-6">
          <Badge variant="secondary" className="max-w-full truncate px-3 py-1 text-xs">{agentName}</Badge>
          <p className="text-xs font-medium text-muted-foreground">
            {connected ? "Connected" : "Agent disconnected"}
          </p>
          <AgentSphere size={120} active={connected} />
          <Button size="sm" variant={connected ? "outline" : "default"} className="mt-2" onClick={toggleTest}>
            {connected ? "End test" : "Test agent"}
          </Button>
          {draft.greeting && (
            <p className="line-clamp-3 text-center text-xs text-muted-foreground">
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

/** Human-readable target of the configured channel for the summary line. */
function channelTarget(d: AgentDraft): string {
  if (d.type === "inbound") {
    if (d.config.inbound?.mode === "web") return "Web widget"
    const n = PHONE_NUMBERS.find((p) => p.id === d.config.inbound?.numberId)
    return n ? n.number : "No number yet"
  }
  if (d.type === "outbound") {
    const n = PHONE_NUMBERS.find((p) => p.id === d.config.outbound?.numberId)
    return [n?.number, d.config.outbound?.csvName].filter(Boolean).join(" · ") || "No contacts yet"
  }
  if (d.type === "code") return "SDK / API"
  return "—"
}
