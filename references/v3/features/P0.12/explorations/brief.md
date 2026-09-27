# P0.12 Feel sure before Go live · UI Explorations brief

Track: **v3**. Scope: this folder only (`references/v3/features/P0.12/explorations/`). Static Figma frames, no interaction, in a child section named **UI Explorations** under `P0.12 · Feel sure before Go live` on page `v3 · P0 Agent config` of file `OIKZExT265nOJotBlmv2Ah`. Owner ask of 26 Sep: 3 to 5 variations of one hero screen, meticulously built from the kit on page 31:2 with variables bound, never detached; Refero-grounded, every reference tagged with its source; icons and logos where a vendor is named. Written by the Design phase so the Figma pass has the grounding; the Figma pass owns the frames.

## The hero screen

**Flow file (after the build):** `flow/06-live-and-asked.png`, the Deployment tab at happy step 6. URL `/v3?concept=a&view=agent&agent=agent_clinic&tab=deploy&dep=live&sure=ask`. It is the one screen where the row's own moment is visible: the agent just went live and the Console asks the one question the P0 KPI is built on. Voice & models with marks (hero 1) is not explored again; P0.2's UI Explorations already vary that surface, and the marks there are a swap inside an existing slot.

**Content the hero must show (real copy and data only, from `05-build-spec.md` §6 and P0.8's §6):**

| Element | Content |
|---|---|
| Header | Clinic reception · Inbound badge · Live badge · Test · menu (no Go live) |
| Tabs | Overview · Agent · Deployment (active) |
| The question (`Alert`) | How confident are you that the agent is ready for people outside the team? / Not at all · 1 2 3 4 5 · Completely / Skip |
| Readiness | gray tick · Heard in a test at 14:02, after the last change. / gray tick · System prompt written. / gray tick · +1 628 555 0110 answers with this agent. |
| Retention | (•) 30 days · What people say is kept for 30 days, then expires. The session row, its count and its cost stay. / ( ) Zero retention, disabled · The API has no retention setting on a number yet, so inbound sessions are kept for 30 days. |
| Numbers | +1 628 555 0110 · Spare · Remove / Add another number |
| Toast (bottom right) | Live. +1 628 555 0110 answers with this agent. |

Dark theme, Console tokens only (`WT/src/styles.css`), MiSans, `max-w-5xl` rows, flat surfaces, no shadow, no green, no red. Never on a frame: survey, feedback, rate, NPS, score, logo, prototype, simulated, mock, wireframe, arrows, em dashes.

## Refero grounding (tag each frame with the source it leans on)

Refero has no indexed screen of a voice-AI console asking for confidence after going live; the nearest are post-action feedback prompts. Searched this session: `refero_search_screens` × 5 ("NPS survey card bottom corner rating scale dismiss", "how was your experience feedback card bottom right thumbs up thumbs down dismiss", "dark settings empty state one sentence one button dashed card", two model-picker queries that returned nothing usable and were dropped).

| # | Source | Id | What to take |
|---|---|---|---|
| 01 | DoorDash · post-support feedback modal | `469e69a2-e9a6-471d-a3f1-3f5b93d6179f`, `45dde24c-6328-4949-b0f3-02e5293607cf` | Ghost **Dismiss** beside the filled action, a 5-node horizontal scale, the submit off until a node is picked; take the ghost dismiss, drop the Submit |
| 02 | New Balance · post-purchase survey | `67ea8ba6-b1bd-454d-b8ea-dc39a44a5bf4` | Skip and Next side by side in the footer, endpoint labels under the scale; take Skip at the right and the endpoint labels |
| 03 | Anam · post-session feedback | `a755f0b8-f976-4465-8d0b-1a76a1a2340c`, `6df60630-5b57-49f2-afb4-430707a2d9aa` | Rating as a row of outline chips in an AI product; take the chip row as the button shape |
| 04 | Instacart · rate your experience | `511cdea1-3ec1-4621-b0ae-7d0f1b34e7f0` | The question as a plain title over the control, reason chips under it; take the title shape, never the reason chips or the comment box |
| 05 | Starbucks · feedback tab and modal | `283e0153-e144-4053-9d3b-76843302c092` | A persistent side tab that reopens the ask; the contrast for the cut corner card, not to copy |
| 06 | Retell · Phone numbers empty with the 1 to 10 card | `shots/retell-02-phone-numbers-empty.png` (1176,1688,848,272) | The corner card shape in a product like ours, and the missing "asked before" state; one variation shows it to make the cut visible |
| 07 | Twist · 1 to 5 with endpoint labels | `shots/refero-twist-01-confidence-rating-1-5.png` | The endpoints read without a legend |
| 08 | Linear · welcome | `shots/refero-linear-01-welcome-dark.png` | One sentence, one control, one motif on a dark canvas; the Live moment variation |
| 09 | Rox · not connected grid; Vapi · model cards | `shots/refero-rox-01-integrations-not-connected.png`, `shots/vapi-01-assistant-model-logos.png` | A row of marks beside names, one size; the pipeline row in the Live moment variation |

## Vendor logos

Only the Live moment variation names vendors (the tested pipeline: Deepgram, Google Gemma 4 on SuperNode, Cartesia Sonic 3.5). Marks from `references/v3/features/P0.2/explorations/logos/`: `deepgram.svg`, `google.svg` (or `googlegemini.svg`), monochrome, 16 px in a 24 px slot, `text-foreground`. **Cartesia: missing** (not on simple-icons or svgl; the build may trace the brand mark from `cartesia.ai`, open question 2); on the frame Speak reads "Cartesia Sonic 3.5" as text with an empty slot, which is the shipped .c state, never an invented mark. Every other variation carries no logo.

## Icons (lucide)

`check` (the gray tick), `x` (a close, only in the corner-card variation), `phone-incoming` (the Inbound badge), `info`, `chevron-down` (the menu). 1.5 px stroke throughout.

## Five directions

### 1 · Notice row, the pick · within DS
The `Alert` above Readiness: the question as the title, one row under it with the endpoints, five `ToggleGroupItem size="sm"` and a ghost Skip at the right. Refs 01, 02, 07.

### 2 · Chip row under the Live toast line · within DS
The same alert, the question as a single line and the five outline chips (Anam's shape) at the right of it, Skip after them, one line tall: the ask reads as one more Readiness-style line. Refs 03, 04.

### 3 · Word buttons · within DS
Five `RadioGroup` cards in one row (P0.1's type-card sibling): Not sure · Somewhat · Sure · Very sure · Completely, no numbers, the question above, Skip at the right. Ref 02 (labels), 07.

### 4 · Live moment · stretch
A full-width panel above the rows on the dark canvas: "Live." then "+1 628 555 0110 answers with this agent.", the tested pipeline as three mark rows (ref 09), and the question with its buttons beneath; Readiness and the rest under it. A new surface, so stretch. Refs 08, 09.

### 5 · Corner card · stretch, the cut made visible
Retell's card in the Console's tokens: a `SurfaceCard` bottom right with the question, the five buttons and an ✕; the tab unchanged behind it. Built to show why it lost (floats over content, nags, no place in DESIGN.md). Refs 05, 06.

**Three of five (1, 2, 3) are buildable today inside the existing Console design system; 4 and 5 are deliberate stretches for the owner to react to.**

## Craft checklist (apply to every variation before it is called done)

- One primary decision per frame: the press on 1 to 5. Skip is ghost; nothing is filled.
- 8-point spacing; the alert's inner row lines up with Readiness's text column; buttons 28 px tall (`sm`), one gap unit apart.
- Dark theme, WCAG AA for body and muted text against the canvas token; no green, no red, no tint on the alert.
- Type scale from `DESIGN.md` only: MiSans 11 / 13 / 14 / 17 px; the question at 13 px medium (`console-type-section`), `text-wrap: balance`, no widow.
- Marks (variation 4 only) at one optical size, monochrome; Cartesia as text.
- Real copy only, verbatim from the table above; sentence case; no arrows, em dashes, filler, price, or process words on the frame.
- Variables bound to the kit on page 31:2, never detached; a drift check lists every component used and whether it has a Code Connect mapping.
