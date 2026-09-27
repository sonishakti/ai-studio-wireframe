# P0.13 · Try the agent without counting the tries  (phase P0, budget 0.25 d, sheet row #P0.13)

## Job
- Situation: Sam tries the agent as often as needed without those tries counting as production sessions or in the agent's numbers.
- Story: Sam wants to test freely, so tests never inflate the agent's production numbers.

## Happy path P0.13.a
1. Studio stores every session id it starts, where clearing the browser cannot lose it, and tags client_reference studio_test:.
2. Test sessions carry a Test tag and stay out of agent numbers and production counts (P1.2, P2.1).
3. Enabler (team): builder and test events port from event-spec 1.0.0 into ng-console, and the sanitiser allowlist grows.
4. Enabler (team): renames ship once, in the next schema bump, with no aliases.
5. Enabler (team): data-quality checks run green for 7 days before any P0 KPI is reported.

## Rainy paths
- **P0.13.b** Preview and local traffic count as external (classifyNonProductionAsTest): Fix this before any preview deploy.
- **P0.13.c** The sanitiser drops agentId, turnCount, configuredByUser, deploymentType, every new key and all arrays: Extend the 50-key allowlist and send fields pipe-joined.
- **P0.13.d** There is no API gateway emitter (G1): Console stages fall back to their operation_succeeded twins. API and ephemeral journeys stay unmeasured, and reports say so.
- **P0.13.e** Session and agent ids do not match (SessionListItem.agent_id is 32 lowercase characters; Agent.id has the agent_ prefix): Confirm the join key before stage 10 is reported.
- **P0.13.f** A stored test id is lost: client_reference is never returned, so the stored id is the only proof of a test. Store ids where clearing the browser cannot lose them, or the test counts as production.
- **P0.13.g** Sam blocks analytics or declines consent: Nothing is tracked without consent. Server events still count stages 3, 5 and 9, and reports show the measured share.

## Goal
- 98 in 100 agents and tests are counted, among consented users.
- Target: At least 98 %, among consented users
- Counter: Each data-quality check must read 0: untagged Studio tests; ephemeral sessions in agent aggregates; suspensions with no 80 % warning; an error badge showing 0 while the stream is down
- Events: builder_opened (port 1.0.0), agent_test_started (port 1.0.0), agent_audio_heard (port 1.0.0 + new props surface, agentVersion; agentVersion needs an allowlist key), page_viewed, operation_succeeded, agent_created, agent_updated, channel_connected, session_ended (G2, no owner)

## Scope (subtasks)
- Port builder and test events to ng-console
- Allowlist PR: 15 new keys, fields pipe-joined
- Rename map, once, no aliases, next schema bump
- Retire agent_publish and deployment status operations
- Server to client prop name map
- Durable store for Studio test ids
- Dashboard: TTFA, TTFDA, Test before Go live, FPR, with measured share
- Data-quality checks, 7 days green first

## API
- Partial. client_reference is writable on SessionCreate but never returned. Missing: purpose field, webhooks and events in the spec; the gateway emitter is unbuilt, as are the emitters for notif 112, 201 and 202.
- Register: 56 (new), 36. Enabler (team), not a job step: the team sees where Sam stalls while creating an agent. · Journeys: B · Build loop, INT · Integration, IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, API · API-only, saved agent, EP · Ephemeral only, ST · Stalled at Go live, SC · Stalled after own session, FX · Fix loop

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Partial. Product and Docs. v3/02-research/monitoring/shots/vapi-04-call-logs-list.png shows a Type column and a Call Types filter; competitors/product/vapi/vapi-12-logs-ended-reason.png shows the same filter and a Web type in the product. No shot of tests left out of counts or billing.
- Retell: Partial. Docs. v3/02-research/monitoring/shots/retell-01-call-history-list.png shows a channel type column separating web_call from phone_call. No test flag.
- ElevenLabs: Partial. Product. competitors/product/elevenlabs/elevenlabs-13-conversation-history-list.png shows the conversation list. Test marking was not verified.
- LiveKit: Partial. Product. competitors/product/livekit/livekit-15-agent-console-configuration-sheet.png: the Console test targets a deployment, 'Leave as production' by default, so tests can run on a non-production deployment. livekit-12-sessions-live.png and livekit-sessions.png show session lists with no test flag.
- Owed (only if a rainy path has no evidence at all): Evidence so far: Retell separates web_call in its channel type, Vapi has a Call Types filter, and the LiveKit Console can target a non-production deployment. Still missing at every vendor: tests left out of agent counts and billing. Check ElevenLabs test marking. Desk notes: v3/02-research/competitor-monitoring.md and observability-patterns.md.

## Previous row
- P0.12: read only its `features/P0.12/summary.md` if it exists (never its full spec).

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
