import type * as React from "react"
import { AudioLines, Waypoints, FileText, Rocket } from "lucide-react"
import type { AgentDraft } from "@/lib/wizard-draft"

/** Shared contract every wizard step receives. `update` shallow-merges a patch
 *  into the single AgentDraft the host owns (autosaved + step-gated there). */
export interface StepProps {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
}

/** FOUR steps (owner 2026-07-13): "Connect a phone number should not be a step
 *  at all" — channel connection (how callers reach the agent) lives INSIDE
 *  Deploy, and the per-channel tuning (call window · concurrency · retries)
 *  moved to the optional group ("four steps and then three in advanced"). */
export const STEP_TITLES = [
  // "Voice & models" — the model stack came BACK inline (2026-07-09, reversing
  // the 2026-07-07 Playground move): Step 1 owns the voice, the spoken language,
  // and the engine (preset + pipeline + vendors), all on the builder page.
  "Voice & models",
  "Select agent type",
  // Scope-honest: the drawer holds prompt + greeting + knowledge + connectors,
  // not just a prompt textarea (heuristic-eval finding #3).
  "Prompt & tools",
  // Channel + review + go live, one step: connecting a channel IS deploying.
  "Deploy",
] as const

/** Row glyph for not-done rows — rows read as one unbroken 1-4 sequence
 *  (2026-07-07 direction: no group headers), each with its step's icon
 *  (or ✓ when done). */
export const STEP_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: AudioLines,
  2: Waypoints,
  3: FileText,
  4: Rocket,
}

/** Row title — static now that step 4 is simply "Deploy" (the old dynamic
 *  "Connect a phone number" titles named a step that no longer exists). */
export function stepTitle(n: number, _draft: AgentDraft): string {
  return STEP_TITLES[n - 1]
}

/** What lives inside each drawer — the checklist's always-visible content map.
 *  THE recognition-over-recall fix (heuristic-eval finding #1): every feature's
 *  location is readable from the landing without opening anything. Branches on
 *  the chosen type so row 4 predicts its actual contents. */
export function stepManifest(n: number, draft: AgentDraft): string {
  if (n === 1) return "Voice · Models · Language"
  if (n === 2) return "Batch calls · Inbound · Code / SDK"
  if (n === 3) return "Prompt · Greeting · Knowledge · MCP · Connectors"
  if (n === 4) {
    if (draft.type === "outbound") return "Caller ID · Contacts CSV · Review · Go live"
    if (draft.type === "code") return "SDK snippets · Review · Go live"
    if (draft.type === "inbound") return "Phone number · Web widget · Widget UI · Go live"
    return "Channel · Review · Go live"
  }
  return ""
}
