# P0.5 Connect other systems to the agent · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.5]. No ClickUp comments on the task, so there are no change notes. Concept A is the surface: the **Integrations** row of the Agent tab (today's "Knowledge and tools" row, `AgentBuilderRow id="context"`). The PRD's "Prompt & knowledge" is the current Console's section name; in concept A the row sits under System prompt.

## Job step

Sam connects another system to the agent so it can look things up and act during a session: an MCP server whose tools the agent may use, or one HTTPS tool the agent may use directly.

**Job statement.** When the agent needs facts or actions from another system, I want to attach that system in one place and see whether it worked in a test, so callers get answers the prompt alone cannot give and I know before going live whether the agent can reach it.

**Why now.** Integrations are the assumption behind the KPI: agents with an MCP server or a tool should reach `agent_proven` at 1.3 times the rate of agents without. Today's row saves a server that always "connects", never says whether a test used it, and shows a knowledge base the v3 API cannot store.

## Happy path · P0.5.a

Story: Sam wants the agent to look up an order, so callers get their order status without waiting for a person.

1. On the Agent tab Sam opens **Integrations** and presses **Add**. The menu offers **MCP server** and **Tool**, each an icon and a name; the icon's tooltip says what the kind is. `integration_sheet_opened {integrationType}` on the pick
2. For an MCP server Sam sets the name, the endpoint, the headers (write-only), the timeout, presses **Load tools** and ticks the tools the agent may use. For a tool Sam sets the name, the description, the method and URL, the parameters as a JSON schema, the headers and the timeout. `none`
3. Sam presses **Save**. The row lists the integration with one fact line and the state **Not checked**. `integration_added {integrationType, integrationCount}`, `operation_succeeded {operation: integration_attach}`, `agent_updated` (server), `app_connected` (server, first only)
4. Sam presses **Save and test** or the header **Test**. The transcript shows the greeting, one line naming the tool with its status code and duration, and the agent's answer. The row now reads **Worked in last test** with the time. Deployment never appears here. `agent_audio_heard {surface: test_panel, agentVersion}`

Done when: the agent carries one `mcp_servers[]` or `tools[]` entry, and a test used it without an error within 24 h (median sheet opened to saved 3 min or less).

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.5.b | The MCP server returns no tool list when Sam presses Load tools | One line says the server returned no tools and that a test is the only proof it works; Sam can type tool names or leave Allowed tools empty (every tool). Save stays on; the row saves as **Not checked** | none |
| P0.5.c | A name breaks the API rule, or Sam adds a 33rd tool | Name: `FieldError` under the field names the rule (MCP: letters and digits only, 1 to 48; tool: starts with a letter, letters and digits only, up to 64, never starting with `mcp`); Save off until fixed. 33rd: the Add menu offers MCP server only and one line under the list says 32 is the most, remove one to add another | none |
| P0.5.d | A tool returns 4xx or 5xx or times out in a test | The transcript line reads `sendTrackingLink · 502` (or `timed out after 10 s`) in the error tone and the agent answers without the tool; the row reads **Failed in last test · 14:02**. Sam opens the tool from its row menu, or raises Timeout, or removes it | `integration_error_seen {integrationType, errorCode}` |
| P0.5.e | Sam wants to see a saved header value | The edit sheet's Headers row reads "1 header set" with **Replace**; values are never shown. Replace opens the empty textarea and the next save sends the new values. The (i) says `$secrets` references are not supported in headers yet (API ask) | none |
| P0.5.f | The agent runs a realtime pipeline | The MCP server row is normal; each tool row is dimmed with one line above the list: a realtime model uses MCP servers only, tools stay saved for a cascaded pipeline. Add offers MCP server only | none |
| P0.5.g | Sam wants a knowledge base | With the flag off the kind is absent. With the flag on the Add menu offers **Knowledge base**; the sheet says the v3 API has no knowledge base yet so it cannot save, and shows the file states: uploading, indexing, ready, rejected, too large, unsupported, indexing failed, each with a one-line reason and a way out | none |
| P0.5.h | Sam's current Console knowledge bases or app integrations (HubSpot) do not show | One muted line under the list names them and says they cannot attach to v3 agents yet, with a link to the Integrations page | none |
| P0.5.i | The MCP server token expired after saving | The transcript line reads `Orders · MCP server 401` in the error tone; the row reads **Failed in last test · 14:02**. Sam opens Orders, presses **Replace** on Headers, re-enters the header, saves; the row returns to **Not checked** | `integration_error_seen {integrationType: mcp, errorCode: 401}` |
| P0.5.j | A tool fails in production but not in tests | Nothing in this row can show it: the spec has no execution log. The error group on the agent page (P1.4) is the only signal and is blocked on the RTM stream. Sam raises Timeout in the edit sheet or removes the integration from its row menu | `integration_removed {integrationType, ageH}` on remove |

Empty first screen is part of .a: a brand-new agent's Integrations row shows one sentence, "The agent answers from its prompt alone.", and **Add**; no legacy line, no example rows.

## Measures

- KPI: tested integration rate at least 60 %: `integration_added` to `agent_audio_heard` on the same agent within 24 h with no `integration_error_seen` for that integration in that test. Median `integration_sheet_opened` to `integration_added` 3 min or less (provisional).
- Counter metric: `integration_removed` within 24 h of `integration_added` on 15 % of integrations or fewer.
- Assumption to read at 14 d: agents with an MCP server or tool reach `agent_proven` at 1.3 times or more the rate of agents without; kill below 1.1, which also stops knowledge base work.
- API: Partial. `pipeline.llm.mcp_servers[]`, `pipeline.llm.tools[]` (32 at most) and `pipeline.mllm.mcp_servers[]` exist; headers are write-only and `$secrets` there is undocumented. Missing: knowledge base, a health or last-test field, an execution log, an endpoint that lists a server's tools.
