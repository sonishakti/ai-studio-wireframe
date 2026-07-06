import type * as React from "react"
import { AudioLines, Waypoints, FileText, Phone, Rocket } from "lucide-react"
import type { AgentDraft } from "@/lib/wizard-draft"

/** Shared contract every wizard step receives. `update` shallow-merges a patch
 *  into the single AgentDraft the host owns (autosaved + step-gated there). */
export interface StepProps {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
}

export const STEP_TITLES = [
  // "Voice & models" — the drawer holds the persona picker AND the model stack;
  // calling it just "voice" would mislabel the LLM/STT config (review finding 7).
  "Voice & models",
  "Select agent type",
  // Scope-honest: the drawer holds prompt + greeting + knowledge + connectors,
  // not just a prompt textarea (heuristic-eval finding #3).
  "Prompt & tools",
  "Connect a channel",
  "Deploy",
] as const

/** The checklist's two chunks (variant-audit winner, 2026-07-06): "Your agent"
 *  = what it is; "How it goes live" = where it runs. Two labeled groups of 2-3
 *  beat one flat list of 5 for digestion; canonical step ids 1-5 are UNCHANGED
 *  (drawers, ?step=N, Back/Next all keep the original order). */
export const STEP_GROUPS = [
  { label: "Your agent", steps: [1, 3] },
  { label: "How it goes live", steps: [2, 4, 5] },
] as const

/** Row glyph for not-done rows — grouping breaks digit contiguity (1,3 / 2,4,5),
 *  so rows show an icon (or ✓ when done) instead of a number. */
export const STEP_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: AudioLines,
  2: Waypoints,
  3: FileText,
  4: Phone,
  5: Rocket,
}

/** Row title — static except Step 4, which names the chosen destination once
 *  the type is picked ("Connect a channel" → "Set up batch calls"). The row
 *  and the drawer header both use this, so they can never disagree. */
export function stepTitle(n: number, draft: AgentDraft): string {
  if (n === 4 && draft.type) {
    if (draft.type === "outbound") return "Set up batch calls"
    if (draft.type === "code") return "Add to your app"
    return draft.config.inbound?.mode === "web" ? "Add the web widget" : "Connect a phone number"
  }
  return STEP_TITLES[n - 1]
}

/** What lives inside each drawer — the checklist's always-visible content map.
 *  THE recognition-over-recall fix (heuristic-eval finding #1): every feature's
 *  location is readable from the landing without opening anything. Branches on
 *  the chosen type so row 4 predicts its actual contents. */
export function stepManifest(n: number, draft: AgentDraft): string {
  if (n === 1) return "Persona · STT / LLM / TTS · Voice · Language"
  if (n === 2) return "Batch calls · Inbound · Code / SDK"
  if (n === 3) return "Prompt · Greeting · Knowledge · Connectors · Quick test"
  if (n === 4) {
    if (draft.type === "outbound") return "Caller ID · Contacts CSV · Call window · Retries"
    if (draft.type === "code") return "SDK install · Join & stop snippets · Docs"
    if (draft.type === "inbound")
      return draft.config.inbound?.mode === "web"
        ? "Widget title · Greeting · Embed snippet"
        : "Phone number · Web widget option"
    return "Channel setup — pick a type first"
  }
  return "Review everything · Go live"
}
