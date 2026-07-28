/**
 * Session agent store — the client-side ledger the All-agents list and the
 * builder SHARE (user-test 2026-07-28 P0s: a freshly deployed agent never
 * joined the list, and pause lived only on the list row, out of sync with the
 * builder). Two slices, both in sessionStorage (mock data only, per-tab):
 *   • session agents — agents deployed THIS session, merged ABOVE the AGENTS
 *     mock in the list, each carrying its campaign runs;
 *   • status overrides — live/paused flips written from either surface.
 * Every write emits `sx:agents-store` so all mounted surfaces re-read. Same
 * `sx:` guard idiom as `lib/analytics.ts` / `lib/wizard-draft.ts`.
 */

import { PHONE_NUMBERS, type StackPreset } from "@/lib/campaign-data"
import { activeCampaigns, primaryChannel, type AgentDraft } from "@/lib/wizard-draft"

/** Mirrors the list's channel filter vocabulary (`AgentChannel` on /agents). */
export type SessionAgentChannel = "phone" | "whatsapp" | "web" | "batch" | "code" | "none"

/** A campaign run nested under its agent's list row — the same fields the
 *  list renders for `Agent.campaigns` seeds, so the two row shapes agree. */
export interface SessionRun {
  id: string
  name: string
  status: "draft" | "scheduled" | "running" | "completed"
  contacts?: number
  language?: string
  startDate?: string
  startTime?: string
}

/** A list row for an agent deployed this session. */
export interface SessionAgent {
  id: string
  name: string
  description: string
  /** "live" | "paused" | "draft" — plus "deployed" for Code/SDK (not live
   *  until the app connects; the list's badge fallback renders it honestly). */
  status: string
  channelType: SessionAgentChannel
  channelLabel: string
  stack: StackPreset
  calls: number
  lastModified: string
  runs: SessionRun[]
}

export type AgentLiveStatus = "live" | "paused"

const AGENTS_KEY = "sx:session_agents"
const STATUS_KEY = "sx:agent_status"
const EVENT = "sx:agents-store"

const emit = () => window.dispatchEvent(new CustomEvent(EVENT))

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / serialization errors — wireframe only */
  }
  emit()
}

export function readSessionAgents(): SessionAgent[] {
  return read<SessionAgent[]>(AGENTS_KEY, [])
}

/** Newest first — a just-deployed agent lands at the TOP of the list. */
export function upsertSessionAgent(agent: SessionAgent) {
  write(AGENTS_KEY, [agent, ...readSessionAgents().filter((a) => a.id !== agent.id)])
}

export function readStatusOverrides(): Record<string, AgentLiveStatus> {
  return read<Record<string, AgentLiveStatus>>(STATUS_KEY, {})
}

/** Pause/Resume from EITHER surface (list row or builder header). */
export function setAgentStatus(id: string, status: AgentLiveStatus) {
  write(STATUS_KEY, { ...readStatusOverrides(), [id]: status })
}

/** Re-read on every store write. Returns the unsubscribe. */
export function subscribeAgentStore(cb: () => void): () => void {
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}

/** Shape a just-deployed draft into its list row (+ nested runs). */
export function draftToSessionAgent(d: AgentDraft, agentId: string): SessionAgent {
  const primary = primaryChannel(d)
  const number = d.config.inbound?.numberIds[0]
    ? PHONE_NUMBERS.find((n) => n.id === d.config.inbound!.numberIds[0])?.number
    : undefined
  const firstRun = activeCampaigns(d)[0]
  const promptLine = d.systemPrompt.replace(/\s+/g, " ").trim()
  return {
    id: agentId,
    name: d.name.trim() || "Untitled agent",
    description:
      d.templateName ??
      (promptLine
        ? promptLine.length > 80
          ? `${promptLine.slice(0, 79)}…`
          : promptLine
        : "Deployed from the builder"),
    // Code/SDK deploys aren't live until the app connects — say "deployed".
    status: primary === "code" ? "deployed" : "live",
    channelType: primary === "inbound" ? "phone" : primary ?? "none",
    channelLabel:
      primary === "inbound" ? number ?? "No number yet"
      : primary === "batch" ? firstRun?.name ?? "Batch calls"
      : primary === "web" ? "Embedded widget"
      : primary === "code" ? "SDK / API"
      : "Not deployed",
    stack: d.stack.preset,
    calls: 0,
    lastModified: "Just now",
    runs: d.campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      // Deploy starts pending runs: an unscheduled draft run is now dialing.
      status:
        c.status === "draft"
          ? c.launch?.mode === "scheduled" ? "scheduled" : "running"
          : c.status,
      contacts: c.contacts,
      language: c.language,
      startDate: c.launch?.startDate,
      startTime: c.launch?.startTime,
    })),
  }
}
