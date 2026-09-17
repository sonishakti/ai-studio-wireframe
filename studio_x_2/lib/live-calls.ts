/**
 * Live calls, and what an operator may do to one (design 12).
 *
 * The field splits cleanly in two. Retell and LiveKit both ship a table of
 * what is happening now, and LiveKit is the only one that treats freshness as
 * a control rather than a promise: its sessions list carries an explicit
 * "Auto-refresh off". Vapi ships no live table worth the name, but it is the
 * only one that documents the verbs, because they are an API: `say`,
 * `control: mute-assistant`, `end-call`, `transfer`, and a `listenUrl`
 * websocket for the audio.
 *
 * So: the table from Retell, the honest clock from LiveKit, the verbs from
 * Vapi's control API, and the thing none of them has, which is a reason to
 * look at one row rather than all of them.
 */

import { AGENTS } from "@/lib/campaign-data"

export type CallState = "ringing" | "listening" | "thinking" | "speaking" | "on hold"

/** Why this row is worth an operator's attention. Absent = it is going fine. */
export type CallRisk = "silence" | "repeating" | "asked for a person" | "long"

export interface LiveTurn {
  role: "caller" | "agent"
  text: string
  /** Seconds into the call. */
  at: number
}

export interface LiveCall {
  id: string
  agentId: string
  agentName: string
  direction: "inbound" | "outbound"
  from: string
  to: string
  /** Seconds elapsed. */
  elapsed: number
  state: CallState
  /** Round trip on the last turn. */
  latencyMs: number
  risk?: CallRisk
  /** The operator muted the agent and is on the line. */
  operatorJoined?: boolean
  turns: LiveTurn[]
}

const NAMES = AGENTS.map((a) => ({ id: a.id, name: a.name }))
const agentAt = (i: number) => NAMES[i % Math.max(1, NAMES.length)] ?? { id: "agt_default", name: "Agent" }

/**
 * A deterministic set with one call of each shape, so every state in the design
 * is reachable without waiting for a real caller to misbehave.
 */
const SEED: Omit<LiveCall, "agentId" | "agentName">[] = [
  {
    id: "call_live_01",
    direction: "inbound",
    from: "+1 415 555 0142",
    to: "+1 415 555 0134",
    elapsed: 78,
    state: "speaking",
    latencyMs: 620,
    turns: [
      { role: "agent", at: 2, text: "Thanks for calling Northwind. What can I help with?" },
      { role: "caller", at: 9, text: "I need to move my delivery to Thursday." },
      { role: "agent", at: 12, text: "I can do that. Can I take the order number?" },
      { role: "caller", at: 20, text: "It's 44-118-203." },
      { role: "agent", at: 24, text: "Got it. Moving that to Thursday the 19th." },
    ],
  },
  {
    id: "call_live_02",
    direction: "inbound",
    from: "+44 20 7946 0810",
    to: "+1 415 555 0134",
    elapsed: 214,
    state: "listening",
    latencyMs: 540,
    risk: "asked for a person",
    turns: [
      { role: "caller", at: 140, text: "No, that's not what I asked." },
      { role: "agent", at: 145, text: "I'm sorry. Let me try again." },
      { role: "caller", at: 160, text: "Can I talk to a human please?" },
      { role: "agent", at: 166, text: "I can help with delivery and billing questions." },
      { role: "caller", at: 178, text: "A person. Please." },
    ],
  },
  {
    id: "call_live_03",
    direction: "outbound",
    from: "+1 415 555 0134",
    to: "+1 206 555 0199",
    elapsed: 41,
    state: "listening",
    latencyMs: 480,
    risk: "silence",
    turns: [
      { role: "agent", at: 3, text: "Hi, this is a reminder about your appointment tomorrow." },
      { role: "caller", at: 8, text: "Oh. Hold on." },
    ],
  },
  {
    id: "call_live_04",
    direction: "outbound",
    from: "+1 415 555 0134",
    to: "+1 312 555 0165",
    elapsed: 9,
    state: "ringing",
    latencyMs: 0,
    turns: [],
  },
  {
    id: "call_live_05",
    direction: "inbound",
    from: "+61 2 8103 4401",
    to: "+1 415 555 0134",
    elapsed: 512,
    state: "thinking",
    latencyMs: 1840,
    risk: "long",
    turns: [
      { role: "caller", at: 488, text: "And what about the second invoice?" },
      { role: "agent", at: 494, text: "Let me check that one." },
    ],
  },
]

export function liveCalls(): LiveCall[] {
  return SEED.map((c, i) => ({ ...c, agentId: agentAt(i).id, agentName: agentAt(i).name }))
}

/** How many callers are holding because every line is busy. */
export function queuedCallers(active: number, lines: number): number {
  return Math.max(0, active - lines)
}

// ─── what an operator may do ─────────────────────────────────────────────────

export type VerbId = "listen" | "say" | "takeover" | "end"

export interface OperatorVerb {
  id: VerbId
  label: string
  /** What the CALLER experiences, which is the part an operator needs to know. */
  help: string
  /** A verb the caller can tell happened needs a deliberate second action. */
  confirm: boolean
}

/**
 * Written from the caller's side, not the console's. "Take over" tells an
 * operator nothing about whether the caller hears a click; "the agent stops
 * speaking mid-sentence" tells them exactly what they are about to do.
 */
export const OPERATOR_VERBS: OperatorVerb[] = [
  {
    id: "listen",
    label: "Listen",
    help: "You hear the call. Nobody hears you, and nothing changes for the caller.",
    confirm: false,
  },
  {
    id: "say",
    label: "Put words in",
    help: "The agent speaks your line, in its own voice, at the next gap.",
    confirm: false,
  },
  {
    id: "takeover",
    label: "Take over",
    help: "The agent stops speaking at once, mid-sentence if it is talking, and you are on the line.",
    confirm: true,
  },
  {
    id: "end",
    label: "End the call",
    help: "The line drops for the caller.",
    confirm: true,
  },
]

export const verb = (id: VerbId) => OPERATOR_VERBS.find((v) => v.id === id)!

/** One line under the risk badge: why this row, in the caller's words. */
export function riskLine(c: LiveCall): string | null {
  switch (c.risk) {
    case "asked for a person": return "The caller has asked for a person twice."
    case "silence": return "Nobody has spoken for 33 seconds."
    case "repeating": return "The agent has said the same thing three times."
    case "long": return "Past 8 minutes, and still working."
    default: return null
  }
}

export const mmss = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`
