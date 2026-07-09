// F-Eval eval-lab SPEC — shared contract for the evals/simulation variants.
// THROWAWAY HARNESS (judged → winner folded → deleted).
//
// FIRST CUT scope: author a Suite → Case (persona + scenario + pass/fail
// assertions) in the builder's Test step, run simulated callers, see pass/fail
// + TRANSCRIPT + which assertion failed; plus "save a real call as a test".
//
// Two honesty rules (close the 3×-recurring user-test trust gap — the Talk
// test is a pulsing orb with no transcript/state/"simulated" label):
//   • every test run renders a live TRANSCRIPT (proof of work) + explicit
//     listening/thinking/speaking state — never a bare orb
//   • a visible "Simulated" label + verdict banner (pass/fail, which assertion
//     failed, why) — a test must never look identical to a real call
//
// Requirements (research 2026-07-09):
//   R1 author Suite → Case with persona (identity/goal/personality) + assertions
//   R2 simulated CALLER (persona), not agent self-talk
//   R3 batch run: N cases → a pass/fail list in one action
//   R4 rubric authoring in plain language ("PASS if X")
//   R5 "save this call as a test" — one click from a call log → regression case
//   R6 tool-call + data-point assertions, not just text
//   R7 every run shows a live transcript + agent state (closes the orb gap)
//   R8 "Simulated" + verdict banner on every run — never looks like a real call

import { EVAL_SUITE, EVAL_RUN, getDefaultAgent } from "@/lib/campaign-data"

export interface EvalScenario {
  id: string
  label: string
  must: string[]
  /** Which surface state the variant should render. */
  view: "author" | "running" | "results" | "save-from-call"
}

export const SCENARIOS: EvalScenario[] = [
  {
    id: "author",
    label: "E0 · Author a suite (persona + rubric assertions)",
    must: [
      "a Case carries a persona (identity/goal/personality) + plain-language PASS-if assertions",
      "adding a case is low-friction; tool-call + data-point assertions available, not just text",
    ],
    view: "author",
  },
  {
    id: "running",
    label: "E1 · Running — simulated caller, live transcript",
    must: [
      "the run shows a LIVE transcript + explicit agent state (listening/thinking/speaking) — never a bare orb",
      "clearly labeled 'Simulated' — it must not look like a real call",
    ],
    view: "running",
  },
  {
    id: "results",
    label: "E2 · Results — 2/3 pass, one real red verdict",
    must: [
      "per-case pass/fail list; the failing case names WHICH assertion broke + the judge's one-line reason",
      "the failing transcript is inspectable (the invented-discount turn is visible)",
    ],
    view: "results",
  },
  {
    id: "save-from-call",
    label: "E3 · Save a real call as a test (whitespace)",
    must: [
      "one action turns a real call into a regression Case, pre-filling persona + transcript",
      "the user only has to add the assertion ('what should always be true here?')",
    ],
    view: "save-from-call",
  },
]

export const AGENT = getDefaultAgent()
export const SUITE = EVAL_SUITE
export const RUN = EVAL_RUN

export const REQUIREMENTS = [
  "R1 author Suite → Case (persona + assertions)",
  "R2 simulated caller persona, not self-talk",
  "R3 batch run → pass/fail list",
  "R4 plain-language rubric authoring",
  "R5 save a real call as a test",
  "R6 tool-call + data-point assertions",
  "R7 live transcript + agent state (closes the orb gap)",
  "R8 Simulated label + verdict banner",
] as const

export interface EvalVariantProps {
  scenario: EvalScenario
}
