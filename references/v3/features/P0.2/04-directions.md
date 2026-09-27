# P0.2 Change the default voice · Directions

Track: **v3**. Constraints: existing design system only; reuse, do not redesign; empty first, quiet chrome; locked words (preset, not tier); no price in copy.

## Three directions

### 1. Preset radio cards with a logo strip, Custom as the third card
Keep the Voice & models row's `TierCards` (RadioGroup cards, already on design/v3) and trim it to **Lowest latency**, **Balanced** and **Custom**. Each preset card carries one line on latency and intelligence and a Listen, Think, Speak logo strip; Lowest latency names SuperNode. Picking Custom expands three module rows (Listen, Think, Speak) under the cards, pre-filled from the current preset, each a vendor and model `Select`. The voice `Select` sits under the cards with a play button per item; a muted region line closes the row. Research: Vapi's per module cards with logos (vapi-assistant-model), Retell's voice picker with preview (retell-agent-voice-picker), the desk note's "Balanced default removes the anxiety of not knowing what to pick".

### 2. Segmented preset control, pipeline behind an info tip
A `ToggleGroup` with three segments; the pipeline hides in an `InfoTip`; Custom opens the Advanced sheet on a Models section. Quieter, but the logos Sam uses to recognise the stack are hidden, and Custom splits into a second surface (one door rule broken). Research: Cursor and Raycast model chips (Refero), which serve text models, not a three part pipeline.

### 3. Three module tabs, no presets (Vapi style)
Listen, Think, Speak as tabs, each with a vendor dropdown and a Balanced default. Honest about the pipeline, but every Sam meets vendor choice first, which is the model shopping the job tries to avoid, and nothing counts a preset keep rate. Research: Vapi tabs, ElevenLabs single LLM dropdown.

## Pick: direction 1, preset cards with a logo strip

1. **Trade-off, not shopping.** No vendor offers a latency preset (research brief); two cards that name latency against intelligence answer the job in one click, which is what the 70 % preset keep rate measures.
2. **Recognition without reading.** Vapi shows a logo per module and Retell a latency range (vapi-assistant-model, retell-agent-editor); the logo strip gives the same stack recognition while the copy stays on latency, never price.
3. **One door, same row.** Custom lives in the same radio group and expands in place, pre-filled from the preset (desk note A), so rainy .c and .d are states of one control and `manual_config_opened` fires from one place.
4. **Bounded voice list with inline play.** Retell and ChatGPT keep the voice choice short with preview (retell-agent-voice-picker, Refero 3c237d7b); a grouped `Select` filtered by language covers .e and .g inside the dropdown Sam already uses, towards the 90 s change time.
5. **Reuse.** `TierCards`, `VoiceSelect`, `InfoTip`, `AgentBuilderRow`, `AlertDialog` are on design/v3 today; no new component, token or control shape.

## Questions for the owner (max 3)

1. Presets are two plus Custom (Vineet, Mon 28 Sep). Should `Most capable` disappear from concept A now, or stay until that decision lands? The spec removes it.
2. For .b, when the saved preset itself is down, should the agent keep running on the saved pipeline with only a warning (the spec), or fall back to the other preset?
3. For .h, which URL does the tracked pricing link open until pricing clears (agora.io pricing page or the docs page)?
