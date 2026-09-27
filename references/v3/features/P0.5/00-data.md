# P0.5 Connect other systems to the agent · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.5], `02-research.md` rule 0 (21 shots), the v3 API snapshot `references/api/v3/openapi-2026-09-24-ih7axj9zx.json` (schemas `Llm`, `Mllm`, `McpServer`, `FunctionTool`, `FunctionToolServer`, `FunctionToolExecution`, `ModelCredential`, `SecretSet`). ClickUp task 868m9wg37 has no comments, so there are no change notes. Depends on P0.1 (the agent exists with a deployment type), P0.3 (`agent_realtime`, the Headers control and the number control with a unit addon, the test panel's `agent_audio_heard`) and P0.4 (the test panel asks for variable values first; the greeting bubble). Team ask 10 and requirement 10: knowledge base, MCP servers and tools are one list with an icon per kind and a tooltip. Requirement 11: tooltips over helper text.

## What the flow shows

| Screen | Data it needs |
|---|---|
| Integrations row on an agent with nothing attached (.a step 1) | An agent with `pipeline.llm.mcp_servers` and `pipeline.llm.tools` empty; the row shows one sentence and **Add** |
| The Add menu (.a step 1) | The two kinds the API has (MCP server, tool), each with an icon and a name; a third kind (knowledge base) only behind the flag |
| The MCP server sheet (.a step 2) | Name, endpoint, headers (write-only), timeout, and a tool list the server returned so allowed tools can be ticked |
| The tool sheet (.a step 2) | Name, description, method and URL, parameters as a JSON schema, headers, timeout |
| The saved row (.a step 3) | The item in the list with its one fact line and the state **Not checked** |
| The test (.a step 4) | A test session whose transcript shows the greeting, one tool line with a status code and duration, and a second answer; the row then reads **Worked in last test** with the time |
| .b no tool list | An MCP endpoint that answers with an empty tool list (or does not answer) when tools are loaded |
| .c name rules and the 33rd tool | A name that breaks the MCP pattern, a tool name starting with `mcp`, and an agent that already has 32 tools |
| .d tool error in a test | A test in which a tool returns 502 or times out; the agent's spoken fallback line |
| .e saved header | A saved integration with at least one header, opened for editing |
| .f realtime pipeline | A realtime agent (`agent_realtime`) that holds one MCP server and one saved tool |
| .g knowledge base | A knowledge base sheet with files in every state: uploading, indexing, ready, rejected, too large, unsupported, indexing failed |
| .h legacy items | An agent that had a knowledge base or an app integration (HubSpot) attached in the current Console |
| .i expired token | A test in which the MCP server answers 401; the saved server opened for editing to re-enter the header |
| .j production failure | Nothing to show in this row: the edit sheet's Timeout field and the row menu's Remove are the recoveries |

## What a new account lacks

An MCP server and a tool: the flow creates both. A brand-new agent from P0.1 already is the journey start; `POST /agents` needs only `agent_name`, so the agent comes back with `pipeline.llm.mcp_servers` and `pipeline.llm.tools` absent. Every happy state is reachable from that agent plus a server Sam runs. The fixtures fake what a fresh account cannot show at once: a server that returns tools (or none), a test that uses a tool and fails, a saved header, 32 tools, legacy items from the current Console, and the knowledge base states behind the flag.

API truth per field (checked against the snapshot):

| Field | In spec | Default | Notes |
|---|---|---|---|
| `pipeline.llm.mcp_servers[]` | yes, `McpServer` | none | Cascaded pipeline. Also `pipeline.mllm.mcp_servers[]` for realtime, same schema |
| `McpServer.name` | required, `^[a-zA-Z0-9]{1,48}$` | | Letters and digits only, no spaces, no underscore. The model sees it (.c) |
| `McpServer.endpoint` | required, uri | | |
| `McpServer.transport` | required, const `streamable_http` | | No choice, so no control (Studio sends it). ElevenLabs offers SSE or streamable HTTP (`shots/elevenlabs-19-custom-mcp-server-form.png`); the v3 API does not |
| `McpServer.headers` | object of strings, `writeOnly` | none | Never returned by GET. Studio shows "n headers set" and **Replace** (.e). The spec documents `$secrets.<set>.<key>` for `ModelCredential.api_key` only, not for headers: the (i) says so and the PRD logs it as an API ask |
| `McpServer.allowed_tools[]` | array of unique strings | none | Absent means every tool the server offers. The spec has no endpoint that lists a server's tools; Studio asks the server itself over streamable HTTP (`tools/list`) from the browser, which a server may refuse (CORS, 401). .b covers "no tool list" from either cause. Open question 1 |
| `McpServer.timeout_ms` | integer 1000 to 100000 | none | Empty leaves it to the runtime; Studio suggests 10000 in the (i) |
| `pipeline.llm.tools[]` | yes, `FunctionTool`, `maxItems` 32 | none | Cascaded only. `Mllm` has no `tools`, so a realtime agent cannot use tools (.f) |
| `FunctionTool.type` | required, const `function` | | Sent by Studio, never shown |
| `FunctionTool.name` | required, `^(?![mM][cC][pP])[a-zA-Z][a-zA-Z0-9]{0,63}$` | | Starts with a letter, letters and digits only, up to 64, never starting with `mcp`. Today's seed `send_payment_link` is invalid under this rule and is renamed |
| `FunctionTool.description` | required, 1 to 1024 | | The model reads it |
| `FunctionTool.parameters` | required, `JsonSchema` | | A JSON schema object |
| `FunctionTool.execution.mode` | required, const `sync` | | Sent by Studio, never shown |
| `FunctionTool.server.method` | required, `GET` or `POST` | | The API allows only these two, so the select stays GET and POST (the research note about PUT, PATCH and DELETE does not apply) |
| `FunctionTool.server.url` | required, `^https://` | | HTTPS only; the error says so |
| `FunctionTool.server.headers` | object of strings, `writeOnly` | none | As `McpServer.headers` |
| `FunctionTool.server.body` | object | none | Fixed JSON sent with every request; shown for POST only |
| `FunctionTool.server.timeout_ms` | integer 1000 to 100000 | 10000 | The .j recovery |
| a health or last-test field | no | | **Not checked**, **Worked in last test** and **Failed in last test** are Studio state from the test panel, never from the API |
| an execution log | no | | .j has no signal in this row; the error group on the agent page (P1.4) is blocked on the RTM stream |
| knowledge base | no | | No schema at all (0 hits for `knowledge` in the snapshot). The row sits behind a flag and cannot save (.g) |
| app integration (HubSpot) | no | | Not in the spec. Named in the legacy line (.h) |

## Where it exists outside our accounts

- One list with an icon per kind: our own row today, `shots/before-01-context-row-populated.png`, `shots/before-07-context-row-empty.png`.
- MCP form with a test-before-save door: ElevenLabs `shots/elevenlabs-19-custom-mcp-server-form.png` (trust checkbox, Test Connection). Its webhook tool has none: `shots/elevenlabs-19-webhook-tool-form.png`.
- The sparse MCP form (no timeout, no allowed tools): LiveKit `shots/livekit-19-mcp-server-form.png`.
- A step failure named on the object with a code and two recoveries: Zapier `shots/refero-zapier-01-step-error-troubleshoot.png`.
- Plain-language failure names for tools: Vapi `shots/vapi-docs-01-troubleshoot-tools.png`.
- The only documented knowledge base failure: Retell `shots/retell-docs-01-kb-source-fails-to-process.png`.
- A silent red dot we refuse to copy: ElevenLabs `shots/elevenlabs-20-agent-knowledge-base-sources.png`.
- The legacy surface: the current Console's Integrations page, `shots/before-08-old-console-integrations-gated.png`.
- Not captured anywhere: an unreachable MCP server on screen, a tool timeout in a transcript, a write-only header re-entered. The prototype fakes these by URL; no capture blocks the build.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Names below are the contract for the build; the build may place them where the file's order wants.

1. `ContextKind` stays `"mcp" | "tool" | "knowledge"`. `ContextItem` becomes a union shaped to the API, with a derived fact line instead of the stored `detail`:

   ```ts
   type IntegrationTest = { at: string; ok: boolean; code?: string }   // Studio state, no API field
   type McpItem = { id; kind: "mcp"; name; endpoint: string; headerCount: number;
     allowedTools: string[]; timeoutMs?: number; lastTest?: IntegrationTest }
   type ToolItem = { id; kind: "tool"; name; description: string; method: "GET" | "POST"; url: string;
     parameters: string; body?: string; headerCount: number; timeoutMs: number; lastTest?: IntegrationTest }
   type KnowledgeItem = { id; kind: "knowledge"; name; files: { name: string; sizeMb: number;
     status: "uploading" | "indexing" | "ready" | "rejected" | "too_large" | "unsupported" | "index_failed"; progress?: number }[] }
   type ContextItem = McpItem | ToolItem | KnowledgeItem
   ```

   `integrationDetail(item)`: mcp `{host} · {n} tools` or `{host} · all tools`; tool `{METHOD} {host}{path}`; knowledge `{n} files`. Concepts B to E read `integrationDetail` where they read `detail` today.
2. `ProtoAgent.legacy?: string[]`: names attached in the current Console that cannot attach to a v3 agent (.h). Never sent to the API.
3. `INTEGRATION_LIMITS = { tools: 32, timeoutMs: [1000, 100000], mcpName: /^[a-zA-Z0-9]{1,48}$/, toolName: /^(?![mM][cC][pP])[a-zA-Z][a-zA-Z0-9]{0,63}$/, description: 1024 }`.
4. `validateIntegration(kind, draft): Record<fieldId, string>` returns the copy from `05-build-spec.md` section 6: MCP name, tool name (two rules), description, endpoint, https URL, JSON in parameters and body, timeout range.
5. `toolLimitReached(agent)`: true at 32 tools; MCP servers never count.
6. `integrationsFor(agent)`: for a realtime agent, MCP servers usable and tools marked unavailable; the Add menu offers MCP server only (today's `contextKindsFor`, kept).
7. `integrationPatch(saved, draft)` returns only what changed, mapped to API paths: `pipeline.llm.mcp_servers[]` (each with `transport: "streamable_http"`), `pipeline.llm.tools[]` (each with `type: "function"`, `execution: { mode: "sync" }`, `server: { method, url, body?, timeout_ms }`), or `pipeline.mllm.mcp_servers[]` for a realtime agent; `headers` only for an item whose headers were entered or replaced in this save, never for the others. Feeds P0.3's **View last save**.
8. `newAgent` keeps `context: []`, no `legacy`.
9. Seeds:
   - New `agent_orders` "Order status" (inbound, draft, `studioLabels("inbound")`): prompt "You are Mia on the order line for Acme Outfitters. Look up the caller's order by order number or email and tell them where it is. If the order is late, offer to text a tracking link. Keep every reply under two sentences.", greeting *"Hi, this is Mia at Acme Outfitters. Do you have your order number?"* on the agent, no variables, `context: []`, no numbers, no legacy. Journey start.
   - `ORDERS_INTEGRATIONS` (review only, never seeded): `ctx_orders` MCP "Orders", endpoint `https://mcp.acme-outfitters.com/mcp`, `headerCount: 1`, `allowedTools: ["search_orders", "get_order_status", "create_ticket"]`, `timeoutMs: 10000`; `ctx_tracking` tool "sendTrackingLink", description "Texts the caller a tracking link for one order.", POST `https://api.acme-outfitters.com/tracking-links`, parameters `{"type":"object","properties":{"orderId":{"type":"string"},"phone":{"type":"string"}},"required":["orderId","phone"]}`, `headerCount: 1`, `timeoutMs: 10000`. `ORDERS_TOOL_LIST = ["search_orders", "get_order_status", "create_ticket", "refund_order"]` is what **Load tools** returns for that endpoint.
   - `LIMIT_TOOLS` (review only): 32 tools `lookupOrder01` to `lookupOrder32`, GET, same host.
   - `agent_payments` "Payment reminders" (batch, live): the knowledge item "Billing FAQ" leaves `context` and moves to `legacy: ["Billing FAQ", "HubSpot"]`; the tool is renamed `sendPaymentLink` (the API pattern forbids underscores) with description "Texts the customer a payment link.", POST `https://api.acme-energy.com/links`, `headerCount: 1`, `timeoutMs: 10000`, no `lastTest`.
   - `agent_frontdesk` "Front desk" (inbound): "Clinic handbook" moves to `legacy: ["Clinic handbook"]`; MCP "Calendar" gains endpoint `https://mcp.bayview.dental/mcp`, `headerCount: 1`, `allowedTools` five names, `timeoutMs: 8000`, `lastTest: { at: "09:41", ok: true }`.
   - `agent_tutor` "In-app tutor" (code): MCP "Lumen curriculum" gains endpoint `https://mcp.lumen.app/mcp`, `headerCount: 0`, three allowed tools, no timeout.
   - `agent_realtime` "Concierge" (P0.3): MCP "Bookings" gains endpoint `https://mcp.hotel.example/mcp`, `headerCount: 1`, four allowed tools; gains one tool `checkAvailability` (GET `https://api.hotel.example/availability`) so .f has a tool to mark unavailable.
   - `agent_survey`, `agent_draft`, `agent_api_custom`, `agent_api_untyped`: unchanged (`context: []`).
10. Review states by URL, none writes the store: `it=add` (Add menu open), `it=tools` (MCP sheet filled, tools loaded, `refund_order` unticked), `it=no-tools` (MCP sheet filled, the server returned no tools), `it=name` (the open sheet's Name breaks its rule, Save pressed), `it=limit` (the list holds `LIMIT_TOOLS`), `it=saved` (the list holds `ORDERS_INTEGRATIONS`, both **Not checked**, toast), `it=tested` (same plus the test panel: greeting, tool line 200, second answer; Orders reads **Worked in last test**), `it=tool-error` (test panel: `sendTrackingLink · 502`, fallback answer; the row reads **Failed in last test**), `it=mcp-401` (test panel: `Orders · MCP server 401`; the row reads **Failed in last test**), `it=leave` (open sheet dirty plus the guard), `it=remove` (the Remove dialog on Orders), `it=kb-rejected`, `it=kb-large`, `it=kb-type`, `it=kb-failed` (knowledge sheet with that file state). `panel=mcp`, `panel=tool`, `panel=knowledge` open an add sheet; `panel=integration&item=<id>` opens the edit sheet on that item (from the store, or from the review list when `it` is set). `kb=on` turns the knowledge base flag on for the link.
11. Tests: `validateIntegration` rejects `orders-prod` and `Billing FAQ` for an MCP name and passes `Orders`; rejects `mcp_lookup`, `mcpLookup`, `send_payment_link` for a tool name and passes `sendTrackingLink`; rejects `http://` URLs; rejects a timeout of 500 and passes 10000; `toolLimitReached` is false at 31 and true at 32; `integrationPatch` of an untouched draft is `{}`, never includes `headers` for an item whose headers were not re-entered, always includes `transport` and `execution.mode`; a realtime agent's patch writes `pipeline.mllm.mcp_servers` and never `tools`; every seed name passes its pattern.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run):

- One console-made agent with no integration; one with an MCP server whose endpoint is a small streamable HTTP server the team runs (so **Load tools** returns real names) and one tool against a test endpoint that returns 200; a second tool whose endpoint returns 502 for the .d capture; one MCP server saved with a header that is then revoked for the .i capture; one agent that had a knowledge base and HubSpot attached in the current Console for the .h capture.
- Never sign in or enter credentials for this: the owner creates these in the staging account.
