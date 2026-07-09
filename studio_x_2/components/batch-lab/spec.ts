// D1 batch-lab SPEC — shared contract for the batch-detail-view variants.
// THROWAWAY HARNESS (judged → winner folded into /deploy/batch-calls/[id],
// which today just redirects to /monitor → the winner replaces that redirect).
//
// THE ONE JOB: a slow-but-throttled batch must read as WORKING, not FAILED.
// "Paced" is a first-class, spoken state (no competitor says it out loud);
// it is DISTINCT from "degraded" (carrier failures / queue-time unhealthy).
// Every zero-progress moment carries its reason verbatim (batchRuntime.reason).
//
// Requirements (research 2026-07-09):
//   R1 live queued/dialing/completed breakdown, not one "Sent" counter
//   R2 explicit "Paced" badge, neutral/primary tone — never warning
//   R3 concurrency gauge ON the batch view (not buried in account analytics)
//   R4 retry attempt counter ("Retrying — 34 calls, attempt ≤3")
//   R5 full disposition set in the call list (not success/fail binary)
//   R6 degraded state visibly separate from paced (+ links the fix)
//   R7 live ETA from pace × remaining queue (batchEta)
//   R8 every zero-progress moment shows its reason inline
//   R9 the A6 at-the-wall unlock appears here when paced (shared moment)

import { DEPLOYMENTS, type Deployment } from "@/lib/campaign-data"

export interface BatchScenario {
  id: string
  label: string
  must: string[]
  /** The seeded deployment this scenario renders. */
  deployment: Deployment
}

const byId = (id: string) => DEPLOYMENTS.find((d) => d.id === id)!

export const SCENARIOS: BatchScenario[] = [
  {
    id: "paced",
    label: "B0 · Paced — 3,421/5,000, queue building (the headline case)",
    must: [
      "the 'Paced' badge reads as WORKING (neutral/primary), never as an error",
      "queued vs dialing vs completed are all visible; ETA is shown from live pace",
      "the reason line explains the queue; the A6 add-lines unlock is offered here",
    ],
    deployment: byId("dp_ob_01"),
  },
  {
    id: "scheduled",
    label: "B1 · Scheduled — 0 of 12,000 (zero progress, known reason)",
    must: [
      "zero completed is explained inline ('scheduled for Jun 1, contact-local'), never a blank or a spinner",
      "no 'failed' framing on an unstarted batch",
    ],
    deployment: byId("dp_ob_02"),
  },
  {
    id: "degraded",
    label: "B2 · Auto-paused (degraded) — carrier failures spiked",
    must: [
      "clearly DISTINCT from paced: this one needs attention (destructive tone) + names the cause (SIP 503)",
      "links the fix (trunk CPS / connect); resume is available but informed",
    ],
    deployment: byId("dp_ob_04"),
  },
  {
    id: "done-partial",
    label: "B3 · Completed — Partial (not all succeeded)",
    must: [
      "honest completion: names how many connected vs flagged (disconnected/wrong-number), not a blanket success",
      "the disposition breakdown is legible at a glance",
    ],
    deployment: byId("dp_ob_03"),
  },
]

export const REQUIREMENTS = [
  "R1 queued/dialing/completed breakdown (not one counter)",
  "R2 Paced badge — neutral/primary, never warning",
  "R3 concurrency gauge on the view",
  "R4 retry attempt counter",
  "R5 full disposition set in the call list",
  "R6 degraded visibly separate from paced + fix link",
  "R7 live ETA from pace × queue",
  "R8 every zero-progress moment shows its reason",
  "R9 A6 at-the-wall add-lines unlock when paced",
] as const

export interface BatchVariantProps {
  scenario: BatchScenario
}
