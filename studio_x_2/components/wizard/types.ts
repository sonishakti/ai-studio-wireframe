import type * as React from "react"
import { Waypoints, FileText, AudioLines, Rocket, FlaskConical } from "lucide-react"
import type { AgentDraft } from "@/lib/wizard-draft"
import { activeCampaigns, hasChannel } from "@/lib/wizard-draft"

/** Shared contract every wizard section receives. `update` shallow-merges a
 *  patch into the single AgentDraft the host owns (autosaved + step-gated there). */
export interface StepProps {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
}

/** FIVE sections (v5 IA, 2026-07-28 — owner direction, second pass): the hot
 *  path is three core decisions — VOICE (tier + voice) · CHANNEL (multi-select
 *  where it runs) · CONTEXT (what it knows and says) — then TEST (live
 *  contextual test + auto-generated simulations + A/B) sits between Context
 *  and GO LIVE, the deploy panel (campaigns/runs for outbound, call analytics
 *  for inbound, review & deploy). Advanced/orthogonal workflows stay in
 *  slide-out panels, off the hot path. */
export const STEP_TITLES = [
  "Voice",
  "Channel",
  "Context",
  "Test",
  "Go Live",
] as const

export const SECTION_COUNT = STEP_TITLES.length

/** LHS rail groups — Set up → Test → Deploy. */
export const SECTION_GROUPS: { label: string; steps: number[] }[] = [
  { label: "Set up", steps: [1, 2, 3] },
  { label: "Test", steps: [4] },
  { label: "Deploy", steps: [5] },
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

/** What lives inside each section — the always-visible content map. Sections
 *  2 and 5 follow the chosen channels so the row predicts its actual contents. */
export function stepManifest(n: number, draft: AgentDraft): string {
  if (n === 1) return "Model tier · Voice · Advanced tuning"
  if (n === 2) {
    if (draft.channels.length === 0) return "Inbound · Batch calls · Web widget · Code / SDK"
    return draft.channels
      .map((c) => (c === "batch" ? "Batch calls" : c === "web" ? "Web widget" : c === "code" ? "Code / SDK" : "Inbound"))
      .join(" · ")
  }
  if (n === 3) return "System prompt · Greeting · Additional context"
  if (n === 4) return "Live test · Simulations · A/B compare"
  if (n === 5) {
    const parts: string[] = []
    if (hasChannel(draft, "batch")) {
      const count = activeCampaigns(draft).length
      parts.push(count > 0 ? `${count} run${count > 1 ? "s" : ""}` : "Campaign runs")
    }
    if (hasChannel(draft, "inbound")) parts.push("Inbound call settings")
    parts.push("Structured outputs", "Review & deploy")
    return parts.join(" · ")
  }
  return ""
}
