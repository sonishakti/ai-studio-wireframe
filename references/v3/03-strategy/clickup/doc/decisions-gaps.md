# Decisions and server gaps

## Decisions that block dates

| # | Decision | Blocks | Owner | By |
| --- | --- | --- | --- | --- |
| 1 | Freeze event keys app_connected and channel_connected (UI says integration and deployment), or rename them in the next schema bump? | P0.13 rename map; P0 review Tue 29 Sep | Vineet | Mon 28 Sep |
| 2 | FPR target: 18 % with the inputs as set, or 45 % (needs fast test ≥ 75 %, Go live ≥ 80 %, answered ≥ 90 %, proven ≥ 85 %)? | P0.13 dashboard; every P0 input target | Vineet and Samyak | Mon 28 Sep |
| 3 | Is the knowledge base in the v3 spec at launch? Until yes, integration_type kb stays reserved and the P0.5 row stays behind a flag. | P0.5 knowledge base row; stage 7 kb value; P3.4 | Vineet with API team | Mon 28 Sep |
| 4 | Add a purpose field (test, dev, production) to SessionCreate and return it on reads, or capture client_reference server-side? | Stage 9 code, stages 10 and 11; TTFDA code; Test before Go live for API accounts | API team via Vineet | Mon 28 Sep |
| 5 | Confirm the join key: SessionListItem.agent_id (32 lowercase) vs Agent.id (agent_ prefix). | Stage 10; every per-agent count | API team via Vineet | Mon 28 Sep |
| 6 | Add data_policy to Number.inbound and Campaign before launch, and is zero retention allowed on batch? Until then the control shows disabled with the reason. | P0.8, P0.9, P0.10, P2.6 | Vineet with API team | Mon 28 Sep |
| 7 | Presets: two (Lowest latency, Balanced) plus Custom, with 'preset' locked over the review's 'tiers'? | P0.2; P0 review | Vineet | Mon 28 Sep |
| 8 | Stage 5 counts instructions, greeting or a model only (voice alone, Advanced tuning and deployment never); text simulation never counts toward any Aha. | P0.13 agent_configured diff; TTFA; Aha 2 | Vineet | Mon 28 Sep |
| 9 | Stage order: agent_created before the baseline test and app_connected before Aha 2; no ephemeral test of an unsaved preset. | P0.1 and P0.7 flow; P0 review | Vineet | Mon 28 Sep |
| 10 | Move Analysis definition from P0 to P1.9 (register row 15 is P1; results API deferred) to fund P0.13 telemetry? | P0 budget and review scope | Vineet and Samyak | Mon 28 Sep |
| 11 | Does $secrets.<set>.<key> work in McpServer.headers and FunctionToolServer.headers? | P0.5 header field; P3.4 Add to agent | API team via Vineet | Mon 28 Sep |
| 12 | Secrets: per-key PATCH, or one set per module key as designed; does PUT refuse dropping a referenced key; add a structured used_by? | P0.6; P3.1 | API team via Vineet | Mon 28 Sep |
| 13 | Which RTM or NCS error types exist per session, and their shape? | P1.1 badge; P1.4; P1.5; integration error counters | Vineet | Wed 30 Sep |
| 14 | Add agent_session_id, ended_at, transport, direction, origin, data_policy.retention and billable_seconds to SessionListItem; agent_id to Session; list filters agent_id, campaign_id, origin, transport, retention. | Stage 12 from lists; P1.2, P1.3, P1.5; P2.1 to P2.6 | API team via Vineet | Thu 1 Oct |
| 15 | Day-one source per block (transcript, analysis, events, logs, latency): v2 pipeline or 'Arrives with session analytics'? | P1.3; P2.3 | Vineet | Thu 1 Oct |
| 16 | Free minutes allowance, the 80 % warning, what callers hear when suspended, and run behaviour (proposed: status paused, reason suspended, manual Resume). | P1.6, P1.7, P2.5; journey RK | Vineet (names billing owner) | Thu 1 Oct |
| 17 | Pricing: flat 10¢/min or 5¢ managed with BYOK lower? Decides price copy and whether plan_selected returns. | P0.2 price slot; P1.7 copy | Vineet and Samyak | Thu 1 Oct |
| 18 | Campaign level above runs: drop for v3 (rows 8 and 47 stay partial) or UI-only grouping by label? | P1.6; P2.5 | Vineet | Thu 1 Oct |
| 19 | Label for sessions happening now: Running now (locked word running) instead of live sessions? | P1.2 | Vineet | Thu 1 Oct |
| 20 | Restore SAR (≥ 25 % second agent within 28 d of agent_proven) as a P1 KPI? | P1 KPI set | Vineet and Samyak | Thu 1 Oct |
| 21 | App integrations (HubSpot) and current Console knowledge bases: migrate, read-only or retire in v3? WhatsApp leaves the Integrations catalog. | P0.5 legacy notice; P3.4 | Vineet | Thu 1 Oct |
| 22 | Name an engineering owner and ship date for the API gateway emitter (G1) and session_ended (G2). | Stages 3, 5, 6, 7, 9 for API and ephemeral; stages 10 and 11; TTFDA wall clock; FPR; P1.8; P3.3 KPI | Vineet | Fri 2 Oct |
| 23 | Name the billing emitter owner for stages 13 to 17; first_paid_minute must carry agent_session_id. | Stages 13 to 17; Free to paid; Honest rows | Vineet | Fri 2 Oct |
| 24 | Ephemeral sessions count at account level only, never agent stages, FPR or RPA; default history scope is all origins; share links reach project members only. | P2.1, P2.4, P2.6 | Vineet | Tue 6 Oct |
| 25 | Name the support ticket system and tags for ticket-based targets (session links, missing sessions). | P2.4 and P2.6 KPIs | Vineet | Tue 6 Oct |
| 26 | Integrations page: keep as a derived inventory with the 30 d reuse test, or retire? | P3.4 | Vineet | Fri 9 Oct |
| 27 | 25 UI-only items cut or raised as API asks; inbound session lifecycle as an API ask; does a call_policy PATCH apply to running sessions? | P3.3, P3.5 | Vineet with API team | Fri 9 Oct |
| 28 | Monitoring · Join key (PRD decision 5), blocking: confirm SessionListItem.agent_id is the session id; add saved agent_id and filter per G4. Blocks P1.1 to P1.5, P2.1. | P1, P2 | API team via Vineet | Mon 28 Sep |
| 29 | Monitoring · Day-one source (extends PRD decision 15): confirm v3 agent_session_id equals the v2 task_id and whether v3 sessions appear in v2 call-history and debugging tasks; if yes, back telephony rows, detail, facets and pivots with v2 until G4, G12, G14 ship (recommended); if no, scope launch KPIs to sessions Studio can open and ship the launch chain. | P1, P2 | Vineet | Thu 1 Oct |
| 30 | Monitoring · Agent page URL: view at /agents/:agentId, builder at /agents/:agentId/edit with redirects (recommended). | P1, P2 | Vineet | Mon 28 Sep |
| 31 | Monitoring · Session opens as a panel over the list it was clicked in with ?session= and in= (recommended); one panel at a time. | P1, P2 | Vineet | Mon 28 Sep |
| 32 | Monitoring · Budget P1 ≤ 3 d: 2.75 + 0.25 fixes if P1.7 free minutes moves to P3 (recommended); else move P1.9 Analysis to P3.5. | P1, P2 | Vineet and Samyak | Mon 28 Sep |
| 33 | Monitoring · Budget P2 ≤ 4 d: 3.5 + 0.5 fixes after single-owner subtasks (P1.10 URLs and links, P1.6 setting doors), P2.3 recording +0.125, P2.6 0.375. If turns and logs are deferred, P2.8 and P2.9 drop to 0.125 each. | P1, P2 | Vineet and Samyak | Mon 28 Sep |
| 34 | Monitoring · Error group key <module_name>:<event_type>, approximate and versioned until PRD decision 13 names real codes. | P1, P2 | Vineet | Wed 30 Sep |
| 35 | Monitoring · Retention matrix per block and whether zero retention drops v2 telemetry (PRD decision 6); list lookback limit and what survives retention; presets capped at 30 d until answered. | P1, P2 | Vineet with API team | Thu 1 Oct |
| 36 | Monitoring · Secrets (PRD decision 12): return the reference on resolved credentials and add SecretSet.used_by; until then Studio records set and key per module at save. | P1, P2 | API team via Vineet | Thu 1 Oct |
| 37 | Monitoring · Run counts are contact states: calling and completed open sessions once linked, failed opens contacts, pending and canceled never link; ask whether a failed dial creates a Session. | P1, P2 | Vineet with API team | Tue 29 Sep |
| 38 | Monitoring · Project-level /logs with 'No agent' and 'Agent not linked' buckets; name the owner of session_create_failed (G1, G16). | P1, P2 | Vineet | Fri 2 Oct |
| 39 | Monitoring · Shared links carry ?project=<appid> plus absolute from and to (no route change) rather than Langfuse's path prefix; trade-off: longer URLs, no route migration. | P1, P2 | Vineet with FE | Tue 29 Sep |
| 40 | Monitoring · History default all origins with Test tags (PRD decision 24); counts write env=production. | P1, P2 | Vineet | Tue 29 Sep |
| 41 | Monitoring · Phone party word: 'contact' everywhere (contact= key), matching runs; 'caller' retired from UI. | P1, P2 | Vineet | Tue 29 Sep |
| 42 | Monitoring · Alerts stay out of v3; badges and cues are pull-only. | P1, P2 | Vineet | Thu 1 Oct |
| 43 | Monitoring · Register rows 57 to 62 and journey amendments (FX turn and log steps, FX-R pasted link, run and number chains). | P1, P2 | Vineet | Mon 28 Sep |
| 44 | Monitoring · Next schema bump: monitoring_pivot, dead_end_viewed, log_line_opened, turn_selected, agents_list_viewed, recording_played, agent_reverted; visitId on every client event; properties found, rangeKind, rowCount, partial, env, isFirstError, isSlowest, progressShare, failedShare; retire agent_backlink_clicked. | P1, P2 | Vineet with FE | Fri 2 Oct |

## Server gaps

| Gap | What is missing and what it blocks |
| --- | --- |
| **G1** | the v3 spec has no webhooks or event endpoints. An API gateway to PostHog emitter for POST and PATCH /agents, /numbers, /campaigns, /sessions and /sessions/ephemeral, plus session_create_failed, has no owner. Until it ships Console-originated stages use operation_succeeded twins; API and EP journeys are unmeasured. |
| **G2** | session_ended {agent_id, agent_session_id, origin, transport, direction, duration_s, status, end_reason, turn_count, caller_is_creator} has no owner. Until it ships stages 10 and 11 for inbound and code, TTFDA wall clock, error acknowledgement and the P3.3 cut-off KPI are unmeasurable. |
| **G3** | notif 112, 201, 202 emitter unbuilt; Aha 1 and Aha 2 stay client-only. |
| **G4** | list rows carry the session id under the V2 name agent_id but no saved agent id; Session carries agent_name only. Ask: rename to agent_session_id, add nullable saved agent_id to SessionListItem and Session, add an agent_id filter; never join on agent_name. |
| **G5** | origin and retention are not returned; Test, Ephemeral and Zero retention tags work only for sessions in the Studio registry; ask Session.agent_id null for ephemeral plus origin on both. |
| **G6** | no integration health or tool log, so L-integration and integration names on errors have no source. |
| **G7** | data_policy exists only on session create; zero retention shows disabled with the reason on inbound and batch. |
| **G8** | session lifecycle (idle_timeout_ms default 30000, max_duration_ms, graceful_stop) exists on sessions and runs, not on agents or numbers; inbound has no home for it. |
| **G9** | billing stages 13 to 17 sit outside the v3 API with no emitter; first_paid_minute must carry agent_session_id. |
| **G10** | no agent config version on Session; 'saved after this session' uses a Studio config-changed label, not updated_at alone. |
| **G11** | no per-session error stream with stable codes; v2 events give approximate keys <module_name>:<event_type>, derived severity, no warnings today. |
| **G12** | GET /sessions filters only channel, status and start time; lookback limit and whether count is the range total are undocumented. |
| **G13** | transcript, recording, turns, events, logs deferred in v3; v2 turns have no timestamps, the turn.finished join is unverified, transcript is telephony-only via callId. |
| **G14** | no from, to or number id on sessions. |
| **G15** | Console routes carry no project; shared links need project= and absolute ranges. |
| **G16** | errors without a session have no emitter (session_create_failed, G1). |
| **G17** | secret set per agent unreadable (credentials return mode only, no SecretSet.used_by); Studio records it at save. |
| **G18** | Studio session registry in the Console backend (appid + agent_session_id to agent_id, surface, test, retention); v2 event ids built from page position must be replaced by stable keys. |