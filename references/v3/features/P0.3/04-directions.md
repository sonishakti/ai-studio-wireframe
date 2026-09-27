# P0.3 Make the conversation feel natural · Directions

Track: **v3**. Constraints: port `AdvancedSharedSection`, do not redraw; existing design system only; one door per action; empty first, quiet chrome; tooltip, not helper text; locked words (session, not call); P0.2's Custom is the only model door.

## Three directions

### 1. One sheet, three groups (the port)
Keep the right sheet the live Console already opens from Voice & models (`AgentAdvancedSettingsSheet` over `AdvancedSharedSection`). Inside, three `FormSheetSection` groups, Listen, Think, Speak, in the strip's order; each row is the live `AdvancedRow` fold (chevron, title, switch where the API has a boolean) whose collapsed line states the current value. Labels carry an (i) with the default and the range. The group header shows the gray tick and a **Reset** only once the group differs from spec defaults. Model rows reuse P0.2's vendor and model selects, so a model change in the sheet is the same Custom as in Voice & models. The realtime agent shows one Turn detection row with the reason line. Footer **Cancel** · **Save** · **Save and test**; a close with edits opens the guard.
Research: Retell's sibling accordions (`shots/retell-agent-editor.png`), LiveKit's one nav section for turns and interruptions (`shots/livekit-01-turns-overview-docs.png`), Vapi's default plus range on the control (`shots/vapi-05-call-timeouts.png`).

### 2. Everything inside Voice & models (Custom grows)
No sheet. Picking Custom expands the module box, and under each module's selects the tuning rows unfold: turn detection under Listen, history under Think, filler words and skip patterns under Speak. One row holds the whole pipeline. But a preset user meets a forty-field wall inside the first row of the builder, which breaks empty first and the 30 % counter metric; the row's inline Cancel and Save now guard tuning as well as models, so .h and P0.2's discard dialog collide; and P0.2 is in review, so its row would be rebuilt rather than extended.
Research: Vapi's Model, Transcriber, Voice tabs each carrying their own advanced fields (`shots/vapi-assistant-advanced.png`).

### 3. An Advanced section on the page (rail, not sheet)
Advanced becomes a fourth builder section with sub-anchors Listen, Think, Speak under the section rail (ADR 0017), full width for sliders with both bounds at the ends. Page edits write live, so there is no draft, no Cancel and no leave guard; the KPI's "Save and test" has no button to press; and a section that 70 % of agents should never open now sits in the rail beside System prompt.
Research: Vapi's Advanced tab (`shots/vapi-assistant-advanced.png`, `shots/vapi-05-idle-messages.png`).

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 Sheet, three groups | 2 Inside Voice & models | 3 Page section |
|---|---|---|---|
| Port, do not redraw | 5 | 2 | 3 |
| Empty first, quiet chrome (defaults fit most agents) | 5 | 1 | 3 |
| One door per action (model change is P0.2's Custom) | 5 | 5 | 3 |
| Rainy .b to .h in one place | 5 | 3 | 2 (no .h) |
| KPI: change then heard in the same session | 5 | 4 | 3 |
| Touches P0.2 (in review) | 4 (footer door, realtime state) | 1 | 4 |
| API fit (draft PATCH of edited fields only) | 5 | 4 | 3 |
| **Total / 35** | **34** | **20** | **21** |

Cut: 2 rebuilds P0.2's row and buries the preset user; 3 loses the draft that .f and .h need and adds a rail item for a panel most agents never open.

## Pick: direction 1, one sheet, three groups

1. **Port, not redraw.** The live builder already opens this sheet from Voice & models with `AdvancedRow` folds; v3 regroups and completes it (requirement 38) without a new surface.
2. **Defaults carry the panel.** Every field opens at its spec value with the range in the (i), the way Vapi prints both bounds on the control (`shots/vapi-05-call-timeouts.png`) and Retell names the default on the option (`shots/retell-03-background-noise.png`); the tick and Reset appear only on a group that differs, so an untouched agent shows quiet chrome and the 30 % counter stays honest.
3. **Same words as the strip.** Listen, Think, Speak match the preset card and Custom (P0.2), and the model rows are P0.2's own selects, so .c is one door, and LiveKit's grouping of turns, interruptions and silence (`shots/livekit-01-turns-overview-docs.png`) lands in Listen.
4. **Heard in the same session.** A draft with **Save and test** ties `advanced_setting_changed` to `agent_audio_heard`, which is the KPI; the guard (.h) and Reset (.f) fall out of the same draft.
5. **Honest about realtime and the API.** One Turn detection row with the reason line follows LiveKit's own wording (`shots/livekit-03-realtime-interruption-ignored-docs.png`); read-only rows keep API-only fields visible and safe on save (.g).

## Questions for the owner (max 3)

1. Footer: **Cancel · Save · Save and test** in Advanced (and the same footer for the Greeting and failure message sheet in P0.4), or only **Save and test** to push the KPI harder? The spec builds all three.
2. Silence: the API gives `silence_config.timeout_ms` no default and no range. When Sam turns it on, Studio pre-fills 6 s and caps at 60 s (the live Console's bound). Keep, or ask the API team for a spec default?
3. Filler words on a realtime agent: `filler_words` sits on the agent, so the API accepts it, but a realtime model has no separate voice to play them. The spec keeps the row; hide it instead?
