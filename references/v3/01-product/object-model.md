# v3 object model · what exists, where it lives, what the UI calls it

Spec: `references/api/v3/openapi-2026-09-24-ih7axj9zx.json` (downloaded 24 Sep 23:05 from
https://agora-docs-ih7axj9zx-samyakjains-projects.vercel.app/openapi.json). Earlier snapshot from the same morning:
`openapi-3.0.0-2026-09-24.json`. Both say version 3.0.0; the spec is still moving under review.

## 1. The graph

```
Project (appid, US East)
├── Secret set ────────── referenced by ──────────┐
├── Agent  (saved; pipeline + prompt + tools + analysis definition)
│    ├── Inbound: Number.inbound.agent ──► Session (inbound telephony)
│    ├── Batch:   Campaign (API) = Run (UI) ──► Session (outbound telephony) × contacts
│    │            └── Campaign (UI grouping, no API entity yet)
│    └── Code:    POST /sessions {agent_id, transport rtc|telephony} ──► Session
├── Ephemeral session: POST /sessions/ephemeral {agent: inline} ──► Session (no saved agent)
└── Number (E.164 + inline SIP trunk + inbound routing)
```

- **Agent** is deployment-free. Deployment lives on Number (inbound), Campaign (batch), or the session call (code).
- **Session** is the atom of everything observable. Every direction and modality ends in one.
- **Aggregation** is only meaningful per Agent (owner rule). Session history never aggregates.

## 2. Entities

| Entity | API | UI name (proposed) | Key fields | Notes |
| --- | --- | --- | --- | --- |
| Secret set | `/secrets`, `/secrets/{name}` (POST, GET, PUT, DELETE) | Secret set · keys | name, keys (values write-only) | PUT replaces the whole set atomically. Delete only when unreferenced (earlier snapshot). Studio auto-creates one per agent when the user pastes a key. |
| Agent | `/agents` (POST, GET, PATCH, DELETE) | Agent | agent_name, instructions, messages, greeting, variables, **structured_output**, filler_words, labels, pipeline | No deployment field. Type (inbound / batch / code) must be Studio metadata, candidate `labels`. |
| Pipeline | inside Agent | Voice & models (presets) · Custom | mode cascaded (asr, llm, tts, turn_detection, silence_config, avatar) or realtime (mllm, turn_detection, avatar) | Presets write a full pipeline. `llm` carries failure_message, max_history (default 32), mcp_servers, tools, headers, url, style, modalities. |
| Credential | inside each model module | Managed · Your key | mode managed or byok; api_key raw or `$secrets.<set>.<key>` | Never show a raw key after save. |
| Number | `/numbers` | Phone number | number, description, sip_trunk, **inbound {agent, call_policy}** | Inbound routing and inbound call policy live here, not on the agent. |
| Campaign | `/campaigns` + `:pause` `:resume` `:cancel` | **Run** (see naming) | name, agent_id, **transport {type telephony, from, call_policy}**, lifecycle, schedule, pacing, contacts, status, counts, started_at, completed_at, failure | One execution. No grouping above it. |
| Session | `/sessions`, `/sessions/ephemeral`, `/{id}`, `/stop`, actions speak / inject / interrupt | Session | client_reference, agent_id, variables, transport, lifecycle, **data_policy** | Response: agent_session_id, status, created_at. Read: agent_name, status, message, created_at, ended_at. |

## 3. What changed between the two snapshots (24 Sep morning → evening)

| Change | Old | New | UI consequence |
| --- | --- | --- | --- |
| Ephemeral sessions | `SessionCreate.agent` could be an id or an inline agent, plus `overrides` | New `POST /sessions/ephemeral` takes an inline `agent`; `SessionCreate` takes `agent_id` + `variables` only | Session history needs an **Ephemeral** agent state with no backlink. The "override" case at session start now means *variables* or *ephemeral*; `overrides` survives only in `SessionAgentPatch` (mid-session). Ask 21 must be re-scoped with Vineet. |
| Campaign transport | `from`, `call_policy` at top level | `transport {type: telephony, from, call_policy}` | Same fields, new home. "Only telephony at launch." |
| Calling windows | not modelled | `ScheduledSchedule {timezone, start, end, days[{weekday, ranges[{start,end}]}]}` | The Console's existing call-window editor now has an API home. Good for parity. |
| Inbound call policy | none | `Number.inbound.call_policy {max_call_duration_seconds, max_silence_duration_ms, end_call, transfer}` | Inbound "call settings" live on the Number, configured from the agent's Go live. |
| End-call policy | partial | `EndCallPolicy {on_conversation_complete, on_user_request, on_fax, on_ai_assistant}`, all off by default | Four switches, shared by inbound and batch. |
| Transfer | ad hoc | `TransferPolicy {phone_number, description}` | "Transfer to a person" = number + when (description). |
| Pacing | max_concurrent, attempts, backoff | adds `max_calls_per_second` ("the only dial-rate control") | Replaces the Console's call-delay-ms field. |
| Errors | Problem, FieldError | ErrorResponse | Form-level error mapping changes. |

## 4. Where Studio must hold data the API does not

| Need | Why | Proposal | Ask engineering |
| --- | --- | --- | --- |
| Deployment type | Chosen at creation; API has none | Agent `labels.studio_deployment = inbound|batch|code` | Confirm labels is the place, or add a field |
| Data retention for inbound and batch | `data_policy` exists only on session create | Collect at Go live; Studio applies it | **Gap.** Number.inbound and Campaign need `data_policy`, or a project/agent default |
| Campaign grouping above runs | Owner hierarchy campaign › run › session | UI-only grouping by name, or `labels` on each Campaign | Add a grouping entity or a `batch_id` |
| Knowledge base | Owner's unified context list includes it | Not in spec | Is RAG in v3 at all? |
| Session analytics (latency, turns, transcript, analysis results, events, logs) | Agent page + session detail | Not in v3 at launch (deferred list) | Which source feeds these on day one: v2 analytics, RTM error stream, or nothing? |
| Session list filter by agent | Agent page lists its sessions | List has no agent filter (earlier snapshot) | Add `agent_id` filter + pagination beyond 2 h |
| Talk to agent from the agent page | Real-time panel test | Code-type session over RTC with the saved agent | Confirm test sessions are billed and flagged |

## 5. Naming map (UI ↔ API)

| Concept | API word | UI candidates | Recommendation until the team decides |
| --- | --- | --- | --- |
| Post-call extraction | `structured_output` | Analysis · Variables · Monitoring | **Analysis** (Vineet leaning; matches the Console's existing "Call Analysis"). Ask the API to rename the field or accept the mismatch. |
| One execution of a batch | `campaign` | Run · Batch · Campaign | UI **Run** vs API campaign breaks parity. See the batch research file for the recommendation. |
| Grouping of runs | none | Campaign · Batch call | UI-only until the API adds it |
| Deployment | `transport` | Deployment · Channel | UI says Deployment; the Transports resource page is internal naming only |
| Credential store | `secrets` | Secrets · Keys | Secrets |
| System prompt | `instructions` | Prompt · Instructions | Prompt in the editor, `instructions` in code views |
| Stack | `pipeline` | Pipeline · Voice & models | Pipeline where engineers look (Custom, Advanced); presets in plain words |
