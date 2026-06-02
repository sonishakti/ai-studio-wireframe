/**
 * Studio_X — Campaign data
 * ─────────────────────────
 *
 * Single source of truth for campaign mocks across the omnichannel hub.
 * A campaign owns one or more channels (telephony, WhatsApp, SMS, web widget).
 * Inbound campaigns are 1:1 — one agent per number/channel. Outbound campaigns
 * are 1:many — multiple campaigns can share a number pool, and the agent is
 * selected dynamically per call batch.
 *
 * Web widgets are inbound-only by design (users come to the widget).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChannelKind = "telephony" | "whatsapp" | "sms" | "web"
export type Direction = "in" | "out"
export type CampaignType = "inbound" | "outbound"
export type CampaignStatus =
  | "active"
  | "paused"
  | "in_progress"
  | "scheduled"
  | "completed"
  | "draft"

export type CampaignChannel =
  | { kind: "telephony"; direction: Direction; numbers: string[] }
  | { kind: "whatsapp"; direction: Direction; sender: string }
  | { kind: "sms"; direction: Direction; number: string }
  | { kind: "web"; direction: "in"; domains: string[] }

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  channels: CampaignChannel[]
  /** Inbound: required (1:1). Outbound: nullable (dynamic per batch). */
  agentId: string | null
  agentName: string | null
  status: CampaignStatus
  /** Cross-channel rollup. */
  metrics: {
    /** Total conversations across all channels in the lookback window. */
    calls: number
    /** % success — meaning varies by type (resolved for inbound, dialed-through for outbound). */
    successRate: number
    /** Average conversation duration in seconds. */
    avgHandleTimeSec: number
  }
  /** Outbound only — dial-through progress. */
  progress?: { completed: number; total: number }
  /** Outbound only — start date label. */
  startDate?: string
  /** Inbound only — incoming volume label (rings/week). */
  ringsPerWeek?: number
}

export interface PhoneNumber {
  id: string
  number: string
  label: string
  vendor: string
  /** Campaign IDs currently using this number. Empty array = available. */
  assignedTo: string[]
  /** Set when the number is routed directly to an agent (inbound), not via campaigns. */
  assignedAgent?: { id: string; name: string }
  status: "active" | "unassigned"
}

// ─── Channel direction matrix ────────────────────────────────────────────────
//
// Web widget is inbound-only. SMS, WhatsApp, Telephony support both directions.

export const CHANNEL_DIRECTIONS: Record<ChannelKind, Direction[]> = {
  telephony: ["in", "out"],
  whatsapp: ["in", "out"],
  sms: ["in", "out"],
  web: ["in"],
}

export function isChannelAllowedForType(
  kind: ChannelKind,
  type: CampaignType,
): boolean {
  const dir: Direction = type === "inbound" ? "in" : "out"
  return CHANNEL_DIRECTIONS[kind].includes(dir)
}

// ─── Status display ──────────────────────────────────────────────────────────

export const STATUS_BADGE: Record<
  CampaignStatus,
  { variant: "default" | "secondary" | "outline"; label: string }
> = {
  active: { variant: "default", label: "Active" },
  paused: { variant: "outline", label: "Paused" },
  in_progress: { variant: "default", label: "In progress" },
  scheduled: { variant: "secondary", label: "Scheduled" },
  completed: { variant: "outline", label: "Completed" },
  draft: { variant: "secondary", label: "Draft" },
}

// ─── Mock campaigns ──────────────────────────────────────────────────────────
//
// Migrated from the old INBOUND_CAMPAIGNS + OUTBOUND_CAMPAIGNS arrays. Each
// legacy row becomes a single-telephony-channel campaign in the new shape so
// the demo content is preserved while exercising the multi-channel data
// structure. Two campaigns (cp_ib_04, cp_ob_06) are intentionally multi-channel
// to demo the omnichannel pattern.

export const CAMPAIGNS: Campaign[] = [
  // ── Inbound ────────────────────────────────────────────────────────────────
  {
    id: "cp_ib_01",
    name: "Support Hotline",
    type: "inbound",
    channels: [
      { kind: "telephony", direction: "in", numbers: ["+1 (415) 555-0101"] },
    ],
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "active",
    metrics: { calls: 1240, successRate: 78, avgHandleTimeSec: 204 },
    ringsPerWeek: 1240,
  },
  {
    id: "cp_ib_02",
    name: "Sales Front Desk",
    type: "inbound",
    channels: [
      { kind: "telephony", direction: "in", numbers: ["+1 (628) 555-0188"] },
    ],
    agentId: "agt_sales_qualifier",
    agentName: "Sales Qualifier",
    status: "active",
    metrics: { calls: 340, successRate: 62, avgHandleTimeSec: 112 },
    ringsPerWeek: 340,
  },
  {
    id: "cp_ib_03",
    name: "UK Support",
    type: "inbound",
    channels: [
      { kind: "telephony", direction: "in", numbers: ["+44 20 7946 0958"] },
    ],
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "paused",
    metrics: { calls: 0, successRate: 0, avgHandleTimeSec: 0 },
    ringsPerWeek: 0,
  },
  // ── Omnichannel demo (inbound) — phone + web widget + WhatsApp ────────────
  {
    id: "cp_ib_04",
    name: "Acme Help Center",
    type: "inbound",
    channels: [
      { kind: "telephony", direction: "in", numbers: ["+1 (800) 555-0199"] },
      { kind: "web", direction: "in", domains: ["acme.com", "help.acme.com"] },
      { kind: "whatsapp", direction: "in", sender: "+1 (628) 555-0220" },
    ],
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "active",
    metrics: { calls: 2840, successRate: 81, avgHandleTimeSec: 248 },
    ringsPerWeek: 1980,
  },

  // ── Outbound ───────────────────────────────────────────────────────────────
  {
    id: "cp_ob_01",
    name: "Q2 Win-Back",
    type: "outbound",
    channels: [
      { kind: "telephony", direction: "out", numbers: ["+1 (415) 555-0240"] },
    ],
    agentId: "agt_sales_qualifier",
    agentName: "Sales Qualifier",
    status: "in_progress",
    metrics: { calls: 3421, successRate: 24, avgHandleTimeSec: 162 },
    progress: { completed: 3421, total: 5000 },
    startDate: "May 20, 2026",
  },
  {
    id: "cp_ob_02",
    name: "Product Launch",
    type: "outbound",
    channels: [
      { kind: "telephony", direction: "out", numbers: ["+1 (415) 555-0240"] },
    ],
    agentId: "agt_support_v2",
    agentName: "Support Bot v2",
    status: "scheduled",
    metrics: { calls: 0, successRate: 0, avgHandleTimeSec: 0 },
    progress: { completed: 0, total: 12000 },
    startDate: "Jun 1, 2026",
  },
  {
    id: "cp_ob_03",
    name: "Renewal Reminder",
    type: "outbound",
    channels: [
      { kind: "telephony", direction: "out", numbers: ["+1 (415) 555-0240"] },
    ],
    agentId: "agt_appointment_setter",
    agentName: "Appointment Setter",
    status: "completed",
    metrics: { calls: 2800, successRate: 31, avgHandleTimeSec: 145 },
    progress: { completed: 2800, total: 2800 },
    startDate: "May 10, 2026",
  },
  {
    id: "cp_ob_04",
    name: "Collections May",
    type: "outbound",
    channels: [
      { kind: "telephony", direction: "out", numbers: ["+1 (415) 555-0240"] },
    ],
    agentId: "agt_collections",
    agentName: "Collections Outreach",
    status: "paused",
    metrics: { calls: 742, successRate: 18, avgHandleTimeSec: 198 },
    progress: { completed: 742, total: 1500 },
    startDate: "May 15, 2026",
  },
  {
    id: "cp_ob_05",
    name: "NPS Survey",
    type: "outbound",
    channels: [
      { kind: "telephony", direction: "out", numbers: ["+1 (415) 555-0240"] },
    ],
    agentId: null,
    agentName: null,
    status: "draft",
    metrics: { calls: 0, successRate: 0, avgHandleTimeSec: 0 },
    progress: { completed: 0, total: 8000 },
    startDate: "—",
  },
  // ── Omnichannel demo (outbound) — phone + SMS + WhatsApp ──────────────────
  {
    id: "cp_ob_06",
    name: "Black Friday Promo",
    type: "outbound",
    channels: [
      { kind: "telephony", direction: "out", numbers: ["+1 (415) 555-0240"] },
      { kind: "sms", direction: "out", number: "+1 (628) 555-0260" },
      { kind: "whatsapp", direction: "out", sender: "+1 (628) 555-0220" },
    ],
    agentId: "agt_sales_qualifier",
    agentName: "Sales Qualifier",
    status: "scheduled",
    metrics: { calls: 0, successRate: 0, avgHandleTimeSec: 0 },
    progress: { completed: 0, total: 24000 },
    startDate: "Nov 24, 2026",
  },
]

// ─── Mock phone-number inventory ─────────────────────────────────────────────

export const PHONE_NUMBERS: PhoneNumber[] = [
  {
    id: "pn_01",
    number: "+1 (415) 555-0101",
    label: "Support Line",
    vendor: "Twilio",
    assignedTo: ["cp_ib_01"],
    status: "active",
  },
  {
    id: "pn_02",
    number: "+1 (628) 555-0188",
    label: "Sales Inbound",
    vendor: "Twilio",
    assignedTo: ["cp_ib_02"],
    status: "active",
  },
  {
    id: "pn_03",
    number: "+44 20 7946 0958",
    label: "UK Support",
    vendor: "Vonage",
    assignedTo: ["cp_ib_03"],
    status: "active",
  },
  {
    id: "pn_04",
    number: "+1 (800) 555-0199",
    label: "Toll-Free",
    vendor: "Bandwidth",
    assignedTo: ["cp_ib_04"],
    status: "active",
  },
  {
    id: "pn_05",
    number: "+1 (415) 555-0240",
    label: "Outbound Pool",
    vendor: "Twilio",
    assignedTo: ["cp_ob_01", "cp_ob_02", "cp_ob_03", "cp_ob_04", "cp_ob_06"],
    status: "active",
  },
  {
    id: "pn_06",
    number: "+1 (628) 555-0260",
    label: "SMS Sender",
    vendor: "Twilio",
    assignedTo: ["cp_ob_06"],
    status: "active",
  },
  {
    id: "pn_07",
    number: "+1 (628) 555-0220",
    label: "WhatsApp",
    vendor: "Meta",
    assignedTo: ["cp_ib_04", "cp_ob_06"],
    status: "active",
  },
  {
    id: "pn_08",
    number: "+1 (415) 555-0300",
    label: "Reserved",
    vendor: "Twilio",
    assignedTo: [],
    status: "unassigned",
  },
  {
    id: "pn_09",
    number: "+1 (628) 555-0111",
    label: "Sales Direct Line",
    vendor: "Twilio",
    assignedTo: [],
    assignedAgent: { id: "agt_sales_qualifier", name: "Sales Qualifier" },
    status: "active",
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCampaign(id: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id)
}

export function listCampaigns(filter?: {
  type?: CampaignType
  channel?: ChannelKind
  status?: CampaignStatus
}): Campaign[] {
  return CAMPAIGNS.filter((c) => {
    if (filter?.type && c.type !== filter.type) return false
    if (filter?.channel && !c.channels.some((ch) => ch.kind === filter.channel)) return false
    if (filter?.status && c.status !== filter.status) return false
    return true
  })
}

export function getChannelKinds(campaign: Campaign): ChannelKind[] {
  return campaign.channels.map((c) => c.kind)
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, "0")}s`
}

export const CHANNEL_LABEL: Record<ChannelKind, string> = {
  telephony: "Telephony",
  whatsapp: "WhatsApp",
  sms: "SMS",
  web: "Web widget",
}

// ─── Mock agents (shared with wizard agent picker) ───────────────────────────

export interface AgentRef {
  id: string
  name: string
  status: "live" | "draft" | "paused"
}

export const AGENTS: AgentRef[] = [
  { id: "agt_support_v2", name: "Support Bot v2", status: "live" },
  { id: "agt_sales_qualifier", name: "Sales Qualifier", status: "draft" },
  { id: "agt_appointment_setter", name: "Appointment Setter", status: "live" },
  { id: "agt_collections", name: "Collections Outreach", status: "paused" },
  { id: "agt_survey", name: "Survey Bot", status: "live" },
]
