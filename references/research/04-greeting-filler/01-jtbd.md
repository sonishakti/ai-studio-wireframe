# 04 · JTBD + success metric

**JTBD.** When my agent picks up *(situation)*, I want the first seconds and every pause to sound like a person who
is honest about being an AI *(motivation)*, so callers stay on the line and I'm covered under Article 50 without
reading the spec *(outcome)*.

**Personas.**
- **P1 hustler** — ships the template greeting, never opens Advanced. Needs the compliant default to be the default
  and the composed opening visible so there's nothing to discover later.
- **P2 compliance-minded ops lead** (Entel · Concentrix profile) — must prove, per locale and per agent, that the
  call opened with a disclosure; wants the exact sentence editable, the interruptibility explicit, and the silence
  recovery on record. Reads the composed line, not the JSON.
- **P3 developer** — keeps `greeting_configs` / `filler_words` in Custom config; must never find the Console
  rewrote a greeting it didn't author.

**Success events (activation-linked, add to the taxonomy).**
- `ai_disclosure_enabled` {agentId, locale, source: default | edited} — fires on save when the composed greeting
  carries a disclosure. **Counter-metric:** `ai_disclosure_disabled` is logged, never optimised
  (`measurement-framework.md` :263: *"If we ever optimize for higher disclosure-skip-rate, we have crossed a line."*).
- `greeting_previewed` {agentId, mode: agent_first | caller_first, disclosure: bool, durationMs} — "Hear the opening"
  or Talk started from the opening section. Precedes `agent_tested_baseline_succeeded` (TTFC in
  `event-taxonomy-review.md` §"What this changes").
- `caller_first_selected` {agentId} — the explicit who-speaks-first choice, so the empty-greeting trap is measurable.
- `filler_enabled` {agentId, phraseCount, responseWaitMs} — already implied by the Advanced row; name it.

North-star link: a deployment whose opening is heard and disclosed before go-live reaches *first live deployment
carrying traffic* with fewer hang-ups in the first five seconds. Rejected KPIs: time on page, DAU, disclosure-skip rate.

**Agora primitives.**
`llm.greeting_message` / `mllm.greeting_message` (composed disclosure + greeting) · `llm.greeting_configs.interruptable`
(v2.7; untyped in SDK 2.4.0, index signature) · `llm.greeting_configs.delay_ms` (v2.7) · `llm.template_variables`
(`{{var}}` in the greeting, v2.1) · `filler_words.{enable, trigger.fixed_time_config.response_wait_ms,
content.static_config.{phrases, selection_rule}}` · `parameters.silence_config.{timeout_ms, action, content}` (not MLLM)
· live preview (`startPreview` / `stopPreview`, `transcript`, `events`) for hearing the opening.
Requires Engine: disclaimer field (868ker6zx) · generated/persona filler (868kuj31y) · continue after filler (868kuj327)
· tool-execution filler timing (868kewaqq).
