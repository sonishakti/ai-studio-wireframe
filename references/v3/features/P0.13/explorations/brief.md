# P0.13 Try the agent without counting the tries · UI Explorations brief

Track: **v3**. Scope: this folder only (`references/v3/features/P0.13/explorations/`). Static Figma frames, no interaction, in a child section named **UI Explorations** under `P0.13 · Try the agent without counting the tries` on page `v3 · P0 Agent config` of file `OIKZExT265nOJotBlmv2Ah`. Owner ask of 26 Sep: 3 to 5 variations of one hero screen, meticulously built from the kit on page 31:2 with variables bound, never detached; Refero-grounded, every reference tagged with its source; icons and logos only where a vendor or product is named. Written by the Design phase so the Figma pass has the grounding; the Figma pass owns the frames.

## The hero screen

**Flow file (after the build):** `flow/05-your-tests-tagged.png`, Overview at happy step 5. URL `/v3?concept=a&view=agent&agent=agent_tutor&tab=overview&tries=tests`. It is the one screen where the row's own moment is visible: the production count unchanged, the test found behind its door and tagged.

**Content the hero must show (real copy and data only, from `05-build-spec.md` §6 and P0.8's §6):**

| Element | Content |
|---|---|
| Header | In-app tutor · Code badge · Production badge · Test · menu (no Go live) |
| Tabs | Overview (active) · Agent · Deployment |
| Period | 7 days (on) · 30 days |
| Tile strip | Sessions (i) 2,910 · +17% on the previous period / Average duration 6m 52s / Success rate (i) Not set · Set success criteria / Response time (i) 1,140 ms · -4% on the previous period |
| The (i) text, if a variation shows it open | Production sessions in the period. Tests from Studio are left out. Their minutes still count in Usage. |
| Chart | Sessions per day, seven bars, unchanged |
| Recent sessions title row | Recent sessions · **Production sessions** · Open in session history |
| The one row | Today, 14:02 · You [Test] · 0m 42s · Completed · (blank) |

Dark theme, Console tokens only (`WT/src/styles.css`), MiSans, `max-w-5xl`, flat surfaces, no shadow, no green, no red, the tag in the muted outline chip. Never on a frame: call, preview, sandbox, mode, environment, free, flag, prototype, simulated, mock, wireframe, arrows, em dashes.

## Refero grounding (tag each frame with the source it leans on)

Refero has no indexed screen of a voice-AI console keeping tests out of an agent's numbers; the nearest are session lists with type facets, KPI tiles with tooltips, log inspectors, and the test-mode chrome this row deliberately does not build. Searched this session: `refero_search_screens` × 7 ("test mode toggle viewing test data banner dashboard", "call logs table with type badge column and filter chips dark", "activity log filter show only my sessions tag row table", "developer console request log side panel showing sent payload and response JSON", "Stripe test mode toggle viewing test data developers dashboard", "analytics KPI stat card with info icon tooltip dark dashboard", "sessions table with test badge tag on rows voice agent").

| # | Source | Id | What to take |
|---|---|---|---|
| 01 | Anam · sessions history | `a263d783-d450-4ab8-8ab3-b6b84511e772`, `055b7668-9ff5-4fe2-b8fe-ff355321aa94`, `bbf62efd-f05e-476d-bca0-ccc7cb887e80` (flow 12948) | Tabs and a filter bar over a sessions table in an AI product; take the tab pair as one variation of the door (Production · Your tests), never a filter dropdown |
| 02 | Resend · metrics | `54391b2a-cc61-4b7e-84f9-c052b940bd27` | Large KPI numbers with a tooltip beside the label; take the (i) placement and the muted change line |
| 03 | n8n · insights, dark | `eba468af-e216-4772-a50d-9d30f96d12ad` | Dark KPI cards over a breakdown table; take the card and table rhythm for the strip and the list |
| 04 | Resend · log inspector | `380e1f12-51ed-44da-b049-6014aa7f77c2` (light), `cf561511-960a-4de5-8eb5-5772d669db1c` (dark) | Request, response and a status badge for one call; the View last save variation |
| 05 | Lovable · logs; Fingerprint · JSON modal | `f9ee3054-455d-485f-bbc1-d1e3b7b7ea31`, `b1e45f34-9c4e-402e-9c72-6ee4d0304366` | Expandable log rows and a JSON viewer with copy; the dialog's blocks, never a modal within a modal |
| 06 | Stripe · test-mode settings; Enode · sandbox client | `131eb3a0-e045-4ef3-b3de-405ae061e0e2`, `d0757985-1e97-4303-ac8b-86c0111b073f` | Account-wide test-mode chrome; one variation shows it to make the cut visible (a mode Sam can forget) |
| 07 | Vapi · Call Types facet | `shots/vapi-01-call-logs-type-column.png` (1856,1016,208,72) | A named type facet at the top of the table; the door as a facet variation |
| 08 | Retell · Channel Type column | `shots/retell-01-call-history-channel-type.png` (1016,954,1128,166) | A type column on every row; the tag as a column variation, and the billed "test" rows as the reason the tag must be a system fact |
| 09 | Sentry · hidden environments | `shots/sentry-01-hidden-env-still-counts-quota.png` (646,408,1914,67) | The anti-pattern: hidden and still counted; never a "hide tests" control |

## Vendor logos

None on the hero: no vendor module is named on Overview. A PostHog mark may appear only in the View last save variation beside the `posthog ·` entries, monochrome, 16 px in a 24 px slot, tagged as a logo; if no cleared monochrome mark exists, the entry title stands as text.

## Icons (lucide)

`info` (the tile hint), `flask-conical` (the header Test), `external-link` (Open in session history, if the variation shows it), `check` (the kit's gray tick, not used on this screen), `ellipsis` (the menu). 1.5 px stroke throughout. No icon on the tag.

## Five directions

### 1 · The door beside the title, the pick · within DS
The Recent sessions title row with **Production sessions** (the door's open label) and Open in session history at the right; one row with You and the gray Test chip; the (i) on Sessions closed. Refs 02, 03, 08.

### 2 · Two text tabs under the title · within DS
The same block with a text-only `Tabs` pair under Recent sessions, **Production** · **Your tests (1)**, the second active; the history link at the right. Refs 01, 07.

### 3 · The (i) open · within DS
Direction 1 with the Sessions tooltip open, "Production sessions in the period. Tests from Studio are left out. Their minutes still count in Usage.", so the exclusion and the billing truth are on the frame. Ref 02.

### 4 · View last save · within DS
The dialog over Overview: `POST /sessions · 201`, `studio_tests · kept` with its comment, the three `posthog ·` entries, `POST /sessions/ses_t1/stop · 201`, each a code block with a muted title. Refs 04, 05.

### 5 · Account test mode · stretch, the cut made visible
A shell-level "Viewing your tests" strip above the page and every tile and row flipped to tests, in the Console's tokens. Built to show why it lost: a mode to forget, a second world for something that is one agent and one bill. Refs 06, 09.

**Four of five (1 to 4) are buildable today inside the existing Console design system; 5 is a deliberate stretch for the owner to react to.**

## Craft checklist (apply to every variation before it is called done)

- One thing to read per frame: the count unchanged and the test found. Nothing filled, nothing coloured; the tag is the muted outline chip.
- 8-point spacing; the door lines up with the title's baseline and the history link; table cells keep `table.tsx` padding.
- Dark theme, WCAG AA for body and muted text against the canvas token; no green, no red, no tint anywhere.
- Type scale from `DESIGN.md` only: MiSans 11 / 13 / 14 / 17 px; the tile value at 17 px medium, labels at 11 px muted, the row at 13 px.
- Real copy only, verbatim from the table above; sentence case; no arrows, em dashes, filler, price, or process words on the frame.
- Variables bound to the kit on page 31:2, never detached; a drift check lists every component used and whether it has a Code Connect mapping.
