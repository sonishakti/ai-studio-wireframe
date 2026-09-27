# P0.1 · Choose how people reach the agent  (phase P0, budget 0.125 d, sheet row #P0.1)

## Job
- Situation: Sam decides how people will reach the agent: they dial the agent's number, the agent dials a list of people, or the team's own software starts the conversation.
- Story: Sam wants to create a new agent that fits how people will reach the agent, so no setup time goes on things that do not apply.

## Happy path P0.1.a
1. Sam opens Create agent from the Agents list.
2. Sam types a name and picks one of three type cards: inbound, batch or code. Each card has one line of copy.
3. Sam presses Create. The agent saves on Lowest latency with labels studio_deployment, studio_preset and studio_source.
4. The builder opens on Voice & models and shows only what that type needs.

## Rainy paths
- **P0.1.b** Sam picked the wrong type: Before the first deployment, the type changes in place. After it, a dialog names the number or run that holds the agent.
- **P0.1.c** The agent was made through the API and has no type: Studio asks for the type once and suggests one from the number or run pointing at the agent.
- **P0.1.d** Create fails (400, 429): The sheet keeps the name and type, shows the error code and offers retry.
- **P0.1.e** Sam wants WhatsApp or a web page: WhatsApp is reserved and not offered. The code card says that web and app sessions use code over rtc.
- **P0.1.f** The connection drops while saving: Create locks while saving. Before a retry, Studio re-reads the agents list so a second agent is never made.
- **P0.1.g** Sam leaves the name empty: Create stays off, with one line explaining why. Studio never invents a name.
- **P0.1.h** Sam closes the sheet partway through: Nothing is saved and no draft agent appears in the list. The sheet opens empty next time.

## Goal
- 9 in 10 create sheet opens end in a saved agent within 10 minutes.
- Target: At least 90 % of create sheet opens end in a saved agent within 10 min. Details: median open to saved 30 s or less (provisional).
- Counter: deployment_type_changed before the first deployment on 10 % of agents or fewer
- Events: create_sheet_opened, deployment_type_selected (renames channel_selected), deployment_type_changed {from, to, hasDeployment}, builder_opened (port 1.0.0), operation_succeeded {operation: agent_create}, agent_created

## Scope (subtasks)
- Create sheet: name plus three type cards
- Type card copy for inbound, batch and code, one line each
- Code card line: web and app sessions use code over rtc
- Type change dialog naming the blocking number or run
- Untyped API agent: ask-once banner with a suggested type
- Create error, saving lock and retry states
- Rename in Concept A: Code/SDK to code, Outbound batch to batch

## API
- Partial. POST /agents ready. Type, preset and source live only in labels (studio_deployment, studio_preset, studio_source). The API cannot enforce the rule that batch is never inbound.
- Register: 3, 4 (done: concepts A to E, A chosen) · Journeys: B · Build loop, IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, API · API-only, saved agent

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Done. Docs. competitors/marked/vapi-09-dashboard-quickstart.png and competitors/public-docs/vapi-09-quickstart-assistant.png: create an assistant first, then set up a number. No product shot of create: the product has been signed out since 17 Sep.
- Retell: Done. Product and Docs. competitors/product/retell/retell-09-create-templates.png shows the Agent Type column and the Create an Agent button, menu not opened. competitors/public-docs/retell-09-quickstart.png: pick single prompt or conversational flow at create. At Retell the type is the engine, not the deployment.
- ElevenLabs: Done. Product. competitors/product/elevenlabs/elevenlabs-templates.png shows templates by use case. Also public-docs/elevenlabs-09-agent-quickstart.png. The type is not asked at create; channels come later.
- LiveKit: Done. Product. competitors/product/livekit/livekit-agents.png shows Deploy new agent. livekit-19-agent-builder-conversation.png shows a Type radio (open ended or data collection). Also public-docs/livekit-09-starter-apps.png.
- Owed (only if a rainy path has no evidence at all): Open the Retell Create an Agent menu and capture create in logged-in Vapi (the owner signs in on ~/.agora-design/chrome-competitors). Rainy shots still needed: a create error, a type change after a number is attached, and the empty first screen. Synthflow is the only vendor that asks inbound, outbound or widget at create (desk only: v3/02-research/builder-models-secrets.md §B). No vendor documents changing the type later.

## Previous row
- none

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
