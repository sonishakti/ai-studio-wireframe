# P0.9 Let callers reach the agent · UI Explorations brief

Track: **v3**. Scope: this folder only (`references/v3/features/P0.9/explorations/`). Static Figma frames, no interaction, in a child section named **UI Explorations** under `P0.9 · Let callers reach the agent` on page `v3 · P0 Agent config` of file `OIKZExT265nOJotBlmv2Ah`. Owner ask of 26 Sep: 3 to 5 variations of one hero screen, meticulously built from the kit on page 31:2 with variables bound, never detached; Refero-grounded, every reference tagged with its source. Written by the Design phase so the Figma pass has the grounding; the Figma pass owns the frames.

## The hero screen

**Flow file (after the build):** `flow/03-call-policy-set.png`, the Go live sheet at happy step 3. URL `/v3?concept=a&view=agent&agent=agent_clinic&tab=deploy&dep=ready&panel=go-live&num=policy&fold=call-policy`. It is the one screen where the whole job step is visible at once: the number picked, the limits set, the end rules ticked, the transfer waiting, and the button that commits it.

**Content the hero must show (real copy and data only, from `05-build-spec.md` §6 and the fixtures):**

| Element | Content |
|---|---|
| Sheet title | Go live |
| Source rows | (•) A number in this project · ( ) A new number on your SIP trunk |
| Number select | +1 628 555 0110 · Spare |
| Fold 1, header | ✓ Call policy (gray tick, expanded) |
| Max duration | 10, addon min, (i) |
| Max silence | 30, addon s, (i) |
| End rules label | Agent may end the session |
| End rules | [✓] When the conversation is complete · [✓] When the caller asks to end it · [ ] When a fax machine answers · [ ] When another AI assistant answers |
| Fold 2, header | Transfer · None (collapsed, no tick) |
| Footer | Cancel · Go live (enabled) |
| Behind the sheet | The Deployment tab of Clinic reception (Draft): Readiness two ticks and the pending number line, Retention on 30 days, the Numbers row with Go live |

Dark theme, Console tokens only (`WT/src/styles.css`), MiSans, `FormSheet size="compact"` width, no shadow on the sheet body, no green, no red.

## Refero grounding (tag each frame with the source it leans on)

Refero has no indexed screen for any voice-AI vendor's number, SIP or call-policy pages (checked this session and in P0.4's research). What it has:

| Source | Refero id | What to take | What to leave |
|---|---|---|---|
| Zendesk Talk, number setup and call test | flows 1358, 1396; shots `shots/refero-zendesk-01..04` | the idea that setup ends on a real inbound call; the checklist beside a live card as a composition for a variation that shows the reach line under the sheet | the stepper, the online/offline presence toggle |
| Polar, Create Benefit side sheet | `6a15e519-29fb-4056-bddb-677b5588de88`, `3a883691-e532-4baa-b889-99193349cf03` | a compact side sheet with stacked labelled fields and toggles, one filled button | the shadowed white surface |
| Dock, Workspace Settings sheet | `37832ac7-0494-4d45-b433-edfb5cffc4db` | inputs, a checkbox group and advanced options in one right sheet with bottom actions | the three-column page behind it |
| Fingerprint, rule editor drawer | `4b844e0b-0d1e-4067-a812-aec62749fe88` | condition groups with boolean toggles and an add/remove rhythm, for a variation that lays the four end rules as a rule list | the orange Save, the canvas |
| X, Muted notifications | `7cc96857-b010-4877-95ba-edb87fe78de7` | a dark checkbox list with one line per rule and a learn-more link, for the end rules | the three-column layout |
| Typefully, notification settings modal | `8707db0a-550a-4967-b737-b3f10c5cabe2` | dark modal with sectioned checkbox lists and a quiet change link | the modal itself (ours is a sheet, ADR 0015) |
| Cursor, Privacy Settings modal | `33c42658-b8ed-47d5-86bf-ab702d4b24a6` | a "More options" disclosure fold below the main choice, for the collapsed Transfer fold | the muted card tint |

Our own before shot `shots/before-02-connect-number-sheet.png` and P0.8's Go live sheet are the baseline every variation is diffed against.

## Variations to try (3 to 5)

1. **The spec as drawn.** Two folds under the number, Call policy expanded, Transfer collapsed (baseline for the diff).
2. **Rules as a list.** The four end rules as a bordered list with the checkbox at the left of each row and the limits above it in a two-column grid (Fingerprint, X).
3. **Summary first.** The collapsed value line of each fold rendered as the fold's own subtitle in the header, so the sheet reads as a summary before it is opened (Cursor's disclosure).
4. **Reach line preview.** The sheet with the Numbers row visible behind it already reading "Not reached yet. Dial it to hear the agent.", to show the end-on-a-call idea in the same frame (Zendesk Talk).
5. **Edit number.** The same sheet in edit mode for Front desk, both folds ticked and pre-filled, footer Cancel · Save (Dock).

## Icons and logos

- Glyphs: lucide `PhoneIncoming` (the inbound type badge), `ChevronDown` and `ChevronUp` (the folds), `Info` (the (i)), the kit's gray tick. No new icon.
- Logos: none on this screen. No vendor module (Deepgram, OpenAI, Cartesia) and no carrier is named; the API has no carrier field. A carrier wordmark (Twilio, Telnyx) may appear only in a variation that shows the .b state's Carrier checklist link, tagged as a logo in the frame name.

## Rules that still apply

Existing Console design system only; tokens from `src/styles.css`; sentence case, no arrows, no em dashes; every string from the copy table, nothing invented; empty first (nothing pre-filled that Sam did not type); the tick is gray and means "you configured this"; no green, no red, no badge on the number; frames named `UI Exploration 0n · <idea> · refero:<id>`.
