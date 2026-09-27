# P0.12 Feel sure before Go live · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.12]. No ClickUp comments on the task, so there are no change notes. A quality row across P0, not a job step: it touches four surfaces other rows own and adds one moment of its own.

## Job step

Sam feels sure enough of the agent to put the agent in front of people outside the team.

**Job statement.** When I have built and tested an agent, I want the builder to look and behave like it knows what it is doing, so going live is a decision, not a gamble.

**Why now.** Every P0 row before this one is functional. What none of them carries is trust: the vendors behind a preset show as two-letter monograms, nothing moves when a state changes, and after Go live the Console never asks whether Sam felt sure. The KPI for the whole of P0 is a confidence rating, and today nothing collects it.

## Happy path · P0.12.a

Story: Sam wants to trust the agent before callers hear the agent, so going live is a decision, not a gamble.

1. On **Voice & models** the Listen, Think and Speak rows of every preset card carry the vendor's mark beside the model; the Custom module `Select`s and the voice `Select` carry the same marks. No event.
2. Sam picks **Balanced**: the card's border and fill move to it and the Think row cross-fades to GPT-5.1 mini, 200 ms. `preset_changed` (P0.2). In a test, the first answer bubble fades and rises into the transcript, 200 ms, at the frame the audio is heard. `agent_audio_heard {motion}` (P0.7, prop added).
3. Integrations, Runs and Numbers each read one sentence saying what goes there and one button that puts it there, at the height of a filled row, so the first item lands without a shift. No event.
4. Right after the account's first Go live, the Deployment tab asks one question: how confident are you that the agent is ready for people outside the team? Five buttons, one press. `cta_viewed {cta: go_live_confidence}` on show, `go_live_confidence_rated {score}` on the press.

Done when: every named vendor on Voice & models shows a mark or its name, the two motions run at 200 ms and stop under reduced motion, the three empty rows share one shape, and the question is asked once per account and answered or skipped in one press.

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.12.b | Sam has reduced motion turned on | The card, the strip row and the bubble change with no transition; the radio dot, the border and the text carry the change | `agent_audio_heard {motion: off}` |
| P0.12.c | A logo is missing or has low contrast in dark mode | The mark's slot stays empty and the vendor name stands as text on the same row; marks are monochrome and take the row's text colour, so contrast is the token's in both themes; a vendor with only a colour mark counts as missing | none |
| P0.12.d | Assets load slowly | Every mark has a fixed slot from the first paint, so the row, the label column and the card height never move when the mark arrives; the empty rows hold a filled row's height | none |
| P0.12.e | Sam skips the confidence question | **Skip** removes the question; it is never shown again on any agent in this account; a skip fires nothing beyond the ask, so it counts as no answer, not a low score | `cta_viewed` only |
| P0.12.f | Sam uses a screen reader | A mark next to its written vendor name is `aria-hidden`; a mark that stands alone (the voice trigger) carries the vendor name as its label; the transcript is `aria-live="polite"` so the first answer is read; the picked card is `aria-checked`; the five buttons read "1 of 5, not at all" to "5 of 5, completely" | none |

## Measures

- KPI: go live confidence, mean 4.0 / 5 or higher on `go_live_confidence_rated` after the first `channel_connected` per account; response rate = rated over asked (`cta_viewed {cta: go_live_confidence}`); no read below n = 30 per arm.
- Counter metric: TTFA p75 within +10 % (`agent_test_started` to `agent_audio_heard`); the bubble's motion starts at the audio frame and never delays the event.
- Arms: `motion` on or off as a flag; both arms are asked. Kill motion if TTFA p75 rises by more than 10 %.
- API: UI only. No field for marks, motion, the answer or the asked flag; the asked flag is browser-held until an account preference exists (open question 1).
