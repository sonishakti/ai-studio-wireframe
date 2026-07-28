import type * as React from "react"
import { Waypoints, FileText, AudioLines, Rocket } from "lucide-react"
import type { AgentDraft } from "@/lib/wizard-draft"
import { activeCampaigns, hasChannel } from "@/lib/wizard-draft"

/** Shared contract every wizard section receives. `update` shallow-merges a
 *  patch into the single AgentDraft the host owns (autosaved + step-gated there). */
export interface StepProps {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
}

/** FOUR sections (v4 IA, 2026-07-28 — owner direction): the hot path collapses
 *  to three core decisions — VOICE (tier + voice, the two handles), CHANNEL
 *  (multi-select where it runs), CONTEXT (what it knows and says) — and GO
 *  LIVE becomes the deploy panel: campaign management for batch, the inbound
 *  call settings, structured outputs, and review & deploy. Everything else
 *  (model architecture, manual vendor picks, speech tuning) moves to slide-out
 *  panels off the hot path. Testing leaves the column entirely — the header
 *  Test button owns it. */
export const STEP_TITLES = [
  "Voice",
  "Channel",
  "Context",
  "Go Live",
] as const

export const SECTION_COUNT = STEP_TITLES.length

/** LHS rail groups — the critical path is Set up → Deploy. */
export const SECTION_GROUPS: { label: string; steps: number[] }[] = [
  { label: "Set up", steps: [1, 2, 3] },
  { label: "Deploy", steps: [4] },
]

export const STEP_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: AudioLines,
  2: Waypoints,
  3: FileText,
  4: Rocket,
}

/** Legacy 7-section deep links (`?step=N`, palette events) → the section that
 *  now owns that content. 6 (Test) additionally opens the Test surface —
 *  special-cased by the wizard's parser; 4 here is its scroll fallback. */
export const LEGACY_STEP_MAP: Record<number, number> = { 1: 2, 2: 3, 3: 1, 4: 1, 5: 3, 6: 4, 7: 4 }

/** Map any incoming step param (old 1–7 or new 1–4) onto the v4 sections. */
export function resolveStepParam(n: number): number | null {
  if (n >= 1 && n <= SECTION_COUNT) return n
  if (n >= 1 && n <= 7) return LEGACY_STEP_MAP[n] ?? null
  return null
}

export function stepTitle(n: number, _draft: AgentDraft): string {
  return STEP_TITLES[n - 1]
}

/** What lives inside each section — the always-visible content map. Sections 2
 *  and 4 follow the chosen channels so the row predicts its actual contents. */
export function stepManifest(n: number, draft: AgentDraft): string {
  if (n === 1) return "Model tier · Voice · Advanced tuning"
  if (n === 2) {
    if (draft.channels.length === 0) return "Inbound · Batch calls · Web widget · Code / SDK"
    return draft.channels
      .map((c) => (c === "batch" ? "Batch calls" : c === "web" ? "Web widget" : c === "code" ? "Code / SDK" : "Inbound"))
      .join(" · ")
  }
  if (n === 3) return "System prompt · Greeting · Knowledge & tools"
  if (n === 4) {
    const parts: string[] = []
    if (hasChannel(draft, "batch")) {
      const count = activeCampaigns(draft).length
      parts.push(count > 0 ? `${count} campaign${count > 1 ? "s" : ""}` : "Campaigns")
    }
    if (hasChannel(draft, "inbound")) parts.push("Inbound call settings")
    parts.push("Structured outputs", "Review & deploy")
    return parts.join(" · ")
  }
  return ""
}
