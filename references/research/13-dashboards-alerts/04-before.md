# 13 · Dashboards & alerts · Before, and what is wrong with it

**Before:** `references/research/_before10-2026-09-17/before-13-monitor.png` and
`references/research/_before10-2026-09-17/before-13-diagnostics.png`, both light mode, full page.
Live: <https://ai-studio-console-redesign.vercel.app/monitor> and
<https://ai-studio-console-redesign.vercel.app/monitor/diagnostics>

Source:

| Surface | File | Last touched |
|---|---|---|
| Monitor overview | `studio_x_2/app/(dashboard)/monitor/page.tsx` (465 lines) | 2026-09-15, `bb75f3b`, the copy pass |
| Diagnostics queue | `studio_x_2/app/(dashboard)/monitor/diagnostics/page.tsx` (156 lines) | 2026-09-12, `0ac8422` |
| Rules engine and roll-ups | `studio_x_2/lib/diagnostics.ts` (420 lines) | 2026-09-12, `0ac8422` |
| Hub tabs | `studio_x_2/components/monitor-nav.tsx` | 2026-09-17, `1ef74db` |
| Sidebar band and badge | `studio_x_2/components/app-sidebar.tsx` | 2026-09-12, `0ac8422` |
| Delivery table | `studio_x_2/app/(dashboard)/project/notifications/page.tsx` | 2026-09-12, `0ac8422` |
| Event catalogue | `studio_x_2/app/(dashboard)/developer/webhooks/page.tsx` | 2026-06-24, the fork |
| The metric card nobody mounts | `studio_x_2/components/metric-section.tsx`, `studio_x_2/components/sparkline.tsx` | 2026-06-24, the fork |

A design exists for the reading half, so that part is a Before to After. What is on screen today: a
five-tab hub (Overview · Live calls · Call History · Sessions · Diagnostics), a Needs attention card
with a Fix deep link, a Live deployments chip row, four filters, four KPI cards, a donut, an area
chart, a ranked agent list, and a severity-ranked issue feed with a health strip.

**No design exists for the other two thirds of this feature.** There is no alert rule, no threshold,
no schedule, no resolve notice and no trace export destination anywhere in either product, so items
1, 13 and 14 below are blank-page findings rather than Before to After ones.

## What is wrong

Each item ties to a JTBD rainy scenario in `01-jtbd.md` or to a roadmap ticket.

1. **Nothing on this surface can be told what a bad number looks like.** Five tabs
   (`components/monitor-nav.tsx:15-22`) and not one threshold, rule, schedule or recipient. The only
   user-set threshold in the whole product is "Alert me at" on the spend cap
   (`components/usage-spend-card.tsx:557-580`), and it lives in Billing, watching money rather than
   traffic. The page therefore sits calm while the agent fails, and the success event the JTBD is
   measured by, `alert_fix_opened`, has nothing to fire from.
   → [868kykbfc](https://app.clickup.com/t/868kykbfc), JTBD rainy 1.

2. **Zero traffic is drawn as green Healthy.** `Health` is three words, `healthy | degraded |
   unhealthy` (`lib/diagnostics.ts:38`), with no word for "no data". `aggregateIssues` returns `[]`
   for any deployment whose `metrics.calls` is 0 (`lib/diagnostics.ts:356`), `healthOf` reads an
   empty list as healthy (`:333-337`), and `deploymentHealth` (`:409`) feeds that straight into the
   `HealthDot` on every chip (`monitor/page.tsx:218`). Checkable on the Diagnostics shot: the strip
   reads "8 unhealthy · 0 degraded · 4 healthy", and those four are exactly the four deployments that
   have never taken a call (`lib/campaign-data.ts:1367,1472,1580,1604`). A trunk that has refused
   every call since Friday looks identical to a quiet Sunday. → JTBD rainy 2, rainy 15.

3. **The strip is labelled "Live deployment health" and counts drafts.**
   `monitor/diagnostics/page.tsx:68` writes the word "Live" over a count taken from
   `listDeployments()` at `:37`, which is all twelve rows including `draft`, `scheduled` and
   `paused`. Four of the twelve have never been live. → JTBD rainy 2.

4. **Every number on the Overview is a literal, and three of them contradict each other on the same
   screen.** `KPIS` (`monitor/page.tsx:44-49`) hardcodes "120 / 208" answered calls next to a 95 %
   answer rate, and 120 of 208 is 58 %. The donut's centre says 4,000 total calls
   (`:61`) while the deployment data one card above sums to 11,383
   (`lib/campaign-data.ts:1334,1353,1367,1381,1395,1409,1437,1472,1506,1544,1580,1604`). Each delta
   string is hardcoded too, so "Down by 16%" never changes. → JTBD rainy 8, honesty floor.

5. **The donut sums to 75 % and the ring hides it.** `STATUS_SEGMENTS` (`monitor/page.tsx:53-60`) is
   20 + 24 + 15 + 10 + 5 + 1, and `Donut` normalises by the segment total at `:413`, so the ring
   renders full while the legend beside it adds to three quarters. → honesty floor.

6. **Three of the donut's six labels name outcomes the Engine has no state for.** Voicemail,
   Transferred and Transfer Failed (`monitor/page.tsx:56,57,59`) are not in the telephony contract,
   whose entire call vocabulary is `state: answered | hangup` with `reason: request | hangup |
   failed` (`ListTelephonyResponse.d.ts:22-49`, `GetTelephonyResponse.d.ts:1-35`). Three of the six
   segments cannot be computed from anything Agora returns.
   → [868ka69vr](https://app.clickup.com/t/868ka69vr), honesty floor.

7. **"Task Success Rate" carries a subtitle and no definition.** `monitor/page.tsx:334-336` says
   "Percentage of successful calls out of total answered calls", and nothing on the page or in the
   codebase says what makes a call successful. In the live Console the same number is the result of
   whatever sentence the customer typed into a box on one phone number
   (`ng-console/src/lib/telephony/phone-number-contracts.ts:7-8`, written out at `:96-98`), so it
   means something different per phone number and is never comparable. → JTBD rainy 9,
   [868ka69vr](https://app.clickup.com/t/868ka69vr).

8. **"Top Performing Agents" ranks three agents that do not exist.** `TOP_AGENTS`
   (`monitor/page.tsx:63-67`) is Agent Alpha, Agent Beta and Agent Gamma; the agent list one click
   away is Aria, Support Bot v2, Sales Qualifier, Appointment Setter, Collections Outreach and
   Survey Bot (`lib/campaign-data.ts:647,665,675,684,694,712`). It ranks them by a `sessions` count
   that appears in no other data anywhere in the product. → honesty floor.

9. **Three of the four filters do not filter.** Time range, agents and call types
   (`monitor/page.tsx:249-257`, `:258-264`, `:265-272`) are uncontrolled selects with no
   `onValueChange`. Only the deployment select is controlled (`:273-279`), and all it drives is the
   visibility of an "Open deployment" link (`:280-284`). There is no group-by control at all, and
   there could not be one: the only field that can tag a session with a deployment, campaign or
   number is `labels`, which is on the property allowlist but excluded from the configurable set
   (`ng-console/src/lib/convoai/agent-properties.ts:22-24`), so nothing writes it at join time.
   → JTBD rainy 10, [868kykbfc](https://app.clickup.com/t/868kykbfc).

10. **The range picker offers 90 days over evidence that stops at 7.** `monitor/page.tsx:254-255`
    lists Last 30 Days and Last 90 Days; the turns API states "You can query sessions within the last
    7 days", and the long ranges can only be served by Studio's own aggregate store
    (`ng-console/src/server/console-backend/telephony.ts:1336,1362`). Nothing on screen says which
    store answered which number, so latency stopping after a week while call counts run for a quarter
    is a surprise rather than a label. → JTBD rainy 7, rainy 8.

11. **Refresh does nothing, and nothing says when the numbers were computed.**
    `monitor/page.tsx:112-118` fires `toast.info("Refreshing")` and returns. There is no timestamp,
    no lag line and no per-tile error state anywhere on the page, although the state inventory for
    this exact screen specifies "Data lags by ~3 minutes" and "Last updated 3m ago"
    (`references/analytics-rebuild.md:88-128`). → JTBD rainy 6.

12. **Nothing on any tile says how much of the data is missing.** The product ships the switch that
    removes a session from every number, "Opt out of data retention"
    (`ng-console/src/components/console/agent-advanced-page.tsx:189-192`, backed by
    `parameters.opt_out`), and the success number dies silently when transcripts are turned off,
    because the write is gated on `enableLlmCallEvaluation && enableTranscript && agentId`
    (`ng-console/src/lib/telephony/phone-number-contracts.ts:68-69`). No tile states an excluded
    count, so a 94 % that covers nine agents out of twelve reads exactly like one that covers all
    twelve. → JTBD rainy 4, rainy 5.

13. **The event catalogue a customer would subscribe to is invented.** `EVENTS`
    (`developer/webhooks/page.tsx:20-24`) lists nine dotted names, `call.started`, `call.completed`,
    `call.failed`, `call.transferred`, three `campaign.*`, `agent.published` and `agent.error`. Agora's
    NCS catalogue is seven numeric ids, 101 · 102 · 103 · 110 · 111 · 201 · 202, and event 112, the
    batch of every turn in a finished session and the one thing a trace exporter wants, is documented
    but not listed as subscribable. The two rows above it (`:16-17`) also report deliveries that never
    happened, "2 min ago" and "1 day ago". → [868kyv3yg](https://app.clickup.com/t/868kyv3yg),
    JTBD rainy 24.

14. **The delivery table has channels and no conditions, and it already promises the thing that does
    not exist.** `project/notifications/page.tsx:28-35` is six event classes against four channels;
    not one row is a threshold. The Billing row's own description reads "Threshold alerts, invoice
    receipts" (`:32`), and the only threshold behind it is the spend cap. → JTBD rainy 1,
    [868kykbfc](https://app.clickup.com/t/868kykbfc).

15. **The shared metric card is an orphan, and its definition affordance is a decorative icon.**
    Nothing under `app/` or `components/` imports `components/metric-section.tsx` or
    `components/sparkline.tsx`, so `MetricCard` (`:38-97`) and its `mute` no-data state (`:71-72`)
    have never rendered, while `monitor/page.tsx:383-400` defines a private `Sparkline` that shadows
    the shared one. The `Info` glyph inside `MetricCard` (`components/metric-section.tsx:67`) has no
    tooltip, no `title` and no handler, so the per-tile definition line that 868ka69vr is supposed to
    deliver has no place to live. → [868ka69vr](https://app.clickup.com/t/868ka69vr).

16. **The one doc link that would define these numbers is a 404.**
    `app/(dashboard)/help/page.tsx:48` points "Understanding completion rate and handle time" at
    `https://docs.agora.io/en/conversational-ai/best-practices/metrics`, which does not exist.
    → JTBD rainy 3, [868ka69vr](https://app.clickup.com/t/868ka69vr).

17. **Two of the five inbound pilot metrics have no field to read.** A call carries `create_ts` and
    `stop_ts` and nothing between them, so answer speed cannot be computed, and nothing named
    first-contact resolution exists in any request, response or notification payload. Neither word
    appears anywhere on screen today, in either product, and no vendor in the sweep defines either
    one. → JTBD rainy 3, [868ka69vr](https://app.clickup.com/t/868ka69vr).

18. **The Diagnostics queue cannot reach most of its own issues.**
    `monitor/diagnostics/page.tsx:58` is `rows.slice(0, pageSize)` with no page index, and the footer
    at `:150` says "60 issues" beside a rows-per-page select capped at 50 (`:147`). Checkable on the
    shot: the strip says 60 open issues, the feed stops at 25, and there is no next control.
    → [868kykbfc](https://app.clickup.com/t/868kykbfc).

19. **The sidebar band over Monitor is the word that was rejected.**
    `components/app-sidebar.tsx:183` renders "Observe" as a `SidebarGroupLabel`, and `LEARNINGS.md:415`
    rejects "Observe" as a user-facing section header. It is visible in the Before shot, in caps,
    directly above the item it contradicts. → label lock.

20. **A prop passed as `null` deletes the spend line inside the hub.**
    `app/(dashboard)/monitor/live/page.tsx:214` passes `capHeadroomUsd={null}` into `AddLinesSheet`,
    and `components/concurrency-card.tsx:340-343` renders the "headroom lasts ≈N min" warning only
    when that value is present. Buying concurrency from Monitor therefore never says how long the
    money lasts, while the same sheet opened from a batch does (`components/batch-detail.tsx:244`).
    → JTBD rainy 22.

21. **The selected threshold preset is drawn as a primary fill.**
    `components/usage-spend-card.tsx:565` is `variant={pctClamped === p ? "default" : "outline"}`, so
    50 / 75 / 90 read as three calls to action with one of them pressed. This is the exact control
    this feature has to extend, and it breaks the one-primary-per-fold rule before it is copied.
    → owner rule, standing.

22. **No event measures whether reading a number led to fixing anything.** `lib/analytics.ts:124` and
    `:141` name `monitor_viewed` and `diagnostics_queue_viewed`, which are page views and therefore
    the rejected KPI shape (`CLAUDE.md:154`). There is no `alert_received` and no `alert_fix_opened`,
    so the alert-to-fix rate the JTBD proposes cannot be computed on the day this ships.
    → `01-jtbd.md`, the success event.

## What is right, and must survive any redesign

- **The zero-traffic gate.** `monitor/page.tsx:95-102` sums real deployment calls and hides the whole
  analytics block behind it (`:230-244`). A brand-new account gets "No calls yet", not fabricated
  KPIs. It is the one honest thing on the page.
- **Needs attention, and the Fix deep link.** `monitor/page.tsx:147-189` takes the single most severe
  open issue and puts the control that resolves it one click away through `fixHref` (`:168`,
  `lib/diagnostics.ts:88-93`). No vendor in the sweep joins an alert to the setting that fixes it.
  This is the half we already own.
- **The rules engine underneath.** `lib/diagnostics.ts:205-315` diagnoses nine named failures from
  per-call signals, each carrying a `severity`, a `rootCause`, a `suggestedFix` and a `fixTarget`,
  and `aggregateIssues` (`:354`) already ranks them by severity × frequency. It is a monitor with the
  thresholds nailed shut, not a missing machine.
- **The delivery table.** `project/notifications/page.tsx:21-26` and `:106-132`: four channels with
  real routing fields. The condition is the only part missing.
- **The spend cap's shape.** A metric, a threshold, a warning before the wall, and a recap line that
  reads back what you set (`components/usage-spend-card.tsx:391-392`), with the pairing rule written
  into the taxonomy (`lib/analytics.ts:71-72`).
- **The tab label.** "Monitor" on both products (`components/monitor-nav.tsx:30`,
  `ng-console/src/components/console/agent-analytics-page.tsx:13`), and the quiet outlink to
  `/billing/usage` that keeps usage off this surface (`components/monitor-nav.tsx:36-40`).
- **The measured-versus-modelled rule.** `lib/session-trace.ts:41-44`, "a trace that silently mixes
  measured and modeled spans is worse than none". A screen that mixes an Engine number with a
  Studio-derived one carries the same obligation.
