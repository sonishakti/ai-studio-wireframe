# P0.12 Feel sure before Go live · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 px, scale 2, dark, from the design/v3 preview with `scripts/drive.mjs`, design-mode fixtures, no sign-in.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-voice-models-preset-cards.png` | `/v3?concept=a&view=agent&agent=agent_survey&tab=agent&section=voice-models` | Voice & models on Renewal survey: three preset cards with monograms; Knowledge and tools empty |
| `shots/before-02-test-panel-first-answer.png` | the same with the Test sheet open, 8 s into a test | The panel: a timer and Listening, no first answer |
| `shots/before-03-runs-empty.png` | `…&tab=deploy` | Runs: "No runs yet. A run calls one contact list with this agent." and **New run** |

## Before · concept A today (dfdbb2fa, P0.3's commit)

1. **Monograms, not marks.** Every strip row shows a two-letter text monogram in a 24 px circle ("DG", "G", "OA", "C"); the circles read as avatars and the letters carry no recognition (`before-01`, region 976,285,1501,419). Amber.
2. **Nothing moves on a state change.** The radio card has a hover `transition-colors` only; picking Balanced swaps the border, the fill and the Think row in one frame. The first-answer bubble carries no transition (`model.tsx`, `list-and-create.tsx`). Amber.
3. **The first answer never showed on the preview.** After 8 s live the panel showed the timer and Listening only (`before-02`, region 2477,208,715,1552), while the source fires the bubble at 2 s: the preview was behind the source. Red for the build to confirm before attaching motion.
4. **The empty rows are right but unsized.** One sentence and one action, the same shape three times (`before-01` region 976,1616,1501,88; `before-03` region 432,378,2045,80), but the row grows when the first item lands. Amber. The Runs line still says "calls" (P0.8 and P0.10 fix the string; not touched here).
5. **No confidence question anywhere.** Nothing asks Sam after Go live; no `go_live_confidence_rated`, no asked flag, no survey component in the tree. The P0 KPI has no source. Red.
6. **No accessibility on the marks.** The monogram `Avatar` is `aria-hidden` with no name, the transcript has no live region, so a screen reader hears neither the vendor nor the first answer. Red for .f.
7. **No reduced-motion or slow-asset behaviour**, because there is no motion and there are no assets yet.

## After

The same four surfaces, extended in place. On **Voice & models** each strip row shows the vendor's monochrome mark in a fixed 24 px slot beside "{vendor} {model}"; the Custom module `Select`s and the voice `Select` trigger carry the same marks; a vendor with no mark leaves the slot empty and its name stands as text. Picking a preset moves the border and fill to the card and cross-fades the changed strip row in 200 ms; in a test, the first answer bubble fades and rises in 200 ms at the audio frame; both are off under reduced motion, and the radio dot, the text and a live region carry the change without it. Integrations, Runs and Numbers keep their one sentence and one button and take a filled row's height, so the first item lands without a shift. After the account's first Go live, an `Alert` at the top of the Deployment tab asks "How confident are you that the agent is ready for people outside the team?" with five buttons, "Not at all" to "Completely", and a ghost **Skip**; one press answers, fires `go_live_confidence_rated`, and the question never returns on any agent.

| Before | After | Why |
|---|---|---|
| "DG" in a circle | Deepgram's mark, bare, 16 px in a 24 px slot, `text-foreground` | Learning 1 (Vapi, Retell); .c contrast by construction |
| Circle with a letter when unknown | Empty slot, the name as text | Learning 1 (Rox's noise); .c |
| Border and fill jump | `transition-[border-color,background-color] duration-200`, `motion-reduce:transition-none` | .a step 2; .b |
| Think row swaps in one frame | The changed row re-mounts with `animate-in fade-in-0 duration-200` | .a step 2; .b |
| Bubble appears | `animate-in fade-in-0 slide-in-from-bottom-1 duration-200`, `aria-live="polite"` on the transcript | .a step 2; .f |
| Empty row grows on the first item | `min-h` of one filled row | Learning 4 (Vercel); .d |
| No question | `Alert` on the Deployment tab: the question, five `ToggleGroupItem`s, **Skip** | Learning 2, 3 (Retell, DoorDash, Twist); the KPI |
| No record | `cta_viewed {cta: go_live_confidence}`, `go_live_confidence_rated {score, motion}`, `localStorage` asked flag | The KPI's formula and .e |

Nothing new enters the design system: `Alert`, `ToggleGroup`, `Button`, the `EmptyRow` and `KindIcon` slot patterns, `sonner`, Tailwind's `transition`, `duration-200` and `motion-reduce:`, and `tw-animate-css`'s `animate-in` all ship today. One SVG path per vendor is data, not a token.
