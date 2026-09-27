# P0.14 · Change an agent people reach  (phase P0, budget 0 d, sheet row #P0.14)

## Job
- Situation: Sam changes an agent that people already reach without surprising the people talking to that agent. Proposed Modify step, for owner sign-off.
- Story: Sam wants to improve a live agent's greeting, so callers hear the better version without a broken session in between.

## Happy path P0.14.a
1. Sam edits the agent and presses Save and test.
2. Before the save lands, one line names the number or run using the agent and says the change reaches callers on their next session.
3. Sam hears the changed agent answer in a test.
4. Sam opens 'Sessions since this change' on the agent page (P1.3) to watch the next sessions.

## Rainy paths
- **P0.14.b** Sam saves a change that breaks the agent: There is no publish step or version history in the v3 spec, so the save reaches callers at once. The error badge shows 'New since change' (P1.1), and Sam reverts by hand. Agent versions are raised as an API ask.
- **P0.14.c** Sam saves while sessions are running: The line says running sessions keep the agent they started with (API team to confirm).
- **P0.14.d** Someone else saved the agent first (412): Studio shows both versions and keeps Sam's edits to reapply (P3.5.d).
- **P0.14.e** Sam changes the deployment type of a live agent: A dialog names the number or run that holds the agent (P0.1.b).

## Goal
- Fewer than 1 in 10 live agent changes are undone within a day.
- Target: ≤ 10 % of agent_updated on agents with a deployment are followed by agent_reverted within 24 h (provisional)
- Counter: Live changes saved with no heard test on that version ≤ 30 %
- Events: surface_viewed {surface: live_change_notice}, agent_audio_heard (port 1.0.0 + new props surface, agentVersion; agentVersion needs an allowlist key), agent_updated, agent_reverted (derived)

## Scope (subtasks)
- Save-time line naming the number or run
- Sessions since this change door after save
- Revert guidance until the API has versions

## API
- Missing. No publish step, versions or draft on Agent; every PATCH reaches production. Ask: agent versions.
- Register: Proposed (new), from P0.8.h. Not budgeted until the owner signs off. · Journeys: FX · Fix loop, IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Partial. Product and Docs. competitors/product/vapi/vapi-12-logs-ended-reason.png shows a Version column (v1) on calls, and the docs nav names Versioning (competitors/public-docs/vapi-09-quickstart-assistant.png). The draft and publish flow was not opened.
- Retell: Partial. Docs. v3/02-research/monitoring/shots/retell-02-call-detail-panel.png: the docs nav lists Agent versions and tags and Compare agent versions, and the call header shows a version. The versions UI was not shot.
- ElevenLabs: Not started. Not started: no versioning or live-edit capture.
- LiveKit: Partial. Product. competitors/product/livekit/livekit-18-agent-builder-advanced-telephony.png shows Versions in the agent nav, 'Last saved' and Deploy agent. Versions was not opened.
- Owed (only if a rainy path has no evidence at all): Open the Vapi draft and publish flow, Retell agent versions and compare, and LiveKit Versions. Question: does any vendor warn that a save reaches callers at once?

## Previous row
- P0.13: read only its `features/P0.13/summary.md` if it exists (never its full spec).

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
