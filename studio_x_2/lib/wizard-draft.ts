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
import { clearWidgetState } from "@/lib/widget-config"

export type AgentType = "inbound" | "outbound" | "code"

/** Pointer to the chosen Step-1 voice (preset or a saved custom artifact). */
export interface VoiceRef {
  kind: "preset" | "custom"
  id: string
}

/** Inbound sub-mode (Step 4.1): a phone number, or an embeddable web widget. */
export type InboundMode = "phone" | "web"

// ─── Optional depth: Advanced (voice behaviour) + Analysis (post-call) ─────────
// Both are OPTIONAL on the draft: absent = untouched, render from DEFAULT_*.
// Only written once the user changes something, so clean drafts stay lean.

/** Advanced voice-interaction tuning (Figma "Advanced" tab, 2026-07-07;
 *  extended per the 2026-07-22 "Builder-Updated-IA" proposal: filter-word
 *  selection rule + SAL voiceprint mode). */
export interface AdvancedConfig {
  turnDetection: { enabled: boolean; preset: "responsive" | "balanced" | "patient" | "custom"; threshold: number }
  startOfSpeech: { enabled: boolean; mode: "vad" | "keyword"; keywords: string[]; interruptMs: number; prefixPaddingMs: number }
  endOfSpeech: { enabled: boolean; mode: "vad" | "semantic"; silenceMs: number; maxWaitMs: number }
  attentionLocking: {
    enabled: boolean
    /** Speaker Lock vs Voiceprint Recognition (proposal node 2639-102124). */
    mode: "speaker" | "voiceprint"
    voiceprint?: { name: string; url: string }
  }
  filterWords: {
    enabled: boolean
    patterns: string
    responseWaitMs: number
    /** How filler phrases are picked (proposal): shuffle vs in order. */
    selectionRule?: "shuffle" | "in-order"
  }
  history: { maxMessages: number }
}

export const DEFAULT_ADVANCED: AdvancedConfig = {
  turnDetection: { enabled: true, preset: "balanced", threshold: 50 },
  startOfSpeech: { enabled: true, mode: "vad", keywords: [], interruptMs: 300, prefixPaddingMs: 120 },
  endOfSpeech: { enabled: true, mode: "vad", silenceMs: 500, maxWaitMs: 8000 },
  attentionLocking: { enabled: false, mode: "speaker" },
  filterWords: { enabled: false, patterns: "", responseWaitMs: 400, selectionRule: "shuffle" },
  history: { maxMessages: 20 },
}

/** A structured-output field the agent extracts from a call (Figma "Call
 *  Analysis" data points, 2026-07-07). */
export type DataPointType = "text" | "number" | "boolean" | "enum"
export interface DataPoint {
  id: string
  name: string
  type: DataPointType
  description: string
  /** Enum only — the allowed values for this data point. */
  allowedValues?: string[]
}
export interface AnalysisConfig {
  /** Store call transcripts (required before data points can be extracted). */
  transcribe: boolean
  /** Store call audio recordings (Figma splits this from transcripts). */
  record: boolean
  /** Judge each call "Successful" / "Failed" against the criteria below. */
  successEval: boolean
  evalCriteria: string
  dataPoints: DataPoint[]
}

export const DEFAULT_ANALYSIS: AnalysisConfig = {
  transcribe: true,
  record: true,
  successEval: false,
  evalCriteria: "",
  dataPoints: [],
}

/** How the agent's calls end + when they hand off to a person (Figma "Call
 *  Settings" / "Hang-up Configuration" / "Transfer Call to Human", node
 *  2593-101785). Channel-agnostic core; voicemail/ring/pacing only render for
 *  Batch calls. Optional on the draft like `advanced` — absent = defaults. */
export interface CallBehaviorConfig {
  /** The agent may end the call itself. */
  endCall: boolean
  /** Hang up when the conversation concludes naturally. */
  endOfConversation: boolean
  /** Outbound: detect answering machines and hang up. */
  voicemailDetection: boolean
  silenceHangup: boolean
  silenceTimeoutSec: number
  maxDurationSec: number
  /** Outbound: give up dialing after this many seconds of ringing. */
  ringDurationSec: number
  transfer: boolean
  transferDest: string
  transferCriteria: string
  /** Outbound: minimum gap between placed calls (rate pacing). */
  minIntervalMs: number
}

export const DEFAULT_CALL_BEHAVIOR: CallBehaviorConfig = {
  endCall: true,
  endOfConversation: true,
  voicemailDetection: true,
  silenceHangup: true,
  silenceTimeoutSec: 120,
  maxDurationSec: 300,
  ringDurationSec: 30,
  transfer: false,
  transferDest: "",
  transferCriteria: "",
  minIntervalMs: 1000,
}

/** When a batch starts dialing (Figma "Launch Timing"). */
export interface LaunchConfig {
  mode: "now" | "scheduled"
  /** Scheduled only — wireframe keeps these as plain strings. */
  startDate?: string
  startTime?: string
  timezone?: string
}

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
  /** What the agent says when it can't answer (proposal 2026-07-22). */
  failureMessage: string
  /** The starter template picked in Agent Prompt — also names the preview
   *  panel's identity badge ("Friendly Receptionist"). */
  templateName?: string
  knowledge: string[]
  mcp: string[]
  /** Step 3 Actions — attached third-party Connector ids (F6). */
  connectors: string[]
  /** Optional depth — absent until the user opens the section (F1 / F8). */
  advanced?: AdvancedConfig
  analysis?: AnalysisConfig
  /** Hang-up rules + human handoff — absent until touched (defaults apply). */
  callBehavior?: CallBehaviorConfig
  /** Step 4 — channel config, branched by `type`. */
  config: {
    inbound?: { mode: InboundMode; numberId?: string }
    outbound?: {
      numberId?: string
      csvName?: string | null
      /** Batch settings — in the draft (not drawer-local state) so they
       *  survive close/reopen and show up in summaries + the config JSON. */
      callWindow?: "business" | "extended" | "anytime"
      maxConcurrent?: number
      retries?: number
      /** Launch now vs schedule for later (Figma "Launch Timing"). */
      launch?: LaunchConfig
    }
    code?: { added?: boolean }
  }
}

/** One source for the stack's non-preset defaults — spread by both new drafts
 *  and agentToDraft so the two entry paths can't open with different Step-1
 *  defaults. */
export const STACK_DEFAULTS = { pipeline: "stt-llm-tts", language: "English" } as const

/** Display name for an agent type — "Batch calls" is the locked term for
 *  outbound (LEARNINGS §20) and "Code / SDK" is the one name for the code
 *  channel everywhere (heuristic-eval finding #19); never surface raw
 *  "outbound" or a bare "Embed" to the user. */
export function typeLabel(t: AgentType): string {
  return t === "outbound" ? "Batch calls" : t === "code" ? "Code / SDK" : "Inbound"
}

export const EMPTY_DRAFT: AgentDraft = {
  name: "",
  voice: null,
  type: null,
  stack: { ...stackFor("balanced"), ...STACK_DEFAULTS },
  systemPrompt: "",
  greeting: "",
  failureMessage: "",
  knowledge: [],
  mcp: [],
  connectors: [],
  config: {},
}

// ─── Persistence ──────────────────────────────────────────────────────────────
//
// One slot per agent: new drafts share the historical `sx:agent_draft` key;
// edit mode gets `sx:agent_draft:<id>` so unsaved edits to a live agent
// survive a refresh too (heuristic-eval finding #6) without ever colliding
// with the new-agent draft.

const DRAFT_KEY = "sx:agent_draft"

const keyFor = (agentId?: string) => (agentId ? `${DRAFT_KEY}:${agentId}` : DRAFT_KEY)

export function saveDraft(d: AgentDraft, agentId?: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(keyFor(agentId), JSON.stringify(d))
  } catch {
    /* ignore quota / serialization errors — wireframe only */
  }
}

export function restoreDraft(agentId?: string): AgentDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(keyFor(agentId))
    if (!raw) return null
    // Merge over EMPTY_DRAFT so older/partial drafts gain any new fields.
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<AgentDraft>) }
  } catch {
    return null
  }
}

export function clearDraft(agentId?: string) {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(keyFor(agentId))
  // New-agent slot only: its widget styling was keyed "new" and must not leak
  // into the next build. A LIVE agent's widget store survives publish/discard —
  // the embed snippet, not the deploy, is what carries widget styling.
  if (!agentId) clearWidgetState("new")
}

export function hasDraft(agentId?: string): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(keyFor(agentId)) != null
}

// ─── Edit mode — load an existing agent into a complete (all-steps-open) draft ─

/** Map a saved Agent into a draft — hydrating the TRUE channel from
 *  `agent.channel` (never fabricating one: an agent with no channel opens with
 *  Step 2 honestly incomplete, so the checklist can't contradict the Live
 *  badge — heuristic-eval 2026-07-06 finding #2). */
export function agentToDraft(agent: Agent): AgentDraft {
  // Match a preset voice by its TTS voice; fall back to the first preset.
  const voiceMatch =
    PRESET_VOICES.find((v) => v.ttsVoice === agent.stack.tts.voice) ?? PRESET_VOICES[0]

  const ch = agent.channel
  const type: AgentType | null = ch?.type ?? null
  const config: AgentDraft["config"] =
    ch?.type === "inbound"
      ? { inbound: { mode: ch.mode ?? "phone", numberId: ch.numberId } }
      : ch?.type === "outbound"
      ? { outbound: { numberId: ch.numberId, csvName: ch.csvName ?? null } }
      : ch?.type === "code"
      ? { code: { added: true } }
      : {}

  return {
    agentId: agent.id,
    name: agent.name,
    voice: { kind: "preset", id: voiceMatch.id },
    type,
    stack: { ...STACK_DEFAULTS, ...agent.stack },
    systemPrompt: agent.persona.personality,
    greeting: agent.persona.firstMessage ?? "Hi, thanks for calling. How can I help you today?",
    failureMessage: "Oops, I can't seem to answer that.",
    templateName: agent.role,
    knowledge: [...agent.knowledge],
    mcp: [...agent.actions],
    connectors: [...(agent.connectors ?? [])],
    config,
  }
}

// ─── Template seeding — "Start from this" must actually carry the template ────

export interface AgentTemplate {
  id: string
  name: string
  description: string
}

/** Seed a fresh draft from a starter template (name + a working prompt +
 *  greeting). Used by the `?template=` deep link so the template CTA never
 *  silently falls back to a stale draft (heuristic-eval finding #5). */
export function templateToDraft(tpl: AgentTemplate): AgentDraft {
  return {
    ...EMPTY_DRAFT,
    name: tpl.name === "Blank agent" ? "" : tpl.name,
    voice: { kind: "preset", id: PRESET_VOICES[0].id },
    templateName: tpl.id === "blank" ? undefined : tpl.name,
    systemPrompt:
      tpl.id === "blank"
        ? ""
        : `You are ${tpl.name}, a voice agent. ${tpl.description}.\n\nBe concise and helpful. Greet the caller, do your job, and escalate to a human if asked.`,
    greeting: tpl.id === "blank" ? "" : `Hi! This is ${tpl.name} from Acme. Do you have a quick moment?`,
    failureMessage: tpl.id === "blank" ? "" : "Oops, I can't seem to answer that.",
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

/** Row count of that mocked CSV — single source for the upload toast, the
 *  contacts panel, and the batch pre-flight confirmation (they must agree). */
export const MOCK_CSV_ROWS = 248

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
  /** The section (1–6, v3 journey order) that fixes it. */
  step: number
  /** Verb+noun for the "Fix this" button (e.g. "Pick a voice"). */
  action: string
}

/** Every unmet requirement between the draft and a live agent, in JOURNEY
 *  order (v3: Channel → Prompt → …). Drives the Go-live "Fix this →" ramp;
 *  `publishBlockReason` returns just the first. */
export function publishBlocks(d: AgentDraft): PublishBlock[] {
  const blocks: PublishBlock[] = []
  if (!d.type) blocks.push({ reason: "Pick a channel.", step: 1, action: "Pick channel" })

  if (d.type === "outbound") {
    if (!d.config.outbound?.numberId) blocks.push({ reason: "Attach a caller-ID phone number.", step: 1, action: "Set up calls" })
    if (!d.config.outbound?.csvName) blocks.push({ reason: "Upload a contacts CSV.", step: 1, action: "Add contacts" })
    const launch = d.config.outbound?.launch
    if (launch?.mode === "scheduled" && !(launch.startDate && launch.startTime && launch.timezone)) {
      blocks.push({ reason: "Set the start date, time, and timezone for the scheduled launch.", step: 1, action: "Set schedule" })
    }
  }
  if (d.type === "inbound" && (d.config.inbound?.mode ?? "phone") === "phone" && !d.config.inbound?.numberId) {
    blocks.push({ reason: "Attach a phone number for the agent to answer.", step: 1, action: "Set up the channel" })
  }

  if (!d.systemPrompt.trim()) blocks.push({ reason: "Add a system prompt.", step: 2, action: "Write the prompt" })
  if (d.type === "outbound" && d.config.outbound?.csvName) {
    const missing = outboundMissingVars(d)
    if (missing.length) blocks.push({
      reason: `Your contacts CSV is missing ${missing.length} variable${missing.length > 1 ? "s" : ""}: ${missing.map((v) => `{{${v}}}`).join(", ")}.`,
      step: 2, action: "Edit prompt",
    })
  }

  // Voice lives in section 4 since the 2026-07-22 IA (Models moved to 3).
  if (!d.voice) blocks.push({ reason: "Choose a voice.", step: 4, action: "Pick a voice" })

  return blocks
}

/** The first reason Publish is blocked, or null when the draft is ready. */
export function publishBlockReason(d: AgentDraft): string | null {
  return publishBlocks(d)[0]?.reason ?? null
}

/** The first section (1–6, v3 journey order) still needing input — for
 *  "resume at" affordances. Voice has a working default, so past the prompt
 *  the resume point is Go live. */
export function firstIncompleteStep(d: AgentDraft): number {
  if (!d.type) return 1
  if (!d.systemPrompt.trim()) return 2
  // Voice & Speech is section 4 since the 2026-07-22 IA (Models moved to 3).
  if (!d.voice) return 4
  return 6
}

export function canPublish(d: AgentDraft): boolean {
  return publishBlockReason(d) === null
}

/** Human-readable target of the configured channel — the number, "Web widget",
 *  "SDK / API", or contacts. Shared by the Deploy step's summary and the rail's
 *  step-4 recap so the two never drift. */
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
  return "Not set"
}
