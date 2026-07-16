"use client"

import * as React from "react"
import { Gauge, CircleDollarSign, PanelLeftOpen, PanelRightClose, PanelRightOpen, AudioLines } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AgentSphere } from "@/components/agent-test-panel"

/**
 * AgentPreviewPanel — the persistent right column of the three-column builder
 * (Figma "Shell Exploration", node 2508:97094 / 2508:97839). Built to the
 * Figma spec to the pixel: 400px column, border-l divider, header px-5 py-2.5
 * (gauge latency · $ price), body pl-4 pr-6 py-4 (badges h-15 · sphere · Talk
 * BELOW it, gap-8), stats block border-t pl-4 pr-6 py-4 with mono-50% labels
 * and sans-14 values, gap-3 rhythm.
 */

export interface AgentPreviewStats {
  llmVendor: string
  asrVendor: string
  ttsVendor: string
  avgLatencyMs: number
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
  if (collapsed) {
    return (
      <aside
        className={cn("hidden w-12 shrink-0 border-l border-border xl:flex xl:flex-col xl:items-center xl:py-2.5", className)}
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
      className={cn("hidden shrink-0 flex-col border-l border-border xl:flex xl:w-[400px]", className)}
      aria-label="Agent preview"
    >
      {/* Header — px-5 py-2.5, border-b, gap-4. Collapse toggles flank a
          centered gauge/latency · $/price readout (mono 12, 50% opacity). */}
      <div className="flex items-center gap-4 border-b border-border px-5 py-2.5">
        <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground" onClick={onToggleCollapsed} aria-label="Hide agent preview">
          <PanelLeftOpen className="size-4" aria-hidden />
        </Button>
        <div className="flex flex-1 items-center justify-center gap-2 pr-11">
          <span className="flex items-center gap-1 text-muted-foreground" title="Typical end-to-end latency">
            <Gauge className="size-4" aria-hidden />
            <span className="font-mono text-xs opacity-50 tabular-nums">{latencyMs}ms</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground" title="Estimated cost per minute">
            <CircleDollarSign className="size-4" aria-hidden />
            <span className="font-mono text-xs opacity-50 tabular-nums">${costPerMin.toFixed(2)}/min</span>
          </span>
        </div>
        <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground" onClick={onToggleCollapsed} aria-label="Hide agent preview">
          <PanelRightClose className="size-4" aria-hidden />
        </Button>
      </div>

      {/* Agent body — pl-4 pr-6 py-4, gap-3. Badges (h-15), then the sphere
          with Talk BELOW it (gap-8), centered. */}
      <div className="flex flex-1 flex-col gap-3 py-4 pl-4 pr-6">
        <div className="flex h-15 items-center justify-center gap-2">
          <Badge variant="outline" className="max-w-[180px] truncate">{name || "Your agent"}</Badge>
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
      </div>

      {/* Stats — border-t, pl-4 pr-6 py-4, gap-3 rows. Mono-50% labels,
          sans-14 values, justify-between. */}
      <div className="flex flex-col gap-3 border-t border-border py-4 pl-4 pr-6">
        <StatRow label="LLM" value={stats.llmVendor} />
        <StatRow label="ASR" value={stats.asrVendor} />
        <StatRow label="TTS" value={stats.ttsVendor} />
        <StatRow label="AVERAGE END-TO-END LATENCY" value={`${stats.avgLatencyMs} ms`} />
        <StatRow label="AVERAGE LLM TIME TO FIRST TOKEN" value={`${stats.firstTokenMs} ms`} />
      </div>
    </aside>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-xs uppercase text-muted-foreground opacity-50">{label}</span>
      <span className="shrink-0 text-sm leading-none text-foreground">{value}</span>
    </div>
  )
}
