# P0.6 · Run the agent on the team's own accounts  (phase P0, budget 0.125 d, sheet row #P0.6)

## Job
- Situation: Sam runs this agent on the team's own provider accounts, so usage lands on contracts the team already has.
- Story: Sam wants the agent billed to the team's own vendor account, so usage counts against a contract the team already pays for.

## Happy path P0.6.a
1. On a module (speech recognition, language model or voice), Sam switches from managed to BYOK.
2. Sam pastes the key. Studio writes one secret set per module key (studio-<agent_id>-<module>) and references $secrets.<set>.<key>.
3. The field reads Saved, hidden. The value is never shown again.
4. Sam tests, and the answer proves the key works.

## Rainy paths
- **P0.6.b** The secret set name is taken (409): Studio adds a suffix to the name and never overwrites another set.
- **P0.6.c** Sam pasted a wrong key or pasted into the wrong module: The spec has no validation call. The next test fails, and the vendor error shows on that module.
- **P0.6.d** Sam needs to replace a key: Sam pastes a new value. PUT replaces that module's one-key set and leaves other modules untouched.
- **P0.6.e** Sam goes back to managed and wants the key gone: credential.mode becomes managed and the set is kept. Delete is refused while the set is referenced, and the 409 names one agent in text.
- **P0.6.f** The key is revoked after the agent went live: Failed sessions show 'provider key rejected' on that module (P2.3). Sam replaces only that key, and Talk to agent confirms the fix.
- **P0.6.g** Sam already stored the key on the Secrets page: The field offers the saved $secrets reference, so Sam does not paste the key again (depends on P3.1).

## Goal
- 9 in 10 tested provider keys work.
- Target: At least 90 % of tested keys. Details: keys never tested within 24 h are reported beside it.
- Counter: credential_page_exited per new agent: 0.2 or fewer
- Events: credential_mode_changed {module, entryPoint} (port 1.0.0; renames slot to module, adds entryPoint), secret_saved {entryPoint, action: create|replace}, byok_key_failed {module}, credential_page_exited (port 1.0.0), agent_test_started (port 1.0.0), agent_audio_heard (port 1.0.0 + new props surface, agentVersion; agentVersion needs an allowlist key), operation_succeeded {operation: secret_set_create} (existing event, new value; 2.2.0 schema bump), byok_enabled

## Scope (subtasks)
- BYOK switch per module, managed by default
- Paste field to Saved, hidden; never reveal
- One set per module key naming rule
- Key failed in test state on the module
- Replace key action, no reveal
- Pick a saved secret reference (after P3.1)

## API
- Partial. POST /secrets (409 on a taken name). PUT replaces the whole set, so each set holds one key. DELETE is refused while referenced (409). credential.mode byok accepts $secrets refs. Missing: key validation and per-key PATCH.
- Register: 12, 45. Scope: one agent's keys; keys shared across agents are P3.1. · Journeys: B · Build loop, IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, FX-R · Fix with nothing to read

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Partial. Desk. v3/02-research/builder-models-secrets.md §C: provider keys sit under Integrations, and a valid key moves billing to the vendor. No shot.
- Retell: Partial. Desk. v3/02-research/builder-models-secrets.md §C: there is no first-party UI for bringing your own vendor key. No shot.
- ElevenLabs: Partial. Desk. v3/02-research/builder-models-secrets.md §C: workspace Secrets store and secret-type headers. No shot of the store.
- LiveKit: Partial. Product. competitors/product/livekit/livekit-18-agent-builder-advanced-telephony.png shows a Secrets block with Add secret inside the builder (env vars and HTTP tool calls), not opened. livekit-19-agent-configuration-secrets.png shows the agent Secrets table, empty. No paste, rotation or wrong-key state. Same status as P3.1.
- Owed (only if a rainy path has no evidence at all): LiveKit shows an inline Add secret entry point in the builder, not opened. No vendor shows the paste itself, a rotation or a wrong-key error. Capture Vapi provider keys, the ElevenLabs workspace secrets, the LiveKit add-secret sheet and any wrong-key error. Desk notes: v3/02-research/builder-models-secrets.md §C. No vendor shows which agents use a secret before it is deleted.

## Previous row
- P0.5: read only its `features/P0.5/summary.md` if it exists (never its full spec).

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
