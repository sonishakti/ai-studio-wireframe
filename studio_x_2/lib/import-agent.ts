/**
 * Agent import — per-vendor parsers + the field-mapping report.
 *
 * User-test #6 (2026-07-13) S1: the old validator only accepted an idealized
 * {name, system_prompt, first_message} shape, so REAL vendor exports failed —
 * Retell keeps the name on `agent_name` and the prompt on the Retell-LLM
 * object (often inlined under `response_engine`); Vapi buries the prompt in
 * `model.messages` and the voice in `voice.voiceId`; ElevenLabs nests
 * everything under `conversation_config`. Each source chip now has its own
 * parser, the JSON's SHAPE wins over a wrongly-picked chip, and every parse
 * returns a MAPPING REPORT — what mapped, where it landed, what didn't carry
 * and why — so "configs map" is shown field-by-field, not asserted. Same
 * copy-state honesty contract as the widget's embed-truth line.
 *
 * No backend (wireframe): parsers are pure; the artifact/draft seeding
 * persists via the localStorage helpers in voice-artifacts / wizard-draft.
 */

import { STACK_CATALOG, stackFor, type AgentStack, type ImportedAgentConfig } from "@/lib/campaign-data"
import { newVoiceId, saveVoiceArtifact, defaultPromptFor, type VoiceArtifact } from "@/lib/voice-artifacts"
import { EMPTY_DRAFT, type AgentDraft } from "@/lib/wizard-draft"

export const IMPORT_SOURCES = ["Vapi", "Retell", "ElevenLabs", "Bland", "Generic JSON"] as const
export type ImportSource = (typeof IMPORT_SOURCES)[number]

/** One report row: a source field that carried over, and where it landed. */
export interface MappedField {
  /** Source-side path, e.g. `response_engine.general_prompt`. */
  theirs: string
  /** Where it landed in the builder, e.g. "System prompt · Prompt". Landing
   *  labels speak the CURRENT section names (Channel · Prompt · Voice & speech
   *  · Models · Knowledge & Tools) — "Step N" vocabulary died with the v3
   *  rebuild and stale labels break the report's honesty contract (user-test
   *  2026-07-21 verification round, ranked #3). */
  ours: string
  /** Short human preview of the carried value. */
  value: string
}

/** One report row for a field that did NOT carry — always with the reason. */
export interface DroppedField {
  theirs: string
  reason: string
}

export interface ImportParseResult {
  ok: boolean
  config?: ImportedAgentConfig
  mapped?: MappedField[]
  dropped?: DroppedField[]
  warnings?: string[]
  /** Set when the JSON's shape identified a DIFFERENT vendor than the chip —
   *  the shape wins, and the UI says so. */
  detected?: ImportSource
  error?: string
}

// ─── small utilities ──────────────────────────────────────────────────────────

type Rec = Record<string, unknown>
const rec = (v: unknown): Rec | undefined =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : undefined
const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined

const trunc = (s: string, n = 56): string => {
  const flat = s.replace(/\s+/g, " ").trim()
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat
}
const quote = (s: string, n = 48): string => `“${trunc(s, n)}”`

/** First non-empty string among [path, value] candidates — keeps the report's
 *  `theirs` column pointing at where the field was ACTUALLY found. */
function firstStr(cands: Array<[string, unknown]>): { path: string; value: string } | undefined {
  for (const [path, v] of cands) {
    const s = str(v)
    if (s) return { path, value: s }
  }
  return undefined
}

const toolNames = (v: unknown): string[] =>
  Array.isArray(v)
    ? v
        .map((t) =>
          typeof t === "string"
            ? t
            : str(rec(t)?.name) ?? str(rec(rec(t)?.function)?.name) ?? str(rec(t)?.type),
        )
        .filter((s): s is string => !!s)
    : []

/** BCP-47-ish code → the builder's spoken-language label (Step-1 catalog). */
export function languageLabelFor(code: string | undefined): string | undefined {
  if (!code) return undefined
  const c = code.toLowerCase()
  if (c.startsWith("en")) return "English"
  if (c.startsWith("es")) return "Spanish"
  if (c.startsWith("fr")) return "French"
  if (c.startsWith("de")) return "German"
  if (c.startsWith("hi")) return "Hindi"
  if (c.startsWith("zh") || c.startsWith("cmn")) return "Mandarin"
  return undefined
}

/** The imported LLM only carries when Agora's bundled catalog can run it —
 *  otherwise the report says so honestly and the balanced default stays. */
function catalogLlm(model: string | undefined) {
  if (!model) return undefined
  const m = model.toLowerCase()
  return STACK_CATALOG.llm.find((o) => o.model === m)
}

// ─── report assembly ──────────────────────────────────────────────────────────

/** Where each carried field lands, in the builder's own vocabulary. */
const LANDS = {
  name: "Agent name · builder header",
  prompt: "System prompt · Prompt",
  greeting: "Greeting · Prompt",
  voice: "Voice · Voice & speech",
  llm: "LLM · Models",
  language: "Language · Voice & speech",
} as const

interface Found {
  name?: { path: string; value: string }
  prompt?: { path: string; value: string }
  greeting?: { path: string; value: string }
  /** `normalized` = the id we store (e.g. "11labs-Adrian" → "adrian");
   *  `provider` = the TTS vendor the export names, when it names one. */
  voice?: { path: string; value: string; normalized?: string; provider?: string }
  model?: { path: string; value: string }
  language?: { path: string; value: string }
  tools?: { path: string; names: string[] }
}

/** Providers Agora's bundled stack can actually run. A voice from anyone else
 *  (PlayHT, Cartesia, Rime…) must NOT be silently rebranded ElevenLabs — the
 *  report drops it honestly instead (user-test #7 P0). */
function bundledTtsVendor(provider: string | undefined): "ElevenLabs" | "Azure" | undefined {
  if (!provider) return "ElevenLabs" // bare voice ids keep the historical default
  const p = provider.toLowerCase().replace(/[\s_-]/g, "")
  if (p === "11labs" || p === "elevenlabs") return "ElevenLabs"
  if (p === "azure" || p === "microsoft") return "Azure"
  return undefined
}

interface VendorParse {
  config: ImportedAgentConfig
  mapped: MappedField[]
  dropped: DroppedField[]
  warnings: string[]
}

function assemble(found: Found, source: ImportSource, extraDropped: DroppedField[], extraWarnings: string[]): VendorParse {
  const mapped: MappedField[] = []
  const dropped: DroppedField[] = [...extraDropped]
  const warnings: string[] = [...extraWarnings]

  let name = found.name?.value
  if (found.name) {
    mapped.push({ theirs: found.name.path, ours: LANDS.name, value: trunc(found.name.value, 40) })
  } else {
    name = `${source === "Generic JSON" ? "Imported" : source} agent`
    warnings.push(`No agent name in the export — we called it “${name}”. Rename it in the builder header.`)
  }
  if (found.prompt) {
    mapped.push({
      theirs: found.prompt.path,
      ours: LANDS.prompt,
      value: `${found.prompt.value.trim().length.toLocaleString()} chars — ${quote(found.prompt.value, 40)}`,
    })
  }
  if (found.greeting) mapped.push({ theirs: found.greeting.path, ours: LANDS.greeting, value: quote(found.greeting.value) })
  // A voice only carries when its provider runs on the bundled stack — a
  // PlayHT/Cartesia id rebranded "ElevenLabs" would be the one dishonest row
  // in an otherwise field-by-field-honest report.
  const voiceVendor = bundledTtsVendor(found.voice?.provider)
  if (found.voice && voiceVendor) {
    mapped.push({
      theirs: found.voice.path,
      ours: LANDS.voice,
      value: found.voice.provider ? `${found.voice.value} · ${found.voice.provider}` : found.voice.value,
    })
  } else if (found.voice) {
    dropped.push({
      theirs: found.voice.path,
      reason: `“${found.voice.provider}” voices aren't in Agora's bundled stack — the default voice is set; pick one in Voice & speech.`,
    })
  }
  const llm = catalogLlm(found.model?.value)
  if (found.model && llm) {
    mapped.push({ theirs: found.model.path, ours: LANDS.llm, value: llm.label })
  } else if (found.model) {
    dropped.push({
      theirs: found.model.path,
      reason: `“${found.model.value}” isn't in Agora's bundled catalog — the balanced default is set instead; change it in Models.`,
    })
  }
  const lang = languageLabelFor(found.language?.value)
  if (found.language && lang) {
    mapped.push({ theirs: found.language.path, ours: LANDS.language, value: `${found.language.value} → ${lang}` })
  } else if (found.language) {
    dropped.push({
      theirs: found.language.path,
      reason: `“${found.language.value}” isn't in the language list yet — English is set; change it in Voice & speech.`,
    })
  }
  if (found.tools?.names.length) {
    dropped.push({
      theirs: `${found.tools.path} (${found.tools.names.length})`,
      reason: `Tool definitions don't port across platforms — rebuild ${found.tools.names.slice(0, 3).join(", ")}${found.tools.names.length > 3 ? "…" : ""} in Knowledge & Tools.`,
    })
  }

  const config: ImportedAgentConfig = {
    name: name!,
    voice: found.voice && voiceVendor ? found.voice.normalized ?? found.voice.value : undefined,
    voiceProvider: found.voice && voiceVendor ? voiceVendor : undefined,
    systemPrompt: found.prompt?.value,
    firstMessage: found.greeting?.value,
    llmModel: llm?.model,
    language: found.language?.value,
    tools: found.tools?.names.length ? found.tools.names : undefined,
    source,
  }
  return { config, mapped, dropped, warnings }
}

// ─── the "didn't carry" sweep ─────────────────────────────────────────────────

/** Pure metadata — ids, versions, timestamps. Not even worth a dropped row. */
const META_KEYS = new Set([
  "agent_id", "assistant_id", "id", "llm_id", "org_id", "orgId", "version",
  "last_modification_timestamp", "created_at", "createdAt", "updated_at",
  "updatedAt", "is_published", "isServerUrlSecretSet", "access_token", "type",
])

/** Curated reasons for the interesting keys real exports carry. Anything not
 *  listed falls back to an honest generic line.
 *
 *  HONESTY RULE (user-test #7 P0): a reason may only point somewhere that
 *  EXISTS — Advanced's turn-taking/speech sections, Knowledge & Tools, the
 *  Analysis section, Step-1 engine, the deployment's CSV columns, and (since
 *  27025fc) Channel › Call settings & schedule (hang-up · voicemail · silence
 *  · max duration · transfer). Anything without a real landing spot says
 *  "isn't supported yet" — and the reverse holds: once a landing spot ships,
 *  the reason MUST point at it (user-test 2026-07-21 D2: one stale "isn't
 *  supported yet" against a visible toggle poisons the whole report). */
const DROP_REASONS: Record<string, string> = {
  webhook_url: "Webhooks would belong to the deployment, not the agent — deployment webhooks aren't here yet.",
  server: "Server URLs would belong to the deployment — deployment webhooks aren't here yet.",
  serverUrl: "Server URLs would belong to the deployment — deployment webhooks aren't here yet.",
  serverMessages: "Server event streams aren't supported yet.",
  states: "Conversation states don't port — express the flow in your system prompt (the Prompt section).",
  starting_state: "Conversation states don't port — express the flow in your system prompt (the Prompt section).",
  pathway_id: "Bland pathways don't port — express the flow in your system prompt (the Prompt section).",
  voicemail_detection: "Voicemail detection re-enables as a toggle in Channel › Call settings — the vendor setting itself doesn't port.",
  voicemailMessage: "Leaving a voicemail message isn't supported — voicemail detection (hang up on machines) is a toggle in Channel › Call settings.",
  voicemailDetection: "Voicemail detection re-enables as a toggle in Channel › Call settings — the vendor setting itself doesn't port.",
  endCallMessage: "A scripted closing message isn't supported — end-call behavior lives in Channel › Call settings › Hang-up.",
  endCallPhrases: "End-call phrases don't port — end-call behavior lives in Channel › Call settings › Hang-up.",
  end_call_after_silence_ms: "Silence hang-up re-configures in Channel › Call settings › Hang-up (in seconds).",
  analysisPlan: "Post-call analysis is configured in the Analysis section.",
  artifactPlan: "Recording settings live in the Analysis section.",
  post_call_analysis_data: "Post-call analysis is configured in the Analysis section.",
  post_call_analysis_model: "Post-call analysis is configured in the Analysis section.",
  knowledge_base_ids: "Knowledge re-attaches in Knowledge & Tools.",
  knowledge_base: "Knowledge re-attaches in Knowledge & Tools.",
  platform_settings: "Platform/auth settings stay vendor-specific.",
  transcriber: "The transcriber maps to Agora's bundled STT — tune it in Models.",
  asr: "ASR maps to Agora's bundled STT — tune it in Models.",
  turn: "Turn-taking tuning lives in Advanced.",
  conversation: "Conversation limits stay vendor-specific.",
  ambient_sound: "Ambient audio isn't supported yet.",
  backgroundSound: "Background audio isn't supported yet.",
  interruption_sensitivity: "Interruption tuning lives in Advanced (turn-taking).",
  interruption_threshold: "Interruption tuning lives in Advanced (turn-taking).",
  responsiveness: "Turn-taking tuning lives in Advanced.",
  startSpeakingPlan: "Interruption tuning lives in Advanced (turn-taking).",
  stopSpeakingPlan: "Interruption tuning lives in Advanced (turn-taking).",
  enable_backchannel: "Backchannel tuning stays vendor-specific.",
  backchannel_frequency: "Backchannel tuning stays vendor-specific.",
  backchannel_words: "Backchannel tuning stays vendor-specific.",
  boosted_keywords: "ASR keyword boosting isn't supported yet (Advanced's keywords are wake words, not boosting).",
  keywords: "ASR keyword boosting isn't supported yet (Advanced's keywords are wake words, not boosting).",
  pronunciation_dictionary: "Pronunciation dictionaries aren't supported yet.",
  max_duration: "Max call duration re-configures in Channel › Call settings › Hang-up.",
  max_call_duration_ms: "Max call duration re-configures in Channel › Call settings › Hang-up (in seconds).",
  silenceTimeoutSeconds: "Silence hang-up re-configures in Channel › Call settings › Hang-up.",
  reminder_trigger_ms: "Reminder nudges stay vendor-specific.",
  reminder_max_count: "Reminder nudges stay vendor-specific.",
  dynamic_data: "Dynamic variables move to the deployment's CSV columns.",
  default_dynamic_variables: "Dynamic variables move to the deployment's CSV columns.",
  voice_speed: "Voice tuning stays vendor-specific.",
  voice_temperature: "Voice tuning stays vendor-specific.",
  voice_model: "TTS runs on Agora's bundled stack — pick the engine in Models.",
  fallback_voice_ids: "Voice fallbacks stay vendor-specific.",
  volume: "Voice tuning stays vendor-specific.",
  firstMessageMode: "Who speaks first is part of the greeting (the Prompt section).",
  clientMessages: "Client event streams aren't configurable here yet.",
  metadata: "Freeform metadata isn't carried.",
  tags: "Tags aren't carried.",
}

function sweepDropped(p: Rec, consumed: Set<string>): DroppedField[] {
  const out: DroppedField[] = []
  for (const k of Object.keys(p)) {
    if (consumed.has(k) || META_KEYS.has(k)) continue
    out.push({ theirs: k, reason: DROP_REASONS[k] ?? "No direct Agora equivalent — not carried." })
  }
  return out
}

function withSweep(v: VendorParse, p: Rec, consumed: Set<string>): VendorParse {
  return { ...v, dropped: [...v.dropped, ...sweepDropped(p, consumed)] }
}

// ─── per-vendor parsers ───────────────────────────────────────────────────────

/** Vapi assistant (GET /assistant/:id): prompt = the system message inside
 *  model.messages; voice = voice.voiceId; language rides on the transcriber. */
function parseVapi(p: Rec): VendorParse {
  const model = rec(p.model)
  const voice = rec(p.voice)
  const transcriber = rec(p.transcriber)
  const messages = Array.isArray(model?.messages) ? (model!.messages as unknown[]) : []
  const sys = messages.map(rec).find((m) => m && str(m.role)?.toLowerCase() === "system")
  const found: Found = {
    name: firstStr([["name", p.name]]),
    prompt: firstStr([
      ["model.messages[system]", sys?.content],
      ["model.systemPrompt", model?.systemPrompt],
      ["instructions", p.instructions],
    ]),
    greeting: firstStr([["firstMessage", p.firstMessage]]),
    voice: (() => {
      const f = firstStr([["voice.voiceId", voice?.voiceId]])
      return f ? { ...f, provider: str(voice?.provider) } : undefined
    })(),
    model: firstStr([["model.model", model?.model]]),
    language: firstStr([["transcriber.language", transcriber?.language]]),
    tools: Array.isArray(model?.tools) && (model!.tools as unknown[]).length
      ? { path: "model.tools", names: toolNames(model!.tools) }
      : undefined,
  }
  const warnings: string[] = []
  if (!found.prompt && messages.length) warnings.push("model.messages has no system-role message — the prompt didn't carry.")
  else if (!found.prompt && !model) warnings.push("No `model` block found — a Vapi assistant export carries the prompt in model.messages.")
  const consumed = new Set(["name", "model", "voice", "firstMessage", "transcriber", "instructions"])
  return withSweep(assemble(found, "Vapi", [], warnings), p, consumed)
}

/** Retell agent (GET /get-agent/:id): name = agent_name, voice = voice_id;
 *  the PROMPT lives on the Retell-LLM object — read it wherever it shows up:
 *  inlined under response_engine, at the root (a pasted Retell-LLM object),
 *  or merged in from an [agent, llm] pair paste. */
function parseRetell(p: Rec): VendorParse {
  const re = rec(p.response_engine)
  const llmCands: Array<[string, Rec | undefined]> = [
    ["response_engine", re],
    ["", p],
    ["retell_llm", rec(p.retell_llm)],
    ["llm", rec(p.llm)],
  ]
  const at = (field: string): Array<[string, unknown]> =>
    llmCands.map(([prefix, o]) => [prefix ? `${prefix}.${field}` : field, o?.[field]])
  const toolsSrc = llmCands
    .map(([prefix, o]) => [prefix ? `${prefix}.general_tools` : "general_tools", o?.general_tools] as [string, unknown])
    .find(([, v]) => Array.isArray(v) && (v as unknown[]).length)
  const voiceFound = firstStr([["voice_id", p.voice_id]])
  // Retell brands the provider into the id: "11labs-Adrian", "openai-Alloy",
  // "deepgram-Angus". Read it so a non-ElevenLabs voice isn't rebranded.
  const voicePrefix = voiceFound?.value.match(/^([a-z0-9]+)-/i)?.[1]
  const found: Found = {
    name: firstStr([["agent_name", p.agent_name], ["name", p.name]]),
    prompt: firstStr(at("general_prompt")),
    greeting: firstStr(at("begin_message")),
    voice: voiceFound
      ? {
          ...voiceFound,
          normalized: voiceFound.value.replace(/^11labs-/i, "").toLowerCase(),
          provider: voicePrefix,
        }
      : undefined,
    model: firstStr(at("model")),
    language: firstStr([["language", p.language]]),
    tools: toolsSrc ? { path: toolsSrc[0], names: toolNames(toolsSrc[1]) } : undefined,
  }
  const warnings: string[] = []
  if (!found.prompt) {
    const llmId = str(re?.llm_id) ?? str(p.llm_id)
    warnings.push(
      llmId
        ? `This agent references its prompt by ID (${trunc(llmId, 20)}) — in Retell the prompt lives on the Retell-LLM object. Paste that JSON too (both objects together works) and we'll read general_prompt from it.`
        : "No general_prompt found — in Retell the prompt lives on the Retell-LLM object; paste it together with the agent JSON.",
    )
  }
  const consumed = new Set([
    "agent_name", "name", "response_engine", "voice_id", "language",
    "general_prompt", "begin_message", "model", "general_tools", "retell_llm", "llm", "channel",
  ])
  return withSweep(assemble(found, "Retell", [], warnings), p, consumed)
}

/** ElevenLabs agent (GET /v1/convai/agents/:id): everything nests under
 *  conversation_config — prompt at agent.prompt.prompt, voice at tts.voice_id. */
function parseElevenLabs(p: Rec): VendorParse {
  const cc = rec(p.conversation_config)
  const agent = rec(cc?.agent)
  const promptObj = rec(agent?.prompt)
  const tts = rec(cc?.tts)
  const found: Found = {
    name: firstStr([["name", p.name]]),
    prompt: firstStr([["conversation_config.agent.prompt.prompt", promptObj?.prompt]]),
    greeting: firstStr([["conversation_config.agent.first_message", agent?.first_message]]),
    voice: (() => {
      const f = firstStr([["conversation_config.tts.voice_id", tts?.voice_id]])
      return f ? { ...f, provider: "ElevenLabs" } : undefined
    })(),
    model: firstStr([["conversation_config.agent.prompt.llm", promptObj?.llm]]),
    language: firstStr([["conversation_config.agent.language", agent?.language]]),
    tools: Array.isArray(promptObj?.tools) && (promptObj!.tools as unknown[]).length
      ? { path: "conversation_config.agent.prompt.tools", names: toolNames(promptObj!.tools) }
      : undefined,
  }
  const warnings: string[] = []
  const extra: DroppedField[] = []
  if (!cc) {
    warnings.push("No conversation_config block — an ElevenLabs agent export nests everything under it (GET /v1/convai/agents/:id).")
  } else {
    // Name the interesting sub-blocks that don't carry — the root-level sweep
    // can't see inside the consumed conversation_config.
    for (const k of ["asr", "turn", "conversation"]) {
      if (rec(cc[k])) extra.push({ theirs: `conversation_config.${k}`, reason: DROP_REASONS[k] ?? "Voice-pipeline tuning stays vendor-specific." })
    }
    if (str(tts?.model_id)) extra.push({ theirs: "conversation_config.tts.model_id", reason: "TTS runs on Agora's bundled stack — pick the engine in Models." })
    if (Array.isArray(promptObj?.knowledge_base) && (promptObj!.knowledge_base as unknown[]).length) {
      extra.push({ theirs: "conversation_config.agent.prompt.knowledge_base", reason: "Knowledge re-attaches in Knowledge & Tools." })
    }
  }
  const consumed = new Set(["name", "conversation_config"])
  return withSweep(assemble(found, "ElevenLabs", extra, warnings), p, consumed)
}

/** Bland agent / inbound-number config: prompt (or task), first_sentence,
 *  a plain-string voice. Bland's `model` is a pipeline tier, not an LLM. */
function parseBland(p: Rec): VendorParse {
  const found: Found = {
    name: firstStr([["name", p.name], ["agent_name", p.agent_name]]),
    prompt: firstStr([["prompt", p.prompt], ["task", p.task]]),
    greeting: firstStr([["first_sentence", p.first_sentence]]),
    voice: firstStr([["voice", p.voice], ["voice_id", typeof p.voice_id === "number" ? String(p.voice_id) : p.voice_id]]),
    language: firstStr([["language", p.language]]),
    tools: Array.isArray(p.tools) && (p.tools as unknown[]).length
      ? { path: "tools", names: toolNames(p.tools) }
      : undefined,
  }
  const extra: DroppedField[] = []
  const tier = str(p.model)
  if (tier) extra.push({ theirs: "model", reason: `Bland's “${tier}” is a pipeline tier, not an LLM — pick a model in Models.` })
  const consumed = new Set(["name", "agent_name", "prompt", "task", "first_sentence", "voice", "voice_id", "language", "tools", "model"])
  return withSweep(assemble(found, "Bland", extra, []), p, consumed)
}

/** Any JSON — the permissive key sniff the sheet always accepted. */
function parseGeneric(p: Rec): VendorParse {
  const voiceRec = rec(p.voice)
  const llm = rec(p.llm)
  const found: Found = {
    name: firstStr([["name", p.name], ["agent_name", p.agent_name]]),
    prompt: firstStr([
      ["system_prompt", p.system_prompt],
      ["systemPrompt", p.systemPrompt],
      ["prompt", p.prompt],
      ["instructions", p.instructions],
    ]),
    greeting: firstStr([
      ["first_message", p.first_message],
      ["firstMessage", p.firstMessage],
      ["greeting", p.greeting],
    ]),
    voice: firstStr([
      ["voice", p.voice],
      ["voice.voice", voiceRec?.voice],
      ["tts.voice", rec(p.tts)?.voice],
      ["voice_id", p.voice_id],
    ]),
    model: firstStr([["llm.model", llm?.model], ["model", p.model]]),
    language: firstStr([["language", p.language]]),
    tools: Array.isArray(p.tools) && (p.tools as unknown[]).length
      ? { path: "tools", names: toolNames(p.tools) }
      : undefined,
  }
  const consumed = new Set([
    "name", "agent_name", "system_prompt", "systemPrompt", "prompt", "instructions",
    "first_message", "firstMessage", "greeting", "voice", "tts", "voice_id",
    "llm", "model", "language", "tools", "asr",
  ])
  return withSweep(assemble(found, "Generic JSON", [], []), p, consumed)
}

const PARSERS: Record<ImportSource, (p: Rec) => VendorParse> = {
  Vapi: parseVapi,
  Retell: parseRetell,
  ElevenLabs: parseElevenLabs,
  Bland: parseBland,
  "Generic JSON": parseGeneric,
}

/** Unmistakable shape signatures — checked so a wrongly-picked chip can't
 *  fail a perfectly good export (the chip suggests; the shape decides). */
function detect(p: Rec): ImportSource | undefined {
  if (rec(p.conversation_config)) return "ElevenLabs"
  if (
    p.agent_name !== undefined || rec(p.response_engine) ||
    /^11labs-/i.test(str(p.voice_id) ?? "") || p.general_prompt !== undefined || p.begin_message !== undefined
  ) return "Retell"
  if (
    rec(p.model)?.messages !== undefined || rec(p.voice)?.voiceId !== undefined ||
    p.firstMessageMode !== undefined || rec(p.transcriber) !== undefined
  ) return "Vapi"
  if (
    p.task !== undefined || p.first_sentence !== undefined ||
    p.pathway_id !== undefined || p.interruption_threshold !== undefined
  ) return "Bland"
  return undefined
}

const KEY_HINTS: Record<ImportSource, string> = {
  Vapi: "name, model.messages, voice.voiceId, firstMessage",
  Retell: "agent_name, voice_id, response_engine / general_prompt",
  ElevenLabs: "name plus a conversation_config block",
  Bland: "prompt (or task), first_sentence, voice",
  "Generic JSON": "name, system_prompt, first_message, voice",
}

// ─── main entry ───────────────────────────────────────────────────────────────

export function parseImport(raw: string, source: ImportSource): ImportParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    const t = raw.trim()
    const yamlish = !t.startsWith("{") && !t.startsWith("[") && /^[\w-]+:\s/m.test(t)
    return {
      ok: false,
      error: yamlish
        ? "This looks like YAML — paste the JSON export for now (YAML support is coming)."
        : "That doesn't parse as JSON — check for a stray comma or an unclosed brace, and paste the whole object.",
    }
  }

  // Multi-object pastes fold into one record: an [agent, llm] array, or an
  // {agent, llm} pair — Retell keeps the prompt on that second object.
  let p = rec(parsed)
  if (Array.isArray(parsed)) {
    const objs = parsed.map(rec).filter((o): o is Rec => !!o)
    if (objs.length) p = Object.assign({}, ...objs)
  } else if (p && (rec(p.agent) || rec(p.llm) || rec(p.retell_llm)) && !str(p.name) && !str(p.agent_name)) {
    p = { ...p, ...rec(p.agent), ...rec(p.llm), ...rec(p.retell_llm) }
    delete p.agent
  }
  if (!p || !Object.keys(p).length) {
    return { ok: false, error: "That JSON is empty — paste your agent's full config object." }
  }

  // The shape wins over the chip: parsing a Vapi export "as Retell" because
  // the wrong chip was active is exactly the failure we're fixing.
  const detected = detect(p)
  let effective: ImportSource = detected ?? source
  let vp = PARSERS[effective](p)
  // Chip-shaped parser found less than the permissive sniff? Use the sniff —
  // a hand-rolled JSON under a vendor chip must not lose fields.
  if (effective !== "Generic JSON") {
    const gen = parseGeneric(p)
    if (gen.mapped.length > vp.mapped.length) {
      vp = gen
      effective = "Generic JSON"
    }
  }

  if (!vp.mapped.length) {
    return {
      ok: false,
      error: `No ${effective === "Generic JSON" ? "recognizable agent" : effective} fields found. Expected keys like ${KEY_HINTS[effective]}. Copy the FULL agent object from the ${effective === "Generic JSON" ? "source" : effective} dashboard or API.`,
      detected: detected && detected !== source ? detected : undefined,
    }
  }

  return {
    ok: true,
    config: vp.config,
    mapped: vp.mapped,
    dropped: vp.dropped.length ? vp.dropped : undefined,
    warnings: vp.warnings.length ? vp.warnings : undefined,
    detected: effective !== source ? effective : undefined,
  }
}

// ─── artifact + draft seeding (shared by the wizard and the list view) ───────

/** Persist the import as a CUSTOM voice artifact carrying a coherent engine —
 *  balanced cascade + the imported TTS voice + the imported LLM when the
 *  catalog can run it — so seeding a draft from it never mixes vendors. */
export function importedConfigToArtifact(config: ImportedAgentConfig): VoiceArtifact {
  const base = stackFor("balanced")
  const llm = catalogLlm(config.llmModel)
  // The parser only carries a voice whose provider runs on the bundled stack
  // (voiceProvider is already "ElevenLabs" | "Azure") — brand it truthfully.
  const ttsVendor = config.voiceProvider === "Azure" ? "Azure" : "ElevenLabs"
  const stack: AgentStack = {
    ...base,
    pipeline: "stt-llm-tts",
    language: languageLabelFor(config.language) ?? "English",
    llm: llm ? { vendor: llm.vendor, model: llm.model } : base.llm,
    tts: config.voice ? { vendor: ttsVendor, voice: config.voice } : base.tts,
  }
  return saveVoiceArtifact({
    id: newVoiceId(),
    name: config.name,
    kind: "custom",
    tagline: config.source ? `Imported from ${config.source}` : "Imported agent",
    personality: config.systemPrompt ? config.systemPrompt.slice(0, 140) : "Imported behavior",
    tone: "Professional",
    language: config.language ?? "en-US",
    ttsVoice: config.voice ?? "rachel",
    firstMessage: config.firstMessage ?? "Hi, how can I help you today?",
    systemPrompt: config.systemPrompt,
    source: config.source ?? "Import",
    provider: config.voice ? ttsVendor : undefined,
    stack,
  })
}

/** Seed a BRAND-NEW draft entirely from an import — the "Create as new agent"
 *  path. Unlike applying into an open draft (where existing work wins), there
 *  is nothing to preserve: name, prompt, greeting, voice, and engine all come
 *  from the import. */
export function importedAgentToDraft(config: ImportedAgentConfig, artifact: VoiceArtifact): AgentDraft {
  return {
    ...EMPTY_DRAFT,
    name: config.name,
    voice: { kind: "custom", id: artifact.id },
    stack: { ...(artifact.stack ?? stackFor("balanced")) },
    systemPrompt: config.systemPrompt ?? defaultPromptFor(artifact),
    greeting: config.firstMessage ?? artifact.firstMessage,
  }
}

// ─── import-landing notice (one-shot, survives the builder remount) ──────────
//
// "Create as new agent" and the list-view import both land by writing the
// new-draft slot and remounting the builder. The remount's restore path would
// toast a generic "Draft restored" — this stash lets it say what ACTUALLY
// happened ("Jarvis imported…"), and offer Undo when the landing replaced an
// unsaved draft. Same one-shot idiom as takePlaygroundStack.

const IMPORT_NOTICE_KEY = "sx:import_notice"

export interface ImportNotice {
  name: string
  /** Whether the export carried a prompt — the landing toast tells the truth. */
  hadPrompt: boolean
  /** The unsaved new-agent draft this import replaced — offered back via Undo. */
  prev?: AgentDraft
  at: number
}

export function stashImportNotice(n: Omit<ImportNotice, "at">) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(IMPORT_NOTICE_KEY, JSON.stringify({ ...n, at: Date.now() }))
  } catch {
    /* wireframe only */
  }
}

/** Dev StrictMode double-invokes mount effects — the SECOND take within a
 *  beat must see the same result, or it falls through to the generic
 *  "Draft restored" toast right next to the import one. */
let lastTaken: { n: ImportNotice | null; at: number } | null = null

/** Read + clear (one-shot). A notice older than a minute is from an abandoned
 *  landing — surfacing it later would toast a stale import. */
export function takeImportNotice(): ImportNotice | null {
  if (typeof window === "undefined") return null
  if (lastTaken && Date.now() - lastTaken.at < 2000) return lastTaken.n
  try {
    const raw = window.sessionStorage.getItem(IMPORT_NOTICE_KEY)
    const n = raw ? (JSON.parse(raw) as ImportNotice) : null
    if (raw) window.sessionStorage.removeItem(IMPORT_NOTICE_KEY)
    const fresh = n && Date.now() - n.at < 60_000 ? n : null
    lastTaken = { n: fresh, at: Date.now() }
    return fresh
  } catch {
    return null
  }
}

// ─── vendor examples + field hints (the sheet's demonstrable promise) ────────

export const VENDOR_EXAMPLES: Record<ImportSource, string> = {
  Vapi: `{
  "name": "Riley",
  "firstMessage": "Hi, this is Riley from Acme. How can I help?",
  "model": {
    "provider": "openai",
    "model": "gpt-4o",
    "messages": [
      { "role": "system", "content": "You are Riley, Acme's support agent…" }
    ],
    "tools": [{ "type": "transferCall" }]
  },
  "voice": { "provider": "11labs", "voiceId": "burt" },
  "transcriber": { "provider": "deepgram", "model": "nova-2", "language": "en" }
}`,
  Retell: `{
  "agent_name": "Jarvis",
  "voice_id": "11labs-Adrian",
  "language": "en-US",
  "response_engine": {
    "type": "retell-llm",
    "llm_id": "llm_234sd0f8dsfsd2",
    "model": "gpt-4o",
    "general_prompt": "You are Jarvis, a friendly scheduling agent…",
    "begin_message": "Hey, this is Jarvis from Retell Hospital.",
    "general_tools": [{ "type": "end_call", "name": "end_call" }]
  },
  "webhook_url": "https://example.com/webhook"
}`,
  ElevenLabs: `{
  "name": "Support agent",
  "conversation_config": {
    "agent": {
      "language": "en",
      "first_message": "Hi, thanks for calling — how can I help?",
      "prompt": { "prompt": "You are a helpful tier-1 support agent…", "llm": "gpt-4o" }
    },
    "tts": { "voice_id": "cjVigY5qzO86Huf0OWal", "model_id": "eleven_turbo_v2" }
  },
  "platform_settings": { "auth": { "enable_auth": false } }
}`,
  Bland: `{
  "prompt": "You are Acme's inbound receptionist…",
  "first_sentence": "Thanks for calling Acme!",
  "voice": "maya",
  "language": "en-US",
  "model": "turbo",
  "interruption_threshold": 100
}`,
  "Generic JSON": `{
  "name": "Acme Support v3",
  "language": "en-US",
  "voice": "rachel",
  "llm": { "provider": "openai", "model": "gpt-4o" },
  "first_message": "Hi! Thanks for calling Acme.",
  "system_prompt": "You are a helpful tier-1 support agent…",
  "tools": ["transfer_call", "check_order_status"]
}`,
}

export const VENDOR_FIELD_HINTS: Record<ImportSource, string> = {
  Vapi: "We read name, model.messages (system role), model.model, voice.voiceId, firstMessage, and transcriber.language.",
  Retell: "We read agent_name, voice_id, language, and the prompt — general_prompt / begin_message inline under response_engine, or on a pasted Retell-LLM object.",
  ElevenLabs: "We read name plus conversation_config — agent.prompt.prompt, first_message, language, and tts.voice_id.",
  Bland: "We read prompt (or task), first_sentence, voice, and language.",
  "Generic JSON": "Recognized keys: name, system_prompt, first_message, voice, llm.model, language, tools.",
}
