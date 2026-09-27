# P0.15 · Retire an agent  (phase P0, budget 0 d, sheet row #P0.15)

## Job
- Situation: Sam retires an agent without leaving a number or run pointing at nothing. Proposed Conclude step, for owner sign-off; mark out of scope if preferred.
- Story: Sam wants to remove an old agent, so no caller reaches a dead number and no run dials with a missing agent.

## Happy path P0.15.a
1. Sam chooses Delete on the agent.
2. A confirm lists every number and run that uses the agent, with a door to re-point or stop each.
3. Sam re-points the number to another agent and cancels the run.
4. Sam types the agent name and deletes. Its sessions and error groups stay in history, tagged Agent deleted (P1.4.g, P2.1.b).

## Rainy paths
- **P0.15.b** A number still points at the agent: Delete is blocked until the number is re-pointed or cleared (API team to confirm the server rule).
- **P0.15.c** A scheduled or running run uses the agent: Delete is blocked; the confirm names the run and offers Pause or Cancel.
- **P0.15.d** The agent's secret sets are used by no other agent: The confirm offers to retire those sets too; they are kept by default (P3.1).
- **P0.15.e** The team's own code still starts sessions with this agent: Studio cannot see code references; the confirm says sessions started from code with this agent id will fail.
- **P0.15.f** Sam deletes by mistake: There is no undo in the v3 spec, so the confirm asks Sam to type the agent name.

## Goal
- No number or run points at a deleted agent.
- Target: 0 numbers or runs that reference a deleted agent
- Counter: Deletes followed by a new agent with the same name within 24 h ≤ 5 %
- Events: operation_succeeded {operation: agent_delete}, agent_delete_blocked {numberCount, runCount}, orphan_deployment (derived, daily scan)

## Scope (subtasks)
- Delete confirm listing numbers and runs
- Blocked states with doors to re-point or cancel
- Type-to-confirm
- Deleted-agent tags in history (P1.4.g, P2.1.b)

## API
- Partial. DELETE /agents exists. Unconfirmed: whether it is refused while a number or run references the agent. No undo.
- Register: Proposed (new). Not budgeted until the owner signs off. · Journeys: IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, API · API-only, saved agent

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Not started. Not started: no delete or retire flow captured.
- Retell: Not started. Not started: no delete or retire flow captured.
- ElevenLabs: Not started. Not started: no delete or retire flow captured.
- LiveKit: Not started. Not started: no delete or retire flow captured.
- Owed (only if a rainy path has no evidence at all): Shoot the delete flow at each vendor with a number attached: is it blocked, warned or silent? Question: does any vendor list what uses an agent before deleting it?

## Previous row
- P0.14: read only its `features/P0.14/summary.md` if it exists (never its full spec).

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
