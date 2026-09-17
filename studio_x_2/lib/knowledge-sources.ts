/**
 * Knowledge sources — what is INSIDE a knowledge base, how old it is, and what
 * a crawl is allowed to report (design 20, direction B: "a knowledge base is a
 * container, files and sites are sources inside it"). That single decision is
 * what lets a crawl, a schedule, a freshness stamp and a page ledger exist at
 * all, because each of them is a property of a SOURCE and none of them is a
 * property of a base.
 *
 * `lib/agent-resources.ts` owns the catalog of things an agent can ATTACH, for
 * two families; this owns what sits inside one of them, with its own clock and
 * its own failure taxonomy. One `sx:` key, `sx:kb_sources`, holds both the
 * sources the user makes and per-source overlays applied over the seeds by id
 * — the same way `sx:connected_connectors` overlays the seed connectors
 * through `effectiveConnectorStatus` (agent-resources.ts:229-249). Nothing
 * calls a backend (wireframe): every crawl and every refresh below is a mock,
 * and every surface that draws one carries "Requires Engine · planned".
 *
 * The honesty floor decides what a source may print. The Studio KB record
 * carries no url, no kind, no last-synced and no chunk count per document
 * (ng-console/src/server/console-backend/studio-knowledge-bases.ts:121-135),
 * so a seeded base derives ONE source from what its own record already says on
 * screen — its `source` word, its `size`, its `status` — and nothing more. A
 * read date and a page count exist only on a source this browser crawled.
 */

import { KNOWLEDGE_BASES, AGENTS, type KnowledgeBase } from "@/lib/campaign-data"

// ─── ids & storage ────────────────────────────────────────────────────────────

const SOURCES_KEY = "sx:kb_sources"

/** The catalog key `lib/agent-resources.ts` writes. Read here directly rather
 *  than through `listUserKnowledgeBases()`: that module imports `addSource`
 *  from this one, and importing it back would make the pair circular. */
const KB_KEY = "sx:knowledge_bases"

/** Runtime-only (browser) id minting — `Date.now()` is fine here; the counter
 *  keeps two sources added in the same millisecond apart (crawl, then file). */
let seq = 0
const mintId = () => `src_c_${Date.now().toString(36)}${(seq++).toString(36)}`

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}
function writeList<T>(key: string, list: T[]) {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(key, JSON.stringify(list)) } catch { /* wireframe only */ }
}

// ─── The source record ────────────────────────────────────────────────────────

export type SourceKind = "file" | "site"

/** `active` / `processing` are the prototype's own two words (campaign-data.ts:
 *  1729, drawn at step-build.tsx:376-388). `empty` and `failed` are the two
 *  states a crawl actually produces that the vocabulary had no word for
 *  (Before defect 6); `failed` is already a Console label (common.ts:2498). */
export type SourceState = "active" | "processing" | "empty" | "failed"

export interface KnowledgeSource {
  id: string
  kbId: string
  kind: SourceKind
  /** A file's name, or a site's host. */
  label: string
  /** Sites only — the address that was crawled. */
  address?: string
  /** Files only — the record's own size string. There is no chunk count here:
   *  a document in the contract carries file_size and never a chunk count. */
  size?: string
  /** Sites only — pages kept by the last crawl or refresh. */
  pages?: number
  state: SourceState
  addedAt?: number
  /** Sites only — when this browser last read the site. Absent until it has. */
  lastReadAt?: number
  autoRefresh?: boolean
}

export const SOURCE_STATE_LABEL: Record<SourceState, string> = {
  active: "Active",
  processing: "Processing",
  empty: "Empty",
  failed: "Failed",
}

/** Why one page did not make it in. Intercom is the only vendor in the set
 *  that reports this per page, and it is the whole answer to "3,100 of 4,000
 *  pages, and nothing says which 900". */
export type SkipReason = "robots" | "no-text" | "unsupported"

export const SKIP_REASON_LABEL: Record<SkipReason, string> = {
  robots: "Blocked by robots.txt",
  "no-text": "No readable text",
  unsupported: "Not a supported file",
}

export interface CrawlLedger {
  found: number
  kept: number
  failed: number
  ms: number
  /** Set when the crawl stopped at `CRAWL_PAGE_CAP` rather than at the last page. */
  cappedAt?: number
  skipped: { path: string; reason: SkipReason }[]
}

export interface RefreshResult {
  pages: number
  changed: number
  errors: number
}

/** A crawl stops here. Wireframe value, same treatment as `EGRESS_IP`
 *  (agent-resources.ts:107): every surface that shows it carries the Engine
 *  mark, so it reads as stated intent rather than a shipped limit. */
export const CRAWL_PAGE_CAP = 500

/** Who is knocking. ElevenLabs publishes its crawler's user agent and says it
 *  honours robots.txt; a crawler that will not name itself is the silent
 *  failure learning 5 describes. Wireframe value, under the Engine mark. */
export const CRAWLER_UA = "AgoraStudioBot/1.0"

// ─── Per-agent retrieval ──────────────────────────────────────────────────────

export interface RetrievalSettings {
  topK: number
  threshold: number
}

export const DEFAULT_RETRIEVAL: RetrievalSettings = { topK: 3, threshold: 0.6 }

/** Mirrors `openingOf` (wizard-draft.ts:399-401). Takes the structural shape
 *  rather than `AgentDraft` so this module stays importable from the draft
 *  module without a cycle. A draft that has never touched a dial reads the
 *  defaults, which is what the row draws. */
export function retrievalOf(d: { retrieval?: RetrievalSettings }): RetrievalSettings {
  return { ...DEFAULT_RETRIEVAL, ...(d.retrieval ?? {}) }
}

// ─── Seeds ────────────────────────────────────────────────────────────────────

/** One source per seeded base, derived from that base's OWN record and nothing
 *  else: `source` ("Upload" / "URL Crawl") is the only name the record has for
 *  what is inside it and the Resources card already prints it; `size` and
 *  `status` are its own. No address, no read date, no page count — the record
 *  carries none, so the sheet shows none. */
const SEED_SOURCES: KnowledgeSource[] = KNOWLEDGE_BASES.map((kb) => {
  const kind: SourceKind = /crawl|url|http/i.test(kb.source) ? "site" : "file"
  return {
    id: `src_${kb.id}`,
    kbId: kb.id,
    kind,
    label: kb.source,
    ...(kind === "file" && kb.size ? { size: kb.size } : {}),
    state: kb.status === "ready" ? ("active" as const) : ("processing" as const),
  }
})

const SEED_IDS = new Set(SEED_SOURCES.map((s) => s.id))

/** What the store holds: a complete user-made source, or a partial overlay
 *  over a seed keyed by its id. `removed` tombstones a seed the user deleted,
 *  since a module constant cannot be filtered away. */
type StoredSource = Partial<KnowledgeSource> & { id: string; kbId: string; removed?: boolean }

function stored(): StoredSource[] {
  return readList<StoredSource>(SOURCES_KEY)
}

/** A stored row read back as a whole record — a partial write, a hand-edited
 *  key or an older shape all still produce a source rather than a crash. */
function materialize(s: StoredSource): KnowledgeSource {
  const kind: SourceKind = s.kind === "site" ? "site" : "file"
  return {
    ...s,
    id: s.id,
    kbId: s.kbId,
    kind,
    label: s.label?.trim() || (s.address ? hostOf(s.address) : "Source"),
    state: s.state ?? "active",
  }
}

function allSources(): KnowledgeSource[] {
  const overlays = stored()
  const byId = new Map(overlays.map((s) => [s.id, s]))
  const seeds = SEED_SOURCES.filter((s) => !byId.get(s.id)?.removed).map((s) => {
    const o = byId.get(s.id)
    return o ? materialize({ ...s, ...o }) : s
  })
  const made = overlays.filter((s) => !SEED_IDS.has(s.id) && !s.removed).map(materialize)
  return [...seeds, ...made]
}

/** The base's own sources: seeds with their overlays applied, then the ones
 *  the user made here — mirroring `allKnowledgeBases` (agent-resources.ts:
 *  146-148). An unknown base is an empty list, never a throw. */
export function listSources(kbId: string): KnowledgeSource[] {
  if (!kbId) return []
  return allSources().filter((s) => s.kbId === kbId)
}

export function addSource(input: Omit<KnowledgeSource, "id">): KnowledgeSource {
  const source: KnowledgeSource = {
    ...input,
    id: mintId(),
    label: input.label?.trim() || (input.address ? hostOf(input.address) : "Source"),
  }
  writeList<StoredSource>(SOURCES_KEY, [...stored(), source])
  return source
}

/** Patches a user-made source in place, or writes an overlay over a seed. */
export function patchSource(id: string, patch: Partial<KnowledgeSource>) {
  const list = stored()
  const at = list.findIndex((s) => s.id === id)
  if (at >= 0) {
    list[at] = { ...list[at], ...patch }
    writeList(SOURCES_KEY, list)
    return
  }
  const seed = SEED_SOURCES.find((s) => s.id === id)
  if (!seed) return
  writeList<StoredSource>(SOURCES_KEY, [...list, { ...patch, id, kbId: seed.kbId }])
}

export function removeSource(id: string) {
  const list = stored()
  if (SEED_IDS.has(id)) {
    const seed = SEED_SOURCES.find((s) => s.id === id)!
    const rest = list.filter((s) => s.id !== id)
    writeList<StoredSource>(SOURCES_KEY, [...rest, { id, kbId: seed.kbId, removed: true }])
    return
  }
  writeList(SOURCES_KEY, list.filter((s) => s.id !== id))
}

export function setAutoRefresh(id: string, on: boolean) {
  patchSource(id, { autoRefresh: on })
}

// ─── Deterministic PRNG (the FNV-1a idiom at lib/diagnostics.ts:96) ───────────

function seeded(id: string): () => number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) }
  let s = h >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── The crawl, and the ledger it owes ───────────────────────────────────────

/** Paths a crawl reports back rather than swallowing. A ledger with a reason
 *  per page is the Intercom move three of four voice vendors do not make. */
const SKIPPED_PAGES: { path: string; reason: SkipReason }[] = [
  { path: "/careers", reason: "robots" },
  { path: "/blog/2019", reason: "no-text" },
  { path: "/media/kit.zip", reason: "unsupported" },
  { path: "/legal/archive", reason: "robots" },
]

/** The host, lowercased and without `www.` — a site source names itself by the
 *  host it reads, which is derived from the address and never invented. */
function hostOf(address: string): string {
  const a = address.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/\/+$/, "")
  return a.split(/[/?#]/)[0].replace(/^www\./, "")
}

/** Mock crawl. Seeded on the host, so the same address always reports the same
 *  ledger and a re-render never reshuffles it. An empty address and a site
 *  that renders in the browser both report zero pages found rather than a
 *  healthy-looking number (learning 5 · Before defect 8). */
export function mockCrawl(address: string): CrawlLedger {
  const host = hostOf(address)
  if (!host) return { found: 0, kept: 0, failed: 0, ms: 0, skipped: [] }

  // An app shell or a status page has nothing a crawler can read: the empty
  // state is reachable by typing an address, not by breaking something.
  if (address.toLowerCase().includes("app.") || address.toLowerCase().includes("status.")) {
    return { found: 0, kept: 0, failed: 0, ms: 3200, skipped: [] }
  }

  const rnd = seeded(host)
  const raw = 40 + Math.floor(rnd() * 640)
  const capped = raw >= CRAWL_PAGE_CAP
  const found = capped ? CRAWL_PAGE_CAP : raw
  const skipped = SKIPPED_PAGES.slice(0, Math.floor(rnd() * (SKIPPED_PAGES.length + 1)))
  const failed = rnd() < 0.3 ? 1 + Math.floor(rnd() * 3) : 0
  return {
    found,
    kept: Math.max(0, found - skipped.length - failed),
    failed,
    ms: 2000 + found * 470,
    ...(capped ? { cappedAt: CRAWL_PAGE_CAP } : {}),
    skipped,
  }
}

/** Mock refresh of one crawled source. A file cannot be re-read and a source
 *  that was never read has nothing to compare, so both report zeros rather
 *  than a number. Pages that error keep the text they had, which is why
 *  `pages` does not drop when `errors` is non-zero. */
export function refreshSource(id: string): RefreshResult {
  const source = allSources().find((s) => s.id === id)
  if (!source || source.kind !== "site") return { pages: 0, changed: 0, errors: 0 }

  const pages = source.pages ?? 0
  const rnd = seeded(`${id}:${source.lastReadAt ?? 0}`)
  const changed = pages === 0 ? 0 : Math.floor(rnd() * Math.min(12, pages))
  const errors = pages === 0 || rnd() > 0.35 ? 0 : 1 + Math.floor(rnd() * Math.min(6, pages))
  patchSource(id, {
    lastReadAt: Date.now(),
    pages,
    state: pages === 0 ? "empty" : errors >= pages ? "failed" : "active",
  })
  return { pages, changed, errors }
}

// ─── The clock ────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000

function agoLabel(at: number): string {
  const days = Math.max(0, Math.floor((Date.now() - at) / DAY_MS))
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  return `${days} days ago`
}

/** The date a weekly refresh next falls on, seven days after the last read.
 *  No weekday is hardcoded: the sentence is computed or it is not shown. */
export function nextRunLabel(from?: number): string {
  const anchor = Number.isFinite(from) ? (from as number) : Date.now()
  const d = new Date(anchor + 7 * DAY_MS)
  return `Next run: ${d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`
}

/** The one line under a source's name. A file reads its name and its size; a
 *  site reads when it was last read and how many pages it kept, and says so
 *  plainly when it has never been read. */
export function sourceLine(s: KnowledgeSource): string {
  if (s.kind === "file") return s.size ? `${s.label} · ${s.size}` : s.label
  if (!s.lastReadAt) return "Not read yet"
  const read = `Read ${agoLabel(s.lastReadAt)}`
  if (s.pages === undefined) return read
  return `${read} · ${s.pages} ${s.pages === 1 ? "page" : "pages"}`
}

/** The roster's meta for a base: its single source's line, or the first source
 *  and a count. `undefined` when the base has no source rows at all, so the
 *  caller falls back to the record's own numbers rather than printing a
 *  freshness nothing can compute. */
export function baseSourceLine(kbId: string): string | undefined {
  const list = listSources(kbId)
  if (list.length === 0) return undefined
  if (list.length === 1) return sourceLine(list[0])
  return `${list[0].label} · +${list.length - 1} more`
}

export function baseIsProcessing(kbId: string): boolean {
  return listSources(kbId).some((s) => s.state === "processing")
}

// ─── Lookups across every base ────────────────────────────────────────────────

function baseName(kbId: string): string | undefined {
  const seed = KNOWLEDGE_BASES.find((k) => k.id === kbId)
  if (seed) return seed.name
  return readList<KnowledgeBase>(KB_KEY).find((k) => k.id === kbId)?.name
}

/** "That address is already crawled into another base": the check runs across
 *  every base, seeded and made, and compares hosts so a trailing slash or a
 *  missing `www.` is not a second copy of the same site. */
export function findSourceByAddress(address: string): { source: KnowledgeSource; kbName: string } | undefined {
  const host = hostOf(address)
  if (!host) return undefined
  for (const source of allSources()) {
    if (!source.address || hostOf(source.address) !== host) continue
    const kbName = baseName(source.kbId)
    if (kbName) return { source, kbName }
  }
  return undefined
}

/** Who this base belongs to, in two lists, because they are two facts. Attach
 *  posts a list of ids while the engine payload carries one
 *  `llm.rag_config.search_config.kb_id`, and `attachKnowledgeBase` writes it
 *  only when it is still empty (ng-console agent-knowledge-page.tsx:209-210),
 *  so the first base on an agent's list is the one that answers and the rest
 *  are attached and never read. Both lists are empty when nothing uses it. */
export function agentsUsingBase(kbId: string): { answering: string[]; attached: string[] } {
  const answering: string[] = []
  const attached: string[] = []
  if (!kbId) return { answering, attached }
  for (const a of AGENTS) {
    if (!a.knowledge.includes(kbId)) continue
    if (a.knowledge[0] === kbId) answering.push(a.name)
    else attached.push(a.name)
  }
  return { answering, attached }
}
