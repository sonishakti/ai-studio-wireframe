/**
 * Transcript ↔ recording alignment — the one clock behind a replay.
 *
 * Design Tracker 10 (Session & call logs), verdict "A · Aligned replay":
 * the player and the transcript share one clock. Each line carries a time
 * when the Engine reported one (`speech_start_ms`, v2.8 — only when
 * `llm.vendor='custom'`), and the badge words come from the Engine's own
 * turn-end enum (`turns[].end.type`: ok · interrupted · ignored · error).
 *
 * Honesty floor: a call without alignment data is `untimed` — a dead time
 * column and one stated line, never interpolated timestamps. In the wireframe
 * the timed / untimed split is seeded off the call id so the same call always
 * renders the same way.
 */

export type ReplayBadge = "greeting" | "interrupted" | "ignored" | "error"

export interface ReplayLine {
  index: number
  speaker: "Agent" | "Customer"
  text: string
  /** Seconds from the start of the recording. Absent on an untimed call. */
  atSec?: number
  badge?: ReplayBadge
  /** The Engine's `caused_by` — shown as the chip's title. */
  badgeTitle?: string
}

export interface ReplayTimeline {
  alignment: "timed" | "untimed"
  lines: ReplayLine[]
  /** Line start times, for the turn map on the scrubber. Empty when untimed. */
  markers: number[]
}

/** The chip word per end type — always a word, never colour alone. */
export const BADGE_LABEL: Record<ReplayBadge, string> = {
  greeting: "Greeting",
  interrupted: "Interrupted",
  ignored: "Ignored",
  error: "Error",
}

/** The Engine's `caused_by` per end type, as the chip title. */
export const BADGE_TITLE: Partial<Record<ReplayBadge, string>> = {
  interrupted: "Customer started speaking",
  ignored: "Semantic end-of-speech: no reply needed",
  error: "LLM_REQUEST_ERR",
}

// ─── seeded RNG (same idiom as call-detail-sheet) ────────────────────────────

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

export function deriveReplayTimeline(input: {
  transcript: { speaker: "Agent" | "Customer"; text: string }[]
  durationSec: number
  callId: string
  /** Error end types only happen on failed calls. */
  failed?: boolean
}): ReplayTimeline {
  const { transcript, durationSec, callId, failed = false } = input
  const rnd = seeded(callId + "align")

  // ~75% of calls carry timestamps; the rest are the managed-vendor case
  // where the Engine never forwarded them. A call that never connected has no
  // clock to align to at all.
  const timed = durationSec > 0 && rnd() < 0.75
  const n = transcript.length

  // Spread the lines across the recording. The last line must start before
  // the recording ends, and the order is the transcript's — no line may start
  // before the one above it.
  const times: number[] = []
  if (timed && n > 0) {
    const slot = durationSec / (n + 0.5)
    let at = 0
    for (let i = 0; i < n; i++) {
      times.push(Math.min(durationSec - 1, Math.max(0, Math.round(at))))
      at += slot * (0.7 + rnd() * 0.6)
    }
    for (let i = 1; i < n; i++) if (times[i] < times[i - 1]) times[i] = times[i - 1]
  }

  // Badges: the first agent line is the greeting; at most one interrupted, one
  // ignored, and (failed calls only) one error, each on a distinct agent line.
  const agentIdx = transcript.map((t, i) => (t.speaker === "Agent" ? i : -1)).filter((i) => i >= 0)
  const badges = new Map<number, ReplayBadge>()
  if (agentIdx.length > 0) badges.set(agentIdx[0], "greeting")
  const free = agentIdx.slice(1)
  const take = (): number | undefined => {
    if (free.length === 0) return undefined
    return free.splice(Math.floor(rnd() * free.length), 1)[0]
  }
  const wantInterrupted = rnd() < 0.4
  const wantIgnored = rnd() < 0.3
  if (wantInterrupted) { const i = take(); if (i != null) badges.set(i, "interrupted") }
  if (wantIgnored) { const i = take(); if (i != null) badges.set(i, "ignored") }
  if (failed) {
    // The error sits on the last free agent line — a failed call ends there.
    const i = free.length > 0 ? free[free.length - 1] : undefined
    if (i != null) badges.set(i, "error")
  }

  const lines: ReplayLine[] = transcript.map((t, i) => {
    const badge = badges.get(i)
    return {
      index: i,
      speaker: t.speaker,
      text: t.text,
      ...(timed ? { atSec: times[i] } : {}),
      ...(badge ? { badge, badgeTitle: BADGE_TITLE[badge] } : {}),
    }
  })

  return {
    alignment: timed ? "timed" : "untimed",
    lines,
    markers: timed ? times : [],
  }
}

// ─── export formats (built client-side, no backend call) ─────────────────────

export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

/** One line per turn: `[mm:ss] Speaker: text` (time omitted when untimed). */
export function timelineToTxt(timeline: ReplayTimeline): string {
  return timeline.lines
    .map((l) => `${l.atSec != null ? `[${fmtClock(l.atSec)}] ` : ""}${l.speaker}: ${l.text}`)
    .join("\n")
}

export function timelineToJson(timeline: ReplayTimeline, meta: Record<string, unknown> = {}): string {
  return JSON.stringify({ ...meta, alignment: timeline.alignment, lines: timeline.lines }, null, 2)
}
