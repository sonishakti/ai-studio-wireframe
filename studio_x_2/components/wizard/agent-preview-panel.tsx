"use client"

import * as React from "react"
import { Gauge, CircleDollarSign, PanelRightClose, PanelRightOpen, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AgentSphere } from "@/components/agent-test-panel"

/**
 * AgentPreviewPanel — the persistent right column of the three-column builder
 * (Figma "Shell Exploration", node 2508:97094, 2026-07-15). The agent is the
 * anchor: its sphere + a Talk button, the live latency/cost in the panel
 * header, and the running model stack (LLM · ASR · TTS + measured latency)
 * always in view while you configure on the left. Collapses to a thin rail so
 * the config canvas can reclaim the width.
 *
 * Pure presentation — every value is derived by the wizard (single state
 * owner) and passed in, so this panel can never disagree with the config.
 */

export interface AgentPreviewStats {
  llmVendor: string
  asrVendor: string
  ttsVendor: string
  /** Measured average end-to-end (warm) — distinct from the header's typical estimate. */
  avgLatencyMs: number
  /** LLM time to first token. */
  firstTokenMs: number
}

export function AgentPreviewPanel({
  name,
  statusLabel,
  isLive,
  statusHint,
  latencyMs,
  costPerMin,
  stats,
  testing,
  warming,
  onTalk,
  collapsed,
  onToggleCollapsed,
  className,
}: {
  name: string
  statusLabel: string
  isLive: boolean
  /** Provenance for an auto-provisioned agent ("why is this Live / who pays") —
   *  reattached to the status badge as a tooltip (user-test 2026-07-15). */
  statusHint?: string
  latencyMs: number
  costPerMin: number
  stats: AgentPreviewStats
  testing: boolean
  warming: boolean
  onTalk: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
  className?: string
}) {
  // Collapsed → a thin reopen rail (keeps the panel's presence + a way back).
  if (collapsed) {
    return (
      <aside
        className={cn("hidden w-11 shrink-0 border-l border-border xl:flex xl:flex-col xl:items-center xl:py-3", className)}
        aria-label="Agent preview (collapsed)"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={onToggleCollapsed}
          aria-label="Show agent preview"
        >
          <PanelRightOpen className="h-4 w-4" aria-hidden />
        </Button>
      </aside>
    )
  }

  return (
    <aside
      className={cn("hidden shrink-0 flex-col border-l border-border xl:flex xl:w-[360px] 2xl:w-[400px]", className)}
      aria-label="Agent preview"
    >
      {/* Header: latency + price, with a collapse toggle (mirrors the Figma
          panel header's gauge/$ readout). */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5" title="Typical end-to-end latency">
            <Gauge className="h-4 w-4" aria-hidden />
            <span className="font-mono tabular-nums">{latencyMs}ms</span>
          </span>
          <span className="inline-flex items-center gap-1.5" title="Estimated cost per minute">
            <CircleDollarSign className="h-4 w-4" aria-hidden />
            <span className="font-mono tabular-nums">${costPerMin.toFixed(2)}/min</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={onToggleCollapsed}
          aria-label="Hide agent preview"
        >
          <PanelRightClose className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* The agent — badges + sphere + Talk. */}
      <div className="flex flex-col items-center gap-6 px-4 pb-8 pt-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="max-w-[180px] truncate">{name || "Your agent"}</Badge>
          {statusHint ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn("cursor-help gap-1.5", isLive ? "border-success/40 text-success" : "text-muted-foreground")}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-success" : "bg-muted-foreground/50")} aria-hidden />
                  {statusLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px]">{statusHint}</TooltipContent>
            </Tooltip>
          ) : (
            <Badge
              variant="outline"
              className={cn("gap-1.5", isLive ? "border-success/40 text-success" : "text-muted-foreground")}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-success" : "bg-muted-foreground/50")} aria-hidden />
              {statusLabel}
            </Badge>
          )}
        </div>

        <div className="relative flex items-center justify-center">
          <AgentSphere size={150} active={testing} />
          {/* Talk sits at the sphere's lower edge (Figma) — the one action the
              preview owns. */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute -bottom-1 gap-1.5 shadow-md"
            disabled={warming}
            onClick={onTalk}
          >
            <Mic className="h-3.5 w-3.5" aria-hidden />
            {testing ? "Open test" : `Talk to ${name || "agent"}`}
          </Button>
        </div>
        {warming && (
          <p role="status" className="text-center text-xs text-muted-foreground">
            Warming up. Talk flips on the moment it finishes.
          </p>
        )}
      </div>

      {/* Live stack + measured metrics — Space Mono labels, right-aligned
          values, per the Figma stats block. */}
      <div className="mt-auto space-y-2.5 border-t border-border px-4 py-4">
        <StatRow label="LLM" value={stats.llmVendor} />
        <StatRow label="ASR" value={stats.asrVendor} />
        <StatRow label="TTS" value={stats.ttsVendor} />
        <StatRow label="Average end-to-end latency" value={`${stats.avgLatencyMs} ms`} mono />
        <StatRow label="Average LLM time to first token" value={`${stats.firstTokenMs} ms`} mono />
      </div>
    </aside>
  )
}

function StatRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("shrink-0 text-xs text-foreground", mono && "font-mono tabular-nums")}>{value}</span>
    </div>
  )
}
