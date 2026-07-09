// A6 concurrency-lab SPEC — shared contract for the purchase-surface variants.
// THROWAWAY HARNESS (judged → winner folded → deleted).
//
// Ground rules from research (2026-07-09):
//  • base vs purchased lines are SEPARATE numbers, never merged (Vapi parity)
//  • purchase applies instantly with a "live now" confirmation; prorated for
//    the remaining cycle days (Retell parity) — say it in copy
//  • utilization is visible NEXT TO the buy control (never sell blind)
//  • the at-the-wall behavior is stated BEFORE it happens: batch calls QUEUE
//    when lines are busy (aligns with D1's queue-not-drop semantics)
//  • WHITESPACE (no competitor ships these — win here): an in-product
//    at-the-wall purchase moment; explicit spend-cap reconciliation ("more
//    lines ≠ a higher cap — at full utilization you'd hit your $50 cap in
//    ~Nh"); a documented downgrade path (reduce lines, prorated credit).

import { PLAN_USAGE, type PlanUsage } from "@/lib/campaign-data"

export interface ConcurrencyScenario {
  id: string
  label: string
  must: string[]
  usage: PlanUsage
  /** Live concurrent lines in use right now (mock gauge). */
  liveUsed: number
}

const base: PlanUsage = {
  ...PLAN_USAGE,
  cardOnFile: true,
  spendCapUsd: 50,
  freeMinutesUsed: 300,
  paygSpendUsd: 12.4,
}

export const SCENARIOS: ConcurrencyScenario[] = [
  {
    id: "idle",
    label: "C0 · Quiet — 2 of 10 lines in use",
    must: [
      "included (10 free) vs purchased (0) read as separate numbers",
      "live utilization visible next to any buy control",
      "queue-at-the-wall behavior stated before it ever happens",
    ],
    usage: base,
    liveUsed: 2,
  },
  {
    id: "busy",
    label: "C1 · Warm — 8 of 10, batch running",
    must: [
      "approaching-capacity reads as information, not alarm",
      "the case for more lines is made with utilization evidence, not urgency",
    ],
    usage: base,
    liveUsed: 8,
  },
  {
    id: "wall",
    label: "C2 · At the wall — 10 of 10, batch pacing slowed",
    must: [
      "says exactly what's happening: new calls queue, nothing drops or fails",
      "the purchase CTA quantifies the fix (\"+5 lines ≈ finish ~35 min sooner\") — whitespace moment",
      "spend-cap reconciliation: more lines ≠ higher cap; time-to-cap at full utilization shown",
    ],
    usage: base,
    liveUsed: 10,
  },
  {
    id: "purchased",
    label: "C3 · Just bought — 15 lines (10 free + 5 purchased)",
    must: [
      "instant \"live now\" confirmation + prorated charge for remaining cycle days",
      "included vs purchased split visible in the new total",
    ],
    usage: base,
    liveUsed: 9,
  },
  {
    id: "downgrade",
    label: "C4 · Reducing — drop 5 purchased lines",
    must: [
      "self-serve reduction exists (no competitor documents one — say the terms plainly)",
      "prorated credit for unused days stated; no penalty tone",
    ],
    usage: base,
    liveUsed: 3,
  },
]

/** Wireframe pricing — Agora publishes no concurrency price (docs sweep F8);
 *  $8/line/mo is a competitive placeholder (Retell parity), labeled mock. */
export const LINE_PRICE_USD = 8
export const INCLUDED_LINES = 10

export const REQUIREMENTS = [
  "R1 included vs purchased never merged",
  "R2 instant apply + live-now confirmation; proration in copy",
  "R3 utilization gauge beside the buy control",
  "R4 wall behavior (queue) disclosed up front",
  "R5 at-the-wall purchase moment quantifies the benefit (whitespace)",
  "R6 spend-cap reconciliation with X1 (whitespace)",
  "R7 downgrade path with prorated credit (whitespace)",
  "R8 tokens only; gauge accessible (role=meter + labels)",
] as const

export interface ConcurrencyVariantProps {
  scenario: ConcurrencyScenario
}
