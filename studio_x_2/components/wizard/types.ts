import type * as React from "react"
import { Waypoints, FileText, AudioLines, Cpu, Boxes, Mic, Rocket } from "lucide-react"
import type { AgentDraft } from "@/lib/wizard-draft"
import { typeLabel } from "@/lib/wizard-draft"

/** Shared contract every wizard section receives. `update` shallow-merges a
 *  patch into the single AgentDraft the host owns (autosaved + step-gated there). */
export interface StepProps {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
}

/** SIX sections in JOURNEY order (v3 IA, 2026-07-17 — references/
 *  agent-builder-ia-2026-07-17.html): the agent ships working on universal
 *  defaults, so the developer's first decision is the CHANNEL (the prompt is
 *  channel-shaped — "Thanks for calling…" vs "Hey {{name}}, I'm calling
 *  from…"), then the words. Voice, models, and knowledge/tools demote to
 *  "Customize — only if you need to". The old Optional trio dissolves:
 *  Advanced → Voice & speech, Analysis → Go live, Call settings → Channel. */
export const STEP_TITLES = [
  "Channel",
  "Prompt",
  "Voice & speech",
  "Models",
  "Knowledge & Tools",
  "Test",
  "Go live",
] as const

export const SECTION_COUNT = STEP_TITLES.length

/** LHS rail groups — journey stages, not layer names (v3 §4): the critical
 *  path is Set up → Ship; Customize is skippable by design. Ship = try it,
 *  then deploy it (owner 2026-07-17: Test is a first-class Ship section). */
export const SECTION_GROUPS: { label: string; steps: number[] }[] = [
  { label: "Set up", steps: [1, 2] },
  { label: "Customize", steps: [3, 4, 5] },
  { label: "Ship", steps: [6, 7] },
]

export const STEP_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: Waypoints,
  2: FileText,
  3: AudioLines,
  4: Cpu,
  5: Boxes,
  6: Mic,
  7: Rocket,
}

export function stepTitle(n: number, _draft: AgentDraft): string {
  return STEP_TITLES[n - 1]
}

/** What lives inside each section — the always-visible content map (the
 *  recognition-over-recall fix survives the v3 reorder). Section 1 branches on
 *  the chosen channel so the row predicts its actual contents. */
export function stepManifest(n: number, draft: AgentDraft): string {
  if (n === 1) {
    if (draft.type === "outbound") return "Pick channel · Caller ID · Contacts CSV · Call window"
    if (draft.type === "code") return "Pick channel · SDK snippets"
    if (draft.type === "inbound")
      return draft.config.inbound?.mode === "web"
        ? "Pick channel · Web widget"
        : "Pick channel · Phone number"
    return "Batch calls · Inbound · Code / SDK"
  }
  if (n === 2) return "System prompt · Greeting · Persona"
  if (n === 3) return "Voice · Language · Turn-taking · Filters"
  if (n === 4) return "Pipeline · Latency vs cost · Models"
  if (n === 5) return "Knowledge · History · MCP · Connectors"
  if (n === 6) return "Simulated test call · Evals"
  if (n === 7) return "Review & deploy"
  return ""
}

/** The LHS outliner's per-section TOC (v3 ask: "click the section, see the
 *  page's subsections; everything navigable from the left, no RHS scrolling").
 *  Each entry's id is a scroll anchor rendered by the section body. Section 1's
 *  list follows the chosen channel. */
export function stepToc(n: number, draft: AgentDraft): { id: string; label: string }[] {
  if (n === 1) {
    const toc = [{ id: "wz-1-pick", label: "Pick channel" }]
    if (draft.type === "inbound")
      toc.push({
        id: "wz-1-setup",
        label: draft.config.inbound?.mode === "web" ? "Web widget" : "Phone number",
      })
    if (draft.type === "outbound") {
      toc.push({ id: "wz-1-setup", label: typeLabel("outbound") })
      toc.push({ id: "wz-1-callsettings", label: "Call window & retries" })
    }
    if (draft.type === "code") toc.push({ id: "wz-1-setup", label: typeLabel("code") })
    return toc
  }
  if (n === 2)
    return [
      { id: "wz-2-prompt", label: "System prompt" },
      { id: "wz-2-greeting", label: "Greeting" },
      { id: "wz-2-persona", label: "Persona" },
    ]
  if (n === 3)
    return [
      { id: "wz-3-voice", label: "Voice" },
      { id: "wz-3-language", label: "Language & input" },
      { id: "wz-3-turntaking", label: "Turn-taking & interruptions" },
      { id: "wz-3-attention", label: "Attention & filters" },
    ]
  if (n === 4)
    return [
      { id: "wz-4-arch", label: "Pipeline" },
      { id: "wz-4-model", label: "Latency vs cost · Models" },
    ]
  if (n === 5)
    return [
      { id: "wz-5-kb", label: "Knowledge base" },
      { id: "wz-5-history", label: "Conversation history" },
      { id: "wz-5-mcp", label: "MCP servers" },
      { id: "wz-5-connectors", label: "Connectors" },
    ]
  if (n === 6)
    return [
      { id: "wz-6-test", label: "Test call" },
    ]
  if (n === 7)
    return [
      { id: "wz-7-review", label: "Review & deploy" },
    ]
  return []
}
