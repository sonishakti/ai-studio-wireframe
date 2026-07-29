/**
 * Session trace — the per-turn record behind a single agent conversation run.
 *
 * Roadmap Q3 (Engine): "Expose component-level latency metrics to developers"
 * (P0, delivered) + "Expose STT, LLM, and TTS payloads in session logs" (P1) +
 * "Show Studio Engine session details and logs beyond telephony" (P1). The
 * call sheet's telephony-shaped latency lives in `call-detail-sheet.tsx`; this
 * module is CHANNEL-AGNOSTIC — a phone call, a web session, and a chat run all
 * produce the same turn shape, so one detail view serves all three.
 *
 * Everything is seeded off the session id so a session renders identically on
 * every visit (wireframe: no backend). Timings roll up the same way the Engine
 * reports them: ASR final → LLM time-to-first-token → TTS time-to-first-audio,
 * plus the network/turn-taking overhead that sits between the hops.
 */

import { DEPLOYMENTS } from "@/lib/campaign-data"

export type SessionChannel = "phone" | "web" | "chat" | "sip"

export const CHANNEL_LABEL: Record<SessionChannel, string> = {
  phone: "Phone",
  web: "Web",
  chat: "Chat",
  sip: "SIP",
}

/** One hop in a turn's waterfall — start offset + duration, so the segments
 *  lay out on a real time axis instead of a stacked bar.
 *
 *  `tool` is deliberately in this list: the focus group's sharpest finding was
 *  that diagnostics already models tool calls up to ~5.5s while the latency
 *  view defined e2e as `asr + llm + tts` — so the one hop that actually causes
 *  slow turns was invisible. Trace and diagnosis must describe the same call. */
export interface TraceSpan {
  key: "vad" | "asr" | "llm" | "tool" | "tts" | "net"
  label: string
  /** ms from turn start */
  startMs: number
  durationMs: number
  /** False when the value is modeled rather than reported by the Engine. A
   *  trace that silently mixes measured and modeled spans is worse than none
   *  (D3, 2026-07-29) — the waterfall hatches these and the legend says so. */
  measured: boolean
  /** Tool spans name what ran. */
  detail?: string
}

export interface SessionTurn {
  index: number
  /** Seconds from session start — drives transcript ↔ audio sync. */
  atSec: number
  speaker: "Agent" | "Customer"
  text: string
  /** Turn-level end-to-end (user stopped speaking → agent audio starts). */
  e2eMs: number
  spans: TraceSpan[]
  /** Raw provider payloads — the "what actually went over the wire" inspector. */
  payloads: {
    stt?: unknown
    llm?: unknown
    tts?: unknown
  }
  /** Set when this turn is the slowest in the session. */
  slowest?: boolean
}

export interface SessionTrace {
  id: string
  agent: string
  channel: SessionChannel
  startTime: string
  durationSec: number
  status: "Completed" | "Failed"
  turns: SessionTurn[]
  /** Roll-ups across the session's agent turns. */
  stats: {
    turnCount: number
    p50Ms: number
    p95Ms: number
    maxMs: number
    byComponent: { key: TraceSpan["key"]; label: string; avgMs: number; pct: number }[]
  }
  /** Channel-specific identity — phone shows numbers, web shows a browser. */
  endpoint: { label: string; value: string }[]
  /** RTE correlation — the fields an Agora-native developer needs to join this
   *  session to their OWN logs (channel name, agent UID, region, SDK). Without
   *  these, Sessions is unusable as an entry point for that developer (D3). */
  correlation: { label: string; value: string; copyable?: boolean }[]
}

// ─── seeded RNG (same idiom as call-detail-sheet) ────────────────────────────

function seeded(id: string): () => number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let s = h >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pct = (sorted: number[], p: number) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0

// ─── mock conversation content ───────────────────────────────────────────────

const EXCHANGES: [string, string][] = [
  ["Hi, thanks for calling. How can I help you today?", "Hey — I'm calling about my order, it hasn't shipped yet."],
  ["I can check that for you. Could I get the order number?", "It's 4-4-9-2-0-1."],
  ["Thanks. I see order 449201 — it's packed and leaves the warehouse tonight.", "Tonight? The email said it shipped two days ago."],
  ["I understand the confusion. The email confirms the label was created, not that it left.", "Okay. So when does it actually arrive?"],
  ["Delivery is estimated for Thursday. Want me to send a tracking link?", "Yes please, to the same email."],
  ["Sent. Anything else I can help with?", "No, that's everything. Thanks."],
  ["Happy to help. Have a good one.", "You too, bye."],
]

const STT_MODELS = ["nova-2", "nova-3", "whisper-large-v3"]
const LLM_MODELS = ["gpt-4o-mini", "claude-haiku-4.5", "gpt-4o"]
const TTS_MODELS = ["eleven_turbo_v2", "sonic-english", "aura-asteria"]

function sttPayload(text: string, rnd: () => number, model: string) {
  const words = text.split(" ")
  return {
    type: "Results",
    is_final: true,
    channel: {
      alternatives: [
        {
          transcript: text,
          confidence: Number((0.88 + rnd() * 0.11).toFixed(3)),
          words: words.slice(0, 4).map((w, i) => ({
            word: w.toLowerCase().replace(/[^a-z0-9']/g, ""),
            start: Number((i * 0.31).toFixed(2)),
            end: Number((i * 0.31 + 0.28).toFixed(2)),
            confidence: Number((0.9 + rnd() * 0.09).toFixed(3)),
          })),
        },
      ],
    },
    model,
  }
}

function llmPayload(userText: string, agentText: string, rnd: () => number, model: string) {
  const promptTokens = 420 + Math.round(rnd() * 260)
  const completionTokens = Math.max(8, Math.round(agentText.length / 3.6))
  return {
    request: {
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: "You are Aria, a voice agent for Acme Support. Be concise…" },
        { role: "user", content: userText },
      ],
      stream: true,
    },
    response: {
      choices: [{ message: { role: "assistant", content: agentText }, finish_reason: "stop" }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    },
  }
}

function ttsPayload(text: string, rnd: () => number, model: string) {
  return {
    request: { model_id: model, voice_id: "21m00Tcm4TlvDq8ikWAM", text, output_format: "pcm_16000" },
    response: {
      audio_bytes: 12000 + Math.round(rnd() * 40000),
      sample_rate: 16000,
      chunks: 3 + Math.round(rnd() * 6),
    },
  }
}

// ─── build ───────────────────────────────────────────────────────────────────

const CHANNELS: SessionChannel[] = ["phone", "web", "chat", "sip"]

/** Channel is derived from the id so a session's identity is stable and the
 *  list and the detail view never disagree about what kind of run it was. */
export function channelForSession(id: string): SessionChannel {
  const rnd = seeded(id + "chan")
  return CHANNELS[Math.floor(rnd() * CHANNELS.length)]
}

export function buildSessionTrace(input: {
  id: string
  agent: string
  startTime: string
  durationSec: number
  status: "Completed" | "Failed"
}): SessionTrace {
  const { id, agent, startTime, durationSec, status } = input
  const rnd = seeded(id + "trace")
  const channel = channelForSession(id)

  const stt = STT_MODELS[Math.floor(rnd() * STT_MODELS.length)]
  const llm = LLM_MODELS[Math.floor(rnd() * LLM_MODELS.length)]
  const tts = TTS_MODELS[Math.floor(rnd() * TTS_MODELS.length)]

  // A failed session dropped early — one greeting turn, no user reply.
  const pairCount = status === "Failed" ? 1 : 3 + Math.floor(rnd() * (EXCHANGES.length - 3))

  const turns: SessionTurn[] = []
  let at = 0
  for (let i = 0; i < pairCount; i++) {
    const [agentLine, userLine] = EXCHANGES[i % EXCHANGES.length]

    // Agent turn — carries the trace (the user turn is just input).
    const vad = 120 + Math.round(rnd() * 90)
    const asr = 90 + Math.round(rnd() * 170)
    const llmMs = 190 + Math.round(rnd() * 430)
    const ttsMs = 70 + Math.round(rnd() * 150)
    const net = 30 + Math.round(rnd() * 60)

    // A tool call on roughly a third of turns — and occasionally a slow one,
    // which is the case the whole waterfall exists to make visible.
    const hasTool = rnd() > 0.66
    const toolMs = hasTool ? (rnd() > 0.75 ? 1400 + Math.round(rnd() * 3200) : 180 + Math.round(rnd() * 500)) : 0

    let cursor = 0
    const spans: TraceSpan[] = []
    const push = (
      key: TraceSpan["key"], label: string, d: number,
      opts?: { measured?: boolean; detail?: string },
    ) => {
      spans.push({ key, label, startMs: cursor, durationMs: d, measured: opts?.measured ?? true, detail: opts?.detail })
      cursor += d
    }
    push("vad", "Endpointing", vad)
    push("asr", "STT", asr)
    // Network is modeled, not reported per-hop by the Engine — say so.
    push("net", "Network", Math.round(net / 2), { measured: false })
    push("llm", "LLM", llmMs)
    if (hasTool) push("tool", "Tool call", toolMs, { detail: rnd() > 0.5 ? "crm.lookup_order" : "calendar.check_availability" })
    push("tts", "TTS", ttsMs)

    turns.push({
      index: turns.length + 1,
      atSec: at,
      speaker: "Agent",
      text: agentLine,
      e2eMs: cursor,
      spans,
      payloads: {
        stt: i === 0 ? undefined : sttPayload(EXCHANGES[(i - 1) % EXCHANGES.length][1], rnd, stt),
        llm: llmPayload(i === 0 ? "(session start)" : EXCHANGES[(i - 1) % EXCHANGES.length][1], agentLine, rnd, llm),
        tts: ttsPayload(agentLine, rnd, tts),
      },
    })
    at += 3 + Math.round(rnd() * 4)

    if (status === "Failed") break

    turns.push({
      index: turns.length + 1,
      atSec: at,
      speaker: "Customer",
      text: userLine,
      e2eMs: 0,
      spans: [],
      payloads: {},
    })
    at += 2 + Math.round(rnd() * 4)
  }

  // Mark the slowest agent turn — the thing a developer is hunting for.
  const agentTurns = turns.filter((t) => t.speaker === "Agent")
  const maxMs = agentTurns.reduce((m, t) => Math.max(m, t.e2eMs), 0)
  const slow = agentTurns.find((t) => t.e2eMs === maxMs)
  if (slow) slow.slowest = true

  const sorted = agentTurns.map((t) => t.e2eMs).sort((a, b) => a - b)
  const totalAvg = sorted.reduce((a, b) => a + b, 0) / (sorted.length || 1)

  const componentKeys: TraceSpan["key"][] = ["vad", "asr", "net", "llm", "tool", "tts"]
  const byComponent = componentKeys
    .map((key) => {
      const vals = agentTurns.map((t) => t.spans.find((s) => s.key === key)?.durationMs ?? 0)
      const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
      // A span the session never produced (no tool ran) must not render a 0%
      // segment or a legend row promising a hop that didn't happen.
      const label = agentTurns.flatMap((t) => t.spans).find((s) => s.key === key)?.label ?? key
      return {
        key,
        label,
        avgMs: Math.round(avg),
        pct: totalAvg ? Math.round((avg / totalAvg) * 100) : 0,
      }
    })
    .filter((c) => c.avgMs > 0)

  const endpoint: SessionTrace["endpoint"] =
    channel === "phone" || channel === "sip"
      ? [
          { label: "From", value: "+1 (415) 555-0142" },
          { label: "To", value: "+1 (628) 555-0187" },
          { label: "Transport", value: channel === "sip" ? "SIP · direct connect" : "PSTN" },
        ]
      : channel === "web"
        ? [
            { label: "Origin", value: "https://acme.example.com/support" },
            { label: "Client", value: "Web SDK 4.21 · Chrome 141" },
            { label: "Transport", value: "WebRTC" },
          ]
        : [
            { label: "Surface", value: "Support widget" },
            { label: "Client", value: "Chat SDK 2.3" },
            { label: "Transport", value: "WebSocket" },
          ]

  const REGIONS = ["us-west-2", "us-east-1", "eu-central-1", "ap-southeast-1"]
  const correlation: SessionTrace["correlation"] = [
    { label: "Channel name", value: `agora_conv_${id.slice(0, 9).toLowerCase().replace(/-/g, "")}`, copyable: true },
    { label: "Agent UID", value: String(100000 + Math.floor(rnd() * 899999)), copyable: true },
    { label: "Region", value: REGIONS[Math.floor(rnd() * REGIONS.length)] },
    { label: "SDK", value: channel === "web" ? "Web SDK 4.21.0" : "Convo AI Engine 1.8.2" },
    { label: "Models", value: `${stt} · ${llm} · ${tts}` },
  ]

  return {
    id,
    agent,
    channel,
    startTime,
    durationSec,
    status,
    turns,
    correlation,
    stats: {
      turnCount: agentTurns.length,
      p50Ms: Math.round(pct(sorted, 50)),
      p95Ms: Math.round(pct(sorted, 95)),
      maxMs,
      byComponent,
    },
    endpoint,
  }
}

// ─── the session list (moved out of the page so the detail route shares it) ──

export interface AgentSession {
  id: string
  agent: string
  startTime: string
  durationLabel: string
  durationSec: number
  status: "Completed" | "Failed"
  channel: SessionChannel
  /** p95 response time for the run — triage happens in the LIST, so the number
   *  that decides "is this the row I should open?" has to be ON the row. */
  p95Ms: number
  /** Why a failed session ended. A failed CALL already got a reason; a failed
   *  session showed "≤ 0s" and nothing (focus group S2). */
  endReason?: string
}

const END_REASONS = [
  "No audio received",
  "STT provider error",
  "Concurrency limit reached",
  "Caller hung up during greeting",
]

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
function seg(n: number, len = 4): string {
  let s = ""
  for (let i = 0; i < len; i++) s += CHARS[(n * 7 + i * 13) % CHARS.length]
  return s
}

function genSessions(): AgentSession[] {
  const agents = ["Customer Support Agent", "Sales Sam", "Support Bot v2", "Sales Qualifier", "Aria"]
  const dates = [
    "Nov 15, 2025, 04:00 PM", "Nov 10, 2025, 09:00 PM", "Oct 20, 2025, 09:00 AM",
    "Oct 15, 2025, 10:00 AM", "Oct 06, 2025, 02:00 PM",
  ]
  // Sessions only exist where deployments have carried traffic. A brand-new
  // zero-traffic account therefore genuinely sees the first-run empty state.
  const totalCalls = DEPLOYMENTS.reduce((sum, d) => sum + d.metrics.calls, 0)
  if (totalCalls === 0) return []
  const count = Math.min(64, Math.max(8, Math.round(totalCalls / 400)))

  const out: AgentSession[] = []
  for (let i = 1; i <= count; i++) {
    const status: AgentSession["status"] = (i * 5) % 7 === 0 ? "Failed" : "Completed"
    const mins = (i % 5) + 1
    const id = `${seg(i)}-${seg(i + 1)}-${seg(i + 2)}-${seg(i + 3, 5)}`
    const durationSec = status === "Failed" ? 0 : mins * 60
    // Derive p95 from the SAME trace builder the detail view uses, so the list
    // number and the detail number can never disagree.
    const trace = buildSessionTrace({
      id, agent: agents[i % agents.length], startTime: dates[i % dates.length], durationSec, status,
    })
    out.push({
      id,
      agent: agents[i % agents.length],
      startTime: dates[i % dates.length],
      durationLabel: status === "Failed" ? "≤ 0s" : `≤ ${mins}m`,
      durationSec,
      status,
      channel: channelForSession(id),
      p95Ms: trace.stats.p95Ms,
      endReason: status === "Failed" ? END_REASONS[i % END_REASONS.length] : undefined,
    })
  }
  return out
}

export const SESSIONS: AgentSession[] = genSessions()

export function getSession(id: string): AgentSession | undefined {
  return SESSIONS.find((s) => s.id === id)
}

/** The full trace for a listed session — the detail route's one entry point. */
export function getSessionTrace(id: string): SessionTrace | undefined {
  const s = getSession(id)
  if (!s) return undefined
  return buildSessionTrace({
    id: s.id,
    agent: s.agent,
    startTime: s.startTime,
    durationSec: s.durationSec,
    status: s.status,
  })
}

/** Colour + label per span key — one source so the waterfall, the legend, and
 *  the component roll-up never drift. Design tokens only. */
export const SPAN_STYLE: Record<TraceSpan["key"], { bar: string; text: string; dot: string }> = {
  vad: { bar: "bg-muted-foreground/40", text: "text-muted-foreground", dot: "bg-muted-foreground/40" },
  asr: { bar: "bg-primary", text: "text-primary", dot: "bg-primary" },
  net: { bar: "bg-border", text: "text-muted-foreground", dot: "bg-border" },
  llm: { bar: "bg-chart-3", text: "text-chart-3", dot: "bg-chart-3" },
  tool: { bar: "bg-chart-2", text: "text-chart-2", dot: "bg-chart-2" },
  tts: { bar: "bg-warning", text: "text-warning", dot: "bg-warning" },
}

/** Which builder control fixes a slow span — the remediation loop the focus
 *  group called the one genuinely differentiating move ("click the LLM bar,
 *  land on the model picker"). `undefined` = nothing the user can change. */
export const SPAN_FIX: Partial<Record<TraceSpan["key"], { label: string; href: string }>> = {
  asr: { label: "Change the STT model", href: "/agents?section=voice" },
  llm: { label: "Change the LLM", href: "/agents?section=voice" },
  tts: { label: "Change the voice", href: "/agents?section=voice" },
  tool: { label: "Review tools", href: "/agents?section=context" },
}

/** The whole session as one downloadable object — "I'll grep it" (D3). */
export function traceToJson(trace: SessionTrace): string {
  return JSON.stringify(trace, null, 2)
}

/** The latency budget a developer is judged against — under this is good.
 *  Wireframe target; Agora publishes sub-second conversational latency as the
 *  Convo AI Engine goal. */
export const LATENCY_TARGET_MS = 1000
