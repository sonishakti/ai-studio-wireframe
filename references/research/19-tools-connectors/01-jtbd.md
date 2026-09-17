# 19 · Tools & connectors · JTBD, all types

ClickUp: [19 · Tools & connectors](https://app.clickup.com/t/868m0mf40) (Design Tracker, tagged **knowledge · P0**, no wave and no dates; deferred in the capacity plan at 16 designer-days, `references/design-ops-protocol.md` :254, :277).
Roadmap tasks: [Build a native and MCP connector marketplace](https://app.clickup.com/t/868kbyqdm) · [Build no-code HTTP tools](https://app.clickup.com/t/868kyjfp1) · [Support GET and POST agent tools](https://app.clickup.com/t/868ka25w5) · [Manage structured outputs as reusable resources](https://app.clickup.com/t/868khqaqj) · [Run hosted code tools inside Studio agents](https://app.clickup.com/t/868kykbfa).

## Headline JTBD

**JTBD.** When a caller asks the one thing only our own system knows, like where their order is *(situation)*, I want to hand the agent the endpoint we already run and watch it come back with the real answer *(motivation)*, so the call ends with the job done instead of a promise that someone will call back *(outcome)*.

**Personas.**
- **P1 the hustler on the default agent (Aria)**: one endpoint, a Postman tab already open, wants the agent calling it today and will not read a schema page first.
- **P2 the platform engineer**: already runs an MCP server, wants the allowlist, headers and timeout to be the ones they set, and wants to know which of their tools the agent can actually reach.
- **P3 the ops lead who inherited it**: did not build the tool, opens it six weeks later because a caller complained, needs to see when it last worked and whose account it is connected to.

## Success event

Nothing in `references/telemetry/event-spec.json` fits. The only tools-related event in the file is `builder_exited` with `target: "integrations_connectors"`, hooked at `studio_x_2/components/wizard/step-build.tsx` :127, which measures the user *leaving* the builder to go find a connector. We have instrumented the leak and not the job.

**`tool_verified`, proposed, P0, in the file's shape** (object_verb past tense, camelCase properties):

| | |
|---|---|
| **When** | A tool's test call returns 2xx for the first time for that `toolId`. Once per tool; later runs fire `tool_retested`. |
| **Properties** | `toolId` · `kind` (http \| mcp \| connector) · `source` (form_finish \| list_retest \| attach_gate) · `statusCode` · `attemptCount` · `wallMs` (from the create form opening) · `isFirstTool` · `agentId` (only when the test was reached from an agent) |
| **Feeds** | Share of created tools ever proven to work · attempts-to-first-2xx, the only honest difficulty score for the no-code form · attached-but-never-verified, the counter-metric |
| **Hook point** | The existing test result at `ng-console/src/components/console/integrations-page.tsx` :1946–2020, backed by `POST /api/studio-v2/projects/{projectId}/custom-tools/{toolId}/test` (`src/lib/agents/studio-custom-tools-api.ts` :148–164, normalized at `src/server/studio-v2/integrations-handlers.ts` :1395–1409). |

Why this one: a tool that exists is worth nothing and a tool that has returned 200 once is the first moment the user has evidence their agent can act. It is also the market's whitespace made countable, since no vendor of the four tests a no-code HTTP tool at all (`02-research/_docs.md` §What nobody does).

**North-star anchor, requires Engine.** `tool_call_succeeded`: `{ agentId, deploymentId, toolId, kind, durationMs, result: "ok" | "http_error" | "timeout" | "not_invoked" }`, fired on the first successful invocation inside a non-test conversation. It is the sibling of `first_live_call_received` and it is unowned the same way: no per-tool result is documented on the join contract or in the v2.12 release note (https://docs.agora.io/en/api-reference/api-ref/conversational-ai/join, https://docs.agora.io/en/ai/release-notes). `not_invoked` is a named result because `advanced_features.enable_tools` defaults to `false` and the contract says tools are then "still validated but not invoked".

**Rejected KPIs:** time on page, session length, DAU (CLAUDE.md). Rejected for this feature specifically: tools created, connectors installed, and catalog size, all of which rise when the install button lies.

## Happy scenario

1. Order status sits behind one GET endpoint we already run, so I open Resources and start a tool instead of filing a ticket with engineering.
2. I paste the URL with `{{order_id}}` in it, add our API key as a header, and call the thing the agent will say `lookup_order`.
3. I describe the one parameter it takes, run the test with a real order number, and get a green 200 with our JSON sitting under it.
4. Back in the agent the Tools row already lists it, so I switch it on and nothing else asks me for anything.
5. I talk to the agent in the test panel, ask it about order 4471, and it reads back the real delivery date.
6. I deploy, and the next morning the call list shows callers getting their dates without anyone picking up.

## Rainy scenarios

1. **Nothing here yet.** "I opened Tools and it is empty, and I cannot tell whether I am supposed to pick something from a list or build something from scratch." (`studio_x_2/app/(dashboard)/integrations/page.tsx` :34 has no custom-tools tab at all, and the Connectors catalog it does have is six hard-coded rows, `lib/campaign-data.ts` :1762–1779.)
2. **The connector I need is not in the catalog.** "There is no Salesforce card, and the ones that look clickable turn out to be pictures." (The server throws `INVALID_BODY "provider must be hubspot"` for every other provider, `ng-console/src/server/studio-v2/integrations-handlers.ts` :921–928; the Console shows five `comingSoon` placards beside it, `integrations-page.tsx` :192–238.)
3. **The endpoint answers with a failure.** "The test came back Failed with a 502 and now I do not know if it is my URL, my key, or their server." (The test result is only `{ success, statusCode, headers, body, error }`, `integrations-handlers.ts` :1395–1409, so the raw body is the whole diagnosis.)
4. **It saves and then never fires.** "The tool is attached, the agent hears the question, and it makes an answer up instead of calling out." (`advanced_features.enable_tools` defaults to `false` and tools are then validated but not invoked, https://docs.agora.io/en/api-reference/api-ref/conversational-ai/join; `advanced_features` is not one of the eight sections the sandbox's Custom config drawer accepts, `lib/wizard-draft.ts` :106–107, so there is no door for the switch either.)
5. **The method I need is not a method the agent can use.** "Our API wants a DELETE, the form let me pick DELETE, and it saved." (Studio's picker is GET · POST · PUT · PATCH · DELETE, `integrations-page.tsx` :168–174; `llm.tools[].function.server.method` accepts GET or POST only, join contract.)
6. **Save is refused for a reason I have to decode.** "It will not save and it is telling me about a template parameter I am sure I already wrote." (`buildCustomToolConfig` scans every `{{placeholder}}` in the URL, header values, query values and body template and rejects any name missing from `parameters.properties`, `integrations-page.tsx` :2330–2348.)
7. **The limit lands after the install, not before it.** "I connected the CRM and now the agent cannot see half my own tools." (Maximum 32 tools exposed to the LLM after filtering, join contract; connector tools appear by themselves once the account is connected, https://docs.retellai.com/integrations/overview.)
8. **The name is already taken.** "I called mine `lookup_order` and something else in there already answers to that." (`function.name` is the only handle the model has, "Must start with a letter and contain only letters and numbers, 1 to 64 characters long", join contract.)
9. **My key is sitting in the open.** "I pasted our production key into a header row and anyone who opens this tool can read it back." (Agora treats `Authorization`, `api-key`, `token`, `secret`, `cookie` as secrets by name only, https://docs.agora.io/en/ai/studio/build/custom-tools; ElevenLabs stores a reference instead, `{{system__env_<label>}}`, https://elevenlabs.io/docs/eleven-agents/integrate/environment-variables.)
10. **The call cannot get out of the building.** "Our API only accepts traffic from IPs we allowlist and nobody can tell me which IP the agent calls from." (Retell publishes one fixed egress IP, `35.166.138.221`, https://docs.retellai.com/build/single-multi-prompt/code-tool; Agora documents none.)
11. **Not supported by this agent's stack.** "The Custom tools block is simply missing on this agent and I cannot tell what I did wrong." (`mcpOnlyActions` hides Custom Tools and Connectors for MLLM and default-LLM agents, `agent-detail-page.tsx` :266–267, behind the line "Realtime and Default LLM agents only support MCP servers.", `src/lib/i18n/resources/en/common.ts` :1967–1968.)
12. **The tools it found are not my tools.** "I added the MCP URL, it said it found three tools, and none of them are the ones on my server." (`discoverTools()` in the sandbox always returns `search · create_record · update_record`, `lib/agent-resources.ts` :197–203, while the real list comes from `GET /mcp/{id}/tools`, `integrations-handlers.ts` :207–226.)
13. **It worked for three weeks and then a caller found out it did not.** "Nothing on the screen ever told me the token had expired." (`GET /mcp/{id}/status` already returns `{ status, lastDetectedAt, connectivityTest }`, `integrations-handlers.ts` :228–244, and no vendor of the four shows a tool's last known state anywhere, `02-research/_docs.md` §What nobody does.)
14. **Connected, but not by me.** "The HubSpot card says Connected and I cannot see which account or ask the person who did it." (The connector record carries only `action: "connect" | "disconnect"`, `integrations-handlers.ts` :737–790; Retell binds each tool to a named connection instance so one workspace can hold two HubSpot accounts, https://docs.retellai.com/integrations/overview.)
15. **Two people, one tool.** "My teammate edited the tool this morning, my agent's answers changed, and I never touched it." (A tool is a workspace record attached by id, `integrations-handlers.ts` :1482–1509, and `ResourceField` already flags an attached item that has gone unavailable as destructive rather than healthy, `studio_x_2/components/wizard/step-build.tsx` :279–295.)
16. **Deleting something that is in use.** "I removed the old tool and I have no way to see which agents were using it." (Attach and detach are id-based POST and DELETE with no reverse lookup, `integrations-handlers.ts` :841–866, :876–887.)
17. **The answer is too big to say.** "The tool returned our entire catalogue and the agent went quiet." (Vapi warns an MCP response "may return large amounts of data. This can exceed model context limits", https://docs.vapi.ai/tools/mcp; Retell caps the result at 15,000 characters, https://docs.retellai.com/build/single-multi-prompt/mcp.)
18. **The caller leaves before the answer arrives.** "The lookup takes twenty seconds and they hung up in the silence." (`function.execution.mode` has the single value `"sync"` and `server.timeout_ms` runs to 100000 ms, join contract; Retell ships Talk While Waiting and has it off by default, https://docs.retellai.com/build/single-multi-prompt/custom-function.)
19. **The region I pinned does not cover this.** "My agent is pinned to the EU and this tool posts the caller's number to a US endpoint, and the region row never mentions it." (The row's disclosure names LLM, TTS and ASR vendors as the endpoints that process data elsewhere, `components/wizard/hosting-region.tsx` :72–79; a custom tool is a fourth endpoint it does not name, and ElevenLabs makes the same responsibility explicit for MCP, https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp/security.)
20. **Someone else's meter ran out.** "The Zapier MCP worked all week, then stopped, and the Agora bill looks exactly the same." (Zapier MCP bills two Zapier tasks per tool call, https://zapier.com/mcp; the Engine is a flat $0.10 per agent-minute either way, so nothing on our side moves when their ledger empties.)
21. **The thing I did at the other vendor is not here.** "At Retell I wrote twenty lines of JavaScript for this; here I am told to go stand up a server." (Retell runs JavaScript in a QuickJS sandbox with a Run Code button, https://docs.retellai.com/build/single-multi-prompt/code-tool, and ElevenLabs runs a default-export JS module, https://elevenlabs.io/docs/eleven-agents/customization/tools/code-tools; `llm.tools[].function.server` is required and `execution.mode` is sync-only, so there is nothing for our code to run on.)
22. **Two doors to the same thing, and they disagree.** "I registered the MCP server in Resources and there is still a box on the agent asking me for a name and a URL." (`agent-tools-page.tsx` :145–169 reads and writes an inline `draft.tools.mcpTools` array of `{ name, url }` pairs beside the attachment API, in shipped code.)
23. **I fixed it in one place and the other place kept the old copy.** "I added the field from Monitor and the builder still shows the list without it." (`components/call-capture-sheet.tsx` :20 writes `sx:call_capture:agt_default` while `components/wizard/step-analysis.tsx` writes the agent draft, two keys for one object.)

## What this is not

- **Answering from a document.** Retrieval belongs to **20 · Knowledge sources**; a tool acts on a system, a knowledge base recalls a text. The two rows stay side by side in the same section (`step-build.tsx` :68) and do not merge.
- **The post-call extraction editor.** 868khqaqj is in this feature's ticket set, but what 19 owns is the promotion of an existing `DataPoint` set into one resource attached by id (`lib/wizard-draft.ts` :151–159). The extraction fields themselves and the call-detail rendering stay with the feature that owns post-call analysis, **10 · Session & call logs**. Open question 3 in `00-brief.md` decides this and is unanswered.
- **Handing the call to a person.** Transfer, escalation and routing are **23 · Handoffs & routing**; a transfer is a built-in behaviour at every vendor we looked at, not a tool the customer builds (https://docs.vapi.ai/tools/default-tools).
- **Model provider keys.** ASR, LLM and TTS credentials are **07 · Vendors & provider fallback** and Vendor Credentials. A tool's `Authorization` header is not a vendor credential and must never send the user to that page.
- **The project extensions catalog.** Cloud Recording, ActiveFence and Spatial Audio at `/extensions` are a different marketplace with a different card component, and they stay there until open IA tension #3 is settled (CLAUDE.md, Open IA tensions).
- **Hosted code tools, built.** 868kykbfa is P2, has no Agora primitive, and its Engine ticket is still a decision (`TODO-Q3-ROADMAP.md` :45). This feature owns the honest state for it: a named kind, visibly disabled, with the reason on the row, the way `agent-detail-page.tsx` :266 already handles MLLM agents.
