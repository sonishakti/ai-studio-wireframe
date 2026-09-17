/**
 * Agent tools — Design Tracker 19 · Tools & connectors.
 *
 * Verdict (references/research/19-tools-connectors/05-directions.html):
 * direction C. The builder's third row stops being a hand-rolled connector
 * table and becomes the fourth ResourceField, and every HTTP tool and every
 * MCP server carries the result of a test the user ran.
 *
 * This module owns HTTP TOOLS ONLY. Connectors stay in `CONNECTORS`
 * (campaign-data.ts :1758 calls it the canonical catalog shared by Resources
 * and the builder) and MCP servers stay in `agent-resources.ts`, so nothing
 * forks a catalog. Checks live in their own id-keyed store, which is what lets
 * a seed tool and a seed MCP server be tested without mutating a seed array.
 *
 * Agora facts that shape the rules here:
 *  • `llm.tools[].function.server.method` is GET or POST. `server.timeout_ms`
 *    is [1000, 100000]. The Engine accepts 32 tools after filtering.
 *  • `advanced_features.enable_tools` defaults to false, and tools are then
 *    validated and not invoked. A passing check says the endpoint answered OUR
 *    call and nothing more, so the states are Test passed · Test failed · Not
 *    tested yet. Nothing here can say "Working".
 *  • The test result normalizes to `{ success, statusCode, headers, body,
 *    error }`. There is no duration in it, so none is produced.
 *  • The custom-tool envelope carries no last-test field, while
 *    `GET /mcp/{id}/status` returns `lastDetectedAt`. `at` is stored for every
 *    check and rendered only where the contract has that equivalent.
 *  • Pricing is flat $0.10 per agent-minute. A tool that takes eight seconds
 *    costs eight seconds of agent-minute, so nothing here prices a tool.
 */

import { AGENTS, CONNECTORS, type Agent, type McpServer } from "@/lib/campaign-data"
import { readList, writeList } from "@/lib/agent-resources"

// ─── The record ───────────────────────────────────────────────────────────────

/** A no-code HTTP tool, in the shape the Console persists — the request it
 *  sends, and the function the model sees. */
export interface AgentTool {
  id: string
  /** Display name. Seeds keep it identical to `fn.name` so one tool has one
   *  name on every surface. */
  name: string
  description: string
  /** A teammate can take a tool out of service without deleting it. */
  status: "available" | "unavailable"
  method: "GET" | "POST"
  url: string
  headers: { key: string; value: string }[]
  queryParams: { key: string; value: string }[]
  /** POST only. JSON whose `{{placeholders}}` bind from the function input. */
  bodyTemplate: string
  timeoutMs: number
  /** What the model is told it can call. `parameters` is JSON Schema, kept as
   *  the string the form edits so an in-progress edit is never lost to a
   *  parse. */
  fn: { name: string; description: string; parameters: string }
}

/** One test the user ran, normalized the way the test endpoint answers.
 *  `at` is stored for every check and RENDERED only on MCP rows, where
 *  `lastDetectedAt` exists on the contract. */
export interface ToolCheck {
  ok: boolean
  statusCode?: number
  body?: string
  error?: string
  at: number
}

// ─── The Engine's constraints ─────────────────────────────────────────────────

export const TOOL_METHODS = ["GET", "POST"] as const
/** Tools per agent, after the Engine filters. */
export const TOOL_CEILING = 32
export const TOOL_TIMEOUT_RANGE = [1000, 100000] as const
export const TOOL_TIMEOUT_DEFAULT = 10000
/** The validator the Console ships. The join contract is stricter (letters and
 *  numbers, leading letter); which one the Studio backend enforces is a named
 *  ask, so the shipped rule is the one on screen. */
export const FN_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/
/** Agora treats a header as a secret BY NAME. There is no stored reference
 *  behind it yet, which is why the value masks and reads "Stored as a secret". */
export const SECRET_HEADER_NAMES = ["authorization", "api-key", "token", "secret", "cookie"]

/** What the Parameters field opens with, and what a tool created without one
 *  carries: a valid empty JSON Schema object. */
export const TOOL_PARAMETERS_SEED = `{
  "type": "object",
  "properties": {},
  "required": []
}`

// ─── Validation ───────────────────────────────────────────────────────────────

/** `{{order_id}}` — the binding the request builder and the function input
 *  share. */
const PLACEHOLDER_RE = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g

/** Every placeholder across the given strings, in order, once each. */
function placeholders(...parts: (string | undefined)[]): string[] {
  const found: string[] = []
  for (const part of parts) {
    if (!part) continue
    for (const m of part.matchAll(PLACEHOLDER_RE)) if (!found.includes(m[1])) found.push(m[1])
  }
  return found
}

/** Empty parses as nothing rather than as a failure: a GET carries no body. */
function parseJson(raw: string | undefined): { ok: boolean; value?: unknown } {
  const text = (raw ?? "").trim()
  if (!text) return { ok: true }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

const asObject = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null

/** The host, read off the raw string rather than off `new URL`, so a
 *  placeholder typed into the host is caught instead of throwing. */
const authorityOf = (url: string): string => url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").split(/[/?#]/)[0]

/**
 * Errors keyed by field: `url` · `timeoutMs` · `fnName` · `parameters` ·
 * `bodyTemplate`. Every check is independent, so a form can render each error
 * under the field that owns it.
 */
export function validateTool(input: Partial<Omit<AgentTool, "id">>): { ok: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  const url = (input.url ?? "").trim()
  let httpsUrl = false
  try {
    httpsUrl = new URL(url).protocol === "https:"
  } catch {
    httpsUrl = false
  }
  if (placeholders(authorityOf(url)).length > 0) {
    errors.url = "Keep the host fixed. A placeholder can sit in the path, the query or the body."
  } else if (!httpsUrl) {
    errors.url = "Enter a valid https URL."
  }

  const timeout = input.timeoutMs ?? TOOL_TIMEOUT_DEFAULT
  if (!Number.isFinite(timeout) || timeout < TOOL_TIMEOUT_RANGE[0] || timeout > TOOL_TIMEOUT_RANGE[1]) {
    errors.timeoutMs = `Use a timeout between ${TOOL_TIMEOUT_RANGE[0]} and ${TOOL_TIMEOUT_RANGE[1]} ms.`
  }

  if (!FN_NAME_RE.test((input.fn?.name ?? "").trim())) {
    errors.fnName = "Use letters, numbers and underscores. Start with a letter or an underscore."
  }

  // The parameters declare what the model may bind, so they also decide which
  // placeholders the request is allowed to carry.
  const parsed = parseJson(input.fn?.parameters)
  let declared: string[] = []
  if (!parsed.ok) {
    errors.parameters = "Parameters must be valid JSON."
  } else {
    const schema = asObject(parsed.value)
    if (!schema || schema.type !== "object") {
      errors.parameters = `Parameters must be a JSON object with "type": "object".`
    } else {
      declared = Object.keys(asObject(schema.properties) ?? {})
    }
  }

  if (!parseJson(input.bodyTemplate).ok) errors.bodyTemplate = "Body template must be valid JSON."

  const used = placeholders(
    url,
    ...(input.headers ?? []).map((h) => h.value),
    ...(input.queryParams ?? []).map((q) => q.value),
    input.bodyTemplate,
  )
  const undeclared = used.filter((p) => !declared.includes(p))
  if (undeclared.length > 0 && !errors.parameters) {
    errors.parameters = `Add "${undeclared[0]}" as a parameter, or remove it from the request.`
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

// ─── The check ────────────────────────────────────────────────────────────────

/** Deterministic PRNG (same FNV-1a style as diagnostics.ts :96) — a given URL
 *  always answers with the same request id. */
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

/** A host we cannot reach from our network, so the call runs out of time. */
const UNREACHABLE_HOST_RE = /(^|\.)localhost$|\.local$/i
/** The one seeded host that answers with a bad gateway, so the failed state is
 *  reachable from the roster without typing a URL that cannot resolve. */
const FAILING_HOST = "hooks.acme.com"

/** The endpoint's answer, echoing what the function input bound. */
function answerBody(url: string, body: string | undefined): string {
  const rand = seeded(url)
  const requestId = `req_${Math.floor(rand() * 0xffffff).toString(16).padStart(6, "0")}`
  const received = parseJson(body).value
  return JSON.stringify({ request_id: requestId, received: received ?? {} }, null, 2)
}

/**
 * Run one test. Derived from the URL, never a network call. No duration comes
 * back, because the test result carries none.
 */
export function runCheck(input: { url: string; method?: "GET" | "POST"; body?: string }): ToolCheck {
  const at = Date.now()
  const url = (input.url ?? "").trim()
  let host = ""
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol === "https:") host = parsedUrl.host
  } catch {
    host = ""
  }
  if (!host) return { ok: false, error: "The server did not answer.", at }
  if (UNREACHABLE_HOST_RE.test(host)) {
    return { ok: false, error: `The request timed out after ${TOOL_TIMEOUT_DEFAULT / 1000} seconds.`, at }
  }
  if (host === FAILING_HOST) return { ok: false, statusCode: 502, body: "Bad gateway", at }
  return { ok: true, statusCode: 200, body: answerBody(url, input.body), at }
}

/** The three words the evidence supports. A missing check is a state, not a
 *  blank. */
export function checkLabel(check?: ToolCheck): "Test passed" | "Test failed" | "Not tested yet" {
  if (!check) return "Not tested yet"
  return check.ok ? "Test passed" : "Test failed"
}

// ─── The check store ──────────────────────────────────────────────────────────
//
// Keyed by id in a store of its own, so a seed tool and a seed MCP server can
// carry a result without either seed array being mutated.

const CHECK_KEY = "sx:tool_checks"

interface StoredCheck extends ToolCheck { id: string }

export function getToolCheck(id: string): ToolCheck | undefined {
  const row = readList<StoredCheck>(CHECK_KEY).find((c) => c.id === id)
  return row ? { ok: row.ok, statusCode: row.statusCode, body: row.body, error: row.error, at: row.at } : undefined
}
export function saveToolCheck(id: string, check: ToolCheck) {
  writeList(CHECK_KEY, [...readList<StoredCheck>(CHECK_KEY).filter((c) => c.id !== id), { id, ...check }])
}
export function clearToolCheck(id: string) {
  writeList(CHECK_KEY, readList<StoredCheck>(CHECK_KEY).filter((c) => c.id !== id))
}

// ─── The tool store ───────────────────────────────────────────────────────────

const TOOLS_KEY = "sx:tools"

/** Runtime-only (browser) id minting — the same shape agent-resources.ts uses,
 *  which keeps it private. */
const mintId = (prefix: string) => `${prefix}_c_${Date.now().toString(36)}`

/** The tools this browser made. */
export function listTools(): AgentTool[] {
  return readList<AgentTool>(TOOLS_KEY)
}
/** Seeds plus the user's — the full roster. */
export function allTools(): AgentTool[] {
  return [...TOOL_SEEDS, ...listTools()]
}
export function getTool(id: string): AgentTool | undefined {
  return allTools().find((t) => t.id === id)
}

export function createTool(input: Partial<Omit<AgentTool, "id">>): AgentTool {
  const fnName = (input.fn?.name ?? "").trim()
  const name = (input.name ?? "").trim() || fnName || "New tool"
  const tool: AgentTool = {
    id: mintId("tool"),
    name,
    description: (input.description ?? "").trim(),
    status: input.status ?? "available",
    method: input.method ?? "GET",
    url: (input.url ?? "").trim(),
    // Half-typed rows are dropped rather than persisted as empty pairs.
    headers: (input.headers ?? []).filter((h) => h.key.trim()),
    queryParams: (input.queryParams ?? []).filter((q) => q.key.trim()),
    bodyTemplate: input.bodyTemplate ?? "",
    timeoutMs: input.timeoutMs ?? TOOL_TIMEOUT_DEFAULT,
    fn: {
      name: fnName || name,
      description: (input.fn?.description ?? "").trim(),
      parameters: input.fn?.parameters ?? TOOL_PARAMETERS_SEED,
    },
  }
  writeList(TOOLS_KEY, [...listTools(), tool])
  return tool
}

export function updateTool(id: string, patch: Partial<Omit<AgentTool, "id">>) {
  writeList(
    TOOLS_KEY,
    listTools().map((t) => (t.id === id ? { ...t, ...patch, fn: { ...t.fn, ...(patch.fn ?? {}) } } : t)),
  )
}

/** User rows only: a seed is part of the catalog and cannot be deleted. The
 *  row's check goes with it, so a new tool never inherits a dead id's result. */
export function deleteTool(id: string) {
  if (!listTools().some((t) => t.id === id)) return
  writeList(TOOLS_KEY, listTools().filter((t) => t.id !== id))
  clearToolCheck(id)
}

// ─── What the row and the rail count ──────────────────────────────────────────

/**
 * Tools attached to this agent: an HTTP tool is one, an MCP server is however
 * many it exposes. A connector contributes nothing, because no connector
 * record holds a tool count and a true ceiling fed by an invented addend
 * blocks a user the Engine still has room for.
 */
export function toolCount(draft: { tools: string[]; mcp: string[] }, servers: McpServer[]): number {
  const catalog = allTools()
  const http = (draft.tools ?? []).filter((id) => catalog.some((t) => t.id === id)).length
  const exposed = (draft.mcp ?? []).reduce((n, id) => n + (servers.find((s) => s.id === id)?.tools ?? 0), 0)
  return http + exposed
}

/** Drives the second sentence under the ceiling: with a connector attached,
 *  the number is honest about what it leaves out. */
export function hasConnectorAttached(draft: { tools: string[] }): boolean {
  return (draft.tools ?? []).some((id) => CONNECTORS.some((c) => c.id === id))
}

/** Agent.tools lands in the same commit (campaign-data.ts). Read through a
 *  narrow type so this module compiles on both sides of that rename. */
const toolsOf = (a: Agent): string[] => (a as Agent & { tools?: string[] }).tools ?? []

/** Counted over AGENTS only: a stored draft needs its id to be restored and
 *  nothing scans localStorage by prefix, so the draft half is uncountable. */
export function usedByAgents(toolId: string): number {
  return AGENTS.filter((a) => toolsOf(a).includes(toolId)).length
}

// ─── Seeds ────────────────────────────────────────────────────────────────────
//
// Two rows, both available, neither carrying a check: no health state is ever
// seeded on anything, so every state on screen is one the user produced.

export const TOOL_SEEDS: AgentTool[] = [
  {
    id: "tool_lookup_order",
    name: "lookup_order",
    description: "Look up one order by its number and read back where it is.",
    status: "available",
    method: "GET",
    url: "https://api.acme.com/orders/{{order_id}}",
    headers: [{ key: "Authorization", value: "Bearer 4f9c2ab1" }],
    queryParams: [],
    bodyTemplate: "",
    timeoutMs: TOOL_TIMEOUT_DEFAULT,
    fn: {
      name: "lookup_order",
      description: "Look up an order's status. Call this when the caller asks where their order is.",
      parameters: `{
  "type": "object",
  "properties": {
    "order_id": { "type": "string", "description": "The order number the caller gave." }
  },
  "required": ["order_id"]
}`,
    },
  },
  {
    id: "tool_refund_order",
    name: "refund_order",
    description: "Start a refund on an order the caller has already paid for.",
    status: "available",
    method: "POST",
    url: "https://hooks.acme.com/refunds",
    headers: [{ key: "Authorization", value: "Bearer 4f9c2ab1" }],
    queryParams: [],
    bodyTemplate: `{
  "order_id": "{{order_id}}",
  "reason": "{{reason}}"
}`,
    timeoutMs: TOOL_TIMEOUT_DEFAULT,
    fn: {
      name: "refund_order",
      description: "Start a refund. Call this only after the caller has confirmed the amount.",
      parameters: `{
  "type": "object",
  "properties": {
    "order_id": { "type": "string", "description": "The order to refund." },
    "reason": { "type": "string", "description": "What the caller said went wrong." }
  },
  "required": ["order_id", "reason"]
}`,
    },
  },
]
