# P0.2 Change the default voice · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.2]. Change notes from the owner: none. Depends on P0.1 (the agent saves on Lowest latency and the builder opens on Voice & models).

## Job step

If Sam is not happy with the default voice, Sam changes the speech recognition, language model, voice and language until the agent sounds right and answers well enough for the use case.

- **Job.** Make the agent sound right and answer well enough for the use case.
- **Situation.** Sam just created an agent; it runs on Lowest latency with a default voice, and Sam has not learned any vendor.
- **Sam wants to** hear and swap the voice, and trade latency for intelligence in one choice, with full control only when needed.
- **So that** time goes into the prompt, not into model shopping.

## Happy path · P0.2.a

1. Voice & models opens with **Lowest latency** selected. One strip shows its speech recognition, language model and voice logos. `builder_opened`
2. Sam plays a sample from the voice dropdown and picks a voice. `voice_previewed`, `voice_selected`
3. If answers need more intelligence, Sam picks **Balanced**. The copy names the trade-off between latency and intelligence and never shows a price. `preset_changed {preset: balanced}`
4. For full control, Sam opens **Custom**. It is pre-filled with the current preset, and Sam changes the vendor, model or language per module. `manual_config_opened`, `model_slot_sheet_opened`, `model_slot_configured`
5. One region line reads US East, and SuperNode is named inside Lowest latency. Sam saves. `agent_updated` (server)

Done when: the agent saves with the chosen preset or Custom pipeline and voice; changing only the voice takes 90 s of active time or less (median, provisional).

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.2.b | A preset's model is down (vendor outage, SuperNode capacity) | The preset is disabled with the reason. The saved pipeline is untouched | none (read only) |
| P0.2.c | Sam half-filled Custom, then picked a preset | A confirm asks before the Custom values are discarded | `preset_changed` only on confirm |
| P0.2.d | An API agent's pipeline matches no preset | It opens as Custom with its own values | `builder_opened {preset: custom}` |
| P0.2.e | The voice sample will not play | Sam can retry inline. The voice still saves | `voice_previewed {ok: false}` |
| P0.2.f | Sam works far from US East | A latency note sits on the preset. There is no region picker | none |
| P0.2.g | The voice cannot speak the chosen language | The voice list filters to the language. A saved mismatch shows one line on the voice row | none |
| P0.2.h | Sam wants the price before choosing | No price shows until pricing clears. One tracked link opens the pricing page | `external_link_opened {surface: pricing}` |

## Measures

- KPI: 7 in 10 go lives keep Lowest latency or Balanced without opening Custom (preset keep rate at least 70 %).
- Counter metric: Custom opened with no module configured before the builder closes on 10 % of Custom opens or fewer (`manual_config_opened` without `model_slot_configured` before `builder_exited`).
- If the keep rate falls below 50 %, the PRD adds a third preset.
- API: Ready for pipelines; Partial for preset identity (`labels.studio_preset`); Missing for region, price and SuperNode.

## Open decision that blocks lock

Owner decision "Presets: two (Lowest latency, Balanced) plus Custom, with preset locked over tiers" (Vineet, Mon 28 Sep). This spec builds two plus Custom, as the row says.
