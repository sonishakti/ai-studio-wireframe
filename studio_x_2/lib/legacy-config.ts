/**
 * Retired settings, and the one click that moves them (design 09).
 *
 * The engine's join contract has been rewritten twice. Old agents still carry
 * the old keys, and the console's answer was to accept them and say nothing,
 * so an agent could be quietly invalid until the call failed.
 *
 * Vapi's answer is a section literally headed "Deprecated" with the line
 * "Legacy settings kept for backward compatibility. Prefer the modern
 * equivalents where available", and, for functions, "This feature will be
 * removed in the future". That is honest and it is also homework: the user has
 * to work out what the modern equivalent is and rewrite it themselves.
 *
 * So this does the same detection and then offers the rewrite. Nothing is
 * changed without being shown first, because a silent rewrite of someone's
 * config is the same trust break as a silent drop.
 */

export interface MigrationRow {
  /** The retired key, exactly as it appears in their config. */
  path: string
  before: string
  after: string
  /** Why it moved, in one line. */
  reason: string
}

export interface MigrationPlan {
  rows: MigrationRow[]
  /** The rewritten config, ready to save. */
  next: string
}

type Rule = {
  match: (o: Record<string, unknown>) => boolean
  apply: (o: Record<string, unknown>) => MigrationRow[]
}

const str = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v))

/**
 * One entry per retired key. A key with no entry here cannot be rewritten,
 * which is the point: anything this does not recognise is left exactly as the
 * user wrote it rather than guessed at.
 */
const RULES: Rule[] = [
  {
    match: (o) => "interrupt_mode" in o,
    apply: (o) => {
      const mode = str(o.interrupt_mode)
      const enable = mode === "interrupt"
      const interruption = o.interruption as Record<string, unknown> | undefined
      o.interruption = {
        ...(interruption ?? {}),
        enable,
        ...(enable
          ? { mode: "start_of_speech" }
          : { disabled_config: { strategy: mode === "append" ? "append" : "ignore" } }),
      }
      delete o.interrupt_mode
      return [{
        path: "interrupt_mode",
        before: mode,
        after: enable ? "interruption.enable: true, mode: start_of_speech" : `interruption.enable: false, strategy: ${mode}`,
        reason: "Interruption is one block now, so the switch and the strategy live together.",
      }]
    },
  },
  {
    match: (o) => "interrupt_keywords" in o,
    apply: (o) => {
      const kws = o.interrupt_keywords
      const interruption = (o.interruption as Record<string, unknown>) ?? {}
      o.interruption = { ...interruption, mode: "keywords", keywords_config: { trigger_keywords: kws } }
      delete o.interrupt_keywords
      return [{
        path: "interrupt_keywords",
        before: str(kws),
        after: "interruption.keywords_config.trigger_keywords",
        reason: "Keyword interruption moved inside the interruption block.",
      }]
    },
  },
  {
    match: (o) => "silence_timeout" in o,
    apply: (o) => {
      const secs = Number(o.silence_timeout) || 0
      const params = (o.parameters as Record<string, unknown>) ?? {}
      const llm = (o.llm as Record<string, unknown>) ?? {}
      const content = typeof llm.silence_message === "string" ? llm.silence_message : "Are you still there?"
      o.parameters = { ...params, silence_config: { timeout_ms: secs * 1000, action: "speak", content } }
      delete o.silence_timeout
      if ("silence_message" in llm) { delete llm.silence_message; o.llm = llm }
      return [{
        path: "silence_timeout",
        before: `${secs}s`,
        after: `parameters.silence_config.timeout_ms: ${secs * 1000}`,
        reason: "The timer and the line it plays are one setting now, in milliseconds.",
      }]
    },
  },
  {
    match: (o) => "enable_aivad" in o || "vad" in o,
    apply: (o) => {
      const rows: MigrationRow[] = []
      if ("enable_aivad" in o) {
        rows.push({
          path: "enable_aivad",
          before: str(o.enable_aivad),
          after: "turn_detection.mode: default",
          reason: "Turn detection replaced the separate voice-activity switch.",
        })
        delete o.enable_aivad
      }
      if ("vad" in o) {
        rows.push({
          path: "vad",
          before: str(o.vad),
          after: "turn_detection.mode: default",
          reason: "Turn detection replaced the separate voice-activity switch.",
        })
        delete o.vad
      }
      o.turn_detection = { ...((o.turn_detection as Record<string, unknown>) ?? {}), mode: "default" }
      return rows
    },
  },
  {
    match: (o) => "preset" in o,
    apply: (o) => {
      const before = str(o.preset)
      delete o.preset
      for (const slot of ["asr", "llm", "tts"] as const) {
        const block = (o[slot] as Record<string, unknown>) ?? {}
        o[slot] = { ...block, credential_mode: "managed" }
      }
      return [{
        path: "preset",
        before,
        after: "credential_mode: managed on asr, llm and tts",
        reason: "Whose key runs each model is set per model now, not once for the agent.",
      }]
    },
  },
]

/** Is there anything here the current contract no longer accepts? */
export function detectRetired(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(raw) as Record<string, unknown> } catch { return [] }
  const found: string[] = []
  for (const key of ["interrupt_mode", "interrupt_keywords", "silence_timeout", "enable_aivad", "vad", "preset"]) {
    if (key in parsed) found.push(key)
  }
  return found
}

/** What would change, and what it would become. Nothing is written here. */
export function planMigration(raw: string | undefined): MigrationPlan | null {
  if (!raw?.trim()) return null
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(raw) as Record<string, unknown> } catch { return null }
  const rows: MigrationRow[] = []
  for (const rule of RULES) {
    if (rule.match(parsed)) rows.push(...rule.apply(parsed))
  }
  if (!rows.length) return null
  return { rows, next: JSON.stringify(parsed, null, 2) }
}
