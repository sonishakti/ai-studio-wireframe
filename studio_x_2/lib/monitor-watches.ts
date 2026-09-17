/**
 * Studio_X — Monitor watches
 * ───────────────────────────
 *
 * The watch objects, their store and the evaluator (design 13, direction B: the
 * threshold is a property of a number, so it rides the tile that carries the
 * number). A watch is the spend cap's shape re-pointed at a metric: a
 * condition, something to compare against, a fixed frequency, and an all-clear
 * when it recovers.
 *
 * One localStorage key holds everything an evaluation needs to remember about
 * the last one, borrowing the list idiom `lib/analytics.ts:356-384` uses for
 * remediations and the try-or-ignore read guard at `lib/agent-resources.ts:19-31`.
 *
 * The rules written into this file, not into a screen:
 *   • the storm rule — one notice per watch per 24 hours, with the breaches it
 *     held back counted rather than dropped;
 *   • the all-clear — a watch that recovers says so once;
 *   • the 10-watch cap;
 *   • a previous-period comparison refuses to evaluate when the prior window is
 *     empty, instead of reading a missing period as zero;
 *   • "no calls at all" is offered only on a count metric, because silence is
 *     the one condition a rate can never carry.
 *
 * A breach carries its cause as `AggregatedIssue | null`, borrowed from the
 * rules engine already running on that deployment. It never forges an `Issue`,
 * so no FixTarget is ever built with an id the type cannot hold.
 *
 * Why not extend lib/diagnostics.ts RULES: those are hardcoded pure functions
 * over one call's signals, while a watch is a user-set threshold over an
 * aggregate window, persisted per project.
 */

import { getDeployment, type Deployment } from "./campaign-data"
import { aggregateIssues, type AggregatedIssue } from "./diagnostics"
import { track, Events } from "./analytics"
import {
  METRIC_DEFS,
  formatMetric,
  priorWindowValue,
  windowValue,
  type MetricKey,
} from "./monitor-metrics"

// ─── Shape ────────────────────────────────────────────────────────────────────

export type WatchComparison = "below" | "above" | "no_calls"
export type WatchBasis = "value" | "previous"
export type WatchFrequency = "15m_1h" | "1h_24h" | "1d_7d"

/** How far back each frequency looks when it checks. */
export const WINDOW_HOURS: Record<WatchFrequency, number> = {
  "15m_1h": 1,
  "1h_24h": 24,
  "1d_7d": 7 * 24,
}

/** The window each frequency reads, in words. One source: the sheet's recap, the
 *  tile's "now" hint and the breach line all name the same span. */
export const WINDOW_PHRASE: Record<WatchFrequency, string> = {
  "15m_1h": "over the last hour",
  "1h_24h": "over the last 24 hours",
  "1d_7d": "over the last 7 days",
}

/** The same span, said from the side of the diagnosis that shares it. */
export const SAME_WINDOW: Record<WatchFrequency, string> = {
  "15m_1h": "in the same hour",
  "1h_24h": "in the same 24 hours",
  "1d_7d": "in the same 7 days",
}

/** How often each frequency checks — the clock behind the held-back count. */
const CHECK_MS: Record<WatchFrequency, number> = {
  "15m_1h": 15 * 60_000,
  "1h_24h": 60 * 60_000,
  "1d_7d": 24 * 60 * 60_000,
}

/** One notice per watch per day. The storm rule is the whole answer to alert
 *  fatigue here, which is why there is no mute control beside it. */
const NOTICE_GAP_MS = 24 * 60 * 60_000

/** What each number can be asked. Silence is a condition only where a count can
 *  fall to zero; a rate with no calls behind it has no value at all. */
export const COMPARISONS: Record<MetricKey, WatchComparison[]> = {
  total_calls: ["below", "above", "no_calls"],
  answered_calls: ["below", "above", "no_calls"],
  answer_rate: ["below", "above"],
  handle_time: ["below", "above"],
}

export interface Watch {
  id: string
  metricKey: MetricKey
  /** Required, not nullable: every consumer downstream takes a string. */
  deploymentId: string
  comparison: WatchComparison
  basis: WatchBasis
  /** Raw units: a percent for a rate, seconds for handle time, calls for a count. */
  threshold: number
  frequency: WatchFrequency
  /** When the last message went out, which is what the held-back count counts from. */
  lastNotifiedAt?: number
  lastState?: "open" | "resolved"
  suppressed?: number
}

export interface WatchIncident {
  watch: Watch
  deployment: Deployment
  value: number
  state: "open" | "resolved"
  /** The moment of the notice this incident belongs to. */
  openedAt: number
  /** Breaches since that notice, held back by the storm rule. */
  suppressed: number
  /** The diagnosis in the same window, or null when the rules engine has none.
   *  A Fix button with nothing behind it would be a lie, so the card reads this. */
  cause: AggregatedIssue | null
}

export const WATCH_LIMIT = 10

// ─── Store ────────────────────────────────────────────────────────────────────

const WATCHES_KEY = "sx:monitor_watches"

function isWatch(v: unknown): v is Watch {
  if (!v || typeof v !== "object") return false
  const w = v as Partial<Watch>
  if (typeof w.id !== "string" || typeof w.deploymentId !== "string") return false
  if (typeof w.threshold !== "number" || !Number.isFinite(w.threshold)) return false
  if (!w.metricKey || !(w.metricKey in METRIC_DEFS)) return false
  if (!w.frequency || !(w.frequency in WINDOW_HOURS)) return false
  if (w.basis !== "value" && w.basis !== "previous") return false
  return !!w.comparison && COMPARISONS[w.metricKey].includes(w.comparison)
}

function writeWatches(list: Watch[]) {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(WATCHES_KEY, JSON.stringify(list)) } catch { /* design mode only */ }
}

/** Every watch this project holds. Returns [] on the server, on a blocked or
 *  cleared store, and for any row whose metric or condition no longer exists. */
export function listWatches(): Watch[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(WATCHES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isWatch) : []
  } catch {
    return []
  }
}

/** Add or replace one watch. An eleventh watch is refused rather than written,
 *  so the cap the sheet states is the cap the store keeps. */
export function saveWatch(w: Watch): void {
  if (!isWatch(w)) return
  const list = listWatches()
  const at = list.findIndex((x) => x.id === w.id)
  if (at < 0 && list.length >= WATCH_LIMIT) return
  const next = at < 0 ? [...list, w] : list.map((x) => (x.id === w.id ? { ...x, ...w } : x))
  writeWatches(next)
  track(Events.monitor_watch_set, {
    metric: w.metricKey,
    deployment_id: w.deploymentId,
    comparison: w.comparison,
    basis: w.basis,
    frequency: w.frequency,
  })
}

export function removeWatch(id: string): void {
  const list = listWatches()
  const gone = list.find((w) => w.id === id)
  if (!gone) return
  writeWatches(list.filter((w) => w.id !== id))
  track(Events.monitor_watch_removed, { metric: gone.metricKey, deployment_id: gone.deploymentId })
}

/** The watch on this number for this deployment, if there is one. One watch per
 *  metric per deployment: the tile's control has two states, never a list. */
export function watchFor(metricKey: MetricKey, deploymentId: string): Watch | undefined {
  return listWatches().find((w) => w.metricKey === metricKey && w.deploymentId === deploymentId)
}

// ─── The evaluator ────────────────────────────────────────────────────────────

function breached(w: Watch, value: number, limit: number): boolean {
  if (w.comparison === "no_calls") return value === 0
  if (w.comparison === "below") return value < limit
  return value > limit
}

/**
 * Check every watch once and return what has something to say: a breach, or the
 * all-clear for a breach that has just recovered. A watch that is quiet, and a
 * watch whose number cannot be read at all, return nothing.
 *
 * This is a TRANSITION read: it advances each watch's stored state, so call it
 * once per tick (in an effect, never during render) and hold the result.
 */
export function evaluateWatches(): WatchIncident[] {
  const list = listWatches()
  if (list.length === 0) return []

  const now = Date.now()
  const out: WatchIncident[] = []
  const next: Watch[] = []

  for (const w of list) {
    const deployment = getDeployment(w.deploymentId)
    if (!deployment) { next.push(w); continue }

    const hours = WINDOW_HOURS[w.frequency]
    const value = windowValue(w.deploymentId, w.metricKey, hours)
    // No number, no verdict: an answer rate on an inbound deployment, or a
    // handle time with no answered call behind it, is not a breach.
    if (value === null) { next.push(w); continue }

    // "No calls at all" only ever rides a count, whatever a stale store says.
    if (w.comparison === "no_calls" && !METRIC_DEFS[w.metricKey].count) { next.push(w); continue }

    let limit = w.threshold
    if (w.basis === "previous") {
      const prior = priorWindowValue(w.deploymentId, w.metricKey, hours)
      // An empty prior period is not a zero to fall below.
      if (prior === null) { next.push(w); continue }
      limit = prior
    }

    const isOpen = breached(w, value, limit)
    const wasOpen = w.lastState === "open"

    if (isOpen) {
      const since = now - (w.lastNotifiedAt ?? now)
      const notify = !wasOpen || since >= NOTICE_GAP_MS
      const openedAt = notify ? now : (w.lastNotifiedAt ?? now)
      const suppressed = notify ? 0 : Math.max(0, Math.floor(since / CHECK_MS[w.frequency]))
      const updated: Watch = { ...w, lastState: "open", lastNotifiedAt: openedAt, suppressed }
      next.push(updated)
      if (notify) {
        track(Events.watch_fired, {
          metric: w.metricKey,
          deployment_id: w.deploymentId,
          comparison: w.comparison,
          value: Math.round(value),
        })
      }
      out.push({
        watch: updated,
        deployment,
        value,
        state: "open",
        openedAt,
        suppressed,
        cause: aggregateIssues(w.deploymentId)[0] ?? null,
      })
      continue
    }

    if (wasOpen) {
      const updated: Watch = { ...w, lastState: "resolved", lastNotifiedAt: now, suppressed: 0 }
      next.push(updated)
      track(Events.watch_resolved, {
        metric: w.metricKey,
        deployment_id: w.deploymentId,
        value: Math.round(value),
      })
      out.push({
        watch: updated,
        deployment,
        value,
        state: "resolved",
        openedAt: now,
        suppressed: 0,
        cause: null,
      })
      continue
    }

    next.push(w)
  }

  writeWatches(next)
  // A live breach outranks an all-clear, and the newest of either comes first.
  return out.sort(
    (a, b) => (a.state === b.state ? b.openedAt - a.openedAt : a.state === "open" ? -1 : 1),
  )
}

// ─── One sentence, two places ─────────────────────────────────────────────────

/**
 * The condition, in words: "below 1,200", "above 5:00", "no calls at all". The
 * tile's chip reads "Watch · <this>" and the sheet's recap line reads back the
 * same phrase, so the two can never drift apart.
 */
export function describeWatch(w: Watch): string {
  if (w.comparison === "no_calls") return "no calls at all"
  const side = w.comparison === "below" ? "below" : "above"
  if (w.basis === "previous") return `${side} the period before`
  return `${side} ${formatMetric(w.metricKey, w.threshold)}`
}
