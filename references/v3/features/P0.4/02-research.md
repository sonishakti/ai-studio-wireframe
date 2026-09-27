# P0.4 · Tell the agent its job — research

## Rule 0, data first
a. **Yes.** A brand-new account only needs an agent to exist, not sessions/numbers/runs: a fresh draft agent already carries empty `prompt`, `greeting` and `failureMessage` fields ready to edit, so the happy path and every rainy path in this row are reachable with zero external data.
b. **Outside our accounts:** the four vendors' signed-in builder screens (captured earlier, reused below) and their public docs (fetched this session). Refero has no indexed screens for any of the four vendors' authenticated agent-builder UI — repeated searches (`Vapi assistant builder`, `Retell AI agent dashboard`, `ElevenLabs conversational AI agent`, plus first-message/failure/variable-specific queries) surfaced only marketing pages, unrelated SaaS tools and generic AI-chat screens, so it contributed nothing new to this row.
c. **In our fixtures:** `agent_payments` (variables + greeting + failure message all set, tick shows) and `agent_survey` (a variable with no default, empty greeting, empty failure message) already exist and cover the configured/unconfigured contrast. Missing for Design: a URL-reachable brand-new draft (`prompt: ""`) to demonstrate the empty-prompt-save block, and a way to trigger the "test with unsaved edits" and "variable asked once at test" rainy paths without a live test call.

## Vendor status

| Vendor | Status | Sources |
|---|---|---|
| Vapi | Done (existing) + gap filled (docs) | `competitors/product/vapi/vapi-assistant-model.png`; docs: `docs.vapi.ai/assistants/idle-messages`, call-ended-reason, assistant reference (WebSearch) |
| Retell | Done (existing) + gap filled (docs) | `competitors/product/retell/retell-agent-editor.png`; docs: `docs.retellai.com/build/dynamic-variables`; WebSearch on Security & Fallback Settings |
| ElevenLabs | Done (existing) + gap filled (docs, new shot) | `competitors/product/elevenlabs/elevenlabs-agent-agent.png`; docs: `elevenlabs.io/docs/eleven-agents/customization/conversation-flow` (+ downloaded screenshot), `.../personalization/dynamic-variables`, `.../customization/agent-testing` |
| LiveKit | Done (existing) | `competitors/product/livekit/livekit-19-agent-builder-conversation.png`, `competitors/public-docs/livekit-docs-speech-greeting.png`; docs: LiveKit `FallbackAdapter` reference (WebSearch) |

Refero MCP: searched, no usable results for any of the four vendors' authenticated screens (see Rule 0.b). Own prior research reused: `references/research/04-greeting-filler/05-shots/` (two shots below).

## Shots

| # | File | Source | Path | happy/rainy | Finding | Region (x,y,w,h) |
|---|---|---|---|---|---|---|
| 1 | vapi-assistant-model.png | existing | `competitors/product/vapi/vapi-assistant-model.png` | happy | "First Message" card sits directly above "System Prompt", with a mode dropdown ("Assistant speaks first") — greeting and prompt read as one block, no separate door. | 1126,795,2010,213 |
| 2 | retell-agent-editor.png | existing | `competitors/product/retell/retell-agent-editor.png` | happy (+ rainy lead) | Welcome Message sits right under the prompt; the right rail's "Security & Fallback Settings" looks like it could hold a failure message but (per docs) is only a TTS-provider failover picker — a dead end for this job. | 1725,780,655,70 |
| 3 | elevenlabs-agent-agent.png | existing | `competitors/product/elevenlabs/elevenlabs-agent-agent.png` | happy | "First message" help text documents its own empty state ("If empty, the agent will wait for the user to start") right under the field — the one vendor that states empty-field behavior inline instead of hiding it. | 589,1390,1635,258 |
| 4 | livekit-19-agent-builder-conversation.png | existing | `competitors/product/livekit/livekit-19-agent-builder-conversation.png` | happy | "Insert variable" sits as a button directly on the Instructions toolbar, and the Welcome message has its own "Allow users to interrupt" checkbox beside it. | 499,1464,1293,336 |
| 5 | livekit-docs-speech-greeting.png | existing | `competitors/public-docs/livekit-docs-speech-greeting.png` | rainy (failure lead) | "Agent speech and audio" frames all speech control, including failure recovery, as code (`session.say`, `SpeechHandle`) with a linked "Fallback strategies" page — LiveKit has no visual-builder field for a spoken failure message at all. | 981,1352,1272,488 |
| 6 | 05-silence-recap.png | existing (own) | `research/04-greeting-filler/05-shots/05-silence-recap.png` | rainy | Our own earlier exploration already placed a "Failure message" field ("Fallback message when the agent needs a moment or cannot proceed") directly under the Opening/Greeting block — the current builder's door is a consolidation of this, not a new idea. | 445,528,710,85 |
| 7 | 07-hear-disabled.png | existing (own) | `research/04-greeting-filler/05-shots/07-hear-disabled.png` | rainy | Same earlier exploration disables "Hear the opening" with a reason ("nothing to hear") rather than hiding or no-oping it — the honesty-floor pattern P0.4's rainy paths should keep. | 445,232,710,80 |
| 8 | elevenlabs-docs-01-soft-timeout-failure-message.png | docs (new) | `references/v3/features/P0.4/shots/elevenlabs-docs-01-soft-timeout-failure-message.png` | rainy (P0.4.d analog) | The only vendor field close to "what to say on failure": Advanced tab → Soft timeout → enable "Use LLM-generated message" → a required "Fallback" text field, used "when the LLM-generated message fails or takes too long." It is scoped to timeout filler, not a general failure message, and is three clicks deep behind an alpha toggle. | 925,395,1125,310 |
| 9 | before-01-system-prompt-row.png | before | `references/v3/features/P0.4/shots/before-01-system-prompt-row.png` | happy | Today's Agent tab: System prompt, the Variables line (`customer_name`, `amount_due`, `due_date` chips) and the "Greeting and failure message" button with a tick, all in one row — captured from the live preview, agent `agent_payments`. | 965,955,1520,70 |
| 10 | before-02-greeting-sheet-open.png | before | `references/v3/features/P0.4/shots/before-02-greeting-sheet-open.png` | happy | The door opens a compact sheet: Greeting text + "who speaks first" select, then a separate "Failure message" field with an info tip ("Spoken when the model cannot reply") — clearer and shallower than any vendor's equivalent. | 2345,460,815,195 |
| 11 | before-03-empty-greeting-no-default.png | before | `references/v3/features/P0.4/shots/before-03-empty-greeting-no-default.png` | rainy (P0.4.c/d today) | Agent `agent_survey`: the Variables line shows `customer_name` with no default-value affordance at all, and the door button carries no tick (nothing configured) — today's UI has no way to see or set a variable default, and no warning that the failure message is unset. | 970,1155,1510,80 |

## Per-vendor copy / avoid

**Vapi** — copy: greeting mode and prompt in one visual block, no extra click. avoid: no field anywhere for a model-failure message; `voicemailMessage`/`endCallMessage`/`idleMessages` are for different moments (voicemail, call end, silence) and don't cover "the LLM didn't answer."

**Retell** — copy: Welcome Message and its pause timing sit immediately under the prompt. avoid: "Security & Fallback Settings" reads like the answer to "what does the agent say on failure" but is only a TTS-provider failover picker (docs: fallback *voice*, not fallback *message*) — a false lead.

**ElevenLabs** — copy: documents its own empty-field behaviour inline under First message. avoid: the nearest thing to a failure message is buried at Advanced → Soft timeout → Fallback, scoped only to timeout filler; a required variable missing at test time can fail the test outright ("Missing required dynamic variables") with no transcript, rather than asking once.

**LiveKit** — copy: "Insert variable" as a persistent toolbar button while writing. avoid: failure handling (`FallbackAdapter`, pre-recorded audio for TTS failure) is code-only; the visual Builder has no equivalent field, so a low-code user has no path to it at all.

## Gaps

- No vendor (Vapi, Retell, LiveKit) has a UI field for "what the agent says when it can't respond at all"; ElevenLabs has one, but scoped to timeout filler only and hidden three levels deep. Our single, named "Failure message" behind one door is already ahead of all four — Design should keep it prominent, not hide it to match vendor patterns.
- Confirmed for Retell and ElevenLabs: an unset `{{variable}}` stays literal with the braces intact and does not block saving or the call; ElevenLabs additionally can hard-fail a *test* call if a required variable has no value ("Missing required dynamic variables"). Vapi's and LiveKit's exact behaviour for this specific moment (save-time vs. call-time) is not documented on the pages checked — undocumented, not contradicted.
- No vendor documents what happens when you try to save an empty system prompt (found for none of the four). P0.4.b's spec (block save, explain why, one-click restore preset) has no vendor precedent to copy or avoid — Design is working from first principles here, which is fine but worth flagging since there's no "avoid this vendor's version" evidence either.
- The current prototype has no URL-reachable brand-new draft agent (empty prompt) to screenshot the empty-prompt-save block, and no way to reach "test with unsaved edits" or "variable asked once at test" without a live test-call flow that doesn't exist yet in the builder. Design/Build will need to decide whether these become new fixtures/URL states or stay described-only in the build spec.
