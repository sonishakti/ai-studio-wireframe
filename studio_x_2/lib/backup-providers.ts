/**
 * Backup providers — Design Tracker 07 · Vendors & provider fallback.
 *
 * Verdict (references/research/07-vendors-fallback/05-directions.html):
 * A is the surface (one row in Voice & Models, on by default, recap per
 * component), B is the fold (per-component picker with eligibility, the
 * Engine's ordered pool made visible), C is one button (Test failover).
 *
 * Owner IA (2026-09-12): a backup belongs to the model it protects. It is set
 * in that model's Configure sheet, after the vendor and its credential, with a
 * credential of its own. A default Agora stack shows no backup control at all:
 * Agora keeps the backup ready on its own key.
 *
 * Agora facts that shape the rules here:
 *  • `credential_mode` is per ASR / LLM / TTS. Agora holds the key for the
 *    vendors it resells and for its backup pool; any other backup vendor needs
 *    one of the builder's saved credentials before it counts as a backup.
 *  • Pinning a hosting region costs failover: a backup must be eligible in the
 *    pinned area, and "no eligible backup in <region>" is a real state.
 *  • The public agent API has no fallback field today (Engine P1 · Nov). The
 *    pool lives on the draft; nothing pretends to be wired.
 */

import { MANAGED_PROVIDERS, STACK_CATALOG, slotMode, type AgentStack, type CredentialMode } from "@/lib/campaign-data"
import { areaLabel, isPinned, type HostingArea, type HostingConfig } from "@/lib/hosting-regions"

export type BackupSlot = "asr" | "llm" | "tts"

export interface BackupConfig {
  enabled: boolean
  /** Explicit picks per slot (candidate id, or NO_BACKUP). Absent = Agora's default pool. */
  picks: Partial<Record<BackupSlot, string>>
  /** The backup's own credential, per slot: Agora's key (managed) or one of
   *  the builder's saved credentials. A backup without a key is no backup. */
  credentialMode?: Partial<Record<BackupSlot, CredentialMode>>
  credentials?: Partial<Record<BackupSlot, string>>
}

/** Pick value for "No backup" on a slot. */
export const NO_BACKUP = "none"

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
  /** Agora runs this backup on its own key (the Engine's backup pool), so it
   *  is included even when Agora does not resell the vendor as a primary. */
  agoraPool?: boolean
}

/** Agora holds the key for this backup: resold vendor, or in Agora's pool. */
export const backupManaged = (c: BackupCandidate): boolean => c.vendor in MANAGED_PROVIDERS || !!c.agoraPool

/** The ordered pool the Engine ticket describes, per component. Wireframe
 *  catalog: the two vendors we already list plus the ones a real pool would
 *  hold. Order = Agora's preference. */
export const BACKUP_CANDIDATES: BackupCandidate[] = [
  { id: "asr:assemblyai", slot: "asr", vendor: "AssemblyAI", label: "AssemblyAI Universal", languages: "all", areas: "all", agoraPool: true },
  { id: "asr:deepgram", slot: "asr", vendor: "Deepgram", label: "Deepgram Nova-3", languages: "all", areas: "all" },
  { id: "asr:google", slot: "asr", vendor: "Google", label: "Google STT v2", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA", "EUROPE", "ASIA"] },
  { id: "asr:whisper", slot: "asr", vendor: "Whisper", label: "OpenAI Whisper large-v3", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA"] },
  { id: "llm:anthropic", slot: "llm", vendor: "Anthropic", label: "Anthropic Claude Haiku", languages: "all", areas: "all" },
  { id: "llm:openai", slot: "llm", vendor: "OpenAI", label: "OpenAI GPT-4o mini", languages: "all", areas: "all" },
  { id: "llm:google", slot: "llm", vendor: "Google", label: "Gemini 2.0 Flash", languages: "all", areas: ["GLOBAL", "NORTH_AMERICA", "EUROPE", "ASIA", "INDIA", "JAPAN"] },
  { id: "tts:cartesia", slot: "tts", vendor: "Cartesia", label: "Cartesia Sonic", languages: ["English", "Spanish", "French", "German"], areas: ["GLOBAL", "NORTH_AMERICA"], voiceMapped: true, agoraPool: true },
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
  /** The backup runs on the builder's key (Agora holds no key for it). */
  backupByo?: boolean
  /** The saved credential the backup runs on, when backupByo. */
  credentialId?: string
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
    if (backup.picks[slot] === NO_BACKUP) return { slot, primary, eligible, ineligible, state: "off", note: "no backup, by choice" }
    // Agora's default is the first eligible backup it holds a key for; an
    // explicit pick wins while it stays eligible.
    const picked = backup.picks[slot] ? eligible.find((c) => c.id === backup.picks[slot]) : undefined
    const chosen = picked ?? eligible.find(backupManaged) ?? eligible[0]
    if (!chosen) {
      return {
        slot, primary, eligible, ineligible, state: "no-match",
        note: pinnedArea ? `no eligible backup in ${pinnedArea}` : "no eligible backup",
      }
    }
    // The backup's key: Agora's when it holds one and the builder did not
    // insist on their own; otherwise one of the saved credentials, or nothing.
    const backupByo = !backupManaged(chosen) || backup.credentialMode?.[slot] === "byo"
    const credentialId = backup.credentials?.[slot]
    if (backupByo && !credentialId) {
      return {
        slot, primary, backup: chosen, eligible, ineligible, state: "needs-key", backupByo,
        note: `needs your ${chosen.vendor} key`,
      }
    }
    return { slot, primary, backup: chosen, eligible, ineligible, state: "covered", backupByo, credentialId }
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
