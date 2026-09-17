/**
 * Eval runs — the stored run and the persisted suite, plus the result an
 * authored case needs in order to return anything at all.
 *
 * Two decisions from 14 · Evals & scorecards (2026-09-17). First, a run is a
 * record: the suite, the verdicts and the rate survive the tab, so the
 * pre-flight can state the number the run actually produced instead of reading
 * a switch, and Regenerate scenarios stops deleting authored work. Second, a
 * text run repeats, because a pass shows the agent CAN succeed and a rate shows
 * how often it will — the evidence behind an 85% floor. An audio run spends
 * agent minutes at $0.10 a minute, so it runs once and no rate is printed for
 * it.
 *
 * `seedScore` and `synthTranscript` moved here from
 * `components/wizard/test-section.tsx` unchanged: after this build the Tests
 * table, the docked panel, the pre-flight and the call sheet all need them, and
 * a wizard component cannot be the store for four other surfaces.
 */

import {
  caseType,
  type AssertionVerdict, type EvalAssertion, type EvalCase, type EvalCaseResult,
  type EvalTurn, type RunMode,
} from "@/lib/campaign-data"
import { criterionById, type Scorecard } from "@/lib/scorecard"
import type { AgentDraft } from "@/lib/wizard-draft"

/** One case's outcome in a run: the sheet's result, and how many of the
 *  repeats held. `repeats` is 1 for an audio run, which is why the row prints
 *  a rate only when there is one. */
export interface RunResult {
  result: EvalCaseResult
  passes: number
  repeats: number
}

export interface StoredRun {
  id: string
  suiteId: string
  agentId: string
  /** The scorecard version these verdicts were graded against. */
  scorecardVersion: number
  mode: RunMode
  repeats: number
  /** ISO 8601. */
  at: string
  results: RunResult[]
}

/** The suite as the user left it: what they authored, and what they deleted.
 *  One removed list covers both sources — a generated scenario belongs to the
 *  parent, so it can only be hidden here. */
export interface SuiteState {
  cases: EvalCase[]
  removed: string[]
}

/** Enough history to compare two runs, not enough to fill a browser. */
const RUNS_KEPT = 20

/** Emitted by `recordRun` so a read-only summary of the same suite re-reads
 *  the moment the table below it finishes a run (the `sx:widget-changed`
 *  idiom — two mounted surfaces, one store). */
export const RUN_EVENT = "sx:eval-run"

const runsKey = (agentId: string) => `sx:eval_runs:${agentId}`
const suiteKey = (agentId: string) => `sx:eval_suite:${agentId}`

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode — wireframe only */
  }
}

// ─── The suite ────────────────────────────────────────────────────────────────

/** The suite this browser holds for one agent. The seed is empty by default:
 *  a case exists because someone wrote it (owner 2026-09-17). */
export function readSuiteState(agentId: string, seed: EvalCase[] = []): SuiteState {
  const fallback: SuiteState = { cases: [...(seed ?? [])], removed: [] }
  if (typeof window === "undefined" || !agentId) return fallback
  const stored = read<Partial<SuiteState> | null>(suiteKey(agentId), null)
  if (!stored || !Array.isArray(stored.cases)) return fallback
  return {
    cases: stored.cases,
    removed: Array.isArray(stored.removed) ? stored.removed : [],
  }
}

export function writeSuiteState(agentId: string, s: SuiteState) {
  if (!agentId) return
  write(suiteKey(agentId), { cases: s?.cases ?? [], removed: s?.removed ?? [] })
}

// ─── The runs ─────────────────────────────────────────────────────────────────

export function recordRun(r: StoredRun) {
  if (typeof window === "undefined" || !r?.agentId) return
  write(runsKey(r.agentId), [r, ...listRuns(r.agentId)].slice(0, RUNS_KEPT))
  window.dispatchEvent(new CustomEvent(RUN_EVENT, { detail: { agentId: r.agentId } }))
}

/** Newest first. */
export function listRuns(agentId: string): StoredRun[] {
  if (!agentId) return []
  const stored = read<StoredRun[]>(runsKey(agentId), [])
  return Array.isArray(stored) ? stored : []
}

export function latestRun(agentId: string): StoredRun | undefined {
  return listRuns(agentId)[0]
}

/**
 * The most recent result for one case, across runs rather than inside the last
 * one: an audio run skips the decision checks, and a skipped check must not
 * lose the verdict it already has.
 */
export function storedResultFor(agentId: string, caseId: string): RunResult | undefined {
  if (!caseId) return undefined
  for (const run of listRuns(agentId)) {
    const hit = run.results?.find((r) => r.result?.caseId === caseId)
    if (hit) return hit
  }
  return undefined
}

// ─── Synthesis (deterministic — the wireframe runs no model) ──────────────────

/** Deterministic tiny hash — the wireframe's stand-in for model variance. */
export function seedScore(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 977
  return h
}

export function synthTranscript(d: AgentDraft, goal: string, fail?: string | null): EvalTurn[] {
  const greeting = d.greeting.trim() || "Hi, thanks for calling. How can I help you today?"
  return [
    { role: "agent" as const, text: greeting },
    { role: "caller", text: `I want to ${goal}.` },
    fail
      ? { role: "agent", text: "…", note: fail }
      : { role: "agent", text: `The agent handles it the way the prompt directs, staying in persona.` },
    { role: "caller", text: "Okay. That works. Thanks." },
  ]
}

/** What a check is called on a result row: the scorecard name when the
 *  assertion points at a criterion, else the name its author gave it. */
function labelFor(a: EvalAssertion, sc: Scorecard | undefined): string {
  const crit = a.criterionId ? criterionById(sc, a.criterionId) : undefined
  return (crit?.name ?? a.name ?? "").trim()
}

/**
 * A result for a case the seeded run never covered — which is every case the
 * user writes. Deterministic from the case id and the mode, so a row shows the
 * same rate every render and a reload does not change the agent's grade.
 */
export function synthResult(c: EvalCase, sc: Scorecard, mode: RunMode, repeats: number): RunResult {
  const n = Math.max(1, Math.floor(repeats) || 1)
  const h = seedScore(`${c.id}:${mode}`)
  // One bucket in five misses most of its repeats; the rest hold every time.
  const mostlyFails = h % 5 === 2
  const passes = mostlyFails ? Math.floor((n - 1) / 2) : n
  const verdict: AssertionVerdict = passes * 2 > n ? "pass" : "fail"

  const checks = c.assertions ?? []
  // On a failure exactly one check is the one that broke, so the sheet can
  // anchor it onto the turn and the row can name it.
  const failIdx = verdict === "fail" && checks.length ? h % checks.length : -1
  const assertions = checks.map((a, i) => {
    const failed = i === failIdx
    const label = labelFor(a, sc)
    // The case passes only when every check does, so the case's rate and a
    // held check's rate are different numbers and the row states each one.
    const body = failed
      ? n > 1 ? `Failed on ${n - passes} of ${n} runs.` : "Failed on this run."
      : n > 1 ? `Passed on ${n} of ${n} runs.` : "Passed on this run."
    return {
      id: a.id,
      verdict: (failed ? "fail" : "pass") as AssertionVerdict,
      reasoning: label ? `${label} · ${body}` : body,
    }
  })

  const broke = failIdx >= 0 ? checks[failIdx] : undefined
  // The note is a bubble caption, so it names the check only when the name is
  // short: a criterion name, or the tool / field an unnamed check points at.
  const subject = broke ? labelFor(broke, sc) || (broke.kind === "rubric" ? "" : broke.text) : ""
  const note = broke ? `${subject ? `${subject} · ` : ""}not satisfied in this reply` : undefined
  const reply: EvalTurn = broke
    ? { role: "agent", text: "The agent answers, but not the way the check asks for.", note }
    : { role: "agent", text: "The agent handles it the way the prompt directs, staying in persona." }

  const goal = c.persona?.goal?.trim() || "get my question answered"
  const transcript: EvalTurn[] =
    caseType(c) === "decision"
      ? [...(c.history ?? []), reply]
      : [
          { role: "agent", text: "Hi, thanks for calling. How can I help you today?" },
          { role: "caller", text: `I want to ${goal}.` },
          reply,
          { role: "caller", text: broke ? "Okay. Thanks anyway." : "Okay. That works. Thanks." },
        ]

  const result: EvalCaseResult = {
    caseId: c.id,
    verdict,
    mode,
    ...(mode === "audio" ? { seconds: 62 + (h % 25) } : {}),
    transcript,
    assertions,
  }
  return { result, passes, repeats: n }
}
