# 03 · JTBD + success metric

**JTBD.** When callers say my brand names, product codes and jargon — in their own language and accent — *(situation)*, I want the agent to hear them right the first time and keep hearing them if my transcriber fails *(motivation)*, so a misheard word never becomes a wrong answer, a repeat, or a dropped call *(outcome)*.

**Personas.**
- **P1 hustler** (Aria default agent, en-US, managed ARES) — types five brand names, says one in the Talk test, wants to see it come back spelled right. Zero config beyond that.
- **P2 platform engineer** (Hindi/Tamil, Sarvam or Deepgram BYO) — wants to know which vendor honours a vocabulary, which backup keeps the language *and* the vocabulary, and what breaks before publish.
- **P3 ops lead in a regulated domain** (medical / finance, Deepgram `nova-2-medical` today) — has a long term list, wants it to survive a vendor switch and show up in session evidence.

**Success events (activation-linked).**
- `vocabulary_saved` — `{ agentId, vendor, field: "asr.keywords" | "asr.params.keyterm" | "asr.params.phrase_list" | "asr.params.input_audio_transcription.prompt", count }`, fired on the first save with `count > 0`. A saved vocabulary is a config the agent carries into its first live deployment.
- `recognition_tested` — `{ agentId, vendor, total, heard }`, fired when a Talk run ends with a vocabulary present and the verdict line renders. This is the "builders can test representative phrases before publication" criterion (868kytr56) made observable.
- Reused from 07: `failover_triggered` (taxonomy, Retain) and `fallback_tested` (still unwired until the Engine contract). 03 adds no fallback event.

North-star link: a deployment that hears the caller's words keeps the caller on the line → protects paid minutes. Rejected KPIs: time on page, session length, DAU.

**Agora primitives.**
- `asr.vendor` (15) · `asr.language` (`AsrLanguage`, 32 BCP-47 tags — one primary language) · `asr.credential_mode` managed | byok.
- `asr.keywords` — v2.11 (Aug 11 2026), ARES only: "improve ARES's recognition accuracy for specific terms, such as brand names, product names, or industry jargon" (https://docs.agora.io/en/ai/release-notes). Shape unconfirmed in SDK 2.4.0.
- Deepgram `asr.params.keyterm` (string, nova-3 only) · Microsoft `asr.params.phrase_list` (string[]) · OpenAI `asr.params.input_audio_transcription.prompt` · Sarvam `asr.params.language = "unknown"` (auto-detect, one vendor).
- Test rail transcript events (`agent-preview-surface.tsx` → `ConsolePreviewEvent kind "transcript"`) as the "did it hear it" evidence; `history` / `turns` endpoints for post-hoc evidence (10).
- 07's Backup providers plan (`planProviderFallback`, language eligibility) as the ASR failover surface; Engine failover contract 868kyqzfy (P1 · Nov) for the switch itself.
- **Requires Engine, no field:** denoising (`parameters.audio_scenario` is not it), ASR-side pronunciation, language list / runtime switching (868kykbfg), transcriber fallback field (868kyv45t).
