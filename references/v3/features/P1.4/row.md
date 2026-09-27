# P1.4 · Find what fails in an agent and why  (phase P1, budget 0.5 d, sheet row #P1.4)

## Job
- Situation: Sam finds out what is failing and why, so each cause is fixed once, not session by session.
- Story: Sam wants the cause behind '2 error groups' on the agent, so Sam can fix the cause once instead of chasing six sessions.

## Happy path P1.4.a
1. Logs and diagnostics (agent tab /agents/:id/logs, project view /logs) lists groups '<module> · <event type>' with severity, sessions, first and last seen, a sparkline and tags New, Quiet, Returned, New since change; every cell is a link.
2. Sam opens a group; the panel shows count over time with the last-change marker and 'Since your change: N occurrences'.
3. Sam steps through the affected sessions one by one; a sample line shows the failing log line.
4. Doors lead to the setting, secret set, integration, run or number (P1.6), plus 'View all N sessions'.
5. A separate tests line links to test sessions, kept apart from production.
6. The project view adds 'No agent' and 'Agent not linked' buckets and groups from deleted agents.

## Rainy paths
- **P1.4.b** No errors in range: 'No errors since <date>'.
- **P1.4.c** Error stream unavailable: 'Errors unavailable', never 'No errors'.
- **P1.4.d** Failure with no session (session never created, billing, number): 'No session' rows in the project view with a door to the number or billing.
- **P1.4.e** A run failed: Campaign.failure shows as one group, linked to the run.
- **P1.4.f** No stable error code: Key <module_name>:<event_type>, marked approximate; warnings hidden while none can be derived.
- **P1.4.g** Errors from a deleted agent: The group stays in the project view, tagged 'Agent deleted'; doors are disabled with the reason.
- **P1.4.h** A group key changes after a code update: The old key redirects to its successor; links keep working.
- **P1.4.i** Session content not kept (zero retention or expired): The count stays; the sample line reads 'Zero retention' or 'Expired', never empty.
- **P1.4.j** A fixed error comes back: Tag Returned, listed first, with 'Since your change: N occurrences'.

## Goal
- Median path from an error to its cause is at most 4 steps and under a minute.
- Target: Median ≤ 4 steps and ≤ 60 s (p75 ≤ 6 steps and ≤ 120 s). Details: acknowledgement median ≤ 24 h.
- Counter: Log line left in under 5 s ≤ 30 %; groups unopened at 7 d ≤ 10 %
- Events: logs_opened {scope: agent|project}, error_group_opened {groupKey, module, surface, tags}, monitoring_pivot {fromLevel: errgroup}, session_opened {surface: error_group}, log_line_opened {severity, module, surface: error_group}, empty_state_viewed {surface}, session_ended (G2, no owner), error_group_quiet (derived, needs G11), session_create_failed (G1, G16, no owner)

## Scope (subtasks)
- Group row with tags and linked cells
- Group key and approximate marker; key versioning and redirects
- Project view with No agent and Agent not linked buckets
- Panel: count over time, change marker, since-change count, affected list with in=group
- States: no errors, unavailable, quiet, returned, loading

## API
- Missing in v3. No error stream or stable codes (G11); no error filter (G12). Partial through v2 events and debugging tasks has_error (decision 15). Campaign.failure works. Sessionless errors need session_create_failed (G1, G16).
- Register: 27, 28, 29; 57 (new) · Journeys: IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, FX · Fix loop, FX-R · Fix with nothing to read, INT-R · Integration saved, not working

## Research already done (reuse, do not re-capture; paths relative to references/)
- Datadog: Done. Docs. v3/02-research/monitoring/shots/datadog-06-error-tracking-issue-details.png and datadog-05-log-side-panel-context.png: lifecycle strip, New and Regression, samples with linked logs.
- LiveKit: Done. Docs and Product. v3/02-research/monitoring/shots/livekit-03-transcript-traces-logs-tabs.png (session logs) and competitors/product/livekit/livekit-13-agents-observability-dashboard.png ('Dispatch errors' with no drill, avoid).
- Vapi: Done. Product and Docs. competitors/product/vapi/vapi-12-logs-ended-reason.png and sip-call-detail-ended-reason.png, v3/02-research/monitoring/shots/vapi-01-debugging-overview.png; Monitors and Issues from desk only (competitor-monitoring.md).
- Retell: Done. Docs and Product. v3/02-research/monitoring/shots/retell-03-alerting-rules.png and competitors/product/retell/retell-13-alerting-*.png: rule alerts, no grouping by cause.
- ElevenLabs: Done. Docs. v3/02-research/monitoring/shots/elevenlabs-03-tools-tab-error-rate-latency.png: tool error rate with no drill (avoid).
- Sentry: Done. Docs. v3/02-research/monitoring/shots/sentry-01-issue-details-breakdown.png and sentry-03-trace-related-issue.png: 'View More Events', sibling issues.
- Twilio: Done. Docs. v3/02-research/monitoring/shots/twilio-04-alarms-config.png: alarms with no link to the session that tripped them (avoid).
- Owed (only if a rainy path has no evidence at all): Owed: Vapi Monitors and Issues as shots (desk only today); Retell alert history with a fired alert. Baseline task: 5 owners on the current Console, timed from error to cause.

## Monitoring research index (references/v3/02-research/monitoring/, 61 shots; pick from here, no browsing)
- Datadog: shots/datadog-01-service-page-overview.jpg · APM Service Page top-level overview: service health summary, service monitor panel, Watchdog Insights carousel
- Datadog: shots/datadog-02-service-resources-tab.jpg · Service page Resources tab: per-endpoint requests/latency/error breakdown, sortable columns
- Datadog: shots/datadog-03-service-traces-tab.jpg · Service page Traces tab: trace list pre-filtered by service/env/operation, facet sidebar for status/resource/e
- Datadog: shots/datadog-04-frontend-activity-side-panel.jpg · Frontend Activity side panel on the service page: connects backend service to RUM journeys/operations/views an
- Datadog: shots/datadog-05-log-side-panel-context.jpg · Log Explorer side panel showing log context (infra/app tags) above content (message + structured attributes), 
- Datadog: shots/datadog-06-error-tracking-issue-details.jpg · Error Tracking Explorer issue detail: lifecycle header (first/last occurrence, count-over-time) plus lower err
- LiveKit (Agent Insights / Agent Observability, LiveKit Cloud): shots/livekit-01-turnbyturn-playback.jpg · Marketing screenshot of the real session-detail header: breadcrumb 'Meet / Sessions / RM_Zy2zLvfR5NX9' sitting
- LiveKit (Agent Insights / Agent Observability, LiveKit Cloud): shots/livekit-03-transcript-traces-logs-tabs.jpg · PII-redaction feature illustration showing the Agent insights player for session 'LK_VOICE_4960scj290fe' with 
- LiveKit (Agent Insights / Agent Observability, LiveKit Cloud): shots/livekit-04-capability-list.jpg · The left-hand capability list for the observability product page, cleanly visible: 'Turn-by-turn playback / De
- LiveKit (Agent Insights / Agent Observability, LiveKit Cloud): shots/livekit-05-insights-view-screenshot.jpg · The page's 'Resources to help you learn and ship' row: a tutorial-video thumbnail (binoculars person, playback
- Vapi + Retell: shots/vapi-01-debugging-overview.jpg · Vapi's 'Debugging voice agents' doc page: the left-nav table of contents enumerating every debugging surface (
- Vapi + Retell: shots/vapi-02-call-recording-dashboard.jpg · Product screenshot of an assistant's 'Recording & Artifacts' config panel: Audio Recording / Logging / Transcr
- Vapi + Retell: shots/vapi-03-simulations-advanced-a.jpg · Product screenshot of the Simulations 'Tool mocks & webhooks' tab, with the full Observability left-nav visibl
- Vapi + Retell: shots/vapi-04-call-logs-list.jpg · Product screenshot of 'The Calls tab in Logs': tab strip (Calls/Chat/Sessions/Webhooks/API), a filter row (Tim
- Vapi + Retell: shots/vapi-05-call-detail-reading.jpg · Product screenshot of 'Reading a single call': header row (Call ID / Assistant Name+version / Customer, each w
- Vapi + Retell: shots/retell-01-call-history-list.jpg · Product screenshot of the Call History table: Date Range + Filter + Actions controls above columns Time/Durati
- Vapi + Retell: shots/retell-02-call-detail-panel.jpg · Product screenshot of the full three-pane flow: Call History list (left) -> an opened call's detail (recording
- Vapi + Retell: shots/retell-03-alerting-rules.jpg · Product screenshot of the full dashboard left nav (BUILD/DEPLOY/MONITOR/SYSTEM) with Alerting selected, showin
- Vapi + Retell: shots/retell-04-analytics-dashboard.jpg · Product screenshot of the Call Dashboard: number tiles (Call Counts 95, Call Duration 20s, Call Latency 1555ms
- Vapi + Retell: shots/retell-05-data-storage-settings.jpg · Product screenshot of an agent's Security & Fallback Settings > Data Storage Settings panel: three radio optio
- ElevenLabs + Bland: shots/elevenlabs-01-analytics-general-tab.jpg · ElevenLabs Analytics dashboard, General tab: call count, average duration, total cost, call volume over time —
- ElevenLabs + Bland: shots/elevenlabs-02-workflow-analytics-node-inspector.jpg · Workflow analytics tab: per-node entries, durations, terminations and edge flow overlaid on the workflow graph
- ElevenLabs + Bland: shots/elevenlabs-03-tools-tab-error-rate-latency.jpg · Analytics dashboard, Tools tab: average error rate and average tool latency grouped by tool type — the aggrega
- ElevenLabs + Bland: shots/elevenlabs-04-eval-results-in-conversation-history.jpg · Evaluation criteria results (success/failure/unknown + rationale) rendered inline inside a single conversation
- ElevenLabs + Bland: shots/elevenlabs-05-data-collection-in-conversation-history.jpg · Data collection results (extracted structured fields) shown alongside the transcript inside a single conversat
- ElevenLabs + Bland: shots/bland-01-call-logs-table.jpg · Bland Call Logs table (Completed tab): ID, direction, to/from, duration, started, status, version, tags, pathw
- ElevenLabs + Bland: shots/bland-02-call-detail-transcript-logs.jpg · Bland call detail view: transcript with expanded per-turn logs, variable extraction, loop-condition scoring, a
- ElevenLabs + Bland: shots/bland-03-testbed-from-log-entry.jpg · Testbed button surfaced directly on a variable-extraction / loop-condition log entry inside call detail — the 
- ElevenLabs + Bland: shots/bland-04-norm-dashboard-triage-context.jpg · The Norm chat interface inside the Bland dashboard — the surface that sits behind 'Flag for triage' and 'Norm 
- Sentry + Grafana + Honeycomb: shots/sentry-01-issue-details-breakdown.jpg · Issue Details page layout: header, event graph, stack trace, breadcrumbs, trace preview, tags, sidebar (first/
- Sentry + Grafana + Honeycomb: shots/sentry-02-breadcrumbs.jpg · Breadcrumb list embedded inline in Issue Details, with a View All button that opens the full slide-out drawer 
- Sentry + Grafana + Honeycomb: shots/sentry-03-trace-related-issue.jpg · Trace Related Issue callout: when the current event's trace also touches another issue, Sentry surfaces a dire
- Sentry + Grafana + Honeycomb: shots/sentry-04-trace-explorer.jpg · Trace Explorer query screen: a query bar over spans/traces, a duration chart, and a sample table with Span ID 
- Sentry + Grafana + Honeycomb: shots/sentry-05-trace-explorer-low-samples-warning.jpg · Rainy state: an inline warning banner shown when the aggregate numbers are extrapolated from a low span sample
- Sentry + Grafana + Honeycomb: shots/sentry-06-release-details-issues.jpg · Release Details page: an adoption/session-health graph plus a table of issues scoped to that release, with an 
- Sentry + Grafana + Honeycomb: shots/grafana-01-explore-split-view.jpg · Explore split view: two independent query panes side by side, each with its own datasource and time picker, li
- Sentry + Grafana + Honeycomb: shots/grafana-02-correlation-source.jpg · Correlations editor, step 1: picking the source datasource and field (e.g. a log field) that a correlation lin
- Sentry + Grafana + Honeycomb: shots/grafana-03-correlation-result-link.jpg · Result of clicking a configured correlation link: the extracted field value is interpolated into a new query a
- Sentry + Grafana + Honeycomb: shots/grafana-04-trace-view-correlations-to-logs.jpg · Trace view span detail panel with a correlation-generated link that jumps out to the matching Loki logs for th
- Sentry + Grafana + Honeycomb: shots/honeycomb-01-trace-waterfall-overview.jpg · Trace waterfall with every region outlined: trace summary header, span search, span tree, and the right-hand s
- Sentry + Grafana + Honeycomb: shots/honeycomb-02-trace-missing-spans.jpg · Rainy state: a trace rendered with a named missing-spans warning banner and a link to the troubleshooting doc,
- Sentry + Grafana + Honeycomb: shots/honeycomb-03-bubbleup-sandbox.jpg · BubbleUp comparison view: a selected region of a graph is auto-compared against the rest of the dataset across
- Sentry + Grafana + Honeycomb: shots/honeycomb-04-bubbleup-selection.jpg · BubbleUp selection gesture: dragging a box over the outlier points on a query result graph before running the 
- Sentry + Grafana + Honeycomb: shots/honeycomb-05-click-line-to-trace.jpg · Query result -> trace pivot: clicking a point on the result line/heatmap opens a small menu offering View trac
- Sentry + Grafana + Honeycomb: shots/honeycomb-06-trace-click-to-query-reverse.jpg · Reverse pivot: from inside a trace, a span field's three-dot menu (GROUP BY / WHERE) builds a new query that r
- Langfuse + LangSmith: shots/langfuse-01-session-view.jpg · Langfuse docs 'Sessions' page embedded product screenshot: a session replay page listing the ordered traces (t
- Langfuse + LangSmith: shots/langfuse-02-trace-timeline.jpg · Langfuse docs 'Observability overview' hero screenshot: one trace open, nested observation tree on the left, t
- Langfuse + LangSmith: shots/langfuse-03-dashboard-analytics.jpg · Langfuse docs 'Metrics & Analytics' overview screenshot showing chart widgets (latency/cost/usage trend lines)
- Langfuse + LangSmith: shots/langfuse-04-filter-search-bar.jpg · Langfuse docs 'Filter search bar' page: the single-line query syntax box (level:ERROR type:TOOL environment:pr
- Langfuse + LangSmith: shots/langfuse-05-users-list.jpg · Langfuse docs 'User Tracking' page, first screenshot: the Users list table (aggregated token usage, trace coun
- Langfuse + LangSmith: shots/langfuse-06-user-detail.jpg · Langfuse docs 'User Tracking' page, second screenshot: the User Detail view showing that user's aggregated met
- Langfuse + LangSmith: shots/langsmith-01-filter-toolbar.jpg · LangSmith docs 'Filter traces' page: the project-level filter toolbar — scope selector ('in any run'), search 
- Langfuse + LangSmith: shots/langsmith-02-scope-selector.jpg · LangSmith docs 'Filter traces' page: the scope dropdown open (Any run / Root run / Thread) with a live preview
- Langfuse + LangSmith: shots/langsmith-03-trace-highlighting-details.jpg · LangSmith docs 'Filter traces' page: an open thread's Details view — left pane is the Turns/run tree with a fi
- Langfuse + LangSmith: shots/langsmith-04-alert-metrics.jpg · LangSmith docs 'Alerts' page: the Alert Preview chart (Average Latency, last 3 hours) with a red-shaded band m
- Twilio: shots/twilio-01-insights-dashboard-trends.jpg · Call Insights Dashboard top-level: the persistent filter bar (Time range : Last 15 days, From number, To numbe
- Twilio: shots/twilio-02-call-log-dashboard.jpg · The dashboard's connection-rate/quality widgets with the phone icon docs call out as the click target that dri
- Twilio: shots/twilio-03-call-summary.jpg · A single Call Details page: Call Sid selector at top, then the three tabs Details / Insights Summary / Metrics
- Twilio: shots/twilio-04-alarms-config.jpg · Alarm creation UI: error-type condition, threshold value, and time-period selector (5 min / 15 min / 1 hr / 12
- Twilio: shots/twilio-05-event-stream-timeline.jpg · The Metrics tab of a Call Summary page: Event Stream sub-tab showing a horizontal timeline of ICE/connection/n
- Twilio: shots/twilio-06-event-list-view.jpg · Same Metrics tab, Event List sub-tab: a plain timestamp+event table (connection:ringing, ice-candidate:ice-can

## Previous row
- P1.3: read only its `features/P1.3/summary.md` if it exists (never its full spec).

## Locked vocabulary
- use **integration**, never: app (alone), connection, connector, plugin, add-on; 'integrate' for SDK or code work
- use **app integration**, never: connector, app (alone), connection
- use **MCP server**, never: MCP connection, MCP app, connector
- use **tool**, never: function, custom function, action; webhook as a synonym for tool
- use **knowledge base**, never: KB (in UI), RAG, docs, files
- use **webhook**, never: tool, callback, integration
- use **deployment**, never: channel (alone), connection, connect, publish, integration
- use **deployment type**, never: channel type, agent type, mode, modality
- use **inbound**, never: receive calls, phone deployment
- use **batch**, never: outbound (as a type), bulk calling, campaign (as a type)
- use **code**, never: SDK, web SDK, embed, iframe, widget, app, API channel
- use **direction**, never: call type, mode
- use **Go live**, never: publish, deploy (verb), launch, activate, connect
- use **number**, never: line, DID, connection, transport identifier
- use **run**, never: campaign (for one execution), batch job, blast
- use **calling window**, never: schedule window, dialing hours
- use **Run again**, never: rerun, retry run, redial
- use **transport**, never: channel, connection, deployment, modality
- use **SIP protocol**, never: transport (for SIP)
- use **RTC channel**, never: channel (alone), room
- use **session**, never: call, conversation, chat, interaction
- use **test**, never: preview, demo, sandbox, trial, playground
- use **production**, never: live, real, prod, deployed
- use **running**, never: live, active, in progress
- use **answer**, never: response, reply, first audio, TTFAB
- use **proven session**, never: successful call, real call, verified call
- use **ephemeral session**, never: temporary agent, inline agent, anonymous session
- use **zero retention**, never: private, no-log, not kept, incognito
- use **expired**, never: deleted, gone, not kept
- use **preset**, never: template, tier, stack, bundle
- use **configured**, never: edited, customised, personalised
- use **secret**, never: credential, vault, API key (alone), token
- use **BYOK, managed**, never: own keys, custom keys, Agora keys, byo
- use **simulation**, never: test, scenario test
- use **error group**, never: issue, incident, alert, error dot
- use **free minutes**, never: credits, trial balance, quota
- use **minutes banner**, never: meter, alert bar
- use **suspended**, never: paused, blocked, disabled, locked
- use **Analysis**, never: structured output (in UI), evaluation, scoring
- use **project**, never: app, workspace
- use **agent**, never: assistant, bot, persona
