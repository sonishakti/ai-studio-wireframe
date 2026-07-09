// X1 spend-lab SPEC — the shared contract all variants render against.
// THROWAWAY HARNESS: deleted after the judge round picks a winner (the
// /agents/proto · /builder-lab convention). Variants differ in PRESENTATION
// only; this file owns coverage so judging never compares feature-completeness.

import type { PlanUsage } from "@/lib/campaign-data"
import { PLAN_USAGE } from "@/lib/campaign-data"

/** One point in the money lifecycle (journey states S0–S8 minus S1/S3a interludes). */
export interface SpendScenario {
  id: string
  label: string
  /** What a correct rendering MUST communicate in this state. */
  must: string[]
  usage: PlanUsage
}

const base = PLAN_USAGE

export const SCENARIOS: SpendScenario[] = [
  {
    id: "fresh",
    label: "S0 · Fresh — nothing used",
    must: [
      "300 free minutes ready; the 150 no-card + 150 card-unlocked split is visible",
      "projection shows $0.00 and explains PAYG starts only after the free tier",
    ],
    usage: { ...base, freeMinutesUsed: 0 },
  },
  {
    id: "mid",
    label: "S1 · Mid-tier — 96 of 150 no-card minutes",
    must: [
      "exact numbers with units (96 of 300 min), never a bare percentage",
      "locked +150 segment reads as expandable capacity, not a wall",
    ],
    usage: { ...base, freeMinutesUsed: 96 },
  },
  {
    id: "threshold",
    label: "S2 · Ungated threshold — 150 used, no card",
    must: [
      "card unlocks 150 MORE free minutes ($0 today) — continuation framing",
      "spend cap is introduced as the user's own protection, default $50/mo",
    ],
    usage: { ...base, freeMinutesUsed: 150 },
  },
  {
    id: "exhausted-no-card",
    label: "S3c · Exhausted, no card — new calls paused",
    must: [
      "says exactly what stopped (new calls) and the ONE action that changes it",
      "no penalty tone; in-flight calls finished normally",
    ],
    usage: { ...base, freeMinutesUsed: 300 },
  },
  {
    id: "payg",
    label: "S5 · PAYG began — card on file, $18.40 spent",
    must: [
      "meter switches unit: dollars-of-cap is now primary ($18.40 of $50 cap)",
      "projected bill is the hero, labeled as an estimate that updates with use",
      "metering-lag disclosure (usage may take a few minutes to reflect)",
    ],
    usage: {
      ...base,
      freeMinutesUsed: 300,
      cardOnFile: true,
      spendCapUsd: 50,
      paygSpendUsd: 18.4,
      periodDaysElapsed: 14,
    },
  },
  {
    id: "cap-warning",
    label: "S6 · Cap approaching — $41.20 of $50 (82%)",
    must: [
      "warning fired BEFORE the wall; shows headroom left in $ and ~minutes",
      "raise-cap offered as capacity expansion; keep-cap equally legitimate",
    ],
    usage: {
      ...base,
      freeMinutesUsed: 300,
      cardOnFile: true,
      spendCapUsd: 50,
      paygSpendUsd: 41.2,
      periodDaysElapsed: 22,
    },
  },
  {
    id: "cap-hit",
    label: "S7 · Cap hit — $50 of $50, new calls paused",
    must: [
      "states what's blocked (new calls) AND what still works (in-flight finished, data intact, cap honored on invoice)",
      "ONE primary CTA (raise cap); keep-paused is a first-class alternative; zero penalty tone",
    ],
    usage: {
      ...base,
      freeMinutesUsed: 300,
      cardOnFile: true,
      spendCapUsd: 50,
      paygSpendUsd: 50,
      periodDaysElapsed: 25,
    },
  },
  {
    id: "cap-raised",
    label: "S8 · Cap raised — $50 spent of new $80 cap",
    must: [
      "confirmation: new cap, restored headroom, when it takes effect",
      "projection recomputed against the new cap",
    ],
    usage: {
      ...base,
      freeMinutesUsed: 300,
      cardOnFile: true,
      spendCapUsd: 80,
      paygSpendUsd: 50,
      periodDaysElapsed: 25,
    },
  },
]

/** Requirements checklist (research brief 2026-07-09) — judges score against
 *  these; variants may satisfy them differently but must satisfy them. */
export const REQUIREMENTS = [
  "R1 usage lives on Billing (account-menu ring stays the glance)",
  "R2 cap + alert threshold + usage read together (OpenAI Limits parity)",
  "R3 exact numbers + units everywhere; % never stands alone",
  "R4 the 150+150 split is legible in the meter itself",
  "R5 cap semantics: pause NEW calls only; in-flight finish; invoice honors cap",
  "R6 alert threshold editable (default 75%)",
  "R7 estimated next bill = straight-line run rate, always labeled estimate",
  "R8 cap-hit: what stopped, what didn't, one primary CTA, no penalty tone",
  "R9 metering-lag disclosure near the meter",
  "R10 meter a11y: role=meter, aria values, visible text label",
  "R11 no fake urgency; figures agree with Monitor nudge + account ring",
  "R12 every $ figure = minutes × $0.10, traceable to PLAN_USAGE",
] as const

export interface SpendVariantProps {
  scenario: SpendScenario
}
