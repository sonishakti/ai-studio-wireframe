# P0.2 · Change the default voice  (phase P0, budget 0.5 d, sheet row #P0.2)

## Job
- Situation: If Sam is not happy with the default voice, Sam changes the speech recognition, language model, voice and language until the agent sounds right and answers well enough for the use case.
- Story: Sam wants the agent to sound right and answer well without learning every vendor, so time goes into the prompt, not into model shopping.

## Happy path P0.2.a
1. Voice & models opens with Lowest latency selected. One strip shows its speech recognition, language model and voice logos.
2. Sam plays a sample from the voice dropdown and picks a voice.
3. If answers need more intelligence, Sam picks Balanced. The copy names the trade-off between latency and intelligence and never shows a price.
4. For full control, Sam opens Custom. It is pre-filled with the current preset, and Sam changes the vendor, model or language per module.
5. One region line reads US East, and SuperNode is named inside Lowest latency. Sam saves.

## Rainy paths
- **P0.2.b** A preset's model is down (vendor outage, SuperNode capacity): The preset is disabled with the reason. The saved pipeline is untouched.
- **P0.2.c** Sam half-filled Custom, then picked a preset: A confirm asks before the Custom values are discarded.
- **P0.2.d** An API agent's pipeline matches no preset: It opens as Custom with its own values.
- **P0.2.e** The voice sample will not play: Sam can retry inline. The voice still saves.
- **P0.2.f** Sam works far from US East: A latency note sits on the preset. There is no region picker.
- **P0.2.g** The voice cannot speak the chosen language: The voice list filters to the language. A saved mismatch shows one line on the voice row.
- **P0.2.h** Sam wants the price before choosing: No price shows until pricing clears. One tracked link opens the pricing page.

## Goal
- 7 in 10 go lives keep Lowest latency or Balanced without opening Custom.
- Target: At least 70 % of Go lives with Custom never opened (Lowest latency or Balanced, any voice). Details: when Sam changes the voice or a model, median 90 s of active time or less (provisional).
- Counter: manual_config_opened with no model_slot_configured before builder_exited: 10 % of Custom opens or fewer
- Events: builder_opened (port 1.0.0), preset_changed (renames stack_preset_changed; enum lowest_latency|balanced|custom), manual_config_opened (port 1.0.0; fires when Custom opens), builder_exited (port 1.0.0), voice_previewed (port 1.0.0), voice_selected (port 1.0.0), model_slot_sheet_opened (port 1.0.0), model_slot_configured (port 1.0.0), model_slot_abandoned (port 1.0.0), external_link_opened {surface: pricing}, agent_updated

## Scope (subtasks)
- Two preset radios plus Custom, three to four lines
- Logo strip per preset: Listen, Think, Speak
- Preset copy on latency and intelligence, never price
- Voice dropdown: bounded list, inline sample play, filtered by language
- Custom: per-module vendor, model and language rows, pre-filled
- Region line and SuperNode inside Lowest latency
- Price slot behind a flag; tracked pricing link
- Unavailable preset, unmatched API pipeline and language mismatch states

## API
- Ready: presets write a full pipeline (cascaded or realtime). Partial: preset identity lives only in labels.studio_preset. Missing: region, price and SuperNode fields.
- Register: 1, 2, 37, 39, 51; 35 (copy only) · Journeys: B · Build loop, IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, API · API-only, saved agent

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Done. Product. competitors/product/vapi/vapi-assistant-model.png shows transcriber, model and voice cards with a logo, cost and latency each. Also vapi-assistant-voice-panel.png, vapi-06-voice-panel.png and vapi-03-transcriber-panel.png.
- Retell: Done. Product and Docs. competitors/product/retell/retell-agent-editor.png shows model, voice and language chips with a 690 to 1090 ms latency range. Also retell-agent-voice-picker.png and public-docs/retell-docs-voices.png.
- ElevenLabs: Done. Product. competitors/product/elevenlabs/elevenlabs-voice-library.png, elevenlabs-06-voice-settings.png, elevenlabs-06-voices-expressive.png and elevenlabs-03-language-additional.png.
- LiveKit: Done. Product and Docs. competitors/product/livekit/livekit-voices.png and livekit-voices-default.png. Also public-docs/livekit-03-stt-vendors.png and livekit-docs-tts-voices.png. The Models & Voice tab was not opened.
- Owed (only if a rainy path has no evidence at all): No vendor offers a latency preset. Vapi shows cost and latency per module and Retell shows a latency range. Still to capture: the LiveKit builder Models & Voice tab, a voice sample failing, a voice that does not match the language, and a disabled model. Desk notes: v3/02-research/builder-models-secrets.md §A.

## Previous row
- P0.1: read only its `features/P0.1/summary.md` if it exists (never its full spec).

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
