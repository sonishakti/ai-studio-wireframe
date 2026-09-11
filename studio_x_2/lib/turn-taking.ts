import type { AdvancedConfig } from "@/lib/wizard-draft"

/**
 * Turn-taking presets + recap (Design Tracker 02, verdict A): a preset is a
 * NAME for numbers the raw rows already hold, so applying one writes both the
 * name and the numbers, and the recap prints whatever is effective — "presets
 * resolve to visible values". Pure functions; the row and the Test chip both
 * read from here.
 */

export type TurnPreset = AdvancedConfig["turnDetection"]["preset"]
export type NamedTurnPreset = Exclude<TurnPreset, "custom">

export interface TurnPresetValues {
  /** startOfSpeech.interruptMs — speech needed while the agent talks. */
  interruptMs: number
  /** endOfSpeech.silenceMs — silence before it answers (VAD). */
  silenceMs: number
  /** endOfSpeech.mode. */
  eos: AdvancedConfig["endOfSpeech"]["mode"]
  /** endOfSpeech.maxWaitMs — only meaningful for the semantic mode. */
  maxWaitMs?: number
}

export const TURN_PRESET_VALUES: Record<NamedTurnPreset, TurnPresetValues> = {
  responsive: { interruptMs: 120, silenceMs: 400, eos: "vad" },
  balanced: { interruptMs: 160, silenceMs: 640, eos: "vad" },
  patient: { interruptMs: 320, silenceMs: 480, eos: "semantic", maxWaitMs: 8000 },
}

export const TURN_PRESET_ORDER: TurnPreset[] = ["responsive", "balanced", "patient", "custom"]

export const TURN_PRESET_LABELS: Record<TurnPreset, string> = {
  responsive: "Responsive",
  balanced: "Balanced",
  patient: "Patient",
  custom: "Custom",
}

/** True when the raw numbers equal what the named preset means. */
export function presetMatches(adv: AdvancedConfig, preset: NamedTurnPreset): boolean {
  const p = TURN_PRESET_VALUES[preset]
  return (
    adv.startOfSpeech.mode === "vad" &&
    adv.startOfSpeech.interruptMs === p.interruptMs &&
    adv.endOfSpeech.mode === p.eos &&
    adv.endOfSpeech.silenceMs === p.silenceMs &&
    (p.maxWaitMs === undefined || adv.endOfSpeech.maxWaitMs === p.maxWaitMs)
  )
}

/** Apply a preset: the name AND its numbers. `custom` writes only the name —
 *  the raw rows keep whatever they hold and stay editable. */
export function applyTurnPreset(adv: AdvancedConfig, preset: TurnPreset): AdvancedConfig {
  if (preset === "custom") {
    return { ...adv, turnDetection: { ...adv.turnDetection, preset } }
  }
  const p = TURN_PRESET_VALUES[preset]
  return {
    ...adv,
    turnDetection: { ...adv.turnDetection, preset },
    startOfSpeech: { ...adv.startOfSpeech, mode: "vad", interruptMs: p.interruptMs },
    endOfSpeech: {
      ...adv.endOfSpeech,
      mode: p.eos,
      silenceMs: p.silenceMs,
      ...(p.maxWaitMs !== undefined ? { maxWaitMs: p.maxWaitMs } : {}),
    },
  }
}

/** After a manual edit in the raw rows: a named preset whose numbers no
 *  longer match flips to `custom`, so the row above never lies. */
export function reconcileTurnPreset(adv: AdvancedConfig): AdvancedConfig {
  const preset = adv.turnDetection.preset
  if (preset === "custom" || presetMatches(adv, preset)) return adv
  return { ...adv, turnDetection: { ...adv.turnDetection, preset: "custom" } }
}

const seconds = (ms: number) => String(Number((ms / 1000).toFixed(2)))

/** Recap fragments for the line under the presets — joined with " · ". */
export function turnTakingRecap(adv: AdvancedConfig): string[] {
  const { turnDetection: td, startOfSpeech: sos, endOfSpeech: eos } = adv
  const out: string[] = []

  const canInterrupt = td.enabled && sos.enabled
  if (!canInterrupt) {
    out.push("Finishes speaking, then answers")
  } else if (sos.mode === "keyword") {
    out.push(
      sos.keywords.length
        ? `Interrupts on ${sos.keywords.map((k) => `“${k}”`).join(", ")}`
        : "Interrupts on a keyword (none set)",
    )
  } else {
    out.push(`Interrupts after ${sos.interruptMs} ms of speech`)
  }

  if (eos.enabled) {
    out.push(
      eos.mode === "semantic"
        ? `waits for the end of the thought, up to ${seconds(eos.maxWaitMs)} s`
        : `waits ${eos.silenceMs} ms of silence`,
    )
  }

  if (!td.enabled) out.push("interruptions off")
  else if (sos.enabled) out.push("interruptions on")

  return out
}

/** The Test tab's "Try interrupting" verdict — quotes the effective preset. */
export function interruptVerdict(adv: AdvancedConfig): string {
  if (!adv.turnDetection.enabled) return "Couldn't interrupt · interruptions are off"
  if (!adv.startOfSpeech.enabled) return "Couldn't interrupt · start of speech is off"
  if (adv.startOfSpeech.mode === "keyword") return "Not available in keyword mode"
  return `Interrupted after ${adv.startOfSpeech.interruptMs} ms · ${TURN_PRESET_LABELS[adv.turnDetection.preset]} · resumed with your words`
}
