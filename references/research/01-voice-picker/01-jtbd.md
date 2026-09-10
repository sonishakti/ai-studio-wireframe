# 01 · JTBD + success metric

**JTBD.** When I've written what my agent should say *(situation)*, I want to hear which voice fits it without
auditioning the whole catalog *(motivation)*, so I pick once, go live, and don't come back to change it
*(outcome)*.

**Personas.** P1 hustler — "give me a good voice for support, I'll listen to two, not forty"; keeps the default
vendor (MiniMax seed) and never opens the drawer. P2 platform engineer — has a branded clone at ElevenLabs /
Cartesia, wants its id in, consent on record, scoped to the project, and wants to know which voice survives a
vendor or tier switch (v4 "sound, not engine" lock).

**Success event (activation-linked).** `voice_selected_from_recommendation {useCase, vendor, voiceId, rank}` —
a voice pick that came from the Recommended strip or the compare tray, on an agent that later reaches
`deployment_went_live` (★ north star, event-taxonomy-review.md). Supporting events:
`voice_previewed {source: "sample" | "greeting", vendor, voiceId, inCompare}` and the existing
`agent_voice_changed` (taxonomy :37) extended with `via: "library" | "recommended" | "compare" | "own"`;
`own_voice_added {vendor}` for the cloning path. Counter-metric: `voice_changed_again_24h` — a pick that gets
replaced within a day was not a fit. **Rejected KPIs:** time on page, previews per session, DAU.

**Agora primitives.** `properties.tts.vendor` + `tts.params.<voice path>` (`tts-voice-paths.ts`; SDK
`agora-agents@2.4.0` — `ElevenLabsTtsParams.voice_id`, `MinimaxTtsParams.voice_setting.voice_id`,
`CartesiaTtsVoice {mode:"id", id}`, `FishAudioTtsParams.reference_id`) · Studio voice library
`/vendors/{id}/voice-library` (accent · gender · search · sampleUrl · tags) · `llm.greeting_message` +
`llm.system_messages[]` as the use-case signal · `asr.params.language` as the accent hint · `pipeline_id`
(join reuses a published Studio agent, so the Studio-side pick is the source of truth) · **Not available:**
`update` has no `tts` (runtime voice switch → Requires Engine, 868kyr1ej); no synthesis-with-own-text
endpoint (Requires Studio preview); cloning is Vendor-side, consent/audit store is Requires Studio
(868kbyqeh / 868kyj9w5).
