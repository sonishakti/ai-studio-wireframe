# 13 · Dashboards & alerts — intake brief (2026-09-17)

Tracker: https://app.clickup.com/t/868m0mewr · status `added`, board tag `Not Done` → `clarified` / `WIP` once this lands.
Tags **monitor · P1**. Size **L · 17 designer-days** (6 research · 8 proto · 3 review), `references/design-ops-protocol.md:248`.
Wave: **none**. 13 is in the deferred list, "≈144 days, estimate only, no dates" (`references/design-ops-protocol.md:274`); the locked Sep 2026 to Feb 2027 sequencing does not contain it. The three roadmap tasks are engineering P1 · P2 · P2 with no due month (`references/clickup-q3-roadmap-export-2026-09-03.tsv:156,159,161`).
Not a ⚠ lock. The label lock stands: the surface is **Monitor**, never "Analytics".
Depends on **12 · Live monitoring & operator controls ⚠ lock** for anything live, and on **10 · Session & call logs** for the definitions of latency and timing.

## Scope

| Task | What it asks for | Acceptance criteria |
|---|---|---|
| **868kykbfc** Build self-serve analytics dashboards, monitors and alerts (P1, Studio, type Feature Request, no due month · `references/clickup-q3-roadmap-export-2026-09-03.tsv:156`) | Three things in one title. **Dashboards**: the numbers a customer reads without asking us. **Monitors**: a standing check on those numbers. **Alerts**: the check firing somewhere a human sees it. The backlog files it under "Monitor · Sessions · Call History", surface `/monitor · /sessions/[id] · /calls · diagnostics` (`references/design-backlog-q3-roadmap-2026-09-03.html:337,351`). "Self-serve" is the only word about scope, and it is doing a lot of work: the sizing row reads it as "Dashboard builder + alert rules" (`references/design-ops-protocol.md:248`). Not in the Q3 execution PRD's Epic C. | **no acceptance criteria written** |
| **868ka69vr** Define inbound pilot metrics for FCR, answer speed, handle time, escalation and sentiment (P2, Studio · `...tsv:159`) | Five named metrics for an inbound pilot. The Q3 execution PRD places them in "Inbound deployment › Overview KPIs" (`references/prd-q3-roadmap-execution-2026-07-29.html:201`), which is a per-deployment surface, not the global Monitor. `TODO-Q3-ROADMAP.md:82` files it to Epic C, observability. The task word is "define", so the deliverable is a definition per metric, not only a tile. Of the five, exactly one (handle time) already exists as a field anywhere in the product. | **no acceptance criteria written** |
| **868kyv3yg** Export Studio agent traces to customer observability platforms (P2, Studio · `...tsv:161`) | Get per-session evidence out of Studio and into the tool the customer already watches. No platform is named, no format is named, no direction is named (push or pull). No PRD row. | **no acceptance criteria written** |

Neighbours that constrain the scope and are **not** rows here: "[O4.3-T1.a] Deliver end-to-end call observability" (Engine, P0, 2026-10 · `...tsv:104`) is the upstream data; "Show live sentiment trends and let operators monitor active calls" and "Extend live monitoring and sentiment to outbound campaigns" (both P1 · `...tsv:155,157`) belong to 12, which is locked; "Write an observability support-model recommendation for self-serve, white-glove, or tiered support" (P0, 2026-09, status PLANNING · `...tsv:148`) is the internal decision about who reads these numbers, and it is in flight.

## What the product has today

Two products hold pieces of this. The wireframe (`studio_x_2`) has the shape of a dashboard drawn over invented numbers. The live Console (`ng-console`) has a real dashboard wired to a real backend, and a real place where a metric is defined. Neither has an alert.

### studio_x_2 · the Monitor overview

`app/(dashboard)/monitor/page.tsx` (465 lines) is the surface the tracker calls "UI partial".

What is real and load-bearing:

- **Zero-traffic gate.** `totalCalls` sums `DEPLOYMENTS[].metrics.calls` at :98-101, `hasTraffic` at :102, and the whole analytics block is behind it (:230-245). A brand-new account gets an empty card (:232-244), not fabricated KPIs. The comment at :95-97 says why. This is the one honest thing on the page and it must survive.
- **Needs attention** (:147-189): the single most severe open issue from `allOpenIssues()[0]` (:89), with severity badge, root cause, the deployment it is on, a **Fix** deep link through `fixHref` (:167) and an "All issues" link to `/monitor/diagnostics` (:185). The healthy counterpart is :190-198.
- **Live deployments** chips (:202-228) with a `HealthDot` per deployment from `deploymentHealth(d.id)` (:218).
- **Capture config** lives in the header (`CallCaptureSheet`, :111), owner call 2026-07-17: what calls record is a monitoring concern.

What is not real:

- **Every number is a literal.** `KPIS` (:44-49) is four hardcoded strings: "120 / 208" Answered Calls, "95%" Answer Rate, "5 min" Call Duration (Avg.), "5,500 min" Call Duration (Total), each with a hardcoded delta ("Down by 16%") and one of three hardcoded sparkline series (:40-42). None of them reads `DEPLOYMENTS`.
- **The donut does not add up.** `STATUS_SEGMENTS` (:53-60) is six segments summing to **75 %**, and `TOTAL_CALLS = 4000` (:61) is unrelated to any deployment's metrics. Its six labels (Answered · Failed · Voicemail · Transferred · Unanswered · Transfer Failed) are not in the Agora contract (see the fact-check).
- **Task Success Rate** (:332-338) draws a hardcoded ten-point series and nowhere on the page or in the codebase says what "success" means.
- **Top Performing Agents** (:342-373) ranks three hardcoded agents by a `sessions` count that exists nowhere else.
- **The filters do not filter.** Four selects at :248-285. Time range (:249-257, `defaultValue="7d"`, options 24h · 7d · 30d · 90d), agents (:258-264) and call types (:265-272) are all uncontrolled with no `onValueChange`. Only the deployment select is controlled (:273-279), and all it drives is the visibility of an "Open deployment" link (:280-284).
- **Refresh** (:112-118) fires `toast.info("Refreshing")` and nothing else.

Charts are three private one-off functions at the bottom of the page file: `Sparkline` :383-400, `Donut` :402-450, `AreaChart` :452-465.

### studio_x_2 · the components that already do this job and are not used

- `components/metric-section.tsx`: `MetricSection` (:13-29, section header plus a stack) and `MetricCard` (:38-97, label, info affordance, value, unit, delta, sub, chart slot, and a **`mute`** prop at :71-72 that renders the no-data case as helper copy instead of a number). The doc comment (:6-12) says it is the pattern for "/home, /billing/usage, and per-campaign analytics".
- `components/sparkline.tsx`: `Sparkline` (:7-107) with gridlines, an area fill, a last-point dot and optional axis labels.

**Both are orphans.** Nothing under `app/` or `components/` imports either one; the only references in the repo are `.design-sync/previews/MetricSection.tsx` and the `ds-bundle/` type declarations. So the product's only dashboard is drawn with private SVG helpers while the shared, better, no-data-aware components sit unused. Any new tile on this feature extends `MetricCard`; it does not add a fifth card shape.

### studio_x_2 · Diagnostics, which is the closest thing to a monitor

`app/(dashboard)/monitor/diagnostics/page.tsx` (156 lines) and `lib/diagnostics.ts` (420 lines).

- `lib/diagnostics.ts` is a rules engine over per-call signals. `CallSignals` (:67-79) carries `asrConfidence`, `llmLatencyMs`, `network`, `bargeInAttempts`, `toolCalls`, `deadAirMs`, `offScript`, **`escalation { requested, connected, turn }`** (:77) and `configVersionAtRun`. Nine rules (:205-315) are listed in `RULES` (:317): `barge_in_not_honored`, `tool_call_failed`, **`escalation_failed`** (:230-236), `off_script`, `low_asr_confidence`, `llm_latency_spike`, `network_quality_dropped`, `dead_air`, `config_drift`. Every `Issue` (:51-64) carries a `severity`, a `rootCause`, a `suggestedFix` and a `fixTarget` that `fixHref` (:88-93) turns into a deep link to the control that fixes it.
- Roll-ups exist: `healthOf` (:333), `aggregateIssues` (:354, dedupes by `ruleId` and counts occurrences), `credentialIssues` (:376), `allOpenIssues` (:401), `deploymentHealth` (:409).
- The page renders a health strip (:67-78, "ranked by severity × frequency" :76), search (:84), a severity toggle (:91-104), the issue feed with per-issue occurrence counts (:117-133) and rows-per-page (:144-149). It deep-links from the sidebar badge via `?sev=` (:28-31).

This is a **monitor without a threshold**. Every number that decides whether a rule fires is hardcoded inside the rule. Nothing here is user-settable, and nothing here leaves the screen.

### studio_x_2 · the alert half that already exists

- **Delivery** is built. `app/(dashboard)/project/notifications/page.tsx` (136 lines): four channels (`CHANNELS` :21-26 Email · In-app · Slack · Webhook), six categories (`CATEGORIES` :28-35) each with a per-channel switch, plus a Routing card (:106-132) holding email recipients (:115), a Slack channel (:119) and a webhook URL (:125) that points at Developer Hub › Webhooks (:128). Every row is an **event class**. Not one row is a condition.
- **The one threshold a user can set in the whole product** is the spend cap. `components/usage-spend-card.tsx`: the cap plus "Alert me at" percent (:557-580), a marker drawn on the bar (:335), the recap line "Spend cap $X/mo · alert at 75%" (:391-392), and the percent clamped to 1 to 99 with the reason stated at :504 ("at 100 the 'alerts before anything pauses' promise would be false"). `lib/analytics.ts:71-72` writes the rule down: `spend_alert_fired` **must** precede `spend_cap_hit`, "a cap hit with no prior alert is the failure these events exist to catch". This card is the sibling an alert rule extends. It is the shape of a monitor: a metric, a threshold, a warning before the wall.
- `app/(dashboard)/developer/webhooks/page.tsx` (114 lines) lists endpoints with a per-endpoint event list (:51-105) and an "Available Events" catalog (`EVENTS` :20-24): nine invented dotted names (`call.started`, `call.completed`, `call.failed`, `call.transferred`, `campaign.*`, `agent.published`, `agent.error`). None of these is an Agora event. The real ones are numbers (see the fact-check).

### studio_x_2 · the five inbound pilot metrics, measured against what exists

- **Handle time**: exists. `Deployment.metrics` (`lib/campaign-data.ts:78-82`) is `{ calls, successRate, avgHandleTimeSec }`.
- **Escalation**: modelled only as a per-call diagnostic signal (`lib/diagnostics.ts:77`) and one failure rule (:230). Not a rate, not a tile.
- **Sentiment**: a placeholder. `app/(dashboard)/calls/page.tsx:110-114` offers Sentiment · Intent · Language as optional columns behind "Customise View", and `structuredValue` (:117-121) **derives** sentiment from the call outcome: `Successful` becomes `Positive`, `Failed` becomes `Negative`, everything else `Neutral`. That is a relabel of a field we already show, not a measurement. The only other sentiment in the product is `ext_sentiment` in the extensions marketplace (`app/(dashboard)/extensions/page.tsx:61-64`), an RTC extension.
- **FCR**: does not exist anywhere, in either product.
- **Answer speed**: does not exist anywhere, in either product.

### studio_x_2 · trace export, as it stands

`lib/session-trace.ts` (496 lines) models one session: `TraceSpan` (:35-47) with `key: vad | asr | llm | tool | tts | net`, `startMs`, `durationMs` and **`measured: boolean`** (:41-44, "a trace that silently mixes measured and modeled spans is worse than none"); `SessionTurn` (:49-69) with `e2eMs`, per-turn `payloads.{stt,llm,tts}` and `endType: greeting | interrupted | ignored | error`; `SPAN_FIX` (:471-479) mapping a slow span to the control that fixes it; `LATENCY_TARGET_MS = 1000` (:493-496). Export is `traceToJson` (:482-484), fired from `components/session-detail.tsx:121-125` as a browser download of one session, tracked as `session_trace_exported` (`lib/analytics.ts:133`). There is no destination, no batch, no push.

### studio_x_2 · the event taxonomy

`lib/analytics.ts` (495 lines). Monitor-side events already named: `monitor_viewed` (:124), `calls_viewed`, `sessions_viewed` (:125-126), `session_detail_viewed` / `session_transcript_seek` / `session_payload_opened` / `session_trace_exported` / `session_span_fix_clicked` / `session_jump_to_slowest` (:130-135), `usage_viewed` (:136), `insights_cross_link_clicked` (:137), `call_diagnosis_viewed` / `diagnostics_queue_viewed` / `remediation_link_clicked` / `remediation_resolved` / `config_drift_detected` (:140-144), and the spend trio (:73-76). The TTFA clock added by the KPI plan lives at :387-496. **There is no `alert_rule_*`, no `dashboard_*`, no `monitor_rule_*` event.** Anything this feature ships needs its success event added here.

### studio_x_2 · Live calls, which is 12 and is locked

`app/(dashboard)/monitor/live/page.tsx` (219 lines) and `lib/live-calls.ts` (198 lines): issues-first sort (:60-63), a clock that names its own lag and can be paused (:118-124), a concurrency-wall banner (:127-137), and four operator verbs (`OPERATOR_VERBS`, `lib/live-calls.ts:157-182`). `CallRisk` (`lib/live-calls.ts:22`) is `silence | repeating | asked for a person | long`, rendered by `riskLine` (:187-195). Those four risks are the nearest thing in the product to a live quality signal, and they are heuristics on a mock. "Live sentiment trends" is 12's roadmap row, not 13's.

`components/monitor-nav.tsx:15-22` is the hub's tab set: **Overview · Live calls · Call History · Sessions · Diagnostics**. There is no Alerts tab, and the "Looking for usage?" outlink to `/billing/usage` (:36-40) is a deliberate non-tab.

### ng-console · the live Console's real analytics

This is the surface a customer sees today, and it is much further along than the wireframe.

- `src/components/console/agent-analytics-page.tsx` (69 lines): three tabs (:12-16) **Monitor · Call history · Session history**, all rendered by `TelephonyPage` (:53-66) with `view="analytics"` on the Monitor tab. The tab label is already "Monitor", matching the lock.
- `src/components/console/telephony-page.tsx:1656` `TelephonyAnalyticsPage`. Data from `useTelephonyAnalyticsSummaryQuery` (:1764). Filters that **do** filter: period 7 · 30 · 90 days plus Custom (:1958-1981) with a date picker whose floor is 365 days back (:1924-1926), an agent multi-select (:2039-2057), and a call-type select inbound | outbound (:2058-2089). All of it is encoded into the URL through `updateAnalyticsSearch` (:1858-1880). Refresh is a real refetch (:1897-1921).
- KPI cards: `AnalyticsKpiCards` (:2133, defined :2371) built by `getAnalyticsKpiCards` (:3122-3209). Four cards, one of them conditional: `total-calls` (:3138), `answer-rate` **outbound only** (:3151-3169), `call-duration` in minutes (:3181-3188), `answered-calls` (:3195-3202). Each carries a trend computed against the previous equivalent period (`calculateAnalyticsKpiTrend`, :3140).
- Panels: `AnalyticsDistributionPanel` (:2144, defined :3448) for call-status distribution, and two `AnalyticsTrendPanel`s (:3583): **"Success evaluation"** (:2145-2153) and **"Inbound / Outbound transfer-to-human rate"** (:2156-2177, described as "Percentage of calls that needed human intervention"). Loading, error and empty states all exist (:2395, :2432, :2461, :2478, :2130).
- Contract, `src/lib/telephony/telephony-api.ts`: `TelephonyAnalyticsSummary` (:306-313), `TelephonyAnalyticsOverview` (:335-344: `totalCalls`, `totalAnswered`, `totalAnswerRate`, `totalDurationSeconds`, each with a `Trend` array), `TelephonyInboundAnalytics` (:346-351: `avgAnsweredDuration`, `callSuccessEvaluationResultRateTrend`, `statusDistribution`, `transferredRateTrend`), `TelephonyOutboundAnalytics` (:353-359), `TelephonyTrendPoint` (:366-369). Fetched from `/api/telephony/analytics/summary` (:680-685).
- Server: `src/routes/api/telephony.analytics.summary.ts` routes to `handleGetTelephonyAnalyticsSummary` (`src/server/telephony/handlers.ts:622`), which fans out to three backend calls (`src/server/console-backend/telephony.ts:1002-1026`): the current overview, the analysis at `projectTelephonyPath(appId, "campaigns/analytics")` (:1336), and the previous period at `"call-history-overview"` (:1362). **These aggregates are Studio backend endpoints. They are not on docs.agora.io and they are not in the Conversational AI Engine contract.**

So: escalation rate (`transferredRateTrend`) and handle time (`avgAnsweredDuration`) already exist as aggregates. Answer rate exists, but only for outbound. FCR, answer speed and sentiment do not exist.

### ng-console · where a metric is actually defined

The most important surface for 868ka69vr, and it is not on Monitor. It is on a phone number.

`src/features/telephony/phone-numbers/phone-number-post-call-analysis-section.tsx` (619 lines), section title "Post Call Analysis" (`src/lib/i18n/resources/en/common.ts:3302`), toggle "Enable post-call analysis" (:3287), helper "Update the built-in post-call success evaluation." (:3318-3319).

- The built-in metric is a **prompt**: `DEFAULT_PHONE_NUMBER_CALL_SUCCESS_CRITERIA` (`src/lib/telephony/phone-number-contracts.ts:7-8`) = `'You are an expert evaluator. Classify if this call was "successful" or "unsuccessful" using the call transcript.'`
- Custom metrics are user-authored: `PostCallCustomEvaluationDraft` (`src/features/telephony/post-call-evaluation/post-call-evaluation-authoring.ts:3-8`) is `{ name, criteria, type, allowedValues }` with `PostCallEvaluationType = "boolean" | "number" | "string"` (:1). Names are validated against reserved system names fetched from `/api/telephony/system-evaluations` (`src/lib/telephony/telephony-api.ts:694-698`).
- The write: `buildPhoneNumberAgentBindingBody` (`src/lib/telephony/phone-number-contracts.ts:63-115`) emits `structured_output.call_success_evaluation.criteria` (:96-98) and `structured_output.custom_evaluations[] = { criteria, enums, type, variable_name }` (:70-75), gated at :68-69 on `enableLlmCallEvaluation && enableTranscript && agentId`.
- That gate is the whole story: **if transcripts are off, or no agent is bound, there is no success number at all.** And the number on the Monitor tab (`callSuccessEvaluationResultRateTrend`) is the result of whatever sentence the customer typed into that box, on whichever number the call arrived at.

### ng-console · the alert half that already exists

- **Webhooks are real and product-scoped.** `src/lib/developers/webhooks-products.ts:204-216` defines the product `key: "convoai"`, `label: "Conversational AI Engine"`, `kind: "ncs"`, `productId` from `ncsProductIds` (:37-52, dev `19` / prod `17`), with every doc link pointing at `https://docs.agora.io/en/conversational-ai/develop/webhooks`. The drawer (`src/components/console/developers/sections/webhooks/webhook-drawer.tsx`, 458 lines) has a region select (:200-233), a URL field (:242-257), a searchable event multi-select (:264+) driven by a server-fetched catalog of numeric event ids (`src/lib/developers/webhooks-api.ts:40`, `webhook-helpers.ts:10,61-70`), and a copyable secret (:173-181). **The subscription surface for Agora's own agent events already ships.**
- **The notification centre is not an alert surface.** `src/components/console/notification-center.tsx` (1385 lines), categories at :67-83: `account · finance · product · operation · promotion · tickets`. Nothing routes a customer's own traffic into it.
- **The only threshold in the live Console is hardcoded.** `src/lib/subscriptions/usage-quota-rows.ts:185-196` `quotaBarColorClass`: 60 % warning, 90 % danger, 100 % critical, rendered as a bar in `src/components/console/usage-quotas-card.tsx:123-132`. The user cannot change any of the three.
- **A per-agent kill switch already exists.** `src/components/console/agent-advanced-page.tsx:189-192` renders `DataRetentionOptOutRow` bound to `parameters.optOut`, labelled "Opt out of data retention" (`src/lib/i18n/resources/en/common.ts:422`). An agent with this on produces no session data for any dashboard.

### What is missing, plainly

1. **No alert.** Nothing in either product fires on a condition derived from traffic. The one user-settable threshold is a spend cap in the wireframe; the one threshold in the live Console is a hardcoded bar colour.
2. **No user-changeable dashboard.** Both surfaces are fixed card sets. Nothing can be added, removed, reordered or saved.
3. **No FCR, no answer speed, no measured sentiment**, anywhere, in either product.
4. **No trace export destination.** Export is one session, one JSON file, one browser download.
5. **The wireframe Monitor is a picture of a dashboard.** Its numbers are literals, its donut sums to 75 %, and three of its four filters are inert.
6. **Two Monitors that do not match.** The wireframe's Monitor overview and the live Console's Monitor tab show different KPIs, different charts and different words for the same product.

## Agora fact-check

Sources: `docs.agora.io/en/` (fetched 2026-09-17) and `agora-agents@2.4.0` at `/Users/shaktisoni/Documents/Agora Design & FE/ng-console/node_modules/agora-agents/dist/cjs/`.

### The primitive that carries this feature: webhooks (NCS)

- Configured **in the Agora Console**, not in Studio: "Open **Projects** and locate the target project", "Open the **Notifications** configuration area for the project", "Select the Conversational AI event types", "Enter the HTTPS callback URL" (https://docs.agora.io/en/conversational-ai/develop/webhooks). The ng-console implementation of that is `src/lib/developers/webhooks-products.ts:204-216`.
- Signature: `Agora-Signature` (HMAC/SHA1) or `Agora-Signature-V2` (HMAC/SHA256) in the request headers.
- Delivery: no retry policy or delivery guarantee is documented. The page says only "Design webhook processing to be idempotent, because retries can happen" and "Make sure your server responds within 10 seconds".
- **Subscribable events, verbatim from that page: `101`, `102`, `103`, `110`, `111`, `201`, `202`.** Seven.

### Event types and their payloads

From https://docs.agora.io/en/conversational-ai/develop/event-types:

| Code | Name | Payload fields |
|---|---|---|
| 101 | Agent joined | `agent_id`, `name`, `start_ts`, `channel`, `labels` |
| 102 | Agent left | `agent_id`, `name`, `start_ts`, `stop_ts`, `channel`, `status`, `message`, `labels` |
| 103 | Agent history | `agent_id`, `name`, `channel`, `start_ts`, `stop_ts`, `contents[]` (`role`, `content`, `speech_start_ms`, `speech_end_ms`, `speech_algorithmic_delay`), `labels` |
| 104 | Agent expire (RTC token near expiry) | `agent_id`, `name`, `start_ts`, `channel`, `message` |
| 110 | Agent error | `agent_id`, `name`, `start_ts`, `channel`, `turn_id`, `errors[]` (`module`, `turn_id`, `code`, `message`), `labels` |
| 111 | Agent metrics | `agent_id`, `name`, `start_ts`, `stop_ts`, `channel`, `metrics[]` (`turn_id`, `asr_ttlw`, `llm_ttfb`, `llm_ttfs`, `tts_ttfb`), `labels` |
| 112 | Turns finished | `agent_id`, `name`, `channel`, `start_ts`, `stop_ts`, `total_turn_count`, `is_truncated`, `labels`, `turns[]` |
| 201 | Inbound call state | `agent_id`, `name`, `channel`, `state`, `report_ms`, `labels` |
| 202 | Outbound call state | `agent_id`, `name`, `channel`, `state`, `report_ms`, `labels` |

**Finding: 104 and 112 are documented event types that the webhooks page does not list as subscribable.** 112 is the batch of every turn in a finished session, so it is the one event a trace exporter would want most. Confirm with Engine before designing an export that depends on it. Release history: 111 · 201 · 202 shipped v2.6 (April 22, 2026); `name` was added to all NCS payloads v2.7 (May 20, 2026); **104 and 112 shipped v2.8 (June 11, 2026)** alongside paginated turns and `total_turn_count` (https://docs.agora.io/en/ai/release-notes).

### The join key: `labels`

`properties.labels?: Record<string, string>` (`node_modules/agora-agents/dist/cjs/api/resources/agents/client/requests/StartAgentsRequest.d.ts:110-111): "Custom labels in key-value pair format... Enables agents to carry custom business information. These labels are bound to the agent and returned in the `payload` field of all message notification callbacks from the conversational AI engine."

This is the **only** way to tag a session with a deployment, a campaign, a phone number or a customer, and therefore the only field a dashboard can group by. `labels` is on the ng-console property allowlist (`src/lib/convoai/agent-properties.ts:15`) but is explicitly excluded from the configurable set (:22-24), so nothing in the Console writes it today. Any group-by in this design is blocked on writing `labels` at join time.

### Per-turn evidence: the turns API

`GET /v2/projects/{appid}/agents/{agentId}/turns` (https://docs.agora.io/en/api-reference/api-ref/conversational-ai/turns). Params `page_index` (default 1) and `page_size` (default 50). Response per turn (`node_modules/agora-agents/dist/cjs/api/resources/agents/types/GetTurnsAgentsResponse.d.ts:1-207`):

- `start.type`: `voice_input | greeting | silence_timeout | api_speak`, with `metadata.speech_duration_ms`, `interrupt_duration_ms`, `greeting_nth`, `action`, `transport`.
- `end.type`: `ok | interrupted | ignored | error`, with `metadata.playback_duration_ms`, `caused_by` (`start_of_speech`, `api_speak`, `api_interrupt`, `api_leave`, `semantic`, `keywords`, `disable`) and, on error, `reason` (`LLM_REQUEST_ERR | INTERNAL_ERR`) plus `details`.
- `metrics.e2e_latency_ms` and `metrics.segmented_latency_ms[]` with `name` in `algorithm_processing`, `asr_ttlw`, `llm_ttft`, `llm_ftfs`, `tts_ttfb`, `transport` (text modality) or `llm_ttfa` (audio modality), each with `latency`.

**Finding, and the single biggest constraint on this design: "You can query sessions within the last 7 days."** The wireframe's Monitor offers 30-day and 90-day ranges (`studio_x_2/app/(dashboard)/monitor/page.tsx:254-255`) and the live Console offers 90 days plus a custom range reaching 365 days back (`ng-console/src/components/console/telephony-page.tsx:1926`, :1978). Anything beyond 7 days is served by Studio's own aggregate store, not by the Engine, and those two stores answer different questions.

### Session and call listing

- `GET /v2/projects/{appid}/agents` (https://docs.agora.io/en/api-reference/api-ref/conversational-ai/list): `from_time` **"Defaults to 2 hours ago"**, `to_time`, `state` (comma list of 0 · 1 · 2 · 3 · 4 · 6), `limit` default 20, `cursor`. Returns `data.list[].{agent_id, status, start_ts}` and `meta.total` (`ListAgentsRequest.d.ts:7-30`, `ListAgentsResponse.d.ts:1-53`). Status vocabulary: `IDLE | STARTING | RUNNING | STOPPING | STOPPED | FAILED` (`GetAgentsResponse.d.ts:21-39`, https://docs.agora.io/en/conversational-ai/rest-api/agent/query).
- Telephony call records (`ListTelephonyResponse.d.ts:22-49`, `GetTelephonyResponse.d.ts:1-35`): per call `to_number`, `from_number`, `pipeline_id`, `type` (`inbound | outbound`), `agent_id`, `channel`, `create_ts`, `state` (**`answered | hangup`**, two values), `stop_ts`, and on the single-call read a `reason` (**`request | hangup | failed`**, three values).

**Finding: the Engine's whole call-outcome vocabulary is two states and three reasons.** The wireframe donut's six segments (Answered · Failed · Voicemail · Transferred · Unanswered · Transfer Failed, `studio_x_2/app/(dashboard)/monitor/page.tsx:53-60`) are not in the contract. Voicemail, Transferred and Transfer Failed have to come from somewhere else or come off the chart.

### Runtime switches that decide whether there is data at all

From `StartAgentsRequest.d.ts`:

- `parameters.enable_metrics?: boolean` (:658-659): "Whether to receive agent performance data. This setting only takes effect when `advanced_features.enable_rtm` is `true`." ng-console sets it to `true` by default (`src/server/convoai/runtime-handlers.ts:545`, :978).
- `parameters.enable_error_message?: boolean` (:660-661), same gate, same default (:544, :977).
- `parameters.opt_out?: boolean` (:669-674): "Disables session data retention. When disabled, historical session content cannot be used for troubleshooting, effectiveness review, or agent optimization." Exposed to users today as the "Opt out of data retention" switch (`ng-console/src/components/console/agent-advanced-page.tsx:189-192`). An agent with this on contributes nothing to any dashboard, and the dashboard has to say so rather than show a gap.

### The pricing fact

"Conversational AI Engine Audio Task" is **$0.10 per minute**, "You are charged the same price even if you bring your own key (BYOK)", "First 300 minutes are free" per month, and audio RTC is billed separately at **$0.00099** per participant-minute (https://docs.agora.io/en/conversational-ai/overview/pricing). No dashboard tile or alert on this surface may imply that a model, a vendor or a config choice moves the Agora bill.

### Requires Engine

Each of these has no field, no event and no endpoint in the contract. A missing field is a finding, not a failure; the design has to name the gap on screen rather than draw around it.

- **Sentiment. Requires Engine.** No sentiment field exists in any request, response or notification payload; `grep -ril sentiment` over the whole installed SDK returns nothing.
- **FCR. Requires Engine.** Nothing named first-contact resolution. The nearest thing that exists is the Studio-side `structured_output.call_success_evaluation.criteria`, which is an LLM prompt scoped to one phone number, not a metric.
- **Answer speed. Requires Engine.** A call carries `create_ts` and `stop_ts` and nothing between them; there is no ring-start and no answer timestamp, so time-to-answer cannot be computed from the contract.
- **Escalation rate. Requires Engine** at the Engine level. It exists only as the Studio backend's `transferredRateTrend` (`ng-console/src/lib/telephony/telephony-api.ts:350,358`), derived from the Console's own `transfer_config` (`src/lib/telephony/phone-number-contracts.ts:107-113`).
- **Any aggregate.** Every Engine endpoint returns one session or a page of sessions. There is no group-by, no time bucketing, no rollup. Aggregation lives only on the Studio backend at `campaigns/analytics` and `call-history-overview` (`ng-console/src/server/console-backend/telephony.ts:1336`, :1362), which are undocumented on docs.agora.io.
- **Alert rules. Requires Engine**, or they are built on the webhook the customer already owns. There is no monitor, rule, threshold or subscription API.
- **Trace export in an observability format. Requires Engine.** No OTLP, no OpenTelemetry, no exporter: `grep -ril "otel\|opentelemetry\|observab\|trace"` over `dist/cjs/*.d.ts` returns nothing. The only push Agora offers is the NCS webhook, JSON over HTTPS POST, one URL per configuration.

### Two doc problems worth reporting

- `https://docs.agora.io/en/conversational-ai/best-practices/metrics` is a **404**, and `studio_x_2/app/(dashboard)/help/page.tsx:48` links to it as "Understanding completion rate and handle time".
- `https://docs.agora.io/en/conversational-ai/rest-api/notification` is a 404; the live paths are `/en/conversational-ai/develop/event-types` and `/en/conversational-ai/develop/webhooks`.

## Already decided

- **The label.** "Label is **'Monitor'**, never 'Analytics' (collides with the separate Agora Analytics product)" (`CLAUDE.md:114`). Also `LEARNINGS.md:415`: "❌ 'Observe' as a user-facing section header (rename to `Monitor`)". The live Console's tab is already "Monitor" (`ng-console/src/components/console/agent-analytics-page.tsx:13`).
- **Monitor is one hub, not several sidebar items.** "Global **Monitor** is a single sidebar item... Don't re-split Monitor back into separate flat Call/Chat History sidebar items" (`CLAUDE.md:160`). A new dashboard is a tab or a section inside the hub, not a peer.
- **RTE usage is not Monitor.** "RTE = usage, not sessions" (`CLAUDE.md:115-118`); the hub keeps a quiet outlink to `/billing/usage` and nothing more (`components/monitor-nav.tsx:34-40`).
- **No cost on this surface.** "Cost tab was deleted 2026-05-26 after audit (Agora doesn't have per-vendor cost data)" (`CLAUDE.md:169`). Platform spend lives in Billing.
- **Rejected KPIs.** "`Time on page` / session length / DAU are **rejected** as KPIs" (`CLAUDE.md:154`, `LEARNINGS.md:452`). They do not go on a dashboard either.
- **North star.** "Signup → First live deployment carrying traffic → first paid usage" (`CLAUDE.md:42`, `LEARNINGS.md:427`). A dashboard earns its place by keeping a live deployment live, not by being visited.
- **Alert fatigue is already ruled on.** `LEARNINGS.md:344`: "First-failure email rate-limited to one per error class per 24h. Suppressed-alert acknowledgment in-app on return." And `studio_x_2/lib/analytics.ts:71-72`: `spend_alert_fired` must precede `spend_cap_hit`, "a cap hit with no prior alert is the failure these events exist to catch." Both are alert-design decisions made before this feature existed.
- **Never fabricate numbers on an empty account.** The zero-traffic gate is built (`monitor/page.tsx:95-102`) and the prior state inventory already specifies twelve states for this exact screen, including "Data lags by ~3 minutes", per-tile error with "Last updated 3m ago", plan-gated tiles, and the honest-delta rule: compare to the previous **equivalent** period, and when the prior period is zero show "No prior period to compare" rather than "+∞%" (`references/analytics-rebuild.md:88-128`). That document also hands "what counts as Task Success" to `/measure` as an open product question (:148).
- **Measured against modelled must stay visible.** `lib/session-trace.ts:41-44`: "a trace that silently mixes measured and modeled spans is worse than none". A dashboard that mixes an Engine number with a Studio-derived one carries the same obligation.
- **One definition of latency and timing across surfaces.** From 10's acceptance criteria: "Latency and event timing use the same definitions in Logs, agent preview, APIs, CLI" (`references/research/10-session-logs/00-brief.md`). Handle time and per-turn latency on this dashboard use those, not new ones.
- **12 is locked.** Live monitoring and operator verbs stop at the owner call (`references/design-ops-protocol.md`, rule 3). "Live sentiment trends" is 12's roadmap row. 13 does not design a live surface.
- **Copy discipline.** "never ADD UI text without asking" (`CLAUDE.md:196`); max one short line under a control; explanations behind progressive disclosure. Numbers that need a caveat go in a tooltip, not a paragraph (`CLAUDE.md:326`).
- **Control strokes.** Every input, select and switch boundary uses `--stroke`, checked in both themes (`CLAUDE.md:202-206`).
- **Reuse before adding.** `MetricCard` and `Sparkline` already exist and are unused; the spend cap already is an alert rule; project notifications already is the delivery table; the Developers webhooks section already is the event subscription. Four siblings, all live, none of them extended yet.

## Open questions for the owner

**1. Which store does the dashboard read, given the Engine keeps turns for 7 days?**
The Engine's turns API says "You can query sessions within the last 7 days"; today's Monitor offers 30 and 90 days and the live Console offers 365.
*(a)* Cap the range at 7 days and delete 30 / 90. One honest source, and a visibly weaker product than the live Console has today.
*(b)* Keep the long ranges on Studio's own aggregate (`campaigns/analytics`, `call-history-overview`) and mark, on screen, which numbers stop at 7 days. Two sources, one screen, and the honesty burden moves into the copy.
*(c)* Ask Engine for a longer window and design against the answer. Blocks the feature on someone else.

**2. What is "success", and who owns the sentence?**
The live Console's headline success number is produced by an LLM prompt the customer types into a box on a phone number (`phone-number-contracts.ts:7-8`, :96-98).
*(a)* Keep it. The dashboard's biggest number then means something different on every phone number, and cannot be compared across deployments or customers.
*(b)* Define success once in Studio and show the per-number prompt as an override. One comparable number, and a new Engine or backend ask.
*(c)* Show both, labelled. Honest, and two numbers on screen that will disagree.

**3. Where does an alert's condition live?**
*(a)* On the customer's side. We ship nothing new: the webhook subscription already exists in Developers, and "alerts" becomes a documentation job. Cheapest, and it answers "without asking an engineer" with "ask an engineer".
*(b)* In Studio, evaluated against our own aggregates. Needs a scheduler and a notification path that do not exist.
*(c)* Extend the diagnostics rules engine (`lib/diagnostics.ts:317`) with user-set thresholds and route the results into the project notifications table that already has Email · In-app · Slack · Webhook. Smallest thing that reuses two live surfaces and fits the standing "one door per action" rule.

**4. Does "self-serve" mean the customer can change the dashboard?**
The sizing row reads it as "Dashboard builder + alert rules" (17 designer-days).
*(a)* Fixed cards plus working filters. That is what both surfaces already are, minus the broken filters. Days, not weeks.
*(b)* A card picker over a named metric list, with the list being the deliverable of 868ka69vr.
*(c)* A real builder with saved, shareable views. This is the XL reading, and it needs a persistence model nobody has specified.

**5. Sentiment has no field in the contract. What do we ship?**
*(a)* A post-call custom evaluation the customer writes, using the control that already exists (`post-call-evaluation-authoring.ts:1-8`, types `boolean | number | string`). Sentiment becomes a per-deployment string, comparable only inside one deployment, and it costs an LLM pass per call.
*(b)* Wait for Engine and leave the word off the screen.
*(c)* Drop sentiment from 13 entirely and leave it with 12, where "live sentiment trends" already sits and is locked.

**6. What shape is "export traces to customer observability platforms"?**
*(a)* The NCS webhook we already have, plus a page naming the payloads. Nothing to build, and event 112 (the whole turn batch) may not be subscribable, which needs confirming with Engine first.
*(b)* A named destination list. That is a connector product, not a dashboard feature.
*(c)* Bulk delivery to the customer's own storage, which collides with the existing roadmap row "[O4.3-T1.d] Deliver recordings to customer storage".

**7. Is this surface project-wide or per-deployment?**
The PRD puts the inbound pilot metrics in "Inbound deployment › Overview KPIs" (`references/prd-q3-roadmap-execution-2026-07-29.html:201`); the tracker JTBD ("see agent health") reads as global. Answering global means every number needs a group-by, and group-by needs `labels` written at join time, which nothing writes today.
