# P0.1 Choose how people reach the agent · UI Explorations brief

Track: **v3**. Scope: this folder only (`references/v3/features/P0.1/explorations/`). Nothing here touches the
locked P0.1 build, `flow/`, or `shots/`. Static Figma frames only, no interaction — a child section named
**"UI Explorations"** on the P0.1 section of Figma file `OIKZExT265nOJotBlmv2Ah` (owner's Figma-agent pass, not part
of this run's output).

## The hero screen

**Flow file:** `references/v3/features/P0.1/flow/04-sheet-inbound.png` (the create-agent sheet with the deployment
type picker open). The ideal, fully-filled state of the same screen is already built natively in Figma as
**Hero 03 · Name and type picked, ready to create** (node `64:3052`, section `62:10`) — name typed, a type card
selected, **Create agent** enabled. That composed state, not the empty or partial fixture screenshots, is the target
for the explorations below, because it is the one screen where Sam's whole job step is visible at once: the name,
the fork between inbound/batch/code, and the button that commits the choice.

**Why this screen carries the job.** P0.1's job statement is "when I create an agent, I want to say once how people
will reach it." Every other P0.1 screen (empty list, error, saving, change-type dialog, untyped-API alert) is a
before- or after-state of this one decision. This is the only screen where the decision itself — three type cards,
one line each, one enabled button — is the entire content of the frame.

**Content the hero must show (real copy and data only, from `05-build-spec.md` §5 and the P0.1 fixtures, never
placeholder text):**

| Element | Content |
|---|---|
| Sheet title | Create agent |
| Name field, label | Name |
| Name field, value | Front desk (matches fixture `agent_frontdesk`, and Figma Hero 03) |
| Type field label | Deployment type |
| Type helper | How people reach the agent. You can change it until its first deployment. |
| Card 1 | **Inbound** · People dial its number and the agent answers. |
| Card 2 | **Batch** · The agent dials a list of contacts, one run at a time. |
| Card 3 | **Code** · Your software starts each session through the API. / Web and app sessions use code over rtc. |
| Selected state | Inbound selected (radio filled) |
| Footer | Cancel · Create agent (enabled, no spinner, no error) |

No vendor, model, or provider name appears anywhere in this screen's copy or data — Inbound/Batch/Code are Agora's
own deployment types (v3 API: `studio_deployment`), not third-party services. See **Logos** below.

## Research

### Refero MCP (mandatory, done first)

8 searches across `refero_search_screens`: create-modal type pickers, provider/logo cards in dark mode, dark
developer-console create sheets, deployment-type onboarding steps, voice-AI agent builders, side-sheet radio groups
with icons, and two more targeted at Vercel/Linear/Supabase/Clerk and Stripe/Resend patterns (sparse hits — kept
using the first six). 10 strong references kept, from 9 different products, saved to
`explorations/refs/NN-<product>-<slug>.png`:

| # | File | Product | What to take |
|---|---|---|---|
| 01 | `01-cartesia-agents-dashboard-create-cards.png` | Cartesia (voice AI vendor) | Three create-entry cards each carry a large tinted icon panel (green/blue/purple) above bold title + one-line copy — icon-forward hierarchy, one accent hue per option, no color repeated |
| 02 | `02-cartesia-text-to-agent-create.png` | Cartesia | Big centered question-style heading ("Text to Agent") with a one-line subtitle directly under it, then the real controls — heading does the explaining, not a caption |
| 03 | `03-cursor-cloud-agents-dark-settings.png` | Cursor (dev tool) | Near-black settings rows, two-column label/description-left, control-right, generous 24 px+ row spacing — the quiet, restrained developer-console density closest to the Console's own tone |
| 04 | `04-glossgenius-assign-role-sidesheet.png` | GlossGenius | Docked side-sheet radio cards: the selected card gets a visibly different fill/border and grows an inline sub-link ("Edit permissions") that only the selected card shows — selection state carries extra detail, not just a checkmark |
| 05 | `05-polar-create-benefit-sidesheet.png` | Polar.sh | Side sheet opens over a dimmed, still-legible parent screen; tight label-above-field rhythm with helper copy directly under each label; a segmented pill control for a two-way type choice on the parent screen |
| 06 | `06-anam-persona-builder-split.png` | Anam (voice AI vendor) | Two-column split: settings/config on the left, a live, real-time preview on the right — configuration and consequence shown side by side |
| 07 | `07-elevenlabs-voice-remix-modal.png` | ElevenLabs (voice AI vendor) | Dark centered modal, one big input as the primary object, suggestion chips as secondary, quiet footer notice |
| 08 | `08-reown-token-picker-dark-cards.png` | Reown (dev tool) | Compact floating dark modal; a single horizontal row of round icon chips (logo-in-circle) replaces a stacked list entirely — the fastest possible three-to-five-way pick |
| 09 | `09-understory-resource-create-centered.png` | Understory | Extremely spacious single centered card, the field label rendered oversized as if it were the page title — one big question, answered in place |
| 10 | `10-excalidraw-support-modal-icon-cards.png` | Excalidraw | Three symmetric columns, each a big colored icon circle over bold title over description over a full-width colored CTA — clearest possible "one of three, pick by column" pattern |

No `refero_search_flows` or `refero_search_styles` calls were needed: the screen is a single static decision, not a
journey, and the Console's own DESIGN.md already fixes the visual language (no new token allowed), so a styles pass
would only re-derive tokens this project cannot change.

### Logos

**None found or fetched — none needed.** This hero screen names no vendor, model, or provider (no Deepgram,
Cartesia, ElevenLabs, OpenAI, Twilio, etc.): Inbound, Batch and Code are Agora's own deployment types, not
third-party services, and the v3 API stores them as plain labels (`studio_deployment`), never a vendor id. The
`explorations/logos/` folder is created and left empty. If a later P0.x or P1.x hero names an STT/TTS/LLM vendor,
that run should fetch its mark from `simple-icons` first.

### Icons

Console icon set is `lucide`. Saved to `explorations/icons/` (10 files, one per name below), covering the three
existing type-card icons plus the small set the five directions below add:

`phone-incoming.svg` (Inbound, existing), `phone-outgoing.svg` (Batch, existing), `code-2.svg` (Code, existing),
`x.svg` (sheet close, existing), `chevron-right.svg` (disclosure / "Edit" sub-link, direction A), `check.svg` and
`circle-check.svg` (selected-state confirmation, directions A/D), `info.svg` (helper line, direction E),
`sparkles.svg` (used only as a candidate for a "new" affordance, evaluate before use — the owner's copy rules ban
decorative flourish words, so keep this icon out of shipped copy contexts), `loader-2.svg` (saving state, unused in
the static hero but kept for consistency with the existing `Spinner`).

## Five directions

All five keep the exact copy table above and one of the FormSheet's two widths from form-sheet.tsx (compact 448 px, standard 736 px); none invent a new deployment
type, a fourth card, or a vendor. "Within DS" = buildable today from `FormSheet`, `Field`, `RadioGroup`,
`Card`/`label`, `Badge`, existing tokens only. "Stretch" = a real layout or IA change worth the owner's look before
it goes near code.

### 1 · Emphasis rail — within DS
**Idea.** Make the chosen card visibly the chosen one without adding a single new color.
**Layout/hierarchy move.** Same vertical stack of three full-width cards. The selected card gets a 2 px solid rail
flush on its left inner edge in `border-foreground/60` (the token the selected card already uses), and its icon
swaps from the quiet outline treatment to a small filled roundel (`bg-muted`, icon in `foreground`); the two
unselected cards stay flatter and quieter than today, not just unhighlighted.
**Signature detail.** The rail is the only new mark in the entire sheet — one thin line says "this is the one,"
everywhere else stays exactly as it is today.
**References.** GlossGenius (04) for selection contrast that reads at a glance; Cursor (03) for keeping everything
else deliberately quiet.

### 2 · Compact chip row — stretch
**Idea.** Turn the three stacked cards into one horizontal row so the whole decision fits without scrolling.
**Layout/hierarchy move.** Under the "Deployment type" label, three equal-width chip tiles sit side by side (grid,
not stack): icon in a circular outline on top, name and one line of copy beneath, clamped to a fixed two-line
height so the row never reflows between cards. Selecting a chip fills its icon ring solid instead of adding a
border, echoing the Console's own active-tab underline logic.
**Signature detail.** The fixed-height chip means Name and the whole type decision are visible in one glance with
zero scroll, even on the shortest supported viewport.
**References.** Reown (08) for the icon-chip-row idea; Excalidraw (10) for the symmetric three-column proportions.

### 3 · Two-column definition — within DS
**Idea.** Separate "what" (the name) from "how" (the type) spatially instead of stacking them.
**Layout/hierarchy move.** At the sheet's existing width, a narrow left column carries Name plus the existing helper
sentence and a small read-only chip previewing the outcome ("Lowest latency preset"); the right column carries the
three type cards, unchanged internally. The two columns read as one decision made of two parts, not a single long
form.
**Signature detail.** The left column's preview chip is the only place in the sheet that names the consequence of
finishing the form, before Sam presses the button.
**References.** Polar.sh (05) for the config-plus-context split; Anam (06) for config-beside-consequence layout.

### 4 · Confidence footer — within DS
**Idea.** Put the "you're ready" feedback inside the card Sam just touched, not in a separate sheet-level line.
**Layout/hierarchy move.** Same vertical stack. The selected card grows a thin 1 px top-divider footer strip inside
itself, in `text-tertiary`/meta size, stating the exact save outcome in one clause (for example, naming that the
agent saves on the Lowest latency preset). The sheet-level muted reason line is removed entirely — its job moves
into the card.
**Signature detail.** Cause and effect live in the same object: the card that was clicked is the card that explains
what clicking it means.
**References.** GlossGenius (04) inline sub-link inside the selected card; Cartesia (01) inline captions under each
option.

### 5 · Editorial single column — stretch
**Idea.** Slow the sheet down into two clear beats — name, then type — instead of one dense form.
**Layout/hierarchy move.** The "Deployment type" field label is replaced by the existing helper sentence, promoted
to the section's actual heading at `text-base` weight ("How people reach the agent" reads as the heading; "you can
change it until its first deployment" demotes to a one-line caption under the cards, not above them). A single
hairline divider separates the Name beat from the type beat. Cards keep more internal padding and a taller minimum
height.
**Signature detail.** The sheet has exactly two headings a person reads in order, name and reach, rather than one
label followed by three cards.
**References.** Understory (09) for the oversized-question-as-label move; Cartesia (02) for the calm, one-question
centered composition.

## Craft checklist (apply to every direction before it goes into Figma)

- One clear primary action per state: **Create agent** is the only filled button in every direction; **Cancel** stays
  a quiet secondary action.
- 8-point spacing throughout; no ad hoc gaps.
- Alignment: card left edges, icon baselines and button rows line up across all five directions the same way they
  do in the shipped sheet.
- Dark-theme contrast at AA: body text on `bg-surface`, meta text on `bg-surface`, and the selected-card border all
  checked against the dark tokens in DESIGN.md §3, not eyeballed.
- Type scale is exactly DESIGN.md's MiSans scale — 11 px meta, 13 px body/section, 14 px title, 17 px the one page
  title per page — no in-between sizes invented for "hero" emphasis.
- Lucide strokes stay a single consistent weight across every icon used (existing three type icons plus any added
  ones) — no mixing a bold custom glyph in among lucide's default stroke.
- Vendor logos at a consistent optical size — not applicable to this hero (see Logos above); carried forward as a
  rule for any future hero that does name a vendor.
- Real copy only, exactly the table above — no lorem ipsum, no "Agent name here", no invented fourth type.
- Owner copy rules held: sentence case, verb titles, no arrows or em dashes in prose, no "prototype/simulated/mock/
  wireframe" anywhere, nothing written inside a disabled input.

## Figma board, second pass (26 Sep 2026)

Section **UI Explorations** `74:1589` (inside `62:3`, page `v3 · P0 Agent config`): six native 1600 x 1000 frames in a
3 x 2 grid. Every frame is a copy of Hero 03 `64:3052` with the sheet at x 1152, so each variant diffs 1:1 against the
hero. V1 to V5 swap the list's Type icons and the card icons to `Icon/phone-incoming` and `Icon/phone-outgoing` (one
glyph per type across the frame), stroke the unselected radio rings in text/tertiary (3.2:1), and keep V0 untouched.

| Frame | Node | What it is | Tag |
|---|---|---|---|
| V0 · Current | `85:4575` | Hero 03 as built | Current |
| V1 · Emphasis rail | `85:4832` | direction 1 with the critique applied: rail inset 12 px, 1 px radius, no roundel | Within DS |
| V2 · Compact chip row | `85:5089` | direction 2 at the standard 736 sheet, a radio on every tile, tiles hug | Stretch |
| V3 · Two-column definition | `85:5367` | direction 3 at the compact 448 sheet as definition rows: label and helper left, control right, no Preset row | Within DS |
| V4 · The card says what Create does | `85:5624` | replaces direction 4: only the selected card grows one line naming its builder tab | Within DS |
| V5 · Who starts the call | `85:5881` | replaces direction 5: a 96 px strip of circle nodes on each card, phone glyphs carry direction | Stretch |

Kit additions on page 31:2, frame Icons: `Icon/phone-incoming` `85:2674`, `Icon/phone-outgoing` `85:2681`,
`Icon/users` `85:2689`, `Icon/list` `85:2699`, built like `Icon/phone` (16 px, stroke 1.333, colour bound to
text/secondary). None has a Code Connect mapping yet. The section grew to the right only (5040 wide, height unchanged);
its parent `62:3` widened to 7660 to hold it.

Copy for the owner to check (V4, selected card only): "Its builder gets a Numbers tab, where you point a number at it."
The Runs and Code lines from the brief are not on the board because only the selected card shows its line.
