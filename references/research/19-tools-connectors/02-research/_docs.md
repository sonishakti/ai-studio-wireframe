# 19 · Tools & connectors · the four vendors, from their public docs (2026-09-17)

Stop 2, docs half. Every claim below is from a page I fetched or a search result I name as such;
the signed-in product is captured separately by a browser agent from the shot list at the end of
this folder's handoff. Where a page would not render the field list, I say so rather than fill it in.

The question asked of all four: **how does a user give an agent the power to act on another system
without writing code, and where does the thing they made live afterwards?**

Five vendors are covered. The fifth, Zapier MCP, is here because three of the four voice vendors'
own docs point at it when a customer asks for a connector catalog, and because it is the shape our
B3 card ("1-click install, auto tool-binding, BYO-MCP escape hatch") would actually take if it
shipped honestly this quarter. It is a component of the other four, not a competitor to them.

---

## Vapi

**What it is called:** **Tools**, a top-level item in the left sidebar of the dashboard, with a
**Create Tool** button. The dashboard calls the no-code kind a **Custom Tool**; the API calls the
same record `function` (https://docs.vapi.ai/tools/custom-tools). The list is workspace-level and
the docs say tools "can be reused across multiple assistants" once created there
(https://docs.vapi.ai/tools/custom-tools). An assistant carries a `tools` array; the tool itself is
not inside it.

**The shape of the control.** Two different no-code HTTP objects, and the difference matters:

- **Custom Tool** (`function`): the dashboard form is **Tool Configuration** (Tool Name, Function
  Name, Description, Parameters as JSON schema, Server URL), **Messages** (Request Start, Request
  Complete, Request Failed, Request Delayed), **Advanced Settings** (Async Mode, Timeout Settings,
  Error Handling). It does not call your API directly: it "Sends Vapi's `tool-calls` webhook to a
  server you control" (https://docs.vapi.ai/tools). So the customer still hosts something.
- **API Request tool** (`apiRequest`): the one that is genuinely no-code. It "Sends requests to an
  HTTPS URL", method is **"GET, POST, PUT, PATCH, and DELETE"**, `timeoutSeconds` "accepts 1–300
  seconds" and "Uses 20 seconds by default", it "Waits synchronously for the destination API before
  returning a result", it "Does not retry unless `backoffPlan` is configured", and it reads values
  back out with a `variableExtractionPlan` that "requires a JSON response". Credentials are a
  separate reusable record referenced by `credentialId`
  (https://docs.vapi.ai/tools/api-request). URL, headers and static body fields accept "fixed
  values and Liquid templates".

**Structured outputs are a first-class reusable resource, and Vapi is the only one of the four.**
"A structured output is a reusable definition you create once and attach to an assistant"
(https://docs.vapi.ai/assistants/structured-outputs-quickstart, via search result). Fields: `name`
(40 characters), `description`, `type: "ai"`, `schema` (full JSON Schema, including objects,
arrays, enum, `format`, regex `pattern`, and `if/then/else`), `model` (defaults to GPT-4.1, prompt
may reference `{{transcript}}`, `{{endedReason}}`, `{{duration}}`), and `conditions` that gate when
it runs (`minMessages`, `minCallDuration`, `endedReason`). It attaches through
`artifactPlan.structuredOutputIds`, several per assistant, each appearing under its own UUID key in
the result (https://docs.vapi.ai/assistants/structured-outputs). There is a **Run Structured
Output** endpoint, so a schema can be exercised against a past call without placing a new one
(https://docs.vapi.ai/api-reference/structured-outputs/structured-output-controller-run).
Stated limit: "Extraction occurs after call completion (not real-time)."

**MCP.** One tool named `mcpTools`, fields `server.url` and `server.headers`, and
`metadata.protocol` of `"shttp"` (default, "Uses Streamable HTTP protocol") or `"sse"`
(deprecated). No allowlist: "The tools available through MCP are determined by your MCP server
provider." The docs warn that a server's response "may return large amounts of data. This can
exceed model context limits". The example server URL in the docs is
`https://mcp.zapier.com/api/mcp/s/********/mcp`, and the page says to treat that URL "as a
credential" (https://docs.vapi.ai/tools/mcp).

**Native connectors: four.** Google Calendar, Google Sheets, Slack, GoHighLevel. The framing is
exactly the one B3 asks for: they are "prebuilt: you connect the account once, configure what the
tool is allowed to do, and add it to an assistant" (https://docs.vapi.ai/tools/integrations).

**What they refuse.** HTTPS only. No asynchronous execution on `apiRequest`. No automatic retry
without an explicit `backoffPlan`. No documented cap on tools per assistant.

**Test door.** There is no dashboard test button in the docs. The CLI has one, `vapi tool test
<tool-id>` (https://docs.vapi.ai/tools/custom-tools). Failures are read afterwards in call logs,
and the troubleshooting page lists the strings to look for: "ok, no result returned", "Tool call ID
mismatches", "Schema validation errors", "Token truncation warnings"
(https://docs.vapi.ai/tools/custom-tools-troubleshooting).

**Built-ins that are not tools you build:** `transferCall`, `endCall`, `sms`, `dtmf`, `apiRequest`
(https://docs.vapi.ai/tools/default-tools).

---

## Retell AI

**What it is called:** two surfaces, deliberately at two different scopes.

1. **Integrations**, a workspace page with an **Available** list. "Connect a provider once on the
   dashboard's Integrations page, and every agent in your workspace can use its tools"
   (https://docs.retellai.com/integrations/overview).
2. **Functions**, a section inside each agent, reached by **+ Add**. Everything you build yourself
   lives here, per agent.

**The connector catalog is the largest of the four: eleven providers, in four categories**
(https://docs.retellai.com/integrations/overview).

| Category | Providers | How you connect |
|---|---|---|
| CRM | HubSpot · Salesforce · Microsoft Dynamics 365 · GoHighLevel · Zoho CRM | private app token · OAuth · OAuth · API key + Location ID · OAuth |
| Support | Zendesk | OAuth + Zendesk URL |
| Knowledge base | Google Drive · Microsoft OneDrive · Notion | Google OAuth · Microsoft OAuth · API key |
| Calendar | Calendly · Cal.com | API key · API key |

Auto tool-binding is stated plainly: once connected, "tools show up when you add a function to an
agent", in both the prompt agent's Functions section and the conversation flow's function node.
Each tool binds to a specific connection instance, so a workspace can hold two HubSpot accounts.

**No-code HTTP tool: Custom Function.** Agent > Functions > + Add > **Custom Function**
(https://docs.retellai.com/build/single-multi-prompt/custom-function). Fields, with the doc's
labels: **Name** (letters and underscores only) · **Description** · **HTTP method** (GET, POST,
PUT, PATCH, DELETE; defaults to POST) · **API Endpoint** · **Timeout (ms)** · **Request headers**
(optional) · **Query parameters** (optional) · **Parameters** (JSON schema or form editor) ·
**Payload: args only** · **Store Fields as Variables** · **Talk While Waiting** (off by default) ·
**Talk After Action Completed** (on by default). Limits: timeout 1,000 to 600,000 ms, default
120,000; retries 0 to 5, default 0; the response is "capped at 15,000 characters by default before
handing it to the LLM". Refused: "blocks requests to localhost, private IP ranges, and cloud
metadata addresses".

**Hosted code tool: they ship one.** Agent > Functions > + Add > **Code**
(https://docs.retellai.com/build/single-multi-prompt/code-tool). JavaScript in a **QuickJS
sandbox** on Retell's infrastructure. Name 1 to 64 characters, Description up to 1,024, code up to
**20,000 characters**, timeout **5 to 60 seconds, 30 by default**, result to the agent capped at
15,000 characters, no retries. The code sees `dv` (dynamic variables, all strings) and `metadata`,
and can call `fetch()`; there is no `require`, no `import`, no Node modules, no browser APIs, no
`Intl`. Outbound requests leave from a single fixed IP, `35.166.138.221`, which is what makes the
customer's firewall allowlist possible. The editor has a **Dynamic Variables** panel for test
values and a **Run Code** button, with `console.log` output shown below the editor and marked as
not affecting live agents.

**MCP.** Agent > **MCPs** > **Add MCP**
(https://docs.retellai.com/build/single-multi-prompt/mcp). Fields: **Name** · **URL** (masked by
default) · **Headers** (optional, supports dynamic variables) · **Query Parameters** (optional,
supports dynamic variables) · **Timeout** · **Tool Selection**, a dropdown that picks which of the
server's tools the agent may call. Streamable HTTP only: "The server URL must be publicly reachable
over `http` or `https`", and "Retell rejects any other protocol". Also refused: localhost, private
ranges, cloud metadata, and **interactive OAuth flows**, so only static credentials in headers or
query params work. Responses capped at 15,000 characters.

**Structured outputs are per agent.** The tab is **Post Call Extraction**, and a field is Name ·
Description · one of four types: **Boolean Analysis · Text Analysis · Number Analysis · Selector
Analysis** (Choices only on Selector)
(https://docs.retellai.com/features/post-call-analysis-create). Nothing in the docs makes a
definition reusable across agents. Analysis can be re-run over past calls
(https://docs.retellai.com/features/rerun-call-analysis, via search result).

---

## ElevenLabs (Agents Platform)

**What it is called:** **Tools**, and as of the current docs a tool is a **workspace record**, not a
field on an agent. "Every tool that previously lived in `prompt.tools` now exists as a standalone
record, and its ID is present in the agent's `prompt.tool_ids` array"
(https://elevenlabs.io/docs/eleven-agents/customization/tools/agent-tools-deprecation, via search
result; the page 404s on direct fetch but the text is quoted in ElevenLabs' own search index and
matches the API reference at https://elevenlabs.io/docs/eleven-agents/api-reference/tools/list).
This is the single most relevant migration in this teardown: they moved from per-agent tools to
shared tools on purpose, and published a deprecation page to walk customers across.

**Five kinds** (https://elevenlabs.io/docs/eleven-agents/customization/tools): Client tools
("executed directly on the client-side application") · Webhook tools ("call external APIs through
webhooks") · Code tools ("custom JavaScript executed in a sandboxed environment on ElevenLabs'
infrastructure") · MCP tools · System tools ("built-in tools provided by the platform").

**Webhook tool** (https://elevenlabs.io/docs/eleven-agents/customization/tools/webhook-tools):
Name · Description · Method (GET, POST, PUT, PATCH) · URL with **path parameters in curly braces**,
`/api/resource/{id}` · Query parameters · Body parameters · Headers · Content Type (JSON or
URL-encoded) · Dynamic variable assignment, to "update from the tool response for later use in the
conversation". Authentication is not a header you retype: "Configure authentication by adding
custom headers or using out-of-the-box authentication methods through **auth connections**", and
the supported kinds are OAuth2 Client Credentials, OAuth2 JWT, Basic, Bearer, Custom Headers. The
page does not document a response timeout or a test button, so the shot list asks for both.

**Environment variables are the part nobody else has**
(https://elevenlabs.io/docs/eleven-agents/integrate/environment-variables). A workspace-scoped
record with "a label and a set of per-environment values", of three types: **String** ("Plain text
values that vary per environment"), **Secret** ("References to workspace secrets, resolved per
environment"), **Auth connection** ("References to auth connections, resolved per environment").
Tools reference them as `{{system__env_<label>}}`, usable in webhook tool URLs and headers, MCP
server URLs, headers and auth, custom LLM config, and pre-call and post-call webhook URLs. One
guard is worth stealing outright: "URLs must begin with `https://` before any environment variable
references", so a placeholder can never inject a protocol. Labels are alphanumeric and underscores;
resolution falls back to the `production` value when an environment has none.

**Code tools: JavaScript on their infrastructure, enterprise only**
(https://elevenlabs.io/docs/eleven-agents/customization/tools/code-tools). The code is "a
JavaScript module that exports a single default async function". The editor has a **Params** tab
(data type, identifier, description), a context-object section that maps secrets, config values and
auth connections, and a **Run** button that shows parameter inputs, output, `console.log` /
`console.warn` / `console.error` lines and timing. Timeout: "each run must complete within the
tool's configured response timeout, from 1 up to 30 seconds". No npm dependencies. Network access
is restricted to domains allowlisted in workspace settings. Secrets never reach the code or the
agent: "injection happens on egress and exclusively in the headers".

**MCP is workspace level with an approval model nobody else ships**
(https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp). A workspace flag,
`can_use_mcp_servers`, gates the feature; servers are then shareable resources that agents attach.
Fields: **Name** ("The name of the MCP server") · **Description** · **Server URL** · **Transport**
(SSE or HTTP streamable) · **Secret Token** (optional, "Authorization header value") · **HTTP
Headers**. Three approval modes: **Always Ask (Recommended)** ("Maximum security. The agent will
request your permission before each tool use."), **Fine-Grained Tool Approval** (per tool:
auto-approved, requires approval, or disabled), **No Approval**. The honesty line is on the page:
"By enabling MCP server integrations, you acknowledge that this may involve data sharing with
third-party services not controlled by ElevenLabs", and "You are responsible for the security,
compliance, and behavior of any third-party MCP server you integrate"
(https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp/security).

**Structured outputs are per agent and capped.** **Data collection** extracts typed fields from the
transcript after the call, limited to "40 per agent for Trial and Enterprise plans, and 25 per agent
for other plans", with a sibling **Evaluation criteria** limited to 30 per agent; each item may
override the workspace `analysis_llm` (default `gemini-2.5-flash`)
(https://elevenlabs.io/docs/eleven-agents/customization/agent-analysis/data-collection, via search
result).

**The connector catalog is a marketing page, not a product surface.**
https://elevenlabs.io/agents/integrations claims "over 400 pre-configured integrations" across nine
categories (Automation, CRM, Customer Support & CX, Data Platform, Inference Provider, Payment,
Retail, Scheduling & Communication, Telephony) and names Zapier, n8n, Make, Salesforce, Zendesk,
Airtable, Stripe, Shopify, Slack, Calendly, Twilio, Amazon Connect. Most entries are setup guides
that end in a webhook tool or an MCP URL. The exception is Cal.com, which is native: "If you're
using the native Cal.com integration, the tools are configured automatically", with "no manual
webhook setup" needed (https://elevenlabs.io/docs/agents-platform/guides/integrations/cal-com, via
search result). **This is the trap our B3 card is closest to**: a catalog whose card count is a
content-marketing number and whose install step is "read this page and build a webhook tool".

---

## LiveKit (Agents)

LiveKit answers this job twice, at two altitudes, and the seam between them is the most useful
thing in this teardown.

**In the SDK, a tool is a Python function.** "Function tools: Tools that are defined as functions
within your agent's code base and can be called by the LLM", with the schema "derived from the
Python signature and docstring", plus `RunContext` for session access, `ToolError` for failures,
and dynamic tools by setting "the tools list directly"
(https://docs.livekit.io/agents/logic/tools/). MCP is a code-level attachment, `mcp_servers` on
`AgentSession`, "Python only", where "URLs ending with 'mcp' use streamable HTTP transport, while
URLs ending with 'sse' use Server-Sent Events" (https://docs.livekit.io/reference/python/livekit/
agents/llm/mcp.html, via search result). There is no dashboard path to any of this.

**In the cloud dashboard, there is now a no-code builder.** **Agent Builder**, reached by
"selecting **Deploy new agent** in your project's Agents dashboard", at
https://cloud.livekit.io/projects/p_/agents. It "lets you prototype and deploy simple voice agents
through your browser, without writing any code" (https://docs.livekit.io/agents/start/builder/).

It supports exactly three tool kinds:
- **HTTP tools.** HTTP method (GET, POST, PUT, DELETE, PATCH) · endpoint URL with optional path
  parameters · Parameters, used as query or JSON body · Headers, which "support secrets and
  metadata" · a **Silent mode** option. The docs do not list a separate name or description field
  for an HTTP tool.
- **Client tools**, which "connect to client-side RPC methods to retrieve data or perform actions".
- **MCP servers**: server name, URL, optional headers with secrets and metadata support.

**The test door is the whole product.** "The Agent Builder includes a live preview mode to talk to
your agent as you work on it", and preview sessions "use your project's inference credits but don't
count against general usage". Separately, the **Agent Console** in the cloud dashboard is "a
built-in tool ... for testing, debugging, and monitoring agents in real-time"
(https://docs.livekit.io/agents/start/playground/, via search result).

**What they refuse, stated as a list rather than hidden.** The builder "doesn't support" workflows,
handoffs, tasks, virtual avatars, vision, realtime models, model plugins, or tests, and is "not
intended to replace the LiveKit Agents SDK". The exit is a first-class control: "At any time, you
can convert your agent to code by choosing the **Download code** button", which produces a complete
Python project. No native connector catalog exists at all: the integrations LiveKit lists are STT,
LLM, TTS and realtime providers, not business systems.

**Structured outputs:** nothing. You write the extraction yourself.

---

## Zapier MCP (the fifth, and why)

Added because it is the answer three of the four vendors give when a customer asks for a connector
catalog, and because it changes what our marketplace has to be. One server URL,
`https://mcp.zapier.com/api/v1/connect`, fronts "30,000+ actions across 9,000+ apps"
(https://zapier.com/mcp, https://zapier.com/blog/zapier-mcp-guide/). Setup is "code-free", per-tool
selection happens on Zapier's side, and it bills two Zapier tasks per tool call, so the money stays
on Zapier's ledger, not the voice vendor's. Vapi's MCP page uses a Zapier MCP URL as its worked
example. ElevenLabs' integrations page leads with Zapier, n8n and Make. Retell's MCP page describes
exactly the client half this needs. The consequence for us is in learning 3.

---

## The comparison, on the six dimensions that decide our design

| | **Vapi** | **Retell** | **ElevenLabs** | **LiveKit** |
|---|---|---|---|---|
| **Where a tool lives** | Workspace **Tools** list, reused across assistants | **Split**: connectors workspace-level, custom functions and code **per agent** | Workspace record, agent holds `prompt.tool_ids`; migrated off per-agent tools on purpose | SDK: in your repo. Builder: inside one agent |
| **No-code HTTP tool** | `apiRequest`: GET/POST/PUT/PATCH/DELETE · 1 to 300 s, default 20 · Liquid templates · `backoffPlan` retries · `variableExtractionPlan` | Custom Function: GET/POST/PUT/PATCH/DELETE · 1 s to 10 min, default 2 min · retries 0 to 5 · response capped 15,000 chars | Webhook tool: GET/POST/PUT/PATCH · `{path}` params · auth connections (OAuth2, JWT, Basic, Bearer) | Builder HTTP tool: GET/POST/PUT/DELETE/PATCH · headers with secrets · Silent mode |
| **Native connector catalog** | 4: Google Calendar · Google Sheets · Slack · GoHighLevel | **11** with OAuth and multiple accounts per provider, and tools that appear by themselves | 1 native (Cal.com) behind a 400-item marketing page | **0** |
| **MCP** | Tool-level, shttp or sse, **no allowlist** | Agent-level, streamable HTTP only, **Tool Selection** dropdown, no OAuth | Workspace-level, SSE or streamable, **three approval modes** plus per-tool approval | Code: `mcp_servers`, Python only. Builder: name, URL, headers |
| **Hosted code tool** | No | **Yes**: QuickJS, 20,000 chars, 5 to 60 s, fixed egress IP, Run Code | **Yes**: JS module, 1 to 30 s, no npm, allowlisted domains, secrets injected on egress, Run | No. The builder's answer is Download code |
| **Test before you publish** | CLI only (`vapi tool test`), failures read in call logs | **Run Code** for code tools; nothing documented for custom functions | **Run** for code tools; nothing documented for webhook tools | **Live preview** for the whole agent; Agent Console for a deployed one |

Structured outputs are a different object and only two vendors treat it as one:

| | Shape | Scope | Limit |
|---|---|---|---|
| **Vapi** | Reusable definition, JSON Schema + model + conditions, attached via `artifactPlan.structuredOutputIds` | **Workspace** | name 40 chars; post-call only |
| **ElevenLabs** | Data collection items + evaluation criteria | Per agent | 25 or 40 items · 30 criteria |
| **Retell** | **Post Call Extraction** tab: Boolean · Text · Number · Selector Analysis | Per agent | not documented |
| **LiveKit** | none | none | none |

---

## What nobody does

**No one lets you prove a tool works before an agent depends on it.** Two vendors ship a Run button,
and both put it on the *code* tool, where the author is already a programmer; the no-code HTTP tool,
the one a non-developer actually builds, has no test door at Vapi, Retell, ElevenLabs or LiveKit.
The failure surfaces after a live call, in a log, as a string like "ok, no result returned". Agora's
shipped Console is the exception in this whole market: it already has
`POST /custom-tools/{toolId}/test` with a Function input box, a Success or Failed badge and the raw
HTTP status and body (`ng-console/src/components/console/integrations-page.tsx` :1946–2020). That
door exists, it is on the right object, and `studio_x_2` does not have it. The whitespace is not
building a test; it is **making the test the way you finish a tool**, so a tool cannot be attached
to an agent until it has returned 200 once, and so the last successful response is shown beside the
tool in the list. Nobody shows a tool's last known state anywhere. The second, smaller gap is the
rainy half of the same thing: every vendor lets you attach a connector or an MCP server and then
says nothing about it again, so "the token expired three days ago" is discovered by a caller.
Retell's masked URL and ElevenLabs' approval table are guards at attach time, not at run time.

---

## What this changes for us, before the learnings file

Two of the five open questions in `00-brief.md` are answered by the market rather than by an owner
call, and they should be put to the owner that way:

- **Question 2 (what is a structured output as a reusable resource)** has a shipped precedent:
  Vapi's workspace-level definition attached to N assistants by id, which is exactly the first
  option in the brief and kills our two-door problem in `step-analysis.tsx` and
  `call-capture-sheet.tsx`.
- **Question 4 (method set)** has three vendors on five methods and one on four, and none of them on
  two. Our Console form's five methods match the market; the Engine's `GET`-or-`POST` is the outlier
  and is the thing to name on screen, not to hide by shrinking the picker.
