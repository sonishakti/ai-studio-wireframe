/**
 * Wizard draft — the single state object the creation wizard reads & writes.
 *
 * One `AgentDraft` powers all four entry modes (new · edit · onboarding ·
 * empty-state). It is mirrored to localStorage (`sx:agent_draft`) so a refresh
 * mid-build restores progress — the "auto-save as draft" the spec asks for.
 * Cleared on publish. No backend (wireframe), same `sx:` guard idiom as
 * `lib/analytics.ts`.
 */

import { extractVars, stackFor, PHONE_NUMBERS, type Agent, type AgentStack } from "@/lib/campaign-data"
import { PRESET_VOICES } from "@/lib/voice-artifacts"

export type AgentType = "inbound" | "outbound" | "code"

/** Pointer to the chosen Step-1 voice (preset or a saved custom artifact). */
export interface VoiceRef {
  kind: "preset" | "custom"
  id: string
}

/** Inbound sub-mode (Step 4.1): a phone number, or an embeddable web widget. */
export type InboundMode = "phone" | "web"

export interface AgentDraft {
  /** Set when editing an existing agent; absent for a brand-new draft. */
  agentId?: string
  name: string
  /** Step 1 — gates Step 2 (locked until this is non-null). */
  voice: VoiceRef | null
  /** Step 2 — gates Steps 3–5. */
  type: AgentType | null
  /** Step 1 (Voice & models) — the model stack behind the voice. Defaults to the
   *  balanced preset so cost/latency estimates exist from first paint. */
  stack: AgentStack
  /** Step 3. */
  systemPrompt: string
  greeting: string
  knowledge: string[]
  mcp: string[]
  /** Step 4 — channel config, branched by `type`. */
  config: {
    inbound?: { mode: InboundMode; numberId?: string }
    outbound?: { numberId?: string; csvName?: string | null }
    code?: { added?: boolean }
  }
}

/** One source for the stack's non-preset defaults — spread by both new drafts
 *  and agentToDraft so the two entry paths can't open with different Step-1
 *  defaults. */
export const STACK_DEFAULTS = { pipeline: "stt-llm-tts", language: "English" } as const

/** Display name for an agent type — "Batch calls" is the locked term for
 *  outbound (LEARNINGS §20); never surface raw "outbound" to the user. */
export function typeLabel(t: AgentType): string {
  return t === "outbound" ? "Batch calls" : t === "code" ? "Code" : "Inbound"
}

export const EMPTY_DRAFT: AgentDraft = {
  name: "",
  voice: null,
  type: null,
  stack: { ...stackFor("balanced"), ...STACK_DEFAULTS },
  systemPrompt: "",
  greeting: "",
  knowledge: [],
  mcp: [],
  config: {},
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const DRAFT_KEY = "sx:agent_draft"

export function saveDraft(d: AgentDraft) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
  } catch {
    /* ignore quota / serialization errors — wireframe only */
  }
}

export function restoreDraft(): AgentDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    // Merge over EMPTY_DRAFT so older/partial drafts gain any new fields.
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<AgentDraft>) }
  } catch {
    return null
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(DRAFT_KEY)
}

export function hasDraft(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(DRAFT_KEY) != null
}

// ─── Edit mode — load an existing agent into a complete (all-steps-open) draft ─

/** Map a saved Agent into a draft. The agent doesn't store a single channel, so
 *  we default `type` to "inbound" (the user can change it); everything else is
 *  seeded from the agent so Edit reopens the same flow already filled in. */
export function agentToDraft(agent: Agent): AgentDraft {
  // Match a preset voice by its TTS voice; fall back to the first preset.
  const voiceMatch =
    PRESET_VOICES.find((v) => v.ttsVoice === agent.stack.tts.voice) ?? PRESET_VOICES[0]

  return {
    agentId: agent.id,
    name: agent.name,
    voice: { kind: "preset", id: voiceMatch.id },
    type: "inbound",
    stack: { ...STACK_DEFAULTS, ...agent.stack },
    systemPrompt: agent.persona.personality,
    greeting: agent.persona.firstMessage ?? "Hi, thanks for calling — how can I help you today?",
    knowledge: [...agent.knowledge],
    mcp: [...agent.actions],
    config: { inbound: { mode: "phone" } },
  }
}

// ─── Publish validation ───────────────────────────────────────────────────────
//
// The wizard's promise: nothing goes live half-configured. The biggest footgun
// is OUTBOUND — the system prompt/greeting reference {{dynamic_vars}} that must
// be supplied by the uploaded CSV's columns. We block Publish until every
// referenced variable has a matching column (this is the spec's "system-prompt
// template validation").

/** Columns a freshly-uploaded contacts CSV is mocked to contain (wireframe). */
export const MOCK_CSV_COLUMNS = ["name", "account", "balance", "due_date", "phone"]

/** {{vars}} the prompt/greeting reference that the attached CSV does NOT supply.
 *  With no CSV yet, every referenced var counts as missing. */
export function outboundMissingVars(d: AgentDraft): string[] {
  const required = extractVars(`${d.systemPrompt} ${d.greeting}`)
  if (!d.config.outbound?.csvName) return required
  return required.filter((v) => !MOCK_CSV_COLUMNS.includes(v))
}

export interface PublishBlock {
  /** Plain-language reason this isn't ready. */
  reason: string
  /** The step (1–5) whose drawer fixes it. */
  step: number
  /** Verb+noun for the "Fix this" button (e.g. "Pick a voice"). */
  action: string
}

/** Every unmet requirement between the draft and a live agent, in step order.
 *  Drives Step 5's "Fix this →" ramp; `publishBlockReason` returns just the first. */
export function publishBlocks(d: AgentDraft): PublishBlock[] {
  const blocks: PublishBlock[] = []
  if (!d.voice) blocks.push({ reason: "Choose a voice first.", step: 1, action: "Pick a voice" })
  if (!d.type) blocks.push({ reason: "Pick an agent type first.", step: 2, action: "Choose type" })
  if (!d.systemPrompt.trim()) blocks.push({ reason: "Add a system prompt.", step: 3, action: "Write the prompt" })

  if (d.type === "outbound") {
    if (!d.config.outbound?.numberId) blocks.push({ reason: "Attach a caller-ID phone number.", step: 4, action: "Set up calls" })
    if (!d.config.outbound?.csvName) blocks.push({ reason: "Upload a contacts CSV.", step: 4, action: "Add contacts" })
    else {
      const missing = outboundMissingVars(d)
      if (missing.length) blocks.push({
        reason: `Your contacts CSV is missing ${missing.length} variable${missing.length > 1 ? "s" : ""}: ${missing.map((v) => `{{${v}}}`).join(", ")}.`,
        step: 3, action: "Edit prompt",
      })
    }
  }

  if (d.type === "inbound" && (d.config.inbound?.mode ?? "phone") === "phone" && !d.config.inbound?.numberId) {
    blocks.push({ reason: "Attach a phone number for the agent to answer.", step: 4, action: "Set up the channel" })
  }

  return blocks
}

/** The first reason Publish is blocked, or null when the draft is ready. */
export function publishBlockReason(d: AgentDraft): string | null {
  return publishBlocks(d)[0]?.reason ?? null
}

/** The first step (1–5) still needing input — for "resume at step N" affordances. */
export function firstIncompleteStep(d: AgentDraft): number {
  if (!d.voice) return 1
  if (!d.type) return 2
  if (!d.systemPrompt.trim()) return 3
  if (publishBlockReason(d)) return 4
  return 5
}

export function canPublish(d: AgentDraft): boolean {
  return publishBlockReason(d) === null
}

/** Human-readable target of the configured channel — the number, "Web widget",
 *  "SDK / API", or contacts. Shared by Step 5's summary and the stepped
 *  builder's collapsed Step-4 summary so the two never drift. */
export function channelTarget(d: AgentDraft): string {
  if (d.type === "inbound") {
    if (d.config.inbound?.mode === "web") return "Web widget"
    const n = PHONE_NUMBERS.find((p) => p.id === d.config.inbound?.numberId)
    return n ? n.number : "No number yet"
  }
  if (d.type === "outbound") {
    const n = PHONE_NUMBERS.find((p) => p.id === d.config.outbound?.numberId)
    return [n?.number, d.config.outbound?.csvName].filter(Boolean).join(" · ") || "No contacts yet"
  }
  if (d.type === "code") return "SDK / API"
  return "—"
}
