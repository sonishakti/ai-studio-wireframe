/**
 * Channels — the readiness vocabulary the builder's Inbound fold and the
 * Resources inventory share (Design Tracker 18, verdict C with B's vocabulary
 * as its spine).
 *
 * Derived, never declared. `ChannelSurface` IS `ChannelKind`
 * (campaign-data.ts:21), which already names telephony · whatsapp · sms · web,
 * and `ChannelRowKind` adds back the two deployment kinds the inventory
 * already lists, so nothing here mints a seventh channel taxonomy.
 * `channelBindings()` reads PHONE_NUMBERS, DEPLOYMENTS and AGENTS: the
 * hand-written row array it replaces was a second record of data those already
 * hold, and that second record is what put a live-looking WhatsApp channel and
 * a bare comma on the page.
 *
 * Four readiness words, each with a producer in the data: `ready` (a binding
 * with an agent behind it), `scheduled` (a batch run waiting for its window),
 * `no_agent` (a channel exists and nothing answers on it), `not_supported`
 * (no Agora contract at any version). None of the four is an error, so there
 * is no danger tone. The words with no producer are deliberately absent —
 * nothing counts traffic, and there is no carrier queue, no submission and no
 * reason field to read.
 *
 * Two nouns this module does NOT own: what the builder PICKED lives on the
 * draft (`InboundSurface`, wizard-draft.ts:37), and `lib/session-trace.ts`'s
 * own CHANNEL_LABEL is left alone — collapsing that one is a rename across
 * Sessions and Monitor.
 */

import {
  AGENTS,
  CHANNEL_LABEL,
  DEPLOYMENTS,
  PHONE_NUMBERS,
  deploymentHref,
  getDeployment,
  type ChannelKind,
  type DeploymentStatus,
} from "@/lib/campaign-data"
import { Events, track } from "@/lib/analytics"
import type { ChannelBlockedCode } from "@/lib/analytics"
import type { DeployChannel, InboundSurface } from "@/lib/wizard-draft"

// ─── Vocabulary ───────────────────────────────────────────────────────────────

/** What a channel IS. Re-exported from `ChannelKind`, not re-declared. */
export type ChannelSurface = ChannelKind

/** What a row in the inventory can be: the four surfaces, plus the two
 *  deployment kinds that already have rows, labels, filter chips and counts
 *  there (Batch calls · Code / SDK). */
export type ChannelRowKind = ChannelSurface | Extract<DeployChannel, "batch" | "code">

/** How ready a binding is. Four words, four producers — a word with nothing
 *  behind it would be the bare comma in better clothes. */
export type ChannelReadiness = "ready" | "scheduled" | "no_agent" | "not_supported"

/** What a builder can ask for: a live control whose answer the Engine cannot
 *  give yet. Recorded at the control, one ask per channel. */
export type ChannelAsk = "whatsapp" | "sms" | "text_only" | "origins"

/** The one bridge between the surface the builder picked and the surface a
 *  channel is. `InboundSurface` stays at two members: widening it would
 *  cascade into the rehydrate filter, the deploy blocker and channelTarget. */
export const SURFACE_OF: Record<InboundSurface, ChannelSurface> = {
  phone: "telephony",
  web: "web",
}

/** One label per thing: the four surfaces keep campaign-data's words, and the
 *  two extra strings are the ones already on the inventory's rows. */
export const ROW_KIND_LABEL: Record<ChannelRowKind, string> = {
  ...CHANNEL_LABEL,
  batch: "Batch calls",
  code: "Code / SDK",
}

export const READINESS_LABEL: Record<ChannelReadiness, string> = {
  ready: "Ready",
  scheduled: "Scheduled",
  no_agent: "No agent yet",
  not_supported: "Not supported yet",
}

/** No danger tone: none of the four states is an error. Warning marks the one
 *  the user can act on — a channel with nothing behind it. */
export const READINESS_TONE: Record<ChannelReadiness, "success" | "warning" | "muted"> = {
  ready: "success",
  scheduled: "muted",
  no_agent: "warning",
  not_supported: "muted",
}

/** Whether Agora serves the surface at all, at any version of the contract. */
export const SURFACE_SUPPORTED: Record<ChannelSurface, boolean> = {
  telephony: true,
  web: true,
  whatsapp: false,
  sms: false,
}

/** Codes only, the same rule `deploy_blocked` follows: the reason a user reads
 *  is prose on the surface and never an analytics property. */
export const ASK_CODE: Record<ChannelAsk, ChannelBlockedCode> = {
  whatsapp: "not_supported",
  sms: "not_supported",
  text_only: "voice_leg_required",
  origins: "origin_missing",
}

/** Internal. Rides the `channel_blocked` payload so the demand lands on the
 *  ticket it argues for. Never rendered: the shipped caption is "Requires
 *  Engine", and an internal id on a customer surface is a third caption. */
export const ENGINE_TICKET: Partial<Record<ChannelAsk, string>> = {
  whatsapp: "868ka6ajk",
  sms: "868kyjfp2",
  text_only: "868kyjfnv",
  origins: "868kykbf8",
}

// ─── Bindings ─────────────────────────────────────────────────────────────────

export interface ChannelBinding {
  id: string
  kind: ChannelRowKind
  label: string
  /** The number, the domain, the contact count. Null renders nothing — never a
   *  fallback string standing in for a value we do not have. */
  identifier: string | null
  /** The agent behind it. Null is a real state, and it reads "No agent yet". */
  agent: string | null
  readiness: ChannelReadiness
  /** The page that manages this row. Null means there is no page and none
   *  should exist, so the sheet is the door. */
  href: string | null
}

/** A batch run is a channel while it is waiting or running. Completed, paused
 *  and draft runs are history and belong on the run's own page. */
const BATCH_LIVE: DeploymentStatus[] = ["scheduled", "active", "in_progress"]

/**
 * Every channel an agent answers on, derived from the records that already
 * hold them. A deployment on a surface Agora cannot serve produces NO row, so
 * a fabricated WhatsApp deployment never reaches this page; what every account
 * sees instead is the one synthesized row per unsupported surface, carrying no
 * account value at all.
 *
 * Total by construction: an empty inventory returns only those rows.
 */
export function channelBindings(): ChannelBinding[] {
  const rows: ChannelBinding[] = []

  // Numbers. The inventory's phone rows ARE PHONE_NUMBERS — a number routed
  // straight to an agent names it, otherwise the deployment using it does.
  for (const n of PHONE_NUMBERS) {
    // A number whose only binding is a deployment on a surface Agora cannot
    // serve answers on nothing, so it is not a channel here. Same rule as the
    // deployments below: without it one page would call WhatsApp Ready on one
    // row and Not supported yet on the next.
    const bound = n.assignedTo.map((id) => getDeployment(id)).filter((d) => d != null)
    if (!n.assignedAgent && bound.length > 0 && bound.every((d) => !SURFACE_SUPPORTED[d.channel.kind])) continue
    const agent = n.assignedAgent?.name ?? bound[0]?.agentName ?? null
    rows.push({
      id: n.id,
      kind: "telephony",
      label: n.label,
      identifier: n.number,
      agent,
      readiness: agent ? "ready" : "no_agent",
      // The number's own page, not the list: a row opens what it names
      // (16 · 17, 2026-09-17).
      href: `/deploy/phone-numbers/${n.id}`,
    })
  }

  for (const d of DEPLOYMENTS) {
    if (d.channel.kind === "web" && d.status === "active") {
      rows.push({
        id: d.id,
        kind: "web",
        label: d.name,
        identifier: d.channel.domains[0] ?? null,
        agent: d.agentName || null,
        readiness: d.agentName ? "ready" : "no_agent",
        href: "/deploy/web-widget",
      })
    }
    if (d.kind === "batch" && BATCH_LIVE.includes(d.status)) {
      rows.push({
        id: d.id,
        kind: "batch",
        label: d.name,
        identifier: d.contacts ? `${d.contacts.rowCount.toLocaleString()} contacts` : null,
        agent: d.agentName || null,
        readiness: d.status === "scheduled" ? "scheduled" : "ready",
        href: deploymentHref(d),
      })
    }
  }

  // An SDK channel belongs in its agent's builder, so that is where Manage
  // goes. Today no agent is on code and the Code filter reads 0, which is the
  // honest count rather than an invented embed.
  for (const a of AGENTS) {
    if (a.channel?.type !== "code") continue
    rows.push({
      id: a.id,
      kind: "code",
      label: a.name,
      identifier: null,
      agent: a.name,
      readiness: "ready",
      href: `/agents/${a.id}/edit?step=2`,
    })
  }

  for (const kind of Object.keys(SURFACE_SUPPORTED) as ChannelSurface[]) {
    if (SURFACE_SUPPORTED[kind]) continue
    rows.push({
      id: `ch_${kind}`,
      kind,
      label: ROW_KIND_LABEL[kind],
      identifier: null,
      agent: null,
      readiness: "not_supported",
      href: null,
    })
  }

  return rows
}

// ─── Demand ───────────────────────────────────────────────────────────────────
//
// The count that argues the Engine tickets into existence. Same `sx:` guard
// idiom as `lib/agent-resources.ts`: the ask stays in this browser, never in a
// real-looking property, and the switch that records it stays live.

const DEMAND_KEY = "sx:channel_demand"

const ASKS: ChannelAsk[] = ["whatsapp", "sms", "text_only", "origins"]

/** The asks recorded in this browser. Empty on the server, on a miss, on a
 *  parse error, and on anything stored that is not a list of known asks. */
export function readDemand(): ChannelAsk[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(DEMAND_KEY)
    if (!raw) return []
    const stored = JSON.parse(raw) as unknown
    if (!Array.isArray(stored)) return []
    return ASKS.filter((a) => stored.includes(a))
  } catch {
    return []
  }
}

/** Record or withdraw one ask. `channel_blocked` fires on the ON transition
 *  only, so the number counts people and not switch flips, and it carries
 *  codes only — the ticket id is internal, and no free-text reason rides it. */
export function setDemand(ask: ChannelAsk, on: boolean): void {
  // No browser, no store: nothing was asked for, so nothing is counted.
  if (typeof window === "undefined") return

  const current = readDemand()
  const had = current.includes(ask)
  const next = on ? (had ? current : [...current, ask]) : current.filter((a) => a !== ask)

  try {
    window.localStorage.setItem(DEMAND_KEY, JSON.stringify(next))
  } catch {
    /* quota / private mode — wireframe only */
  }

  if (on && !had) {
    track(Events.channel_blocked, {
      ask,
      code: ASK_CODE[ask],
      engine_ticket: ENGINE_TICKET[ask],
    })
  }
}
