# 01 · Voice picker & recommendations — intake brief (2026-09-10)

Tracker: https://app.clickup.com/t/868m0medx · status `added` → `clarified` once the owner answers the questions below.
Tags builder · voices · P0-Sep (engineering month; design wave = deferred, swap candidate for Feb with 06).
Surface: live Console (`ng-console`, checkout `design/sandbox` @ `6ffb3118`, rebased on staging incl. #1443 + #1446;
line numbers below verified against that commit on 2026-09-10). Additive only.

## Scope (roadmap tasks, pulled via ClickUp API 2026-09-10)
- **868ka247c** Compare and recommend voices for each use case — *added.* "Compare voice candidates using the
  same script, language, region, and runtime settings… evaluate pronunciation, naturalness, task success, and
  response latency. Recommend voices by language, region, gender, tone, and domain." **"This ticket produces
  comparison evidence and recommendations… does not apply the recommendation or change an agent."** Applying
  them is the first-run-defaults ticket. → The Console side is the *comparison experience* + surfacing the
  recommendation; the benchmark is not ours.
- **868kbyqeh** Add voice cloning to Studio — *clarified.* "Studio must confirm eligibility and **record consent**
  before capturing or uploading a biometric voice sample… captures the sample, completes provider verification,
  builds the voice, lets the builder preview it, assigns it to an agent, and supports revocation or deletion.
  Start with one selected provider."
- **868kyj9w4** More cloning providers + professional workflows — *added.* "Keep consent and eligibility checks
  consistent across providers… compare supported cloning options without learning each provider's API."
- **868kyj9w5** Governance + cross-workspace sharing — *added.* "Permissions for voice creation and use, approval
  controls, an audit trail, and an explicit sharing workflow… owners must see where a voice is used and revoke
  access without deleting unrelated agent configuration. Consent and usage restrictions must remain attached."
- **868kyr1ej** Multiple voices + runtime switching in one agent — *added.* "Bounded voice set with a stable label,
  provider/model identity, supported languages, and fallback for each voice… normalized switch triggers…
  Studio owns the voice-set configuration, preview, validation, and history. **Engine owns the normalized switch
  event, runtime execution.**" Acceptance: "preview every configured voice and the transitions… unsupported or
  revoked voices cannot be published… a voice change preserves conversation state and is visible in session
  evidence."

## What the Console has today (real files, design/sandbox @ 6ffb3118)
- **Models tab** `src/components/console/agent-models-page.tsx` — `CascadeModelRow` (:736–796): label above control
  (`<p class="mb-1.5 text-sm font-medium">` + `button h-9 w-full border-input`). The TTS row gets a second
  **Voice** button (:411–435) that opens `StudioVoiceLibraryDialog`; **disabled when vendor is cartesia or
  elevenlabs** (:419–423). Value = the picked label, else `humanizeStudioVoiceId(voiceId)` for minimax/openai,
  else the raw `ttsVoice`. Dialog mounted :715–730; `onSelect` writes `properties.tts` via
  `applyTtsVoiceIdForVendor(tts, voice.originalId)` through `replaceProperties` (:314). Design 07's
  `AgentProviderFallbackRow` is mounted right after the rows (:438–444) — the row-after-rows slot exists.
- **Voice library dialog** `src/components/console/studio-voice-library-dialog.tsx` (347 lines): vendor tab
  buttons (:145–156, other vendors disabled when a vendor is passed) · search (:159–164) · gender
  Male/Female/Neutral (:165–170) · accent American/British/General/Australian/Indian/Greek (:171–184) · type
  Young/Old/Enthusiastic/Grumpy/Confident/Curious folded into the search keyword (:95–97, :185–198) · table
  Voice / Trait (tags) / Voice ID (:201–274) · preview = one `new Audio(sampleUrl)` toggled per row, click only,
  stops on close/unmount (:84–93, :116–132) · **Use Voice** (:257–269) · 10 per page (:286–310). Loading/error
  text exists (:275–284); **no empty state** when filters match nothing. Play/Pause `aria-label` is a hardcoded
  English template literal (:229) — i18n guard misses it; log, don't fix in a slice.
- **API** `src/lib/agents/studio-voice-library-api.ts`: `StudioVoice = {accent, externalName, gender,
  internalVoiceId, originalId, sampleUrl?, tags[]}` — **no language, no use case, no age field** (age lives in
  tags). `listStudioVoices({accent, gender, page, pageSize, search, vendorId})`. Route
  `src/routes/api/studio-v2.vendors.$vendorId.voice-library.ts` → `handleStudioV2VoiceLibrary`
  (`src/server/studio-v2/voice-library-handlers.ts` :21–50) → upstream `/vendors/{id}/voice-library` with
  `accent, gender, page, page_size, search_fields="voice_name,tags", search_keyword, sort_by="voice_name"`.
  Query hooks `use-studio-voice-library-query.ts` (60 s stale, keeps previous page as placeholder).
- **Voice id paths** `src/lib/agents/tts-voice-paths.ts`: `readTtsVoiceIdForVendor` (:46–91) /
  `applyTtsVoiceIdForVendor` (:93–168) — elevenlabs·humeai·xai `params.voice_id`, minimax
  `voice_setting.voice_id`, cartesia `voice.{mode:"id", id}`, fishaudio `reference_id`, google
  `VoiceSelectionParams.name`, microsoft `voice_name`, murf `voiceId`, rime·sarvam `speaker`, amazon `voice`,
  bytedance `voice_type`, tencent numeric `voice_type`. `src/lib/agents/tts-voices.ts`: static `{label,value}`
  lists per vendor, `ELEVENLABS_DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"`.
- **TTS drawer** `TtsSection` in `src/components/console/agent-config-drawer.tsx` (:1816–). On staging:
  `MinimaxVoiceMode = "custom" | "inferred" | "library"` (:1835), library button for minimax/openai
  (:2064–2085), **Custom** checkbox for MiniMax only (:2105–2124, i18n `pages.agents.builder.customVoice` /
  `.custom` at common.ts:2398–2400); `inferred` mode marks a voice custom when it is absent from the fetched
  library (:1886–1895). **Teammate branch `origin/codex/add-voice-clone`** (Bhupendra Negi, 2026-09-08:
  `5c0444b8` add custom TTS voice modes · `81055a3f` clear incompatible Hume voice mode · `70f764c3` expose
  custom voice mode for all TTS vendors; diff vs staging: `agent-config-drawer.tsx` +207/−76,
  `agent-config-drawer.test.tsx` +297) generalises this to `VoiceMode = "custom" | "inferred" | "standard"`,
  a `CustomVoiceToggle` for every vendor except deepgram, `usesStudioVoiceLibrary(vendor)` = minimax | openai,
  and HumeAI custom → `params.provider = "CUSTOM_VOICE"`. **Design WITH it:** "cloning" in the Console is
  "enter the voice id the vendor gave you"; anything we add must write the same path so the drawer's
  `inferred` mode shows it as Custom by construction.
- **Greeting** `AgentPromptForm` in `src/components/console/agent-editor-workspace.tsx` (:806–): heading
  `pages.agents.builder.greeting` (:893), description "First assistant message before the live exchange
  starts." (common.ts:2240), `Input` bound to `draft.greeting` (:899–905) = `llm.greeting_message`; default
  draft "Thanks for calling. I can help with that." (:177); the preview turn echoes it (:1169). Both tabs read
  `builder.properties`, so the Models tab can read the prompt + greeting without a new prop.
- i18n block `pages.agentModels` at `src/lib/i18n/resources/en/common.ts:496` (`voice`, `custom`,
  `customField`, `fallback.*` from 07, `voiceLibrary.*`: "Select Voice" · "Search" · "All Gender" ·
  "All Accent" · "Types" · "Voice" · "Trait" · "Voice ID" · "Loading voices…" · "Unable to load voices." ·
  "Page {{page}} of {{totalPages}}" · "Use Voice"). Seed defaults (`agent-builder-properties.ts`) = MiniMax
  `speech-2.8-turbo`, so the default path lands on a vendor that *has* a library.
- Tests: `studio-voice-library-dialog.test.tsx` mocks `use-studio-voice-library-query` and stubs global
  `Audio` (play/pause spies) — reuse for anything that previews.

## Already decided (LEARNINGS locks — don't re-litigate)
- **2026-07-29 v6:** Voice = latency-vs-cost slider + **voice dropdown/browser; no quick-pick voice grid.**
- **2026-07-28 v4:** Voice = two handles. **A voice pick adopts the voice's SOUND, not its engine** (the tier is
  the cost handle; a voice must not silently reset it). Tier switch remaps the voice same-gender **with a toast**.
- **2026-07-09 A1:** Default agent Aria is live on signup with "a top-tier voice with no user choice required"
  (PRD A1 acceptance). The picker is for the second decision, not the first.
- **v7 Plain Form / v8 Test Strip:** one flat form, hairline rows, no cards-in-cards, no badge pills, helper prose
  only where the field name can't carry meaning; Test Strip is the one test entry.
- **§6 / facts sheet:** pre-checked consent is on the anti-pattern list; AI-disclosure default is opt-in.
- **§11 voice:** specific, present-tense, honest; recovery in the same line as the failure, vendor named.
- **Backlog R8** ("Do developers want to choose a voice, or be told which one?") is still open — preference test,
  8 developers, gallery vs recommendation vs use-case wizard, cloning consent folded in. Not yet run.

## Agora fact-check
- **Voice is a vendor param on the join contract**: `properties.tts.vendor` + `tts.params.<vendor voice path>`
  (paths above; canonical types in `agora-agents@2.4.0` — `ElevenLabsTtsParams.voice_id` "e.g.
  pNInz6obpgDQGcFmaJgB", `MinimaxTtsParams.voice_setting.voice_id`, `CartesiaTtsVoice {mode:"id", id}`,
  `FishAudioTtsParams.reference_id`). Docs: https://docs.agora.io/en/ai/models/tts/elevenlabs (`voice_id`,
  "Browse available voices in the Voice Library") · https://docs.agora.io/en/ai/models/tts/cartesia
  (`voice.mode="id"`, `voice.id`) · https://docs.agora.io/en/ai/models/tts/minimax (`voice_setting.voice_id`,
  example `English_captivating_female1`) · https://docs.agora.io/en/ai/models/tts/fish-audio (`reference_id`,
  `backend`). Every page: "Any additional parameters are passed through directly to the underlying vendor
  without validation." **None mentions custom or cloned voices.** https://docs.agora.io/en/ai/models/tts/overview
  → 404 (2026-09-10).
- **Release notes** https://docs.agora.io/en/ai/release-notes: no entry on voice cloning, custom voices, multiple
  voices or voice switching (checked 2026-09-10).
- **`pipeline_id`** exists on `StartAgentsRequest` (SDK :64–65): "The unique ID of a published agent in AI Studio…
  the saved agent configuration is used as the base… `asr`, `tts`, and `llm` fields in `properties` are
  optional." The public join page https://docs.agora.io/en/conversational-ai/rest-api/agent/join does not show it.
- **`update`** https://docs.agora.io/en/conversational-ai/rest-api/agent/update — page is a one-line summary
  ("Adjust agent parameters at runtime"); the SDK `UpdateAgentsRequest.Properties` is **`{token?, llm?:
  {system_messages?, params?}, mllm?: {params?}}` — no `tts`.** Runtime voice switching cannot be done with
  today's API. → **868kyr1ej Requires Engine** (voice set + switch event + `update.tts` or equivalent).
- **Voice cloning is Vendor-side.** ElevenLabs / Cartesia / MiniMax / Fish create the clone; the Console stores
  the resulting id in the path above. Console-side pieces that need no Engine change: entering the id, naming it,
  recording consent, scoping it to a project, previewing it. Eligibility/verification/revocation on the vendor
  (868kbyqeh) and the audit trail / cross-workspace sharing (868kyj9w5) are **Studio-side stores that do not
  exist yet** — mark "Requires Studio voice store (868kbyqeh)".
- **Preview with the agent's own text** has no endpoint: the library returns a vendor `sampleUrl` with fixed
  text; the live preview (`use-agent-live-preview`) speaks the greeting only for the *configured* voice and
  consumes minutes. Comparing 2–3 voices on the greeting needs a Studio synthesis endpoint — **no ticket**.

## Competitor evidence (public docs, fetched 2026-09-10)
- **ElevenLabs Voice Library** https://elevenlabs.io/docs/product-guides/voices/voice-library — sort Trending ·
  Latest · Most users · Character usage; filters **Language → Accent, Category (Conversational, Narration,
  Characters, Social Media, Educational, Advertisement, Entertainment), Gender, Age (Young/Middle Aged/Old),
  Notice period, Live Moderation, Quality (Studio Quality)**; "+" adds to My Voices; the *owner* records a
  70–150-character custom preview; **no preview with your own text**; only Professional clones are shareable,
  privately by link or by an email **allowlist**.
- **ElevenLabs Voice Design + cloning** https://elevenlabs.io/docs/overview/capabilities/voices — Voice Design:
  description 20–1000 chars + optional preview text 100–1000 chars → **3 previews to pick from** (the only
  side-by-side compare in the set). Instant vs Professional cloning; PVC uses "voice-captcha" to verify the
  samples are yours. IVC https://elevenlabs.io/docs/product-guides/voices/voice-cloning/instant-voice-cloning —
  1–2 min clean audio; user must "confirm that you have the right and consent to clone the voice"; "Voice clones
  stay in your ElevenLabs account."
- **ElevenLabs multi-voice agents** https://elevenlabs.io/docs/agents-platform/customization/voice/multi-voice-support
  — up to **10 voices per agent**, each = label + voice id + optional model/language override + "when to use"
  description; the LLM switches with `<LABEL>text</LABEL>`; unknown label → default voice. This is the shape
  868kyr1ej describes ("bounded voice set with a stable label").
- **Vapi** voice fallback https://docs.vapi.ai/voice-fallback-plan.md — `voice.fallbackPlan.voices[{provider,
  voiceId}]`, recommends 2–3 from different providers with "similar characteristics (tone, accent, gender)" (=
  the v4 "sound, not engine" lock, stated by a competitor). Custom voices
  https://docs.vapi.ai/customization/custom-voices/elevenlabs — BYO ElevenLabs key → Integrations → library
  auto-syncs → search the clone in the voices tab; **no consent step, no preview**.
  https://docs.vapi.ai/assistants/voice and /customization/voice-fallback-plan → 404.
- **Retell** https://docs.retellai.com/api-references/list-voices — voice object `{voice_id, voice_name,
  provider (elevenlabs · openai · cartesia · minimax · fish_audio · inworld · platform), gender, accent, age,
  preview_audio_url}`; filters are demographic only, no use case. /build/voice/custom-voice, /build/custom-voice,
  /api-references/create-voice → 404.
- **Cartesia** https://docs.cartesia.ai/build-with-cartesia/capability-guides/clone-voices — Instant 10–60 s,
  Pro 30+ min, ≤16 MB, single speaker, native language; **no consent wording on the page**. Clone API
  https://docs.cartesia.ai/api-reference/voices/clone — `clip, name, description, language, accent,
  base_voice_id, access: "private" | "public"`.

**Patterns to take:** (1) use case is a first-class filter, but every competitor stops at content category —
nobody filters by *support / sales / booking*, the words a builder already wrote in the prompt; (2) previews are
owner-authored fixed lines — **hearing your own greeting is whitespace**; (3) the only compare is "3 generated
previews" — a shortlist of 2–3 on one script is unclaimed; (4) clone consent = an unchecked confirmation of
rights + captcha for the professional tier, clones private by default, sharing = explicit allowlist; (5)
multi-voice = labelled set + LLM markup, an Engine feature everywhere.

## What we need (user-visible)
- Open the voice browser and see 3 voices **recommended for what this agent does**, inferred from its prompt and
  greeting, before the full table — honest that it is tag-based until the benchmark (868ka247c) lands.
- Shortlist up to 3 voices and **play/stop each on the same line**, side by side, without leaving the dialog.
- Hear the current voice from the Models row without opening the dialog (one play/stop).
- **Add your own voice**: paste the vendor voice id, name it, confirm rights/consent (unchecked by default), see it
  scoped to this project; the TTS drawer then shows it as Custom by construction.
- Never lose the pick on a vendor/tier change without being told (v4 toast lock).
- Empty, loading, error and "requires …" states that say what to do next.

## Tech requirements
- **Contract**: keep writing only `properties.tts.params.<path>` via `applyTtsVoiceIdForVendor`; read with
  `readTtsVoiceIdForVendor`. No new wire keys.
- **Inputs to the recommender**: `llm.system_messages[].content`, `llm.greeting_message`, `asr.params.language`
  (accent hint: en-IN → Indian, en-GB → British, en-AU → Australian), the vendor's fetched library page(s).
  `StudioVoice.tags` (Confident · Calm · Enthusiastic · Young …) is the only signal; `accent`/`gender` for
  filtering. Deterministic, unit-tested, no network.
- **Preview**: one `HTMLAudioElement` per surface, play on click only, stop on close/unmount/route change,
  `aria-pressed`, visible ■ while playing. Greeting-text preview = **Requires Studio preview endpoint** (proposed
  `POST /api/studio-v2/vendors/:vendorId/voice-library/preview {voice_id, text}`) — disabled until then.
- **Draft state (no API field)**: sessionStorage per agent, 07 pattern — shortlist
  `ng-console.design.01.voice-shortlist:<agentId>`, own-voice record `ng-console.design.01.own-voice:<agentId>`
  `{vendor, voiceId, name, consentAt, scope:"project"}`. Never written to `properties`.
- **Flags**: none beyond the sandbox branch; if it cuts to `design/01-voice-picker`, gate the Recommended strip
  behind `VITE_NG_CONSOLE_VOICE_RECOMMENDATIONS` so the honest-label question can be settled separately.
- **Telemetry**: `voice_selected_from_recommendation {useCase, vendor, voiceId, rank}` ·
  `voice_previewed {source: "sample" | "greeting", vendor, voiceId, inCompare}` · extend existing
  `agent_voice_changed` with `via: "library" | "recommended" | "compare" | "own"` · `own_voice_added {vendor}`.
  Counter-metric `voice_changed_again_24h`.
- **Dependencies**: teammate branch `codex/add-voice-clone` (merge first, then rebase the sandbox); 868ka247c
  benchmark output shape (to replace tag heuristics); Studio voice store + consent record (868kbyqeh) before any
  "revoke/where used"; Engine voice-set + switch (868kyr1ej) before anything multi-voice is enabled.
- **A11y/i18n findings to log**: dialog Play/Pause label hardcoded (:229); filter option values double as display
  strings and API values (:167–198); `--input` stroke ≈ 1.7:1 in light theme (07 finding, unchanged).

## Open questions for the owner
1. **Recommended = tags today.** OK to show "Recommended for support" from prompt/greeting + tag heuristics with a
   tooltip "Based on voice tags, not benchmarks", or wait for 868ka247c's evidence before the word "Recommended"
   appears on a live surface?
2. **Hear my greeting.** Request the Studio preview endpoint (no ticket) so compare plays the agent's own greeting,
   or ship compare on vendor samples only? Proposal: ship on samples, toggle disabled with "Requires Studio preview".
3. **Consent record.** Is a self-attested, unchecked checkbox in the Console an acceptable "record consent" for
   868kbyqeh until Studio stores it, or must own-voice entry stay behind the drawer's Custom toggle (no consent UI)?
4. **Inert multi-voice.** Show one disabled "Add another voice" with "Requires Engine · voice switching" (07's
   idiom), or keep 868kyr1ej out of the UI entirely until the Engine contract exists?
5. **Where "Add your own voice" lives.** Dialog link (this design) with the drawer's Custom toggle as the expert
   path, both writing the same param — agree? The teammate's branch must land first.
6. **Cartesia / ElevenLabs Voice button is disabled today** (:419–423). Intentional (no Studio library for them)
   or a gap? If a gap, the own-voice path is how those vendors get a voice at all.
7. **R8 preference test** (8 developers, gallery vs recommendation vs wizard): run before the prototype, or use the
   sandbox prototype as the stimulus?
