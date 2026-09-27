# P0.8 · Confirm the agent is ready  (phase P0, budget 0.125 d, sheet row #P0.8)

## Job
- Situation: Before people outside the team reach the agent, Sam confirms nothing the agent needs is missing.
- Story: Sam wants to go live without surprises, so the first outside caller meets a finished agent.

## Happy path P0.8.a
1. Sam opens Deployment, which comes after Test and is separate from Integrations. The tab for the agent's type opens first.
2. Readiness lists a heard test on this version, the prompt, and a number or contact list, with one fix link each.
3. Sam decides how long what people say to the agent is kept: 30 days or none. This may become its own step; owner to decide.
4. Sam presses Go live inside the same area.

## Rainy paths
- **P0.8.b** No test was heard since the last change: Readiness names the gap and offers Test. Go live is still allowed.
- **P0.8.c** Sam has no number or no contact list: go_live_blocked shows its codes, with one fix link each.
- **P0.8.d** Sam wants zero retention on inbound or batch: Number and Campaign have no data_policy. The option shows disabled, with the reason, until the API adds it.
- **P0.8.e** The agent already has a deployment: The tab shows the deployment and its status, not an empty form.
- **P0.8.f** The agent has no deployment type (made through the API): go_live_blocked {code: no_deployment_type} fires, and Studio asks for the type once (P0.1.c).
- **P0.8.g** The account is suspended at Go live: The minutes banner and Add card show in place. New sessions are refused until reactivation.
- **P0.8.h** Sam edits an agent that already has a deployment: There is no publish step, so every save reaches callers at once. On save, one line names the number or run using the agent and offers Test (see proposed P0.14).

## Goal
- 85 in 100 go lives are tested on that exact version before going live.
- Target: At least 85 %, as an absolute floor
- Counter: TTFDA active median within +10 % of the readiness-off arm
- Events: readiness_opened (renames preflight_opened), go_live_clicked {deploymentType, hasNumber} (renames deploy_clicked), go_live_blocked {code: no_deployment_type|no_number|no_list|no_test} (renames deploy_blocked), data_policy_selected, agent_audio_heard (port 1.0.0 + new props surface, agentVersion; agentVersion needs an allowlist key), channel_connected

## Scope (subtasks)
- Area shell: type tab first, others hidden
- Readiness rows, one fix link each
- Data policy: 30 days or none; disabled state
- Existing-deployment summary state per type
- Line on save for an agent with a deployment
- Replace Deploy and Connect copy with Deployment, Go live

## API
- Partial. data_policy exists only on SessionCreate (code). Missing on Number.inbound and Campaign.
- Register: 6, 46. Open: retention as its own step (owner). · Journeys: IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, ST · Stalled at Go live, INT · Integration

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Partial. Desk. v3/02-research/batch-retention-experiments.md §2: account-level HIPAA mode. No readiness or retention shot.
- Retell: Partial. Docs. v3/02-research/monitoring/shots/retell-05-data-storage-settings.png shows per-agent storage tiers: the data policy only. No readiness shot.
- ElevenLabs: Partial. Product and Desk. competitors/product/elevenlabs/elevenlabs-18-agent-channels.png shows the per-agent Deploy area. Zero Retention Mode, which does not work with batch: desk text in batch-retention-experiments.md §2. No readiness shot.
- LiveKit: Partial. Product. competitors/product/livekit/livekit-13-observability-settings-pii-redaction.png shows the data setting. livekit-agents.png shows Deploy new agent. No readiness shot.
- Owed (only if a rainy path has no evidence at all): None of the four vendors ships a readiness check before going live. Confirm this with product shots of each vendor's go-live step. Capture the ElevenLabs Zero Retention toggle and the Vapi HIPAA setting in the product. Desk notes: v3/02-research/batch-retention-experiments.md §2.

## Previous row
- P0.7: read only its `features/P0.7/summary.md` if it exists (never its full spec).

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
