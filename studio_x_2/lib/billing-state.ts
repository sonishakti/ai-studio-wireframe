/**
 * Billing state — the one read/write path behind the two Billing money cards
 * and every surface that names a line count (feature 22, 2026-09-17).
 * ──────────────────────────────────────────────────────────────────────────
 * Two halves, and only ONE of them writes.
 *
 * WRITE — the money overlay. The spend card held cap / card / alert in five
 * pieces of local state, so a card added there was invisible to the
 * concurrency card directly below it on the same page, and the budget line
 * went stale the moment a reviewer used it. That is the one genuinely shared
 * write path, and it is what this module exists for: an `sx:` key plus a
 * window CustomEvent, the same idiom as `lib/agent-store.ts`, so both cards
 * re-read on each other's writes. It persists (localStorage, guarded reads —
 * `lib/agent-resources.ts`) because a reviewer sets a cap on /billing and
 * expects it to still be set when they come back from /billing/usage.
 *
 * READ — capacity, DERIVED and never stored, because nothing about capacity is
 * settable: the Engine contract exposes no concurrency field to read or set,
 * only ConcurrencyLimitExceeded on a 422. So the limit is the one number Agora
 * publishes, in-use is the live calls plus the lines the dialing batch runs
 * hold, and the queue is those same runs' own queued depth. No purchase, no
 * pending request, no seeded ceiling.
 *
 * No user-facing sentence is born here: this file returns numbers and the
 * components write the copy.
 */

import {
  AGORA_RATE_PER_MIN, DEPLOYMENTS, PLAN_USAGE, freeMinutesStats, type PlanUsage,
} from "@/lib/campaign-data"
import { liveCalls } from "@/lib/live-calls"

/** Peak concurrent users under a single App ID — the only agent concurrency
 *  ceiling Agora publishes (docs.agora.io, Conversational AI release notes
 *  v1.0). It is a documented peak, NOT a cap on what Agora will grant: no
 *  surface may present it as the most an account can ever have. */
export const PUBLISHED_PCU_CEILING = 20

/** Every write emits this, so the two cards on /billing re-read. */
export const BILLING_STATE_EVENT = "sx:billing-state"

const MONEY_KEY = "sx:billing_money"

// ─── The money overlay (the write half) ──────────────────────────────────────

export interface MoneyOverlay {
  cardOnFile: boolean
  capUsd: number | null
  alertPct: number
  /** A cautious user may set a cap BEFORE adding a card; it arms at capture. */
  preCardCap: number | null
}

/** The overlay starts as the money fixture describes the account. Exported so
 *  a card can render its FIRST paint from the same position the server drew,
 *  then hydrate from storage in an effect (the stack-config idiom). */
export const DEFAULT_MONEY: MoneyOverlay = {
  cardOnFile: PLAN_USAGE.cardOnFile,
  capUsd: PLAN_USAGE.spendCapUsd,
  alertPct: PLAN_USAGE.spendAlertPct,
  preCardCap: null,
}

const emit = () => window.dispatchEvent(new CustomEvent(BILLING_STATE_EVENT))

/** Total: no window, unreadable storage or a half-written record all return
 *  the fixture's own position, never a throw and never a partial object. */
export function readMoney(): MoneyOverlay {
  if (typeof window === "undefined") return { ...DEFAULT_MONEY }
  try {
    const raw = window.localStorage.getItem(MONEY_KEY)
    return raw
      ? { ...DEFAULT_MONEY, ...(JSON.parse(raw) as Partial<MoneyOverlay>) }
      : { ...DEFAULT_MONEY }
  } catch {
    return { ...DEFAULT_MONEY }
  }
}

/** Merge-write: a caller sets the one field it owns and the rest survives. */
export function writeMoney(next: Partial<MoneyOverlay>): void {
  if (typeof window === "undefined") return
  const merged: MoneyOverlay = { ...readMoney(), ...next }
  try {
    window.localStorage.setItem(MONEY_KEY, JSON.stringify(merged))
  } catch {
    /* ignore quota / serialization errors */
  }
  emit()
}

/** PLAN_USAGE with the overlay applied — the object every money read goes
 *  through, so freeMinutesStats() and spendStats() see one account. The cap
 *  arms at card capture: no card, no cap. */
export function effectivePlanUsage(m: MoneyOverlay = readMoney()): PlanUsage {
  return {
    ...PLAN_USAGE,
    cardOnFile: m.cardOnFile,
    spendCapUsd: m.cardOnFile ? (m.capUsd ?? PLAN_USAGE.defaultSpendCapUsd) : null,
    spendAlertPct: m.alertPct,
  }
}

// ─── Capacity (the read half) ────────────────────────────────────────────────

export interface Capacity {
  /** The published ceiling. Nothing in the console can raise it. */
  limit: number
  /** liveInUse + batchInUse. */
  inUse: number
  /** Lines carrying a live call right now. */
  liveInUse: number
  /** Lines the dialing and paced batch runs hold. */
  batchInUse: number
  /** Calls waiting for a line, summed over those same runs. */
  queued: number
  atWall: boolean
  pctInUse: number
}

/**
 * Composed from the parts that exist, so no two surfaces can disagree: the
 * live-calls table and the batch runs are the only places a line is actually
 * held, and `batchRuntime.queued` is the only queue depth in the data.
 * "paced" and "dialing" are the two pacing states that hold lines; a paused,
 * scheduled, draining, degraded or done run holds none.
 */
export function readCapacity(): Capacity {
  const limit = PUBLISHED_PCU_CEILING
  const liveInUse = liveCalls().length
  let batchInUse = 0
  let queued = 0
  for (const d of DEPLOYMENTS) {
    const rt = d.batchRuntime
    if (!rt || (rt.pacing !== "paced" && rt.pacing !== "dialing")) continue
    batchInUse += rt.linesInUse
    queued += rt.queued
  }
  const inUse = liveInUse + batchInUse
  return {
    limit,
    inUse,
    liveInUse,
    batchInUse,
    queued,
    atWall: inUse >= limit,
    pctInUse: limit > 0 ? Math.min(100, Math.round((inUse / limit) * 100)) : 0,
  }
}

export interface CapacityBudget {
  /** Which meter the account is on: minutes while the free tier lasts, dollars
   *  of cap once paid metering starts (X1's locked unit switch, reused). */
  unit: "minutes" | "usd"
  minutesLeft: number
  capUsd: number | null
  /** How long minutesLeft lasts with `lines` of them dialing at once. */
  wallClockMinutes: number
}

/**
 * Lines change how fast the balance goes, not how much of it there is: Agora
 * charges the same per minute whichever line carries the call. So the budget
 * is minutes left (free tier) or cap ÷ rate (paid), and the wall clock is that
 * divided by the lines dialing.
 *
 * Total: `lines` of zero or less returns a wall clock of 0 rather than
 * dividing, and on the dollar side with no cap set there is no number to draw
 * — `capUsd` comes back null and the caller renders no figure.
 */
export function capacityBudget(lines: number): CapacityBudget {
  const usage = effectivePlanUsage()
  const free = freeMinutesStats(usage)
  const capUsd = usage.spendCapUsd
  const unit: CapacityBudget["unit"] = free.remaining > 0 ? "minutes" : "usd"
  const minutesLeft =
    unit === "minutes"
      ? free.remaining
      : capUsd != null && AGORA_RATE_PER_MIN > 0
        ? Math.round(capUsd / AGORA_RATE_PER_MIN)
        : 0
  return {
    unit,
    minutesLeft,
    capUsd,
    wallClockMinutes: lines > 0 ? Math.round(minutesLeft / lines) : 0,
  }
}
