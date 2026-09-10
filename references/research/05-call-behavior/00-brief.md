# 05 · Call behavior rules — intake brief (2026-09-10)

Tracker: https://app.clickup.com/t/868m0mejx · status `added` → research WIP · Tags builder · telephony · P0 ·
design wave Oct 2026 (M: 3 research · 4 proto · 2 review). Roadmap tasks pulled via ClickUp API 2026-09-10.

## Scope (from the roadmap tasks)
- **868kytrua** Configure idle, silence, duration, and call-screening behavior — *Studio P0.* Outcome: "A builder can
  define what an agent does during prolonged silence, how long a call may continue, and what it says when a
  call-screening service answers." Scope: "Configure reminder timing and count during inactivity. · Configure when the
  agent ends a call after silence and the maximum call duration. · Configure the identity and purpose the agent gives
  when a call-screening service answers. · Show the effective timing values and the resulting behavior in simulation. ·
  Expose identical values through Studio, the public REST API, and Agent SDKs." Ownership: "Studio owns policy
  configuration, validation, preview, and cross-surface parity. Engine owns timers, runtime state transitions,
  screening-service behavior, and the canonical public contract. SIP executes call termination only through the
  established Engine-to-SIP contract and adds no independent policy." Acceptance: "Timing values have explicit units,
  bounds, defaults, and precedence. · Simulation covers reminders, silence termination, maximum duration, and
  screening-service responses. · Runtime outcomes and the effective configuration are visible in session evidence. ·
  Voicemail policy, DTMF, transfer policy, and campaign calling windows remain separate capabilities."
- **868kgy2n3** Allow voice agents to leave a message after voicemail detection — *Studio P1, requested by Blaise
  Thomas.* Problem: "Today, when the voice agent detects that a call has reached voicemail, it immediately hangs up."
  Acceptance: "Studio provides a clear configuration for enabling voicemail message delivery. · Users can define the
  message content that should be played after voicemail detection. · …the configured message is played instead of
  hanging up immediately. · The call ends cleanly after the message has been delivered. · Existing behavior remains
  available for users who want to hang up immediately… · Runtime events and logs distinguish voicemail detection,
  message playback, successful completion, and failure."
- **868kykbfw** Configure DTMF input and IVR navigation in Studio — *P1.* Send: "an action or workflow node that sends
  DTMF digits during an outbound call so an agent can navigate an IVR, enter an extension, or supply a numeric value.
  Support configurable timing and show each sent digit action in simulation and session logs." Receive: "ask callers
  for keypad input such as a PIN, menu choice, account number, or verification code. Support digit limits, a
  termination key, and an inactivity timeout. Make sensitive input redaction configurable and keep raw protected
  values out of transcripts and logs." "SIP owns one reusable runtime contract for sending and receiving DTMF… Studio
  does not own tone transport, IVR signaling, or queue behavior."
- **868kykbft** Add runtime guardrails for agent input and output — *P1.* "Evaluate caller or user input before the
  model acts on it and evaluate agent output before it reaches voice, chat, SMS, or web users. For each policy, define
  the covered categories and the response when it triggers… replacing the content with an approved message, refusing
  the request, or invoking a configured handoff or end action." "Changing a guardrail policy requires
  agent-configuration permission and records the actor and change."
- **868keazr7** [O4.4-T1.a] Validate agent configuration before join — *Engine P1, Oct.* "Invalid models, keys, and
  conflicting settings fail before a live call." Scope: "Return actionable validation errors without silently changing
  the requested configuration." Backlog note: "Needs-attention preflight already exists."

## What the Console has today (ng-console `design/sandbox` rebased on `origin/staging`, read 2026-09-10)

Two layers hold call rules, and they do not know about each other.

### Agent layer — Engine join contract (`properties.*`), Advanced tab
| Surface | File:line | Truth |
|---|---|---|
| Silent reminder row (Reminder timeout **(ms)** · Reminder action speak/think · Reminder message) | `src/components/console/agent-config-drawer.tsx:1145–1197` (PR #1446); validator `src/lib/agents/studio-conversation-contract.ts:36–66`; i18n `common.ts:2350–2359` | Real. Writes `parameters.silence_config` through `patchSilence` (`:483–491`). Switch-on defaults 4000 ms / speak / "Are you still there?". Description already says "Does not apply to realtime (MLLM) agents." |
| Interruption row (Allow interruption · trigger · while the agent speaks) | `agent-config-drawer.tsx:818–900` (PR #1443); validator `src/lib/agents/studio-turn-contract.ts` | Real. `interruption.{enable, mode, keywords_config, disabled_config}`. |
| History row | `agent-config-drawer.tsx:1211–1225` | Real. `llm.max_history`. |
| Contract Alert | `agent-config-drawer.tsx:659–666` → "Configuration needs updating before saving or previewing" (`common.ts:2368`) | Real. Renders `contractErrors.join("; ")` from both validators, destructive variant. |
| `idle_timeout` | read `src/lib/agents/orchestration-properties.ts:68` (`idleTimeout`), write `:117–118`; draft key `orchestration-contracts.ts:79`; allowlist `src/lib/convoai/agent-properties.ts:9,81`; seeds `template-presets.ts:79` (30 s) and `:165…508` (120 s), preview join `agents-page.tsx:1936` (60 s), `agent-editor-workspace.tsx:351`; label "Idle timeout" `common.ts:2245` used only as a template recap (`template-mappers.ts:175–179`) | **Round-trips through save, has no control anywhere.** |
| `farewell_config` | — | **Zero occurrences in `src/`.** Not in `OrchestrationDraft`. |
| Row primitive | `AdvancedRow` `agent-config-drawer.tsx:1233–1300`: chevron `Button` · title + one-line description · right `Switch size="sm"` with Tooltip when disabled · body · `Separator`. Module-private, not exported. | |
| Mount | `src/components/console/agent-advanced-page.tsx:171–191`: MLLM → `MllmTurnDetectionSection`, else `AdvancedSharedSection`; then `DataRetentionOptOutRow` (`:224`). | |

### Preflight today ("Needs-attention preflight already exists")
- `src/features/agents/agent-detail-authoring/agent-detail-authoring-rules.ts:29–79` `validateAgentDetailDraft`: turn-contract + conversation-contract errors first, then `system-prompt-required`, `mllm-credentials-required`, `model-configuration-required:<section>`. Codes, not prose.
- `src/components/console/console-shell.tsx:2631–2656` `getDetailPublishValidationError()` maps the **first** issue to i18n; `handleDetailPublish` calls `toast.error(...)` and does not open the dialog. The preflight is one toast on Publish.
- Right rail Test tab: `agent-detail-page.tsx:183, 296–345, 745–747` `previewValidationError` → "Preview needs attention." (`common.ts:2602`).
- `src/components/console/agent-publish-dialog.tsx` (642 lines): project + cost overview, no validation list.
- Deploy tab: `agent-detail-right-panel.tsx:193–250` `AgentDeployPanel` — "Telephony deployment", warning "Publish this agent…" or two buttons (Answer inbound calls · Make outbound calls).

### Deployment layer — Console telephony backend (per phone number, per campaign); not the Engine join contract
| Surface | File:line | Truth |
|---|---|---|
| Phone number › inbound "Hangup" group: Max call duration (30–10 800 s, default 300) · Silence timeout (30–1 800 s, default 120, disabled unless silence hang-up) · End call on conversation end · End call on silence · Enable transcript · Enable recording · Transfer to human | `src/features/telephony/phone-numbers/phone-number-call-behavior-section.tsx:22–107`; contract `src/lib/telephony/phone-number-contracts.ts:112–160` → `end_call_config.{end_call_on_ai_assistant, end_call_on_fax:false, end_call_on_silence_timeout, end_call_on_user_request, max_call_duration_seconds, silence_timeout_seconds}`, `transfer_config.{enabled, phone_number, description}`; bounds `:304–330`; i18n `pages.telephony.phoneEdit.*` `common.ts:3258–3285` | **Real, shipped.** Helper prose at `:44–47` is hardcoded English ("Control when the assistant ends inbound calls. Max duration always applies; silence timeout only applies when silence hangup is enabled.") outside the i18n guard. Docs https://docs.agora.io/en/ai/studio/deploy/inbound: "Max Call Duration (seconds) (required)", "Silence Timeout (seconds) (required): Call ends after this duration with no response", "End call on silence". |
| Campaign › call settings: Max call seconds (30–10 800) · Ring seconds (10–90) · Silence seconds (30–1 800) · Store transcripts · Store call recording · **Voicemail detection** · End-of-conversation hangup · Silence hangup · Fax detection hangup | `src/features/telephony/campaigns/campaign-surfaces.tsx:4102–4250`; wire `campaign-editor-transport.ts:257–266` `switch_configuration.{enable_voicemail, enable_max_silence_duration_hangup, enable_user_auto_hangup, enable_recording, enable_transcript, enable_llm_call_evaluation}`; bounds `campaign-authoring-session.ts:392–394`; i18n `pages.telephony.campaignForm.*` `common.ts:3083–3127` | **Real, shipped.** Voicemail detection = hang up only (matches 868kgy2n3's problem statement). |
| Session evidence: hang-up reasons `max_duration`, `silence_hangup`, `voicemail_hangup`, `voice_mail`, `context_aware_hangup`, `ai_hangup`, `no_answer`, `busy`, `call_timeout`…; categories `voicemail`, `no_answer`, `transferred_*` | `src/features/telephony/shared/call-formatters.ts:1–84`; `telephony-page.tsx:180–217`; `server/console-backend/telephony.ts:181–182` (`voicemailCalls`) | Real. Label collapse: `max_duration`, `silence_hangup`, `voice_mail` all render "Agent-initiated hang-up" — the rule that fired is invisible in the UI. |
| DTMF · IVR · call screening · guardrails | `grep -ri "dtmf\|call.screening\|guardrail" src` → only the seed prompt's "Guardrails:" lines in `agent-editor-workspace.tsx:185` | **Nothing.** |

## Already decided (don't re-litigate)
- Builder = one flat settings form, hairline rows, no cards-in-cards, no decorative pills; helper prose only where the name can't carry it; tooltip idiom for background (v7 Plain Form, 2026-07-29).
- Honesty floor never trimmed: deploy blockers + Fix→, live/pending truth, simulated disclosures (v7).
- "Hang-up/pacing/transfer stay AGENT-level in a 'Batch call behavior' sheet" (v4, 2026-07-28) — the owner already put hang-up policy on the agent, not the campaign.
- "Paced ≠ failed": every zero-progress moment shows its reason verbatim; a rule firing is the system working — primary tone, never warning (D1, 2026-07-09).
- A flow ends on a real test call, not a saved checkmark (A3, 2026-07-09); the Test Strip is the one test entry (v8).
- Voice: honest · direct · calm · confident; present tense; recovery in the same line as the failure (§11).
- 07 prototype pattern: `src/lib/agents/<feature>.ts` + test · `src/components/console/<feature>.tsx` + test · 1–8 line mount · `pages.<page>.<feature>.*` i18n · drafts the API can't hold live in `sessionStorage`, never in `properties`.
- Control stroke: `--input` ≈ 1.7:1 in light theme (07 log) — logged, not fixed in a slice.

## Agora fact-check (SDK `agora-agents@2.4.0` under `node_modules/agora-agents/dist/cjs/api/`, plus docs)
- `properties.idle_timeout` — `resources/agents/client/requests/StartAgentsRequest.d.ts:88–89`: "Sets the timeout after all the users specified in `remote_rtc_uids` are detected to have left the channel. When the timeout value is exceeded, the agent automatically stops and exits the channel. A value of `0` disables exit due to channel idle timeout only; it does not allow the agent to run indefinitely. Regardless of this value, the maximum runtime of a single task is 72 hours, after which the agent automatically exits." https://docs.agora.io/en/api-reference/api-ref/conversational-ai/join: integer, [0, 259200], default 30. https://docs.agora.io/en/ai/release-notes v2.8 (2026-06-11): "Setting `properties.idle_timeout` to `0` no longer means the agent runs indefinitely." · "Valid range is now `0` to `259200` seconds (72 hours)." → **Not a silence timer.** It counts from the last remote user leaving the channel.
- `parameters.silence_config` — `StartAgentsRequest.d.ts:648–695`: "Settings related to agent silence behavior. Does not apply when you integrate a `mllm`." `timeout_ms`: "`0`: Disables the silent reminder feature. `(0, 60000]`: Enables the silent reminder. You must also set `content`." `action`: "`speak`: Uses the TTS module to announce the silent prompt (`content`). `think`: Appends the silent prompt (`content`) to the context and passes it to the LLM." Join page defaults 0 / speak. Release notes v1.5 (2025-06-09): "`parameters.silence_config`" added. **No reminder-count field.**
- `parameters.farewell_config` — `StartAgentsRequest.d.ts:650–651, 711–720`: "Graceful hang-up settings for the agent." `graceful_enabled`: "When enabled, calling the POST method to stop the agent ensures that the agent is in an `IDLE` state before leaving the channel." `graceful_timeout_seconds`: "Graceful exit timeout (in seconds). Represents the maximum time to wait for the agent to enter an `IDLE` state before exiting the channel. This field is only effective when `graceful_enabled` is `true`." Join page defaults false / 30. Release notes v2.0 (2025-11-15): "adds a new `farewell_config` field… When enabled, calling the [Stop] API causes the agent to enter an `IDLE` state before leaving."
- `interruption` — `StartAgentsRequest.d.ts:106–107, 452–480`: "Interruption control configuration. Provides unified management of the agent's behavior when interrupted by the user." `enable` · `mode` start_of_speech | keywords · `keywords_config` · `disabled_config`. Shipped (#1443).
- `labels` — `:110–111`: "Custom labels in key-value pair format… bound to the agent and returned in the `payload` field of all message notification callbacks." Can tag which rule set a session ran; no UI.
- Telephony — `resources/telephony/client/requests/CallTelephonyRequest.d.ts`: `sip.{to_number, from_number, rtc_uid, rtc_token}` (E.164); `pipeline_id` "The unique ID of a published project in AI Studio"; `properties` = the four channel fields with a pipeline id, or "the complete parameters of the [Start a conversational AI agent] `properties`" (the example carries `idle_timeout: 120`). `resources/telephony/types/GetTelephonyResponse.d.ts`: `type` inbound | outbound; `reason` — "`request`: Actively hung up. · `hangup`: The other party hung up. · `failed`: Call failed."; `state` — "`answered`: The call was answered. · `hangup`: The call was disconnected."; `create_ts`, `stop_ts`. **No `no_answer`, `busy`, `voicemail`, `max_duration` or DTMF anywhere in the SDK telephony types** — those reasons exist only in the Console telephony backend taxonomy. Release notes v2.0: "The telephony feature is currently in **Beta** and is provided free of charge."
- Doc URLs: https://docs.agora.io/en/ai/build/telephony/overview → 404 · https://docs.agora.io/en/conversational-ai/telephony/overview → 404 · https://docs.agora.io/en/conversational-ai/rest-api/telephony/start → 404 · https://docs.agora.io/en/ai/studio/deploy/sip-trunk → resolves (SIP trunk setup) · https://docs.agora.io/en/ai/studio/deploy/inbound → resolves (quoted above) · campaign/outbound pages under both trees → 404 · https://docs.agora.io/en/ai/studio/build/customize-agent → resolves; Advanced tab lists turn detection, max history, SAL, filler words, voice format — no idle, duration, voicemail or DTMF · https://docs.agora.io/en/conversational-ai/studio/observe/call-history: outcomes "Completed · Transferred · Partial · No Answer · Busy · Voicemail".

### Rule → field today → gap
| Rule (user words) | Field today | Layer | Gap / ticket |
|---|---|---|---|
| If the caller is silent, say something | `parameters.silence_config.{timeout_ms (0, 60000], action, content}` | Agent · Engine | UI shipped (#1446), in ms. Reminder count: no field → Engine (868kytrua). MLLM: n/a. |
| Nobody on the line → hang up | `properties.idle_timeout` 0–259 200 s, default 30 | Agent · Engine | **No control.** New real control. |
| When stopped, finish speaking first | `parameters.farewell_config.{graceful_enabled, graceful_timeout_seconds}` | Agent · Engine | Not in the Console. New real control (needs an `OrchestrationDraft` field). |
| End the call after silence | `end_call_config.end_call_on_silence_timeout` + `silence_timeout_seconds` 30–1 800 (default 120); campaign `enable_max_silence_duration_hangup` + silence seconds | Number · Campaign (Console telephony backend) | Exists per deployment. Agent-level = Engine (868kytrua). |
| End the call after N minutes | `end_call_config.max_call_duration_seconds` 30–10 800 (default 300); campaign max call seconds | Number · Campaign | Exists per deployment. Agent-level = Engine (868kytrua). Engine hard cap 72 h regardless. |
| End when the conversation is over | `end_call_on_ai_assistant` / `end_call_on_user_request`; campaign `enable_user_auto_hangup` | Number · Campaign | Exists. |
| Voicemail: detect and hang up | campaign `switch_configuration.enable_voicemail` | Campaign only | Exists, outbound only, hang up only. |
| Voicemail: leave a message | — | — | **Requires Engine** (868kgy2n3). |
| Call-screening identity | — | — | **Requires Engine** (868kytrua). |
| Keypad: send digits / take digits | — | — | **Requires SIP + Engine** (868kykbfw). |
| Guardrails on input/output | — (prompt text only) | — | **Requires Engine** (868kykbft). |
| Validate before join | Console `validateAgentDetailDraft` → one toast; Engine none | Console · Engine | Engine half = 868keazr7 (Oct). Console list with Fix→ is new. |

## Competitor evidence (public docs, fetched 2026-09-10)
- **Vapi** — Voicemail https://docs.vapi.ai/calls/voicemail-detection: `voicemailDetection.provider` vapi | google | openai | twilio | off; `voicemailMessage` "Text or URL of audio file"; `beepMaxAwaitSeconds` "Maximum duration from call start to wait for a voicemail beep before speaking the message" default 30 (0–60); "if a human picks up mid-voicemail, the agent will switch back naturally." Default tools https://docs.vapi.ai/tools/default-tools: `dtmf` "The assistant will be able to enter digits on the keypad. Useful for IVR navigation or data entry."; `endCall` "The assistant can use this function to end the call." Idle messages https://docs.vapi.ai/assistants/idle-messages: hook `customer.speech.timeout` with `timeoutSeconds` 1–1000 default 7.5, `triggerMaxCount` 1–10 default 3, `triggerResetMode` never | onUserSpeech, `say.exact` / `say.prompt`. Ended reasons https://docs.vapi.ai/calls/call-ended-reason: `silence-timed-out`, `exceeded-max-duration` ("reached `maxDurationSeconds`"), `voicemail`, `assistant-ended-call`, `assistant-said-end-call-phrase`. Assistant fields https://docs.vapi.ai/api-reference/assistants/create (page >10 MB, not fetched verbatim; search summary only): `silenceTimeoutSeconds` default 30, range 10–3600; `maxDurationSeconds` default 600.
- **Retell** — Voicemail/IVR https://docs.retellai.com/build/handle-voicemail: Call Settings → "Hang up if reaching voicemail" or "Leave a message if reaching voicemail"; message = Prompt or Static Sentence with `{{vars}}`; "voicemail and IVR detection will only run for the first 3 minutes of the call"; outbound only; disconnection reasons `voicemail_reached`, `ivr_reached`; separate "IVR hangup". Agent API https://docs.retellai.com/api-references/create-agent: `end_call_after_silence_ms` "The minimum value allowed is 10,000 ms… By default, this is set to 600000 (10 min)"; `max_call_duration_ms` "minimum… 60,000 ms… maximum… 7,200,000 (2 hours). By default… 3,600,000 (1 hour)"; `reminder_trigger_ms` + `reminder_max_count` "default value of 1… Set to 0 to disable"; `allow_user_dtmf` default true; `user_dtmf_options.{digit_limit [1–50], termination_key (0–9 # *), timeout_ms [1000–15000]}`; `begin_message_delay_ms` [0, 5000]; `ring_duration_ms` default 30000. User DTMF https://docs.retellai.com/build/user-dtmf: "Whichever condition is met first completes the input"; captured by default (RFC 2833). Press digit https://docs.retellai.com/build/single-multi-prompt/press-digit: tool + optional description; pause detection delay "The default is 1000 ms… valid range is 0–5000 ms"; keys 0–9 * #; "Have the agent stay silent for that response so it doesn't speak while pressing."
- **Bland** https://docs.bland.ai/api-v1/post/calls: `voicemail_action` `hangup` "Immediately end the call without leaving a message." | `leave_message` "Play the `message` and then end the call." | `leave_message_and_sms` | `ignore` "Continue the call as if no voicemail was detected (used for IVRs or special routing)."; `voicemail_message` "played after the beep, then the call will end"; `max_duration` (minutes, default 30) "a timer is set… if the call is still active it will be automatically ended"; `wait_for_greeting` default false; `ivr_mode` "suppresses voicemail handling"; `precall_dtmf_sequence` "0-9, *, #, and w, where w is a pause of 0.5 seconds"; `ignore_button_press`.
- **ElevenLabs** — https://elevenlabs.io/docs/agents-platform/customization/tools/system-tools/play-keypad-touch-tone: system tool `play_keypad_touch_tone`, 0–9 * # plus `w` 0.5 s / `W` 1 s pauses; out-of-band RFC 4733 for SIP. https://elevenlabs.io/docs/agents-platform/customization/tools/system-tools/voicemail-detection: `voicemail_detection` tool, optional `voicemail_message` with `{{user_name}}`; "After detection and optional message delivery, the call is automatically terminated." https://elevenlabs.io/docs/agents-platform/customization/tools/system-tools/end-call: `end_call` (`reason`, optional `message`), on by default in the dashboard.
- Fetch failures: Vapi create-assistant (too large); Retell `build/voicemail-detection` 404 (found at `build/handle-voicemail`); Agora telephony overview/outbound pages 404 (see above).

### Patterns (what the field agrees on)
1. **One "Call settings" group on the agent**, sentence-style labels ("Hang up if reaching voicemail", "End call after silence") — Retell, Vapi and Bland keep the rules together on the agent/call object, not on the number.
2. **Voicemail is a two-way choice** (hang up | leave a message); the message is static or prompt-generated; detection is windowed (Retell 3 min, Vapi beep wait 30 s), outbound only, and has its own end reason (`voicemail_reached`, `voicemail`).
3. **Two silence timers in a ladder**: remind (short, capped count — Retell default 1, Vapi default 3) → hang up (long — Retell 10 min, Vapi 30 s). Max duration is a separate hard stop with a distinct end reason (`exceeded-max-duration`, `max_duration`). Defaults differ wildly (Vapi 10 min · Retell 60 min · Bland 30 min · Agora number 5 min).
4. **DTMF is a tool the agent calls** (Vapi `dtmf`, Retell Press digit, ElevenLabs `play_keypad_touch_tone`) plus a per-agent "accept keypad input" switch with digit limit · termination key · timeout (Retell). The agent stays silent while pressing.
5. **Whitespace**: nobody shows the effective ladder (remind at 4 s → hang up at 120 s → cap at 5 min) in one line before go-live, and nobody validates that the reminder fires before the hang-up. The Console today has the word "silence" on two timers in two places with no relation stated.

## What we need (user-visible)
- One place on the agent that reads as sentences: what happens on silence, when nobody is on the line, when the call runs long, when voicemail answers, when a key is pressed.
- The two real Engine timers with no UI today get controls: hang up after everyone leaves (`idle_timeout`) and finish speaking before leaving (`farewell_config`). Seconds, never ms.
- The silent reminder is re-presented in the same sentence grammar, reading and writing the same `silence_config` — one state, one row.
- Rules that live on the phone number or campaign today (max duration, silence hang-up, voicemail hang-up) are shown as what they are — value + where to change it — never as a second copy that can drift.
- Rules the Engine doesn't have (leave a message, keypad input, call screening, guardrails) are visible as disabled choices captioned "Requires Engine", so the roadmap is legible without pretending.
- Before go-live, a list of blockers with Fix→ links that reuses the validators the Console already runs, plus one ladder check (the reminder fires before the hang-up).

## Tech requirements
- Units: UI in seconds. `silence_config.timeout_ms` = seconds × 1000; read as `Math.round(timeout_ms / 100) / 10` (one decimal), write integer ms; 1–60 s ↔ (0, 60000]. Write only on user edit so untouched odd ms values survive. `idle_timeout` integer seconds 0–259 200 (tooltip states the 72 h cap and that 0 disables this reason only). `graceful_timeout_seconds` integer seconds, default 30.
- `farewell_config` needs `OrchestrationDraft.parameters.farewellConfig` + read/write in `orchestration-properties.ts` (~10 lines; wire key `parameters` already allowlisted).
- MLLM agents: omit the silence sentence (`silence_config` "Does not apply when you integrate a `mllm`"). No new caption — the row simply isn't there.
- Non-telephony agents: voicemail · keypad · max-duration sentences render only when a phone number or campaign is bound to the agent (read from the existing deployed-agent/phone-number queries); otherwise omitted.
- Drafts with no live field (leave-a-message text, keypad choice) → `sessionStorage` `ng-console.design.05.call-rules:<agentId>`; never into `properties`. Max duration is a read-only recap of the binding, not a draft — a draft that contradicts the live number fails the honesty floor.
- Preflight reuses `validateAgentDetailDraft` issues + both contract validators; blockers block Publish (today's toast becomes a list), warnings don't; Engine join errors (`TelephonyErrorResponse.error_type` / `description`, 868keazr7) pass through verbatim.
- i18n: every string in `common.ts` (`pages.agentAdvanced.callRules.*`, `pages.agentDetail.preflight.*`); sentence rows use `Trans` with placeholders, never string concatenation. Log the hardcoded helper at `phone-number-call-behavior-section.tsx:44–47` as a pre-existing exception.
- Evidence: `labels.call_rules = "<hash>"` on join if we want to prove which rule set a session ran (no UI).

## Open questions for the owner
1. **Agent-level vs number-level.** Max duration and silence hang-up exist per phone number and per campaign today; the roadmap wants agent-level values exposed identically via REST/SDK. Proposal: show the number's values read-only on the agent with "Edit →"; no agent-level draft until Engine ships. Alternative: an agent-level draft that becomes the default a new number inherits. Which?
2. **Voicemail and keypad — agent property or campaign/number property?** Campaigns already carry `enable_voicemail`. Proposal: the policy (hang up | leave a message, message text) on the agent; the campaign switch stays the on/off. OK?
3. **Where the preflight lives.** Deploy tab list (proposed), inside the publish dialog, or keep the Publish-click toast? When Engine returns join-time errors (868keazr7), do we show them verbatim in the same list?
4. **Re-presenting Silent reminder.** Call rules would own the silence sentence and hide #1446's row via a new optional prop on `AdvancedSharedSection` (default off, ~3 lines in a teammate's file). Acceptable, or should Call rules mount inside `AdvancedSharedSection` instead?
5. **Reminder count** ("reminder timing and count") has no Engine field. Ask Engine for `silence_config.max_count`, or drop it from v1?
6. **Call-screening identity** has no field and no competitor exposes it as a setting. Leave it out of v1 UI and let the prompt carry it?
