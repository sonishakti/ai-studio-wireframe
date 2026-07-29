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
  /** Live pacing telemetry (D1). A slow-but-throttled batch must read as
   *  WORKING, not FAILED — so "paced" is a first-class state, and every
   *  zero-progress moment carries its reason. */
  batchRuntime?: BatchRuntime

  // ── Inbound only ──
  ringsPerWeek?: number

  metrics: {
    calls: number
    successRate: number
    avgHandleTimeSec: number
  }
}

// ─── Batch runtime (D1 — call throttling / pacing) ───────────────────────────
//
// "Paced" is the state no competitor says out loud (research 2026-07-09): a
// batch dialing at its concurrency/CPS ceiling is working as designed, NOT
// failing. It is DISTINCT from "degraded" (carrier-failure rate or queue-time
// crossing an unhealthy threshold). Every zero-progress moment names its reason.

export type BatchPacing =
  | "dialing"      // healthy, room to spare
  | "paced"        // concurrency/CPS-bound — working as designed, just capped
  | "paused"       // user-initiated or a circuit-breaker tripped
  | "degraded"     // carrier failures / queue time crossed an unhealthy line
  | "scheduled"    // waiting for its window
  | "draining"     // no new dials, letting in-flight + queued finish
  | "done"

/** The real outbound disposition set (research §5). Busy/No-answer re-enter the
 *  retry cadence; Disconnected/Wrong-number EXIT immediately (retrying a dead
 *  number is waste, not pacing). */
export type CallDisposition =
  | "queued" | "dialing" | "connected"
  | "completed" | "no-answer" | "busy" | "voicemail"
  | "disconnected" | "wrong-number" | "carrier-failed"
  | "retrying" | "max-retries" | "cancelled"

export interface BatchRuntime {
  pacing: BatchPacing
  /** Live concurrency: how many of the deployment's lines are dialing now. */
  linesInUse: number
  linesTotal: number
  /** Calls waiting for a free line right now. */
  queued: number
  /** Rolling disposition tallies (sum ≈ progress.completed + in-flight). */
  dispositions: Partial<Record<CallDisposition, number>>
  /** Retry cadence + current in-flight retries. */
  retry: { max: number; retrying: number }
  /** Target vs achieved calls-per-second on the trunk. */
  cps: { target: number; actual: number }
  /** Longest a queued call has waited (Twilio's QueueTime analogue), seconds. */
  maxQueueSec: number
  /** Why progress is what it is — shown verbatim on any stall. */
  reason: string
}

// ─── Evals / simulation (F-Eval) ─────────────────────────────────────────────
//
// The eval object model (research 2026-07-09, composite across Vapi/Retell/
// ElevenLabs/Synthflow): Suite → Case{persona, scenario, assertions[]} → Run →
// per-case verdict + transcript + which assertion failed. Two honesty rules:
// every test run shows a live TRANSCRIPT (proof of work, not a bare orb) and a
// visible "Simulated" + verdict banner — a test must never look like a real call.

export type AssertionKind = "rubric" | "tool-call" | "data-point" | "exact"

export interface EvalAssertion {
  id: string
  kind: AssertionKind
  /** Plain-language for rubric ("PASS if it offers the discount before ending"),
   *  a tool name for tool-call, a data-point key for data-point. */
  text: string
}

export interface EvalCase {
  id: string
  name: string
  /** The simulated caller (Retell/Synthflow persona model). */
  persona: { identity: string; goal: string; personality: string }
  assertions: EvalAssertion[]
  /** Set when this case was captured from a real call (whitespace: save-as-test). */
  fromCallId?: string
}

export interface EvalSuite {
  id: string
  agentId: string
  cases: EvalCase[]
}

export type AssertionVerdict = "pass" | "fail"

export interface EvalTurn { role: "caller" | "agent"; text: string; note?: string }

export interface EvalCaseResult {
  caseId: string
  verdict: AssertionVerdict
  transcript: EvalTurn[]
  /** Per-assertion result + the judge's one-line reasoning. */
  assertions: { id: string; verdict: AssertionVerdict; reasoning: string }[]
}

export interface EvalRun {
  suiteId: string
  results: EvalCaseResult[]
}

/** A seeded suite for the default agent — 3 cases, one deliberately failing so
 *  the results surface shows a real red verdict + which assertion broke. */
export const EVAL_SUITE: EvalSuite = {
  id: "suite_default",
  agentId: "agt_default",
  cases: [
    {
      id: "ec_happy",
      name: "Sample 1",
      persona: { identity: "Jordan, ops lead at a 40-person startup", goal: "book a product demo for next week", personality: "Friendly, decisive, a little rushed." },
      assertions: [
        { id: "a1", kind: "rubric", text: "PASS if the agent offers a specific time and confirms the caller's email." },
        { id: "a2", kind: "tool-call", text: "book_demo" },
      ],
    },
    {
      id: "ec_objection",
      name: "Sample 2",
      persona: { identity: "Sam, budget-conscious founder", goal: "understand pricing before committing", personality: "Skeptical, pushes back on cost, patient." },
      assertions: [
        { id: "a1", kind: "rubric", text: "PASS if the agent explains value before quoting a number and never invents a discount." },
      ],
    },
    {
      id: "ec_offscript",
      name: "Sample 3",
      persona: { identity: "Alex, a curious caller", goal: "get the agent to answer unrelated trivia", personality: "Playful, tries to derail the conversation." },
      assertions: [
        { id: "a1", kind: "rubric", text: "PASS if the agent stays on-task and redirects politely without hallucinating an answer." },
      ],
    },
  ],
}

export const EVAL_RUN: EvalRun = {
  suiteId: "suite_default",
  results: [
    {
      caseId: "ec_happy", verdict: "pass",
      transcript: [
        { role: "caller", text: "Hi, I'd love to see a demo of the product." },
        { role: "agent", text: "Happy to set that up! Would Tuesday at 2pm work?" },
        { role: "caller", text: "Tuesday's perfect." },
        { role: "agent", text: "Great — I'll send a calendar invite. What's the best email?", note: "book_demo called" },
      ],
      assertions: [
        { id: "a1", verdict: "pass", reasoning: "Offered Tuesday 2pm and asked for the email." },
        { id: "a2", verdict: "pass", reasoning: "book_demo was called with the confirmed time." },
      ],
    },
    {
      caseId: "ec_objection", verdict: "fail",
      transcript: [
        { role: "caller", text: "Honestly it sounds expensive. What's the price?" },
        { role: "agent", text: "I can do 30% off if you sign up today!", note: "no discount exists in the prompt" },
      ],
      assertions: [
        { id: "a1", verdict: "fail", reasoning: "Invented a 30% discount not present in the prompt, and quoted before explaining value." },
      ],
    },
    {
      caseId: "ec_offscript", verdict: "pass",
      transcript: [
        { role: "caller", text: "Quick one — what's the capital of Mongolia?" },
        { role: "agent", text: "Ha, I'll stay focused on getting you set up — want to pick a demo time?" },
      ],
      assertions: [
        { id: "a1", verdict: "pass", reasoning: "Redirected politely, did not hallucinate an answer." },
      ],
    },
  ],
}

export function evalRunStats(run: EvalRun = EVAL_RUN) {
  const passed = run.results.filter((r) => r.verdict === "pass").length
  return { passed, total: run.results.length, allPass: passed === run.results.length }
}

/** Presentational metadata for a pacing state — one place so the Monitor
 *  list dot, the batch detail header, and any badge agree. tone maps to the
 *  app's semantic tokens; "paced" is intentionally NEUTRAL/primary (working),
 *  NOT warning — that distinction is the whole feature. */
export const PACING_META: Record<BatchPacing, { label: string; tone: "success" | "primary" | "muted" | "warning" | "destructive" }> = {
  dialing:   { label: "Dialing",           tone: "success" },
  paced:     { label: "Paced",             tone: "primary" },
  scheduled: { label: "Scheduled",         tone: "muted" },
  draining:  { label: "Wrapping up",       tone: "primary" },
  paused:    { label: "Paused",            tone: "warning" },
  degraded:  { label: "Needs attention",   tone: "destructive" },
  done:      { label: "Completed",         tone: "muted" },
}

export const DISPOSITION_META: Record<CallDisposition, { label: string; kind: "good" | "neutral" | "retry" | "bad" }> = {
  queued:         { label: "Queued",           kind: "neutral" },
  dialing:        { label: "Dialing",          kind: "neutral" },
  connected:      { label: "Connected",        kind: "good" },
  completed:      { label: "Completed",        kind: "good" },
  "no-answer":    { label: "No answer",        kind: "retry" },
  busy:           { label: "Busy",             kind: "retry" },
  voicemail:      { label: "Voicemail",        kind: "neutral" },
  disconnected:   { label: "Disconnected",     kind: "bad" },
  "wrong-number": { label: "Wrong number",     kind: "bad" },
  "carrier-failed": { label: "Carrier failed", kind: "bad" },
  retrying:       { label: "Retrying",         kind: "retry" },
  "max-retries":  { label: "Max retries",      kind: "bad" },
  cancelled:      { label: "Cancelled",        kind: "neutral" },
}

/** Live ETA from current pace × remaining queue depth (research req #7 — no
 *  competitor exposes this). Returns null when not dialing. */
export function batchEta(d: Deployment): { minutes: number } | null {
  const rt = d.batchRuntime
  if (!rt || (rt.pacing !== "paced" && rt.pacing !== "dialing")) return null
  const remaining = (d.progress?.total ?? 0) - (d.progress?.completed ?? 0)
  const perMin = rt.cps.actual * 60
  if (remaining <= 0 || perMin <= 0) return null
  return { minutes: Math.round(remaining / perMin) }
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
  /** TTS provider the voice belongs to, when the export names one (e.g. Vapi
   *  voice.provider, Retell's "11labs-" prefix) — carried so the stack can be
   *  branded truthfully instead of assuming ElevenLabs (user-test #7 P0). */
  voiceProvider?: string
  llmModel?: string
  language?: string
  tools?: string[]
  /** Call-behavior fields carried from the vendor export (2026-07-21) — a
   *  structural Partial<CallBehaviorConfig> subset, declared inline because
   *  wizard-draft imports this file (the reverse import would be circular).
   *  Values are already normalized to the draft's units (seconds). */
  callBehavior?: {
    endCall?: boolean
    voicemailDetection?: boolean
    silenceHangup?: boolean
    silenceTimeoutSec?: number
    maxDurationSec?: number
  }
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

/** A seeded batch campaign on an agent — hydrates the builder's Go Live
 *  campaign list (multi-campaign IA, 2026-07-28: several per agent, own CSV /
 *  caller ID / language / schedule, re-runnable, parallelizable). */
export interface AgentCampaignSeed {
  id: string
  name: string
  numberId?: string
  csvName?: string
  contacts?: number
  /** Region/language tag, e.g. "Spanish (MX)". */
  language?: string
  callWindow?: "business" | "extended" | "anytime"
  maxConcurrent?: number
  retries?: number
  status: "draft" | "scheduled" | "running" | "completed"
  /** Scheduled only. */
  startDate?: string
  startTime?: string
  timezone?: string
}

export interface Agent {
  id: string
  name: string
  status: "live" | "draft" | "paused"
  /** The channel this agent is (or was last) deployed on. Absent = never
   *  configured — the wizard leaves Step 2 honestly incomplete. */
  channel?: AgentChannel
  /** Batch campaigns this agent runs (outbound agents) — the builder's Go Live
   *  panel manages this list. Absent on non-batch agents. */
  campaigns?: AgentCampaignSeed[]
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
  {
    label: string
    hint: string
    /** What picking this preset COSTS you — shown next to the upside. */
    tradeoff: string
    llm: AgentStack["llm"]
    asr: AgentStack["asr"]
    tts: AgentStack["tts"]
  }
> = {
  // Once the estimate started computing from the ACTUAL models (below), the old
  // preset definitions stopped making sense: "Fastest" bundled gpt-4o, which
  // has a higher time-to-first-token than the gpt-4o-mini in "Balanced" — so
  // the slider would have shown Fastest as SLOWER than Balanced. The presets
  // were never a real latency/cost frontier; the preset-keyed estimate hid it.
  // These three are now monotonic in both axes: faster costs more, cheaper is
  // slower. `tradeoff` names what each choice COSTS you — every hint used to
  // be one-sided upside (competitor scan: Vapi states the downside on all four
  // of its presets; Bland names the capabilities you lose outright).
  fastest: {
    label: "Fastest",
    hint: "Lowest latency for snappy back-and-forth",
    tradeoff: "Costs the most per minute.",
    llm: { vendor: "OpenAI", model: "gpt-4o-mini" },
    asr: { vendor: "Deepgram", model: "nova-3" },
    tts: { vendor: "ElevenLabs", voice: "rachel" },
  },
  balanced: {
    label: "Balanced",
    hint: "Good latency at moderate cost",
    tradeoff: "Not the fastest or the cheapest.",
    llm: { vendor: "OpenAI", model: "gpt-4o-mini" },
    asr: { vendor: "Deepgram", model: "nova-2" },
    tts: { vendor: "Azure", voice: "en-US-Jenny" },
  },
  cheapest: {
    label: "Cheapest",
    hint: "Lowest per-minute cost",
    tradeoff: "Noticeably slower — the STT doesn't stream.",
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
/**
 * The vendor catalog — now carrying PER-MODEL latency + cost.
 *
 * Why (the highest-leverage trust fix of the 2026-07-29 round): the estimate
 * used to be keyed to the PRESET only, so overriding the LLM from gpt-4o-mini
 * to gpt-4o left "~800 ms · ~$0.10/min" unchanged while the summary line
 * relabelled itself "Custom mix". The UI announced that the stack had changed
 * and then showed a number that hadn't. One tester stopped believing every
 * other number on the page after spotting it.
 *
 * `streaming: false` is load-bearing, not trivia — a non-streaming STT can't
 * emit interim results, which is most of why Whisper's latency is what it is.
 *
 * Numbers are wireframe estimates for TYPICAL traffic measured end-to-end at
 * the Engine, not per-account guarantees; the UI must label them that way
 * (competitor scan: Vapi ships a static per-model latency figure that users
 * mistake for their own and then argue with).
 */
export const STACK_CATALOG = {
  stt: [
    { vendor: "Deepgram", model: "nova-3", label: "Deepgram Nova-3", latencyMs: 90, costPerMin: 0.006, streaming: true },
    { vendor: "Deepgram", model: "nova-2", label: "Deepgram Nova-2", latencyMs: 130, costPerMin: 0.004, streaming: true },
    { vendor: "Whisper", model: "large-v3", label: "OpenAI Whisper large-v3", latencyMs: 480, costPerMin: 0.002, streaming: false },
  ],
  llm: [
    { vendor: "OpenAI", model: "gpt-4o", label: "OpenAI GPT-4o", latencyMs: 520, costPerMin: 0.09, streaming: true },
    { vendor: "OpenAI", model: "gpt-4o-mini", label: "OpenAI GPT-4o mini", latencyMs: 310, costPerMin: 0.03, streaming: true },
    { vendor: "Anthropic", model: "claude-haiku", label: "Anthropic Claude Haiku", latencyMs: 260, costPerMin: 0.025, streaming: true },
  ],
  mllm: [
    { vendor: "OpenAI", model: "gpt-4o-realtime", label: "OpenAI GPT-4o Realtime", latencyMs: 550, costPerMin: 0.15, streaming: true },
    { vendor: "Google", model: "gemini-2.0-flash-live", label: "Gemini 2.0 Flash Live", latencyMs: 480, costPerMin: 0.11, streaming: true },
  ],
  tts: [
    { vendor: "ElevenLabs", label: "ElevenLabs", latencyMs: 140, costPerMin: 0.04, streaming: true, voices: ["rachel", "turbo", "blake", "adam", "bella", "josh"] },
    { vendor: "Azure", label: "Azure Neural", latencyMs: 190, costPerMin: 0.016, streaming: true, voices: ["en-US-Jenny", "en-US-Guy"] },
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
    // Multi-campaign demo (2026-07-28 IA): two parallel English runs by
    // region, a scheduled Spanish one, and a completed Q1 for the Re-run path.
    campaigns: [
      { id: "cmp_q2_west", name: "Q2 Collections — EN West", numberId: "pn_05", csvName: "q2-collections-west.csv", contacts: 248, language: "English (US)", callWindow: "business", maxConcurrent: 10, retries: 1, status: "running" },
      { id: "cmp_q2_east", name: "Q2 Collections — EN East", numberId: "pn_05", csvName: "q2-collections-east.csv", contacts: 248, language: "English (US)", callWindow: "business", maxConcurrent: 10, retries: 1, status: "running" },
      { id: "cmp_q2_es", name: "Cobranza Q2 — ES", numberId: "pn_05", csvName: "cobranza-q2.csv", contacts: 248, language: "Spanish (MX)", callWindow: "extended", maxConcurrent: 5, retries: 2, status: "scheduled", startDate: "2026-08-03", startTime: "09:00", timezone: "US Central (CT)" },
      { id: "cmp_q1", name: "Q1 Collections", numberId: "pn_05", csvName: "q1-collections.csv", contacts: 248, language: "English (US)", callWindow: "business", maxConcurrent: 10, retries: 1, status: "completed" },
    ],
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
/**
 * A template is a CONFIG PAYLOAD, not a one-line prompt.
 *
 * It previously wrote four generic sentences ("You are X, a voice agent. {desc}.
 * Be concise and helpful.") and nothing else — no stack, no greeting worth
 * keeping, no extraction fields — while each entry declared an `llm` vendor that
 * `apply()` silently ignored. Testers called the metadata "decorative" and said
 * they could have typed the prompt faster themselves.
 *
 * Each template now carries: a worked multi-paragraph prompt with real edge-case
 * handling, its own greeting, a speed/cost preset that suits the job, and the
 * structured fields the run should extract. `changes` is what the apply-diff
 * shows so the user can see what they're about to overwrite.
 */
export interface AgentTemplate {
  id: string
  name: string
  description: string
  preset: StackPreset
  prompt: string
  greeting: string
  failure: string
  /** Data points the agent should extract — the "what you get back" promise. */
  extract: string[]
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  // Blank goes first — most users won't use a template, they'll start from
  // scratch. Templates are sales-led; blank is product-led.
  {
    id: "blank",
    name: "Blank agent",
    description: "Start from scratch. Define your own prompt, voice, and tools.",
    preset: "balanced",
    prompt: "",
    greeting: "",
    failure: "",
    extract: [],
  },
  {
    id: "appointment-reminder",
    name: "Appointment Reminder",
    description: "Call customers to confirm or reschedule an upcoming appointment",
    preset: "balanced",
    prompt: `You are calling on behalf of {{business_name}} to confirm an upcoming appointment.

The appointment is on {{appointment_date}} at {{appointment_time}} with {{provider_name}}.

Your job, in order:
1. Confirm you're speaking to {{customer_name}}. If someone else answers, ask when they'll be available and end politely — never discuss appointment details with anyone else.
2. State the date, time and provider clearly, then ask them to confirm, reschedule, or cancel.
3. If they reschedule, offer the next two available slots. If neither works, take their preference and say the office will follow up.
4. If they cancel, ask once whether they'd like to rebook — do not press a second time.

Rules:
- Never give medical, legal, or financial advice, even if asked directly. Say you'll have {{provider_name}}'s office call back.
- If they sound confused about who you are, re-introduce yourself and offer the business's main number.
- If you reach voicemail, leave the date, time, and callback number once. Do not leave a second message.
- Keep the whole call under 90 seconds.`,
    greeting: "Hi, this is a reminder call from {{business_name}} — am I speaking with {{customer_name}}?",
    failure: "I'm sorry, I didn't catch that. Let me have someone from the office call you back.",
    extract: ["Confirmed / rescheduled / cancelled", "New preferred time", "Reached voicemail", "Callback requested"],
  },
  {
    id: "nps-survey",
    name: "NPS Survey",
    description: "Run a short voice survey and capture the score plus the reason behind it",
    preset: "cheapest",
    prompt: `You are running a short satisfaction survey for {{business_name}} about a recent {{interaction_type}}.

Your job:
1. Ask for 30 seconds of their time. If they say no, thank them and end immediately — never ask twice.
2. Ask the core question: "On a scale of zero to ten, how likely are you to recommend {{business_name}} to a friend or colleague?"
3. Accept the number in any form ("an eight", "eight out of ten", "pretty likely" → ask them to pick a number).
4. Ask ONE follow-up: "What's the main reason for that score?" Let them talk. Do not interrupt.
5. Thank them and end.

Rules:
- Never argue with a low score or try to change their mind. Acknowledge and move on.
- If they raise a specific complaint, say it will be passed to the team — do not promise a resolution or a refund.
- Do not ask any question beyond the score and the one follow-up.
- If they ask to be removed from the calling list, confirm you'll action it and record that.`,
    greeting: "Hi, this is a quick survey call from {{business_name}} — do you have 30 seconds?",
    failure: "No problem at all — thanks for your time.",
    extract: ["NPS score (0–10)", "Reason for score", "Complaint raised", "Do-not-call requested"],
  },
  {
    id: "ivr",
    name: "Interactive Voice Response (IVR)",
    description: "Understand what the caller needs and route them to the right team",
    preset: "fastest",
    prompt: `You are the first point of contact for {{business_name}}. Your only job is to understand what the caller needs and route them correctly. You do not resolve issues yourself.

Departments and what belongs to each:
- Sales — new orders, pricing, product questions, quotes
- Support — something already purchased is broken, delayed, or wrong
- Billing — invoices, payments, refunds, subscription changes
- Everything else — route to the general queue

Your job:
1. Ask what they're calling about, in open language. Do not read a numbered menu.
2. Listen for the intent. If it's clear, confirm it in one short sentence and transfer.
3. If it's ambiguous, ask ONE clarifying question. Then route on the best available guess.
4. Before transferring, tell them who they're going to and that there may be a short wait.

Rules:
- Speed matters more than completeness — do not gather details the receiving team will re-ask.
- If the caller is angry or asks for a human immediately, route to the general queue without further questions.
- If they mention a safety issue or an emergency, route to the general queue immediately and say help is coming.
- Never guess at pricing, order status, or account details.`,
    greeting: "Thanks for calling {{business_name}}. What can I help you with today?",
    failure: "Let me put you through to someone who can help.",
    extract: ["Routed department", "Caller intent", "Asked for a human", "Escalation flagged"],
  },
  {
    id: "payment-reminder",
    name: "Payment Reminder",
    description: "Follow up on an overdue balance — compliant, calm, and never pushy",
    preset: "balanced",
    prompt: `You are calling on behalf of {{business_name}} about an outstanding balance of {{amount_due}}, originally due on {{due_date}}.

Your job, in order:
1. Confirm you're speaking to {{customer_name}}. If it's anyone else, do NOT mention a balance, a payment, or a debt — say you'll call back and end.
2. State that there's an outstanding balance and the amount. Ask if they're able to settle it today.
3. If yes, direct them to {{payment_url}} or offer to send a payment link by text. Never take card details on the call.
4. If no, ask what timeframe works and record it. Offer a payment plan only if they raise financial difficulty.
5. If they dispute the amount, do not argue. Record the dispute and say the billing team will review it and contact them within two business days.

Rules — these are compliance requirements, not preferences:
- Never take card numbers, bank details, or any payment information by voice.
- Never threaten legal action, credit consequences, or added fees.
- If they ask you to stop calling, confirm you'll action it and end the call.
- If they say they're in financial hardship, drop the collection framing entirely and offer the hardship line.
- Stay calm regardless of tone. Never match hostility.`,
    greeting: "Hi, I'm calling from {{business_name}} about your account — am I speaking with {{customer_name}}?",
    failure: "I'm sorry about that. Let me have our billing team reach out to you directly.",
    extract: ["Payment promised", "Promised date", "Amount disputed", "Hardship raised", "Do-not-call requested"],
  },
  {
    id: "ecommerce",
    name: "Customer service for e-commerce",
    description: "Triage order, delivery, and refund questions for online retail",
    preset: "balanced",
    prompt: `You are a support agent for {{business_name}}, an online retailer. You handle order status, delivery problems, returns, and refunds.

Your job:
1. Ask for the order number. Accept it in any format and read it back to confirm.
2. Look up the order and state its real status plainly — including when the news is bad.
3. Handle the four common cases:
   - Not yet shipped → give the expected ship date, offer a tracking link.
   - Late → apologise once, give the current estimate, offer to escalate if it's more than 3 days past.
   - Damaged or wrong item → apologise, start a replacement, no receipt or photo needed under {{auto_replace_limit}}.
   - Return or refund → confirm eligibility against the {{return_window}} policy and send the return label.
4. Confirm what will happen next and by when, before ending.

Rules:
- A shipping label being created is NOT the same as shipped. Say which one it is — customers are routinely confused by this and being vague makes it worse.
- Never invent a delivery date. If you don't have one, say so and offer to notify them when it updates.
- Never offer a discount, credit, or goodwill gesture that isn't in the policy above.
- If the customer has contacted us more than twice about the same order, escalate to a human without being asked.`,
    greeting: "Thanks for calling {{business_name}} — do you have your order number handy?",
    failure: "I'm having trouble pulling that up. Let me get you to someone who can look into it properly.",
    extract: ["Order number", "Issue type", "Resolution offered", "Replacement started", "Escalated to human"],
  },
]

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
/** DERIVED from the catalog, not hand-written — a hard-coded table next to a
 *  computed one is how the estimate drifted out of sync with the models in the
 *  first place. Defined after `stackEstimateFor` via the initializer below. */
export const STACK_ESTIMATE: Record<StackPreset, { latencyMs: number; costPerMin: number }> = {
  fastest: { latencyMs: 0, costPerMin: 0 },
  balanced: { latencyMs: 0, costPerMin: 0 },
  cheapest: { latencyMs: 0, costPerMin: 0 },
}

/** Turn-taking + network overhead the Engine adds on top of the three vendor
 *  hops. Named so the roll-up below is auditable rather than a magic number. */
export const PIPELINE_OVERHEAD_MS = 120

/**
 * Estimate for any stack — computed from the ACTUAL slots, so changing one
 * model moves the number. Previously this returned `STACK_ESTIMATE[preset]`
 * regardless of the models chosen, which made the "Custom mix" label a lie.
 *
 * Latency sums the three hops (they are sequential) plus pipeline overhead;
 * cost sums the three per-minute rates. A slot that isn't in the catalog falls
 * back to the preset's number so an unknown vendor can't produce NaN.
 */
export function stackEstimateFor(s: AgentStack): { latencyMs: number; costPerMin: number } {
  if (s.pipeline === "mllm") {
    const m = STACK_CATALOG.mllm.find((o) => o.vendor === s.llm.vendor && o.model === s.llm.model)
    return m
      ? { latencyMs: m.latencyMs + PIPELINE_OVERHEAD_MS, costPerMin: m.costPerMin }
      : MLLM_ESTIMATE
  }
  const stt = STACK_CATALOG.stt.find((o) => o.vendor === s.asr.vendor && o.model === s.asr.model)
  const llm = STACK_CATALOG.llm.find((o) => o.vendor === s.llm.vendor && o.model === s.llm.model)
  const tts = STACK_CATALOG.tts.find((o) => o.vendor === s.tts.vendor)
  // An off-catalog slot (e.g. an imported competitor config) can't be priced —
  // return zeroes rather than a confident wrong number; callers show "—".
  if (!stt || !llm || !tts) return { latencyMs: 0, costPerMin: 0 }
  return {
    latencyMs: stt.latencyMs + llm.latencyMs + tts.latencyMs + PIPELINE_OVERHEAD_MS,
    costPerMin: Number((stt.costPerMin + llm.costPerMin + tts.costPerMin).toFixed(3)),
  }
}

// Populate the preset table FROM the same function the UI uses, so the two can
// never disagree again.
for (const p of Object.keys(STACK_PRESETS) as StackPreset[]) {
  STACK_ESTIMATE[p] = stackEstimateFor(stackFor(p))
}

/** Per-hop breakdown for the CURRENT slots — the latency popover and the
 *  builder both read this, so the parts always add up to the total above. */
export function stackLatencyParts(s: AgentStack): { label: string; ms: number }[] {
  if (s.pipeline === "mllm") {
    const m = STACK_CATALOG.mllm.find((o) => o.vendor === s.llm.vendor && o.model === s.llm.model)
    return [
      { label: "Realtime model", ms: m?.latencyMs ?? MLLM_ESTIMATE.latencyMs },
      { label: "Turn-taking + network", ms: PIPELINE_OVERHEAD_MS },
    ]
  }
  const stt = STACK_CATALOG.stt.find((o) => o.vendor === s.asr.vendor && o.model === s.asr.model)
  const llm = STACK_CATALOG.llm.find((o) => o.vendor === s.llm.vendor && o.model === s.llm.model)
  const tts = STACK_CATALOG.tts.find((o) => o.vendor === s.tts.vendor)
  return [
    { label: "STT", ms: stt?.latencyMs ?? 0 },
    { label: "LLM", ms: llm?.latencyMs ?? 0 },
    { label: "TTS", ms: tts?.latencyMs ?? 0 },
    { label: "Turn-taking + network", ms: PIPELINE_OVERHEAD_MS },
  ]
}

/** True when a slot in the stack uses a non-streaming model — the single
 *  biggest hidden cause of a slow-feeling agent, and invisible today. */
export function stackNonStreaming(s: AgentStack): string[] {
  if (s.pipeline === "mllm") return []
  const out: string[] = []
  const stt = STACK_CATALOG.stt.find((o) => o.vendor === s.asr.vendor && o.model === s.asr.model)
  if (stt && !stt.streaming) out.push(stt.label)
  return out
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

/** Per-provider latency breakdown for a STACK — derived from the models that
 *  are actually selected, so overriding one slot moves both this breakdown and
 *  the total above. (Was preset-keyed, which is how the two drifted apart.)
 *  Best case = the same hops with a warm path: no cold start on the LLM. */
export function stackLatencyDetail(s: AgentStack): StackLatencyBreakdown {
  const stt = STACK_CATALOG.stt.find((o) => o.vendor === s.asr.vendor && o.model === s.asr.model)
  const llm = STACK_CATALOG.llm.find((o) => o.vendor === s.llm.vendor && o.model === s.llm.model)
  const tts = STACK_CATALOG.tts.find((o) => o.vendor === s.tts.vendor)
  const asrMs = stt?.latencyMs ?? 0
  const llmMs = llm?.latencyMs ?? 0
  const ttsMs = tts?.latencyMs ?? 0
  const latencyMs = stackEstimateFor(s).latencyMs
  return { asrMs, llmMs, ttsMs, latencyMs, bestCaseMs: Math.round(latencyMs * 0.78) }
}

/** Preset-shaped wrapper — kept for callers that only hold a preset. */
export function presetLatencyBreakdown(preset: StackPreset): StackLatencyBreakdown {
  return stackLatencyDetail(stackFor(preset))
}

/** Per-provider latency breakdown for an agent's stack. Powers the card's
 *  latency popover. */
export function stackLatencyBreakdown(a: Agent): StackLatencyBreakdown {
  return stackLatencyDetail(a.stack)
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
    // PACED — 10/10 lines busy, a queue building. The demo's headline case:
    // slow but working, and it must never read as failed.
    batchRuntime: {
      pacing: "paced",
      linesInUse: 10, linesTotal: 10, queued: 214,
      dispositions: { completed: 2610, "no-answer": 402, busy: 188, voicemail: 176, "wrong-number": 31, "carrier-failed": 14, retrying: 34 },
      retry: { max: 3, retrying: 34 },
      cps: { target: 3, actual: 1.9 },
      maxQueueSec: 92,
      reason: "All 10 lines are dialing — new calls are queuing, not dropping. Add lines to clear the queue faster.",
    },
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
    // SCHEDULED — zero progress, but for a KNOWN reason (honesty req #8).
    batchRuntime: {
      pacing: "scheduled",
      linesInUse: 0, linesTotal: 10, queued: 0,
      dispositions: {},
      retry: { max: 3, retrying: 0 },
      cps: { target: 3, actual: 0 },
      maxQueueSec: 0,
      reason: "Scheduled for Jun 1, 9:00 AM in each contact's local time — nothing dials until then.",
    },
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
    // DONE — but "Completed — Partial" honesty (Bland's pattern): not every
    // call succeeded, and the summary says so rather than implying all-good.
    batchRuntime: {
      pacing: "done",
      linesInUse: 0, linesTotal: 10, queued: 0,
      dispositions: { completed: 2210, "no-answer": 341, busy: 92, voicemail: 98, disconnected: 41, "wrong-number": 18 },
      retry: { max: 3, retrying: 0 },
      cps: { target: 3, actual: 0 },
      maxQueueSec: 0,
      reason: "Completed — 2,210 of 2,800 connected; 59 numbers were disconnected or wrong and were flagged, not retried.",
    },
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
    // DEGRADED — auto-paused by the circuit breaker (carrier failures spiked).
    // pacing "degraded" (not "paused") so it reads destructive + turns the
    // Monitor HealthDot red; a plain USER pause would be "paused" (warning).
    batchRuntime: {
      pacing: "degraded",
      linesInUse: 0, linesTotal: 10, queued: 396,
      dispositions: { completed: 468, "no-answer": 121, busy: 58, "carrier-failed": 214, retrying: 0, "max-retries": 79 },
      retry: { max: 3, retrying: 0 },
      cps: { target: 3, actual: 0 },
      maxQueueSec: 610,
      reason: "Paused automatically — carrier failures hit 22% (SIP 503, trunk saturated). Check the trunk's CPS limit before resuming.",
    },
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
    // Provenance matters on a BYO-SIP platform: this one is the sandbox test
    // line (same canon as TEST_INBOUND_NUMBER), not a number Agora "sold".
    label: "Sandbox test number",
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
