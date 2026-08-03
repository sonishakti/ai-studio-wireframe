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
import { DEFAULT_HOSTING, normalizeHosting, type HostingConfig } from "@/lib/hosting-regions"

/** Legacy single-channel type — still the vocabulary of the published
 *  `Agent.channel` mock and `publishDeployment`'s mode. */
export type AgentType = "inbound" | "outbound" | "code"

/** The agent's ONE deployment channel (owner 2026-07-29: NOT multi-select —
 *  Inbound OR Batch calls OR Code/SDK). Multi-select lives INSIDE Inbound as
 *  surfaces (phone · web widget · WhatsApp/Telegram soon). "web" survives in
 *  the union only so old stored drafts migrate — it is never produced. */
export type DeployChannel = "inbound" | "batch" | "web" | "code"

/** How an INBOUND agent is reached — multi-select (owner 2026-07-29:
 *  "inside inbound user can have multi, e.g. Telegram + WhatsApp etc"). */
export type InboundSurface = "phone" | "web"

/** Priority when a stored draft carries several (pre-single-channel data). */
export const CHANNEL_PRIORITY: DeployChannel[] = ["inbound", "batch", "code"]

export const hasChannel = (d: AgentDraft, c: DeployChannel) => d.channels.includes(c)

export function primaryChannel(d: AgentDraft): DeployChannel | null {
  return CHANNEL_PRIORITY.find((c) => d.channels.includes(c)) ?? null
}

/** The inbound surfaces in effect — defaults to phone once inbound is picked. */
export function inboundSurfaces(d: AgentDraft): InboundSurface[] {
  if (!hasChannel(d, "inbound")) return []
  return d.config.inbound?.surfaces ?? ["phone"]
}

/** Web widget enabled — an inbound surface (v6), plus legacy "web" drafts. */
export function hasWebWidget(d: AgentDraft): boolean {
  return inboundSurfaces(d).includes("web") || d.channels.includes("web")
}

/** ONE channel per agent: collapse any multi-channel list to a single primary
 *  ("prefer" wins when given — e.g. the channel a deep link asked for).
 *  Legacy "web" entries count as inbound; the caller moves them to surfaces. */
export function enforceDirection(channels: DeployChannel[], prefer?: DeployChannel): DeployChannel[] {
  const normalized = channels.map((c): DeployChannel => (c === "web" ? "inbound" : c))
  if (prefer && normalized.includes(prefer === "web" ? "inbound" : prefer)) {
    return [prefer === "web" ? "inbound" : prefer]
  }
  const primary = CHANNEL_PRIORITY.find((c) => normalized.includes(c))
  return primary ? [primary] : []
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
  /** Minutes between retry attempts — renders whenever retries > 0. */
  retryIntervalMin?: number
  launch?: LaunchConfig
  status: CampaignStatus
  /** RERUN semantics (owner 2026-07-28): a re-run keeps the SAME agent and the
   *  same run config — only the CSV (and launch timing) change, so aggregated
   *  analytics stay comparable across runs. Locked runs disable every other
   *  field in the editor. Distinct from Duplicate (a fully editable copy). */
  locked?: boolean
  /** The run this was re-run from — the lineage the analytics aggregate over. */
  rerunOf?: string
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
    retryIntervalMin: 30,
    launch: { mode: "now" },
    status: "draft",
  }
}

/** Campaigns that still count toward validation + the deploy manifest —
 *  everything not already completed. */
export const activeCampaigns = (d: AgentDraft) => d.campaigns.filter((c) => c.status !== "completed")

/** Deterministic stand-in for dial progress (wireframe — there is no backend).
 *  Derived from the run id so a row's progress never jitters between renders,
 *  and always disclosed as simulated where it renders. Same hash idiom as the
 *  simulation generator in test-section.tsx. */
export function campaignDialed(c: CampaignDraft): number {
  const total = c.contacts ?? (c.csvName ? MOCK_CSV_ROWS : 0)
  if (!total) return 0
  if (c.status === "completed") return total
  if (c.status !== "running") return 0
  let h = 0
  for (let i = 0; i < c.id.length; i++) h = (h * 31 + c.id.charCodeAt(i)) % 977
  // 15–85% through — never 0 (a "running" run that has dialed nobody would
  // read as broken) and never 100% (that's "completed").
  return Math.max(1, Math.round(total * (0.15 + (h % 70) / 100)))
}

/** Roll-up across an agent's runs — the "can I manage several from here?"
 *  answer. Shared by the Deployment summary block and the Go Live list so the
 *  two can never report different totals. */
export interface CampaignRollup {
  total: number
  running: number
  scheduled: number
  draft: number
  completed: number
  /** Contacts across runs that have NOT finished — what is still to dial. */
  queuedContacts: number
  /** Contacts already dialed across running + completed runs. */
  dialedContacts: number
  /** Runs missing a caller ID, a CSV, or a schedule. */
  needsAttention: number
}

export function campaignRollup(d: AgentDraft): CampaignRollup {
  const cs = d.campaigns
  const pending = cs.filter((c) => c.status !== "completed")
  return {
    total: cs.length,
    running: cs.filter((c) => c.status === "running").length,
    scheduled: cs.filter((c) => c.status === "scheduled").length,
    draft: cs.filter((c) => c.status === "draft").length,
    completed: cs.filter((c) => c.status === "completed").length,
    queuedContacts: pending.reduce(
      (n, c) => n + Math.max(0, (c.contacts ?? (c.csvName ? MOCK_CSV_ROWS : 0)) - campaignDialed(c)),
      0,
    ),
    dialedContacts: cs.reduce((n, c) => n + campaignDialed(c), 0),
    needsAttention: pending.filter(
      (c) =>
        !c.numberId ||
        !c.csvName ||
        (c.launch?.mode === "scheduled" && !(c.launch.startDate && c.launch.startTime && c.launch.timezone)),
    ).length,
  }
}

export interface AgentDraft {
  /** Set when editing an existing agent; absent for a brand-new draft. */
  agentId?: string
  name: string
  /** Section 1 (Voice) — the voice persona. */
  voice: VoiceRef | null
  /** Section 2 (Deployment) — MULTI-SELECT deployment channels. */
  channels: DeployChannel[]
  /** Section 2 (Deployment) — WHERE the agent process runs (Agora's
   *  `properties.geofence`). Absent = Automatic: the engine picks the nearest
   *  region and fails over. Applies to every channel, which is why it sits
   *  ABOVE the channel picker rather than inside one. */
  hosting?: HostingConfig
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
  /** Go Live — batch campaign runs, several per agent. */
  campaigns: CampaignDraft[]
  /** Fields the Custom-config JSON drawer has overridden (owner 2026-07-28):
   *  those fields render disabled + warning-flagged in the UI until unlocked —
   *  the JSON is their source of truth while listed here. */
  configOverrides?: string[]
  /** Per-channel connection state. */
  config: {
    /** Inbound links MULTIPLE numbers to one agent (2026-07-28) and can serve
     *  several surfaces at once (2026-07-29: phone · web widget · more soon). */
    inbound?: { numberIds: string[]; surfaces?: InboundSurface[] }
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

/** True when the agent's (often functional) name is SPOKEN in its greeting —
 *  "Hi, this is Payment Reminder…" — worth a caller-facing-name nudge
 *  (user-test 2026-07-28). Surfaced in Context and the Test opener line. */
export function greetingSpeaksName(d: Pick<AgentDraft, "name" | "greeting">): boolean {
  const name = d.name.trim()
  return name.length > 1 && d.greeting.toLowerCase().includes(name.toLowerCase())
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
    inbound?: { mode?: "phone" | "web"; numberId?: string; numberIds?: string[]; surfaces?: unknown[] }
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

  // Channels: ONE primary (v6). A stored "web" channel becomes the inbound
  // web SURFACE; a multi-channel list collapses by priority.
  const rawChannels: DeployChannel[] = Array.isArray(raw.channels)
    ? raw.channels.filter((c): c is DeployChannel => c === "inbound" || c === "batch" || c === "web" || c === "code")
    : legacyType === "inbound"
      ? legacyInbound?.mode === "web" ? ["web"] : ["inbound"]
      : legacyType === "outbound"
        ? ["batch"]
        : legacyType === "code"
          ? ["code"]
          : []
  const hadWeb = rawChannels.includes("web")
  // An EXPLICIT batch pick must not be outranked by a web-derived inbound
  // (the 07-28 multi-select build could store ["batch","web"]) — the user's
  // chosen direction wins; the web surface is kept under config.inbound for
  // whenever they switch back (review 2026-07-29).
  const channels = enforceDirection(
    rawChannels,
    rawChannels.includes("batch") && !rawChannels.includes("inbound") ? "batch" : undefined,
  )
  const rawSurfaces = Array.isArray(raw.config?.inbound?.surfaces)
    ? (raw.config!.inbound!.surfaces as unknown[]).filter((x): x is InboundSurface => x === "phone" || x === "web")
    : undefined
  const surfaces: InboundSurface[] | undefined = channels.includes("inbound")
    ? rawSurfaces ?? (hadWeb && !rawChannels.includes("inbound") ? ["web"] : hadWeb ? ["phone", "web"] : ["phone"])
    : hadWeb
      ? rawSurfaces ?? ["web"]
      : undefined

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
    ...(numberIds.length || channels.includes("inbound") || surfaces
      ? { inbound: { numberIds, ...(surfaces ? { surfaces } : {}) } }
      : {}),
    ...(raw.config?.code ? { code: raw.config.code } : {}),
  }

  const next = { ...EMPTY_DRAFT, ...raw, channels, campaigns, config } as AgentDraft & LegacyDraftFields
  delete next.type
  // An exclusion is only legal under GLOBAL — a stored draft that predates that
  // rule (or was hand-edited in the JSON drawer) must not ship an invalid pair.
  if (next.hosting) next.hosting = normalizeHosting(next.hosting)
  return next
}

/** The hosting config in effect — absent means Automatic, never "unset". */
export const draftHosting = (d: AgentDraft): HostingConfig => d.hosting ?? DEFAULT_HOSTING

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
      ? ["inbound"]
      : ch?.type === "outbound"
        ? ["batch"]
        : ch?.type === "code"
          ? ["code"]
          : []
  const agentSurfaces: InboundSurface[] | undefined =
    ch?.type === "inbound" ? (ch.mode === "web" ? ["web"] : ["phone"]) : undefined

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
      ...(ch?.type === "inbound"
        ? { inbound: { numberIds: ch.numberId && ch.mode !== "web" ? [ch.numberId] : [], surfaces: agentSurfaces } }
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
  /** The section (1 Voice · 2 Channel · 3 Context · 4 Test · 5 Go Live) that fixes it. */
  step: number
  /** Verb+noun for the "Fix this" button (e.g. "Pick a voice"). */
  action: string
}

/** Every unmet requirement between the draft and a live agent, in JOURNEY
 *  order (Voice → Channel → Context → Go Live). Drives the Go-live "Fix this
 *  →" ramp; `publishBlockReason` returns just the first. */
export function publishBlocks(d: AgentDraft): PublishBlock[] {
  const blocks: PublishBlock[] = []

  if (!d.voice) {
    blocks.push({
      // Code-path builders skip the voice story, so say WHY it still gates
      // (user-test 2026-07-29): the voice is half of the served pipeline.
      reason: hasChannel(d, "code")
        ? "Choose a voice — it's the TTS half of the agent's pipeline."
        : "Choose a voice.",
      step: 1,
      action: "Pick a voice",
    })
  }

  if (d.channels.length === 0) {
    blocks.push({ reason: "Choose a deployment.", step: 2, action: "Choose deployment" })
  }
  if (hasChannel(d, "inbound")) {
    const surfaces = inboundSurfaces(d)
    if (surfaces.length === 0) {
      blocks.push({ reason: "Choose how callers reach your agent.", step: 2, action: "Pick a surface" })
    }
    if (surfaces.includes("phone") && !(d.config.inbound?.numberIds.length)) {
      blocks.push({ reason: "Link a phone number for inbound calls.", step: 2, action: "Link a number" })
    }
  }

  if (!d.systemPrompt.trim()) blocks.push({ reason: "Add a system prompt.", step: 3, action: "Write the prompt" })

  if (hasChannel(d, "batch")) {
    const active = activeCampaigns(d)
    // Zero runs blocks only when batch is the SOLE channel — an agent that
    // also serves another channel can go live "armed but idle" on batch.
    if (active.length === 0 && d.channels.length === 1) {
      blocks.push({ reason: "Create a campaign run to start batch calling.", step: 5, action: "New run" })
    }
    for (const c of active) {
      if (!c.numberId) blocks.push({ reason: `"${c.name}" needs a caller-ID number.`, step: 5, action: "Pick a number" })
      if (!c.csvName) blocks.push({ reason: `"${c.name}" is missing its contacts CSV.`, step: 5, action: "Add contacts" })
      if (c.launch?.mode === "scheduled" && !(c.launch.startDate && c.launch.startTime && c.launch.timezone)) {
        blocks.push({ reason: `"${c.name}" is scheduled but has no start date, time, and timezone.`, step: 5, action: "Set schedule" })
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

/** The first section (1–5) still needing input — for "resume at" affordances.
 *  Test (4) runs on defaults, so past the prompt the resume point is Go Live. */
export function firstIncompleteStep(d: AgentDraft): number {
  if (!d.voice) return 1
  if (d.channels.length === 0) return 2
  if (!d.systemPrompt.trim()) return 3
  return 5
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
    const surfaces = inboundSurfaces(d)
    if (surfaces.includes("phone")) {
      const ids = d.config.inbound?.numberIds ?? []
      const first = PHONE_NUMBERS.find((p) => p.id === ids[0])
      parts.push(
        ids.length === 0 ? "No number yet"
        : ids.length === 1 ? first?.number ?? "1 number"
        : `${first?.number ?? "1 number"} +${ids.length - 1} more`,
      )
    }
    if (surfaces.includes("web")) parts.push("Web widget")
    if (surfaces.length === 0) parts.push("No surface yet")
  }
  if (hasChannel(d, "batch")) {
    const n = activeCampaigns(d).length
    parts.push(n === 0 ? "No runs yet" : `${n} run${n > 1 ? "s" : ""}`)
  }
  if (hasChannel(d, "code")) parts.push("SDK / API")
  return parts.join(" · ") || "Not set"
}
