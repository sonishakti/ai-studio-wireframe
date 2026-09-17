/**
 * Number store — the US catalog the buy branch searches, plus the ledger of
 * the numbers acquired THIS session (16 · phone number purchase, 2026-09-17).
 *
 * Two slices, one row shape: a ledger row IS a `PhoneNumber` row, so the
 * inventory page, the builder's number field and the sheet all read the shape
 * the product already renders instead of a parallel "owned number" type.
 *
 * Storage is `sessionStorage`, per-tab, the `agent-store.ts:5` idiom verbatim
 * (mock data only): a number acquired in one review does not leak into the
 * next. Every write emits `sx:numbers-store` so mounted surfaces re-read. The
 * only clock read is `Date.now()` for id minting, the allowance
 * `agent-resources.ts:16` documents.
 *
 * No price on any row, and no price field to put one in: Agora documents no
 * telephony charge, so a rate here would be invented. What a number costs is
 * an open question for the owner, and the buy branch carries a Requires Engine
 * caption where the amount would be.
 *
 * Both imports are type-only, so this module pulls nothing from the app at
 * runtime.
 */

import type { PhoneNumber } from "@/lib/campaign-data"
import type { NumberCapability } from "@/components/number-pick-row"

// ─── The catalog ──────────────────────────────────────────────────────────────

export type NumberType = "local" | "toll-free"

/** A number the search offers. `taken` is the row that loses the race between
 *  the search and the commit — one row carries it so that state is reachable. */
export interface CatalogNumber {
  e164: string
  areaCode: string
  /** Where the digits ring. Toll-free numbers have no city, and say so. */
  city: string
  type: NumberType
  capability: NumberCapability
  taken?: boolean
}

/** The search never returns more than a screenful: a list you scroll is a list
 *  you compare, and there is nothing on these rows to compare on. */
const MAX_RESULTS = 5

export const US_CATALOG: CatalogNumber[] = [
  // 415 · San Francisco
  { e164: "+1 (415) 555-0142", areaCode: "415", city: "San Francisco", type: "local", capability: "inbound+outbound" },
  { e164: "+1 (415) 555-0203", areaCode: "415", city: "San Francisco", type: "local", capability: "inbound+outbound" },
  { e164: "+1 (415) 555-0271", areaCode: "415", city: "San Francisco", type: "local", capability: "inbound+outbound", taken: true },
  { e164: "+1 (415) 555-0318", areaCode: "415", city: "San Francisco", type: "local", capability: "inbound-only" },
  { e164: "+1 (415) 555-0356", areaCode: "415", city: "San Francisco", type: "local", capability: "inbound+outbound" },
  // 628 · San Francisco overlay
  { e164: "+1 (628) 555-0117", areaCode: "628", city: "San Francisco", type: "local", capability: "inbound+outbound" },
  { e164: "+1 (628) 555-0164", areaCode: "628", city: "San Francisco", type: "local", capability: "inbound+outbound" },
  { e164: "+1 (628) 555-0209", areaCode: "628", city: "San Francisco", type: "local", capability: "inbound-only" },
  { e164: "+1 (628) 555-0243", areaCode: "628", city: "San Francisco", type: "local", capability: "inbound+outbound" },
  { e164: "+1 (628) 555-0288", areaCode: "628", city: "San Francisco", type: "local", capability: "inbound+outbound" },
  // 212 · New York
  { e164: "+1 (212) 555-0132", areaCode: "212", city: "New York", type: "local", capability: "inbound+outbound" },
  { e164: "+1 (212) 555-0175", areaCode: "212", city: "New York", type: "local", capability: "inbound+outbound" },
  { e164: "+1 (212) 555-0226", areaCode: "212", city: "New York", type: "local", capability: "inbound+outbound" },
  { e164: "+1 (212) 555-0291", areaCode: "212", city: "New York", type: "local", capability: "inbound-only" },
  // 800 · toll-free
  { e164: "+1 (800) 555-0125", areaCode: "800", city: "Toll-free", type: "toll-free", capability: "inbound+outbound" },
  { e164: "+1 (800) 555-0168", areaCode: "800", city: "Toll-free", type: "toll-free", capability: "inbound-only" },
  { e164: "+1 (800) 555-0214", areaCode: "800", city: "Toll-free", type: "toll-free", capability: "inbound+outbound" },
  { e164: "+1 (800) 555-0277", areaCode: "800", city: "Toll-free", type: "toll-free", capability: "inbound-only" },
]

export type SearchResult =
  | { ok: true; rows: CatalogNumber[] }
  | { ok: false; code: "no_results" }

/**
 * Search the catalog. A blank area code means "anywhere in the US", which the
 * field's hint promises, so it matches every row of the chosen type and can
 * never come back empty: `no_results` always names an area code the caller
 * typed, which is the area code the no-results line prints.
 */
export function searchNumbers(areaCode: string, type: NumberType): SearchResult {
  const term = areaCode.replace(/\D/g, "")
  const rows = US_CATALOG
    .filter((n) => n.type === type && (term === "" || n.areaCode === term))
    .slice(0, MAX_RESULTS)
  return rows.length > 0 ? { ok: true, rows } : { ok: false, code: "no_results" }
}

// ─── The session ledger ───────────────────────────────────────────────────────

const LEDGER_KEY = "sx:session_numbers"
const EVENT = "sx:numbers-store"

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

/** Numbers acquired this session, newest first. Merged ABOVE `PHONE_NUMBERS`
 *  by every surface that lists numbers. */
export function readSessionNumbers(): PhoneNumber[] {
  return read<PhoneNumber[]>(LEDGER_KEY, [])
}

/**
 * Write a just-acquired number into the ledger and hand back its row.
 *
 * A number from Agora lands as `turning-up`: owned, and not yet able to take a
 * call. That is the state the row carries for anyone who closes the sheet
 * mid-wait. A number the user CONNECTED this session comes through the same
 * door with `origin: "byo"`, its own carrier's name and `unassigned`, so one
 * ledger holds every number this session produced and the builder's number
 * field, the inventory and the sheet all read the same list. Two arrays for one
 * thing is the defect this replaces.
 *
 * `capability` is what the caller picked, and it is deliberately NOT written:
 * `PhoneNumber` has no capability field, nothing in this build draws one on an
 * inventory row, and inventing a field beside the shape the product renders is
 * the fork this store exists to avoid. It stays in the signature because the
 * caller knows the value and the row is where it belongs the day the model
 * carries it.
 */
export function addSessionNumber(n: {
  e164: string
  label: string
  capability?: NumberCapability
  /** Default: a number Agora sold. */
  origin?: PhoneNumber["origin"]
  /** The carrier's own name, for a number the user brought. The From cell
   *  reads `origin` for an Agora row, so naming a third-party carrier on one
   *  would be the fabrication. */
  vendor?: string
  /** Default: `turning-up`, the state between the commit and the first ring. */
  status?: PhoneNumber["status"]
}): PhoneNumber {
  const row: PhoneNumber = {
    id: `pn_s_${Date.now().toString(36)}`,
    number: n.e164,
    label: n.label,
    vendor: n.vendor ?? "Agora",
    assignedTo: [],
    origin: n.origin ?? "agora",
    status: n.status ?? "turning-up",
  }
  // Same digits twice is one row, not two.
  write(LEDGER_KEY, [row, ...readSessionNumbers().filter((r) => r.number !== row.number)])
  return row
}

/** The line is up: the number can now be assigned, so it joins the pool the
 *  builder's number field offers. A number that is no longer in the ledger is
 *  a no-op, not a throw. */
export function markTurnedUp(id: string): void {
  const rows = readSessionNumbers()
  if (!rows.some((r) => r.id === id)) return
  write(LEDGER_KEY, rows.map((r) => (r.id === id ? { ...r, status: "unassigned" as const } : r)))
}

/** Released: the digits go back. Only a session row can be removed this way —
 *  the seed inventory is not the ledger's to edit. */
export function removeSessionNumber(id: string): void {
  const rows = readSessionNumbers()
  const kept = rows.filter((r) => r.id !== id)
  if (kept.length === rows.length) return
  write(LEDGER_KEY, kept)
}

/** Re-read on every store write. Returns the unsubscribe. */
export function subscribeNumberStore(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}
