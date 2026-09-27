# P0.8 Confirm the agent is ready · Build spec

Track: **v3**. Pick: **direction 1, three rows before the door**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.7's commit; if P0.7's commit is absent at build time, the test door from Readiness opens the panel as P0.3's `setTestOpen(true)` does and the heard-test fact is written from the panel's existing `agent_audio_heard` hook, and P0.7 takes over `openTest` and the stored `{ at, agentVersion }`; if P0.4's commit is absent, `updatedAtIso` is added here as its `00-data.md` names it. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.8): read what the agent still needs, pick retention and go live in one area`.

Scope rule: P0.8 only, the third tab of concept A (`tab=deploy` in `AgentA`, `concepts/a-tabs.tsx`) and `DeployArea`, `InboundNumbers`, `ConnectNumberSheet`, `SdkCode` and `useDeployActions` in `parts/deploy.tsx` (a new `parts/readiness.tsx` holds the Readiness and Retention rows), its data, and the header's primary action. `NewRunSheet`, `RunsTable` and `RunSheet` are P0.10's and keep their internals; this row uses New run as the batch Go live and changes only its refusal state. Touches outside the area, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.7 are in review): P0.1's third tab is renamed Deployment for every type and rendered for an untyped agent too, and its header primary becomes Go live on a draft agent; P0.2 to P0.6's six "saved" toasts call one helper so a live agent's save carries the deployment line (.h); P0.7's `openTest` gains the triggers `readiness` and `save_line`, and its stored tested flag grows to `{ at, agentVersion }`; the Overview tab's empty row (`parts/performance.tsx`) reads Go live and opens the Deployment tab. Concepts B to E keep compiling: `DeployArea` keeps `{ agent, update, runId, onRunChange, headerHasPrimary }` and gains optional props with defaults; `useDeployActions` keeps `{ sheets, openPrimary }`; `ConnectNumberSheet` is renamed `GoLiveNumberSheet` with the old name kept as an alias for one commit.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=<id>&tab=deploy`, written below as `…&agent=<id>`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…&agent=agent_clinic` | The Clinic reception agent (inbound, Draft) on the **Deployment** tab, third after Overview and Agent; the header reads **Test**, **Go live** (filled) and the menu. Three rows: **Readiness** with the amber triangle "Not heard in a test yet." and the link **Test**, the gray tick "System prompt written.", and the plain line "A number is picked at Go live. 5 in the project."; **Retention** with 30 days selected and Zero retention disabled, its reason under it; **Numbers** as one line "No number answers with this agent yet." and **Go live** | Sam opens Deployment and reads what is still missing |
| 2 | `…&agent=agent_clinic&test=live` | The test panel docked on the right (P0.7): "Aria · 0:07", the greeting *"Hi, this is Aria at Northside Clinic. How can I help?"*, Listening, **End test**; behind it the Deployment tab unchanged | Sam presses Test in Readiness and hears the agent on this version |
| 3 | `…&agent=agent_clinic&dep=ready` | Readiness's first item now carries the gray tick, "Heard in a test at 14:02, after the last change."; the prompt ticked; the number line unchanged; Retention on 30 days | Sam sees the test ticked and keeps 30 days |
| 4 | `…&agent=agent_clinic&dep=ready&panel=go-live` | The sheet **Go live** (compact): A number in this project selected, the Number select reading `+1 628 555 0110 · Spare` with the other numbers behind it (one reads `· Answers with Front desk`); footer **Cancel** · **Go live** on | Sam presses Go live and picks the spare number |
| 5 | `…&agent=agent_clinic&dep=live` | Toast "Live. +1 628 555 0110 answers with this agent."; the header badge **Live**, the header's Go live gone; **Numbers** lists `+1 628 555 0110 · Spare` with **Remove** and the footer **Add another number**; Readiness reads three ticks, the third "+1 628 555 0110 answers with this agent." | Sam goes live and the number answers with the agent |
| 6 | `…&agent=agent_tutor&dep=zero-retention&section=retention` | The In-app tutor (code, Live): **Retention** with **Zero retention** selected and the line "The snippet sends it with every session."; below, **Code** with the snippet whose body now carries `"data_policy": { "retention": "none" }`; toast "Retention saved." | Sam picks Zero retention on the code agent and the snippet carries it |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b | `…&agent=agent_payments&dep=no-test` | Payment reminders (batch, Live): Readiness's first item is the amber triangle "Not heard in a test since the last change, Sep 24, 16:30." with **Test**; the prompt and the list ticked; the runs table below; the header **New run** on | Test opens the panel; a heard answer ticks the item with its time. New run stays on; `go_live_clicked {testHeard: false}` if Sam starts one anyway |
| .c number | `…&agent=agent_clinic&dep=no-number` | Readiness's third item is the amber triangle "No number in the project yet." with **Add a number**; Numbers still one line and **Go live** on | Both doors open the same sheet on the SIP trunk form |
| .c sheet | `…&agent=agent_clinic&dep=no-number&panel=go-live` | The sheet **Go live** with no source choice: one line "The project has no numbers yet. Add one from your SIP trunk.", then Phone number, SIP host, SIP protocol (TLS), Username, Password; **Go live** off until the number and the host are filled | Go live adds the number to the project and points it at the agent in one save (`POST /numbers` with `inbound.agent`); P0.9 grows the form and links the carrier docs |
| .c list | `…&agent=agent_survey` | Renewal survey (batch, Draft): Readiness reads the triangle "Not heard in a test yet." with Test, the prompt ticked, and the plain line "A contact list is uploaded in New run."; Retention with the batch reason; **Runs** as one line "No runs yet. A run dials one contact list with this agent." and **Go live** | Go live opens New run (`panel=new-run`, P0.3's key) at Contact list; the list is uploaded there (P0.10) |
| .d inbound | `…&agent=agent_clinic&section=retention` | Retention scrolled to the top: 30 days selected; Zero retention disabled with "The API has no retention setting on a number yet, so inbound sessions are kept for 30 days." under it | Nothing to pick; the API decision is open (requirement 46) |
| .d batch | `…&agent=agent_survey&section=retention` | The same with "The API has no retention setting on a run yet, so run sessions are kept for 30 days." | Same |
| .e inbound | `…&agent=agent_frontdesk` | Front desk (inbound, Live): Readiness three ticks ("Heard in a test at Sep 19, 15:10, after the last change.", "System prompt written.", "+1 415 555 0142 answers with this agent."); Retention; **Numbers** with `+1 415 555 0142 · Support line`, **Remove**, footer **Add another number**; the header carries Test and the menu, no primary | Nothing to fix; Add another number opens the Go live sheet again |
| .e batch | `…&agent=agent_payments` | Readiness three ticks (the third "overdue-sep-week5.csv · 600 contacts, from Run 3."); Retention; **Runs** with the table as today; the header **New run** | Nothing to fix |
| .e code | `…&agent=agent_tutor` | Readiness two ticks; Retention on 30 days, writable; **Code** with the snippet tabs In your app and By phone, the line "First session from your software on Sep 18." under it, and **API keys** | Nothing to fix; the copy icon on the snippet is the code Go live |
| .f | `…&agent=agent_api_untyped` | The Deployment tab holds P0.1.c's `Alert` in place of the rows: "This agent was made through the API and has no deployment type. Number +1 415 555 0199 points at it, so inbound fits." with **Use inbound** and **Pick another**; the header has no primary | Use inbound writes the label; the three rows render at once with the number already ticked |
| .g tab | `…&agent=agent_clinic&dep=suspended` | The minutes banner at the top of the tab: `Alert` (warning tint) "The account is suspended, so new sessions are refused and production agents are silent. Add a card to reactivate it." with **Add card**; the three rows under it; Go live on | Add card opens `/billing` in a new tab; pointing a number is accepted and callers hear nothing until reactivation |
| .g run | `…&agent=agent_survey&dep=suspended-run&panel=new-run` | New run open with a list and a number chosen, Start run pressed: `Alert` "The account is suspended, so the run was not started. Add a card to reactivate it." above the footer with **Add card**; the sheet keeps its values | Add card as above; Start run works again once reactivated (P1.7.d) |
| .h inbound | `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=agent&section=prompt&dep=saved-live` | The prompt row just saved on the live agent: toast "Prompt saved." with the line "+1 415 555 0142 answers with this agent, so the change reaches callers on their next session." and the action **Test** | Test opens the panel; on Deployment, Readiness's test item is open again (`…&agent=agent_frontdesk&dep=no-test` shows it) until a test is heard on the new version |
| .h batch | `/v3?concept=a&view=agent&agent=agent_payments&tab=agent&section=prompt&dep=saved-live` | The same toast with "Run 3 dials with this agent, so the change reaches its next session." | Same |
| prompt gap | `…&agent=agent_draft` | The new agent from P0.1 (no prompt): Readiness reads two triangles, "Not heard in a test yet." with Test and "No system prompt. The agent answers from the model alone." with **Write the prompt**, then the pending third line; Go live on | Write the prompt opens the Agent tab at System prompt (`tab=agent&section=prompt`) |

New search keys, validated in `store.tsx`: `panel` gains `go-live` (the inbound Go live sheet, URL-held; replaces the local `connectOpen`); `dep` (`ready` \| `live` \| `no-test` \| `no-number` \| `suspended` \| `suspended-run` \| `saved-live` \| `zero-retention`, review only, never written to the store). `section` on the Deployment tab takes `readiness`, `retention` and `deployment` (the type row's id) and scrolls as it does on the Agent tab. `openAgent` and `toList` clear `dep`; `openPanel(undefined)` leaves it (as P0.7's `test`). P0.3's `panel=new-run` and P0.7's `test=` keep their meaning.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `Retention`, `ReadinessItem`, `ReadinessCode`, `ProjectNumber`, `LastTestHeard`; `ProtoAgent.lastTestHeard`, `labels.studio_data_policy`.
- `readReadiness(agent, numbers)`, `readinessCodes(items)`, `readinessAllGo(items)`, `retentionFor(agent)`, `deploymentLine(agent)`, `sessionSnippet(agent, kind)` (moved out of `SdkCode`; key `agent_id`, `lifecycle` from `SESSION_LIFECYCLE_DEFAULTS`, `data_policy` only when `none`).
- `PROJECT_NUMBERS` gains ids; the review state `dep=no-number` and `account=empty` render an empty list.
- Seeds per `00-data.md` item 10: new `agent_clinic`; `lastTestHeard` on `agent_frontdesk`, `agent_payments`, `agent_tutor`; nothing else changes. `agent_tutor` gains two sessions from software if it has none, so the code line has a date.
- Go live (inbound) writes `PATCH /numbers/{id} { inbound: { agent: <agent_id> } }` (design mode: adds the number to `agent.numbers`, removes it from the other agent's, sets `status: "live"`); the SIP form writes `POST /numbers { number, sip_trunk, inbound: { agent } }`. Remove writes `PATCH /numbers/{id} { inbound: null }` and sets `status: "draft"` when no number is left. Retention on code writes `PATCH /agents/{id} { labels: { studio_data_policy } }`. P0.3's View last save lists each call.
- `parts/events.ts` gains `readiness_opened`, `go_live_clicked`, `go_live_blocked`, `data_policy_selected`, `code_snippet_copied`, and `cta_viewed` where P0.7 has not added it. `channel_connected` is a server event and is not logged; its Console fallback `operation_succeeded {operation: telephony_phone_number_bind | telephony_campaign_create}` is.
- Tests as listed in `00-data.md` item 13.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Tab | the existing third `TabsTrigger`, label Deployment | `concepts/a-tabs.tsx`, `src/components/ui/tabs.tsx` |
| Rows | `AgentBuilderRow id="readiness" \| "retention" \| "deployment"` inside the Agent tab's `@container max-w-5xl divide-y divide-border/58` box (the same container, so the two tabs look alike) | `src/components/console/agent-builder/agent-builder-row.tsx` |
| Readiness list | a `<ul className="grid gap-2">` of `<li className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">`, the live Go live section's issue list | `src/components/console/agent-builder/sections/go-live-section.tsx` (sibling) |
| Done glyph | `Tick` on `AgentBuilderTickGlyph`, gray | `parts/common.tsx`, `src/components/console/agent-builder/agent-builder-tick.tsx` |
| Open glyph | `TriangleAlert` `size-4 text-warning` (the live issue list's icon) | lucide |
| Item text | `console-type-body`; the fact or the sentence | `src/styles.css` utility |
| Fix link | `Button variant="link" size="sm" className="h-auto px-0"` (the live issue list's door) | `src/components/ui/button.tsx` |
| Retention control | `RadioGroup` with two `RadioGroupItem` label rows (New run's When rows) and a `text-xs text-muted-foreground` line under each option | `src/components/ui/radio-group.tsx`, `parts/deploy.tsx` `NewRunSheet` (sibling) |
| Disabled reason, code line | `FieldDescription` muted text | `src/components/ui/field.tsx` |
| Empty type row | `EmptyRow` with the one action | `parts/common.tsx` |
| Go live in the row | `Button variant="outline" size="sm"` (today's Connect a number in `EmptyRow`) | `button.tsx` |
| Numbers list | `InboundNumbers` as it is, with Remove and Add another number | `parts/deploy.tsx` |
| Runs | `RunsTable`, `RunSheet`, `NewRunSheet` as they are (P0.10) | `parts/deploy.tsx` |
| Snippet | `SdkCode` on `Tabs` and `CodeBlock withCopy` (the copy is the code Go live) | `parts/deploy.tsx`, `src/components/ui/code-block.tsx` |
| Go live sheet | `GoLiveNumberSheet` (today's `ConnectNumberSheet`): `FormSheet size="compact"`, `RadioGroup` source rows, `Select` of numbers, the SIP `Field`s, `SecretKeyField` | `parts/deploy.tsx`, `src/components/console/form-sheet.tsx`, `select.tsx` |
| Header primary | the existing filled `Button` in `AgentHeader` actions | `parts/common.tsx` |
| Untyped ask | `UntypedAlert` (P0.1.c) unchanged | `parts/deployment-type.tsx` |
| Minutes banner | `Alert` with `bg-warning-bg` (the live deploy panel's notice) + `AlertDescription` + `Button variant="outline" size="sm"` Add card | `src/components/ui/alert.tsx`, `src/components/console/agent-deploy-panel.tsx` (sibling) |
| Run refused | `Alert variant="destructive"` in the sheet body above the footer (P0.1's error alert) with Add card | `alert.tsx` |
| Saved with the line | `savedToast(title, agent, onTest)` helper: `toast(title, { description, action: { label: "Test", onClick } })` | `parts/common.tsx`, `src/components/ui/sonner.tsx` |
| Test door | P0.7's `openTest({ start: false, trigger })` | `concepts/a-tabs.tsx` |
| Last save | P0.3's View last save `CodeBlock` dialog | `src/components/ui/code-block.tsx` |

No new token, component, radius or font size. No stepper, no progress bar, no verdict, no green tick, no red anywhere in Readiness. No second copy button on the snippet.

## 4. The area, piece by piece

### The tab and the header

Tabs read **Overview · Agent · Deployment** for every agent, untyped included. The header's primary action: **Go live** (filled) on a draft agent of any type, landing on `tab=deploy` at the top (Readiness first); **New run** on a live batch agent (opens New run); none on a live inbound or code agent and none on an untyped agent. `DEPLOYMENT_TYPES.primaryAction` becomes `goLive: "Go live"` for all and `repeatAction` for batch only; `deployTab` becomes the row label (Numbers, Runs, Code).

### Readiness

```
Readiness   ⚠  Not heard in a test yet.                                       Test
            ✓  System prompt written.
               A number is picked at Go live. 5 in the project.
```

One `<li>` per item from `readReadiness`. Done: the tick glyph and the fact. Open: the triangle, the sentence and the link at the right. Pending: an empty `size-4` spacer and the muted sentence, no link. Order test, prompt, number or list; code shows two. No footer, no line under the list, no verdict.

### Retention

```
Retention   (•) 30 days
                What people say is kept for 30 days, then expires. The session row, its count and its cost stay.
            ( ) Zero retention
                Nothing people say is stored. The session row, its count and its cost stay.
                The API has no retention setting on a number yet, so inbound sessions are kept for 30 days.
```

Two radio rows. On inbound and batch the second `RadioGroupItem` is `disabled` and the reason renders as a `FieldDescription` under its line; on code both are enabled and the line under the group reads "The snippet sends it with every session." Picking writes at once (a label PATCH), toast "Retention saved."; no footer.

### The type row

| Type | Draft | Live |
|---|---|---|
| **Numbers** | `EmptyRow` "No number answers with this agent yet." + **Go live** | the list (`{number}` tabular, its label under it, **Remove** `ghost xs`), footer **Add another number** `ghost sm` |
| **Runs** | `EmptyRow` "No runs yet. A run dials one contact list with this agent." + **Go live** | `RunsTable` as today; the row has no button while the header carries New run |
| **Code** | `SdkCode`: tabs In your app and By phone, the `CodeBlock` with copy, **API keys**; under it the line "Copy the snippet into your software. The first session it starts is Go live." | the same with "First session from your software on {date}." or "No session from your software yet." |

Under the row on a suspended account nothing more renders; the banner above the rows carries the consequence.

### The Go live sheet (inbound)

Title **Go live**. With numbers in the project: the two source rows (A number in this project, A new number on your SIP trunk), then the Number `Select` (`{number} · {label}`, or `{number} · Answers with {agent}`) and, when the picked number answers with another agent, the warning line "{agent} answers this number now. Go live moves it to {this agent}." (P0.9.d adds the confirm). With no numbers: no source rows; the line "The project has no numbers yet. Add one from your SIP trunk." then Phone number, SIP host, SIP protocol (TLS, TCP, UDP), Username, Password. Footer **Cancel** · **Go live**, on when a number is picked or the number and host are filled. Focus returns to the row's Go live on close.

### The minutes banner (.g)

An `Alert` with the warning tint above the rows, one sentence and **Add card**; shown when the billing state is suspended (design mode: `dep=suspended`). P1.7 moves it to the page level for every agent page; this row places it where Go live is.

### The save toast on a live agent (.h)

`savedToast("Prompt saved.", agent, onTest)`: when `deploymentLine(agent)` is not null the toast carries it as the description and **Test** as the action; otherwise it is the plain toast the rows show today. The six callers: Voice & models (P0.2), Advanced settings (P0.3), the prompt row and the greeting sheet (P0.4), the integration sheets (P0.5), the key control's save (P0.6, through the Advanced sheet).

## 5. Behaviour

- **Open.** `tab=deploy` renders the three rows for a typed agent and fires `readiness_opened {deploymentType, rowCount, openCount, untestedItems: 0 | 1, allGo}` once per mount; when `openCount > 0` it also fires `go_live_blocked {codes: "no_test|no_number", blockCount, deploymentType}` once (one event carrying every code, as the old `deploy_blocked` asked). For an untyped agent the tab renders `UntypedAlert` alone and fires `go_live_blocked {codes: "no_deployment_type", blockCount: 1}` once; the rows render when a type is written (P0.1.c's Use inbound or the dialog).
- **Readiness.** Items come from `readReadiness(agent, PROJECT_NUMBERS)` on every render. The test item reads `lastTestHeard` against `updatedAtIso`; P0.7's panel writes `lastTestHeard = { at: HH:mm, agentVersion: updatedAtIso }` on the first `agent_audio_heard` of a session (design mode: on the greeting bubble). Any save that changes `updatedAtIso` reopens the item until the next heard answer.
- **Fix links.** **Test** calls `openTest({ start: false, trigger: "readiness" })` (P0.7; absent, `setTestOpen(true)`) and fires `test_panel_opened {trigger: readiness}`. **Write the prompt** calls `nav.go({ tab: "agent", section: "prompt" })`. **Add a number** opens the Go live sheet (`panel=go-live`) on the SIP form.
- **Retention.** Picking fires `data_policy_selected {retention, deploymentType, writable: true}`, writes `labels.studio_data_policy`, toasts. A disabled option cannot be picked, so the event never fires on inbound or batch. The snippet reads `retentionFor(agent).value` and includes `data_policy` only for `none`.
- **Go live (inbound).** The row's Go live opens `panel=go-live` and fires `go_live_clicked {deploymentType: inbound, hasNumber: PROJECT_NUMBERS.length > 0, testHeard, agentVersion}`. The sheet's Go live sends the PATCH (or the POST for a SIP number), fires `operation_succeeded {operation: telephony_phone_number_bind}`, toasts "Live. {number} answers with this agent.", sets `status: "live"`, closes. A number that answered with another agent moves (today's behaviour; P0.9.d adds the confirm). **Add another number** opens the same sheet and fires `go_live_clicked` again with `repeat: true`. **Remove** sends the PATCH, toasts "{number} no longer answers with this agent.", and sets `status: "draft"` when the list is empty.
- **Go live (batch).** The row's Go live opens New run (`panel=new-run`, P0.3's key; `useDeployActions.openPrimary`) and fires `go_live_clicked {deploymentType: batch, hasNumber, testHeard}`. Start run and Schedule run stay P0.10's; on success they fire `operation_succeeded {operation: telephony_campaign_create}` (added here if absent). While suspended (`dep=suspended`, `dep=suspended-run`), Start run answers `AccountSuspended` and the sheet shows the refusal `Alert` with Add card; the values stay.
- **Go live (code).** The snippet's copy fires `code_snippet_copied {transport}` and `go_live_clicked {deploymentType: code, hasNumber: false, testHeard}` and toasts "Snippet copied. The first session your software starts is Go live." No second button; `channel_connected` for code is the first non-Studio `POST /sessions` (server, no Console fallback).
- **Header Go live.** `nav.go({ tab: "deploy", section: undefined })`; fires nothing itself (the tab's open fires `readiness_opened`).
- **Overview empty row.** Its action reads Go live and does what the header Go live does (touches `parts/performance.tsx`).
- **Banner.** `cta_viewed {cta: add_card}` once per show; Add card opens `/billing` in a new tab and fires `external_link_opened {surface: billing}`.
- **Save on a live agent.** `savedToast` renders the description from `deploymentLine(agent)` and the action **Test**, which calls `openTest({ start: false, trigger: "save_line" })` and fires `test_panel_opened {trigger: save_line}`. Nothing else changes in the rows' saves.
- **Review states.** `dep=` never writes the store: `ready`, `no-test`, `no-number`, `zero-retention` and `suspended` render the agent, the numbers or the billing state as described; `live` renders the agent as live with the number and fires the toast once on mount; `saved-live` fires the save toast once on mount for the row named by `section=`; `suspended-run` opens New run with a list and a number chosen and the refusal shown.
- **Keyboard.** Tab order on the Deployment tab: the readiness links in list order, the two radios (one tab stop, arrows), the type row's button or Remove buttons and footer link, then the snippet's tabs, copy and API keys. `section=` moves focus to the row's first focusable. The sheet: source rows, Number select (or the SIP fields), Cancel, Go live; Esc closes.
- **Events per action.** `readiness_opened`, `go_live_blocked`, `go_live_clicked`, `data_policy_selected`, `code_snippet_copied`, `operation_succeeded`, `test_panel_opened`, `cta_viewed`, `external_link_opened`, `agent_audio_heard` (P0.7), `agent_updated` (the rows'); each logs once through `trackProto`.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics. Never: connect, disconnect, connection, publish, deploy (verb), launch, activate, call (outside API names), channel (alone), not kept, private, no-log, incognito, credits, quota, live (for running), preview, prototype.

| Key | Text |
|---|---|
| Tab | Deployment |
| Header primary, draft | Go live |
| Header primary, live batch | New run |
| Row labels | Readiness / Retention / Numbers / Runs / Code |
| Test, done | Heard in a test at {time}, after the last change. |
| Test, never heard | Not heard in a test yet. |
| Test, changed since | Not heard in a test since the last change, {time}. |
| Test link | Test |
| Prompt, done | System prompt written. |
| Prompt, open | No system prompt. The agent answers from the model alone. |
| Prompt link | Write the prompt |
| Number, done | {number} answers with this agent. |
| Number, pending | A number is picked at Go live. {n} in the project. |
| Number, pending, one | A number is picked at Go live. 1 in the project. |
| Number, open | No number in the project yet. |
| Number link | Add a number |
| List, done | {list} · {n} contacts, from {run}. |
| List, pending | A contact list is uploaded in New run. |
| Retention options | 30 days / Zero retention |
| 30 days line | What people say is kept for 30 days, then expires. The session row, its count and its cost stay. |
| Zero retention line | Nothing people say is stored. The session row, its count and its cost stay. |
| Reason, inbound | The API has no retention setting on a number yet, so inbound sessions are kept for 30 days. |
| Reason, batch | The API has no retention setting on a run yet, so run sessions are kept for 30 days. |
| Code retention line | The snippet sends it with every session. |
| Retention toast | Retention saved. |
| Numbers, empty | No number answers with this agent yet. |
| Runs, empty | No runs yet. A run dials one contact list with this agent. |
| Row button | Go live |
| Number actions | Remove / Add another number |
| Snippet tabs | In your app / By phone |
| Code line, draft | Copy the snippet into your software. The first session it starts is Go live. |
| Code line, live | First session from your software on {date}. |
| Code line, none | No session from your software yet. |
| Snippet toast | Snippet copied. The first session your software starts is Go live. |
| API keys link | API keys |
| Sheet title | Go live |
| Source rows | A number in this project / A new number on your SIP trunk |
| Number label | Number |
| Number placeholder | Pick a number |
| Number item | {number} · {label} / {number} · Answers with {agent} |
| Owner line | {agent} answers this number now. Go live moves it to {this agent}. |
| No numbers line | The project has no numbers yet. Add one from your SIP trunk. |
| SIP fields | Phone number / SIP host / SIP protocol / Username / Password |
| Sheet footer | Cancel / Go live |
| Live toast | Live. {number} answers with this agent. |
| Removed toast | {number} no longer answers with this agent. |
| Banner | The account is suspended, so new sessions are refused and production agents are silent. Add a card to reactivate it. |
| Banner action | Add card |
| Run refused | The account is suspended, so the run was not started. Add a card to reactivate it. |
| Untyped alert | P0.1's copy, unchanged |
| Save line, inbound | {number} answers with this agent, so the change reaches callers on their next session. |
| Save line, batch, run open | {run} dials with this agent, so the change reaches its next session. |
| Save line, batch, no open run | The next run dials with this change. |
| Save line, code | Your software starts sessions with this agent, so the change reaches the next one. |
| Save toast action | Test |
| Overview empty row action | Go live |
| Last save entries | PATCH /numbers/{id} · 200 / POST /numbers · 201 / PATCH /agents/{id} · 200 / POST /campaigns · 403 |

P0.10 owns New run's own strings ("A run calls…", "Call from", "Calls at once", "calls rotate") and fixes them there; this row changes only the Runs row's empty line above.

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (connect, disconnect, publish, deploy, launch, activate, call, channel, not kept, private, credits, quota, preview, prototype, simulated, mock, wireframe, arrows, em dashes). P0.2's, P0.3's, P0.4's, P0.5's and P0.6's routes unchanged apart from the toast helper; P0.1's tab label, header primary and untyped tab changed only as declared; P0.7's `openTest` and stored flag extended only as declared. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 deployment-gaps, 02 test-from-readiness, 03 ready-keep-30-days, 04 go-live-sheet, 05 live, 06 code-zero-retention, then rainy 07 b-no-test-since-change, 08 c-no-number, 09 c-sip-form, 10 c-batch-list-pending, 11 d-inbound-disabled, 12 d-batch-disabled, 13 e-inbound-live, 14 e-batch-live, 15 e-code-live, 16 f-untyped, 17 g-suspended-banner, 18 g-run-refused, 19 h-saved-live-inbound, 20 h-saved-live-batch, 21 prompt-gap.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.8 · Confirm the agent is ready` after P0.7's, child sections 1 JTBD, 2 Research (the 9 shots in `02-research.md` with their regions), 3 Flow (21 story frames), 4 Hero (the Deployment tab on the draft inbound agent with one gap, the tick and the pending number, Retention with the disabled option, and the Numbers row with Go live; the Go live sheet with the number picked; the live agent's tab with three ticks and the number listed), 5 Rationale with the three links. Owner ask of 26 Sep: add a child section **UI Explorations** with 3 to 5 native variations of the first hero screen (the Deployment tab: Readiness, Retention, Numbers with Go live), each meticulously built from the kit on page 31:2 with variables bound, never detached, grounded in Refero screens (`refero_search_screens` for launch checklists, go-live review steps, readiness lists and retention or privacy settings; tag each with its source), with vendor logos only where a module is named (Deepgram, Gemma on SuperNode, Cartesia in the readiness test line if the variation shows the tested pipeline), hero screens only, nothing interactive. Load `figma:figma-use` first.
