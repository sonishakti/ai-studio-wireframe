# 22 · Usage, credits & concurrency · Before, and what is wrong with it

**Before:** `references/research/_before10-2026-09-17/before-22-usage.png`. `before-22-usage-hub.png` is
byte-identical to it (same md5), so there is one shot, not two, and the two money cards have no shot at
all: they are on `/billing`, one tab away from the page that was captured.
**Live:** <https://ai-studio-console-redesign.vercel.app/billing/usage>
**Source:**
`studio_x_2/app/(dashboard)/billing/usage/page.tsx` (442 lines, last changed 2026-09-15, bb75f3b) ·
`studio_x_2/components/usage-spend-card.tsx` and `studio_x_2/components/concurrency-card.tsx`
(X1 and A6, both last changed 2026-09-12, 0ac8422) ·
`studio_x_2/components/billing-future-cards.tsx` (2026-09-11, 15c6a5b) mounting both on
`studio_x_2/app/(dashboard)/billing/page.tsx` (2026-07-09, affd189) ·
`studio_x_2/lib/campaign-data.ts` (the money model, 2026-09-16, fb6f7e3) ·
`studio_x_2/app/(dashboard)/billing/plans/page.tsx` (2026-09-11, 424b659).
The live Console side is `ng-console/src/components/console/usage-page.tsx` (2026-07-15),
`ng-console/src/lib/usage/usage-catalog.ts` (2026-07-23) and
`ng-console/src/lib/agents/studio-feature-access.ts` (2026-07-28).

A design already exists for two thirds of this job, so most of what follows is a Before, not a blank
page. What is on screen today: a six-series chart over twelve months, a Quotas tab of seven meters, a By
Service table of six rows, a perspective toggle (All · Agents · RTE), a period select and an Export
button. One tab away, on `/billing`, sit the spend card and the concurrency gauge.

Six parts of the ask have no design anywhere: credits, a capacity price, a capacity purchase path, the
MLLM meter row, a usage-tracking identity separate from the provider credential, and Archer, which
nobody can define and which appears three times in this repo and zero times in `ng-console`.

## What is wrong

1. **The Cost column reads `$0.00` on every By Service row, including "Conversational AI Engine,
   18,420 min".** At the published rate that row is $1,842 before the free tier. The string is a literal
   on all six rows at `studio_x_2/app/(dashboard)/billing/usage/page.tsx`:190-197, rendered at :435.
   Fails rainy 2.

2. **The chart draws no lines, and its end dots are black instead of the colour in the legend above
   them.** Visible on the shot: six black dots stacked at the right edge over an empty plot. The stroke
   and fill classes are built at runtime, `metric.color.replace("bg-", "stroke-")` at :127 and
   `.replace("bg-", "fill-")` at :142, so Tailwind never emits `stroke-sky-500` or `fill-sky-500` and
   both fall back to `currentColor`. Twelve months of real series data are on the page and none of it is
   drawn. Fails [868kyr0ft](https://app.clickup.com/t/868kyr0ft).

3. **The x axis ends in May.** `MONTHS` at :54 is the fixed list Jun to May. Today is September 2026, so
   "Last 12 months" should end at Sep and the newest value should sit under it. Fails rainy 4.

4. **Changing the period changes nothing.** The select at :274-284 is uncontrolled, `defaultValue="12m"`
   with no `onValueChange`, and the chart always renders the same twelve constants. Pick "Last 30 days"
   and every figure on the page stays put. Fails rainy 4.

5. **Export is a toast that says the feature does not exist,** :263-271, while the live Console already
   ships CSV export on `ng-console/src/components/console/usage-page.tsx`. The redesign removed a
   working feature and left its button. Fails rainy 3.

6. **The page decides whether it has anything to show from a number that is on none of its charts.**
   `const { used } = freeMinutesStats(); const hasUsage = used > 0` at :223-224 reads free ConvoAI
   minutes. An account with 18,420 agent minutes and a fresh free tier gets "No usage yet" over six
   populated metric cards; an account that has burned free minutes on Real-Time STT and never run an
   agent gets the full chart. Fails rainy 1.

7. **The page's answer to "I need more capacity" is a card that promises three things Agora does not
   sell.** "Higher tiers unlock 50× minutes, unlimited agents, and priority routing" at :391-394. Fifty
   times 300 is 15,000; the Pro tier it links to sells 10,000 (`billing/plans/page.tsx`:49), which at
   $0.10 a minute is $1,000 of minutes sold for $99. Fails rainy 23 and the honesty floor.

8. **Nothing on this page, or any page, says what the agent concurrency ceiling is.** The seven meters at
   :175-188 carry one concurrency row and it is "RTC concurrent channels, 12 / 50", a different product,
   named that way on purpose (:184-186). The agent ceiling is a server-granted flag,
   `feature_flags.campaign_call_settings.max_concurrent_calls`
   (`ng-console/src/lib/agents/studio-feature-access.ts`:23-27, defaulting to 15 at
   `features/telephony/campaigns/campaign-call-settings-limits.ts`:6), and no surface in either codebase
   prints it. Four of five competitors show theirs. Fails rainy 6 and
   [868keb6r4](https://app.clickup.com/t/868keb6r4).

9. **Six of the seven quota meters are hand-typed numbers.** Only "Conversational AI free minutes"
   derives from the money model (:176, `convoFree`). "Voice minutes (RTC) 4,218 / 10,000", "Real-Time STT
   312 / 1,000", "SIP direct connection 2,140 / 5,000" and the rest are constants that will never move.
   Fails rainy 5.

10. **The meter and the money are two tabs apart, and only one of them knows the other exists.**
    `UsageSpendCard` and `ConcurrencyCard` mount on `/billing` only
    (`components/billing-future-cards.tsx`:18-25, `app/(dashboard)/billing/page.tsx`:57). `/billing/usage`
    has no cap, no projection, no line count and no link to them, while `usage-spend-card.tsx`:146 links
    one way into Usage. LiveKit's own lesson from the product sweep is the opposite: show the ceiling on
    the same page as the meter. Fails rainy 6.

11. **The wall never renders in the shipped state, so the best thing in the feature is not on screen.**
    `CONCURRENCY` at `lib/campaign-data.ts`:1226-1232 ships `inUse: 2`, `queued: 0` against
    `included: 10`, so `atWall` is false at `concurrencyStats()`:1234 and the wall banner
    (`concurrency-card.tsx`:115-147), the queue-clearing estimate (:122-127), the "Keep queuing" decline
    (:138-143) and the `concurrency_wall_viewed` event (:60) are all unreachable. "New batch calls queue.
    Nothing drops or fails." is true of no competitor's product and a reviewer cannot see it. Fails rainy
    6 and [868ka690p](https://app.clickup.com/t/868ka690p).

12. **The gauge's denominator and the sheet's price are invented, and the code admits both.**
    `lib/campaign-data.ts`:1213-1214, "wireframe value: no public ceiling is documented", and :1224,
    "$/line/month: wireframe placeholder (competitive w/ Retell's $8)". So the gauge reads "2 of 10 lines"
    and the sheet charges $8 a line, and neither number came from anywhere. Retell publishes 20 free and
    $8.00 and returns both on `GET /get-concurrency`. Fails rainy 10 and blocks on owner question 2.

13. **The batch door throws the purchase away.** `components/batch-detail.tsx`:238-245 passes
    `purchased={0} queued={0} totalLines={10}` and `onCommit={() => setOpen(false)}`, so the quantity is
    discarded, the gauge never moves, and the queue estimate cannot render on the one door a user reaches
    while a queue is actually building. Fails rainy 8.

14. **Two more doors pass `capHeadroomUsd={null}`,** at `app/(dashboard)/monitor/live/page.tsx`:214 and
    `components/wizard/step-call-settings.tsx`:484. That null deletes the cap-versus-speed-up warning at
    `concurrency-card.tsx`:340-349, which learning 4 identifies as the only idea in this feature no
    competitor ships: not one of the five connects buying capacity to the balance it burns. Fails rainy 8.

15. **Four mounts of one sheet, four private counters.** `concurrency-card.tsx`:50,
    `monitor/live/page.tsx`:211, `batch-detail.tsx`:241 and `step-call-settings.tsx`:481 each hold their
    own `purchased` state. Add five lines in the campaign wizard and the billing gauge still says ten.
    One door per action, broken four ways. Fails rainy 22.

16. **Two defaults for one number.** The wizard's "Max concurrent" field defaults to 10
    (`components/wizard/step-call-settings.tsx`:235); the live Console clamps campaign concurrency to 15
    (`campaign-call-settings-limits.ts`:6). Neither is the account's real ceiling. Fails rainy 6.

17. **The spend enum has no word for the state the product spends most of its first month in.**
    `SpendState = "free" | "payg" | "cap_warning" | "cap_hit"` at `lib/campaign-data.ts`:1258, and
    `spendStats()`:1272 only leaves `"free"` when `cardOnFile` is true. An account that has used all 300
    free minutes with no card, whose calls are paused, reports `state: "free"`. `usage-spend-card.tsx`:93
    patches around it with a local `exhaustedNoCard` boolean; `concurrency-card.tsx`:56 and
    `batch-detail.tsx`:54 read the enum and inherit the wrong answer. `AccountSuspended`, which shares the
    same HTTP 422 as the concurrency wall, has no value at all. Fails rainy 13.

18. **The two events that carry X1's locked counter-metric are declared and never fired.**
    `lib/analytics.ts`:71-72 states the rule, "spend_alert_fired MUST precede spend_cap_hit for the same
    cap". `Events.spend_alert_fired` and `Events.spend_cap_hit` appear in no component, and
    `Events.usage_viewed` (:136) is not fired on the Usage page, so that page has no view event either.
    The banners render; nothing records that they did. Fails the success event in `01-jtbd.md`.

19. **The builder offers two Agora-managed keys Agora does not resell and refuses one it does.**
    `MANAGED_PROVIDERS` at `lib/campaign-data.ts`:1834-1839 lists OpenAI, Anthropic, Deepgram and
    ElevenLabs. The published managed catalog is ARES, Deepgram, OpenAI and MiniMax. Three consumers read
    the list, `components/wizard/stack-config.tsx`:83-93 and :762 and `lib/backup-providers.ts`:78, so
    feature 07's backup pool inherits the same two wrong vendor names. The comment directly above the
    list states the rule it breaks. Fails rainy 16 and the honesty floor.

20. **The managed credential row prints a bare comma where the key hint belongs.**
    `lib/campaign-data.ts`:1843 sets `keyHint: ", "` on the ElevenLabs "Managed by Agora" row, rendered
    raw at `components/vendor-credentials-panel.tsx`:121. The same two characters survive in the spend
    card's own copy, "cap used , $37.50 left" at `usage-spend-card.tsx`:225 and again at :378. All three
    are residue from the em-dash removal pass. Fails the copy rules.

21. **The live Console lists an agent-minutes product that can chart nothing.**
    `ng-console/src/lib/usage/usage-catalog.ts`:589-593, `convoai-agent-call-minutes` labelled "ConvoAI
    Agent Call Minutes" with `metrics: []`, offered in the AI group at :633. Select the one row named
    after this feature's unit and the chart has no series to draw. Fails rainy 1 and
    [868khza4m](https://app.clickup.com/t/868khza4m).

22. **"Credits" is in the feature's name and is not a thing the product has.** The real nouns are
    `accountBalance - reservedBalance` (`ng-console/src/lib/subscriptions/subscriptions-model.ts`:756-758)
    and the free entitlements, equity items 19 "Duration" and 23 "Ares ASR" (:1412-1460). The only place
    "credits" is a product noun belongs to RTC pre-paid (`billing/plans/page.tsx`:53-54), and `/billing`
    shows "Available Balance $1,286" and "Reserved Balance $12" as static text
    (`app/(dashboard)/billing/page.tsx`:38-53). Fails rainy 25 and blocks on owner question 3.

23. **The page says "consumed by this project" and has no project.** The subtitle is at
    `app/(dashboard)/billing/usage/page.tsx`:231; the toolbar at :235-271 carries a workload toggle, a
    period select and Export, and no project selector, while the Console's own usage page has one. Fails
    [868kyr0ft](https://app.clickup.com/t/868kyr0ft).

24. **There is no model, vendor or agent dimension anywhere in either codebase.** The finest grain is a
    product feature row, in the wireframe (`TOP_SERVICES`:190-197) and in the Console alike
    (`ng-console/src/lib/usage/usage-api.ts`:13-40, whose `model` field is the Agora usage model and
    defaults to the string `"duration"`). The whole of
    [868kyr0ft](https://app.clickup.com/t/868kyr0ft) has no surface today. Fails rainy 17 and 18.

25. **Nobody knows what Archer is.** It appears three times in this repo, all of them the same roadmap
    row, and nowhere in `ng-console` or on docs.agora.io.
    [868khqb6d](https://app.clickup.com/t/868khqb6d) is a P0 due this month and it cannot be scoped, let
    alone designed, until owner question 1 is answered.

## What is right, and must survive any redesign

- **The wall is designed behaviour, not a purchase prompt.** "New batch calls queue. Nothing drops or
  fails." with "Keep queuing" as a first-class, tracked decline. Vapi blocks the call, Retell holds it 40
  seconds then transfers it away, ElevenLabs charges double, LiveKit fails it.
- **Included and purchased stay separate numbers,** with the seam visible in the gauge
  (`concurrency-card.tsx`:167-173), and line fees stated as a subscription the spend cap does not govern
  (:190-193).
- **The cap-versus-capacity warning** at :340-349. No competitor connects the two, and the sheet already
  computes it.
- **Estimates show their inputs,** "queued × ~2 min ÷ lines" (:254-258), and commit buttons carry the
  exact prorated amount.
- **The projection never exceeds the cap on display, and the clamp is disclosed**
  (`usage-spend-card.tsx`:86-87 and :279-284).
- **The meter switches unit at the free-to-pay boundary**, minutes while free, dollars-of-cap after.
- **`StateBanner`, `AddCardSheet` and `AddLinesSheet` are already the shared surfaces.** Any new capacity
  or money control that is not one of them is drift.
- **The pricing fact.** $0.10 per agent-minute, the same under a bring-your-own key, so managed is
  cheaper and model choice cannot move the Agora line of the bill. The builder's cost chip
  (`stack-config.tsx`:1291-1305) is the one place it is currently told correctly.
- **The Console's estimate dialog already says the honest thing about every figure on a usage screen:**
  it estimates charges so far this month, and the bill is generated at the start of the next one
  (`ng-console/src/lib/i18n/resources/en/common.ts`:5130-5175).
