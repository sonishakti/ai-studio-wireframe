# 13 · Dashboards & alerts — JTBD, all types

ClickUp: [13 · Dashboards & alerts](https://app.clickup.com/t/868m0mewr) (Design Tracker, monitor · P1, L · 17 days, no wave).
Roadmap tasks: [Build self-serve analytics dashboards, monitors and alerts](https://app.clickup.com/t/868kykbfc) ·
[Define inbound pilot metrics for FCR, answer speed, handle time, escalation and sentiment](https://app.clickup.com/t/868ka69vr) ·
[Export Studio agent traces to customer observability platforms](https://app.clickup.com/t/868kyv3yg).
Intake: `00-brief.md`. Docs teardown: `02-research/_docs.md`. Learnings: `03-learnings.md`.

## Headline JTBD

**When my agent is live and taking real calls without me watching it, I want the product to tell me
the moment a number I care about slips and to put the fix one click away, so I can put it right
myself before the next caller hears it instead of waiting for someone to read the logs for me.**

Two people say that sentence and they are not the same person. The one who reads is the product
manager or the founder who wants account health at a glance (personas P2 and P4, `LEARNINGS.md:44-50`);
the one who can change the setting is the integrating developer (P1). "Without asking an engineer"
is the whole job: today the reader's only route to a cause is to ask P1, and P1's only route is
`GET /v2/projects/{appid}/agents/{agentId}/turns`.

## The success event

Nothing in `references/telemetry/event-spec.json` fits. Its 42 events are all builder-side; the only
post-deploy anchors are `first_live_call_received`, `call_reviewed`, `agent_edited_after_live` and
`deployment_rolled_back`. `studio_x_2/lib/analytics.ts` carries `monitor_viewed` (:124) and
`diagnostics_queue_viewed` (:141), and both are page views, which is the rejected KPI shape.

Two events, proposed in the spec's shape. The second is the success event.

```json
{
  "name": "alert_received",
  "when": "Server-anchored, like first_live_call_received. A standing rule evaluates to breached and the notification is accepted by at least one channel. One event per incident, not per delivery, and never a second event while the same incident is open.",
  "properties": [
    "alertRuleId", "metricKey (enum: answer_rate | handle_time | escalation_rate | e2e_latency | error_rate | custom_evaluation)",
    "thresholdKind (value | previous_cycle)", "severity (warning | error)",
    "deliveryChannel (email | in_app | slack | webhook)", "agentId", "deploymentId",
    "deliveryResult (accepted | failed | suppressed)"
  ],
  "feeds": ["Denominator for alert-to-fix rate", "Noise counter: incidents with no alert_fix_opened in 24 h"],
  "priority": "P0",
  "hookPoint": "the rule evaluator, wherever question 3 in 00-brief.md lands it"
}
```

```json
{
  "name": "alert_fix_opened",
  "when": "THE SUCCESS EVENT. The link inside a fired alert is opened and lands on the control that owns the breaching number, from any surface: the Needs attention card, the email, Slack, or the notification centre. Once per incident; a second click in the same incident is not a second success.",
  "properties": [
    "alertRuleId", "metricKey", "severity", "deliveryChannel",
    "fixTarget (the enum lib/diagnostics.ts already carries)", "agentId", "deploymentId",
    "durationMs (alert_received to this, winsorised at 900000 per the spec's duration rule)",
    "trigger (user | auto)"
  ],
  "feeds": [
    "Alert-to-fix rate: alert_fix_opened / alert_received. The only honest measure of 'without asking an engineer'",
    "Retain: alert_fix_opened, then agent_edited_after_live or deployment_rolled_back, keeps a live deployment carrying traffic (north star, CLAUDE.md:42)",
    "Time to fix: the durationMs distribution, bucketed"
  ],
  "priority": "P0",
  "hookPoint": "studio_x_2/app/(dashboard)/monitor/page.tsx:167, the fixHref on the Needs attention card, and lib/diagnostics.ts:88-93, which already turns a rule's fixTarget into a deep link to the control that resolves it"
}
```

**Pairing rule**, the same shape as the spend cap's at `studio_x_2/lib/analytics.ts:71-72`
("a cap hit with no prior alert is the failure these events exist to catch"): `alert_received` must
precede the `agent_edited_after_live` or `deployment_rolled_back` that follows a degradation on that
deployment. An edit made after a customer complained, with no alert before it, is the miss this
feature exists to prevent, and it is measurable.

**Property rules carried over.** No property holds text a user typed (`event-spec.json` rules), so
the rule's name and the customer's evaluation sentence never ride along, only stable ids; `metricKey`
is a closed enum; every new key goes on the `ng-console/src/lib/observability/sanitize.ts` allowlist
first or it is dropped silently.

**Rejected.** `monitor_viewed` counts, time on the dashboard, session length, DAU (`CLAUDE.md:154`).
Also rejected: dashboards created, rules created, tiles added. A rule nobody ever acts on is the
failure, not the goal.

**One honesty note.** `alert_fix_opened` can only fire if the condition lives in our product
(`00-brief.md` question 3, option c). Under option (a), where alerts are the customer's own webhook,
nothing in Studio fires, nothing here is measurable, and the JTBD's own words are answered with "ask
an engineer". ElevenLabs is the shipped proof: its alerting exists as one changelog line, a 404 docs
page and no nav entry (`03-learnings.md`).

## Happy scenario

1. "Answer rate is the number my boss asks about, so I set that tile to tell me when it drops under
   90 percent in an hour."
2. "Tuesday at nine an email arrives with the deployment's name in the subject line and the number in
   the first line."
3. "I click through and land on the tile itself, on the hour that broke, not on the front page."
4. "Under the number it says which nine calls failed and what stopped them."
5. "The card links straight to the setting that caused it, so I change the transfer timeout myself."
6. "An hour later a second email says it is back over 90 percent, and I stop thinking about it."

## Rainy scenarios

1. **Nothing is configured yet.** "Nobody has told this page what a bad number looks like, so it will
   sit here being calm while the agent fails." (Nothing in either product fires on a condition derived
   from traffic; the one user-settable threshold in the whole product is the spend cap,
   `studio_x_2/components/usage-spend-card.tsx:557-580`.)
2. **No traffic yet.** "I deployed an hour ago, every tile is empty, and I cannot tell whether it is
   broken or just quiet." (Zero-traffic gate at `studio_x_2/app/(dashboard)/monitor/page.tsx:95-102`;
   Vapi's triggers stay quiet until the targeted assistants have calls, `02-research/_docs.md`.)
3. **The number I was told to report does not exist.** "The pilot review asks for first contact
   resolution and answer speed, and neither one is on the list." (A call carries `create_ts` and
   `stop_ts` and nothing between them, so time to answer cannot be computed; no vendor of the five
   defines FCR, not even Amazon Connect, `03-learnings.md` #5.)
4. **Retention is off on some agents.** "It says 94 percent and I do not know what it is 94 percent
   of, because three of these agents are set to keep nothing." (`parameters.opt_out`, shipped as "Opt
   out of data retention" at `ng-console/src/components/console/agent-advanced-page.tsx:189-192`; not
   one dashboard in the teardown states its excluded count.)
5. **The thing that produces the number is switched off.** "My success number went flat and it turns
   out someone turned transcripts off on that phone number last week." (The write is gated on
   `enableLlmCallEvaluation && enableTranscript && agentId`,
   `ng-console/src/lib/telephony/phone-number-contracts.ts:68-69`; per-turn metrics need
   `enable_metrics`, which only takes effect when `advanced_features.enable_rtm` is true,
   `StartAgentsRequest.d.ts:658-659`.)
6. **The data has not arrived yet.** "I hung up thirty seconds ago, the call is not here, and I have
   refreshed four times to check I am not imagining it." (Vapi's post-call analysis "typically
   completes within a few seconds"; the state inventory for this screen already specifies "Data lags
   by ~3 minutes", `references/analytics-rebuild.md:88-128`.)
7. **The range runs out under me.** "I opened last quarter to compare and the call counts go all the
   way back while the latency stops after a week." (The turns API says "You can query sessions within
   the last 7 days"; the live Console offers 90 days plus a custom range reaching 365 days back,
   `ng-console/src/components/console/telephony-page.tsx:1926`.)
8. **Two screens, two answers.** "The Console says 82 percent for last week, Studio says 74, and I
   have to walk into a meeting holding one of them." (Aggregates come from Studio's
   `campaigns/analytics` and `call-history-overview`,
   `ng-console/src/server/console-backend/telephony.ts:1336,1362`, while per-session evidence comes
   from the Engine; Connect publishes exactly this split as contact record driven versus agent
   activity driven, `02-research/_docs.md`.)
9. **Success means four different things.** "My success rate is the average of whatever four people
   typed into four phone numbers." (`DEFAULT_PHONE_NUMBER_CALL_SUCCESS_CRITERIA`,
   `ng-console/src/lib/telephony/phone-number-contracts.ts:7-8`, written out as
   `structured_output.call_success_evaluation.criteria` at :96-98.)
10. **Nothing to split it by.** "I want this per campaign and there is nothing on the screen to split
    it by." (Group-by needs `labels` written at join time, and `labels` is on the property allowlist
    but excluded from the configurable set, `ng-console/src/lib/convoai/agent-properties.ts:15,22-24`.)
11. **The limit is hit.** "I wanted one rule per customer and it stopped me at ten." (Retell caps 10
    alert rules per workspace and 100 agents inside one rule's filter, `02-research/_docs.md`.)
12. **The name is already taken.** "I called my metric Call Outcome, it refused, and the thing it
    clashes with is not even mine." (Name validation rejects "Call Outcome", any reserved system name
    fetched from `/api/telephony/system-evaluations`, and any duplicate:
    `ng-console/src/features/telephony/post-call-evaluation/post-call-evaluation-authoring.ts:262-285`.)
13. **Permission is off.** "I can read the alert, and the fix link lands me on a page my role is not
    allowed to change." (Built-in roles Admin · Product/Operation · CS/Maintenance · Engineer ·
    Finance · Super Admin, `ng-console/src/lib/settings/role-names.ts:3-9`, with per-role project
    permissions from `/api/v2/permission/getRolePermissions`,
    `ng-console/src/lib/settings/settings-api.ts:208-212`. The reader is P2 or P4 and the fix belongs
    to P1, `LEARNINGS.md:44-50`.)
14. **The delivery path is dead.** "Slack ate a week of alerts and I found out when a customer rang
    me." (ElevenLabs auto-disables a webhook after 10 consecutive failures and emails the workspace
    admins; Retell posts once with a 10-second timeout and no retries; Agora's NCS page documents no
    retry policy at all and asks only that the server answer within 10 seconds,
    https://docs.agora.io/en/conversational-ai/develop/webhooks.)
15. **The trunk rejects the call before we ever see it.** "The dashboard says zero calls today, which
    looks exactly like a quiet Sunday, and the trunk has been refusing every call since Friday." (A
    record exists only once a call reaches the Engine: `state` is `answered | hangup` and `reason` is
    `request | hangup | failed`, `ListTelephonyResponse.d.ts:22-49`.)
16. **The caller hangs up first.** "Half of today's calls are eight seconds long because people hang
    up on the greeting, and it has dragged my handle time down to something I cannot show anyone."
    (`end.type` is `interrupted` with `caused_by: start_of_speech` on the turns API; the call itself
    is `state: hangup`, `reason: hangup`.)
17. **My own test calls are in the numbers.** "I ran twenty tests this morning and they are sitting in
    the same success rate my boss reads." (The taxonomy already draws the line: `first_live_call_received`
    is "the first production (non-test) call", and `trigger: 'auto'` is excluded from every metric,
    `references/telemetry/event-spec.json`.)
18. **Two people at once.** "My colleague silenced the rule while I was still looking at it, and now
    neither of us knows whether it is still breaching." (Retell holds "only one active incident per
    rule at a time" and documents no second editor; nothing in either product locks a shared view.)
19. **The storm.** "The provider had one bad hour and I got sixty emails about it." (Standing rule:
    first-failure email rate limited to one per error class per 24 h, with a suppressed-alert
    acknowledgment in-app on return, `LEARNINGS.md:344`.)
20. **It never says it is over.** "It told me it broke and never told me it recovered, so I kept
    checking all afternoon." (Retell ships "[Retell Alert Resolved] <rule name>" against its open
    incident; Vapi delivers only `issue.created`, `02-research/_docs.md`.)
21. **The prior period is empty.** "It says my answer rate is up by an infinite amount, because last
    week there were no calls." (The honest-delta rule already exists: compare to the previous
    equivalent period, and when the prior period is zero say "No prior period to compare",
    `references/analytics-rebuild.md:88-128`.)
22. **The account cannot pay.** "Everything went to zero at two o'clock and nothing warned me the
    minutes had run out." (300 free minutes a month, then $0.10 per agent-minute charged the same on
    the customer's own key, https://docs.agora.io/en/conversational-ai/overview/pricing;
    `spend_alert_fired` must precede `spend_cap_hit`, `studio_x_2/lib/analytics.ts:71-72`.)
23. **The region forbids it.** "Legal will not let transcripts leave the region, so I cannot have the
    traces in the tool I watch everything else in." (A webhook is configured per region,
    `ng-console/src/components/console/developers/sections/webhooks/webhook-drawer.tsx:200-233`;
    ElevenLabs' OTLP payload carries the full transcript, and LiveKit gates content attributes behind
    `lk.pii.` and `LIVEKIT_TELEMETRY_ALLOW_PII`, `02-research/_docs.md`.)
24. **The format is not supported.** "I asked for this in Datadog and what I got back was a
    JSON POST and a weekend of glue code." (No OTLP anywhere in `agora-agents@2.4.0`; the only push
    Agora offers is the NCS webhook with seven subscribable numeric events, and 112, the batch of
    every turn in a session, is not among them, `00-brief.md` fact-check.)

## What this is not

- **Watching a call while it is happening, and stepping into it.** That is
  [12 · Live monitoring & operator controls](https://app.clickup.com/t/868m0mevm), a ⚠ owner lock
  (`references/design-ops-protocol.md`, rule 3). "Live sentiment trends" is 12's roadmap row. 13
  designs no live surface and no operator verb.
- **One call's evidence: the audio, the transcript, the per-turn spans.** That is
  **[10 · Session & call logs](https://app.clickup.com/t/868m0meta)**. This feature borrows 10's
  definitions of latency and handle time and never writes new ones (`00-brief.md`, Already decided).
- **Judging whether a conversation was any good against a rubric.** That is
  **[14 · Evals & scorecards](https://app.clickup.com/t/868m0mexd)**. Retell's own answer, AI QA, is a
  separate paid surface at $0.10 per analysed minute, not a chart on a dashboard (`02-research/_docs.md`).
- **Spend, credits and the concurrency wall.** That is
  **[22 · Usage, credits & concurrency](https://app.clickup.com/t/868m0mf7b)**. The spend cap is the
  control whose shape we copy, not a tile we move here; Monitor keeps its quiet outlink to
  `/billing/usage` and nothing more (`studio_x_2/components/monitor-nav.tsx:34-40`).
- **Diagnosing one bad SIP leg.** That is
  **[11 · SIP & latency diagnostics](https://app.clickup.com/t/868m0mety)**, shipped in Wave 2.
