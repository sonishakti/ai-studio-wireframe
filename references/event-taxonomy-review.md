# Event Taxonomy Review — Self-Service Lead ROI

**Reviewed:** 2026-05-22
**Source:** [Notion — Agora AI Agent Studio KPI Strategy](https://www.notion.so/shaktisoni/Agora-AI-Agent-Studio-KPI-Strategy-for-Self-Service-Lead-ROI-350d34ba04f980ad9e17cbb4c3b12aae)
**Reviewer lens:** Maps onto [measurement-framework.md](measurement-framework.md) and the [LEARNINGS.md](../LEARNINGS.md) baseline (93% drop at Console↔Studio seam, H1 v3 target: published-and-kept-7-days ≥ 60%).

---

## TL;DR

The three-Aha structure (`agent_tested_baseline` → `agent_tested_configured` → `agent_tested_production`) is the right backbone — it puts the "moment of belief" at the center of the funnel three separate times. Keep that.

But there are **7 issues** that will distort the data if instrumented as written. P0 means "fix before shipping the tracking plan." P1 = "fix before the first executive readout."

---

## P0 — fix before instrumentation

### 1. "Revenue Leak" tracks only half the story

`credentials_added (BYOK ASR/LLM/TTS)` is flagged Revenue Leak. **But the inverse event is missing** — the moment a user *keeps* Agora-managed providers and starts generating revenue.

**Fix.** Add:
- `provider_default_kept` — user reached `agent_tested_configured` without ever firing `credentials_added` for that provider type (ASR / LLM / TTS separately). This is **Revenue Win** — the counter-event to BYOK leak.
- Track per-provider-type, not as a single boolean. A user might BYOK their LLM (high-margin leak) but keep Agora TTS (low-margin keep). That nuance gets lost in a single flag.

**Why P0.** Without the counter, you can only measure leak; you can't measure win. You'll celebrate "BYOK adoption" while missing that the BYOK adopters are your *most* valuable users — because they integrated deeper before churning.

### 2. `agent_configured` is ambiguous — define what counts

What's the difference between `agent_created` (step 4) and `agent_configured` (step 5)? If a user picks a template and renames it, did they "configure"? If they only changed the system prompt? Only swapped the voice? Only added a phone number?

**Fix.** Split into 4 events with explicit triggers:
- `agent_prompt_edited` — system prompt diff > 10 chars from template default
- `agent_voice_changed` — voice provider OR voice ID changed
- `agent_model_changed` — LLM provider OR model changed
- `agent_knowledge_added` — at least one knowledge source attached

Roll those up to the `Personalisation` stage for funnel views, but track them individually so you can see *which* customization predicts retention.

**Why P0.** The current `agent_configured` is a black box. You'll never know which customization actually drives the third Aha.

### 3. `agent_tested_*` needs a "succeeded" qualifier

"Tested" is currently binary — clicked Start Call or didn't. But a call that fails mic permissions, a vendor 401, a network timeout, or the user hanging up at "Hello" all count the same as a successful test. They produce wildly different funnels downstream.

**Fix.** Each Aha event needs a `_succeeded` companion:
- `agent_tested_baseline` (called) → `agent_tested_baseline_succeeded` (≥1 complete user-agent turn with audio both directions)
- Same for `_configured` and `_production`

The succeeded variant is the one that should feed Aha funnel metrics. The unqualified version is for diagnostics.

**Why P0.** Without this split, you'll think activation is healthy when 30% of "tests" are failed mic prompts.

---

## P1 — fix before first executive readout

### 4. `plan_selected OR card_added` collapses two different leaks

Treating these as one event hides whether the friction is **plan ambiguity** (user can't choose a plan) or **payment ambiguity** (user chose but won't enter card).

**Fix.** Track separately:
- `plan_selected` — user clicked a plan card (pre-payment intent)
- `card_added` — payment method saved
- `subscription_active` — both above + first billing cycle starts

Funnel: `plan_selected` → `card_added` → `subscription_active`. Today's "OR" collapses three transitions into one.

**Why P1.** When conversion drops, you need to know whether to redesign the pricing page or the payment form.

### 5. `free_minutes_exhausted → account_suspended` skips the grace state

The arrow implies suspension follows exhaustion immediately. In practice (and per [LEARNINGS §6 — Broken Error Recovery](../LEARNINGS.md)), there should be a warning state and a grace period.

**Fix.** Three states, not two:
- `free_credits_threshold_warning` — at 80% of free cap (proactive nudge)
- `free_minutes_exhausted` — at 100% (still functional for read-only / observe)
- `account_suspended` — after grace window (e.g. 24h) and no card added

This also gives Recovery a meaningful event funnel: `account_suspended → card_added → account_reactivated`.

**Why P1.** Without the warning, you can't measure whether proactive nudges (in-app banner, email) actually save revenue. With it, you can A/B-test the nudge.

### 6. Missing observation + iteration events

The taxonomy ends at `agent_tested_production` (Aha 3) and jumps to monetization. But the **retention engine** is the observe → iterate loop, which has no events:
- `analytics_opened` — user viewed dashboard after production traffic
- `call_history_filtered` — user searched/filtered for a specific call
- `call_replayed` — user opened a specific call playback or transcript
- `agent_edited_after_production` — agent diff occurred ≥ 1 hour after Aha 3
- `agent_redeployed` — new deploy after Aha 3

**Fix.** Add the 5 events above. Group them as "Iteration."

**Why P1.** H1 v3's target (published-and-kept-7-days ≥ 60%) is a retention metric. If you only track production-test and 30-day-sustained, you can't see what predicts the 30-day outcome at day 2 — which is when intervention is still possible.

### 7. Missing escalation / friction events

If a user opens support or reads docs mid-funnel, that's a strong signal of *struggle*, not failure. Without it, you can't tell whether a low conversion step is "the design is bad" or "the design is fine but users want more info before committing."

**Fix.** Add:
- `docs_viewed` (categorized: getting_started / vendor_creds / deploy / billing)
- `support_ticket_opened` (with the stage the user was in)
- `contact_sales_clicked` (signal of B2B intent — should NOT be in self-serve loss column)

**Why P1.** `contact_sales_clicked` from a "stuck" self-serve user is actually a *successful* hand-off, not a CAC loss. Currently no way to distinguish.

---

## P2 — nice to have

### 8. Numbering has a gap at #2

The list jumps from #1 to #3. Either renumber, document the intentional gap, or add the missing event (suggested: `first_session_started` — distinct from `account_created` because account creation can complete without the user ever returning).

### 9. `agent_publish` (struck) — yes, remove

Confirmed against the wireframe and [measurement framework](measurement-framework.md). The new flow has no Publish step — Deploy is the named action. Remove this event entirely. Don't keep it as a deprecated alias; alias debris pollutes future analytics.

### 10. Group field inconsistency

Some rows have `Group`, some don't. Rows 3, 7, 11, 14, 16 are missing it. Suggested filling:

| Row | Stage | Group |
|---|---|---|
| 3 | Aha 1 | Evaluation |
| 7 | Aha 2 | Personalisation |
| 11 | Aha 3 | Integration |
| 14 | Recovery | Risk |
| 16 | Retention | Retention (new top-level group) |

### 11. Define `sustained_usage_30d` precisely

"30 days of usage" can mean 30 consecutive days, 30 days in a rolling 60-day window, or any usage event in a 30-day window. These produce 3 different cohorts.

**Recommendation.** `sustained_usage_30d = ≥1 successful_call event on ≥7 distinct days within the 30 days after first_paid_minute`. Hard-define this in the doc — once instrumentation ships, redefining is expensive.

### 12. `app_connected` vs `channel_connected` need a doc paragraph

The distinction (web SDK vs phone/SIP/WhatsApp) is internally clear but won't be to a new analyst. Add a one-sentence definition next to each in the canonical taxonomy doc.

---

## Two events I'd add unprompted

These don't fix issues — they fill blind spots:

### A. `template_browsed_without_clicking` (or its dual `template_card_clicked`)

The persistent right-rail in the new wireframe lets users *consider* a template before testing it. If users browse 3 templates before testing one, that's expensive cognition. Track template impressions / click-through to find the templates that aren't earning their slot.

### B. `cost_estimate_viewed` (during Deploy modal)

When a user opens the Deploy modal and clicks the Cost tab, they're doing pre-commitment math. This is a strong predictor of who will later become a paid customer vs. who will churn at first invoice. Worth tracking as a leading indicator of `first_paid_minute`.

---

## Recommended structure of the canonical taxonomy

Final shape after applying P0+P1+P2:

```
EVALUATION
  account_created
  first_session_started

AHA 1 — Evaluation
  template_card_clicked
  agent_tested_baseline
  agent_tested_baseline_succeeded

ADOPTION
  agent_created

PERSONALISATION
  agent_prompt_edited
  agent_voice_changed
  agent_model_changed
  agent_knowledge_added
  credentials_added                  [Revenue Leak]
  provider_default_kept              [Revenue Win]

AHA 2 — Personalisation
  agent_tested_configured
  agent_tested_configured_succeeded

INTEGRATION
  app_connected                      (web SDK / iframe / embed)
  channel_connected                  (phone / SIP / WhatsApp)
  cost_estimate_viewed               (during Deploy modal)

DEPLOYMENT
  agent_deployed                     (was agent_publish — renamed)

AHA 3 — Production
  agent_tested_production
  agent_tested_production_succeeded

ITERATION (new)
  analytics_opened
  call_history_filtered
  call_replayed
  agent_edited_after_production
  agent_redeployed

ACTIVATION — Conversion
  plan_selected
  card_added
  subscription_active

RISK
  free_credits_threshold_warning     (80% nudge)
  free_minutes_exhausted             (100%, still observable)
  account_suspended                  (after grace)        [CAC Loss]

RECOVERY
  account_reactivated

MONETIZATION
  first_paid_minute

RETENTION
  sustained_usage_30d                (defined: ≥1 successful_call on ≥7 days in 30d after first_paid_minute)

ESCALATION / FRICTION (orthogonal — fires from any stage)
  docs_viewed
  support_ticket_opened
  contact_sales_clicked
```

Total: 28 events (up from 16), but each one answers a question the original 16 couldn't.

---

## What this changes about the measurement framework

[`measurement-framework.md`](measurement-framework.md) used proxy names (TTFC, TTFD, TTFP). Map them to the canonical taxonomy:

| Framework name | Taxonomy event |
|---|---|
| TTFC (Time-to-First-Call) | `account_created` → `agent_tested_baseline_succeeded` |
| TTFD (Time-to-First-Deploy) | `account_created` → `agent_deployed` |
| TTFP (Time-to-First-Production-Call) | `agent_deployed` → `agent_tested_production_succeeded` (where caller-id ≠ deployer) |
| H1 v3 north-star (kept-7-days) | `agent_deployed` AND `agent_redeployed-or-no-undeploy` within 7 days |

The A/B tests in the framework can use these event names directly.

---

## Two things the team should agree on before instrumenting

1. **What's a "successful call"?** Single source of truth: ≥1 complete user-agent turn with audio in both directions, no error code. Document once.
2. **PII handling in events.** Caller phone numbers, transcripts, agent prompts — none of these should be in event payloads. Hash IDs, drop content. EU AI Act / GDPR per [LEARNINGS §3](../LEARNINGS.md).

Both are out of scope for this review but need to be locked down before tracking goes live.
