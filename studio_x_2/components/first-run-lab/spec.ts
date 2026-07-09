// A1 first-run-lab SPEC — shared contract for the first-session variants.
// THROWAWAY HARNESS (the /agents/proto convention): judged, folded, deleted.
//
// A1's scope is the first-session FLOW around the LOCKED /agents landing
// (Aria left · journey steps right — layout must be respected, not redesigned):
//   (a) the provisioning wait (>30s project creation) presented as staged,
//       labeled, honest work — with a timeout/error state
//   (b) the default stack NAMED with a one-line why ("change anytime")
//   (c) the journey steps gaining endowed progress state (checks · n/5 ·
//       collapse) — replacing the deleted standalone ActivationChecklist
//   (d) template quality signals (vertical label · Recommended · voice preview)

export type FirstRunPhase =
  | "provisioning"          // account just created; staged narration runs
  | "provisioning-error"    // a stage timed out; retry affordance
  | "first-visit"           // Aria live; 0/5 journey; talk CTA dominant
  | "returning-incomplete"  // 2/5 persisted; next step highlighted
  | "returning-complete"    // 5/5 → progress chrome retires into shortcuts

export interface FirstRunScenario {
  id: FirstRunPhase
  label: string
  /** What a correct rendering MUST communicate in this phase. */
  must: string[]
  /** Journey-step completion fed to the variant (mirrors localStorage flags). */
  stepsDone: number
}

export const SCENARIOS: FirstRunScenario[] = [
  {
    id: "provisioning",
    label: "P0 · Provisioning — staged, labeled, honest",
    must: [
      "3–4 stages naming plausible work (create project → provision Aria → warm voice pipeline), never a bare spinner",
      "a concrete honest estimate (\"usually under 40 seconds\"), no invented percentages",
      "the wait sells the payoff: what Aria will be able to do the moment it ends",
    ],
    stepsDone: 0,
  },
  {
    id: "provisioning-error",
    label: "P0e · Provisioning stalled — retry, no dead end",
    must: [
      "names the stage that stalled; everything already finished stays visibly done",
      "one retry CTA; a docs/status escape hatch; zero blame copy",
    ],
    stepsDone: 0,
  },
  {
    id: "first-visit",
    label: "P1 · First visit — Aria live, talk in seconds",
    must: [
      "talking to Aria in-browser is the unmistakable primary action (the 0-setup differentiator no competitor has)",
      "the default stack is NAMED with a one-line why + \"change anytime\" — honest claims only",
      "journey steps read 0/5 with the first step (hear Aria) highlighted",
    ],
    stepsDone: 0,
  },
  {
    id: "returning-incomplete",
    label: "P2 · Returning — 2/5 done, next up highlighted",
    must: [
      "endowed progress: checks + 2/5 count persisted; next step visually 'up next'",
      "collapsible/dismissible — never a nag; completed steps stay one click away",
    ],
    stepsDone: 2,
  },
  {
    id: "returning-complete",
    label: "P3 · Complete — progress chrome retires",
    must: [
      "no permanent 5/5 trophy; steps graduate into scale-oriented shortcuts",
      "the surface still earns its place for a power user (nothing feels vestigial)",
    ],
    stepsDone: 5,
  },
]

/** The five journey steps (mirrors the live landing's shortcuts — do NOT
 *  invent new steps; A1 upgrades their STATE, not their content). */
export const JOURNEY_STEPS = [
  { id: "hear",     title: "Hear Aria take a call",    verb: "Talk to Aria" },
  { id: "voice",    title: "Make her sound like you",  verb: "Pick voice" },
  { id: "prompt",   title: "Teach her your business",  verb: "Edit prompt" },
  { id: "channel",  title: "Connect a channel",        verb: "Choose channel" },
  { id: "live",     title: "Put her to work",          verb: "Go live" },
] as const

/** Named default stack — the "smart model by default" claim made visible.
 *  Values come from STACK_PRESETS "balanced"; claims must stay honest
 *  (no fabricated benchmark deltas). */
export const NAMED_DEFAULT = {
  name: "Agora Balanced",
  why: "smart model by default, sub-second replies, natural voices",
  chips: ["GPT-4o", "Deepgram ASR", "ElevenLabs TTS", "~800 ms"],
  escape: "Change any part of it anytime.",
} as const

export const REQUIREMENTS = [
  "R1 provisioning = staged labeled narration, honest estimate, no fake %",
  "R2 provisioning error state: stalled stage named, retry, no dead end",
  "R3 talk-to-Aria is the dominant first-visit action (in-browser, zero setup)",
  "R4 default stack named + why + change-anytime; claims honest",
  "R5 journey steps carry endowed progress (checks, n/5, next-up highlight)",
  "R6 progress chrome is collapsible/dismissible and retires at completion",
  "R7 locked landing layout respected (Aria left · steps right) — additive only",
  "R8 steps are value verbs, not chores",
  "R9 tokens only; meters/progress accessible (roles + labels)",
  "R10 no second competing checklist anywhere",
] as const

export interface FirstRunVariantProps {
  scenario: FirstRunScenario
}
