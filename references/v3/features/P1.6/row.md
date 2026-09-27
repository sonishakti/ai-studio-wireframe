# P1.6 · Remove the cause of a failure  (phase P1, budget 0.25 d, sheet row #P1.6)

## Job
- Situation: Sam removes the cause of a failure and confirms the failure has stopped.
- Story: Sam wants to change the setting a log line points at without hunting through the builder, so the error stops and Sam can see that the error stopped.

## Happy path P1.6.a
1. On a log line, slow turn or error group, Sam clicks 'Open the setting'.
2. The builder opens on the mapped section with the field focused: turn detection, ASR, LLM and TTS to Voice & models (Advanced, that module); a tool to its integration row; telephony to the number or run; greeting or instructions to Prompt; a rejected key to the secret set Studio recorded.
3. One 'Back to <source>' chip sits at the top.
4. Sam saves; the builder offers 'Sessions since this change with this error' and 'Analytics since this change'.
5. Sam clicks the chip and returns to the same line, range and filters.

## Rainy paths
- **P1.6.b** Agent was saved after the session: Banner: 'Agent saved after this session; you are editing the current version'.
- **P1.6.c** Agent not linked, or the session was ephemeral: No door; one line says why.
- **P1.6.d** Agent deleted: Door disabled with the reason.
- **P1.6.e** Module unknown: Voice & models overview opens, never a guessed field.
- **P1.6.f** Secret set unknown (agent created through the API): Door disabled with the reason.
- **P1.6.g** Sam has no edit rights: Read-only view with the field highlighted.
- **P1.6.h** Unsaved edits when Sam goes back: Ask Save or Discard before leaving.
- **P1.6.i** The fix did not work: 'Sessions since this change with this error' lists new occurrences; the group is tagged Returned.
- **P1.6.j** Sam goes two levels deep (builder, then secret set): The chip returns one level at a time; nesting stops at two.

## Goal
- 4 in 10 error line opens reach the builder within 10 minutes, median 1 step.
- Target: ≥ 40 % of error log-line opens reach the builder within 10 min; median 1 step
- Counter: Wrong landing (another builder_section_opened within 60 s) ≤ 20 %; agent_reverted within 24 h ≤ 10 %
- Events: builder_opened {entryPoint, section, agentChangedSince} (port 1.0.0 + new entryPoint values log_line|turn|error_group|session_detail and new props section, agentChangedSince), builder_section_opened (port 1.0.0), monitoring_pivot {trigger: return_chip}, agent_updated, agent_reverted (derived)

## Scope (subtasks)
- Module-to-section map from observed values
- Field focus and highlight
- Return chip: same-origin only, unsaved-edit prompt, two-level nesting
- Saved-after banner and config-changed label
- Post-save confirmation doors

## API
- Partial. GET and PATCH /agents work; module_name on v2 events works; secret set from a Studio label only (credentials return mode only, decision 12); config at session time missing (G10).
- Register: 60 (new); 16, 23. Scope: one failure; the overall trend is P1.3. · Journeys: FX · Fix loop, FX-R · Fix with nothing to read, INT-R · Integration saved, not working, CO-R · Code first session fails

## Research already done (reuse, do not re-capture; paths relative to references/)
- Datadog: Partial. Desk. No log-to-config door exists; 'View in context' from v3/02-research/observability-patterns.md and monitoring-model.json learnings.
- LiveKit: Done. Docs, absent. v3/02-research/monitoring/shots/livekit-01-turnbyturn-playback.png and livekit-03-transcript-traces-logs-tabs.png show session views with no link to agent config; monitoring-model.json learnings agree.
- Vapi: Partial. Docs. v3/02-research/monitoring/shots/vapi-05-call-detail-reading.png shows the assistant name and version on the session header; whether it links to the editor is unconfirmed.
- Retell: Done. Docs. v3/02-research/monitoring/shots/retell-02-call-detail-panel.png: a View In Test Playground button in call detail, a session-to-agent door, plus agent id and version on the header.
- ElevenLabs: Done. Docs, absent. v3/02-research/monitoring/shots/elevenlabs-04-eval-results-in-conversation-history.png: results with no link back to their criterion (avoid).
- Bland: Done. Docs. v3/02-research/monitoring/shots/bland-02-call-detail-transcript-logs.png and bland-03-testbed-from-log-entry.png: 'Edit node' from a response, a visible button.
- Honeycomb: Done. Docs. v3/02-research/monitoring/shots/honeycomb-06-trace-click-to-query-reverse.png: reverse pivot from one field.
- Owed (only if a rainy path has no evidence at all): Owed: confirm whether Vapi's assistant name on the session header links to the editor, and open Retell's View In Test Playground. Question: how often the mapped section is the wrong one (the counter).

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
- P1.5: read only its `features/P1.5/summary.md` if it exists (never its full spec).

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
