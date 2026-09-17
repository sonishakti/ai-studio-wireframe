# 14 · Evals & scorecards · intake brief (2026-09-17)

Tracker: https://app.clickup.com/t/868m0mexd · status `added`, becomes `clarified` once this lands · Tags test · P0.
Wave: **undated.** None of the five roadmap rows carries a due month in the 2026-09-03 export
(`references/clickup-q3-roadmap-export-2026-09-03.tsv` lines 133, 163, 164, 168, 173); the module column
says Studio for all five. The sibling feature **15 · Simulations** is scheduled 30 Nov to 22 Dec 2026
(`references/research/15-simulations/01-jtbd.md`), so 14 either leads it or rides beside it.

Design Tracker JTBD (868m0mexd): "User wants to prove an agent is good before and after shipping."

Builds on **15 · Simulations** (shipped 2026-09-16, `references/research/15-simulations/`): ONE Tests table,
the case **type** decides the runner, audio is a **run mode** and not a section. 14 extends that object.
It never builds a second table.

## Scope

ClickUp is not readable from this session, so "what it asks for" is expanded from the roadmap documents in
`references/` and the task names as given. Where a document does not carry acceptance criteria, the row says
so rather than inventing one.

| Task | What it asks for | Acceptance criteria |
|---|---|---|
| **868kyv3tm** Run deterministic conversational evals in Studio and CI · P0 · Feature Request | Scripted mock conversations of user, assistant, system and tool turns. Assertions by exact match, regex, structured comparison, tool-call shape, or an AI judge. Deterministic mock tool responses so customer systems are never called. Runs in Studio, API, CLI and CI/CD. (Summarised from the ticket in `references/research/15-simulations/01-jtbd.md`.) The ticket draws its own boundary, quoted verbatim there: *"Evals are fast mock-conversation tests for deterministic behaviour and tool contracts. Voice simulations exercise the real conversational runtime, audio path, personas, timing, and provider behaviour. Both may reuse evaluation definitions, but neither silently substitutes for the other."* | No AC list written in `references/`. Two hard constraints are stated in the ticket text itself: customer systems are never called, and the same suite runs "through the API or CLI without changing its meaning" (`15-simulations/04-before.md` §5). |
| **868ka25tc** Score production calls with rubrics and reusable scorecards · P0 · Reliable Infra | Judge real calls, not tests, against named criteria that can be reused. `15-simulations/05-directions.md` names it "the production-scoring ticket" and says direction E is the only shape that reaches it "without a second redesign, because the scoring criteria become an object in their own right". | No acceptance criteria written. |
| **868ka24am** Review production recordings and recommend targeted fixes · P0 · QoE | Open a bad production call, see what went wrong, and get a change to make. The Q3 backlog files it under `test` with the note "Test Strip · Run simulations panel · eval-tests" (`references/design-backlog-q3-roadmap-2026-09-03.html`). | No acceptance criteria written. |
| **868kbyqf6** Build self-improving agents · P1 · Feature Request | The outcome loop: failures become prompt or config changes. The 2026-07-09 register calls it C8 and states the dependency plainly: *"Outcome loop → prompt/eval tuning. Hardest; depends on Evals."* (`references/roadmap-features-prd-2026-07-09.md` §2 category C). | No acceptance criteria written. |
| **868kyj9w2** Integrate self-improving agents into Concierge · P1 · Dev Experience | Put the loop behind the chat surface that already configures agents. The register's V1 row: Concierge is shipped and is the *"AI onboarding differentiator (only Bland 'Norm' comparable, 1/5). Extend → prompt-to-agent."* | No acceptance criteria written. |

## What the product has today

Read in full: `studio_x_2/components/eval-tests.tsx`, `studio_x_2/components/wizard/test-panel.tsx`,
`studio_x_2/components/wizard/test-section.tsx`, `studio_x_2/components/sim-transcript.tsx`,
`studio_x_2/components/wizard/step-analysis.tsx`, `studio_x_2/lib/campaign-data.ts`,
`studio_x_2/lib/wizard-draft.ts`, `studio_x_2/lib/diagnostics.ts`, `studio_x_2/lib/analytics.ts`, plus the
Monitor, Calls and phone-number surfaces that consume them.

### The typed suite (feature 15, shipped 2026-09-16) is the object 14 extends

**`studio_x_2/components/eval-tests.tsx`** (709 lines) holds the only test table in the product.

- `TestsSection` :81, two variants: `rail` and `section` :100. Both render the same table, so 14 gains a
  column by editing one component.
- The two case types are defined once, in the user's words, at :47-58: `decision` "Did it make the right
  next move?" and `conversation` "Did it reach the right outcome?". The blurb under `decision` already
  promises the eval contract: "Runs in seconds, no audio, no minutes."
- Run modes: `runAll(mode)` :173-199 and `runOne(c, mode)` :201-205. An audio run filters by
  `canRunWithAudio` :178 and **merges** results so a skipped decision check keeps the verdict it already had
  :182-187. The toast names the skip :194.
- The table :269-378. Columns: Test Name · Type (section only :273) · Description (section only, hidden
  below `@2xl` :276) · Status · actions. The status cell :319-339 prints the verdict badge **and the mode it
  ran in** in mono :330-333, and "Not Run" :337 for a case nobody has run.
- The money sentence :247-251: "Text runs are free. An audio run places {n} simulated calls through the real
  speech pipeline and bills agent minutes at $0.10/min." The run buttons carry the estimate in their labels
  :226 and :236-238.
- The only explanation of scoring anywhere in the product is an `InfoHint` at :212-215: "A judge model scores
  each run: {verdict, score, reason} per assertion. A failure caused by a real config gap names the setting
  to fix. Failing scenarios never block deploy."
- `AddCaseSheet` :523-709 authors a case: type toggle :597-616, name :618-621, the decision case's history
  :623-637, the persona block :639-653, **tool mocking** :663-682 ("Mock every tool" / "Call the real ones",
  with the warning line "This test will book, charge and write for real, every time it runs." :680),
  assertion kind :686-690 and assertion text :691-695.
- `RunSheet` :404-471 streams the transcript and ends on a verdict banner; `ResultSheet` :475-519 lists every
  assertion with the judge's one-line reasoning and anchors the failing turn (`flaggedTurnIndex` :75-79).
- Delete carries an Undo :121-134. The suite is React state :107, so nothing survives a reload.

**`studio_x_2/lib/campaign-data.ts`** carries the data model, :140-345.

- `AssertionKind` :154 is `rubric | tool-call | data-point | exact`. The sheet offers three of the four
  :687; `exact` is typed and unreachable.
- `ToolMocking` :163 is `mock-all | mock-selected | call-real`, carried on the case at `tools?` :188 with
  `mockedTools?: string[]` :189. The sheet offers two of the three :673-674; **mock-selected has no UI**,
  which is the one mode ElevenLabs ships and the P0 eval ticket implies.
- `EvalCase` :173-191: `id, name, type?, persona, history?, assertions[], tools?, mockedTools?, fromCallId?`.
  `caseType()` :195 and `canRunWithAudio()` :199 are the single place the engineering boundary is enforced.
- `runEstimate()` :204-213 prices a run: 74 seconds per conversation case, cost `seconds / 60 *
  AGORA_RATE_PER_MIN` where the rate is `0.1` at :949. Text runs cost zero by construction :211.
- `EvalSuite` :215-219 is `{id, agentId, cases[]}`. `EvalCaseResult` :225-235 is `{caseId, verdict, mode?,
  seconds?, transcript, assertions[{id, verdict, reasoning}]}`. `EvalRun` :237-241 is `{suiteId, results[]}`.
- `EVAL_SUITE` :245-292 seeds four cases on `agt_default`, one decision and three conversation.
  `EVAL_RUN` :297-345 seeds four results, two audio and two text.
- **The model has no scorecard, no reusable criteria set, no version stamp, no run history and no owner.** A
  run is not stored: the results constant never changes and a session's runs live in two `useState` maps,
  `ranIds` :148 and `ranMode` :144.

**`studio_x_2/components/wizard/test-section.tsx`** (262 lines) is the generator and the builder mount.

- `SCENARIO_SEEDS` :28-159, twelve scenarios written against the draft: happy path, interrupts, wrong
  details, asks for a human, goes silent, off-topic, pricing, callback, privacy, noisy line, jailbreak,
  personalization. Two of them fail **for a real reason** and name the control: transfer off :70-78, silence
  hang-up off :87-93, each pointing at the Go Live row for that channel.
- `generateContextualCases` :181-204 synthesizes a transcript :168-178 and a judge line shaped exactly like
  the contract the InfoHint promises: `{"verdict":"…","score":0.87,"reason":"…"}` :199.
- `TestSection` :208-262 mounts the table with `key={generation}` :241, so Regenerate remounts and discards
  authored cases. The section row is labelled "Scenarios" :237.

**`studio_x_2/components/wizard/test-panel.tsx`** (485 lines) is the docked rail. `TestsSection` mounts at
:200 with its own generation counter :143-162 and its own `lastRun` footer :148-150. The rail and the
section are two instances of one component and do not share state (`15-simulations/04-before.md` §7).

**`studio_x_2/components/wizard/agent-wizard.tsx`** :1069-1078 is the "Run test scenarios" header door and
:1079-1088 the "Voice call" door. The Test strip was deleted :1102-1103.

**`studio_x_2/components/wizard/deploy-preflight.tsx`** :146-170 is the gate row, and it is the closest
thing the product has to "prove it before shipping": "{n}/{m} passed as text. Not yet heard with audio"
(state `warn`), or "No test has been run against this agent" (`warn`), with a Fix link back to step 4. The
Outputs row :186-196 recaps `successEval` and the data-point count on the same gate.

**`studio_x_2/components/sim-transcript.tsx`** (162 lines): `AgentStateChips` :29-54, `SimulatedBanner`
:57-65, `SimTranscript` :73-161 with streaming, `flaggedIndex` and a per-turn `note` that renders the
evidence on the turn itself :135-143.
**Contradiction to fix in 14:** the banner reads "no minutes billed, no real number dialed" :62 and
`RunSheet` renders it unconditionally :440, including for the audio run the table above just priced at
$0.10 per minute.

**`studio_x_2/lib/analytics.ts`** :106-111 is the entire event set for this area: `test_authored`,
`test_run_started`, `test_run_completed {verdict}`, `suite_run_all`, `assertion_failed_viewed`,
`save_call_as_test`. There is no event for a production score, a scorecard, a recording review or an applied
fix.

### The production-scoring half already exists, and nothing reads it

This is the most important finding in the brief: 868ka25tc is half built, in the wrong place, twice.

**`studio_x_2/components/wizard/step-analysis.tsx`** (261 lines), Figma "Call Analysis":

- "Success Evaluation" switch :80-87 with the copy "Evaluate whether the call with a user was 'Successful'
  or 'Failed'" :84, then an "Evaluation Criteria" textarea :88-103 with a live 2000-character counter :93
  and a worked placeholder :99.
- "Post-Call Data Extraction" :106-160: named data points with a type and, for enums, allowed values. Gated
  on transcription, and the gate states what happens to saved points while it is off :119-123.
- Transcript and recording are two separate switches :67-76.

**`studio_x_2/lib/wizard-draft.ts`** :160-181: `AnalysisConfig {transcribe, record, successEval,
evalCriteria, dataPoints}`; `DEFAULT_ANALYSIS` :171-181 ships `successEval: false` and one seeded data point
"Call Outcome".

Three doors write it, none reads it:

1. `studio_x_2/components/call-capture-sheet.tsx` :22-59 puts the whole block behind a "Call capture" button
   in Monitor, persisted to `localStorage` under `sx:call_capture:agt_default` :20, mounted at
   `studio_x_2/app/(dashboard)/monitor/page.tsx` :111. The header comment :12-19 records the owner call that
   put it there: capture is monitoring content, not builder config.
2. `studio_x_2/app/(dashboard)/deploy/phone-numbers/[id]/number-client.tsx` :205-219 renders **a second**
   "Post Call Analysis" section, with its own `successEval` and `evalCriteria` state :49-50, unconnected to
   `AnalysisConfig` and to the Monitor sheet. Two doors, two stores, one job.
3. `deploy-preflight.tsx` :186-196 recaps it as the word "success eval" on the Outputs row.

What consumes the criteria: nothing.

- `studio_x_2/app/(dashboard)/calls/page.tsx` :33-51 defines `Outcome = "Successful" | "Failed" | "Cannot
  Predict"`, offers it as a filter :51 and a column :106, and **derives it from the call status with a
  modulo**: `OUTCOMES[(n + i) % 3]` :65. Sentiment :118 is then derived from that derived outcome.
- `studio_x_2/components/call-detail-sheet.tsx` :48 carries `outcome` on the row and prints it as the "Call
  Outcome" badge :305, with "Sentiment", "Disposition" and "Follow-up required" :106-110 all computed from
  the same field. No criteria, no score, no per-criterion breakdown, and no statement of which judge
  produced it.
- The download menu :255-274 offers Recording (disabled, with the reason `No recording. It never connected`
  or `Not retained`), Transcript .txt and Transcript .json. There is no "Save as test".

**`AddCaseSheet`'s `prefill` path is implemented and mounted nowhere.** The props :531-533, the pre-fill
effect :547-549, the "From the real call" transcript block :655-660, the `save_call_as_test` event :568 and
the "Save as test" button label :704 all exist. `grep -rn "AddCaseSheet" studio_x_2 --include="*.tsx"`
returns only `eval-tests.tsx` itself. Save a real call as a test is code without a door, and the 2026-07-09
decision log calls it the whitespace.

### The fix engine exists and only knows about infrastructure

`studio_x_2/lib/diagnostics.ts` (409 lines) is 868ka24am's shape pointed at the wrong evidence.

- `Issue` :51-64 is `{id, ruleId, title, severity, turn?, timestamp?, rootCause, suggestedFix, fixTarget}`,
  and `fixHref` :88-95 deep-links a fix to the agent editor, the deployment or vendor credentials.
- Nine rules :317: barge-in not honored, tool call failed, escalation didn't connect, off-script response,
  low ASR confidence, LLM latency spike, network quality dropped, dead air, config drift.
- `diagnoseCall` :326 runs per call at `call-detail-sheet.tsx` :203; `aggregateIssues` :354 and
  `allOpenIssues` :401 feed the Monitor Diagnostics queue.
- Its input is `CallSignals` :67-79: confidences, latencies, loss, barge-in attempts, tool-call statuses,
  dead air. **It never reads the transcript against a criterion.** "Off-script response" is the only
  behavioural rule and its input is a pre-seeded `offScript[]` array, not a judgment.

### The real Console (`ng-console/src/components/console/`, read-only)

- `agent-detail-right-panel.tsx` :50-69: the right rail is three tabs, test · code · deploy. The test tab is
  a live preview, not a suite.
- `agent-preview-surface.tsx` :375-400 turns live turns into `ConsolePreviewEvent {kind: "transcript"}`,
  rendered by `console-preview-events.tsx` in a `role="log"` list. A scored run can read those events; no new
  transport is needed for the Console prototype.
- `agent-analysis-page.tsx` (35 lines) renders four static tiles: response latency · interruption rate ·
  preview engagement · caption coverage, read off `builder.analysis`. **It is unreachable.**
  `normalizeAgentDetailTab` (`ng-console/src/lib/agents/agents-state.ts` :129-145) accepts only `models`,
  `advanced`, `actions` and `custom-config` and returns `"prompt"` for anything else, which the suite asserts
  at `agents-state.test.ts` :673. `grep -rn AgentAnalysisPage` finds it only in
  `ng-console/src/components/ui/workspace-primitives.test.tsx` :1001.
- The live Console has no eval, no suite, no scorecard and no per-call score.

### What is missing

- **A scorecard as an object.** Criteria are one free-text blob on one agent's `AnalysisConfig`. There is
  nothing to name, reuse across agents, version, or attach to a deployment, a batch or a test suite.
- **Any read path from criteria to a verdict.** The call list's outcome is fabricated
  (`calls/page.tsx` :65), which means the product already shows a score it did not compute.
- **A run record.** A suite run exists only while the tab is open (`eval-tests.tsx` :144-148). "Is this
  better than what is live?" has nothing to compare.
- **A route out of the product.** No export, no suite identifier in any URL, and no mention of CLI or CI
  anywhere under `studio_x_2/`.
- **Recording review.** The recording download is disabled with a reason (`call-detail-sheet.tsx` :258-261)
  and no surface plays audio against a scored transcript.
- **The loop back into the agent.** `Issue.suggestedFix` is prose plus a deep link. Nothing writes a change.
  Version history is a read-only table (`components/wizard/deploy-section.tsx` :145-160).
- **Concierge.** The word appears nowhere in `studio_x_2/`. The Composer chat
  (`components/composer-chat.tsx`, 531 lines) has one quick chip, "Test call" :266, and no knowledge of the
  suite, the criteria or a result.

## Agora fact-check

Sources: the installed SDK `agora-agents@2.4.0` at
`/Users/shaktisoni/Documents/Agora Design & FE/ng-console/node_modules/agora-agents/dist/cjs/`, and
docs.agora.io fetched 2026-09-17.

**The pricing fact, confirmed.** https://docs.agora.io/en/conversational-ai/overview/pricing: "The unit
price includes usage of selected ASR, LLM, and TTS models. **You are charged the same price even if you
bring your own key (BYOK).**" $0.10 per minute for the Conversational AI Engine audio task, first 300
minutes free per month; "User A: Audio RTC" bills separately at 0.00099 per minute. Consequence for this
feature: a text eval that never starts an agent bills nothing, and any run that starts an agent bills
$0.10 per agent-minute whoever owns the model keys. A CI suite that runs on every commit is an agent-minute
line item, not a free check.

**The live transcript.** `agents.getHistory` (`api/resources/agents/client/Client.d.ts` :108) returns
`GetHistoryAgentsResponse {agent_id?, start_ts?, status?, contents[]}` where each content item is `{role:
"user" | "assistant", content?, speech_start_ms?, speech_end_ms?, speech_algorithmic_delay?}`
(`api/resources/agents/types/GetHistoryAgentsResponse.d.ts`). `status` is typed as the literal `"RUNNING"`
with the comment **"Agent status. Only supports querying the running agent."** The three timing fields are
"Returned only when `llm.vendor='custom'`". There is no endpoint that returns a finished session's words.

**The post-call transcript is a webhook, not a query.** https://docs.agora.io/en/conversational-ai/develop/short-term-memory:
after the agent stops, Agora "sends short-term memory to your business server through the message
notification service", as **event type 103 (agent history)**.
https://docs.agora.io/en/conversational-ai/develop/event-types documents the set: 101 agent joined · 102
agent left · **103 agent history** ("An eventType of 103 notifies the history of a user and agent dialogue",
payload `agent_id, name, channel, start_ts, stop_ts, contents[], labels`) · 104 agent expire · 110 agent
error · 111 agent metrics · **112 turns finished** ("a batch callback of conversation turn data after the
session ends", payload adds `total_turn_count`, `is_truncated`, `turns[]`) · 201 inbound call state · 202
outbound call state. Event 112 was released 22 April 2026. The client-events page
(https://docs.agora.io/en/conversational-ai/develop/event-notifications) lists only runtime callbacks
(`onAgentStateChanged`, `onAgentListeningChanged`, `onAgentThinkingChanged`, `onAgentSpeakingChanged`,
`onAgentInterrupted`, `onAgentMetrics`, `onAgentError`) and points at webhooks for "post-session analysis".
**Scoring a production call therefore depends on somebody storing that webhook.** That store is its own
roadmap row, "Engine provide recording / transcript storage from the session", Studio P0
(`clickup-q3-roadmap-export-2026-09-03.tsv` line 152). **Requires Engine.**

**The turn record is queryable after the call, and it is the honest half of a scorecard.**
`agents.getTurns` (`Client.d.ts` :126) returns per turn
(`api/resources/agents/types/GetTurnsAgentsResponse.d.ts`): `turn_id`, `start {start_at, type: voice_input |
greeting | silence_timeout | api_speak, metadata {speech_duration_ms, interrupt_duration_ms, greeting_nth,
action, transport}}`, `end {end_at, type: ok | interrupted | ignored | error, metadata {playback_duration_ms,
caused_by, reason, details}}` and `metrics {e2e_latency_ms, segmented_latency_ms[{name, latency}]}` with
segments `algorithm_processing`, `asr_ttlw`, `llm_ttft`, `llm_ftfs`, `tts_ttfb`, `transport`. `caused_by`
names why a turn was interrupted or ignored (`start_of_speech`, `api_speak`, `api_interrupt`, `api_leave`,
`semantic`, `keywords`, `disable`) and `reason` names the error (`LLM_REQUEST_ERR`, `INTERNAL_ERR`). The
release notes date this to v2.5, 31 March 2026: "You can now query per-turn start, end, and latency metrics
for completed agent sessions" (https://docs.agora.io/en/ai/release-notes).
**So Agora keeps the shape of a finished conversation and not its words.** Everything a scorecard can assert
without a judge (was it interrupted, did a turn error, how long was the reply) is a real field. Everything
about what was said is a judgment we run, on a transcript we stored.

**Injecting a scripted turn: `think`.** `agentManagement.agentThink`
(`api/resources/agentManagement/client/Client.d.ts` :44), `POST
v2/projects/{appid}/agents/{agentId}/think` (`client/Client.js` :107), documented at
https://docs.agora.io/en/conversational-ai/rest-api/agent/think. Request
(`client/requests/AgentThinkAgentManagementRequest.d.ts`): `text` ("The custom instruction text to inject
into the current conversation pipeline. The system processes this as user input."), `on_listening_action`
(`inject` | `interrupt` | `ignore`), `on_thinking_action` (`interrupt` | `ignore`), `on_speaking_action`
(`interrupt` | `ignore`), `interruptable`, `metadata`. **The response is
`{agent_id?, channel?, start_ts?}` and nothing else** (`types/AgentThinkAgentManagementResponse.d.ts`). The
agent's reply does not come back on the call: it leaves through the normal pipeline and has to be read from
the transcript stream. This answers the open question 15 left for engineering
(`15-simulations/05-directions.md`, last paragraph) in the negative: a deterministic eval driven through
`think` still needs a running agent, a channel and a transcript reader, and it bills agent minutes like any
other call.

**`speak` is not a test harness.** `SpeakAgentsRequest.d.ts`: `text` capped at 512 bytes, `priority`
`INTERRUPT | APPEND | IGNORE`, `interruptable`. It broadcasts through TTS; it does not ask the agent
anything.

**Changing an agent mid-flight: `update`.** `UpdateAgentsRequest.d.ts` accepts only `token`,
`llm.system_messages`, `llm.params` and `mllm.params`, and warns that "Updating this field overwrites the
configuration set when the agent was created. When updating, make sure to pass the complete `params` field."
So a self-improving agent (868kbyqf6) can technically rewrite the live prompt. Nothing in the contract
versions it, diffs it, or lets it be rolled back.

**A call can be contractually unscoreable.** `properties.parameters.opt_out`
(`api/resources/agents/client/requests/StartAgentsRequest.d.ts`, `Parameters`): "Whether to disable data
retention for the current session: `false`: Default. Session data retention remains enabled. `true`:
Disables session data retention. **When disabled, historical session content cannot be used for
troubleshooting, effectiveness review, or agent optimization.**" That is a real state with a real label, and
a scorecard has to render it rather than showing an empty score.

**Recording is not in this contract.** https://docs.agora.io/en/conversational-ai/develop/recording returns
404. No field in `StartAgentsRequest.Properties` mentions recording, and no notification event carries one.
Recording is Agora Cloud Recording (https://docs.agora.io/en/cloud-recording/overview/product-overview), a
separate product, and the alignment work is four Engine rows in flight: `[O4.3-T1.b]` Define Engine recording
state behavior (P0, 2026-09), `[O4.3-T1.e]` Emit NCS recording lifecycle webhooks (P0, 2026-09),
`[O4.3-T1.c]` Align recordings and transcripts (P0, 2026-10), `[O4.3-T1.d]` Deliver recordings to customer
storage (P0, 2026-09) (`clickup-q3-roadmap-export-2026-09-03.tsv` lines 102, 103, 109, 110).
**868ka24am cannot be designed against a recording the contract does not name. Requires Engine.**

**Nothing about evaluation exists in the contract.** The join body
(https://docs.agora.io/en/conversational-ai/rest-api/agent/join) is `channel, token, agent_rtc_uid,
remote_rtc_uids, enable_string_uid, idle_timeout, asr, llm, tts` plus the typed extras in the SDK
(`geofence, advanced_features, mllm, avatar, turn_detection, interruption, sal, labels, rtc, filler_words,
parameters`). There is no analysis block, no evaluation block, no scoring block. Grepping the agents
resource for `eval|score|rubric|judge` returns a single hit, and it is the word "recording" inside a latency
comment. No 2026 release note mentions evaluation: v2.12 (10 Sept 2026) shipped custom tools, generated
filler words and MCP; v2.11 (11 Aug 2026) ASR keywords; v2.10 (30 July 2026) custom TTS
(https://docs.agora.io/en/ai/release-notes).
**Every scoring primitive in feature 14 is Studio-side.** The Engine dependency is narrow and nameable:
the stored transcript, and the recording.

### Per task

| Task | What the contract gives | What is missing | Verdict |
|---|---|---|---|
| 868kyv3tm evals in Studio and CI | `think` to inject a scripted user turn; `getHistory` to read the reply while the agent runs; `getTurns` for tool-free turn facts | No mock-tool mechanism, no judge, no assertion type, no way to run without an agent and therefore without minutes | Designable now as a mock runner. Running against the real pipeline is possible and billable, and that is a product choice, not a contract gap |
| 868ka25tc score production calls | Event 103 (words) and 112 (turn shape) delivered by webhook; `getTurns` queryable after the call | No stored transcript to score, no score field, no scorecard object | **Requires Engine** for the store (roadmap line 152). The scorecard object and the read-back surface are ours |
| 868ka24am review recordings, recommend fixes | Nothing. Recording is Cloud Recording and four Engine rows | Recording state, recording lifecycle webhooks, recording-to-transcript alignment | **Requires Engine.** A transcript-only review can ship first and say so |
| 868kbyqf6 self-improving agents | `update` can rewrite `llm.system_messages` on a running agent | Versioning, diffing, rollback, any record of why a change was made | Designable as a proposal, not as an autonomous write |
| 868kyj9w2 Concierge integration | Nothing Agora-side; Concierge is a Studio surface | The Composer knows nothing about tests or results | Ours entirely |

## Already decided

- **The typed suite is the lock 14 inherits** (15's verdict, `15-simulations/05-directions.md`): "One suite.
  Every case carries a **type** … Every run carries a **mode** … Long batched runs get a home in Go Live."
  One table, one empty state, one verdict line.
- **The F-Eval honesty rules, standing since 2026-07-09** (LEARNINGS §20): "(1) every test surface shows a
  live transcript + explicit listening/thinking/speaking state + a loud 'Simulated' banner … never let a sim
  look like a real call; (2) rubric assertions are plain-language 'PASS if…'; (3) 'save a real call as a
  test' is whitespace".
- **A failure names the config gap.** From the same entry and enforced at `test-section.tsx` :70-93: a
  failure caused by a real config gap "names the setting to fix" and points only at controls that exist for
  that agent's channel.
- **Failing tests never block deploy** (`eval-tests.tsx` :214). The pre-flight warns, it does not gate.
- **Reuse, don't redesign** (owner, 2026-09-12): things that belong together live together and look the
  same; one door per action. There are already two Success Evaluation controls and two stores. 14 removes
  one, it does not add a third.
- **Builder locks (LEARNINGS §20, v6 to v8):** section labels are **Voice & Models · Deployment · Prompt &
  knowledge · Test · Go Live**; the builder reads as one flat form with hairline rows; A/B prompt testing was
  "REMOVED, vetoed" in v6, which constrains how "before and after" is expressed inside the builder.
- **Copy discipline (CLAUDE.md):** never add UI text without asking; one short line under a control; no
  widows, no arrows, no em dashes; spoken lines get quotes and italics; explanations go behind an
  `InfoHint`, never inline.
- **The pricing fact.** $0.10 per agent-minute, the same with BYO keys. No control in this feature may imply
  that model choice or vendor choice moves the Agora bill.
- **The KPI guardrail this feature owns** (`docs/strategy/agent-builder-kpis.md` §5):
  **Evidence-before-live rate**, "First publishes preceded by ≥ 1 verified test for that agent", threshold
  "non-inferior within −3 pp of the trailing 4-week mean; **absolute floor 85 %**". Its cost counter-metric
  is "**Minutes consumed per verified test**", with the note that a win which multiplies test-call volume
  "is a direct cost increase at $0.10/min and nothing else in this system can see it."
- **Evals are defensive parity, not a differentiator** (LEARNINGS §20, 2026-07-09): "All 5 competitors
  shipped this in ~12mo; **defensive parity**". Research (`15-simulations/03-learnings.md` §4) sharpens it:
  the deterministic half is table stakes, automated voice runs are not yet.
- **Where to build** (`references/design-ops-protocol.md` step 5): the surface exists in `studio_x_2/` and
  not in the live Console, so the prototype is built in `studio_x_2/` with mock data, additive only.

## Open questions for the owner

1. **Is a scorecard an object, or does it stay a text box on the agent?**
   (a) *Extend `AnalysisConfig` in place*: one criteria blob per agent, the Monitor "Call capture" sheet
   stays the only door, and the phone-number duplicate is deleted. Cheapest, and 868ka25tc's word
   "reusable" goes unmet.
   (b) *A named `Scorecard {id, name, criteria[]}`* that an agent, a deployment, a batch and a test suite can
   each point at. This is the only shape that lets a test assertion and a production criterion be the same
   sentence, which is what makes "prove it before and after shipping" one loop instead of two.
   (c) Both, with (a) as the default and (b) behind a "Save as scorecard" action.
   This decides whether 14 is a field change or a new object, and everything downstream follows from it.

2. **What happens to the "Call Outcome" column that already exists and is fabricated?**
   (a) *Replace its source*: the same badge, now computed from the criteria the user wrote, and blank with a
   reason when no scorecard is attached. One door, but the meaning of an existing column changes for every
   user on the day it ships.
   (b) *Leave it and add a Score column beside it*: no surprise, two columns that answer the same question,
   which the standing reuse rule rejects.
   (c) *Delete the fabricated outcome now* and ship the column empty until the criteria exist. Honest, and
   the Calls page loses a filter it has today.

3. **Do deterministic evals run against a mock, or against the real pipeline?**
   (a) *Mock only*: seconds, free, no agent minutes, and the vendors are never exercised, so a pass proves
   the prompt and nothing about the stack.
   (b) *Real pipeline through `think`*: the only offer no competitor makes, and it bills $0.10 per
   agent-minute for every run, including every CI run on every commit. If this is chosen, the CI surface
   needs the same honest estimate the Run button already carries, and probably a cap.
   (c) Both, as a per-suite setting, which puts a cost decision in a place nobody looks at again.

4. **868ka24am is blocked on recordings the contract does not name. Do we ship the transcript-only half
   first?**
   (a) *Yes*: a review surface over the stored transcript plus `getTurns` facts, labelled "Requires Engine"
   where the audio would go. Ships something real and states the gap.
   (b) *No, hold the whole task* until the four Engine recording rows land. Nothing to review before
   October at the earliest.

5. **How far may a self-improving agent go without a human?**
   (a) *Propose a prompt diff a person applies.* Safe, slow, and it keeps the evidence-before-live floor
   intact.
   (b) *Write it to a draft version and require a publish.* Needs a versioned prompt object the product does
   not have yet (version history is a read-only table).
   (c) *Apply it to the live agent.* `update` supports it technically; it would let the product change what
   a caller hears with no human in the loop.

6. **Is Concierge the author of tests, the reader of results, or both?**
   (a) *Author*: "write me tests for this agent", which is the generator at `test-section.tsx` :181 given a
   chat door and nothing new underneath.
   (b) *Reader*: "why did my suite fail", which needs the run record that does not exist yet.
   (c) *Both*, which makes the run record a prerequisite for 868kyj9w2 rather than a nice-to-have.
   Also decides the word: the product says **Success Evaluation** and **Evaluation Criteria** in two shipped
   places and in the Figma, and the tracker says **scorecards**. One of them has to go.
