# Vapi — Evals vs Voice Simulations research

## Verdict line
**SPLIT.** Vapi models this as two distinct product surfaces — **Evals** and **Simulations** — each with its own nav item, its own object model, and its own docs section under "Observability." They are explicitly and repeatedly contrasted in Vapi's own docs ("Use Evals for decisions and Simulations for outcomes"), which maps almost exactly onto Agora's evals-vs-voice-simulations split.

## Nav labels, verbatim, with source URLs

Left nav, **Observability** section (from https://docs.vapi.ai/test/voice-testing and https://docs.vapi.ai/observability/evals-quickstart):
- `Evals` → sub-items `Quickstart`, `Advanced` (https://docs.vapi.ai/observability/evals-quickstart)
- `Simulations` (https://docs.vapi.ai/observability/simulations-overview, plus `Configure an AI tester` at /observability/simulations-configure-ai-tester)
- `Boards`
- `Structured outputs`
- `Scorecard`
- `Monitoring`

Separate **Testing** section, one level up in the nav (from https://docs.vapi.ai/test/voice-testing):
- `Testing voice agents` (/test/voice-testing) — the conceptual overview page, explicitly frames Evals vs. Simulations as the two pillars
- `Plan test coverage` (/test/plan-test-coverage)
- `Test outcomes with Simulations` (/test/simulations-best-practices)
- `Test decisions with Evals` (/test/evals-best-practices)
- `Run and maintain tests` (/test/run-and-maintain-tests)

Note the parallel construction of "Test outcomes with Simulations" / "Test decisions with Evals" — Vapi's own docs IA treats "decision-checking" and "outcome-checking" as the defining split, which is conceptually identical to Agora's "evals = deterministic scripted checks" vs. "voice simulations = full-runtime caller exercising."

## The object model

**Evals** (https://docs.vapi.ai/observability/evals-quickstart): "Vapi's AI agent testing framework that enables you to systematically test assistants and squads using mock conversations with automated validation." The noun is an **Eval** — a JSON object with a `messages` array (`role`/`content` turns you author) and a `judgePlan` per assistant turn. Judge types include `exact` match (including `toolCalls` with exact `name`/`arguments`), regex, and AI judge (semantic/LLM-graded, with a "Continue Plan" for branching/exit-on-failure across multi-step evals). Runs happen against a `target` (an assistant or a squad) and execute at the "text and model layer" only — Vapi's own docs state plainly: "They don't test speech recognition, audio quality, or turn-taking." Evals are listed, run, and version-managed via dashboard or API — the quickstart explicitly lists "CI/CD integration" as a use case and documents an Eval API reference for running them from your own automation/CI.

**Simulations** (https://docs.vapi.ai/observability/simulations-overview): "Automated tests that run an AI tester through a real conversation with your assistant or squad and score the outcome." The object hierarchy is: **Simulation suite** (groups simulations, runs against one or more assistants/squads) → **Simulation** (pairs a **Scenario** + a **Personality**) where a **Scenario** defines the AI tester's intent and success criteria, and a **Personality** defines how the AI tester behaves/speaks (its model, transcriber, and voice). An **AI tester** drives the live conversation adaptively rather than replaying a fixed script. Simulations run in two modes — **Voice mode** ("full voice conversation with audio... tests the model, transcriber, and voice together") and **Chat mode** (same scenario, text instead of audio, "finishes faster and costs less," used for rapid iteration before switching to voice for final validation). Each run can iterate N times per simulation, scored by structured-output criteria (pass/fail per criterion).

**Vapi's own comparison table** (docs.vapi.ai/test/voice-testing, section "Use Evals for decisions and Simulations for outcomes"):

| | Evals | Simulations |
|---|---|---|
| Core question | "At this point in the conversation, did the agent make the right next decision?" | "By the end of the conversation, did the agent reach the right outcome?" |
| Scope | One or a few decision checkpoints, known conversation history | A complete conversation with an AI tester |
| Conversation path | Fixed context; checks what happens next | Flexible; tester adapts as conversation unfolds |
| Best for | Tool selection/arguments, routing, refusals, required questions, specific responses | Task completion, recovery, handoffs, caller behavior, overall experience |
| Mode | Text-based mock conversation | Chat or voice |

Direct quote: "Use an Eval when you need to check a decision at a known point. Use a Simulation when you need to check the result of a complete conversation. Most production voice agents need both." This is effectively Vapi endorsing the same two-tier model Agora's engineering plan proposes.

## Screenshots captured

| File | Shows | URL |
|---|---|---|
| vapi-nav-voice-testing.png | Full left nav (Observability: Evals/Simulations/Boards/etc.; separate Testing section) plus the "Testing voice agents" overview page body | https://docs.vapi.ai/test/voice-testing |
| vapi-evals-vs-simulations-comparison.png | The "Use Evals for decisions and Simulations for outcomes" section, including the comparison table | https://docs.vapi.ai/test/voice-testing |
| vapi-simulations-overview-key-concepts.png | "Key concepts" table (Simulation suite / Simulation / Scenario / Personality / AI tester) and Voice/Chat mode descriptions | https://docs.vapi.ai/observability/simulations-overview |

## Logged-in product (dashboard.vapi.ai)

**Not reached.** The local drive-automation server (`scripts/drive.mjs serve`, tab `vapi`) dropped mid-session ("drive server not running") after the docs pass and did not come back up within the research budget; per instructions I did not restart it (told not to run `serve`/`stop`) and did not attempt any login. All findings above are docs-only. If the dashboard needs checking, it should be re-driven in a follow-up pass — worth confirming whether the dashboard sidebar also shows "Evals" and "Simulations" as two separate top-level entries (docs strongly imply yes, since /observability/evals-quickstart and /observability/simulations-overview are documented as separate product areas with separate list/detail UIs, e.g. "Step 9: Manage evaluations — List all evaluations / Update an evaluation / Delete an evaluation / View run history" for Evals, and "simulation suite... run against one or more assistants or squads" for Simulations), but this is inferred from docs, not observed directly in-product.

## What would change how we design this

- **Steal: the "decision vs. outcome" framing as the plain-language explainer.** Vapi's one-line distinction — "did the agent make the right next decision" (Eval) vs. "did the agent reach the right outcome" (Simulation) — is a clean, non-jargon way to teach the difference in-product (tooltip, empty state, or onboarding copy) and maps directly onto Agora's evals/voice-simulations split.
- **Steal: chat mode as a stepping stone inside the Simulation object itself**, not a separate surface. Vapi doesn't split "text simulation" and "voice simulation" into different nav items — they're two run modes of the same Simulation/Scenario, with chat explicitly pitched as the fast/cheap iteration path before voice. Agora's plan should double check whether "voice simulations" ought to also offer a text/chat run mode on the same object, rather than requiring a real audio run to iterate.
- **Steal: the Scenario/Personality split** inside a Simulation — decoupling "what is the caller trying to do + success criteria" (Scenario) from "how does the caller behave/sound" (Personality) is a reusable, composable object model (mix any personality with any scenario) worth mirroring for Agora's persona-driven voice simulations.
- **Steal: explicit non-overlap disclosure.** Evals docs state plainly what Evals do NOT cover ("They don't test speech recognition, audio quality, or turn-taking. Use Simulations for..."), and Simulations docs note synthetic callers still don't fully replace real accents/noise/interruptions — recommending manual/production-call review as a third layer. Consider stating this same "what this tool does not catch" boundary directly in Agora's product UI/empty states for both surfaces, not just in docs.
- **Trap to avoid:** Vapi's nav still shows some overlap/looseness — "Boards," "Structured outputs," and "Scorecard" sit adjacent to Evals/Simulations under Observability without a crisp one-line differentiation surfaced in the top-level nav; a user skimming the sidebar alone could confuse "Scorecard" with either testing surface. Agora should make sure any adjacent objects (e.g., dashboards/reports) are named to avoid similar ambiguity with "Evals" and "Voice simulations."
- **Trap to avoid:** Vapi buries the CI/CD story inside the Evals quickstart's bullet list and an "Advanced" sub-page rather than surfacing "runs in CI" as a first-class nav-level claim — worth being more explicit in Agora's IA that evals (not simulations) are the CI/CD-runnable surface, since that's a meaningful capability difference worth advertising, not just documenting.
