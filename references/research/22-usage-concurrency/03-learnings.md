# 22 · Usage, credits & concurrency — learnings

Evidence: `02-research/_docs.md` (public docs, read 2026-09-17) against `00-brief.md` §Agora fact-check.
Five sentences. Each one moves a control.

1. **The concurrency ceiling is a readable object at four of five vendors, and Retell publishes the exact
   field list to ask Engine for**: `GET /get-concurrency` returns `current_concurrency`,
   `base_concurrency`, `purchased_concurrency`, `concurrency_limit`, `concurrency_purchase_limit` and
   `remaining_purchase_limit` (https://docs.retellai.com/api-references/get-concurrency), which turns
   `ConcurrencyCard`'s gauge from a picture of an invented `included: 10` (`campaign-data.ts` :1213) into
   a picture of a granted number, and makes `remaining_purchase_limit` the literal "capacity-aware
   safeguard" 868ka690p asks for and the one Engine field to file against 868keb6r4.

2. **Model-level usage has to be a minutes column, not a money column, because even the vendor where the
   model genuinely moves the bill keeps the two grains on different endpoints**: OpenAI groups usage by
   `model` and costs by `line_item` and warns that usage "may not always reconcile perfectly with Costs"
   (https://developers.openai.com/cookbook/examples/completions_usage_api), while Retell's per-model
   minute prices and ElevenLabs' "Group by LLM model" both exist only because those models carry
   different prices (https://www.retellai.com/pricing · https://elevenlabs.io/docs/eleven-agents/dashboard),
   so the `"$0.00"` Cost column on every row of `TOP_SERVICES` (`billing/usage/page.tsx` :190–197) must
   become minutes attributed per model and never a dollar figure beside a model name.

3. **The line fee belongs inside the usage breakdown even though it is not metered**: Retell's Usage tab
   shows "Cost by provider" with exactly four categories, "Voice infra", "LLM", "Telephony" and
   "Concurrency", while purchased concurrency is billed to the card and not drawn from credits
   (https://docs.retellai.com/accounts/billing), which means our A6 rule about lines and the cap being
   separate is a rule about what the cap governs and not about where the number is shown, so
   `/billing/usage` gains a concurrency row and `concurrency-card.tsx` :190–193 keeps its sentence.

4. **The cap-versus-capacity warning is the only idea in this feature that no competitor has, and three
   of its four doors have it switched off**: all five vendors ship both a spend control and a capacity
   lever and not one doc connects them (Vapi freezes the wallet at $0 on a different tab from the
   "$10 / line / month" add-on · https://docs.vapi.ai/billing/manage-billing-and-credits ·
   https://docs.vapi.ai/billing/manage-packages-and-add-ons), so `AddLinesSheet`'s headroom math
   (`concurrency-card.tsx` :340–349) is the differentiator and the `capHeadroomUsd={null}` calls in
   `monitor/live/page.tsx` :208 and `wizard/step-call-settings.tsx` :478, plus the hardcoded
   `purchased={0} totalLines={10}` in `batch-detail.tsx` :238, are deleting it.

5. **"New batch calls queue. Nothing drops or fails." is true of nobody else, so the wall stays a
   designed behaviour and not a purchase prompt**: Vapi's published queue is a Twilio recipe with a
   `MAX_CONCURRENCY` variable and hold music (https://docs.vapi.ai/calls/call-queue-management), Retell
   holds an inbound call about 40 seconds then transfers it to a fallback or ends it with
   `concurrency_limit_reached` (https://docs.retellai.com/deploy/concurrency), ElevenLabs takes the call
   at "2x the normal rate" (https://elevenlabs.io/docs/agents-platform/guides/burst-pricing) and LiveKit
   fails it outright (https://docs.livekit.io/deploy/admin/quotas-and-limits/), which keeps "Keep
   queuing" first class at `concurrency-card.tsx` :138–143 and rules out a surcharge-to-continue control
   whatever the owner decides on question 2.
