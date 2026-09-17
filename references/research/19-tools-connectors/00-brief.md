# 19 · Tools & connectors — intake brief (2026-09-17)

Tracker: https://app.clickup.com/t/868m0mf40 · status `added` to `clarified` once this lands · Tags **knowledge · P0** · no wave or due date on the row (`references/tracker-board/tracker-board.json` row `19`, and every one of the five roadmap tasks is undated in `references/clickup-q3-roadmap-export-2026-09-03.tsv` except 868ka25w5).
Design Tracker JTBD (868m0mf40): "User wants the agent to act on other systems without writing code."

**The one fact that reframes this feature:** the Engine shipped `llm.tools` on **2026-09-10** (v2.12) and the real Console already ships the whole surface: a **Custom Tools** tab under `/integrations`, a full no-code HTTP tool form, a per-tool **test** endpoint, and MCP · custom-tool · connector attachment to an agent. This is not greenfield. Three of the five roadmap tasks are already built somewhere the sandbox has never looked. See §What the product has today and §Agora fact-check.

## Scope

Descriptions and acceptance criteria are expanded only from documents in `references/`. ClickUp is unreadable from here, so where a document is silent the row says so rather than inventing one.

| Task | What it asks for | Acceptance criteria |
|---|---|---|
| **868kbyqdm** Build a native and MCP connector marketplace | Q3 export row 186: Module **Studio**, level 1, **P0**, type Dev Experience, no due date, no customer (`references/clickup-q3-roadmap-export-2026-09-03.tsv`). The PRD card B3 (`references/roadmap-features-prd-2026-07-09.md` :313–318) scopes it as "Marketplace UI over **existing** MCP + native connectors (F4); 1-click install, auto tool-binding, BYO-MCP escape hatch." Surface named: "**Resources** (`/integrations`) → Marketplace tab". Data named: "`Connector { id, kind: native\|mcp, authState }`; attach to Agent.actions[]". | Verbatim from the same card: "browse catalog → install → agent gains the tool without manual config; BYO-MCP server URL works." Prior fact-check F4 (`references/roadmap-activation-strategy-2026-07-09.md` :90) constrains it: "Function/tool-calling and **MCP are already supported** … Marketplace = a **discovery/1-click-install UI** over an existing capability." Note the priority conflict: the Q3 export and the design backlog say **P0**; `references/prd-q3-roadmap-execution-2026-07-29.html` :225 and `TODO-Q3-ROADMAP.md` :69 both say **P2**. |
| **868kyjfp1** Build no-code HTTP tools | Q3 export row 192: Module **Studio**, level 1, **P0**, type **Feature Request**, no due date. `references/design-backlog-q3-roadmap-2026-09-03.html` carries the only dependency note on the row: "Engine GET/POST tools GA Aug (L)". | No acceptance criteria written. The Engine half is now GA (v2.12, `llm.tools`), so the acceptance bar is the Studio form on top of it, which already exists in the real Console (`ng-console/src/components/console/integrations-page.tsx` :1361–2025). |
| **868ka25w5** [O5.1-T3.a] Support GET and POST agent tools | Q3 export row 35: Module **Engine**, level 2, **P1**, due **2026-08**, customer **Platform (Studio)**, type Dev Experience, delivery **Production - GA**, size **L**. This is the Engine ticket the Studio tasks sit on. | No acceptance-criteria text in any local document. The shipped contract is the criteria: `llm.tools[].function.server.method` accepts `"GET"` or `"POST"` only, `url` must be an absolute HTTPS URL, execution mode is `"sync"`, max 32 tools (https://docs.agora.io/en/api-reference/api-ref/conversational-ai/join). Release note v2.12, 2026-09-10: "Declare custom tools for the LLM to call during conversation through the RESTful API." |
| **868khqaqj** Manage structured outputs as reusable resources | Q3 export row 224: Module **Studio**, level **2**, **P0**, type Dev Experience, no due date. The only other mention of structured output in the export is a separate Engine row, "Reduce structured output generation cost (Taiwan Survey)", which is a cost ticket, not this one. | No acceptance criteria written. Nothing in `references/` describes what "reusable resource" means here, and the word "structured output" appears in Agora's own docs only as function calling (see §Agora fact-check). This row is the least specified of the five and the most likely to be misread. |
| **868kykbfa** Run hosted code tools inside Studio agents | Q3 export row 198: Module **Studio**, level 1, **P2**, type **Feature Request**, no due date. The adjacent Engine ticket is "[O5.1-T8.a] Evaluate code-defined pipelines (Cresta)", tracked separately in `TODO-Q3-ROADMAP.md` :45 as "Decide whether Convo AI should support dynamic code-defined pipelines — P2 · Cresta", i.e. still a decision, not a build. | No acceptance criteria written. No Agora primitive exists (see §Agora fact-check). P2 and undated while the other four are P0/P1. |

## What the product has today

Two codebases hold this feature and they disagree about what it is. Read both before drawing anything.

### A · The real Console already ships the whole thing (`ng-console`, read-only)

**`/integrations` has four tabs, and one of them is Custom Tools.** `src/routes/integrations.tsx` :26–32 validates `tab` against `connectors · custom-tools · knowledge-bases · mcp-servers`, defaulting to `knowledge-bases`. The tab list itself is `src/components/console/integrations-page.tsx` :135–160: Knowledge bases (UploadCloud) · MCP servers (Network) · **Custom Tools** (Wrench) · Connectors (Plug). Copy at `src/lib/i18n/resources/en/common.ts` :2764–2767: "Studio v2 custom HTTP tools available to attach to saved agents." and "Create a custom HTTP tool to reuse it across your agents."

**The no-code HTTP tool form exists, in three named sections.** `CustomToolsPanel` at `integrations-page.tsx` :1361, rendered in a `FormSheet` with `FormSheetSection` titles from `common.ts` :2886–2890: **General** · **HTTP request** · **Agent function**.
- General (:1719–1786): Name · Description · Status select, `available` or `unavailable` (`common.ts` :2891–2894).
- HTTP request (:1787–1887): Method select over `GET · POST · PUT · PATCH · DELETE` (:168–174) · Timeout (ms) number input, min 1 max 60000 (:1815–1832) · Request URL, `type="url"`, placeholder `https://api.example.com/items/{{id}}` (:1834–1854, `common.ts` :2895) · Headers and Query parameters as repeatable key/value rows via `KeyValueFields` (:1855–1868) · Body template (JSON) textarea (:1869–1886).
- Agent function (:1888–1944): Function name with `pattern="[A-Za-z_][A-Za-z0-9_]{0,63}"` (:1893–1908) · Parameters JSON textarea, seeded `{"type":"object","properties":{},"required":[]}` (:184–185, :1909–1925) · Function description (:1926–1940).

**The form validates more than it looks.** `buildCustomToolConfig` (:2269–2366): URL must parse and be http or https; `timeout_ms` must be finite and inside [1, 60000]; function name must match `^[A-Za-z_][A-Za-z0-9_]{0,63}$`; Parameters JSON must parse, be a non-array object, and have `type === "object"`; the body template must be valid JSON. Then :2330–2348 scans every `{{placeholder}}` across the URL, header values, query values and body template and rejects any name not declared in `parameters.properties`, with the message "Template parameter \"…\" is not defined in Parameters JSON." `customToolToForm` (:2367–2389) round-trips the saved tool back into the form without loss.

**There is a real test door.** Dialog at `integrations-page.tsx` :1946–2020: a "Function input (JSON)" textarea plus optional test headers, a Run test button, and a result block that shows a Success or Failed badge, `HTTP <statusCode>`, and the raw body or error. Backed by `testStudioCustomTool` (`src/lib/agents/studio-custom-tools-api.ts` :148–164) posting to `/api/studio-v2/projects/{projectId}/custom-tools/{toolId}/test`, normalized at `src/server/studio-v2/integrations-handlers.ts` :1395–1409 into `{ success, statusCode, headers, body, error }`.

**The persisted shape is already decided.** `studio-custom-tools-api.ts` :19–31:

```
StudioCustomToolConfig = {
  body_template?, function: { name, description, parameters }, headers?,
  method: "GET"|"POST"|"PUT"|"PATCH"|"DELETE", query_params?, timeout_ms, url
}
```

Tool envelope at :4–15 adds `toolId · name · description · status · type · createdAt · updatedAt · method · url`. `type` is forced to `"custom_http"` on create (`integrations-handlers.ts` :914–919) and stripped on update (:706), so `type` is a server-owned discriminator with exactly one value today. Handlers: list and create :651–682, get/update/delete :685–716, test :718–735.

**MCP servers are a first-class resource with status probing.** `handleStudioV2Mcps` :142–174 (`POST /mcp`, `GET /mcps`), `handleStudioV2McpById` :177–204, `handleStudioV2McpTools` :207–226 (`GET /mcp/{id}/tools`, returns `{ name, description, inputSchema }` per `normalizeMcpTool` :1272–1279), `handleStudioV2McpStatus` :228–244 (`GET /mcp/{id}/status`, returns `{ status, lastDetectedAt, connectivityTest }` per :1281–1294). The stored config (`normalizeMcp` :1212–1250) is `{ endpoint, transport (default "http"), headers, queries, timeoutMs (default 30000), allowedTools[] }` plus `iconUrl · creator · status · lastDetectedAt`.

**Connectors are one provider wide.** `handleStudioV2Connectors` :737–790 accepts `action: "connect" | "disconnect"`, and `requiredProvider` :921–928 throws `INVALID_BODY "provider must be hubspot"` for anything else. The UI catalog at `integrations-page.tsx` :192–238 lists HubSpot as live and Airtable · Jira · PayPal · WhatsApp · Zendesk as `comingSoon: true`. So the "marketplace" today is one working card and five placards.

**Attachment to an agent is a single typed mechanism for all four resource kinds.** `AgentAttachmentKind = "connectors" | "custom-tools" | "knowledge-bases" | "mcp-servers"` (`integrations-handlers.ts` :870–874), one path builder :876–887, one body builder :1482–1509 keyed by kind (`knowledge_base_uuids` · `mcp_server_ids` · `custom_tool_ids` · `connector_ids`), and an MCP-only `PUT` that carries the per-server allowlist (:1512–1525, `{ mcp_server_id, allowed_tools[] }`). Attach is additive POST, detach is DELETE by `attachmentId` (:841–866).

**The agent side is one component with three blocks.** `src/components/console/agent-tools-page.tsx` :71–880. It loads `useStudioMcpServersQuery`, `useStudioCustomToolsQuery`, `useStudioConnectorsQuery` plus the three attachment queries (:81–109). Each block is a select, an attach button, and an `AttachmentCards` list (:896–996) whose card carries Configure tools · Check status · Edit · Detach. Copy: "Attach reusable HTTP tools from your workspace." (`common.ts` :2677) and "Select existing MCP servers and allowed tools for this agent." (:2273). It mounts twice: the agent detail Actions tab (`agent-detail-page.tsx` :747–752, `variant="actions"`) and the editor's tools tab (`agent-editor-workspace.tsx` :752–755, `variant="page"`).

**A rainy state already in the product:** `agent-detail-page.tsx` :266–267 sets `mcpOnlyActions` when the agent is MLLM or default-LLM, which hides Custom Tools and Connectors entirely behind the line "Realtime and Default LLM agents only support MCP servers." (`common.ts` :1967–1968). This is the honesty floor in code, and it is now partly stale: v2.12 gave MLLM agents `mllm.mcp_servers`, so MCP is right, but the reason the other two are hidden is that `llm.tools` does not exist on the MLLM path.

**A second MCP door already exists and it is not the attachment API.** `agent-tools-page.tsx` :145–169 reads and writes `draft.tools.mcpTools`, an inline array of `{ name, url }` pairs living at `properties.mcp_tools` (`src/lib/agents/orchestration-properties.ts` :91–92 read, :180–182 write, contract `orchestration-contracts.ts` :45). So the same page offers "attach a registered MCP server" and "type a name and a URL" side by side. `isToolsOverridden` (:323–331) additionally locks the whole block when Custom Config carries `custom_settings.mcp_tools` or `custom_settings.tools`. Three doors to one action, in shipped code.

### B · The sandbox (`studio_x_2`) has the marketplace shell and none of the tools

**Resources has five tabs and Custom Tools is not one of them.** `app/(dashboard)/integrations/page.tsx` :34 `TABS = ["knowledge", "mcp", "connectors", "credentials", "channels"]`, default `connectors` (:36), rendered :120–126 as Knowledge Base · MCP · Connectors · Vendor Credentials · Deployment Channels. Against the real Console's four (`knowledge-bases · mcp-servers · custom-tools · connectors`) the sandbox is missing the one tab this feature is about, and has added two the real Console keeps elsewhere.

**Connectors is a card gallery over six hard-coded rows.** `lib/campaign-data.ts` :1762–1779: `Connector { id, name, category, description, initials, status: "connected"|"available"|"coming-soon" }`, seeded HubSpot (connected) · Salesforce · Google Calendar · Zendesk · Slack (connected) · Stripe (coming-soon). Rendered through `CatalogCard` (`components/catalog-card.tsx`, four statuses at :18, styles :47–59, coming-soon rendered truly inert with no anchor at :132–135). "Connect" opens a mock OAuth dialog (`integrations/page.tsx` :325–341) and flips a localStorage flag (`lib/agent-resources.ts` :229–249). There is no catalog page, no per-connector detail, no scopes, no auth state beyond a boolean, no tool list behind a connector.

**MCP is a create form plus an enable/disable tool list.** `McpCreateForm` (`components/wizard/step-build.tsx` :542–608): Name · Server URL with `^https?://` validation · Transport toggle `SSE | Streamable HTTP` (`lib/agent-resources.ts` :174–178) · repeatable HTTP header rows · button "Create and discover tools". Discovery is faked: `discoverTools()` (`agent-resources.ts` :197–203) always returns `search · create_record · update_record`. `McpToolsSheet` (`step-build.tsx` :612–648) is a switch per tool saved through `saveMcpTools` (:217–222). Seed servers carry no tool list, so their Configure button is disabled with the title "Sample server · create your own to configure its tools" (`integrations/page.tsx` :254–255). Missing against the real contract: **no query params, no timeout, no status probe, no allowed-tools allowlist persisted to the server record, no `iconUrl`, no last-detected time.**

**The builder section is called "Tools & connectors" and contains no tools.** `SectionKnowledgeTools` (`step-build.tsx` :48–169) renders three `SectionRow`s: `wz-5-kb` Knowledge base (:68) · `wz-5-mcp` MCP servers (:93) · `wz-5-connectors` **Tools & connectors** (:117–163). The third is a count line, a header row, and a switch per connector that is disabled unless the project-level connector is connected, with the inline reason "Connect in Resources" or "Coming soon" (:143–149). The label promises tools; the row only holds connectors. **This is the row the feature extends. It is the sibling, and it already exists.**

**`ResourceField` is the idiom every new attach-a-thing must use.** `step-build.tsx` :194–448. Chips for what is attached, with an attached-but-now-unavailable item flagged destructive rather than shown healthy (:279–295); a Sheet with search (:350–359), a Name/Status roster with a staged switch per row and a Save footer so a dismissed sheet ships nothing (:232–248, :366–425); an Active/Processing badge (:375–385); a per-row overflow menu carrying Configure tools and Delete for user-created items (:395–415); and a "Create New …" door under the roster that swaps the sheet body to a create form (:427–436). `AttachItem` (:174–186) already models `disabled` and `note` for "not attachable yet, and here is why". A custom-tool roster is this component with a different `items` array.

**Structured outputs exist, per agent, under a different name, behind two doors.** `components/wizard/step-analysis.tsx` :25–162 is "Post-Call Data Extraction", copy "Automatically extract structured outputs from calls according to business needs." (:110–112). The object is `DataPoint { id, name, type: text|number|boolean|enum, description, allowedValues? }` (`lib/wizard-draft.ts` :151–159) inside `AnalysisConfig { transcribe, record, successEval, evalCriteria, dataPoints[] }` (:160–169), default-seeded with one "Call Outcome · Boolean" (:171–181). It lives on the agent draft at `AgentDraft.analysis` (:449) and is gated on transcription (:119–123). The **second door** is `components/call-capture-sheet.tsx` :20–58, which mounts the exact same `StepAnalysis` from Monitor and writes a different key, `sx:call_capture:agt_default` (:20), deliberately not the builder draft (:12–19). Results render read-only in `components/call-detail-sheet.tsx` :392 (a "Structured Output" tab) and as optional columns in `app/(dashboard)/calls/page.tsx` :109–125, :314–321. **So "structured outputs" today are: agent-scoped, not project-scoped; not reusable; not shareable between agents; and already split across two write surfaces with two storage keys.** That is what 868khqaqj has to fix, and the fix is a resource type plus one door, not a new editor.

**Nothing in the sandbox is a hosted code tool.** No sandbox, no runtime, no editor, no language picker, no execution log. The nearest thing is `components/custom-config-drawer.tsx` :26–167, a JSON override drawer whose section list (`lib/wizard-draft.ts` :106–119) is `asr · llm · tts · avatar · turn_detection · interruption · conversation · sal` and does **not** include `llm.tools`, `llm.mcp_servers` or `mcp_tools`. A tool typed into that drawer today would be silently dropped by `customConfigSections` (:123–129).

**Extensions is a separate, older marketplace.** `app/(dashboard)/extensions/page.tsx` :14–69 is a six-item hard-coded catalog (Cloud Recording · ActiveFence · Spatial Audio · Real-Time Transcription · AI Noise Cancellation · Sentiment Analysis) with All and Installed tabs and a per-item detail page (`extensions/[name]/extension-client.tsx`, 324 lines, one scroll, no tabs). It uses its own `ExtensionCard` (:71–108) rather than `CatalogCard`, so two marketplace card shapes already exist in one app. CLAUDE.md lists this as open IA tension #3.

### What is missing, plainly

1. No Custom Tools resource anywhere in `studio_x_2`: no tab, no list, no form, no test, no attach row, no data type.
2. No test-before-publish for any tool, MCP or HTTP, in the sandbox. The real Console has one for HTTP tools only.
3. Structured outputs are not resources: they are a field on one agent, editable from two places.
4. No hosted code tool, and no Agora primitive to build one against.
5. The connector catalog has no detail view, no scopes, no auth state and no tool list, so "browse catalog, install, agent gains the tool without manual config" cannot be honoured by the current data type.
6. Custom Config cannot express any of this, so a power user has no escape hatch for `llm.tools`.

## Agora fact-check

Installed SDK read: `agora-agents@2.4.0` at `/Users/shaktisoni/Documents/Agora Design & FE/ng-console/node_modules/agora-agents/dist/cjs/`. **The SDK is eight releases behind the contract** (latest is v2.12, 2026-09-10), so the SDK is evidence of what was true in February, not of what ships now. Both are cited below and the gap is itself a finding.

### What the Engine contract exposes today

| Primitive | Field | Source |
|---|---|---|
| Custom HTTP tool | `llm.tools[]`, array, **max 32 items** | https://docs.agora.io/en/api-reference/api-ref/conversational-ai/join |
| Tool item | `type: "function"` (only value) · `function.name` "Must start with a letter and contain only letters and numbers, 1 to 64 characters long" · `function.description` min 1, max 1024 · `function.parameters` "JSON Schema with root type as object" · `function.execution.mode: "sync"` (default) · `function.server` required | same |
| Tool transport | `function.server.method`: `"GET"` or `"POST"` **only** · `server.url` "Absolute HTTPS URL, min 1, max 2048 characters" · `server.headers` "Up to 32 entries" · `server.body` "For POST only" · `server.timeout_ms` "Range [1000, 100000], default 10000" | same |
| Master switch | `advanced_features.enable_tools`, boolean, default `false`. "When `false` or omitted, tools are still validated but not invoked. Maximum 32 total tools exposed to LLM after filtering." | same |
| MCP (cascade) | `llm.mcp_servers[]`: `name` "Max 48 characters, English letters and numbers only" · `endpoint` · `transport: "streamable_http"` · `headers` · `allowed_tools` "Empty array disables all; omitted/empty enables all" · `timeout_ms` | same |
| MCP (realtime) | `mllm.mcp_servers[]`, identical shape. New in v2.12. | https://docs.agora.io/en/ai/release-notes |

Release note v2.12, **September 10, 2026**, verbatim: "Declare custom tools for the LLM to call during conversation through the RESTful API. Set `advanced_features.enable_tools` and declare tool's name, description, parameters, and synchronous `GET` or `POST` HTTPS endpoint using `llm.tools` parameter." and "MLLM agents now support MCP tool-use. Configure `mllm.mcp_servers` and set `advanced_features.enable_tools` to `true`." New parameters listed for the join API: `llm.tools`, `mllm.mcp_servers`. Updated: `advanced_features.enable_tools`.

Release note v2.4, **February 2, 2026**: "Connect LLM to MCP server via `llm.mcp_servers` field. Set `advanced_features.enable_tools` to `true` to enable tool calls."

### What the installed SDK actually types (and does not)

- `dist/cjs/api/types/Llm.d.ts` :44 · `mcp_servers?: Record<string, unknown>[]`, comment "MCP server configuration." **Untyped bag.** There is no `tools` field on `Llm` at all; the interface closes with `[key: string]: any` (:47), so `llm.tools` passes through untyped.
- `dist/cjs/agentkit/types.d.ts` :213–214 · `export type McpServersItem = Record<string, unknown>` with the comment "MCP server config item (`llm.mcp_servers[]`)". The friendlier agentkit layer types it no better.
- `dist/cjs/agentkit/types.d.ts` :383–384 · `mcp_servers?: McpServersItem[]`, "MCP server configurations enabling the agent to call tools from external services".
- `dist/cjs/api/resources/agents/client/requests/StartAgentsRequest.d.ts` :160–161 · `enable_tools?: boolean`, "Enable tool invocation. When enabled, the agent can invoke tools provided by the MCP server to implement advanced functionality." **That description is now wrong**: as of v2.12 the same flag also gates `llm.tools`, which are not MCP.
- `dist/cjs/api/types/Mllm.d.ts` has no `mcp_servers` field (v2.12 added it after 2.4.0).
- `OpenAiLlmParams` · `GeminiLlmParams` · `AnthropicLlmParams` · `DifyLlmParams` (`agentkit/types.d.ts` :282–353) type `model · max_tokens · temperature · top_p` and then `[key: string]: unknown`. **No `tools`, no `tool_choice`, no `response_format`.**
- Grepping the whole `dist/cjs` for `tools|mcp|tool_choice|function_call` across every `.d.ts` returns exactly the six hits above. Nothing else.

**Conclusion for the builder:** design against the REST contract, not the SDK. If the prototype writes anything, it writes `llm.tools` / `llm.mcp_servers` / `mllm.mcp_servers` / `advanced_features.enable_tools` as raw properties, and the SDK's `Record<string, unknown>` accepts them silently.

### Studio's own documented surface

https://docs.agora.io/en/ai/studio/build/integrations documents five sections: **Credentials · Knowledge bases · MCP servers · Custom tools · Connectors.** Verbatim: "Custom tools let you define reusable HTTP tools for your agents." and "Configure the request, function schema, and optional body template." MCP fields documented: Name · Endpoint URL · **Protocol (SSE or HTTP)** · Timeout (ms), "If the server does not respond within this duration, the agent stops waiting" · HTTP Headers · Query Parameters. Connectors: HubSpot only, "Connect HubSpot and attach it to agents that need contact and ticket workflows."

https://docs.agora.io/en/ai/studio/build/custom-tools carries the limits the Console form enforces, verbatim: method "Defaults to `GET`"; Request URL "Supports placeholders such as `https://api.example.com/items/{{id}}`", and host names cannot contain placeholders; Timeout "Defaults to `30000`"; headers "Sensitive header names such as `Authorization`, `api-key`, `token`, `secret`, and `cookie` are treated as secrets"; Body template "An optional JSON payload sent in the request body. Defaults to `{}`"; Function name "Use letters, numbers, and `_`. Must start with a letter or `_`"; "Placeholder names must match parameter names from **Parameters (JSON Schema)**. Host names cannot contain placeholders. Unknown placeholders are rejected when you save the tool."

Note the two contracts disagree and the Console follows the looser one: Studio accepts `GET · POST · PUT · PATCH · DELETE` and a 60000 ms ceiling; the Engine's `llm.tools[].function.server.method` accepts **`GET` or `POST` only** with timeout range [1000, 100000] and default 10000. A tool saved as `DELETE` in Studio has no representation in `llm.tools`.

https://docs.agora.io/en/conversational-ai/studio/build/customize-agent documents the agent editor as four tabs, **Prompt · Models · Advanced · Actions**, with the Actions tab holding Knowledge base ("+ Add Knowledge Base"), MCP servers ("+ Add MCP Server"), Custom tools ("+ Add Custom Tools", described as "call reusable HTTP endpoints that you defined in **Integrations**"), and Connectors ("Attach HubSpot when your agent needs CRM contact or ticket workflows"). This is the shipped IA the sandbox's "Knowledge & Tools" section is a fork of.

### Where the API exposes nothing

- **Structured outputs as a resource: no field.** The join contract has no `response_format`, no output schema, and no post-call extraction block; the SDK has none either; the customize-agent page makes no mention of structured outputs. The only structured-output primitive Agora documents is function calling itself, which "enables the model to return structured data in the form of function calls". Post-call data lives in call history and the `112 turns finished` event, not in a declared schema. **Requires Engine.**
- **Hosted code tools: no field.** Nothing in the contract executes customer code; `llm.tools[].function.execution.mode` has the single value `"sync"` and `server` is required, so every tool is an outbound HTTPS call to something the customer hosts. The related Engine work is still a decision, not a build ("Decide whether Convo AI should support dynamic code-defined pipelines — P2 · Cresta", `TODO-Q3-ROADMAP.md` :45). **Requires Engine.**
- **Native connector catalog: no field, and one provider.** There is no connector primitive in the Engine contract at all. A connector is a Studio-layer OAuth record (`integrations-handlers.ts` :737–790) that presumably compiles down to tools, and the server refuses every provider but `hubspot` (:921–928). A marketplace of N vendors is a backend roadmap item, not a design constraint we can design past. **Requires Engine for anything past HubSpot.**
- **Async or long-running tools: no field.** `execution.mode` is `"sync"`, timeout ceiling 100000 ms. An action that takes two minutes has no representation.
- **Per-tool cost or latency: no field**, and per the standing pricing fact there is nothing to show: the Engine is a flat $0.10 per agent-minute. A tool that takes eight seconds costs the customer 8 seconds of agent-minute and nothing else. Do not design a control whose premise is that a tool changes the bill.

## Already decided

- **Reuse, don't redesign (owner, 2026-09-12, memory `feedback_reuse_not_redesign`):** "things that belong together live together and look the same … extend the existing row/field/sheet, one door per action, no control for what Agora does by default". The existing row is `SectionRow id="wz-5-connectors"` labelled "Tools & connectors" (`step-build.tsx` :117); the existing sheet idiom is `ResourceField` (:194); the existing card is `CatalogCard` (`catalog-card.tsx` :61). None of them get a sibling.
- **v6 builder lock (LEARNINGS.md :523, owner, emphatic, commit `26a5c68`), item 4:** "**KB/MCP/connectors upfront** in Context — no nesting/collapsible." A Custom Tools row joins that group at the same level; it does not hide inside MCP or inside an Advanced fold.
- **v6 item 3:** the Advanced sheet "hosts a **Custom config (JSON)** door". That door is the escape hatch for anything the visual form cannot express.
- **F4 fact-check (`references/roadmap-activation-strategy-2026-07-09.md` :90):** "Function/tool-calling and **MCP are already supported** … Marketplace = a **discovery/1-click-install UI** over an existing capability. Lower risk than it looks." Do not scope a marketplace as if MCP needed building.
- **B3 surface lock (`references/roadmap-activation-strategy-2026-07-09.md` :428, :445):** the marketplace lives in **Resources (`/integrations`)**, "it's already the shared resource library. The Connector Marketplace is its flagship expansion." Not a new sidebar item.
- **Open IA tension #3 (CLAUDE.md, "do litigate"):** "**Integrations** (agent-scoped: KB · MCP · CRM connectors) vs **Extensions Marketplace** (project-scoped: Cloud Recording, Spatial Audio, ActiveFence) — labels don't make the distinction clear." Adding a second marketplace to Resources without settling this makes it worse.
- **Copy discipline (CLAUDE.md, standing 2026-08-10):** "never ADD UI text without asking … max ONE short line under a control". Propose every string in `05-directions.html` first. No em dashes, no arrows, verb titles in sentence case, no prose in a disabled input.
- **Control strokes (CLAUDE.md, P0 2026-08-10):** every input, select, textarea, switch boundary uses `border-stroke`, both themes.
- **Honesty floor:** "Not supported by <vendor>" is a real state. The Console already does this with `mcpOnlyActions` (`agent-detail-page.tsx` :266); the design keeps that behaviour rather than hiding the reason.
- **Pricing fact:** flat $0.10 per agent-minute, unchanged by BYO key. No control may imply a tool changes the Agora bill.
- **07 / 03 prototype mechanics:** build additive on `design/sandbox`, one planner module plus one row component plus tests plus an eight-line mount plus one i18n block; API-less draft state in `sessionStorage` per agent; every string through `useTranslation("common")`.

## Open questions for the owner

Not marked ⚠ lock, but three of these change the shape of the work, not its detail.

1. **Do we design the sandbox's version, or the Console's?** The real Console already ships Custom Tools, MCP and connector attachment, and `studio_x_2` does not.
   - *Port the shipped surface into the sandbox first, then improve it.* The Before is real, stop 4 has something to show, and the design is a critique of a live product. Costs a porting slice before any new thinking.
   - *Design in the sandbox as if it were greenfield.* Faster to a picture, but it will land beside a shipped Console surface it contradicts, and the "reuse, don't redesign" rule is broken at the repo level.
   - *Build the prototype directly on `design/sandbox` in `ng-console`, extending `integrations-page.tsx` and `agent-tools-page.tsx`.* Matches the protocol's rule that a surface which exists in the live Console is prototyped there. This is my recommendation and it makes the sandbox port unnecessary.

2. **What is a "structured output as a reusable resource" (868khqaqj)?** Nothing in `references/` defines it and Agora has no field.
   - *A project-level schema library.* A named `DataPoint` set becomes a resource with its own row in Resources, attached to N agents exactly like a knowledge base. Kills the two-door problem in `step-analysis.tsx` and `call-capture-sheet.tsx`, and the write is Studio-side only.
   - *A response-format contract on the LLM.* Forces the agent to reply in a schema mid-call. There is no `response_format` in the join contract, so this is Requires Engine and cannot ship.
   - *The output half of a tool.* Every tool's `function.parameters` JSON Schema is already a reusable object; "manage structured outputs" could mean one schema library shared between tool inputs and call extraction. Cheapest to build, hardest to name.
   The answer decides whether this task is a resource type, an Engine ask, or a rename.

3. **Does 19 own the Custom Tools surface, or does 20 · Knowledge sources?** Task 868khqaqj is currently the only thing pulling call analysis into this feature, and analysis lives in the builder's Analysis section, not in Tools.
   - *19 owns tools and connectors only; structured outputs move to the feature that owns post-call analysis.* Keeps this brief's scope tight.
   - *19 owns it as written.* Then stop 5 has to diverge on two unrelated objects in one feature.

4. **Method set: follow the Engine or the Console?** Studio's form offers `GET · POST · PUT · PATCH · DELETE`; `llm.tools[].function.server.method` accepts **GET or POST only**.
   - *Restrict the picker to GET and POST and say why.* Honest, matches the contract, and breaks any tool already saved as PUT or DELETE in the real Console.
   - *Keep five methods and mark the three the Engine cannot run.* Dead-not-hidden, consistent with 07's ineligible-backup idiom, but ships a form that can save a tool that never fires.
   - *Keep five and treat it as an upstream bug to file.* Needs someone to confirm whether the Studio backend down-converts.

5. **Hosted code tools (868kykbfa, P2): design now or park?** There is no Agora primitive, and the adjacent Engine ticket is still a decision.
   - *Park it, and record "Requires Engine" in the tracker.* Honest, and the other four tasks are P0/P1 anyway.
   - *Design the inert shell now* (a third kind beside HTTP and MCP, disabled with a reason), so the IA has a slot when it lands. Risks a control for something that may never exist.

6. **Connector marketplace: how honest is the catalog?** HubSpot is the only provider the server accepts; the Console shows five "coming soon" cards and the sandbox shows four fake-connectable ones.
   - *Show one card.* Truthful, and a one-card marketplace is not a marketplace.
   - *Show the roadmap as coming-soon cards, inert, as the Console already does.* Sets expectation, matches `CatalogCard`'s existing `coming-soon` state which is already non-focusable (`catalog-card.tsx` :132–135).
   - *Lead with "Add your own" and treat native connectors as a shelf below it.* Makes the MCP and HTTP escape hatches the product, which is what the F4 fact-check says the capability actually is.
