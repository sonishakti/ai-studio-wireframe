# 02 · JTBD + success metric

**JTBD.** When a caller talks over my agent, pauses mid-thought, or waits for it to go first *(situation)*, I want the agent to stop, wait and listen the way a person would *(motivation)*, so callers aren't talked over or left hanging, and don't hang up *(outcome)*.

**Personas.** P1 hustler — picks a word (Responsive · Balanced · Patient), hears it once, ships; never wants to meet "prefix padding". P2 platform engineer — wants the ms, keyword interruption for a kiosk, manual SoS/EoS over RTM, and proof that the effective values match production (868kytqwj: "Simulation exercises the same effective values used in production"). P3 CX/compliance lead — needs "finish the disclaimer, then answer" (interruption off · append) and one speaker locked on a noisy line.

**Success events (activation-linked).**
- `turn_taking_preset_applied` `{preset: responsive | balanced | patient, from: preset | custom}` — fired by the Turn-taking row through the same handler as the existing Quick Presets (`agent-config-drawer.tsx` :715).
- `interruption_tested` `{result: interrupted | not_interrupted | unavailable, interrupt_ms?, mode: start_of_speech | keywords | off | manual}` — fired by "Try interrupting" on the live test; qualifies `agent_tested_configured_succeeded` (event-taxonomy-review: ≥1 complete user–agent turn with audio both ways).
- `speaker_lock_enabled` `{mode: locking | recognition}` — from the renamed SAL row (same property write as today).

North-star link: a caller who isn't talked over stays on the call → the live deployment keeps carrying traffic (`deployment_went_live` → `first_minutes_consumed`). Rejected KPIs: time on page, DAU, row expansions, tooltip opens.

**Agora primitives.** `turn_detection.config.{speech_threshold, start_of_speech.{mode, vad_config.{interrupt_duration_ms, speaking_interrupt_duration_ms, prefix_padding_ms}}, end_of_speech.{mode, vad_config.silence_duration_ms, semantic_config.{silence_duration_ms, max_wait_ms, pause_state_enabled}}}` · `interruption.{enable, mode, keywords_config.trigger_keywords, disabled_config.strategy}` · `advanced_features.enable_sal` + `sal.{sal_mode, sample_urls}` · `llm.greeting_message` (empty = caller speaks first, 868ker6tm) · `parameters.silence_config` (#1446) · evidence `GET …/turns` (`start.metadata.speech_duration_ms`, `end.metadata.caused_by = start_of_speech`). Engine-only, design against the ticket: semantic SoS (868ktferv) · preemptive replies (868kuj2zw) · backchannels (868kamm6y) · 240 ms EoS default (868kuj31z) · dynamic SIP lock (868kuj3f6).
