# Conversational AI API v3: field map for design

Source of truth: https://agora-docs-nine.vercel.app/docs/api-reference (JSON at
`/openapi.json`, button "Download OpenAPI"). Snapshot here:
`openapi-3.0.0-2026-09-24.json` (sha256 `24e5dd5d…ec0aef20`, byte-identical to the
live file on 2026-09-24). Re-download and diff before relying on a field.

Base URL: `https://preview.ai.agora.io/conversational-ai/v3/projects/{appid}/`.
Lists return `{ data, has_more, next_cursor }` (Session list keeps the V2
`count/list` shape inside `data`). Errors are RFC 7807 `Problem` objects
(`code`, `request_id`, `errors[]`, `provider`, `pipeline_type`…).

## Resources available at the October launch

| Resource | ID | Operations |
|---|---|---|
| Secret set | `name` | create, list, retrieve, replace (PUT, atomic rotation), delete (only when unreferenced, 204) |
| Agent | `agent_…` | create, list, retrieve, update (PATCH), delete |
| Session | `agent_session_id` | start, list, retrieve, update (PATCH), stop, actions `speak` · `inject` · `interrupt` |
| Number | `num_…` | create, list, retrieve, update, delete |
| Campaign | `camp_…` | create, list, retrieve, update, delete, `:pause`, `:resume`, `:cancel` |

The docs tag Campaigns as "Outbound batches" and group Numbers + Campaigns under
Telephony.

## Deferred beyond the October launch (docs only, not in the JSON)

Session data: `events` (SSE), `transcript`, `turns` (per-turn latency segments
`asr_ttlw_ms`, `llm_ttft_ms`, `tts_ttfb_ms`), `summary` (duration, billable
usage, e2e p50/p95 latency, counts, recording, structured `output`). Also
`recording:*`, `webhooks/`, `events/`, `campaigns/{id}/contacts`,
`storage_destinations/`, `recordings/`, `transcripts/`, `artifacts:purge`,
`deletion_receipts/`.

## Agent (`AgentInput`)

- `agent_name` (required) · `instructions` (the system prompt) · `messages[]`
  (role system|user|assistant, seeded history) · `labels` (string map)
- `greeting`: `mode` text | audio; `on` each_join | first_join; `delay_ms`;
  `text` (audio mode also needs `url`, `text` is its fallback)
- `variables`: flat map of string | number | boolean template values
- `structured_output`: `enable_structured_output`, `call_success_evaluation.criteria`,
  `custom_evaluations[]` (`variable_name`, `type` string|number|boolean|array,
  `criteria`, `enums`)
- `filler_words`: `enable`, `trigger`, `content`
- `pipeline`, discriminated by `mode`:
  - `cascaded`: `asr` · `llm` · `tts` · `turn_detection` · `silence_config` · `avatar`
  - `realtime`: `mllm` · `turn_detection` (realtime variants: agora_vad, server_vad, semantic_vad) · `avatar`
- Every model module (`asr`, `llm`, `tts`, `mllm`, `avatar`) has `vendor`,
  `model`, `url`, `params` and `credential`:
  - `{ mode: "managed" }` = Agora-provisioned auth, no key
  - `{ mode: "byok", api_key }` where `api_key` is a raw write-only key or
    `$secrets.<set>.<key>`
- `asr.language`
- `llm`: `style`, `max_history`, `failure_message` (spoken when the LLM fails;
  it lives on the LLM, not on the agent), `mcp_servers[]` (`name`, `endpoint`,
  `transport`, `headers`, `allowed_tools`, `timeout_ms`), `tools[]` (HTTP function
  tools: `name`, `description`, `parameters` JSON Schema, `execution`, `server`
  {GET|POST `url`, headers, body, `timeout_ms` 10000}), `input_modalities`,
  `output_modalities`, `headers`
- `mllm`: `mcp_servers[]` only, no function `tools`
- `tts`: `skip_patterns[]`
- `turn_detection`: `speech_threshold` 0.5; `start_of_speech` semantic | vad |
  manual; `end_of_speech` semantic (silence 320 ms, max wait 3000 ms, pause
  state on) | vad (640 ms) | manual; `interruption` start_of_speech | keywords |
  off (`when_off` append | ignore)
- `silence_config`: `enabled`, `timeout_ms`, `action` speak | think, `content`
- `avatar`: `enabled` false, `vendor` akool | liveavatar | anam | generic

**Not in the spec:** knowledge base / RAG, WhatsApp transport, a model tier or
latency preset, a deployment type on the agent, SuperNode, region.

## Session (`SessionCreate`)

- `agent`: an `agent_…` id or an inline `AgentInput`; `overrides` (AgentPatch)
- `transport` (exactly one): `rtc` {`channel`, `uid`, `subscribe_uids`,
  `token`, `encryption`, `audio_scenario` aiserver|chorus} or `telephony`
  {`from`, `to`, `call_policy`}
- `lifecycle`: `idle_timeout_ms` 30000, `max_duration_ms` 72 h, `graceful_stop`
- `data_policy.retention`: 30_days (default) | none
- `client_reference`
- Status: idle · starting · running · stopping · stopped · failed
- List filters: `status` (default running), `started_after` (default two hours
  ago), `started_before`, cursor. **No agent filter.** Items carry only
  `start_ts`, `status`, `agent_id`.
- Runtime: PATCH overrides `messages` and `pipeline`; `speak` (text required,
  `audio_url`, `if_busy` interrupt, `add_to_context`), `inject` (messages,
  `respond`, `if_busy` queue), `interrupt`.

## Number

E.164 `number`, `description`, inline `sip_trunk` (`hostname`, `port`,
`transport` tls default, `auth` username/password write-only, password may be a
`$secrets` reference, `allowed_ips`), `inbound.agent` (an agent id or null).
**Inbound routing lives on the number, not on the agent.**

## Campaign (outbound batch)

Create: `name`, `agent_id`, `from` (one `num_…` or an array that rotates),
`contacts[]` (min 1; `phone` + per-contact `variables`), `schedule`
(immediate | scheduled {`start`, `end`} Unix s), `pacing` (`max_concurrent` 10,
`max_attempts` 3, `retry_backoff_ms` 600000), `call_policy`
(`max_ring_duration_ms`, `max_call_duration_seconds`, `voicemail` continue |
hangup), `lifecycle`.
Read: `status` scheduled · running · paused · completed · canceled · failed;
`counts` pending · calling · completed · failed · canceled (sum = contacts);
`started_at`, `completed_at`, `failure`. List filters: `status`, cursor,
order. **No agent filter.** No entity groups campaigns.

## Where each deployment type lives in the API

| Studio journey | API shape |
|---|---|
| Inbound | `Number.inbound.agent = agent_…` |
| Outbound batch | `Campaign` with `agent_id` + `contacts` (one list, one schedule) |
| Single outbound call | `Session` with `transport.type = telephony` |
| Code / SDK (RTC) | `Session` with `transport.type = rtc` |

The agent itself carries no deployment field, so one agent id can be referenced
by a number and a campaign at once. "Batch agents never take inbound calls" is
a product rule Studio has to enforce, not an API constraint.
