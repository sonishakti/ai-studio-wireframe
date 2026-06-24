"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * AgentTestPanel
 * ──────────────
 * The right-side preview/test panel on the Agent Editor + Landing screens. It is
 * READ-ONLY (2026-06-24): it shows what the agent IS — its stack + latency — and
 * lets you test it, but configuration happens in the builder's Stack/Persona
 * steps, not here. Top: title + sphere + Test Agent. Bottom: a read-only
 * LLM/ASR/TTS + latency spec, with a "Configure in Stack →" jump.
 */

interface AgentSpec {
  llm: string
  asr: string
  tts: string
  /** ms. Use null for "not connected yet". */
  latencyMs: number | null
  /** ms. Use null for "not connected yet". */
  ttftMs: number | null
  /** Per-provider latency breakdown (all ms; null = "not connected yet"). When
   *  present, the panel renders an ASR/LLM/TTS → end-to-end → best-case block. */
  asrMs?: number | null
  llmMs?: number | null
  ttsMs?: number | null
  bestCaseMs?: number | null
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
  /** Jump to the Stack step to change the spec (the panel itself is read-only). */
  onConfigure?: () => void
  className?: string
}

export function AgentTestPanel({
  title,
  state = "Agent Disconnected",
  spec,
  onTest,
  testLabel = "Test Agent",
  onConfigure,
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

      {/* Bottom panel — READ-ONLY vendor + latency specs. Config lives in Stack. */}
      <div className="border-t border-border px-6 py-6 space-y-3">
        {onConfigure && (
          <div className="flex items-center justify-between pb-3 mb-1 border-b border-border">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <button
              type="button"
              onClick={onConfigure}
              className="inline-flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Configure in Stack <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        )}

        <StatRow label="LLM" value={spec.llm} />
        <StatRow label="ASR" value={spec.asr} />
        <StatRow label="TTS" value={spec.tts} />

        {/* Latency breakdown — per-provider stats roll up to end-to-end, with a
            best-case floor. Only when the per-provider fields are supplied;
            otherwise fall back to the two-row estimate. All figures are
            estimates ("~"). */}
        {spec.asrMs !== undefined || spec.llmMs !== undefined || spec.ttsMs !== undefined ? (
          <div className="space-y-3 border-t border-border pt-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Latency breakdown
            </p>
            <StatRow label="ASR" value={ms(spec.asrMs)} mono />
            <StatRow label="LLM (TTFT)" value={ms(spec.llmMs)} mono />
            <StatRow label="TTS" value={ms(spec.ttsMs)} mono />
            <div className="border-t border-border pt-3 space-y-3">
              <StatRow label="End-to-end" value={ms(spec.latencyMs)} mono />
              <StatRow label="Best case" value={ms(spec.bestCaseMs)} mono muted />
            </div>
          </div>
        ) : (
          <>
            <StatRow
              label="Est. end-to-end latency"
              value={spec.latencyMs !== null ? `~${spec.latencyMs} ms` : "—"}
              mono
            />
            <StatRow
              label="Est. LLM time to first token"
              value={spec.ttftMs !== null ? `~${spec.ttftMs} ms` : "—"}
              mono
            />
          </>
        )}
      </div>
    </aside>
  )
}

/** Format an optional latency figure as "~N ms", or an em-dash when unknown. */
function ms(v: number | null | undefined): string {
  return v != null ? `~${v} ms` : "—"
}

function StatRow({
  label,
  value,
  mono = false,
  muted = false,
}: {
  label: string
  value: string
  mono?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-sm shrink-0",
          mono && "tabular-nums font-mono",
          muted && "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * AgentSphere — animated gradient orb representing the agent's state.
 * Pure CSS — no canvas/three.js needed at wireframe altitude.
 *
 * ⚠️ DELIBERATE BRAND-ART EXCEPTION to the design-token rule: this is a stylized
 * 3D specular orb whose depth (inner shadow, dual specular highlights, ambient
 * halo) can't be expressed with flat semantic tokens. The rgba/oklch literals
 * here are intentional and reviewed — they are not app chrome. Everything ELSE
 * in this group uses tokens.
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
