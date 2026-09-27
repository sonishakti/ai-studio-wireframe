# P0.12 · Feel sure before Go live  (phase P0, budget 0.125 d, sheet row #P0.12)

## Job
- Situation: Sam feels sure enough of the agent to put the agent in front of people outside the team. Quality row across P0, not a job step.
- Story: Sam wants to trust the agent before callers hear the agent, so going live is a decision, not a gamble.

## Happy path P0.12.a
1. Vendor logos show on presets, Custom and voice.
2. A preset switch and the first answer each get a short motion, 150 to 250 ms.
3. Empty integrations, runs and numbers each say what goes there and offer one action.
4. After the first Go live, Sam answers one question: how confident?

## Rainy paths
- **P0.12.b** Sam has reduced motion turned on: Transitions are off, and the state change is still visible.
- **P0.12.c** A logo is missing or has low contrast in dark mode: The vendor name shows as text.
- **P0.12.d** Assets load slowly: The layout holds, with no shift.
- **P0.12.e** Sam skips the confidence question: It is asked once and never again. A dismissal counts as no answer, not a low score.
- **P0.12.f** Sam uses a screen reader: Logos carry the vendor name as alt text, and motion is never the only signal.

## Goal
- Average go live confidence rating of 4 out of 5 or higher.
- Target: Mean 4.0 / 5 or higher; response rate reported; no read below n = 30 per arm
- Counter: TTFA p75 within +10 %
- Events: go_live_confidence_rated (renames deploy_confidence_rated; freeText and versionId dropped), agent_audio_heard (port 1.0.0 + new props surface, agentVersion; agentVersion needs an allowlist key)

## Scope (subtasks)
- Logo set, light and dark, SVG, with alt text
- Preset switch and first-answer motion, 150 to 250 ms
- Empty states: integrations, runs, numbers
- Reduced-motion variants
- One-question confidence survey after the first Go live, asked once

## API
- UI only
- Register: 39. Quality row: its statement is the P0 emotional criterion. · Journeys: B · Build loop, IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Partial. Product. competitors/product/vapi/vapi-assistant-model.png shows vendor logos on the module cards. Empty states and motion were not captured.
- Retell: Partial. Product. competitors/product/retell/retell-agent-editor.png shows logos on the model and voice chips. retell-16-phone-numbers-empty.png and retell-18-chat-history-empty.png show empty states. No motion.
- ElevenLabs: Partial. Product. competitors/product/elevenlabs/elevenlabs-19-tools-list.png and elevenlabs-16-phone-numbers-list.png show empty states. elevenlabs-18-agent-channels.png shows logos. No motion.
- LiveKit: Partial. Product. competitors/product/livekit/livekit-16-phone-numbers-empty-state.png, livekit-14-simulations-empty-state.png and livekit-19-agent-builder-actions.png show empty states. No motion.
- Owed (only if a rainy path has no evidence at all): Motion needs a screen recording, not a still. Record the preset switch and the first answer at Vapi and ElevenLabs. Logos and empty states are covered by the shots listed.

## Previous row
- P0.11: read only its `features/P0.11/summary.md` if it exists (never its full spec).

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
