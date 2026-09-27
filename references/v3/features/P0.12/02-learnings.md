# P0.12 Feel sure before Go live · Learnings

Research order (owner rule, 26 Sep): existing shots reused, then Refero for the confidence-survey and empty-state gaps, then the built-in browser for this row's own before shots. All shots are in `shots/`; `02-research.md` names each source. Vapi, Retell and ElevenLabs stay Partial: nobody shows a preset switch in motion or a confidence question after going live, so learnings 5 and 6 are original work.

## 1. A mark sits beside the name, at one size, or not at all

- Vapi puts a small real brand mark next to the vendor name on every pipeline card, at the density our cards already use (`vapi-01-assistant-model-logos.png`). Retell puts the mark before the model chip and no mark on the voice (`retell-01-agent-editor-logos.png`). ElevenLabs pairs a full-colour mark with every channel name (`elevenlabs-01-agent-channels-logos.png`).
- Rox mixes real marks with generic line icons in one grid and the cards stop reading as one set (`refero-rox-01-integrations-not-connected.png`); ElevenLabs falls back to a plain icon for alpha channels. **A missing mark falls back to nothing, never to a placeholder glyph.** The name is already on the row.
- Our monograms in circles (`before-01-voice-models-preset-cards.png`) look like avatars of people. **Bare monochrome marks in a fixed slot, one optical size, the row's text colour.**

## 2. Retell asks its one question in the corner, and it can nag

- Retell's own product shows a 1 to 10 card with an ✕ over the empty Phone numbers page (`retell-02-phone-numbers-empty.png`, region 1176,1688,848,272). It proves a one-question, non-blocking ask in a product like ours. Nothing on screen says whether it was answered before, so it plausibly returns. **Ask once, store the answer or the skip, never show it again.**
- The Console has no floating card surface; the page notice is `Alert` (DESIGN.md §5). **The question is a notice on the Deployment tab, where Go live just happened, not a card over the page.**

## 3. Skipping is a ghost button, and a scale needs no legend

- DoorDash pairs a ghost **Dismiss** with a filled **Submit** (`refero-doordash-01-dismiss-vs-submit.png`), so skipping is never styled as a low score. Twist's modal has only **OK**, a forced answer (`refero-twist-01-confidence-rating-1-5.png`). **Skip is `ghost`, and nothing is filled.**
- Twist's 1 to 5 with plain endpoint labels reads instantly; Retell's 1 to 10 needs the eye to count. **Five buttons, endpoints "Not at all" and "Completely", one press to answer, no Submit.**

## 4. An empty card holds the size of the full one

- Vercel's empty Preview Deployments card is pre-sized to the populated list's footprint, so nothing reflows when the first deployment lands (`refero-vercel-01-preview-deployments-empty.png`). Our three empty rows already share one shape, one sentence plus one action (`before-01-voice-models-preset-cards.png` region 976,1616,1501,88; `before-03-runs-empty.png`), and the copy is P0.5's and P0.8's. **P0.12 adds the height rule only: an empty row is as tall as one filled row.**

## 5. Quiet first runs carry one decision

- Linear's welcome is one sentence, one button and one motif on a dark canvas (`refero-linear-01-welcome-dark.png`). It is content-free, which our rows cannot be, but it sets the bar for the ask moment: **one question, one row of buttons, one Skip, nothing else competing.** No illustration, no title above the question, no reason chips (Instacart adds them; we do not).

## 6. Nothing moves today, so the motion is designed from zero

- The preset cards carry only a hover `transition-colors`, and the first-answer bubble carries no transition at all (`before-02-test-panel-first-answer.png`; source read of `model.tsx` and `list-and-create.tsx`). No vendor still shows a switch in motion. **Two motions only, both on a state change Sam caused: the picked card and the changed strip row, and the first answer bubble. 200 ms, ease-out, off under reduced motion, and never the only signal of the change.**
- The deployed preview's Test panel showed no bubble after 8 s while the source fires one at 2 s (research gap 2). The build must confirm which element is current before attaching motion; the spec names P0.7's `data-test-answer` bubble and, if P0.7's commit is absent, today's.
