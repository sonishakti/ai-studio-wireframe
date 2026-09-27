# P0.9 · Let callers reach the agent  (phase P0, budget 0.25 d, sheet row #P0.9)

## Job
- Situation: If people will dial the agent, Sam gives them a number that reaches the agent, and makes sure a session ends cleanly or passes to a person when the agent should stop.
- Story: Sam wants support callers to reach the agent, so no caller waits for a person.

## Happy path P0.9.a
1. In Deployment, on the inbound tab, Sam picks a number or adds one by SIP trunk.
2. Sam sets the call policy: max duration, max silence and four end rules.
3. Sam adds a transfer: an E.164 number and when to hand over.
4. Go live sets inbound.agent. Sam dials the number to hear the agent.

## Rainy paths
- **P0.9.b** The project has no numbers: Sam adds one by SIP trunk in place. There is no purchase endpoint, so carrier setup docs are linked.
- **P0.9.c** The import fails (duplicate number 409, bad SIP host): The error shows on the field at fault.
- **P0.9.d** The number already points at another agent: A confirm names that agent before re-pointing.
- **P0.9.e** The transfer number is not E.164: A field error states the format.
- **P0.9.f** The number saves but callers never arrive (trunk misconfigured): There is no health field. The row reads Not reached yet, the carrier checklist is linked, and Sam dials to check.
- **P0.9.g** Sam wants an idle timeout on inbound: Lifecycle is not settable on inbound yet. Max silence in the call policy is the nearest control, and one line says so.
- **P0.9.h** No production answer within 3 d (ST), or only Sam by day 14 (SC): A status strip (P1.8) names the number and offers 'Dial it to hear your agent'.

## Goal
- Median active time to go live under 6 minutes, first answered call under 10 minutes.
- Target: Active part median 6 min or less (2× TTFA or less). Wall clock to first answer, median 10 min or less.
- Counter: Stalled deployments (stage 9 with no stage 10 within 3 d): 20 % or fewer (blocked on G2)
- Events: go_live_clicked, go_live_blocked, phone_number_linked {entryPoint, wallMs} (port 1.0.0 + new prop entryPoint; 1.0.0 has source), number_reassigned {fromAgentId}, call_policy_opened {entryPoint}, operation_succeeded {operation: telephony_phone_number_bind}, channel_connected, agent_answered_production (derived, needs session_ended: G2, no owner)

## Scope (subtasks)
- Number picker with add-by-SIP sheet
- Call policy: max duration, max silence, four end rules
- Transfer: E.164 number plus when to transfer
- Re-point confirm naming the current agent
- No-number blocked state with carrier docs link
- Import error and not-reached-yet row states

## API
- Ready: POST and PATCH /numbers inbound {agent, call_policy, transfer}. Missing: data_policy, number purchase and lifecycle on inbound.
- Register: 48; 33 (add-number sheet). Scope: this agent's first number; all the team's numbers are P3.2 and P3.3. · Journeys: IN · Inbound in Studio, ST · Stalled at Go live, SC · Stalled after own session

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Done. Product and Docs. competitors/product/vapi/sip-phone-number-unprovisioned.png. Also public-docs/vapi-sip-trunking.png.
- Retell: Done. Product. competitors/product/retell/retell-16-phone-numbers-empty.png, retell-16-add-number-menu.png, retell-16-buy-number-identity-gate.png and retell-17-sip-trunk-form.png.
- ElevenLabs: Done. Product. competitors/product/elevenlabs/elevenlabs-16-phone-numbers-list.png (empty), elevenlabs-16-import-from-twilio-form.png, elevenlabs-17-sip-trunk-form.png and sip-trunk-form-validation-error.png.
- LiveKit: Done. Product. competitors/product/livekit/livekit-16-phone-numbers-empty-state.png, livekit-17-inbound-trunk-form.png, livekit-17-dispatch-rule-form.png and livekit-17-trunk-json-editor-validation.png.
- Twilio: Partial. Desk. research/16-phone-number-purchase/02-research/_docs.md: the carrier the others wrap, and the per-country regulatory model.
- Owed (only if a rainy path has no evidence at all): Well covered. Still missing: a first-session confirmation after pointing a number, which no vendor shot shows. Desk notes: research/16-phone-number-purchase and research/17-sip-trunk-setup (_docs.md).

## Previous row
- P0.8: read only its `features/P0.8/summary.md` if it exists (never its full spec).

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
