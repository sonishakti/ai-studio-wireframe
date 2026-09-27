# P0.7 · Check the agent answers as intended  (phase P0, budget 0.125 d, sheet row #P0.7)

## Job
- Situation: Sam checks that the agent answers the way Sam intended before anyone else can reach the agent.
- Story: Sam wants proof the agent works before anyone else hears the agent, so Sam can go live without guessing.

## Happy path P0.7.a
1. Sam presses Save and test, and the test panel opens on Talk.
2. Studio saves, starts a test session from agent_id, stores its id and tags client_reference studio_test:.
3. Sam hears the first answer. The transcript runs beside it, with tool calls marked.
4. Sam ends the test and edits again. The Simulations section stays as it is.

## Rainy paths
- **P0.7.b** Sam has unsaved edits: Sessions start from agent_id, so the test saves first and never tests an old version.
- **P0.7.c** The browser denies the mic: The panel shows steps to allow it and offers a text simulation, which never counts as an answer.
- **P0.7.d** The account is suspended or free minutes are used up: test_refused fires, and Add card shows in place.
- **P0.7.e** Too many sessions are running: test_refused {reason: concurrency_limit} names the limit. Retry works once a session ends.
- **P0.7.f** The session fails to start (422, 5xx): The panel shows the error code and a retry. If a BYOK key failed, it names the module.
- **P0.7.g** A tool or MCP server fails mid-test: The failure is marked on the transcript line.
- **P0.7.h** The session starts but Sam hears nothing: The panel shows the connection state and a speaker check. Retry keeps the transcript.

## Goal
- Median time to first answer under 3 minutes, and under 6 minutes for 3 in 4.
- Target: Median 3 min or less, p75 6 min or less of active time (source console)
- Counter: VTR at least 70 % (agent_created to agent_tested_configured within 14 d)
- Events: test_panel_opened (port 1.0.0), builder_resumed (port 1.0.0), agent_test_started (port 1.0.0; configured becomes configuredByUser), agent_audio_heard {surface, configuredByUser, turnCount, trigger, agentVersion} (port 1.0.0 + new props surface, agentVersion; agentVersion needs an allowlist key), agent_test_ended (port 1.0.0), test_refused {reason: suspended|resource_limit|concurrency_limit}, integration_error_seen, agent_tested_baseline, agent_tested_configured

## Scope (subtasks)
- Save and test button states
- Panel opens on Talk; port the simulations section unchanged
- Mic denied, refused (suspended, minutes, concurrency) and start-failure states
- Nothing-heard state with connection and speaker check
- Aha 1: first answer on an untouched preset
- Transcript marks tool calls and tool errors

## API
- Partial. POST /sessions rtc with agent_id ready. client_reference is writable but never returned. Missing: purpose field. The server anchor (notif 112) is unbuilt.
- Register: 40, 52. Scope: before anyone else can reach the agent; reproducing a production surprise is P1.2. · Journeys: B · Build loop, INT · Integration, INT-R · Integration saved, not working, IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, ST · Stalled at Go live, RK · Free minutes run out

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Done. Product. competitors/product/vapi/vapi-assistant-model.png shows Talk in the header. competitors/product/vapi/sip-web-call-room-deleted-error.png shows a failed web test. Also research/15-simulations/02-research/vapi/.
- Retell: Done. Product and Desk. competitors/product/retell/retell-agent-editor.png shows Test Audio, Test LLM and Run Test, with 'call transfer not supported in Webcall'. Simulation desk text: research/15-simulations/02-research/retell/report.md.
- ElevenLabs: Done. Product. competitors/product/elevenlabs/elevenlabs-agent-agent.png shows the preview pane with voice and chat. competitors/product/elevenlabs/sip-test-call-permission-denied.png shows the mic denied.
- LiveKit: Done. Product. competitors/product/livekit/livekit-19-agent-builder-conversation.png shows Live preview, Start call and the Audio, Events and Logs tabs. Also livekit-15-agent-console-idle.png.
- Owed (only if a rainy path has no evidence at all): Rainy shots still missing at every vendor: test refused for quota or concurrency, and testing unsaved changes. Retell simulations exist as report text only.

## Previous row
- P0.6: read only its `features/P0.6/summary.md` if it exists (never its full spec).

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
