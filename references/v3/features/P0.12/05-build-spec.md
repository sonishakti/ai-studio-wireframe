# P0.12 Feel sure before Go live · Build spec

Track: **v3**. Pick: **direction 1, quiet upgrade in place**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.11's commit; if P0.11's, P0.10's or P0.8's commit is absent at build time, the question renders on today's third tab (`tab=deploy` in `AgentA`, the `DeployArea` of `parts/deploy.tsx`) after today's `ConnectNumberSheet` Connect or `NewRunSheet` Start run turns the agent `live`, and `agent_clinic` is made here as P0.8's `00-data.md` names it; if P0.7's is absent, the motion and the live region attach to today's `data-test-answer` bubble in `parts/list-and-create.tsx` and `motion` is added to today's `agent_audio_heard` call; if P0.5's is absent, the height rule applies to today's "Knowledge and tools" `EmptyRow` in `parts/context.tsx`. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.12): see the vendors by their marks, feel the switch and the first answer, answer one question after Go live`.

Scope rule: P0.12 only: the vendor marks (`parts/vendor-marks.tsx`, new; `PipelineStrip` and `VoiceSelect` in `parts/model.tsx`; the module `Select`s in `parts/voice-models.tsx`), the two motions (`PresetCards` in `parts/model.tsx`; the first-answer bubble in P0.7's `parts/test.tsx`, today `parts/list-and-create.tsx`), the height of the three `EmptyRow`s (`parts/common.tsx`), the confidence question (`parts/confidence.tsx`, new, rendered by the Deployment tab), and their data. Touches outside it, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.11 are in review): P0.2's strip drops its monogram `Avatar` for the mark slot and its voice trigger gains a mark; P0.7's transcript container gains `aria-live="polite"` and its bubble the motion classes; P0.8's Deployment tab renders the question above Readiness (below the minutes banner when both show); P0.5's and P0.8's `EmptyRow`s gain a `min-h`; `parts/events.ts` gains two names. Concepts B to E keep compiling: `PipelineStrip` keeps `{ pipeline }`, `EmptyRow` keeps `{ text, action }`, `TestPanel` keeps its props, `VENDORS[id].monogram` stays for the other concepts.

## 1. The flow

Base URLs: the Agent tab `/v3?concept=a&view=agent&agent=agent_survey&tab=agent&section=voice-models`, written `A…`; the Deployment tab `/v3?concept=a&view=agent&agent=agent_clinic&tab=deploy`, written `D…`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `A…` | Voice & models on Renewal survey (batch, Draft), Lowest latency selected: each strip row shows the vendor's monochrome mark in a 24 px slot, then Listen, Think, Speak, then "Deepgram Nova 3", "Google Gemma 4 on SuperNode", "Cartesia Sonic 3.5"; Balanced's Think row shows OpenAI's mark and "OpenAI GPT-5.1 mini"; the voice `Select` trigger reads Cartesia's mark then "Aria · Warm"; Knowledge and tools below reads "The agent answers from its prompt alone." and **Add** (P0.5 renames it Integrations) | Sam opens Voice & models and reads the vendors by their marks |
| 2 | `A…&preset=custom&panel=voice` | Custom selected (P0.2): the three module rows with the vendor `Select` triggers carrying marks (Deepgram, OpenAI, Cartesia) and the items in each list carrying theirs; the voice list open with the trigger's mark; nothing else changed | Sam opens Custom and the voice list and the same marks are there |
| 3 | `A…&preset=balanced` | Balanced selected: the border and fill have moved to it and the Think row reads OpenAI's mark and "OpenAI GPT-5.1 mini"; the still is taken at rest, 300 ms after the press; the transition itself is 200 ms, ease-out, on the border, the fill and the changed row's opacity | Sam picks Balanced and the card and the Think row move in 200 ms |
| 4 | `A…&test=live` (P0.7; absent, the Test sheet open 3 s after Start test) | The test panel docked on the right: "Aria · 0:03", the greeting bubble *"Hi, this is Aria at Acme Energy. …"* just landed (faded and risen 4 px in 200 ms at the audio frame), Listening, **End test**; behind it Voice & models unchanged | Sam hears the first answer and sees it land |
| 5 | `D…` | Clinic reception (inbound, Draft) on Deployment (P0.8): Readiness, Retention, and **Numbers** as one row at a filled row's height reading "No number answers with this agent yet." and **Go live**; the header **Test**, **Go live** | Sam reads the empty Numbers row and presses Go live |
| 6 | `D…&dep=live&sure=ask` | Toast "Live. +1 628 555 0110 answers with this agent." (P0.8); the header badge **Live**; above Readiness an `Alert`: "How confident are you that the agent is ready for people outside the team?", under it "Not at all", five buttons 1 to 5, "Completely", and **Skip** at the right; Numbers lists the number | Sam goes live and the tab asks how confident he is |
| 7 | `D…&dep=live&sure=rated` | The alert gone; toast "Thanks."; the tab as step 6 without the question; `go_live_confidence_rated {score: 4}` logged | Sam presses 4 and the question is gone for good |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b cards | `A…&preset=balanced&sure=reduced` | Balanced selected with no transition class on the card or the row; the radio dot, the border and the Think row's text carry the change | Nothing to do; `motionOn` is false, `agent_audio_heard {motion: off}` on the next test |
| .b bubble | `A…&test=live&sure=reduced` | The greeting bubble in place with no animation class; Listening | Same; the live region still announces it |
| .c | `A…&sure=logo-missing` | Every Listen row shows an empty 24 px slot and "Deepgram Nova 3" as text; the Think and Speak rows keep their marks; the module `Select` and the voice trigger for that vendor show no mark | Nothing to do; the name is on the row. A vendor whose only mark is full colour is treated the same (the set holds monochrome `currentColor` paths only), so a low-contrast mark cannot ship |
| .d | `A…&sure=slow` | For 3 s every slot is empty at its full size, the label column and the card heights unchanged; then the marks fill in with no shift (a second capture at 4 s shows step 1) | Nothing to do; the slot is laid out before the asset |
| .e skip | `D…&dep=live&sure=ask` then **Skip** = `D…&dep=live&sure=skipped` | The alert gone, no toast; `cta_viewed {cta: go_live_confidence}` was the only event | The state `skipped` is stored; a reload shows no question |
| .e never again | `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=deploy&sure=skipped` | Front desk (inbound, Live, P0.8 .e): Readiness three ticks, Numbers with its number, and no question | Nothing to do; `shouldAskConfidence` is false for every agent once the state exists |
| .f | `A…&test=live` (always) | The same screen as step 4; in the accessibility tree the strip marks are hidden and the rows read "Listen, Deepgram Nova 3"; the voice trigger reads "Cartesia, Aria, Warm"; the transcript is a polite live region and the bubble is read when it lands; on the Deployment tab the five buttons read "1 of 5, not at all" to "5 of 5, completely" and the picked card reads checked | Verified with the browser's accessibility tree, not a still |
| motion arm | `A…&preset=balanced&sure=motion-off` | As .b cards; `go_live_confidence_rated {motion: "off"}` on a later answer | The flag's off arm for the A/B; review only |

New search keys, validated in `store.tsx`: `sure` (`ask` \| `rated` \| `skipped` \| `logo-missing` \| `slow` \| `reduced` \| `motion-off`, review only, never written to the store; `ask` renders the question on any live agent's Deployment tab regardless of the stored state; `rated` fires the toast once on mount; `logo-missing` treats Deepgram as unmarked; `slow` delays every mark by `MARK_LOAD_MS`; `reduced` and `motion-off` set `motionOn` false). `openAgent` and `toList` clear `sure`; `openPanel(undefined)` leaves it (as P0.8's `dep`). P0.2's `preset=` and `panel=voice`, P0.7's `test=`, P0.8's `dep=` keep their meaning.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`) and the new `parts/vendor-marks.tsx`. Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `VENDOR_MARKS`, `VendorMark`, `hasVendorMark`; `VOICES[].vendor`; `MARK_LOAD_MS`; `MOTION_MS`; `motionOn`; `ConfidenceState`, `readConfidence`, `writeConfidence`, `shouldAskConfidence`; `CONFIDENCE_KEY = "ng.v3-concepts.sure"`.
- Marks: simple-icons paths for `deepgram`, `google`, `openai`, `anthropic`, `elevenlabs`, `microsoft` (already in `references/v3/features/P0.2/explorations/logos/`); `cartesia` traced from `cartesia.ai`'s brand mark to one path if the brand page allows it (open question 2), else absent. Every path is monochrome, `fill="currentColor"`, viewBox 0 0 24 24; no colour version is kept.
- Seeds: none new; `agent_clinic` and `agent_frontdesk` are P0.8's.
- The answer writes `localStorage[CONFIDENCE_KEY] = { status: "rated", score, at, agentId }`; Skip writes `{ status: "skipped", at, agentId }`; `reset` on the store leaves it (account level). Production: the same shape under an account preference when one exists; until then the browser.
- `parts/events.ts` gains `go_live_confidence_rated`; `cta_viewed` gains `go_live_confidence`; `agent_audio_heard` gains `motion`.
- Tests as listed in `00-data.md` item 10.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Mark slot | `<span className="flex size-6 shrink-0 items-center justify-center text-foreground">` holding `VendorMark` at `size-4` (the shape of P0.5's `KindIcon` slot); rendered even when empty | `parts/context.tsx` `KindIcon` (sibling), `parts/vendor-marks.tsx` |
| Strip row | `PipelineStrip` as it is, the `Avatar` replaced by the slot; the row `key` is `${vendor}-${model}` so a changed row re-mounts | `parts/model.tsx` |
| Module and voice marks | the slot before the trigger text and each item's text in `Select` (`SelectTrigger`, `SelectItem`) | `parts/voice-models.tsx` `ModuleSelects`, `parts/model.tsx` `VoiceSelect`, `src/components/ui/select.tsx` |
| Card motion | the existing `RadioGroup` card `label` with `transition-[border-color,background-color] duration-200 ease-out motion-reduce:transition-none` | `parts/model.tsx` `PresetCards`, `src/components/ui/radio-group.tsx` |
| Row and bubble motion | `tw-animate-css`: `animate-in fade-in-0 duration-200` (row), `animate-in fade-in-0 slide-in-from-bottom-1 duration-200` (bubble), `motion-reduce:animate-none` | `src/styles.css` (`tw-animate-css` import), `parts/test.tsx` |
| Live region | `aria-live="polite"` on the transcript's container `div` | `parts/test.tsx` |
| Empty rows | `EmptyRow` with one `min-h` (Tailwind's `min-h-14`, 56 px: a 40 px list row plus its `py-2`), measured against the filled Numbers, Runs and Integrations rows at build time and set once for all three | `parts/common.tsx` |
| The question | `Alert` (default variant) with `AlertTitle` (the question, `text-balance`) and `AlertDescription` holding one row: the two endpoint labels `text-xs text-muted-foreground`, a `ToggleGroup type="single" aria-label="How confident"` with five `ToggleGroupItem size="sm"` (1 to 5, each `aria-label="{n} of 5, {endpoint}"`), and **Skip** `Button variant="ghost" size="sm"` at the right (`ml-auto`) | `src/components/ui/alert.tsx`, `toggle-group.tsx`, `button.tsx`, P0.8's minutes banner (sibling placement) |
| Thanks | `sonner` toast | `src/components/ui/sonner.tsx` |
| Last save | P0.3's View last save dialog, unchanged (nothing here calls the API) | `src/components/ui/code-block.tsx` |

No new token, component, radius or font size. No circle behind a mark, no colour mark, no placeholder glyph, no stars, no emoji, no Submit button, no free-text field, no title above the question, no green, no animation longer than 200 ms, nothing that animates on load.

## 4. The row, piece by piece

### The marks

```
Voice & models   (•) Lowest latency                    ( ) Balanced                      ( ) Custom
                     Answers fastest. Runs on SuperNode.    Smarter answers, a beat slower.   Pick the vendor and model
                     [dg] Listen  Deepgram Nova 3           [dg] Listen  Deepgram Nova 3      for each part.
                     [g]  Think   Google Gemma 4 on         [oa] Think   OpenAI GPT-5.1 mini
                                  SuperNode                 [c]  Speak   Cartesia Sonic 3.5
                     [c]  Speak   Cartesia Sonic 3.5
                 Language [English v]   Voice [[c] Aria · Warm v]
```

`[dg]` is the bare 16 px mark in its 24 px slot. On the strip the mark is decorative (`aria-hidden`) because the row names the vendor; the voice trigger's mark is functional (`role="img" aria-label="Cartesia"`) because nothing else on that control names the vendor. A vendor without a path renders the empty slot and nothing else; the row's text is unchanged. With `sure=slow` the slot is empty for `MARK_LOAD_MS` then fills.

### The two motions

- **Preset switch.** On the pick, the card's `border-color` and `background-color` transition over `MOTION_MS`; any strip row whose `${vendor}-${model}` key changed re-mounts with `fade-in-0` over `MOTION_MS`. Nothing else in the row animates (not the language, the voice, the region line).
- **First answer.** The first `who: "agent"` bubble of a test mounts with `fade-in-0 slide-in-from-bottom-1` over `MOTION_MS`; later bubbles mount the same way; person lines do not animate. The animation starts at the frame `agent_audio_heard` fires, never before, and the event never waits for it.
- Both read `motionOn`; when false, no transition or animation class is applied (and `motion-reduce:` guards the classes a second time).

### The empty rows

Integrations (P0.5): "The agent answers from its prompt alone." and **Add**. Runs (P0.8): "No runs yet. A run dials one contact list with this agent." and **Go live**. Numbers (P0.8): "No number answers with this agent yet." and **Go live**. Copy untouched; each `EmptyRow` takes the `min-h` of one filled row of its list so the first item lands with no shift.

### The question

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ How confident are you that the agent is ready for people outside the team?      │
│ Not at all  [1] [2] [3] [4] [5]  Completely                              Skip   │
└────────────────────────────────────────────────────────────────────────────────┘
Readiness   ✓ Heard in a test at 14:02, after the last change.
```

Rendered by the Deployment tab above Readiness (below P0.8's minutes banner when both show), for the agent that went live, while `shouldAskConfidence(agent, readConfidence())` is true. One press on 1 to 5 writes the state, unmounts the alert, toasts "Thanks." and fires `go_live_confidence_rated`. **Skip** writes `skipped`, unmounts, fires nothing. Below `@xl` the endpoint labels stack above and below the buttons; Skip stays at the right.

## 5. Behaviour

- **Marks.** `VendorMark` reads `VENDOR_MARKS[vendor]`; absent, it renders the empty slot. `sure=logo-missing` maps `deepgram` to absent for the render only. `sure=slow` mounts every mark with a `MARK_LOAD_MS` timer.
- **Motion.** `motionOn` is computed once per render from `sure` and `matchMedia`; the card, the row and the bubble read it. No motion runs on first paint, on tab change or on a preset restored from the store: only on a change Sam made in this render tree (the card's `transition` fires only when the value differs from the previous render; the row's `key` change and the bubble's mount are the triggers).
- **Empty rows.** `EmptyRow` sets the `min-h` on its outer `div`; the action button keeps its size.
- **Ask.** On the Deployment tab mount and on every `status` change to `live`, `shouldAskConfidence` runs; when true the alert mounts and fires `cta_viewed {cta: go_live_confidence, deploymentType, agentId}` once per mount. The trigger is any Go live: P0.8's number PATCH, P0.10's Start run, P0.11's first session (the tab may already be open when the watch turns the agent live; the alert then mounts in place, with no motion).
- **Answer.** `ToggleGroup` `onValueChange` with a value: `writeConfidence({ status: "rated", score, at, agentId })`, `go_live_confidence_rated {score, deploymentType, agentId, minutesSinceGoLive, motion: motionOn ? "on" : "off"}`, toast "Thanks.", unmount. `minutesSinceGoLive` is the minutes since `status` turned live (design mode: 0 for `dep=live`).
- **Skip.** `writeConfidence({ status: "skipped", at, agentId })`, unmount, no event; the ask already counted as asked.
- **Never again.** `shouldAskConfidence` is false whenever a state exists, on every agent, after a reload, and after the store's `reset` (the key is outside the store). Production: an account preference when one exists (open question 1); the flag is never on the agent.
- **Review states.** `sure=` never writes the store or the key: `ask` renders the alert on any live agent; `rated` renders without it and toasts once on mount; `skipped` renders without it; `logo-missing`, `slow`, `reduced`, `motion-off` change the render only.
- **Keyboard.** The five buttons are one tab stop with arrows (`ToggleGroup`), then Skip; Enter or Space answers. On the strip nothing gains a tab stop. The voice trigger's mark is inside the button and not focusable.
- **Screen reader.** Strip marks `aria-hidden`; module `Select` marks `aria-hidden` (the item text names the vendor); the voice trigger's mark labelled with the vendor name; the transcript `aria-live="polite"`; the cards are P0.2's `RadioGroup` and announce checked; the alert's `AlertTitle` is the question and each button reads "{n} of 5, {endpoint}" ("not at all" for 1, "completely" for 5, "{n} of 5" alone for 2 to 4).
- **Events per action.** `cta_viewed`, `go_live_confidence_rated`, `agent_audio_heard` (P0.7, `motion` added), `preset_changed` (P0.2); each logs once through `trackProto`. No server call anywhere in this row.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics. Never: logo (in UI), icon, brand, survey, feedback, rate, rating, NPS, score, animation, motion (in UI), transition, loading, asset, placeholder, connect, publish, deploy (verb), launch, activate, live (for running), call, preview, prototype, simulated, mock, wireframe.

| Key | Text |
|---|---|
| Question | How confident are you that the agent is ready for people outside the team? |
| Endpoints | Not at all / Completely |
| Buttons | 1 / 2 / 3 / 4 / 5 |
| Button labels (aria) | 1 of 5, not at all / 2 of 5 / 3 of 5 / 4 of 5 / 5 of 5, completely |
| Group label (aria) | How confident |
| Skip | Skip |
| Thanks toast | Thanks. |
| Voice trigger mark (aria) | {vendor} |
| Strip rows (P0.2, unchanged) | Listen / Think / Speak, then {vendor} {model} |
| Empty rows (P0.5, P0.8, unchanged) | The agent answers from its prompt alone. / No runs yet. A run dials one contact list with this agent. / No number answers with this agent yet. |
| Empty row actions (unchanged) | Add / Go live / Go live |

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (logo, icon, brand, survey, feedback, rate, rating, NPS, score, animation, motion, transition, loading, connect, publish, deploy, launch, activate, live, call, preview, prototype, simulated, mock, wireframe, arrows, em dashes). A grep of `parts/vendor-marks.tsx` must find no `fill="#` and no `<image`. Every mark path renders at 16 px in light and dark with no colour. P0.1, P0.3, P0.4, P0.6, P0.9, P0.10 and P0.11 routes unchanged; P0.2's strip and voice trigger, P0.5's and P0.8's empty rows, P0.7's bubble and transcript, and P0.8's tab touched only as declared. Every URL in section 1 renders at 1600 px and 375 px, light and dark; .b captured with the browser's reduced-motion emulation as well as `sure=reduced`; captures into `flow/NN-<slug>.png` in flow order: 01 marks-on-presets, 02 marks-on-custom-and-voice, 03 balanced-switched, 04 first-answer-landed, 05 numbers-empty, 06 live-and-asked, 07 rated-thanks, then rainy 08 b-reduced-cards, 09 b-reduced-bubble, 10 c-logo-missing, 11 d-slow-empty-slots, 12 d-slow-filled, 13 e-skipped, 14 e-never-again, 15 f-reader (step 4's frame; the tree check is logged in the run log), 16 motion-off-arm. Optional, if agent-browser records video: `flow/03-balanced-switched.webm` and `flow/04-first-answer-landed.webm`, 2 s each.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.12 · Feel sure before Go live` after P0.11's, child sections 1 JTBD, 2 Research (the 12 shots in `02-research.md` with their regions), 3 Flow (16 story frames), 4 Hero (Voice & models at step 3 with the marks and Balanced just picked; the Deployment tab at step 6 with the Live toast, the number listed and the question; the docked test panel at step 4 with the first answer landed), 5 Rationale with the three links. Owner ask of 26 Sep: add a child section **UI Explorations** with 3 to 5 native variations of the second hero screen (the Deployment tab right after Go live: header Live, Readiness three ticks, Retention, Numbers with `+1 628 555 0110 · Spare`, and the question with its five buttons and Skip), each meticulously built from the kit on page 31:2 with variables bound, never detached, hero screens only, nothing interactive, grounded in Refero and tagged with its source per `explorations/brief.md` (DoorDash `469e69a2-e9a6-471d-a3f1-3f5b93d6179f` and `45dde24c-6328-4949-b0f3-02e5293607cf` for the ghost Dismiss beside a 5-point scale; New Balance `67ea8ba6-b1bd-454d-b8ea-dc39a44a5bf4` for Skip beside the scale with endpoint labels; Anam `a755f0b8-f976-4465-8d0b-1a76a1a2340c` and `6df60630-5b57-49f2-afb4-430707a2d9aa` for post-session rating chips in an AI product; Instacart `511cdea1-3ec1-4621-b0ae-7d0f1b34e7f0` for "Rate your experience" as a plain title; Starbucks `283e0153-e144-4053-9d3b-76843302c092` for a persistent side tab, as the cut corner-card contrast; the research shots `retell-02` for the corner card, `refero-twist-01` for the endpoints, `refero-linear-01` for the Live moment, `refero-rox-01` and `vapi-01` for a mark row). The first hero (Voice & models with marks) is not explored again: P0.2's UI Explorations already cover it. Logos: only in the Live moment variation, which shows the tested pipeline as three marks (Deepgram, Google, Cartesia or its name) from `references/v3/features/P0.2/explorations/logos/`, tagged as logos; lucide `Check`, `X`, `PhoneIncoming` and the kit's gray tick are the only other glyphs. Load `figma:figma-use` first.
