/**
 * Agent resources — the user-created Knowledge Bases and MCP servers that an
 * agent can attach, plus which project Connectors are connected. Mirrors the
 * `voice-artifacts.ts` idiom: canonical seeds from `campaign-data.ts` + a
 * localStorage layer for things the user makes, so a created resource shows up
 * in the picker on every visit. No backend (wireframe); same `sx:` guards.
 */

import {
  KNOWLEDGE_BASES, MCP_SERVERS, CONNECTORS,
  type KnowledgeBase, type McpServer, type Connector,
} from "@/lib/campaign-data"

// ─── ids ──────────────────────────────────────────────────────────────────────

/** Runtime-only (browser) id minting — Date.now() is fine here. */
const mintId = (prefix: string) => `${prefix}_c_${Date.now().toString(36)}`

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

// ─── Knowledge bases ──────────────────────────────────────────────────────────

const KB_KEY = "sx:knowledge_bases"

/** How a knowledge base was ingested (Figma create form). */
export type KbIngest = "pdf" | "website" | "segmented"
export const KB_INGEST_LABEL: Record<KbIngest, string> = {
  pdf: "PDF · raw text",
  website: "Website · markdown",
  segmented: "Segmented",
}

export function listUserKnowledgeBases(): KnowledgeBase[] {
  return readList<KnowledgeBase>(KB_KEY)
}
/** Seeds + the user's created bases — the full picker list. */
export function allKnowledgeBases(): KnowledgeBase[] {
  return [...KNOWLEDGE_BASES, ...listUserKnowledgeBases()]
}
export function createKnowledgeBase(input: { name: string; ingest: KbIngest; fileName?: string }): KnowledgeBase {
  const kb: KnowledgeBase = {
    id: mintId("kb"),
    name: input.name.trim() || "New knowledge base",
    source: input.fileName?.trim() || KB_INGEST_LABEL[input.ingest],
    // Mock: a fresh base starts indexing, then reports chunks. Wireframe fakes
    // a plausible chunk count so the picker meta isn't "0 chunks" forever.
    chunks: input.ingest === "website" ? 210 : 480,
    status: "ready",
  }
  writeList(KB_KEY, [...listUserKnowledgeBases(), kb])
  return kb
}

// ─── MCP servers ──────────────────────────────────────────────────────────────

const MCP_KEY = "sx:mcp_servers"

export type McpTransport = "sse" | "http"
export const MCP_TRANSPORT_LABEL: Record<McpTransport, string> = {
  sse: "SSE",
  http: "Streamable HTTP",
}

export interface McpTool { id: string; name: string; description: string; enabled: boolean }
/** A user-created MCP server carries the extra config the seed list doesn't. */
export interface UserMcpServer extends McpServer {
  transport: McpTransport
  toolList: McpTool[]
}

export function listUserMcpServers(): UserMcpServer[] {
  return readList<UserMcpServer>(MCP_KEY)
}
export function allMcpServers(): McpServer[] {
  return [...MCP_SERVERS, ...listUserMcpServers()]
}
export function getUserMcpServer(id: string): UserMcpServer | undefined {
  return listUserMcpServers().find((s) => s.id === id)
}
/** Mock tool discovery — a created server "exposes" a plausible tool set. */
export function discoverTools(): McpTool[] {
  return [
    { id: "search", name: "search", description: "Search records by query.", enabled: true },
    { id: "create_record", name: "create_record", description: "Create a new record.", enabled: true },
    { id: "update_record", name: "update_record", description: "Update an existing record.", enabled: false },
  ]
}
export function createMcpServer(input: { name: string; url: string; transport: McpTransport; toolList?: McpTool[] }): UserMcpServer {
  const toolList = input.toolList ?? discoverTools()
  const server: UserMcpServer = {
    id: mintId("mcp"),
    name: input.name.trim() || "New MCP server",
    url: input.url.trim(),
    transport: input.transport,
    toolList,
    tools: toolList.filter((t) => t.enabled).length,
  }
  writeList(MCP_KEY, [...listUserMcpServers(), server])
  return server
}
export function saveMcpTools(id: string, toolList: McpTool[]) {
  const list = listUserMcpServers().map((s) =>
    s.id === id ? { ...s, toolList, tools: toolList.filter((t) => t.enabled).length } : s,
  )
  writeList(MCP_KEY, list)
}
export function deleteMcpServer(id: string) {
  writeList(MCP_KEY, listUserMcpServers().filter((s) => s.id !== id))
}

// ─── Connectors (project-level connected state) ───────────────────────────────

const CONN_KEY = "sx:connected_connectors"

/** Ids the user has "connected" (mock OAuth) at the project level. */
export function connectedConnectorIds(): string[] {
  return readList<string>(CONN_KEY)
}
export function isConnectorConnected(id: string): boolean {
  return connectedConnectorIds().includes(id)
}
export function setConnectorConnected(id: string, connected: boolean) {
  const cur = new Set(connectedConnectorIds())
  if (connected) cur.add(id)
  else cur.delete(id)
  writeList(CONN_KEY, [...cur])
}
/** A connector's effective status: seed status upgraded to "connected" when the
 *  user has connected it (coming-soon can never connect). */
export function effectiveConnectorStatus(c: Connector): Connector["status"] {
  if (c.status === "coming-soon") return "coming-soon"
  return isConnectorConnected(c.id) ? "connected" : "available"
}
