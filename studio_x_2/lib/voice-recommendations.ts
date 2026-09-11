import type { VoiceArtifact } from "@/lib/voice-artifacts"

/**
 * Voice recommendations (Design Tracker 01, verdict A): the catalog has no
 * use-case field — the agent's prompt IS the use case. Both functions are pure
 * and deterministic: a keyword table infers the use case from the words the
 * builder already wrote, and a tag scorer ranks the catalog against it. No
 * benchmarks, no API — the strip says so out loud ("Based on voice tags").
 */

export type VoiceUseCase = "support" | "sales" | "booking" | "tutoring" | "storytelling"

/** Tie-break order: the first listed wins an equal keyword count. */
export const VOICE_USE_CASES: VoiceUseCase[] = ["support", "sales", "booking", "tutoring", "storytelling"]

/** Word-start matches (`\b`), so "book" also hits "booking" and "narrat"
 *  hits "narrate" / "narration". Two entries are regex fragments: "read" only
 *  as read / reads / reading (never "ready"), and "order" never as the
 *  connective "in order to". */
const KEYWORDS: Record<VoiceUseCase, string[]> = {
  support: ["support", "help", "(?<!\\bin )order(?! to\\b)", "ticket", "refund", "troubleshoot"],
  sales: ["sales", "qualify", "demo", "pricing", "lead"],
  booking: ["appointment", "book", "schedule", "reschedule", "reminder"],
  tutoring: ["tutor", "lesson", "teach", "quiz"],
  storytelling: ["story", "narrat", "read(?:s|ing)?\\b"],
}

/** Compiled once — one global word-start matcher per use case. */
const KEYWORD_RE: Record<VoiceUseCase, RegExp> = Object.fromEntries(
  VOICE_USE_CASES.map((u) => [u, new RegExp(`\\b(?:${KEYWORDS[u].join("|")})`, "g")]),
) as Record<VoiceUseCase, RegExp>

/** Best-fit `voiceType` per use case — first entry scores higher than the second. */
const VOICE_TYPES: Record<VoiceUseCase, string[]> = {
  support: ["Support", "Healthcare"],
  sales: ["Sales"],
  booking: ["Reception", "Assistant"],
  tutoring: ["Assistant", "Narration"],
  storytelling: ["Narration"],
}

/** Trait chips that add a point each. */
const TRAITS: Record<VoiceUseCase, string[]> = {
  support: ["Warm", "Calm", "Patient", "Clear", "Helpful", "Empathetic"],
  sales: ["Confident", "Crisp", "Upbeat", "Energetic"],
  booking: ["Bright", "Friendly", "Clear", "Steady"],
  tutoring: ["Patient", "Clear", "Measured", "Articulate"],
  storytelling: ["Measured", "Articulate", "Soft"],
}

/** Spoken-language name (STACK_CATALOG.languages) → BCP-47 prefix of `voice.language`. */
const LANGUAGE_CODES: Record<string, string> = {
  English: "en", Spanish: "es", French: "fr", German: "de", Hindi: "hi", Mandarin: "zh",
}

export function inferVoiceUseCase(hint: {
  systemPrompt: string
  greeting: string
  templateName?: string
}): VoiceUseCase | null {
  const text = `${hint.templateName ?? ""} ${hint.systemPrompt} ${hint.greeting}`.toLowerCase()
  if (!text.trim()) return null
  let best: VoiceUseCase | null = null
  let bestHits = 0
  for (const useCase of VOICE_USE_CASES) {
    const hits = (text.match(KEYWORD_RE[useCase]) ?? []).length
    if (hits > bestHits) { best = useCase; bestHits = hits }
  }
  return best
}

/** Tag score for one voice: type fit (3 / 2) + one per matching trait + one
 *  for a language match. Custom voices carry no tags, so they only score on
 *  language — they surface only when nothing better exists. */
export function scoreVoiceForUseCase(
  voice: VoiceArtifact,
  useCase: VoiceUseCase | null,
  opts: { language?: string } = {},
): number {
  let score = 0
  if (useCase) {
    const types = VOICE_TYPES[useCase]
    const typeIndex = voice.voiceType ? types.indexOf(voice.voiceType) : -1
    if (typeIndex === 0) score += 3
    else if (typeIndex > 0) score += 2
    const traits = TRAITS[useCase]
    score += (voice.traits ?? []).filter((t) => traits.includes(t)).length
  }
  const code = opts.language ? LANGUAGE_CODES[opts.language] : undefined
  if (code && voice.language.toLowerCase().startsWith(code)) score += 1
  return score
}

/** Top three by tag score; ties keep catalog order, so the result is stable
 *  across renders and reloads. */
export function rankVoicesForUseCase(
  voices: VoiceArtifact[],
  useCase: VoiceUseCase | null,
  opts: { language?: string } = {},
  limit = 3,
): VoiceArtifact[] {
  return voices
    .map((voice, index) => ({ voice, index, score: scoreVoiceForUseCase(voice, useCase, opts) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((r) => r.voice)
}
