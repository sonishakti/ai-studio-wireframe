"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * AgentTestPanel
 * ──────────────
 * The right-side panel that appears on both the Agent Editor and Agent
 * Landing screens. Top: title badge + central sphere visualization + Test
 * Agent button. Bottom: LLM / ASR / TTS / latency stat panel.
 *
 * Per Figma node 297:8493 (editor) and 299:8796 (landing): 400px wide,
 * stacked top (573h) + bottom (160h).
 */

interface AgentSpec {
  llm: string
  asr: string
  tts: string
  /** ms. Use null for "not connected yet". */
  latencyMs: number | null
  /** ms. Use null for "not connected yet". */
  ttftMs: number | null
}

interface AgentTestPanelProps {
  /** Title badge (e.g. agent name or template name). */
  title: string
  /** "Agent Disconnected" / "Connecting…" / "Connected". */
  state?: string
  /** Specs surfaced in the bottom panel. */
  spec: AgentSpec
  /** Click handler for the Test Agent button. */
  onTest?: () => void
  /** Override the Test Agent button label. */
  testLabel?: string
  className?: string
}

export function AgentTestPanel({
  title,
  state = "Agent Disconnected",
  spec,
  onTest,
  testLabel = "Test Agent",
  className,
}: AgentTestPanelProps) {
  return (
    <aside
      className={cn(
        "flex flex-col w-full sm:w-[400px] shrink-0 border-l border-border bg-card/30",
        className,
      )}
    >
      {/* Top panel — title badge + sphere + test button */}
      <div className="flex flex-col items-center px-4 pt-4 pb-6 flex-1">
        <Badge
          variant="secondary"
          className="mb-12 max-w-full truncate text-xs px-3 py-1"
          title={title}
        >
          {title}
        </Badge>

        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-medium text-muted-foreground">{state}</p>
          <AgentSphere />
        </div>

        <Button size="sm" className="mt-10" onClick={onTest}>
          {testLabel}
        </Button>
      </div>

      {/* Bottom panel — vendor + latency specs */}
      <div className="border-t border-border px-6 py-6 space-y-3">
        <StatRow label="LLM" value={spec.llm} />
        <StatRow label="ASR" value={spec.asr} />
        <StatRow label="TTS" value={spec.tts} />
        <StatRow
          label="Average end-to-end latency"
          value={spec.latencyMs !== null ? `${spec.latencyMs} ms` : "—"}
          mono
        />
        <StatRow
          label="Average LLM time to first token"
          value={spec.ttftMs !== null ? `${spec.ttftMs} ms` : "—"}
          mono
        />
      </div>
    </aside>
  )
}

function StatRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-sm shrink-0", mono && "tabular-nums font-mono")}>{value}</p>
    </div>
  )
}

/**
 * AgentSphere — animated gradient orb representing the agent's state.
 * Pure CSS — no canvas/three.js needed at wireframe altitude.
 */
function AgentSphere({ size = 132 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full opacity-90"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, oklch(0.85 0.12 240) 0%, oklch(0.55 0.18 250) 38%, oklch(0.28 0.12 260) 70%, oklch(0.12 0.06 265) 100%)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full mix-blend-overlay"
        style={{
          background:
            "radial-gradient(circle at 28% 24%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 30%)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: "inset 0 -12px 24px rgba(0,0,0,0.45), 0 0 60px 4px rgba(80,140,255,0.15)",
        }}
      />
    </div>
  )
}

export { AgentSphere }
