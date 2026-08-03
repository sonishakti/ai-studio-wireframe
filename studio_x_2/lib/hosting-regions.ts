/**
 * Agent hosting region — where the Conversational AI agent process is placed.
 *
 * This is a REAL Agora primitive, not a wireframe invention: the Conversational
 * AI Engine accepts `properties.geofence.area` on agent start, with an optional
 * `properties.geofence.exclude_area` that is ONLY valid when `area` is GLOBAL.
 * Unset = the engine picks the nearest server from the LLM URL's IP and fails
 * over automatically — which is why "Automatic" is the default here rather than
 * a pinned region.
 *
 * Docs: https://docs.agora.io/en/conversational-ai/best-practices/regional-restrictions
 *
 * Note the doc's own caveat, mirrored in the UI: pinning the ENGINE does not pin
 * your LLM/TTS/ASR vendors. Those have their own regional endpoints (e.g.
 * ElevenLabs' EU URL) and are configured with the vendor credential, not here.
 */

/** The `area` values the Conversational AI geofence accepts. */
export type HostingArea = "GLOBAL" | "NORTH_AMERICA" | "EUROPE" | "ASIA" | "INDIA" | "JAPAN"

/** "Automatic" is the ABSENCE of a geofence, not a seventh area — the sentinel
 *  keeps the Select single-valued without lying about the API surface. */
export const HOSTING_AUTO = "AUTO" as const
export type HostingSelection = HostingArea | typeof HOSTING_AUTO

export interface HostingConfig {
  area: HostingSelection
  /** Blocklist — the API allows this ONLY when `area` is GLOBAL. */
  excludeArea?: HostingArea
}

export const DEFAULT_HOSTING: HostingConfig = { area: HOSTING_AUTO }

export interface HostingOption {
  value: HostingSelection
  label: string
  /** One line under the label in the Select — what picking it actually does. */
  desc: string
  /** Added round-trip for callers OUTSIDE the pinned region (wireframe
   *  estimate, same altitude as every other latency number in the app).
   *  0 = no pin, so no penalty. */
  outOfRegionMs: number
  /** What this choice means for where conversation data is processed. */
  residency: string
}

export const HOSTING_OPTIONS: HostingOption[] = [
  {
    value: HOSTING_AUTO,
    label: "Automatic (nearest region)",
    desc: "Agora places the agent closest to your LLM endpoint and fails over if a region goes down.",
    outOfRegionMs: 0,
    residency: "No residency guarantee — the agent may run in any Agora region.",
  },
  {
    value: "GLOBAL",
    label: "Global",
    desc: "Every Agora region is allowed. Add an exclusion below to carve one out.",
    outOfRegionMs: 0,
    residency: "No residency guarantee, but you can block a specific region.",
  },
  {
    value: "NORTH_AMERICA",
    label: "North America",
    desc: "The agent only ever runs on Agora's North American servers.",
    outOfRegionMs: 120,
    residency: "Conversation media and agent state stay on North American servers.",
  },
  {
    value: "EUROPE",
    label: "Europe",
    desc: "The agent only ever runs on Agora's European servers.",
    outOfRegionMs: 110,
    residency: "Conversation media and agent state stay on European servers — the usual GDPR ask.",
  },
  {
    value: "ASIA",
    label: "Asia",
    desc: "The agent only ever runs on Agora's Asian servers.",
    outOfRegionMs: 140,
    residency: "Conversation media and agent state stay on Asian servers.",
  },
  {
    value: "INDIA",
    label: "India",
    desc: "The agent only ever runs on Agora's Indian servers.",
    outOfRegionMs: 150,
    residency: "Conversation media and agent state stay on Indian servers.",
  },
  {
    value: "JAPAN",
    label: "Japan",
    desc: "The agent only ever runs on Agora's Japanese servers.",
    outOfRegionMs: 130,
    residency: "Conversation media and agent state stay on Japanese servers.",
  },
]

/** The areas that may appear in `exclude_area` — GLOBAL is not one of them. */
export const EXCLUDABLE_AREAS: HostingArea[] = [
  "NORTH_AMERICA", "EUROPE", "ASIA", "INDIA", "JAPAN",
]

export const hostingOption = (v: HostingSelection): HostingOption =>
  HOSTING_OPTIONS.find((o) => o.value === v) ?? HOSTING_OPTIONS[0]

/** Short label for a bare area code — used by review rows and recaps. */
export function areaLabel(a: HostingSelection): string {
  return hostingOption(a).label
}

/** One-line summary for the review card, pre-flight, and the folded recap.
 *  Kept in ONE place so those three can never disagree. */
export function hostingSummary(h: HostingConfig | undefined): string {
  const cfg = h ?? DEFAULT_HOSTING
  if (cfg.area === HOSTING_AUTO) return "Automatic — nearest region"
  if (cfg.area === "GLOBAL") {
    return cfg.excludeArea ? `Global · never ${areaLabel(cfg.excludeArea)}` : "Global — every region allowed"
  }
  return `${areaLabel(cfg.area)} only`
}

/** True when the agent is pinned to one region — the case that trades latency
 *  for residency and therefore deserves a consequence line in the UI. */
export function isPinned(h: HostingConfig | undefined): boolean {
  const a = (h ?? DEFAULT_HOSTING).area
  return a !== HOSTING_AUTO && a !== "GLOBAL"
}

/** Region restrictions can only EXCLUDE under GLOBAL — normalize any config
 *  that would send an invalid pair to the API. */
export function normalizeHosting(h: HostingConfig): HostingConfig {
  if (h.area !== "GLOBAL" && h.excludeArea) return { area: h.area }
  return h
}

export const HOSTING_DOCS_URL =
  "https://docs.agora.io/en/conversational-ai/best-practices/regional-restrictions"
