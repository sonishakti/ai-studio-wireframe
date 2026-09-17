# 21 · CRM & contacts — intake brief (2026-09-17)

Tracker: https://app.clickup.com/t/868m0mf5e · status `added` → `clarified` once this lands · Tags `knowledge · P0` · size L, est. 16 days (5 research · 8 proto · 3 review, `references/design-ops-protocol.md`:256) · **wave: deferred, no dates** ("Deferred (≈144 days, estimate only, no dates): 01 · 06 · 12 · 13 · 17 · 19 · 20 · 21 · 24 · 25 · 27 · 28 … 17 · 19 · 21 are the painful cuts", `design-ops-protocol.md`:277–278).

Design Tracker JTBD (868m0mf5e): "User wants to greet callers with context and write back what happened."
Board row says `research Pending · UI none · status added` (`references/tracker-board/tracker-board.json`, row `n: "21"`). **"UI none" is wrong**: three quarters of the read half already ships, in two different repos. Section 3 is the correction.

Builds on the contact list shipped 2026-09-15 on `design/sandbox` (`1f09236` "builder(batch): the contact list carries its own first run", `dbc017e` "batch gets its contact list"). 21 extends that list. It never builds a second one.

## Scope

The three roadmap tasks, as the Q3 export records them. The export has no acceptance-criteria column (`references/clickup-q3-roadmap-export-2026-09-03.tsv` header: `module · level · name · priority · due · customers · type · delivery · size · status`) and the backlog HTML carries none either, so every AC cell below says so rather than inventing one. All three sit in the backlog epic **Knowledge · Tools · Integrations**, `where: '/integrations (Resources) — KB · MCP · CRM'` (`references/design-backlog-q3-roadmap-2026-09-03.html`:402).

| Task | What it asks for | Acceptance criteria |
|---|---|---|
| **868kyjfp4** Supply agent context from CRM records | Roadmap row: `Studio · level 1 · P0 · Feature Request`, no due date, no customers, no size (`clickup-q3-roadmap-export-2026-09-03.tsv`:193; backlog:405). The read half: the agent knows who it is talking to before it opens its mouth. Today the only carrier is `llm.template_variables`, valued from a campaign CSV column, and the only CRM in the product is the HubSpot connector, which is attached to the agent as a tool, not as a context source. | **no acceptance criteria written** |
| **868kykbfx** Add CRM actions and controlled write-back | Roadmap row: `Studio · level 1 · **P1** · Feature Request`, no due date (`…tsv`:199; backlog:407). "Controlled" is the whole word: an action the agent may take on a customer record, with a boundary the builder sets. The Engine primitive landed 2026-09-10 as `llm.tools` plus `advanced_features.enable_tools`. Nothing in either repo exposes it. | **no acceptance criteria written** |
| **868kykbf7** Manage contacts, audiences, and cross-session context | Roadmap row: `Studio · level 1 · **P1** · Feature Request`, no due date (`…tsv`:197; backlog:410). Note the roadmap name carries the Oxford comma; the tracker's copy of it drops one. Three jobs in one line: a contact store that outlives one CSV, a way to slice it, and memory that survives the hang-up. | **no acceptance criteria written** |

The tracker task is tagged `P0` because 868kyjfp4 is P0. The other two are P1. **Only the read half is P0.**

## What the product has today

### 1 · The contact list exists, in the prototype, in one place

`studio_x_2/components/wizard/channel-section.tsx` is the owner. Picking **Batch Calls** in section 2 (Deployment) renders two blocks, mounted at :193–194:

- `BatchCallerIdBlock` :216–238 · `SectionRow id="wz-2-batch"`, label **Phone number**, hint "The number your agent dials from. Every run starts with it." One `PhoneNumberSelect` writing `draft.config.batch.callerId`.
- `BatchContactsBlock` :243–300 · `SectionRow id="wz-2-contacts"`, label **Contact list**, hint "One row per contact. Its columns fill the {{variables}} in your prompt." A collapsible panel headed by the run name and the file name (`run.csvName ?? "No file yet"`, :268), open by default (:246), wrapping the exported `CampaignContacts` with `defaultPreviewOpen` (:276), whose own doc comment sits at `campaigns-card.tsx`:526–527. Under it, one line: "Configure in Go Live." plus an **Open Go Live** button to step 5 (:281–296).

The list has its own door in the left rail, and only while Batch is chosen: `agent-wizard.tsx`:1195–1211 renders a **Contact list** sub-item under section 2 that opens the row and scrolls `#wz-2-contacts` into view.

`firstRun` / `patchFirstRun` (`lib/wizard-draft.ts`:292–304) are the reason there is one list and not two: `FIRST_RUN_ID = "cmp_run_01"` (:290) is a fixed id so Deployment and Go live edit the same `CampaignDraft`, and the run is only committed on the first edit. `CampaignDraft` itself is `lib/wizard-draft.ts`:256–280: `id · name · numberId · csvName · contacts (row count) · language · callWindow · maxConcurrent · retries · retryIntervalMin · launch · status · locked · rerunOf`. **There is no field for a column list and no field for a row.**

### 2 · `CampaignContacts` is the component 21 extends

`studio_x_2/components/wizard/campaigns-card.tsx`:520–663. Signature :520–528 (`draft · campaign · onChange · defaultPreviewOpen`), and the doc comment on `defaultPreviewOpen` is already the owner's rule for this feature: "the list IS the decision there, not a detail behind a toggle (owner 2026-09-15)". It is used in exactly two places: the Go live campaign editor (:487) and the Deployment block above.

Three states:

- **Empty** :550–580. Label "Contacts CSV", an outline **Upload contacts CSV** button, a **Download CSV Template** text button, and one line: "One row per contact · columns become {{variables}}." with a link to `https://docs.agora.io/en/conversational-ai` reading "Learn how {{dynamic vars}} work".
- **Summary bar** :585–598. `{count} contacts` over the file name in mono, then **Preview 24 rows** / **Hide preview** and **Replace file**.
- **Coverage line** :600–622. Either "N/N {{variables}} covered." with a tick that pops once (`coveredFlash`, :536–542), or a destructive panel: "Missing N prompt variables: {{x}}, {{y}}. Add the columns, or remove them from the prompt. Deploy stays blocked until they match."
- **Preview table** :625–658, `max-h-[300px]`, sticky header, fixed columns **Phone number · Name · Account · Balance · Due date**.

Everything under it is fixture, not file handling. `attachCsv` :543–549 sets `csvName: "contacts.csv"` and `contacts: MOCK_CSV_ROWS` unconditionally and toasts the column list; there is no file input, no parse, no column inference. `PREVIEW_ROWS` :506–518 are 24 generated names and numbers. `MOCK_CSV_COLUMNS = ["name", "account", "balance", "due_date", "phone"]` and `MOCK_CSV_ROWS = 248` live in `lib/wizard-draft.ts`:773 and :777.

### 3 · Variables: detected from the prompt, matched against a constant

`extractVars` is `lib/campaign-data.ts`:1713–1717, a Unicode-aware `{{ ... }}` matcher returning a deduped list. Six callers: `wizard-draft.ts`:782, `section-prompt.tsx`:46, `deploy-preflight.tsx`:107, `campaigns-card.tsx`:535/608/609, `test-section.tsx`:148/153.

The coverage check is `campaignMissingVars` (`lib/wizard-draft.ts`:781–785). It reads `extractVars(systemPrompt + greeting)` and filters against the hardcoded `MOCK_CSV_COLUMNS`. **A real CSV's headers are never read**, so the "covered" tick is a comparison between the prompt and a five-item constant. It is also a publish gate: `publishBlocks` :838 blocks on a run with no CSV, :843 blocks on unmatched variables.

Where the user sees variables: `section-prompt.tsx`:121–134 renders one `Badge` per detected variable under the prompt textarea, prefixed "Variables detected (filled from your campaign CSVs):" on batch. On inbound, :136–142 says instead: "Inbound agents: per-call variables via API: coming soon." That sentence is the honest statement of the P0 gap and it is the only place in the product that admits it.

### 4 · CRM connectors exist twice, and neither one supplies context

**In the prototype.** `lib/campaign-data.ts`:1762–1781. `interface Connector { id · name · category · description · initials · status }` and a six-row `CONNECTORS` catalog whose first two rows are the CRM ones: HubSpot, category "CRM", "Sync contacts and log deals in your CRM.", seeded `connected`; Salesforce, "Read and update leads and opportunities.", `available`. Project-level connect state is mock OAuth in `localStorage` (`lib/agent-resources.ts`:229–249, key `sx:connected_connectors`; `effectiveConnectorStatus` :246–249). The Resources tab renders them as `CatalogCard`s with a Connect dialog that authorizes nothing (`app/(dashboard)/integrations/page.tsx`:286–342). The builder attaches them at `components/wizard/step-build.tsx`:117–165: `SectionRow id="wz-5-connectors"`, label **Tools & connectors**, a count line "NN connectors added", a Name/Status table, and a per-row `Switch` disabled unless the connector is connected. The agent stores `draft.connectors: string[]` (`lib/wizard-draft.ts`:445, "Context › Actions — attached third-party Connector ids"). **Attaching HubSpot changes nothing about what the agent knows at the start of a call.**

**In the real Console**, and this is the one that is real. `ng-console/src/lib/agents/studio-connectors-api.ts`:15 is the whole catalog: `export type StudioConnectorProvider = "hubspot"`. The endpoint is `/api/studio-v2/projects/{projectId}/connectors` (:47–56), `POST {action: "connect", provider}` returns `{authorizeUrl, provider, state}` (:58–72), `POST {action: "disconnect", provider}` (:74–89). The UI catalog is `src/components/console/integrations-page.tsx`:192–237: HubSpot is the only `comingSoon: false` row, described as "Sync HubSpot CRM context and customer records."; Airtable, Jira, PayPal, WhatsApp and Zendesk are all `comingSoon: true`. The render guards on the literal string twice (:2196, :2241), so only HubSpot gets a button at all. Agent-level attachment is `src/components/console/agent-tools-page.tsx`: query :105–108 (`kind: "connectors"`), `addConnector` :345–361, the section at :761–845 headed `connectorsTitle` = "Connectors" / `connectorsDescription` = "Connect third-party services that this agent can use." (`src/lib/i18n/resources/en/common.ts`:2662–2664), with `noConnectorsDescription` = "You haven't added any connectors yet." (:2688). The attachment contract is `src/lib/agents/studio-agent-attachments-api.ts`:8–26: four kinds, `connectors · custom-tools · knowledge-bases · mcp-servers`, each an id list on the agent.

**The gap is the same in both repos.** A connector is attached the way a tool is attached. Nothing maps a caller's phone number to a record, nothing chooses which fields of that record reach the prompt, and nothing shows the builder what the agent will actually know.

### 5 · Write-back: the pipe exists, the control does not

The real Console already ships the generic write pipe: **Custom Tools**. `ng-console/src/lib/agents/studio-custom-tools-api.ts`:17 `StudioCustomToolMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT"`, and :19–31 `StudioCustomToolConfig = { url · method · function {name, description, parameters} · headers? · query_params? · body_template? · timeout_ms }`. The form is `integrations-page.tsx`:176–189 (`defaultCustomToolForm`) with a JSON Schema editor for `parametersJson` and a `timeoutMs` default of 30000. There is a test call (`StudioCustomToolTestResult`, :52–58: `statusCode · body · headers · error · success`). i18n: `customToolsDescription` = "Attach reusable HTTP tools from your workspace." (`common.ts`:2676–2678).

So a `POST` to a CRM is already possible and already unbounded. What does not exist anywhere: a confirmation step, a field allowlist, a dry-run, an approval, a record of what the agent wrote, or a way to say "this tool may only touch these fields on this object". "Controlled" in 868kykbfx has no control to extend.

`studio_x_2` has no custom-tool surface at all; its equivalent is the MCP row (`step-build.tsx`:93–115, "Give it tools: CRM, calendar, APIs.") and the connector switches.

### 6 · What a finished call leaves behind

`studio_x_2` post-call extraction is `AnalysisConfig` (`lib/wizard-draft.ts`:160–169: `transcribe · record · successEval · evalCriteria · dataPoints[]`) and `DataPoint` (:151–158: `id · name · type (text|number|boolean|enum) · description · allowedValues?`), seeded with one point, "Call Outcome · boolean" (:178–180). It is edited in Go live under `SectionRow id="wz-4-outputs"`, label "Structured outputs", hint "What each call records. Results appear in Call History." (`components/wizard/deploy-section.tsx`:114–131).

Call History is `app/(dashboard)/calls/page.tsx`. A row is `id · direction · timestamp · agent · campaignId · campaignName · from · to · durationSec · status · outcome` (:33–47). Optional columns the user can surface are **Sentiment · Intent · Language** (:107–112), computed from the row (:115–120). **A call row carries two phone numbers and no contact.** No name, no CRM record id, no link back to the list row that produced the call, and no destination for a data point other than this table.

The real Console has less: `ng-console/src/components/console/agent-analysis-page.tsx` is 35 lines of four latency and engagement tiles. There is no structured-output surface in the live Console at all.

Webhooks in the prototype are a flat list (`app/(dashboard)/developer/webhooks/page.tsx`:17 seeds `https://crm.acme.com/agora-events` on `campaign.completed`), with no payload shape and no per-agent binding.

### 7 · What is missing, plainly

- **No contact store.** A contact exists only as a row inside one campaign's CSV. There is no entity, no id, no history across runs, and nothing to look one up by. `ContactsFile` (`lib/campaign-data.ts`:40–44) holds `fileName · rowCount · columns[]` and is the closest thing to a schema; `CampaignDraft` does not even carry that.
- **No audience.** No filter, no segment, no saved slice, no suppression or do-not-call list, no dedupe.
- **No inbound context.** The only variable source is a CSV column, which an inbound agent does not have. `section-prompt.tsx`:139 says so out loud.
- **No CRM read path.** Attaching HubSpot gives the agent a tool, not a record.
- **No write-back control.** Custom Tools can `POST` anywhere with no boundary.
- **No cross-session memory.** Nothing persists between two calls with the same person.
- **No real CSV handling.** No file input, no header parse, no per-row validation, no error state for a bad phone number, no duplicate detection.

## Agora fact-check

Sources: `docs.agora.io/en/` and the installed SDK at `ng-console/node_modules/agora-agents@2.4.0/dist/cjs/`. Every claim carries a URL or a file path.

### The primitive that carries the read half: `llm.template_variables`

- Typed at `api/types/Llm.d.ts`:42 · `template_variables?: Record<string, string>` · "Template parameter configuration."
- The load-bearing description is in the agentkit copy, `agentkit/types.d.ts`:381–382: "Key-value pairs injected into system_messages / greeting_message via `{{variable_name}}` syntax".
- Release notes https://docs.agora.io/en/ai/release-notes, **v2.1 (December 5, 2025)**: "This version adds the `llm.template_variables` field to the Start a conversational AI agent API, used to insert variables into the agent's `system_messages`, `greeting_message`, `failure_message`, and `parameters.silence_config.content` text." **Four targets, not two.** `failure_message` and the silence prompt are also substitutable and neither is offered in the prototype.
- Studio docs https://docs.agora.io/en/conversational-ai/studio/build/prompt-design: "Template variables allow you to personalize the system prompt, greeting message, and failure message with dynamic values at the start of each call." · "For campaigns, add variable values as columns in your contact list CSV. Each column name maps to a variable name in your prompts." · "Studio replaces each `{{variable_name}}` with the value provided for that session."
- **At the start of each call.** There is no documented way to change a template variable mid-call.
- `ng-console` does not send this field. `grep -rn "template_variables\|templateVariables" src/` over the whole Console returns nothing. The live Console has no variable UI and no variable wire.

### The contact list is a documented Agora artefact, and ours does not match it

https://docs.agora.io/en/ai/studio/deploy/campaign:

- Required column: `phone_number`, **E.164 format**, example `+19168888860`.
- "Column names become variable names available in your **Prompt** configuration."
- "Maximum file size is 25 MB, with a maximum of 50,000 rows."
- Example header: `phone_number,name,appointment_time,preferred_language`; example row: `+19168888860,John Doe,2025-01-15 10:00 AM,English`.
- "To override agent settings per contact, add columns like `prompt_override`." **A per-contact prompt override is a documented, supported column and the prototype has no idea it exists.**

Our fixture disagrees with the spec on the one required name: `MOCK_CSV_COLUMNS` (`lib/wizard-draft.ts`:773) ships `phone`, not `phone_number`. A prompt written against the docs (`{{phone_number}}`) is reported missing by `campaignMissingVars` and blocks publish.

### Custom business data on the session: `labels`

- `api/resources/agents/client/requests/StartAgentsRequest.d.ts`:110–111 · `labels?: Record<string, string>` · "Custom labels in key-value pair format … Enables agents to carry custom business information. These labels are bound to the agent and returned in the `payload` field of all message notification callbacks from the conversational AI engine."
- Release notes v2.1 (December 5, 2025): "This version adds a `labels` field to the Start a conversational AI agent API, enabling agents to carry custom labels."
- `agentkit/types.d.ts`:207 · `export type Labels = Record<string, string>`; `agentkit/Agent.d.ts`:289 `withLabels(labels)`.
- The Console already puts `labels` on the wire and deliberately hides it: `src/lib/convoai/agent-properties.ts`:4–20 lists `"labels"` in `reusablePropertyKeys`, then :22–24 builds `configurablePropertyKeys` as the same list **minus** `labels`. It is populated only with provenance (`agent-editor-workspace.tsx`:182–186 `{ mode: "first-show", source: "playground" }`, :225–231 `{ source: "template", template, templateSource }`).
- This is the field that carries a CRM record id from the dial through to the callback. It is shipped, wired, and unused.

### The primitive that carries the write half: `llm.tools`

- Release notes https://docs.agora.io/en/ai/release-notes, **v2.12 (September 10, 2026)**: "You can now declare custom tools for the LLM to call during a conversation, directly through the RESTful API. Set `advanced_features.enable_tools` and declare a tool's name, description, parameters, and a synchronous `GET` or `POST` HTTPS endpoint using the `llm.tools` parameter." Parameter rows: "`llm.tools`: Custom tool definitions the LLM can call. Requires `advanced_features.enable_tools`." · "`mllm.mcp_servers`: MCP server connections for MLLM agents. Requires `advanced_features.enable_tools`."
- **`GET` or `POST` only, and synchronous.** The Console's own Custom Tools form offers `DELETE · GET · PATCH · POST · PUT` (`studio-custom-tools-api.ts`:17). Three of those five are not in the Engine's documented set for `llm.tools`. Whether Studio v2 tools travel by a different path than `llm.tools` is an Engine question, flagged below.
- **`llm.tools` is not in the installed SDK.** `agora-agents@2.4.0` has `advanced_features.enable_tools` (`StartAgentsRequest.d.ts`:160–161, "Enable tool invocation. When enabled, the agent can invoke tools provided by the MCP server to implement advanced functionality.") but no `tools` key on `Llm` (`api/types/Llm.d.ts`, whole file). The SDK predates v2.12. Design against the release notes and confirm the shape before anything writes.
- `llm.mcp_servers?: Record<string, unknown>[]` exists at `api/types/Llm.d.ts`:44, described in `agentkit/types.d.ts`:383–384 as "MCP server configurations enabling the agent to call tools from external services". The item type is `Record<string, unknown>` (`agentkit/types.d.ts`:213), so the SDK does not describe a server entry.

### The HubSpot connector, as Agora documents it

- https://docs.agora.io/en/ai/studio/build/integrations: "Connectors provide built-in integrations that agents can use without requiring you to build your own HTTP or MCP layer." The HubSpot connector "enables agents to handle contact and ticket workflows after connection through the agent editor Actions tab."
- https://docs.agora.io/en/conversational-ai/studio/build/customize-agent: "Connectors let your agent use built-in integrations managed in **Integrations**. Attach HubSpot when your agent needs CRM contact or ticket workflows." Alongside it: "Custom Tools let your agent call reusable HTTP endpoints that you defined in **Integrations**." and "MCP servers enable your agent to call tools provided by external services."
- The docs never say which HubSpot objects, which fields, whether the connector reads, writes, or both, or what the agent is allowed to change. That is the single largest documentation hole in this feature.
- Same page, on variables: `{{variable_name}}` values "match column names in your CSV file".

### Cross-session context: the only documented mechanism is rewriting the system prompt

`api/resources/agents/client/requests/UpdateAgentsRequest.d.ts` is `POST update` on a running agent. It takes `properties.token`, `properties.llm.{system_messages, params}` and `properties.mllm.params`, and nothing else. The doc example is literally the memory pattern:

> `system_messages: [{"role": "system", "content": "You are a helpful assistant. xxx"}, {"role": "system", "content": "Previously, user has talked about their favorite hobbies with some key topics: xxx"}]`

Two consequences for the design. First, memory is a string the customer composes and prepends, not a store Agora keeps. Second, `template_variables` is **not** updatable at runtime: it is absent from `UpdateAgentsRequest.Properties`, so a variable set at dial time is fixed for the call. Read-back of the conversation is `GetHistoryAgentsRequest` (`appid`, `agentId`) and `GetTurnsAgentsRequest` (plus `page_index`, `page_size`).

Retention has one switch: `parameters.opt_out` (`StartAgentsRequest.d.ts`:669–674) · "Whether to disable data retention for the current session … When disabled, historical session content cannot be used for troubleshooting, effectiveness review, or agent optimization." A cross-session memory feature and this flag collide, and neither repo surfaces the flag.

### Requires Engine

The API exposes **no contact object, no audience, no segment, no suppression list, no cross-session memory store, and no CRM field mapping**: there is nothing in `agora-agents@2.4.0` under `api/resources/` beyond `agentManagement · agents · phoneNumbers · telephony`, and no docs page for any of them. **Requires Engine.**

Three narrower gaps, each also **Requires Engine**:

1. The "Contact list format" section is referenced by https://docs.agora.io/en/conversational-ai/studio/build/prompt-design but the campaign page that holds it is only reachable at https://docs.agora.io/en/ai/studio/deploy/campaign; the `/conversational-ai/studio/deploy/*` paths return 404. The numbers above are from the reachable copy and should be confirmed before they become UI text.
2. Whether a Studio v2 Custom Tool with method `PUT`, `PATCH` or `DELETE` actually reaches the Engine, given `llm.tools` documents `GET` and `POST` only.
3. What the HubSpot connector reads and writes, object by object.

### Field summary

| Job | Field that carries it | Where it is typed | Exposed in the product? |
|---|---|---|---|
| Per-call context into the prompt | `llm.template_variables` | `api/types/Llm.d.ts`:42 · `agentkit/types.d.ts`:381 | Prototype: fixture only. Console: not sent at all |
| Context into greeting · failure · silence prompt | same field, four targets | release notes v2.1 | Prototype covers prompt + greeting only |
| Per-contact behaviour override | CSV column `prompt_override` | docs `/en/ai/studio/deploy/campaign` | No |
| Business id on the session and its callbacks | `labels` | `StartAgentsRequest.d.ts`:110 | Wired, then excluded from config (`agent-properties.ts`:22–24) |
| Agent takes an action on a record | `llm.tools` + `advanced_features.enable_tools` | release notes v2.12; `enable_tools` at `StartAgentsRequest.d.ts`:161 | `enable_tools` only; `llm.tools` not in SDK 2.4.0 |
| Built-in CRM | HubSpot connector | `studio-connectors-api.ts`:15 | Yes, attach only, one provider |
| Mid-call context change | none | `UpdateAgentsRequest.d.ts` takes `llm.system_messages` only | Requires Engine |
| Contact · audience · memory store | none | absent from the SDK | Requires Engine |

## Already decided

- **Reuse, don't redesign** (memory, owner 2026-09-12): "things that belong together live together and look the same; extend the existing row/field/sheet, one door per action, no control for what Agora does by default". 21 extends `CampaignContacts` and the existing Connectors row. It does not add a contacts page beside them without an owner call.
- **The list is the decision.** `campaigns-card.tsx`:526–527: "Deployment shows the table straight away — the list IS the decision there, not a detail behind a toggle (owner 2026-09-15)."
- **One run, one id.** `wizard-draft.ts`:288–290: "A fixed id so Deployment and Go live edit the same object rather than each seeding their own." Any contact work writes through `firstRun` / `patchFirstRun`, never a second store.
- **The prompt lives in the Deployment, not the agent**, and variables come from the CSV (`references/ia-revamp-agent-vs-deployment.md`, §5): "there is **no build-time declaration**. At the Batch Calls deployment you upload a CSV → its **column headers become the available `{{vars}}`** … This removes the 'declared in builder, valued at deploy' inversion entirely." An inbound context design must not reintroduce that inversion.
- **Integrations are agent-scoped; Extensions are project-scoped** (`references/leanness-pass.md`:124: "Knowledge Bases · MCPs · CRM connectors (HubSpot, Airtable, Jira, Salesforce, Zapier)"). Open IA tension #3 in CLAUDE.md says the labels do not make that distinction clear, and 21 sits on top of it.
- **Wiring a CRM is a known navigation failure.** `references/heuristic-eval-agents-2026-07-06.md`:109, task "Attach a CRM/knowledge connector": "**No** — no row names connectors; 'System prompt' gives no scent; user bounces to Resources … **Failure**".
- **Regulated, and consent is load-bearing.** LEARNINGS §3.4 "HIPAA · GDPR · SOC 2 · EU AI Act trajectory. Applies at every stage." §6 watchlist names Prechecked Consent ("GDPR direct conflict") and Destructive Defaults. A CRM write-back defaulted on is both.
- **Honesty floor.** "Not supported by <vendor>" is a real state. One provider is connectable (`StudioConnectorProvider = "hubspot"`); the design says so rather than drawing a Salesforce card that does nothing.
- **Pricing.** Conversational AI Engine is a flat $0.10 per agent-minute whoever owns the key (`studio_x_2/lib/campaign-data.ts`:949 `AGORA_RATE_PER_MIN = 0.1`). No control in this feature may imply that a CRM lookup, a tool call or a longer prompt moves the Agora bill.
- **Copy discipline** (CLAUDE.md): no new UI text beyond the reference without asking; one short line under a control; no arrows, no em dashes; never put prose in a disabled input.

## Open questions for the owner

**1 · Where does an inbound agent's context come from?** This is the P0 task and the product has no answer for it.

- *A · Lookup by caller number through the connector.* The agent matches `from` against HubSpot on answer and fills the variables. Closest to the JTBD, and the only option that needs no work from the customer. Costs: a documented latency budget before the greeting, a stated behaviour when the number is unknown, and a HubSpot field mapping the docs do not describe.
- *B · Customer-supplied at dial time via the API.* The builder declares the variables; the customer's own backend passes `llm.template_variables` on start. Ships against a typed, shipped field and no Engine work. It also means the P0 read half is a docs page plus a chip list, and `section-prompt.tsx`:139 stays true.
- *C · Both, with A behind the connector and B as the default.* Most honest, most surface.

**2 · Is a contact an object, or still a row in a file?** 868kykbf7 says "manage contacts, audiences".

- *A · Stay file-shaped.* Extend `CampaignContacts` with a real parse, header inference and per-row validation. No new nav, no Engine dependency, and "audiences" becomes a saved filter over one file. Cheapest, and it keeps the reuse rule.
- *B · A project-level contact store.* A real entity with an id, reachable from Call History, reusable across runs. This is the only option that makes cross-session context and write-back addressable, and **the Engine exposes nothing to build it on**. It is a Console-side database we would be specifying.
- *C · Defer B, design A so it does not block B.* Recommended shape unless the owner wants to commit the Engine.

**3 · What does "controlled" mean in controlled write-back?** Pick the boundary before the UI exists.

- *A · Field allowlist per tool.* The builder picks the object and the fields the agent may set. Fits the Custom Tool form. Needs the HubSpot object model, which is undocumented.
- *B · Draft and approve.* The agent proposes the update, a human confirms it in Call History before it lands. Safest under GDPR and the Destructive Defaults line, and it needs a queue surface that does not exist.
- *C · Post-call only, never mid-call.* Write-back becomes a destination for the existing `dataPoints` rather than a live tool. Reuses `AnalysisConfig` (`wizard-draft.ts`:160–169), matches "write back what happened" in the JTBD literally, and cannot be triggered by a caller mid-conversation.

**4 · Does cross-session memory ship as a feature, or as a documented pattern?** The Engine's only mechanism is prepending a system message on `update` (`UpdateAgentsRequest.d.ts`).

- *A · Feature.* Studio stores a per-contact summary and injects it. Needs the store from question 2B, and it collides head-on with `parameters.opt_out` and with retention policy.
- *B · Pattern.* We document the `system_messages` recipe and ship nothing. Honest, zero risk, and leaves the third of the P1 task unbuilt.

**5 · Does the CSV contract move to Agora's spec now?** Today `MOCK_CSV_COLUMNS` says `phone`; the docs require `phone_number` in E.164, cap the file at 25 MB and 50,000 rows, and support a `prompt_override` column. Changing the fixture makes every screenshot and every existing draft's coverage line move. Change it in this feature, or in a separate correction slice?

**6 · Do we surface `labels`?** It is shipped, on the wire, and deliberately not configurable (`agent-properties.ts`:22–24). It is also the only field that can carry a CRM record id from the dial into every callback, which is what makes write-back attributable. Turn it on as a builder control, keep it as a hidden field the CRM feature writes, or leave it alone?
