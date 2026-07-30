import type * as React from "react"
import { Waypoints, FileText, AudioLines, Rocket, FlaskConical } from "lucide-react"
import type { AgentDraft } from "@/lib/wizard-draft"
import { activeCampaigns, hasChannel, inboundSurfaces } from "@/lib/wizard-draft"

/** Shared contract every wizard section receives. `update` shallow-merges a
 *  patch into the single AgentDraft the host owns (autosaved + step-gated there). */
export interface StepProps {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
}

/** FIVE sections. Labels renamed to industry-standard developer vocabulary
 *  (owner mock, 2026-07-30): "Context" → "Prompt & knowledge" ("context" reads
 *  as context-window to devs; every competitor says Prompt), "Channel" →
 *  "Deployment" (Retell/industry word for phone · web · SIP/code), "Voice" →
 *  "Voice & Models" (the section owns both handles). Structure unchanged:
 *  three core decisions, then TEST, then GO LIVE (the deploy panel). */
export const STEP_TITLES = [
  "Voice & Models",
  "Deployment",
  "Prompt & knowledge",
  "Test",
  "Go Live",
] as const

export const SECTION_COUNT = STEP_TITLES.length

/** LHS rail groups (owner mock 2026-07-30) — Customize → Ship. */
export const SECTION_GROUPS: { label: string; steps: number[] }[] = [
  { label: "Customize", steps: [1, 2, 3] },
  { label: "Ship", steps: [4, 5] },
]

export const STEP_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: AudioLines,
  2: Waypoints,
  3: FileText,
  4: FlaskConical,
  5: Rocket,
}

/** `?step=N` deep links: 1–5 are read as v5 sections literally; only the
 *  legacy tail (v3's 6 Test · 7 Go live) is mapped. Older links to 1–5 may
 *  land one section off — internal links all speak v5 now. */
export const LEGACY_STEP_MAP: Record<number, number> = { 6: 4, 7: 5 }

/** Map any incoming step param (v5 1–5 or legacy 6–7) onto the sections. */
export function resolveStepParam(n: number): number | null {
  if (n >= 1 && n <= SECTION_COUNT) return n
  if (n >= 6 && n <= 7) return LEGACY_STEP_MAP[n] ?? null
  return null
}

export function stepTitle(n: number, _draft: AgentDraft): string {
  return STEP_TITLES[n - 1]
}
