# P0.7 Check the agent answers as intended · Build spec

Track: **v3**. Pick: **direction 1, the panel grows a session, a state and a transcript**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.6's commit; if P0.6's commit is absent at build time, `agent_test_started` and the key line are made here and P0.6 takes them over; if P0.5's is absent, the tool line is made here from its spec and P0.5 takes it over; if P0.4's is absent, the values-first body and the header Test's save-first are made here and P0.4 takes them over. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.7): save and test, hear the first answer with the transcript, see every way the test fails`.

Scope rule: P0.7 only, the test panel of concept A (`TestPanel` in `src/prototypes/agent-builder-v3/parts/list-and-create.tsx`, moved to its own file `parts/test.tsx` when it grows), the two doors that open it (the header **Test** in `AgentA`, `concepts/a-tabs.tsx`, and `onSaveAndTest` from every row and sheet), its data, and the events it fires. Touches outside the panel, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.6 are in review): the `Sheet` that holds the panel in `AgentA` becomes non-modal and docks from xl (the live builder's layout); `onSaveAndTest` in P0.3's Advanced sheet, P0.4's prompt row and greeting sheet, P0.5's integration sheets and P0.6's key control now starts the session (they called `setTestOpen(true)`; they now call `openTest({ start: true })`); the not-ready rule from P0.4 ("Write the system prompt to talk to the agent.") applies only to a dirty draft that cannot save, so a saved agent with no prompt is testable (Aha 1); P0.3's View last save dialog lists the session calls. Concepts B to E keep compiling: `TestPanel` keeps `{ agent, onClose, className }` and gains optional props with defaults.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=<id>&tab=agent&section=prompt`, written below as `…&agent=<id>`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…&agent=agent_orders&test=edit` | The Order status agent on the Agent tab; the System prompt row holds one new sentence at the end of the draft, the footer **Cancel** · **Save** · **Save and test** on; the panel closed; the header **Test** button beside Go live | Sam adds a sentence to the prompt and presses Save and test |
| 2 | `…&agent=agent_orders&test=starting` | Toast "Prompt saved."; the panel open on the right, title **Test**, tabs **Talk** (active) and **Simulations**, the timer line "Mia · 0:00", the status line with a spinner reading Starting, the footer **End test**; the row behind it saved (no footer) and still editable | Sam sees the panel open on Talk while the session starts |
| 3 | `…&agent=agent_orders&test=live` | "Mia · 0:07"; the greeting *"Hi, this is Mia at Acme Outfitters. How can I help?"*; Sam's turn "Where is order 4471?" on the right; the meta line `search_orders · 200 · 0.4 s` with the server icon; the answer *"Order 4471 left the warehouse yesterday and should arrive on Tuesday."*; the status line Listening; **End test** | Sam hears the first answer and reads the transcript with the tool marked |
| 4 | `…&agent=agent_orders&test=ended` | The same transcript kept; the status line "Ended · 0:42"; the footer **Start test**; behind it the System prompt row focused with the cursor at the end, editable | Sam ends the test and edits the prompt again |
| 5 | `…&agent=agent_orders&test=sims` | The **Simulations** tab: one line "No simulations yet. Scenarios are written from the prompt." and **Generate scenarios**; the footer empty | Sam opens Simulations and finds it as it is |
| 6 | `…&agent=agent_draft&test=baseline` | The new agent from P0.1 (no prompt, Lowest latency untouched): the panel open on Talk, one line "No system prompt yet. The agent answers from the model alone.", **Start test** on; with `&heard` the fallback greeting *"Hi, this is Aria. How can I help?"*, Listening | Sam tests the untouched preset right after create |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b | `…&agent=agent_orders&test=unsaved` | The header Test pressed on the edited row: toast "Prompt saved.", the footer gone, the panel open on Talk on **Start test** (P0.4 .f); no dialog | None needed; Save and test does the same then starts (step 2). A dirty draft that cannot save keeps the panel on "Write the system prompt to talk to the agent." with Start test off |
| .c | `…&agent=agent_orders&test=mic` | The panel on Talk: `Alert` "The browser blocked the microphone. Allow it from the icon in the address bar, then try again." with **Try again**; under it a link **Run a text simulation**; the status line hidden; the footer **Start test** | Try again asks the browser once more; the link opens the Simulations tab (`test=sims`); a simulation never fires `agent_audio_heard` |
| .d minutes | `…&agent=agent_orders&test=minutes` | `Alert` "Free minutes are used up, so new sessions are refused. Add a card to keep testing."; the footer button reads **Add card** (default variant) in place of Start test | Add card opens `/billing` in a new tab; the panel stays; the next open shows Start test again |
| .d suspended | `…&agent=agent_orders&test=suspended` | `Alert` "The account is suspended, so new sessions are refused. Add a card to reactivate it."; the footer **Add card** | Same; when P1.7's billing state says the card failed the button reads **Update card** |
| .e | `…&agent=agent_orders&test=busy` | `Alert` "10 of 10 sessions are running, the most the project allows. Try again when one ends." with **Try again**; the footer **Start test** | Try again resends; works once a session ends. Without `limit` on the Problem the line reads "The project's session limit is reached. Try again when a session ends." |
| .f 400 | `…&agent=agent_orders&test=failed-400` | `Alert` "The session did not start (400). pipeline.llm.model is not a known model." with **Open Advanced settings** | The link closes nothing and opens `panel=advanced&row=llm` beside the panel |
| .f key | `…&agent=agent_frontdesk&test=failed-key` | `Alert` "The session did not start: OpenAI rejected the language model key (401)." with **Replace key**; the footer **Start test** | Replace key opens `panel=advanced&row=llm&key=replace` (P0.6); after Save and test the session starts |
| .f 5xx | `…&agent=agent_orders&test=failed-503` | `Alert` "The session did not start (503). Try again in a moment." with **Try again** | Try again resends; a dropped connection reads "The connection dropped before the session started. Try again." |
| .g tool | `…&agent=agent_orders&it=tool-error` (P0.5) | The transcript: the greeting, Sam's turn, `sendTrackingLink · 502` in the error tone with the tool icon, the fallback line; the status line Listening; the test still running; behind it the row **Failed in last test** | Sam edits the tool from its row menu; the test keeps running |
| .g MCP | `…&agent=agent_orders&it=mcp-401` (P0.5) | `Orders · MCP server 401` in the error tone, the fallback line; the row **Failed in last test** | Sam replaces the header from the row menu |
| .h | `…&agent=agent_payments&test=silent` | "Aria · 0:11", the greeting line; `Alert` "Running, but nothing has played for 10 s. Check the browser's output device, or play a tone." with **Play a tone** and **Try again**; the status line "Running, no sound yet"; the footer **End test** | Play a tone plays a short tone through the browser; Try again stops the session and starts a new one |
| .h retry | `…&agent=agent_payments&test=silent-retry` | The transcript kept: the greeting from test 1, a divider "Test 2 · 14:07", the greeting again; the status line Listening; **End test** | None needed; `turnCount` continues to count |

New search keys, validated in `store.tsx`: `test` (`edit` \| `starting` \| `live` \| `ended` \| `sims` \| `baseline` \| `unsaved` \| `mic` \| `minutes` \| `suspended` \| `busy` \| `failed-400` \| `failed-key` \| `failed-503` \| `silent` \| `silent-retry`, review only, never written to the store); `heard` (`1`, with `test=baseline` only). `openAgent` and `toList` clear `test` and `heard`; `openPanel(undefined)` leaves them (the panel is not a `panel=`). P0.5's `it=tool-error` and `it=mcp-401` are the .g states and are not duplicated here.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `TestPhase`, `TestRefusal`, `TestFailure`, `TranscriptLine`, `TestSession`; `TEST_SESSION_KEY`, `clientReferenceFor`, `configuredByUser`, `startTestSession`, `stopTestSession`, `TEST_PROBLEMS`, `testCopyFor`, `transcriptFixture`, `turnCount`, `SIMULATIONS`, `TEST_EDIT`.
- No seed changes. `agent_orders` (P0.5) is the journey start, `agent_draft` (P0.4) the Aha 1 agent, `agent_frontdesk` (P0.6) the failed-key agent, `agent_payments` the silent agent.
- The session Studio sends (port): `POST /sessions { agent: <agent_id>, transport: { type: "rtc", channel: "studio-test-<agent_id>-<ts>", uid: "<agent uid>", subscribe_uids: ["<browser uid>"], token }, client_reference: "studio_test:<agent_id>:<builderSessionId>", lifecycle: { idle_timeout_ms: 30000 } }`. The response's `agent_session_id` goes to sessionStorage under `ng.v3-concepts.test-session:<agent_id>`; `lastSave` (P0.3's View last save) lists `POST /sessions · 201` with the body (token as `"••••"`) and the id, then `POST /sessions/{id}/stop · 201`. No `overrides` are ever sent: the test is the saved agent (.b, open question 1).
- `parts/events.ts` gains `test_panel_opened`, `agent_test_ended`, `test_refused`, `agent_tested_baseline`, `agent_tested_configured`, `cta_viewed`, and, where earlier rows have not added them, `agent_test_started`, `integration_error_seen`, `byok_key_failed`. `builder_resumed` is listed and never fired by the prototype.
- Tests as listed in `00-data.md` item 13.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Panel | `TestPanel` (grown; moved to `parts/test.tsx`) inside `Sheet modal={false}` below xl, docked `aside` from xl | `parts/list-and-create.tsx`, `src/components/ui/sheet.tsx`; the docking branch and `useAgentBuilderTestPanelDocked` from `src/components/console/agent-builder/agent-builder-test-panel.tsx` |
| Header | the existing `h-12` row: title `console-type-section` Test, `Button size="xs" variant="ghost"` Close | `parts/list-and-create.tsx` |
| Tabs | `Tabs`, `TabsList`, `TabsTrigger` text-only, Talk and Simulations, under the header (the Agent page's tab bar, ADR 0006) | `src/components/ui/tabs.tsx` |
| Timer line | the existing `text-xs text-muted-foreground tabular-nums` line "{Voice} · m:ss" | `parts/list-and-create.tsx` |
| Agent line | the existing `bg-muted px-3 py-2 text-sm italic` block with typographic quotes | same |
| Person line | the same block mirrored: `self-end border border-border/58 bg-transparent text-sm`, no quotes, no italics | same, sibling of the agent line |
| Tool line | P0.5's `<p className="text-xs text-muted-foreground tabular-nums">` with `KindIcon`, `text-destructive` on failure | `parts/context.tsx`, `parts/list-and-create.tsx` |
| Key line, Replace key | P0.6's key line and `Button variant="link" size="sm"` | `parts/list-and-create.tsx`, `src/components/ui/button.tsx` |
| Divider | `Separator` with a centred `text-xs text-muted-foreground` label "Test 2 · 14:07" | `src/components/ui/separator.tsx` |
| Status line | the existing `mt-auto flex items-center gap-2 text-sm text-muted-foreground` line; icon per state: `Spinner` (Saving, Starting), `Mic` (Listening), `VolumeX` (Running, no sound yet), `CircleStop` (Ended) | `parts/list-and-create.tsx`, `src/components/ui/spinner.tsx`, lucide |
| Values body | P0.4's **Values for this test** `Field` + `Input` per variable | `parts/list-and-create.tsx` |
| Idle and Aha 1 lines | `console-type-body text-muted-foreground` (the existing idle line) | same |
| Failure and refusal | `Alert variant="destructive"` + `AlertDescription` with one `Button variant="outline" size="sm"` (P0.1's error alert) and, for .c, one `Button variant="link" size="sm"` under it | `src/components/ui/alert.tsx`, `button.tsx` |
| Speaker check | `Button variant="ghost" size="sm"` **Play a tone** beside **Try again** inside the alert | `button.tsx` |
| Footer | the existing full-width `Button variant="outline"` Start test / End test; **Add card** as `Button` default variant (the one filled button in the panel) | `parts/list-and-create.tsx` |
| Starting | `Spinner data-icon="inline-start"` in the footer button, button inert | `src/components/ui/spinner.tsx` |
| Simulations tab | Studio X 2's `simulations` tab ported onto Console primitives as it is: the line and **Generate scenarios** (`Button variant="outline" size="sm"`), the scenario list, the results footer; empty first with `EmptyRow` | `studio_x_2/components/wizard/test-panel.tsx` (source), `parts/common.tsx` `EmptyRow` |
| Saved | `sonner` toast from the row that saved (P0.3 to P0.6) | `src/components/ui/sonner.tsx` |
| Last save | P0.3's View last save `CodeBlock` dialog | `src/components/ui/code-block.tsx` |

No new token, component, radius or font size. No waveform, no audio meter, no avatar, no chat composer on Talk (text lives on Simulations). No icon on the tabs.

## 4. The panel, piece by piece

### Layout

From xl (80rem) `AgentA` renders `<div className="flex gap-5"><div className="min-w-0 flex-1">…tabs and rows…</div><aside className="sticky top-4 hidden w-80 shrink-0 self-start xl:block">TestPanel</aside></div>` while the panel is open; below xl the existing `Sheet` with `modal={false}`, `onInteractOutside` prevented, `onOpenAutoFocus` prevented, `side="right"`, `sm:max-w-sm`. Closed by default. The rows stay at their width; nothing shrinks to fit (DESIGN.md §6).

### Talk tab, by phase

| Phase | Body | Status line | Footer |
|---|---|---|---|
| idle, saved prompt | "Talk to the agent with your microphone." (+ "The number is not dialled." for inbound) | hidden | Start test |
| idle, values needed | P0.4's Values for this test | hidden | Start test (off until filled) |
| idle, no prompt, saved | "No system prompt yet. The agent answers from the model alone." | hidden | Start test |
| idle, dirty draft cannot save | "Write the system prompt to talk to the agent." (P0.4) | hidden | Start test off |
| saving | the transcript so far, or nothing | Saving | End test inert |
| starting | same | Starting | End test |
| live | the transcript | Listening | End test |
| silent | the transcript, the .h alert | Running, no sound yet | End test |
| ended | the transcript | Ended · m:ss | Start test |
| mic | the .c alert | hidden | Start test |
| refused | the .d or .e alert | hidden | Add card, or Start test (.e) |
| failed | the .f alert | hidden | Start test |

The timer line shows from `saving` on and keeps its last value in `ended`. The transcript scrolls inside the body; the status line and the footer stay in view.

### Simulations tab

Studio X 2's tab as it is: one line, **Generate scenarios**, the scenario list with its verdicts, the results footer after a run. Empty first: "No simulations yet. Scenarios are written from the prompt." and the button. Nothing in this row changes its internals; its one locked-word fix is the line above (Studio X 2 said "channel and call behavior"). Its runs never fire `agent_audio_heard` and never touch `lastTest` on an integration.

## 5. Behaviour

- **Doors.** The header **Test** calls `openTest({ start: false, trigger: "header" })`: saves a dirty prompt draft first through the row's `saveIfDirty()` ref (P0.4 .f), opens the panel on Talk, focuses Start test, fires `test_panel_opened {tab: talk, trigger: header}`. Every row's and sheet's **Save and test** calls its own save, then `openTest({ start: true, trigger: "save_and_test" })`: the panel opens on Talk and `start()` runs at once. The A/B flag's auto-open after create calls `openTest({ start: false, trigger: "auto" })`. Focus returns to the header Test on Close.
- **Start.** `start()`: the not-ready and values checks first (nothing sent); then `getUserMedia({ audio: true })` (denied: `mic`, `operation_failed {operation: test_start, code: mic_denied}`, nothing sent); then phase `starting`, `agent_test_started {agentId, trigger, configuredByUser, preset, transport: rtc}`, `POST /sessions`; on 201 store the session, join the channel, poll `GET /sessions/{id}` once at 5 s and once at 10 s; on the first agent audio frame phase `live`, `agent_audio_heard {surface: builder, configuredByUser, turnCount: 1, trigger, agentVersion: updatedAt}`, then once per agent `agent_tested_baseline` (configuredByUser false) or `agent_tested_configured` (true), guarded by a sessionStorage flag `ng.v3-concepts.tested:<agentId>` until the server anchor ships. Design mode: the outcome comes from `test=`; a clean start plays the greeting at 2 s, the person turn at 3.5 s, the tool line at 4 s and the answer at 5 s on an agent with a usable integration (P0.5's timing), the greeting only otherwise.
- **Refused.** A 403 `AccountSuspended` or 429 `quota_exceeded` gives phase `refused` with the .d alert and the footer **Add card** (`cta_viewed {cta: add_card}` on show; opens `/billing` in a new tab, `external_link_opened {surface: billing}`); `test_refused {reason: suspended | resource_limit}`. A 429 `ConcurrencyLimitExceeded` gives the .e alert with `limit` and `current` when present; `test_refused {reason: concurrency_limit, limit, current}`.
- **Failed.** 400 `validation_failed` names `errors[0].field` and `message`, the action **Open Advanced settings** targets the row for the field's module (`pipeline.llm.*` to `row=llm`, `pipeline.asr.*` to `row=asr`, `pipeline.tts.*` to `row=tts`, else `panel=advanced`). 502 `provider_error` with `provider` on a module whose `keys[slot]` is set names the module and `provider_code`, offers **Replace key** (P0.6's `nav.go({ panel: "advanced", row: slot, key: "replace" })`), fires `byok_key_failed {module, code}`; on a managed module it reads "{Vendor} did not answer (502). Try again." 500, 503, 504 and a network error read the generic line with **Try again**. Every failure fires `operation_failed {operation: test_start, code}` once.
- **Live.** Transcript lines come from the session's data stream (design mode: the fixture timers). Agent lines fill `{{name}}` from P0.4's stored values. Each agent line after the first fires `agent_audio_heard` with the new `turnCount`. Tool and key lines are P0.5's and P0.6's, unchanged, and write `lastTest` on the integration or the key at End test as they specify.
- **Silent (.h).** No agent audio frame for 10 s after `running`: phase `silent`, the alert and the status line; `agent_audio_heard` is not fired. **Play a tone** plays a 440 Hz, 300 ms tone through an `AudioContext` (no asset). **Try again** stops the session (`agent_test_ended {reason: error, code: no_audio}`), appends the divider "Test {n} · HH:mm", and runs `start()` with `trigger: "retry"`; the transcript is kept. The idle timeout ends a silent session on its own after 30 s; the panel then shows `ended` with the alert kept.
- **End.** **End test** sends `POST /sessions/{id}/stop`, phase `ended`, the status line "Ended · m:ss", `agent_test_ended {durationMs, turnCount, reason: toggle}`. Close, leaving the agent page and closing the tab also stop the session (`reason: rail_closed | navigated | unmount`, a `beforeunload` best effort) so no session is left running. The transcript stays until Close or a new agent.
- **Saved while live.** A save from any row while a session runs does not restart it; the status line stays and the next Start test uses the new version (the session is the saved agent at start). A `Save and test` while live stops the running session first, then starts a new one under a divider.
- **Simulations.** `TabsTrigger` Simulations fires `test_panel_opened {tab: simulations, trigger: tab}`; its content is the port, with its own events as Studio X 2 fires them. The .c link opens it.
- **Keyboard.** Panel: tabs, the alert's buttons and link, the footer button; transcript lines are not focusable. Esc closes the sheet below xl (and stops a running session); the docked panel closes with Close. Opening with `start: false` focuses Start test; with `start: true` focuses End test. `test=` review states set focus the same way.
- **Events per action.** `test_panel_opened`, `agent_test_started`, `agent_audio_heard`, `agent_tested_baseline`, `agent_tested_configured`, `agent_test_ended`, `test_refused`, `operation_failed`, `cta_viewed`, `external_link_opened`, `integration_error_seen` (P0.5), `byok_key_failed` (P0.6), `agent_updated {trigger: test}` (the row's save); each logs once through `trackProto`. `builder_resumed` is never fired by the prototype.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics. Never: call, conversation, chat, preview, demo, playground, sandbox, trial, credits, quota, paused, live (for running), connect, channel (alone), transcript as a feature name in a title.

| Key | Text |
|---|---|
| Panel title | Test |
| Tabs | Talk / Simulations |
| Close | Close |
| Timer line | {Voice} · {m:ss} |
| Idle line | Talk to the agent with your microphone. |
| Idle line, inbound (second sentence) | The number is not dialled. |
| Aha 1 line | No system prompt yet. The agent answers from the model alone. |
| Not ready line (P0.4) | Write the system prompt to talk to the agent. |
| Fallback greeting | *"Hi, this is {Voice}. How can I help?"* |
| Person turn (fixture) | Where is order 4471? |
| Status, saving | Saving |
| Status, starting | Starting |
| Status, live | Listening |
| Status, silent | Running, no sound yet |
| Status, ended | Ended · {m:ss} |
| Footer | Start test / End test / Add card / Update card |
| Divider | Test {n} · {HH:mm} |
| Mic alert (.c) | The browser blocked the microphone. Allow it from the icon in the address bar, then try again. |
| Mic actions | Try again / Run a text simulation |
| Minutes alert (.d) | Free minutes are used up, so new sessions are refused. Add a card to keep testing. |
| Suspended alert (.d) | The account is suspended, so new sessions are refused. Add a card to reactivate it. |
| Suspended alert, card failed (P1.7) | The account is suspended because the last payment failed, so new sessions are refused. Update the card to reactivate it. |
| Busy alert (.e) | {current} of {limit} sessions are running, the most the project allows. Try again when one ends. |
| Busy alert, no numbers | The project's session limit is reached. Try again when a session ends. |
| Failed 400 (.f) | The session did not start (400). {field} {message}. |
| Failed 400 action | Open Advanced settings |
| Failed key (.f) | The session did not start: {Vendor} rejected the {module} key ({code}). |
| Failed key action | Replace key |
| Failed provider, managed (.f) | {Vendor} did not answer ({code}). Try again. |
| Failed 5xx (.f) | The session did not start ({code}). Try again in a moment. |
| Failed network (.f) | The connection dropped before the session started. Try again. |
| Retry | Try again |
| Silent alert (.h) | Running, but nothing has played for 10 s. Check the browser's output device, or play a tone. |
| Silent actions | Play a tone / Try again |
| Tool line (P0.5) | {name} · {code} · {n} s / {name} · {code} / {server} · MCP server {code} |
| Key line (P0.6) | {Module} · key rejected · {code} |
| Simulations empty | No simulations yet. Scenarios are written from the prompt. |
| Simulations button | Generate scenarios / Regenerate |
| Simulations line, after generate | {n} scenarios from the prompt. Regenerate after big prompt changes. |
| Toasts (from the rows) | Prompt saved. / Greeting and failure message saved. / Advanced settings saved. / MCP server added. / Tool added. |
| Last save entries | POST /sessions · 201 / POST /sessions/{id}/stop · 201 |
| Last save token | "token": "••••" |

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (call, conversation, chat, preview, demo, playground, sandbox, trial, credits, quota, paused, connect, prototype, simulated, mock, wireframe, arrows, em dashes). A grep of the changed files must find no RTC token in `sessionStorage` or `lastSave`. P0.1 and P0.2 routes unchanged; P0.3, P0.4, P0.5 and P0.6 touched only as declared (their `onSaveAndTest` now starts the session; their review states `adv=saved-test`, `pr=saved-test`, `it=tested`, `key=saved-test` render through the new panel in its `live` phase). Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 edit-save-and-test, 02 starting, 03 live-first-answer, 04 ended-edit-again, 05 simulations, 06 baseline-untouched-preset, then rainy 07 b-unsaved, 08 c-mic-denied, 09 d-minutes, 10 d-suspended, 11 e-busy, 12 f-400, 13 f-key, 14 f-503, 15 g-tool-error, 16 g-mcp-401, 17 h-silent, 18 h-retry.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.7 · Check the agent answers as intended` after P0.6's, child sections 1 JTBD, 2 Research (the 11 shots in `02-research.md` with their regions), 3 Flow (18 story frames), 4 Hero (the docked panel live with the transcript and the tool line; the panel refused with Add card in place; the panel running in silence with the tone and the retry), 5 Rationale with the three links. Owner ask of 26 Sep: add a child section **UI Explorations** with 3 to 5 native variations of the first hero screen (the live panel with the transcript, the status line and the tool mark), each meticulously built from the kit on page 31:2 with variables bound, with the vendor logos where a module is named (Deepgram, OpenAI, Cartesia in the tool and key lines' modules), grounded in Refero screens (`refero_search_screens` for voice test panels, live transcripts and connection-state chips; tag each with its source), hero screens only, nothing interactive. Load `figma:figma-use` first.
