/**
 * Studio_X — Monitor derivation
 * ──────────────────────────────
 *
 * ONE derivation behind every number on Monitor (design 13, direction C: name
 * the number before you watch it), so the call count, the answered count, the
 * rate, the outcome bar and the deployment chips can no longer disagree on one
 * screen. Today the page holds them as four string literals that contradict
 * each other: "120 / 208" beside a 95 percent answer rate, and a donut centre
 * of 4,000 over deployments that sum to 11,383.
 *
 * Totals are DATA. Each deployment's own `metrics.calls`, `metrics.answered`
 * and `metrics.avgHandleTimeSec` are distributed across a fixed 90-day hourly
 * series with the seeded FNV-1a idiom `lib/diagnostics.ts:96` uses, so:
 *
 *   • the range select is real — a window sums the buckets inside it;
 *   • the numbers are stable across renders (never Math.random in render);
 *   • the 90-day range spans the WHOLE series, so it has no prior window and
 *     the tile says so rather than inventing one;
 *   • summing the whole series returns the seed exactly — 11,383 calls, 6,831
 *     answered, 8 of 12 deployments carrying traffic.
 *
 * It invents no metric: every key maps to a field the Studio telephony
 * aggregate really returns (totalCalls, totalAnswered, totalAnswerRate,
 * avgAnsweredDuration). Handle time aggregates weighted by ANSWERED CALLS,
 * never by deployment. Answer speed is deliberately not a key — a call carries
 * create_ts and stop_ts and nothing between them — so it keeps a row on the
 * page and no number (`ANSWER_SPEED`).
 *
 * Why not extend lib/diagnostics.ts: that is a per-call rules engine over
 * synthetic signals; these are deployment-level aggregates.
 */

import {
  DEPLOYMENTS,
  getDeployment,
  type Deployment,
  type DeploymentKind,
} from "./campaign-data"

// ─── Keys ─────────────────────────────────────────────────────────────────────

export type MonitorRange = "24h" | "7d" | "30d" | "90d"

/** The four watchable numbers, all of them computable from the contract.
 *  Answer speed is NOT here on purpose: nothing may set a threshold on a number
 *  Agora cannot produce. */
export type MetricKey = "total_calls" | "answered_calls" | "answer_rate" | "handle_time"

export interface MonitorFilters {
  range: MonitorRange
  kind: DeploymentKind | "all"
  agentId: string | "all"
  deploymentId: string | "all"
}

export const METRIC_DEFS: Record<
  MetricKey,
  {
    label: string
    /** The one line the tile's Info tooltip carries (ticket 868ka69vr). */
    definition: string
    /** MetricCard's suffix slot. Left unset across the set: formatMetric already
     *  carries the unit inside the string (a percent sign, m:ss), and a suffix
     *  would repeat it. */
    unit?: string
    /** A count can be watched for silence; a rate cannot. */
    count: boolean
    /** The live Console builds the answer-rate card only for outbound, and
     *  TelephonyInboundAnalytics has no answer-rate field. */
    outboundOnly?: boolean
  }
> = {
  total_calls: {
    label: "Total calls",
    definition: "Every call that reached the agent in this range.",
    count: true,
  },
  answered_calls: {
    label: "Answered calls",
    definition: "Calls the agent picked up. Agora records two call states: answered and hung up.",
    count: true,
  },
  answer_rate: {
    label: "Answer rate",
    definition:
      "Answered calls divided by every call that reached the agent. Agora reports this for outbound calls only.",
    count: false,
    outboundOnly: true,
  },
  handle_time: {
    label: "Handle time",
    definition: "Average time from answer to hangup, across answered calls.",
    count: false,
  },
}

/** The fifth tile: a row, a definition and no number. Outside MetricKey so
 *  nothing in the product can watch it. */
export const ANSWER_SPEED: { label: string; definition: string } = {
  label: "Answer speed",
  definition: "A call records when it started and when it ended. Nothing records when it was picked up.",
}

// ─── The series ───────────────────────────────────────────────────────────────

const SERIES_HOURS = 90 * 24

const RANGE_HOURS: Record<MonitorRange, number> = {
  "24h": 24,
  "7d": 7 * 24,
  "30d": 30 * 24,
  "90d": SERIES_HOURS,
}

/** Sparkline points per range — a 2,160-bucket line is noise, not a trend. */
const SERIES_POINTS: Record<MonitorRange, number> = { "24h": 24, "7d": 28, "30d": 30, "90d": 30 }

/** Same FNV-1a style as lib/diagnostics.ts:96, so a deployment's shape is the
 *  same on every render and on every reload. */
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

/** Spread `total` over `weights` as whole units whose sum is EXACTLY `total`.
 *  Cumulative rounding, so the last bucket closes the books and no bucket goes
 *  negative. */
function allocate(total: number, weights: number[]): number[] {
  const out = new Array<number>(weights.length).fill(0)
  if (!(total > 0) || weights.length === 0) return out
  let sum = 0
  for (const w of weights) sum += w
  if (!(sum > 0)) { out[out.length - 1] = total; return out }
  let acc = 0
  let placed = 0
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]
    const upto = Math.round((acc / sum) * total)
    out[i] = upto - placed
    placed = upto
  }
  return out
}

interface DeploymentSeries {
  calls: number[]
  answered: number[]
  /** Talk seconds, so handle time can be re-averaged over any window. */
  handleSec: number[]
}

const SERIES_CACHE = new Map<string, DeploymentSeries>()

/** A deployment's own totals, read defensively: answered can never exceed the
 *  calls it came from. */
function totalsOf(d: Deployment): { calls: number; answered: number; handleSec: number } {
  const calls = Number.isFinite(d.metrics.calls) ? Math.max(0, Math.round(d.metrics.calls)) : 0
  const rawAnswered = d.metrics.answered
  const answered = Number.isFinite(rawAnswered) ? Math.min(calls, Math.max(0, Math.round(rawAnswered))) : 0
  const avg = Number.isFinite(d.metrics.avgHandleTimeSec) ? Math.max(0, d.metrics.avgHandleTimeSec) : 0
  return { calls, answered, handleSec: Math.round(answered * avg) }
}

function seriesFor(d: Deployment): DeploymentSeries {
  const cached = SERIES_CACHE.get(d.id)
  if (cached) return cached

  const { calls: callTotal, answered: answeredTotal, handleSec: handleTotal } = totalsOf(d)
  const rand = seeded(`${d.id}:monitor`)

  // Traffic shape: a working day inside a working week, jittered. The shape is
  // ours; the area under it is the deployment's own number.
  const weights = new Array<number>(SERIES_HOURS)
  for (let i = 0; i < SERIES_HOURS; i++) {
    const hourOfDay = i % 24
    const dayOfWeek = Math.floor(i / 24) % 7
    const daylight = 0.2 + 0.8 * (0.5 - 0.5 * Math.cos(((hourOfDay - 3) / 24) * Math.PI * 2))
    const weekday = dayOfWeek >= 5 ? 0.45 : 1
    weights[i] = daylight * weekday * (0.7 + 0.6 * rand())
  }

  const calls = allocate(callTotal, weights)

  // Answered rides the calls that produced it, jittered, so the rate moves hour
  // to hour without drifting off the deployment's real one. Allocating against
  // the running cumulative (rather than rounding each bucket on its own) is what
  // keeps the recent window honest: per-bucket rounding on a quiet deployment
  // rounds every small bucket to zero and then dumps the whole answered total
  // into the last few hours, which is the window the screen actually shows.
  const answeredWeights = calls.map((c) => (c > 0 ? c * (0.88 + 0.24 * rand()) : 0))
  const answered = allocate(answeredTotal, answeredWeights)
  // A bucket can never answer more calls than it took. Clamp, then hand the
  // remainder to the buckets with room, so the total still lands on the seed.
  let excess = 0
  for (let i = 0; i < SERIES_HOURS; i++) {
    if (answered[i] > calls[i]) { excess += answered[i] - calls[i]; answered[i] = calls[i] }
  }
  for (let i = 0; i < SERIES_HOURS && excess > 0; i++) {
    const room = calls[i] - answered[i]
    if (room <= 0) continue
    const put = Math.min(room, excess)
    answered[i] += put
    excess -= put
  }

  // Talk seconds follow the answered calls that produced them, so a bucket with
  // no answered call carries no seconds and the weighted mean over the whole
  // series is the deployment's own average, exactly.
  const handleWeights = answered.map((a) => (a > 0 ? a * (0.8 + 0.4 * rand()) : 0))
  const handleSec = allocate(handleTotal, handleWeights)

  const built: DeploymentSeries = { calls, answered, handleSec }
  SERIES_CACHE.set(d.id, built)
  return built
}

// ─── Windows ──────────────────────────────────────────────────────────────────

interface WindowTotals { calls: number; answered: number; handleSec: number }

const EMPTY: WindowTotals = { calls: 0, answered: 0, handleSec: 0 }

function sum(arr: number[], from: number, to: number): number {
  let out = 0
  for (let i = from; i < to; i++) out += arr[i]
  return out
}

/** Bounds of the window `offset` windows back from the end of the series, or
 *  null when it runs off the start (the 90-day range has no prior period). */
function bounds(hours: number, offset: number): { from: number; to: number } | null {
  const span = Math.max(1, Math.min(SERIES_HOURS, Math.round(hours)))
  const to = SERIES_HOURS - span * offset
  const from = to - span
  if (from < 0 || to <= 0) return null
  return { from, to }
}

function totalsOver(deployments: Deployment[], hours: number, offset: number): WindowTotals | null {
  const b = bounds(hours, offset)
  if (!b) return null
  const out: WindowTotals = { calls: 0, answered: 0, handleSec: 0 }
  for (const d of deployments) {
    const s = seriesFor(d)
    out.calls += sum(s.calls, b.from, b.to)
    out.answered += sum(s.answered, b.from, b.to)
    out.handleSec += sum(s.handleSec, b.from, b.to)
  }
  return out
}

/** One metric out of one window's totals. Null is a real answer: a rate with no
 *  calls behind it, or a handle time with no answered call behind it. */
function valueOf(key: MetricKey, t: WindowTotals, answerRateAvailable: boolean): number | null {
  switch (key) {
    case "total_calls":
      return t.calls
    case "answered_calls":
      return t.answered
    case "answer_rate":
      if (!answerRateAvailable || t.calls === 0) return null
      return (t.answered / t.calls) * 100
    case "handle_time":
      if (t.answered === 0) return null
      return t.handleSec / t.answered
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface MonitorSummary {
  /** Calls in the window, across the filtered deployments. */
  calls: number
  answered: number
  /** The second segment of the outcome bar: the contract carries answered and
   *  hangup and nothing that says who hung up. */
  noAnswer: number
  values: Record<MetricKey, number | null>
  series: Record<MetricKey, number[]>
  prior: Record<MetricKey, number | null>
  /** How many of the deployments in view have ever carried a call. */
  coverage: { counted: number; total: number }
  /** The filtered set itself, for the deployment chips and the watch's scope. */
  deployments: Deployment[]
}

function filterDeployments(f: MonitorFilters): Deployment[] {
  return DEPLOYMENTS.filter((d) => {
    if (f.kind !== "all" && d.kind !== f.kind) return false
    if (f.agentId !== "all" && d.agentId !== f.agentId) return false
    if (f.deploymentId !== "all" && d.id !== f.deploymentId) return false
    return true
  })
}

/** Chunk the window into sparkline points. Counts add up; a rate and a handle
 *  time are re-derived inside each chunk, never averaged from averages. */
function pointsOf(key: MetricKey, deployments: Deployment[], hours: number, points: number): number[] {
  const b = bounds(hours, 0)
  if (!b || deployments.length === 0) return []
  const span = b.to - b.from
  const n = Math.max(1, Math.min(points, span))
  const out: number[] = []
  for (let p = 0; p < n; p++) {
    const from = b.from + Math.floor((p * span) / n)
    const to = b.from + Math.floor(((p + 1) * span) / n)
    const chunk: WindowTotals = { calls: 0, answered: 0, handleSec: 0 }
    for (const d of deployments) {
      const s = seriesFor(d)
      chunk.calls += sum(s.calls, from, to)
      chunk.answered += sum(s.answered, from, to)
      chunk.handleSec += sum(s.handleSec, from, to)
    }
    out.push(valueOf(key, chunk, true) ?? 0)
  }
  return out
}

/**
 * Every number on Monitor for one set of filters. Total: an empty filtered set
 * returns zeroed counts, null rates and empty series rather than throwing.
 */
export function monitorSummary(f: MonitorFilters): MonitorSummary {
  const deployments = filterDeployments(f)
  const hours = RANGE_HOURS[f.range] ?? RANGE_HOURS["7d"]
  const current = totalsOver(deployments, hours, 0) ?? EMPTY
  const previous = totalsOver(deployments, hours, 1)

  // One inbound deployment in the set is enough to take the rate off the
  // screen: the inbound aggregate has no answer-rate field to add in.
  const answerRateAvailable = deployments.length > 0 && !deployments.some((d) => d.kind === "inbound")

  const values = {} as Record<MetricKey, number | null>
  const prior = {} as Record<MetricKey, number | null>
  const series = {} as Record<MetricKey, number[]>
  for (const key of Object.keys(METRIC_DEFS) as MetricKey[]) {
    const value = valueOf(key, current, answerRateAvailable)
    values[key] = value
    prior[key] = previous ? valueOf(key, previous, answerRateAvailable) : null
    // A series is only drawn for a number that exists, so nothing can chart a
    // metric the tile says it does not have.
    series[key] = value === null ? [] : pointsOf(key, deployments, hours, SERIES_POINTS[f.range] ?? 28)
  }

  return {
    calls: current.calls,
    answered: current.answered,
    noAnswer: Math.max(0, current.calls - current.answered),
    values,
    series,
    prior,
    coverage: {
      counted: deployments.filter((d) => d.metrics.calls > 0).length,
      total: deployments.length,
    },
    deployments,
  }
}

// ─── The evaluator's reads ────────────────────────────────────────────────────

/**
 * One deployment's value over the last `hours`, which is exactly what a watch
 * compares. Null when the deployment is gone, when the window is impossible,
 * or when the number has no denominator behind it: the answer rate on an
 * inbound deployment is null, so a watch on it never fires on a guess.
 */
export function windowValue(deploymentId: string, key: MetricKey, hours: number): number | null {
  const d = getDeployment(deploymentId)
  if (!d) return null
  const totals = totalsOver([d], hours, 0)
  if (!totals) return null
  return valueOf(key, totals, !(METRIC_DEFS[key].outboundOnly && d.kind === "inbound"))
}

/** The window before the one `windowValue` reads. Null when there is no earlier
 *  period, which is the state a previous-period watch refuses to compare on. */
export function priorWindowValue(deploymentId: string, key: MetricKey, hours: number): number | null {
  const d = getDeployment(deploymentId)
  if (!d) return null
  const totals = totalsOver([d], hours, 1)
  if (!totals) return null
  return valueOf(key, totals, !(METRIC_DEFS[key].outboundOnly && d.kind === "inbound"))
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/** One renderer per metric, so a number reads the same on the tile, in the
 *  watch chip and in the breach line. Total: a value that is not a finite
 *  number is clamped rather than printed as NaN. */
export function formatMetric(key: MetricKey, value: number): string {
  const n = Number.isFinite(value) ? value : 0
  if (key === "answer_rate") return `${Math.round(Math.min(100, Math.max(0, n)))}%`
  if (key === "handle_time") {
    const secs = Math.max(0, Math.round(n))
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
  }
  return Math.max(0, Math.round(n)).toLocaleString("en-US")
}
