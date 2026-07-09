// A3 itsp-lab SPEC — shared contract for the key→auto-SIP-trunk variants.
// THROWAWAY HARNESS (judged → winner folded → deleted).
//
// The honest state machine (research 2026-07-09 — every variant renders it):
//   1 validate credentials   → fails: 401 bad SID/token, suspended account
//   2 enumerate numbers      → fails: zero numbers; outbound-only caller IDs
//     (capability badges BEFORE selection — ElevenLabs parity)
//   3 create trunk + routing → fails: partial creation (name the failed object)
//   4 associate number       → fails: already on another trunk; geo-blocked
//     (32205); emergency-lock (21634); and association SILENTLY OVERWRITES
//     existing voice routing → explicit confirm required
//   5 verify with a REAL test call → provisioning success ≠ call success;
//     never end on a "saved" checkmark
//
// Security: scoped API key preferred; Account SID + Auth Token allowed but
// labeled the less-secure path. Stored credentials mask to last 4, show a
// connected-at timestamp, disconnect ≠ carrier-side revocation — say so.
// Friction being deleted: Retell = 5 manual steps across two consoles,
// Vapi = 9 (two of them raw API calls). Agora does NOT sell numbers — the
// user brings an already-owned number; never imply auto-purchase.

export type ItspStage = "credentials" | "enumerate" | "create" | "associate" | "verify" | "done"

export interface ItspScenario {
  id: string
  label: string
  must: string[]
  /** Where the mock run stalls/fails; null = happy path to done. */
  failAt: ItspStage | null
  /** Which failure flavor at that stage (drives copy). */
  failure?: "bad-creds" | "no-numbers" | "on-other-trunk" | "geo-blocked" | "verify-fail"
}

export const SCENARIOS: ItspScenario[] = [
  {
    id: "happy",
    label: "T0 · Happy path — key to verified trunk",
    must: [
      "≤4 inputs before automation starts (ElevenLabs-parity: label, provider, credential pair)",
      "each stage names plausible work; number picker shows capability badges (inbound+outbound vs outbound-only)",
      "the flow ENDS on a real test call, not a saved checkmark",
    ],
    failAt: null,
  },
  {
    id: "bad-creds",
    label: "T1 · Bad credentials (401)",
    must: [
      "names the exact fix (check SID/token) + where to find them at the carrier",
      "nothing else is claimed to have happened — no partial-success ambiguity",
    ],
    failAt: "credentials",
    failure: "bad-creds",
  },
  {
    id: "no-numbers",
    label: "T2 · Zero numbers in the account",
    must: [
      "empty state deep-links to buying a number AT THE CARRIER (Agora sells none)",
      "trunk creation does not proceed against an empty account",
    ],
    failAt: "enumerate",
    failure: "no-numbers",
  },
  {
    id: "on-other-trunk",
    label: "T3 · Number already routed elsewhere",
    must: [
      "explicit pre-overwrite confirmation: attaching deletes the number's existing voice routing",
      "declining keeps everything untouched; the choice is calm, not scary",
    ],
    failAt: "associate",
    failure: "on-other-trunk",
  },
  {
    id: "geo-blocked",
    label: "T4 · Geo permissions block (32205)",
    must: [
      "the carrier-side setting is named + linked; retry re-runs ONLY the failed stage",
      "completed stages stay visibly done",
    ],
    failAt: "associate",
    failure: "geo-blocked",
  },
  {
    id: "verify-fail",
    label: "T5 · Provisioned but the test call fails",
    must: [
      "says plainly: configuration exists, calls don't connect yet — different facts",
      "links the carrier's own call logs; offers retry + the manual-SIP fallback",
    ],
    failAt: "verify",
    failure: "verify-fail",
  },
]

export const PROVIDERS = [
  { id: "twilio", label: "Twilio", cred: "Account SID + Auth Token (or a scoped API key — safer)" },
  { id: "telnyx", label: "Telnyx", cred: "API key" },
] as const

/** Numbers the mock enumeration returns (capability per research). */
export const MOCK_NUMBERS = [
  { e164: "+1 (415) 555-0132", capability: "inbound+outbound" as const, label: "Purchased" },
  { e164: "+1 (628) 555-0177", capability: "inbound+outbound" as const, label: "Purchased" },
  { e164: "+44 20 7946 0958", capability: "outbound-only" as const, label: "Verified caller ID" },
]

export const REQUIREMENTS = [
  "R1 ≤4 inputs; scoped-key preferred, auth-token labeled less-secure",
  "R2 staged honest narration; retry re-runs only the failed stage",
  "R3 capability badges before number selection",
  "R4 pre-overwrite confirmation on association",
  "R5 per-failure copy with the carrier-side fix named + linked",
  "R6 flow ends on a REAL test call",
  "R7 stored credential: masked, timestamped, disconnect ≠ revocation",
  "R8 manual-SIP fallback always reachable; never imply number auto-purchase",
] as const

export interface ItspVariantProps {
  scenario: ItspScenario
}
