# 10 · Session & call logs — intake brief (2026-09-10)

Tracker: https://app.clickup.com/t/868m0meta · status `added` (set `clarified` when this folder lands) ·
Tags monitor · P0-Oct (eng) · design wave **Nov 2026** (protocol: research 3 · proto 5 · review 2 days).
Steps covered here: 0 · 1 · 4 · diverge half of 5. No UI built, nothing committed.

## Scope (roadmap tasks, pulled via ClickUp API 2026-09-10)

- **868khwg0c Build complete call and session logs** — Kevin Tu → Wayne Shen, `added`, 3 subtasks. Outcome:
  *"A builder can locate any Studio call or session, understand what happened, and diagnose the next action
  from one customer-safe Logs workspace."* Bar: *"match or exceed the useful behavior in Vapi's current Call
  Logs."* Session detail keeps, **on one timeline**: *"Playable and downloadable recordings when enabled,
  including available recording variants"* · *"A timestamped, speaker-labelled transcript synchronized with
  audio, including assistant identity through handoffs"* · tool calls *"with tool identity, redacted
  arguments"* · *"Redacted provider requests and responses where the customer is permitted"* · per-turn latency
  *"using the canonical Engine metric definitions"* · *"Artifact availability and processing state so a
  missing, processing, retained elsewhere, or unavailable artifact is never presented as empty data."*
  Acceptance (verbatim): *"Recording, transcript, messages, events, tool calls, workflow nodes, variables,
  structured outputs, and available diagnostics align to the same session timeline"* · *"Latency and event
  timing use the same definitions in Logs, agent preview, APIs, CLI"* · *"Secrets and protected content do not
  appear in customer-visible logs or exports"* · *"Artifact processing, retention, delivery, and unavailability
  states are explicit."* Ownership: *"Studio owns the Logs index, filters, session-detail UX, synchronized
  navigation, safe presentation, export experience … Engine owns the canonical session lifecycle, runtime
  events, component timing, tool and workflow evidence, redacted provider payload contract, artifact
  references … SIP owns telephony call legs."*
  Subtasks (all with empty descriptions): 868kmggq6 transcript visibility · 868kmggpy audio visibility ·
  **868kmgj0k "Engine provide recording / transcript storage from the session"** (Wayne Shen) — the storage
  dependency the tracker row doesn't list.
- **868kbyqfx [O4.3-T1.c] Align recordings and transcripts** — `added`. *"Customers can match recorded audio
  to the transcript timeline."* / *"Deliver timestamp-aligned artifacts in the session experience."*
- **868kbyqga [O4.3-T2.b] Expose redacted provider payloads** — status **`delivered`**. *"Developers can
  diagnose STT, LLM, and TTS behavior for one session without exposing secrets."* / *"Expose request and
  response payloads with credential and sensitive-data redaction."* (Delivered where? See open question 4.)
- **868kyqzt1 Normalize multi-speaker diarization** — `added`, Engine-owned. *"stable session-scoped speaker
  IDs, timestamps, confidence, and source-provider attribution"* · *"never present unlabeled or low-confidence
  speech as a verified identity"* · *"Studio owns transcript presentation, corrections, filtering, and
  diagnostics."* AC: *"Live and post-session transcripts use the same stable speaker references."*
- **868kadwhy [O4.3-T2.a] Show non-telephony session details** — status **`delivered`**. *"Studio users can
  diagnose Engine sessions that do not use telephony."* → this is `session-detail-sheet.tsx` (events +
  latency; no transcript, no audio).

## What the Console has today

Verified 2026-09-10 on `design/sandbox` @ `6ffb3118` (the `.worktrees/rebase` checkout was replaced by
`proto-*` worktrees mid-session; same commit). Owners of `call-detail-sheet.tsx`: **czhen** (#735 2026-07-12
"Deepen shared Telephony Call Detail", #812, #902), Ethan Zhang (#1075 release), Hariharan G (#1270 release).
`bipolar-waveform.tsx`: czhen (#216). Design **with** czhen.

- `src/features/telephony/shared/call-detail-sheet.tsx` (1511 lines). Tabs `events | latency |
  structured_output | transcript`, default transcript (:105). Summary rows :240–330. **Audio** :331 renders
  `CallRecordingPlayer` only when `recordFileUrl` is non-empty; the player (:1370–1499) is a hidden
  `<audio preload="metadata">`, a `<input type="range">` scrubber (`handleSeek` :1426), play/pause, open in
  new tab. `currentTime` is local state (:1373) — the transcript can't see it. **Transcript**
  `CallTranscriptPanel` :569–596 maps `{role, content}` to role label + text; keyed on content; not
  clickable; empty state `pages.telephony.callDetail.noTranscript` ("No transcript."). Role mapping :743
  `assistant → "Agent"`, else `"Customer"` (hardcoded English). `LatencyTabPanel` :841 tiles + per-turn bar
  chart (asrMs · llmMs · ttsMs) + table. `EventsTabPanel` :1089 filters + Time/Level/Module/Raw data.
- **Correction to MAP A gap 4:** `rawDetail` is built server-side as `JSON.stringify({event_type, message,
  module_name, service_name})` (`src/server/console-backend/telephony.ts:2353`). The Events tab is a lifecycle
  log — it carries **no provider request/response payloads**. There is nothing to redact on the client;
  `redactTelephonyDiagnosticDetails` (:1826, keys `authorization|cookie|jwt|password|secret|token` →
  `"[redacted]"`) runs on error diagnostics only.
- `src/features/telephony/call-history/session-detail-sheet.tsx` (445 lines): non-call sessions; tabs
  `events | latency`; summary Session ID/Start/End/Duration/Type/Status; `formatSessionType` :434 (hardcoded
  English: "RESTful API", "Studio preview"…). No transcript, no audio.
- Types `src/lib/telephony/telephony-api.ts`: `TelephonyCallDetail.callInfo.transcript:
  Array<{content, role:"assistant"|"user"}>` (:170) · `recordFileUrl` · `TelephonyCallLatencyDetail.perTurn
  [{asrMs, llmMs, totalE2eMs, ttsMs, turn}]` (:191) · `TelephonyCallLogEvent.rawDetail: string` (:216).
  Whether a recording exists is decided upstream by the number→agent binding `enable_recording` /
  `enable_transcript` (:284–300) — the honest "no recording" state is "recording is off for this number", not
  an empty row.
- Unwired primitives: `src/components/console/bipolar-waveform.tsx` (154 lines; samples `{id, value,
  tone: caller|agent|ambient}`, markers `{id, label, left, lane}`; only its test imports it) ·
  `src/lib/latency-metrics.ts` `LatencyTurn` (5 segments `algorithm_processing · asr_ttlw · llm_ttft ·
  transport · tts_ttfb` from the live `112 turns finished` message) — parallel to the logged 3-segment model.
- Server: `handleDownloadTelephonyAudio` (`src/server/telephony/handlers.ts:348–376`, allowlist
  `assertAllowedAudioUrl` :1289) is routed at `/api/telephony/download-audio` but **no client calls it**.
- Routes: `src/routes/agent-analytics.tsx` tabs `monitor | call-history | session-history` with per-tab search
  validators (`-telephony-route-search.ts`); sheets open from local state (`call-history-route-module.tsx`
  :203/:391 calls, :429/:616 sessions). No `call=` / `session=` search param → no pasteable URL.
- Live web/RTC transcript exists only in `agent-preview-surface.tsx` :316–410 / :555 (`LivePreviewTranscriptEntry
  {role, text, turnId}`), cleared on disconnect; such sessions appear in Session History as
  `studioPreview | restfulApi` rows with events + latency only.

**The 8 gaps (MAP A, confirmed):** 1 no transcript↔audio alignment · 2 no speaker model beyond Agent/Customer ·
3 no waveform/turn map · 4 no payload viewer — and no payloads · 5 non-telephony detail = events + latency only ·
6 no export/download (orphan endpoint) · 7 no deep-linkable URL · 8 two latency models never reconciled.

## Already decided (don't re-litigate)

- **Monitor** is the label and the hub (Overview · Call History · Chat History · Sessions); never "Analytics";
  don't re-split (CLAUDE.md, LEARNINGS §8 — Retell convention). Sessions = agent conversation sessions, not RTC
  telemetry. **Call History ≠ Session History is open tension #2 — do litigate, with the owner.**
- Wave 1 (`references/wave1-implementation-log-2026-07-29.html`): transcript and trace **in one view** ("the
  old call sheet split them across five tabs, which severs exactly the correlation you need"); **click a
  timestamp to seek**; raw STT/LLM/TTS payloads **inline, collapsed per turn** — *"a separate 'Raw' payload
  tab deliberately skipped"* ("wouldn't cross-reference a separate tab back to turn 14"); whole-session JSON
  export; jump to slowest turn; correlation block (channel name · agent UID · region · SDK); honest channel
  label (Chat has no recording); modelled values hatched, never mixed silently with measured ones.
  Carried forward, unbuilt: `/sessions/{id}?turn=7` deep link; interruption/barge-in spans.
- Wave 2 (`wave2-implementation-log-2026-07-30.html`): answer first, evidence underneath; **whose-fault badge**
  (config · carrier · callee · capacity); SIP Call-ID promoted with copy; *"No voice-AI platform correlates
  carrier signalling and pipeline stages on one time axis"* — the one-axis idea this feature inherits.
- F-Eval (LEARNINGS §20 2026-07-09): *"every test surface shows a live transcript + explicit
  listening/thinking/speaking state"*; *"'save a real call as a test' is whitespace (pre-fill persona +
  transcript, ask only the assertion)"*.
- Session Doctor PRD (`references/session-doctor-prd.md`, draft): story #11 "click an issue and have the
  related turn(s) highlighted in the session transcript"; RTC quality data out of scope.
- Voice (§11): honest, specific, present tense; no softening; error names the vendor. Honesty floor: never
  show a fabricated number; a trace that mixes measured and modelled is worse than none.
- Copy discipline + `--stroke` rule; Console primitives, additive only; i18n through `common.ts`.

## Agora fact-check

Sources: SDK `agora-agents@2.4.0` `node_modules/agora-agents/dist/cjs/api/resources/agents/types/
GetHistoryAgentsResponse.d.ts` + `GetTurnsAgentsResponse.d.ts` (quoted below); API refs
https://docs.agora.io/en/api-reference/api-ref/conversational-ai/history and
https://docs.agora.io/en/api-reference/api-ref/conversational-ai/turns (both resolved); guides
https://docs.agora.io/en/conversational-ai/rest-api/agent/history and …/agent/turns (both resolved —
guide-level, they link to the API refs); release notes https://docs.agora.io/en/ai/release-notes;
Cloud Recording https://docs.agora.io/en/cloud-recording/overview/product-overview and
https://docs.agora.io/en/cloud-recording/develop/individual-mode.

- `GET /v2/projects/{appid}/agents/{agentId}/history` → `contents[].{role user|assistant, content,
  speech_start_ms, speech_end_ms, speech_algorithmic_delay}`. API ref: *"Only supports querying the running
  agent."* SDK: `status?: "RUNNING"`. Post-call, the same data arrives by webhook *"`103 agent history` and
  `112 turns finished` … after the session ends"*; stored items capped by `llm.max_history` (*"The default is
  `32`"*). **Timestamps: "Only returned when: `llm.vendor` is `custom`, `contents[].role` is `user`, actual
  voice input is present"** (API ref; SDK jsdoc agrees). `speech_algorithmic_delay`: *"Use this value to align
  timestamps with cloud recording audio."* Release v2.8 (2026-06-11). **Discrepancy:** API ref says *"Unix
  timestamp in milliseconds"*, SDK jsdoc says *"relative to the beginning of the current session"* — the
  aligner must accept both.
- `GET /v2/projects/{appid}/agents/{agentId}/turns` (v2.5 2026-03-31; paginated v2.7, `page_size` default 50):
  *"After a conversation with the agent ends, use this endpoint"*; *"You can query sessions within the last
  7 days."* Per turn: `turn_id`, `start.{start_at, type, metadata.{speech_duration_ms, interrupt_duration_ms,
  greeting_nth, action speak|think, transport http|rtm}}`, `end.{end_at, type, metadata.{playback_duration_ms,
  caused_by, reason, details}}`, `metrics.{e2e_latency_ms, segmented_latency_ms[{name, latency}]}`.
  Enums (SDK, verbatim): `start.type` = `voice_input | greeting | silence_timeout | api_speak`;
  `end.type` = `ok | interrupted | ignored | error`; `caused_by` when interrupted = `start_of_speech |
  api_speak | api_interrupt | api_leave`, when ignored = `semantic | keywords | disable`; `reason` =
  `LLM_REQUEST_ERR | INTERNAL_ERR`; segment names (text) = `algorithm_processing · asr_ttlw · llm_ttft ·
  llm_ftfs · tts_ttfb · transport`, (audio) = `algorithm_processing · asr_ttlw · llm_ttfa · transport`;
  *"`transport` … Not returned when the user is connected using the RTC Web SDK."*
- Speakers: `sal.sal_mode = recognition` + `sal.sample_urls` (v2.0 2025-11-15: *"Register voiceprints to enable
  the agent to identify specific speakers"*) is the only diarization primitive; history roles stay
  `user | assistant`.
- Retention: `parameters.opt_out` (v2.8: *"To disable data retention for a session, set
  `properties.parameters.opt_out` to `true`"*). Redaction: **none in the Engine contract** — Console-side today.
- Recording: telephony recordings come from the SIP side (`callInfo.recordFileUrl`). Web/RTC sessions have no
  recording unless **Cloud Recording** (separate product) is started on the channel; individual mode gives one
  file per UID = caller and agent as separate "recording variants". v2.3 (2026-01-07) added a *"best practices
  guide for recording conversations with Cloud Recording"* — three URL guesses 404'd; cite the release note.

| Capability | Engine field (source) | Console today | Gap / ticket |
|---|---|---|---|
| Transcript text | `history.contents[].{role, content}` | `callInfo.transcript` → `CallTranscriptPanel` :569 | non-telephony: none (868kmggq6) |
| Utterance timestamps | `speech_start_ms / speech_end_ms` (v2.8; `llm.vendor='custom'` only) | none | 868kbyqfx · backend must persist webhook 103 |
| Mic→recording offset | `speech_algorithmic_delay` | none | same |
| Recording | SIP `recordFileUrl`; RTC → Cloud Recording | `CallRecordingPlayer` :1370 | download orphan (gap 6); RTC none (868kmggpy, 868kmgj0k) |
| Turn latency | `turns[].metrics.segmented_latency_ms` (6 names) | logged 3-segment `perTurn`; live 5-segment `LatencyTurn` | gap 8 — one model |
| Why a turn ended | `end.type` + `caused_by` + `reason` | none | backend (direction B) |
| How a turn started | `start.type` + metadata | none | backend |
| Speakers | `sal.sal_mode=recognition` | binary :743 | 868kyqzt1 Engine |
| Provider payloads | not in contract | none (rawDetail = 4 metadata fields) | 868kbyqga Engine + backend |
| Redaction | none | server key-allowlist on diagnostics :1826 | policy (open q 2) |
| Retention / opt-out | `parameters.opt_out` | not surfaced | backend |
| Deep link | — | local sheet state | gap 7 |
| Export | — | `/api/telephony/download-audio` unused | gap 6 |

**Not in the contract (mark "Requires Engine"):** per-word timestamps · speaker labels beyond user/assistant ·
provider request/response payloads · tool-call rows in history · web/RTC recording (Cloud Recording) ·
timestamps for managed LLM vendors (the `custom` gate).

## Competitor evidence (public docs, fetched 2026-09-10)

- **Retell** https://docs.retellai.com/api-references/get-call — `transcript_object` *"list of utterance, with
  timestamp"*; `transcript_with_tool_calls` *"weaved with tool call invocation and results"*;
  `scrubbed_transcript_with_tool_calls` / `scrubbed_recording_url` *"without PII"*; `recording_multi_channel_url`
  *"each party's audio in separate channel"*; `public_log_url`; `latency` (e2e/ASR/LLM/TTS/KB, p50–p99);
  `call_analysis`; `disconnection_reason`; `recording_url` *"Available after call ends."*
- **Vapi** https://docs.vapi.ai/assistants/call-recording — `call.artifact.recording` *"private, authenticated
  URLs"*; `recordingFormat: "wav;l16"`; transcript messages carry `"time"`; `recordingEnabled: false` per
  assistant. https://docs.vapi.ai/server-url/events — `end-of-call-report.artifact {recording, transcript,
  messages[]}`. (`api-reference/calls/get` exceeded the fetch size limit.)
- **ElevenLabs** https://elevenlabs.io/docs/api-reference/conversations/get — `transcript[].{role user|agent,
  message, time_in_call_secs (required), tool_calls, tool_results, conversation_turn_metrics}`; `has_audio ·
  has_user_audio · has_response_audio`; `metadata.{deletion_settings, termination_reason}`.
- **LiveKit** https://docs.livekit.io/agents/ops/recording/ — *"transcripts, traces, logs, and audio recordings
  in a unified timeline for each agent session"*; https://docs.livekit.io/home/egress/overview/ — *"recording an
  agent and a caller on separate channels"*. (Insights page 404'd.)

**Patterns to take:** (1) **one clock** — every vendor keys a transcript line to a second (`timestamp`,
`time`, `time_in_call_secs`); click-a-line-to-seek is the norm. (2) **Tool calls woven into the transcript**,
not a separate tab (Retell, ElevenLabs) — matches Wave 1's rejected "Raw" tab. (3) **Artifact flags are
explicit** (`has_audio`, `recordingEnabled`, "Available after call ends") — an absent artifact is a stated
state, never blank. (4) **Redaction is a sibling variant**, not a hole (`scrubbed_*`, `deletion_settings`).
(5) **Per-party channels** (Retell multi-channel, LiveKit separate channels) — speaker lanes come from the
recording, not from diarizing the transcript. (6) Per-turn latency ladder + termination reason — Agora's
`turns` endpoint is richer (why the turn ended), nobody shows it. **Whitespace:** nobody explains
interrupted/ignored turns in the transcript; nobody saves a real call as a test.

## What we need (user-visible)

1. Play the recording and the transcript follows; click a line to jump. When the call has no timestamps the
   sheet says so and the transcript stays a plain list — never a fake clock.
2. Every turn says how it ended (Interrupted · Ignored · Error) and where the time went — the same Engine
   numbers the live preview shows.
3. A call or session has a URL that pastes into a ticket and reopens the same detail.
4. Download the recording and the transcript from the sheet.
5. Missing things are stated: no recording · not retained · still running · requires Engine.
6. Non-telephony sessions get the same sheet grammar (transcript + audio slots), honest while empty.

## Tech requirements

- **Backend surfaces history timestamps + turns per session:** persist webhook `103 agent history` (with
  `speech_start_ms/end_ms/algorithmic_delay`) and `112 turns finished` (or poll `GET turns` inside its 7-day
  window) keyed by taskId; extend `TelephonyCallDetail.callInfo.transcript[]` with optional `startMs / endMs /
  algorithmicDelayMs` and add `turns[]` to `TelephonyDebuggingTaskDetail`. Note the `llm.max_history` cap and
  the `llm.vendor='custom'` gate — without an Engine change, managed-vendor calls will stay untimed.
- **One latency model:** map `segmented_latency_ms` names onto the logged model so Latency tab, live preview
  and transcript badges quote the same numbers (868khwg0c AC).
- **Redaction policy:** server-side before the client, one function, extended from the key allowlist to
  payloads + DTMF; the client renders the literal `[redacted]` as a badge, never re-redacts.
- **Deep link:** `?tab=call-history&call=<callId>` / `?tab=session-history&session=<taskId>` in
  `-telephony-route-search.ts`; the route opens the sheet from the URL.
- **Export:** recording through `/api/telephony/download-audio?url=` (allowlist already enforced);
  transcript `.txt` / `.json` built client-side from the sheet's data.
- **Web/RTC recording:** Cloud Recording individual mode per session (868kmgj0k) — out of Console scope
  until the Engine stores it.

## Open questions for the owner

1. **Call History vs Session History (tension #2).** One Sessions list with a channel column (Wave 1 did this)
   or two lists sharing one detail? Proposal default: one shared detail, lists untouched — the merge is a
   separate call.
2. **What "redacted" hides.** Key allowlist only (`authorization|cookie|jwt|password|secret|token`) or PII
   (phone numbers, names, "protected DTMF")? Who configures it — feature 24 (Retention, PII & compliance)?
3. **Retention.** For an `opt_out` session: a row that says "Not retained", or no row? Console history window
   vs the Engine's 7-day `turns` window — what does the sheet show on day 8?
4. **868kbyqga and 868kadwhy are `delivered`.** Delivered where? The Console shows no payloads; the session
   sheet has events + latency only. Reopen or re-scope?
5. **The `llm.vendor='custom'` gate.** Can Engine return `speech_*_ms` for managed vendors? If not, alignment
   is dead for most customers and the feature is "download + badges" until it does.
