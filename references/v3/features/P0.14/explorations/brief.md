# P0.14 Change an agent people reach · UI Explorations brief

Track: **v3**. Scope: this folder only (`references/v3/features/P0.14/explorations/`). Static Figma frames, no interaction, in a child section named **UI Explorations** under `P0.14 · Change an agent people reach` on page `v3 · P0 Agent config` of file `OIKZExT265nOJotBlmv2Ah`. Owner ask of 26 Sep: 3 to 5 variations of one hero screen, meticulously built from the kit on page 31:2 with variables bound, never detached; Refero-grounded, every reference tagged with its source; icons and logos only where a vendor or product is named. Written by the Design phase so the Figma pass has the grounding; the Figma pass owns the frames.

## The hero screen

**Flow file (after the build):** `flow/02-greeting-line-before-save.png`, the greeting sheet at happy step 2. URL `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=agent&section=prompt&panel=greeting&chg=dirty`. It is the one screen where the row's own moment is visible: the save not yet pressed, and one line saying what it will reach.

**Content the hero must show (real copy and data only, from `05-build-spec.md` §6, P0.4's §6 and P0.8's §6):**

| Element | Content |
|---|---|
| Header (behind the sheet) | Front desk · Inbound badge · Production badge · Test · menu; the meta line "Changed Sep 19, 15:02 · Sessions since this change" |
| Tabs | Overview · Agent (active) · Deployment |
| Row behind | System prompt with the Bayview Dental prompt and the ghost door **Greeting and failure message** with its gray tick |
| Sheet title | Greeting and failure message |
| Fields | Who speaks first: The agent · Greeting: *"Thanks for calling Bayview Dental, this is Marcus. How can I help?"* · Delay 500 ms with its (i) · Failure message *"Sorry, could you repeat that?"* |
| Footer line | +1 415 555 0142 answers with this agent, so the change reaches callers on their next session. |
| Footer buttons | Cancel · Save · Save and test (both saves on) |
| Running variant, if a frame shows it | the line plus "The 3 sessions running now keep the agent they started with." |

Dark theme, Console tokens only (`WT/src/styles.css`), MiSans, the sheet at `FormSheet` standard width, flat surfaces, no shadow except the overlay's own, no green, no red, the line in `text-muted-foreground` at 11 px. Never on a frame: publish, deploy, draft, live, rollback, restore, revert, version number, call (outside "caller"), preview, prototype, simulated, mock, wireframe, arrows, em dashes.

## Refero grounding (tag each frame with the source it leans on)

Refero has no indexed screen of a voice-AI console warning on the everyday save; the nearest are settings pages with a save toast, unsaved-changes bars, consequence confirms, and dark sheets with a quiet notice. Searched this session: `refero_search_screens` × 10 ("unsaved changes bar at the bottom with Save and Discard, changes take effect immediately", "publish changes confirmation dialog listing what will change before going live", "edit conflict someone else changed this while you were editing, reload or overwrite", "version history side panel with restore previous version and diff", "toast notification with action button after saving settings dark dashboard", "deployment rollback confirm dialog with warning about what will and will not change", "Vercel deployments list promote to production and instant rollback", "Webflow publish button dropdown publish to selected domains last published", "Notion page history panel restore this version", "settings page warning banner this change applies to all users immediately dark") and `refero_search_flows` × 1 ("publishing changes to a live site with review before publish").

| # | Source | Id | What to take |
|---|---|---|---|
| 01 | Frame.io · branding settings, dark, save toast | `88b22f4c-c0ad-4b81-8ecd-17a8d813997b` | A dark settings workspace whose only feedback is the footer actions and one toast; the after-save frame's toast placement and weight |
| 02 | Cursor · Cloud Agents settings, toast | `a80078ae-821e-4e8c-92d6-7791960954e6` | Label left, control right, toast bottom; the muted helper line under a control as the sibling of our footer line |
| 03 | The Org · unsaved-changes bar and modal | `6274a95e-285d-44af-9169-d65b4a57ef62` | A bottom-right bar that appears only while dirty; one variation puts the line on such a bar instead of the sheet footer |
| 04 | Acctual · unsaved changes; Wittl · draft to active confirm | `a5c01677-92fa-4620-8d62-dc0f85cbf847`, `11636afb-5b26-49bd-95ca-fadc1a4e0fae` (flow 5366) | The confirm the row deliberately does not build (direction 2); one variation shows it to make the cut visible |
| 05 | Doppler · visibility change confirm with acknowledgement boxes | `c790959c-8e4f-495c-9337-2f9ef3dfdb3e` | The anti-pattern: consequence stated, then three boxes to tick; never on our frames |
| 06 | Cal.com · warning banner under a header; Jace AI · rule sheet with an info card, dark | `ab89943c-93f9-4f1d-96f9-ca8b3b79ba5f`, `e0f6d538-8491-482d-a84b-b28e8c667c09` | A quiet notice inside the form body; one variation carries the line as an inline notice above the fields instead of the footer |
| 07 | Memotron · history log modal, dark | `0c2ecd17-3ea1-40c7-8809-7bff14263294` | A chronological log with times and actions; the View last save variation with the `before this change` entry |
| 08 | Twitch · dark modal with toast; Zendesk · permissions save with toast | `ecc0eb32-24ae-4c13-a7eb-a9d745bc34f3`, `838cafe7-2895-4376-99a6-2904e0a43a39` | Toast beside a modal; the after-save frame's rhythm |
| 09 | Mocha · staged changes with a change note before publish | `be786978-b261-44b0-aab3-7e11e87411de` (flow 11612) | The change note the row cuts (nothing stores it); not on a frame |
| 10 | Vapi · versioning callout | `shots/vapi-01-draft-publish-versioning.png` (720,1552,1760,112) | One pinned sentence at the point of action; the line's tone |
| 11 | Vercel · verify then confirm | `shots/vercel-02-confirm-rollback-warning.png` (880,144,1440,736) | Restate what changes before the one button; the line's content, without the extra step |
| 12 | Retell · compare versions | `shots/retell-02-compare-agent-versions.png` (790,808,1504,448) | Before beside after; the View last save variation |
| 13 | ElevenLabs · merge conflicts | `shots/elevenlabs-02-resolving-merge-conflicts.png` (800,312,1600,152) | The silent merge the 412 alert avoids; the conflict variation's reason |
| 14 | Our own page today | `shots/before-01-agent-greeting-panel.png` (976,1144,1504,440) | The empty footer slot the line fills |

## Vendor logos

None on the hero: no vendor module is named on the greeting sheet. No PostHog mark, no carrier mark.

## Icons (lucide)

`phone-incoming` (the Inbound badge), `flask-conical` (the header Test), `ellipsis` (the menu), `info` (the Delay (i)), `check` (the kit's gray tick on the greeting door), `x` (the sheet close), `triangle-alert` (the conflict variation only). 1.5 px stroke throughout. No icon on the line.

## Five directions

### 1 · The line in the footer slot, the pick · within DS
The greeting sheet as built: the line at the left of the footer, Cancel · Save · Save and test at the right; the header's meta line behind the overlay. Refs 01, 02, 10, 11, 14.

### 2 · The line as an inline notice above the fields · within DS
The same sheet with the line as a quiet muted notice row under the title (no tint, no icon), the footer plain. Refs 06, 10. Built to compare reading order: the notice is read before the fields, the footer line at the moment of the press.

### 3 · The after moment · within DS
The sheet closed, the toast "Greeting and failure message saved." with the line as its description, the docked panel playing the new greeting, the header line "Changed today, 14:02 · Sessions since this change". Refs 01, 08.

### 4 · The kept before values · within DS
View last save over the Agent tab: the PATCH entry, then `studio · before this change` with its comment and the undo sentence. Refs 07, 12.

### 5 · The confirm dialog · stretch, the cut made visible
An `AlertDialog` "Save to +1 415 555 0142?" with the line and the running sentence, Cancel · Save · Save and test, over the sheet. Built to show why it lost: a second press on every save, a control for what Agora does by default. Refs 04, 05, 11.

**Four of five (1 to 4) are buildable today inside the existing Console design system; 5 is a deliberate stretch for the owner to react to.**

## Craft checklist (apply to every variation before it is called done)

- One thing to read per frame: what the save reaches. Nothing filled, nothing coloured; the line is muted text, never a banner.
- 8-point spacing; the line aligns to the footer buttons' vertical centre and the sheet's left padding; fields keep `field.tsx` spacing.
- Dark theme, WCAG AA for body and muted text against the sheet's surface token; no green, no red, no tint except the warning tint in the conflict variation if one is added.
- Type scale from `DESIGN.md` only: MiSans 11 / 13 / 14 / 17 px; the sheet title at 14 px medium, labels at 13 px, the line at 11 px muted, spoken lines italic in typographic quotes.
- Real copy only, verbatim from the table above; sentence case; no arrows, em dashes, filler, price, or process words on the frame.
- Variables bound to the kit on page 31:2, never detached; a drift check lists every component used and whether it has a Code Connect mapping.
