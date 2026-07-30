/**
 * SIP signaling trace — the ladder diagram behind a telephony call.
 *
 * Q3 roadmap, two P0s due 2026-08: "Add SIP signaling visual ladder diagrams"
 * and "Surface SIP error codes and CPS-limit failures in Studio".
 *
 * The message sequence and the response codes here are RFC 3261, not design
 * choices — the design work is in `explain`, which turns a bare code into
 * something a developer who is not a telecom engineer can act on, and in
 * `blame`, which says whose side the fault sits on. A 503 from the carrier and
 * a 503 from our own capacity ceiling need completely different responses, and
 * the code alone can't tell you which you're looking at.
 *
 * Seeded off the call id so a call always renders the same ladder.
 */

export type SipParty = "caller" | "carrier" | "agora" | "agent"

export const SIP_PARTY_LABEL: Record<SipParty, string> = {
  caller: "Caller",
  carrier: "Carrier / ITSP",
  agora: "Agora SBC",
  agent: "Agent",
}

export interface SipMessage {
  /** ms from the start of the dialog. */
  atMs: number
  from: SipParty
  to: SipParty
  /** "INVITE" for requests, "200 OK" / "503 Service Unavailable" for responses. */
  label: string
  kind: "request" | "provisional" | "success" | "failure"
  /** SIP response code, when this is a response. */
  code?: number
  /** Raw headers, shown on expand. Verbatim shape matters to the audience. */
  headers: string[]
}

export interface SipTrace {
  callId: string
  /** The SIP Call-ID header — what a carrier support ticket asks for. */
  sipCallId: string
  parties: SipParty[]
  messages: SipMessage[]
  /** Terminal outcome of the dialog. */
  outcome: "answered" | "failed" | "busy" | "no-answer" | "cancelled"
  /** Set when the dialog ended on a failure response. */
  failure?: SipFailure
  /** Post-Dial Delay — INVITE to the first ringing/answer signal. */
  pddMs: number
}

export interface SipFailure {
  code: number
  reason: string
  /** Plain language: what actually happened, for a non-telecom developer. */
  explain: string
  /** Whose side the fault sits on — the single most useful thing to state. */
  blame: "your-config" | "carrier" | "callee" | "agora-capacity"
  /** What to do about it. */
  fix: string
  /** Where the fix lives, when there is a surface for it. */
  fixHref?: string
}

/**
 * The response codes worth explaining. Deliberately NOT the whole RFC table —
 * a 40-row dictionary of codes nobody hits is noise. These are the ones a
 * voice-agent deployment actually produces.
 */
export const SIP_FAILURES: Record<number, Omit<SipFailure, "code">> = {
  403: {
    reason: "Forbidden",
    explain: "The carrier rejected the call before it was routed. Almost always an authentication or IP-allowlist problem on the trunk, not something about this particular call.",
    blame: "your-config",
    fix: "Check the trunk credentials and confirm our signaling IP is allowlisted with your carrier.",
    fixHref: "/deploy/telephony",
  },
  404: {
    reason: "Not Found",
    explain: "The number you dialled isn't routable — either it doesn't exist or the carrier has no route to it.",
    blame: "your-config",
    fix: "Verify the number is in E.164 format and that your trunk covers that destination.",
    fixHref: "/deploy/phone-numbers",
  },
  408: {
    reason: "Request Timeout",
    explain: "We sent the INVITE and nothing came back in time. Usually the far end is unreachable or signalling is being dropped in transit.",
    blame: "carrier",
    fix: "Retry. If it repeats on one destination, raise it with your carrier and quote the SIP Call-ID.",
  },
  480: {
    reason: "Temporarily Unavailable",
    explain: "The line exists but isn't accepting calls right now — phone off, out of coverage, or forwarded to nothing.",
    blame: "callee",
    fix: "Nothing to fix on your side. Retry later, or let the batch queue handle the retry.",
  },
  486: {
    reason: "Busy Here",
    explain: "The person you called is on another call.",
    blame: "callee",
    fix: "Nothing to fix. Retry later.",
  },
  487: {
    reason: "Request Terminated",
    explain: "The call was cancelled before it was answered — normally because our side gave up first, or the caller hung up during ringing.",
    blame: "callee",
    fix: "If this is frequent on outbound, your ring timeout may be too short.",
    fixHref: "/deploy/batch-calls",
  },
  503: {
    reason: "Service Unavailable",
    explain: "Capacity was refused. This is the one code that means two very different things — see whether it came from your carrier's trunk or from our own concurrency ceiling.",
    blame: "agora-capacity",
    fix: "If it's our ceiling, add concurrent lines. If it's the trunk, raise the channel limit with your carrier.",
    fixHref: "/billing/usage",
  },
  603: {
    reason: "Decline",
    explain: "The far end actively rejected the call. On mobile this is usually the person pressing decline; on a business line it can be a call blocker.",
    blame: "callee",
    fix: "Nothing to fix. Repeated declines to the same list may indicate a spam-labelling problem.",
  },
}

/** CPS = calls per second. Distinct from concurrency (calls at once), and the
 *  two get confused constantly — a trunk can allow 100 simultaneous calls but
 *  only 5 new ones per second. Exceeding it produces a 503 that looks like a
 *  capacity problem but is a RATE problem, and adding lines won't fix it. */
export interface CpsState {
  limit: number
  peak: number
  /** Calls rejected for exceeding the rate in the current window. */
  throttled: number
  windowLabel: string
}

export const CPS_STATE: CpsState = {
  limit: 10,
  peak: 8,
  throttled: 0,
  windowLabel: "last 24h",
}

// ─── seeded build ────────────────────────────────────────────────────────────

function seeded(id: string): () => number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) }
  let s = h >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hex = (rnd: () => number, n: number) =>
  Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(rnd() * 16)]).join("")

/** Failure codes weighted the way real traffic fails, so the demo isn't a
 *  uniform sample of the RFC. */
const FAILURE_POOL = [486, 480, 603, 408, 503, 403, 404]

export function buildSipTrace(input: {
  callId: string
  direction: "Inbound" | "Outbound"
  failed: boolean
  from: string
  to: string
}): SipTrace {
  const { callId, direction, failed, from, to } = input
  const rnd = seeded(callId + "sip")
  const sipCallId = `${hex(rnd, 12)}@sbc-${["us-west", "us-east", "eu-central"][Math.floor(rnd() * 3)]}.agora.io`
  const branch = `z9hG4bK${hex(rnd, 10)}`
  const tagA = hex(rnd, 8)
  const tagB = hex(rnd, 8)

  // Inbound: caller → carrier → us. Outbound: us → carrier → callee.
  const parties: SipParty[] = direction === "Inbound"
    ? ["caller", "carrier", "agora", "agent"]
    : ["agent", "agora", "carrier", "caller"]

  const originator: SipParty = direction === "Inbound" ? "carrier" : "agora"
  const terminator: SipParty = direction === "Inbound" ? "agora" : "carrier"

  const messages: SipMessage[] = []
  let t = 0
  const push = (m: Omit<SipMessage, "atMs">) => { messages.push({ ...m, atMs: t }) }

  const commonHeaders = (method: string) => [
    `${method} sip:${to.replace(/[^\d+]/g, "")}@sbc.agora.io SIP/2.0`,
    `Via: SIP/2.0/UDP ${direction === "Inbound" ? "203.0.113.42" : "198.51.100.7"}:5060;branch=${branch}`,
    `From: <sip:${from.replace(/[^\d+]/g, "")}@carrier.example.net>;tag=${tagA}`,
    `To: <sip:${to.replace(/[^\d+]/g, "")}@sbc.agora.io>`,
    `Call-ID: ${sipCallId}`,
    `CSeq: 1 ${method}`,
    `Contact: <sip:${from.replace(/[^\d+]/g, "")}@203.0.113.42:5060>`,
    `Content-Type: application/sdp`,
  ]

  push({ from: originator, to: terminator, label: "INVITE", kind: "request", headers: commonHeaders("INVITE") })
  t += 12 + Math.round(rnd() * 20)
  push({
    from: terminator, to: originator, label: "100 Trying", kind: "provisional", code: 100,
    headers: [`SIP/2.0 100 Trying`, `Call-ID: ${sipCallId}`, `CSeq: 1 INVITE`],
  })

  if (failed) {
    const code = FAILURE_POOL[Math.floor(rnd() * FAILURE_POOL.length)]
    const meta = SIP_FAILURES[code]
    // 486/480/603 come after ringing; the rest fail before it.
    const rangAlready = code === 486 || code === 480 || code === 603
    let pddMs = 0
    if (rangAlready) {
      t += 180 + Math.round(rnd() * 700)
      pddMs = t
      push({
        from: terminator, to: originator, label: "180 Ringing", kind: "provisional", code: 180,
        headers: [`SIP/2.0 180 Ringing`, `Call-ID: ${sipCallId}`, `To: <sip:…>;tag=${tagB}`],
      })
      t += 1200 + Math.round(rnd() * 4000)
    } else {
      t += 60 + Math.round(rnd() * 240)
      pddMs = t
    }
    push({
      from: terminator, to: originator, label: `${code} ${meta.reason}`, kind: "failure", code,
      headers: [
        `SIP/2.0 ${code} ${meta.reason}`,
        `Call-ID: ${sipCallId}`,
        `CSeq: 1 INVITE`,
        ...(code === 503 ? [`Retry-After: ${5 + Math.round(rnd() * 25)}`] : []),
        ...(code === 403 ? [`Warning: 399 sbc "Source IP not in allowlist"`] : []),
      ],
    })
    t += 8 + Math.round(rnd() * 14)
    push({
      from: originator, to: terminator, label: "ACK", kind: "request",
      headers: [`ACK sip:… SIP/2.0`, `Call-ID: ${sipCallId}`, `CSeq: 1 ACK`],
    })

    return {
      callId, sipCallId, parties, messages, pddMs,
      outcome: code === 486 ? "busy" : code === 480 || code === 408 ? "no-answer" : code === 487 ? "cancelled" : "failed",
      failure: { code, ...meta },
    }
  }

  // Answered flow.
  t += 150 + Math.round(rnd() * 600)
  const pddMs = t
  push({
    from: terminator, to: originator, label: "180 Ringing", kind: "provisional", code: 180,
    headers: [`SIP/2.0 180 Ringing`, `Call-ID: ${sipCallId}`, `To: <sip:…>;tag=${tagB}`],
  })
  t += 700 + Math.round(rnd() * 2600)
  push({
    from: terminator, to: originator, label: "200 OK", kind: "success", code: 200,
    headers: [
      `SIP/2.0 200 OK`, `Call-ID: ${sipCallId}`, `CSeq: 1 INVITE`,
      `Contact: <sip:agent@sbc.agora.io:5060>`, `Content-Type: application/sdp`,
      `v=0`, `m=audio 49170 RTP/AVP 0 101`, `a=sendrecv`,
    ],
  })
  t += 10 + Math.round(rnd() * 25)
  push({
    from: originator, to: terminator, label: "ACK", kind: "request",
    headers: [`ACK sip:… SIP/2.0`, `Call-ID: ${sipCallId}`, `CSeq: 1 ACK`],
  })
  // The agent leg only exists once the media path is up.
  t += 30 + Math.round(rnd() * 60)
  push({
    from: direction === "Inbound" ? "agora" : "agora",
    to: direction === "Inbound" ? "agent" : "agent",
    label: "Agent joined", kind: "success",
    headers: [`Conversational AI Engine: agent attached to the media path`],
  })

  t += 20000 + Math.round(rnd() * 90000)
  const byeFrom: SipParty = rnd() > 0.5 ? originator : terminator
  push({
    from: byeFrom, to: byeFrom === originator ? terminator : originator,
    label: "BYE", kind: "request",
    headers: [`BYE sip:… SIP/2.0`, `Call-ID: ${sipCallId}`, `CSeq: 2 BYE`],
  })
  t += 8 + Math.round(rnd() * 16)
  push({
    from: byeFrom === originator ? terminator : originator, to: byeFrom,
    label: "200 OK", kind: "success", code: 200,
    headers: [`SIP/2.0 200 OK`, `Call-ID: ${sipCallId}`, `CSeq: 2 BYE`],
  })

  return { callId, sipCallId, parties, messages, outcome: "answered", pddMs }
}

/** Who to point at, in words. The code alone never answers "is this mine?". */
export const BLAME_LABEL: Record<SipFailure["blame"], string> = {
  "your-config": "Your configuration",
  carrier: "Your carrier",
  callee: "The person you called",
  "agora-capacity": "Capacity",
}
