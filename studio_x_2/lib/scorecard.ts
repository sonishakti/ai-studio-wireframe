/**
 * Scorecard — the named checks an agent's runs are graded on, plus the one
 * adapter that hands a finished call's turns to the test author.
 *
 * Direction C (14 · Evals & scorecards, 2026-09-17): a criterion IS an
 * assertion with a name, so the sentence a test run is graded on and the
 * sentence a call would be graded on are one record and cannot drift. The
 * scorecard is read and written per browser, so it lives here and not in
 * `lib/campaign-data.ts`, which is seed constants and pure helpers with no
 * browser storage anywhere — a store in there would pull localStorage into
 * every import of the suite. Same `sx:` guards as `lib/agent-store.ts` and
 * `lib/journey-progress.ts`, and every write emits `sx:scorecard` so the
 * builder's editor and the Test section's summary re-read together.
 *
 * Nothing here scores a finished call. Agora keeps no transcript for one
 * (roadmap line 152), so a per-criterion verdict on the calls list would be
 * invented: the call side states that dependency instead of printing a number.
 */

import type { EvalAssertion, EvalTurn } from "@/lib/campaign-data"

export interface Scorecard {
  id: string
  name: string
  agentId: string
  /** Bumped on every write — a stored run records which version graded it. */
  version: number
  /** The checks themselves. An empty list is a real state: it means this agent
   *  grades nothing, and it is what the pre-flight reads instead of a switch. */
  criteria: EvalAssertion[]
  /** ISO 8601, stamped on every write. */
  updatedAt: string
}

/** The ceiling on one scorecard. Stated on the surface when it is reached, so
 *  the Add button never fails silently. */
export const CRITERIA_LIMIT = 30

/**
 * The scorecard an agent starts with: named, and with nothing in it yet
 * (owner 2026-09-17).
 *
 * It used to open holding three written checks, one of them a refund policy
 * for a business the user may not be in. A criterion is a sentence about this
 * agent's calls, so it can only be written by the person whose calls they are.
 * An empty list is a real state everything downstream already reads: the
 * pre-flight names what grades the agent and finds nothing, and a run graded
 * on no criteria says so.
 */
export const DEFAULT_SCORECARD: Scorecard = {
  id: "sc_default",
  name: "Scorecard",
  agentId: "agt_default",
  version: 1,
  criteria: [],
  updatedAt: "2026-09-17T09:00:00.000Z",
}

/** Every mounted surface re-reads on this — the editor in the builder and the
 *  read-only summary in the Test section are on screen at the same time. */
export const SCORECARD_EVENT = "sx:scorecard"

export const scorecardKey = (agentId: string) => `sx:scorecard:${agentId}`

/** A fresh copy of the seed, stamped for this agent. Never handed out by
 *  reference: the caller edits what it is given. */
function seeded(agentId: string): Scorecard {
  return {
    ...DEFAULT_SCORECARD,
    agentId,
    criteria: DEFAULT_SCORECARD.criteria.map((c) => ({ ...c })),
  }
}

export function readScorecard(agentId: string): Scorecard {
  const fallback = seeded(agentId)
  if (typeof window === "undefined" || !agentId) return fallback
  try {
    const raw = window.localStorage.getItem(scorecardKey(agentId))
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Scorecard> | null
    // An empty criteria array is kept — the user removed every check, and that
    // is the attach state the pre-flight reads.
    if (!parsed || !Array.isArray(parsed.criteria)) return fallback
    return {
      id: parsed.id || fallback.id,
      name: parsed.name?.trim() || fallback.name,
      agentId,
      version: typeof parsed.version === "number" ? parsed.version : fallback.version,
      criteria: parsed.criteria,
      updatedAt: parsed.updatedAt || fallback.updatedAt,
    }
  } catch {
    return fallback
  }
}

export function writeScorecard(sc: Scorecard) {
  if (typeof window === "undefined" || !sc?.agentId) return
  const next: Scorecard = {
    ...sc,
    version: (typeof sc.version === "number" ? sc.version : 0) + 1,
    criteria: sc.criteria ?? [],
    updatedAt: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(scorecardKey(next.agentId), JSON.stringify(next))
  } catch {
    /* quota / private mode — wireframe only */
  }
  window.dispatchEvent(new CustomEvent(SCORECARD_EVENT, { detail: { agentId: next.agentId } }))
}

/** The attach state. It replaced a switch that could be on over an empty box. */
export const hasCriteria = (sc: Scorecard | undefined): boolean => Boolean(sc?.criteria?.length)

export function criterionById(sc: Scorecard | undefined, id: string): EvalAssertion | undefined {
  if (!sc || !Array.isArray(sc.criteria) || !id) return undefined
  return sc.criteria.find((c) => c.id === id)
}

/**
 * A call's turns in the shape a test case reads. Structurally typed on purpose:
 * `CallTranscriptTurn` lives in the call sheet, and a lib never imports a
 * component.
 */
export function callTurnsToEvalTurns(
  turns: { speaker: "Agent" | "Customer"; text: string }[],
): EvalTurn[] {
  if (!Array.isArray(turns)) return []
  return turns.map((t): EvalTurn => ({
    role: t?.speaker === "Agent" ? "agent" : "caller",
    text: t?.text ?? "",
  }))
}
