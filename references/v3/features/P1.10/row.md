# P1.10 · Follow a problem without restarting  (phase P1, budget 0.5 d, sheet row #P1.10)

## Job
- Situation: Sam follows one problem from the agent down to the evidence and back without starting over. Cross-cutting requirement, not a job step.
- Story: Sam wants to go back up from a log line to the agent without rebuilding filters, so the investigation keeps moving.

## Happy path P1.10.a
1. Every level has a URL: /agents/:id, /agents/:id/logs/:groupKey, /sessions/:id, and panels for session, turn and log line.
2. Going down adds one filter or overlay and a scope chip; going up removes only the leaf.
3. Breadcrumbs name the path (Agents / <agent> / Logs and diagnostics / <group>); Back and Esc close the innermost panel.
4. Lists restore filters, sort and scroll, with a 2 s highlight on the row Sam came from.
5. The URL carries an absolute range, project and context ids, which Copy link reuses (sharing is P2.4).
6. A pivot the API cannot serve stays visible, disabled, with one line on why.

## Rainy paths
- **P1.10.b** Pasted link with no trail: Structural breadcrumb; range widened to include the object, with a note.
- **P1.10.c** Link from another project: Switches project for members; request access otherwise.
- **P1.10.d** Parent is gone (agent or run deleted): Crumb shown as text with the reason.
- **P1.10.e** Pivot the API cannot serve: Visible, disabled, one line on why (api_gap, processing, zero_retention, ephemeral, not_linked, expired, role, no_access); never hidden, never a broken link.
- **P1.10.f** Old URLs (/agents/:id?rail=, /telephony/campaigns/:id, /agent-analytics?tab=): Redirect with every param kept.
- **P1.10.g** A shared link would show different data later: Copy link never writes a relative range; from and to are always absolute.
- **P1.10.h** Unsaved builder edits when Sam goes back: Ask Save or Discard.
- **P1.10.i** An up pivot would land on an empty list: Range widens to include the object Sam came from and says so.

## Goal
- Going back up keeps the range and filters 98 times in 100.
- Target: Integrity ≥ 98 %; dead-end rate ≤ 10 % of level views in the first release, ≤ 5 % once G4, G11 and G12 ship
- Counter: Range or filter changed within 10 s of an up pivot ≤ 10 %. This counter is the source of truth, because stateRestored is set by the restoring code and can report true on a bug.
- Events: monitoring_pivot {fromLevel, toLevel, trigger, direction, carried, stateRestored, countShown, visitId}, page_viewed {routePattern, referrerRoute}, time_range_changed, dead_end_viewed {level, control, reason}

## Scope (subtasks)
- URL scheme and key table with carry rules
- Breadcrumbs from structure plus via=
- Scope chips and overlays
- in= list stepping and full-screen exit
- Disabled pivot pattern
- Redirect map
- Parent map for pivot direction

## API
- Partial. Ids for agent, run, number and session work; group key derived (G11); log keys built by the adapter (G13); project scope held Studio-side (G15).
- Register: 57 (new), 62 (new); 30, 42. Cross-cutting requirement across P1 and P2; sharing a view moved to P2.4. · Journeys: IN · Inbound in Studio, BA · Batch run in Studio, CO · Code in Studio, FX · Fix loop, FX-R · Fix with nothing to read, EP-R · Ephemeral session fails, nowhere to look

## Research already done (reuse, do not re-capture; paths relative to references/)
- Datadog: Done. Docs. v3/02-research/monitoring/shots/datadog-03-service-traces-tab.png (facets keep the list scoped) and datadog-05-log-side-panel-context.png (panel over the list).
- LiveKit: Done. Docs. v3/02-research/monitoring/shots/livekit-01-turnbyturn-playback.png: breadcrumb 'Project / Sessions / id' over tabs.
- Vapi: Done. Docs. v3/02-research/monitoring/shots/vapi-05-call-detail-reading.png and vapi-04-call-logs-list.png: chevrons and X on detail, filter facets.
- Retell: Done. Docs. v3/02-research/monitoring/shots/retell-02-call-detail-panel.png: slide-over with arrows and X, list kept, filters in the URL.
- ElevenLabs: Done. Docs. v3/02-research/monitoring/shots/elevenlabs-02-workflow-analytics-node-inspector.png: 'See conversations' carries the filter; per-tab range reset as the counter-example.
- Langfuse: Done. Docs. v3/02-research/monitoring/shots/langfuse-04-filter-search-bar.png: filters in the URL, project and object in the path.
- Grafana: Done. Docs. v3/02-research/monitoring/shots/grafana-01-explore-split-view.png: whole view state in the URL; relative-range sharing as the counter-example.
- Twilio: Done. Docs. v3/02-research/monitoring/shots/twilio-02-call-log-dashboard.png: browser Back as the only way up (avoid).
- Owed (only if a rainy path has no evidence at all): Navigation research done (26 Sep, 12 vendors). Owed: test every up pivot for a non-empty landing (Honeycomb counter-example).

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
- P1.9: read only its `features/P1.9/summary.md` if it exists (never its full spec).

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
