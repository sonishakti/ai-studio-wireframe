# P0.12 Feel sure before Go live · Research

## Rule 0, data first

(a) A new logged-in account already renders the config-time half of this job with zero seeded data: `PRESETS`,
`VOICES` and the vendor list (`VENDORS` in `data.ts`) are static app data, so the preset cards, the language/voice
pickers and the Test panel all render before any agent has been saved. Numbers, runs and knowledge/tools are
correctly empty-by-default already (`numbers: []`, `runs: []`, `context: []` on `newAgent()`), each rendering
today's one-sentence-plus-one-action `EmptyRow` pattern without any fixture work. What a new account does **not**
have is a first Go live: `agent.status` only becomes `"live"` after an actual run or type-specific action, so
step 4 (the confidence question) cannot be reached without acting first.

(b) Outside our accounts: public product shots already captured for Vapi, Retell and ElevenLabs (vendor logos on
model/voice chips, some empty states); Refero holds the confidence-survey shape (Twist, DoorDash, New Balance),
the vendor-logo-grid shape (Rox, ElevenLabs Channels) and the two indirect competitors this run's brief names —
Linear and Vercel — for the empty-state/first-run half of the job.

(c) What the prototype's own fixtures still need: nothing on the data side — any seed agent on any preset already
renders `PipelineStrip`, and `agent_survey` (batch, draft, prompt filled) already has zero numbers/runs/context, so
it doubles as the empty-state and the preset-switch fixture in one agent. What is actually missing is code, not
data: `VENDORS` has no logo-asset field at all (only `{ name, monogram }`), the preset `RadioGroup` cards and the
Test panel's first-answer bubble carry no transition classes anywhere, and grepping the whole tree finds no
`go_live_confidence_rated` event, survey component, or "asked once" flag yet — P0.12 is net-new build, not a
refinement of something half-shipped.

## Vendor status

| Vendor | Status | Sources |
|---|---|---|
| Vapi | Partial | Reused `vapi-01-assistant-model-logos.png` (existing product research, `competitors/product/vapi/vapi-assistant-model.png`) |
| Retell | Partial | Reused `retell-01-agent-editor-logos.png` and `retell-02-phone-numbers-empty.png` (existing product research) |
| ElevenLabs | Partial | Reused `elevenlabs-01-agent-channels-logos.png` (existing product research, `elevenlabs-18-agent-channels.png`) |
| Linear (indirect, this run's brief) | Done | Refero screen, `linear.app/welcome` |
| Vercel (indirect, this run's brief) | Done | Refero screen, `vercel.com/.../nextjs` (preview deployments empty state) |
| LiveKit (row's original 4th vendor) | Not re-checked | Superseded this run by Linear/Vercel per the phase brief's "confidence and delight" framing; the row's PRD-listed LiveKit empty-state shots remain available and untouched |

None of Vapi, Retell or ElevenLabs stay above Partial: all three answer the "does a vendor logo exist somewhere"
question, but none show a preset/model **switch** in motion, a first-answer moment, or any confidence-survey UI —
exactly the gap the row's own `research_brief` flagged before this run.

## Shots

| # | File | Source | Path | Finding | Region (x,y,w,h) |
|---|---|---|---|---|---|
| 1 | `before-01-voice-models-preset-cards.png` | browser (our prototype, `agent_survey`, tab=agent, section=voice-models) | happy P0.12.a.1 | Every preset card's pipeline strip shows a two-letter text monogram in a circle ("DG", "G", "OA", "C") — never a real vendor mark; the radio card itself only has a hover `transition-colors`, no state-change motion when the value switches | 976,285,1501,419 |
| 2 | `before-01-voice-models-preset-cards.png` | browser (same capture) | happy P0.12.a.3 | "Knowledge and tools" already renders the target empty-state shape today: one sentence ("The agent answers from its prompt alone.") plus one action ("Add") — this part of step 3 is close to done, not a redesign | 976,1616,1501,88 |
| 3 | `before-02-test-panel-first-answer.png` | browser (our prototype, Test sheet, live test call, ~8 s in) | happy P0.12.a.2 | After several seconds "live" the panel shows only a timer and "Listening" — no first-answer bubble, transcript or acknowledgement ever appeared in this run, and the source's `FIRST_ANSWER_MS` fixture bubble (`data-test-answer`) carries zero transition classes either way | 2477,208,715,1552 |
| 4 | `before-03-runs-empty.png` | browser (our prototype, tab=deploy → "Runs") | happy P0.12.a.3 | "No runs yet. A run calls one contact list with this agent." + one "New run" button — the same already-good empty-state shape as row 2, confirming numbers/runs/context all follow one pattern today (numbers confirmed by source read: `"No number answers with this agent yet."` + "Connect a number", not screenshotted fresh this run) | 432,378,2045,80 |
| 5 | `vapi-01-assistant-model-logos.png` | existing (product) | happy P0.12.a.1 (contrast) | Vapi's Transcriber/Model/Voice cards each carry a small real brand-mark icon next to the vendor name (Deepgram, Groq, Rime AI) — a full icon, not a monogram, at the same information density our preset cards use | 1090,470,2050,230 |
| 6 | `retell-01-agent-editor-logos.png` | existing (product) | happy P0.12.a.1 (contrast) | Retell's model chip ("GPT 4.1") carries a small vendor icon before the label; the voice chip ("Kate") uses a persona photo, not a vendor mark — logos appear, but only on the LLM side, never on voice | 150,205,900,65 |
| 7 | `elevenlabs-01-agent-channels-logos.png` | existing (product) | happy P0.12.a.1 / .3 (contrast) | Every channel row (WhatsApp, Zendesk, Genesys, Slack, Telegram …) pairs a full-colour real brand mark with the name; alpha-stage channels fall back to a plain line icon instead of a logo, never to text | 960,336,688,1296 |
| 8 | `retell-02-phone-numbers-empty.png` | existing (product) | happy P0.12.a.3 (contrast) | "You don't have any phone numbers" — icon, one sentence, no action button in view (add lives in the page's own `+`), the plainest of the three vendors' empty states | 1920,928,480,144 |
| 9 | `retell-02-phone-numbers-empty.png` | existing (product), same file | happy P0.12.a.4 / rainy P0.12.e | Unplanned but exactly on point: Retell's own product shows a persistent one-question NPS card ("How likely are you to recommend Retell to others?", 1–10, with an ✕ to dismiss) sitting over the empty state — the closest live precedent for our post-Go-live confidence question | 1176,1688,848,272 |
| 10 | `refero-vercel-01-preview-deployments-empty.png` | refero (screen) | rainy P0.12.d | Vercel's "No Preview Deployments" panel is a dashed-border card sized to hold the exact footprint a populated list would take — nothing reflows once real deployments appear, the anti-layout-shift instinct P0.12.d asks for | 190,340,900,180 |
| 11 | `refero-linear-01-welcome-dark.png` | refero (screen) | happy P0.12.a.2 (contrast, delight) | Linear's first-run screen carries the entire moment on one dark canvas, one short sentence, one primary button and a single icon motif — the quiet, single-focus feeling a 150–250 ms transition should support, not fight | 280,60,560,340 |
| 12 | `refero-twist-01-confidence-rating-1-5.png` | refero (screen) | happy P0.12.a.4 | A single 1–5 scale with plain-language endpoint labels ("No autonomy at all" … "Complete autonomy") and one "OK" — reads instantly with no number legend needed, close to the shape of our one-question survey | 190,320,900,115 |
| 13 | `refero-doordash-01-dismiss-vs-submit.png` | refero (screen) | rainy P0.12.e | DoorDash's survey pairs a ghost "Dismiss" button with a filled red "Submit", so skipping is never styled as a low score — the exact distinction P0.12.e's "a dismissal counts as no answer, not a low score" needs | 310,60,500,540 |
| 14 | `refero-rox-01-integrations-not-connected.png` | refero (screen) | happy P0.12.a.1 / .3 | A "NOT CONNECTED" section groups every not-yet-connected integration under one label, each card a real brand mark plus a "Connect" action — logos and the empty/not-connected state solved in one grid | 55,95,1045,170 |

## Per-vendor copy / avoid

**Vapi** — Copy: a small real brand-mark icon sits directly beside the vendor name on every pipeline card, at the
same size and density our preset cards already use for the monogram — a near drop-in swap. Avoid: no card ever
acknowledges a value change with motion; copying Vapi's stillness would leave P0.12.a.2 unsolved.

**Retell** — Copy: ships its own one-question survey as a small, dismissible corner card that never blocks the
page — the shape our confidence question should take. Avoid: nothing on screen marks whether that survey was
already answered or dismissed for this account, so it can plausibly resurface and nag; P0.12.e explicitly asks us
not to do that.

**ElevenLabs** — Copy: every channel row pairs a full-colour real logo with its name, so WhatsApp/Slack/Zendesk
read before the label does. Avoid: rows without a logo yet fall back to a generic line icon, not to text — our
row 8/14 findings (Retell's plain icon, Rox's brand marks) are the better precedent for P0.12.c's "vendor name
shows as text" rule.

**Linear (indirect)** — Copy: the whole first-run screen is one sentence, one button, one motif, dark canvas —
nothing competes with the single decision on screen. Avoid: it is deliberately content-free; it does not show how
to keep a first-run feeling quiet on a screen that still needs to carry real vendor identity (our case).

**Vercel (indirect)** — Copy: the empty "Preview Deployments" card is pre-sized to the populated state's footprint,
so nothing shifts when data arrives. Avoid: its empty copy ("Commit using our Git connections.") assumes the
visitor already knows the vendor's own terms — ours should stay in plain sentence case per the copy rule, never
assuming vendor jargon.

**Twist / DoorDash (adjacent, Refero)** — Copy: a plain-language 1–5 (or thumbs + 5-point) scale with endpoint
labels needs no legend; DoorDash's separate ghost "Dismiss" vs filled "Submit" keeps skipping visually distinct
from rating low. Avoid: Twist's modal has no visible skip at all, only "OK" — implying a forced answer, the
opposite of P0.12.e.

**Rox (adjacent, Refero)** — Copy: grouping every unconnected integration under one "NOT CONNECTED" heading lets
the eye read "these are empty" once, not row by row. Avoid: card icon sizes and treatments are inconsistent
card-to-card (real logo next to generic line icon) — the visual noise P0.12.c's text-fallback rule exists to
prevent.

## Gaps

- Motion itself (the preset switch and the first-answer bubble, 150–250 ms) has no vendor precedent a still image
  can show. Per this run's brief, stills plus this prose stand in for a recording: today, neither transition
  exists in code at all (confirmed by reading `model.tsx` and `list-and-create.tsx` — hover-only `transition-colors`
  on the cards, zero transition classes on the first-answer bubble), so Design is starting from nothing, not
  tuning an existing timing.
- The deployed preview's Test panel may be running a different build than the current worktree source: the live
  button read "Start test call" / "End call" and, after 8+ seconds "live", never showed a first-answer bubble at
  all — while `list-and-create.tsx` on `design/v3` HEAD names the buttons "Start test" / "End test" and fires a
  2000 ms fixture timer. Design/Build should confirm which is current before attaching motion to a specific
  element.
- No numbers-empty state was screenshotted fresh this run; the identical `EmptyRow` pattern used for runs/context
  is confirmed present for numbers by reading `deploy.tsx` (`"No number answers with this agent yet."` + "Connect
  a number") but no seed agent with `numbers: []` and a filled prompt was on hand to capture it live.
- No vendor or Refero result showed a logo-missing/low-contrast fallback, a slow-asset-load hold, or a
  screen-reader/alt-text pattern for a vendor mark (P0.12.c, .d, .f) — this stays fully novel for Design; the
  closest adjacent evidence is Canva's own accessibility settings screen listing "reduced motion" as a system
  toggle, not a per-component fallback, so it was not pulled in as a shot.
- LiveKit, the row's PRD-listed 4th vendor, was not re-checked this run; this phase's brief named Linear/Vercel as
  the indirect competitors for the confidence-and-delight framing instead. The row's existing LiveKit empty-state
  shots (`livekit-16-phone-numbers-empty-state.png` etc.) remain valid if Design wants infra-side empty-state
  precedent alongside this run's product-side ones.
- The "A · Three tabs" concept-switcher strip visible at the bottom of both `before-*` shots is prototype-only
  debug chrome (this route's own dev tool for toggling concepts A–E), not part of Sam's real UI — flagged so
  Design doesn't treat it as a surface to preserve or reference.

## Footnote (agent use only)

Status legend: Done = enough evidence to design from; Partial = product/docs shape confirmed, no motion or
confidence-survey evidence found (expected, per the row's own `research_brief`); Not re-checked = out of this
run's scope per the phase brief. Scope: Research phase only for job step P0.12 (this run did not touch Design,
Build or Figma). Rule 0 answer is above. Source order followed: existing research reused first (all
`research[].note` paths verified present), then Refero MCP for the confidence-survey and indirect-competitor gaps
this run's brief named (Linear, Vercel), then the agent-browser route (`scripts/drive.mjs`, tab `p012-research`)
for this row's own before-shots against the preview named in the phase brief. No sign-in, no purchase, no
credential entry, no push and no `--prod` anywhere in this run.
