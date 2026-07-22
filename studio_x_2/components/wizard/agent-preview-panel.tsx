"use client"

import * as React from "react"
import { Gauge, CircleDollarSign, PanelRightClose, PanelRightOpen, AudioLines, AppWindow, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoHint } from "@/components/wizard/info-hint"
import { AgentSphere } from "@/components/agent-test-panel"
import { WidgetPreviewCard } from "@/components/widget-studio"

/**
 * AgentPreviewPanel — the persistent right column of the three-column builder
 * (Figma "Shell Exploration", node 2508:97094 / 2508:97839). Built to the
 * Figma spec to the pixel: 400px column, border-l divider, header px-5 py-2.5
 * (gauge latency · $ price), body pl-4 pr-6 py-4 (badges h-15 · sphere · Talk
 * BELOW it, gap-8), stats block border-t pl-4 pr-6 py-4 with mono-50% labels
 * and sans-14 values, gap-3 rhythm.
 */

/** The deployment summary the panel carries (owner 2026-07-17: the summary
 *  lives HERE, always visible, not buried in the Go-live section). */
export interface AgentPreviewSummary {
  /** Selected voice — name + tagline (absent until one is picked). */
  voice?: { name: string; tagline?: string }
  /** The model stack in one line (stackLine full). */
  models: string
  estimateLatencyMs: number
  estimateCostPerMin: number
  /** Channel line, e.g. "Inbound · +1 (628) 555-0188" (absent until picked). */
  channel?: string
  /** Draft↔live linkage (Lazyweb design-improve 2026-07-20, F4): rows whose
   *  draft value differs from the DEPLOYED config carry a "pending" chip, so
   *  the summary states what the next redeploy actually changes. Absent for
   *  agents that aren't live. */
  pending?: { voice?: boolean; models?: boolean; estimate?: boolean; channel?: boolean }
}

export function AgentPreviewPanel({
  name,
  statusLabel,
  isLive,
  statusHint,
  statusNote,
  templateName,
  sessionStats,
  latencyMs,
  costPerMin,
  summary,
  testing,
  warming,
  onTalk,
  collapsed,
  onToggleCollapsed,
  view = "agent",
  onViewChange,
  showWidgetToggle,
  widgetAgentId,
  widgetGreeting,
  className,
}: {
  name: string
  statusLabel: string
  isLive: boolean
  statusHint?: string
  /** Identity badge — the template picked in Agent Prompt (proposal
   *  2639-102124: "Friendly Receptionist"); falls back to the agent name. */
  templateName?: string
  /** SESSION STATISTICS (proposal): per-stage vendor + latency, then the
   *  averages. Per-stage ms of 0 (MLLM pipeline) hides that row. */
  sessionStats?: {
    llm: { vendor: string; ms: number }
    asr: { vendor: string; ms: number }
    tts: { vendor: string; ms: number }
    e2eMs: number
    ttftMs: number
    costPerMin: number
  }
  /** Provenance under the badges — a short dotted trigger, full message in
   *  its tooltip (owner 2026-07-21: reduce upfront text). */
  statusNote?: string
  latencyMs: number
  costPerMin: number
  summary: AgentPreviewSummary
  testing: boolean
  warming: boolean
  onTalk: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
  /** "agent" = sphere + Talk; "widget" = the styled web-widget preview
   *  (owner 2026-07-15: the right panel doubles as the widget preview). */
  view?: "agent" | "widget"
  onViewChange?: (v: "agent" | "widget") => void
  /** Show the [Agent | Widget] segmented toggle (web-widget channel only). */
  showWidgetToggle?: boolean
  /** Agent id whose widget config the preview reads. */
  widgetAgentId?: string
  /** The agent's greeting (Step 3 = its one home) — the widget opens with it. */
  widgetGreeting?: string
  className?: string
}) {
  if (collapsed) {
    return (
      <aside
        className={cn("hidden w-12 shrink-0 xl:flex xl:flex-col xl:items-center xl:py-2.5", className)}
        aria-label="Agent preview (collapsed)"
      >
        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={onToggleCollapsed} aria-label="Show agent preview">
          <PanelRightOpen className="size-4" aria-hidden />
        </Button>
      </aside>
    )
  }

  return (
    <aside
      className={cn("hidden shrink-0 flex-col xl:flex xl:w-[400px]", className)}
      aria-label="Agent preview"
    >
      {/* Header — "Test Agent" title + close (proposal 2639-102124); the
          latency/cost readout moved into SESSION STATISTICS below. */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="text-sm font-semibold">Test Agent</p>
        <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground" onClick={onToggleCollapsed} aria-label="Hide agent preview">
          <PanelRightClose className="size-4" aria-hidden />
        </Button>
      </div>

      {/* Agent body — pl-4 pr-6 py-4, gap-3. Badges (h-15), then either the
          sphere+Talk (agent view) or the styled widget preview (widget view). */}
      <div className="flex flex-1 flex-col gap-3 py-4 pl-4 pr-6">
        {/* Agent ⇄ widget switch — a single text toggle, NOT a tab strip: the
            widget preview carries its own mode tabs (Collapsed · Voice ·
            Chat), and two adjacent tab rows read as one broken control
            (owner 2026-07-17). */}
        {showWidgetToggle && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onViewChange?.(view === "widget" ? "agent" : "widget")}
            >
              {view === "widget"
                ? <><Bot className="size-3.5" aria-hidden /> Show agent</>
                : <><AppWindow className="size-3.5" aria-hidden /> Show widget preview</>}
            </Button>
          </div>
        )}
        <div className="flex h-15 items-center justify-center gap-2">
          <Badge variant="outline" className="max-w-[180px] truncate">{templateName || name || "Your agent"}</Badge>
          {statusHint ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={cn("cursor-help gap-1.5", isLive ? "border-success/40 text-success" : "text-muted-foreground")}>
                  <span className={cn("size-1.5 rounded-full", isLive ? "bg-success" : "bg-muted-foreground/50")} aria-hidden />
                  {statusLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px]">{statusHint}</TooltipContent>
            </Tooltip>
          ) : (
            <Badge variant="outline" className={cn("gap-1.5", isLive ? "border-success/40 text-success" : "text-muted-foreground")}>
              <span className={cn("size-1.5 rounded-full", isLive ? "bg-success" : "bg-muted-foreground/50")} aria-hidden />
              {statusLabel}
            </Badge>
          )}
        </div>
        {statusNote && (
          <div className="-mt-2 pb-2 text-center">
            <InfoHint label="Sample agent on a sandbox line">{statusNote}</InfoHint>
          </div>
        )}

        {view === "widget" && widgetAgentId ? (
          <WidgetPreviewCard agentId={widgetAgentId} greeting={widgetGreeting} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-6">
            <AgentSphere size={150} active={testing} />
            <Button variant="secondary" size="sm" className="gap-1.5" disabled={warming} onClick={onTalk}>
              <AudioLines className="size-4" aria-hidden />
              {testing ? "Open test" : `Talk to ${name || "agent"}`}
            </Button>
            {warming && (
              <p role="status" className="text-center text-xs text-muted-foreground">
                Warming up. Talk flips on the moment it finishes.
              </p>
            )}
          </div>
        )}
      </div>

      {/* SESSION STATISTICS (proposal 2639-102124) — per-stage vendor +
          latency, then the averages. Replaces the old Deployment summary
          block; the deploy-facts receipt lives in Go Live's Review card, and
          pending-edit truth stays on the rail + band reset buttons. */}
      <div className="flex flex-col gap-2.5 border-t border-border py-4 pl-4 pr-6">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground opacity-50">Session statistics</p>
        {sessionStats ? (
          <>
            {([["LLM", sessionStats.llm], ["ASR", sessionStats.asr], ["TTS", sessionStats.tts]] as const).map(([label, s]) =>
              s.ms > 0 ? (
                <div key={label} className="flex items-baseline gap-2.5">
                  <span className="w-8 shrink-0 font-mono text-xs uppercase text-muted-foreground opacity-50">{label}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{s.vendor}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{s.ms}ms</span>
                </div>
              ) : null,
            )}
            <div className="space-y-1.5 border-t border-border pt-2.5">
              <AvgLine label="Avg. E2E latency" value={`${sessionStats.e2eMs} ms`} />
              {sessionStats.ttftMs > 0 && <AvgLine label="Avg. LLM TTFT" value={`${sessionStats.ttftMs} ms`} />}
              <AvgLine label="Avg. cost" value={`$${sessionStats.costPerMin.toFixed(2)} / min`} />
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <AvgLine label="Avg. E2E latency" value={`${latencyMs} ms`} />
            <AvgLine label="Avg. cost" value={`$${costPerMin.toFixed(2)} / min`} />
          </div>
        )}
        {/* Pending-edit chips ride whichever row changed in the summary the
            REVIEW card owns now — here we keep one aggregate signal. */}
        {(summary.pending?.voice || summary.pending?.models || summary.pending?.channel || summary.pending?.estimate) && (
          <span className="w-fit rounded-sm border border-warning/40 bg-warning/10 px-1 text-xs lowercase text-warning">
            pending edits — redeploy to apply
          </span>
        )}
      </div>
    </aside>
  )
}

function AvgLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-xs uppercase text-muted-foreground opacity-50">{label}</span>
      <span className="font-mono text-xs tabular-nums">{value}</span>
    </div>
  )
}

/** Stacked label-over-value row — summary values (voice tagline, full stack
 *  line) are too long for the one-line justify-between StatRow idiom.
 *  `pending` marks a row whose draft value awaits a redeploy (Lazyweb F4). */
function SummaryRow({ label, value, pending }: { label: string; value: string; pending?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-xs uppercase text-muted-foreground opacity-50">{label}</span>
        {/* Warning tone, NOT primary (owner 2026-07-21: primary chips in the
            summary competed with the CTA color) — pending = "not live yet",
            the same amber family as the rail's unsaved-changes line. */}
        {pending && (
          <span className="rounded-sm border border-warning/40 bg-warning/10 px-1 text-xs lowercase text-warning">
            pending
          </span>
        )}
      </span>
      <span className="text-sm leading-snug text-foreground">{value}</span>
    </div>
  )
}
