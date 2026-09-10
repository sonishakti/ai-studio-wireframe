# 02 · Turn-taking & listening — intake brief (2026-09-10)

Tracker: https://app.clickup.com/t/868m0mef4 · status `added` · priority high · design wave Oct (start 10-01 → due 10-30; 11 days = research 5 · proto 4 · review 2) · Tags builder · engine · P0-Sep (engineering month, not a design date). Research folder `references/research/02-turn-taking/`. Surface: live Console `AgoraIO/ng-console`, branch `design/sandbox`; read-only during research.

## Scope (from the roadmap tasks, pulled via ClickUp API 2026-09-10)

Tracker JTBD: "User wants the agent to interrupt, wait and listen like a person." UI: Partial (turn-detection controls exist). Locks: none.

| Task | Owner · status | What it says (quoted) |
|---|---|---|
| **868kytqwj** Tune turn-taking and backchannel behavior per agent | Studio · added | Outcome: "A builder can tune how quickly an agent responds, when it can be interrupted, how it resumes, and whether it acknowledges a caller while they are speaking." Scope: "response wait behavior, interruption sensitivity, and the amount of speech required to interrupt" · "pause and resume behavior after an interruption, dynamic responsiveness, and first-message delay" · "backchannel acknowledgements **separately from filler words**: enablement, frequency, and the phrases the agent may use while the caller is speaking" · "Show defaults, preset-resolved values, valid ranges, and the effective runtime configuration." Acceptance: "Custom values round-trip without loss and are not silently replaced by a preset." · "Unsupported combinations fail before publication with an actionable error." · "Simulation exercises the same effective values used in production." · "Existing turn-detection and filler-word settings remain compatible and **are not duplicated**." Ownership: "Studio owns configuration, validation, presets, preview… Engine owns the canonical public contract and runtime execution… SIP has no policy ownership for these controls." |
| **868kykhaz** Define the shared per-agent behavior control contract | Engine + Studio · added | "Presets resolve to visible values. Custom settings round-trip without loss." · "Simulation lets a builder hear or inspect the effective behavior before publication." · "A missing public Engine capability is an explicit Engine dependency rather than hidden Studio work." Boundaries: voicemail, DTMF, multilingual, guardrails, voice selection, retention stay in their own areas. |
| **868ktferv** [O2.1-T1.a] Make Semantic SOS publicly available | Engine · in version | "Customers use Semantic SOS without a whitelist or private field." Acceptance: "Publish a versioned schema, pass robustness gates, and support all required Supernode environments." |
| **868kuj31z** [O1.4-T1.a] Set the Semantic EOS default to 240 ms | Engine · added | "Enabled Semantic EOS responds faster without clipping user speech." Acceptance: "After the Soniox-to-Deepgram migration, validate truncation and talk-over before changing the default from 320 ms to 240 ms." |
| **868kuj2zw** [O1.3-T1.a] Publish preemptive response controls | Engine · in version | "Developers can enable earlier inference with predictable behavior." Scope: "supported paths, cost, cancellation, effective-state reporting, and explicit failure behavior." |
| **868kamm6y** [O2.4-T2.a] Add active-listening backchannels | Engine · clarified | "Agents acknowledge users without taking or interrupting the turn." Scope: "Validate non-turn-stealing backchannels in a proof of concept." |
| **868ker6tm** [O2.4-T3.a] Document user-first opening behavior | Docs · added | "Developers understand that omitting the greeting lets the user speak first." Scope: "Document the existing behavior **without introducing a duplicate configuration switch**." |
| **868kuj3f6** [O2.2-T1.a] Add dynamic SIP speaker locking | Engine · added | "The agent recovers when the active SIP speaker changes or the initial lock is incorrect." Scope: "lock, unlock, and reacquisition across target languages with explicit recovery behavior." |

None of the eight roadmap tasks carries a due date in ClickUp.

## What the Console has today

Worktree `ng-console/.worktrees/rebase` = design/sandbox rebased on origin/staging incl. PR #1443 + #1446 (read 2026-09-10).

**Advanced tab** — `src/components/console/agent-advanced-page.tsx` :172–187: if `mllm.enable` → `MllmTurnDetectionSection` (:315; writes `mllm.turn_detection`, modes server_vad · semantic_vad · agora_vad by vendor; header "Turn Detection" / "Configure when the realtime model starts and stops responding."), else `AdvancedSharedSection`; then `DataRetentionOptOutRow`.

**`AdvancedSharedSection`** — `src/components/console/agent-config-drawer.tsx` :458–1231, a flat list of `AdvancedRow`s (:1233: chevron button · title + one-line description · `Switch size="sm"` with Tooltip when disabled · body `pl-9`; `Separator` between rows). Labels are `pages.agents.builder.*` in `src/lib/i18n/resources/en/common.ts` (block starts :2168).

| Row (:line) | Label / description today | Writes |
|---|---|---|
| Turn Detection :666 | "Turn Detection" / "Control conversation flow and turn-taking behavior. Realtime (MLLM) agents use their own turn detection settings." Body: "Quick Presets" (`pages.agentConfig.quickPresets`) buttons **Responsive · Balanced · Patient · Custom** (:448–457 — string literals, not i18n; Custom is inert, `if (!preset) return`) + "Threshold" 0.01–0.99 | `turn_detection.mode="default"`, `config.speech_threshold`; a preset click (:715) replaces the whole `turnDetection` object with `createStudioTurnDetectionPresetProperties(preset)` and never touches `interruption` |
| Start of Speech :746 | "Start of Speech" / "How the system detects when the user starts speaking." · "Start mode" vad/manual · "Interrupt duration" · "Speaking interrupt duration" · "Prefix padding" (bare numbers, unit not in the label) · manual: "Manual detection requires your client to send start/end-of-speech signals through RTM… The built-in preview does not send these manual signals." | `config.start_of_speech.{mode, vad_config.{interrupt_duration_ms, speaking_interrupt_duration_ms, prefix_padding_ms}}`; manual forces `advanced_features.enable_rtm=true` + `parameters.data_channel="rtm"` (:551–590) |
| Interruption :816 (#1443) | "Interruption" / "Choose how users interrupt the agent." or "Not configured; backend default applies." · switch "Allow interruption" · "Interruption trigger" Speech detected / Keywords · "Trigger keywords" (seeds "stop, hold on") · off: "While the agent speaks" Append — process speech afterward / Ignore — discard speech / Backend default | `interruption.{enable, mode, keywords_config.trigger_keywords, disabled_config.strategy}` |
| End of Speech :933 | "End of Speech" / "How the system decides the user has finished their thought. Semantic detection supports English and Chinese; other languages fall back to VAD." · "End mode" vad/semantic/manual · "Silence" · "Max wait" · "Semantic silence" · "Pause state" | `config.end_of_speech.{mode, vad_config.silence_duration_ms, semantic_config.{silence_duration_ms, max_wait_ms, pause_state_enabled}}`; choosing semantic seeds **320 / 3000 / true** (:568–574) |
| Selective Attention Locking :1018 | "Selective Attention Locking" / "Helps the agent focus on the right voice while filtering background speech." · "SAL Mode" locking/recognition · "Voiceprint URL" | `advanced_features.enable_sal`, `sal.sal_mode`, `sal.sample_urls.speaker_1` |
| Filler Words :1049 | "Filler Words" / "Natural filler phrases while the agent processes a response." · "Filler content" · "Response Wait Threshold (ms)" · "Selection Rule" | `filler_words.*` |
| Voice Format :1100 | Console-only | `voice_formatting.*` |
| Silent reminder :1145 (#1446) | "Silent reminder" / "Prompt inactive users after a period of silence. Does not apply to realtime (MLLM) agents." · "Reminder timeout (ms)" · "Reminder action" speak/think · "Reminder message" (seeds 4000 / speak / "Are you still there?") | `parameters.silence_config.{timeout_ms, action, content}` |
| History :1201 | "History" · "Max History" | `llm.max_history` |

Contract errors from `getStudioTurnContractErrors` render as a destructive Alert above the rows (:658, "Configuration needs updating before saving or previewing").

**Presets** — `src/lib/agents/studio-turn-detection.ts` :30–86: responsive thr .4 · SoS 120/120/600 · EoS vad 400 ms · balanced (= seed default, :1–6) thr .5 · SoS 160/160/800 · EoS vad 640 ms · patient thr .6 · SoS 240/240/1000 · EoS **semantic** silence 480 / max_wait 4000 (no `pause_state_enabled` key). `readStudioTurnDetectionPreset` (:10–28) is a deep-equal: any changed key → "custom". Only Patient is semantic; Balanced is VAD.

**Validators** — `src/lib/agents/studio-turn-contract.ts`: retired keys (`vad`, `turn_detection.{type, threshold, interrupt_mode, interrupt_keywords, …}`, `start_of_speech.{keywords_config, disabled_config}`, `keywords_config.triggered_keywords`) :94–111, :135, :200; `start_of_speech.mode` vad|manual only ("configure interruption separately", :128–134); manual needs `enable_rtm` + `data_channel=rtm` (:166–178); ≤128 trigger keywords (:209–215); `max_wait_ms ≥ -1` (:185).

**PR #1446** (Hariharan G, 2026-09-09, `8d81a7b6`, 14 files +619/−119): `agent-config-drawer.tsx` +308 (manual SoS/EoS, Silent reminder row, retired-shape alert), `studio-turn-contract.ts` +62, `studio-conversation-contract.ts` +21, i18n +16. `docs/plans/1431-convoai-contract.md` (origin/staging): Todo 2 "Turn-detection/interruption data handling — Complete", Todo 3 "Separate interruption controls — Complete… acoustic checks pending", Todo 5 "MLLM and silence reads/writes — Complete including reminder UI… reminder timing pending". Working agreement: "Do not implement legacy conversion or timeout unit migration" · "Preserve unknown fields where the contract permits pass-through."

**Preview / test** — right rail `src/components/console/agent-detail-right-panel.tsx` :46 default tab `test`; :78–88 renders `AgentPreviewWorkspace connectLabel="Start Call"`. `builder.preview.interruptible` is derived in `src/lib/agents/template-mappers.ts` :75–87 from `config.start_of_speech !== undefined` — pre-#1443 semantics, ignores `interruption.enable`. The Prompt tab's preview gate refuses to start without a greeting: `agent-editor-workspace.tsx` :1234 → "Add a first message before preview." (`previewNeedsFirstMessage`, common.ts :2302). No Test Strip exists in ng-console; the right-rail Test tab is its equivalent.

**Greeting** — Prompt tab, `agent-editor-workspace.tsx` :893–904: "Greeting" / "First assistant message before the live exchange starts." Nothing says an empty greeting lets the caller speak first.

**Missing:** a user-words layer over the ms fields · a recap of what Responsive/Balanced/Patient do · a "hear the difference" hook · a home for backchannels / preemptive replies / semantic SoS · any who-speaks-first signal.

## Already decided (don't re-litigate)

- Builder = one flat settings form: hairline rows, no cards-in-cards, no badge pills, no decorative icons; helper prose only where the field name can't carry the meaning; background knowledge behind the InfoHint/tooltip idiom (LEARNINGS §20, 2026-07-29 v7 Plain Form).
- Testing is ambient — "does it work yet?" answerable at every scroll depth; Test Strip (Talk · Run simulations · verdict line) is the one test entry; no A/B (v8, 2026-07-29). Folded rows recap their values inline so state never hides.
- Section labels in industry developer vocabulary, grounded against Vapi / Retell / ElevenLabs (2026-07-30).
- Voice (§11): specific over vague · present-tense active ("This pauses the agent") · honest · no fake urgency.
- Copy discipline: no new UI text beyond the proposed set; one short line under a control max; exact strings proposed in `05-directions.html`, "needs a yes".
- Prototype pattern from 07 (`e21a1a83`): `src/lib/agents/<feature>.ts` planner + test · `src/components/console/<feature>-row.tsx` + test · 1–8-line mount · `pages.<page>.<feature>.*` i18n; draft state the API has no field for lives in `sessionStorage` per agent, never in `properties`.
- Design WITH #1443/#1446: the raw rows stay and own their state; anything new re-presents the same properties or is visibly inert ("Requires Engine"). Honesty floor: never a bare orb.

## Agora fact-check

Canonical join contract = installed `agora-agents@2.4.0` → `ng-console/node_modules/agora-agents/dist/cjs/api/resources/agents/client/requests/StartAgentsRequest.d.ts` (line numbers below). Docs: https://docs.agora.io/en/conversational-ai/rest-api/agent/join (fetched twice 2026-09-10 — only the code examples survive the fetch, the schema table doesn't; field quotes below come from the SDK) · https://docs.agora.io/en/ai/build/shape-the-conversation/interrupt-agent · https://docs.agora.io/en/ai/release-notes.

| Primitive | Field path (verbatim) | Source |
|---|---|---|
| Turn detection | `properties.turn_detection` — "Controls the logic for voice activity detection and conversation turn determination. This object has no effect when `mllm.enable` is true; use `mllm.turn_detection` instead." · `mode` · `config.speech_threshold` · `config.start_of_speech` ("Determines when a user begins speaking") · `config.end_of_speech` ("Determines when a user ends their speech") | d.ts :104–105, :271–275 |
| Start of speech | `start_of_speech.mode` vad · manual (`keywords`: "Deprecated. Use `interruption.mode = "keywords"`"; `disabled`: "Use `interruption.enable = false` with `interruption.disabled_config.strategy`") · `vad_config.{interrupt_duration_ms, speaking_interrupt_duration_ms, prefix_padding_ms}` | :285–286, :316–318 |
| End of speech | `end_of_speech.mode` vad · semantic · manual · `vad_config.silence_duration_ms` · `semantic_config.silence_duration_ms` · `semantic_config.max_wait_ms` ("Use `-1` for no timeout") · `semantic_config.pause_state_enabled` ("when the user's input ends with phrases such as 'hold on' or 'just a moment', the agent waits for further input rather than treating the utterance as complete") | :385–399 |
| Interruption | `properties.interruption.enable` ("`false`: … the agent cannot be interrupted mid-response") · `mode` `start_of_speech` ("Trigger interruption when the user starts speaking") / `keywords` ("when the user speaks a specified keyword") · `keywords_config.trigger_keywords` (≤128) · `disabled_config.strategy` append / ignore ("Applicable only when `interruption.enable` is `false`") | :452–498 |
| Speaker lock | `advanced_features.enable_sal` ("When enabled, configure the `sal` field") · `sal.sal_mode` `locking` ("Personalized mode: … a speaker's voiceprint URL is pre-registered through the `sample_urls` field. The agent then locates the speaker") / `recognition` ("identifies different speakers and suppresses other background voices and environmental noise") · `sal.sample_urls` ("Only one voiceprint URL is supported… Do not set the incoming voiceprint name to 'unknown'") | :158–159, :518–530 |
| Filler words | `filler_words` — static phrases only; play while the agent *thinks*, not while the caller talks | :115, facts sheet |
| Silence | `parameters.silence_config.{timeout_ms, action, content}` (#1446) | facts sheet |
| Greeting | `llm.greeting_message`; `llm.greeting_configs.interruptable` (v2.7) | :36; release notes |
| Evidence | `GET …/turns` → `turns[].start.type` voice_input · greeting · silence_timeout · api_speak; `start.metadata.{speech_duration_ms, interrupt_duration_ms}`; `end.metadata.caused_by` `start_of_speech` ("A new voice input interrupted the turn") · `api_interrupt` · `api_speak` · `api_leave`; ignored-turn reasons `semantic` · `keywords` · `disable` ("interruption is disabled for this turn") | `GetTurnsAgentsResponse.d.ts` :83–152 |

Release notes: v2.0 (2025-11-15) SAL "identify specific speakers and suppress background voices and environmental noise" · v2.4 (2026-02-02) "three SoS modes (vad, keywords, disabled) and two EoS modes (vad, semantic)" · v2.5 (2026-03-31) "mode + config pattern" + pause state "detect when a user intends to pause the conversation" · v2.6 (2026-04-22) top-level `interruption` object: "start_of_speech and keywords trigger modes, and configurable handling strategies" · v2.7 (2026-05-20) greeting `interruptable` · v2.9 (2026-07-01) manual SoS/EoS; "silently collects the user's ASR results while the greeting plays" · v2.10 (2026-07-30) `manualSOS` / `manualEOS` toolkit APIs.

Interrupt page: the structure differs from a modes reference — its sections are **Voice interruption** ("The engine detects user voice input and automatically stops the agent's response"), **Manual interruption** (REST + client toolkit) and **Reference**. It does not describe `interruption.enable/mode` or `disabled_config`. Its example is SoS vad `interrupt_duration_ms: 160, speaking_interrupt_duration_ms: 320, prefix_padding_ms: 800` + EoS semantic `silence_duration_ms: 320, max_wait_ms: 3000` — the docs use 320 for the while-speaking threshold where the Console default writes 160.

**Not in the contract → Requires Engine**
- Semantic **start** of speech — only semantic *end* exists (`start_of_speech.mode` is vad | manual). **Requires Engine (868ktferv, in version).** Would appear as a third Start mode; no row of its own.
- Preemptive replies / earlier inference. **Requires Engine (868kuj2zw, in version).**
- Active-listening backchannels ("mm-hm" without taking the turn). **Requires Engine (868kamm6y, clarified — PoC).** Not filler words.
- 240 ms semantic-EoS default. An Engine default; the Console seeds 320 (:570) and Patient uses 480. **Requires Engine (868kuj31z, added)** + a one-constant Console change when it lands.
- Dynamic SIP speaker locking (lock / unlock / reacquire). Engine work on top of the `sal` primitive. **Requires Engine (868kuj3f6, added).**
- User-first opening = greeting left empty. No field. Documentation task (868ker6tm) that forbids "a duplicate configuration switch".
- The `turns` response still documents `start_of_speech.mode = keywords` (:149) — stale versus v2.6; don't build on it.

## Competitor evidence (public docs only, fetched 2026-09-10)

- **Vapi** https://docs.vapi.ai/customization/speech-configuration — Start Speaking Plan: `waitSeconds` 0.4 s ("how long the assistant waits before speaking after the customer finishes"), `smartEndpointingPlan` providers (Krisp threshold 0–1, default 0.5, "lower values = snappier"; Deepgram Flux; Assembly; LiveKit `waitFunction` "200 + 8000 * x"; Vapi), `transcriptionEndpointingPlan.{onPunctuationSeconds, onNoPunctuationSeconds}`. Stop Speaking Plan: `numWords` (0 = immediate; "increase (2-3 suggested) to avoid brief acknowledgment interruptions"), `voiceSeconds` 0.2 s, `backoffSeconds` 1 s ("how long the assistant waits before starting to talk again after being interrupted"). Guidance is one direction sentence per field: "Increase if assistant speaks too soon; decrease to reduce delay".
- **Retell** https://docs.retellai.com/api-references/create-agent — `responsiveness` [0,1] default 1 ("Lower value means less responsive agent (wait more, respond slower), while higher value means faster exchanges"); `interruption_sensitivity` [0,1] default 1 ("Lower value means it will take longer / more words for user to interrupt agent"); `enable_backchannel` + `backchannel_frequency` 0.8 + `backchannel_words` ("phrases like 'yeah', 'uh-huh' to signify interest and engagement"); `reminder_trigger_ms` 10000 + `reminder_max_count` 1; `end_call_after_silence_ms` 600000. Settings-page URLs (`/build/agent-settings`, `/build/agent-config/speech-settings`) returned 404 — dashboard labels not captured.
- **ElevenLabs** https://elevenlabs.io/docs/agents-platform/customization/conversation-flow — "Take turn after silence" (`turn.turn_timeout` 1–30 s; "Shorter timeouts create more responsive conversations but may interrupt users who need more time to respond"); "Turn eagerness" `patient · normal · eager` (default normal; eager = "jumping in at the earliest opportunity"); "Interruption allowed / Interruption ignored" under Advanced › Client Events with the rationale "Disable interruptions when the complete delivery of information is crucial, such as legal disclaimers or safety instructions".
- **LiveKit** https://docs.livekit.io/agents/build/turns/turn-detector/ — audio turn model combining "semantic understanding with acoustic cues like intonation, pitch, and rhythm"; `min_delay` 0.3 s / `max_delay` 2.5 s with the detector (0.5 / 3.0 without); `unlikely_threshold` per language; 14 languages. No dashboard controls — the model replaces the numbers.

**Patterns.** (1) Words or a 0–1 scale, not ms: ElevenLabs eagerness `patient · normal · eager`, Retell `responsiveness`. (2) Controls named by what the agent does — "start speaking", "stop speaking", "take turn after silence" — not by the detector. (3) Backchannel = toggle + frequency + sample words, separate from fillers (Retell; matches 868kytqwj). (4) Reminder = timeout + max count (Retell); the Console has timeout + action + message, no count. (5) Guidance is one direction sentence or one rationale ("legal disclaimers") — tooltip-sized. Nobody surfaces prefix padding or a VAD threshold as a primary control; LiveKit hides them behind a model, Vapi inside plans.

## What we need

1. One **Turn-taking** row in the caller's words with a recap of what the chosen preset does ("Interrupts after 160 ms of speech · waits 640 ms of silence · interruptions on"); Custom folds to the raw rows that already exist.
2. A way to **hear it**: "Try interrupting" on the live test with a verdict line fed by real turn evidence.
3. A **Listening** group: SAL renamed to what it does ("Lock onto one speaker"), plus honest, inert homes for Backchannels and Preemptive replies marked "Requires Engine".
4. **Who speaks first** visible where the greeting lives — a recap line, not a second switch (868ker6tm).
5. **Nothing duplicated**: the row and the raw rows read and write the same `turn_detection` / `interruption` properties; "presets resolve to visible values" (868kykhaz).
6. **MLLM agents** keep their own section; the new row doesn't render there.

## Tech requirements

- Recap = pure function of `turn_detection` + `interruption` (+ `mllm.enable`), unit-tested for the three presets, Custom, keywords mode, interruption off (append / ignore / backend default), manual SoS/EoS, and MLLM ("does not apply").
- "Interrupts after" reads `speaking_interrupt_duration_ms` (the threshold while the agent talks); "waits" reads `end_of_speech.vad_config.silence_duration_ms`, or in semantic mode "waits for the end of the thought · up to {max_wait_ms}" (−1 = no cap); `pause_state_enabled !== false` → "pauses on 'hold on'".
- Preset apply keeps calling `createStudioTurnDetectionPresetProperties` (:715) and leaves `interruption` alone. The deep-equal `readStudioTurnDetectionPreset` turns any edit (even adding `pause_state_enabled`) into Custom — acceptable; the recap must still render numbers for Custom.
- The 240 ms default must be one constant (the `320` at drawer :570) so 868kuj31z lands as a one-line change; the recap shows the effective number, never the ticket's.
- Inert Engine rows: `sessionStorage` key `ng-console.design.02.listening:<agentId>`; switch disabled via the `AdvancedRow switchDisabledTooltip` idiom; nothing written to `properties`.
- "Try interrupting" reads `interruption.enable` + `start_of_speech.mode` (manual → unavailable: the built-in preview "does not send these manual signals"); the verdict needs turn events in the preview (`console-preview-events.tsx`) or a `turns` read after the call — Console work, not Engine. `template-mappers.ts` :75–87 `preview.interruptible` should read `interruption.enable` (log; don't fix in the slice).
- The Prompt tab's `previewNeedsFirstMessage` gate (:1234) contradicts user-first opening in preview — owner question, not a slice change.
- i18n: `pages.agentAdvanced.turnTaking.*`, `pages.agentAdvanced.listening.*`, `pages.agentAdvanced.tryInterrupting.*`; the new row's preset labels go through i18n (the literals at :448–457 stay — teammate file).
- Stroke token finding from 07 stands (`--input` ≈ 1.7:1 in light); use Console primitives, log, don't fix.

## Open questions for the owner

1. **Per agent or per deployment?** 868kykhaz / 868kytqwj say per-agent ("SIP has no policy ownership"), yet "dynamic SIP speaker locking" is transport-side. Default in the directions: agent property; SIP locking is an Engine dependency shown on the same row.
2. **Where does 240 ms land?** Engine default when `semantic_config.silence_duration_ms` is omitted, or a Console seed? Today Balanced is VAD 640 ms and only Patient is semantic (480). Should Balanced become semantic when 868kuj31z ships ("Enabled Semantic EOS responds faster")?
3. **Replace or add?** Should the Turn-taking row *replace* the Quick Presets buttons inside Turn Detection (delete words) or sit above the raw rows (additive, sandbox-safe)? Proposal: additive on `design/sandbox`, replacement in the `design/02-turn-taking` slice PR.
4. **User-first opening UI.** 868ker6tm forbids a duplicate switch. Is one recap line under Greeting ("Caller speaks first when this is empty") acceptable, and should the preview gate "Add a first message before preview" be lifted so it can be heard?
5. **Which month to print** on the inert rows? No roadmap task has a due date. Proposal: "Requires Engine · Sep" for in-version items (preemptive), "Requires Engine · planned" for backchannels.
6. **Backchannel content.** Static phrase list like filler words, or Engine-generated? 868kytqwj says "the phrases the agent may use" — the inert row assumes a list plus a frequency.
7. **Test hook home.** The right-rail Test tab (exists in ng-console) vs a Test Strip (design office pattern, not in ng-console)?
