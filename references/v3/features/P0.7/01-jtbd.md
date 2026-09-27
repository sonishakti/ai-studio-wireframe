# P0.7 Check the agent answers as intended · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.7]. No ClickUp comments on the task, so there are no change notes. Concept A is the surface: the header **Test** button in `AgentA` (`concepts/a-tabs.tsx`) and the `TestPanel` it opens (`parts/list-and-create.tsx`), plus the **Save and test** button that P0.3, P0.4, P0.5 and P0.6 put in every row footer and sheet footer. Scope is the test that Studio starts before anyone else reaches the agent; reproducing a production surprise is P1.2, the Simulations tab's own content is Studio X 2's and stays as it is (requirement 52).

## Job step

Sam checks that the agent answers the way Sam intended before anyone else can reach the agent.

**Job statement.** When I have set the agent up, I want to hear it answer as it is saved, with every tool it used marked on the transcript, so I go live knowing what people will hear and not guessing.

**Why now.** The north star is TTFA, time to first answer, and today's panel gives it nothing to stand on: Start test starts no session, the panel is a modal sheet that blocks the rows behind it, one bubble is the whole transcript, and every way the test can fail (no mic, refused, failed to start, silent) ends in the same "Listening" line. An untouched preset agent cannot even be tested, so Aha 1 never fires.

## Happy path · P0.7.a

Story: Sam wants proof the agent works before anyone else hears the agent, so Sam can go live without guessing.

1. On a row with edits Sam presses **Save and test**. The row saves (toast) and the test panel opens on **Talk**: the title, the tabs Talk and Simulations, the timer line, the status line reading Starting, End test in the footer. The header **Test** button is the same door without edits: it opens the panel on **Start test**. `agent_updated {trigger: test}`, `test_panel_opened {tab: talk, trigger: save_and_test | header}`
2. Studio asks the browser for the microphone, then sends `POST /sessions` with `agent: <agent_id>`, an rtc transport and `client_reference: studio_test:<agent_id>:<builderSessionId>`, stores the `agent_session_id` it gets back, and joins the channel. The status line reads Starting until the session is running. `agent_test_started {trigger, configuredByUser, preset}`
3. Sam hears the first answer. The greeting shows as a line in quotes and italics, the status line reads Listening, and the transcript runs on: Sam's own turn as a plain line, each tool the agent used as one meta line with its name, code and time (P0.5), the answer after it. `agent_audio_heard {surface: builder, configuredByUser, turnCount, trigger, agentVersion}`, and once per agent `agent_tested_baseline` (preset untouched) or `agent_tested_configured` (Sam's own agent, the TTFA stop)
4. Sam presses **End test** and edits again. The transcript stays with the status line "Ended · 0:42", the footer reads Start test, the rows behind the panel are editable because the panel is not modal (from xl it docks on the right). The **Simulations** tab is there as it is. `agent_test_ended {durationMs, turnCount, reason: toggle}`

Aha 1 inside .a: right after create, a preset agent with no prompt can be tested. The panel says one line, "No system prompt yet. The agent answers from the model alone.", and Start test is on; the first answer fires `agent_tested_baseline`.

Done when: a test session was started from `agent_id` with the `studio_test:` reference, its id is stored, and the first answer was heard with the transcript beside it (median edit to first answer well inside the 3 minute TTFA target).

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.7.b | Sam has unsaved edits | No dialog. Save and test saves the row first; the header Test saves a dirty draft first (P0.4 .f); the session always starts from `agent_id`, so an old version is never tested. A dirty draft that cannot save (empty prompt) keeps the panel on "Write the system prompt to talk to the agent." with Start test off, so the old version is not tested either | `agent_updated {trigger: test}` |
| P0.7.c | The browser denies the mic | Before any session is started the panel shows one alert: the browser blocked the microphone, allow it from the icon in the address bar, then **Try again**; under it a link **Run a text simulation** that opens the Simulations tab. A simulation never fires `agent_audio_heard` | `operation_failed {operation: test_start, code: mic_denied}` |
| P0.7.d | The account is suspended or free minutes are used up | `POST /sessions` is refused. The panel shows one alert naming the blocker (free minutes used up, or the account suspended) and the footer button becomes **Add card** in place of Start test. It opens Billing in a new tab | `test_refused {reason: suspended | resource_limit}`, `cta_viewed {cta: add_card}` |
| P0.7.e | Too many sessions are running | The alert names the limit from the Problem, "10 of 10 sessions are running, the most the project allows.", and **Try again** works once one ends | `test_refused {reason: concurrency_limit, limit, current}` |
| P0.7.f | The session fails to start (400, 5xx, dropped) | The alert shows the code and **Try again**. A 400 names the field and links to Advanced settings. A 502 from a provider on a module that runs on Sam's key names the module and the vendor's code and offers **Replace key** (P0.6's door). A dropped connection says so | `operation_failed {operation: test_start, code}`, `byok_key_failed {module, code}` on the key case |
| P0.7.g | A tool or MCP server fails mid-test | The failure is one transcript line in the error tone with the name and the code (P0.5), the agent's fallback line after it; the test keeps running and the row behind reads Failed in last test | `integration_error_seen {integrationType, errorCode}` |
| P0.7.h | The session starts but Sam hears nothing | After 10 s running with no audio the status line reads "Running, no sound yet" and the alert offers **Play a tone** (a short tone through the browser's output, to tell a muted speaker from a silent agent) and **Try again**. Try again stops the session, starts a new one, and keeps the transcript under a divider "Test 2 · 14:07" | `agent_test_ended {reason: error, code: no_audio}`, then `agent_test_started {trigger: retry}` |

Empty first: a brand-new account has no agent, so no panel; the first agent after create shows the Aha 1 line and Start test, nothing seeded, no scenarios in Simulations.

## Measures

- KPI: TTFA, time to first answer: median 3 min or less and p75 6 min or less of active time, from the first `builder_opened` for the agent to `agent_tested_configured`, summing `activeMs` across `builder_opened` and `builder_resumed` sessions, idle over 120 s removed, winsorised at 900 s (source console).
- Counter metric: VTR at least 70 %, `agent_created` to `agent_tested_configured` within 14 days.
- Assumption to read after P0.13: Aha 1 helps. Agents that reach stage 4 reach stage 8 within 14 days at 1.2 times or more the rate of those that skip it. Method: a flag A/B that auto-opens the panel on Start test after create (never auto-starts, so `trigger` stays honest). Kill below 1.05 times.
- API: Partial. `POST /sessions` with `agent_id` over rtc is ready, `client_reference` is writable but never returned (Studio stores the id), `stop` and `GET /sessions/{id}` exist. Missing: a purpose field (developer sessions count as production until it ships), the server anchor for Aha 1 and 2 (notif 112, unbuilt), a transcript or turn feed during the session (deferred past launch; the panel reads the RTC data stream), a tool execution event (P0.5's gap), a free-minutes field on the refusal, and `limit` and `current` are optional on a concurrency refusal.
