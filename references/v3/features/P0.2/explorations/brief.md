# P0.2 · Change the default voice — UI Explorations brief

Scope: research and direction-setting for a **new child section "UI Explorations"** inside the
Figma section `P0.2 · Change the default voice` (page `v3 · P0 Agent config`, file
`OIKZExT265nOJotBlmv2Ah`). This brief is the input for that Figma build; it does not itself
edit Figma. Static frames only, no interaction.

## 1. The hero screen

**Flow file:** `flow/01-default-preset.png` (happy step 1 of `05-build-spec.md`).
**Figma source:** section `4 Hero` → frame `Hero 01 · Lowest latency with its stack, voice and
region line` (node `70:3992`), already built from the kit on page `31:2`.

Why this one, not Hero 02 (Custom) or Hero 03 (Balanced disabled): it is the first thing Sam
sees when opening Voice & models, it is the literal "default voice" state the job step is named
for, and it is the only happy-path screen that shows the full vendor stack (all three Listen /
Think / Speak logos) at once — the richest surface for a visual exploration.

**What the hero must show (real copy and data, from `05-build-spec.md` and the fixtures):**
- Row label: **Voice & models**
- Three preset cards, **Lowest latency** selected:
  - Lowest latency — "Answers fastest. Runs on SuperNode. Best for short, scripted sessions."
    Stack: Listen · Deepgram Nova 3 — Think · Google Gemma 4 on SuperNode — Speak · Cartesia Sonic 3.5
  - Balanced — "Smarter answers, a beat slower." Stack: Deepgram Nova 3 / OpenAI GPT‑5.1 mini / Cartesia Sonic 3.5
  - Custom — "Pick the vendor and model for each part." (no stack shown, collapsed)
- Language `Select` (English) and Voice `Select` (Aria · Warm)
- Region line: "Runs in US East." with a "See pricing" link (opens in a new tab; no price shown)
- Agent context above the row: agent name "Renewal survey", type/status badges, Overview / Agent /
  Numbers tabs — kept for orientation but not the focus of the exploration
- Never: tier, plan, cost, price figures, SDK, publish, deploy (verb), template

## 2. References (Refero MCP)

12 references kept in `refs/`, from 6 searches (`refero_search_screens` ×5,
`refero_search_styles` ×1; `refero_search_flows` returned nothing relevant for this screen type
and was not used further, per the skill's "broaden or fall back to screens" guidance).

| # | File | Product | What to take |
|---|---|---|---|
| 01 | `01-elevenlabs-tts-workspace.png` | ElevenLabs · Text to Speech | 3-column shell: narrow left nav, wide editor, **right settings panel** holding voice + model selectors and sliders stacked vertically — the panel shape our Custom module rows could grow into |
| 02 | `02-elevenlabs-voice-library.png` | ElevenLabs · Voice library | Restrained black-and-white voice controls with a waveform play affordance — proof a voice picker can stay monochrome and still feel premium |
| 03 | `03-cartesia-voice-design.png` | Cartesia · Voice design | Dark, **numbered setup sections** and small preset/tone buttons — a pattern for turning 3 presets into steps rather than a card row |
| 04 | `04-cartesia-instant-clone.png` | Cartesia · Instant clone | Dark two-column input/details form, disabled primary action state — reference for a calm dark form surface with a clearly disabled CTA |
| 05 | `05-humeai-evi-playground.png` | Hume AI · EVI playground | **Closest analogue to our row**: right panel stacks an EVI-version card (name + one-line description, exactly like our preset cards), a Voice card (avatar + name + Change/Remove), a **language-model select with the vendor's logo inline in the trigger**, a temperature slider, and System prompt below — validates putting Voice & models and System prompt in one visual rhythm |
| 06 | `06-delphi-voice-settings.png` | Delphi · Voice settings | Compact model + speed + preview-text pattern inside one settings card |
| 07 | `07-resend-plans-modal.png` | Resend · Plans modal | **Contrast-weighted comparison**: the non-selected tiers' text and check icons sit at reduced opacity while the "Recommended" column stays full contrast with a small green pill badge — hierarchy done with weight, not extra colour |
| 08 | `08-zapier-pricing-tabs.png` | Zapier · Pricing | Segmented tab selector above plan cards; a quiet grayscale logo row — reference for both the tab-instead-of-cards direction and for keeping vendor logos desaturated until relevant |
| 09 | `09-huddlekit-billing-cards.png` | Huddlekit · Billing | Plan cards **inside a product dashboard** (not a marketing page) with a left rail still visible — closer to our actual context than most pricing-page references |
| 10 | `10-manus-dark-settings-modal.png` | Manus · Settings modal | Dark modal with horizontal appearance/theme cards plus toggle rows — a dark, in-product card-picker sanity check |
| 11 | `11-linear-changelog-style.png` | Linear · Changelog (style) | Near-black canvas, disciplined Inter type, capsule (9999px) pills, thin graphite 1px borders instead of shadows |
| 12 | `12-warp-dev-style.png` | Warp.dev (style) | Deep charcoal canvas, one restrained accent colour, monospace-flavoured technical labels, rounded dark cards with border-only depth |

## 3. Vendor logos

Screen names: Deepgram (Listen), Google Gemma (Think, "on SuperNode"), Cartesia (Speak), OpenAI
(Balanced's Think). Fetched to `logos/`:

- `deepgram.svg` — simple-icons, OK
- `openai.svg` — simple-icons, OK
- `google.svg` — simple-icons (4-colour "G"), matches the plain "G" monogram the current kit uses for Gemma
- `googlegemini.svg` — simple-icons, kept as an alternate mark if a direction wants the Gemini sparkle instead of the corporate "G"
- `anthropic.svg`, `elevenlabs.svg` — simple-icons, fetched in case a direction visualises the Custom/API pipeline (Claude Sonnet 4.6, ElevenLabs Flash v2.5 per rainy `.d`), not used on the Hero 01 happy path itself

**Missing:** `cartesia.svg` — not on simple-icons (404) and Cartesia's own site is not reachable
from this environment's network policy. No clean SVG found. Directions that need a Cartesia mark
should keep the existing "C" monogram treatment (matches the shipped Hero 01) rather than invent
a logo.

## 4. Icons (lucide, `icons/`)

`play`, `pause`, `volume-2` (waveform/playing), `rotate-cw` (retry), `check`, `circle-check`,
`circle`, `radio`, `chevron-down`, `zap` (latency), `gauge` (trade-off), `sliders-horizontal`
(custom), `globe` (region), `info`, `mic`, `ear` (listen), `brain` (think), `speaker` (speak),
`external-link` (pricing link), `sparkles`, `badge-check` (recommended-style chip) — 21 total,
covering every direction below.

## 5. Five directions

### 1 · Contrast-weighted cards — *within DS*
One-line idea: stop distinguishing the selected preset with border + tint alone; also drop the
other two cards' body copy and vendor labels to a muted token so the eye lands on Lowest latency
without a new colour.
Layout/hierarchy move: same 3-card grid, but only the selected card keeps full-contrast text;
Balanced and Custom's descriptions and stack rows step down one text-color token.
Signature detail: a small `badge-check` chip next to the selected preset's title, styled like the
existing status badge, no new shape.
References: 07 (weight-based hierarchy), 08 (quiet secondary logos).
Tag: within DS.

### 2 · Stack-as-hero row — *within DS*
One-line idea: promote the Listen/Think/Speak stack to co-equal billing with the preset name
instead of a secondary detail underneath it.
Layout/hierarchy move: enlarge the vendor marks from the current 22px monogram to a 24px logo
(using the fetched Deepgram/Google/OpenAI SVGs in place of two-letter monograms) and set each
module as its own row with the vendor name as a one-line caption, mirroring Hume AI's Voice and
Language-model rows.
Signature detail: real vendor SVGs at one consistent optical size replace the DG/G/OA/C
monogram text.
References: 05 (Hume AI EVI panel), 01 (ElevenLabs right panel).
Tag: within DS (reuses `Avatar` + `Field`; only the glyph inside the avatar changes).

### 3 · Single-column focus card — *within DS*
One-line idea: replace three simultaneous cards with one full-width detail panel for the selected
preset, switched via a small segmented control.
Layout/hierarchy move: Lowest latency / Balanced / Custom become a 3-item tab strip (the same
underline tab style already used for Overview / Agent / Numbers); the tab's panel below carries
the stack, language, voice and region line as one uninterrupted column.
Signature detail: switching presets feels like switching a tab, not choosing a radio card, so
only one preset's detail is ever on screen.
References: 03 (Cartesia numbered sections), 08 (Zapier tab selector), 06 (Delphi settings card).
Tag: within DS (`Tabs` + `Field` already exist; no new control shape).

### 4 · Command-strip hero — *stretch*
One-line idea: compress the three presets into a single row of small capsule pills and read the
chosen preset's detail as one dense technical readout.
Layout/hierarchy move: presets shrink from full cards to pill + 4px status-dot selectors in one
row; the stack/voice/region panel becomes a single bordered panel below with small-caps
"LISTEN / THINK / SPEAK" labels.
Signature detail: the 4px accent dot on the active pill, borrowed from Warp/Linear's restrained
accent language, replaces the radio circle.
References: 12 (Warp.dev), 11 (Linear capsules), 10 (Manus dark modal).
Tag: stretch — the pill selector and small-caps label treatment are not yet in `DESIGN.md`.

### 5 · Annotated comparison table — *stretch*
One-line idea: stop repeating Listen/Think/Speak/Best-for three times; show them once as row
labels with Lowest latency / Balanced / Custom as columns.
Layout/hierarchy move: a single table replaces the 3-card grid; the selected column keeps the
existing selected-card fill, vendor logos sit inline inside each cell.
Signature detail: "See pricing" moves once to the table's own footer instead of appearing per
card.
References: 07 (Resend row-based plan compare), 08 (Zapier comparison table).
Tag: stretch — a comparison-table row pattern does not exist yet in the builder.

**3 of 5 (directions 1, 2, 3) are buildable today inside the existing Console design system; 4
and 5 are deliberate stretches for the owner to react to.**

## 6. Craft checklist (apply to every variation before it is called done)

- One clear primary action per frame (pick a preset, or play + pick a voice) and one visual
  hierarchy leading to it — never two competing focal points.
- 8-point spacing grid throughout; no ad-hoc 5/7/11px gaps.
- Alignment: card edges, logo baselines and select widths line up across all three presets in any
  card-based direction; column edges line up in the table direction.
- Dark theme, WCAG AA contrast minimum for all body text and muted lines against the canvas token.
- Type scale from `DESIGN.md` only: MiSans 11 / 13 / 14 / 17 px — no in-between sizes invented for
  the exploration.
- Every icon is lucide at a consistent 1.5px stroke; no mixed stroke weights on one frame.
- Vendor logos rendered at one consistent optical size per frame (not "same pixel box, different
  visual weight" — 4-colour Google and monochrome Deepgram must read as the same size).
- Real copy only, verbatim from section 1 above — no lorem ipsum, no placeholder vendor names.
- Owner copy rules: sentence case, verb titles, no arrows or em dashes in prose, no filler, no
  price figures anywhere, "prototype/simulated/mock/wireframe" never appear on the frame itself.
