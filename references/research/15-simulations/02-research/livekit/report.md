# LiveKit Agents — Testing & Evaluation Research

## Verdict line

**SPLIT (two surfaces)** — LiveKit's own docs nav names two distinct, separately-documented concepts: **"Test framework"** (deterministic, text-only, pytest/Vitest, turn-by-turn assertions) and **"Agent simulations"** (an LLM-driven simulated-user persona playing a scenario end-to-end, gradeable on the final state, optionally over real audio). This maps almost exactly onto Agora's evals vs. voice-simulations split, though LiveKit's "simulations" cover both a text-only mode AND an audio mode under one object (scenario), rather than keeping "audio-in-the-loop" as a fully separate concern.

## Verbatim nav labels (from left nav, docs.livekit.io)

Source URL: `https://docs.livekit.io/agents/start/testing/` (canonical path for what the brief calls `/agents/build/testing/`, which redirects here)

```
TESTING & EVALUATION
  Overview
  Test framework
  Agent simulations         [BETA]
  Run a saved test          [BETA]
```

These four items sit in their own labeled nav group, separate from "LOGIC & STRUCTURE" (Agent sessions, Chat context, Tasks & task groups, Workflows, Tool definition & use, etc.) and from "AGENT SERVER" / "MODELS". The grouping itself is evidence: LiveKit treats "testing & evaluation" as one *category* of documentation, but inside it draws a hard line between two named objects — "Test framework" and "Agent simulations" — not a single unified thing.

Overview page quote (`/agents/start/testing/`):
> "Behavioral tests verify specific interactions and expected outcomes. They integrate with your existing test suite using pytest (Python) or Vitest (Node.js)... Agent simulations run end-to-end conversations between your agent and an LLM-driven user, then evaluate the results across the full interaction."

And the comparison table on that same page (verbatim columns: APPROACH / WHAT IT TESTS / HOW IT RUNS):

| Approach | What it tests | How it runs |
|---|---|---|
| Test framework | Specific messages, tool calls, arguments, and handoffs that you assert on, turn by turn. | Runs locally or in CI with pytest or Vitest. Text-based tests with deterministic results. |
| Agent simulations | Complete conversations between your agent and a simulated user, evaluated against expected outcomes. | Runs on LiveKit Cloud, in parallel, over text or audio. Scenarios are generated from your agent's source or loaded from a checked-in `scenarios.yaml` file. |
| Third-party tools | End-to-end behavior through the full audio pipeline. | Available through partner services, including Bluejay, Cekura, Coval, and Hamming. |

Guidance line from the overview: "Use the test framework for turn-level behaviors such as tool usage and error handling. Use simulations to evaluate behaviors that span multiple turns, such as conversation flow, memory, and misuse resistance."

## The object model

**Test framework** (`/agents/start/testing/test-framework/`) — the unit of a test is an ordinary **pytest function (Python) or Vitest `it()` block (Node.js)** that instantiates a real `AgentSession`, starts the agent inside it, and calls `session.run(user_input=...)` once per conversation turn. Each call returns a `RunResult` holding the events (`ChatMessageEvent`, function-call events, handoff events) produced during that turn; multiple `run()` calls accumulate real conversation history. Assertions are chained off `result.expect`: exact-match style (`is_message()`, `is_function_call()`, `is_function_call_output()`, `is_agent_handoff()`), search-style (`contains_message()`, `contains_agent_handoff()`), sequential navigation (`next_event()`, `skip_next()`), indexed access, and an LLM-judge style (`.judge(llm, intent="...")`) that asks an LLM whether a message satisfies a described intent. A `JudgeGroup` can run several specialized judges concurrently over the full transcript. Tools are mocked with `mock_tools()` (Python) / `withMockTools()` (Node), returning either a value or a raised error, scoped to a `with` block or the whole session — so this is genuinely the Agora "evals" concept: scripted turns, tool-call assertions, exact/judge grading, runnable in CI. **No audio, no real runtime** — confirmed explicitly: "Text mode is the most cost-effective and deterministic way to test agent behavior" and testing "does not make a LiveKit room connection."

Example test (Python, verbatim from docs):
```python
from livekit.agents import AgentSession, inference
from agent import Assistant

@pytest.mark.asyncio
async def test_assistant_greeting() -> None:
    async with (
        inference.LLM(model="google/gemma-4-31b-it") as llm,
        AgentSession(llm=llm) as session,
    ):
        await session.start(Assistant())
        result = await session.run(user_input="Hello")
        await result.expect.next_event().is_message(role="assistant").judge(
            llm, intent="Makes a friendly introduction and offers assistance."
        )
        result.expect.no_more_events()
```

**Agent simulations** (`/agents/start/testing/simulations/`, BETA, Python agents only) — the unit is a **scenario**: an LLM-driven simulated-user *persona* with `instructions` (who they are + what goal they pursue), paired with `agent_expectations` to grade the final state, plus optional `tags`/`userdata` for deterministic mocking. Scenarios are either generated from the agent's own source or loaded from a checked-in `scenarios.yaml` (the reproducible, CI-friendly artifact). Docs describe it as running the agent "against an LLM-driven simulated user that plays out a scenario from start to finish, then judges whether the agent met your expectations" — i.e., there IS an explicit simulated-caller-as-agent concept, matching Agora's "voice simulation persona." Execution happens on **LiveKit Cloud** (not locally), in parallel up to the project's concurrency limit, launched via the authenticated `lk agent simulate` CLI, which can spawn the agent as a worker or target an already-running one (`--agent-name`). Grading happens on the final state of the conversation, not turn-by-turn.

Text vs. audio is a **mode within simulations**, not a separate top-level object: "Text mode (default)" tests LLM/tools/conversation logic without STT/TTS; "Audio mode" exercises the real STT-LLM-TTS pipeline with real audio, measuring turn-taking and speech quality, and can even simulate a degraded connection. So LiveKit's audio-in-the-loop capability lives inside the same "Agent simulations" object rather than as its own named surface — this is the one place where the split is less clean than Agora's evals/voice-simulations division.

Third-party partners (Bluejay, Cekura, Coval, Hamming) are explicitly called out as the option for "end-to-end behavior through the full audio pipeline" at scale / in production monitoring — LiveKit positions its own audio simulation as available but defers heavier real-world audio testing to partners.

## Console UI vs. code-only

This is **framework/CLI-first, with a thin cloud-hosted results surface for simulations only** — not a console authoring UI:

- **Test framework**: 100% code. Written as pytest/Vitest files, run locally or in CI (`pytest`, `vitest`, `LIVEKIT_EVALS_VERBOSE=1 uv run pytest -s ...`). No console UI at all — it never leaves the codebase/CI runner.
- **Agent simulations**: authored as YAML (`scenarios.yaml`) and invoked from the CLI (`lk agent simulate`), but they execute on **LiveKit Cloud** and the docs reference a **dashboard** for viewing results: "reports results live, with a link to the run in the dashboard" and a CI section that says to "follow the dashboard link" to view transcripts; `lk agent simulate --view <run-id>` opens a run, and runs can be exported as JSON. So there is a hosted viewing surface, but authoring/triggering a simulation is still CLI/YAML, not a console "create test" flow.
- A fourth nav entry, **"Run a saved test" (BETA)**, implies some notion of persisting and re-running a test from the dashboard, but its exact URL could not be resolved in this session (`/agents/start/testing/saved-tests/` and `/agents/build/testing/run-a-saved-test/` both 404'd) — **not reached**, flagged rather than guessed at.
- The **LiveKit Cloud console itself (`cloud.livekit.io`)** could not be inspected this session: the local drive/browser server (port 9333) went down mid-task and, per instructions, was not restarted. **Not reached** — no screenshot evidence of the console's own nav for a testing/eval tab. Based on docs language alone ("link to the run in the dashboard"), the console likely surfaces simulation *run results*, but this is inferred from doc text, not observed directly.

## Screenshots

| Screenshot | Shows | URL |
|---|---|---|
| `livekit-testing-page.png` | Full "Testing and evaluation" overview page, including the left nav (Testing & Evaluation: Overview / Test framework / Agent simulations BETA / Run a saved test BETA) and the approach comparison table | `https://docs.livekit.io/agents/start/testing/` (redirected from `/agents/build/testing/`) |

Only one screenshot was captured before the drive/browser server went down (port 9333 stopped responding after the first `goto`+`shot`). Per the task instructions this was not restarted; the "Test framework" and "Agent simulations" detail pages were instead read via WebFetch (text-only, no screenshots), and the LiveKit Cloud console was not visited at all this session.

## Anything that would change how we design this

1. **The evals/simulations split is a validated pattern, not an Agora invention** — a mature competitor (LiveKit) independently arrived at the same two-object model: fast/deterministic/text/CI-first vs. slow/LLM-persona/end-to-end/graded-on-outcome. This is strong external validation for keeping evals and voice simulations as two distinct product surfaces.
2. **LiveKit keeps "audio" as a *mode toggle* on the simulation object, not a third top-level surface.** Worth deciding deliberately whether Agora's voice simulations should likewise offer a text-mode/audio-mode toggle on one simulation object (cheaper iteration) rather than only ever running full audio — LiveKit explicitly recommends iterating in text mode and reserving audio for turn-taking/speech-specific checks.
3. **Grading philosophy differs by layer**: their test framework grades turn-by-turn (assert per `run()` call); their simulations grade on **final state only** ("Grade on the final state" is an actual section heading) rather than per-turn. If Agora's voice simulations plan to grade per-turn as well as end-state, that's a point of differentiation worth calling out.
4. **Simulations are declared in a checked-in YAML file (`scenarios.yaml`)**, which is explicitly the CI-reproducibility mechanism — an analog worth considering for how Agora persists/version-controls simulation personas and scenarios outside the console DB.
5. **No console-based "build a test visually" experience was found for either surface** — everything is code/YAML + CLI, with the console only serving as a results viewer for cloud-run simulations. If Agora wants a genuine console-first authoring experience for evals/simulations (not just code), that would be a meaningful product differentiator versus LiveKit rather than parity work.
6. **Third-party ecosystem exists for full-audio-pipeline testing at scale** (Bluejay, Cekura, Coval, Hamming) — LiveKit doesn't try to own "production-scale real-audio monitoring" itself. Useful competitive-landscape context for secondary research beyond the 4 voice-vendor list.

## Gaps / not reached

- LiveKit Cloud console (`cloud.livekit.io`) testing/eval surface — **not reached**, browser/drive server (port 9333) went down after the first screenshot and was not restarted per task instructions.
- Exact URL and content of the **"Run a saved test" (BETA)** doc page — **not reached**, both guessed URLs 404'd.
