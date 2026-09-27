# P0.13 Try the agent without counting the tries · Build spec

Track: **v3**. Pick: **direction 1, the tag where the count is**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.12's commit; if P0.7's commit is absent at build time, the registry write and the idle sentence land in today's `TestPanel` (`parts/list-and-create.tsx`, the entry written at Start test with a fixture id) and P0.7 takes them over with `start()`; if P0.8's is absent, the Overview empty row is today's `EmptyRow` in `parts/performance.tsx`; if P0.10's is absent, `SessionsTable` is today's in `parts/deploy.tsx`; P0.3's View last save (`LastSaveDialog`, `parts/advanced.tsx`) is on dfdbb2fa and is the door every rainy state uses. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.13): keep every test out of the agent's numbers and show what Studio kept and sent`.

Scope rule: P0.13 only: the Studio test registry and its reads (`data.ts`), the Sessions tile hint, the Your tests door and the Test tag on Overview (`parts/performance.tsx`, `SessionsTable`), one sentence in the test panel's idle line, the two new entry kinds in View last save, the sanitised event log (`parts/events.ts`), and the `tries` review key (`store.tsx`). Touches outside it, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.12 are in review): P0.7's `start()` writes the registry at the 201 and its idle line gains the sentence; P0.3's `LastSaveEntry` gains `kind` and `comment`; P0.10's `SessionsTable` renders You and the tag for a registry match and an empty party cell for `""`; P0.8's Overview empty row is untouched. Concepts B to E keep compiling: `SessionsTable` keeps `{ sessions, showRun, agent }` and gains optional `tests` with a default of the registry; `TestPanel` keeps its props; `Performance` keeps `{ agent, onPrimary, onSetUpAnalysis, hideSessions }`. No production file outside `src/prototypes/` changes in this commit: the allowlist keys and the identity option are named below as the team's PR and the prototype imports the real sanitiser to show both states.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=agent_tutor&tab=overview`, written below as `…`. The In-app tutor is code, Live, Olivia, 2,910 sessions in 7 days. The prototype link opens at step 1. P0.7's `test=` opens the docked panel on any tab (its layout wraps the tabs), and P0.3's `panel=last-save` opens the dialog.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…` | Overview: 7 days · 30 days; the tile strip **Sessions** 2,910 with an (i) reading "Production sessions in the period. Tests from Studio are left out. Their minutes still count in Usage.", Average duration 6m 52s, Success rate Not set with **Set success criteria**, Response time 1,140 ms; Sessions per day; Response time by stage; Output fields empty; **Recent sessions** with five production rows (`user_8812` …) and, at the right, **Open in session history** only; the header **Test** and the menu, no Go live (live code agent, P0.8) | Sam opens Overview and reads 2,910 production sessions |
| 2 | `…&tries=idle` | The test panel docked on the right (P0.7): title **Test**, tabs Talk and Simulations, the body "Talk to the agent with your microphone. Tests stay out of the agent's numbers.", the footer **Start test** focused; behind it Overview unchanged | Sam presses Test and reads that tests stay out of the numbers |
| 3 | `…&test=live` | The panel running: "Olivia · 0:07", the greeting *"Hi! What are we working on today?"* and the lines P0.7 plays for this agent, the status line Listening, **End test**; behind it the Sessions tile still 2,910 | Sam talks to the agent while the Sessions tile stays at 2,910 |
| 4 | `…&test=ended&tries=kept` | The panel "Ended · 0:42" with **Start test**; Overview: the tile 2,910, the chart unchanged, Recent sessions the same five rows; the title row now reads **Your tests (1)** · **Open in session history** | Sam ends the test and the count has not moved |
| 5 | `…&tries=tests` | Recent sessions switched: one row `Today, 14:02` · **You** with the gray **Test** tag · `0m 42s` · Completed · (blank); the link at the right reads **Production sessions**; the tile strip and the chart unchanged | Sam opens Your tests and finds the test tagged, outside the count |
| 6 | `…&tries=kept&panel=last-save` | The **View last save** dialog (P0.3): `POST /sessions · 201` with the body (`client_reference: "studio_test:agent_tutor:b7c2…"`, `transport.channel: "studio-test-agent_tutor-…"`, token `"••••"`) and the response id `ses_t1`; then `studio_tests · kept` with `{ sessionId, agentId, startedAtIso, builderSessionId, environment }` and the line `// in this browser until the account store ships`; then `posthog · agent_test_started`, `posthog · agent_audio_heard`, `posthog · agent_test_ended`, each with the props that pass the allowlist after this row's 15 keys; then `POST /sessions/ses_t1/stop · 201` | Sam opens View last save and reads what Studio kept and sent |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b | `…&tries=preview&panel=last-save` | The dialog: `posthog · agent_test_started` with `environment: "preview", trafficType: "external", userClassificationSource: "authenticated_identity"` and the line `// preview traffic classified as external: classifyNonProductionAsTest is off`, then the same event as the fix sends it: `trafficType: "test", userClassificationSource: "environment"` under `// after the fix` | The identity gate passes `classifyNonProductionAsTest: true` before any preview deploy (team, `src/lib/observability/identity.ts` caller); nothing changes for Sam |
| .c | `…&tries=dropped&panel=last-save` | The dialog: the three events as today's allowlist sends them: `agent_test_started { trigger, surface, environment, trafficType }` with `// dropped by the allowlist: agentId, builderSessionId, configuredByUser, preset, deploymentType, transport`; `agent_audio_heard { trigger, surface, environment, trafficType }` with `// dropped: agentId, builderSessionId, turnCount, agentVersion, wallMs, activeMs, serverAnchored, configuredByUser; arrays never pass`; `agent_test_ended` likewise | The allowlist PR adds the 15 keys and joins arrays with `|` (team, `sanitize.ts`); step 6 shows the after; until it lands the KPI cannot join a test to its agent |
| .d | `…&tries=no-gateway&panel=last-save` | The dialog: `posthog · agent_audio_heard` with `serverAnchored: false` and `// no server anchor (G1): the client claim stands alone`; a note entry `// server events fall back to their operation_succeeded twins until the gateway emitter ships: agent_create, telephony_phone_number_bind, telephony_campaign_create; API-only and ephemeral journeys stay unmeasured` | Reports show the measured share beside every KPI; nothing changes for Sam |
| .e | `…&tries=mismatch&panel=last-save` | The dialog: `GET /sessions · 200` with `{ items: [{ start_ts: 1790424131, status: "stopped", agent_id: "3f9c0a7d5e2b4c6f8a1d9e0b2c4f6a8d" }] }` and `// agent_id is 32 lowercase characters, not agent_tutor: Studio joins tests by the session id it stored, never by this field; the tile subtracts the registry count; dropping a row waits on decision 5` | Confirm the join key (decision 5) before stage 10 is reported; Your tests never depends on it |
| .f | `…&tries=lost` | Overview after a test whose id is gone: the tile **Sessions** 2,911; the chart's last bar one taller; Recent sessions with a new first row `Today, 14:02` · (empty party) · `0m 42s` · Completed · (blank), no tag; no Your tests link; the (i) unchanged | None on the page: the test counts as production. The account-level store is the fix (open question 1); the server-side check counts sessions whose `client_reference` starts `studio_test:` against the registry and must read 0 |
| .g dialog | `…&tries=no-consent&panel=last-save` | The dialog: the API calls and `studio_tests · kept` as step 6; in place of the three analytics entries one line `posthog · nothing sent` with `// analytics is off for this browser (user_opt_out)` | None needed; server events still count stages 3, 5 and 9; every KPI is read over consented users with the measured share |
| .g page | `…&tries=no-consent&test=ended` | The same page as step 4: the panel ended, the tile 2,910, **Your tests (1)** | Nothing to fix; consent gates events, never the test, the reference or the tag |
| draft | `/v3?concept=a&view=agent&agent=agent_survey&tab=overview&tries=kept` | Renewal survey (batch, Draft): the Overview empty row "No sessions yet. Results show here after the first run." with **Go live** (P0.8), unchanged; no door, no tag; the test is in the panel's transcript and in the registry | Open question 3; P1.8's strip owns the draft Overview |

New search key, validated in `store.tsx`: `tries` (`idle` \| `kept` \| `tests` \| `lost` \| `preview` \| `dropped` \| `no-gateway` \| `mismatch` \| `no-consent`, review only, never written to the store; `idle` opens the panel idle as the header Test does; `kept` seeds the registry with `ses_t1` and appends the session for the render; `tests` implies `kept` and opens the Your tests view; `lost` appends the session and leaves the registry empty; the other five change the dialog's entries only). `openAgent` and `toList` clear `tries`; `openPanel(undefined)` leaves it (as P0.8's `dep`). P0.7's `test=` and P0.3's `panel=last-save` keep their meaning.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `StudioTest`, `TESTS_KEY`, `readTests`, `writeTest`, `testsFor`, `isStudioTest`, `productionSessions`, `productionCount`, `testRows`; `P0_13_ALLOWLIST_KEYS`, `sanitiseForReview`; `LastSaveEntry.kind` and `comment`; the fixture identity.
- The registry write: in P0.7's `start()`, on the 201, `writeTest({ sessionId: response.agent_session_id, agentId, startedAtIso, builderSessionId, environment })` before the channel join; a refused or failed start writes nothing. The reference stays P0.7's `studio_test:<agent_id>:<builderSessionId>`. Port: the Console server's Studio client gains `createTest(appId, body)` and `listTests(appId, agentId)` once the `studio_tests` object exists (open question 1); until then `localStorage["ng-console:studio-tests:<appId>"]`.
- The reads: the tile is `productionCount(stats, agent, tests)`; the chart and Recent sessions use `productionSessions(agent, tests)`; Your tests is `testRows(agent, tests)` (port: one `GET /sessions/{id}` per entry, cached per Overview open; `ended_at` minus `created_at` is the duration; `stopped` reads Completed, `failed` reads Failed).
- `parts/events.ts`: `trackProto` gains the base props and the sanitised log `{ sent, dropped }` and appends `posthog · <event>` entries to `lastSave`; it imports `sanitizePostHogProperties` from `src/lib/observability/sanitize.ts` and `normalizeObservabilityIdentity` from `identity.ts` (read-only imports; no production file changes). Names ported from event-spec 1.0.0 where earlier rows have not added them: `builder_opened`, `agent_test_started`, `agent_audio_heard`, `agent_test_ended`.
- The team's PRs, named here and not made in this commit: (1) allowlist, 15 keys in `sanitize.ts` and arrays joined with `|`; (2) the identity gate passes `classifyNonProductionAsTest: true`; (3) the rename map, once, next schema bump, no aliases: `deploy_blocked` to `go_live_blocked`, `agent_tested_production` to `agent_answered_production`, `connection_created` retired (`app_connected`, `channel_connected`), `configured` to `configuredByUser`, `channel` to `deploymentType` and `transport`, the `agent_publish` operation and the deployment status operations retired; server to client prop map `deployment_type`/`deploymentType`, `agent_id`/`agentId`, `agent_session_id`/`sessionId`; `client_reference` is never sent to analytics; (4) the `studio_tests` object in the Console backend; (5) the five data-quality checks as queries, 7 days green before any P0 KPI.
- Tests as listed in `00-data.md` item 12.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Sessions hint | `Kpi hint` on `InfoTip` (the Success rate and Response time tiles already carry one) | `parts/performance.tsx`, `parts/common.tsx` |
| Your tests door | `Button size="xs" variant="ghost"` beside **Open in session history** in the Recent sessions title row; the same button reads **Production sessions** when the tests view is open | `parts/performance.tsx`, `src/components/ui/button.tsx` |
| Test tag | `TestBadge`: `Badge variant="outline" className="text-muted-foreground"` reading Test (the `StatusBadge` classes, so it looks like every other chip) | `parts/common.tsx`, `src/components/ui/badge.tsx` |
| Test row | `SessionsTable` as it is; the party cell `<span className="flex items-center gap-2">You <TestBadge /></span>` for a registry match; an empty cell for `party: ""` | `parts/deploy.tsx` (or P0.10's `parts/runs.tsx`) |
| Idle sentence | P0.7's idle line `console-type-body text-muted-foreground`, one more sentence | `parts/test.tsx` (today `parts/list-and-create.tsx`) |
| Registry, sanitised log | data and events, no UI | `data.ts`, `parts/events.ts` |
| Kept and sent entries | P0.3's `LastSaveDialog` `CodeBlock`: one block per entry with a `text-xs text-muted-foreground` title (`studio_tests · kept`, `posthog · agent_test_started`) and the `// comment` line inside the block | `parts/advanced.tsx`, `src/components/ui/code-block.tsx` |
| Dialog | P0.3's `Dialog` for View last save, unchanged | `src/components/ui/dialog.tsx` |

No new token, component, radius or font size. No mode switch, no toggle, no environment picker, no chart series for tests, no colour on the tag, no "Not counted" on the status line, no Submit, no Mark as test, no green, no red.

## 4. The row, piece by piece

### The Sessions tile and the door

```
Sessions (i)        Average duration      Success rate (i)         Response time (i)
2,910               6m 52s                Not set                  1,140 ms
+17% on the …                             Set success criteria     -4% on the …

Recent sessions                       Your tests (1)   Open in session history
Started        User                 Duration   Outcome     Success
Today, 10:03   user_8812            2m 13s     Completed   
```

The (i) is the third on the strip and reads the same in every period. The door renders only when `testsFor(agent.id).length > 0`; its label carries the count. Pressed, the table swaps to `testRows` and the button reads **Production sessions**; the title stays Recent sessions; nothing else on the tab changes. The view is component state; `tries=tests` opens it for review; P1.2 decides whether the port lifts it to the URL.

### The Your tests row

```
Started        User                 Duration   Outcome     Success
Today, 14:02   You  [Test]          0m 42s     Completed   
```

One row per registry entry for this agent, newest first, 20 at most. The party reads You (Studio's microphone was the other party) and the tag follows it; Outcome from the session status; Success blank until Analysis runs on tests (P1.9). The run column never shows (a test has no run). On an inbound or batch agent the column header reads Number and the cell still reads You.

### The idle line

"Talk to the agent with your microphone. Tests stay out of the agent's numbers." On inbound P0.7's second sentence stays between them: "Talk to the agent with your microphone. The number is not dialled. Tests stay out of the agent's numbers." The line renders only in the idle phase, as P0.7 specifies; the Aha 1 and not-ready lines are unchanged.

### View last save

```
POST /sessions · 201
{ "agent": "agent_tutor", "transport": { "type": "rtc", "channel": "studio-test-agent_tutor-1790424131", … "token": "••••" },
  "client_reference": "studio_test:agent_tutor:b7c2e1", "lifecycle": { "idle_timeout_ms": 30000 } }
{ "agent_session_id": "ses_t1", "status": "starting", "created_at": 1790424131 }

studio_tests · kept
{ "sessionId": "ses_t1", "agentId": "agent_tutor", "startedAtIso": "2026-09-26T14:02:11Z",
  "builderSessionId": "b7c2e1", "environment": "production" }
// in this browser until the account store ships

posthog · agent_test_started
{ "agentId": "agent_tutor", "builderSessionId": "b7c2e1", "trigger": "header", "configuredByUser": true,
  "preset": "custom", "deploymentType": "code", "transport": "rtc", "surface": "builder",
  "environment": "production", "trafficType": "external" }

posthog · agent_audio_heard
{ …, "turnCount": 1, "agentVersion": "2026-09-23T10:41:00.000Z", "wallMs": 2140, "activeMs": 2140, "serverAnchored": false }

posthog · agent_test_ended
{ …, "durationMs": 42000, "turnCount": 3, "reason": "toggle" }

POST /sessions/ses_t1/stop · 201
```

Entries in the order they happened. The dialog's title, door and close are P0.3's. The comment line is part of the code block, muted. In `tries=dropped` each analytics entry shows today's props and its `// dropped by the allowlist: …` line; in `tries=preview` the first event shows both readings; in `tries=no-gateway` the anchor comment and the note entry; in `tries=mismatch` the `GET /sessions · 200` entry; in `tries=no-consent` the single `posthog · nothing sent` entry.

## 5. Behaviour

- **Registry.** `start()` writes on the 201, before the join, with the build's environment; the write never blocks the join (a failed write logs `operation_failed {operation: studio_test_store, code}` and the session still runs; the data-quality check reads the gap). `readTests()` on every Overview render; a reload keeps it; `reset` clears it. Port: the account-level object once it exists, `localStorage` until then; a read failure treats the registry as empty (rainy f, honest).
- **Exclusion.** The tile, the chart and Recent sessions never render a registry id. The tile is the API's count in range minus the registry entries in range; the list drops rows by id when the list's key is the session id (decision 5) and otherwise drops nothing (.e). Tests never enter `stats` in the port: the aggregate reads production only once the registry is server side; until then Studio subtracts client side.
- **Door.** Shows when the agent has at least one registry entry; pressing it swaps the rows and the label; Esc or the label swaps back; leaving the tab resets it. No event of its own (P1.2 names the list's events).
- **Tag.** `SessionsTable` reads `isStudioTest(session.id, tests)` per row; the tag is decorative to the eye and named to the reader: the cell's text reads "You, test" in the accessibility tree (the `Badge` text is the word Test, no icon).
- **Idle line.** Rendered from P0.7's phase table, idle only.
- **Events.** `trackProto(name, props)` builds `{ ...base, ...props }` with `environment` from `createObservabilityConfig().environment`, `trafficType` and `userClassificationSource` from `normalizeObservabilityIdentity(fixtureUser, { environment, classifyNonProductionAsTest: true })`, `surface: "builder"`; sanitises with `sanitiseForReview(props, { extended: true })`; logs `[v3 event] name { sent, dropped }` once; appends the sent props to `lastSave` as `posthog · name`. Consent (`tries=no-consent`): `isEnabled()` false, nothing logged as sent, one `posthog · nothing sent` entry.
- **View last save.** Unchanged behaviour; the list is longer. Entries of kind `kept` and `sent` render their comment under the body.
- **Review states.** `tries=` never writes the store: `kept`, `tests` and `lost` seed the render only (the seeded session and entry vanish on `openAgent`); `preview`, `dropped`, `no-gateway`, `mismatch`, `no-consent` change the dialog's entries only; `idle` opens the panel idle.
- **Keyboard.** The (i) is a button in the tile as today; the door is one tab stop after the period toggle and before Open in session history; rows are not focusable (today's table). The dialog is P0.3's.
- **Screen reader.** The tile's (i) reads "About Sessions"; the door reads "Your tests, 1" and "Production sessions"; the tag reads "Test" after "You".
- **Events per action.** `test_panel_opened`, `builder_opened`, `agent_test_started`, `agent_audio_heard`, `agent_test_ended` (P0.7, props extended), `operation_failed {operation: studio_test_store}` (new, only on a failed write), `page_viewed`; each logs once through `trackProto`. `agent_created`, `agent_updated`, `channel_connected`, `session_ended` are server events and are not logged.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics. Never: call, conversation, chat, preview (in UI copy; `preview` appears only as a code value), demo, sandbox, trial, playground, dev, prod, live (for running), free (for tests), internal (as a label), flag, mode, environment (in UI copy), analytics event (in UI copy), prototype, simulated, mock, wireframe.

| Key | Text |
|---|---|
| Idle line, second sentence | Tests stay out of the agent's numbers. |
| Idle line, inbound (P0.7's second sentence kept) | Talk to the agent with your microphone. The number is not dialled. Tests stay out of the agent's numbers. |
| Sessions (i) | Production sessions in the period. Tests from Studio are left out. Their minutes still count in Usage. |
| Sessions (i) label (aria) | About Sessions |
| Door | Your tests ({n}) |
| Door, open | Production sessions |
| Tag | Test |
| Test row party | You |
| Test row outcome | Completed / Failed |
| Empty party cell | (empty) |
| Recent sessions title (unchanged) | Recent sessions |
| History link (unchanged) | Open in session history |
| Entry titles | POST /sessions · 201 / studio_tests · kept / posthog · {event} / posthog · nothing sent / GET /sessions · 200 / POST /sessions/{id}/stop · 201 |
| Kept comment | in this browser until the account store ships |
| Not sent comment | analytics is off for this browser (user_opt_out) |
| Dropped comment | dropped by the allowlist: {keys} / arrays never pass |
| Preview comment | preview traffic classified as external: classifyNonProductionAsTest is off / after the fix |
| No anchor comment | no server anchor (G1): the client claim stands alone |
| Fallback note | server events fall back to their operation_succeeded twins until the gateway emitter ships: agent_create, telephony_phone_number_bind, telephony_campaign_create; API-only and ephemeral journeys stay unmeasured |
| Mismatch comment | agent_id is 32 lowercase characters, not {agent id}: Studio joins tests by the session id it stored, never by this field; the tile subtracts the registry count; dropping a row waits on decision 5 |
| Token, password | "token": "••••" (P0.7) |

Comments are code, lower case after `//`, and the only place a code word (`classifyNonProductionAsTest`, `user_opt_out`, `agent_id`) is shown.

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (call, conversation, chat, preview, demo, sandbox, trial, playground, dev, prod, live, free, internal, flag, mode, environment, prototype, simulated, mock, wireframe, arrows, em dashes; code blocks and comments excluded). `git diff --stat` must touch nothing outside `src/prototypes/agent-builder-v3/`; a grep of the changed files must find no real key, no token in `localStorage`, and `client_reference` only in the session body and never in an analytics entry. P0.1 to P0.6, P0.9, P0.11 and P0.12 routes unchanged; P0.7's `start()` and idle line, P0.3's entry shape, P0.10's table cell touched only as declared; P0.8's Overview empty row untouched (its inbound string still says "call"; P0.8 owns it, fix there). Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 overview-production-count, 02 panel-idle-sentence, 03 test-live-count-unchanged, 04 ended-your-tests-door, 05 your-tests-tagged, 06 last-save-kept-and-sent, then rainy 07 b-preview-external, 08 c-dropped-keys, 09 d-no-anchor, 10 e-id-mismatch, 11 f-lost-counts-as-production, 12 g-no-consent-dialog, 13 g-no-consent-page, 14 draft-empty-row.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.13 · Try the agent without counting the tries` after P0.12's, child sections 1 JTBD, 2 Research (the 10 shots in `02-research.md` with their regions), 3 Flow (14 story frames), 4 Hero (Overview at step 5 with Your tests open, the tagged row and the tile at 2,910; the docked panel at step 2 with the idle sentence beside Overview; View last save at step 6 with the kept entry and the three sent entries), 5 Rationale with the three links. Owner ask of 26 Sep: add a child section **UI Explorations** with 3 to 5 native variations of the first hero screen (Overview with Your tests open: the tile strip with the (i), the title row with **Production sessions** and Open in session history, the one tagged row), each meticulously built from the kit on page 31:2 with variables bound, never detached, hero screens only, nothing interactive, grounded in Refero and tagged with its source per `explorations/brief.md` (Anam sessions `a263d783-d450-4ab8-8ab3-b6b84511e772`, `055b7668-9ff5-4fe2-b8fe-ff355321aa94`, `bbf62efd-f05e-476d-bca0-ccc7cb887e80` for tabs and a filter bar over a sessions table; Resend metrics `54391b2a-cc61-4b7e-84f9-c052b940bd27` for KPI numbers with tooltips; n8n insights `eba468af-e216-4772-a50d-9d30f96d12ad` for dark KPI cards over a breakdown table; Resend logs `380e1f12-51ed-44da-b049-6014aa7f77c2` and `cf561511-960a-4de5-8eb5-5772d669db1c`, Lovable logs `f9ee3054-455d-485f-bbc1-d1e3b7b7ea31` and Fingerprint `b1e45f34-9c4e-402e-9c72-6ee4d0304366` for the View last save variation; Stripe `131eb3a0-e045-4ef3-b3de-405ae061e0e2` and Enode `d0757985-1e97-4303-ac8b-86c0111b073f` for the cut made visible, a mode Sam can forget; the research shots `vapi-01` for a type facet, `retell-01` for a type column, `sentry-01` for the anti-pattern). Logos: none on the hero, since no vendor module is named on Overview; a PostHog mark may appear only in the View last save variation beside the `posthog ·` entries, tagged as a logo; lucide `Info`, `FlaskConical`, `Mic`, `CircleStop`, `ExternalLink` and the kit's gray tick are the only other glyphs. Load `figma:figma-use` first.
