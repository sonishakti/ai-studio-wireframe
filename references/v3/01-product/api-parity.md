# API ↔ UI field parity: Create an agent · Start a session · Go live

Owner's rule: *"we can't have anything in the UI that is not there in the API, and nothing in the API
that's not in the UI — especially for Create an agent and Start a session."* Dynamic context injection
(session actions `inject`/`speak`/`interrupt`) is intentionally API-only and excluded from the gap count.

**Spec**: `references/api/v3/openapi-2026-09-24-ih7axj9zx.json` (v3, 24 Sep evening), flattened field-by-field
with a one-off script (`AgentCreateInput`, `SessionCreate`, `EphemeralSessionCreate`, `NumberCreate`, the inline
`POST /campaigns` body, and everything they `$ref`).

**UI A — Live Console** (`ng-console`, branch `design/sandbox`, working tree verified clean at branch head):
`src/components/console/agent-builder/`, `src/components/console/agent-config-drawer.tsx`,
`src/components/console/agent-advanced-page.tsx`, `src/components/console/agent-tools-page.tsx`,
`src/components/console/agent-knowledge-page.tsx`, `src/components/console/agent-opening-section.tsx`,
`src/features/telephony/campaigns/{campaign-surfaces.tsx,campaign-editor-domain.ts}`,
`src/features/telephony/phone-numbers/*`, `src/lib/agents/*`.

**UI B — Concept A** (`ng-console/.worktrees/v3`, branch `design/v3`):
`src/prototypes/agent-builder-v3/{concepts/a-tabs.tsx,parts/*.tsx,data.ts,store.tsx}`.

All file paths below are relative to their repo root unless a full path is given. Line numbers are cited
against the files read for this audit; a handful of provider-specific sub-fields inside vendor param blocks
are summarized rather than cited line-by-line (noted where that happens).

## Counts

| | Count | Method |
|---|---|---|
| **Fields in spec, raw leaf paths** (script output before grouping into table rows) | **201** | `AgentCreateInput` 106 + `SessionCreate` 33 (covers `EphemeralSessionCreate`'s non-agent fields too) + `NumberCreate` 18 + `POST /campaigns` body 44 |
| **Fields audited below** (one row per field or per meaningfully distinct sub-field; oneOf variants that don't change UI shape are collapsed into their parent row) | **144** | Row count across §1–§3 |
| **Covered by Live Console** (a control exists — full or partial) | **96 / 144 (67%)** | Tallied by scanning the "Live Console UI" column of every row in §1–§3 for "missing" |
| **Covered by Concept A** | **46 / 144 (32%)** | Tallied the same way against the "Concept A" column |
| **UI-only items** (shown in a UI, no API field, either UI) | **25** | Row count in §4 "UI-only today" |

Verdict legend: **✅ both** = adequately covered in both UIs · **UI‑missing** = API field has no (or only a
token) control in the named UI(s) · **API‑missing** = the UI's control covers *more* than the spec models
(the API is missing something the UI already does) · **naming mismatch** = the field is covered but under a
different name, shape, or object level than the spec.

---

## 1. Create an agent

### 1.1 Core

| API field | type / enum / default | Live Console UI | Concept A | Verdict | Proposed UI home |
|---|---|---|---|---|---|
| `agent_name` | string, required | "Name" input, `src/components/console/agent-editor-workspace.tsx:839-855` | "Name" input, `concepts/a-tabs.tsx:130-136` | ✅ both | Create sheet |
| `instructions` | string | "System prompt" textarea, `agent-editor-workspace.tsx:859-898` (+`955-1014`); also `agent-config-drawer.tsx:420-429` (`BehaviorSection`, a second, older door onto the same field) | "System prompt" textarea, `parts/prompt.tsx:42-51` | ✅ both | Prompt |
| `messages[]` (history seed) | array\<Message\> | missing | missing | UI‑missing (both) | API-only — no product need identified |
| `structured_output.enable_structured_output` | boolean, required | missing **at Agent level**; implicit toggle exists only on Number/Campaign (see §3) | missing (implied by non-empty `analysis.successCriteria`/`fields`, no explicit boolean) | naming mismatch — wrong object level in Live Console, no explicit switch in either | Analysis (agent-level, per object-model.md) |
| `structured_output.call_success_evaluation.criteria` | string \| null | missing at Agent; Campaign only: `campaign-editor-domain.ts:67` (`callSuccessCriteria`) | "Success criteria" textarea, `parts/context.tsx:602-611` | naming mismatch (Live Console: wrong level) / ✅ (Concept A: right level, missing enum) | Analysis |
| `structured_output.custom_evaluations[]` (`variable_name`,`type`,`criteria`,`enums`) | array, `type` enum string/number/boolean/array | missing at Agent; Campaign only: `campaign-editor-domain.ts:68`, UI `campaign-surfaces.tsx:5277-5654` | "Output fields" add/edit rows (name/type/criteria only — no `enums`), `parts/context.tsx:612-695` | naming mismatch / partial (Concept A missing `enums`) | Analysis |
| `greeting.mode` (text/audio) | const per variant | missing — flat string only | missing — flat string only (text implied) | UI‑missing (both) | Prompt › Greeting sheet |
| `greeting.on` (each_join/first_join) | enum, default none | missing | "When to greet" select, `parts/prompt.tsx:154-169` | naming mismatch (Concept A has it, Live Console doesn't) | Prompt › Greeting sheet |
| `greeting.delay_ms` | int 0-5000, default 0 | missing | missing | UI‑missing (both) | Prompt › Greeting sheet |
| `greeting.text` | string | "Greeting" TextField, `agent-opening-section.tsx:244-261` (dup. `agent-editor-workspace.tsx:908-926`); backing field `llm.greeting_message`/`mllm.greeting_message`, `orchestration-properties.ts:68,290,457` | "Greeting" textarea, `parts/prompt.tsx:144-153` | ✅ both (flat string, not the structured object) | Prompt › Greeting sheet |
| `greeting.url` (audio mode) | string, uri | missing | missing | UI‑missing (both) | Prompt › Greeting sheet |
| `greeting.download_timeout_ms` | int, default 1000 | missing | missing | UI‑missing (both) | Prompt › Greeting sheet |
| `greeting.pcm_sample_rate` | int, default 16000 | missing | missing | UI‑missing (both) | Prompt › Greeting sheet |
| `variables` (template vars) | object, free-form | partial — `{{token}}` highlighting only, no name/default editor, `agent-editor-workspace.tsx:999-1006`, hint `prompt-knowledge-section.tsx:184-200` | partial — variables auto-detected from prompt text, read-only chips, `data.ts:259-265`, `parts/prompt.tsx:53-71` | naming mismatch / partial (both) | Prompt (detected chips + optional default-value editor) |
| `labels` (key-value tags) | object\<string\> | missing (repo-wide grep, zero matches) | missing | UI‑missing (both) | API-only (internal Studio metadata, e.g. deployment type — see object-model.md §4) |
| `pipeline.mode` (cascaded/realtime) | discriminator | "Cascade"/"Realtime" cards, `agent-models-page.tsx:878-940`, row `voice-models-section.tsx:142-152` | missing — Concept A's "tier" always writes cascaded (`data.ts:154`), no realtime path reachable | naming mismatch (Live Console) / UI‑missing (Concept A) | Voice & models |

### 1.2 Cascaded pipeline — avatar

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `avatar.enabled` | bool, default false | missing — `OrchestrationAvatarDraft` type exists (`orchestration-contracts.ts:78`, read/patch fns `orchestration-properties.ts:44-62,277-283,569-587`) but **no component renders it** | missing | UI‑missing (both) | Advanced › Voice (digital human) |
| `avatar.vendor` (akool/liveavatar/anam/generic) | enum | missing (same as above — data layer only) | missing | UI‑missing (both) | Advanced › Voice |
| `avatar.credential` / `avatar.params` | oneOf / object | missing (data layer only) | missing | UI‑missing (both) | Advanced › Voice |

### 1.3 Cascaded pipeline — turn_detection

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `turn_detection.speech_threshold` | number (0,1), default 0.5 | "Threshold" NumberField, `agent-config-drawer.tsx:773-783` (min .01/max .99) | missing | UI‑missing (Concept A) | Advanced › Turn-taking |
| `turn_detection.start_of_speech` mode (semantic/vad/manual) | discriminator | "Start mode" select **vad/manual only** — no `semantic` option, `agent-config-drawer.tsx:808-814` | missing | partial (Live Console) / UI‑missing (Concept A) | Advanced › Turn-taking |
| `start_of_speech[vad].interrupt_duration_ms` | int, default 160 | FOUND, `agent-config-drawer.tsx:821-830` | missing | partial / UI‑missing | Advanced › Turn-taking |
| `start_of_speech[vad].speaking_interrupt_duration_ms` | int, default 160 | FOUND, `agent-config-drawer.tsx:831-840` | missing | partial / UI‑missing | Advanced › Turn-taking |
| `start_of_speech[vad].prefix_padding_ms` | int, default 800 | FOUND, `agent-config-drawer.tsx:841-851` | missing | partial / UI‑missing | Advanced › Turn-taking |
| `turn_detection.end_of_speech` mode (semantic/vad/manual) | discriminator | "End mode" select, all 3 values, `agent-config-drawer.tsx:995-1001` | "End of turn" select **semantic/vad only** (no manual), `parts/model.tsx:401-420` | ✅ Live Console / partial Concept A | Advanced › Turn-taking |
| `end_of_speech[vad].silence_duration_ms` | int 120-2000, default 640 | FOUND, `agent-config-drawer.tsx:1007-1020` | missing | partial / UI‑missing | Advanced › Turn-taking |
| `end_of_speech[semantic].max_wait_ms` | int 500-10000, default 3000 | FOUND, `agent-config-drawer.tsx:1024-1033` | missing | partial / UI‑missing | Advanced › Turn-taking |
| `end_of_speech[semantic].silence_duration_ms` | int 120-2000, default 320 | FOUND, `agent-config-drawer.tsx:1034-1043` | missing | partial / UI‑missing | Advanced › Turn-taking |
| `end_of_speech[semantic].pause_state_enabled` | bool, default true | FOUND switch, `agent-config-drawer.tsx:1044-1053` | missing | partial / UI‑missing | Advanced › Turn-taking |
| `interruption.mode` (start_of_speech/keywords/off) | discriminator, default `{mode:start_of_speech}` | FOUND — enable switch + trigger select (Speech detected/Keywords), `agent-config-drawer.tsx:857-915` | "Interruptions" select start_of_speech/keywords/off, `parts/model.tsx:421-442` | ✅ both | Advanced › Turn-taking |
| `interruption[keywords].keywords[]` | array\<string\> | FOUND "Trigger keywords" TextField, `agent-config-drawer.tsx:917-933` | missing — "Only on keywords" option exists but no keyword list input | ✅ Live Console / partial Concept A | Advanced › Turn-taking |
| `interruption[off].when_off` (append/ignore) | enum, default append | FOUND select, `agent-config-drawer.tsx:937-969` | missing | partial / UI‑missing | Advanced › Turn-taking |

### 1.4 Cascaded pipeline — asr

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `asr.credential` | oneOf byok/managed | "Credential" resource select, `agent-config-drawer.tsx:1787-1818` (Studio-resource model, not literal `mode`+`api_key`) | "Use my key" BYOK toggle, `parts/model.tsx:480-504` (vendor fixed to "Deepgram") | naming mismatch (Live Console) / partial (Concept A) | Voice & models (managed default) / Advanced |
| `asr.url` | string, uri | missing | missing | UI‑missing (both) | Advanced › Speech recognition |
| `asr.vendor` | string | "Vendor" select, `agent-config-drawer.tsx:1771-1780` | hardcoded label "Deepgram", `parts/model.tsx:356` | ✅ Live Console / naming mismatch Concept A (not selectable) | Voice & models / Advanced |
| `asr.model` | string | "Model" field (vendor-conditional), `agent-config-drawer.tsx:1845-1860` | missing | partial / UI‑missing | Advanced › Speech recognition |
| `asr.language` | string | "Language" select/text, `agent-config-drawer.tsx:1819-1844` | missing | partial / UI‑missing | Advanced › Speech recognition |
| `asr.params` | object, free-form | "ASR Params JSON" catch-all, `agent-config-drawer.tsx:1873-1879` (+ Microsoft "Region" `1861-1872`) | missing | partial / UI‑missing | Advanced › Speech recognition |

### 1.5 Cascaded pipeline — tts

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `tts.credential` | oneOf byok/managed | resource select, `agent-config-drawer.tsx:2058-2089` | "Use my key" toggle, `parts/model.tsx:480-504` (vendor fixed "Cartesia") | naming mismatch / partial | Voice & models / Advanced |
| `tts.url` | string, uri | partial — vendor-scoped "Base URL" for Deepgram/Murf/Rime only, `agent-config-drawer.tsx:2314-2318,2334-2338,2366-2372` | missing | partial / UI‑missing | Advanced › Voice |
| `tts.headers` | object\<string\>, writeOnly | missing | missing | UI‑missing (both) | Advanced › Voice |
| `tts.vendor` | string | "Vendor" select, `agent-config-drawer.tsx:2032-2051` | hardcoded "Cartesia" label | ✅ Live Console / naming mismatch Concept A | Voice & models / Advanced |
| `tts.params` | object, free-form | extensive per-vendor fields (OpenAI, Microsoft, ElevenLabs, Deepgram, Google, Murf, Sarvam, xAI, Minimax, Tencent, Volcengine), `agent-config-drawer.tsx:2218-3060` (summarized, not line-by-line) + catch-all JSON `2497-2509` | "Voice" select bundles voice+language only, `parts/model.tsx:225-259` | ✅ Live Console (extensive) / partial Concept A | Voice & models (bundled) / Advanced (raw) |
| `tts.skip_patterns[]` | enum array (5 bracket types) | FOUND "Skip Patterns", `agent-config-drawer.tsx:2486-2496` | missing | partial / UI‑missing | Advanced › Voice |

### 1.6 Cascaded pipeline — llm

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `llm.credential` | oneOf byok/managed | resource select, `agent-config-drawer.tsx:1569-1600` | "Use my key" toggle, `parts/model.tsx:480-504` (vendor by tier) | naming mismatch / partial | Voice & models / Advanced |
| `llm.url` | string, uri | missing | missing | UI‑missing (both) | Advanced › Language model |
| `llm.vendor` | string | "Vendor" select, `agent-config-drawer.tsx:1549-1562` | tier-derived label only (not selectable) | ✅ Live Console / naming mismatch Concept A | Voice & models / Advanced |
| `llm.style` | string | missing as a real control — `responseStyle` is a silent pass-through, never rendered, `agent-config-drawer.tsx:3673-3675` | missing | UI‑missing (both) | Advanced › Language model |
| `llm.model` | string | "Model" field, `agent-config-drawer.tsx:1601-1612` | missing (tier bundles a fixed stack) | partial / UI‑missing | Voice & models / Advanced |
| `llm.params` | object, free-form | Temperature/Top P/Anthropic Max Tokens + catch-all JSON, `agent-config-drawer.tsx:1615-1694` | missing | partial / UI‑missing | Advanced › Language model |
| `llm.input_modalities[]` / `output_modalities[]` | array\<string\> | FOUND TextFields, `agent-config-drawer.tsx:1662-1681` | missing | partial / UI‑missing | Advanced › Language model |
| `llm.max_history` | int 1-1024, default 32 | FOUND, `agent-config-drawer.tsx:1651-1661` (dup. in Advanced sheet, hidden via `hideHistory`) | missing | partial / UI‑missing | LLM settings sheet |
| `llm.failure_message` | string | FOUND, two homes: `agent-config-drawer.tsx:436-440` and `agent-editor-workspace.tsx:929-950` | "Failure message" textarea, `parts/prompt.tsx:171-185` | ✅ both | Prompt › Greeting sheet |
| `llm.mcp_servers[]` — `name` | string, required | via attach-existing flow, `agent-tools-page.tsx:416-481`; edit sheet name/endpoint/transport/headers/timeout_ms, `agent-tools-page.tsx:849-893` | "Name" field, `parts/context.tsx:313-321` (modeled as a flat "Context" item, not `llm.mcp_servers`) | ✅ Live Console / naming mismatch Concept A (wrong nesting) | Context list |
| `llm.mcp_servers[].endpoint` | string, required | FOUND (edit sheet, see above) | "Endpoint" field, `parts/context.tsx:352-362` | ✅ both (structurally flattened in Concept A) | Context list |
| `llm.mcp_servers[].transport` | string, required | FOUND (edit sheet) | missing | ✅ Live Console / UI‑missing Concept A | Context list (advanced) |
| `llm.mcp_servers[].headers` | object, free-form | FOUND (edit sheet) | "Authorization header" only, `parts/context.tsx:363-372` | ✅ Live Console / partial Concept A | Context list (advanced) |
| `llm.mcp_servers[].allowed_tools[]` | array\<string\> | "Configure" → `AgentMcpToolsSheet`, `agent-tools-page.tsx:656-675` | "Tools the agent may call" checkboxes, `parts/context.tsx:373-397` | ✅ both | Context list |
| `llm.mcp_servers[].timeout_ms` | int | FOUND (edit sheet) | missing | ✅ Live Console / UI‑missing Concept A | Context list (advanced) |
| `llm.tools[]` (function tool) `name`/`description`/`parameters` | required | attach-existing only, `agent-tools-page.tsx:695-741` — **no create UI** for a new tool's schema | "Name"/"Description"/"Parameters (JSON)" fields exist, `parts/context.tsx:313-321,416-424,446-451` | UI‑missing (Live Console: no authoring) / partial Concept A | Context list |
| `llm.tools[].execution.mode` | required | missing | missing | UI‑missing (both) | Context list (advanced) |
| `llm.tools[].server.method` (GET/POST) | required | missing | "Method" select GET/POST, `parts/context.tsx:428-436` | UI‑missing (Live Console) / ✅ Concept A | Context list |
| `llm.tools[].server.url` | required | missing | "URL" field, `parts/context.tsx:437-442` | UI‑missing (Live Console) / ✅ Concept A | Context list |
| `llm.tools[].server.headers/body/timeout_ms` | optional, timeout default 10000 | missing | "Authorization header" only (`context.tsx:453-462`); body/timeout missing | UI‑missing (Live Console) / partial Concept A | Context list (advanced) |
| `llm.headers` | object\<string\>, writeOnly | FOUND, Anthropic-vendor-only, `agent-config-drawer.tsx:1625-1630` | missing | partial / UI‑missing | Advanced › Language model |
| `silence_config.enabled` | bool, required | FOUND (inferred `timeoutMs>0`), "Silent reminder" switch, `agent-config-drawer.tsx:1203-1222` | "Silence reminder" switch, `parts/model.tsx:443-454` | ✅ both | Advanced › Silence |
| `silence_config.timeout_ms` | int, required | FOUND, `agent-config-drawer.tsx:1225-1239` | missing (boolean only) | ✅ Live Console / UI‑missing Concept A | Advanced › Silence |
| `silence_config.action` (speak/think) | enum, required | FOUND select, `agent-config-drawer.tsx:1240-1246` | missing | ✅ Live Console / UI‑missing Concept A | Advanced › Silence |
| `silence_config.content` | string, required | FOUND, `agent-config-drawer.tsx:1250-1256` | missing | ✅ Live Console / UI‑missing Concept A | Advanced › Silence |

### 1.7 Realtime pipeline

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `avatar.*` (realtime) | same as §1.2 | missing (same code path as cascaded) | missing | UI‑missing (both) | Advanced › Voice |
| `turn_detection` (agora_vad: `interrupt_duration_ms`,`prefix_padding_ms`,`silence_duration_ms`,`threshold`) | no spec defaults | FOUND — exact discriminator match `agora_vad`, `agent-advanced-page.tsx:463-501` | missing | ✅ Live Console / UI‑missing Concept A | Advanced › Turn-taking |
| `turn_detection` (server_vad: + `idle_timeout_ms`, start/end sensitivity) | — | partial — everything found **except `idle_timeout_ms`** (zero occurrences repo-wide); sensitivity selects (gemini/vertexai only) `agent-advanced-page.tsx:502-529` | missing | partial Live Console / UI‑missing Concept A | Advanced › Turn-taking |
| `turn_detection` (semantic_vad: `eagerness`) | enum auto/low/medium/high | FOUND, `agent-advanced-page.tsx:444-449` | missing | ✅ Live Console / UI‑missing Concept A | Advanced › Turn-taking |
| `mllm.credential` | oneOf | "Credentials" select, `agent-models-page.tsx:448-496` | missing (no realtime path) | ✅ Live Console / UI‑missing Concept A | Voice & models |
| `mllm.vendor` | string, required | "Vendor" select, `agent-models-page.tsx:440-447` | missing | ✅ Live Console / UI‑missing Concept A | Voice & models |
| `mllm.model` | string | partial — selectable for gemini/vertexai only, `agent-models-page.tsx:551-558`; fixed default for openai/xai | missing | partial / UI‑missing | Advanced |
| `mllm.url` | string, uri | missing | missing | UI‑missing (both) | Advanced |
| `mllm.params` | object | FOUND (voice, transcription language/model, affective_dialog, proactive_audio, etc.), `agent-models-page.tsx:497-675` | missing | ✅ Live Console / UI‑missing Concept A | Voice & models / Advanced |
| `mllm.input_modalities[]`/`output_modalities[]` | enum text/audio | partial — set via hardcoded vendor-default presets, not editable, `agent-models-page.tsx:90-174` | missing | partial / UI‑missing | Advanced |
| `mllm.mcp_servers[]` | array | partial — generic MCP-attach UI exists but isn't mode-scoped to realtime, `agent-tools-page.tsx` | missing | partial / UI‑missing | Context list |
| `mllm.headers` | object, writeOnly | missing | missing | UI‑missing (both) | Advanced |

### 1.8 filler_words

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `filler_words.enable` | bool | FOUND switch, `agent-config-drawer.tsx:1095-1101` | FOUND switch, `parts/model.tsx:455-466` | ✅ both | Advanced › Fallback |
| `trigger.mode` (fixed_time, only option in spec) | const | hardcoded to `fixed_time`, `agent-config-drawer.tsx:664-674` (not a real choice, matches spec's single option) | missing (no trigger config at all) | ✅ Live Console / UI‑missing Concept A | Advanced › Fallback |
| `trigger.response_wait_ms` | int 100-10000, default 1500 | FOUND "Filler Duration", `agent-config-drawer.tsx:1111-1121` | missing | ✅ Live Console / UI‑missing Concept A | Advanced › Fallback |
| `content[static].phrases[]` | array, 1-100 | FOUND "Filler Content", `agent-config-drawer.tsx:1105-1110` | missing | ✅ Live Console / UI‑missing Concept A | Advanced › Fallback |
| `content[static].selection_rule` (shuffle/round_robin) | enum, default shuffle | FOUND "Filler Mode" select, `agent-config-drawer.tsx:1122-1152` | missing | ✅ Live Console / UI‑missing Concept A | Advanced › Fallback |
| `content[generated].instructions` / `.fallback_strategy` | string / const "static" | missing (only `static` mode reachable) | missing | UI‑missing (both) | Advanced › Fallback |

---

## 2. Start a session (`SessionCreate` / `EphemeralSessionCreate`)

**No dedicated "start a session" form exists in either UI.** Both UIs only reach a session indirectly
(Live Console: Campaign launch, Number inbound binding, or the read-only REST snippet in
`agent-code-panel.tsx`; Concept A: `TestPanel`, `parts/list-and-create.tsx:333-343`, and a static SDK code
sample, `parts/deploy.tsx:991-1013`). Session actions `inject`/`speak`/`interrupt` are correctly absent from
both — confirmed by repo-wide grep in both trees.

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `client_reference` | string | missing (zero occurrences) | missing | UI‑missing (both) | API-only (SDK caller sets this) |
| `agent_id` | string, required | implicit only, via Campaign's "AI agent" select, `campaign-surfaces.tsx:3919-4001` | implicit only, current agent's id in test call / code sample | naming mismatch (both — never a literal field) | N/A, correctly implicit |
| `variables` (session overrides) | object, free-form | missing (only per-contact CSV columns at Campaign level, `campaign-surfaces.tsx:4930-4934`) | missing | UI‑missing (both) | API-only / SDK caller sets this |
| `transport[rtc].type/channel/token/uid/subscribe_uids` | required | missing (zero occurrences) | missing — shown only as a static code sample, `parts/deploy.tsx:991-1002` | UI‑missing (both) | API-only, correctly SDK-side |
| `transport[rtc].encryption.mode/key/salt` | required mode/key | missing | missing | UI‑missing (both) | API-only |
| `transport[rtc].audio_scenario` | enum, default aiserver | missing | missing | UI‑missing (both) | API-only |
| `transport[telephony].type/from/to` | required | missing as a session-level field; only reachable as Campaign `transport.from` (see §3) | missing as a session-level field; only via `SdkCode` sample, `parts/deploy.tsx:1003-1013` | naming mismatch (both — folded into Campaign, not exposed as Session) | N/A |
| `transport[telephony].call_policy.*` | — | only at Campaign/Number level (see §3) | only at Campaign ("Run") level (see §3) | naming mismatch (both) | Go live (correct home per object-model.md) |
| `lifecycle.idle_timeout_ms` | int, default 30000 | missing (zero occurrences) | missing | UI‑missing (both) | Go live › Session defaults (new home needed) |
| `lifecycle.max_duration_ms` | int, default 259200000 | missing | missing | UI‑missing (both) | Go live › Session defaults |
| `lifecycle.graceful_stop.enabled/timeout_ms` | default false / 30000 | missing | missing | UI‑missing (both) | Go live › Session defaults |
| `data_policy.retention` (30_days/none) | enum, default 30_days | naming mismatch — closest analog is agent-level `parameters.opt_out` boolean switch, `DataRetentionOptOutSwitch`, `agent-advanced-page.tsx:255-273`, wired `go-live-section.tsx:237-248`; not the same field (agent-level bool vs. session/deployment-level retention-period enum) | missing | naming mismatch (Live Console) / UI‑missing (Concept A) | Go live (per requirements-register row 32/46 — known API gap on Number/Campaign too) |
| Session actions `inject`/`speak`/`interrupt` | — | **correctly absent** ✓ | **correctly absent** ✓ | ✅ (intentional) | API-only by design |

---

## 3. Go-live-owned fields

### 3.1 Number (`NumberCreate` / `InboundInput` / `InboundCallPolicy`)

Live Console: `src/features/telephony/phone-numbers/*`. Concept A: `ConnectNumberSheet`,
`parts/deploy.tsx:799-982`.

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `number` | string | "Phone Number" (read-only on edit), `phone-number-details-section.tsx:99-104` | "Phone number"/"Number" select or input, `parts/deploy.tsx:891-940` | ✅ both | Connect a number |
| `description` | string | "Display name", `phone-number-details-section.tsx:130-141` | missing | ✅ Live Console / UI‑missing Concept A | Connect a number |
| `sip_trunk.name` | string | missing (no distinct trunk-name field) | missing | UI‑missing (both) | Connect a number (advanced) |
| `sip_trunk.hostname` | string, required | "SIP Trunk Address", `phone-number-details-section.tsx:143-164` | "SIP host", `parts/deploy.tsx:941-949` | ✅ both | Connect a number |
| `sip_trunk.port` | int 1-65535 | missing | missing | UI‑missing (both) | Connect a number (advanced) |
| `sip_trunk.transport` (udp/tcp/tls) | enum, default tls | "Transport Protocol" radio TCP/UDP/TLS, `phone-number-details-section.tsx:165-190` | "Transport" select TLS/TCP/UDP, `parts/deploy.tsx:950-962` | ✅ both | Connect a number |
| `sip_trunk.auth.username` | string, writeOnly, required | "Username", `phone-number-details-section.tsx:193-204` | "Username" input, `parts/deploy.tsx:963-969` (not wired to state — cosmetic only) | ✅ Live Console / partial Concept A | Connect a number |
| `sip_trunk.auth.password` | string, writeOnly, required | "Password", `phone-number-details-section.tsx:205-216` | `SecretKeyField`, `parts/deploy.tsx:970-976` | ✅ both | Connect a number |
| `sip_trunk.allowed_ips[]` | array\<string\> | missing | missing | UI‑missing (both) | Connect a number (advanced) |
| `inbound.agent` | string \| null, required | "Inbound Agent" select, `phone-number-inbound-settings-section.tsx:89-165` | "Connect" action assigns current agent; ownership-conflict warning, `parts/deploy.tsx:836-848,923-928` | ✅ both | Deployment › Inbound |
| `inbound.call_policy.max_call_duration_seconds` | int | "Max call seconds", `phone-number-call-behavior-section.tsx:50-68` | missing | ✅ Live Console / UI‑missing Concept A | Deployment › Inbound (advanced) |
| `inbound.call_policy.max_silence_duration_ms` | int | "Silence timeout" seconds + "End call on silence" switch (unit mismatch: seconds shown, spec is ms), `phone-number-call-behavior-section.tsx:69-105` | missing | naming mismatch (unit) Live Console / UI‑missing Concept A | Deployment › Inbound (advanced) |
| `inbound.call_policy.end_call.on_conversation_complete` | bool, default false | "End call on conversation end" switch, `phone-number-call-behavior-section.tsx:88-97` | missing | ✅ Live Console / UI‑missing Concept A | Deployment › Inbound (advanced) |
| `inbound.call_policy.end_call.on_user_request` | bool, default false | missing (only 2 of 4 end_call flags found on Number) | missing | UI‑missing (both) | Deployment › Inbound (advanced) |
| `inbound.call_policy.end_call.on_fax` | bool, default false | missing on Number (present on Campaign, §3.2) | missing | UI‑missing (both) | Deployment › Inbound (advanced) |
| `inbound.call_policy.end_call.on_ai_assistant` | bool, default false | missing | missing | UI‑missing (both) | Deployment › Inbound (advanced) |
| `inbound.call_policy.transfer.phone_number` | string, required | "Transfer destination", `phone-number-transfer-section.tsx:50-68` | missing | ✅ Live Console / UI‑missing Concept A | Deployment › Inbound |
| `inbound.call_policy.transfer.description` | string, required | "Transfer criteria" textarea, `phone-number-transfer-section.tsx:85-106` | missing | ✅ Live Console / UI‑missing Concept A | Deployment › Inbound |

### 3.2 Campaign (`POST /campaigns` body)

Live Console: `src/features/telephony/campaigns/campaign-surfaces.tsx` (citations below),
`campaign-editor-domain.ts` (type shape). Concept A: `NewRunSheet`, `parts/deploy.tsx:428-734`.

| API field | type / default | Live Console | Concept A | Verdict | Home |
|---|---|---|---|---|---|
| `name` | string, required | "Campaign name", `campaign-surfaces.tsx:3905-3918` | "Name", `parts/deploy.tsx:523-530` | ✅ both | New run |
| `agent_id` | string, required | "AI agent" select, `campaign-surfaces.tsx:3919-4001` | implicit — run created against open agent | naming mismatch (Concept A: implicit) | New run |
| `transport.type` (telephony only) | const, required | missing (no selector — only telephony exists) | implicit | ✅ (matches spec's "telephony only at launch") | N/A |
| `transport.from[]` | array\<string\>, required | partial — single-value "Phone number" select, `campaign-surfaces.tsx:4002-4079`, not an array | FOUND — "Call from" checkboxes (multi-select), `parts/deploy.tsx:600-631` | naming mismatch (Live Console: single value) / ✅ Concept A | New run |
| `call_policy.max_ring_duration_ms` | int | "Ring seconds" (unit mismatch: seconds, spec ms), `campaign-surfaces.tsx:4279-4313` | missing | naming mismatch Live Console / UI‑missing Concept A | New run (advanced) |
| `call_policy.max_call_duration_seconds` | int | "Max call seconds", `campaign-surfaces.tsx:4241-4278` | missing | ✅ Live Console / UI‑missing Concept A | New run (advanced) |
| `call_policy.voicemail` (continue/hangup) | discriminator | partial — single on/off "Voicemail detection" switch only, no continue-vs-hangup sub-choice, `campaign-surfaces.tsx:4372-4377` | FOUND "On voicemail" select (Hang up/Leave a message), `parts/deploy.tsx:716-727` | partial Live Console / ✅ Concept A | New run |
| `call_policy.max_silence_duration_ms` | int | "Silence seconds" (unit mismatch), `campaign-surfaces.tsx:4314-4352` | missing | naming mismatch / UI‑missing | New run (advanced) |
| `call_policy.end_call.on_conversation_complete` | bool | "End-of-conversation hangup" switch, `campaign-surfaces.tsx:4378-4385` | missing | ✅ Live Console / UI‑missing Concept A | New run (advanced) |
| `call_policy.end_call.on_user_request` | bool | missing | missing | UI‑missing (both) | New run (advanced) |
| `call_policy.end_call.on_fax` | bool | "Fax detection hangup" switch, `campaign-surfaces.tsx:4392-4397` | missing | ✅ Live Console / UI‑missing Concept A | New run (advanced) |
| `call_policy.end_call.on_ai_assistant` | bool | missing | missing | UI‑missing (both) | New run (advanced) |
| `call_policy.transfer.phone_number` | string, required | "Transfer destination", `campaign-surfaces.tsx:4443-4462` | missing | ✅ Live Console / UI‑missing Concept A | New run (advanced) |
| `call_policy.transfer.description` | string, required | "Transfer criteria" textarea, `campaign-surfaces.tsx:4464-4497` | missing | ✅ Live Console / UI‑missing Concept A | New run (advanced) |
| `contacts[].phone` | string, required | CSV upload, first column = phone, `campaign-surfaces.tsx:4947-4970` | CSV upload dropzone, `parts/deploy.tsx:587-596` | ✅ both | New run |
| `contacts[].variables` | object, free-form | extra CSV columns, helper text, `campaign-surfaces.tsx:4930-4934` | read-only "Prompt variable → List column" mapping table, `parts/deploy.tsx:556-577` | ✅ both (CSV-driven, no manual entry either) | New run |
| `lifecycle.idle_timeout_ms/max_duration_ms/graceful_stop` | — | missing | missing | UI‑missing (both) | New run (advanced) / API gap per object-model.md §4 |
| `pacing.max_concurrent` | int, default 10 | "Concurrency limit", `campaign-surfaces.tsx:4198-4234` | "Calls at once", `parts/deploy.tsx:693-703`, default 10 | ✅ both | New run |
| `pacing.max_calls_per_second` | int | naming mismatch — UI exposes "Call delay ms" (interval, inverse of rate), `campaign-surfaces.tsx:4161-4197`, `CAMPAIGN_CALL_DELAY_MAX_MS=10000` (line 175) | missing | naming mismatch Live Console / UI‑missing Concept A | New run (rename to match spec's rate framing — object-model.md calls this "the only dial-rate control") |
| `pacing.max_attempts` | int, default 3 | missing | "Attempts per contact", `parts/deploy.tsx:704-715`, default 3 | UI‑missing (Live Console) / ✅ Concept A | New run |
| `pacing.retry_backoff_ms` | int, default 600000 | missing | missing | UI‑missing (both) | New run (advanced) |
| `schedule[immediate].mode` | const | "Launch immediately" switch, `campaign-surfaces.tsx:4086-4098` | "Start now" radio, `parts/deploy.tsx:633-653` | ✅ both | New run |
| `schedule.timezone` | string | "Timezone" select, `campaign-surfaces.tsx:4100-4131` | "Time zone" select, `parts/deploy.tsx:666-675` | ✅ both | New run |
| `schedule[scheduled].start` | string, required | "Scheduled start time", `campaign-surfaces.tsx:4134-4154` | "Start" datetime-local, `parts/deploy.tsx:656-665` | ✅ both | New run |
| `schedule[scheduled].end` | string, required | missing (no end-of-schedule control found) | "End" datetime-local, `parts/deploy.tsx:656-665` | UI‑missing (Live Console) / ✅ Concept A | New run |
| `schedule.days[]` (weekday + ranges[start,end]) | array | FOUND, scheduled mode only — `CampaignCallWindowEditor`, `campaign-surfaces.tsx:5080-5275`; weekday multi-select `5128-5166`, per-window ranges `5184-5231` | missing — single start/end window only, no weekday recurrence, `parts/deploy.tsx:646-675` | ✅ Live Console / UI‑missing Concept A | New run |
| `client_reference` (via inherited Session shape) | — | missing | missing | UI‑missing (both) | API-only |

---

## 4. UI-only today (shown in a UI, no API field)

| UI element | Where | Notes |
|---|---|---|
| Deployment type selector (Batch/Inbound/Code·SDK), chosen once at creation | Concept A: `TypeRadioCards`, `parts/list-and-create.tsx:185-243` | Proposed home: `Agent.labels.studio_deployment` (object-model.md §4, requirements row 3) |
| Model "tier" bundle (Fastest/Balanced/Most capable) | Concept A: `TierCards`, `parts/model.tsx:35-69` | Presets that *write* a full `pipeline`, not an API field itself |
| Voice select bundling TTS vendor+voice+language | Concept A: `VoiceSelect`, `parts/model.tsx:225-259` | Same — a UI convenience over `tts.vendor`/`params` |
| Knowledge base | Both — Live Console `agent-knowledge-page.tsx` (653 lines, writes legacy `properties.knowledge.kbId`); Concept A `CONTEXT_KINDS.knowledge`, `data.ts:213-233` | Confirmed absent from the v3 spec entirely (no RAG/file-search schema) |
| Selective Attention Locking (SAL) | Live Console: `agent-config-drawer.tsx:1059-1089` | Not in v3 `Pipeline`/`CascadedPipeline` schema |
| Voice formatting (digit cutoff, custom text replacements) | Live Console: `agent-config-drawer.tsx:1157-1201,2555-2817` | Distinct from `tts.skip_patterns` (bracket-only in spec); no digit/number-formatting field in v3 |
| "Store transcripts" / "Store call recording" toggles | Live Console: `campaign-surfaces.tsx:4354-4371`; also Number `enableTranscript`/`enableRecording`, `phone-number-call-behavior-section.tsx:23-38` | No `recording`/`transcript` field anywhere in v3 |
| `enableLlmCallEvaluation` switch | Live Console: `campaign-editor-domain.ts:37,94` | Wraps `structured_output.enable_structured_output`, but at the wrong (Campaign) level |
| SIP transfer headers (constant/dynamic, `{{column}}` refs) | Live Console: `campaign-surfaces.tsx:2580-2779,4498-4504` | `TransferPolicy` in spec is `{phone_number, description}` only — no headers |
| Transfer type (number vs SIP) | Live Console: `campaign-surfaces.tsx:4413-4442` | Not modeled in `TransferPolicy` |
| "Quick presets" for turn detection (Responsive/Balanced/Patient) | Live Console: `agent-config-drawer.tsx:742-772` | Convenience buttons that write real fields — not an extra field itself, listed for completeness |
| Provider fallback row | Live Console: `agent-models-page.tsx:421-427` | No fallback-provider concept in v3 `Asr`/`Llm`/`Tts` |
| Connectors attach/detach | Live Console: `agent-tools-page.tsx:762-847` | Unclear whether this maps under `tools`/`mcp_servers` — flagged, not counted as a clean UI-only |
| "Who speaks first" toggle, "Hear opening" preview | Live Console: `agent-opening-section.tsx:217-240,418-438` | Preview/UX convenience |
| AI-disclosure sentence (composed into `greeting_message`) | Live Console: `greeting-composition.ts:17-57`, `agent-opening-section.tsx:281-367` | Product feature with no dedicated spec field (folded into `greeting.text`) |
| Three filler follow-ups (`continueAfterFiller`, `duringToolCalls`, `matchPersona`) | Live Console: `opening-draft.ts:9-49` | **Browser sessionStorage only, never written to `properties`** — pending backend work per the file's own comment |
| App ID display + copy | Both — Live Console `agent-advanced-page.tsx:87-156`; Concept A project chrome | Account/project chrome, not agent config |
| Test panel (mic capture, live test call) | Both — Concept A `TestPanel`, `parts/list-and-create.tsx:249-347`; Live Console preview surfaces | Runtime tooling, not a create-time field |
| Performance/Analytics tab (KPIs, charts, latency breakdown) | Concept A: `parts/performance.tsx` | Deferred analytics per requirements register rows 15-30 |
| Agents-list monitoring columns (sessions/success/response sparkline) | Concept A: `parts/list-and-create.tsx:85-172` | Same — deferred analytics |
| Run operational actions (Pause/Resume/Cancel/Run again) | Concept A: `parts/deploy.tsx:176-229,317-345` | Maps to the `:pause`/`:resume`/`:cancel` **operations** on Campaign, not a create-time field — listed for completeness, arguably not a true gap |
| "Download template" CSV button | Both | Tooling convenience |
| Sessions table (per-run/per-agent), "Open in session history" | Concept A: `parts/deploy.tsx:353-420` | Observability surface, not create-time config |
| `enforceTransferE164` checkbox | Live Console: `phone-number-transfer-section.tsx:69-83` | Client-side validation convenience over `transfer.phone_number` |
| Custom-voice / Voice Library dialog, "Custom" model-ID checkboxes | Live Console: `agent-config-drawer.tsx:2140-2195,2819-2899` | UI convenience for entering `params`/`model` freeform |

## 5. API-only by design

| Field | Why it's intentionally API-only |
|---|---|
| Session actions `inject` / `speak` / `interrupt` | Explicit product decision — dynamic context injection is a runtime/SDK capability, not a builder-time or console-editable field. Confirmed absent from both UIs. |
| `client_reference` | Set by the calling application per session, not authored in the Console. |
| `transport[rtc].*` (channel/uid/subscribe_uids/token/encryption/audio_scenario) | RTC session parameters are supplied by the joining client app at call time. |
| `messages[]` (seeded conversation history) | No product surface currently seeds a conversation transcript at creation time. |
| `variables` at session-start (`SessionCreate.variables`) | Supplied by the calling app/campaign contact row, not typed into the Console at agent-creation time. |

---

## 6. Advanced panel contents — every pipeline field that belongs in one Advanced/Custom panel

This is the field list Concept A's 4-switch `AdvancedSheet` (`parts/model.tsx:372-509`) lost, and that the
Live Console's `AdvancedSharedSection` (`agent-config-drawer.tsx:489-1294`) + `MllmTurnDetectionSection`
(`agent-advanced-page.tsx:330-537`) already implement almost field-for-field. Defaults are from the spec.

**Speech recognition** (`Asr`, cascaded only)
- `vendor` (string) · `model` (string) · `language` (string)
- `credential.mode` (byok/managed) + `credential.api_key` (byok)
- `url` (custom ASR endpoint, no default)
- `params` (free-form, vendor-specific)

**Language model** (`Llm` cascaded / `Mllm` realtime)
- `vendor` · `model` · `style` (Llm only, no enum — free text)
- `credential.mode`/`api_key` · `url` · `params`
- `input_modalities[]` / `output_modalities[]` (no default in spec; Console defaults both to `["text"]`)
- `max_history` (int, 1–1024, **default 32**)
- `failure_message` (string, no default — "no fallback message implied when omitted")
- `headers` (object, write-only)
- *(Mllm has no `tools`/`failure_message`/`style`/`headers`/`max_history` — those are Llm-only per spec)*

**Voice** (`Tts` cascaded, `Avatar` shared cascaded+realtime)
- Tts: `vendor` · `credential.mode`/`api_key` · `url` · `headers` (write-only) · `params`
- `skip_patterns[]` (enum, any of `fullwidth_parentheses`/`lenticular_brackets`/`parentheses`/`square_brackets`/`curly_braces`, no default)
- Avatar: `enabled` (**default false**) · `vendor` (akool/liveavatar/anam/generic) · `credential` · `params`

**Turn-taking**
- Cascaded `TurnDetection`: `speech_threshold` (number, exclusive 0–1, **default 0.5**)
  - `start_of_speech` (`TurnStart`): `semantic` (**default type**, `speaking_interrupt_duration_ms` default 160) / `vad` (`interrupt_duration_ms` default 160, `speaking_interrupt_duration_ms` default 160, `prefix_padding_ms` default 800) / `manual`
  - `end_of_speech` (`TurnEnd`): `semantic` (**default type**, `silence_duration_ms` 120–2000 default 320, `max_wait_ms` 500–10000 default 3000, `pause_state_enabled` default true) / `vad` (`silence_duration_ms` 120–2000 default 640) / `manual`
  - `interruption` (**default `{mode: start_of_speech}`**): `start_of_speech` / `keywords` (`keywords[]`, 1–128 items) / `off` (`when_off` append/ignore, default append)
- Realtime `RealtimeTurnDetection`: `agora_vad` (`interrupt_duration_ms`, `prefix_padding_ms`, `silence_duration_ms`, `threshold` — no spec defaults) / `server_vad` (+ `idle_timeout_ms`, `start_of_speech_sensitivity`/`end_of_speech_sensitivity` enum HIGH/LOW) / `semantic_vad` (`eagerness` enum auto/low/medium/high)

**Silence** (`SilenceConfig`, cascaded only — all 4 fields required together)
- `enabled` (bool) · `timeout_ms` (int) · `action` (enum speak/think) · `content` (string)

**Tools & MCP** (`llm.mcp_servers[]` cascaded, `mllm.mcp_servers[]` realtime; `llm.tools[]` cascaded only — Mllm has no function-tools field)
- MCP server: `name` · `endpoint` · `transport` · `headers` · `allowed_tools[]` · `timeout_ms`
- Function tool (`FunctionTool`, cascaded only, max 32): `type` · `name` · `description` · `parameters` (JSON Schema) · `execution.mode` · `server.method` (GET/POST) · `server.url` · `server.headers` · `server.body` · `server.timeout_ms` (**default 10000**)

**Fallback**
- `llm.failure_message` — spoken via TTS when the LLM fails; no default implied when omitted
- `filler_words` (adjacent latency-masking behavior, grouped here for lack of a better home): `enable` · `trigger.mode` (const `fixed_time`) + `response_wait_ms` (100–10000, **default 1500**) · `content.static` (`phrases[]` 1–100, `selection_rule` shuffle/round_robin default shuffle) or `content.generated` (`instructions`, `fallback_strategy` const `static`)

---

## Notable cross-cutting findings

- **The Live Console's cascaded turn-taking/silence/filler-words implementation is a near 1:1 match to the
  v3 spec** — including exact default values (0.5 threshold, 160/800ms VAD defaults, 320/640/3000ms end-of-speech
  defaults, 1500ms filler wait) and the exact realtime discriminator constants (`agora_vad`/`server_vad`/`semantic_vad`).
  This is the strongest parity surface in either UI and should be the reference implementation for the Advanced panel.
- **The Live Console still writes legacy/v2-shaped property names** in places (`llm.system_messages`,
  `greeting_message`, `response_style`, `captions_enabled`, `endpointing` — `agent-builder-projection.ts:5-25,76-171`)
  rather than v3's `instructions`/`messages[]`/`greeting.text`/`style`. This is a naming-mismatch risk even where a
  UI control exists.
- **`structured_output` (Analysis) is modeled at the wrong object level in the Live Console** — it lives on
  Number.inbound and Campaign, never on the Agent, so an agent used across multiple numbers/campaigns can't share one
  analysis definition (confirmed zero occurrences of `structured_output`/`custom_evaluations` in any agent-builder file).
- **Concept A has almost no pipeline-mode, avatar, or realtime-pipeline surface at all** (confirmed via full-directory
  grep for `cascaded|realtime|avatar|mllm|vad`) — its 4-switch `AdvancedSheet` is the gap requirements-register row 38
  flags ("restore every advanced setting lost in A").
- **`avatar` is modeled in the Live Console's data layer** (`orchestration-contracts.ts:78`,
  `orchestration-properties.ts:44-62,277-283,569-587`) **but no component renders it** — a silent, ready-to-wire gap
  rather than a missing data model.
- Several Campaign/Number fields carry **unit mismatches** (seconds in the UI vs. milliseconds in the spec) for
  `max_ring_duration_ms`, `max_silence_duration_ms` — worth a single pass to confirm conversion is correct at the API
  boundary, not just cosmetic.
