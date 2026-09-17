/**
 * Delivery — how the agent sounds, not what it says (design 06).
 *
 * Every vendor names the same idea differently and measures it differently:
 * ElevenLabs draws Stability as "More expressive" against "More consistent"
 * with no number at all; Vapi shows a raw Speed slider; MiniMax takes 0.5 to
 * 2.0; Tencent calls normal 0 and runs to 6. A builder should not have to
 * learn twelve scales to slow a voice down.
 *
 * So Pace is one handle, 0 to 100, with 50 meaning "the way this voice
 * normally speaks". The value text still shows the vendor's own number, so
 * nothing is hidden. Everything the vendors do NOT share stays vendor-native:
 * a fake universal knob is worse than an absent one.
 */

// ─── pace: one handle, mapped per vendor ─────────────────────────────────────

export interface PaceRange {
  field: string
  min: number
  normal: number
  max: number
  /** How the vendor writes its own value. */
  unit: "times" | "plain"
}

const PACE: Record<string, PaceRange> = {
  ElevenLabs: { field: "params.speed", min: 0.7, normal: 1.0, max: 1.2, unit: "times" },
  Azure: { field: "params.speed", min: 0.5, normal: 1.0, max: 2.0, unit: "times" },
  OpenAI: { field: "params.speed", min: 0.25, normal: 1.0, max: 4.0, unit: "times" },
  MiniMax: { field: "voice_setting.speed", min: 0.5, normal: 1.0, max: 2.0, unit: "times" },
  Google: { field: "AudioConfig.speaking_rate", min: 0.25, normal: 1.0, max: 2.0, unit: "times" },
  // Cartesia has no speed field in the contract. It is listed here so the
  // absence is a fact on the row rather than a gap in the table.
}

export const paceRange = (vendor: string): PaceRange | null => PACE[vendor] ?? null

/** 0 to 100 into the vendor's own number. 50 is always the vendor's normal. */
export function paceToVendor(v: number, r: PaceRange): number {
  const raw = v <= 50
    ? r.min + (v / 50) * (r.normal - r.min)
    : r.normal + ((v - 50) / 50) * (r.max - r.normal)
  return Math.round(raw * 100) / 100
}

/** The vendor's number back onto the handle, so a saved agent reopens where it was. */
export function paceFromVendor(raw: number, r: PaceRange): number {
  const v = raw <= r.normal
    ? ((raw - r.min) / (r.normal - r.min)) * 50
    : 50 + ((raw - r.normal) / (r.max - r.normal)) * 50
  return Math.round(Math.min(100, Math.max(0, v)))
}

/** What the value reads as beside the slider. */
export function paceLabel(v: number, vendor: string): string {
  const r = paceRange(vendor)
  if (!r) return ""
  const n = paceToVendor(v, r)
  if (v === 50) return r.unit === "times" ? `${n.toFixed(1)}x · normal` : `${n} · normal`
  return r.unit === "times" ? `${n.toFixed(2)}x` : String(n)
}

// ─── the handles a vendor actually has ───────────────────────────────────────

export interface VendorHandle {
  key: string
  label: string
  /** The ends of the scale, the way ElevenLabs writes them: a person can act
   *  on "more expressive" where they cannot act on "0.35". */
  low: string
  high: string
  min: number
  max: number
  step: number
  default: number
}

const HANDLES: Record<string, VendorHandle[]> = {
  ElevenLabs: [
    { key: "stability", label: "Stability", low: "More expressive", high: "More consistent", min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: "similarity", label: "Similarity", low: "Low", high: "High", min: 0, max: 1, step: 0.05, default: 0.75 },
  ],
  Azure: [
    { key: "volume", label: "Volume", low: "Quiet", high: "Loud", min: 0, max: 100, step: 1, default: 50 },
    { key: "pitch", label: "Pitch", low: "Lower", high: "Higher", min: -50, max: 50, step: 1, default: 0 },
  ],
  MiniMax: [
    { key: "volume", label: "Volume", low: "Quiet", high: "Loud", min: 0.1, max: 10, step: 0.1, default: 1 },
    { key: "pitch", label: "Pitch", low: "Lower", high: "Higher", min: -12, max: 12, step: 1, default: 0 },
  ],
}

export const vendorHandles = (vendor: string): VendorHandle[] => HANDLES[vendor] ?? []

// ─── tone: a prompt, only where the vendor takes one ─────────────────────────

/** Vendors whose TTS accepts a free-text instruction about delivery. */
const TONE_FIELD: Record<string, string> = {
  OpenAI: "params.instructions",
  Generic: "params.instruction",
}

export const toneField = (vendor: string): string | null => TONE_FIELD[vendor] ?? null

// ─── pronunciation: every vendor, two different mechanisms ───────────────────

export interface PronunciationSupport {
  /** What the vendor calls it, for the line under the table. */
  mechanism: "dictionary" | "replacement"
  field: string
  limit: number
  note: string
}

const PRONUNCIATION: Record<string, PronunciationSupport> = {
  ElevenLabs: {
    mechanism: "dictionary",
    field: "tts.params.pronunciation_dictionary",
    limit: 25,
    note: "ElevenLabs applies these as a lexicon, case sensitive.",
  },
  MiniMax: {
    mechanism: "dictionary",
    field: "tts.params.pronunciation_dict.tone",
    limit: 25,
    note: "MiniMax applies these as a pronunciation dictionary.",
  },
}

const REPLACEMENT_FALLBACK: PronunciationSupport = {
  mechanism: "replacement",
  field: "tts.voice_formatting.custom_replacements",
  limit: 5,
  note: "This vendor has no pronunciation dictionary, so the word is swapped in the text before it is spoken. Five swaps maximum.",
}

/** Nobody is left without a way to fix a name. The row names which one you get. */
export const pronunciationSupport = (vendor: string): PronunciationSupport =>
  PRONUNCIATION[vendor] ?? REPLACEMENT_FALLBACK

// ─── the delivery settings a draft carries ───────────────────────────────────

export interface PronunciationRule {
  word: string
  sayAs: string
}

export interface DeliveryConfig {
  /** 0 to 100, 50 = the voice's normal pace. Absent = untouched. */
  pace?: number
  /** Vendor-native handles, keyed by VendorHandle.key. */
  handles?: Record<string, number>
  /** A line of direction for vendors that take one. */
  tone?: string
  pronunciation?: PronunciationRule[]
}

export const deliveryOf = (d: DeliveryConfig | undefined): DeliveryConfig => ({
  pace: d?.pace ?? 50,
  handles: d?.handles ?? {},
  tone: d?.tone ?? "",
  pronunciation: d?.pronunciation ?? [],
})

/** The one-line recap on the TTS row, so the settings are visible unopened. */
export function deliveryRecap(d: DeliveryConfig | undefined, vendor: string): string | null {
  const v = deliveryOf(d)
  const bits: string[] = []
  if (v.pace !== 50 && paceRange(vendor)) bits.push(`pace ${paceLabel(v.pace ?? 50, vendor)}`)
  for (const h of vendorHandles(vendor)) {
    const n = v.handles?.[h.key]
    if (n !== undefined && n !== h.default) bits.push(`${h.label.toLowerCase()} ${n}`)
  }
  if (v.tone?.trim() && toneField(vendor)) bits.push("tone set")
  const words = v.pronunciation?.filter((p) => p.word.trim()).length ?? 0
  if (words) bits.push(`${words} pronunciation${words === 1 ? "" : "s"}`)
  return bits.length ? bits.join(" · ") : null
}
