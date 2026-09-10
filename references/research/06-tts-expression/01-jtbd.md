# 06 · JTBD + success metric

**JTBD.** When my agent's words are right but it *sounds* wrong — too fast, flat, or mangling our product names
*(situation)* — I want to change how it sounds without learning each vendor's knobs *(motivation)*, so the first call a
customer hears sounds like our brand *(outcome)*.

**Personas.** P1 hustler — "make it slower and friendlier" in one handle, never opens the JSON; P2 platform engineer —
wants vendor-parameter fidelity and to see exactly which `tts.params` key each control writes; P3 CX / brand owner
(new for this feature) — cares about pronunciation of names and tone of voice, cannot write IPA or a prompt.

**Success event (activation-linked).** `voice_tuned_and_previewed` — a Delivery / Tone / Pronunciation value changed
**and** a preview played in the same editing session. Feeds the north star through `first_live_deployment`: an agent
that sounds right ships; one that sounds wrong gets re-tuned or abandoned before Go Live. Secondary:
`pronunciation_added` (word count per agent), `tone_set` (vendor with a prompt field). Counter-metric:
`voice_tuning_reverted` within 24 h of `voice_tuned_and_previewed` (thrash — handles that don't do what they say).
Rejected KPIs: time on page, DAU, slider interaction count.

**Agora primitives.** Per-vendor `tts.params.*` expression fields (matrix in `00-brief.md`, from `agora-agents@2.4.0`
types) · `tts.skip_patterns` · `tts.params.pronunciation_dict.tone[]` (MiniMax) · `voice_formatting.custom_replacements`
(Console-side, output text) · `llm.system_messages` (personality today) · OpenAI `instructions` / Generic `instruction`
(the only prompt-style fields) · release note v2.6 real-time TTS parameter updates (runtime, custom LLM) · library
`sampleUrl` (studio-voice-library) for the only preview that exists.
**Requires Engine:** 868kammep ambience · 868kuj3f8 portable expression + per-model prompt contract · 868kbzjmf SSML /
pronunciation contract · 868ka69cb personality field. **Requires Console/Studio:** a synth-preview endpoint.
