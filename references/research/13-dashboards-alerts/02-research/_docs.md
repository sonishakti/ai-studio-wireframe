# 13 · Dashboards & alerts · the vendors, from their public docs (2026-09-17)

Stop 2, docs half. Every claim below comes from a page I fetched or a search index entry I name as
such. Where a page 404s or would not render a field list, I say so rather than fill it in. The
signed-in product is captured separately by a browser agent from the shot list at the end of this
handoff.

The question asked of all of them: **a customer wants to know their agents are healthy, wants to be
told when they stop being healthy, and wants the evidence in the tool they already watch. What
surface answers that, and what is the smallest thing they have to configure?**

Five vendors. The fifth, Amazon Connect, is here because the tracker's second task
(**868ka69vr**, define FCR · answer speed · handle time · escalation · sentiment) has **no answer at
all in the four voice vendors' docs**. None of them defines first-contact resolution or
time-to-answer anywhere, while Connect publishes a formula page per metric and lets a rule threshold
a trailing window of one. It is a contact-centre product, not a competitor for the agent build, and
it is cited only for the definition half.

---

## Vapi

**What it is called:** three surfaces under one nav group, **Observability**.

- **Boards**, the dashboard, at `dashboard.vapi.ai`. "Your board is automatically created on first
  visit", as "an empty 6-column grid layout where you can add insights"
  (https://docs.vapi.ai/observability/boards-quickstart).
- **Monitoring**, "Vapi's automated quality and effectiveness system for voice AI"
  (https://docs.vapi.ai/observability/monitoring-quickstart).
- **Integrations › Observability Providers**, the trace export
  (https://docs.vapi.ai/providers/observability/langfuse).

**The load-bearing object is the Insight, and both the chart and the alert read it.** An Insight is a
saved analytics query. Its request body
(https://docs.vapi.ai/api-reference/insight/insight-controller-create):

| Field | Allowed values |
|---|---|
| `name` | string |
| `type` | `bar` · `pie` · `line` · `text` |
| `queries[].type` | `vapiql-json`, the only value |
| `queries[].table` | `call` · `events` |
| `queries[].column` | strings: `id`, `artifact.structuredOutputs[OutputID]` · numbers: `cost`, `duration`, `averageModelLatency`, `averageVoiceLatency`, `averageTranscriberLatency`, `averageTurnLatency`, `averageEndpointingLatency`, `artifact.structuredOutputs[OutputID]` |
| `queries[].operation` | numbers: `average` · `sum` · `min` · `max` · strings: `count` · events table: `count` · `percentage` |
| `groupBy` | `assistantId` · `workflowId` · `squadId` · `phoneNumberId` · `type` · `endedReason` · `customerNumber` · `campaignId` · `artifact.structuredOutputs[OutputID]` |
| `timeRange.step` | `minute` · `hour` · `day` · `week` · `month` · `quarter` · `year` |
| `timeRange.start` / `end` | ISO 8601 or relative, "-7d" |
| `timeRange.timezone` | IANA string, UTC by default |

Two things in that table decide our design. **Per-component latency is a chartable column**, not a
detail buried in one session: `averageTranscriberLatency`, `averageModelLatency`,
`averageVoiceLatency`, `averageEndpointingLatency`, `averageTurnLatency`. And
**`artifact.structuredOutputs[OutputID]` appears three times**, as a column, as a `groupBy` and as a
filter, so the field the customer defined after the call is a first-class dimension everywhere.

**Boards.** Widget types: Text (for a single metric), Bar, Line, Pie. Time presets "Today, Yesterday,
Last 7 days, Last 30 days, This month, Last month" plus custom. Granularity Minute · Hour · Day ·
Week · Month · Quarter · Year. A fullscreen icon is offered "for TV displays or presentations". Two
stated limits: "Boards with 10+ complex insights may load slower", and "You can't group by minute for
a year of data". Pie charts "don't have time series grouping".

**Monitoring.** Four objects: **Monitors** ("define what to watch, which assistants to target, and
when to evaluate"), **Triggers** ("run on a schedule and evaluate call data against thresholds"),
**Issues** ("created when a threshold is exceeded, tracking problems from detection to resolution"),
and **Notifiers** (the channel). A monitor carries a category, one of **Technical** ·
**Infrastructure** · **Effectiveness** · **Compliance**, and a target; `"targets": "*"` covers "all
current and future assistants". A trigger references an Insight: "When you configure a monitor's
escalation thresholds in the Dashboard, the Insight is created automatically", but through the API
"you need to create the Insight first and reference its ID". Schedule is either `every` X minutes
(minimum 1) or cron-like `minute` / `hour` / `dayOfWeek` arrays. Severity is Error or Warning.
Notifiers are Email, Slack (via webhook URL), Webhook; a notifier's credential ID is copied by hand
into the trigger.

**What Vapi refuses.** "Monitoring currently requires retained call data", so a Zero Data Retention
organization cannot use monitors at all. Only `issue.created` is delivered; there is no second
webhook event per issue. Per-call p50 / p95 latency is not in the webhook payload. Triggers stay
quiet until the targeted assistants have calls.

**Trace export: one provider, three fields.** Dashboard › **Integrations** › **Observability
Providers** › Langfuse, with **Secret Key** · **Public Key** · **Host URL** (US
`https://us.cloud.langfuse.com` or EU `https://cloud.langfuse.com`). Traces go out for every
conversation. `call.metadata`, `assistant.metadata`, `assistantOverrides.metadata` and
`assistantOverrides.variableValues` ride along by default, and
`assistant.observabilityPlan.metadata` / `.tags` enrich them. Langfuse is the only provider listed.
The page does not say whether transcripts leave with the trace, which is a gap our own version must
not repeat.

**Where the numbers come from.** Every call is analysed when it ends: `call.analysis.summary`,
`call.analysis.structuredData`, `call.analysis.successEvaluation`, configured by `summaryPrompt`,
`structuredDataPrompt`, `structuredDataSchema`, `successEvaluationPrompt`, `successEvaluationRubric`
(https://docs.vapi.ai/assistants/call-analysis). The rubric is a closed list: `NumericScale` (1 to
10), `DescriptiveScale` (Excellent, Good, Fair, Poor), `Checklist`, `Matrix`, `PercentageScale`,
`LikertScale`, `AutomaticRubric`, `PassFail`. Analysis "typically completes within a few seconds".

---

## Retell AI

The most finished answer of the four, and the only one whose alert rule is documented field by field.

**What it is called:** **Analytics** (dashboards) and **Alerting** (rules), both top-level dashboard
tabs. Alerting has two sub-tabs, **Alerts** and **Alert History**
(https://docs.retellai.com/features/alerting-overview).

**Analytics** (https://docs.retellai.com/features/analytics-dashboard). The chart editor's fields:
**Graph Type** (column · bar · line · donut · number), a metric with a measurement (count, avg,
median, p90, sum, min, max, depending on the metric), **Time Range** ("Follow dashboard time range"
or its own), **Time Grouping** (Hour / Day / Week / Month), a **Previous Period Comparison** checkbox,
per-chart **Filters**, and **Breakdowns** of "up to five dimensions".

- Call metrics: 13, including Call Counts, Call Duration, End to End Latency, Concurrency Used,
  Combined Cost. Chat metrics: 6.
- Breakdown dimensions: agent, agent version, disconnection reason, call status, call successful,
  call type, **and Post Call Extraction fields**.
- Base filters: "agent, call ID, batch call ID, type, duration, from number, to number, user
  sentiment, disconnection reason, call status, call successful, end-to-end latency, and combined
  cost", plus custom fields from Post Call Extraction, Metadata and Dynamic Variables.
- Dashboard presets: Today, Last 7 days, Last 4 weeks, Last 3 months, All time.
- Stated plainly: "Any field from your custom Post Call Extraction can drive a chart, which is how
  you track business-specific outcomes next to the standard metrics."
- Limits: "10 dashboards per workspace"; charts render "at most 3,000 points".
- Refused: no API for dashboards ("Dashboards are built and read in the dashboard UI"); calls and
  chats cannot share one dashboard; a chart's filters merge with the dashboard's rather than
  overriding them.

**Alerting.** Fourteen metrics, with their API names:

| Group | Metrics |
|---|---|
| Call | `call_count` · `concurrency_used` · `call_success_rate` · `negative_sentiment_rate` · `custom_function_latency` · `custom_function_failure_count` · `transfer_call_failure_count` · `total_call_cost` |
| Chat | `chat_count` · `chat_success_rate` · `chat_negative_sentiment_rate` · `total_chat_cost` |
| QA | `qa_not_passed_count` |
| API | `api_error_count` |

Two threshold modes: **"Compare to certain value"** and **"Compare to last cycle"** (percentage
change between windows), with `gt` · `lt` · `ge` · `le`. The window and the evaluation frequency are
not free numbers; they are a published matrix of valid pairs:

| Window | Allowed frequency |
|---|---|
| 1 minute | 1 minute |
| 5 minutes | 1 · 5 minutes |
| 30 minutes | 5 · 30 minutes |
| 1 hour | 5 · 30 minutes · 1 hour |
| 12 hours | 30 minutes · 1 · 12 hours |
| 24 hours | 1 · 12 · 24 hours |
| 3 days | 12 · 24 hours |
| 7 days | 24 hours |

Filters on a rule: agents (optionally pinned to a version), environment tags, disconnection reason,
API error code, QA cohort (required for QA metrics), and **Post Call Extraction fields** again.
Channels: email, with the subject **"[Retell Alert] &lt;rule name&gt;"** and a matching
**"[Retell Alert Resolved] &lt;rule name&gt;"**; and webhook, POST with the payload under an
`"alert"` object, an `X-Retell-Signature` HMAC-SHA256 header, a **10-second timeout and no retries**.

Limits and refusals, all stated: **10 alert rules per workspace**, **100 agents** in one rule's
filter, **"only one active incident per rule at a time"**, no per-session automation ("use webhooks
from agents instead"), no public API for rules ("dashboard-only"), and no single-call reactions.
"Alerting monitors aggregate metrics only".

**AI QA** is a second, paid quality surface (https://docs.retellai.com/ai-qa/overview). It "scores
Retell calls on hallucination, knowledge base accuracy, latency, sentiment, and tool usage", over a
cohort you define by agent and date range with a sampling size, and produces "average score,
resolution rate, latency" plus per-call diagnostics backed by transcript evidence and a "Top
questions from users" view. Priced: "Free for the first 100 minutes of analyzed call time per
workspace. After that, it's priced at $0.10 per minute of analyzed call time." Its output feeds
alerting through `qa_not_passed_count`.

**Session history** (https://docs.retellai.com/features/session-history) is the evidence layer:
filters down to sentiment, outcome, end-to-end latency and analysis fields; CSV export that "uses
active filters", with transcript and PII-scrubbed transcript as export-only fields; **retention
indefinite by default, with a per-agent period of 1 to 730 days** for automatic deletion.

**Webhooks** (https://docs.retellai.com/features/webhook-overview): `call_started`, `call_ended`,
`call_analyzed`, `transcript_updated`, `transfer_started` / `_bridged` / `_cancelled` / `_ended`, and
the chat parallels. Configured account-level on "the dashboard's webhooks tab" or per agent by
`webhook_url`, and "If set, the account-level webhook URL will not be triggered". 10-second timeout,
up to 3 retries, `x-retell-signature`. No OTLP, no observability-platform destination.

---

## ElevenLabs (Agents Platform)

**What it is called:** **Analytics**, "Monitor performance metrics and conversation history"
(https://elevenlabs.io/docs/eleven-agents/overview), documented at
https://elevenlabs.io/docs/eleven-agents/dashboard, with a **Spotlight** tab for conversation
insights.

**The dashboard is fixed, not built.** Four tabs: **General**, **Tools**, **LLMs**, **Workflow**.
Metrics: "Call count", "Total duration", "Average duration", "Total cost", "Average cost", "Agent
response latency" (median and percentiles), "Error rate", "Error breakdown", "Active calls" in real
time, tool latency and error rates, LLM time-to-first-sentence, and turn-taking latency at p50, p90,
p99. Success and failure rates appear only "if evaluation criteria configured". Breakdown and filter
dimensions: agent, branch, call type, language, conversation source, LLM model, TTS model, ASR model,
tool type, error type, evaluation criteria, and "Node entered" on workflow conversations. Time ranges
are presets or a custom window, with granularity that auto-adjusts. **Nothing in the docs says a
board, a chart or a filter set can be saved.**

**The Workflow tab is the one idea nobody else has.** For an agent built on a workflow, it "overlays
usage metrics directly on the workflow graph", with "detailed inflow and outflow for every node". The
dashboard is the builder canvas with traffic drawn on it, so the place you read the number is the
place you change the behaviour.

**Spotlight · real-time insights**
(https://elevenlabs.io/docs/eleven-agents/dashboard/spotlight/real-time-insights; the parent
`/spotlight` page returned HTTP 500 on 2026-09-17). "Real-time insights show what is happening with
an agent now and what may need attention next." It reports "Conversation volume", "Success rate: The
share of evaluated conversations that passed your configured success criteria", and "Usage trends".
It then **suggests** rather than alerts: it detects patterns such as "conversations hitting duration
limits" and surfaces a recommendation. No threshold, no schedule, no channel. Refresh cadence and
plan gates are not documented.

**Alerting exists in the API and nowhere in the docs.** The only public trace is a changelog line,
2026-07-20: "Alerting webhook notifier schemas now identify a workspace webhook with required
`webhook_id` (string) instead of embedding `url`, `method` and `headers`", alongside "Agent platform
settings add alerting" (https://elevenlabs.io/docs/changelog/2026/7/20).
`https://elevenlabs.io/docs/eleven-agents/dashboard/alerting` is a 404, and the agents-platform nav
lists Analytics, Searching conversations, Conversation analysis, Users, Testing and Experiments with
no alerting entry. A customer can only reach it by reading the API schema. **This is the shipped
version of the mistake we would make if we put alert rules behind Developers.**

**Trace export is the strongest of the five, and it is a toggle on a webhook they already had**
(https://elevenlabs.io/docs/eleven-agents/customization/opentelemetry-traces). Dashboard path: create
a workspace webhook, assign it as the post-call webhook, enable the **"Transcript"** event, and turn
on **"OpenTelemetry transcript payloads"**. The same thing in config is
`platform_settings.workspace_overrides.webhooks` with `post_call_webhook_id`, `events: ["transcript"]`
and `transcript_format: "opentelemetry"`; the same thing on the read API is `format=opentelemetry`;
the same thing on the live socket is `events_format=opentelemetry`. Named backends: "Datadog, Grafana
Tempo, Honeycomb, or any backend that ingests OTLP". Span hierarchy: `elevenlabs.conversation` as
root, with `elevenlabs.recv.user_transcript`, `elevenlabs.recv.agent_response`,
`elevenlabs.tool.{name}` beneath, attributes under `elevenlabs.*`. Full transcripts are inside the
trace; "OpenTelemetry transcript webhooks do not include audio". Tool parameter and result attributes
truncate at 4 KB each.

**Delivery honesty, which is worth stealing.** A webhook is "auto disabled if there are 10 or more
consecutive failures and the last successful delivery was more than 7 days ago or has never been
successfully delivered", and "workspace admins receive an email notification" when that happens
(https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks).

**Real-time monitoring is enterprise-gated.** `wss://api.elevenlabs.io/v1/convai/conversations/
{conversation_id}/monitor`, "an enterprise-only feature", text and metadata only, "Only approximately
the last 100 events are cached", events "may not arrive in the same order", and you "must connect
after the conversation has started"
(https://elevenlabs.io/docs/agents-platform/guides/realtime-monitoring).

---

## LiveKit (Agents)

LiveKit has the deepest per-session evidence of the five and **no aggregate and no alert at all**.

**What it is called:** **Agent insights**, "found in the Agent insights tab in your project's
sessions dashboard" (https://docs.livekit.io/deploy/observability/insights/), under an
**Observability** section (https://docs.livekit.io/deploy/observability/).

**What it shows:** one unified timeline per session, carrying "Turn-by-turn transcripts for the user
and agent", "Tool calls and handoffs", "Session traces and metrics", "Runtime logs from the agent
server" and "Audio recordings". A trace is "broken into spans for every stage of the voice pipeline",
each span carrying token counts, durations and speech identifiers, inspected in a **Details** panel.

**What it does not show: any cross-session number.** The insights page documents per-session
timelines only. No KPI tile, no chart, no group-by, no filter, no search is documented. There is no
alerting anywhere in the observability docs.

**The numbers exist, in the SDK, as events the developer must collect themselves**
(https://docs.livekit.io/agents/ops/logging/). Six metric classes with exact fields: `VADMetrics`
(`idle_time`, `inference_duration_total`, `inference_count`), `STTMetrics` (`audio_duration`,
`duration`, `streamed`), `EOUMetrics` (`end_of_utterance_delay`, `transcription_delay`,
`on_user_turn_completed_delay`, `speech_id`), `LLMMetrics` (`ttft`, `duration`, `completion_tokens`,
`prompt_tokens`, `prompt_cached_tokens`, `tokens_per_second`, `speech_id`), `TTSMetrics` (`ttfb`,
`audio_duration`, `characters_count`, `duration`, `streamed`), `RealtimeModelMetrics` (`ttft`,
`duration`, `input_tokens`, `output_tokens`, `tokens_per_second`). Collection is by subscribing to
`metrics_collected`, reading `ChatMessage.metrics` per turn, or calling `ctx.make_session_report()`
at the end. Roll-ups are `LLMModelUsage`, `TTSModelUsage`, `STTModelUsage`, `InterruptionModelUsage`:
per-model totals, not per-deployment health.

**Trace export is code-only** (https://docs.livekit.io/deploy/observability/tracing/).
`OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS`, or
`set_tracer_provider(trace_provider, metadata=metadata, allow_pii=False)` in Python and
`telemetry.setTracerProvider(...)` in Node. Attributes come from two namespaces, `lk.*` ("speech IDs,
turn timings, and serialized metrics") and `gen_ai.*` (the OpenTelemetry GenAI conventions). Content
attributes are prefixed `lk.pii.` and gated behind `LIVEKIT_TELEMETRY_ALLOW_PII` and
`OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`. Langfuse is the only named backend; anything
that accepts OTLP works. **There is no dashboard control for it.** Log drains are the separate,
narrower path, and there the named destinations are "Datadog, CloudWatch, Sentry, and New Relic".

**The two retention numbers that constrain us most are LiveKit's.** Observability data carries a
**"30-day retention window" that "applies to all observability data across all plans"**, and the
Analytics API requires a `start` date **"within 7 days of the current date"**
(https://docs.livekit.io/home/cloud/analytics-api/). That API is two GET endpoints, sessions and
session detail, returning `sessionId, roomName, createdAt, endedAt, lastActive, bandwidthIn,
bandwidthOut, egress, numParticipants, numActiveParticipants, connectionCounts`, which is RTC
telemetry rather than agent quality, and it is "only available to LiveKit Cloud customers with a
Scale plan or higher".

**What the customer can switch off, per session:** a `record` parameter toggling audio, transcript,
traces, logs and PII redaction independently.

---

## Amazon Connect (the fifth, and why)

Added for one reason: **868ka69vr asks us to define FCR, answer speed, handle time, escalation and
sentiment, and none of the four voice vendors defines any of them.** Connect does, and the way it
does it is the deliverable.

**Every metric has its own definition page with a formula and a unit**
(https://docs.aws.amazon.com/connect/latest/adminguide/metrics-definitions.html). "Average contact
duration" is published as `(ContactTraceRecord.DisconnectTimestamp -
ContactTraceRecord.InitiationTimestamp) / number of contact records`, unit *hh:mm:ss*. Every rule and
report links to the anchor, so the number on screen is one click from its arithmetic.

**Metrics are split by what produces them, and the split is on the page**
(https://docs.aws.amazon.com/connect/latest/adminguide/historical-metrics.html). **Contact
record-driven metrics** are "based on formed contact record records", and a contact from 05:23 to
06:15 "contributes 52 minutes of metrics for the 06:00-06:30 interval". **Agent activity-driven
metrics** "reflect on the actual time the activity happens", and the same contact spreads 7 · 30 · 15
minutes across three intervals. Two numbers about one call, bucketed differently on purpose, and the
docs say so rather than letting a customer discover it in a disagreement. Reports can be customised,
**saved**, and **generated "using a recurring schedule that you define"**.

**A rule is a form over those same definitions**
(https://docs.aws.amazon.com/connect/latest/adminguide/rule-real-time-metrics.html). Navigation:
**Analytics and optimization** › **Rules** › **Create a rule** › **Real-time metrics**. Under
**When**, an event source: "There is an update in queue metrics", "...routing profile metrics",
"...agent metrics", "...flow metrics". Then **Metrics** cards, "up to 2 Metrics cards" with "up to 10
metrics to each", combined with a **Logic** setting of All or **Any**. The two card kinds are the
important part: one evaluates **real-time** metrics (Contacts in queue, Oldest contact age, Agents
available) and the other evaluates **"trailing windows of time"**, "the past x minutes or hours",
over **Average handle time**, **Average queue answer time**, Average agent interaction time, Average
customer hold time and **Service level**. Actions: **Create Task**, **Send email notification**,
**Generate an EventBridge event**. And the detail that makes the alert actionable: "You can type @ to
include the list of **agents, queues, flows or routing profile** that breached the metrics threshold"
inside the email or task.

**Sentiment is a published scale, not an adjective**
(https://docs.aws.amazon.com/connect/latest/adminguide/sentiment-scores.html). Each speaker turn is
classified positive, negative or neutral; two factors, "Frequency" and "Sentiment streaks", produce "a
score that ranges from -5 to +5 for each period of the call"; "The overall sentiment score is the
average of the scores assigned during each portion of the call." The surface is a **trendline** across
the contact, and the documented way to use it is the shape, not the value: contacts "that start with a
positive sentiment score but end with a negative score", and the reverse.

**Even Connect does not define first-contact resolution.** It ships the parts (categories, rules,
contact search, sentiment shift) and leaves the definition to the customer. So FCR has no vendor
precedent anywhere in this teardown, in any of the five.

---

## The comparison, on the six dimensions that decide our design

| | **Vapi** | **Retell** | **ElevenLabs** | **LiveKit** |
|---|---|---|---|---|
| **Can the customer change the dashboard?** | **Yes**: Boards, 6-column grid, drag in insights, 4 widget types | **Yes**: 10 dashboards per workspace, 5 chart types, up to 5 breakdowns, explicit Save | **No**: four fixed tabs, nothing documented as saveable | **No dashboard at all**: per-session timelines only |
| **Is there an alert rule?** | **Yes**: Monitor › Trigger › Issue › Notifier; `every` N minutes or cron; severity Error or Warning | **Yes, and fully specified**: 14 metrics, value or last-cycle comparison, 8 valid window/frequency pairs, 10 rules per workspace | **In the API only**: one changelog line, a 404 docs page, no nav entry | **No** |
| **Does the alert resolve itself?** | Issues track "from detection to resolution", but only `issue.created` is delivered | **Yes**: "[Retell Alert Resolved] &lt;rule name&gt;", "only one active incident per rule at a time" | none | none |
| **Can the customer's own post-call field be a dimension?** | **Yes**: `artifact.structuredOutputs[OutputID]` as column, `groupBy` and filter | **Yes**: Post Call Extraction fields as breakdowns, base filters and **alert-rule filters** | Only as a filter or breakdown value ("evaluation criteria"), not chartable | No |
| **Trace export to the customer's observability tool** | Langfuse only, 3 credential fields on an Integrations page | **None**: webhooks carry call JSON, no OTLP | **OTLP from the dashboard**: a webhook plus "OpenTelemetry transcript payloads"; Datadog · Grafana Tempo · Honeycomb | **OTLP from code only**: `OTEL_EXPORTER_OTLP_ENDPOINT`, `set_tracer_provider`, no UI |
| **How far back the numbers go** | Boards presets to "Last month" plus custom; monitors need retained call data, ZDR orgs excluded | Presets to **All time**; session retention indefinite by default, per-agent 1 to 730 days | Presets plus a custom window, not documented | **30 days for all observability data, all plans**; Analytics API `start` must be "within 7 days" |

Metric definitions, which is the part the voice vendors skip:

| | Handle time | Answer speed | Escalation | Sentiment | FCR |
|---|---|---|---|---|---|
| **Vapi** | `duration` column | none | `endedReason` as a groupBy | none | none |
| **Retell** | Call Duration metric | none | `transfer_call_failure_count`, failures only | `negative_sentiment_rate` plus a `user sentiment` filter, scale undocumented | none |
| **ElevenLabs** | "Average duration" | none | none | Spotlight sentiment, undocumented | none |
| **LiveKit** | session duration | none | none | none | none |
| **Amazon Connect** | **Average handle time**, own definition page, thresholdable over a trailing window | **Average queue answer time**, same | Transfer metrics plus rule categories | **-5 to +5**, frequency and streaks, published formula, drawn as a trendline | **not defined** |

---

## What nobody does

**Nobody connects the alert to the control that fixes it.** All five deliver a number to a place
outside the product: Vapi opens an Issue and emails it, Retell emails "[Retell Alert] &lt;rule
name&gt;" and POSTs an `alert` object, Connect sends an email or creates a task and lets you `@` the
queue that breached. Not one of them puts the door to the fix inside the alert. Connect gets closest
by naming the breaching resource, and it still stops at naming. Our sandbox already has the missing
half and has never joined it to anything: `lib/diagnostics.ts:88-93` turns a rule's `fixTarget` into a
deep link to the control that resolves it, and `lib/session-trace.ts:471-479` maps a slow span to the
setting that owns it. The whitespace is an alert whose body is the deployment, the number, the
threshold and the link to the field, and whose in-product twin is the Needs-attention card that
already exists at `monitor/page.tsx:147-189`.

**And nobody admits when a number is provably incomplete.** Every vendor ships a switch that removes
a session from the data: Vapi's ZDR, which disables monitors outright rather than showing a partial
number; LiveKit's per-session `record` toggles for audio, transcript, traces and logs; ElevenLabs'
conversation-history redaction; Retell's per-agent 1-to-730-day retention. Not one dashboard in the
five says, on the tile, how many sessions were excluded. Agora ships the same switch today, "Opt out
of data retention" (`ng-console/src/components/console/agent-advanced-page.tsx:189-192`, backed by
`parameters.opt_out`), and the repo already carries the rule for what to do about it:
`lib/session-trace.ts:41-44`, "a trace that silently mixes measured and modeled spans is worse than
none". A tile that reads "42 of 47 deployments · 5 opted out of retention" is a one-line change and
has no competitor.

The smaller third gap: **nobody shows a metric's arithmetic where the metric is shown.** Connect
publishes formulas on a separate documentation site; the four voice vendors publish none. The live
Console's headline success number is produced by a sentence the customer typed into a box on one
phone number (`ng-console/src/lib/telephony/phone-number-contracts.ts:7-8`, :96-98) and nothing on the
Monitor tab says so.

---

## What this changes before the learnings file

Three of the seven open questions in `00-brief.md` have a market answer and should go to the owner
that way, not as open design choices:

- **Question 3, where an alert's condition lives.** Option (c) is what two of the four shipped: the
  rule reads the same saved query the tile reads (Vapi's Insight), and delivers through the channel
  table that already exists. Nobody built a separate alerts product.
- **Question 4, does "self-serve" mean a builder.** Two of four ship a builder, two ship fixed tabs,
  and the builders are small: four widget types and five chart types, both capped at 10 boards or 10
  heavy insights. The XL reading of 868kykbfc is not what the market built.
- **Question 5, sentiment has no Engine field.** Option (a) is the market default. Retell alerts on
  `negative_sentiment_rate` without publishing a scale; Connect publishes `-5 to +5` with the formula.
  If we ship sentiment as a customer-authored post-call evaluation, Connect is the standard to match:
  the scale and its arithmetic sit next to the number.

And one answer the market gives that the brief did not ask for: **question 1's fear is misplaced.**
LiveKit caps all observability at 30 days on every plan and its analytics API at 7, so a 7-day window
on per-session evidence is normal rather than a visibly weaker product. The honest design is option
(b), keep the long ranges on the Studio aggregate and say which store each number comes from, and the
market gives us the vocabulary for it in Connect's "contact record-driven" versus "agent
activity-driven" split.
