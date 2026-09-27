# P0.5 · Connect other systems to the agent  (phase P0, budget 0.375 d, sheet row #P0.5)

## Job
- Situation: When the agent needs facts or actions from another system, Sam connects that system so the agent can look things up and act during a session.
- Story: Sam wants the agent to look up an order, so callers get their order status without waiting for a person.

## Happy path P0.5.a
1. In Prompt & knowledge, Sam opens Integrations and chooses Add: MCP server or tool. Each type has one icon and a tooltip, not a description.
2. For an MCP server, Sam sets the endpoint, headers, allowed tools and timeout. For a tool, Sam sets the name, parameters, URL and method.
3. Sam saves. The row reads Not checked until a test uses it.
4. Sam tests. The transcript marks the tool call, and the row shows the last result. Deployment never appears here.

## Rainy paths
- **P0.5.b** The MCP server returns no tool list: It saves as Not checked. A test is the only proof it works.
- **P0.5.c** A name breaks spec rules or Sam adds a 33rd tool: An inline error names the rule: MCP names must match ^[a-zA-Z0-9]{1,48}$, tool names cannot start with mcp, and the limit is 32 tools.
- **P0.5.d** A tool returns 4xx or 5xx or times out in a test: The error shows on the transcript line and the row. The agent answers without the tool.
- **P0.5.e** Sam wants to see a saved header value: Header values are write-only. They are never shown and must be re-entered to change. $secrets in headers is an API ask.
- **P0.5.f** The agent runs a realtime pipeline: Tools are unavailable, with the reason. MCP servers stay.
- **P0.5.g** Sam wants a knowledge base: The knowledge base is not in the v3 spec. Its row sits behind a flag, with states for upload rejected, file too large, unsupported type and indexing failed. A row that cannot save never ships.
- **P0.5.h** Sam's current Console knowledge bases or app integrations (HubSpot) do not show: A notice says they cannot attach to v3 agents yet.
- **P0.5.i** The MCP server token expired after saving: The test transcript shows 'MCP server 401' and the row reads Failed in last test, with the time. Sam re-enters the header and saves.
- **P0.5.j** A tool fails in production but not in tests: The spec has no execution log. The error group on the agent page (P1.4) is the only signal, and it is blocked on the RTM stream. Sam raises timeout_ms or removes the integration.

## Goal
- 6 in 10 integrations are tested without an error within a day.
- Target: At least 60 %. Details: median integration_sheet_opened to integration_added 3 min or less (provisional).
- Counter: Integrations removed within 24 h: 15 % or fewer
- Events: integration_sheet_opened {integrationType}, integration_added {integrationType, integrationCount}, integration_removed {integrationType, ageH}, integration_error_seen {integrationType, errorCode}, agent_audio_heard (port 1.0.0 + new props surface, agentVersion; agentVersion needs an allowlist key), operation_succeeded {operation: integration_attach}, app_connected, agent_updated

## Scope (subtasks)
- Rename Concept A Context list to Integrations
- Add menu: MCP server, tool; knowledge base flagged
- MCP sheet: endpoint, write-only headers, allowed tools, timeout
- Tool sheet: name, description, parameters, URL, method
- Row states: saved, not checked, failed in last test with time
- Knowledge base sheet (flagged): upload, indexing, four errors
- Legacy notice for current knowledge bases and apps
- Tool and MCP error line in the test transcript

## API
- Partial. Ready: llm.mcp_servers[], llm.tools[] (max 32) and mllm.mcp_servers[]. Headers are write-only, and $secrets there is undocumented. Missing: knowledge base, health field and execution log.
- Register: 10, 11. Scope: this agent's integrations; reuse across agents is P3.4. · Journeys: B · Build loop, INT · Integration, INT-R · Integration saved, not working, IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, API · API-only, saved agent

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Partial. Product and Desk. A Tools tab shows in competitors/product/vapi/vapi-assistant-model.png, not opened; no tool or MCP form (the product is signed out). Desk notes: research/19-tools-connectors/02-research/_docs.md.
- Retell: Done. Product. competitors/product/retell/retell-19-agent-functions-section.png, retell-19-integrations-available.png, retell-20-add-knowledge-base.png and retell-20-kb-source-types.png. retell-agent-editor.png shows the Functions, Knowledge Base and MCPs rows.
- ElevenLabs: Done. Product. competitors/product/elevenlabs/elevenlabs-19-tools-list.png (empty), elevenlabs-19-custom-mcp-server-form.png, elevenlabs-19-webhook-tool-form.png and elevenlabs-20-agent-knowledge-base-sources.png.
- LiveKit: Done. Product. competitors/product/livekit/livekit-19-mcp-server-form.png, livekit-19-http-tool-form.png and livekit-19-agent-builder-actions.png (empty). There is no knowledge base surface.
- Owed (only if a rainy path has no evidence at all): Capture the Vapi tool and MCP forms once signed in. No vendor shot shows a failed tool, an unreachable MCP server or a knowledge base indexing failure. Shoot one rainy state per vendor. Desk notes: research/19-tools-connectors/02-research/_docs.md and research/20-knowledge-sources/02-research/_docs.md.

## Previous row
- P0.4: read only its `features/P0.4/summary.md` if it exists (never its full spec).

## Locked vocabulary
- use **integration**, never: app (alone), connection, connector, plugin, add-on; 'integrate' for SDK or code work
- use **app integration**, never: connector, app (alone), connection
- use **MCP server**, never: MCP connection, MCP app, connector
- use **tool**, never: function, custom function, action; webhook as a synonym for tool
- use **knowledge base**, never: KB (in UI), RAG, docs, files
- use **webhook**, never: tool, callback, integration
- use **deployment**, never: channel (alone), connection, connect, publish, integration
- use **deployment type**, never: channel type, agent type, mode, modality
- use **inbound**, never: receive calls, phone deployment
- use **batch**, never: outbound (as a type), bulk calling, campaign (as a type)
- use **code**, never: SDK, web SDK, embed, iframe, widget, app, API channel
- use **direction**, never: call type, mode
- use **Go live**, never: publish, deploy (verb), launch, activate, connect
- use **number**, never: line, DID, connection, transport identifier
- use **run**, never: campaign (for one execution), batch job, blast
- use **calling window**, never: schedule window, dialing hours
- use **Run again**, never: rerun, retry run, redial
- use **transport**, never: channel, connection, deployment, modality
- use **SIP protocol**, never: transport (for SIP)
- use **RTC channel**, never: channel (alone), room
- use **session**, never: call, conversation, chat, interaction
- use **test**, never: preview, demo, sandbox, trial, playground
- use **production**, never: live, real, prod, deployed
- use **running**, never: live, active, in progress
- use **answer**, never: response, reply, first audio, TTFAB
- use **proven session**, never: successful call, real call, verified call
- use **ephemeral session**, never: temporary agent, inline agent, anonymous session
- use **zero retention**, never: private, no-log, not kept, incognito
- use **expired**, never: deleted, gone, not kept
- use **preset**, never: template, tier, stack, bundle
- use **configured**, never: edited, customised, personalised
- use **secret**, never: credential, vault, API key (alone), token
- use **BYOK, managed**, never: own keys, custom keys, Agora keys, byo
- use **simulation**, never: test, scenario test
- use **error group**, never: issue, incident, alert, error dot
- use **free minutes**, never: credits, trial balance, quota
- use **minutes banner**, never: meter, alert bar
- use **suspended**, never: paused, blocked, disabled, locked
- use **Analysis**, never: structured output (in UI), evaluation, scoring
- use **project**, never: app, workspace
- use **agent**, never: assistant, bot, persona
