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

/** How a knowledge base was ingested (Figma create form).
 *
 *  `external` (Q3 roadmap: "[UI] Integrate Couchbase as a RAG provider") is
 *  deliberately GENERIC rather than a Couchbase-branded door. Three findings
 *  pushed that: no persona asked for Couchbase by name (they asked for "don't
 *  make me re-upload 40k docs into your black box"); a fourth vendor-named
 *  connect-an-external-thing surface would deepen the existing KB / MCP /
 *  Connectors IA tension; and Couchbase is one of five answers users named. */
export type KbIngest = "pdf" | "website" | "segmented" | "external"
export const KB_INGEST_LABEL: Record<KbIngest, string> = {
  pdf: "PDF · raw text",
  website: "Website · markdown",
  segmented: "Segmented",
  external: "Connect an existing vector index",
}

// ─── External retrieval providers ────────────────────────────────────────────

export type RetrievalProvider = "couchbase" | "pinecone" | "custom"

/**
 * Field shapes per provider. Couchbase's is 4-level (Bucket → Scope →
 * Collection → Index) — modelling it as a flat "index name" is simply wrong,
 * and `scoped_index` changes the REST path. Verified against
 * docs.couchbase.com/cloud/vector-search/create-vector-search-index-ui.html
 * and the langchain-couchbase adapter's required arguments.
 */
export interface RetrievalProviderSpec {
  id: RetrievalProvider
  label: string
  /** What the user pastes from the provider's own console. */
  endpointLabel: string
  endpointPlaceholder: string
  /** Ordered resource path — each level populates from the one above. */
  levels: string[]
  /** Shown when a connection times out rather than fails auth. */
  networkNote?: string
  docsUrl: string
}

export const RETRIEVAL_PROVIDERS: RetrievalProviderSpec[] = [
  {
    id: "couchbase",
    label: "Couchbase",
    endpointLabel: "Connection string",
    endpointPlaceholder: "couchbases://cb.xxxxx.cloud.couchbase.com",
    levels: ["Bucket", "Scope", "Collection", "Search index"],
    networkNote:
      "Capella only accepts connections from allowed IPs. Add our egress IP in Capella → Settings → Allowed IP Addresses.",
    docsUrl: "https://docs.couchbase.com/cloud/vector-search/create-vector-search-index-ui.html",
  },
  {
    id: "pinecone",
    label: "Pinecone",
    endpointLabel: "Index host",
    endpointPlaceholder: "https://my-index-abc123.svc.us-east-1.pinecone.io",
    levels: ["Index", "Namespace"],
    docsUrl: "https://docs.pinecone.io/guides/projects/manage-api-keys",
  },
  {
    id: "custom",
    label: "Custom endpoint",
    endpointLabel: "Retrieval endpoint",
    endpointPlaceholder: "https://api.example.com/retrieve",
    levels: [],
    docsUrl: "https://docs.agora.io/en/conversational-ai/overview/product-overview",
  },
]

/** Our egress IP — the value a user must allowlist. Wireframe value. */
export const EGRESS_IP = "34.102.156.18"

/** Mock resource discovery: once credentials verify, the four levels become
 *  dropdowns instead of four chances to typo an unverifiable string. */
export const MOCK_RESOURCES: Record<string, string[]> = {
  Bucket: ["support-kb", "product-catalog", "internal-wiki"],
  Scope: ["docs", "_default"],
  Collection: ["chunks", "faq_chunks"],
  "Search index": ["support-vectors", "faq-vectors"],
  Index: ["support-kb", "product-catalog"],
  Namespace: ["prod", "staging"],
}

/** A retrieved chunk from the "Test retrieval" step — a green Connected chip
 *  proves auth, not that retrieval WORKS. A wrong embedding field produces a
 *  perfectly healthy connection that returns nothing. */
export interface RetrievedChunk {
  score: number
  text: string
  source: string
}

export function mockRetrieval(query: string): { chunks: RetrievedChunk[]; ms: number } {
  const q = query.trim()
  if (!q) return { chunks: [], ms: 0 }
  return {
    ms: 180 + (q.length % 7) * 24,
    chunks: [
      { score: 0.91, text: "Orders ship within 2 business days. A shipping label being created does not mean the parcel has left the warehouse.", source: "shipping-policy.md#L12" },
      { score: 0.84, text: "Refunds are issued to the original payment method within 5–7 business days of the return being received.", source: "returns-policy.md#L4" },
      { score: 0.71, text: "Damaged items under $75 are replaced automatically without requiring a photo or a return.", source: "returns-policy.md#L31" },
    ],
  }
}

export function listUserKnowledgeBases(): KnowledgeBase[] {
  return readList<KnowledgeBase>(KB_KEY)
}
/** Seeds + the user's created bases — the full picker list. */
export function allKnowledgeBases(): KnowledgeBase[] {
  return [...KNOWLEDGE_BASES, ...listUserKnowledgeBases()]
}
export function createKnowledgeBase(input: {
  name: string
  ingest: KbIngest
  fileName?: string
  /** External-provider label, e.g. "Couchbase · support-vectors". */
  externalSource?: string
}): KnowledgeBase {
  const kb: KnowledgeBase = {
    id: mintId("kb"),
    name: input.name.trim() || "New knowledge base",
    source: input.externalSource?.trim() || input.fileName?.trim() || KB_INGEST_LABEL[input.ingest],
    // Mock: a fresh base starts indexing, then reports chunks. Wireframe fakes
    // a plausible chunk count so the picker meta isn't "0 chunks" forever.
    // An external index is already built — we don't index it, we query it.
    chunks: input.ingest === "external" ? 4182 : input.ingest === "website" ? 210 : 480,
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
