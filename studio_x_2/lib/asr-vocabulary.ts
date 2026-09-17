/**
 * Recognition — the words the agent has to get right, and what happens when
 * the recogniser fails (design 03).
 *
 * The field research said the same thing three times over. Vapi asks you to
 * learn each provider's own field (Deepgram `keywords` with an intensifier,
 * Deepgram `keyterm` without one, AssemblyAI `keytermsPrompt`). Retell has one
 * provider-agnostic `boosted_keywords` list. ElevenLabs has one "Keywords"
 * box that says what it is for and counts down from a hard cap: "0 / 50
 * keywords". Two of the three agree: ONE list, mapped for you.
 *
 * So the builder shows one Vocabulary list. This table is the mapping, and it
 * is also the honesty floor: a vendor with no field says so on the row instead
 * of accepting words that quietly go nowhere.
 */

import { BACKUP_CANDIDATES, backupOf, candidateById, type BackupConfig } from "@/lib/backup-providers"
import type { AgentStack } from "@/lib/campaign-data"

// ─── what each recogniser can actually be told ───────────────────────────────

export interface VocabularySupport {
  /** Where the words land. Null = this vendor has no field for them. */
  field: string | null
  /** How many words the vendor takes. Null = the vendor has not published one. */
  limit: number | null
  /** Multi-word phrases ("Nova Scotia"), or single tokens only. */
  phrases: boolean
  /** Only these models carry the field. Absent = every model on the vendor. */
  models?: string[]
  /** One line under the list, in the vendor's own terms. */
  note: string
}

const NONE: VocabularySupport = {
  field: null,
  limit: null,
  phrases: false,
  note: "",
}

/** Keyed by the vendor names in STACK_CATALOG.stt and BACKUP_CANDIDATES. */
const VOCABULARY: Record<string, VocabularySupport> = {
  Agora: {
    field: "asr.keywords",
    limit: null,
    phrases: true,
    note: "Agora's own recogniser takes the list directly. No published limit yet.",
  },
  Deepgram: {
    field: "asr.params.keyterm",
    limit: 50,
    phrases: true,
    models: ["nova-3", "Nova-3"],
    note: "Nova-3 only. Deepgram advises the 20 to 50 terms that matter most.",
  },
  AssemblyAI: {
    field: "asr.params.keyterms_prompt",
    limit: 100,
    phrases: true,
    note: "Up to 100 terms, 50 characters each.",
  },
  Whisper: {
    field: "asr.params.input_audio_transcription.prompt",
    limit: null,
    phrases: true,
    note: "Whisper has no word list. The terms are appended to the transcription prompt, which is a hint rather than a rule.",
  },
  OpenAI: {
    field: "asr.params.input_audio_transcription.prompt",
    limit: null,
    phrases: true,
    note: "Whisper has no word list. The terms are appended to the transcription prompt, which is a hint rather than a rule.",
  },
  Azure: {
    field: "asr.params.phrase_list",
    limit: null,
    phrases: true,
    note: "Azure takes the list as a phrase list.",
  },
  Google: NONE,
}

/** What this recogniser will do with a vocabulary list. */
export function vocabularySupport(vendor: string, model?: string): VocabularySupport {
  const s = VOCABULARY[vendor] ?? NONE
  // A field that only exists on one model is not a field on the others. Say
  // which model it needs rather than accepting words the call will ignore.
  if (s.field && s.models && model && !s.models.some((m) => m.toLowerCase() === model.toLowerCase())) {
    return { ...s, field: null, note: `${vendor} carries a vocabulary on ${s.models[0]} only.` }
  }
  return s
}

/** The words that are too long for the vendor, or past its limit. */
export function vocabularyProblems(words: string[], s: VocabularySupport): string[] {
  const out: string[] = []
  if (s.limit && words.length > s.limit) out.push(`${words.length} words is over the limit of ${s.limit}.`)
  const multi = words.filter((w) => w.trim().includes(" "))
  if (!s.phrases && multi.length) out.push(`${multi.length} of these are phrases, and this vendor takes single words.`)
  return out
}

// ─── the spoken language ─────────────────────────────────────────────────────

/**
 * The full set the join contract accepts (`asr.language`, 32 BCP-47 tags).
 * The console shipped ten of them, which made 22 languages look unsupported
 * when they were only unlisted. Retell's own guidance is that a single-language
 * agent is the most accurate setup, so this stays one choice, not a multi-select.
 */
export const ASR_LANGUAGES: { tag: string; label: string }[] = [
  { tag: "en-US", label: "English (United States)" },
  { tag: "en-IN", label: "English (India)" },
  { tag: "ar-AE", label: "Arabic (United Arab Emirates)" },
  { tag: "ar-EG", label: "Arabic (Egypt)" },
  { tag: "ar-JO", label: "Arabic (Jordan)" },
  { tag: "ar-SA", label: "Arabic (Saudi Arabia)" },
  { tag: "bn-IN", label: "Bengali (India)" },
  { tag: "de-DE", label: "German (Germany)" },
  { tag: "es-ES", label: "Spanish (Spain)" },
  { tag: "fa-IR", label: "Persian (Iran)" },
  { tag: "fil-PH", label: "Filipino (Philippines)" },
  { tag: "fr-FR", label: "French (France)" },
  { tag: "gu-IN", label: "Gujarati (India)" },
  { tag: "he-IL", label: "Hebrew (Israel)" },
  { tag: "hi-IN", label: "Hindi (India)" },
  { tag: "id-ID", label: "Indonesian (Indonesia)" },
  { tag: "it-IT", label: "Italian (Italy)" },
  { tag: "ja-JP", label: "Japanese (Japan)" },
  { tag: "kn-IN", label: "Kannada (India)" },
  { tag: "ko-KR", label: "Korean (South Korea)" },
  { tag: "ms-MY", label: "Malay (Malaysia)" },
  { tag: "nl-NL", label: "Dutch (Netherlands)" },
  { tag: "pt-PT", label: "Portuguese (Portugal)" },
  { tag: "ru-RU", label: "Russian (Russia)" },
  { tag: "ta-IN", label: "Tamil (India)" },
  { tag: "te-IN", label: "Telugu (India)" },
  { tag: "th-TH", label: "Thai (Thailand)" },
  { tag: "tr-TR", label: "Turkish (Turkey)" },
  { tag: "vi-VN", label: "Vietnamese (Vietnam)" },
  { tag: "zh-CN", label: "Chinese (Mainland)" },
  { tag: "zh-HK", label: "Chinese (Hong Kong)" },
  { tag: "zh-TW", label: "Chinese (Taiwan)" },
]

export const languageLabel = (tag: string) =>
  ASR_LANGUAGES.find((l) => l.tag === tag)?.label ?? tag

/** The plain-language name a builder picked on step one, mapped to a tag. */
const SPOKEN_TO_TAG: Record<string, string> = {
  English: "en-US",
  Spanish: "es-ES",
  French: "fr-FR",
  German: "de-DE",
  Hindi: "hi-IN",
  Mandarin: "zh-CN",
}

export const defaultLanguageTag = (spoken?: string) =>
  (spoken && SPOKEN_TO_TAG[spoken]) || "en-US"

// ─── the recognition settings a draft carries ────────────────────────────────

export interface RecognitionConfig {
  /** One primary language, as a BCP-47 tag. */
  language: string
  /** Names the agent must get right: brands, products, jargon. */
  vocabulary: string[]
  /** Languages the agent should also accept mid-call. No engine field yet. */
  alsoUnderstands: string[]
}

export const DEFAULT_RECOGNITION: RecognitionConfig = {
  language: "en-US",
  vocabulary: [],
  alsoUnderstands: [],
}

export const recognitionOf = (r: RecognitionConfig | undefined, spoken?: string): RecognitionConfig => ({
  language: r?.language ?? defaultLanguageTag(spoken),
  vocabulary: r?.vocabulary ?? [],
  alsoUnderstands: r?.alsoUnderstands ?? [],
})

// ─── what the backups can carry ──────────────────────────────────────────────

export interface VocabularyCarry {
  vendor: string
  model: string
  /** How many of the list's words this recogniser can be told about. */
  carries: number
  support: VocabularySupport
}

/**
 * A failover that drops the vocabulary is the rainy path nobody shows: the
 * backup takes over and the brand names start coming back wrong. Vapi lets each
 * fallback transcriber carry its own config but never says what is lost. This
 * says it, on the row, before the call.
 */
export function vocabularyCarry(input: {
  stack: AgentStack
  backup?: BackupConfig
  words: string[]
}): { primary: VocabularyCarry; backups: VocabularyCarry[] } {
  const { stack, words } = input
  const b = backupOf(input.backup)

  const forVendor = (vendor: string, model: string): VocabularyCarry => {
    const support = vocabularySupport(vendor, model)
    const carries = support.field ? (support.limit ? Math.min(words.length, support.limit) : words.length) : 0
    return { vendor, model, carries, support }
  }

  const entries = b.entries.asr ?? []
  return {
    primary: forVendor(stack.asr.vendor, stack.asr.model),
    backups: entries
      .filter((e) => e.enabled)
      .map((e) => {
        const cand = candidateById(e.id) ?? BACKUP_CANDIDATES.find((c) => c.slot === "asr")
        return forVendor(cand?.vendor ?? "", e.model ?? cand?.model ?? "")
      }),
  }
}

// ─── did the test call actually hear them ────────────────────────────────────

export interface HeardWord {
  word: string
  heard: boolean
  /** What came back instead, when the transcript has a near miss. */
  insteadOf?: string
}

/**
 * The acceptance criterion behind this feature is "builders can test
 * representative phrases before publication", and no competitor offers it as a
 * control. The test rail already streams the caller's transcript, so the check
 * is a comparison rather than new plumbing: say the words, see which came back.
 */
export function heardInTranscript(words: string[], transcript: string): HeardWord[] {
  const hay = transcript.toLowerCase()
  const tokens = hay.split(/[^a-z0-9']+/).filter(Boolean)
  return words.map((word) => {
    const w = word.trim().toLowerCase()
    if (!w) return { word, heard: false }
    if (hay.includes(w)) return { word, heard: true }
    // A near miss is the useful answer: "Nyquist" came back as "nightquest"
    // tells the builder the list is not working, where silence tells them
    // nothing at all.
    const near = tokens.find((t) => t.length > 3 && distanceWithin(t, w.replace(/\s+/g, ""), 3))
    return { word, heard: false, insteadOf: near }
  })
}

/** Cheap bounded edit distance: enough to spot a mishearing, not a spell check. */
function distanceWithin(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = row
  }
  return prev[b.length] <= max
}

/** "4 of 5 heard" — the one line the test rail shows after a call. */
export function heardSummary(heard: HeardWord[]): string {
  const ok = heard.filter((h) => h.heard).length
  const miss = heard.find((h) => !h.heard && h.insteadOf)
  const head = `${ok} of ${heard.length} heard`
  return miss ? `${head} · "${miss.word}" came back as "${miss.insteadOf}"` : head
}
