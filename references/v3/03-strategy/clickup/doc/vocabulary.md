# Vocabulary

One word per concept, in the Console and the docs.

| Use | Never | Means |
| --- | --- | --- |
| **integration** | app (alone), connection, connector, plugin, add-on; 'integrate' for SDK or code work | MCP server, tool, knowledge base or app integration attached to an agent: gives it context or actions. Group Integration, event key app_connected. Never a deployment. |
| **app integration** | connector, app (alone), connection | Third-party app giving an agent context (HubSpot in the current Console). Not in the v3 spec; integration_type app reserved. WhatsApp is never one. |
| **MCP server** | MCP connection, MCP app, connector | One mcp_servers[] entry: endpoint, headers, allowed_tools, timeout_ms. Its transport field is the MCP wire protocol, never a session transport. |
| **tool** | function, custom function, action; webhook as a synonym for tool | One llm.tools[] entry: an HTTP call the LLM can make. |
| **knowledge base** | KB (in UI), RAG, docs, files | Documents the agent retrieves from. Not in the v3 spec; integration_type kb reserved; no row ships that cannot save. |
| **webhook** | tool, callback, integration | NCS event delivery set on the Webhooks page. Setting one never fires app_connected. |
| **deployment** | channel (alone), connection, connect, publish, integration | How production sessions reach an agent. Lives on a number, run or session, never on the agent. Group Deployment, event key channel_connected. Builder area: Deployment. |
| **deployment type** | channel type, agent type, mode, modality | inbound, batch or code; WhatsApp reserved. Picked at create, stored in labels.studio_deployment. Prop deployment_type (server), deploymentType (client). |
| **inbound** | receive calls, phone deployment | Deployment type: a number whose inbound.agent is this agent. Also a direction value. |
| **batch** | outbound (as a type), bulk calling, campaign (as a type) | Deployment type: the agent dials a contact list over telephony. Never inbound. |
| **code** | SDK, web SDK, embed, iframe, widget, app, API channel | Deployment type: the customer's software starts sessions with POST /sessions over rtc or telephony. Web SDK is an rtc transport here. |
| **direction** | call type, mode | Session property inbound or outbound, from the endpoint (number inbound; run or code telephony outbound; rtc none). 'Outbound' only as a direction value. |
| **Go live** | publish, deploy (verb), launch, activate, connect | The action inside Deployment: point a number, start a run or copy the snippet. Leads to channel_connected. |
| **number** | line, DID, connection, transport identifier | E.164 number with SIP trunk and inbound routing (/numbers). Page: Numbers. 'Transports' is internal only (digest §9). |
| **run** | campaign (for one execution), batch job, blast | One API Campaign: contact list, calling windows, pacing, status. 'Campaign' reserved for a grouping v3 lacks. |
| **calling window** | schedule window, dialing hours | Weekday time range a run may dial (schedule.days). |
| **Run again** | rerun, retry run, redial | One door: New run sheet prefilled with the contact list Studio stored. |
| **transport** | channel, connection, deployment, modality | Session field rtc or telephony (WhatsApp later). A property, never a stage. Detail cards are transport cards. |
| **SIP protocol** | transport (for SIP) | sip_trunk.transport (udp, tcp, tls) on a number. |
| **RTC channel** | channel (alone), room | Agora RTC channel name inside an rtc transport. The only UI use of 'channel'. |
| **session** | call, conversation, chat, interaction | One conversation between an agent and a person on any transport. 'Call' only inside API names (call_policy). |
| **test** | preview, demo, sandbox, trial, playground | A session Studio starts (test panel, Talk to agent), id stored by Studio, client_reference studio_test:. Never production. |
| **production** | live, real, prod, deployed | Any session on a saved agent that Studio did not start; developer sessions included until a purpose field ships. |
| **running** | live, active, in progress | Session status running (API). Agent page section: Running now. |
| **answer** | response, reply, first audio, TTFAB | First agent utterance heard. TTFA and TTFDA stop. TTFAB is runtime latency, a different metric. |
| **proven session** | successful call, real call, verified call | Production session with ≥ 2 turns whose caller is not the creator. |
| **ephemeral session** | temporary agent, inline agent, anonymous session | POST /sessions/ephemeral with the agent defined in the request, no agent_id. Listed; never in agent aggregates. |
| **zero retention** | private, no-log, not kept, incognito | data_policy.retention none: row, count and cost kept, content never stored. Row tag: Zero retention. |
| **expired** | deleted, gone, not kept | Content past 30-day retention; the row stays. |
| **preset** | template, tier, stack, bundle | Saved pipeline picked at create: Lowest latency, Balanced. Custom means no preset. |
| **configured** | edited, customised, personalised | Differs from its preset in instructions, greeting or a model. |
| **secret** | credential, vault, API key (alone), token | Provider key in a secret set (/secrets), referenced as $secrets.<set>.<key>. Documented for model api_key and SIP password only. |
| **BYOK, managed** | own keys, custom keys, Agora keys, byo | credential.mode values: byok uses the customer's key, managed uses Agora's. |
| **simulation** | test, scenario test | Text scenario run. Never counts toward any Aha. |
| **error group** | issue, incident, alert, error dot | Errors of one cause on one agent with their sessions (Logs). Badge: '2 errors · 3 warnings' in the header, '2 errors' on the list. |
| **free minutes** | credits, trial balance, quota | Free allowance before billing. Warn at 80 %, exhausted at 100 %. |
| **minutes banner** | meter, alert bar | The one banner for free minutes left, suspension and reactivation. |
| **suspended** | paused, blocked, disabled, locked | Account state: new sessions refused, production agents silent. 'Paused' is a run status only. |
| **Analysis** | structured output (in UI), evaluation, scoring | Agent-level success criteria and fields (API structured_output, named in a tooltip). |
| **project** | app, workspace | appid scope. 'App ID' only as the literal field label. |
| **agent** | assistant, bot, persona | Saved config from POST /agents. Has no deployment state. |