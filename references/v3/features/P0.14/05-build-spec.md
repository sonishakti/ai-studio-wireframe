# P0.14 Change an agent people reach · Build spec

Track: **v3**. Pick: **direction 1, the line where the button is, the door in the header**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.13's commit; if P0.8's commit is absent at build time, `deploymentLine(agent)` and `savedToast` are made here exactly as P0.8's spec and `00-data.md` name them and P0.8 takes them over; if P0.7's is absent, `chg=heard` renders through today's Test sheet (`setTestOpen(true)` in `AgentA`) with the greeting bubble and P0.7 takes it over; if P0.4's is absent, the line lands in today's prompt row footer and the greeting sheet in `parts/prompt.tsx`; if P0.13's is absent, the since view narrows today's Recent sessions block in `parts/performance.tsx` and the `before this change` entry is a second `CodeBlock` under P0.3's `LastSaveDialog` with a muted title. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.14): read what a save reaches, hear it, watch the sessions since the change, revert by hand`.

Scope rule: P0.14 only: the deployment line in the six dirty footers (the reason slot each already has), the change stamp and the kept before values in their saves (`data.ts`), the header's meta line and door (`parts/common.tsx` `AgentHeader`, optional `meta` prop with a default of nothing), the since view of Recent sessions (`parts/performance.tsx`), the `before this change` entry in View last save (`parts/advanced.tsx` `LastSaveDialog`), the 412 alert on the prompt row and the sheets, and the `since` and `chg` keys (`store.tsx`). Touches outside it, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.13 are in review): P0.8's `savedToast` gains a `trigger` and omits the Test action on `save_and_test`; the six saving callers P0.8 lists (P0.2, P0.3, P0.4, P0.5, P0.6) render the line in their footer slot, stamp the change and write `beforeSave`; P0.13's `SessionsTable` is rendered with a narrowed list and the title row gains **All sessions** while narrowed; P0.1's `ChangeTypeDialog` is untouched. Concepts B to E keep compiling: `AgentHeader` keeps `{ name, onBack, badges, actions }`; `PromptEditor`, `GreetingSheet`, `AdvancedSheet`, `VoiceModelsRow` and the integration sheets keep their props and gain nothing required; `Performance` keeps `{ agent, onPrimary, onSetUpAnalysis, hideSessions }` and gains optional `since`.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=agent&section=prompt`, written below as `…`. Front desk is inbound, Production, `+1 415 555 0142`, greeting *"Thanks for calling Bayview Dental. How can I help?"*, last Studio change Sep 19, 15:02. The prototype link opens at step 1. P0.4's `panel=greeting` opens the sheet, P0.3's `panel=last-save` the dialog, P0.1's `panel=change-type` the type dialog.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…` | The header: Front desk · **Inbound** · **Production** · **Test** · the menu, and under the name the meta line "Changed Sep 19, 15:02 · **Sessions since this change**"; the System prompt row with its editor and the ghost door **Greeting and failure message** ticked; no footer (nothing dirty). The Voice row above still carries P0.2.g's Spanish line | Sam opens Front desk, which +1 415 555 0142 answers with, and goes to the greeting |
| 2 | `…&panel=greeting&chg=dirty` | The sheet **Greeting and failure message** (P0.4): Who speaks first The agent, Greeting *"Thanks for calling Bayview Dental, this is Marcus. How can I help?"*, Delay 500 ms, the failure message; the footer's left slot reads "+1 415 555 0142 answers with this agent, so the change reaches callers on their next session." and **Cancel** · **Save** · **Save and test** on | Sam rewrites the greeting and reads who the save reaches |
| 3 | `…&chg=heard` | The sheet closed; toast "Greeting and failure message saved." with the line as its description and no action; the panel docked on the right (P0.7): "Aria · 0:04", the new greeting in italics and quotes, Listening, **End test**; the header's meta line now "Changed today, 14:02 · Sessions since this change"; the door still ticked | Sam presses Save and test and hears the new greeting on the version callers get |
| 4 | `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=overview&since=change&chg=heard` | Overview with the tile strip unchanged (392 sessions); **Recent sessions** narrowed: the title row reads Recent sessions · **All sessions** · Open in session history, and in place of rows the `EmptyRow` "Nothing has reached the agent since the 14:02 change. The next session shows here." | Sam opens Sessions since this change and waits for the first one |
| 5 | `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=overview&since=change&chg=since-rows` | The same block twenty minutes later: three rows, `Today, 14:21` `+1 628 555 0112` 3m 12s Completed, `Today, 14:15` `+1 510 555 0140` 1m 41s Completed, `Today, 14:09` `+1 415 555 0177` 2m 04s Completed; no count line; **All sessions** at the right | Sam watches the first sessions on the new greeting come in clean |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b view | `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=overview&since=change&chg=broken` | The narrowed block with the count line "3 sessions since the 14:02 change · 2 failed" above the rows: `Today, 14:21` 0m 06s **Failed**, `Today, 14:15` 1m 41s Completed, `Today, 14:09` 0m 04s **Failed** (the outcome word in the danger tone, the table's own) | Sam opens View last save for the values before the change |
| .b revert | `…&panel=last-save&chg=broken` | The **Last save** dialog (P0.3): `PATCH /agents/agent_frontdesk · 200` with `{ "greeting": { "text": "Thanks for calling Bayview Dental, this is Marcus. How can I help?", "delay_ms": 500 }, "labels": { "studio_config_changed_at": "2026-09-26T14:02:00.000Z" } }`; under it `studio · before this change` with `{ "greeting": { "text": "Thanks for calling Bayview Dental. How can I help?", "delay_ms": 500 } }` and the line `// kept in this browser until the account store ships`; under the block the sentence "To undo, put these values back and save. The API keeps no earlier versions." | Sam opens the greeting sheet, puts the old line back, presses Save and test; the server derives `agent_reverted` from the field diff. Versions stay an API ask (open question 2) |
| .c inbound | `…&panel=greeting&chg=dirty&chg=running` written as `…&panel=greeting&chg=running` | The sheet as step 2; the footer line reads "+1 415 555 0142 answers with this agent, so the change reaches callers on their next session. The 3 sessions running now keep the agent they started with." | Nothing to do; the API team confirms the behaviour (open question 1). When the running count is unknown the sentence reads "Sessions running now keep the agent they started with." |
| .c batch | `/v3?concept=a&view=agent&agent=agent_payments&tab=agent&section=prompt&chg=dirty` | Payment reminders (batch, Production, Run 3 dialing): the prompt row dirty with one sentence added; the footer line "Run 3 dials with this agent, so the change reaches its next session. The 10 sessions running now keep the agent they started with." beside **Cancel** · **Save** · **Save and test** | Same; the count is the run's `calling` |
| .d | `…&panel=greeting&chg=conflict` | Save pressed on the edited sheet: an `Alert` (warning tint) above the footer, "Someone saved this agent at 14:01, while you were editing. Their version is the one people reach now. Your edits are still here." with the link **Show their version**; the Greeting field still holds Sam's text; **Save** and **Save and test** on | Save sends again with the fresh precondition and lands; Cancel drops Sam's draft and shows theirs |
| .d theirs | `…&panel=greeting&chg=conflict-theirs` | The same with the link reading **Hide their version** and, under the alert, a read-only `CodeBlock` titled `theirs · greeting` holding *"Thanks for calling Bayview Dental. Marcus speaking."* | Sam merges by hand in the field and presses Save; P3.5.d grows this into the two-version sheet |
| .e | `…&panel=change-type` | P0.1.b's dialog, unchanged: "Number +1 415 555 0142 answers with this agent. Remove the agent from that number, then change its type." with **Open number** | Open number lands on the Deployment tab (P0.1's `onOpenHold`); nothing in this row changes it |
| draft | `/v3?concept=a&view=agent&agent=agent_survey&tab=agent&section=prompt&chg=dirty` | Renewal survey (batch, Draft): the prompt row dirty with P0.4's plain footer, no line; the header without a meta line | Nothing to fix: no deployment, nothing reached |
| API change | `…&chg=api-change` | The header's meta line reads "Last saved Sep 19, 15:02" with no door (P1.1.g); the rest as step 1 | The next Studio save writes `studio_config_changed_at` and the door appears |
| unlinked | `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=overview&since=change&chg=unlinked` | The narrowed block reads one line "Arrives when sessions link to agents." (P1.3.b) in place of rows, with **All sessions** at the right | G4 and G12; never 0 |

New search keys, validated in `store.tsx`: `since` (`change`, Overview only: Recent sessions narrowed to `changedAt(agent)`; ignored on a draft agent or when `changedLine` is null); `chg` (`dirty` \| `heard` \| `since-rows` \| `broken` \| `running` \| `conflict` \| `conflict-theirs` \| `api-change` \| `unlinked`, review only, never written to the store). `openAgent` and `toList` clear both; `openPanel(undefined)` clears `chg` (as P0.5's `it`) and leaves `since`. P0.4's `panel=greeting` and `pr=`, P0.3's `panel=last-save`, P0.7's `test=`, P0.8's `dep=`, P0.13's `tries=` keep their meaning.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `changedAt`, `changedLine`, `stampConfigChange`, `runningNow`, `liveChangeLine`, `sessionsSince`, `failedSince`; `ProtoAgent.beforeSave`, `ProtoAgent.runningNow` (fixture, optional), `Session.startedAtIso` (optional); `WRITTEN_GREETING`, the review rows and the conflict fixture.
- Seeds: `studio_config_changed_at` on `agent_frontdesk`, `agent_payments`, `agent_tutor` (item 1); nothing else changes.
- The save on a deployed agent: `PATCH /agents/{id}` with the row's own body (P0.2 to P0.6 unchanged) plus `labels.studio_config_changed_at`; the caller writes `beforeSave` from its baseline for the same fields. The PATCH carries the precondition Studio loaded (open question 3); a 412 refreshes the baseline from the re-read and keeps the draft. P0.3's View last save lists the PATCH and the `kept` entry; a 412 lists `PATCH /agents/{id} · 412` and a `note` entry.
- `parts/events.ts` gains `surface_viewed` props for `live_change_notice` and `sessions_since_change`, and `operation_failed {operation: agent_update, code: 412}`; `agent_updated` gains `hasDeployment` and `deploymentType`. `agent_reverted` is a server event and is never logged.
- Tests as listed in `00-data.md` item 12.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| The line before the save | the footer's reason slot, `<p className="mr-auto self-center text-xs text-muted-foreground">` (P0.1's create sheet, P0.4's row footer) | `concepts/a-tabs.tsx` `CreateSheetA` (sibling), `parts/prompt.tsx`, `parts/voice-models.tsx`, `parts/advanced.tsx`, `parts/context.tsx` |
| Header meta line | `AgentHeader` gains `meta?: ReactNode`, rendered as a third line `text-xs text-muted-foreground` under the name row (the campaign detail banner's facts beside Stop are the sibling) | `parts/common.tsx`, `src/components/console/primitives.tsx` `ConsolePageHeader` description (sibling) |
| The door | `Button variant="link" size="sm" className="h-auto px-0"` (P0.8's fix link) | `src/components/ui/button.tsx` |
| Since view | P0.13's `SessionsTable` with `sessionsSince` rows; the title row's `Button size="xs" variant="ghost"` reading **All sessions** while narrowed (P0.13's Your tests door is the sibling and stays) | `parts/performance.tsx`, `parts/deploy.tsx` |
| Empty since | `EmptyRow` with no action | `parts/common.tsx` |
| Count line | `<p className="text-xs text-muted-foreground">` above the table, shown only when `failedSince > 0` | `parts/performance.tsx` |
| Gap line (unlinked) | `EmptyRow` "Arrives when sessions link to agents." | `parts/common.tsx` |
| Saved toast | P0.8's `savedToast(title, agent, onTest, trigger)`; `trigger: "save_and_test"` omits the action | `parts/common.tsx`, `src/components/ui/sonner.tsx` |
| Before entry | P0.3's `LastSaveDialog` `CodeBlock` with P0.13's muted title and `// comment`; the undo sentence as `FieldDescription` under it | `parts/advanced.tsx`, `src/components/ui/code-block.tsx`, `src/components/ui/field.tsx` |
| Conflict alert | `Alert` with `bg-warning-bg` (P0.8's minutes banner) + `AlertDescription` + `Button variant="link" size="sm"` | `src/components/ui/alert.tsx`, `button.tsx` |
| Their value | `CodeBlock` with the field name as its label (P0.3's read-only API row) | `code-block.tsx` |
| Type change | P0.1's `ChangeTypeDialog`, unchanged | `parts/deployment-type.tsx` |
| Test panel | P0.7's `TestPanel` (today `parts/list-and-create.tsx`) | `parts/test.tsx` |

No new token, component, radius or font size. No dialog on save, no Publish, no Draft badge, no version number, no Revert button, no red on the line, no green anywhere.

## 4. The row, piece by piece

### The footer line

```
+1 415 555 0142 answers with this agent, so the change reaches callers on their next session.      [Cancel] [Save] [Save and test]
```

Renders in the footer's reason slot while the draft is dirty and `liveChangeLine(agent)` is not null. On the prompt row P0.4's reason ("Write the system prompt to save it.") wins when it applies: a draft that cannot save reaches nothing. Sheets (Greeting, Tune the agent, Add an MCP server, Add a tool, Edit) print it in the same slot of their `FormSheet` footer. The second sentence appends when `runningNow(agent)` is not `0`. Fires `surface_viewed {surface: live_change_notice}` once per dirty draft.

### The header meta line

```
Agents
Front desk  [Inbound] [Production]                              [Test] [⋯]
Changed today, 14:02 · Sessions since this change
```

`changedLine(agent)`: `changed` reads "Changed {when} · " and the door; `saved` reads "Last saved {when}" and no door; `null` renders nothing (a draft agent). `{when}` is "today, HH:mm" for today, "Mon d, HH:mm" otherwise. The door calls `nav.go({ tab: "overview", since: "change" })`; on Overview it also scrolls the block into view. P1.1 extends this line with counts and moves nothing.

### The since view

```
Recent sessions                                    All sessions   Open in session history
3 sessions since the 14:02 change · 2 failed
Started        Number               Duration   Outcome     Success
Today, 14:21   +1 628 555 0112      0m 06s     Failed
```

While `since=change`: the rows are `sessionsSince(agent, changedAt)`, newest first, 20 at most; the ghost xs button reads **All sessions** and clears `since`; the count line shows only when at least one row failed; with no row the `EmptyRow` sentence names the change time; when sessions cannot be attributed (`chg=unlinked`, the port's G4) the `EmptyRow` reads the gap sentence. P0.13's Your tests door stays in the row and its view is not narrowed. Leaving the tab clears `since`.

### View last save

```
PATCH /agents/agent_frontdesk · 200
{ "greeting": { "text": "Thanks for calling Bayview Dental, this is Marcus. How can I help?", "delay_ms": 500 },
  "labels": { "studio_config_changed_at": "2026-09-26T14:02:00.000Z" } }

studio · before this change
{ "greeting": { "text": "Thanks for calling Bayview Dental. How can I help?", "delay_ms": 500 } }
// kept in this browser until the account store ships
To undo, put these values back and save. The API keeps no earlier versions.
```

The entry renders after the PATCH it belongs to, only when `beforeSave` exists. The undo sentence is prose under the block, not a comment.

### The 412 alert

```
⚠ Someone saved this agent at 14:01, while you were editing. Their version is the one people reach now. Your edits are still here.   Show their version
   theirs · greeting
   "Thanks for calling Bayview Dental. Marcus speaking."
                                                                     [Cancel] [Save] [Save and test]
```

Above the footer of the row or sheet whose Save met the 412. The draft is untouched; the baseline becomes their values, so Cancel shows theirs. The link toggles the block; Save sends again with the fresh precondition.

## 5. Behaviour

- **Line.** Computed on every render from `liveChangeLine(agent)`; shown only while dirty. Never inside a disabled control, never a banner.
- **Save.** Each caller's save runs as its row specifies, then `stampConfigChange` and `beforeSave` for the changed fields (the port: one PATCH, the label inside it); `agent_updated {hasDeployment, deploymentType, fields}`. `savedToast(title, agent, onTest, trigger)`: description from `deploymentLine`, action **Test** on `trigger: "save"`, none on `"save_and_test"` (P0.7's panel is open and starting). Readiness's test item reopens as P0.8 specifies.
- **Save and test.** P0.7's `openTest({ start: true, trigger: "save_and_test" })`; a running test stops first and the new one starts under a divider (P0.7). `agent_audio_heard {agentVersion: updatedAtIso}` is the version proof the counter metric reads.
- **Header.** `changedLine` on every render; the door fires nothing itself (the since view's open fires `surface_viewed`). Focus order: back link, the door, then the actions.
- **Since view.** Opens with `since=change`; fires `surface_viewed {surface: sessions_since_change, count, failed}` once per open; **All sessions** clears the key and focus returns to the button; Esc does nothing (not a panel). Rows are not focusable (P0.13's table).
- **412.** The save's response 412 refreshes the agent from the re-read (design mode: the conflict fixture), keeps the draft, shows the alert, fires `operation_failed`. **Show their version** toggles the block and fires nothing. The next Save carries the new precondition and lands; the alert unmounts on success or Cancel. A sheet with the alert keeps P0.3's leave guard.
- **Type change.** P0.1.b's dialog and `deploymentHold`, unchanged.
- **Review states.** `chg=` never writes the store: `dirty` seeds the draft with `WRITTEN_GREETING` (or the prompt sentence on `agent_payments` and `agent_survey`); `heard` sets the change time to today 14:02 for the render, fires the toast once on mount and opens the panel live; `since-rows` and `broken` seed the rows; `running` sets `runningNow` 3; `conflict` and `conflict-theirs` render the 412 state on the open sheet; `api-change` drops the label for the render; `unlinked` renders the gap sentence.
- **Keyboard.** The footer line is not focusable; the alert's link is one tab stop before the footer buttons; the since door is one tab stop after the period toggle and the Your tests door (P0.13). `panel=greeting` moves focus as P0.4 sets it.
- **Screen reader.** The meta line reads "Changed today, 14:02" then the link "Sessions since this change"; the count line is read before the table; the alert is `role="status"`, not an interruption.
- **Events per action.** `surface_viewed` (two surfaces), `agent_updated`, `agent_audio_heard` (P0.7), `operation_succeeded {operation: agent_update}` (the rows'), `operation_failed {operation: agent_update, code: 412}`, `test_panel_opened {trigger: save_and_test}` (P0.7); each logs once through `trackProto`.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics. Never: publish, deploy (verb), draft (as a state word on a deployed agent), live (for running), version number, rollback, restore, revert (as a button), call (outside "caller"), channel (alone), preview, prototype, simulated, mock, wireframe.

| Key | Text |
|---|---|
| Line, inbound (P0.8) | {number} answers with this agent, so the change reaches callers on their next session. |
| Line, batch, run open (P0.8) | {run} dials with this agent, so the change reaches its next session. |
| Line, batch, no open run (P0.8) | The next run dials with this change. |
| Line, code (P0.8) | Your software starts sessions with this agent, so the change reaches the next one. |
| Running sentence, count | The {n} sessions running now keep the agent they started with. |
| Running sentence, one | The session running now keeps the agent it started with. |
| Running sentence, unknown | Sessions running now keep the agent they started with. |
| Header, changed | Changed {when} · |
| Header, saved (P1.1.g) | Last saved {when} |
| Header door | Sessions since this change |
| When, today | today, {HH:mm} |
| When, other | {Mon d}, {HH:mm} |
| Since, back | All sessions |
| Since, empty | Nothing has reached the agent since the {HH:mm} change. The next session shows here. |
| Since, count line | {n} sessions since the {HH:mm} change · {f} failed |
| Since, unlinked (P1.3.b) | Arrives when sessions link to agents. |
| Toast titles (unchanged) | Prompt saved. / Greeting and failure message saved. / Voice and models saved. / Advanced settings saved. / MCP server added. / Tool added. |
| Toast description | the line |
| Toast action, Save only (P0.8) | Test |
| Before entry title | studio · before this change |
| Before comment | kept in this browser until the account store ships |
| Undo sentence | To undo, put these values back and save. The API keeps no earlier versions. |
| 412 entry title | PATCH /agents/{id} · 412 |
| 412 note comment | their save at {HH:mm} answers callers now; your draft is kept in the editor |
| Conflict alert | Someone saved this agent at {HH:mm}, while you were editing. Their version is the one people reach now. Your edits are still here. |
| Conflict link | Show their version / Hide their version |
| Their block title | theirs · {field} |
| New greeting (fixture) | *"Thanks for calling Bayview Dental, this is Marcus. How can I help?"* |
| Their greeting (fixture) | *"Thanks for calling Bayview Dental. Marcus speaking."* |
| Type change dialog (P0.1) | Number {number} answers with this agent. Remove the agent from that number, then change its type. / Open number |

Comments are code, lower case after `//`. "Caller" stays where P0.8 and P0.9 allow it; "callers" never appears on a batch or code line.

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (publish, deploy, draft, live, rollback, restore, revert, call, channel, preview, prototype, simulated, mock, wireframe, arrows, em dashes; code blocks and comments excluded; "caller" allowed). `git diff --stat` must touch nothing outside `src/prototypes/agent-builder-v3/`. P0.1, P0.9 to P0.12 routes unchanged; P0.2 to P0.6's footers, P0.7's panel open, P0.8's toast, P0.13's title row touched only as declared. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 open-agent-changed-line, 02 greeting-line-before-save, 03 heard-new-greeting, 04 since-change-empty, 05 since-change-rows, then rainy 06 b-since-change-failed, 07 b-last-save-before-values, 08 c-running-inbound, 09 c-running-batch, 10 d-conflict, 11 d-conflict-theirs, 12 e-change-type-dialog, 13 draft-no-line, 14 api-change-last-saved, 15 unlinked.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.14 · Change an agent people reach` after P0.13's, child sections 1 JTBD, 2 Research (the 10 shots in `02-research.md` with their regions), 3 Flow (15 story frames), 4 Hero (the greeting sheet at step 2 with the line in the footer; the header and the since view at step 5 with three rows and All sessions; the 412 alert at .d theirs with the block open), 5 Rationale with the three links. Owner ask of 26 Sep: add a child section **UI Explorations** with 3 to 5 native variations of the first hero screen (the greeting sheet over the Agent tab with the line "+1 415 555 0142 answers with this agent, so the change reaches callers on their next session." beside Cancel · Save · Save and test, the header's meta line behind it), each meticulously built from the kit on page 31:2 with variables bound, never detached, hero screens only, nothing interactive, grounded in Refero and tagged with its source per `explorations/brief.md` (Frame.io `88b22f4c-c0ad-4b81-8ecd-17a8d813997b` and Cursor `a80078ae-821e-4e8c-92d6-7791960954e6` for the dark settings save with a toast; The Org `6274a95e-285d-44af-9169-d65b4a57ef62` for an unsaved-changes bar; Acctual `a5c01677-92fa-4620-8d62-dc0f85cbf847` and Wittl `11636afb-5b26-49bd-95ca-fadc1a4e0fae` for the confirm the row does not build; Doppler `c790959c-8e4f-495c-9337-2f9ef3dfdb3e` for the consequence confirm as the anti-pattern; Cal.com `ab89943c-93f9-4f1d-96f9-ca8b3b79ba5f` and Jace `e0f6d538-8491-482d-a84b-b28e8c667c09` for a quiet notice inside a sheet; Memotron `0c2ecd17-3ea1-40c7-8809-7bff14263294` for a dark change log as the before-values variation; the research shots `vapi-01` for the pinned callout, `vercel-02` for verify then confirm, `retell-02` for compare, `elevenlabs-02` for the merge anti-pattern). Logos: none on the hero, since no vendor module is named on the greeting sheet; lucide `PhoneIncoming` (the Inbound badge), `FlaskConical` (Test), `Ellipsis` (the menu), `TriangleAlert` (the conflict variation only) and the kit's gray tick are the only glyphs. Load `figma:figma-use` first.
