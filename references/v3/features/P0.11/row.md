# P0.11 · Connect the team's software to the agent  (phase P0, budget 0.125 d, sheet row #P0.11)

## Job
- Situation: If the team's own software will start sessions, Sam connects that software to the agent and knows the first session worked.
- Story: Sam wants the team's app to talk to the agent, so the app's users get answers inside the app.

## Happy path P0.11.a
1. In Deployment, on the code tab, Sam picks rtc or telephony, and curl or one SDK.
2. The POST /sessions snippet arrives filled with agent_id, transport, lifecycle and data_policy. The App ID, the RESTful API key link and a token note sit beside it.
3. Sam copies the snippet and runs it.
4. The tab confirms the first session for this agent.

## Rainy paths
- **P0.11.b** The first session fails (401, 403, 422): The tab shows the error code, the field at fault and one fix link.
- **P0.11.c** The session ends at the idle timeout with nobody there: Sam enters the RTC channel name, and Studio checks it against GET /sessions?channel=.
- **P0.11.d** No session 24 h after the copy: A status strip (P1.8) shows the snippet again.
- **P0.11.e** Sam's own dev sessions look like production: Studio never writes a tag into the customer's snippet. Developer sessions count as production, marked provisional until a purpose field ships.
- **P0.11.f** Sam does not want a saved agent: An ephemeral snippet sits on a secondary tab, marked account level only.
- **P0.11.g** Sam is about to put the RESTful API key in browser code: The snippet marks the key as server-side only, and the token note shows the client path.
- **P0.11.h** The failed request never reaches Studio (no gateway emitter, G1): The tab says no session has been seen yet and lists the three common errors with their fixes.

## Goal
- Median time from copying the snippet to the first session under 30 minutes.
- Target: Median 30 min wall clock or less
- Counter: Snippet copies with no first_session_detected in 7 d: 40 % or fewer
- Events: go_live_clicked, code_snippet_copied {transport, language}, first_session_detected, go_live_error_shown {errorCode}, rtc_channel_checked {found}, channel_connected {code} (G1, no owner), session_create_failed (G1, G16, no owner), agent_answered_production (derived, needs G2)

## Scope (subtasks)
- Snippet tabs: rtc, telephony; curl plus one SDK
- App ID, RESTful API key link and token note inline
- Server-side-only mark on the key
- First-session detected, not-seen-yet and error states
- RTC channel check field
- Ephemeral snippet, marked account level

## API
- Ready: POST /sessions {agent_id, transport, lifecycle, data_policy} and the GET /sessions?channel= filter. Missing: purpose field. client_reference is not returned, and list rows lack agent_session_id.
- Register: 6, 36 · Journeys: CO · Code in Studio, CO-R · Code first session fails, API · API-only, saved agent, EP · Ephemeral only, ST · Stalled at Go live

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Done. Docs. competitors/public-docs/vapi-09-quickstart-assistant.png (create programmatically, a CLI snippet, a web calling section) and competitors/marked/vapi-09-dashboard-quickstart.png (Dashboard, TypeScript, Python and cURL tabs). No in-product snippet or first-session state.
- Retell: Partial. Docs. competitors/public-docs/retell-09-quickstart.png is the phone agent quickstart and holds no code snippet. The 'Make a web call' page is listed in the docs nav in v3/02-research/monitoring/shots/retell-02-call-detail-panel.png but was not shot.
- ElevenLabs: Partial. Product and Docs. competitors/product/elevenlabs/elevenlabs-18-widget-channel-embed.png shows embed code, not a session-start snippet. Also public-docs/elevenlabs-12-conversation-events.png.
- LiveKit: Partial. Product and Docs. The Code tab shows, not opened, in competitors/product/livekit/livekit-19-agent-builder-conversation.png. Also public-docs/livekit-09-starter-apps.png.
- Owed (only if a rainy path has no evidence at all): No vendor shot shows first-session detection or dev traffic kept apart from production. Open the LiveKit builder Code tab, the Vapi web call snippet in the product, and Retell's 'Make a web call' docs.

## Previous row
- P0.10: read only its `features/P0.10/summary.md` if it exists (never its full spec).

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
