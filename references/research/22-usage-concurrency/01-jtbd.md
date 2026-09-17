# 22 · Usage, credits & concurrency — JTBD, all types

ClickUp: [22 · Usage, credits & concurrency](https://app.clickup.com/t/868m0mf7b) (Design Tracker, `billing`, P0-Sep, M, ⚠ partial lock)
Roadmap parents: [Sell and allocate concurrency self-serve](https://app.clickup.com/t/868ka690p) · [Model-level usage, credits and pricing breakdowns](https://app.clickup.com/t/868kyr0ft)
Evidence: `00-brief.md` (scope · what exists · Agora fact-check) · `02-research/_docs.md` (five vendors, public docs) · `03-learnings.md`

## Headline JTBD

**When my batch starts queueing and my first real invoice is about to land, I want to see where the
minutes went and add capacity myself in the same sitting, so I can keep the calls moving and answer
finance instead of filing a ticket and waiting.**

The ⚠ lock does not move this sentence. It moves what the second half is allowed to be: owner question 2
decides whether "add capacity myself" means a purchase, a request, or only a visible ceiling
(`00-brief.md` §Open questions). Scenarios that change with that answer are marked **[Q2]**; **[Q3]**
marks the ones that change with what "credits" turns out to mean, **[Q4]** with the grain of model-level
usage, **[Q6]** with the `MANAGED_PROVIDERS` fix, **[Q7]** with collapsing the four `AddLinesSheet` doors.

## Success event

The tempting count is lines sold. It is rejected twice over. A line that carries no call earns Agora $0,
the same reason a published agent was rejected as the north star (CLAUDE.md · LEARNINGS.md:509), and A6
already locked the rule that a healthy decline rate on "Keep queuing" is what proves the wall is not a
dark pattern (LEARNINGS.md:517). A design that succeeds by selling more lines would be graded by the one
number it must not optimise.

The honest outcome is that the ceiling stops costing the account calls, and that the account moved it
without asking anyone. So the success event is the ceiling changing, carrying who moved it.

**Proposed, in the spec's shape** (`object_verb`, past tense, camelCase properties, codes and buckets per
`references/telemetry/event-spec.json` §conventions and §rules; `changed` and `blocked` are both on the
allowed-verb list):

```json
{
  "name": "capacity_limit_changed",
  "when": "The account's effective concurrent-call ceiling changes, whatever moved it. Server-anchored on the entitlement write, not on the sheet's commit button, so a support grant and a plan change are counted beside a self-serve purchase. One event per change, never per render of the new number.",
  "properties": ["accountUid", "fromLimit", "toLimit",
                 "source (self_serve|support_grant|plan_change|flag_default)",
                 "direction (up|down)", "msSinceWall",
                 "queuedPeakBucket", "remainingPurchaseLimit",
                 "capHeadroomUsdBucket", "capRaisedInSameFlow (boolean)"],
  "feeds": ["Self-serve share of ceiling changes: the whole feature in one number",
            "Time from hitting the wall to being past it",
            "Whether the cap-versus-capacity warning gets acted on or ignored"],
  "priority": "P0",
  "hookPoint": "Engine entitlement write. The client mirror is AddLinesSheet's commit (components/concurrency-card.tsx:221-365); ng-console's read today is feature_flags.campaign_call_settings.max_concurrent_calls (src/lib/agents/studio-feature-access.ts:24-26)"
}
{
  "name": "capacity_purchase_blocked",
  "when": "The capacity path refuses at any step. One event carrying the full reason set, the way deploy_blocked already does. Codes only, never the provider's or the backend's free text.",
  "properties": ["accountUid", "step (view|configure|checkout|provisioning)",
                 "code (no_permission|no_billing_permission|no_card|balance_zero|account_suspended|purchase_limit_reached|below_in_use|entity_unsupported|sales_assisted_only|provider_error)",
                 "requestedDelta", "recoverable (boolean)"],
  "feeds": ["Which rainy scenario below is real and which is theatre",
            "Whether the honest answer is still 'contact support' and for whom"],
  "priority": "P0",
  "hookPoint": "the same sheet; permission codes from src/lib/billing/billing-access.ts:21-34"
}
{
  "name": "usage_grain_changed",
  "when": "The usage breakdown's dimension changes: service, model, agent or credential mode. On commit of the control, not on every row render.",
  "properties": ["grain (service|model|agent|mode)", "fromGrain", "rowCount",
                 "hasByoRows (boolean)", "periodDays"],
  "feeds": ["Owner question 4: which grain developers actually ask for",
            "Whether the model row is read as attribution or as a price list"],
  "priority": "P1",
  "hookPoint": "app/(dashboard)/billing/usage/page.tsx:190-197 (TOP_SERVICES) and ng-console src/components/console/usage-page.tsx"
}
```

**The metric:** share of ceiling changes with `source: self_serve`, and the median `msSinceWall` on those.
A `support_grant` is counted as a failure of this design, which is the correct polarity: it is the state
the product ships today, verbatim, "For a higher quota, please contact support."
(`ng-console/src/lib/i18n/resources/en/common.ts`:4207-4209). A `direction: down` change is a success too.
Being able to give capacity back is half of owning it, and it is the only downgrade rule any vendor
publishes (`02-research/_docs.md` §Vapi).

**The counter-metric**, in the shape X1 already set (`spend_alert_fired` must precede `spend_cap_hit`,
`studio_x_2/lib/analytics.ts`:71-72): a `lines_added` followed inside seven days by a negative-quantity
`lines_added` is churned capacity, and a `lines_added` with no preceding `concurrency_wall_viewed` is a
sale made before the need. Both are read beside `keep_queuing_clicked`, which stays a first-class outcome
and not a lost conversion.

**The understanding half is measured on events that already exist.** `projected_bill_viewed`,
`spend_alert_fired` and `spend_cap_hit` are all in `studio_x_2/lib/analytics.ts`:74-82. The metric is the
share of first `spend_cap_hit` events preceded by both an alert and a viewed projection: bill shock is the
failure this half of the feature exists to prevent, and a page view is not evidence of understanding.
`usage_viewed` (`analytics.ts`:136) stays a navigation counter and is not a KPI.

**Two existing events need properties, not renames.** `lines_added { qty, prorated_charge_usd }` gains
`remainingPurchaseLimit` and `capHeadroomUsdBucket`, because the cap-versus-capacity warning is the only
idea here no competitor ships and it is currently dead in three of its four doors
(`03-learnings.md` learning 4). `concurrency_wall_viewed { lines, queued }` gains `source`, because the
wall has four mounts and we cannot tell them apart today.

**Fact-check carried forward** (full version in `00-brief.md` §Agora fact-check, read 2026-09-17). The
Engine bills a flat "0.10 USD / minute" and charges "the same price even if you bring your own key"
(https://docs.agora.io/en/conversational-ai/overview/pricing), so no event here may carry a per-model
price. The server anchor this success event needs **does not exist**: the Engine contract exposes no
concurrency field to read or set, only the error `ConcurrencyLimitExceeded` on a 422 alongside
`ResourceQuotaLimitExceeded` and `AccountSuspended` (`AgentErrorResponse.d.ts`), and the single published
number is "Peak Concurrent Users (PCU) allowed to call the server API under a single App ID is limited to
20" (https://docs.agora.io/en/conversational-ai/overview/release-notes, v1.0). Billable minutes are
`stop_ts - start_ts` with no duration, cost or usage object anywhere in the agent API, and `pipeline_id`
is the only key that ties a session back to a Studio agent. Retell's `GET /get-concurrency` is the field
list to file against Engine, `current_concurrency` · `base_concurrency` · `purchased_concurrency` ·
`concurrency_limit` · `concurrency_purchase_limit` · `remaining_purchase_limit`
(https://docs.retellai.com/api-references/get-concurrency). **Requires Engine**, and the ask is six named
fields, not a feature request.

## Happy scenario

1. "My batch is crawling, and the card tells me all ten of my lines are busy and the rest of the calls are queued, not dropped."
2. "It says how long the queue takes to clear at ten lines and shows me the sum it used, so I can decide whether waiting is fine."
3. "I want it faster, so I open the sheet the card offers and set five more lines." **[Q2]**
4. "It warns me that fifteen lines burn my fifty dollar cap faster than ten, and that the cap would pause the calls before the extra lines pay for themselves."
5. "I raise the cap from that warning without losing my place in the sheet."
6. "The button says the exact prorated amount for the rest of this month, and I press it."
7. "The gauge shows fifteen a second later, the queue starts draining, and nothing I had running was interrupted."
8. "At the end of the month the usage page shows the minutes those calls burned, which models carried them, and the line fee on its own row, so I can tell the subscription part from the metered part."

Step 8 is the end of the flow, not step 7. The job is to understand what was paid for, and a purchase
that cannot be reconciled afterwards has only moved the question. Nobody in the teardown connects the two
at all: all five vendors ship a spend control and a capacity lever, and not one of them says that buying
capacity raises the burn rate against the same balance (`02-research/_docs.md` §What nobody does).

## Rainy scenarios

1. **Nothing has run yet.** "I opened Usage on day one and it is an empty chart telling me to go and deploy something." (`studio_x_2/app/(dashboard)/billing/usage/page.tsx`:274-287 routes the empty state to `/deploy`.)
2. **The money column is zero and I know it is not.** "The table says Conversational AI Engine, 18,420 minutes, $0.00." (`TOP_SERVICES` at `billing/usage/page.tsx`:190-197 renders the literal string `"$0.00"` on every row; at the published rate that row is $1,842 before the free tier.)
3. **The figure on the page is not the bill.** "I planned against the number I saw and the invoice came out different." (The Console's estimate dialog is the only surface that discloses it, "This preview estimates charges generated so far in the current month" and "The complete monthly bill is generated at the start of next month", `ng-console/src/lib/i18n/resources/en/common.ts`:5130-5175; the Usage page makes no such claim.)
4. **The minutes have not landed yet.** "The batch finished an hour ago and the page still shows yesterday's total." (There is no usage object in the agent API at all: minutes are derived from `stop_ts - start_ts`, so a session contributes nothing until it stops, and `idle_timeout` allows a single task to run up to 72 hours, `StartAgentsRequest.Properties`.)
5. **My free minutes went and I never made a call.** "I had 300 free minutes, my agent used none of them, and the meter says I am out." (The ConvoAI free tier is shared with STT and Translation, LEARNINGS.md:513 fact-check 1, and the Console models Conversational AI as two entitlements, equity item 19 "Duration" and 23 "Ares ASR", `ng-console/src/lib/subscriptions/subscriptions-model.ts`:1412-1460.)
6. **The ceiling is invisible.** "Calls stopped starting and nothing on any screen tells me what my limit is or who set it." (The ceiling is a server-granted feature flag, `feature_flags.campaign_call_settings.max_concurrent_calls`, defaulting to 15 when absent, `ng-console/src/lib/agents/studio-feature-access.ts`:24-26; four of five vendors show theirs, `02-research/_docs.md` §The five, side by side.)
7. **The wall arrives as an error code.** "My integration got a 422 saying access limit exceeded and I had to guess which limit it meant." (`ConcurrencyLimitExceeded`, `ResourceQuotaLimitExceeded` and `AccountSuspended` all share HTTP 422 and the message "Access limit exceeded", `AgentErrorResponse.d.ts`.)
8. **I bought lines and the cap stopped everything anyway.** "I paid for five more lines and my spend cap paused the calls twenty minutes later." (The sheet computes exactly this at `studio_x_2/components/concurrency-card.tsx`:340-349, and three of its four doors pass `capHeadroomUsd={null}` or hardcoded counts, `monitor/live/page.tsx`:208 · `wizard/step-call-settings.tsx`:478 · `batch-detail.tsx`:238, so the warning cannot fire.) **[Q7]**
9. **I cannot give the lines back.** "The campaign is still running and it will not let me drop from fifteen to five." (The only published downgrade rule in the five vendors: "You cannot reduce an add-on below the capacity currently in use", `02-research/_docs.md` §Vapi.) **[Q2]**
10. **There is a ceiling on the ceiling.** "It sold me ten more and refused the eleventh with no number attached to the refusal." (Retell returns `concurrency_purchase_limit` and `remaining_purchase_limit` on a read endpoint, https://docs.retellai.com/api-references/get-concurrency; Agora exposes neither, so a refusal today has nothing to quote.) **[Q2]**
11. **I can see the meter and I cannot buy.** "Usage opens fine and Billing is not even in my nav." (Two separate permissions: `hasUsageAccess` needs `Usage` and `hasBillingAccess` needs `FinanceCenter`, `ng-console/src/lib/billing/billing-access.ts`:21-34, gating `console-shell.tsx`:863 and :1389.)
12. **The card is not mine to type in.** "Buying capacity wants a card and the company card belongs to someone who has never opened this product." (`PLAN_USAGE.cardOnFile` is false and the only card-capture surface in the product is the 150-minute nudge, `studio_x_2/lib/campaign-data.ts`:1184-1197 · `components/free-minutes-nudge.tsx`:138.)
13. **The account cannot pay.** "My invoice is unpaid and now the agent will not start at all." (`AccountSuspended` sits on the same 422 as the concurrency wall, `AgentErrorResponse.d.ts`, and billing is postpaid, LEARNINGS.md:513 fact-check 4; Vapi freezes the subscription at a $0 balance and Retell blocks new calls, `02-research/_docs.md`.)
14. **My entity is not the one checkout knows.** "The payment form loaded a different processor than the one my colleague in the US sees." (The Stripe publishable key is chosen from the account's corporate entity, with `SG_AGORA` taking its own key, `ng-console/src/lib/billing/billing-access.ts`:53-70.)
15. **The model I want is not sold managed.** "I picked a multimodal model and it will not take the Agora key." (Verbatim: "No MLLM vendor-models are currently available under Agora Managed Key. Add your own credential", https://docs.agora.io/en/conversational-ai/studio/build/customize-agent; the Console enforces it in one line, `resellerEligible: modelSelectable && (policy.resellerEligible ?? typeKey !== "mllm")`, `ng-console/src/lib/agents/agent-provider-capability-catalog.ts`:892-893.)
16. **The builder offered me a managed key Agora does not sell.** "It let me pick Agora-managed ElevenLabs, so I have been assuming the voice bill was included." (`MANAGED_PROVIDERS` lists OpenAI, Anthropic, Deepgram and ElevenLabs, `studio_x_2/lib/campaign-data.ts`:1834-1839; the published managed catalog is ARES, Deepgram, OpenAI and MiniMax, https://docs.agora.io/en/ai/build/custom-model-integration/managed-mode.) **[Q6]**
17. **Half the bill is not Agora's to show.** "Three of my four slots run on my own keys, so this page can only ever tell me a quarter of what the agent costs." (Under BYO the provider invoices the customer directly; the only per-vendor money in the product is a pre-commitment estimate, `stackCost()` at `campaign-data.ts`:985-1009, and a Cost tab built on list prices was deleted once already, CLAUDE.md open tension 6.) **[Q4]**
18. **A model name beside a dollar reads as a price.** "The breakdown put a model next to a number and my team spent the afternoon arguing about switching models to save money." (Every per-model breakdown in the teardown exists because the model moves the price, `02-research/_docs.md` §What nobody does; Agora charges $0.10 either way, https://docs.agora.io/en/conversational-ai/overview/pricing; even OpenAI keeps usage on `model` and money on `line_item` and warns they do not reconcile.) **[Q4]**
19. **The failover changed who was paying mid-call.** "My managed transcriber fell over, my own key finished the call, and nothing says which half ran where." (Feature 07's backup pool reads the same managed list, `studio_x_2/lib/backup-providers.ts`:78, and the Engine returns only `start_ts`, `stop_ts` and `status` per session, `GetAgentsResponse.d.ts`.)
20. **The vendor failed and I paid for the silence.** "My own key hit its rate limit mid-call, the agent went quiet for ninety seconds, and those minutes still counted." (The audio task is billed per minute with no exclusion for a failed component, https://docs.agora.io/en/conversational-ai/overview/pricing; ElevenLabs is the only vendor that publishes what silence costs, "billed at 5% of the usual per minute rate", https://elevenlabs.io/docs/eleven-agents/customization/llm/optimizing-costs.)
21. **The caller hung up and the meter kept running.** "The customer left at forty seconds and the session bills four minutes." (Billable minutes are `stop_ts - start_ts` and nothing in the contract ties the agent's stop to the caller's hangup; `idle_timeout` is the only backstop and its ceiling is 72 hours, `StartAgentsRequest.Properties`.)
22. **Two of us changed it at once.** "I raised the cap on the billing page while my colleague added lines inside the campaign sheet, and one of us lost." (The sheet has four mounts, each holding its own `purchased` counter in local state, `concurrency-card.tsx`:206 · `monitor/live/page.tsx`:208 · `batch-detail.tsx`:238 · `wizard/step-call-settings.tsx`:478.) **[Q7]**
23. **The plan already promised me the capacity.** "The plans page sells 10,000 minutes for $99, so why is anything metered at ten cents?" (`studio_x_2/app/(dashboard)/billing/plans/page.tsx`:47-49 invents a Pro tier whose allowance is worth $1,000 at the published rate, and lists "1 phone number" on Free, which nothing grants.)
24. **The only answer left is a ticket.** "I asked the product for more capacity and it told me to contact support." (The pattern ships today on Cloud Transcoding, "For a higher quota, please contact support.", `ng-console/src/lib/i18n/resources/en/common.ts`:4207-4209; this sentence is what 868ka690p exists to replace.) **[Q2]**
25. **The word on the screen is not a thing I own.** "It says credits, my account page says balance, and I cannot tell whether those are the same money." (There is no credits object in either codebase or on docs.agora.io; the real nouns are `accountBalance - reservedBalance`, `ng-console/src/lib/subscriptions/subscriptions-model.ts`:756-758, plus the free entitlements, while the only place "credits" appears as a product noun belongs to RTC pre-paid, `billing/plans/page.tsx`:53-54.) **[Q3]**

## What this is not

- **The spend cap machine.** X1 built the cap, the alert, the projection clamp and the card capture, and its six money rules are locked (LEARNINGS.md:516-517). This feature connects the cap to capacity and adds nothing to the cap itself: the deepest thing it owes X1 is making `capHeadroomUsd` real in all four doors instead of `null` in three.
- **The invoice.** Invoices, transactions and payment methods are existing Billing tabs backed by a Console finance surface, owned by [868kj8u4v](https://app.clickup.com/t/868kj8u4v). This feature owes the invoice exactly one thing: every figure it shows is labelled an estimate the way `billing-estimate-preview-dialog.tsx` already labels itself.
- **Per-vendor cost reporting under BYO.** Agora does not receive the customer's provider invoices, and the Cost tab built on list prices was deleted after audit on 2026-05-26 (CLAUDE.md open tension 6). It comes back only if owner question 4 states what changed since that audit, and then only as a column that says the word estimate.
- **Phone number rental fees.** A rented number is a recurring per-resource fee with its own purchase, its own compliance and its own release rules, owned by [16 · Phone number purchase](https://app.clickup.com/t/868m0mf09). This feature owes it one guarantee: the spend cap governs per-minute usage and never takes a rented number away.
- **Calls per second.** Pacing is how fast calls start, concurrency is how many run at once, and they fail differently. CPS as a purchasable bundle hangs off [868keb6t2](https://app.clickup.com/t/868keb6t2) and the throttling work, not here.
- **RTE usage.** Voice, Video, Chat and Signaling are human-to-human minutes with their own meters on the same page, and the RTC concurrency row was already renamed so it cannot be read as agent lines (`billing/usage/page.tsx`:181-186, CLAUDE.md). An agent concurrency meter sits beside them and never merges with them.
- **Archer.** It appears three times in the design office, all of them the same roadmap row, and nowhere in `ng-console` or on docs.agora.io. Owner question 1 decides whether [868khqb6d](https://app.clickup.com/t/868khqb6d) has a user-facing surface at all; until it is answered there is nothing here to design.
