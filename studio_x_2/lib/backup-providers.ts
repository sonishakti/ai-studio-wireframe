/**
 * Backup providers — Design Tracker 07 · Vendors & provider fallback.
 *
 * Verdict (references/research/07-vendors-fallback/05-directions.html):
 * A is the surface (on by default, a recap per component), B is the fold
 * (per-component picker with eligibility, the Engine's ordered pool made
 * visible), C is one button (Test failover).
 *
 * Owner IA (2026-09-12): a backup belongs to the model it protects. It is set
 * in that model's Configure sheet, after the vendor and its credential, with a
 * credential of its own. A default Agora stack shows no backup control at all:
 * Agora keeps the backup ready on its own key.
 *
 * Owner IA (2026-09-15): a slot carries a CHAIN, not one backup. Each link is
 * a full row — vendor, model, its own credential — with a switch that takes it
 * out of the chain without losing its key, and "+ Add backup" appends the
 * next. The first enabled, usable link takes over first.
 *
 * Agora facts that shape the rules here:
 *  • `credential_mode` is per ASR / LLM / TTS. Agora holds the key for the
 *    vendors it resells and for its backup pool; any other backup vendor needs
 *    one of the builder's saved credentials before it counts as a backup.
 *  • Pinning a hosting region costs failover: a backup must be eligible in the
 *    pinned area, and "no eligible backup in <region>" is a real state.
 *  • The public agent API has no fallback field today (Engine P1 · Nov). The
 *    chain lives on the draft; nothing pretends to be wired.
 */

import { MANAGED_PROVIDERS, STACK_CATALOG, slotMode, type AgentStack, type CredentialMode } from "@/lib/campaign-data"
import { areaLabel, isPinned, type HostingArea, type HostingConfig } from "@/lib/hosting-regions"

export type BackupSlot = "asr" | "llm" | "tts"

/** One link in a slot's backup chain. */
export interface BackupEntry {
  /** BACKUP_CANDIDATES id — a vendor + model pair. */
  id: string
  /** A model id typed by hand, overriding the candidate's own. */
  model?: string
  /** Off keeps the row and its key; the Engine skips it. */
  enabled: boolean
  /** Whose key this backup runs on. Absent = Agora's, where Agora holds one. */
  credentialMode?: CredentialMode
  credentialId?: string
}

export interface BackupConfig {
  enabled: boolean
  /** Ordered per slot. Absent = Agora picks; an empty array = no backup, by choice. */
  entries: Partial<Record<BackupSlot, BackupEntry[]>>
}

export const DEFAULT_BACKUP: BackupConfig = { enabled: true, entries: {} }

export const backupOf = (b: BackupConfig | undefined): BackupConfig => ({
  enabled: b?.enabled ?? true,
  entries: b?.entries ?? {},
})

export interface BackupCandidate {
  id: string
  slot: BackupSlot
  vendor: string
  model: string
  label: string
  /** Spoken languages the candidate covers; "all" = every catalog language. */
  languages: string[] | "all"
  /** Hosting areas the vendor serves from; "all" = no restriction. */
  areas: HostingArea[] | "all"
  /** TTS only — the current voice has a mapped equivalent on this vendor. */
  voiceMapped?: boolean
  /** Agora runs this backup on its own key (the Engine's backup pool), so it
   *  is included even when Agora does not resell the vendor as a primary. */
  agoraPool?: boolean
}

/** Agora holds the key for this backup: resold vendor, or in Agora's pool. */
export const backupManaged = (c: BackupCandidate): boolean => c.vendor in MANAGED_PROVIDERS || !!c.agoraPool

/** The ordered pool the Engine ticket describes, per component. Wireframe
 *  catalog: the vendors we already list plus the ones a real pool would hold,
 *  each with the models that vendor offers. Order = Agora's preference. */
export const BACKUP_CANDIDATES: BackupCandidate[] = [
  { id: "asr:assemblyai:universal", slot: "asr", vendor: "AssemblyAI", model: "Universal", label: "AssemblyAI Universal", languages: "all", areas: "all", agoraPool: true },
  { id: "asr:assemblyai:streaming", slot: "asr", vendor: "AssemblyAI", model: "Universal Streaming", label: "AssemblyAI Universal Streaming", languages: "all", areas: "all", agoraPool: true },
  { id: "asr:deepgram:nova-3", slot: "asr", vendor: "Deepgram", model: "Nova-3", label: "Deepgram Nova-3", languages: "all", areas: "all" },
  { id: "asr:deepgram:nova-2", slot: "asr", vendor: "Deepgram", model: "Nova-2", label: "Deepgram Nova-2", languages: "all", areas: "all" },
  { id: "asr:google:chirp-2", slot: "asr", vendor: "Google", model: "Chirp 2", label: "Google Chirp 2", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA", "EUROPE", "ASIA"] },
  { id: "asr:google:stt-v2", slot: "asr", vendor: "Google", model: "STT v2", label: "Google STT v2", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA", "EUROPE", "ASIA"] },
  { id: "asr:openai:whisper-large-v3", slot: "asr", vendor: "OpenAI", model: "Whisper large-v3", label: "OpenAI Whisper large-v3", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA"] },

  { id: "llm:anthropic:claude-haiku", slot: "llm", vendor: "Anthropic", model: "Claude Haiku", label: "Anthropic Claude Haiku", languages: "all", areas: "all" },
  { id: "llm:anthropic:claude-sonnet", slot: "llm", vendor: "Anthropic", model: "Claude Sonnet", label: "Anthropic Claude Sonnet", languages: "all", areas: "all" },
  { id: "llm:openai:gpt-4o-mini", slot: "llm", vendor: "OpenAI", model: "GPT-4o mini", label: "OpenAI GPT-4o mini", languages: "all", areas: "all" },
  { id: "llm:openai:gpt-4-1-mini", slot: "llm", vendor: "OpenAI", model: "GPT-4.1 mini", label: "OpenAI GPT-4.1 mini", languages: "all", areas: "all" },
  { id: "llm:google:gemini-flash", slot: "llm", vendor: "Google", model: "Gemini 2.0 Flash", label: "Google Gemini 2.0 Flash", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA", "EUROPE", "ASIA", "INDIA", "JAPAN"] },

  { id: "tts:cartesia:sonic", slot: "tts", vendor: "Cartesia", model: "Sonic", label: "Cartesia Sonic", languages: ["English", "Spanish", "French", "German"], areas: ["GLOBAL", "NORTH_AMERICA"], voiceMapped: true, agoraPool: true },
  { id: "tts:cartesia:sonic-turbo", slot: "tts", vendor: "Cartesia", model: "Sonic Turbo", label: "Cartesia Sonic Turbo", languages: ["English", "Spanish"], areas: ["GLOBAL", "NORTH_AMERICA"], voiceMapped: true, agoraPool: true },
  { id: "tts:elevenlabs:flash-v2-5", slot: "tts", vendor: "ElevenLabs", model: "Flash v2.5", label: "ElevenLabs Flash v2.5", languages: "all", areas: "all", voiceMapped: true },
  { id: "tts:elevenlabs:turbo-v2-5", slot: "tts", vendor: "ElevenLabs", model: "Turbo v2.5", label: "ElevenLabs Turbo v2.5", languages: "all", areas: "all", voiceMapped: true },
  { id: "tts:azure:neural", slot: "tts", vendor: "Azure", model: "Neural", label: "Azure Neural", languages: "all", areas: "all", voiceMapped: true },
  { id: "tts:azure:neural-hd", slot: "tts", vendor: "Azure", model: "Neural HD", label: "Azure Neural HD", languages: "all", areas: "all", voiceMapped: true },
]

export const SLOT_LABEL: Record<BackupSlot, string> = { asr: "ASR", llm: "LLM", tts: "TTS" }

export const candidateById = (id: string): BackupCandidate | undefined => BACKUP_CANDIDATES.find((c) => c.id === id)

/** One resolved link in the chain: what it is, whether it can actually serve. */
export interface BackupLink {
  candidate: BackupCandidate
  /** The model actually used: the candidate's, or a custom id. */
  model: string
  enabled: boolean
  /** Runs on the builder's own key. */
  byo: boolean
  credentialId?: string
  /** Why this link cannot serve, when it cannot. */
  problem?: string
  /** Agora's default, not an explicit pick. */
  auto?: boolean
}

export interface BackupSlotPlan {
  slot: BackupSlot
  primary: { vendor: string; label: string; byo: boolean }
  /** The chain, in order. */
  links: BackupLink[]
  /** What the picker offers, in Agora's order. */
  eligible: BackupCandidate[]
  ineligible: { candidate: BackupCandidate; why: string }[]
  state: "covered" | "needs-key" | "no-match" | "off"
  /** One sentence for the recap line when the slot is not covered. */
  note?: string
}

export interface BackupPlan {
  enabled: boolean
  slots: BackupSlotPlan[]
  covered: number
  /** "3 of 3 covered" / "TTS has no backup" — the chip next to the switch. */
  status: string
  /** The pinned hosting area label, when eligibility was narrowed by it. */
  pinnedArea?: string
}

function primaryOf(stack: AgentStack, slot: BackupSlot): { vendor: string; label: string } {
  if (slot === "tts") {
    const v = STACK_CATALOG.tts.find((x) => x.vendor === stack.tts.vendor)
    return { vendor: stack.tts.vendor, label: v?.label ?? stack.tts.vendor }
  }
  const cur = stack[slot]
  const list = slot === "asr" ? STACK_CATALOG.stt : STACK_CATALOG.llm
  const hit = list.find((o) => o.vendor === cur.vendor && o.model === cur.model)
  return { vendor: cur.vendor, label: hit?.label ?? `${cur.vendor} ${cur.model}` }
}

/** The plan the sheet and the recap both render — a pure function of the
 *  stack, the hosting pin and the draft's chain, so they cannot disagree. */
export function planBackups(input: {
  stack: AgentStack
  hosting?: HostingConfig
  backup?: BackupConfig
}): BackupPlan {
  const { stack, hosting } = input
  const backup = backupOf(input.backup)
  const language = stack.language ?? "English"
  const pinned = hosting && isPinned(hosting) ? hosting.area : undefined
  const pinnedArea = pinned && pinned !== "AUTO" ? areaLabel(pinned) : undefined

  const slots = (["asr", "llm", "tts"] as const).map((slot): BackupSlotPlan => {
    const primary = { ...primaryOf(stack, slot), byo: slotMode(stack, slot) === "byo" }
    const pool = BACKUP_CANDIDATES.filter((c) => c.slot === slot && c.vendor !== primary.vendor)
    const eligible: BackupCandidate[] = []
    const ineligible: BackupSlotPlan["ineligible"] = []
    const whyIneligible = (c: BackupCandidate): string | undefined => {
      if (c.languages !== "all" && !c.languages.includes(language)) return `no ${language}`
      if (pinned && pinned !== "AUTO" && c.areas !== "all" && !c.areas.includes(pinned as HostingArea)) return `not in ${areaLabel(pinned)}`
      return undefined
    }
    for (const c of pool) {
      const why = whyIneligible(c)
      if (why) ineligible.push({ candidate: c, why })
      else eligible.push(c)
    }

    if (!backup.enabled) return { slot, primary, links: [], eligible, ineligible, state: "off" }

    const entries = backup.entries[slot]
    let links: BackupLink[]
    if (!entries) {
      // Untouched: Agora's default is the first eligible backup it holds a key for.
      const auto = eligible.find(backupManaged)
      links = auto ? [{ candidate: auto, model: auto.model, enabled: true, byo: false, auto: true }] : []
    } else {
      links = entries
        .map((e): BackupLink | null => {
          const candidate = candidateById(e.id)
          if (!candidate || candidate.slot !== slot) return null
          const managed = backupManaged(candidate)
          const byo = !managed || e.credentialMode === "byo"
          const why = whyIneligible(candidate)
          const problem = why
            ? why
            : candidate.vendor === primary.vendor
              ? "same as the primary"
              : byo && !e.credentialId
                ? `needs your ${candidate.vendor} key`
                : undefined
          return { candidate, model: e.model?.trim() || candidate.model, enabled: e.enabled, byo, credentialId: e.credentialId, problem }
        })
        .filter((l): l is BackupLink => !!l)
    }

    const live = links.filter((l) => l.enabled)
    if (live.length === 0) {
      return {
        slot, primary, links, eligible, ineligible,
        state: entries ? "off" : "no-match",
        note: entries ? "no backup, by choice" : pinnedArea ? `no eligible backup in ${pinnedArea}` : "no eligible backup",
      }
    }
    const serving = live.find((l) => !l.problem)
    if (serving) return { slot, primary, links, eligible, ineligible, state: "covered" }
    const keyGap = live.find((l) => l.problem?.startsWith("needs your"))
    return {
      slot, primary, links, eligible, ineligible,
      state: keyGap ? "needs-key" : "no-match",
      note: (keyGap ?? live[0]).problem,
    }
  })

  const covered = slots.filter((s) => s.state === "covered").length
  const gaps = slots.filter((s) => s.state === "needs-key" || s.state === "no-match")
  const status = !backup.enabled
    ? "off"
    : gaps.length === 0
      ? `${covered} of ${slots.length} covered`
      : gaps.length === 1
        ? `${SLOT_LABEL[gaps[0].slot]} has no backup`
        : `${gaps.map((g) => SLOT_LABEL[g.slot]).join(" and ")} have no backup`
  return { enabled: backup.enabled, slots, covered, status, pinnedArea }
}
