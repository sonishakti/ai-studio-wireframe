# P0.10 Have the agent dial a list of people · UI Explorations brief

Track: **v3**. Scope: this folder only (`references/v3/features/P0.10/explorations/`). Static Figma frames, no interaction, in a child section named **UI Explorations** under `P0.10 · Have the agent dial a list of people` on page `v3 · P0 Agent config` of file `OIKZExT265nOJotBlmv2Ah`. Owner ask of 26 Sep: 3 to 5 variations of one hero screen, meticulously built from the kit on page 31:2 with variables bound, never detached; Refero-grounded, every reference tagged with its source. Written by the Design phase so the Figma pass has the grounding; the Figma pass owns the frames.

## The hero screen

**Flow file (after the build):** `flow/05-windows-and-pacing.png`, the New run sheet at happy step 5. URL `/v3?concept=a&view=agent&agent=agent_reminders&tab=deploy&dep=ready&panel=new-run&nr=windows`. It is the one screen where the whole job step is visible at once: the list read with its count, the variables matched, the number ticked, the calling windows by weekday, the pace, the folded policy, the estimate against the free minutes, and the button that commits it.

**Content the hero must show (real copy and data only, from `05-build-spec.md` §6 and the fixtures):**

| Element | Content |
|---|---|
| Sheet title | New run |
| Name | Run 1 · Sep 26 |
| Contact list, file line | patients-oct.csv · 500 contacts · Replace |
| Mapping table | Prompt variable / List column: `patient_name` reads patient_name · `appointment_time` reads appointment_time · `doctor` reads doctor (selects, filled) |
| Dial from | [✓] +1 628 555 0110 Spare · [ ] +1 415 555 0187 Collections 1 · [ ] +1 415 555 0188 Collections 2 · [ ] +1 415 555 0142 Support line · [ ] +1 415 555 0199 Order line |
| When | (•) Start now · ( ) Start on a date |
| Calling windows | Mon Tue Wed Thu Fri Sat filled, Sun outlined · 09:00 to 18:00 · America/Los_Angeles · Add a range · Add another window |
| Next-dial line | Inside a calling window now, so dialing starts at once. |
| Fold 1 | ✓ Pacing (expanded): Sessions at once 10 · Dials per second (empty) · Attempts per contact 3 · Wait between attempts 10 min |
| Fold 2 | Call policy · Leaves a message on voicemail. Ends when the person hangs up. (collapsed, no tick) |
| Fold 3 | Transfer · None (collapsed, no tick) |
| Fold 4 | Session limits · 30 s idle · 72 h at most (collapsed, no tick) |
| Estimate line | About 1,000 min for 500 contacts at 2 min each. 1,800 free minutes left. (i) |
| Footer | Cancel · Start run (enabled) |
| Behind the sheet | The Deployment tab of Clinic reminders (Draft): Readiness two ticks and the pending list line, Retention on 30 days, the Runs row with Go live |

Dark theme, Console tokens only (`WT/src/styles.css`), MiSans, `FormSheet` standard width, no shadow on the sheet body, no green, no red; the only colour is the gray tick on Pacing.

## Refero grounding (tag each frame with the source it leans on)

Refero has no indexed screen for any voice-AI vendor's batch or campaign pages (checked this session and in this row's research). What it has:

| Source | Refero id | What to take | What to leave |
|---|---|---|---|
| Cake Equity, Upload contacts | `3d594775-fa66-4141-80ca-0ef2481247b6` (flow 6126); shot `shots/refero-cakeequity-01-import-validation-error.png` | one line naming the problem next to the action it blocks, the good rows left alone; a column-type select above each column | the pink banner, the per-row delete, the full-page table |
| Reclaim, Settings › Hours | `8802edb7-9177-438b-9454-6c82c879d9a2`; shot `shots/refero-reclaim-01-weekday-hours-settings.png` | seven day chips, active filled, inactive outlined, one set of hours | the circular chips (ours are the kit's toggle group), the blue |
| time2book, Add a Class side sheet | `2c69f2b2-2563-4195-a689-de1436206f6c` (flow 6310, step 6) | a right sheet with a repeat rule, day picks and a summary block above the actions, for a variation that reads the run as a summary | the white surface, the fitness copy |
| Pinterest, Create campaign | `25889a97-1047-4167-846b-7dbc11c28c6c` | a schedule block (dates, continuous) beside a budget block, for a variation that pairs the windows with the estimate | the red buttons, the objective cards, the stepper |
| Kickstarter, funding calculator | `ef7a16ff-b3c0-4c3a-a12b-20a7dbe1975a` | an estimate built from inputs with its parts listed and one bold result, for a variation that expands the estimate line into a small breakdown (contacts × minutes, free minutes left) | the modal, the green, the currency |
| Acuity Scheduling, import preview | `2c65d68c-ca8c-44fa-bcb7-b3e68354884a` (flow 9855, step 5) | a preview of the first rows under the file, for a variation that shows three contacts with their variables | the full page, the double Import buttons |
| Mercury, Create invoice | `5ec7d8ae-089b-4e3a-b1bf-e231b9975388` | a form on the left and a live summary of what will be sent on the right, for a wide variation | the paper preview, the shadows, the purple |
| Polar, Create Benefit; Dock, Workspace Settings (P0.9's) | `6a15e519-29fb-4056-bddb-677b5588de88`, `37832ac7-0494-4d45-b433-edfb5cffc4db` | a compact side sheet with stacked labelled groups and one filled button | the white surface, the three-column page |

Our own before shot `shots/before-03-new-run-sheet-list-mapped.png` and the flow's `05-windows-and-pacing.png` are the baseline every variation is diffed against.

## Variations to try (3 to 5)

1. **The spec as drawn.** Sections, then four folds with value lines, Pacing expanded, the estimate line above the footer (baseline for the diff).
2. **Summary first.** The folds' value lines and the windows line gathered into one summary block above the footer, in the shape of time2book's class summary: "500 contacts · +1 628 555 0110 · Mon to Sat 09:00 to 18:00 · 10 at once · about 1,000 min", with the folds collapsed under it.
3. **Windows beside the estimate.** The When section laid as two columns, the chips and range on the left and the estimate breakdown on the right (Kickstarter's parts: 500 contacts × 2 min, 1,800 free minutes left), so the two numbers Sam weighs sit side by side (Pinterest's schedule and budget).
4. **Preview the first rows.** The mapping table replaced by a three-row preview of the list with the variable names as column headers and the phone first (Acuity), the selects in the header row (Cake Equity), for a variation that shows what the agent will say.
5. **Wide, with the run on the right.** A standard sheet on the left and the run's summary card on the right, as Mercury previews the invoice: the same content as variation 2 in a card, the button under it.

## Icons and logos

- Glyphs: lucide `Upload` (the dropzone), `Download` (Download template, Download rejects), `ChevronDown` and `ChevronUp` (the folds), `Info` (the (i)), the kit's gray tick. No new icon.
- Logos: none on this screen. No vendor module (Deepgram, OpenAI, Cartesia) and no carrier is named; the run's `transport.from` is a project number, not a carrier. A carrier wordmark (Twilio, Telnyx) may appear only in a variation that shows the no-numbers line's Carrier checklist link, tagged as a logo in the frame name.

## Rules that still apply

Existing Console design system only; tokens from `src/styles.css`; sentence case, no arrows, no em dashes; every string from the copy table, nothing invented; empty first (nothing pre-filled that Sam did not upload or tick); the tick is gray and means "you configured this"; no green, no red, no badge on the run in the sheet; frames named `UI Exploration 0n · <idea> · refero:<id>`.
