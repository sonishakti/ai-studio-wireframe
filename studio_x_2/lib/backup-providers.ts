/**
 * Backup providers — Design Tracker 07 · Vendors & provider fallback.
 *
 * Verdict (references/research/07-vendors-fallback/05-directions.html):
 * A is the surface (one row in Voice & Models, on by default, recap per
 * component), B is the fold (per-component picker with eligibility, the
 * Engine's ordered pool made visible), C is one button (Test failover).
 *
 * Agora facts that shape the rules here:
 *  • `credential_mode` is per ASR / LLM / TTS. Managed is cheaper than BYO and
 *    includes vendor usage → Agora can own the backup pool for managed slots;
 *    a BYO slot needs the builder's second key before it has a backup.
 *  • Pinning a hosting region costs failover: a backup must be eligible in the
 *    pinned area, and "no eligible backup in <region>" is a real state.
 *  • The public agent API has no fallback field today (Engine P1 · Nov). The
 *    pool lives on the draft; nothing pretends to be wired.
 */

import { STACK_CATALOG, slotMode, type AgentStack } from "@/lib/campaign-data"
import { areaLabel, isPinned, type HostingArea, type HostingConfig } from "@/lib/hosting-regions"

export type BackupSlot = "asr" | "llm" | "tts"

export interface BackupConfig {
  enabled: boolean
  /** Explicit picks per slot (candidate id). Absent = Agora's default pool. */
  picks: Partial<Record<BackupSlot, string>>
}

export const DEFAULT_BACKUP: BackupConfig = { enabled: true, picks: {} }

export const backupOf = (b: BackupConfig | undefined): BackupConfig => ({ ...DEFAULT_BACKUP, ...(b ?? {}) })

export interface BackupCandidate {
  id: string
  slot: BackupSlot
  vendor: string
  label: string
  /** Spoken languages the candidate covers; "all" = every catalog language. */
  languages: string[] | "all"
  /** Hosting areas the vendor serves from; "all" = no restriction. */
  areas: HostingArea[] | "all"
  /** TTS only — the current voice has a mapped equivalent on this vendor. */
  voiceMapped?: boolean
}

/** The ordered pool the Engine ticket describes, per component. Wireframe
 *  catalog: the two vendors we already list plus the ones a real pool would
 *  hold. Order = Agora's preference. */
export const BACKUP_CANDIDATES: BackupCandidate[] = [
  { id: "asr:assemblyai", slot: "asr", vendor: "AssemblyAI", label: "AssemblyAI Universal", languages: "all", areas: "all" },
  { id: "asr:deepgram", slot: "asr", vendor: "Deepgram", label: "Deepgram Nova-3", languages: "all", areas: "all" },
  { id: "asr:google", slot: "asr", vendor: "Google", label: "Google STT v2", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA", "EUROPE", "ASIA"] },
  { id: "asr:whisper", slot: "asr", vendor: "Whisper", label: "OpenAI Whisper large-v3", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA"] },
  { id: "llm:anthropic", slot: "llm", vendor: "Anthropic", label: "Anthropic Claude Haiku", languages: "all", areas: "all" },
  { id: "llm:openai", slot: "llm", vendor: "OpenAI", label: "OpenAI GPT-4o mini", languages: "all", areas: "all" },
  { id: "llm:google", slot: "llm", vendor: "Google", label: "Gemini 2.0 Flash", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA", "EUROPE", "ASIA", "INDIA", "JAPAN"] },
  { id: "tts:cartesia", slot: "tts", vendor: "Cartesia", label: "Cartesia Sonic", languages: ["English", "Spanish", "French", "German"], areas: ["GLOBAL", "NORTH_AMERICA"], voiceMapped: true },
  { id: "tts:elevenlabs", slot: "tts", vendor: "ElevenLabs", label: "ElevenLabs Flash v2.5", languages: "all", areas: "all", voiceMapped: true },
  { id: "tts:azure", slot: "tts", vendor: "Azure", label: "Azure Neural", languages: "all", areas: "all", voiceMapped: true },
]

export const SLOT_LABEL: Record<BackupSlot, string> = { asr: "ASR", llm: "LLM", tts: "TTS" }

export interface BackupSlotPlan {
  slot: BackupSlot
  primary: { vendor: string; label: string; byo: boolean }
  /** The backup that would take over, when there is one. */
  backup?: BackupCandidate
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

/** The plan the row renders — a pure function of the stack, the hosting pin
 *  and the draft's picks, so the recap can never disagree with the fold. */
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
    for (const c of pool) {
      if (c.languages !== "all" && !c.languages.includes(language)) {
        ineligible.push({ candidate: c, why: `no ${language}` })
        continue
      }
      if (pinned && pinned !== "AUTO" && c.areas !== "all" && !c.areas.includes(pinned as HostingArea)) {
        ineligible.push({ candidate: c, why: `not in ${areaLabel(pinned)}` })
        continue
      }
      eligible.push(c)
    }
    if (!backup.enabled) return { slot, primary, eligible, ineligible, state: "off" }
    if (primary.byo) {
      return {
        slot, primary, eligible, ineligible, state: "needs-key",
        note: "your key — a backup needs a second key",
      }
    }
    const picked = backup.picks[slot] ? eligible.find((c) => c.id === backup.picks[slot]) : undefined
    const chosen = picked ?? eligible[0]
    if (!chosen) {
      return {
        slot, primary, eligible, ineligible, state: "no-match",
        note: pinnedArea ? `no eligible backup in ${pinnedArea}` : "no eligible backup",
      }
    }
    return { slot, primary, backup: chosen, eligible, ineligible, state: "covered" }
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
