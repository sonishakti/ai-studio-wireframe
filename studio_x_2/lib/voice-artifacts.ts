/**
 * Voice artifacts — Step 1 of the creation wizard ("Choose your Voice").
 *
 * A "Voice" is the reusable identity an agent starts from: a name, a persona
 * seed (personality/tone/language), a TTS voice, and an opening line. There are
 * two kinds:
 *   • PRESET — built by Agora, IMMUTABLE. Selectable but never edited.
 *   • CUSTOM — created by the user in the Playground, or seeded from an Imported
 *     3rd-party agent config. Editable, and persisted to localStorage so they
 *     show up in the picker on every visit.
 *
 * Persistence mirrors the `sx:` helper idiom in `lib/analytics.ts`
 * (typeof-window + try/catch guards, no backend — wireframe only).
 */

import { stackFor, type AgentStack } from "@/lib/campaign-data"

export type VoiceKind = "preset" | "custom"

/** A preset voice's canonical engine: the balanced cascade on ElevenLabs with
 *  the preset's own TTS voice, so vendor + voice are always coherent (a preset
 *  voice can never present as "Azure + rachel"). */
const presetStack = (ttsVoice: string): AgentStack => ({
  ...stackFor("balanced"),
  pipeline: "stt-llm-tts",
  language: "English",
  tts: { vendor: "ElevenLabs", voice: ttsVoice },
})

export interface VoiceArtifact {
  id: string
  name: string
  kind: VoiceKind
  /** One-line description shown under the name in the picker. */
  tagline: string
  /** Persona seed applied to the draft when this voice is chosen. */
  personality: string
  tone: string
  language: string
  /** Vendor TTS voice id (maps to AgentStack.tts.voice). */
  ttsVoice: string
  /** Opening line the agent speaks first. */
  firstMessage: string
  /** Full system prompt to seed Step 3 with (carried from an import). When
   *  absent, the wizard generates a default prompt from the persona seed. */
  systemPrompt?: string
  /** The model stack (speed/cost preset + STT/LLM/TTS) chosen for this voice
   *  in the Playground (2026-07-07: the engine lives WITH the voice, not in
   *  builder Step 1). Presets carry a canonical balanced stack; a legacy custom
   *  saved before this change may lack one → the Playground falls back to the
   *  balanced default. */
  stack?: AgentStack
  /** Where a custom voice came from — "Playground" or an import source. */
  source?: string
}

// ─── Preset catalog (immutable) ───────────────────────────────────────────────

export const PRESET_VOICES: VoiceArtifact[] = [
  {
    id: "voice_aria",
    name: "Aria",
    kind: "preset",
    tagline: "Warm, concise support generalist",
    personality: "Warm, concise, and professional. Solves first, escalates only when needed.",
    tone: "Friendly",
    language: "en-US",
    ttsVoice: "rachel",
    firstMessage: "Hi, thanks for calling. How can I help you today?",
    stack: presetStack("rachel"),
  },
  {
    id: "voice_nova",
    name: "Nova",
    kind: "preset",
    tagline: "Crisp, persuasive sales voice",
    personality: "Confident and persuasive. Drives toward a clear next step, respects a no.",
    tone: "Professional",
    language: "en-US",
    ttsVoice: "adam",
    firstMessage: "Hi! This is a quick call about your account. Do you have a moment?",
    stack: presetStack("adam"),
  },
  {
    id: "voice_sage",
    name: "Sage",
    kind: "preset",
    tagline: "Calm, patient, careful with detail",
    personality: "Calm, patient, and reassuring. Explains clearly and never rushes the caller.",
    tone: "Neutral",
    language: "en-US",
    ttsVoice: "bella",
    firstMessage: "Hello, you've reached support. Take your time. What can I help with?",
    stack: presetStack("bella"),
  },
  {
    id: "voice_max",
    name: "Max",
    kind: "preset",
    tagline: "Upbeat, energetic qualifier",
    personality: "Upbeat and energetic. Quickly qualifies intent and keeps momentum.",
    tone: "Playful",
    language: "en-US",
    ttsVoice: "josh",
    firstMessage: "Hey there! Thanks for reaching out. What brings you in today?",
    stack: presetStack("josh"),
  },
]

export function getPresetVoice(id: string): VoiceArtifact | undefined {
  return PRESET_VOICES.find((v) => v.id === id)
}

// ─── Custom artifacts (persisted) ─────────────────────────────────────────────

const ARTIFACTS_KEY = "sx:voice_artifacts"

export function listVoiceArtifacts(): VoiceArtifact[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ARTIFACTS_KEY)
    return raw ? (JSON.parse(raw) as VoiceArtifact[]) : []
  } catch {
    return []
  }
}

/** Upsert a custom voice artifact (matched by id). Returns the saved artifact. */
export function saveVoiceArtifact(v: VoiceArtifact): VoiceArtifact {
  if (typeof window === "undefined") return v
  const list = listVoiceArtifacts()
  const next = list.some((a) => a.id === v.id)
    ? list.map((a) => (a.id === v.id ? v : a))
    : [...list, v]
  try {
    window.localStorage.setItem(ARTIFACTS_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota / serialization errors — wireframe only */
  }
  return v
}

export function getVoiceArtifact(id: string): VoiceArtifact | undefined {
  return [...PRESET_VOICES, ...listVoiceArtifacts()].find((v) => v.id === id)
}

/** Preset catalog + the user's saved customs — the full picker list. */
export function allVoices(): VoiceArtifact[] {
  return [...PRESET_VOICES, ...listVoiceArtifacts()]
}

/** Mint a new custom-voice id. Runtime-only (browser), so Date.now() is fine. */
export function newVoiceId(): string {
  return `voice_c_${Date.now().toString(36)}`
}

// ─── Engine handoff to the Playground ─────────────────────────────────────────
//
// When you "Customize this voice" from the builder, the Playground should open
// on the agent's CURRENT engine — not a fresh balanced default — so a live
// agent deployed on Fastest isn't silently downgraded to Balanced on save
// (stack-move review, 2026-07-07). The builder stashes draft.stack here right
// before navigating; the Playground reads and clears it.

const SEED_STACK_KEY = "sx:pg_seed_stack"

export function stashPlaygroundStack(stack: AgentStack) {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(SEED_STACK_KEY, JSON.stringify(stack)) } catch { /* wireframe only */ }
}

/** Read + clear the stashed engine (one-shot). */
export function takePlaygroundStack(): AgentStack | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.localStorage.getItem(SEED_STACK_KEY)
    window.localStorage.removeItem(SEED_STACK_KEY)
    return raw ? (JSON.parse(raw) as AgentStack) : undefined
  } catch {
    return undefined
  }
}
