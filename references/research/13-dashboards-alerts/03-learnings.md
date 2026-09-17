# 13 · Dashboards & alerts · Learnings from five vendor environments

Evidence: `02-research/_docs.md` (public docs, 2026-09-17) plus the product shots the browser agent
captures from the shot list. Five learnings, each one sentence, each changing something we draw.

1. **The alert rule is a threshold added to a tile, not a second form in a second place.** Vapi's
   trigger references an Insight, the same saved query a Board renders, and "When you configure a
   monitor's escalation thresholds in the Dashboard, the Insight is created automatically", while
   Retell puts Alerting beside Analytics as a peer dashboard tab and lets a rule reuse the same Post
   Call Extraction filters a chart uses: so the alert control on our Monitor is the spend cap's
   shape (`studio_x_2/components/usage-spend-card.tsx` :557-580, a metric, a threshold, a warning
   before the wall) attached to the tile itself, and `MetricCard` (`components/metric-section.tsx`
   :38-97) grows a threshold affordance rather than the product growing an Alerts page.
   *(https://docs.vapi.ai/observability/monitoring-quickstart ·
   https://docs.retellai.com/features/alerting-overview)*

2. **The rule form is two selects and a number, and it must ship its own all-clear.** Retell
   publishes eight valid window and frequency pairs (1 minute to 1 minute, up to 7 days to 24
   hours), two comparison modes ("Compare to certain value" · "Compare to last cycle"), a cap of
   **10 alert rules per workspace** and **100 agents** in one rule's filter, and holds "only one
   active incident per rule at a time" with a matching **"[Retell Alert Resolved] &lt;rule name&gt;"**
   email, while Vapi offers a raw cron of `minute` / `hour` / `dayOfWeek` arrays and delivers only
   `issue.created`: so we copy Retell's fixed matrix and its resolve notice, which is the same rule
   `studio_x_2/lib/analytics.ts` :71-72 already writes down for the spend cap, and we never ship a
   cron field.
   *(https://docs.retellai.com/features/alerting-overview ·
   https://docs.vapi.ai/observability/monitoring-quickstart)*

3. **The customer's own post-call field is the group-by, which is how sentiment and success ship
   without waiting on Engine.** Vapi exposes `artifact.structuredOutputs[OutputID]` three separate
   times, as a chart column, as a `groupBy` and as a filter, and Retell states it plainly: "Any
   field from your custom Post Call Extraction can drive a chart, which is how you track
   business-specific outcomes next to the standard metrics", with the same fields available as
   alert-rule filters: so the Console's existing custom evaluations
   (`ng-console/src/features/telephony/post-call-evaluation/post-call-evaluation-authoring.ts` :1-8,
   types `boolean | number | string`) must appear in the Monitor's group-by select and the alert
   filter, which answers brief questions 2 and 5 with a control that already exists instead of a
   missing Engine field.
   *(https://docs.vapi.ai/api-reference/insight/insight-controller-create ·
   https://docs.retellai.com/features/analytics-dashboard)*

4. **Trace export is a format select on the webhook we already ship, not a destination catalog.**
   ElevenLabs turns an existing workspace webhook into an OTLP exporter with one toggle
   ("OpenTelemetry transcript payloads", or `transcript_format: "opentelemetry"` in config) and names
   "Datadog, Grafana Tempo, Honeycomb, or any backend that ingests OTLP", Vapi does it with three
   credential fields on an Integrations page for one provider, and LiveKit does it with two
   environment variables and no UI at all: so 868kyv3yg is a payload-format row inside the webhook
   drawer that already ships (`ng-console/src/components/console/developers/sections/webhooks/
   webhook-drawer.tsx` :242-257, region · URL · events · secret), and the honest blocker to name on
   screen is that Agora's NCS list is seven numeric events with event 112, the turn batch, not among
   them (https://docs.agora.io/en/conversational-ai/develop/webhooks).
   *(https://elevenlabs.io/docs/eleven-agents/customization/opentelemetry-traces ·
   https://docs.vapi.ai/providers/observability/langfuse ·
   https://docs.livekit.io/deploy/observability/tracing/)*

5. **Every tile needs a definition line, because no voice vendor defines a single one of the five
   inbound pilot metrics.** Across Vapi, Retell, ElevenLabs and LiveKit there is no published
   definition of first-contact resolution, no answer-speed metric of any kind, and no sentiment
   scale, while Amazon Connect gives each metric its own formula page ("Average contact duration" =
   `(ContactTraceRecord.DisconnectTimestamp - ContactTraceRecord.InitiationTimestamp) / number of
   contact records`), splits metrics into "Contact record-driven" and "Agent activity-driven" so two
   numbers about one call can disagree on purpose, and publishes sentiment as "a score that ranges
   from -5 to +5" built from "Frequency" and "Sentiment streaks": so 868ka69vr's deliverable is one
   definition line per tile behind the `InfoHint` `MetricCard` already carries at :38-97, answer
   speed is marked **Requires Engine** on screen until a ring-start timestamp exists beside
   `create_ts` and `stop_ts`, and FCR gets no tile at all because not even the contact-centre
   product defines it.
   *(https://docs.aws.amazon.com/connect/latest/adminguide/metrics-definitions.html ·
   https://docs.aws.amazon.com/connect/latest/adminguide/historical-metrics.html ·
   https://docs.aws.amazon.com/connect/latest/adminguide/sentiment-scores.html)*

## Two facts worth carrying, which are not learnings on their own

**The 7-day window is not the weakness the brief feared.** LiveKit caps all observability data at a
"30-day retention window" that "applies to all observability data across all plans", and its
Analytics API refuses a `start` outside "within 7 days of the current date". Agora's turns API
keeping "sessions within the last 7 days" is market-normal for per-session evidence. The design call
in brief question 1 is therefore (b): keep the Studio aggregate's long ranges and label which store
each number comes from, using Connect's contact-record versus agent-activity split as the vocabulary.
*(https://docs.livekit.io/deploy/observability/insights/ · https://docs.livekit.io/home/cloud/analytics-api/)*

**Alerting hidden in an API is a shipped failure we can watch happen.** ElevenLabs' alerting exists
only as a changelog line, 2026-07-20, "Alerting webhook notifier schemas now identify a workspace
webhook with required `webhook_id`"; the docs page for it 404s and the agents-platform nav has no
alerting entry, so the feature is reachable only by reading the API schema. That is exactly what
option (a) in brief question 3 produces, and it answers "without asking an engineer" with "ask an
engineer".
*(https://elevenlabs.io/docs/changelog/2026/7/20 · https://elevenlabs.io/docs/eleven-agents/overview)*
