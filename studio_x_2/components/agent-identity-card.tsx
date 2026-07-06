"use client"

import * as React from "react"
import { Mic, PhoneOff, DollarSign, Gauge, ChevronDown, Copy, Check, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AgentSphere } from "@/components/agent-test-panel"
import { useCopyFeedback } from "@/hooks/use-copy-feedback"
import { type StackLatencyBreakdown } from "@/lib/campaign-data"

/**
 * AgentIdentityCard — the shared "here's your agent" panel.
 *
 * One component so the Agents home (GoLiveHome) and the builder (AgentWizard)
 * present the agent IDENTICALLY — the agent never "goes missing" when you cross
 * from the list into edit. Left column on both: sphere + name + status + stack +
 * a Talk/Test button. The name is a static heading on the home and an
 * inline-editable field in the builder (pass `onNameChange`).
 */
export function AgentIdentityCard({
  name,
  namePlaceholder = "Your agent",
  onNameChange,
  status,
  subtitle,
  agentId,
  stack,
  costPerMin,
  latencyMs,
  latencyBreakdown,
  channel,
  talking,
  onToggleTalk,
  talkLabel,
  endLabel = "End call",
  secondary,
  className,
}: {
  name: string
  namePlaceholder?: string
  /** When provided, the name renders as an inline-editable field (builder). */
  onNameChange?: (value: string) => void
  status: string
  subtitle?: string
  /** Published agent id — renders as a copyable chip (absent for new drafts). */
  agentId?: string
  /** Mono stack line, e.g. "gpt-4o-mini · nova-2 · turbo". */
  stack?: string
  costPerMin?: number
  latencyMs?: number
  /** When provided, the latency stat expands to an STT/LLM/TTS → end-to-end →
   *  best-case breakdown. */
  latencyBreakdown?: StackLatencyBreakdown
  /** WHERE the agent takes traffic ("Inbound · +1 (628) 555-0188") — always
   *  visible on the card, clicking jumps to the channel step. */
  channel?: { label: string; onClick: () => void }
  talking: boolean
  onToggleTalk: () => void
  talkLabel?: string
  endLabel?: string
  /** Extra action under the Talk button (e.g. "Edit agent" on the home). */
  secondary?: React.ReactNode
  className?: string
}) {
  const displayName = name || namePlaceholder
  const hasStats = !!agentId || !!stack || costPerMin != null || latencyMs != null || !!channel
  const [showLatency, setShowLatency] = React.useState(false)
  const { copied, copy } = useCopyFeedback()
  const copyId = () => {
    if (agentId) void copy(agentId, "Agent ID copied", agentId)
  }

  return (
    <section className={cn("flex flex-col rounded-xl border border-border bg-card p-6 lg:sticky lg:top-6", className)}>
      <div className="flex flex-col items-center gap-3 text-center">
        <AgentSphere size={104} active={talking} />
        <div className="w-full space-y-1">
          <div className="flex items-center justify-center gap-2">
            {onNameChange ? (
              <input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={namePlaceholder}
                aria-label="Agent name"
                className="min-w-0 flex-1 rounded-md bg-transparent px-1 text-center text-xl font-semibold tracking-tight outline-none placeholder:font-normal placeholder:text-muted-foreground/60 focus:bg-muted/50"
              />
            ) : (
              <h2 className="truncate text-xl font-semibold tracking-tight">{displayName}</h2>
            )}
            <Badge variant="secondary" className="shrink-0">{status}</Badge>
          </div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {hasStats && (
        <div className="mt-5 space-y-2 border-t border-border pt-4">
          {agentId && (
            <button
              type="button"
              onClick={copyId}
              aria-label={`Copy agent ID ${agentId}`}
              className="inline-flex items-center gap-1.5 rounded-md font-mono text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              # {agentId}
              {copied
                ? <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                : <Copy className="h-3.5 w-3.5" aria-hidden />}
            </button>
          )}
          {stack && <p className="break-words font-mono text-sm text-muted-foreground">{stack}</p>}
          {channel && (
            <button
              type="button"
              onClick={channel.onClick}
              aria-label={`Channel: ${channel.label} — open channel setup`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-md text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{channel.label}</span>
            </button>
          )}
          {(costPerMin != null || latencyMs != null) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {costPerMin != null && (
                <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" aria-hidden />{costPerMin.toFixed(2)}/min</span>
              )}
              {latencyMs != null &&
                (latencyBreakdown ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setShowLatency((v) => !v)}
                        aria-expanded={showLatency}
                        aria-label={`Estimated response latency ${latencyMs} milliseconds — toggle the per-stage breakdown`}
                        className="inline-flex items-center gap-1 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Gauge className="h-3.5 w-3.5" aria-hidden />{latencyMs}ms
                        <span className="text-xs">breakdown</span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform", showLatency && "rotate-180")} aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Estimated response latency — click for the STT / LLM / TTS breakdown</TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" aria-hidden />{latencyMs}ms</span>
                ))}
            </div>
          )}

          {latencyBreakdown && showLatency && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-left">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Latency breakdown</p>
              <LatencyRow label="STT" value={latencyBreakdown.asrMs} />
              <LatencyRow label="LLM (time to first token)" value={latencyBreakdown.llmMs} />
              <LatencyRow label="TTS" value={latencyBreakdown.ttsMs} />
              <div className="my-2 border-t border-border" />
              <LatencyRow label="End-to-end" value={latencyBreakdown.latencyMs} strong />
              <LatencyRow label="Best case" value={latencyBreakdown.bestCaseMs} muted />
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {talking ? (
          <Button variant="destructive" className="gap-1.5" onClick={onToggleTalk}>
            <PhoneOff className="h-4 w-4" aria-hidden /> {endLabel}
          </Button>
        ) : (
          <Button className="gap-1.5" onClick={onToggleTalk}>
            <Mic className="h-4 w-4" aria-hidden /> {talkLabel ?? `Talk to ${displayName}`}
          </Button>
        )}
        {secondary}
      </div>
    </section>
  )
}

function LatencyRow({
  label, value, strong = false, muted = false,
}: {
  label: string
  value: number
  strong?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-0.5 text-xs">
      <span className={muted ? "text-muted-foreground" : "text-foreground/80"}>{label}</span>
      <span className={cn("font-mono tabular-nums", strong ? "font-medium text-foreground" : muted ? "text-muted-foreground" : "text-foreground/80")}>
        ~{value} ms
      </span>
    </div>
  )
}
