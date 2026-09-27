# P0.10 · Have the agent dial a list of people  (phase P0, budget 0.25 d, sheet row #P0.10)

## Job
- Situation: If the agent will dial a list of people, Sam has the agent reach them only at acceptable times and without overloading the team or the phone lines.
- Story: Sam wants the agent to remind 500 patients about their appointments, so every patient hears the reminder at a reasonable hour.

## Happy path P0.10.a
1. In Deployment, on the batch tab, Sam opens New run and uploads the contact list.
2. Sam maps each {{variable}} to a list column and picks the from number.
3. Sam sets calling windows by weekday, pacing, call policy, voicemail and lifecycle.
4. Sam sees the estimated minutes against free minutes left, then starts now or schedules.

## Rainy paths
- **P0.10.b** Some rows are bad (not E.164, missing variable column): The rejected count shows, and Sam can download the rejects.
- **P0.10.c** A {{variable}} has no list column: go_live_blocked batch_uncovered_vars fires, and Sam maps a column.
- **P0.10.d** Sam starts now while calling windows are closed: The status stays running, as the API returns it. The next dial time is computed from schedule.days.
- **P0.10.e** The run failed: The panel shows the failure code, provider and message. Run again opens New run with the stored list.
- **P0.10.f** Estimated minutes exceed free minutes left: Add card shows. Starting is still allowed.
- **P0.10.g** Free minutes run out mid-run (RK): The account is suspended and the run pauses with reason suspended (API team to confirm). The minutes banner offers Add card, and Sam resumes from the Runs panel (P1.7).
- **P0.10.h** Sam needs to stop a run that is going wrong: Pause stops new dials at once while sessions in progress finish. Resume and Cancel sit beside it.
- **P0.10.i** The run was created through the API: Contacts are never returned, so Run again asks for the list.

## Goal
- 7 in 10 batch agents start a run within a week of the first configured test.
- Target: At least 70 % within 7 d of the first configured test. Details: wall clock from Campaign.started_at to the first completed contact, median 15 min or less.
- Counter: Runs cancelled in the first 10 min: 10 % or fewer (run_status_changed {to: canceled} or operation_succeeded {operation: telephony_campaign_interrupt})
- Events: contact_list_uploaded {rows, rejected}, go_live_clicked {deploymentType: batch, estMinutes, freeMinutesLeft}, go_live_blocked, run_status_changed {to, trigger}, operation_succeeded {operation: telephony_campaign_create}, operation_succeeded {operation: telephony_campaign_interrupt}, channel_connected, agent_answered_production (derived; provisional for batch: counts.completed of 1 or more)

## Scope (subtasks)
- New run sheet from Concept A NewRunSheet
- Calling windows by weekday, ported from the current Console
- Pacing as max_calls_per_second, not delay ms
- CSV check: rejected count and download
- Variable to list column mapping block
- Estimated minutes against free minutes left
- Pause, resume and cancel controls; Run again with the stored list

## API
- Ready: POST /campaigns (contacts, schedule.days, pacing, max_attempts, call_policy, voicemail, lifecycle), plus :pause, :resume and :cancel. Missing: data_policy, returned contacts and a next-start field.
- Register: 7, 48 · Journeys: BA · Batch run in Studio, RK · Free minutes run out, ST · Stalled at Go live

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Partial. Desk. v3/02-research/batch-retention-experiments.md §1 (Outbound Campaigns). The product is signed out, and research/18-channels/merger-v3/research-vapi.json is empty.
- Retell: Done. Product and Docs. competitors/product/retell/retell-18-batch-call-form.png and retell-21-contact-fields.png. Also public-docs/retell-18m-batchcall-agent-fromnumber.png.
- ElevenLabs: Done. Product and Docs. competitors/product/elevenlabs/elevenlabs-18-batch-call-form.png, elevenlabs-18-batch-channel-chooser.png and elevenlabs-18m-batch-list-empty.png. Also public-docs/elevenlabs-18m-batch-calling-docs.png.
- LiveKit: Done. Docs, absent. LiveKit has no batch product. competitors/public-docs/livekit-18m-outbound-calls-agent-dispatch.png and livekit-18m-agent-dispatch-explicit.png show per-session dispatch only. Same rule as P2.5.
- Bland: Partial. Desk. v3/02-research/batch-retention-experiments.md §1 (Batches). The Bland shots cover session logs only.
- Owed (only if a rainy path has no evidence at all): Vapi campaigns are blocked (signed out, and the docs slugs returned 404). Capture rejected rows and a failed or partial run at Retell and ElevenLabs; their batch lists were empty on 23 Sep. Desk notes: v3/02-research/batch-retention-experiments.md §1, research/18-channels/merger-v3/report.md and research/21-crm-contacts.

## Previous row
- P0.9: read only its `features/P0.9/summary.md` if it exists (never its full spec).

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
