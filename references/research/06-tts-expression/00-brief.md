# 06 · TTS expression & personality — intake brief (2026-09-10)

Tracker: https://app.clickup.com/t/868m0mekq · status `added` → `clarified` · Tags builder · P1 · UI: None · deferred wave
(swap candidate with 01 for Feb). Research folder: this directory. Surface: the **live Console** (`ng-console`,
worktree `.worktrees/rebase` = `design/sandbox` on `origin/staging`), read-only for research.

## Scope (from the roadmap tasks — ClickUp, pulled 2026-09-10)
- **868kammep** [O1.6-T1.a] Configurable background ambience — *Engine, `clarified`.* Outcome: "Developers can add
  supported ambience without private audio mixing." Scope: "Define source, volume, looping, mixing, RTC and SIP
  coverage, fallback, and the public Engine control." → **Requires Engine (868kammep)**; no field today.
- **868kbzjmf** [O1.6-T2.b] TTS SSML and pronunciation controls — *Engine, `clarified`.* Outcome: "Developers can control
  pronunciation through a documented portable contract." Scope: "Define supported SSML and pronunciation behavior,
  provider gaps, validation, and fallback." → portable contract **Requires Engine (868kbzjmf)**; MiniMax
  `pronunciation_dict` + Console-side `voice_formatting.custom_replacements` exist today.
- **868kuj3f8** [O1.6-T2.c] Expressive TTS controls and model prompts — *Engine, `added`.* Outcome: "Developers can request
  supported expression without relying on undocumented provider prompts." Scope: "Define portable expressive controls
  and clearly bounded per-model prompt behavior." → **Requires Engine (868kuj3f8)** for anything portable; today
  expression is per-vendor params, and OpenAI `instructions` / Generic `instruction` are the only prompt-style fields.
- **868ka69cb** Agent personality and tone controls — *`clarified`.* "Builders currently encode personality and tone in
  free-form prompts, which makes the behavior difficult to discover, review, and test. Add explicit per-agent controls
  for personality and tone. Show the resulting configuration when the agent is edited and include it in Studio testing
  and simulation flows. These settings belong to an individual agent. This ticket does not create a reusable Persona
  resource… Filler words, background ambience, pronunciation and SSML controls, and voice cloning are separate
  capabilities." → no field; personality lives in `llm.system_messages` today. **Requires Engine/Studio (868ka69cb)**
  for a real field; the Console can only write the prompt or a vendor prompt field.

## What the Console has today (read-only audit, line numbers from the rebased worktree)

**TTS drawer** — `src/components/console/agent-config-drawer.tsx` `TtsSection` :1816–2445 (vendor · credential · model ·
voice, then vendor-conditional fields, then Skip patterns :2418–2428 → `tts.skip_patterns`, TTS params JSON :2429).
Helpers: `GoogleTtsAudioFields` :2849, `MinimaxAudioFields` :2889, `VolcengineAudioFields` :2955,
`isValidElevenLabsSpeed` :3103 (0.5–2). All expression fields are raw `NumberField`s (label above input, no slider,
no plain-English guidance, no preview). Labels come from `pages.agents.builder.*` (`Speed` :2341, `Stability` :2342,
`Style` :2377, `Similarity boost` :2331, `Speaker boost` :2336, `Pitch` :2290, `Volume` :2411, `Pace` :2289,
`Loudness` :2257, `Rate` :2297, `Instructions` :2247, `Pronunciation` :2404).

| Vendor | Pace | Pitch | Volume | Emotion / style | Stability | Style prompt | Pronunciation | Drawer lines |
|---|---|---|---|---|---|---|---|---|
| openai | `params.speed` 0.25–4 | — | — | — | — | `params.instructions` (TextField) | — | :2149–2166 |
| microsoft | `params.speed` 0.5–2 | — | `params.volume` 0–100 | — | — | — | — | :2168–2186 |
| elevenlabs | `params.speed` 0.5–2 ⚠ vendor allows 0.7–1.2 | — | — | `params.style` 0–2 ⚠ vendor 0–1 | `stability` 0.5–2 ⚠ vendor 0–1 · `similarity_boost` 0.5–2 ⚠ · Speaker boost switch writes **`speaker_boost`** ⚠ SDK key is `use_speaker_boost` | — | — (SSML in LLM text is forwarded, see release notes) | :2188–2242 |
| google | `AudioConfig.speaking_rate` 0.25–2 | — | — | — | — | — | — | :2261 → :2849 |
| minimax | `voice_setting.speed` 0.5–2 | `voice_setting.pitch` −12–12 | `voice_setting.vol` 0.1–10 | — (SDK `voice_setting.emotion` not exposed) | — | — | table → `pronunciation_dict.tone[]` as `"text/pronunciation"` (`minimax-pronunciation-section.tsx`) | :2379–2394 → :2889 |
| tencent | `params.speed` −2–6 (default 1.25) | — | `params.volume` 0–10 | — ⚠ seeded `emotion_category:"happy"`, `emotion_intensity:100` with **no UI** (`agent-composed-model-authoring.ts` :397–398) | — | — | — | :2395–2413 |
| bytedance / volcengine | `speed_ratio` 0.2–3 | `pitch_ratio` 0.1–3 | `volume_ratio` 0.1–3 | — (seeded `emotion:""`, no UI :314 / :405) | — | — | — | :2415 → :2955 |
| sarvam | `pace` 0.3–3 | `pitch` −0.75–0.75 | `loudness` 0.1–3 | — | — | — | — | :2306–2353 |
| murf | `rate` (unbounded, default 0) | `pitch` (unbounded, default 0) | — | — | — | — | — | :2264–2298 |
| humeai | — ⚠ `speed` seeded (:349) but no field | — | — | — | — | — | — | (no vendor block) |
| deepgram · rime · xai | — | — | — | — | — | — | — | :2244 · :2300 · :2355 (base_url / sample rate / language only) |
| amazon · cartesia · fishaudio | — | — | — | — | — | — | — | (no vendor block) |

Other real surfaces that carry "how it sounds":
- **Voice Format** row — `agent-config-drawer.tsx` :1101–1140 (`AdvancedRow`, switch `voice_formatting.enabled`, Digit
  cutoff `digit_cutoff`, `VoiceFormattingReplacementsField` :2487, types :146–156: `{type:"exact",key,value}` |
  `{type:"regex",regex,value}`, max 5). Console-side text replacement on LLM output before TTS — the only
  vendor-agnostic "say X as Y" today. i18n `pages.agentConfig.voiceFormat` :456 "Voice Format", "Add up to 5 exact or
  regex replacements."
- **Prompt tab** — `agent-editor-workspace.tsx` :853–885 System prompt → `llm.system_messages[0].content` (:364–367);
  description "The base instructions that shape how this agent thinks, speaks, and escalates." Personality = prose here.
- **Voice preview** — `studio-voice-library-dialog.tsx` :117–130 plays the library `sampleUrl` with `new Audio`. No
  synth-preview endpoint exists (`src/routes/api/` has only `studio-v2.vendors.$vendorId.voice-library.ts`), so a tuned
  voice cannot be heard before a live test.
- **Contracts** — `orchestration-contracts.ts` :5–22 `OrchestrationModelDraft { speed?: string; style?: string;
  skipPatterns?: string[] }`. `orchestration-properties.ts` :393/:502 round-trips a top-level **`tts.speed`** that no
  vendor contract has (dead key); `style` is LLM/MLLM only (:365, :287); `skipPatterns` → `tts.skip_patterns` (:392/:500)
  as `string[]` while the SDK wrapper types it `number[]`.
- **Models tab** — `agent-models-page.tsx` `CascadeModelRow` :736 (label above an h-9 button + Voice button + Settings2
  → drawer). MLLM/realtime mode (:34 `isMllm`) hides the cascade rows: no TTS, nothing to tune.
- **Teammate overlap:** `origin/codex/add-voice-clone` adds custom voice-id modes in the same `TtsSection` (design with).

## Already decided (don't re-litigate)
- v4 (2026-07-28): **Voice = two handles** (latency-vs-cost + voice picker); "architecture / manual vendors / history /
  **speech tuning → one Advanced slide-out**" → expression controls belong in the TTS drawer, not as a third handle.
- v6 (2026-07-29): Advanced sheet stacks STT→LLM→TTS top-to-bottom + Custom config (JSON) door → keep the JSON editor.
- v7 Plain Form: flat form, hairline rows, helper prose only where the field name can't carry meaning, InfoHint
  (Console: `Tooltip`/`title`) for background knowledge, no badge pills for decoration.
- v8: Test Strip is the one test entry; a "hear it" preview is a control-local affordance, not a test.
- Voice principles §11: specific, present-tense, honest; no "Oops", no softening.
- Honesty floor: never fake a capability — a vendor without a field shows the control dead with the reason, never hidden
  silently (07 "ineligible shown but dead").
- Copy discipline: one short line under a control max; explanations behind tooltip/`title`.

## Agora fact-check (SDK `agora-agents@2.4.0`, `node_modules/agora-agents/dist/cjs/api/types/*TtsParams.d.ts`)

| Vendor | Pace | Pitch | Volume | Emotion / style | Stability | Style prompt | Pronunciation |
|---|---|---|---|---|---|---|---|
| elevenlabs | `speed` | — | — | `style` | `stability` · `similarity_boost` · `use_speaker_boost` | — | — |
| minimax | `voice_setting.speed` | `voice_setting.pitch` | `voice_setting.vol` | `voice_setting.emotion` (enum) | — | — | `pronunciation_dict.tone[]` · `voice_setting.english_normalization` · `language_boost` · `timber_weights[]` |
| openai | `speed` | — | — | — | — | `instructions` "Custom instructions for voice style, accent, pace, and tone." | — |
| generic | `speed` | — | — | — | — | `instruction` "Additional voice style control instruction." | — |
| bytedance | `speed_ratio` | `pitch_ratio` | `volume_ratio` | `emotion` (enum) | — | — | — |
| tencent | `speed` | — | `volume` | `emotion_category` + `emotion_intensity` | — | — | — |
| microsoft | `speed` "0.5 and 2.0" | — | `volume` "0.0 and 100.0" | — | — | — | — |
| google | `AudioConfig.speaking_rate` | — (no `pitch` in `GoogleTtsAudioConfig`) | — | — | — | — | — |
| sarvam | `pace` | `pitch` | `loudness` | — | — | — | — |
| murf | `rate` | `pitch` | — | — | — | — | — |
| humeai | `speed` (+ `trailing_silence`) | — | — | — | — | — | — |
| cartesia · rime · amazon · fishaudio · xai · deepgram · cosyvoice · stepfun · bytedance_duplex | — | — | — | — | — | — | — |

Every `*TtsParams` ends with `[key: string]: any` and every `*Tts` wrapper has `skip_patterns?: number[]`. Docs say
"Any additional parameters are passed through directly to the underlying vendor without validation" — so vendor fields
the Console does not render still work through the JSON editor, and nothing Agora-side normalises them.

Docs (all resolve, fetched 2026-09-10):
- https://docs.agora.io/en/ai/release-notes — TTS entries: v2.3 (2026-01-07) ElevenLabs "Supports SSML parsing and
  forwarding to ensure ElevenLabs TTS correctly renders intended speech effects"; v2.6 (2026-04-22) "support for
  real-time TTS parameter updates during conversations" (custom LLM); v1.5 `skip_patterns` "prevents the agent from
  vocalizing structural prompt information"; v2.5 TTS presets `minimax_speech_2_6_turbo` · `minimax_speech_2_8_turbo` ·
  `openai_tts_1`; v2.10 custom TTS "implements the OpenAI TTS protocol" + Gradium + Mistral; v2.11 Typecast. **No entry
  mentions emotion, expressiveness, speed or style parameters; no SSML flag; no ambience.**
- https://docs.agora.io/en/ai/models/tts/elevenlabs — `speed` 0.7–1.2 "Speed up or slow down the speed of the generated
  speech"; `stability` 0.0–1.0 "Higher values (0.8-1.0) produce more consistent speech, lower values (0.0-0.5) add more
  variation"; `similarity_boost` 0.0–1.0; `style` "Controls speaking style and expressiveness. Higher values increase
  emotional range"; `use_speaker_boost` "Recommended for most use cases". No SSML mention.
- https://docs.agora.io/en/ai/models/tts/minimax — documents only `key`, `group_id`, `url`, `model`,
  `voice_setting.voice_id`, `audio_setting.sample_rate`; speed/vol/pitch/emotion/pronunciation_dict are pass-through
  (link to MiniMax's own T2A doc).
- https://docs.agora.io/en/ai/models/tts/openai — `instructions` "Custom instructions for voice style, accent, pace, and
  tone. Helps fine-tune the speech characteristics."; `speed` 0.25–4.0, default 1.0.
- https://docs.agora.io/en/ai/models/tts/microsoft — `speed` 0.5–2.0 default 1.0; `volume` 0.0–100.0 default 100. No SSML.
- https://docs.agora.io/en/ai/models/tts/google — `speaking_rate` 0.25–2.0; no `pitch`, no SSML.

**Not in the contract → design against the ticket, mark "Requires Engine (<ticket>)":**
SSML flag (none; ElevenLabs forwards SSML found in LLM text per v2.3 — Microsoft/Google/Amazon accept SSML natively but
Agora exposes no `ssml` field → 868kbzjmf) · background ambience (868kammep) · portable expression / per-model prompt
contract (868kuj3f8) · personality/tone field (868ka69cb) · synth preview of a tuned voice (no endpoint; Console/Studio).

## Competitor evidence (public docs, fetched 2026-09-10)
- **ElevenLabs** https://elevenlabs.io/docs/product-guides/playground/text-to-speech — Speed 0.7–1.2, default 1.0;
  Stability default 50, low = "broader emotional range… more lively and dramatic performance", high = "monotonous voice
  with limited emotion"; Style exaggeration "we recommend keeping this setting at 0 at all times"; Speaker boost "rather
  subtle", adds latency. Speed / Similarity / Speaker boost "Not available for Eleven v3" → controls shown dead per model.
- **Vapi** https://docs.vapi.ai/customization/speech-configuration — `backgroundSound` `"off"` | `"office"`; "Default for
  phone calls is 'office' and default for web calls is 'off'"; speed "only PlayHT currently supports this feature".
  https://docs.vapi.ai/providers/voice/elevenlabs — `stability` 0–1, `similarityBoost` 0–1, `style` 0–1,
  `useSpeakerBoost`, `speed` 0.7–1.2, `enableSsmlParsing` default false. (create-assistant reference exceeded the fetch
  size limit — not read.)
- **Retell** https://docs.retellai.com/api-references/create-agent — `ambient_sound` coffee-shop · convention-hall ·
  summer-outdoor · mountain-outdoor · static-noise · call-center; `ambient_sound_volume` [0,2] default 1; `volume` [0,2]
  default 1; `responsiveness` [0,1] default 1; `voice_speed` [0.5,2] default 1; `voice_temperature` [0,2] "Lower value
  means more stable"; `pronunciation_dictionary` `{word, alphabet: ipa|cmu|pinyin|jyutping, phoneme}`.
- **Bland** https://docs.bland.ai/api-v1/post/calls — `background_track` null | office | cafe | restaurant | none;
  `pronunciation_guide` `[{word, pronunciation, case_sensitive, spaced}]` (plain syllables, not phonemes).
- **OpenAI** https://developers.openai.com/api/docs/guides/text-to-speech (301 from platform.openai.com/docs/guides/
  text-to-speech) — `instructions` controls accent, emotional range, intonation, impressions, speed, tone, whispering;
  example "Speak in a cheerful and positive tone."; `gpt-4o-mini-tts`.
- Failed / thin: elevenlabs.io/docs/capabilities/text-to-speech (no slider guidance on that page); docs.vapi.ai
  create-assistant (too large).

**Patterns (adopt):** (1) vendor-agnostic scalars with one range for every vendor — Retell `voice_speed` 0.5–2 /
`volume` 0–2 / `voice_temperature`; (2) plain-English low/high guidance on each handle — ElevenLabs; (3) tone as a short
prompt with a worked example — OpenAI `instructions`; (4) ambience as a picker with a channel-aware default plus volume —
Vapi office-for-phone, Retell scenes; (5) pronunciation as a Word → Say-it-as table in plain letters — Bland (matches the
Console's MiniMax `"text/pronunciation"` shape); (6) dead-not-hidden when a model lacks a control — ElevenLabs v3, Vapi
"only PlayHT". **Avoid:** Retell's six ambience scenes (pick three), phoneme alphabets (P1 can't write IPA).

## What we need (user-visible)
- One **Pace** handle that means the same thing on every vendor that has a speed field, and says
  "Not adjustable for <vendor>" on the rest.
- Vendor-native handles (Pitch · Volume · Emotion · Stability · Style) **only when the vendor has them**, in the vendor's
  real range — never a blank or fake control.
- A **Tone** line that writes the vendor's prompt field (OpenAI `instructions`, Generic `instruction`) and is dead, with
  the reason, on vendors without one.
- **Pronunciation** on every vendor: MiniMax → `pronunciation_dict`, everyone else → Voice Format replacements
  (Console-side text swap) — the fallback named on the row.
- **Background sound** row present but inert: "Requires Engine · 868kammep".
- **Hear it**: today the library sample only (tuning not applied) — said honestly until a synth preview exists.

## Tech requirements — the normalisation contract
`Pace` is 0–100 with **50 = vendor normal**. Piecewise-linear: `v ≤ 50 → min + (v/50)·(normal−min)`;
`v > 50 → normal + ((v−50)/50)·(max−normal)`. Denormalise is the exact inverse, rounded to the vendor step. Value text
shows the vendor value (`1.0×`, `0.85×`; Tencent/Murf show `0`). Ranges below are the source of truth for the slice:

| Vendor | Field | Min · normal · max (source) | Note |
|---|---|---|---|
| elevenlabs | `params.speed` | 0.7 · 1.0 · 1.2 (Agora doc, ElevenLabs) | tighten `isValidElevenLabsSpeed` (0.5–2 today) |
| minimax | `voice_setting.speed` | 0.5 · 1.0 · 2.0 (Console) | |
| openai | `params.speed` | 0.25 · 1.0 · 4.0 (Agora doc) | |
| generic | `params.speed` | 0.25 · 1.0 · 4.0 (OpenAI protocol — unverified) | |
| microsoft | `params.speed` | 0.5 · 1.0 · 2.0 (Agora doc) | |
| google | `AudioConfig.speaking_rate` | 0.25 · 1.0 · 2.0 (Agora doc) | |
| bytedance / volcengine | `speed_ratio` | 0.2 · 1.0 · 3.0 (Console) | |
| sarvam | `pace` | 0.3 · 1.0 · 3.0 (Console) | |
| humeai | `params.speed` | SDK field, range undocumented | raw number until documented |
| tencent | `params.speed` | −2 · 0 · 6 (Console; vendor 0 = normal) | Console seeds 1.25 — verify with Engine |
| murf | `rate` | −50 · 0 · 50 (Murf; Console unbounded) | |
| cartesia · rime · amazon · fishaudio · xai · deepgram · cosyvoice · stepfun · bytedance_duplex | — | — | **"Not adjustable for <vendor>"** |

Other handles stay **vendor-native** (vendor units, vendor range, only when present): Pitch (minimax −12–12,
bytedance 0.1–3, sarvam −0.75–0.75, murf −50–50); Volume (microsoft 0–100, minimax 0.1–10, bytedance 0.1–3, tencent 0–10,
sarvam 0.1–3); Stability / Style / Similarity boost / Speaker boost (elevenlabs, 0–1 + bool — fix key
`use_speaker_boost`); Emotion (minimax enum, bytedance enum, tencent `emotion_category` + `emotion_intensity`). A
normalised "Expressiveness"/"Stability" pair would map to ElevenLabs only (2 of 17 vendors) — that is why it is not the
universal handle. Pronunciation adapter: minimax → `pronunciation_dict.tone[] = "word/say"`; others →
`voice_formatting.custom_replacements[] = {type:"exact", key: word, value: say}` + `voice_formatting.enabled = true`
(Console cap: 5 entries — surface the cap). Background sound + tone chips on vendors without a prompt field: draft only,
`sessionStorage` `ng-console.design.06.tts-expression:<agentId>`, never written to `properties`.

## Open questions for the owner
1. **Where it lives.** TTS drawer directly under Voice (v4 "speech tuning → Advanced slide-out", default) or a row on the
   Models tab under the TTS row (07's pattern)? Default: drawer.
2. **Tone on vendors without a prompt field.** Dead with "Not adjustable for <vendor>" (default) or append a tone line to
   the system prompt? 868ka69cb criticises prompt-encoded tone; a silent prompt write also breaks the honesty floor.
3. **Preview.** Is a synth-preview endpoint (text → audio with the agent's `tts` block) planned? Without it "Hear it"
   plays the library sample and must say "Sample voice · tuning not applied".
4. **Replace or duplicate.** The row writes the same `tts.params` paths as the raw NumberFields — remove those fields from
   the drawer in the slice (default) or keep both?
5. **Tencent seed.** `emotion_category: "happy"`, `emotion_intensity: 100` is written for every Tencent agent with no UI.
   Intentional? Default should be neutral unless the owner says otherwise.
6. **ElevenLabs mismatches** (`speaker_boost` vs `use_speaker_boost`; 0.5–2 ranges vs vendor 0–1 / 0.7–1.2) — fix inside
   the slice or file to the Console team first?
