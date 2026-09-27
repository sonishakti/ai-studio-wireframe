# P0.3 Make the conversation feel natural · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.3]. Change notes from the owner: none. Depends on P0.1 (the agent exists on Lowest latency) and P0.2 (Voice & models with presets and Custom). Requirements 38 and 11.

## Job step

When the agent is close but not right, Sam makes the conversation feel natural: the agent stops talking over people, waits the right time through a silence, and still says something useful when a part fails.

- **Job.** Stop the agent talking over people and make it wait the right time.
- **Situation.** The prompt works and the preset sounds fine, but in the test the agent cuts in during a pause, or sits quiet too long, or an API-made agent behaves in a way the builder does not show.
- **Sam wants to** open one panel, see what every setting is at, change one thing, and hear the difference in the next test.
- **So that** the agent goes live without callers hanging up, and no setting ever gets lost on save.

## Happy path · P0.3.a

Story: Sam wants the agent to stop talking over callers, so sessions sound natural and callers stay on the line.

1. From Voice & models Sam presses **Advanced settings**. One sheet opens, grouped **Listen**, **Think**, **Speak**; every row shows its current value on one line. `advanced_panel_opened {pipeline: cascaded}`
2. Each field is at its spec default. The (i) beside a label says the default and the range; there is no helper text. Nothing carries a tick and no group offers Reset, because nothing differs yet.
3. Sam raises **Silence** under End of speech from 320 ms to 480 ms and turns on **Filler words**. The Listen and Speak headers get the gray tick and a **Reset**. The agent stays on Lowest latency: tuning never changes the preset; only a model does. `model_slot_configured` only if a model changes
4. Sam presses **Save and test**. The sheet saves and closes, the test panel opens, and the next answer plays with the new timing. `advanced_setting_changed {group, field, from, to}` per changed field, `operation_succeeded {operation: agent_update}`, `agent_updated` (server), then `agent_audio_heard {surface: test_panel, agentVersion}`

Done when: the agent saves with the changed fields and Sam hears a test answer in the same builder session.

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.3.b | Sam types a value out of range (silence 60 ms; the range is 120 to 2000) | The field turns red with one line "Enter 120 to 2000 ms." Save and Save and test stay off until it is fixed | none |
| P0.3.c | Sam changes a model while on a preset | The same vendor and model selects as Custom sit in the group's model row; changing one makes the agent Custom, and one line under the row says why. Voice & models shows Custom after save | `model_slot_configured {slot, surface: advanced}`, `preset_changed {from, to: custom}` |
| P0.3.d | The agent runs a realtime pipeline | Listen holds one Turn detection row for the model's own detection, with **Reply after silence** and **Threshold** labelled OpenAI Realtime only; one line says why speech recognition and interruptions have no settings here and why the silence reminder is not available. Think shows the realtime model without History; Speak shows Avatar with one line. MCP servers stay in Knowledge and tools; tools are not offered and one line under the list says why | `advanced_panel_opened {pipeline: realtime}` |
| P0.3.e | Sam looks for idle timeout, max duration or graceful stop | One line at the end of the sheet: these belong to the session, not the agent. Batch links to New run, whose Session limits fold holds them; code links to the code snippet, which carries `lifecycle`; inbound says the API has no per-number setting yet; an API agent with no deployment type is told to set them per session | none |
| P0.3.f | Sam regrets a change | **Reset** on the group header returns that group's tuning to spec defaults in the draft; models, endpoints and keys stay. Cancel still restores the saved values | `advanced_group_reset {group}` |
| P0.3.g | An API agent uses a field the panel lacks (`llm.style`, `params`, modalities) | The field shows read-only inside its group with its value and the line "Set through the API. Saving keeps it." Save sends only the fields the panel edited | none |
| P0.3.h | Sam closes the sheet with unsaved changes | A dialog asks: Keep editing, Discard, Save | none |

Empty account: a brand-new account has no agent, so Advanced has no door until P0.1 creates one. The first agent then opens Advanced exactly like step 2, at spec defaults with nothing ticked.

## Measures

- KPI: at least 60 % of Advanced changes are followed by a heard test answer in the same builder session (`advanced_setting_changed` to `agent_audio_heard` on the same agent).
- Counter metric: Advanced opened by 30 % of new agents or fewer before `channel_connected`. Above 50 %, the most-changed group moves out of Advanced.
- Assumption to test: spec defaults fit most agents.
- API: Ready for `turn_detection`, `silence_config`, `filler_words`, `max_history`, `avatar`, `url`, `headers`, `skip_patterns`. Partial for `silence_config` (no default or range in the spec; Studio suggests 6 s) and realtime `turn_detection` (no defaults in the spec; Studio pre-fills the values the live Console uses). Missing: `tts.model` (the voice model lives in `tts.params` under the vendor's key); on the agent by design, `lifecycle` (session and campaign only); on realtime, `max_history`, `failure_message`, `silence_config`, function tools. `agentVersion` reads `updated_at`, since the v3 Agent has no version field.
