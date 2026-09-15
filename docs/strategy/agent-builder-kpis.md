# Agent builder — KPIs, assumptions and telemetry

> Status: proposal for owner sign-off · 2026-09-15
> Scope: the Studio X 2 agent builder (`studio_x_2`), measured on the live console's
> existing PostHog stack (`ng-console/docs/observability/tracking-plan.md`, schema 2.1.0).
> Companion to the Design Delivery Board (features 01–11) and the implementation log.
>
> **Read this first:** every number below is either sourced or labelled as modelled.
> Nothing here has been measured yet. Section 9 is the work that makes it measurable.

---

## 1. The bet

> We want to be the fastest platform on which someone can configure an AI agent and
> hear it answer — and then trust it enough to put it in front of customers.

Speed alone is a vanity claim. A console that reaches a talking agent in 90 seconds
and a rollback in 90 minutes has lost. So the strategy is **one clock and one trust
ladder, traded off explicitly**, and a north star that cannot be won by getting
faster at nothing.

### Goals → Signals → Metrics

The step teams skip (Rodden, Hutchinson & Fu, CHI 2010) is the middle one. Ours:

| Builder stage | Goal | Signal it went well | Signal it went badly | Metric |
| --- | --- | --- | --- | --- |
| Arrive | Understand in 10 s that an agent already exists and needs no keys | Test panel reached without opening Deployment | Exit to docs or pricing from §1 | Orient dwell, p75 |
| Choose a stack | Accept the default | Preset kept, manual expander never opened | Manual opened then abandoned unsaved | Manual-open rate, `model_slot_abandoned` |
| Pick a voice | Hear one that fits, early | Recommended row selected | Previews > 6, or dialog reopened ≥ 3× | Previews per selection |
| Write the opening | Edit a seeded line, not compose from blank | Greeting edited once, then test | `agent_config_reverted`, prompt churn ≥ 3 | Config churn before first test |
| Test | Hear it answer | `agent_audio_heard` with ≥ 1 turn | `test_refused`, or test never started | **TTFA**, Verified Test Rate |
| Deploy | Ship without fear | Publish with zero blocking items | `deploy_blocked` ≥ 2, preflight abandoned | Publish attempts per agent |
| Live | Trust it tomorrow | No rollback in 24 h, second agent created | Rollback, disable, silent abandonment | Rollback rate, second-agent rate |

Failure is easier to detect than success. Where both a positive and a negative
signal exist, the negative one is the sensitive instrument.

---

## 2. North star

### Fast Proven Agents (FPA) — provisional v1

**Definition (v1, client-evidenced).** The count of agents created in a week that
(a) reached a **verified first answer** within **15 minutes of active builder time**
and (b) held at least one **proven conversation** within 14 days of creation.

- **Verified first answer** = an `agent_test_started` → `agent_audio_heard` pair for
  that agent with `turnCount ≥ 1`, `trigger ≠ "auto"`, and `configuredByUser = true`.
- **`configuredByUser`** = the builder changed a default: the system prompt differs
  from the voice-seeded default, **or** the greeting was edited, **or** a channel was
  bound. A voice pick alone does not qualify, because `seedFromVoice` fills name,
  prompt and greeting in one click.
- **Proven conversation** = a session of ≥ 2 turns whose caller is **not** the
  creating account's own verified number or its own widget preview.

**The target is the rate, not the count.**

| | Value |
| --- | --- |
| **Fast-Proven Rate (FPR)** = FPA ÷ agents created that week | **target ≥ 45 %** |
| **FPA** (absolute count) | reported, **no target** |
| Cohort read | week W − 2, so the 14-day window has closed |
| Action trigger | two consecutive weeks under 30 % opens an investigation |

Why no count target: FPA ≥ 15/week at FPR 45 % needs ~33 qualifying new agents a
week, and the modelled company-wide total is 30–40 *before* every exclusion. A count
target would be unreachable by arithmetic, not by design. The rate is the half design
owns; the count is hostage to new-logo growth, currently +0.4 % YoY.

**Baseline: unmeasured and, today, uncomputable.** There is no test-session event
anywhere in the live console. The three builder events that do fire lose their payload
to the 48-key sanitiser allowlist. Modelled estimate 4–8 FPA/week at FPR 35–45 %,
basis: ~1,880 international active customers, a 37.5 % cross-SaaS activation mean
(Userpilot, 547 companies), and an assumed 50 % production-proof rate. **Confidence:
low. Do not quote it.** It is a placeholder for the W0 baseline in section 9.

### The honest limitation

The strongest version of this metric anchors the stop event **server-side**, on the
runtime's first `turn.finished`. That emitter does not exist: PostHog capture in the
live console is browser-only, and `parseTurnFinishedMessage` runs in the browser RTC
handler. Until a backend emitter is funded (section 9, W2), FPA v1 is **client
evidence only and labelled provisional**, and the telemetry-agreement check in section
6 cannot do its job. Calling it server-anchored before then would be theatre.

### Why not the obvious alternatives

- *Agents created* — a draft is not a product.
- *Time to first answer alone* — strip the builder to one button that plays a canned
  demo and TTFA collapses to 20 seconds while nothing works. FPA falls. That is the
  test a north star has to pass.
- *Minutes billed* — the business outcome, two steps downstream of anything design
  can move. FPA feeds it.

---

## 3. Input metrics

Four numbers a design change is allowed to claim. Never move the north star directly.

| # | Input | Definition | Target | Baseline | Owner |
| --- | --- | --- | --- | --- | --- |
| i1 | **TTFA** — Time To First Answer | Active time from `builder_opened` to verified first answer. Idle gaps > 120 s removed, accumulated from `visibilitychange` deltas. **Winsorised at 900 s**; report median and p75, never the mean. | median ≤ 3 min, p75 ≤ 6 min | unmeasured; modelled 8–12 min on the live console | Design lead |
| i2 | **VTR** — Verified Test Rate | Share of new agents that reach a verified first answer at all within 14 days, however long it took. | ≥ 70 % in 14 d, ≥ 55 % first session | unmeasured; est. 35–45 % | Design lead |
| i3 | **SBDR** — Same-Block Deploy Rate | Share of agents with a verified first answer that publish successfully **and** take a first production call within 24 h, with total active builder time under 30 min. | ≥ 40 % | unmeasured | Product owner |
| i4 | **SAR** — Second-Agent Rate | Share of accounts with ≥ 1 proven agent that create a second agent within 28 days. | ≥ 25 % | unmeasured | Design lead |

i1 and i2 pull against each other on purpose: making testing easier pulls in slower,
less confident users, which raises VTR and raises TTFA. Read them as a pair; a TTFA
win with a VTR loss is a selection effect, not an improvement.

i4 exists because the business is expansion-led (DBNRR 104 %, active customers +0.4 %
YoY). A measurement system that only ever looks at first agents is looking away from
where the money is.

**Naming.** The voice industry uses *TTFAB* — time to first audio byte — for runtime
latency in milliseconds. TTFA here is a human onboarding clock in minutes. Never put
them on the same axis, and never in the same sentence without units.

---

## 4. The time budget

How long may a user sit on this task? The 3-minute median is a **budget with parts**,
not a round number. Each stage is allowed this much:

| # | Stage | Budget | Why that number |
| --- | --- | --- | --- |
| 1 | Orient — first paint to first interaction | **15 s** | NN/g dwell analysis of 205,873 pages: the first 10 s decide whether the visit continues. 3 s of it is our own first paint. |
| 2 | Declare intent — template, import, or one sentence | **20 s** | Typing one sentence is 12–15 s; a template card is ~5 s. Parity with Vapi and Retell, not an advantage. |
| 3 | Voice and stack | **50 s** | Zero required stack decisions: the Balanced preset is pre-applied. The 50 s is voice audition: ~3 previews at 8 s plus 26 s to commit. |
| 4 | Opening and prompt | **45 s** | `seedFromVoice` has already written a working prompt and greeting; the median user edits one line. The 5-minute p75 is the writer's path, reported separately. |
| 5 | Reach the test | **10 s** | One click from "Hear the opening", two from the header. Machine time here is a Doherty problem (< 400 ms), not a budget problem. |
| 6 | Connect — mic permission, join, warm-up | **25 s** | 12 s human (OS permission) + 8 s join + 5 s warm-up. The only stage that can exceed Nielsen's 10-second limit, so the only one that earns a determinate progress state. |
| 7 | First agent audio | **15 s** | First-turn setup plus playback starting. The runtime clock inside it is TTFAB, a different metric. |
| | **Total** | **180 s = the 3-minute median target** | |

The **900 s ceiling** is not a sum. It is the smallest natural working block a
developer has (Parnin & Rugaber, ICPC 2009: 1–3 × 15 min per day). Past it the session
is a failure, not a slow success, and it is counted as one.

### Per-section dwell budgets

A budget is a design contract: if p75 active dwell on a row exceeds it, **the row is
the defect, not the user**.

| Section | Decision | p75 budget | Completion signal |
| --- | --- | --- | --- |
| §1 stack | pick a preset | 45 s | `stack_preset_changed` |
| §1 voice | pick a voice | 90 s | `voice_selected` |
| §1 speech | turn-taking preset | 60 s | `builder_section_completed` |
| §1 manual + backup | per-component vendor | 2 min | `model_slot_configured` |
| §3 prompt + opening | greeting and disclosure | 5 min | `opening_configured` |
| §4 test | hear it answer | 90 s | `agent_audio_heard` |
| §5 go live | preflight → deploy | 60 s | `deployment_went_live` |

Session replay is disabled by policy, so struggle is inferred from allowlisted scalar
signals, **read separately, never summed into an index**: doc links opened from inside
the section; `operation_failed` on its save; config churn ≥ 3 on one field group before
the first test; the same sheet reopened ≥ 3 times without a save. A single "struggle
index" fails the sensitivity test — each part moves for unrelated reasons.

---

## 5. Guardrails

Three, not seven. Every additional guardrail inflates the required sample per arm
(Spotify's β* = β/(G+1)); four would cost ~75 %. Each has a named owner role and an
action on breach, or it does not ship.

| Guardrail | Definition | Threshold | On breach | Owner |
| --- | --- | --- | --- | --- |
| **24 h rollback / disable rate** | Successful publishes followed within 24 h by a disable, a rollback, or a re-publish touching the same field group | ≤ 5 %, weekly | Revert the newest flagged builder change before anything else ships | Product owner |
| **First-publish failure rate** | `operation_failed` on the first `agent_publish` per agent, broken down by `errorStage` | ≤ 5 %; a single week > 8 % blocks further builder ships | Read the `errorStage` distribution and re-derive the preflight checks from it | Staff front-end |
| **Evidence-before-live rate** | First publishes preceded by ≥ 1 verified test for that agent | non-inferior within −3 pp of the trailing 4-week mean; **absolute floor 85 %** | The speed change loses, even if TTFA won | Design lead |

At Agora's volume most of these are **monitors, not hypothesis tests**. Detecting a
rise from 5 % to 7.5 % needs ~1,216 users per arm against ~36 first agents a week.
Saying "must not rise" without saying that would be theatre. They are stopping rules
read as trends, and that is stated on the dashboard.

### Two data-quality checks — the week's read does not count if these fail

- **External share of FPA ≥ 70 %**, split by traffic type and by whether the creator
  is a solutions engineer. Any account creating > 5 agents in a week is inspected
  before its agents count. The live console already classifies `agora.io` email as
  internal, but preview and local traffic currently falls through to **external** —
  set `classifyNonProductionAsTest: true` before the redesign goes on a preview URL or
  the baseline is contaminated on day one.
- **Telemetry agreement ≥ 95 %** between client-emitted test successes and
  server-observed first turns. *This check is inert until the server emitter exists*
  (section 2). As currently specified it would compare a client event to another client
  event and certify bad data as good. Until W2 it is a placeholder with that stated.
  Pre-register Twyman's law: any variant claiming > 3 SD of TTFA improvement is
  investigated for telemetry loss before it is read as a win.

### Cost counter-metric

**Minutes consumed per verified test.** Voice tests burn the 300 free minutes (first
150 card-free). A TTFA win that multiplies test-call volume is a direct cost increase
at $0.10/min and nothing else in this system can see it. Add `quota_exhausted` and
`payment_required` to the `test_refused` reason codes.

---

## 6. Telemetry plan

### What exists today

The live console already has PostHog with a canonical event taxonomy, a cross-route
funnel gate, and a 48-key sanitiser allowlist (`ng-console/docs/observability/`). Three
agent-builder events fire, and all three lose their payload to the allowlist, so even
`greeting_previewed` cannot be tied to an agent. **Reuse that stack; do not build a
second one.**

### What is missing, in priority order

| Wave | Work | Unlocks |
| --- | --- | --- |
| **W0** | Ship the test-session operation; fix the three duration bugs (one call site reports a literal `duration_sec: 30`); extend the sanitiser allowlist by the keys in the event spec | Makes TTFA computable at all |
| **W1** | Instrument the builder's 42 events from the spec, P0 first | The funnel, the dwell budgets, VTR |
| **W2** | A backend emitter for Agora notification events 112 / 201 / 202 on a BFF webhook route | The server anchor, proven conversations, the telemetry-agreement check |
| **W3** | Immutable published versions with one-click rollback | The rollback guardrail can exist at all |

W2 has **no owner and no wave in any current plan**. It is a runtime/backend request,
not a front-end job, and everything server-anchored is blocked on it. Naming it is the
point of this section.

### Rules the spec must obey

- **Names**: `object_verb`, past tense, snake case. Properties snake case.
- **No free text, ever.** `deploy_blocked` must emit a stable `code`
  (`no_voice`, `no_channel`, `no_surface`, `no_number`, `no_prompt`, `batch_no_run`,
  `batch_no_number`, `batch_no_csv`, `batch_no_schedule`, `batch_uncovered_vars`) and
  counts — never the interpolated reason string, which contains campaign names the user
  typed. Add the codes to the allowlist; never the reasons.
- **Durations are measured, not guessed.** Active time accumulates from
  `visibilitychange` deltas, never a tick counter.
- **`trigger: "auto"` is excluded from everything.** The prototype auto-starts a test
  150 ms after mount on the demo agent. Left in, the headline speed metric is generated
  by a `setTimeout`.
- **Cardinality**: no unbounded property values. Bucket costs and latencies.

The machine-readable plan is `references/telemetry/event-spec.json` (42 events, P0/P1/P2,
each naming the file and handler where it fires). The front-end contract is
`studio_x_2/lib/telemetry.ts` — typed names and a `track()` that no-ops until a PostHog
key exists, so the events can be wired now and turned on later without touching
components again.

---

## 7. Assumptions

The shape the owner asked for: *this change → we expect this much movement → this is
how we would know.*

Two rules applied throughout:

1. **Kohavi's prior.** Most changes move key metrics not at all; at Bing 10–20 % do.
   Every prediction is shown **raw and discounted ×0.33**. The discounted figure is the
   one to plan with.
2. **Powered or directional, never both.** If the sample needed exceeds what this
   traffic can produce, the row states a direction and a review date instead of a
   number, and says so.

| # | Change (shipped) | Predicted effect (raw → discounted) | Metric | Powered? |
| --- | --- | --- | --- | --- |
| A1 | Latency-vs-cost slider replaces three vendor dropdowns, Balanced pre-applied | §1 dwell −60 to −105 s → **−20 to −35 s** | p75 `activeDwellMs` on `stack_preset_changed` | Yes, ~100 sessions |
| A2 | Agora Managed Key by default; zero credential fields on the default path | First-answer completion ≥ 60 % vs 37.5 % SaaS mean | `credential_mode_changed`, `credential_page_exited` | **No** — 576/arm. Directional, review W8 |
| A3 | Test panel always present, testing the unsaved draft, default it to Voice call | Tested-before-publish 60 % → 85 %; time to first Talk −20 to −40 s → **−7 to −13 s** | `agent_test_started{trigger}` | Yes, ~62/arm |
| A4 | Backup inside each model's Configure sheet, with its own credential | Attach rate 15 % → 30–40 % **within sheet-openers**; diluted across all first agents that is **+4 to +7 pp** | `model_slot_configured{hasBackup}`, reported conditional and unconditional | Yes within the segment, which A1 is shrinking |
| A5 | One voice table, recommended badged at the top | Previews 6 → 3–4; voice dwell −30 to −40 s → **−10 to −13 s** | `voice_previewed` count per `voice_selected` | Yes, ~22–35 pickers/arm |
| A6 | Generated scenarios from the agent's own prompt | ≥ 60 % of first agents run the suite once before publish, from 0 % | `suite_run_completed` | Yes, ~38/arm |
| A7 | Opening composes the disclosure and greeting and shows the spoken line | Fewer prompt reverts before first test | `agent_config_reverted` on the greeting group | **No** — directional |
| A8 | Five-section accordion with an "n of 5 done" rail | *No effect claimed.* The counter has a correctness bug; fix it alone, measure nothing | `builder_section_completed` | n/a — defect fix |
| A9 | Preflight names what blocks a deploy | Publish attempts per agent 1.8 → 1.1 | `deploy_blocked{code}` | **No** — 624/arm. Directional |
| A10 | Undo to live, and a visible "Live. No changes" state | Rollback rate ≤ 5 % | 24 h rollback guardrail | **No** — monitor |

**The trade-off assumption, stated so it is not made accidentally (A11):** when speed
and trust conflict, **trust wins**. A change that takes 30 seconds off TTFA and drops
evidence-before-live below 85 % is reverted.

### Next, ranked by expected effect on the north star

1. **W0 measurement gate** — nothing above is readable until this ships.
2. **Move Deployment after Test, or make it skippable.** The rail asks for a model
   stack and a deployment channel before the user has heard anything. Retell puts its
   browser test at step 3. Expected +8 to +15 pp first-test rate, −30 to −60 s median
   TTFA. Small change, largest predicted effect in the pack.
3. **Print measured latency and cost per preset on the slider.** Vapi already does.
   An unlabelled slider pushes users into manual config to find out what it did.
4. **Immutable versions with one-click rollback** — the rollback guardrail cannot exist
   without it.
5. **20-participant moderated first-agent benchmark**, this quarter. At tens of first
   agents a week, telemetry will not resolve an 8 pp change for two quarters. A
   moderated benchmark gives A1–A10 a real baseline in one week.
6. **Timed competitive cold-start study, published with its method.** Every competitor
   time claim is an undefined marketing number. Ours should not be.

---

## 8. How this drives design decisions

- A row over its dwell budget is a design defect with an owner, not a user problem.
- A feature with no input metric under it does not get built this quarter.
- A change with no falsifiable prediction does not enter the ledger, and a change in
  the ledger names the event that would refute it.
- Where a prediction cannot be powered at our traffic, the decision is made from the
  moderated benchmark and the direction, and the dashboard says so rather than running
  an underpowered test and calling the result evidence.

---

## 9. Sequencing

| When | What | Gate |
| --- | --- | --- |
| W0 | Ship the test-session operation and the allowlist delta; set `classifyNonProductionAsTest` | TTFA computable |
| W0 + 2 | **Baseline fortnight** — no builder changes ship | A real number for i1–i4 |
| W0 + 2 | 20-participant moderated benchmark on today's console | A1–A10 baselines |
| W1 | Instrument the 42 events, P0 first | The funnel |
| W2 | Backend emitter request (owner needed) | Server anchor, proven conversations |
| W3 | Versions and rollback | The rollback guardrail |
| W4 | First weekly builder-activation read, W−2 cohort | The dashboard goes live |

---

## 10. Open decisions for the owner

1. **Does a simulation count as a verified first answer, or only a live voice test?**
   Both clocks are undefined until this is settled, and it changes A3 and A6.
2. **Who owns the backend emitter (W2)?** Without a name, everything server-anchored
   stays provisional.
3. **FPR ≥ 45 % — accept as the target?** It is 1.15× the cross-SaaS activation mean,
   chosen because zero required credentials should beat the mean. It is aspirational,
   not derived. Revisit 8 weeks after the first clean cohort.
4. **Is the 20-participant moderated benchmark funded this quarter?** It is the only
   instrument that can resolve most of section 7 at our traffic.
5. **Do we publish the competitive cold-start study?** It converts "fastest platform"
   from an adjective into an artefact, and it may not flatter us at first.

---

## Sources

Amplitude, *The North Star Playbook* · Rodden, Hutchinson & Fu, *Measuring the User
Experience on a Large Scale*, CHI 2010 · Kohavi, Deng, Longbotham & Xu, *Seven Rules of
Thumb for Web Site Experimenters*, KDD 2014 · Dmitriev et al., *A Dirty Dozen*, KDD 2017
· Schultzberg et al., *Ship decision rules*, arXiv 2402.11609 · Manheim & Garrabrant,
*Categorizing Variants of Goodhart's Law*, arXiv 1803.04585 · Nielsen Norman Group,
dwell-time analysis (205,873 pages) · Parnin & Rugaber, ICPC 2009 · Scheibehenne,
Greifeneder & Todd, *Can There Ever Be Too Many Options?*, JCR 2010 · Buell & Norton,
*The Labor Illusion*, Management Science 57:9 · Mark, Gudith & Klocke, CHI 2008 ·
Zuko form-analytics benchmarks · Userpilot SaaS activation benchmark (547 companies) ·
PostHog docs (funnels, experiments, surveys, sample size) · Vapi, Retell, ElevenLabs
and LiveKit quickstart documentation.
