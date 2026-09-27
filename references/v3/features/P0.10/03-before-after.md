# P0.10 Have the agent dial a list of people · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 x 1000, scale 2, dark, from the latest preview of concept A. They show the batch Deployment tab, the New run sheet and the run panel as P0.3's commit left them; P0.8 (in review, build not landed) renames the tab Deployment, adds Readiness and Retention above the Runs row, makes the row's button Go live and the header's New run on a live agent, and adds the minutes banner and the suspended refusal; P0.4 adds the "Default: {value}" reading to the mapping table; P0.9 draws the Call policy and Transfer folds on the number sheet. This row starts from those specs and grows what they left to P0.10.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-runs-tab-survey-draft.png` | `…&agent=agent_survey&tab=deploy` | Renewal survey, batch, Draft: the Runs row as one sentence "No runs yet. A run calls one contact list with this agent." and New run (region 420,415,2070,95) |
| `shots/before-02-new-run-sheet-empty.png` | the sheet, nothing uploaded | Name, the dropzone with Download template, Call from with five unticked numbers, When as Start now or Call within a window, the collapsed pacing fold (region 1770,1072,726,144) |
| `shots/before-03-new-run-sheet-list-mapped.png` | the sheet, list attached, pacing expanded | `contacts.csv · 600 contacts` (hardcoded), the read-only mapping table, Calls at once 10, Attempts per contact 3, On voicemail Hang up (region 1770,686,1412,306) |
| `shots/before-04-runs-tab-payments-live.png` | `…&agent=agent_payments&tab=deploy` | Three runs with Status as blue Running and green Completed badges, Progress, Success, Started (region 432,368,2045,368) |
| `shots/before-05-run-detail-running.png` | `…&run=camp_03` | The panel: Pending, Calling, Completed, Failed, Canceled; Contact list, Calls from, Window, Concurrency; the sessions table with one red Failed; footer Pause and Run again (region 1770,136,1412,112) |

## Before · Concept A at P0.3 (e7a91276), with P0.4, P0.8 and P0.9's specs applied

`NewRunSheet`, `RunsTable`, `RunMenu` and `RunSheet` in `src/prototypes/agent-builder-v3/parts/deploy.tsx`, rendered by `DeployArea` for a batch agent; the Runs row's Go live and the header's New run open the sheet (P0.8); P0.3's Session limits fold sits at its end. What is still wrong against the JTBD and the v3 spec:

1. **The list is not read.** Dropping a file sets a name and "600 contacts"; no row is parsed, no phone checked, no reject counted, nothing to download. (red, .b, requirement 7)
2. **The mapping is read-only.** A variable is matched by name or marked "Not in this list"; Sam cannot map it to a differently named column, and the start is allowed with a gap the person will hear. (red, .c, `go_live_blocked batch_uncovered_vars`)
3. **No calling windows.** When offers Start now or one datetime range; `schedule.days` by weekday is unbuilt, so a clinic cannot say "weekdays, 9 to 6". (red, .a step 3, requirement 48)
4. **No word on a closed window.** Starting now with windows closed would show Running and nothing else; the API has no next-start field and Studio says nothing. (amber, .d)
5. **Pacing in the wrong units.** "Calls at once" is uncapped, the dial rate is missing (the Console's delay ms is not in the spec), and voicemail sits in the pacing fold although the API keeps it in `call_policy`. (amber, .a step 3)
6. **No call policy on the run.** Ring timeout, max duration, max silence, end rules and transfer exist in `CampaignTransport.call_policy` and have no field. (amber, .a step 3, requirement 48)
7. **No estimate, no free minutes.** Nothing tells Sam the run will use about 1,000 minutes, or that 600 are left. (red, .a step 4, .f, .g)
8. **A failed run says nothing.** `Campaign.failure` has no home; the panel shows a red Failed session outcome with no code, provider or message. (red, .e)
9. **No Cancel, no pause line.** The footer has Pause and Run again; Cancel is only in the row menu, with no confirm and no pending count; a paused run shows a badge and no reason. (amber, .h, .g)
10. **Green and blue badges.** Completed reads green and Running blue in the table, colour doing the work of the word. (amber, quiet chrome)
11. **API-made runs.** Run again on a run Studio never held the list for would pre-fill nothing and say nothing. (amber, .i)
12. **Locked words.** "A run calls one contact list", "Call from", "Calls at once", "Calls rotate across the numbers you pick": call is a locked word outside API names. (amber, copy)

## After

The same sheet, titled **New run**, reads the CSV as it lands: the file line carries the contact count, the reject count with **Download rejects**, and one sentence on why; a file with no phone column lands as an error on the dropzone. The mapping table gains a select per prompt variable, pre-filled by name, and blocks the start with a footer reason only when a variable has neither a column nor a default. **Dial from** keeps P0.8's checkbox list of the project's numbers. **When** keeps Start now and gains Start on a date, then **Calling windows**: Mon to Sun chips, one from and to range, the time zone, Add a range, Add another window, and one line saying whether dialing starts at once or at the next window. Four collapsed folds follow on P0.3's fold row with a value line each: **Pacing** (Sessions at once, Dials per second, Attempts per contact, Wait between attempts), **Call policy** (Ring timeout, Max duration, Max silence, On voicemail, the four end rules), **Transfer** (P0.9's) and **Session limits** (P0.3's). Above the footer one sentence estimates the minutes against the free minutes left and, when they fall short, says the run pauses when they run out and offers **Add card**; Start run stays on. After the press the run lists in the Runs row, the agent reads Live, and the panel shows the counts, the list with its rejects, the from numbers, the windows, the pacing, and the sessions as they land. The panel's footer reads **Pause** or **Resume**, **Cancel run** (with a confirm naming the pending count) and **Run again** (the same sheet pre-filled with the stored list, or with the line saying an API-made run has none). A failed run shows its code, provider, message and time in one alert; a run paused by a suspension says so and P0.8's banner names it; a run waiting for its window says when it dials.

```
New run                                                             ×

Name
[ Run 1 · Sep 26                                                    ]

CONTACT LIST                                       Download template
┌──────────────────────────────────────────────────────────────────┐
│ patients-oct-raw.csv · 488 contacts · 12 rows rejected   Replace │
│ Download rejects                                                 │
└──────────────────────────────────────────────────────────────────┘
Rejected rows have no phone or a number that is not in E.164. The
other 488 are kept.
┌──────────────────────────────────────────────────────────────────┐
│ Prompt variable            List column                           │
│ patient_name               [ patient_name                    ▾ ] │
│ appointment_time           [ appointment_time                ▾ ] │
│ doctor                     [ doctor                          ▾ ] │
└──────────────────────────────────────────────────────────────────┘

DIAL FROM                                                        (i)
[✓] +1 628 555 0110  Spare
[ ] +1 415 555 0187  Collections 1

WHEN
(•) Start now
( ) Start on a date
Calling windows                                                  (i)
(Mon)(Tue)(Wed)(Thu)(Fri)(Sat) Sun
[ 09:00 ] to [ 18:00 ]   [ America/Los_Angeles              ▾ ]
Add a range · Add another window
Inside a calling window now, so dialing starts at once.

───────────────────────────────────────────────────────────────────
  Pacing            10 at once · 3 attempts, 10 min apart          ⌄
───────────────────────────────────────────────────────────────────
  Call policy       Leaves a message on voicemail. Ends when the    ⌄
                    person hangs up.
───────────────────────────────────────────────────────────────────
  Transfer          None                                            ⌄
───────────────────────────────────────────────────────────────────
  Session limits    30 s idle · 72 h at most                        ⌄
───────────────────────────────────────────────────────────────────

About 1,000 min for 500 contacts at 2 min each. 1,800 free       (i)
minutes left.
                                              [Cancel]  [Start run]
```

```
Run 1 · Sep 26   Paused                                              ×

┌──────────┬──────────┬───────────┬──────────┬──────────┐
│ Pending  │ Calling  │ Completed │ Failed   │ Canceled │
│ 489      │ 10       │ 1         │ 0        │ 0        │
└──────────┴──────────┴───────────┴──────────┴──────────┘
Paused at 14:22. The 10 sessions in progress finish; no new dials until Resume.

Contact list      patients-oct.csv · 500 contacts
Dials from        +1 628 555 0110
Calling windows   Mon to Sat, 09:00 to 18:00, America/Los_Angeles
Pacing            10 at once · 3 attempts, 10 min apart
Started           Today, 14:05

SESSIONS                                       Open in session history
…
                                   [Resume]  [Cancel run]  [Run again]
```

| Before | After | Why |
|---|---|---|
| A file name and "600 contacts" | The CSV read: count, rejected count, Download rejects, one line why; an error on the dropzone for a file with no phone column | .b, learning 1, requirement 7 |
| Read-only mapping, start allowed with a gap | A select per variable, pre-filled by name; the start blocked with a reason only for a variable with neither column nor default | .c, learning 2, P0.4 |
| One datetime window | Calling windows by weekday with a range, time zone, Add a range, Add another window; Start on a date beside Start now | .a step 3, learning 2, requirement 48 |
| Nothing on a closed window | "Outside the calling windows now. Dialing starts Mon 09:00." before the press; the panel and the row repeat it after | .d, learning 3 |
| Calls at once, uncapped; delay ms in the Console | Pacing: Sessions at once capped at 10, Dials per second, Attempts per contact, Wait between attempts | .a step 3, learning 4, API truth |
| Voicemail in the pacing fold; no policy | Call policy fold: Ring timeout, Max duration, Max silence, On voicemail, end rules; Transfer fold (P0.9's) | .a step 3, learning 4, requirement 48 |
| No estimate | "About 1,000 min for 500 contacts at 2 min each. 1,800 free minutes left." with the (i); over the limit, the pause sentence and Add card, start allowed | .a step 4, .f, learning 6 |
| A red session outcome, no failure | The failure alert with code, provider, message and time; Run again keeps the stored list | .e, learning 5 |
| Pause and Run again; Cancel in the menu only | Pause or Resume, Cancel run with a confirm naming the pending count, Run again; the pause line with the time and the in-flight count | .h, .g, learning 5 |
| Green and blue badges | Gray outline chips for scheduled, running, completed and canceled; the warning tint for paused, the danger tint for failed | quiet chrome, DESIGN.md §5 |
| Run again on an API-made run pre-fills nothing | The line "Run 1 was started through the API, so Studio has no copy of its list. Upload it again." over the empty dropzone | .i |
| "calls", "Call from", "Calls at once" | "dials", "Dial from", "Sessions at once"; "call" only in Call policy | copy, locked words |

Nothing new enters the design system: `FormSheet`, `FormSheetSection`, the dropzone button, `Select`, `Checkbox`, `RadioGroup`, `ToggleGroup`, `Input type="time"` and `type="datetime-local"`, `InputGroup` with a unit addon, `FieldError`, `FieldDescription`, `InfoTip`, the P0.3 fold row with the gray tick, `Badge outline`, `Alert`, `AlertDialog`, `DropdownMenu`, a link `Button`, `Progress` and `sonner` with an action all ship today.
