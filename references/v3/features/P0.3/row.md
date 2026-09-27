# P0.3 · Make the conversation feel natural  (phase P0, budget 0.25 d, sheet row #P0.3)

## Job
- Situation: When the agent is close but not right, Sam makes the conversation feel natural: the agent stops talking over people, waits the right time through a silence, and still says something useful when a part fails.
- Story: Sam wants the agent to stop talking over callers, so conversations sound natural and callers stay on the line.

## Happy path P0.3.a
1. Sam opens Advanced from Voice & models. It is one panel, grouped Listen, Think, Speak.
2. Each field shows its spec default, with a tooltip instead of helper text.
3. Sam changes turn-taking, silence or filler words. The agent stays on its preset unless a model changes.
4. Sam presses Save and test and hears the change in the next answer.

## Rainy paths
- **P0.3.b** Sam enters a value out of range (silence_duration_ms 120 to 2000): The field error states the range.
- **P0.3.c** Sam changes a model while on a preset: The agent becomes Custom, and one line says why.
- **P0.3.d** The agent runs a realtime pipeline: The ASR, TTS, silence and tool groups are hidden with the reason. MCP servers stay. server_vad idle_timeout_ms shows, labelled OpenAI Realtime only.
- **P0.3.e** Sam looks for idle timeout, max duration or graceful stop: These are session settings, not agent fields. One line points to the code snippet and New run, where they live.
- **P0.3.f** Sam regrets a change: Reset returns that group to spec defaults.
- **P0.3.g** An API agent uses a field the panel lacks: The field shows read-only with its value and is never dropped on save.
- **P0.3.h** Sam leaves with unsaved changes: A guard asks Sam to save or discard.

## Goal
- 6 in 10 advanced changes are heard in the same session.
- Target: At least 60 % of Advanced changes are followed by a heard test answer in the same builder session.
- Counter: Advanced opened by 30 % of new agents or fewer before channel_connected
- Events: advanced_panel_opened, advanced_setting_changed, advanced_group_reset, model_slot_configured (port 1.0.0), agent_audio_heard (port 1.0.0 + new props surface, agentVersion; agentVersion needs an allowlist key), operation_succeeded {operation: agent_update}, agent_updated

## Scope (subtasks)
- Port AdvancedSharedSection, do not redraw
- Group order Listen, Think, Speak
- Default per field; tooltip, not helper text
- Add missing agent fields: avatar, semantic start, headers, url
- Read-only row for API fields the panel lacks
- Realtime variant: hide groups mllm lacks
- Per-group reset, range errors and leave guard

## API
- Ready: turn_detection, silence_config, filler_words, max_history, failure_message and avatar on the agent. Missing: lifecycle exists only on SessionCreate and POST /campaigns.
- Register: 38, 11 · Journeys: B · Build loop, API · API-only, saved agent, FX · Fix loop

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Done. Product and Docs. competitors/product/vapi/vapi-assistant-advanced.png, vapi-05-idle-messages.png, vapi-05-call-timeouts.png and vapi-03-fallback-transcriber.png. Also public-docs/vapi-docs-speech-configuration.png.
- Retell: Done. Product and Docs. competitors/product/retell/retell-agent-editor.png shows the Speech, Call and Security & Fallback settings accordions. Also public-docs/retell-docs-basic-settings.png and retell-03-background-noise.png.
- ElevenLabs: Done. Product and Docs. competitors/product/elevenlabs/elevenlabs-05-agent-settings.png, elevenlabs-05-conversation-limits.png and elevenlabs-06-voice-tuning.png. Also public-docs/elevenlabs-docs-llm-fallback.png.
- LiveKit: Done. Docs. competitors/public-docs/livekit-docs-turn-detector.png and competitors/public-docs/livekit-05-session-lifecycle.png. The product shots cited before (livekit-15 console sheet, livekit-18 advanced telephony) show no conversation settings and are dropped.
- Owed (only if a rainy path has no evidence at all): Open the LiveKit builder turn and interruption settings in the product. No vendor shot shows reset to default or an out-of-range error; capture one each. Desk notes: v3/02-research/builder-models-secrets.md §A (ElevenLabs grouping as a completeness checklist). Older briefs: research/02-turn-taking, research/05-call-behavior. Own shots: research/04-greeting-filler/05-shots.

## Previous row
- P0.2: read only its `features/P0.2/summary.md` if it exists (never its full spec).

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
