# P0.4 · Tell the agent its job  (phase P0, budget 0.125 d, sheet row #P0.4)

## Job
- Situation: Sam tells the agent its role and job, the first thing to say, and what to say when something fails.
- Story: Sam wants the agent to handle a real task, so callers get the job done in one session.

## Happy path P0.4.a
1. Prompt & knowledge opens with the prompt editor first.
2. Sam writes the prompt. {{variables}} show as chips, each with an optional default.
3. Sam opens Greeting to set the first line, when it plays, its delay and the failure message.
4. Sam presses Save and test.
5. Optional: Sam says what a successful session looks like in Analysis (P1.9).

## Rainy paths
- **P0.4.b** Sam clears the prompt: Save is blocked, with one line explaining why. One action restores the preset prompt.
- **P0.4.c** A {{variable}} has no default: The test asks for a value once. For batch, the variable maps to a list column at New run.
- **P0.4.d** No failure message is set: A tooltip says the agent stays silent when the language model fails. One click adds a suggested line.
- **P0.4.e** The agent speaks first but the greeting is empty: Save names the empty line. Sam writes one or switches to caller first.
- **P0.4.f** Sam tests with unsaved prompt edits: The test saves first, so Sam never hears an old prompt.

## Goal
- Median time to first prompt change under 2 minutes.
- Target: Median 2 active min or less from builder_opened to the first prompt or greeting save. Details: at least 80 % of agent_created {source console} reach agent_configured within 14 d (funnel read).
- Counter: Prompt churn (3 or more prompt_edited with no heard test between them) in 20 % of builder sessions or fewer
- Events: prompt_edited (port 1.0.0), greeting_configured (renames opening_configured), builder_opened (port 1.0.0), agent_updated, agent_configured (derived)

## Scope (subtasks)
- Prompt editor as the section's first block
- Greeting sheet: text, who speaks first, delay, failure message
- Variable chips with an optional default value
- Empty prompt, empty greeting and missing failure message states

## API
- Ready: instructions, greeting {mode, on, delay_ms, text}, llm.failure_message, variables.
- Register: 5, 9, 11, 40. Cross-link: P1.9 defines what a good session looks like. · Journeys: B · Build loop, INT · Integration, IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio

## Research already done (reuse, do not re-capture; paths relative to references/)
- Vapi: Done. Product. competitors/product/vapi/vapi-assistant-model.png shows First Message with 'Assistant speaks first' above the System Prompt editor.
- Retell: Done. Product. competitors/product/retell/retell-agent-editor.png shows the prompt leading, with Welcome Message ('AI speaks first') and pause before speaking.
- ElevenLabs: Done. Product. competitors/product/elevenlabs/elevenlabs-agent-agent.png shows System prompt with {{ variables, First message with Interruptible, and a disclosure link.
- LiveKit: Done. Product and Docs. competitors/product/livekit/livekit-19-agent-builder-conversation.png shows Instructions with Insert variable and a Welcome message with an interrupt toggle. Also public-docs/livekit-docs-speech-greeting.png.
- Owed (only if a rainy path has no evidence at all): No vendor shot shows where the failure message lives. Capture it, plus an empty-prompt save and a variable with no value at test. Own before and after shots: research/04-greeting-filler/05-shots.

## Previous row
- P0.3: read only its `features/P0.3/summary.md` if it exists (never its full spec).

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
