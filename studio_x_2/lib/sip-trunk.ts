/**
 * SIP trunk — the object the A3 card named in July ("Deployment/channel gains
 * `sipTrunk: { provider, status, credentialRef }`", roadmap PRD :190) and
 * nobody built, so all eight of 17's tasks had nowhere to put their value.
 *
 * Verdict (references/research/17-sip-trunk-setup/05-directions.html): B, with
 * C's vocabulary. A trunk is a set of rows on the NUMBER that carries it, not a
 * record of its own — `AddPhoneNumbersRequest` stores address, transport,
 * credential and allowlist per number and has no trunk id, so a trunks list
 * would be a grouping the API cannot hold and the first shared edit would be
 * four writes that can half-fail.
 *
 * What is deliberately NOT here, because the contract cannot produce it:
 *  • no `carrier` field. Carrier lives on `PhoneNumber` (one field per thing);
 *    `CarrierId` is declared there and re-exported here, which also keeps
 *    campaign-data.ts at zero imports and this module free of a cycle.
 *  • no `secretLast4`, no `secretRotatedAt`. phone-number-contracts.ts:84
 *    writes the password and never reads it, `existingPassword` is the only way
 *    to preserve one, and `TelephonyPhoneNumber` carries no credential
 *    timestamp. The credential shows a username and the word Set.
 *  • no `cps`. Nothing paces to it: batch pace is the seed at
 *    campaign-data.ts:1447, printed as target 3/s at batch-detail.tsx:168.
 *  • no signalling-IP list. The docs page lists the per-country ACL in
 *    accordions and reproduces not one address; a Copy button over addresses
 *    nobody has read is one invented octet away from a 403 on the first caller.
 *    The ACL ships as a line plus the guide link (components/trunk-handover).
 *
 * The near sibling is lib/sip-trace.ts, which is the READ path: ladder types,
 * no state, no storage. The shape this follows is lib/hosting-regions.ts plus
 * lib/backup-providers.ts — seeds and pure helpers — with the localStorage
 * layer guarded exactly like lib/agent-resources.ts:19-31.
 */

import { PHONE_NUMBERS } from "@/lib/campaign-data"
import type { CarrierId } from "@/lib/campaign-data"

/** Declared beside `PhoneNumber` and re-exported here so callers import one
 *  vocabulary from one module. */
export type { CarrierId } from "@/lib/campaign-data"

// ─── The trunk ───────────────────────────────────────────────────────────────

export interface SipTrunk {
  /** The `PhoneNumber` this trunk belongs to. One number, one trunk. */
  numberId: string
  /** Domain or IP the outbound INVITE is sent to. Ports are allowed. */
  address: string
  transport: "TCP" | "UDP" | "TLS"
  /** Digest username. Empty with a non-empty `allowedCidrs` is the other half
   *  of learning 3's either-or: credentials OR allowed addresses. */
  username: string
  /** Whether a password is stored. Never the password, never its last four:
   *  the contract writes it and never reads it back. */
  hasPassword: boolean
  /** CIDR blocks calls are accepted from — `inbound_config.allowed_addresses`.
   *  Empty = any address reaches the number. Signalling, not media. */
  allowedCidrs: string[]
  /** Which published Origination URI the customer pasted at their carrier.
   *  Requires Engine: no phone-number request carries a gateway field, so this
   *  is a record of their choice and never a routing control. */
  gateway: GatewayId | null
  /** Requires Engine: `CallTelephonyRequest.Sip` carries four fields and no
   *  header map, so nothing is on the wire yet. */
  headers: { name: string; value: string }[]
  /** Requires Engine: no REFER, conference or transfer-leg field exists. */
  transferMethod: "refer" | "conference" | null
  transferFallback: "return" | "hangup"
  /** How long ago the last call got through, in the seed's own phrase ("2h
   *  ago") — the house idiom at lib/notifications-data.ts:10. A stored phrase,
   *  never a clock read in render. Null = no call has ever connected. */
  lastConnectedAt: string | null
  /** The SIP code the carrier answered the last call with, when it failed.
   *  403 is the one feature 11's ladder links back here to fix. */
  lastFailureCode: number | null
  /** Which door set this trunk up. Null = never set up. */
  setupPath: "guided" | "manual" | null
}

// ─── Carriers ────────────────────────────────────────────────────────────────

/**
 * The carrier vocabulary, as data rather than as screens. Each carrier carries
 * its own noun for the thing you create in its console and its own steps, in
 * that console's words.
 *
 * `steps` is populated ONLY from console paths this research actually quoted:
 * Twilio's Termination and Origination SIP URIs (02-research/_docs.md:224-226)
 * and Telnyx's connection, outbound voice profile and credential (:56-58).
 * Exotel and Another carrier ship no steps and fall back to the guide link —
 * an invented console path is the same defect as an invented hostname.
 *
 * `contractProvider` is what the wire actually sends: the enum is `byo |
 * twilio`, so Telnyx, Exotel and a regional ITSP all send `byo` and the name
 * survives as a label (learning 2).
 */
export const CARRIERS: Record<
  CarrierId,
  {
    label: string
    /** The carrier's own word for what you create in its console. */
    noun: string
    contractProvider: "twilio" | "byo"
    steps: { where: string; what: string }[]
  }
> = {
  twilio: {
    label: "Twilio",
    noun: "Elastic SIP Trunk",
    contractProvider: "twilio",
    steps: [
      { where: "Termination SIP URI", what: "Name the SIP domain that identifies this trunk." },
      { where: "Origination SIP URI", what: "Paste the Origination URI as the entry point into your infrastructure." },
    ],
  },
  telnyx: {
    label: "Telnyx",
    noun: "SIP connection",
    contractProvider: "byo",
    steps: [
      { where: "SIP connections", what: "Create the SIP connection for this number." },
      { where: "Outbound voice profile", what: "Attach the connection to an outbound voice profile." },
      { where: "Credentials", what: "Create the credential, then paste it back here." },
    ],
  },
  exotel: {
    label: "Exotel",
    noun: "SIP trunk",
    contractProvider: "byo",
    steps: [],
  },
  other: {
    label: "Another carrier",
    noun: "Any ITSP or regional telco",
    contractProvider: "byo",
    steps: [],
  },
}

// ─── Gateways ────────────────────────────────────────────────────────────────

export type GatewayId = "us_west" | "sa_east" | "ap_south"

/**
 * The three Origination URIs Agora publishes, verbatim from
 * https://docs.agora.io/en/conversational-ai/studio/deploy/sip-trunk
 * (00-brief.md:106-108). There are exactly three gateway locations today, the
 * customer already picks one by pasting it at their carrier, and Agora stores
 * no record of which — which is the whole of 868kubh4r.
 */
export const GATEWAYS: Record<GatewayId, { label: string; host: string; tlsPort: 5061; plainPort: 5060 }> = {
  us_west: { label: "United States", host: "sbc-us-west-1.viblinx.com", tlsPort: 5061, plainPort: 5060 },
  sa_east: { label: "Americas, Europe, Oceania and Brazil", host: "sbc-sa-east-1.viblinx.com", tlsPort: 5061, plainPort: 5060 },
  ap_south: { label: "Asia Pacific, India and Africa", host: "sbc-ap-south.viblinx.com", tlsPort: 5061, plainPort: 5060 },
}

/** The address the customer pastes at their carrier. TLS answers on 5061,
 *  TCP and UDP on 5060 — the docs page publishes both forms and nothing else,
 *  so nothing else is built here. Returns "" for an unknown gateway rather
 *  than guessing a host. */
export function originationUri(g: GatewayId, t: SipTrunk["transport"]): string {
  const gw = GATEWAYS[g]
  if (!gw) return ""
  return `sip:${gw.host}:${t === "TLS" ? gw.tlsPort : gw.plainPort}`
}

/** The page that carries the three Origination URIs and the per-country ACL.
 *  The help page's Twilio link (help/page.tsx:46) 404s; this one resolves. */
export const SIP_TRUNK_GUIDE_URL = "https://docs.agora.io/en/conversational-ai/studio/deploy/sip-trunk"

// ─── Seeds ───────────────────────────────────────────────────────────────────

export const DEFAULT_TRUNK: SipTrunk = {
  numberId: "",
  address: "",
  transport: "TCP",
  username: "",
  hasPassword: false,
  allowedCidrs: [],
  gateway: null,
  headers: [],
  transferMethod: null,
  transferFallback: "return",
  lastConnectedAt: null,
  lastFailureCode: null,
  setupPath: null,
}

/**
 * What each seeded number's trunk holds. Hostnames are the only claim in this
 * file that could be wrong, so they are constrained: `*.pstn.twilio.com` is
 * Twilio's own termination shape and nobody else's, `sip.telnyx.com` is the
 * Telnyx realm the research captured, and a customer-run trunk takes a
 * customer-shaped host in the reserved example domain the sibling ladder
 * already uses (sip-trace.ts:230). Allowlists use the RFC 5737 documentation
 * ranges the ladder puts on its Via headers.
 */
const SEEDS: Record<string, Partial<SipTrunk>> = {
  // Connected, TLS, credential and allowlist both set.
  pn_01: {
    address: "acme-support.pstn.twilio.com",
    transport: "TLS",
    username: "acme_support",
    hasPassword: true,
    allowedCidrs: ["203.0.113.0/24"],
    gateway: "us_west",
    lastConnectedAt: "2h ago",
    setupPath: "guided",
  },
  pn_02: {
    address: "acme-sales.pstn.twilio.com",
    transport: "TLS",
    username: "acme_sales",
    hasPassword: true,
    allowedCidrs: ["203.0.113.0/24"],
    gateway: "us_west",
    lastConnectedAt: "1d ago",
    setupPath: "guided",
  },
  // The 403 the ladder links back to: feature 11's fix link opens this
  // number's Credential row, so it needs a trunk that is set up and rejected.
  pn_03: {
    address: "sip.telnyx.com",
    transport: "TLS",
    username: "acme_uk",
    hasPassword: true,
    allowedCidrs: [],
    gateway: "sa_east",
    lastFailureCode: 403,
    setupPath: "guided",
  },
  // Set up by hand, allowlist instead of a credential, never called.
  pn_04: {
    address: "sip-edge.acme.example.net",
    transport: "UDP",
    username: "",
    hasPassword: false,
    allowedCidrs: ["198.51.100.0/24"],
    gateway: "us_west",
    setupPath: "manual",
  },
  pn_05: {
    address: "acme-outbound.pstn.twilio.com",
    transport: "TLS",
    username: "acme_outbound",
    hasPassword: true,
    allowedCidrs: ["203.0.113.0/24", "198.51.100.0/24"],
    gateway: "us_west",
    lastConnectedAt: "9m ago",
    setupPath: "guided",
  },
  // pn_06, pn_07, pn_08 and pn_09 are seeded from DEFAULT_TRUNK alone: no
  // address, so they read Trunk not set up. pn_07 is the WhatsApp row, which
  // has no SIP trunk to carry.
}

/** One trunk per number in the inventory, so no row in the table can render a
 *  state its number does not have. */
export const TRUNKS: Record<string, SipTrunk> = Object.fromEntries(
  PHONE_NUMBERS.map((n) => [n.id, { ...DEFAULT_TRUNK, numberId: n.id, ...SEEDS[n.id] }]),
)

/** The trunk for a number. An id the inventory does not carry gets an empty
 *  trunk of its own rather than nothing, so every caller has rows to render. */
export function trunkOf(numberId: string): SipTrunk {
  return TRUNKS[numberId] ?? { ...DEFAULT_TRUNK, numberId }
}

// ─── State ───────────────────────────────────────────────────────────────────

/**
 * The four states a trunk can honestly be in. `status` on `PhoneNumber` is
 * about assignment ("active" means an agent is bound to it) and has no word
 * for connected but never called, or for credentials the carrier now rejects.
 */
export function trunkState(t: SipTrunk): "connected" | "never-called" | "rejected" | "not-set" {
  if (!t.address.trim()) return "not-set"
  if (t.lastFailureCode != null) return "rejected"
  if (!t.lastConnectedAt) return "never-called"
  return "connected"
}

/**
 * The words for each state. `connected` is completed by the trunk's own
 * `lastConnectedAt` ("Last call got through 2h ago"), so render
 * `TrunkStateChip` rather than this map when you have a trunk in hand.
 */
export const TRUNK_STATE_LABEL: Record<ReturnType<typeof trunkState>, string> = {
  connected: "Last call got through",
  "never-called": "Never called",
  rejected: "Carrier rejected the last call",
  "not-set": "Trunk not set up",
}

// ─── Links ───────────────────────────────────────────────────────────────────

/** The inventory id for a dialled number, matched on digits alone. An exact
 *  match or nothing: a suffix match would open the wrong number, and a fix
 *  link that lands on the list is better than one that lands on a stranger. */
export function numberIdForE164(e164: string): string | null {
  const digits = e164.replace(/\D/g, "")
  if (!digits) return null
  const hit = PHONE_NUMBERS.find((n) => n.number.replace(/\D/g, "") === digits)
  return hit ? hit.id : null
}

/** Where a trunk is read and fixed. With no number to open — an unresolvable
 *  caller id, a batch with no bound number — it degrades to the list, at the
 *  Trunk column, which is the nearest honest destination. */
export function trunkHref(numberId?: string | null, focus?: string): string {
  if (!numberId) return "/deploy/phone-numbers?focus=trunk-column"
  return `/deploy/phone-numbers/${numberId}${focus ? `?focus=${encodeURIComponent(focus)}` : ""}`
}

// ─── Validation ──────────────────────────────────────────────────────────────

/** An IPv4 CIDR block, the shape the SDK's own example uses
 *  (`112.126.15.64/27`). Anything else is false, never a throw. */
export function isCidr(v: string): boolean {
  const m = v.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/)
  if (!m) return false
  if ([m[1], m[2], m[3], m[4]].some((o) => Number(o) > 255)) return false
  return Number(m[5]) <= 32
}

// ─── Design-mode storage ─────────────────────────────────────────────────────
//
// Same `sx:` guards as every other wireframe store (lib/agent-resources.ts:19).
// Call these from effects only: reading at module scope would touch
// localStorage during the server render.

const TRUNKS_KEY = "sx:sip_trunks"

/** Trunks the user has edited in this browser, by number id. Empty whenever
 *  storage is unavailable, which is the same as "nothing edited yet". */
export function readTrunks(): Record<string, SipTrunk> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(TRUNKS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, SipTrunk>) : {}
  } catch {
    return {}
  }
}

/** Persist one trunk. A trunk with no number has nowhere to be stored. */
export function writeTrunk(t: SipTrunk): void {
  if (typeof window === "undefined" || !t.numberId) return
  try {
    const all = readTrunks()
    all[t.numberId] = t
    window.localStorage.setItem(TRUNKS_KEY, JSON.stringify(all))
  } catch { /* wireframe only */ }
}
