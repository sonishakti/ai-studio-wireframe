# 22 · Usage, credits & concurrency — competitor teardown from public docs (2026-09-17)

Docs only. The signed-in product is captured separately from the shot list at the end of this file.
Question asked of every vendor: **can a developer see the ceiling they are running against, raise it
without a sales call, and find out afterwards what the money went to?**

Four references plus one. The fifth is **OpenAI Platform**, added because the four voice vendors all
answer "what am I paying for" the easy way: model choice moves their bill, so a per-model breakdown is
just an invoice. Agora's rate is flat (`00-brief.md` §Agora fact-check, $0.10/min managed or BYO), so
the only useful reference is a product that has already separated the grain it meters from the grain it
bills. OpenAI is that product, and LEARNINGS §20 (2026-07-09) already cites its cap-plus-alert pattern
as the source for X1, so this continues that research rather than reopening it.

---

## Vapi

**Surface, and there are three of them.** Credits and auto-reload live on `Dashboard` then `Billing`.
Capacity add-ons live on the same page under a `Packages & add-ons` tab. The ceiling itself is a
read-only pair of fields in `Organization Settings`, where the changelog puts "your call concurrency
cap and API request rate limit" once Vapi started showing them at all.
https://docs.vapi.ai/billing/manage-billing-and-credits · https://docs.vapi.ai/billing/manage-packages-and-add-ons ·
https://docs.vapi.ai/calls/call-concurrency

**The unit, named in one sentence.** "Call concurrency represents how many Vapi calls can be active at
the same time. Each call occupies one slot, similar to using a finite set of phone lines." The add-on is
called **Concurrent call lines**, and "Each line adds one simultaneous call on top of your
subscription's included concurrency". One pool: "All inbound and outbound calls share this capacity."

**The purchase control.** Three steps in the docs' own words: select "Change capacity add-ons", "Set the
number of additional call lines and organizations you want", then "Review the summary and the prorated
amount due today, then proceed to payment". Price is on the pricing page, not in the docs:
"$10 / line / month". Included concurrency is a plan property, 4 on no Success Package, 10 on Core, 30
on Pro. https://vapi.ai/pricing

**The floor on the way down, stated as a rule.** "You cannot reduce an add-on below the capacity
currently in use." This is the only downgrade sentence in the five vendors.

**The safeguard that is not there.** A campaign has its own max concurrency and the docs disclaim it
immediately: it limits that campaign but "does not reserve additional call lines". Nothing in the
purchase flow says how many lines the account is allowed to buy.

**What happens at the wall.** "you cannot start an outbound call or accept an inbound call until a slot
becomes available", and the call object carries `concurrencyBlocked`, true "if the call could not start
because all slots were full". There is no queue. Vapi's answer to queueing is a recipe for building one
outside Vapi, on Twilio, with a `MAX_CONCURRENCY` environment variable and hold music.
https://docs.vapi.ai/calls/call-queue-management

**Money.** Credits are the wallet: "Vapi credits are prepaid funds in US dollars that cover usage-based
charges", "$5 free credits to get you started", auto-reload is "When the credit balance reaches a
threshold you set, Vapi automatically purchases the top-up amount you choose". At zero: "If your credit
balance reaches $0 and auto-reload is off, Vapi freezes the subscription. You cannot start new calls or
other billable usage until you purchase more credits." That freeze is the penalty anti-pattern X1
already ruled out (LEARNINGS §20, 2026-07-09).

**Per-model money, and its honesty clause.** The platform fee is "$0.05/min Vapi hosting" and providers
are "Models pass-through at cost". Component costs appear in a dashboard panel called **Performance
Metrics**, each in its own unit: transcriber in "Minutes of audio", model in "1 million input and output
tokens", voice in "Characters of spoken text". The disclaimer is the useful part: the figures "provide
estimates for comparison rather than exact quotes", low for cached prompts and high for long
conversations. https://docs.vapi.ai/assistants/model-intelligence/understanding-cost

**BYO keys.** "you won't be charged when using that provider through Vapi. Instead, you'll be charged
directly by the provider." The provider line leaves Vapi's bill entirely, which is the opposite of
Agora's contract. https://docs.vapi.ai/customization/provider-keys

---

## Retell AI

**Surface.** `Settings` then `Limits`, on a card named **Concurrent Calls Limit** with an
**Adjust Concurrency** action. Usage and credits are on `Billing`, split across a balance and a Usage
tab. https://docs.retellai.com/deploy/concurrency · https://docs.retellai.com/accounts/billing

**This is the only vendor whose concurrency object is fully public, and it is the shape we need.**
`GET /get-concurrency` returns nine fields (https://docs.retellai.com/api-references/get-concurrency):

| Field | What it means |
|---|---|
| `current_concurrency` | "The current concurrency (amount of ongoing calls) of the org." |
| `concurrency_limit` | "The total concurrency limit … of the org." |
| `base_concurrency` | "The free concurrency limit of the org." |
| `purchased_concurrency` | "The amount of concurrency that the org has already purchased." |
| `concurrency_purchase_limit` | "The maximum amount of concurrency that the org can purchase." |
| `remaining_purchase_limit` | "The remaining amount of concurrency that the org can purchase." |
| `reserved_inbound_concurrency` | "Number of normal concurrency slots reserved for inbound calls." |
| `concurrency_burst_enabled` | burst mode on or off |
| `concurrency_burst_limit` | read-only, 0 when burst is off |

`concurrency_purchase_limit` and `remaining_purchase_limit` are the literal "capacity-aware safeguard"
that 868ka690p asks for, and they are fields on a read endpoint, not a sales process.

**Price and default.** "Free for first 20 concurrency (active calls)" and "$8.00/Concurrency/month".
Our wireframe's `pricePerLineMo: 8` is that number, and our `included: 10` is half of Retell's free
allowance (`campaign-data.ts` :1224 and :1213 both say the values were guessed).
https://www.retellai.com/pricing

**Burst is a third state between having capacity and not having it.** "Your burst limit is calculated as
the lower of: 3× your concurrency limit, OR your concurrency limit + 300", and burst calls are charged
"$0.10/min for the entire call duration", not for the overflow portion. Reserved inbound concurrency
must be lower than the standard limit, so a reservation cannot starve outbound.

**What happens at the wall.** Outbound is "rejected, unless concurrency burst is enabled". Inbound waits
roughly 40 seconds for a slot, then transfers to a fallback number or ends with
`concurrency_limit_reached`. A queue exists, it is 40 seconds long, and it is inbound only.

**Money, and the split that matters.** Credits are the wallet: "$10 in free trial credits", "Credits
never expire, but they are non-refundable once purchased", auto recharge has two fields, "When credits
drop below" and "Bring credits back to", and at zero "new calls are blocked until you buy credits or
auto recharge tops up your balance". Then the split: **purchased concurrency, CPS, phone numbers and
knowledge bases past the free tier are subscription items billed to the card, not drawn from credits.**

**And yet concurrency is a row in the usage breakdown.** The Usage tab shows total cost, minutes,
"Average cost per minute", a daily or weekly series, and a **Cost by provider** block with exactly four
categories: "Voice infra", "LLM", "Telephony" and "Concurrency". The fee is not metered and is still
shown beside the metered rows.

**Per-model money, at call grain.** `call_cost` carries `product_costs[]`, each entry
`{product, cost, unit_price, is_transfer_leg_cost}` with `product` values like `elevenlabs_tts`, plus
`total_duration_seconds`, `total_duration_unit_price` and `combined_cost`. The price list behind it is
per model per minute: "Retell Voice Infra $0.055/minute", "Retell Platform Voices $0.015/minute",
"Elevenlabs Voices $0.040/minute", "Claude 4.5 sonnet $0.08/minute", "GPT 5.4 mini $0.024/minute".
https://docs.retellai.com/api-references/get-call

**The two exceptions it publishes.** A call under ten seconds that uses a dynamic opening message has a
"Minimum charge of 10 seconds", and a prompt over 4,000 tokens is billed on inflated duration:
"Scaling Factor = Prompt LLM Tokens ÷ 4,000", so 60 seconds at 4,800 tokens bills as 72.
https://docs.retellai.com/accounts/billing-exceptions

**What Retell refuses.** No BYO provider key anywhere in the pricing or billing docs: the model list is
the menu and the per-minute price is the price. Purchased concurrency is capped by
`concurrency_purchase_limit`, so self-serve has an end.

---

## ElevenLabs (Agents Platform)

**Surface.** Concurrency is not a thing you buy, it is a property of the plan: Free 4, Starter 6,
Creator 10, Pro 20, Scale 30, Business 40 concurrent calls, with minutes included per tier and "$0.080
per minute" after. https://elevenlabs.io/pricing/agents

**The override is per agent and it is a price, not a purchase.** `Security` tab, `Limits` section,
toggle **Enable bursting**. Then: calls inside the limit bill at standard rates, and additional calls
"up to a concurrency of 3x your usual limit or 300, whichever is lower" are "accepted but charged at 2x
the normal rate", so $0.16 a minute. "For non-enterprise customers, the maximum burst currency can not
go above 300." https://elevenlabs.io/docs/agents-platform/guides/burst-pricing

**Credits are the unit and they are shared across every product**, not scoped to agents. The usage view
lives at `Developers` then `Analytics` then `Usage`, and breaks credit consumption down "by voice,
product, or API key", plus by individual user and by workspace group inside a workspace. One of the
metrics on that page is "Concurrent requests", so the ceiling and the spend sit on the same screen.
https://elevenlabs.io/docs/overview/administration/usage-analytics

**Allocation exists, and it is a cap per child workspace.** "billing workspace admins can set an
optional credit limit on each reporting workspace to cap how many credits it can consume during a
billing cycle", reached from `Child Workspaces` then `Set Limits` then `Set Credit Limit`. When it
bites, "all requests made from that workspace are rejected until the next billing cycle or the limit is
removed". This is the only per-team allocation control in the five, and it is a hard stop with no
decline path. https://elevenlabs.io/docs/overview/administration/consolidated-billing

**Per-model money, and the closest thing to what 868kyr0ft describes.** The agent analytics dashboard
has four tabs, `General` · `Tools` · `LLMs` · `Workflow`. It shows "Call count", "Total duration",
"Average duration", "Total cost", "Average cost", and lets you "Group by LLM model to compare model
performance and cost". https://elevenlabs.io/docs/eleven-agents/dashboard

**And a pre-commitment estimator that derives from the agent's own configuration.**
`POST /v1/convai/llm-usage/calculate` takes `prompt_length` ("Length of the prompt in characters"),
`number_of_pages` ("Pages of content in PDF documents or URLs in the agent's knowledge base") and
`rag_enabled`, and returns `llm_prices[]` of `{llm, price_per_minute, price_per_message}`. A per-model
price per minute, computed from what you actually built, before you commit. That is our `stackCost()`
(`campaign-data.ts` :985) with a real API behind it.
https://elevenlabs.io/docs/agents-platform/api-reference/llm-usage/calculate

**The clause worth stealing.** Silence is billed, and disclosed: "These periods are billed at 5% of the
usual per minute rate." https://elevenlabs.io/docs/eleven-agents/customization/llm/optimizing-costs

**What ElevenLabs refuses.** It will not sell you one more concurrent call. More capacity means a higher
plan or the Enterprise team, and the only self-serve relief is paying double per minute for calls you
were already going to make.

---

## LiveKit (Agents · Cloud)

**Surface.** A quota table, per project, read-only. "You can view the current limits on your project at
any time in the LiveKit Cloud dashboard by navigating to Settings and selecting the Project tab."
https://docs.livekit.io/deploy/admin/quotas-and-limits/

**The numbers.** Concurrent agent sessions: 5 on Build, 20 on Ship, "Up to 600 (Starts at 50, request
more via dashboard)" on Scale, custom on Enterprise. The quota table is longer than the concurrency row:
STT connections 5 concurrent, TTS connections 5, LLM 100 requests per minute and 600,000 tokens per
minute, participants 100, ingress and egress 2 each. Every limit that can bite is on one page.

**What happens at the wall.** "When a quota is reached, new operations of that kind fail until
conditions allow them again." On the free tier the included allowance "acts as a hard cap", and after it
"new requests fail rather than incurring overage charges". No queue, no burst, no surcharge.

**The purchase path, such as it is.** "Customers on the Scale plan can request an increase for specific
limits in their project settings." Self-serve is a request form, and only above $500 a month. Below
that, the only lever is the plan: Build $0 with 1,000 agent session minutes, Ship $50 with 5,000 "then
$0.01 per min", Scale $500 with 50,000 on the same overage. https://livekit.com/pricing

**Money, metered in four different units on purpose.** Agent sessions are "metered by agent session
time, in increments of 1 second with a 10-second minimum per session". Inference is metered separately
per component: STT in "Seconds (connection time)", LLM in "Tokens (input and output)", TTS in
"Characters (text)". https://docs.livekit.io/deploy/admin/billing/

**Per-model money exists, and the plan changes it.** Inference pricing is per model, "per 1M tokens" for
LLMs, "per minute" for STT, "per 1M chars" for TTS, and Scale gets a different number for the same
model: Cartesia Sonic is "$50" on Build and Ship and "$37.50" on Scale. So at LiveKit the model and the
plan both move the bill, and neither is hidden.

**BYO keys are a peer path with no documented billing consequence.** LiveKit Inference "does not require
any additional plugins"; the alternative is a plugin, where "Each plugin requires that you have your own
account with the provider, as well as an API key or other credentials". The docs never say what the
invoice looks like either way. https://docs.livekit.io/agents/models/inference/

**Observability carries no money at all.** Agent insights is transcripts, traces with "token counts,
durations, speech identifiers", logs and audio. No cost, no per-model spend, no quota.
https://docs.livekit.io/deploy/observability/insights/

---

## OpenAI Platform (the fifth, docs only)

**Why it is here.** It is the only public product where capacity rises without anyone being asked, and
the only one that has already answered our question 4: what do you do when the grain you can meter is
not the grain you can bill?

**Capacity is a consequence of spend, not a purchase.** Usage tiers: Free, then Tier 1 at "$5 paid",
Tier 2 at "$50 paid", Tier 3 at "$100", Tier 4 at "$250", Tier 5 at "$1,000", with monthly limits of
$100, $100, $500, $1,000, $5,000 and $200,000. "As your spend on our API goes up, we automatically
graduate you to the next usage tier." Nobody clicks anything. The current position is readable on every
response: `x-ratelimit-limit-requests`, `x-ratelimit-remaining-requests`, `x-ratelimit-reset-requests`
and the token equivalents, plus `Retry-After`, "The minimum number of seconds to wait before retrying a
temporary rate-limit error". https://developers.openai.com/api/docs/guides/rate-limits

**The two grains, kept apart on purpose.** The Usage API groups by `model`, `project_id`, `user_id` and
`api_key_id`. The Costs API groups by `project_id` and `line_item`, where a line item reads
"ft-gpt-4o-2024-08-06, input". And the docs say the two do not tie out: usage "may not always reconcile
perfectly with Costs", so for financial purposes use the Costs endpoint, which "will reconcile back to
your billing invoice". Even where model choice genuinely moves money, the model-shaped view is the
usage view and the money view is shaped like an invoice.
https://developers.openai.com/cookbook/examples/completions_usage_api

---

## The five, side by side

| | **Vapi** | **Retell** | **ElevenLabs** | **LiveKit** | **OpenAI** |
|---|---|---|---|---|---|
| **Can you see your ceiling** | Yes, read-only in Organization Settings | Yes, `Settings` `Limits` card, and nine API fields | Plan row only, plus a "Concurrent requests" metric | Yes, a full quota table per project | Yes, on every response header |
| **Can you raise it yourself** | Yes, "Concurrent call lines" add-on, "$10 / line / month" | Yes, "Adjust Concurrency", "$8.00/Concurrency/month" | **No.** Change plan or call Enterprise | Request form, Scale plan only | Automatic, by spending |
| **Is there a ceiling on the ceiling** | Not published | **Yes**, `concurrency_purchase_limit` and `remaining_purchase_limit` | Burst capped at 3x or 300 | Scale caps at 600 | Tier caps the monthly spend |
| **What happens at the wall** | Call blocked, `concurrencyBlocked: true`; queue is a Twilio recipe you build | Rejected, or burst at "$0.10/min for the entire call duration"; inbound waits ~40 s then fallback | Rejected, or burst at "2x the normal rate" | "new operations of that kind fail" | HTTP error plus `Retry-After` |
| **Does money break down by model** | Estimates only, in Performance Metrics, "for comparison rather than exact quotes" | Yes, `call_cost.product_costs[]` per call and "Cost by provider" per period | Yes, "Group by LLM model" on the `LLMs` tab, plus a per-model `price_per_minute` estimator | Yes, per model and per plan tier | Usage by `model`, cost by `line_item`, and they do not reconcile |
| **Spend control** | Credits, auto-reload, freeze at $0 | Credits, auto recharge with two thresholds, block at $0 | Credit limit per child workspace, requests rejected until next cycle | Free tier is a hard cap; paid plans have overage | Monthly tier limit |

Read the two rows that decide this feature: **two of five sell concurrency self-serve and only one of
those publishes the safeguard**, and **every one of the five breaks money down by model because at every
one of the five the model moves the money.**

---

## What nobody does

**Nobody connects the capacity purchase to the spend control, and all five have both.** Vapi sells lines
and freezes the wallet at zero on a different tab. Retell sells concurrency as a subscription item while
minutes draw down credits in real time. ElevenLabs caps a workspace's credits and separately lets an
agent burst at double the rate. LiveKit hard-caps the free tier and sells capacity by plan. Not one doc
says that buying capacity raises the burn rate against the same balance, and not one purchase flow shows
what the new number does to the month. Our `AddLinesSheet` already computes exactly that and warns when
the cap would pause calls before the extra lines pay for themselves (`concurrency-card.tsx` :340–349).
That warning is the only idea in this feature no competitor has, and it is currently dead in three of
its four doors because they pass `capHeadroomUsd={null}`.

**Nobody queues.** Vapi's published answer is to build a queue on Twilio with hold music and a
`MAX_CONCURRENCY` variable. Retell holds an inbound call about 40 seconds and then transfers it away.
ElevenLabs accepts the call and charges twice. LiveKit fails the request. Our wall banner says "New
batch calls queue. Nothing drops or fails." and offers "Keep queuing" as a first-class decline
(`concurrency-card.tsx` :115–147). That sentence is true of nobody else's product.

**Nobody has had to show model-level usage without model-level money, and that is a warning, not a
gap.** Every per-model breakdown in the five exists because the model is a price: Retell prices Claude
4.5 Sonnet at $0.08/minute and GPT 5.4 mini at $0.024, LiveKit changes the same Cartesia rate by plan,
ElevenLabs bills the LLM "separately on top", Vapi passes providers through "at cost". Agora charges
$0.10 either way. So a breakdown that puts a model name next to a dollar figure will be read as a price
comparison in every account, because that is what it means everywhere else. The only vendor that has
faced the split at all is OpenAI, and its answer is to keep two endpoints: `model` is a usage dimension,
`line_item` is a money dimension, and the docs warn they do not reconcile.

**Nobody shows managed and BYO on the same bill.** Vapi takes the provider line off its invoice entirely
when you bring a key. Retell has no BYO path at all. ElevenLabs bills the LLM separately whichever way
you got it. LiveKit does not document the difference. Nobody has a surface that says, per slot, what the
platform absorbed and what the customer's own provider will bill them separately. Agora's managed mode
is the inverse of all four (`campaign-data.ts` :944, "MANAGED IS CHEAPER"), and there is no competitor
screen to copy for it, which means Studio has to invent the row and label the BYO half honestly as
something Agora cannot see.
