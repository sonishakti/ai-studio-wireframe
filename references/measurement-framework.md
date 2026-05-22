# Measurement Framework — Activation in Studio_X

**Generated:** 2026-05-22
**Question being answered:** Does the new Studio_X flow actually move users from signup to first production agent faster than the old Console↔Studio split?
**Baseline:** [LEARNINGS.md §2](../LEARNINGS.md) — current funnel has 93% drop at the Console↔Studio seam (Login → Agent-creation started). North-star: Signup → First Agent Published.

This is a wireframe. We can't measure literal seconds yet. We can measure **structural cost**: clicks, screens, mode-switches, dead-ends. Those proxies make a falsifiable prediction the live product will then confirm or refute.

---

## TL;DR — does the new flow help?

**Structurally, yes — by a lot.** Concrete predictions:

| Proxy metric | Old Console | New Studio_X | Δ |
|---|---|---|---|
| Clicks from Home to first **test call** | 8–12 (with seam crossings) | **3** | −70% |
| Clicks from Home to **deploy** | 12–15 | **6** | −55% |
| Distinct screens visited (happy path) | 9 (incl. 2 redirects) | **5** | −44% |
| Cross-product seam crossings | **4** (each a leak point) | **0** | −100% |
| Sidebar mode switches (project ↔ account) | 3+ | **0** | mode removed |
| Test-call affordance | hidden in builder, requires publish-then-call | **persistent right-rail orb, no publish** | structural |

**But.** This is necessary, not sufficient. Structural cost reductions don't automatically convert. They only prevent abandonment from friction; they don't create motivation. Real validation requires the GSM chains and A/B test below.

---

## The activation journey — 8 stages

```
S0  SIGNUP        →  Account created
S1  LAND          →  Home (first-run hero)
S2  TEMPLATE      →  Pick a pre-built agent
S3  TEST          →  First test call (the moment of belief)  ◀── TTFC
S4  CUSTOMIZE     →  Adjust prompt / voice / vendor creds
S5  DEPLOY        →  Push to production (modal)              ◀── TTFD
S6  PRODUCTION    →  First real call from outside            ◀── TTFP
S7  OBSERVE       →  Read analytics / call history
S8  ITERATE       →  Back to S4 with insight
```

The biggest leverage point is **S3 (TTFC — Time-to-First-Call)**. LEARNINGS §2 says ~93% of users who log in never start agent creation — they leave before reaching S3. If Studio_X gets them to a working test call in seconds, that single change recovers most of the leak. Everything downstream of S3 has retention impact but smaller absolute volume.

---

## GSM chains per stage

### S1 — LAND (first-run home)

**Goal.** First-time user understands what Studio is and sees a path to value within 5 seconds of landing.

**Signal.** User clicks one of the 3 pre-built agent cards (rather than bouncing, opening unrelated nav, or scrolling past).

**Metric.** First-card-click rate ≥ 60% of first-run sessions; median time-on-page-before-first-click < 8s.

**Counter-metric.** Bounce rate (left without clicking anything) — must not increase relative to old Console landing. Sessions where the user clicks but then immediately backs out — signals the hero overpromised.

### S2 — TEMPLATE (pick a pre-built)

**Goal.** User selects a template that maps to their intent without choice paralysis.

**Signal.** Click → builder load with template applied, no back-out within 10s.

**Metric.** Template selection completion ≥ 90% of users who reach S2 (clicked a card). Time from card-click to builder render ≤ 1.5s p95.

**Counter-metric.** "Wrong template" reversal — user clicks a card, opens builder, then returns to template list within 60s. If > 15%, the cards aren't communicating outcomes well enough.

### S3 — TEST (the moment of belief) ◀ NORTH-STAR FOR ACTIVATION

**Goal.** User hears a working agent within 60 seconds of landing on the home page.

**Signal.** User clicks "📞 Start Call" on the right-rail orb and the call connects.

**Metric.** **TTFC (Time-to-First-Call) p50 ≤ 90 seconds** from signup completion. p95 ≤ 4 minutes (accounts for first-time mic-permission prompt + network).

**Why this matters.** LEARNINGS.md identifies this as *the* leak — 93% of logged-in users never start agent creation. The persistent right-rail orb is the single biggest structural change targeting this number.

**Counter-metric.** Call-start-but-no-audio rate (mic permission denied or vendor 401). If > 5%, the test surface is creating false success signals — users "try" but get nothing.

### S4 — CUSTOMIZE (adjust before deploy)

**Goal.** User makes the agent feel theirs without leaving the builder.

**Signal.** Edits at least one of: prompt, voice provider, vendor credential, knowledge source — *inside the builder*, not by navigating away.

**Metric.** "Edit-in-place" rate ≥ 70%. Vendor-credential-add-from-builder (vs. cold visit to Vendor Credentials page) ≥ 50%.

**Counter-metric.** Builder-tab abandonment — user opens Knowledge or Integrations tab, then leaves the builder without saving. If > 25%, those tabs are dead weight inside the builder shell.

### S5 — DEPLOY (push to production) ◀ NORTH-STAR FOR ACTIVATION

**Goal.** User commits to production without confusion about cost or scope.

**Signal.** User opens the Deploy modal, reviews tabs (Code / Env / Cost), then confirms.

**Metric.** **TTFD (Time-to-First-Deploy) p50 ≤ 5 minutes** from signup. Deploy-modal-open → confirm conversion ≥ 70%.

**Counter-metric.** Deploy → undeploy within 60 minutes — signals the user clicked Deploy thinking it was a save, not a production push. If > 5%, the modal copy isn't honest about what's about to happen.

### S6 — PRODUCTION (first real call)

**Goal.** A user the deployer didn't initiate (an end-customer, a phone caller, a webhook trigger) interacts with the agent.

**Signal.** Call event from outside the deployer's session/IP.

**Metric.** **TTFP (Time-to-First-Production-Call) p50 ≤ 24 hours** from deploy. Within-7-days conversion of deploy → first external call ≥ 60%.

**Counter-metric.** Deployed agents that never receive a production call within 30 days (≥ 25% would indicate users are deploying speculatively without an integration path).

### S7 — OBSERVE (see what happened)

**Goal.** After a production call, the user finds the call in the console without going through a redirect or seam.

**Signal.** Within 24h of TTFP, user opens Analytics or Call History.

**Metric.** Post-TTFP analytics-open rate within 24h ≥ 50%. Time from "Call History" click to specific call playback ≤ 15s.

**Counter-metric.** Support tickets categorized "I can't find my calls" — must trend toward zero. (Current Console has redirects on `/studio/call-history` and `/studio/session-history` — this is a real ticket category today.)

### S8 — ITERATE (close the loop) ◀ NORTH-STAR FOR RETENTION

**Goal.** User returns to the builder and makes an edit informed by observation.

**Signal.** Agent edit timestamp within 7 days of TTFP.

**Metric.** **Published-and-kept-7-days ≥ 60%** (the H1 v3 target from [LEARNINGS §7](../LEARNINGS.md)). Edit-after-observe rate within 7 days ≥ 40%.

**Counter-metric.** Edits that revert deploys (agent goes from Live → Draft → undeployed). If > 15%, the iteration cycle is creating regret rather than improvement.

---

## Funnel — predicted vs. baseline

Modeling the old Console's leaks against the new Studio_X structure. Numbers are predicted; the A/B test below validates them.

| Transition | Old Console (baseline) | Studio_X (predicted) | How the design earns the lift |
|---|---|---|---|
| Signup → Account | 18.3% complete | 18.3% (unchanged) | Signup is out of scope this pass |
| Account → Land on workspace | ~80% (Console) | ~80% | Identical provisioning |
| Land → Template click (S1→S2) | not measured (no hero) | **60%** | First-run hero with 3 cards, persistent right-rail |
| Template → TFC (S2→S3) | **7%** ← THE LEAK | **55%** | No seam crossing; no publish step; persistent test panel |
| TFC → TFD (S3→S5) | 22.3% (of those who created an agent) | **45%** | Single Deploy button replaces ambiguous Publish |
| TFD → TFP (S5→S6) | not measured | **60%** | Phone numbers / web SDK reachable inside Deploy |
| TFP → Observe (S6→S7) | not measured (redirects) | **50%** | Call History reachable; no `/studio/call-history` 404 |
| Observe → Iterate (S7→S8) | not measured | **40%** | Edit → re-deploy uses same surface, no re-onboarding |

**Bottom-line prediction.** Compound funnel from Signup → Published-and-kept-7-days:
- Old: 0.183 × 0.80 × 0.07 × 0.223 × ... ≈ **0.2%** (rough order of magnitude)
- New: 0.183 × 0.80 × 0.60 × 0.55 × 0.45 × 0.60 × 0.50 × 0.40 ≈ **0.6%** (3× lift)

**A 3× lift is a hypothesis, not a promise.** It assumes the structural changes hold under real user behavior. The A/B test is how we find out.

---

## A/B test plan

### Test 1 — First-run hero presence

**Hypothesis.** "If first-time users land on a hero with 3 clickable pre-built agents and a persistent test panel, then click-to-first-template will increase from baseline ~7% to 50%+, because the moment of belief moves from 'after I configure everything' to 'before I configure anything.'"

**Variants.**
- **A (control).** Current Console: lands on `/project-management`, no hero, no templates surfaced.
- **B (treatment).** Studio_X first-run home with 3-card hero.

**Primary metric.** First-template-click rate within 60 seconds of first session.

**Guardrail metrics.** (must not get worse)
- Signup-to-account completion rate (provisioning unchanged, so this should be flat — if it drops, something else broke)
- Support ticket volume for "I don't know what to do next" — if Studio_X hero is confusing, this rises
- Bounce-without-any-action (left in < 15s) — if hero feels overwhelming, bounce goes up

**Sample size.** Baseline 7%, MDE 20% absolute (7% → 27%) is conservative but easy: ~600 users per variant. MDE 10% absolute (7% → 17%) is more ambitious: ~1,800/variant. Given current cohort of ~10K logged-in users/week, 1 week of traffic suffices.

**Duration.** Minimum 2 weeks to capture day-of-week effects. Don't stop early even if results "look decisive."

**Segmentation.** New-user only (returning users have different mental models). Device split: mobile vs. desktop (different orb interaction patterns expected). Geography: NA / EU / APAC if regional drop-offs differ.

**Decision criteria.**
- Treatment ≥ baseline + MDE with p < 0.05 + guardrails clean → ship it
- Treatment ≥ baseline but below MDE → keep + investigate why effect is smaller than predicted
- Treatment ≤ baseline → roll back, run qualitative to find what's wrong

### Test 2 — Persistent right-rail test panel

**Hypothesis.** "If the test-call orb is persistent on the agents screen (vs. requiring a publish step then a separate call action), then TTFC p50 drops from current ~not-measurable to ≤ 90s."

**Variants.**
- **A.** Builder with separate "Publish" then "Call" actions (Console-Studio status quo).
- **B.** Builder with persistent right-rail orb + Start Call button, no publish-before-test required.

**Primary metric.** TTFC (time from first builder-load to first call-connected event).

**Guardrail.** Cost-of-test calls. Right-rail orb makes testing 10× easier — if average test-calls-per-user explodes (e.g., > 50 per first session), unit economics break. Set a soft cap (toast warning at 10 test calls per hour with cost preview).

**Segmentation.** First-time user (the activation target) separate from returning power user (different mental model — already knows what Publish means).

**Sample size.** TTFC is a continuous variable, so use a Mann-Whitney U or unpaired t-test on log(seconds). Detect a 50% reduction in median with ~150 users per variant.

### Test 3 — Single "Deploy to production" CTA (no publish-then-deploy)

**Hypothesis.** "If users see one named action — Deploy to production — instead of a two-step Publish → Deploy, then deploy-modal-open-to-confirm rate increases and post-deploy regret (within 1h undeploy) decreases."

**Primary metric.** Deploy-modal-open → confirm conversion. Sub-metric: regret-undeploy within 60min.

**Guardrail.** Production incidents from accidental deploys. If users deploy without understanding consequences, monitoring alerts spike. Cap with a confirmation that explicitly says "This routes real traffic and incurs cost" + the Cost tab in the modal.

---

## Counter-metrics — what we explicitly refuse to optimize

Following the [LEARNINGS §6 anti-pattern watchlist](../LEARNINGS.md), the following metrics are **rejected as success signals** even if they would go up:

| Tempting metric | Why we won't optimize it | What we measure instead |
|---|---|---|
| Time-on-page in Studio | Engagement ≠ value. A user staring at the orb in confusion is "engaged." | Task completion (TFC, TFD, TFP) and exits-after-success |
| DAU | A successful user might check once a week. DAU encourages re-engagement nudges. | WAU-with-task-completion (returned and did something meaningful) |
| Test calls per session | Easy to game with infinite-orb-clicks. Doesn't measure quality. | Test calls → deploy conversion (did the testing lead to a real shipped agent?) |
| Templates "tried" | Could be juiced with autoplay or carousel hover-counts. | Templates → builder → deploy conversion |
| Deploy events count | More deploys ≠ better — could mean panicked re-deploys after each bug. | Deploys with positive 24h call rate / total deploys |

**Each user-success metric is paired with a counter-metric.** From the activation journey table in [LEARNINGS](../LEARNINGS.md):
- Activation: TTFC ↑ paired with test-call-failure-rate (mic permission, vendor 401, network)
- Activation: TTFD ↑ paired with deploy-regret-within-1h
- Retention: edits-after-observe ↑ paired with deploy-revert-rate (edit that undeploys)

---

## Learning plan — when to check back

| Cadence | What to measure | Decision |
|---|---|---|
| **Day 1** | Are tests instrumented? Do dashboards return data? | Block launch if no. |
| **Week 1** | TTFC, TTFD, first-template-click rate against predicted targets. Guardrails clean? | If TTFC > 5 min p50, qualitative interviews this week to find the friction. |
| **Week 2** | A/B test reaches sample size. Statistical readout. | Ship treatment / roll back / extend test based on decision criteria. |
| **Month 1** | TFP rate, observe-after-deploy rate, support ticket categories. | Identify the next biggest leak. Likely candidates: vendor credential errors, phone number assignment, billing surprise. |
| **Month 3 (Quarter 1)** | Published-and-kept-7-days vs. H1 v3 target of 60%. RTE-attach rate vs. H4 target of 10–15%. | Decide whether H2 (onboarding redesign) or H4 (RTE expansion) gets the next quarter's attention. |
| **Month 6** | Cohort retention curves: does the new flow produce stickier users, or just faster activations that churn the same? | If retention is unchanged but activation is up, the problem was always the seam — celebrate. If retention drops, activation was easier but the product underneath isn't yet good enough — different problem. |

---

## What we still don't know

**Honest uncertainty list.** These are open questions that the framework above can't answer alone:

1. **Does the orb survive mic permission denial?** First-time mic prompts are jarring. We need usability sessions, not just metrics.
2. **What's the right baseline for TTFP?** No prior data exists for "external call within 24h of deploy" because the old Console didn't make deploy a distinct event. Set provisional, refine after week 4.
3. **Is "Edit → Re-deploy" actually used?** The iterate loop is theoretical until we see whether users actually return to the builder after observing.
4. **Does P1 ("the hustler") tolerate the credits meter?** Hidden in dropdown to keep sidebar lean, but P1 cares about spend. Watch for support tickets asking "how do I check my balance?"
5. **Does removing publish step cause confusion?** Some users may *expect* a "save without deploying" semantics. Watch for support tickets categorized "I made changes but they don't seem to be live."

For each of these, the pairing is the same: **a metric for breadth, an interview for depth.** Numbers alone won't tell us what to do.

---

## Ethical floor — what we will not measure or do

Per [LEARNINGS §6](../LEARNINGS.md) the rejected anti-patterns translate directly into measurement guardrails:

- **No nudging via fake urgency.** No "your free credits expire in 24 hours" countdowns unless they're literally true.
- **Symmetric cancellation.** If deploy is a one-click action, undeploy/cancel must also be one click. We measure both.
- **AI disclosure default opt-in.** If we ever optimize for higher disclosure-skip-rate, we have crossed a line.
- **Honest costs.** Cost tab in Deploy modal is not optional. Removing it to "reduce friction" is a dark pattern even if conversions rise.
- **No engagement loops for their own sake.** Notification preferences default to OFF for anything that isn't an explicit user request. Measure opt-in to notifications, not delivery rate.

A green dashboard built on any of these patterns is a failure, not a success.

---

## Bottom line for the question asked

**"Does this new flow actually help users get activated faster?"**

Predicted answer: **yes, by ~3× on the compound funnel from signup → 7-day-retained published agent.**

Confidence: **moderate.** Structural cost is provably lower (clicks, screens, seam crossings, mode-switches are all down). Behavioral conversion is a hypothesis — the A/B tests above are how we find out.

The one number that decides it: **published-and-kept-7-days ≥ 60%** (H1 v3 from LEARNINGS). Everything else is leading indicators.
