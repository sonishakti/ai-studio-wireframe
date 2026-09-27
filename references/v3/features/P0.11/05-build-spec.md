# P0.11 Connect the team's software to the agent · Build spec

Track: **v3**. Pick: **direction 1, grow the Code row**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.10's commit; if P0.8's commit is absent at build time, the Deployment tab, the **Code** row (`AgentBuilderRow id="deployment"`), `sessionSnippet(agent, kind)`, the `dep=` states, `code_snippet_copied` and the three code lines are made here exactly as P0.8's spec and `00-data.md` name them, and P0.8 takes them over; if P0.7's is absent, `lastTestHeard` is made here as P0.8's `00-data.md` names it; if P0.3's is absent, `SESSION_LIFECYCLE_DEFAULTS` and `apiLifecycle` are made here as P0.3's names them; if P0.9's is absent, `PROJECT_NUMBERS` gains its `num_…` ids here. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.11): copy a filled session snippet and see the first session from your software`.

Scope rule: P0.11 only, the code branch of the Deployment tab in concept A: `SdkCode` (`parts/deploy.tsx`; it may move to a new `parts/code.tsx` when it grows), the code branch of `DeployArea`, and their data. Touches outside it, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.10 are in review): P0.8's `sessionSnippet` gains a third argument and the `ephemeral` kind; P0.8's `code_snippet_copied` gains `language` and `kind`; P0.8's Overview empty row (`parts/performance.tsx`) reads the 24 h line on a code agent with a copied snippet (.d) until P1.8's strip ships; `Session` gains three optional fields; P0.3's Advanced session door **Set them in the code snippet** keeps its target (`tab=deploy&section=deployment`), now a fuller row. `GoLiveNumberSheet`, `InboundNumbers`, `NewRunSheet`, `RunsTable`, `RunSheet`, Readiness and Retention are untouched. Concepts B to E keep compiling: `SdkCode` keeps `{ agent }` and gains optional props with defaults; `DeployArea` keeps its props.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=agent_assist&tab=deploy`, written below as `…`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…` | The Shopping assistant (code, Draft) on **Deployment** (P0.8): Readiness two gray ticks ("Heard in a test at 14:01, after the last change.", "System prompt written."), Retention on 30 days; the **Code** row: tabs **In your app** (active) · **By phone** · **Without a saved agent**; the facts strip **App ID** `4c1e…5d6e` with the copy icon, **RESTful API key** "Customer ID and secret, server side only." with **Open API keys**, **RTC token** "Your server mints one for the agent's uid and one for the person. Clients join with the App ID and their token, never with the RESTful API key." with **How tokens work**; the code box titled `POST /sessions` with the toggle **curl** (on) · **Node.js** and the copy icon; the curl body with the App ID in the URL, `-u "$CUSTOMER_ID:$CUSTOMER_SECRET" # server side only`, `"agent_id": "agent_assist"`, the rtc transport with `"token": "AGENT_RTC_TOKEN"`, `lifecycle`; the line "Copy the snippet into your software. The first session it starts is Go live."; the header **Test**, **Go live** (filled), the menu | Sam opens Deployment and reads the snippet with the App ID filled in |
| 2 | `…&snippet=phone&lang=node` | **By phone** active, **Node.js** on: the facts strip without the RTC token item; the body a `fetch` to the same URL with `Authorization: "Basic " + Buffer.from(process.env.CUSTOMER_ID + ":" + process.env.CUSTOMER_SECRET).toString("base64") // server side only`, the telephony transport `from: "num_0142"`, `to: "+12065550134"`, the same `lifecycle` | Sam picks By phone and Node.js and the body rewrites itself |
| 3 | `…&code=copied` | Toast "Snippet copied. The first session your software starts is Go live." (P0.8); the line under the snippet "Copied at 14:02. Waiting for the first session from your software." with the link **Nothing arrived?** at the right; the snippet unchanged; the header unchanged | Sam copies the snippet and runs it from the team's server |
| 4 | `…&code=first` | The line with the gray tick "First session from your software at 14:09." and the (i); toast "First session started. Your software reached the agent."; the header badge **Live**, the header's Go live gone; Readiness unchanged (code has two items, P0.8) | Sam sees the tab confirm the first session |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b 401 | `…&code=failed-401` | Under the snippet, `Alert variant="destructive"`: "Your software's request failed at 14:05 (401 InvalidPermission). The RESTful API key was not accepted." with **Open API keys** | Opens `/restful-api` in a new tab. **G1:** not readable in production until the gateway emitter ships; the built state is reached by URL, and production shows .h |
| .b 403 | `…&code=failed-403` | The alert "Your software's request failed at 14:05 (403 ServiceNotEnabled). Conversational AI is not enabled on this project." with **Open the project** | Opens `/projects` in a new tab. A 403 `AccountSuspended` shows P0.8's banner instead (`…&dep=suspended`), no second alert |
| .b 422 | `…&code=failed-422` | The alert "Your software's request failed at 14:05 (422 InvalidFieldValue). transport.subscribe_uids: must hold exactly one uid." with **Copy the snippet again** | Copies the current snippet, fires `code_snippet_copied {repeat: true}`, the alert stays until the next poll |
| .c | `…&code=idle` | The line "First session from your software at 14:05 stopped within a minute, so nobody joined the RTC channel before the agent left at the idle timeout."; under it the `Field` **RTC channel** with the `Input` (placeholder "The channel your client joins") and **Check** | Sam types the name the client joins and presses Check |
| .c found | `…&code=idle-found` | The field reading `room-42`; the result line "One session in room-42, started at 14:05, stopped. Join the same channel from the client before the agent leaves, or raise idle_timeout_ms in the snippet." | Sam fixes the client and runs again; the next session ticks the line |
| .c none | `…&code=idle-none` | The field reading `Room-42`; the result line "No session in Room-42 in the last two hours. The channel your client joins must match transport.channel exactly, including case." | Sam corrects the name in the client or the snippet |
| .d row | `…&code=stale` | The line "Copied yesterday at 14:02. No session from your software in 25 h." and, already open, "A failed request never reaches Studio, so the reason is in your software's response. The three common ones:" then the three rows (401, 403, 422) each with its fix | Sam reads the response in the terminal, fixes, runs again |
| .d overview | `/v3?concept=a&view=agent&agent=agent_assist&tab=overview&code=stale` | P0.8's empty row on Overview reading "No session from your software since the snippet was copied yesterday." with **Open the snippet** | Opens `tab=deploy&section=deployment`; P1.8's strip takes this over when it ships |
| .e | `/v3?concept=a&view=agent&agent=agent_tutor&tab=deploy` | The In-app tutor (code, Live): the tick line "First session from your software on Sep 18, 11:52." with the (i) reading "Counts as production, your own sessions included, until the API has a purpose field."; the snippet carries no tag and no client_reference | Nothing to fix; the note is the honest state |
| .f | `…&snippet=ephemeral` | The third tab **Without a saved agent**: the code box titled `POST /sessions/ephemeral`, the body with `"agent": { "instructions": …, "greeting": …, "pipeline": … }` in place of `agent_id`, the rtc transport, `lifecycle`; the line "Account level only. The agent is sent inline with each request, and its sessions are listed but never counted for this agent."; the facts strip as In your app | The copy fires `code_snippet_copied {kind: ephemeral}` and never `go_live_clicked`; the line under it never changes state |
| .g | `…` (always) and `…&lang=node` | The auth line `# server side only` (curl) or `// server side only` (Node.js); the key fact "Customer ID and secret, server side only."; the RTC token note with **How tokens work** | Opens the token docs in a new tab. `…&code=testing` shows the other note: "This project is in testing mode, so no RTC token is needed. Switch to secured mode before the agent is open to people." with **Project settings** |
| .h | `…&code=errors` | The waiting line at 14:02, **Nothing arrived?** pressed: "A failed request never reaches Studio, so the reason is in your software's response. The three common ones:" then `401 · The RESTful API key was not accepted. Check the Customer ID and secret on the server.` **Open API keys**; `403 · The project cannot start sessions: Conversational AI is off, or the account is suspended.` **Open the project**; `422 · A field in the body was refused. Copy the snippet again unchanged and compare it with what you sent.` **Copy the snippet** | Each fix is one door; the list closes with **Hide** |
| .h no key | `…&code=no-key` | The key fact reads "No RESTful API key yet. Create one to run the snippet." with **Create a key**; everything else as step 1 | Opens `/restful-api` in a new tab; the next Deployment open re-reads the count |

New search keys, validated in `store.tsx`: `code` (`copied` \| `waiting` \| `first` \| `failed-401` \| `failed-403` \| `failed-422` \| `idle` \| `idle-found` \| `idle-none` \| `stale` \| `errors` \| `no-key` \| `testing`, review only, never written to the store); `snippet` (`rtc` \| `phone` \| `ephemeral`, the transport tab, written by the tabs so a link opens on the right one); `lang` (`curl` \| `node`, the language toggle, written by the toggle). `openAgent` and `toList` clear all three; `openPanel(undefined)` leaves them (as P0.8's `dep`). P0.8's `dep=`, P0.7's `test=` and P0.3's `panel=new-run` keep their meaning.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `SnippetKind` (P0.8's kind plus `ephemeral`), `SnippetLanguage`, `CodeFailure`, `FirstSessionOutcome`, `CodeDeployment`, `Project`, `ChannelCheck`, `CommonError`; `ProtoAgent.codeDeployment`; `Session.channel`, `transport`, `source`; `PROJECT`.
- `sessionSnippet(agent, kind, language)` grown; `agentInputFrom(agent)`; `snippetFacts(kind)`; `codeLine(agent, nowIso)`; `COMMON_ERRORS`; `checkRtcChannel(channel, sessions)`; `isOwnTest(row, tests)`; `firstSoftwareSession(rows, tests)`.
- Seeds per `00-data.md` item 12: new `agent_assist`; `agent_tutor` gains `codeDeployment` and session fields; nothing else changes.
- The copy writes `codeDeployment.copiedAt`, `kind` and `language` (design mode: the store; port: `sessionStorage` `ng.v3-concepts.code:<agentId>`). The watch reads `GET /sessions?status=idle,starting,running,stopping,stopped,failed&started_after=<copiedAtIso>` every 10 s while the Deployment tab is open, for 30 min after the copy, then once per Deployment open; the first row that is not an own test writes `firstSessionAt` and `firstSessionOutcome` and sets `status: "live"`. A row seen `running` then `stopped` within 60 s of `start_ts` writes `stopped_early`. The check sends `GET /sessions?channel=<name>&status=…&started_after=<copiedAtIso or now minus 2 h>`. P0.3's View last save lists each call.
- `parts/events.ts` gains `first_session_detected`, `go_live_error_shown`, `rtc_channel_checked`; `code_snippet_copied` gains `language`, `kind`, `repeat`; `cta_viewed` gains `nothing_arrived`, `create_key`; `external_link_opened` gains `restful_api_keys`, `token_docs`, `project_settings`. `channel_connected {code}` and `session_create_failed` are server events and are not logged.
- Tests as listed in `00-data.md` item 15.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Row | `AgentBuilderRow id="deployment" label="Code"` (P0.8) | `src/components/console/agent-builder/agent-builder-row.tsx` |
| Transport tabs | `Tabs`, `TabsList`, `TabsTrigger className="h-8"` text-only, three triggers (P0.8's two plus one) | `parts/deploy.tsx` `SdkCode`, `src/components/ui/tabs.tsx` |
| Facts strip | `<dl className="grid gap-x-6 gap-y-3 @xl:grid-cols-3">` with `<dt className="text-xs text-muted-foreground">` and `<dd className="console-type-body">` (P0.10's run panel `<dl>`) | `parts/deploy.tsx` `RunSheet` (sibling) |
| App ID copy | `Button size="icon" variant="ghost" aria-label="Copy App ID"` with lucide `Copy`, toast "App ID copied" (the projects table's control) | `src/components/console/projects/projects-table.tsx` (sibling), `src/components/ui/button.tsx` |
| Fact links | `Button variant="link" size="sm" className="h-auto px-0"` (P0.8's fix link) | `button.tsx` |
| Code box | `CodeBlock language="bash" \| "typescript" withCopy title="POST /sessions" actions={<language toggle>}` | `src/components/ui/code-block.tsx` |
| Language toggle | `ToggleGroup type="single"` with two `ToggleGroupItem size="sm"` (curl, Node.js) in the code box `actions` slot | `src/components/ui/toggle-group.tsx` |
| State line | `<p className="flex items-center gap-x-3 console-type-body text-muted-foreground">` with `Tick` on `AgentBuilderTickGlyph` when ticked (P0.8's Readiness item) and the link at the right | `parts/common.tsx`, `src/components/console/agent-builder/agent-builder-tick.tsx` |
| Provisional (i) | `InfoTip` | `parts/common.tsx` |
| Nothing arrived list | `<ul className="grid gap-2">` of `<li className="flex flex-wrap items-center gap-x-3 gap-y-1">` with the code `tabular-nums`, the sentence, the fix link (P0.8's Readiness list); one line above it; **Hide** as a link | P0.8's `parts/readiness.tsx` (sibling) |
| Failed request | `Alert variant="destructive"` + `AlertDescription` + one `Button variant="outline" size="sm"` (P0.1, P0.7) | `src/components/ui/alert.tsx`, `button.tsx` |
| RTC channel check | `Field` + `FieldLabel` + `Input className="h-8 w-64"` + `Button variant="outline" size="sm"` Check on one row (P0.6's key row shape); the result as `FieldDescription` | `src/components/ui/field.tsx`, `input.tsx`, `parts/model.tsx` `SecretKeyField` (sibling) |
| Toasts | `sonner` | `src/components/ui/sonner.tsx` |
| Overview line (.d) | P0.8's `EmptyRow` on Overview with the text and one `Button variant="outline" size="sm"` | `parts/common.tsx`, `parts/performance.tsx` |
| Last save | P0.3's View last save `CodeBlock` dialog | `code-block.tsx` |

No new token, component, radius or font size. No stepper, no numbered blocks, no badge on the snippet, no green, no red outside the failed-request alert, no spinner on the waiting line, no second copy button, no logo on the language toggle.

## 4. The row, piece by piece

### The tabs and the facts strip

```
Code   In your app   By phone   Without a saved agent
       App ID                 RESTful API key                     RTC token
       4c1e…5d6e  [copy]      Customer ID and secret,             Your server mints one for the agent's uid and
                              server side only. Open API keys     one for the person. Clients join with the App ID
                                                                  and their token, never with the RESTful API key.
                                                                  How tokens work
```

The App ID shows its first four and last four characters with the copy icon; the copy puts the whole id on the clipboard. The key fact reads the account's key count: one or more, the sentence and **Open API keys**; none, "No RESTful API key yet. Create one to run the snippet." and **Create a key** (both `/restful-api`, new tab). The RTC token fact renders on **In your app** and **Without a saved agent** only, per the project's auth mode; **By phone** shows two facts. Below `@xl` the three stack.

### The code box

Title `POST /sessions` (or `POST /sessions/ephemeral`), the language toggle and the copy icon in the header. Body from `sessionSnippet(agent, kind, language)`. The toggle rewrites the body in place; the transport tab swaps the transport block; both keep the scroll. The copy is the code Go live (P0.8): `code_snippet_copied {transport, language, kind}`, `go_live_clicked {deploymentType: code, hasNumber: false, testHeard}` (not for `ephemeral`), the toast, and `codeDeployment.copiedAt` written.

### The state line

| State | Line | At the right |
|---|---|---|
| draft | Copy the snippet into your software. The first session it starts is Go live. (P0.8) | |
| waiting | Copied at {time}. Waiting for the first session from your software. | **Nothing arrived?** |
| stale (24 h) | Copied {date}, {time}. No session from your software in {n} h. | the list, already open |
| first (tick) | First session from your software at {time}. / on {date}, {time}. | (i) |
| idle | First session from your software at {time} stopped within a minute, so nobody joined the RTC channel before the agent left at the idle timeout. | the check field below |
| failed (G1) | the `Alert` with the code, the reason, the sentence and one button | |

On `ephemeral` the line is the account-level sentence and never changes. The line renders from `codeLine(agent, now)` on every render.

### Nothing arrived? (.h)

A link on the waiting line. Pressed: one sentence, then the three rows from `COMMON_ERRORS`, then **Hide**. `cta_viewed {cta: nothing_arrived}` once per open. Fixes: **Open API keys** (`/restful-api`), **Open the project** (`/projects`), **Copy the snippet** (the same copy as the icon, `repeat: true`). From 24 h after the copy the list is open on arrival and **Hide** closes it for the session.

### The RTC channel check (.c)

Shown only in the `idle` state. **Check** sends the query (design mode: `checkRtcChannel`), fires `rtc_channel_checked {found}`, and writes the result line under the field: found, "One session in {channel}, started at {time}, {status}. Join the same channel from the client before the agent leaves, or raise idle_timeout_ms in the snippet."; none, "No session in {channel} in the last two hours. The channel your client joins must match transport.channel exactly, including case." An empty field keeps Check off. The field is never shown outside `idle`.

### The Overview line (.d)

P0.8's empty row on Overview, on a code agent whose `codeDeployment.copiedAt` is 24 h old or more with no first session: "No session from your software since the snippet was copied {date}." with **Open the snippet** (`nav.go({ tab: "deploy", section: "deployment" })`). Otherwise the row is P0.8's.

## 5. Behaviour

- **Open.** The Code row renders for a code agent inside P0.8's tab; `snippet=` picks the tab (default `rtc`), `lang=` the language (default `curl`); both are written by the controls so a link opens on the same view. The row fires nothing of its own on open (P0.8's `readiness_opened` covers the tab).
- **Copy.** As P0.8, plus: writes `codeDeployment { copiedAt, copiedAtIso, kind, language }`, starts the watch, and moves the line to `waiting`. On `ephemeral` it writes nothing and fires only `code_snippet_copied {kind: ephemeral}`.
- **Watch.** While the Deployment tab is open and `copiedAt` is under 30 min old, poll every 10 s; afterwards once per Deployment open and once on window focus. Own tests are excluded by `isOwnTest`. The first other row: `firstSessionAt`, `firstSessionOutcome`, `status: "live"`, the toast, `first_session_detected {transport, minutesSinceCopy, kind}`. A row that goes `running` then `stopped` within 60 s of `start_ts` sets `stopped_early` and the `idle` state; a later normal session moves it to `first`. Design mode: `code=` sets the outcome; a clean `code=copied` shows the first session at 7 s (a fixture timer) so a reviewer sees the toast land.
- **Failed (G1).** `failure` is never written by the watch in production; the alert renders when `codeDeployment.failure` is set (review states). The alert fires `go_live_error_shown {errorCode, reason}` once per mount. Open question 2 asks whether a `failed` row within a minute of `start_ts` may show its `message` in this alert until the emitter ships.
- **Header.** `status: "live"` on the first session removes the header's Go live (P0.8's rule for a live code agent). Nothing else in the header changes.
- **Links.** **Open API keys** and **Create a key** open `/restful-api` in a new tab, `external_link_opened {surface: restful_api_keys}`; **How tokens work** opens the RTC token docs in a new tab, `{surface: token_docs}`; **Project settings** and **Open the project** open `/projects` in a new tab, `{surface: project_settings}`. **Create a key** fires `cta_viewed {cta: create_key}` once per show.
- **Review states.** `code=` never writes the store: each renders `agent_assist` with the `codeDeployment` from `00-data.md` item 13; `copied` and `first` fire their toast once on mount; `stale` opens the list; `no-key` and `testing` change `PROJECT` for the render only.
- **Keyboard.** Tab order in the row: the three transport tabs (one tab stop, arrows), the App ID copy, the key link, the token link, the language toggle (one stop, arrows), the code box copy, then the line's link or the alert's button, then the check field and Check. `section=deployment` moves focus to the first tab.
- **Events per action.** `code_snippet_copied`, `go_live_clicked` (P0.8), `first_session_detected`, `go_live_error_shown`, `rtc_channel_checked`, `cta_viewed`, `external_link_opened`, `agent_updated` (never: nothing here saves the agent); each logs once through `trackProto`.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, no code words in prose. Never: SDK, embed, widget, iframe, web SDK, app (alone), connect, connection, publish, deploy (verb), launch, activate, call (outside API names), channel (alone; RTC channel only), token (alone; RTC token only), API key (alone; RESTful API key only), credential, live (for running), preview, prototype, dev (in UI), prod.

| Key | Text |
|---|---|
| Row label | Code |
| Snippet tabs | In your app / By phone / Without a saved agent |
| Fact labels | App ID / RESTful API key / RTC token |
| App ID copy | Copy App ID (aria) / App ID copied (toast) |
| Key fact | Customer ID and secret, server side only. |
| Key link | Open API keys |
| Key fact, none | No RESTful API key yet. Create one to run the snippet. |
| Key link, none | Create a key |
| RTC token fact, secured | Your server mints one for the agent's uid and one for the person. Clients join with the App ID and their token, never with the RESTful API key. |
| RTC token fact, testing | This project is in testing mode, so no RTC token is needed. Switch to secured mode before the agent is open to people. |
| RTC token links | How tokens work / Project settings |
| Code box title | POST /sessions / POST /sessions/ephemeral |
| Language toggle | curl / Node.js |
| Auth comment | # server side only (curl) / // server side only (Node.js) |
| Line, draft | Copy the snippet into your software. The first session it starts is Go live. |
| Line, waiting | Copied at {time}. Waiting for the first session from your software. |
| Line, stale | Copied {date}, {time}. No session from your software in {n} h. |
| Line, first | First session from your software at {time}. / First session from your software on {date}, {time}. |
| Provisional (i) | Counts as production, your own sessions included, until the API has a purpose field. |
| Line, idle | First session from your software at {time} stopped within a minute, so nobody joined the RTC channel before the agent left at the idle timeout. |
| Line, ephemeral | Account level only. The agent is sent inline with each request, and its sessions are listed but never counted for this agent. |
| Nothing arrived link | Nothing arrived? |
| Nothing arrived line | A failed request never reaches Studio, so the reason is in your software's response. The three common ones: |
| 401 row | 401 · The RESTful API key was not accepted. Check the Customer ID and secret on the server. |
| 403 row | 403 · The project cannot start sessions: Conversational AI is off, or the account is suspended. |
| 422 row | 422 · A field in the body was refused. Copy the snippet again unchanged and compare it with what you sent. |
| Row fixes | Open API keys / Open the project / Copy the snippet |
| Hide | Hide |
| Failed alert (G1) | Your software's request failed at {time} ({code} {reason}). {sentence} |
| Failed 401 sentence | The RESTful API key was not accepted. |
| Failed 403 sentence | Conversational AI is not enabled on this project. |
| Failed 422 sentence | {field}: {detail} |
| Failed actions | Open API keys / Open the project / Copy the snippet again |
| Check label | RTC channel |
| Check placeholder | The channel your client joins |
| Check button | Check |
| Check, found | One session in {channel}, started at {time}, {status}. Join the same channel from the client before the agent leaves, or raise idle_timeout_ms in the snippet. |
| Check, none | No session in {channel} in the last two hours. The channel your client joins must match transport.channel exactly, including case. |
| Snippet toast (P0.8) | Snippet copied. The first session your software starts is Go live. |
| First session toast | First session started. Your software reached the agent. |
| Overview line (.d) | No session from your software since the snippet was copied {date}. |
| Overview action | Open the snippet |
| Last save entries | GET /sessions · 200 / GET /sessions?channel= · 200 |

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (SDK, embed, widget, connect, connection, publish, deploy, launch, activate, call, credential, dev, prod, preview, prototype, simulated, mock, wireframe, arrows, em dashes; "channel" only as "RTC channel" or inside code; "token" only as "RTC token" or inside code; "API key" only as "RESTful API key"). A grep of the changed files must find no real key, no `client_reference`, and no tag written into any snippet. P0.1 to P0.7, P0.9 and P0.10 routes unchanged; P0.8's `sessionSnippet`, `code_snippet_copied` and Overview empty row touched only as declared. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 code-row-filled, 02 by-phone-node, 03 copied-waiting, 04 first-session, then rainy 05 b-failed-401, 06 b-failed-403, 07 b-failed-422, 08 c-idle-check, 09 c-idle-found, 10 c-idle-none, 11 d-stale-row, 12 d-stale-overview, 13 e-provisional-tutor, 14 f-ephemeral, 15 g-testing-mode, 16 h-nothing-arrived, 17 h-no-key.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.11 · Connect the team's software to the agent` after P0.10's, child sections 1 JTBD, 2 Research (the 13 shots in `02-research.md` with their regions), 3 Flow (17 story frames), 4 Hero (the Code row at step 1 with the facts strip, the toggle and the filled curl body; the row at step 4 with the tick line and the toast; the idle state with the RTC channel check answered, .c found), 5 Rationale with the three links. Owner ask of 26 Sep: add a child section **UI Explorations** with 3 to 5 native variations of the hero screen (the Code row at step 4: the three facts, the transport tabs, the code box with the curl body and the language toggle, the tick line "First session from your software at 14:09." with its (i)), each meticulously built from the kit on page 31:2 with variables bound, never detached, hero screens only, nothing interactive, grounded in Refero and tagged with its source per `explorations/brief.md` (Resend `f4520259-91e7-491f-b818-f3eb587ea553` and `a3dcdd3e-3033-4c25-8beb-1fefe00d439d` for key-then-code with tabs in the box header; Gladia `732d6811-4e23-497d-97b8-59776850d9e7` for a dark console with the code centre and the settings on the right; TwelveLabs `fa79eeed-93fb-4e11-934f-eda8d2a5dd6d` for a key card above two code cards; Hume `2637a519-a1bf-4218-914f-234c1ad199bb` and Enode `bec2cb25-c7b5-4c57-bd66-c2c4fec8431b` for masked credential rows with copy; Cohere `4c260c58-e6c2-45b4-8de2-0fb6afde4893` for keys by purpose; Anthropic `66b461a6-76cd-49f2-a4dd-eb32b7071a74` for a dark keys card; Meiro `b2b2df2d-cdd2-4dfa-b471-024afef6af59` for a dark embed-code section; Mailchimp `17947f86-248c-4343-9791-32e031987e5c` and Anam `005b4da1-51a6-40de-aafa-e1275b14e028` for the no-key empty state). Logos: the curl and Node.js marks may appear on the language toggle in one variation only, tagged as logos; no vendor module is named on the rtc curl hero, so no Deepgram, OpenAI or Cartesia logo, except in a variation that shows the ephemeral tab where the inline pipeline names them. Load `figma:figma-use` first.
