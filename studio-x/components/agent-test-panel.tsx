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
 *
 * Layers (bottom → top):
 *   1. Ambient glow halo (pulses slowly)
 *   2. Outer ring (subtle border)
 *   3. Base radial gradient (deep blue/cyan with depth)
 *   4. Specular highlight (top-left)
 *   5. Inner shadow + glow (gives ball-shape)
 *   6. Breathing pulse overlay (active state only)
 */
function AgentSphere({ size = 132, active = false }: { size?: number; active?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Ambient halo — breathing glow behind the sphere */}
      <div
        className="absolute inset-0 rounded-full -z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(80,140,255,0.20) 0%, rgba(80,140,255,0) 65%)",
          transform: "scale(1.6)",
          animation: "sx-sphere-breathe 6s ease-in-out infinite",
        }}
      />

      {/* Sphere body */}
      <div className="absolute inset-0 rounded-full overflow-hidden shadow-[inset_0_-14px_28px_rgba(0,0,0,0.55),0_0_40px_-4px_rgba(80,140,255,0.25)]">
        {/* Base radial — deep blue gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, oklch(0.88 0.10 235) 0%, oklch(0.62 0.18 245) 28%, oklch(0.34 0.16 255) 58%, oklch(0.16 0.08 265) 92%)",
          }}
        />

        {/* Edge darkening for ball-shape */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)",
          }}
        />

        {/* Specular highlight — top-left bright spot */}
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background:
              "radial-gradient(ellipse 38% 28% at 30% 24%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 60%)",
          }}
        />

        {/* Secondary tiny specular */}
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background:
              "radial-gradient(ellipse 14% 10% at 28% 22%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)",
          }}
        />

        {/* Active pulse — only when connected */}
        {active && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(160,210,255,0.4) 0%, transparent 60%)",
              animation: "sx-sphere-pulse 1.8s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  )
}

export { AgentSphere }
