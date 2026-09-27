# P0.12 Feel sure before Go live · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.12], `02-research.md` rule 0 (12 shots), the v3 API snapshot (`references/api/v3/`: no field for logos, motion, empty states or a confidence answer; the row is UI only). ClickUp task 868m9x4bm has no comments, so there are no change notes. Requirement 39 (the P0 emotional criterion). Funnel stages 8 `agent_tested_configured` (the TTFA guard) and 9 `channel_connected` (the survey trigger). Depends on P0.2 (the preset cards and the `PipelineStrip` monograms, the voice `Select`), P0.7 (the test panel's first-answer bubble and `agent_audio_heard`), P0.5 and P0.8 (the three empty rows), P0.8 to P0.11 (the Go live that triggers the question: a number pointed, a run started, a first session from software).

## What the flow shows

| Screen | Data it needs |
|---|---|
| Voice & models with vendor marks (.a step 1) | The two presets' pipelines (Deepgram Nova 3, Gemma 4 on SuperNode or GPT-5.1 mini, Cartesia Sonic 3.5) and one monochrome SVG mark per vendor; the Custom module `Select`s (P0.2) and the voice `Select` reading the Speak vendor |
| A preset switch (.a step 2) | Two presets whose Think row differs (Lowest latency and Balanced already do) so the switch has something to move |
| The first answer (.a step 2) | A test session whose first agent line arrives after a delay (P0.7's fixture timers; today's `FIRST_ANSWER_MS` in `list-and-create.tsx`) |
| Empty integrations, runs, numbers (.a step 3) | A draft agent with `context: []`, `runs: []`, `numbers: []`, a written prompt, and the three `EmptyRow`s (`agent_survey` for integrations and runs; `agent_clinic` from P0.8 for numbers) |
| The confidence question (.a step 4) | An account whose first Go live just happened: an agent turned `live` by a pointed number (P0.8 `dep=live`), a started run (P0.10 `nr=started`) or a first session from software (P0.11 `code=first`); an account flag saying the question has not been answered or skipped |
| .b reduced motion | The OS setting `prefers-reduced-motion: reduce`, or a review key that forces it |
| .c a logo missing or low contrast | A vendor without a mark in the set (today: Cartesia); a mark whose only version is full colour is treated as missing |
| .d slow assets | A mark set that arrives seconds after the row renders |
| .e the question skipped | The account flag written as skipped; a second live agent to prove the question never returns |
| .f screen reader | Alt text on every functional mark, `aria-hidden` on every decorative one, `aria-live` on the transcript, a checked radio on the picked card |

## What a new account lacks

Nothing on the data side, which is the point of this row: `PRESETS`, `VENDORS` and `VOICES` are static, so the marks render before any agent exists, and `newAgent()` already starts every agent with `context: []`, `runs: []`, `numbers: []`, so the three empty rows show on the first agent without seeding. What a new account cannot have is a first Go live, so the question (.a step 4) is unreachable until Sam points a number, starts a run or copies the snippet and the software starts a session; the prototype reaches it by URL.

The v3 API has **no field** for a vendor mark, a motion preference, a confidence answer or an account-level "asked" flag (UI only). The event is the record: `go_live_confidence_rated` to PostHog; "asked" is `cta_viewed {cta: go_live_confidence}`. Until an account preference exists, the asked flag lives in the browser (`localStorage`), so a second browser may ask again; open question 1.

## Where it exists outside our accounts

- Marks beside vendor names at card density: `shots/vapi-01-assistant-model-logos.png`, `shots/retell-01-agent-editor-logos.png`, `shots/elevenlabs-01-agent-channels-logos.png`, `shots/refero-rox-01-integrations-not-connected.png`.
- A one-question survey in a product: `shots/retell-02-phone-numbers-empty.png` (Retell's own 1 to 10 card), `shots/refero-twist-01-confidence-rating-1-5.png`, `shots/refero-doordash-01-dismiss-vs-submit.png`. Refero this session: DoorDash `469e69a2-e9a6-471d-a3f1-3f5b93d6179f` and `45dde24c-6328-4949-b0f3-02e5293607cf`, New Balance `67ea8ba6-b1bd-454d-b8ea-dc39a44a5bf4`, Anam `a755f0b8-f976-4465-8d0b-1a76a1a2340c`, Instacart `511cdea1-3ec1-4621-b0ae-7d0f1b34e7f0`, Starbucks `283e0153-e144-4053-9d3b-76843302c092`.
- Pre-sized empty cards and quiet first runs: `shots/refero-vercel-01-preview-deployments-empty.png`, `shots/refero-linear-01-welcome-dark.png`.
- Motion: no still exists anywhere (research gap); the spec names the timing and the two elements instead.
- Vendor marks as files: `references/v3/features/P0.2/explorations/logos/` already holds `deepgram.svg`, `openai.svg`, `google.svg`, `googlegemini.svg`, `anthropic.svg`, `elevenlabs.svg` (simple-icons, monochrome). Cartesia is on neither simple-icons nor svgl (both 404 this session); `cartesia.ai` answers (308), so the build fetches the brand mark from the vendor's own brand page and traces it to one monochrome path, or ships Speak as text (.c) and says so.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`), plus one new file for the marks.

1. `parts/vendor-marks.tsx`: `VENDOR_MARKS: Record<string, string>` (one SVG path per vendor, viewBox 0 0 24 24, `fill="currentColor"`): `deepgram`, `google`, `openai`, `anthropic`, `elevenlabs`, `microsoft`, and `cartesia` when sourced. `VendorMark({ vendor, decorative })` renders `<svg role="img" aria-label={name}>` or `aria-hidden` inside a fixed `size-6` box, and renders the empty box when the vendor has no path. `hasVendorMark(id)`.
2. `VENDORS[id]` keeps `{ name, monogram }` (concepts B to E still read `monogram`); concept A stops rendering the monogram.
3. `VOICES[].vendor: "cartesia" | "elevenlabs"`, default `cartesia`; `voice(id).vendor` feeds the voice trigger's mark. The API-made agent's voice (P0.2 .d, ElevenLabs Flash v2.5) reads `elevenlabs`.
4. `MARK_LOAD_MS = 3000`: with `sure=slow`, every mark mounts empty and fills after this delay; nothing else changes.
5. `MOTION_MS = 200`: the one duration for the card transition, the strip cross-fade and the first-answer bubble. `motionOn({ sure, mediaReduced })` is false for `sure=reduced`, `sure=motion-off`, or `matchMedia("(prefers-reduced-motion: reduce)").matches`.
6. `ConfidenceState = { status: "rated" | "skipped", score?: 1 | 2 | 3 | 4 | 5, at: string, agentId: string }`, stored under `localStorage` key `ng.v3-concepts.sure` (account level in design mode; survives `reset`). `readConfidence()`, `writeConfidence(state)`, `shouldAskConfidence(agent, state)`: true when the agent is `live`, the state is absent, and the agent is the first live agent of the account (design mode: any live agent while the state is absent).
7. The three `EmptyRow`s keep their strings (P0.5, P0.8) and gain a `min-h` equal to one populated row of the same list (a number line, a run row, an integration row) so the first item lands without a shift.
8. Seeds: none new. `agent_survey` (batch, draft, prompt filled, no context, no runs) is the journey start; `agent_clinic` (P0.8, inbound, draft) carries the Numbers empty row and the Go live that triggers the question; `agent_frontdesk` (inbound, live) proves the question never returns (.e). If P0.8's commit is absent at build time, `agent_clinic` is made here exactly as P0.8's `00-data.md` names it.
9. `parts/events.ts` gains `go_live_confidence_rated {score, deploymentType, agentId, minutesSinceGoLive, motion}` and, if P0.7's or P0.8's commit is absent, `cta_viewed`. `agent_audio_heard` (P0.7) gains the prop `motion: "on" | "off"`.
10. Tests: `hasVendorMark("cartesia")` matches whether the path shipped; `motionOn` for the three off cases; `shouldAskConfidence` true on the first live agent with no state, false once rated or skipped, false on a draft; `writeConfidence` then `readConfidence` round trip; `EmptyRow` min-height equals the populated row's height at 1600 px (a snapshot of the class string is enough).

## What our own account must contain for real screenshots

Only if the owner wants live captures later (this run captures the prototype): one agent per deployment type gone live once (a pointed number, a started run, a first session from software) and a fresh account that has never answered the question. Never sign in or enter credentials for this; the owner creates these in the staging account.
