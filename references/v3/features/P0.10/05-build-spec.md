# P0.10 Have the agent dial a list of people · Build spec

Track: **v3**. Pick: **direction 1, one sheet, read the list, four folds**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.9's commit; if P0.9's commit is absent at build time, the Call policy and Transfer folds, `isE164`, `InboundCallPolicy`, `callPolicyLine` and `transferLine` are made here exactly as P0.9's spec and `00-data.md` name them, and P0.9 takes them over; if P0.8's is absent, the Deployment tab, Readiness, the Runs row's Go live on `panel=new-run`, the minutes banner, the `dep=` states and `ProjectNumber` ids are made here as P0.8's spec names them; if P0.4's is absent, `agent.variables` and the mapping table's default reading are made here as P0.4's names them; if P0.3's is absent, the fold row and the Session limits fold are ported here from `src/components/console/agent-config-drawer.tsx` `AdvancedRow` and the current `NewRunSheet`. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.10): upload a list, set the hours and pace, read the estimate, start the run and stop it`.

Scope rule: P0.10 only, the batch branch of the Deployment tab in concept A: `NewRunSheet`, `RunsTable`, `RunMenu`, `RunSheet` and `SessionsTable` (`parts/deploy.tsx`; the run parts may move to a new `parts/runs.tsx` when they grow), the batch branch of `DeployArea` and `useDeployActions`, and their data. Touches outside it, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.9 are in review): P0.4's mapping warning becomes a footer reason that blocks the start when a variable has neither a column nor a default; P0.8's batch `go_live_clicked` moves from the sheet's open to the press of Start run or Schedule run and gains the estimate props, and P0.8's minutes banner gains one clause naming a run paused by the suspension; P0.9's Call policy and Transfer folds are lifted into a shared `CallPolicyFolds` used by both sheets, with Ring timeout and On voicemail shown only on a run; `RunStatusBadge` in `parts/common.tsx` drops the info and success tints; P0.3's Session limits fold is unchanged. `GoLiveNumberSheet`, `InboundNumbers`, `SdkCode` and Readiness are untouched. Concepts B to E keep compiling: `NewRunSheet` keeps `{ agent, open, basedOn, onOpenChange, update }` and gains optional `review` props with defaults; `RunSheet` keeps `{ agent, runId, onOpenChange, onNewRun, update }`; `RunsTable` keeps `{ agent, onOpenRun, onNewRun, update }`; `Run` gains only optional fields.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=agent_reminders&tab=deploy`, written below as `…`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…&dep=ready` | The Clinic reminders agent (batch, Draft) on **Deployment** (P0.8): Readiness with the gray ticks "Heard in a test at 13:52, after the last change." and "System prompt written." and the plain line "A contact list is uploaded in New run."; Retention on 30 days with the batch reason; **Runs** as one line "No runs yet. A run dials one contact list with this agent." and **Go live**; the header **Test**, **Go live** and the menu | Sam opens Deployment with the agent tested and presses Go live |
| 2 | `…&dep=ready&panel=new-run` | The sheet **New run**: Name `Run 1 · Sep 26`; **Contact list** with the dropzone "Drop a CSV with a phone column, or browse" and **Download template**; **Dial from** with the five project numbers unticked; **When** on Start now, **Calling windows** with no day ticked and the line "No calling windows, so the run dials at any hour."; the four folds collapsed; no estimate line; footer **Cancel** · **Start run** off with the reason "Upload a contact list to start." | Sam sees the sheet open on Contact list and drops the patient list |
| 3 | `…&dep=ready&panel=new-run&nr=list` | The file line `patients-oct.csv · 500 contacts` with **Replace**; the mapping table with `patient_name`, `appointment_time` and `doctor` each reading the column of the same name in its select; no warning; the reason now "Tick a number to dial from." | Sam sees 500 contacts and every variable matched to a column |
| 4 | `…&dep=ready&panel=new-run&nr=from` | **Dial from** with `+1 628 555 0110 · Spare` ticked, the others unticked; Start run on; the estimate line appears: "About 1,000 min for 500 contacts at 2 min each. 1,800 free minutes left." with its (i) | Sam ticks the number to dial from |
| 5 | `…&dep=ready&panel=new-run&nr=windows` | **When**: Start now; **Calling windows** with Mon to Sat filled and Sun outlined, `09:00` to `18:00`, `America/Los_Angeles`, the links **Add a range** and **Add another window**, the line "Inside a calling window now, so dialing starts at once."; **Pacing** expanded with its gray tick: Sessions at once 10, Dials per second empty, Attempts per contact 3, Wait between attempts 10 min; **Call policy** collapsed reading "Leaves a message on voicemail. Ends when the person hangs up.", **Transfer** "None", **Session limits** "30 s idle · 72 h at most" | Sam sets calling windows Monday to Saturday, 9 to 6, and reads the pacing |
| 6 | `…&dep=ready&panel=new-run&nr=estimate` | Pacing collapsed reading "10 at once · 3 attempts, 10 min apart"; the estimate line "About 1,000 min for 500 contacts at 2 min each. 1,800 free minutes left."; footer **Cancel** · **Start run** on | Sam reads the estimate against the free minutes left and starts the run |
| 7 | `…&nr=started` | The sheet closed; toast "Run 1 started. Dialing 10 at once from +1 628 555 0110."; the header badge **Live**, the header primary **New run**; **Runs** with the table: `Run 1 · Sep 26` / `patients-oct.csv`, Running (gray), `0 of 500`, Started `Today, 14:05`; Readiness three ticks, the third "patients-oct.csv · 500 contacts, from Run 1." | Sam sees the run dialing and the agent live |
| 8 | `…&nr=started&run=camp_r1&rs=first` | The panel **Run 1 · Sep 26** with the gray Running chip: Pending 489, Calling 10, Completed 1, Failed 0, Canceled 0; the lines Contact list `patients-oct.csv · 500 contacts`, Dials from `+1 628 555 0110`, Calling windows `Mon to Sat, 09:00 to 18:00, America/Los_Angeles`, Pacing `10 at once · 3 attempts, 10 min apart`, Started `Today, 14:05`; **Sessions** with one row `Today, 14:07 · +1 415 555 0161 · 1m 48s · Completed · Yes`; footer **Pause** · **Cancel run** · **Run again** | Sam opens the run and sees the first patient reached |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b rows | `…&dep=ready&panel=new-run&nr=rejects` | The file line `patients-oct-raw.csv · 488 contacts · 12 rows rejected` with **Replace**, a second line **Download rejects**, and under the box "Rejected rows have no phone or a number that is not in E.164. The other 488 are kept."; the mapping table as step 3; Start run on once a number is ticked | Download rejects saves `patients-oct-raw-rejects.csv` (line, phone, reason, then the row); Sam fixes the file and presses Replace, or starts with the 488 |
| .b file | `…&dep=ready&panel=new-run&nr=no-phone` | The dropzone with the `FieldError` "No phone column in this list. Name the column phone and put numbers in E.164, then upload it again."; no file line, no table; Start run off, reason "Upload a contact list with a phone column." | Sam drops a file with a phone column; **Download template** gives one |
| .c | `…&dep=ready&panel=new-run&nr=unmapped` | `patients-oct-short.csv · 500 contacts`; the mapping row `doctor` reads a select with the placeholder "Pick a column" in the warning tone, the other two matched; the footer reason "Map doctor to a column, or set a default for it in the prompt."; Start run off | Sam picks `provider` (`…&nr=mapped`: the select reads `provider`, the reason gone, Start run on); or sets a default in the prompt row (P0.4), which reads "Default: {value}" here |
| .d before | `…&dep=ready&panel=new-run&nr=closed` | Calling windows Mon to Fri on the Saturday clock; the line "Outside the calling windows now. Dialing starts Mon 09:00."; Start run on | Sam starts anyway, ticks Sat, or picks Start on a date |
| .d after | `…&run=camp_r1&rs=waiting` | The panel with the gray Running chip, Pending 500, the line under the counts "Running. Next dial Mon 09:00, America/Los_Angeles, when the calling window opens."; the table row's Started reads "Waits for Mon 09:00"; footer **Pause** · **Cancel run** · **Run again** | Nothing to fix; the status is the API's, the sentence is Studio's from `schedule.days` |
| .e | `…&run=camp_r1&rs=failed` | The panel with the Failed chip (danger tint); `Alert variant="destructive"` above the counts: "The run failed at 14:19 (TRUNK_UNREACHABLE). The SIP trunk did not answer for 5 minutes. Reported by sip.carrier.com."; Pending 500; the table row Failed; footer **Run again** alone | Run again opens `…&panel=new-run&nr=again`: the sheet with `patients-oct.csv · 500 contacts, from Run 1.` and Replace, the number ticked, the windows, the pacing and the policy pre-filled, Start run on |
| .f | `…&dep=ready&panel=new-run&nr=over` | The estimate line "About 1,000 min for 500 contacts at 2 min each. 600 free minutes left, so the run pauses when they run out unless a card is on file." with **Add card**; Start run on | Add card opens `/billing` in a new tab; Start run works as step 6; a card on file makes the second sentence "Billed past the free minutes." |
| .g banner | `…&dep=suspended&rs=paused-minutes` | P0.8's `Alert` at the top of the tab: "The account is suspended, so new sessions are refused and production agents are silent, and Run 1 is paused. Add a card to reactivate it." with **Add card**; the table row Paused (warning tint), `147 of 500` | Add card opens `/billing`; the run resumes from the panel after reactivation (P1.7.d) |
| .g panel | `…&dep=suspended&run=camp_r1&rs=paused-minutes` | The panel with the Paused chip: Pending 354, Calling 0, Completed 140, Failed 6, Canceled 0; the line "Paused at 12:40 when the free minutes ran out. Add a card, then Resume." with **Add card**; footer **Resume** · **Cancel run** · **Run again** | Resume while suspended (`…&rs=resume-refused`) shows `Alert variant="destructive"` above the footer: "The account is suspended, so the run was not resumed. Add a card to reactivate it." with **Add card**; after reactivation Resume sends `:resume` and the chip reads Running |
| .h pause | `…&run=camp_r1&rs=pause` | The panel with the Paused chip: Pending 489, Calling 10, Completed 1; the line "Paused at 14:22. The 10 sessions in progress finish; no new dials until Resume."; footer **Resume** · **Cancel run** · **Run again**; toast "Run 1 paused. Sessions in progress finish." on mount | Resume sends `:resume`, toasts "Run 1 resumed.", the chip reads Running |
| .h cancel | `…&run=camp_r1&rs=cancel` | Over the paused panel the `AlertDialog` "Cancel Run 1?" with "489 contacts are never dialed. The 10 sessions in progress finish." and **Keep running** · **Cancel run** | Cancel run sends `:cancel`; `…&rs=canceled` shows the Canceled chip (gray), Canceled 489, Completed 1, Calling 0, the line "Canceled at 14:25.", footer **Run again** alone; toast "Run 1 canceled. 489 contacts were not dialed." |
| .i | `/v3?concept=a&view=agent&agent=agent_payments&tab=deploy&panel=new-run&nr=again-api` | **New run** from Run 1 · Sep 10 of Payment reminders: the dropzone with the line above it "Run 1 was started through the API, so Studio has no copy of its list. Upload it again."; Dial from, the windows and the pacing pre-filled from the run; Start run off with "Upload a contact list to start." | Sam drops the list; the rest is step 3 onward |
| again | `/v3?concept=a&view=agent&agent=agent_payments&tab=deploy&panel=new-run&nr=again` | The sheet from Run 3 · Sep 24: Name `Run 4 · Sep 26`, the file line `overdue-sep-week4.csv · 600 contacts, from Run 3.` with Replace, the mapping, both Collections numbers ticked, the windows, the pacing, the policy; Start run on | Start run sends a new `POST /campaigns` with `repeat: true` on the event |

New search keys, validated in `store.tsx`: `nr` (`list` \| `from` \| `windows` \| `estimate` \| `started` \| `rejects` \| `no-phone` \| `unmapped` \| `mapped` \| `closed` \| `over` \| `again` \| `again-api`, review only, never written to the store; every value but `started` opens the sheet as if `panel=new-run` were set); `rs` (`first` \| `waiting` \| `failed` \| `pause` \| `cancel` \| `canceled` \| `paused-minutes` \| `resume-refused`, review only; each renders the run named by `run=` in that state). `openAgent` and `toList` clear `nr` and `rs`; `openPanel(undefined)` clears `nr` and leaves `rs` (the panel is `run=`, as P0.8's `dep`). P0.3's `panel=new-run`, the existing `run=<id>` and P0.8's `dep=` keep their meaning.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `Weekday`, `TimeRange`, `CallingWindow`, `RunSchedule`, `RunPacing`, `RunCallPolicy`, `RejectReason`, `RejectedRow`, `ContactList`, `RunFailure`, `Billing`, `NewRunDraft`; `Run` gains `list`, `mapping`, `scheduleV3`, `pacing`, `callPolicy`, `source`, `createdAtIso`, `startedAtIso`, `failure`, `pausedAtIso`, `pauseReason`, `estMinutes`, all optional but `source`.
- `WEEKDAYS`, `DEFAULT_PACING`, `DEFAULT_RUN_CALL_POLICY`, `EMPTY_SCHEDULE`, `DESIGN_NOW`, `BILLING`, `LIST_TEMPLATE_CSV`, `PROJECT_MAX_CONCURRENT`, `FIXTURE_LISTS`.
- `parseContactList`, `rejectsCsv`, `autoMap`, `uncoveredVariables`, `isInsideWindow`, `nextDialAt`, `nextDialLine`, `windowsLine`, `windowsToDays`, `pacingLine`, `runCallPolicyLine`, `avgSessionMinutes`, `estimateMinutes`, `estimateLine`, `validateNewRun`, `campaignCreateBody`, `runFromCreate`.
- Seeds per `00-data.md` item 12: new `agent_reminders`; `agent_payments` runs gain `source` and the v3 fields; fixture runs `camp_r1` and its state variants for the review URLs. No other seed changes.
- Start run writes `POST /campaigns` (`campaignCreateBody`); design mode answers 201 with `runFromCreate`, prepends the run, sets `status: "live"`; a 400 with `reason: InvalidFieldValue` lands as P0.1's `Alert` with the detail; a 403 `AccountSuspended` is P0.8's refusal alert; a 429 `ConcurrencyLimitExceeded` or `ResourceQuotaLimitExceeded` is the `Alert` "The run was not started ({code}). {detail}" with Try again. Pause, Resume and Cancel write `POST /campaigns/{id}:pause`, `:resume`, `:cancel`; design mode flips `status`, sets `pausedAtIso` and `pauseReason: "user"` on pause, moves `pending` into `canceled` on cancel and leaves `calling` to finish. Run again never writes until Start run. P0.3's View last save lists each call, the create body with the first three contacts and `"… 497 more"`.
- `parts/events.ts` gains `contact_list_uploaded`, `run_status_changed`, `rejects_downloaded`, and `go_live_clicked`, `go_live_blocked`, `cta_viewed`, `external_link_opened`, `operation_succeeded`, `operation_failed` where absent.
- Tests as listed in `00-data.md` item 15.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Sheet | `NewRunSheet` on `FormSheet` (standard size), title New run in every mode | `parts/deploy.tsx`, `src/components/console/form-sheet.tsx` |
| Sections | `FormSheetSection` with `title` and `action` (Contact list with Download template; Dial from with the (i); When) | `form-sheet.tsx` |
| Dropzone | the existing dashed `<button>` with the `Upload` glyph, now wrapping `<input type="file" accept=".csv,text/csv">` and accepting a drop | `parts/deploy.tsx`, lucide |
| File line | the existing bordered row `{file} · {n} contacts` with **Replace** `ghost xs`; the reject count appended; **Download rejects** as `Button variant="link" size="sm"` with the `Download` glyph on a second line | `parts/deploy.tsx`, `button.tsx` |
| Reject line, API line, windows (i) text, estimate (i) text | `FieldDescription` muted text; `InfoTip` | `field.tsx`, `parts/common.tsx` |
| Dropzone error | `FieldError` under the dropzone, `aria-invalid` on it | `field.tsx` |
| Mapping table | the existing two-column grid (P0.4's readings kept); the second column becomes a `Select` per row with the list's columns, the placeholder "Pick a column" with `text-warning` when unmapped | `parts/deploy.tsx`, `select.tsx` |
| Dial from | the existing `Checkbox` label rows, one per `PROJECT_NUMBERS` entry, `{number}` tabular and the label muted | `checkbox.tsx` |
| When | the existing `RadioGroup` rows Start now and Start on a date; the two `Input type="datetime-local"` for a date | `radio-group.tsx`, `input.tsx` |
| Weekday chips | `ToggleGroup type="multiple" variant="outline" size="sm"` with seven `ToggleGroupItem`s (the kit's toggle group, the port of the Console's `aria-pressed` weekday buttons) | `src/components/ui/toggle-group.tsx` |
| Range | two `Input type="time"` joined by the word "to"; **Add a range** and **Add another window** as `Button variant="link" size="sm"`; a second window repeats the chips and range with a `ghost icon-xs` remove | `input.tsx`, `button.tsx` |
| Time zone | `Select` of IANA names (the current three plus the browser's) | `select.tsx` |
| Next-dial line | `FieldDescription` under the windows; the same text in the panel under the counts and in the table's Started cell | `field.tsx` |
| Folds | P0.3's `AdvancedRow` (chevron `Button size="icon-xs"`, title button, value line, `Separator` above); the New run Session limits fold is the sibling | `parts/advanced.tsx`, `parts/deploy.tsx` |
| Fold tick | `Tick` on `AgentBuilderTickGlyph`, gray, when the fold differs from the defaults | `parts/common.tsx`, `src/components/console/agent-builder/agent-builder-tick.tsx` |
| Pacing fields | `InputGroup` with `Input type="number"` and a trailing unit addon where there is one (min, per s); `min` 1, `max` 10 on Sessions at once | `input-group.tsx` |
| Call policy, Transfer | `CallPolicyFolds` lifted from P0.9's `GoLiveNumberSheet`: the fields P0.9 lists, plus Ring timeout (`InputGroup`, s addon) and On voicemail (`Select` Leave a message / Hang up) when `outbound` | `parts/deploy.tsx` (shared), `input-group.tsx`, `select.tsx`, `checkbox.tsx` |
| Session limits | P0.3's fold, unchanged | `parts/deploy.tsx` |
| Estimate line | one `console-type-body` paragraph above the footer with the (i); **Add card** as `Button variant="link" size="sm"` | `parts/common.tsx`, `button.tsx` |
| Footer reason | P0.1's footer reason line (`FieldDescription` in the footer) | `form-sheet.tsx` |
| Refusal, failure with no field | `Alert variant="destructive"` above the footer with **Add card** or **Try again** (P0.1's and P0.8's alerts) | `alert.tsx` |
| Runs table | `RunsTable` as it is; the Started cell reads `nextDialLine` while waiting; `RunStatusBadge` gray outline for scheduled, running, completed and canceled, `bg-warning-bg text-warning` for paused, `bg-danger-bg text-danger` for failed | `parts/deploy.tsx`, `parts/common.tsx`, `badge.tsx` |
| Row menu | `RunMenu` `DropdownMenu`: Pause or Resume, Run again, Cancel run (destructive text); Cancel run opens the confirm | `dropdown-menu.tsx` |
| Panel | `RunSheet` on `Sheet side="right"` as it is; the counts grid; the `<dl>` with Contact list, Dials from, Calling windows, Pacing, Started; `SessionsTable` | `parts/deploy.tsx`, `sheet.tsx` |
| Status line | a `console-type-body text-muted-foreground` paragraph under the counts (paused, waiting, canceled) | `parts/deploy.tsx` |
| Failure | `Alert variant="destructive"` above the counts with `AlertDescription` | `alert.tsx` |
| Cancel confirm | `AlertDialog` (P0.1's blocked dialog and P0.9's move confirm as siblings) | `alert-dialog.tsx` |
| Panel footer | `Button variant="outline"` Pause or Resume; `Button variant="outline" className="text-destructive"` Cancel run; `Button` Run again | `button.tsx` |
| Minutes banner | P0.8's `Alert` with `bg-warning-bg` and **Add card**, one clause added | `alert.tsx`, `parts/readiness.tsx` |
| Toasts | `toast(title)` and `toast(title, { description })` | `sonner.tsx` |
| Last save | P0.3's View last save `CodeBlock` dialog | `code-block.tsx` |

No new token, component, radius or font size. No stepper, no progress ring, no cost figure, no green anywhere; the only colours are the warning tint on Paused and the unmapped placeholder, the danger tint on Failed, the failure alert and Cancel run's text.

## 4. The sheet and the panel, piece by piece

### The New run sheet

Title **New run** in every mode (a run again is a new run with values filled). Body in order: Name; **Contact list**; **Dial from**; **When**; the four folds; the estimate line. Footer **Cancel** · **Start run** (or **Schedule run** when Start on a date is picked), with the reason line when off.

**Contact list.** The dropzone until a file is read. Then the file line `{file} · {n} contacts`, ` · {r} rows rejected` when any, **Replace** at the right; **Download rejects** on a second line when any; the reject sentence under the box; from a stored run, `{file} · {n} contacts, from {run}.`; from an API-made run, the API sentence above the empty dropzone. Then the mapping table when the prompt has a variable:

| Column | Content |
|---|---|
| Prompt variable | `code` name, first appearance in the prompt then the greeting (P0.4's order) |
| List column | `Select` of the list's columns (the phone column excluded), pre-filled by name; with no match and a P0.4 default, the select reads `Default: {value}` as its first item; with neither, the placeholder "Pick a column" in the warning tone |

**Dial from.** The checkbox rows. With one number in the project it is ticked on open. With none, one line "The project has no numbers yet. Add one from your SIP trunk." with **Carrier checklist** (P0.9's line and link) and Start run off.

**When.**

```
(•) Start now
( ) Start on a date
    [ 2026-09-28T09:00 ]  to  [ 2026-10-02T18:00 ]          (shown when picked)

Calling windows                                                (i)
(Mon)(Tue)(Wed)(Thu)(Fri)(Sat) Sun
[ 09:00 ] to [ 18:00 ]    [ America/Los_Angeles            ▾ ]
Add a range · Add another window
Inside a calling window now, so dialing starts at once.
```

The chips are one tab stop with arrows; a ticked chip is filled (`data-state=on`), an unticked one outlined. A window with no day ticked sends nothing and reads the any-hour line. A day ticked in two windows keeps the first and disables it in the second. The time zone applies to the date and the windows. The next-dial line reads `nextDialLine(schedule, now)` on every change.

**Pacing** expanded:

| Field | Control | API | Default, rule (in the (i)) |
|---|---|---|---|
| Sessions at once | `InputGroup` number, max 10 | `pacing.max_concurrent` | 10; 1 to 10, the project limit |
| Dials per second | `InputGroup` number, addon per s | `pacing.max_calls_per_second` | empty means no extra limit; 1 or more; above the project limit the run is refused |
| Attempts per contact | `InputGroup` number | `pacing.max_attempts` | 3; 1 or more |
| Wait between attempts | `InputGroup` number, addon min | `pacing.retry_backoff_ms` (minutes times 60000) | 10; whole minutes, 1 or more |

**Call policy** expanded (`CallPolicyFolds` with `outbound`): Ring timeout (s, `max_ring_duration_ms`), Max duration (min), Max silence (s), On voicemail (`voicemail.mode`, Leave a message = `continue`, Hang up = `hangup`), Agent may end the session (the four rules), all as P0.9 lists them with the rule lines below. **Transfer** expanded: P0.9's two fields and the suggested line. **Session limits**: P0.3's.

Value lines: Pacing `pacingLine`; Call policy `runCallPolicyLine`; Transfer `transferLine`; Session limits "30 s idle · 72 h at most" (P0.3's values in words). Each fold ticks gray when its values differ from the defaults.

**The estimate line.** Shown once a list is read: `estimateLine(contacts, avgMinutes, billing)`. Four shapes: plain ("… 1,800 free minutes left."), over ("… 600 free minutes left, so the run pauses when they run out unless a card is on file." with **Add card**), card on file ("… Billed past the free minutes."), no billing read (the first sentence alone). The (i): "Contacts times the average length of this agent's sessions so far. An estimate, not a bill."

### The Runs table

Unchanged columns. Status chips per section 3. Progress `{done} of {contacts}`; Started reads `startedAt`, "Waits for Mon 09:00" while the run waits for a window, or "Mon, Sep 28, 09:00" for a scheduled run. The row menu offers Pause or Resume (running or paused), Run again, Cancel run (running, paused or scheduled).

### The run panel

Title `{run.name}` with the chip. The failure alert first when `failure` is set. The counts grid. The status line under it: paused (user), paused (suspended, with **Add card**), waiting (from `nextDialLine`), canceled ("Canceled at {time}."), nothing while dialing. The `<dl>`: Contact list (`{file} · {n} contacts`, plus ` · {r} rejected` and **Download rejects** when Studio holds the rejects; "Uploaded through the API" for an API-made run), Dials from, Calling windows (`windowsLine`, or "Any time"), Pacing (`pacingLine`), Started (`startedAt`, or "Not yet" while scheduled). **Sessions** as today. Footer: **Pause** (running) or **Resume** (paused), **Cancel run** (running, paused, scheduled), **Run again** (always). A failed or canceled run shows Run again alone.

### The cancel confirm

`AlertDialog` at the press of Cancel run: title "Cancel {run}?", body "{pending} contacts are never dialed." plus " The {calling} sessions in progress finish." when any are in flight; buttons **Keep running** · **Cancel run**. From the row menu the same.

### The minutes banner (.g)

P0.8's banner, with the clause ", and {run} is paused" inserted before "Add a card" when a run on this agent has `pauseReason: "suspended"`; unchanged otherwise. P1.7 lifts it to the page level.

## 5. Behaviour

- **Open.** The Runs row's Go live, the header's New run, and Run again open `panel=new-run`; P0.8's open-time `go_live_clicked` no longer fires for batch (it fires at the press, below); the sheet records `openedAt` for `wallMs` and focuses the dropzone (or Replace when a list is pre-filled). `basedOn` pre-fills everything the run holds; an API-made run pre-fills all but the list.
- **Reading the file.** Drop or browse reads the file with `FileReader`, parses with `parseContactList`, and fires `contact_list_uploaded {rows, rejected, columns, uncoveredVars}`. A `no_phone_column` result shows the `FieldError`, keeps no file, and fires `go_live_blocked {codes: list_no_phone}`. Files over 25 MB or 50,000 rows show "The list is too large. Up to 25 MB and 50,000 rows." (the Console's limits). Design mode maps a dropped file name to `FIXTURE_LISTS` by name and otherwise reads the real file.
- **Rejects.** Download rejects builds `rejectsCsv(list)` as a blob download and fires `rejects_downloaded {rejected}`; showing the link fires `cta_viewed {cta: download_rejects}` once per list.
- **Mapping.** `autoMap` on read; each select writes `draft.mapping[variable]`; `uncoveredVariables` drives the footer reason and the block; the first block per sheet open fires `go_live_blocked {codes: batch_uncovered_vars, deploymentType: batch}`.
- **Dial from.** Ticks write `draft.from` as `num_` ids; the estimate line and Start run read `validateNewRun` on every change.
- **When.** Start on a date shows the two datetime inputs, defaults to the next window's start (or tomorrow 09:00) and five days later, and turns the footer button into Schedule run; `end` before `start` is a `FieldError` "The end must be after the start." Chips, ranges and the time zone write `draft.schedule.windows[]` and `timezone`; a range whose end is not after its start is a `FieldError` "The end must be after the start." on the range; a day already in another window is disabled in this one. The next-dial line recomputes on every change from `DESIGN_NOW` in design mode and the clock in the port.
- **Folds.** The chevron and the title toggle; each fold's tick reads its own configured check. Pacing over the limit is a `FieldError` "Enter 1 to 10." on Sessions at once; every number field rounds nothing ("Enter a whole number of minutes.", as P0.9). Call policy and Transfer validate as P0.9's fold does.
- **Estimate.** `avgSessionMinutes(agent)` once per open; `estimateMinutes` on every list or mapping change; the over shape fires `cta_viewed {cta: add_card}` once per sheet open; **Add card** opens `/billing` in a new tab and fires `external_link_opened {surface: billing}`.
- **Start run, Schedule run.** Validates; sends `campaignCreateBody`; fires `go_live_clicked {deploymentType: batch, estMinutes, freeMinutesLeft, contacts, rejected, hasWindows, scheduled, testHeard, repeat, wallMs}` at the press, then on 201 `operation_succeeded {operation: telephony_campaign_create}` and `run_status_changed {to: running | scheduled, trigger: user}`; prepends the run, sets `status: "live"`, toasts "Run {n} started. Dialing {c} at once from {numbers}." or "Run {n} scheduled for {date} at {time}.", closes, and the Readiness list item reads done. On 400 the `Alert` with the detail and Try again; on 403 `AccountSuspended` P0.8's refusal alert; on 429 the `Alert` with the code; each fires `operation_failed {operation: telephony_campaign_create, code, reason}`.
- **Pause, Resume, Cancel.** From the footer or the row menu. Pause sends `:pause`, sets `pausedAtIso` and `pauseReason: "user"`, toasts, fires `operation_succeeded {operation: telephony_campaign_interrupt, action: pause}` and `run_status_changed {to: paused, trigger: user}`; Resume sends `:resume`, clears the pause fields, toasts, fires the pair with `resume` and `running`; Cancel opens the confirm, then sends `:cancel`, moves `pending` into `canceled`, toasts "Run {n} canceled. {pending} contacts were not dialed.", fires the pair with `cancel` and `canceled`. Resume on a suspended account answers 403 and shows the resume refusal with **Add card**, firing `operation_failed {operation: telephony_campaign_interrupt, action: resume, code: 403, reason: AccountSuspended}`.
- **Polling.** The port re-reads `GET /campaigns/{id}` every 10 s while the panel is open and the run is running or paused, and the list every 30 s while the tab is open; a status change seen by polling fires `run_status_changed {to, trigger: api | billing | window}` (billing when the account reads suspended, window when `counts.calling` goes from 0 to more inside a window). Design mode reads the fixture.
- **Run again.** Opens the sheet with `basedOn`; the name reads `Run {n+1} · {today}`; nothing writes until Start run; the event carries `repeat: true`.
- **Review states.** `nr=` and `rs=` never write the store: each renders the sheet, the table or the panel as section 1 describes, with `dep=ready` and `dep=suspended` from P0.8 underneath.
- **Keyboard.** Sheet: Name, the dropzone (Enter opens the picker), Replace, Download rejects, the mapping selects, the number checkboxes, the two radios (one stop, arrows), the date inputs, the chips (one stop, arrows, Space toggles), the range inputs, the time zone, the two add links, the four chevrons and their fields, Add card, Cancel, Start run; Esc closes with no guard (the values are cheap to redo, as P0.9's sheet; a read list is kept in the sheet's draft until the sheet unmounts). Panel: the failure alert's nothing, Download rejects, Open in session history, Pause or Resume, Cancel run, Run again; Esc closes. Table: rows are one tab stop each, Enter opens, the `…` button after.
- **Events per action.** `contact_list_uploaded`, `rejects_downloaded`, `go_live_blocked`, `go_live_clicked`, `operation_succeeded`, `operation_failed`, `run_status_changed`, `cta_viewed`, `external_link_opened`; each logs once through `trackProto`. `channel_connected` and `agent_answered_production` are server events and are not logged.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics (none here). Never: call (outside Call policy), calls, campaign (for one run), batch job, blast, bulk, credits, quota, paused (for the account), live (for running), channel (alone), connect, publish, deploy (verb), launch, activate, preview, prototype.

| Key | Text |
|---|---|
| Runs row, empty (P0.8) | No runs yet. A run dials one contact list with this agent. |
| Row button (P0.8) | Go live |
| Header primary, live batch (P0.8) | New run |
| Sheet title | New run |
| Name label | Name |
| Name value | Run {n} · {Mon d} |
| Contact list section | Contact list |
| Template link | Download template |
| Dropzone | Drop a CSV with a phone column, or browse |
| File line | {file} · {n} contacts |
| File line, rejects | {file} · {n} contacts · {r} rows rejected |
| File line, one reject | {file} · {n} contacts · 1 row rejected |
| File line, stored | {file} · {n} contacts, from {run}. |
| Replace | Replace |
| Rejects link | Download rejects |
| Rejects line | Rejected rows have no phone or a number that is not in E.164. The other {n} are kept. |
| No phone column | No phone column in this list. Name the column phone and put numbers in E.164, then upload it again. |
| Too large | The list is too large. Up to 25 MB and 50,000 rows. |
| API line | {run} was started through the API, so Studio has no copy of its list. Upload it again. |
| Mapping header (P0.4) | Prompt variable / List column |
| Mapping placeholder | Pick a column |
| Mapping default (P0.4) | Default: {value} |
| Dial from section | Dial from |
| Dial from (i) | Dials rotate across the numbers you tick. |
| Number row | {number} {label} |
| No numbers line (P0.9) | The project has no numbers yet. Add one from your SIP trunk. |
| When section | When |
| When options | Start now / Start on a date |
| Date labels | Starts / Ends |
| Date error | The end must be after the start. |
| Windows label | Calling windows |
| Windows (i) | Without windows the run dials at any hour. Each weekday can be in one window. |
| Chips | Mon / Tue / Wed / Thu / Fri / Sat / Sun |
| Range join | to |
| Range error | The end must be after the start. |
| Time zone label | Time zone |
| Add links | Add a range / Add another window |
| Remove window | Remove this window |
| Next dial, none | No calling windows, so the run dials at any hour. |
| Next dial, inside | Inside a calling window now, so dialing starts at once. |
| Next dial, outside | Outside the calling windows now. Dialing starts {Day} {HH:MM}. |
| Next dial, scheduled | Dialing starts {Mon d}, {HH:MM}, inside the calling windows. |
| Fold titles | Pacing / Call policy / Transfer / Session limits |
| Pacing value line | {c} at once · {a} attempts, {w} min apart / … · {d} dials per second |
| Sessions at once label | Sessions at once |
| Sessions at once (i) | Up to 10 in this project. The run dials the next contact as one session ends. |
| Sessions at once error | Enter 1 to 10. |
| Dials per second label | Dials per second |
| Dials per second (i) | Empty means no extra limit. Above the project limit the run is refused. |
| Attempts label | Attempts per contact |
| Attempts (i) | Tries per contact who did not answer. |
| Wait label | Wait between attempts |
| Wait (i) | Whole minutes before the next attempt on the same contact. |
| Number errors | Enter 1 or more. / Enter a whole number of minutes. / Enter a whole number of seconds. |
| Call policy value line | Leaves a message on voicemail. Ends when the person hangs up. / Hangs up on voicemail. Ends after {n} min or {n} s of silence · {n} end rules |
| Ring timeout label | Ring timeout |
| Ring timeout (i) | How long a dial rings before it counts as no answer. Empty leaves it to the carrier. |
| Max duration, Max silence, end rules | P0.9's, with "the person" for "the caller" |
| On voicemail label | On voicemail |
| On voicemail options | Leave a message / Hang up |
| On voicemail (i) | Leave a message lets the agent talk to the voicemail. |
| Transfer fold | P0.9's, unchanged |
| Session limits fold (P0.3) | Session limits / Idle timeout / Maximum duration / Graceful stop |
| Session limits value line | {n} s idle · {n} h at most |
| Estimate | About {est} min for {n} contacts at {avg} min each. {free} free minutes left. |
| Estimate, over | About {est} min for {n} contacts at {avg} min each. {free} free minutes left, so the run pauses when they run out unless a card is on file. |
| Estimate, card | About {est} min for {n} contacts at {avg} min each. Billed past the free minutes. |
| Estimate, no billing | About {est} min for {n} contacts at {avg} min each. |
| Estimate (i) | Contacts times the average length of this agent's sessions so far. An estimate, not a bill. |
| Add card | Add card |
| Footer | Cancel / Start run / Schedule run |
| Reason, no list | Upload a contact list to start. |
| Reason, no phone | Upload a contact list with a phone column. |
| Reason, no number | Tick a number to dial from. |
| Reason, unmapped | Map {variable} to a column, or set a default for it in the prompt. |
| Reason, unmapped, several | Map {variable} and {variable} to a column, or set a default for them in the prompt. |
| Prompt missing (existing) | Write the system prompt before the first run. |
| Started toast | Run {n} started. Dialing {c} at once from {numbers}. |
| Scheduled toast | Run {n} scheduled for {Mon d} at {HH:MM}. |
| Paused toast | Run {n} paused. Sessions in progress finish. |
| Resumed toast | Run {n} resumed. |
| Canceled toast | Run {n} canceled. {pending} contacts were not dialed. |
| Refused, suspended (P0.8) | The account is suspended, so the run was not started. Add a card to reactivate it. |
| Refused, resume | The account is suspended, so the run was not resumed. Add a card to reactivate it. |
| Refused, other | The run was not started ({code}). {detail} |
| Retry | Try again |
| Status chips | Scheduled / Running / Paused / Completed / Canceled / Failed |
| Table Started, waiting | Waits for {Day} {HH:MM} |
| Table Started, scheduled | {Mon d}, {HH:MM} |
| Panel rows | Contact list / Dials from / Calling windows / Pacing / Started |
| Panel list, rejects | {file} · {n} contacts · {r} rejected |
| Panel list, API | Uploaded through the API |
| Panel windows, none | Any time |
| Panel started, scheduled | Not yet |
| Failure alert | The run failed at {HH:MM} ({code}). {message} Reported by {provider}. |
| Failure alert, no provider | The run failed at {HH:MM} ({code}). {message} |
| Paused line | Paused at {HH:MM}. The {n} sessions in progress finish; no new dials until Resume. |
| Paused line, none in flight | Paused at {HH:MM}. No new dials until Resume. |
| Paused line, suspended | Paused at {HH:MM} when the free minutes ran out. Add a card, then Resume. |
| Waiting line | Running. Next dial {Day} {HH:MM}, {zone}, when the calling window opens. |
| Canceled line | Canceled at {HH:MM}. |
| Panel footer | Pause / Resume / Cancel run / Run again |
| Row menu | Pause / Resume / Run again / Cancel run |
| Cancel title | Cancel {run}? |
| Cancel body | {pending} contacts are never dialed. The {calling} sessions in progress finish. |
| Cancel body, none in flight | {pending} contacts are never dialed. |
| Cancel buttons | Keep running / Cancel run |
| Banner, run paused (P0.8 plus one clause) | The account is suspended, so new sessions are refused and production agents are silent, and {run} is paused. Add a card to reactivate it. |
| Readiness list item (P0.8) | {file} · {n} contacts, from {run}. |
| Last save entries | POST /campaigns · 201 / POST /campaigns · 400 / POST /campaigns · 403 / POST /campaigns/{id}:pause · 200 / POST /campaigns/{id}:resume · 200 / POST /campaigns/{id}:resume · 403 / POST /campaigns/{id}:cancel · 200 / GET /campaigns/{id} · 200 |

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (call, calls, campaign, batch job, blast, bulk, credits, quota, connect, publish, deploy, launch, activate, live, channel, preview, prototype, simulated, mock, wireframe, arrows, em dashes; "call" allowed only in "Call policy"). A grep of the changed files must find no contact row in `sessionStorage` and only the first three in `lastSave`. P0.1, P0.2, P0.5, P0.6 and P0.7 routes unchanged; P0.3's fold, P0.4's mapping readings, P0.8's banner and event timing, and P0.9's folds touched only as declared. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 deployment-ready, 02 new-run-empty, 03 list-mapped, 04 number-picked, 05 windows-and-pacing, 06 estimate-start, 07 started-live, 08 run-first-reached, then rainy 09 b-rejects, 10 b-no-phone, 11 c-unmapped, 12 c-mapped, 13 d-closed-before, 14 d-waiting-window, 15 e-failed, 16 e-run-again, 17 f-over-minutes, 18 g-banner-paused, 19 g-paused-minutes, 20 g-resume-refused, 21 h-paused, 22 h-cancel-confirm, 23 h-canceled, 24 i-again-api, 25 again-stored-list.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.10 · Have the agent dial a list of people` after P0.9's, child sections 1 JTBD, 2 Research (the 12 shots in `02-research.md` with their regions: the 10 files in `shots/` plus the 2 reused from `competitors/product/*` by path), 3 Flow (25 story frames), 4 Hero (the New run sheet at step 5 with the list mapped, the number ticked, the windows Mon to Sat, Pacing expanded and the estimate line; the run panel at step 8 with the counts, the rows and the first session; the sheet at .b with the reject count and Download rejects), 5 Rationale with the three links. Owner ask of 26 Sep: add a child section **UI Explorations** with 3 to 5 native variations of the first hero screen (the New run sheet at step 5), each meticulously built from the kit on page 31:2 with variables bound, never detached, hero screens only, nothing interactive, grounded in Refero and tagged with its source per `explorations/brief.md` (Cake Equity `3d594775-fa66-4141-80ca-0ef2481247b6` for the reject line next to the action; Reclaim `8802edb7-9177-438b-9454-6c82c879d9a2` for the weekday chips; time2book `2c69f2b2-2563-4195-a689-de1436206f6c` for a right sheet with day picks and a summary; Pinterest `25889a97-1047-4167-846b-7dbc11c28c6c` for a schedule block beside a budget; Kickstarter `ef7a16ff-b3c0-4c3a-a12b-20a7dbe1975a` for an estimate breakdown before the commit; Acuity `2c65d68c-ca8c-44fa-bcb7-b3e68354884a` for an import preview of the first rows; Mercury `5ec7d8ae-089b-4e3a-b1bf-e231b9975388` for a form with a live summary beside it; P0.9's Polar and Dock for the compact side sheet). Logos: none, since no vendor module or carrier is named on this screen; lucide `Upload`, `Download`, `ChevronDown`, `Info` and the kit's gray tick are the only glyphs. Load `figma:figma-use` first.
