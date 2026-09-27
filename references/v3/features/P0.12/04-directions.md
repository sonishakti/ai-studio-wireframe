# P0.12 Feel sure before Go live · Directions

Track: **v3**. Constraints: concept A; existing design system only, no new token; reuse, do not redesign; empty first, quiet chrome; locked words; the four PRD steps are fixed, so the directions differ on the one surface this row adds, the confidence question, and on how far the marks and the motion go.

## Three directions

### 1. Quiet upgrade in place
Marks replace the monograms in the slot the strip already has; the two motions run on the elements that already change; the three empty rows gain a height; and the question is an `Alert` at the top of the Deployment tab, shown from the account's first Go live until one press on 1 to 5 or **Skip**, then never again. No new surface, no new door.
Research: Vapi and Retell marks beside names (`vapi-01`, `retell-01`); Retell's one-question card as the ask (`retell-02`); DoorDash's ghost dismiss (`refero-doordash-01`); Twist's 1 to 5 endpoints (`refero-twist-01`); Vercel's pre-sized empty card (`refero-vercel-01`).

### 2. The question rides the Live toast
Everything as direction 1 except the ask: the Go live toast ("Live. {number} answers with this agent.") grows a second line with the question and five buttons, through `sonner`'s custom body, and stays until pressed or closed.
Research: none of the vendors; the shape is our own toast. Retell's card is the nearest, and it is not a toast.

### 3. A Live moment
After the first Go live the Deployment tab opens with a full-width panel above the rows: "Live." with the number, run or first session, the tested pipeline as three marks, and the question beneath, on the quiet single-focus canvas Linear's welcome uses. Marks and motion as direction 1.
Research: Linear's welcome (`refero-linear-01`); Rox's mark row (`refero-rox-01`); ElevenLabs' mark-plus-name rows (`elevenlabs-01`).

Cut before scoring: Retell's floating corner card (a surface the Console does not have, and it nags); full-colour marks in circles (fail .c in dark mode and read as avatars); a Submit button under the scale (DoorDash's, one press is enough); free text under the question (the PRD drops `freeText`).

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 In place | 2 In the toast | 3 Live moment |
|---|---|---|---|
| Fits the four PRD steps and the KPI trigger (after `channel_connected`) | 5 | 4 | 5 |
| Reuse, one door, no new surface | 5 | 4 (custom toast body) | 2 (new panel) |
| Empty first, quiet chrome | 5 | 4 | 2 (a celebration panel) |
| .e asked once, skip is not a low score | 5 | 2 (auto-dismiss is ambiguous; a closed toast cannot be told from a skip) | 5 |
| .b .d .f (reduced motion, no shift, screen reader) | 5 | 3 (a toast is announced once, the buttons are hard to reach) | 4 |
| Response rate (the question is seen) | 4 (only on the Deployment tab) | 3 (a toast is missed) | 5 |
| Counter metric TTFA (no extra work in the test path) | 5 | 5 | 5 |
| Fits batch and code Go live, not only inbound | 5 | 3 (code's first session may arrive with no toast) | 4 |
| **Total / 40** | **39** | **28** | **32** |

## Pick: direction 1, quiet upgrade in place

1. **One surface per step, all of them existing.** Marks go where the monograms are (`PipelineStrip`, the module and voice `Select`s), motion goes on the elements that already change, the height goes on the `EmptyRow` that already exists, and the question is the Console's page notice (`Alert`) on the tab where Go live just happened. Nothing new to learn, nothing to diff against a sibling that is not already there.
2. **The ask is honest and cannot nag.** Shown after the first `channel_connected` of any type, one press or **Skip**, the state stored, never shown again; DoorDash's ghost dismiss keeps a skip from reading as a 1 (`refero-doordash-01`), and Retell shows the shape works in a product like ours (`retell-02`).
3. **Trust from recognition, not decoration.** Vapi and Retell put a real mark beside the vendor at exactly our density (`vapi-01`, `retell-01`); monochrome marks at one size, or nothing, avoid Rox's mixed grid (`refero-rox-01`) and settle .c in dark mode by construction.
4. **Motion that respects the counter metric.** 200 ms on two state changes only, started at the audio frame so `agent_audio_heard` and TTFA are untouched; `motion-reduce:` and the flag arm switch it off, and the radio dot, the text and the live region carry the change without it (.b, .f).
5. **Measurable from day one.** `cta_viewed {cta: go_live_confidence}` is the ask, `go_live_confidence_rated {score, deploymentType, motion}` the answer; response rate and the A/B arm fall out of the two events with no new schema.

## Questions for the owner (max 3)

1. The asked flag has no home in the API. Until an account preference exists, it lives in the browser, so a second browser may ask once more. Accept, with PostHog as the KPI's truth?
2. Cartesia has no mark on simple-icons or svgl; `cartesia.ai` is reachable. May the build trace the brand mark to one monochrome SVG, or should Speak ship as text (.c) until the mark is cleared?
3. A code agent's first session can arrive while nobody is in Studio; the question would then wait on the next Deployment open, possibly days later. Ask anyway, or expire the ask 7 days after the first Go live?
