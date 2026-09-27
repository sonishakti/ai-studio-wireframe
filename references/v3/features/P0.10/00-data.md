# P0.10 Have the agent dial a list of people · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.10], `02-research.md` rule 0 (12 shots: 10 files in `shots/`, 2 reused from `competitors/product/*`), the v3 API snapshot `references/api/v3/openapi-2026-09-24-ih7axj9zx.json` (schemas `Campaign`, `CampaignPatch`, `CampaignSchedule`, `ImmediateSchedule`, `ScheduledSchedule`, `CallingDay`, `TimeRange`, `ContactInput`, `TemplateVariables`, `Pacing`, `CampaignTransport`, `CallPolicy`, `VoicemailPolicy`, `EndCallPolicy`, `TransferPolicy`, `Lifecycle`, `Failure`, `ErrorResponse`; paths `/campaigns`, `/campaigns/{id}`, `:pause`, `:resume`, `:cancel`). The `3.0.0` snapshot carries the same campaign shapes. ClickUp task 868m9wg5q has no comments, so there are no change notes. Requirements 7 (the contact list out of config, into Go live) and 48 (calling windows, dial rate, call policy, end rules, transfer). Funnel stages 9 `channel_connected {batch}` and 10 `agent_answered_production` (derived, provisional: `counts.completed` of 1 or more). Journeys BA, RK, ST. Depends on P0.8 (the Deployment tab, Readiness, the Runs row's Go live opening `panel=new-run`, the minutes banner, `dep=` states, `ProjectNumber` ids), P0.4 (the mapping table's third reading and `agent.variables`), P0.3 (the Session limits fold and `Run.lifecycle`), P0.9 (the Call policy and Transfer folds, `isE164`), P0.7 (`lastTestHeard`). P1.7 owns the page-level minutes banner and reactivation; P1.x monitoring owns the run's sessions over time.

## What the flow shows

| Screen | Data it needs |
|---|---|
| The Deployment tab on the tested draft batch agent (.a step 1) | `agent_reminders` (batch, draft, prompt with three variables, a heard test on its current version, no runs), the project's numbers, a billing state with free minutes left |
| New run with the list dropped (.a step 1) | A parsed CSV: file name, row count, columns, rejected rows with a reason each, the prompt's variables matched to columns by name |
| The from number (.a step 2) | `PROJECT_NUMBERS` with ids (`num_…`), since `transport.from` takes `num_` ids, not E.164 strings |
| Calling windows, pacing, call policy, voicemail, lifecycle (.a step 3) | `CampaignSchedule` (immediate or scheduled, `timezone`, `days[]` of `CallingDay { weekday, ranges[] }`), `Pacing`, `CampaignTransport.call_policy` (`max_ring_duration_ms`, `max_call_duration_seconds`, `max_silence_duration_ms`, `voicemail.mode`, `end_call`, `transfer`), `Lifecycle` (P0.3), the design-mode clock so "inside a window now" is stable |
| The estimate against free minutes left (.a step 4) | Contacts times the average session length of this agent so far (its test sessions when no production session exists); free minutes left from billing, which sits outside the v3 API (G9) |
| The run after Start (.a step 4) | `Campaign` with `status`, `counts`, `started_at`; the agent's status live; the Readiness list item done with the list name |
| The first contact reached (.a step 4, KPI) | `counts.completed` of 1 or more and the first session row of the run |
| .b bad rows | A list with rows whose phone is empty or not E.164 (`^\+[1-9][0-9]{1,14}$`, the `ContactInput.phone` pattern); a list with no phone column at all |
| .c uncovered variable | A list whose columns miss one prompt variable that has no default (P0.4's `agent.variables`) |
| .d closed windows | Windows Mon to Fri while the design-mode clock is Saturday 14:05; the API's rule that an immediate campaign is `running` from creation and `started_at` is set, with no next-start field |
| .e failed | A run in `status: failed` with `failure { code, provider, message, at }` |
| .f over the free minutes | Free minutes left below the estimate, no card on file |
| .g suspended mid-run | Billing state suspended, the run `paused`, and the time it paused; the API has no pause reason, so Studio infers it from the billing state |
| .h pause, resume, cancel | `:pause`, `:resume`, `:cancel` and their effect on `counts` (in-flight sessions finish; pending become `canceled`) |
| .i created through the API | A run whose contacts Studio never held (`GET /campaigns/{id}` returns `counts`, never `contacts`) |
| Run again | A run whose list Studio stored at creation, so the sheet pre-fills it |

## What a new account lacks

Everything but the presets. A brand-new account has no agent, no number, no run, no list and no session, so the whole flow is created by Sam: an agent (P0.1), a prompt with variables (P0.4), a heard test (P0.7), and then this row's list and run. Agora sells no numbers, so `PROJECT_NUMBERS` is empty until a SIP number is added (P0.9.b) and the Dial from list is empty with one line. There is no contact object in the API, so a list lives only inside the `POST /campaigns` body; Studio keeps its own copy of the file so Run again can pre-fill it, and an API-made run has no copy (.i). Free minutes are read from billing, not from the v3 API, so the estimate line renders without the second sentence when billing cannot be read (P1.7.i). A failed run and a mid-run suspension never exist on a fresh account; the fixtures seed them on `agent_reminders` under review URLs only.

## API truth per field (checked against the ih7axj9zx snapshot)

| Field | In spec | Default | Notes |
|---|---|---|---|
| `POST /campaigns` `name`, `agent_id`, `transport`, `contacts`, `schedule` | yes, required | | `schedule` is required even for Start now (`{ mode: "immediate" }`) |
| `contacts[].phone` | yes | | `^\+[1-9][0-9]{1,14}$`; a row failing it is rejected by Studio before the send (.b). `minItems: 1`, so a list with every row rejected cannot be sent |
| `contacts[].variables` | yes | | `TemplateVariables`: string, number or boolean per key. Studio fills them from the mapped columns; an unmapped variable with a default (P0.4) is sent with the default; an unmapped variable with no default blocks the start (.c) |
| `transport.type`, `transport.from` | yes | | `telephony` only; `from` is one `num_` id or an array of them. Studio sends an array of the ticked numbers |
| `transport.call_policy` | yes | omitted | `CallPolicy`: `max_ring_duration_ms` (min 1), `max_call_duration_seconds` (min 1), `max_silence_duration_ms` (min 1), `voicemail.mode` (`continue` or `hangup`; omission adds no voicemail hangup, so the honest default reads Leave a message), `end_call` (four booleans, all false), `transfer` (E.164 and a 1 to 1000 character line). P0.9's fold, plus Ring timeout and On voicemail, which exist only on an outbound run |
| `pacing.max_concurrent` | yes | 10 | The project limit is 10 (the brief); the field caps at it |
| `pacing.max_calls_per_second` | yes | none | "The only dial-rate control; values above the project limit are rejected." Replaces the Console's delay ms. Empty means no extra limit |
| `pacing.max_attempts` | yes | 3 | |
| `pacing.retry_backoff_ms` | yes | 600000 | Shown in whole minutes (10) |
| `schedule.mode` | yes | | `immediate` or `scheduled`; a scheduled run needs `timezone`, `start` and `end` (`YYYY-MM-DDTHH:MM`, local, `end > start`) |
| `schedule.timezone` | yes | | IANA; required whenever `days` is set |
| `schedule.days[]` | yes | none | 1 to 7 `CallingDay { weekday: mon…sun, ranges: TimeRange[1..10] }`, each weekday once, ranges on a day never overlap. `TimeRange { start: "HH:MM", end: "HH:MM" or "24:00" }`, `end > start`. Without `days` the run dials at any hour |
| `lifecycle` | yes | 30 s idle, 72 h, no graceful stop | P0.3's Session limits fold, unchanged |
| `Campaign.status` | yes | | `scheduled`, `running`, `paused`, `completed`, `canceled`, `failed`. "An immediate campaign enters running when creation is accepted"; running means dial tasks are eligible, so a run outside its windows is still `running` (.d) |
| `Campaign.counts` | yes | | `contacts`, `pending`, `calling`, `completed`, `failed`, `canceled`; the last five sum to `contacts`. `completed` of 1 or more is the KPI's first contact reached |
| `Campaign.started_at`, `completed_at` | yes | | `started_at` null while scheduled |
| `Campaign.failure` | yes | null | `{ code, provider?, message, at }` (.e) |
| A next-start or next-dial field | no | | Studio computes the next dial time from `schedule.days` and the timezone (.d) |
| A pause reason | no | | Studio infers "free minutes ran out" from the billing state at the time of the pause (.g, open question 1) |
| Returned contacts | no | | `GET /campaigns/{id}` never returns `contacts`; Run again needs Studio's own copy (.i) |
| Rejected rows | no | | Rejection is Studio's, before the send; the API would answer 400 `InvalidFieldValue` on the first bad phone |
| `data_policy` on a campaign | no | | P0.8.d, unchanged: run sessions are kept 30 days |
| Free minutes, a card, suspension | no | | Billing is outside the v3 API (G9). `AccountSuspended` on `POST /campaigns` and `:resume` is the one billing signal the API gives |
| Estimated minutes | no | | Studio's own arithmetic: contacts times the average session length so far |
| `:pause`, `:resume`, `:cancel` | yes | | Pause stops new dials while in-flight sessions finish; cancel ends the run for good and pending contacts become `canceled` |

## Where it exists outside our accounts

- Our own sheet today, `shots/before-02-new-run-sheet-empty.png` and `before-03-new-run-sheet-list-mapped.png` (the dropzone, the mapping table, the checkbox numbers, When, the pacing fold); our own run panel, `before-05-run-detail-running.png` (counts, the per-session table, Pause and Run again).
- Weekday chips: Reclaim, `shots/refero-reclaim-01-weekday-hours-settings.png`; the current Console's `CampaignCallWindowEditor` (weekday buttons, start and end per range, Add day) in `src/features/telephony/campaigns/campaign-surfaces.tsx`, the port source.
- A reject count next to the upload: no vendor; Cake Equity's inline banner, `shots/refero-cakeequity-01-import-validation-error.png`, is the cross-category precedent; Bland reports invalid rows in a separate log, `shots/bland-01-invalid-number-faq.png` (the floor).
- A capped concurrency control with the cap explained inline: Vapi, `shots/vapi-01-contacts-preview-hides-columns.png`.
- A three-way end state (done, partly done, failed outright): Bland, `shots/bland-02-batch-statuses.png`.
- An empty batch list: ElevenLabs, `competitors/product/elevenlabs/elevenlabs-18m-batch-list-empty.png`; ours, `shots/before-01-runs-tab-survey-draft.png`.
- Not captured anywhere: an estimate against free minutes before starting, a start-now-outside-window state, a pause reason from billing. Designed from the API shape and the row's own recovery text; the prototype shows them from fixtures and URL states.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Names below are the contract for the build; the build may place them where the file's order wants. Every change is additive: no seed loses a field. Builds land in id order, so this row starts on P0.9's commit; if P0.8's is absent at build time, `ProjectNumber` with ids, `lastTestHeard`, `readReadiness` and the `dep=` states are made here exactly as P0.8's `00-data.md` names them, and P0.8 takes them over; if P0.9's is absent, `isE164`, `InboundCallPolicy`, `EndCall`, `Transfer`, `callPolicyLine` and `transferLine` are made here as P0.9's `00-data.md` names them; if P0.4's is absent, `agent.variables` is added here as its `00-data.md` names it.

1. Types:

   ```ts
   type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
   type TimeRange = { start: string; end: string }                     // "HH:MM", end may be "24:00"
   type CallingWindow = { days: Weekday[]; ranges: TimeRange[] }        // one Console window: its days, its ranges
   type RunSchedule = {
     mode: "immediate" | "scheduled"
     timezone: string                                                  // IANA; the browser's when nothing is picked
     start?: string; end?: string                                      // "YYYY-MM-DDTHH:MM", scheduled only
     windows: CallingWindow[]                                          // [] means any hour
   }
   type RunPacing = { maxConcurrent: number; maxCallsPerSecond?: number; maxAttempts: number; retryBackoffMs: number }
   type RunCallPolicy = InboundCallPolicy & { maxRingMs?: number; voicemail: "continue" | "hangup" }   // P0.9's shape plus the two outbound fields
   type RejectReason = "empty_phone" | "not_e164"
   type RejectedRow = { line: number; phone: string; reason: RejectReason }
   type ContactList = {
     name: string
     rows: number                                                      // rows in the file, header excluded
     contacts: number                                                  // rows kept
     columns: string[]                                                 // header names, the phone column first
     rejected: RejectedRow[]
     stored: boolean                                                   // Studio kept a copy (false for an API-made run)
     sample: Record<string, string>[]                                  // up to 3 kept rows, for the mapping preview and the body
   }
   type RunFailure = { code: string; provider?: string; message: string; at: string }
   type Run = {
     …P0.3's fields (id, name, listName, status, contacts, completed, failed, canceled, calling, startedAt, from, schedule, maxConcurrent, successRate, lifecycle?)
     list?: ContactList                                                // absent on an API-made run
     mapping?: Record<string, string>                                  // prompt variable to list column
     scheduleV3?: RunSchedule                                          // `schedule` stays the display line
     pacing?: RunPacing
     callPolicy?: RunCallPolicy
     source: "console" | "api"
     createdAtIso: string; startedAtIso?: string
     failure?: RunFailure
     pausedAtIso?: string; pauseReason?: "user" | "suspended"
     estMinutes?: number
   }
   type Billing = { freeMinutesLeft: number | null; cardOnFile: boolean; suspended: boolean }
   type NewRunDraft = {
     name: string; list?: ContactList; mapping: Record<string, string>; from: string[]     // num_ ids
     schedule: RunSchedule; pacing: RunPacing; callPolicy: RunCallPolicy; lifecycle: SessionLifecycle
   }
   ```

2. `WEEKDAYS` (mon…sun with the labels Mon…Sun), `DEFAULT_PACING` (10, none, 3, 600000), `DEFAULT_RUN_CALL_POLICY` (no limits, `voicemail: "continue"`, `EMPTY_END_CALL`), `EMPTY_SCHEDULE` (`immediate`, the browser's timezone, `windows: []`), `DESIGN_NOW = "2026-09-26T14:05:00-07:00"` (Saturday, America/Los_Angeles; every "now" in design mode), `BILLING: Billing = { freeMinutesLeft: 1800, cardOnFile: false, suspended: false }`, `LIST_TEMPLATE_CSV` (header `phone,patient_name,appointment_time,doctor` and one example row), `PROJECT_MAX_CONCURRENT = 10`.
3. `parseContactList(name, text): ContactList | { error: "no_phone_column" | "empty" }`: the phone column is the header named `phone` or `phone_number` (case-insensitive), any position; a row is rejected with `empty_phone` when it is blank and `not_e164` when it fails `isE164` (P0.9's); other columns are variables. `rejectsCsv(list)`: the rejected rows as a CSV with `line`, `phone`, `reason` first, then the row's other columns, named `<file>-rejects.csv`.
4. `autoMap(variables, columns)`: each variable to the column of the same name when it exists. `uncoveredVariables(variables, mapping, defaults)`: variables with neither a mapped column nor a default (P0.4's `agent.variables`). `variablesLine` is P0.4's.
5. `isInsideWindow(schedule, nowIso)` and `nextDialAt(schedule, nowIso): string | null` (the next `start` in the timezone on a ticked weekday, `null` when no windows); `nextDialLine(schedule, nowIso)` gives the three sentences in the copy table; `windowsLine(schedule)` gives "Any time" or "Mon to Sat, 09:00 to 18:00, America/Los_Angeles" (a run of consecutive days collapses to "Mon to Fri", others list "Mon, Wed, Fri"; a second window or range joins with " · ").
6. `pacingLine(pacing)` gives "10 at once · 3 attempts, 10 min apart" and adds " · 2 dials per second" when set. `runCallPolicyLine(policy)` gives "Leaves a message on voicemail. Ends when the person hangs up." with P0.9's limit clauses and rule count ("Hangs up on voicemail. Ends after 10 min or 30 s of silence · 2 end rules"). `transferLine` is P0.9's.
7. `avgSessionMinutes(agent)`: the mean of `durationSec` over the agent's sessions with `durationSec > 0`, rounded to one decimal, `null` when none; `estimateMinutes(contacts, avgMinutes)` rounds up to the nearest 10; `estimateLine(contacts, avgMinutes, billing)` gives the four sentences in the copy table.
8. `validateNewRun(draft, agent, numbers): { reason?: string; codes: string[] }`: `no_list`, `list_no_phone`, `no_number`, `batch_uncovered_vars`, `scheduled_end_before_start`, `range_end_before_start`, `pacing_over_limit`, in that order; the first gives the footer reason.
9. `campaignCreateBody(draft, agent)` for `POST /campaigns`: `name`, `agent_id`, `transport { type: "telephony", from: [num ids], call_policy? }` (the policy omitted when nothing is set), `contacts[]` built from every kept row (`phone` and `variables` from `mapping`, the P0.4 default for an unmapped variable that has one), `pacing` (only fields that differ from the spec defaults, `max_calls_per_second` only when set), `schedule` (`immediate` with `timezone` and `days` when windows exist, else `{ mode: "immediate" }`; `scheduled` with `timezone`, `start`, `end`, `days?`), `lifecycle` (P0.3's `apiLifecycle`). `windowsToDays(windows)`: one `CallingDay` per weekday with the ranges of every window that names it, in weekday order. View last save shows the first three contacts and `"… 497 more"`.
10. `runFromCreate(body, draft, now)`: the design-mode `Campaign` answer, `status: "running"` (immediate) or `"scheduled"`, `counts` all pending, `started_at` now or null, `source: "console"`, `list` and `mapping` kept, `estMinutes`.
11. `PROJECT_NUMBERS` unchanged from P0.9 (ids `num_0142`, `num_0187`, `num_0188`, `num_0110`, `num_0199`); a number's inbound agent does not stop it dialing out.
12. Seeds:
    - New `agent_reminders` "Clinic reminders": batch, draft, Lowest latency, voice Aria, language `en`, prompt "You are Aria from Northside Clinic. Remind {{patient_name}} about their appointment on {{appointment_time}} with {{doctor}}. Ask them to confirm, or offer to move it through the front desk. Keep every reply under two sentences.", greeting *"Hi, this is Aria from Northside Clinic. Is this {{patient_name}}?"* (agent first, delay 0), `variables: {}`, no integrations, `numbers: []`, `runs: []`, two test sessions (`durationSec` 110 and 130, outcome completed, `runId` undefined, party "Test") so `avgSessionMinutes` is 2.0, `stats: null`, `updatedAt: "Today, 13:40"`, `updatedAtIso: "2026-09-26T13:40:00.000Z"`, `lastTestHeard: { at: "13:52", agentVersion: "2026-09-26T13:40:00.000Z" }`, labels from `studioLabels("batch")`. The journey start.
    - `agent_payments` runs gain `source` (`camp_03` and `camp_02` `console` with `list.stored: true`, `camp_01` `api` with no `list`), `createdAtIso`, `startedAtIso`, `scheduleV3` (Thu 09:00 to 17:00 scheduled windows), `pacing` (10, 3, 600000), `callPolicy` (voicemail hangup), `mapping`. Nothing else changes; `agent_survey` and `agent_draft` unchanged.
    - Fixture lists (`FIXTURE_LISTS`): `patients-oct.csv` (500 rows, 0 rejected, columns `phone, patient_name, appointment_time, doctor`), `patients-oct-raw.csv` (500 rows, 12 rejected: 9 `not_e164`, 3 `empty_phone`, 488 kept), `patients-oct-short.csv` (500 rows, columns `phone, patient_name, appointment_time, provider`, so `doctor` is uncovered), `contacts-no-phone.csv` (columns `name, mobile`, the `no_phone_column` error), `overdue-sep-week4.csv` (600, stored, for Run again on `agent_payments`).
    - Fixture runs on `agent_reminders`, rendered only by review URLs: `camp_r1` "Run 1 · Sep 26" (500 contacts, from `num_0110`, windows Mon to Sat 09:00 to 18:00 America/Los_Angeles, pacing defaults, `startedAtIso` today 14:05); its variants per state: `first` (pending 489, calling 10, completed 1, one session "Today, 14:07", `+1 415 555 0161`, 1m 48s, completed, success yes), `waiting` (windows Mon to Fri, counts all pending, `running`), `failed` (`status: failed`, `failure { code: "TRUNK_UNREACHABLE", provider: "sip.carrier.com", message: "The SIP trunk did not answer for 5 minutes.", at: today 14:19 }`), `pause` (paused by Sam at 14:22, calling 10, completed 1, pending 489), `paused-minutes` (paused at 12:40, `pauseReason: suspended`, completed 140, failed 6, calling 0, pending 354), `canceled` (canceled 489, completed 1, calling 0).
13. Review states by URL (`nr=` for the sheet, `rs=` for the run panel, never written to the store; each renders `agent_reminders` on the Deployment tab unless it names another agent): `nr=list` (`patients-oct.csv` dropped, every variable matched, no number ticked), `nr=from` (the same with `num_0110` ticked), `nr=windows` (the same with Mon to Sat 09:00 to 18:00, Pacing expanded), `nr=estimate` (the same, Pacing collapsed, the estimate line with 1,800 free minutes left), `nr=started` (the sheet closed, `camp_r1` in the table, status live, the toast on mount), `nr=rejects` (`patients-oct-raw.csv`), `nr=no-phone` (`contacts-no-phone.csv`), `nr=unmapped` (`patients-oct-short.csv`, `doctor` unmapped), `nr=mapped` (the same with `doctor` mapped to `provider`), `nr=closed` (Mon to Fri windows on the Saturday clock), `nr=over` (`BILLING.freeMinutesLeft` rendered as 600), `nr=again` (the sheet pre-filled from a stored run: `camp_r1` on `agent_reminders`, or `camp_03` on `agent_payments`), `nr=again-api` (`agent_payments` `camp_01`: no list, the API line). `rs=first`, `rs=waiting`, `rs=failed`, `rs=pause`, `rs=cancel` (the confirm open over `rs=pause`), `rs=canceled`, `rs=paused-minutes` (with `dep=suspended`), `rs=resume-refused` (the same after Resume, the refusal alert). `run=<id>` opens the panel (existing key); `panel=new-run` opens the sheet (P0.3's key).
14. `parts/events.ts` gains `contact_list_uploaded`, `run_status_changed`, `rejects_downloaded`, and `go_live_clicked`, `go_live_blocked`, `cta_viewed`, `external_link_opened`, `operation_succeeded`, `operation_failed` where P0.8 and P0.9 have not added them. `channel_connected` and `agent_answered_production` are server events and are not logged.
15. Tests: `parseContactList` of `patients-oct-raw.csv` gives 500 rows, 488 contacts, 12 rejected with the two reasons, columns with `phone` first; of `contacts-no-phone.csv` gives `no_phone_column`; a `phone_number` header is accepted; `autoMap` matches by name and leaves `doctor` unmapped on the short list; `uncoveredVariables` is `["doctor"]` there and `[]` once mapped or once `agent.variables.doctor` is set; `isInsideWindow` on `DESIGN_NOW` is true for Mon to Sat 09:00 to 18:00 and false for Mon to Fri; `nextDialAt` for Mon to Fri on `DESIGN_NOW` is Monday 09:00 in America/Los_Angeles and `null` with no windows; `windowsLine` collapses consecutive days and lists others; `windowsToDays` gives one `CallingDay` per weekday with merged ranges and rejects an overlap; `estimateMinutes(500, 2)` is 1000 and `estimateLine` gives the over-the-limit sentence at 600 left and the plain sentence with `freeMinutesLeft: null`; `validateNewRun` names `no_list` on the empty draft, `batch_uncovered_vars` on the short list, nothing on the happy draft; `campaignCreateBody` carries `from` as `num_` ids, 500 contacts with three variables each, `schedule.days` with six `CallingDay`s, `lifecycle`, and omits `call_policy` and `max_calls_per_second` when unset; `runCallPolicyLine` covers voicemail continue and hangup; `pacingLine` covers the default and a dial rate; `avgSessionMinutes(agent_reminders)` is 2.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run, which captures the prototype): one batch agent with a prompt that names three variables and a heard test; one project number that may dial out; a CSV of 20 real test numbers the team owns (never a real patient list) with two rows deliberately bad, so the reject count and the download are real; one run started inside a calling window and one started outside it on a weekend; one run paused and resumed from the panel; one run canceled with contacts pending. A failed run needs a trunk that refuses dials at the carrier, and the mid-run suspension needs a staging account with free minutes set near zero by the billing team; neither is produced by Studio. Never sign in or enter credentials for this: the owner creates these in the staging account.
