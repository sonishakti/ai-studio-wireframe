# ElevenLabs Agents — evals vs voice simulations

**Verdict: ONE SURFACE (with a twist).** ElevenLabs does not have two product surfaces split along Agora's eval-vs-voice-simulation line. They have a single object — a **"Test"** — with three test *types*, one of which is literally named "Simulation." All three types run as **text-only, LLM-simulated conversations** (no audio, no real voice runtime, no persona/interruption/timing/provider behavior). Their standalone "simulate conversation" API — which sounds like it could be the audio-runtime counterpart — is explicitly **deprecated** in favor of this same unified Test object. There is no separate nav item, object, or run model for a real-voice-runtime simulated caller anywhere in ElevenLabs' docs or product that we could reach.

## Nav labels (verbatim)

- Docs left nav, under **Monitor**: `Users`, `Testing`, `Experiments`, `Versioning`, `Conversation analysis` (with `Success evaluation`, `Data collection`, `Sentiment analysis`, `Searching conversations`), `Analytics`, `Spotlight`, `Real-time monitoring`... — from https://elevenlabs.io/docs/eleven-agents/customization/agent-testing
- Docs left nav, under **Guides > Quickstarts**: `Simulate Conversations` — from same page tree
- Docs left nav, under **API reference > Agents**: `Simulate conversation`, `Stream simulate conversation` — https://elevenlabs.io/docs/eleven-agents/api-reference/agents/simulate-conversation
- Docs left nav, under **API reference > Tests**: `List tests`, `Get test`, `Create test`, `Update test`, `Delete test`, `Get test summaries`, `Run tests on agent`, plus `Test folders` and `Test invocations` sub-groups
- **Logged-in product**, left sidebar under "Monitor": `Conversations`, `Users`, **`Tests`** (icon: flask) — this is the only testing-related nav item in the actual app; there is no separate "Simulate" or "Simulation" nav item.
- Inside Tests: page title **"Tests"**, tabs **"All Tests"** / **"Past Run Analysis"**, buttons **"Create Folder"** / **"Create a test"**.
- New-test screen: three tabs, verbatim: **"Simulation test"**, **"Next reply test"**, **"Tool invocation test"** — all three under one "New test" flow, one "Create" button, one "Edit as JSON" toggle.

## Object model

One noun: **Test**, with a `type` field (simulation / next-reply / tool-invocation). Confirmed via docs (https://elevenlabs.io/docs/eleven-agents/customization/agent-testing):

> "The framework includes three complementary test types: **Simulation Testing** — Runs end-to-end, multi-turn conversations with a simulated user; **Next Reply (Scenario) Testing** — Validates the agent's next response against success criteria; **Tool Call Testing** — Ensures the agent calls the right tool with the right parameters."

- **Simulation test**: define a scenario in natural language ("A tourist who is not fluent in English is trying to place an order at a restaurant"), a success condition prompt, max turns (1–50, default 5). Optional: environment selector, starting chat history, dynamic variables, tool mocking (mock none / all / selected, with a fallback of "call real tool" or "finish with error"). Run produces a **text transcript** + pass/fail against the success condition, graded by an LLM evaluator.
- **Next Reply (Scenario) test**: given a chat history, score only the agent's next message against success criteria + example success/failure replies. Also LLM-graded pass/fail.
- **Tool Call test**: assert the agent calls a specific tool with expected parameters in a given situation.
- All three are created and run from the same "Tests" list, run "from the dashboard, CLI, or API," and can be created from a real conversation ("Create test from this conversation" in call history).
- **"Simulate conversation" API** (`/v1/convai/agents/{id}/simulate-conversation` and the streaming variant) is the *same underlying capability* exposed as a raw API before "Tests" existed as a product surface — it takes a `simulated_user_config` (a prompt-driven fake user) and `extra_evaluation_criteria`, and returns a JSON transcript with turn-by-turn messages/tool calls. Per the docs banner on its guide page (https://elevenlabs.io/docs/eleven-agents/guides/simulate-conversation):

  > "This guide and the endpoints it uses are **deprecated**. Use the **Simulation** agent test type instead."

  So ElevenLabs itself collapsed what used to be two things (an ad-hoc API-only "simulate conversation" and no dedicated Tests UI) into one: the Simulation test type inside the unified Tests object.

## How "Tests" and "simulate conversation" relate

- **Same object, not two.** "Simulate conversation" is the legacy/API-only ancestor of today's "Simulation test," which now lives inside the single Tests object model alongside Next Reply and Tool Call tests.
- **Same screen, not two.** In the product there is exactly one nav item ("Tests") and one creation flow (New test) with tabs for the three types — no separate "Simulations" section.
- **Same run model.** Every type here is text-turn, LLM-simulated, deterministic-ish and gradable — this is Agora's "evals" category, not "voice simulations." Confirmed by the create-test screen's live preview panel, which renders a plain text chat bubble ("Agent: Hello, how can I help you today?") with no waveform, no audio controls, no call/mic affordance — see `elevenlabs-create-test-modal.png`.
- **Which one runs audio: neither.** We found no ElevenLabs product surface (nav item, object, or documented run model) that simulates a caller over the real voice runtime — i.e., nothing that exercises TTS/ASR audio path, turn-taking timing, interruptions, or telephony/provider behavior end-to-end the way Agora's "voice simulations" concept means it. "Simulated channel" on the Simulation test form (visible in the screenshot, defaulted to "Default") appears to control which input channel context is assumed (e.g., web widget vs. phone) for scenario framing, not to route real audio — we did not find documentation clarifying this field further within the time budget; flagging as **not fully resolved**.
- Everything under "Conversation analysis" (Success evaluation, Data collection, Sentiment analysis) applies to *real, already-happened* conversations (post-call analysis), which is a third, distinct concept from both Tests and Simulate — not a simulation surface at all.

## Screenshots

| file | shows | URL |
|---|---|---|
| elevenlabs-docs-nav.png | Full left-nav docs tree with Testing, Simulate Conversations, and API-reference Tests items all visible together | https://elevenlabs.io/docs/eleven-agents/quickstart |
| elevenlabs-simulate-conversation-deprecated.png | "Simulate Conversations" guide page showing the deprecation banner pointing to the Simulation test type | https://elevenlabs.io/docs/eleven-agents/guides/simulate-conversation |
| elevenlabs-app-agents-list.png | Logged-in product home/dashboard; left sidebar shows Monitor > Conversations, Users, Tests as separate items | https://elevenlabs.io/app/agents |
| elevenlabs-tests-list.png | Tests list empty state: "No tests found — You have not created any tests yet," tabs All Tests / Past Run Analysis | https://elevenlabs.io/app/agents/agent-testing |
| elevenlabs-create-test-modal.png | New-test screen with three tabs (Simulation test / Next reply test / Tool invocation test) and the Simulation test form; right rail shows a text-only chat preview, no audio UI | https://elevenlabs.io/app/agents/agent-testing (New test flow) |

## What would change how WE design this

1. **ElevenLabs does not validate Agora's two-surface split — it argues the opposite for the "evals" side.** They deliberately merged an API-only simulate endpoint into their unified Tests screen. If we want a unified evals object (text turns / tool-call assertions / AI-judge), their three-tab "New test" pattern (Simulation / Next Reply / Tool Call, one object, one create flow, one JSON edit mode) is a strong, validated reference for that half of our plan.
2. **Their "Simulation" is not our "voice simulation."** Despite the name collision, ElevenLabs' "Simulation test" is fully inside evals-space (text, LLM-graded, deterministic-ish, runnable via CLI/API). We should avoid naming our real-voice-runtime feature "Simulation" too, or we will confuse users coming from ElevenLabs who already associate that word with a text-only eval type. Consider a more specific name for Agora's audio-runtime concept (e.g., "Voice run" / "Live simulation" / "Call simulation") to avoid the collision.
3. **We could not find any competitor-grade example of a dedicated real-voice-runtime simulation surface at ElevenLabs** — this increases the differentiation value of Agora actually shipping one, since none of the "Tests" here exercise audio path, interruption handling, or provider timing.
4. Their tool-mocking model (mock none / all / selected tools, with a fallback of "call real tool" vs "finish with error") is a clean pattern worth reusing for our eval object's tool-call assertions.
5. Open question we could not resolve in budget: what "Simulated channel" (defaulting to "Default") actually controls on the Simulation test form — worth a follow-up pass if it turns out to gate any audio/telephony behavior.
