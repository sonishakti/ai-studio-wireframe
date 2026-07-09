// Journey progress — the localStorage persistence salvaged from the deleted
// ActivationChecklist (A1, 2026-07-09). The five moments mirror the landing's
// journey (hear Aria → voice → prompt → channel → live); flags are per-browser
// mock state. Deliberately NO second checklist surface renders from this —
// the deploy block stays the page's single progress fraction (2026-07-07 audit
// lock); these flags power step credit (e.g. the playground marks "hear" at
// call end) and future endowed-state styling on the existing rail.

export type JourneyStepId = "hear" | "voice" | "prompt" | "channel" | "live"

export const JOURNEY_STEP_IDS: JourneyStepId[] = [
  "hear",
  "voice",
  "prompt",
  "channel",
  "live",
]

/** First-run provisioning ceremony — shown once per browser. */
export const PROVISIONED_KEY = "sx:provisioned"

const flagKey = (id: JourneyStepId) => `sx:journey:${id}`

function read(key: string): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(key) === "1"
}

function write(key: string, value: boolean) {
  if (typeof window === "undefined") return
  if (value) window.localStorage.setItem(key, "1")
  else window.localStorage.removeItem(key)
}

export function journeyDone(id: JourneyStepId): boolean {
  return read(flagKey(id))
}

export function markJourneyStep(id: JourneyStepId) {
  write(flagKey(id), true)
}

export function journeyCount(): { done: number; total: number } {
  return {
    done: JOURNEY_STEP_IDS.filter((id) => read(flagKey(id))).length,
    total: JOURNEY_STEP_IDS.length,
  }
}

export function isProvisioned(): boolean {
  return read(PROVISIONED_KEY)
}

export function markProvisioned() {
  write(PROVISIONED_KEY, true)
}

export function resetProvisioned() {
  write(PROVISIONED_KEY, false)
}
