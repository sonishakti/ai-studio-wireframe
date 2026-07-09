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
  // "Voice" — the model stack moved to the Playground (2026-07-07), so Step 1
  // is the voice pick + spoken language; the engine rides along with the voice.
  "Voice",
  "Select agent type",
  // Scope-honest: the drawer holds prompt + greeting + knowledge + connectors,
  // not just a prompt textarea (heuristic-eval finding #3).
  "Prompt & tools",
  "Connect a channel",
  "Deploy",
] as const

/** Row glyph for not-done rows — rows read as one unbroken 1-5 sequence
 *  (2026-07-07 direction: no group headers), each with its step's icon
 *  (or ✓ when done). */
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
  if (n === 1) return "Voice · Language"
  if (n === 2) return "Batch calls · Inbound · Code / SDK"
  if (n === 3) return "Prompt · Greeting · Knowledge · MCP · Connectors"
  if (n === 4) {
    if (draft.type === "outbound") return "Caller ID · Contacts CSV · Call window · Retries"
    if (draft.type === "code") return "SDK install · Join & stop snippets · Docs"
    if (draft.type === "inbound")
      return draft.config.inbound?.mode === "web"
        ? "Widget title · Greeting · Embed snippet"
        : "Phone number · Web widget option"
    return "Channel setup · pick a type first"
  }
  return "Review everything · Go live"
}
