/**
 * Studio_X — Deployment + Agent data
 * ──────────────────────────────────
 *
 * 2026-06-11 IA revamp (see references/ia-revamp-agent-vs-deployment.md):
 *
 *   • Agent = reusable Stack + Persona. No prompt, no variables.
 *   • Deployment = one agent on ONE channel. Owns the whole prompt, custom
 *     code, and dynamic variables. Two kinds:
 *       - "inbound"  — answers on a number/widget/sender (1 agent ↔ 1 channel)
 *       - "batch"    — outbound Batch Calls dialing a contact CSV
 *   • Dynamic variables are auto-detected from the uploaded CSV's columns and
 *     substituted per row at dial time. No build-time declaration.
 *
 * File keeps its historical name to avoid import churn; "campaign" survives
 * only as the legacy word for what is now a Batch Calls deployment.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChannelKind = "telephony" | "whatsapp" | "sms" | "web"

/** One deployment runs on exactly ONE channel. */
export type Channel =
  | { kind: "telephony"; numbers: string[] }
  | { kind: "whatsapp"; sender: string }
  | { kind: "sms"; number: string }
  | { kind: "web"; domains: string[] }

export type DeploymentKind = "inbound" | "batch"
export type DeploymentStatus =
  | "active"
  | "paused"
  | "in_progress"
  | "scheduled"
  | "completed"
  | "draft"

/** Uploaded contact list — its column headers ARE the available {{vars}}. */
export interface ContactsFile {
  fileName: string
  rowCount: number
  columns: string[]
}

export interface Deployment {
  id: string
  name: string
  kind: DeploymentKind
  channel: Channel
  /** The reusable Stack+Persona agent backing this deployment. */
  agentId: string
  agentName: string
  status: DeploymentStatus

  // ── Authored per deployment (the environment-specific layer) ──
  /** The WHOLE system prompt lives here, not on the agent. */
  prompt: string
  /** First message — may reference {{vars}} (batch only resolves them). */
  greeting: string
  /** Fallback line on tool error / lost user. */
  failure: string
  /** Optional per-deployment hooks. */
  customCode?: string

  // ── Batch (outbound) only ──
  contacts?: ContactsFile
  progress?: { completed: number; total: number }
  startDate?: string

  // ── Inbound only ──
  ringsPerWeek?: number

  metrics: {
    calls: number
    successRate: number
    avgHandleTimeSec: number
  }
}

export interface PhoneNumber {
  id: string
  number: string
  label: string
  vendor: string
  /** Deployment IDs currently using this number. Empty array = available. */
  assignedTo: string[]
  /** Set when the number is routed directly to an agent (inbound), not via a deployment. */
  assignedAgent?: { id: string; name: string }
  status: "active" | "unassigned"
}

// ─── Agent = Stack + Persona (reusable, duplicable) ──────────────────────────

export type StackPreset = "fastest" | "balanced" | "cheapest"

export interface AgentStack {
  preset: StackPreset
  modality: "voice" | "voice+video" | "chat"
  /** Pipeline shape: the classic STT→LLM→TTS cascade (default) or a single
   *  multimodal realtime model that handles speech in and out. */
  pipeline?: "stt-llm-tts" | "mllm"
  /** Spoken language the STT listens for (BCP-47-ish label, wireframe). */
  language?: string
  llm: { vendor: string; model: string }
  asr: { vendor: string; model: string }
  tts: { vendor: string; voice: string }
}

export interface AgentPersona {
  personality: string
  tone: string
  language: string
  brand?: string
  /** Opening line the agent speaks first. Set when an agent is imported from a
   *  competitor config (first_message) so the in-browser test plays the user's
   *  OWN greeting — makes the "we map your prompt" promise audibly true. */
  firstMessage?: string
}

/** Parsed shape of a competitor agent config (Vapi/Retell/ElevenLabs/Bland/JSON)
 *  that the Import sheet hands to the home so the imported agent actually drives
 *  the test — voice, model, prompt, and first message all carry over. */
export interface ImportedAgentConfig {
  name: string
  systemPrompt?: string
  firstMessage?: string
  voice?: string
  llmModel?: string
  language?: string
  tools?: string[]
  source?: string
}

/** How a deployed agent takes traffic — mirrors the wizard's type + Step-4
 *  config so edit mode can hydrate the TRUE channel instead of fabricating
 *  one (heuristic-eval 2026-07-06 finding #2). */
export interface AgentChannel {
  type: "inbound" | "outbound" | "code"
  /** Inbound only: phone line or embedded web widget. */
  mode?: "phone" | "web"
  /** PHONE_NUMBERS id the agent answers (inbound) or dials from (outbound). */
  numberId?: string
  /** Outbound only: the attached contacts CSV. */
  csvName?: string
}

export interface Agent {
  id: string
  name: string
  status: "live" | "draft" | "paused"
  /** The channel this agent is (or was last) deployed on. Absent = never
   *  configured — the wizard leaves Step 2 honestly incomplete. */
  channel?: AgentChannel
  persona: AgentPersona
  stack: AgentStack
  /** Attached knowledge bases (Integrations › Knowledge). */
  knowledge: string[]
  /** Attached MCP/tool server ids (Integrations › MCP). */
  actions: string[]
  /** Attached third-party Connector ids (Integrations › Connectors). */
  connectors?: string[]
  /** One-line role descriptor shown on the Go Live home. */
  role?: string
  /** Auto-provisioned default agent — exists & live for every new account so the
   *  user can talk to a working agent before building anything (2026-06-17). */
  isDefault?: boolean
  /** Current published config version. Diagnostics flags "config drift" when a
   *  call ran an older version than this (defaults to CURRENT_CONFIG_VERSION). */
  version?: number
}

/** The config version the console currently publishes. A call that ran an older
 *  version surfaces a "config drift" diagnosis (Observe › Diagnostics). */
export const CURRENT_CONFIG_VERSION = 45

/** Speed-vs-cost first: each preset writes sensible vendor defaults; every
 *  field stays individually overridable in the Stack tab. */
export const STACK_PRESETS: Record<
  StackPreset,
  { label: string; hint: string; llm: AgentStack["llm"]; asr: AgentStack["asr"]; tts: AgentStack["tts"] }
> = {
  fastest: {
    label: "Fastest",
    hint: "Lowest latency, premium vendors",
    llm: { vendor: "OpenAI", model: "gpt-4o" },
    asr: { vendor: "Deepgram", model: "nova-3" },
    tts: { vendor: "ElevenLabs", voice: "rachel" },
  },
  balanced: {
    label: "Balanced",
    hint: "Good latency at moderate cost",
    llm: { vendor: "OpenAI", model: "gpt-4o-mini" },
    asr: { vendor: "Deepgram", model: "nova-2" },
    tts: { vendor: "ElevenLabs", voice: "turbo" },
  },
  cheapest: {
    label: "Cheapest",
    hint: "Lowest per-minute cost",
    llm: { vendor: "Anthropic", model: "claude-haiku" },
    asr: { vendor: "Whisper", model: "large-v3" },
    tts: { vendor: "Azure", voice: "en-US-Jenny" },
  },
}

export function stackFor(preset: StackPreset, modality: AgentStack["modality"] = "voice"): AgentStack {
  const p = STACK_PRESETS[preset]
  return { preset, modality, llm: p.llm, asr: p.asr, tts: p.tts }
}

/** The provider/model options the stack configurator offers — colocated with
 *  STACK_PRESETS so presets can never write a value the dropdowns don't list.
 *  Agora Conversational AI Engine lets you bring your own STT/LLM/TTS vendors
 *  (or one multimodal realtime model): see
 *  https://docs.agora.io/en/conversational-ai/overview/product-overview
 *  Wireframe catalog; voices must cover every PRESET_VOICES ttsVoice. */
export const STACK_CATALOG = {
  stt: [
    { vendor: "Deepgram", model: "nova-3", label: "Deepgram Nova-3" },
    { vendor: "Deepgram", model: "nova-2", label: "Deepgram Nova-2" },
    { vendor: "Whisper", model: "large-v3", label: "OpenAI Whisper large-v3" },
  ],
  llm: [
    { vendor: "OpenAI", model: "gpt-4o", label: "OpenAI GPT-4o" },
    { vendor: "OpenAI", model: "gpt-4o-mini", label: "OpenAI GPT-4o mini" },
    { vendor: "Anthropic", model: "claude-haiku", label: "Anthropic Claude Haiku" },
  ],
  mllm: [
    { vendor: "OpenAI", model: "gpt-4o-realtime", label: "OpenAI GPT-4o Realtime" },
    { vendor: "Google", model: "gemini-2.0-flash-live", label: "Gemini 2.0 Flash Live" },
  ],
  tts: [
    { vendor: "ElevenLabs", label: "ElevenLabs", voices: ["rachel", "turbo", "blake", "adam", "bella", "josh"] },
    { vendor: "Azure", label: "Azure Neural", voices: ["en-US-Jenny", "en-US-Guy"] },
  ],
  languages: ["English", "Spanish", "French", "German", "Hindi", "Mandarin"],
} as const

export const AGENTS: Agent[] = [
  // Auto-provisioned on signup — live from minute one. The user talks to THIS
  // agent before building anything (the moment of belief), then puts it to work
  // on a channel. Reskinnable in one tap; fully editable later. (2026-06-17)
  {
    id: "agt_default",
    name: "Aria",
    role: "General assistant",
    status: "live",
    isDefault: true,
    // Live on the provisioned number from minute one — the list view's
    // Channel column and the builder checklist read this same record.
    channel: { type: "inbound", mode: "phone", numberId: "pn_02" },
    persona: {
      personality: "Helpful, friendly, and clear. Answers questions and gets things done.",
      tone: "Friendly",
      language: "en-US",
    },
    stack: stackFor("balanced"),
    knowledge: [],
    actions: [],
  },
  {
    id: "agt_support_v2",
    name: "Support Bot v2",
    status: "live",
    channel: { type: "inbound", mode: "phone", numberId: "pn_01" },
    persona: { personality: "Warm, patient, solution-first", tone: "Friendly", language: "en-US", brand: "Acme" },
    stack: stackFor("fastest"),
    knowledge: ["kb_01", "kb_02"],
    actions: ["mcp_01"],
  },
  {
    id: "agt_sales_qualifier",
    name: "Sales Qualifier",
    status: "draft",
    persona: { personality: "Curious, concise, never pushy", tone: "Professional", language: "en-US", brand: "Acme" },
    stack: stackFor("balanced"),
    knowledge: ["kb_02"],
    actions: ["mcp_01", "mcp_02"],
  },
  {
    id: "agt_appointment_setter",
    name: "Appointment Setter",
    status: "live",
    channel: { type: "inbound", mode: "web" },
    persona: { personality: "Efficient, courteous, time-aware", tone: "Friendly", language: "en-US" },
    stack: stackFor("balanced"),
    knowledge: [],
    actions: ["mcp_02"],
  },
  {
    id: "agt_collections",
    name: "Collections Outreach",
    status: "paused",
    channel: { type: "outbound", numberId: "pn_05", csvName: "q2-collections.csv" },
    persona: { personality: "Calm, firm, compliant", tone: "Professional", language: "en-US" },
    stack: stackFor("cheapest"),
    knowledge: ["kb_03"],
    actions: [],
  },
  {
    id: "agt_survey",
    name: "Survey Bot",
    status: "live",
    channel: { type: "inbound", mode: "web" },
    persona: { personality: "Brief, neutral, appreciative", tone: "Neutral", language: "en-US" },
    stack: stackFor("cheapest"),
    knowledge: [],
    actions: [],
  },
]

/** Starter templates — shared by the list view's Browse sheet, the builder's
 *  "Start from a template" entry, and the wizard's ?template= seeding. */
export const AGENT_TEMPLATES = [
  // Blank goes first — most users won't use a template, they'll start from
  // scratch. Templates are sales-led; blank is product-led.
  { id: "blank",                name: "Blank agent",           description: "Start from scratch. Define your own prompt, voice, and tools.", llm: "OpenAI",   asr: "Deepgram", tts: "ElevenLabs" },
  { id: "appointment-reminder", name: "Appointment Reminder", description: "Automatically call customers to remind them of upcoming appointments", llm: "OpenAI", asr: "Deepgram", tts: "ElevenLabs" },
  { id: "nps-survey",           name: "NPS Survey",            description: "Gather customer feedback through voice surveys",                       llm: "OpenAI",   asr: "Deepgram", tts: "ElevenLabs" },
  { id: "ivr",                  name: "Interactive Voice Response (IVR)", description: "Route callers to the right department automatically",       llm: "Anthropic", asr: "Deepgram", tts: "ElevenLabs" },
  { id: "payment-reminder",     name: "Payment Reminder",      description: "Follow up with customers about pending payments",                      llm: "OpenAI",   asr: "Deepgram", tts: "ElevenLabs" },
  { id: "ecommerce",            name: "Customer service for e-commerce", description: "Triage support and refund requests for online retail",        llm: "OpenAI",   asr: "Deepgram", tts: "ElevenLabs" },
] as const

export function getAgent(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id)
}

/** The auto-provisioned default agent (Aria) — live for every new account. */
export function getDefaultAgent(): Agent {
  return AGENTS.find((a) => a.isDefault) ?? AGENTS[0]
}

/** Compact mono summary of a stack — "llm · stt · voice", or "llm · realtime"
 *  for the single-model MLLM pipeline. One format for the identity card, the
 *  step-row subtitle, and the agents list, so they never drift.
 *  `full` prepends the preset and appends the spoken language so those two
 *  settings have a visible home outside the drawer (heuristic-eval #16). */
export function stackLine(s: AgentStack, opts?: { full?: boolean }): string {
  const core = s.pipeline === "mllm"
    ? `${s.llm.model} · realtime`
    : `${s.llm.model} · ${s.asr.model} · ${s.tts.voice}`
  if (!opts?.full) return core
  const preset = s.pipeline === "mllm" ? undefined : STACK_PRESETS[s.preset].label
  return [preset, core, s.language ?? "English"].filter(Boolean).join(" · ")
}

/** Compact "vendor · vendor · vendor" summary of an agent's stack. */
export function stackSummary(a: Agent): string {
  return stackLine(a.stack)
}

/** Rough speed + per-minute cost for a stack preset — surfaced on the Go Live
 *  home so users see the latency/cost tradeoff before they test or deploy.
 *  Wireframe estimates (Agora bills per minute; vendor pass-through varies). */
export const STACK_ESTIMATE: Record<StackPreset, { latencyMs: number; costPerMin: number }> = {
  fastest: { latencyMs: 600, costPerMin: 0.14 },
  balanced: { latencyMs: 800, costPerMin: 0.1 },
  cheapest: { latencyMs: 1100, costPerMin: 0.06 },
}

/** Estimate for any stack — preset-based for the cascade, MLLM_ESTIMATE for the
 *  single-model pipeline. Per-slot overrides keep the preset's numbers (the
 *  wireframe has no per-model tables); callers should present them as "~". */
export function stackEstimateFor(s: AgentStack): { latencyMs: number; costPerMin: number } {
  return s.pipeline === "mllm" ? MLLM_ESTIMATE : STACK_ESTIMATE[s.preset]
}

export function stackEstimate(a: Agent): { latencyMs: number; costPerMin: number } {
  return stackEstimateFor(a.stack)
}

/** Estimate for the MLLM (single realtime multimodal model) pipeline — no
 *  per-provider breakdown; one hop replaces the cascade. Wireframe estimate. */
export const MLLM_ESTIMATE: { latencyMs: number; costPerMin: number } = {
  latencyMs: 550,
  costPerMin: 0.15,
}

/** Per-provider latency contribution (ms) + the best-case (warm-path) floor for
 *  each stack preset. ASR + LLM(TTFT) + TTS roll up (with turn-taking / network
 *  overhead) to the end-to-end `STACK_ESTIMATE.latencyMs`; `bestCaseMs` is the
 *  optimistic end-to-end when every hop is warm. Wireframe estimates. */
export const STACK_LATENCY: Record<
  StackPreset,
  { asrMs: number; llmMs: number; ttsMs: number; bestCaseMs: number }
> = {
  fastest: { asrMs: 90, llmMs: 260, ttsMs: 140, bestCaseMs: 470 },
  balanced: { asrMs: 130, llmMs: 360, ttsMs: 190, bestCaseMs: 620 },
  cheapest: { asrMs: 190, llmMs: 540, ttsMs: 250, bestCaseMs: 870 },
}

export interface StackLatencyBreakdown {
  /** Speech-to-text finalization. */
  asrMs: number
  /** LLM time-to-first-token. */
  llmMs: number
  /** Text-to-speech first audio chunk. */
  ttsMs: number
  /** Typical end-to-end (from STACK_ESTIMATE). */
  latencyMs: number
  /** Optimistic end-to-end when every hop is warm. */
  bestCaseMs: number
}

/** Per-provider latency breakdown for a stack preset — STT/LLM/TTS + the
 *  end-to-end total and a best-case floor. The one roll-up rule; both the
 *  agent-shaped helper below and the wizard card call this. */
export function presetLatencyBreakdown(preset: StackPreset): StackLatencyBreakdown {
  return { ...STACK_LATENCY[preset], latencyMs: STACK_ESTIMATE[preset].latencyMs }
}

/** Per-provider latency breakdown for an agent's stack. Powers the card's
 *  latency popover. */
export function stackLatencyBreakdown(a: Agent): StackLatencyBreakdown {
  return presetLatencyBreakdown(a.stack.preset)
}

/** Sandbox DID for the in-product "call in to test" flow — a free test line
 *  routed straight to the agent during evaluation (no real number consumed).
 *  Wireframe value. */
export const TEST_INBOUND_NUMBER = "+1 (415) 555-0100"

// ─── Plan usage (free-tier meter) ────────────────────────────────────────────
//
// Agora bills per minute; the free tier is 300 min/month (LEARNINGS §8). The Go
// Live home surfaces this from minute one: billing health is a retention lever
// (H5 bill-shock), and the free tier is exactly what a first campaign burns
// through to reach PAID usage — the revenue gate the activation funnel now ends on.

export interface PlanUsage {
  plan: string
  /** Total free minutes once a card is on file (ungated + the unlocked slice). */
  freeMinutesIncluded: number
  freeMinutesUsed: number
  /** First slice of free minutes usable with NO card. At this mark we nudge for a
   *  card, which unlocks the remaining free minutes — so a card is on file BEFORE
   *  the tier runs out and usage rolls into pay-as-you-go instead of a suspension.
   *  Agora bills per minute, so the card sits on usage, not on a phone number
   *  (Agora doesn't sell or port numbers — telephony is bring-your-own via SIP). */
  freeMinutesUngated: number
  /** True once a card is on file — unlocks the gated free minutes and lets usage
   *  roll into PAYG past the free tier (kills the suspend→reactivate CAC loop). */
  cardOnFile: boolean
  /** Default spend cap (USD/mo) offered with the card, so PAYG can't bill-shock. */
  defaultSpendCapUsd: number
  /** Active monthly spend cap (USD). null until a card is on file — the cap is
   *  set (defaulting to defaultSpendCapUsd) at card capture. At the cap NEW calls
   *  pause; in-flight calls always finish (the invoice honors the cap). */
  spendCapUsd: number | null
  /** Alert threshold as a fraction of the cap (0.75 → warn at 75%). The alert
   *  must fire BEFORE the wall — cap_hit without a prior alert is the counter-
   *  metric this exists to prevent. */
  spendAlertPct: number
  /** PAYG spend accrued this period (USD), beyond the free tier, at $0.10/min. */
  paygSpendUsd: number
  /** Mock billing-period position — drives the run-rate projection and period
   *  labels deterministically (no clock reads in the lib). */
  periodLabel: string
  periodDaysElapsed: number
  periodDaysTotal: number
}

export const PLAN_USAGE: PlanUsage = {
  plan: "Free",
  freeMinutesIncluded: 300,
  freeMinutesUsed: 150,
  freeMinutesUngated: 150,
  cardOnFile: false,
  defaultSpendCapUsd: 50,
  spendCapUsd: null,
  spendAlertPct: 0.75,
  paygSpendUsd: 0,
  periodLabel: "Jul 1 – Jul 31, 2026",
  periodDaysElapsed: 9,
  periodDaysTotal: 31,
}

/** PAYG usage rate ($/min, managed mode bundles ASR+LLM+TTS — docs pricing).
 *  THE one rate constant: every $-per-minute figure derives from it. */
export const PAYG_RATE = 0.1

// ─── Concurrent lines (A6) ───────────────────────────────────────────────────
//
// Lines govern how many calls run AT ONCE; the spend cap governs per-minute
// usage $. They are deliberately separate: line fees are a subscription
// ($/line/mo, prorated on add, credited on reduce), NEVER counted against the
// usage cap — and the UI must say so (judge round 2026-07-09, fix #1).
// At the wall, batch calls QUEUE (D1 semantics) — nothing drops or fails.

export interface ConcurrencyState {
  /** Free lines every project starts with (wireframe value — no public
   *  ceiling is documented; docs sweep F8). */
  included: number
  /** Self-serve purchased add-on lines — never merged with included. */
  purchased: number
  /** Lines carrying live calls right now (mock gauge). */
  inUse: number
  /** Calls waiting for a free line (batch queue depth, mock). */
  queued: number
  /** $/line/month — wireframe placeholder (competitive w/ Retell's $8). */
  pricePerLineMo: number
}

export const CONCURRENCY: ConcurrencyState = {
  included: 10,
  purchased: 0,
  inUse: 2,
  queued: 0,
  pricePerLineMo: 8,
}

export function concurrencyStats(c: ConcurrencyState = CONCURRENCY) {
  const totalLines = c.included + c.purchased
  return {
    ...c,
    totalLines,
    atWall: c.inUse >= totalLines,
    pctInUse: totalLines > 0 ? Math.min(100, Math.round((c.inUse / totalLines) * 100)) : 0,
    monthlyLineFeeUsd: c.purchased * c.pricePerLineMo,
  }
}

/** Free-minutes summary from the single source of truth (PLAN_USAGE). Pure — lives
 *  in the lib (not a "use client" component) so server pages can call it too.
 *  Accepts an override so state fixtures (design harnesses) can render any
 *  point in the money lifecycle without mutating the global. */
export function freeMinutesStats(u: PlanUsage = PLAN_USAGE) {
  const { plan, freeMinutesIncluded: included, freeMinutesUsed: used } = u
  const pctUsed = included > 0 ? Math.min(100, Math.round((used / included) * 100)) : 0
  const remaining = Math.max(0, included - used)
  return { plan, included, used, pctUsed, remaining }
}

/** Where the account sits in the money lifecycle once PAYG is possible. */
export type SpendState = "free" | "payg" | "cap_warning" | "cap_hit"

/** Spend summary — the $ counterpart of freeMinutesStats(), same source of
 *  truth. The meter changes UNIT at the free→PAYG boundary: minutes while the
 *  free tier lasts, dollars-of-cap once paid metering starts. Projection is a
 *  straight-line run rate (spend ÷ days elapsed × days in period), always
 *  presented as an estimate. */
export function spendStats(u: PlanUsage = PLAN_USAGE) {
  const freeMinutesLeft = Math.max(0, u.freeMinutesIncluded - u.freeMinutesUsed)
  const cap = u.spendCapUsd
  const spent = u.paygSpendUsd
  const pctOfCap = cap && cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0
  const projectedUsd =
    u.periodDaysElapsed > 0
      ? Math.round((spent / u.periodDaysElapsed) * u.periodDaysTotal * 100) / 100
      : 0
  let state: SpendState = "free"
  if (freeMinutesLeft <= 0 && u.cardOnFile) {
    state = "payg"
    if (cap != null && cap > 0) {
      if (spent >= cap) state = "cap_hit"
      else if (spent >= cap * u.spendAlertPct) state = "cap_warning"
    }
  }
  return {
    capUsd: cap,
    alertPct: u.spendAlertPct,
    spentUsd: spent,
    pctOfCap,
    projectedUsd,
    freeMinutesLeft,
    periodLabel: u.periodLabel,
    state,
  }
}

// ─── Status display ──────────────────────────────────────────────────────────

export const STATUS_BADGE: Record<
  DeploymentStatus,
  { variant: "default" | "secondary" | "outline"; label: string }
> = {
  active: { variant: "default", label: "Active" },
  paused: { variant: "outline", label: "Paused" },
  in_progress: { variant: "default", label: "In progress" },
  scheduled: { variant: "secondary", label: "Scheduled" },
  completed: { variant: "outline", label: "Completed" },
  draft: { variant: "secondary", label: "Draft" },
}

// ─── Mock deployments ────────────────────────────────────────────────────────
//
// One channel per deployment (2026-06-11). The old omnichannel demo rows
// (Acme Help Center tel+web+wa, Black Friday tel+sms+wa) are split into
// peer single-channel deployments backed by the same reusable agent.

const SUPPORT_PROMPT = `# ROLE
You are a tier-1 support agent for Acme. Resolve common issues, look up
order status, and escalate to a human when confidence is low.

# CONSTRAINTS
Keep spoken responses under 40 words. Never promise refunds. Never mention
you are AI unless asked directly.`

export const DEPLOYMENTS: Deployment[] = [
  // ── Inbound ────────────────────────────────────────────────────────────────
  {
    id: "dp_ib_01",
    name: "Support Hotline",
    kind: "inbound",
    channel: { kind: "telephony", numbers: ["+1 (415) 555-0101"] },
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "active",
    prompt: SUPPORT_PROMPT,
    greeting: "Thanks for calling Acme support. How can I help today?",
    failure: "Let me put you through to a teammate.",
    metrics: { calls: 1240, successRate: 78, avgHandleTimeSec: 204 },
    ringsPerWeek: 1240,
  },
  {
    id: "dp_ib_02",
    name: "Sales Front Desk",
    kind: "inbound",
    channel: { kind: "telephony", numbers: ["+1 (628) 555-0188"] },
    agentId: "agt_sales_qualifier",
    agentName: "Sales Qualifier",
    status: "active",
    prompt: `# ROLE
You answer Acme's sales line. Qualify the caller (team size, use case,
timeline) and book a demo with an account executive.

# CONSTRAINTS
Two qualifying questions max before offering the demo. Keep it under 30 words per turn.`,
    greeting: "Hi, you've reached Acme sales. What brings you in today?",
    failure: "One moment, connecting you to the sales team.",
    metrics: { calls: 340, successRate: 62, avgHandleTimeSec: 112 },
    ringsPerWeek: 340,
  },
  {
    id: "dp_ib_03",
    name: "UK Support",
    kind: "inbound",
    channel: { kind: "telephony", numbers: ["+44 20 7946 0958"] },
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "paused",
    prompt: SUPPORT_PROMPT + `\n\n# LOCALE\nUK English. Quote prices in GBP. Office hours are 9:00–17:30 GMT.`,
    greeting: "Thanks for ringing Acme support. How can I help?",
    failure: "Bear with me, I'll transfer you to a colleague.",
    metrics: { calls: 0, successRate: 0, avgHandleTimeSec: 0 },
    ringsPerWeek: 0,
  },
  {
    id: "dp_ib_04",
    name: "Acme Help Line",
    kind: "inbound",
    channel: { kind: "telephony", numbers: ["+1 (800) 555-0199"] },
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "active",
    prompt: SUPPORT_PROMPT,
    greeting: "Thanks for calling the Acme help line. What can I do for you?",
    failure: "Let me get a teammate to pick this up.",
    metrics: { calls: 1860, successRate: 82, avgHandleTimeSec: 236 },
    ringsPerWeek: 1320,
  },
  {
    id: "dp_ib_05",
    name: "Acme Web Chat",
    kind: "inbound",
    channel: { kind: "web", domains: ["acme.com", "help.acme.com"] },
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "active",
    prompt: SUPPORT_PROMPT + `\n\n# CHANNEL\nText chat. Short paragraphs, link to help articles where useful.`,
    greeting: "Hi! I'm Acme's assistant. Ask me anything.",
    failure: "I'll hand this over to a human agent.",
    metrics: { calls: 760, successRate: 79, avgHandleTimeSec: 188 },
    ringsPerWeek: 520,
  },
  {
    id: "dp_ib_06",
    name: "Acme WhatsApp",
    kind: "inbound",
    channel: { kind: "whatsapp", sender: "+1 (628) 555-0220" },
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "active",
    prompt: SUPPORT_PROMPT + `\n\n# CHANNEL\nWhatsApp. Casual register, emojis sparingly, one question at a time.`,
    greeting: "Hey! Acme support here 👋 What can I help with?",
    failure: "Passing you to a teammate, one sec.",
    metrics: { calls: 220, successRate: 74, avgHandleTimeSec: 154 },
    ringsPerWeek: 140,
  },

  // ── Batch Calls (outbound CSV dialing) ─────────────────────────────────────
  {
    id: "dp_ob_01",
    name: "Q2 Win-Back",
    kind: "batch",
    channel: { kind: "telephony", numbers: ["+1 (415) 555-0240"] },
    agentId: "agt_sales_qualifier",
    agentName: "Sales Qualifier",
    status: "in_progress",
    prompt: `# ROLE
You are calling lapsed Acme customers to win them back with the Q2 offer.

# CONTEXT (per row)
Customer: {{name}} at {{company}} — last active {{last_active}}, on the {{previous_plan}} plan.

# CONSTRAINTS
Lead with the 20% win-back discount. If not interested, thank and end within 15 seconds.`,
    greeting: "Hi {{name}}, this is Acme. We miss you at {{company}} and have something for you.",
    failure: "Sorry, let me have someone follow up by email.",
    contacts: {
      fileName: "q2-lapsed-customers.csv",
      rowCount: 5000,
      columns: ["phone", "name", "company", "last_active", "previous_plan"],
    },
    metrics: { calls: 3421, successRate: 24, avgHandleTimeSec: 162 },
    progress: { completed: 3421, total: 5000 },
    startDate: "May 20, 2026",
  },
  {
    id: "dp_ob_02",
    name: "Product Launch",
    kind: "batch",
    channel: { kind: "telephony", numbers: ["+1 (415) 555-0240"] },
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "scheduled",
    prompt: `# ROLE
Announce the Acme 3.0 launch to existing customers and book upgrade walkthroughs.

# CONTEXT (per row)
Customer: {{name}}, current plan {{plan}}, account owner {{owner_email}}.`,
    greeting: "Hi {{name}}! Acme 3.0 just launched and your {{plan}} plan gets the new features first.",
    failure: "I'll send the details to your inbox instead.",
    contacts: {
      fileName: "launch-customers.csv",
      rowCount: 12000,
      columns: ["phone", "name", "plan", "owner_email"],
    },
    metrics: { calls: 0, successRate: 0, avgHandleTimeSec: 0 },
    progress: { completed: 0, total: 12000 },
    startDate: "Jun 1, 2026",
  },
  {
    id: "dp_ob_03",
    name: "Renewal Reminder",
    kind: "batch",
    channel: { kind: "telephony", numbers: ["+1 (415) 555-0240"] },
    agentId: "agt_appointment_setter",
    agentName: "Appointment Setter",
    status: "completed",
    prompt: `# ROLE
Remind customers their Acme subscription renews soon and confirm payment details are current.

# CONTEXT (per row)
{{name}} renews on {{renewal_date}} for {{amount}}.`,
    greeting: "Hi {{name}}, a quick reminder your Acme plan renews on {{renewal_date}}.",
    failure: "No problem, we'll email the renewal details.",
    contacts: {
      fileName: "renewals-may.csv",
      rowCount: 2800,
      columns: ["phone", "name", "renewal_date", "amount"],
    },
    metrics: { calls: 2800, successRate: 31, avgHandleTimeSec: 145 },
    progress: { completed: 2800, total: 2800 },
    startDate: "May 10, 2026",
  },
  {
    id: "dp_ob_04",
    name: "Collections May",
    kind: "batch",
    channel: { kind: "telephony", numbers: ["+1 (415) 555-0240"] },
    agentId: "agt_collections",
    agentName: "Collections Outreach",
    status: "paused",
    prompt: `# ROLE
Politely collect overdue invoices. Offer a payment link or a payment plan.

# CONTEXT (per row)
{{name}} — invoice {{invoice_id}}, {{days_overdue}} days overdue, balance {{balance}}.

# COMPLIANCE
Identify the company immediately. Never threaten. Offer the hardship line if asked.`,
    greeting: "Hello {{name}}, this is Acme billing about invoice {{invoice_id}}.",
    failure: "I'll have our billing team reach out directly.",
    contacts: {
      fileName: "overdue-may.csv",
      rowCount: 1500,
      columns: ["phone", "name", "invoice_id", "days_overdue", "balance"],
    },
    metrics: { calls: 742, successRate: 18, avgHandleTimeSec: 198 },
    progress: { completed: 742, total: 1500 },
    startDate: "May 15, 2026",
  },
  {
    id: "dp_ob_05",
    name: "NPS Survey",
    kind: "batch",
    channel: { kind: "telephony", numbers: ["+1 (415) 555-0240"] },
    agentId: "agt_survey",
    agentName: "Survey Bot",
    status: "draft",
    prompt: `# ROLE
Run a 2-question NPS survey: score 0–10, then one open follow-up.

# CONTEXT (per row)
{{name}} used {{product}} most recently.`,
    greeting: "Hi {{name}}, quick 60-second feedback call about {{product}}. Is now okay?",
    failure: "Thanks anyway, have a great day.",
    contacts: {
      fileName: "nps-q2.csv",
      rowCount: 8000,
      columns: ["phone", "name", "product"],
    },
    metrics: { calls: 0, successRate: 0, avgHandleTimeSec: 0 },
    progress: { completed: 0, total: 8000 },
    startDate: "—",
  },
  {
    id: "dp_ob_06",
    name: "Black Friday Promo",
    kind: "batch",
    channel: { kind: "telephony", numbers: ["+1 (415) 555-0240"] },
    agentId: "agt_sales_qualifier",
    agentName: "Sales Qualifier",
    status: "scheduled",
    prompt: `# ROLE
Offer the Black Friday deal ({{discount}} off annual plans) to warm leads.

# CONTEXT (per row)
{{name}} from {{company}} — interest tag: {{interest}}.`,
    greeting: "Hi {{name}}! Black Friday came early at Acme: {{discount}} off annual plans.",
    failure: "I'll text you the offer link instead.",
    contacts: {
      fileName: "bf-warm-leads.csv",
      rowCount: 24000,
      columns: ["phone", "name", "company", "interest", "discount"],
    },
    metrics: { calls: 0, successRate: 0, avgHandleTimeSec: 0 },
    progress: { completed: 0, total: 24000 },
    startDate: "Nov 24, 2026",
  },
]

// ─── Mock phone-number inventory ─────────────────────────────────────────────

export const PHONE_NUMBERS: PhoneNumber[] = [
  {
    id: "pn_01",
    number: "+1 (415) 555-0101",
    label: "Support Line",
    vendor: "Twilio",
    assignedTo: ["dp_ib_01"],
    status: "active",
  },
  {
    id: "pn_02",
    number: "+1 (628) 555-0188",
    label: "Sales Inbound",
    vendor: "Twilio",
    assignedTo: ["dp_ib_02"],
    status: "active",
  },
  {
    id: "pn_03",
    number: "+44 20 7946 0958",
    label: "UK Support",
    vendor: "Vonage",
    assignedTo: ["dp_ib_03"],
    status: "active",
  },
  {
    id: "pn_04",
    number: "+1 (800) 555-0199",
    label: "Toll-Free",
    vendor: "Bandwidth",
    assignedTo: ["dp_ib_04"],
    status: "active",
  },
  {
    id: "pn_05",
    number: "+1 (415) 555-0240",
    label: "Outbound Pool",
    vendor: "Twilio",
    assignedTo: ["dp_ob_01", "dp_ob_02", "dp_ob_03", "dp_ob_04", "dp_ob_06"],
    status: "active",
  },
  {
    id: "pn_06",
    number: "+1 (628) 555-0260",
    label: "SMS Sender",
    vendor: "Twilio",
    assignedTo: [],
    status: "unassigned",
  },
  {
    id: "pn_07",
    number: "+1 (628) 555-0220",
    label: "WhatsApp",
    vendor: "Meta",
    assignedTo: ["dp_ib_06"],
    status: "active",
  },
  {
    id: "pn_08",
    number: "+1 (415) 555-0300",
    label: "Reserved",
    vendor: "Twilio",
    assignedTo: [],
    status: "unassigned",
  },
  {
    id: "pn_09",
    number: "+1 (628) 555-0111",
    label: "Sales Direct Line",
    vendor: "Twilio",
    assignedTo: [],
    assignedAgent: { id: "agt_sales_qualifier", name: "Sales Qualifier" },
    status: "active",
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getDeployment(id: string): Deployment | undefined {
  return DEPLOYMENTS.find((d) => d.id === id)
}

export function listDeployments(filter?: {
  kind?: DeploymentKind
  status?: DeploymentStatus
}): Deployment[] {
  return DEPLOYMENTS.filter((d) => {
    if (filter?.kind && d.kind !== filter.kind) return false
    if (filter?.status && d.status !== filter.status) return false
    return true
  })
}

/** Canonical detail URL for a deployment (inbound vs Batch Calls surface). */
export function deploymentHref(d: Pick<Deployment, "id" | "kind">): string {
  return d.kind === "inbound" ? `/deploy/inbound/${d.id}` : `/deploy/batch-calls/${d.id}`
}

/** Extract {{vars}} referenced in a prompt/greeting body. */
export function extractVars(text: string): string[] {
  // Unicode-aware: \w is ASCII-only, so {{société}}/{{名前}} would slip through
  // undetected and get read aloud literally. \p{L}\p{N} catches any-language vars.
  return [...new Set([...text.matchAll(/\{\{\s*([\p{L}\p{N}_.]+)\s*\}\}/gu)].map((m) => m[1]))]
}

// ─── Resource catalogs (Knowledge / MCP) ─────────────────────────────────────
//
// Canonical mock catalogs an agent attaches from. Shared by the creation wizard
// (Step 3) and Resources › Knowledge/MCP so the two never drift. Wireframe data.

export interface KnowledgeBase {
  id: string
  name: string
  source: string
  chunks: number
  status: "ready" | "indexing"
}

export const KNOWLEDGE_BASES: KnowledgeBase[] = [
  { id: "kb_01", name: "Product Docs", source: "Upload", chunks: 1240, status: "ready" },
  { id: "kb_02", name: "FAQs v3", source: "Upload", chunks: 320, status: "ready" },
  { id: "kb_03", name: "Policy Handbook", source: "URL Crawl", chunks: 0, status: "indexing" },
]

export interface McpServer {
  id: string
  name: string
  url: string
  tools: number
}

export const MCP_SERVERS: McpServer[] = [
  { id: "mcp_01", name: "CRM Connector", url: "https://mcp.acme.com/crm", tools: 8 },
  { id: "mcp_02", name: "Calendar API", url: "https://mcp.acme.com/calendar", tools: 5 },
]

/** Third-party OAuth apps ("Connectors") — the canonical catalog shared by the
 *  Resources › Connectors tab AND the agent builder's Actions hub. A connector
 *  must be `connected` at the project level before an agent can attach it.
 *  Wireframe: "connected" is mocked (no real OAuth). */
export interface Connector {
  id: string
  name: string
  category: string
  description: string
  /** Short brand initials for the CatalogCard chip when no logo. */
  initials: string
  status: "connected" | "available" | "coming-soon"
}

export const CONNECTORS: Connector[] = [
  { id: "conn_hubspot", name: "HubSpot", category: "CRM", description: "Sync contacts and log deals in your CRM.", initials: "HS", status: "available" },
  { id: "conn_salesforce", name: "Salesforce", category: "CRM", description: "Read and update leads and opportunities.", initials: "SF", status: "available" },
  { id: "conn_gcal", name: "Google Calendar", category: "Scheduling", description: "Check availability and book meetings.", initials: "GC", status: "available" },
  { id: "conn_zendesk", name: "Zendesk", category: "Support", description: "Open and track support tickets automatically.", initials: "ZD", status: "available" },
  { id: "conn_slack", name: "Slack", category: "Messaging", description: "Post updates and alerts to a channel.", initials: "SL", status: "available" },
  { id: "conn_stripe", name: "Stripe", category: "Payments", description: "Take payments and check order status.", initials: "ST", status: "coming-soon" },
]

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, "0")}s`
}

export const CHANNEL_LABEL: Record<ChannelKind, string> = {
  telephony: "Telephony",
  whatsapp: "WhatsApp",
  sms: "SMS",
  web: "Web widget",
}

// ─── Vendor credentials (the keys an agent's stack is built from) ─────────────
//
// One source of truth so both the Vendor Credentials panel AND the diagnostics
// engine can read them: an expiring/expired key becomes a critical Issue naming
// the live deployments it puts at risk (2026-06-24 error-remediation loop).

export type CredentialStatus = "valid" | "expiring" | "expired"

export interface VendorCredential {
  id: string
  vendor: string
  category: "LLM" | "TTS" | "STT" | "Telephony"
  name: string
  keyHint: string
  status: CredentialStatus
  /** Number of agents whose stack references this vendor (display only). */
  usedBy: number
  added: string
  /** Human date the key lapses — shown when status is expiring/expired. */
  expiresOn?: string
}

export const VENDOR_CREDENTIALS: VendorCredential[] = [
  { id: "vc_01", vendor: "OpenAI",     category: "LLM",       name: "Production API Key",       keyHint: "sk-proj-••••••••••••xK3a", status: "valid",    usedBy: 3, added: "Feb 2, 2026" },
  { id: "vc_02", vendor: "ElevenLabs", category: "TTS",       name: "Voice API Key",            keyHint: "el_••••••••••••8f2b",      status: "valid",    usedBy: 3, added: "Feb 2, 2026" },
  { id: "vc_03", vendor: "Deepgram",   category: "STT",       name: "STT API Key",              keyHint: "dg_••••••••••••c91e",      status: "valid",    usedBy: 2, added: "Mar 8, 2026" },
  { id: "vc_04", vendor: "Twilio",     category: "Telephony", name: "Account SID + Auth Token", keyHint: "AC••••••••••••7d4f",       status: "valid",    usedBy: 0, added: "Jan 15, 2026" },
  { id: "vc_05", vendor: "Anthropic",  category: "LLM",       name: "Claude API Key",           keyHint: "sk-ant-••••••••••••f812",  status: "expiring", usedBy: 1, added: "Apr 10, 2026", expiresOn: "May 31, 2026" },
]

/** Does this agent's stack reference the given vendor (LLM/ASR/TTS)? */
export function agentUsesVendor(a: Agent, vendor: string): boolean {
  return a.stack.llm.vendor === vendor || a.stack.asr.vendor === vendor || a.stack.tts.vendor === vendor
}

/** Credentials that are expiring or already expired — the ones worth flagging. */
export function expiringCredentials(): VendorCredential[] {
  return VENDOR_CREDENTIALS.filter((c) => c.status === "expiring" || c.status === "expired")
}

/** Live-ish deployments whose backing agent depends on a vendor — so an expiring
 *  key for that vendor will interrupt them. Completed batches are excluded
 *  (they've already run); drafts have no traffic to lose. */
export function deploymentsAtRiskFromCredential(vendor: string): Deployment[] {
  const atRiskAgents = new Set(AGENTS.filter((a) => agentUsesVendor(a, vendor)).map((a) => a.id))
  return DEPLOYMENTS.filter(
    (d) => atRiskAgents.has(d.agentId) && d.status !== "completed" && d.status !== "draft",
  )
}

/** Expiring/expired credentials whose vendor this agent's stack depends on. */
export function credentialsAtRiskForAgent(agentId: string): VendorCredential[] {
  const a = getAgent(agentId)
  if (!a) return []
  return expiringCredentials().filter((c) => agentUsesVendor(a, c.vendor))
}
