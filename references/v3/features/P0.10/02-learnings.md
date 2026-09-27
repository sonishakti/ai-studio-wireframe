# P0.10 Have the agent dial a list of people · Learnings

Research phase done 26 Sep (`02-research.md`, 12 shots: 10 files in `shots/`, 2 reused from `competitors/product/*`). Order followed: the row's existing product shots for Retell, ElevenLabs and LiveKit (reused, none re-captured), the batch desk note (`v3/02-research/batch-retention-experiments.md` §1), Refero for the two named gaps (a reject moment next to an upload, weekday hours), Vapi's and Bland's public docs, and the prototype's own before shots. No vendor in the set shows a reject count next to the upload, an estimate against free minutes, or a start-now-outside-window state; those are designed from the API shape and the row's own recovery text.

## 1. The reject count belongs next to the upload, and the fix is a file

- Bland's answer to a bad row is a sentence pointing at a separate log, "Invalid or blank numbers will be skipped automatically and reported in the error logs." (`shots/bland-01-invalid-number-faq.png` region 1000,968,1296,192); Retell names its reserved columns at the point of upload but has no reject moment to show; Cake Equity, outside the category, puts one line next to the action it blocks and leaves the good rows alone (`shots/refero-cakeequity-01-import-validation-error.png` region 15,583,310,32).
- **Change:** the sheet reads the CSV as it lands. The file line grows a count, `patients-oct-raw.csv · 488 contacts · 12 rows rejected`, with **Download rejects** beside it and one sentence under it saying why and that the rest are kept. The start is not blocked by bad rows (the API takes the kept rows), only by a file with no phone column at all, which lands as an error on the dropzone. No log to go looking for; the reject file is the fix list.

## 2. Weekday chips, one row of hours, the Console's own window editor as the port

- Reclaim shows seven day chips, active filled and inactive outlined, with one set of hours (`shots/refero-reclaim-01-weekday-hours-settings.png` region 358,590,222,28). The current Console already ships `CampaignCallWindowEditor`: weekday buttons per window, start and end per range, Add day, Add time range (`src/features/telephony/campaigns/campaign-surfaces.tsx`). Our own New run sheet has neither, only one datetime window (`shots/before-02-new-run-sheet-empty.png` region 1770,1072,726,144).
- **Change:** **Calling windows** lives inside **When**, under Start now and Start on a date, as a `ToggleGroup` of Mon to Sun, one from and to range, the time zone select, **Add a range** and **Add another window**, sent as `schedule.days[]` of `CallingDay { weekday, ranges }`. Empty means any hour and says so in the (i); nothing is pre-ticked. One window covers the clinic's week; the second block exists for the Saturday-morning case the Console already handles.

## 3. Say what happens next before the press, since the API has no next-dial field

- No vendor documents a start-now-outside-window collision (`02-research.md` gap 5); Vapi, Retell and ElevenLabs offer send now or one scheduled window. The v3 API returns `running` from creation and has no next-start field, so a run started on a Saturday with Mon to Fri windows looks stuck unless Studio says otherwise.
- **Change:** one line under the windows, computed from `schedule.days` and the clock: "Inside a calling window now, so dialing starts at once." or "Outside the calling windows now. Dialing starts Mon 09:00." After the press the same arithmetic gives the panel's "Running. Next dial Mon 09:00, America/Los_Angeles, when the calling window opens." and the row's "Waits for Mon 09:00". The status stays the API's; the sentence is Studio's.

## 4. Cap the pace where the cap is, and name the rate the API names

- Vapi's Max Concurrency is a slider with the organisation's ceiling stated inline (`shots/vapi-01-contacts-preview-hides-columns.png` region 1224,320,816,232); ours is an uncapped "Calls at once" number (`shots/before-03-new-run-sheet-list-mapped.png` region 1770,686,1412,306). The Console's "Call delay ms" is the wrong unit: the v3 API's one dial-rate control is `pacing.max_calls_per_second`, and values above the project limit are refused.
- **Change:** the **Pacing** fold reads Sessions at once (max 10, the project limit in the (i)), Dials per second (empty means no extra limit), Attempts per contact and Wait between attempts in minutes; the collapsed value line reads "10 at once · 3 attempts, 10 min apart". Voicemail moves out of the pacing fold into **Call policy**, where the API keeps it, beside Ring timeout, Max duration, Max silence and P0.9's end rules.

## 5. A failed run gets a sentence with the code, the provider and the time; a partial run is not a failure

- Bland splits done, partly done and failed outright into three named statuses with one line each (`shots/bland-02-batch-statuses.png` region 1000,160,1296,256). Our own panel shows a failed session in red with no code, provider or message anywhere, and no Cancel beside Pause (`shots/before-05-run-detail-running.png` region 1770,136,1412,112).
- **Change:** `Campaign.failure { code, provider, message, at }` renders as one destructive alert at the top of the panel, "The run failed at 14:19 (TRUNK_UNREACHABLE). The SIP trunk did not answer for 5 minutes. Reported by sip.carrier.com.", and the footer keeps Run again. A run with failed contacts but a `completed` status stays Completed; the Failed count is the partial story, as Bland's Completed Partial is. The footer grows **Cancel run** with a confirm that names the pending count, since the API's cancel is for good.

## 6. Empty first travels; the estimate is ours alone

- ElevenLabs' batch list is one sentence and one button (`competitors/product/elevenlabs/elevenlabs-18m-batch-list-empty.png` region 1693,691,326,56), the shape our Runs row already has (`shots/before-01-runs-tab-survey-draft.png` region 420,415,2070,95). No vendor shows a per-run estimate before starting (`02-research.md` gap 4): concurrency and minutes are account-wide caps everywhere.
- **Change:** the Runs row and the empty sheet stay as they are. The estimate is one sentence above the footer, "About 1,000 min for 500 contacts at 2 min each. 1,800 free minutes left.", built from contacts times the agent's own average session length, with the (i) saying so; when it exceeds the free minutes it says the run pauses when they run out and offers Add card, and starting is still allowed (P0.10.f). Billing is outside the v3 API, so the second sentence is dropped, never guessed, when it cannot be read.

## 7. Learnings that change the design

1. The CSV is read in the sheet: a count, a reject count, a reject download, and the phone column checked before anything is sent.
2. The mapping table becomes writable: a select per prompt variable, pre-filled by name, blocking the start only when a variable has neither a column nor a default.
3. When grows Calling windows by weekday with a next-dial sentence; the run panel and the row repeat that sentence while the run waits.
4. Pacing is renamed to the API's fields with the project cap in the (i); voicemail, ring timeout, limits, end rules and transfer sit in P0.9's Call policy and Transfer folds.
5. The panel gains the failure alert, the pause line, Cancel run with a confirm, and the .g suspension line; the banner names the paused run.
6. Refero's contribution is a pattern, not a screen: Cake Equity's inline banner and Reclaim's chips, plus generic side sheets and estimate breakdowns for the UI Explorations (`explorations/brief.md`).
