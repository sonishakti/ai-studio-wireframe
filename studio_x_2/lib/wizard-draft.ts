/**
 * Wizard draft — the single state object the creation wizard reads & writes.
 *
 * One `AgentDraft` powers all four entry modes (new · edit · onboarding ·
 * empty-state). It is mirrored to localStorage (`sx:agent_draft`) so a refresh
 * mid-build restores progress — the "auto-save as draft" the spec asks for.
 * Cleared on publish. No backend (wireframe), same `sx:` guard idiom as
 * `lib/analytics.ts`.
 *
 * 2026-07-28 IA: the agent is MULTI-CHANNEL (`channels: DeployChannel[]`
 * replaced the single `type`), inbound links MULTIPLE numbers (`numberIds`),
 * and batch calling is managed as CAMPAIGNS — several per agent, each with its
 * own CSV, caller ID, language, and schedule (re-runnable, parallelizable).
 * `migrateDraft` upgrades stored/imported drafts from the old shape.
 */

import { extractVars, stackFor, PHONE_NUMBERS, type Agent, type AgentStack } from "@/lib/campaign-data"
import { PRESET_VOICES } from "@/lib/voice-artifacts"
import { clearWidgetState } from "@/lib/widget-config"

/** Legacy single-channel type — still the vocabulary of the published
 *  `Agent.channel` mock and `publishDeployment`'s mode. */
export type AgentType = "inbound" | "outbound" | "code"

/** The deployment channels an agent can be live on — MULTI-SELECT since
 *  2026-07-28 (reverses the 06-11 one-agent-one-channel lock, per owner).
 *  "web" is first-class now (it was inbound's `mode: "web"` sub-state). */
export type DeployChannel = "inbound" | "batch" | "web" | "code"

/** Priority used when a single-channel summary is needed (the published
 *  Agent mock stays single-channel; the list shows the primary). */
export const CHANNEL_PRIORITY: DeployChannel[] = ["inbound", "web", "batch", "code"]

export const hasChannel = (d: AgentDraft, c: DeployChannel) => d.channels.includes(c)

export function primaryChannel(d: AgentDraft): DeployChannel | null {
  return CHANNEL_PRIORITY.find((c) => d.channels.includes(c)) ?? null
}

/** Pointer to the chosen voice (preset or a saved custom artifact). */
export interface VoiceRef {
  kind: "preset" | "custom"
  id: string
}

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
 *  2593-101785). AGENT-LEVEL and channel-agnostic core; voicemail/ring/pacing
 *  only render for Batch calls. Optional on the draft — absent = defaults. */
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

// ─── Campaigns — batch calling is a MANAGED LIST, not a single config ─────────
//
// An agent can run several campaigns: different CSVs, different regions/
// languages, in parallel (e.g. one Spanish + two English by region). A
// completed campaign can be re-run (duplicated as a fresh draft). Caller ID is
// ONE number per campaign — load-balancing across numbers is deferred.

export type CampaignStatus = "draft" | "scheduled" | "running" | "completed"

export interface CampaignDraft {
  id: string
  name: string
  /** Caller-ID number — single (load-balancing across numbers is deferred). */
  numberId?: string
  csvName?: string | null
  /** Mock row count of the attached CSV. */
  contacts?: number
  /** Region/language tag, e.g. "Spanish (MX)" — labels the row. */
  language?: string
  callWindow?: "business" | "extended" | "anytime"
  maxConcurrent?: number
  retries?: number
  launch?: LaunchConfig
  status: CampaignStatus
}

let campaignSeq = 0
export function newCampaignId(): string {
  campaignSeq += 1
  return `cmp_${Date.now().toString(36)}${campaignSeq}`
}

export function makeCampaign(name: string): CampaignDraft {
  return {
    id: newCampaignId(),
    name,
    language: "English",
    callWindow: "business",
    maxConcurrent: 10,
    retries: 1,
    launch: { mode: "now" },
    status: "draft",
  }
}

/** Campaigns that still count toward validation + the deploy manifest —
 *  everything not already completed. */
export const activeCampaigns = (d: AgentDraft) => d.campaigns.filter((c) => c.status !== "completed")

export interface AgentDraft {
  /** Set when editing an existing agent; absent for a brand-new draft. */
  agentId?: string
  name: string
  /** Section 1 (Voice) — the voice persona. */
  voice: VoiceRef | null
  /** Section 2 (Channel) — MULTI-SELECT deployment channels. */
  channels: DeployChannel[]
  /** Section 1 (Voice) — the model stack behind the voice. Defaults to the
   *  balanced preset so cost/latency estimates exist from first paint. */
  stack: AgentStack
  /** Section 3 (Context). */
  systemPrompt: string
  greeting: string
  /** What the agent says when it can't answer (proposal 2026-07-22). */
  failureMessage: string
  /** The starter template applied — shown as the header chip next to the name. */
  templateName?: string
  knowledge: string[]
  mcp: string[]
  /** Context › Actions — attached third-party Connector ids (F6). */
  connectors: string[]
  /** Optional depth — absent until the user opens the section (F1 / F8). */
  advanced?: AdvancedConfig
  analysis?: AnalysisConfig
  /** Hang-up rules + human handoff — absent until touched (defaults apply). */
  callBehavior?: CallBehaviorConfig
  /** Section 4 (Go Live) — batch campaigns, several per agent. */
  campaigns: CampaignDraft[]
  /** Per-channel connection state. */
  config: {
    /** Inbound links MULTIPLE numbers to one agent (2026-07-28). */
    inbound?: { numberIds: string[] }
    code?: { added?: boolean }
  }
}

/** One source for the stack's non-preset defaults — spread by both new drafts
 *  and agentToDraft so the two entry paths can't open with different
 *  defaults. */
export const STACK_DEFAULTS = { pipeline: "stt-llm-tts", language: "English" } as const

/** Display name for a legacy agent type — "Batch calls" is the locked term for
 *  outbound (LEARNINGS §20) and "Code / SDK" is the one name for the code
 *  channel everywhere (heuristic-eval finding #19). */
export function typeLabel(t: AgentType): string {
  return t === "outbound" ? "Batch calls" : t === "code" ? "Code / SDK" : "Inbound"
}

/** Display name for a deploy channel — same locked vocabulary. */
export function channelLabel(c: DeployChannel): string {
  return c === "batch" ? "Batch calls" : c === "code" ? "Code / SDK" : c === "web" ? "Web widget" : "Inbound calls"
}

/** Old single-channel vocabulary → the channels it means. Used by the create
 *  dialog and `?dc=` deep links. */
export function channelsForType(t: AgentType): DeployChannel[] {
  return t === "outbound" ? ["batch"] : t === "code" ? ["code"] : ["inbound"]
}

export const EMPTY_DRAFT: AgentDraft = {
  name: "",
  voice: null,
  channels: [],
  stack: { ...stackFor("balanced"), ...STACK_DEFAULTS },
  systemPrompt: "",
  greeting: "",
  failureMessage: "",
  knowledge: [],
  mcp: [],
  connectors: [],
  campaigns: [],
  config: {},
}

// ─── Migration — old drafts (type / inbound.mode / config.outbound) upgrade ───

/** Fields the pre-2026-07-28 draft shape carried. */
interface LegacyDraftFields {
  type?: AgentType | null
  config?: {
    inbound?: { mode?: "phone" | "web"; numberId?: string; numberIds?: string[] }
    outbound?: {
      numberId?: string
      csvName?: string | null
      callWindow?: "business" | "extended" | "anytime"
      maxConcurrent?: number
      retries?: number
      launch?: LaunchConfig
    }
    code?: { added?: boolean }
  }
}

/** Upgrade a stored/imported draft to the multi-channel + campaigns shape.
 *  New-shape drafts pass through untouched; old `type`/`mode`/`outbound`
 *  fields are mapped, never dropped silently. */
export function migrateDraft(raw: Partial<AgentDraft> & LegacyDraftFields): AgentDraft {
  const legacyType = raw.type
  const legacyInbound = raw.config?.inbound
  const legacyOutbound = raw.config?.outbound

  // Channels: keep an explicit new-shape list; otherwise derive from `type`.
  const channels: DeployChannel[] = Array.isArray(raw.channels)
    ? raw.channels.filter((c): c is DeployChannel => c === "inbound" || c === "batch" || c === "web" || c === "code")
    : legacyType === "inbound"
      ? legacyInbound?.mode === "web" ? ["web"] : ["inbound"]
      : legacyType === "outbound"
        ? ["batch"]
        : legacyType === "code"
          ? ["code"]
          : []

  // Inbound numbers: numberIds wins; a legacy single numberId becomes [id].
  const numberIds = Array.isArray(legacyInbound?.numberIds)
    ? legacyInbound.numberIds.filter((n): n is string => typeof n === "string")
    : legacyInbound?.numberId
      ? [legacyInbound.numberId]
      : []

  // Campaigns: keep an explicit list; otherwise fold config.outbound into one.
  const campaigns: CampaignDraft[] = Array.isArray(raw.campaigns)
    ? raw.campaigns
    : legacyOutbound && (legacyOutbound.numberId || legacyOutbound.csvName)
      ? [{
          ...makeCampaign(raw.name?.trim() ? `${raw.name.trim()} campaign` : "Migrated campaign"),
          numberId: legacyOutbound.numberId,
          csvName: legacyOutbound.csvName ?? null,
          contacts: legacyOutbound.csvName ? MOCK_CSV_ROWS : undefined,
          callWindow: legacyOutbound.callWindow ?? "business",
          maxConcurrent: legacyOutbound.maxConcurrent ?? 10,
          retries: legacyOutbound.retries ?? 1,
          launch: legacyOutbound.launch ?? { mode: "now" },
        }]
      : []

  const config: AgentDraft["config"] = {
    ...(numberIds.length || channels.includes("inbound") ? { inbound: { numberIds } } : {}),
    ...(raw.config?.code ? { code: raw.config.code } : {}),
  }

  const next = { ...EMPTY_DRAFT, ...raw, channels, campaigns, config } as AgentDraft & LegacyDraftFields
  delete next.type
  return next
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
    // Migrate + merge over EMPTY_DRAFT so older/partial drafts gain new fields.
    return migrateDraft(JSON.parse(raw) as Partial<AgentDraft>)
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
 *  the Channel section honestly incomplete — heuristic-eval 2026-07-06 #2).
 *  Campaign seeds on the Agent hydrate the campaigns list; a legacy outbound
 *  channel without seeds synthesizes one running campaign from its CSV. */
export function agentToDraft(agent: Agent): AgentDraft {
  // Match a preset voice by its TTS voice; fall back to the first preset.
  const voiceMatch =
    PRESET_VOICES.find((v) => v.ttsVoice === agent.stack.tts.voice) ?? PRESET_VOICES[0]

  const ch = agent.channel
  const channels: DeployChannel[] =
    ch?.type === "inbound"
      ? ch.mode === "web" ? ["web"] : ["inbound"]
      : ch?.type === "outbound"
        ? ["batch"]
        : ch?.type === "code"
          ? ["code"]
          : []

  const campaigns: CampaignDraft[] = agent.campaigns
    ? agent.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        numberId: c.numberId,
        csvName: c.csvName ?? null,
        contacts: c.contacts ?? (c.csvName ? MOCK_CSV_ROWS : undefined),
        language: c.language ?? "English",
        callWindow: c.callWindow ?? "business",
        maxConcurrent: c.maxConcurrent ?? 10,
        retries: c.retries ?? 1,
        launch: c.startDate
          ? { mode: "scheduled", startDate: c.startDate, startTime: c.startTime, timezone: c.timezone }
          : { mode: "now" },
        status: c.status,
      }))
    : ch?.type === "outbound"
      ? [{
          ...makeCampaign(`${agent.name} campaign`),
          numberId: ch.numberId,
          csvName: ch.csvName ?? null,
          contacts: ch.csvName ? MOCK_CSV_ROWS : undefined,
          status: agent.status === "live" ? "running" : "draft",
        }]
      : []

  return {
    agentId: agent.id,
    name: agent.name,
    voice: { kind: "preset", id: voiceMatch.id },
    channels,
    stack: { ...STACK_DEFAULTS, ...agent.stack },
    systemPrompt: agent.persona.personality,
    greeting: agent.persona.firstMessage ?? "Hi, thanks for calling. How can I help you today?",
    failureMessage: "Oops, I can't seem to answer that.",
    templateName: agent.role,
    knowledge: [...agent.knowledge],
    mcp: [...agent.actions],
    connectors: [...(agent.connectors ?? [])],
    campaigns,
    config: {
      ...(ch?.type === "inbound" && ch.mode !== "web"
        ? { inbound: { numberIds: ch.numberId ? [ch.numberId] : [] } }
        : {}),
      ...(ch?.type === "code" ? { code: { added: true } } : {}),
    },
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
// is BATCH — the prompt/greeting reference {{dynamic_vars}} that must be
// supplied by each campaign CSV's columns. Deploy stays blocked until every
// referenced variable has a matching column.

/** Columns a freshly-uploaded contacts CSV is mocked to contain (wireframe). */
export const MOCK_CSV_COLUMNS = ["name", "account", "balance", "due_date", "phone"]

/** Row count of that mocked CSV — single source for the upload toast, the
 *  contacts panel, and the batch pre-flight confirmation (they must agree). */
export const MOCK_CSV_ROWS = 248

/** {{vars}} the prompt/greeting reference that THIS campaign's CSV does NOT
 *  supply. With no CSV yet, every referenced var counts as missing. */
export function campaignMissingVars(d: AgentDraft, c: CampaignDraft): string[] {
  const required = extractVars(`${d.systemPrompt} ${d.greeting}`)
  if (!c.csvName) return required
  return required.filter((v) => !MOCK_CSV_COLUMNS.includes(v))
}

export interface PublishBlock {
  /** Plain-language reason this isn't ready. */
  reason: string
  /** The section (1 Voice · 2 Channel · 3 Context · 4 Go Live) that fixes it. */
  step: number
  /** Verb+noun for the "Fix this" button (e.g. "Pick a voice"). */
  action: string
}

/** Every unmet requirement between the draft and a live agent, in JOURNEY
 *  order (Voice → Channel → Context → Go Live). Drives the Go-live "Fix this
 *  →" ramp; `publishBlockReason` returns just the first. */
export function publishBlocks(d: AgentDraft): PublishBlock[] {
  const blocks: PublishBlock[] = []

  if (!d.voice) blocks.push({ reason: "Choose a voice.", step: 1, action: "Pick a voice" })

  if (d.channels.length === 0) {
    blocks.push({ reason: "Pick at least one channel.", step: 2, action: "Pick channels" })
  }
  if (hasChannel(d, "inbound") && !(d.config.inbound?.numberIds.length)) {
    blocks.push({ reason: "Link a phone number for inbound calls.", step: 2, action: "Link a number" })
  }

  if (!d.systemPrompt.trim()) blocks.push({ reason: "Add a system prompt.", step: 3, action: "Write the prompt" })

  if (hasChannel(d, "batch")) {
    const active = activeCampaigns(d)
    // Zero campaigns blocks only when batch is the SOLE channel — an agent
    // that also answers inbound can go live "armed but idle" on batch.
    if (active.length === 0 && d.channels.length === 1) {
      blocks.push({ reason: "Create a campaign to start batch calling.", step: 4, action: "New campaign" })
    }
    for (const c of active) {
      if (!c.numberId) blocks.push({ reason: `"${c.name}" needs a caller-ID number.`, step: 4, action: "Pick a number" })
      if (!c.csvName) blocks.push({ reason: `"${c.name}" is missing its contacts CSV.`, step: 4, action: "Add contacts" })
      if (c.launch?.mode === "scheduled" && !(c.launch.startDate && c.launch.startTime && c.launch.timezone)) {
        blocks.push({ reason: `"${c.name}" is scheduled but has no start date, time, and timezone.`, step: 4, action: "Set schedule" })
      }
      if (c.csvName) {
        const missing = campaignMissingVars(d, c)
        if (missing.length) blocks.push({
          reason: `"${c.name}"'s CSV is missing ${missing.length} variable${missing.length > 1 ? "s" : ""}: ${missing.map((v) => `{{${v}}}`).join(", ")}.`,
          step: 3, action: "Edit prompt",
        })
      }
    }
  }

  return blocks
}

/** The first reason Publish is blocked, or null when the draft is ready. */
export function publishBlockReason(d: AgentDraft): string | null {
  return publishBlocks(d)[0]?.reason ?? null
}

/** The first section (1–4) still needing input — for "resume at" affordances. */
export function firstIncompleteStep(d: AgentDraft): number {
  if (!d.voice) return 1
  if (d.channels.length === 0) return 2
  if (!d.systemPrompt.trim()) return 3
  return 4
}

export function canPublish(d: AgentDraft): boolean {
  return publishBlockReason(d) === null
}

/** Human-readable summary of the configured channels — the numbers, "Web
 *  widget", campaign count, "SDK / API". Shared by the review summary and the
 *  rail recap so the two never drift. */
export function channelTarget(d: AgentDraft): string {
  const parts: string[] = []
  if (hasChannel(d, "inbound")) {
    const ids = d.config.inbound?.numberIds ?? []
    const first = PHONE_NUMBERS.find((p) => p.id === ids[0])
    parts.push(
      ids.length === 0 ? "No number yet"
      : ids.length === 1 ? first?.number ?? "1 number"
      : `${first?.number ?? "1 number"} +${ids.length - 1} more`,
    )
  }
  if (hasChannel(d, "web")) parts.push("Web widget")
  if (hasChannel(d, "batch")) {
    const n = activeCampaigns(d).length
    parts.push(n === 0 ? "No campaigns yet" : `${n} campaign${n > 1 ? "s" : ""}`)
  }
  if (hasChannel(d, "code")) parts.push("SDK / API")
  return parts.join(" · ") || "Not set"
}
