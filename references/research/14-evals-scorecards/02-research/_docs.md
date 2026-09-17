# 14 · Evals & scorecards · public-docs teardown (2026-09-17)

Stop 2, docs half. The logged-in product is captured separately from the shot list at the end of this file.

The question asked of every vendor, in the four parts the tracker asks for:

1. Does a deterministic eval exist, and can it run in CI?
2. Is the thing that scores a **real** call a named reusable object, or free text on one agent?
3. Is the score per criterion, and does a failure name a fix?
4. Is there a loop back into the agent, and does a human stand in it?

A fifth vendor, **Coval**, is included. The reason is in its section: LiveKit's own testing page sends heavy
evaluation work to Coval by name, and Coval is the only product read here whose metric object is documented
as running on both simulated and production traffic. Leaving it out would have let us claim whitespace that
a specialist already occupies.

Everything below is from public documentation, fetched 2026-09-17.

---

## Vapi

**Four objects, and they are not one loop.** Vapi ships the most complete set of parts and the least
connected product. The nav group is **Observability**, holding `Evals`, `Simulations`, `Boards`,
`Structured outputs`, `Scorecard` and `Monitoring` (https://docs.vapi.ai/test/voice-testing).

**Eval** is the deterministic half. Type `chat.mockConversation`, a `messages[]` array of `user`,
`assistant`, `system` and `tool` turns you author, and a `judgePlan` on each assistant turn you want checked.
Judge types are `exact` (including `toolCalls` with exact `name` and `arguments`), `regex`, and `ai` with
your own provider and model. A `continuePlan` carries `exitOnFailureEnabled`, `contentOverride` and
`toolCallsOverride`, so a failed checkpoint can be forced past. The run object is `{id, evalId, status:
queued | ended, endedReason, results[], target}`, and the dashboard path is Evals in the left sidebar, then
**Create Evaluation**, **Add Message**, **Enable Evaluation**, **AI Judge**, **Save Evaluation**, then the
**Run Test** section and **Run Evaluation**, with a **Runs** tab listing timestamp, target, status and
duration (https://docs.vapi.ai/observability/evals-quickstart).

**What it refuses.** Evals "don't test speech recognition, audio quality, or turn-taking". There is no tool
mocking control: a tool result is a `tool` message you write yourself, and the docs warn that "The mock
response doesn't create an appointment", so external state has to be checked in a sandbox by hand.

**CI** is a documented GitHub Actions file that POSTs `/eval/run`, polls every 2 seconds with a 300 second
per-Eval timeout, and exits 1 unless `endedReason` is `mockConversation.done` and every result is `pass`.
The page states its own limit plainly: grouping, scheduling and repetitions "are your automation's
responsibility, not a native Eval-suite feature" (https://docs.vapi.ai/observability/evals-advanced).

**Structured output** is the reusable one. "A structured output is a reusable definition you create once and
attach to an assistant" through `artifactPlan.structuredOutputIds`, with a JSON Schema of string, number,
boolean, enum, object and array, landing at `call.artifact.structuredOutputs`
(https://docs.vapi.ai/assistants/structured-outputs, https://docs.vapi.ai/assistants/call-analysis).

**Scorecard** is the production score. `{name, description, metrics[], assistantIds[]}`; each metric is one
`structuredOutputId` plus `conditions[]` of `{type: "comparator", comparator, value, points}`. Comparators
are `=`, `!=`, `>`, `<`, `>=`, `<=`; booleans take `=` only; points must sum to 100. The result lands at
`call.artifact.scorecards[id]` as `{score, scoreNormalized, metricPoints}` within seconds of call end.
**Two hard limits.** A metric "can only reference structured outputs of type number/integer or boolean", so
a qualitative criterion has to be laundered through a boolean extraction first. And the whole object is
"using API only for now": there is no scorecard screen
(https://docs.vapi.ai/observability/scorecard-quickstart).

**The migration note is the most useful sentence Vapi has written for us.** Call analysis still documents
`analysisPlan` with `summaryPrompt`, `structuredDataPrompt`, `successEvaluationPrompt` and a
`successEvaluationRubric` enum of `NumericScale`, `DescriptiveScale`, `Checklist`, `Matrix`,
`PercentageScale`, `LikertScale`, `AutomaticRubric`, `PassFail`. Then it says: use structured outputs
instead, "They are more flexible and are where new development happens", and maps
`successEvaluationPlan` onto "A structured output that evaluates the call, or a scorecard"
(https://docs.vapi.ai/assistants/call-analysis). Vapi has already walked away from the free-text success
prompt that `studio_x_2/components/wizard/step-analysis.tsx` :88-103 ships today.

**Honesty.** The scorecard page tells you not to trust the number: compare its inputs against calls
reviewers agree on, sample high and low scores, and "Keep critical policy or business failures visible
separately; a high total score doesn't cancel them out." The maintenance page adds that an AI judge varies
run to run and that you should review the recording as well as the transcript, because "The recording tells
you what the caller actually experienced" (https://docs.vapi.ai/test/run-and-maintain-tests).

**Simulations** pair a Scenario and a Personality inside a Suite, run in **Chat** or **Voice** mode with an
**Iterations** count, and grade against success criteria built with **Create structured output** taking
Name, Type, Description, Comparator and Expected value
(https://docs.vapi.ai/observability/simulations-quickstart). That is the same object a scorecard scores a
real call with, reached from a different screen, under a different word. Vapi is one rename away from the
loop and has not made it.

**No self-improvement anywhere.** Nothing in the Observability group proposes a prompt change.

---

## Retell AI

**The only vendor that ships all four parts of feature 14 as product.** Retell separates them cleanly, and
says out loud where each one stops.

**Simulation testing** lives in the `Simulation` tab of the agent, with `Test Cases` and
`Batch Testing History` beneath it. A case is a **name**, a **user prompt** that plays the caller
(identity, goal, personality, written as markdown), **success criteria**, **dynamic variables**, **custom
function mocks**, and the **LLM** the simulated user runs on. Row actions are `Test`, and for a selection
`Run Test`, `Duplicate`, `Export` and `Delete`; `Import` loads cases from JSON, so a suite moves between
agents (https://docs.retellai.com/test/llm-simulation-testing).

**The verdict shape, stated as a limitation.** "all of its criteria are judged together in a single pass
against the transcript", one verdict and one explanation for the run. The note that follows is the one that
matters to us: "This is not how AI QA scores real calls. AI QA evaluates each metric separately and reports
which ones passed and which failed, with a reason for each." Retell knows the per-criterion breakdown is
better and gives it only to production calls.

**Mocking is specified, including what ignores it.** Mocks are honored for custom functions, code tools,
integration tools, the Cal.com tools, transfers and SMS. Built-in conversation actions are always simulated.
"MCP tools also ignore mocks": the dropdown lists them and the test calls your server for real. A blank mock
is skipped and the real function runs. Transfers and SMS are always faked. There is also a trap worth
copying the warning for: dynamic-variable values can be loaded from an environment tag, and "A tag's dynamic
variables are not test-only", so editing `prod` from the test panel changes live calls.

**Error is a third result.** A run ends in **Error** rather than a grade after 10 minutes, past 400
utterances, when the simulated user repeats itself, or when the agent goes silent. "In that case the
explanation is the error, not a grade."

**CI** is documented as create case, `create-batch-test`, poll `get-batch-test` until `complete`, read
`pass_count`, `fail_count`, `error_count`, `total_count`. "Running a single case still means creating a
batch of one" (https://docs.retellai.com/test/batch-test-simulation).

**AI QA is the scorecard, and it is a cohort, not an agent field.** You pick a cohort of calls by agent,
date and filters with a sample size, then define **resolution criteria** in two kinds:
**AI-evaluated conditions** of `{Name, Prompt description}` (for example `Call resolved`, prompt "AI agent
was able to resolve the user's query"), each "evaluated independently", and **performance metrics** with
thresholds drawn from a fixed list: latency, user sentiment, agent sentiment, overlapping speech,
transcription word error rate, hallucination, tool call inaccuracy, node transition inaccuracy, naturalness.
By default a call passes only if it meets every condition and every metric; **Weighted scoring** turns that
into weights plus a success threshold (https://docs.retellai.com/ai-qa/define-resolution-criteria).

**The per-call surface is a Call QA Sheet**: overall score with pass or fail, passed metrics with green
checks, failed metrics with orange warning triangles, the transcript, and mistranscribed words shown inline
with their corrections. Two things we do not have: **Calibrate**, which lets a human mark a passed metric
failed or a failed metric passed with a note, and which "changes the per-call score only; it doesn't change
the criteria for future calls"; and a rerun-QA-for-this-call action in the row menu
(https://docs.retellai.com/ai-qa/view-qa-results).

**Scoring is metered.** "AI QA is free for the first 100 minutes of analyzed call time per workspace. After
that, it's priced at $0.10 per minute of analyzed call time" (https://docs.retellai.com/ai-qa/overview).
Testing is metered too, on its own page: "There's no separate test tier and no free testing sandbox", text
simulation bills per message for both the agent's model and the simulated user's, "Batches multiply", and
"Grading bills too. Each case in a batch adds one post-call-analysis unit for the pass or fail verdict"
(https://docs.retellai.com/test/testing-pricing).

**What it refuses.** "Agents using a custom LLM are not supported" by simulation testing, and simulation
"runs as a text conversation". Audio testing is a human on a mic, in `Web call testing` or
`Phone call testing`.

**The fix engine is a documentation page, not a control.** `Address metric issues` gives a named fix per
failed metric: split a hallucination into Fabrication, Contradiction or Confusion and apply the matching
remedy; lower the knowledge-base retrieval threshold and raise the chunk count for low recall; clarify
transition conditions for node inaccuracy; switch off a cloned voice for naturalness
(https://docs.retellai.com/ai-qa/address-metric-issues). Good advice, published where the failing call is
not.

**Conductor is the Concierge answer.** Retell's dashboard copilot drafts simulation cases from real calls
("Turn call_7a3d9f2b… into a test case", "Make test cases from my last 10 calls where the caller hung up
before booking"), sets the mocks and variables, runs a batch, reports the pass rate, and reads a run's
transcript back in the panel (https://docs.retellai.com/test/testing-with-conductor). Its agent edits arrive
in a **Review changes** panel: the changed node previewed in context, **View original** and **View
proposed**, text diffs with strikethrough and green, a **JSON diff** behind the change description,
**Accept change** and **Reject change** per edit, bulk accept and reject, **Undo**, then **Submit**, and
"Any changes you have not accepted are rejected when you submit"
(https://docs.retellai.com/conductor/build-and-refine). Conductor itself is rationed: 30 messages per user
and 200 per workspace a day, then $0.20 per message only if an admin turned on pay-as-you-go.

---

## ElevenLabs

**Two unrelated objects on the same agent, and the best treatment of uncertainty in the market.**

**Tests** live in the agent's `Tests` tab, in three types: **Simulation Testing** (multi-turn, a simulated
user), **Next Reply (Scenario) Testing** (one reply against criteria), and **Tool Call Testing** (right
tool, right parameters). Simulation fields: scenario, **success condition**, **max turns** 1 to 50 default
5, environment, chat history, dynamic variables. Next Reply adds a **success example** and a **failure
example** beside the criteria, which is the cheapest calibration control anyone ships. Tool Call validates
each parameter by **Exact Match**, **Regex Pattern** or **LLM Evaluation**
(https://elevenlabs.io/docs/eleven-agents/customization/agent-testing).

**Tool mocking is the reference implementation.** **Mock none**, **Mock all tools**, **Mock selected
tools**, plus a fallback when a mocked tool has no matching response: **Call real tool** or **Finish with
error**, and the fallback control only appears once at least one tool is mocked. "System tools and workflow
tools are never mocked."

**Probabilistic testing is the pattern to steal.** A split control on the run button runs a test 3, 5 or 15
times; the API takes `repeat_count` between 2 and 20. Results summarize as a pass rate, "for example, 4/5
passed", badged green at 100 %, amber at 80 % or more, red below. Runs are then bucketed by failure reason,
so you see clusters like "Correctly routed to billing (4 runs)" and "Hallucinated a support number (1 run)"
rather than five transcripts. The framing is exactly right: "A single pass shows the agent can succeed;
probabilistic testing shows how often it will."

**Save a real call as a test is shipped.** Open the conversation in call history, **Create test from this
conversation**, review the prefilled context, define the expected behavior, add it to the suite.

**CI** is one line, `elevenlabs agents test <agent_id>`, or `run_tests` in the SDK
(https://elevenlabs.io/docs/eleven-agents/operate/cli).

**Success evaluation is the other object, and it is not the test object.** On the agent's **Analysis** tab,
**Add criteria** creates `{Identifier, Description}` where the description is the judging prompt. Each
criterion returns `success`, `failure` or **`unknown`** with a rationale, results land per conversation in
the conversation history dashboard, and criteria are "limited to 30 per agent". The docs treat `unknown` as
a signal to act on, not an error: it appears for incomplete conversations, ambiguous responses and missing
information, and "Monitor unknown results to identify areas where your criteria prompts may need
refinement" (https://elevenlabs.io/docs/eleven-agents/customization/agent-analysis/success-evaluation).
**Data collection** is the separate extraction half
(https://elevenlabs.io/docs/eleven-agents/customization/agent-analysis/data-collection).

**What it refuses.** No audio anywhere in the test object. Criteria are per agent, with no scorecard to name
and reuse. A test's success condition and a criterion's description are two prompts that never meet.

**Experiments is their answer to "prove it is better".** A/B across system prompt, workflow, voice, tools,
knowledge base, LLM, language and evaluation criteria; traffic split by percentage summing to 100, routed
deterministically by conversation id; recommended start 5 % to 10 % on the variant; promote by raising the
share or merging into the main branch, with version history for rollback
(https://elevenlabs.io/docs/eleven-agents/operate/experiments). **The winner is decided on the analytics
dashboard**, CSAT, containment rate, conversion, average handling time, median response latency, cost per
agent resolution, and not on the evaluation criteria the same agent already carries. Even here the two
scoring systems do not meet.

---

## LiveKit

**Developer-only, and openly incomplete on the half feature 14 cares most about.**

**Testing and evaluation** is source code in your repo. Behavioral tests run under `pytest` or `Vitest`:
`AgentSession`, `session.start(Agent())`, `session.run(user_input=…)`, then
`result.expect.next_event().is_message(role="assistant").judge(llm, intent=…)` and
`result.expect.no_more_events()`. Mocking is `mock_tools(Agent, {...})` in a `with` block, or
`voice.testing.withMockTools` returning a `Disposable` in Node; returning an `Error` from a mock makes the
tool raise, and a session-scoped form seeds per-scenario mocks
(https://docs.livekit.io/agents/start/testing/test-framework). "Testing does not make a LiveKit room
connection", and `get_job_context()` raises in a test environment.

**Agent simulations** are a checked-in `scenarios.yaml` of `{label, instructions, agent_expectations, tags,
userdata}` run by `lk agent simulate`, in **text mode** by default or **audio mode** through the full
pipeline. Concurrency is 15 by default, 20 maximum per run, 30 per project. It is beta and Python only, and
the docs say the flags and the file format "might change". The billing line is the honest one: text LLM
requests are scheduled at low priority, audio runs "execute in real time" and are metered in audio turns
(https://docs.livekit.io/agents/start/testing/simulations).

**The split they draw is not ours.** "Use the test framework for turn-level behaviors such as tool usage and
error handling. Use simulations to evaluate behaviors that span multiple turns"
(https://docs.livekit.io/agents/start/testing/).

**There is no production scoring.** **Agent insights** in LiveKit Cloud is the Sessions dashboard with
turn-by-turn transcripts, traces broken into spans, logs, and audio recordings "available for playback in
the browser, as well as for download". Retention is 30 days and "Data older than 30 days is automatically
deleted"; the feature must be switched on in the project's **Data and privacy** settings. No rubric, no
criterion, no score per session (https://docs.livekit.io/deploy/observability/insights/).

**They say who does own it.** The testing overview's third row is **Third-party tools**, "Available through
partner services, including Bluejay, Cekura, Coval, and Hamming", for "End-to-end behavior through the full
audio pipeline". LiveKit has the recording and the trace and sends the scoring out of the building.

---

## Coval (the fifth, and the reason)

Added because LiveKit's own testing page names it, and because it is the only product read here whose
scoring object is documented as running on both kinds of traffic. Docs moved from `docs.coval.dev` to
https://docs.coval.ai.

**A Metric "turns a conversation into a measurable signal: a score, a yes/no, a category, a latency
number", in five kinds: Deterministic, Statistical, ML Model, LLM Judge, and Trace (computed from your
agent's OpenTelemetry spans). The sentence feature 14 is missing is right there: "Every metric works on both
simulated conversations and live-monitored production calls"
(https://docs.coval.ai/concepts/metrics/overview).**

**Human review is a first-class object, not a comment box.** A review project bundles the metrics to
validate, the reviewers and the conversations, in **Metric review** (reviewers give the ground-truth answer
so Coval can measure how often the metric agrees with humans) or **Triage** (your own failure-type labels).
Settings include **Collaborative mode**, which locks each conversation and metric pair to one reviewer, and
**Require disagreement notes**, which refuses to count a row complete when a reviewer disagrees with the
metric and leaves no note (https://docs.coval.ai/concepts/metrics/human-review/human-review). That is how a
judge earns trust, and it is stricter than Retell's Calibrate, which changes one call's score and nothing
else.

**Dashboards** chart the same metrics over simulated and uploaded conversations, with a
**Threshold / target zone** widget that draws the metric's threshold on the chart
(https://docs.coval.ai/concepts/dashboard/overview).

**The catch that matters to us.** Coval's production half reads **uploaded conversations**. It scores what
you send it. Which is the same dependency our brief already named: a scorecard needs a stored transcript,
and on Agora that store is an Engine row, not a Studio one.

---

## The four, compared

| | Vapi | Retell | ElevenLabs | LiveKit |
|---|---|---|---|---|
| **The production score is a named, reusable object** | Yes, `Scorecard` plus reusable `Structured output`, but **API only**, no screen | Yes, an **AI QA cohort** with resolution criteria, defined per cohort of calls and not per agent | No. Up to **30 criteria on one agent**, no object to name or share | **None.** Insights stores transcripts, traces and audio, and scores nothing |
| **One criterion works before and after shipping** | Almost: a Simulation's success criteria and a Scorecard metric are both structured outputs, but an Eval judges with a separate `judgePlan` and the scorecard has no UI | No, and the docs say so: simulation criteria give one verdict, AI QA "evaluates each metric separately" | No. A test's success condition and an Analysis criterion are two prompts that never meet | No |
| **Per-criterion result with a reason** | Per judged message in an Eval; per metric points in a Scorecard | One verdict per simulation run; per metric with a reason in the Call QA Sheet | Per criterion, `success` / `failure` / **`unknown`** with a rationale | Per assertion in code, nothing in production |
| **Repeat runs and a pass rate** | `Iterations` on a Simulation run; "Compare the iterations instead of averaging them away" | A batch runs each case once; the docs say judge "on its pass rate across runs, not one run" and leave the repeating to you | **`repeat_count` 2 to 20**, pass-rate badge at 100 / ≥80 / <80, failures bucketed by reason | Repeat is your test runner's problem |
| **A failure names the fix** | Triage tables in docs, by symptom | Named fix per failed metric, in **docs**, one click away from the QA sheet | Failure buckets name the behavior, not the setting | No |
| **The cost of testing and scoring is stated** | Chat mode "finishes faster and costs less"; no page | **A whole page.** No free test tier, batches multiply, "Grading bills too", AI QA $0.10 per analyzed minute after 100 free | Not stated | Text runs low priority, audio runs metered in audio turns |

Two more rows that did not fit the job but decide our scope: **save a real call as a test** ships at
ElevenLabs (**Create test from this conversation**) and at Retell (Conductor, from a call id or a Call
History selection), and is unbuilt at Vapi and LiveKit. **CI** exists at all four: Vapi a hand-written
Actions file, Retell an API poll, ElevenLabs one CLI command, LiveKit your existing test runner.

---

## What nobody does

**Nobody closes the loop in the interface.** Every vendor here can score a test and score a real call, and
not one of them lets the same sentence do both where a user can see it. Vapi comes within a rename: a
Simulation's success criterion and a Scorecard metric are the same `Structured output` object, but the
scorecard is "using API only for now" and the Eval judges through an unrelated `judgePlan`, so the loop
exists in the API reference and nowhere on screen. Retell writes the gap into its own docs, telling you that
simulation success criteria and AI QA resolution criteria are different things with different verdict
shapes. ElevenLabs puts a test's success condition and an Analysis criterion on the same agent, two tabs
apart, in two vocabularies. LiveKit has the recording and refers the scoring out to Coval. Only Coval, a
product you buy separately and feed with uploaded conversations, states the thing outright: "Every metric
works on both simulated conversations and live-monitored production calls."

**Nobody answers the JTBD's own words.** "Prove an agent is good **before and after** shipping" needs two
numbers on one axis, and no vendor puts a draft agent's score beside the deployed agent's score on the same
criteria. ElevenLabs' Experiments is the closest and it changes the ruler: the branches are compared on
CSAT, containment and handling time from the analytics dashboard, not on the evaluation criteria the agent
already carries. A version row that reads "83 % on 12 criteria, live version 76 % on the same 12" does not
exist anywhere in this market, and our Deploy section already has the version table to hang it on
(`studio_x_2/components/wizard/deploy-section.tsx` :145-160).

**Nobody puts the fix on the failing criterion.** Retell has the best fix advice written down and publishes
it as a documentation page; the Call QA Sheet shows a failed metric with a warning triangle and links out.
Our `studio_x_2/lib/diagnostics.ts` :51-95 already attaches `rootCause`, `suggestedFix` and a `fixHref` to a
turn and ships it in the call detail. Pointing that existing machine at a failed criterion instead of only
at a latency spike is a smaller change than anything a competitor would have to do, and it is the whole of
868ka24am that does not wait on Engine.
