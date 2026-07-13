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

/** A preset voice's canonical engine: the balanced cascade with the preset's
 *  own TTS vendor + voice, so vendor + voice are always coherent (a preset
 *  voice can never present as "Azure + rachel"). */
const presetStack = (ttsVoice: string, vendor = "ElevenLabs"): AgentStack => ({
  ...stackFor("balanced"),
  pipeline: "stt-llm-tts",
  language: "English",
  tts: { vendor, voice: ttsVoice },
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
  // ── Browser metadata (F5 voice browser) — presets carry these for filtering. ──
  /** Voice provider shown as a tab in the browser (our real TTS vendors). */
  provider?: "ElevenLabs" | "Azure"
  gender?: "Male" | "Female" | "Neutral"
  accent?: string
  /** Best-fit use, e.g. "Support", "Sales", "Narration". */
  voiceType?: string
  /** Short descriptor chips shown in the browser row. */
  traits?: string[]
  /** Display voice id, e.g. "11labs-rachel". */
  voiceId?: string
  /** Where a custom voice came from — "Playground" or an import source. */
  source?: string
}

// ─── Preset catalog (immutable) ───────────────────────────────────────────────

/** Compact factory — keeps the (now larger) catalog readable. */
const V = (o: {
  id: string; name: string; tagline: string; personality: string; tone: string
  ttsVoice: string; firstMessage: string; provider?: VoiceArtifact["provider"]
  gender: VoiceArtifact["gender"]; accent: string; voiceType: string; traits: string[]; voiceId: string
}): VoiceArtifact => ({
  id: o.id, name: o.name, kind: "preset", tagline: o.tagline, personality: o.personality,
  tone: o.tone, language: "en-US", ttsVoice: o.ttsVoice, firstMessage: o.firstMessage,
  stack: presetStack(o.ttsVoice, o.provider ?? "ElevenLabs"),
  provider: o.provider ?? "ElevenLabs", gender: o.gender, accent: o.accent,
  voiceType: o.voiceType, traits: o.traits, voiceId: o.voiceId,
})

export const PRESET_VOICES: VoiceArtifact[] = [
  V({ id: "voice_aria", name: "Aria", tagline: "Warm, concise support generalist", personality: "Warm, concise, and professional. Solves first, escalates only when needed.", tone: "Friendly", ttsVoice: "rachel", firstMessage: "Hi, thanks for calling. How can I help you today?", gender: "Female", accent: "American", voiceType: "Support", traits: ["Warm", "Clear"], voiceId: "11labs-rachel" }),
  V({ id: "voice_nova", name: "Nova", tagline: "Crisp, persuasive sales voice", personality: "Confident and persuasive. Drives toward a clear next step, respects a no.", tone: "Professional", ttsVoice: "adam", firstMessage: "Hi! This is a quick call about your account. Do you have a moment?", gender: "Male", accent: "American", voiceType: "Sales", traits: ["Confident", "Crisp"], voiceId: "11labs-adam" }),
  V({ id: "voice_sage", name: "Sage", tagline: "Calm, patient, careful with detail", personality: "Calm, patient, and reassuring. Explains clearly and never rushes the caller.", tone: "Neutral", ttsVoice: "bella", firstMessage: "Hello, you've reached support. Take your time. What can I help with?", gender: "Female", accent: "American", voiceType: "Support", traits: ["Calm", "Patient"], voiceId: "11labs-bella" }),
  V({ id: "voice_max", name: "Max", tagline: "Upbeat, energetic qualifier", personality: "Upbeat and energetic. Quickly qualifies intent and keeps momentum.", tone: "Playful", ttsVoice: "josh", firstMessage: "Hey there! Thanks for reaching out. What brings you in today?", gender: "Male", accent: "American", voiceType: "Sales", traits: ["Upbeat", "Energetic"], voiceId: "11labs-josh" }),
  V({ id: "voice_ivy", name: "Ivy", tagline: "Bright, friendly receptionist", personality: "Bright and welcoming. Greets warmly and routes callers quickly.", tone: "Friendly", ttsVoice: "rachel", firstMessage: "Hi! Thanks for calling. Who would you like to reach?", gender: "Female", accent: "British", voiceType: "Reception", traits: ["Bright", "Friendly"], voiceId: "11labs-ivy" }),
  V({ id: "voice_theo", name: "Theo", tagline: "Measured, trustworthy narrator", personality: "Measured and articulate. Great for explanations and read-outs.", tone: "Neutral", ttsVoice: "blake", firstMessage: "Hello. Let me walk you through this step by step.", gender: "Male", accent: "British", voiceType: "Narration", traits: ["Measured", "Articulate"], voiceId: "11labs-theo" }),
  V({ id: "voice_luna", name: "Luna", tagline: "Soft, empathetic care voice", personality: "Soft and empathetic. Reassures anxious callers and listens well.", tone: "Friendly", ttsVoice: "turbo", firstMessage: "Hi, I'm here to help. Tell me what's going on.", gender: "Female", accent: "American", voiceType: "Healthcare", traits: ["Empathetic", "Soft"], voiceId: "11labs-luna" }),
  V({ id: "voice_rex", name: "Rex", tagline: "Direct, no-nonsense operator", personality: "Direct and efficient. Gets to the point and resolves fast.", tone: "Professional", ttsVoice: "adam", firstMessage: "Support here. What can I fix for you?", gender: "Male", accent: "American", voiceType: "Support", traits: ["Direct", "Fast"], voiceId: "11labs-rex" }),
  V({ id: "voice_mia", name: "Mia", tagline: "Playful, gen-Z friendly", personality: "Playful and casual. Keeps it light and human.", tone: "Playful", ttsVoice: "bella", firstMessage: "Heyy! What's up, how can I help?", gender: "Female", accent: "Australian", voiceType: "Reception", traits: ["Playful", "Casual"], voiceId: "11labs-mia" }),
  V({ id: "voice_owen", name: "Owen", tagline: "Confident closer", personality: "Confident and warm. Builds rapport and closes with clarity.", tone: "Professional", ttsVoice: "josh", firstMessage: "Hi, glad I caught you. Got two minutes?", gender: "Male", accent: "American", voiceType: "Sales", traits: ["Confident", "Warm"], voiceId: "11labs-owen" }),
  V({ id: "voice_zoe", name: "Zoe", tagline: "Neutral, professional assistant", personality: "Neutral and professional. Clear and dependable across tasks.", tone: "Neutral", ttsVoice: "rachel", firstMessage: "Hello, how can I assist you today?", gender: "Female", accent: "Canadian", voiceType: "Assistant", traits: ["Neutral", "Clear"], voiceId: "11labs-zoe" }),
  V({ id: "voice_kai", name: "Kai", tagline: "Youthful tech-support voice", personality: "Curious and helpful. Explains tech simply, never condescending.", tone: "Friendly", ttsVoice: "blake", firstMessage: "Hi! Let's get this sorted. What's happening?", gender: "Male", accent: "American", voiceType: "Support", traits: ["Helpful", "Youthful"], voiceId: "11labs-kai" }),
  V({ id: "voice_jenny", name: "Jenny", tagline: "Azure neural, natural read", personality: "Natural and even-toned. A dependable default for any flow.", tone: "Neutral", ttsVoice: "en-US-Jenny", firstMessage: "Hi, thanks for calling. How can I help?", provider: "Azure", gender: "Female", accent: "American", voiceType: "Assistant", traits: ["Natural", "Even"], voiceId: "azure-jenny" }),
  V({ id: "voice_guy", name: "Guy", tagline: "Azure neural, steady baritone", personality: "Steady and clear. Good for confirmations and read-backs.", tone: "Professional", ttsVoice: "en-US-Guy", firstMessage: "Hello. I can help you with that.", provider: "Azure", gender: "Male", accent: "American", voiceType: "Assistant", traits: ["Steady", "Clear"], voiceId: "azure-guy" }),
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

/** Generated Step-3 starter for a voice (or import) that carries no prompt —
 *  one truth for the wizard's seeding and the import "create as new" path. */
export function defaultPromptFor(v: VoiceArtifact): string {
  return `You are ${v.name}, a voice agent. ${v.personality}

Be concise and helpful. Greet the caller, understand what they need, resolve it, and escalate to a human if asked.`
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
