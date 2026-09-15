# Agent builder KPIs, assumptions and telemetry plan

> Status: proposal for owner sign-off · Written 2026-09-15 on `design/sandbox`
> Companion to `docs/design/agent-builder-migration-brief.md` (what we are building)
> and `docs/observability/tracking-plan.md` (schema 2.1.0, what is instrumented today).
> This document is the *why it is worth building* and *how we will know*.

## 1. The bet

> **We want to be the fastest platform on which someone can configure an AI agent
> and hear it answer — and then trust it enough to put it in front of customers.**

Speed alone is a vanity claim: a console that gets you to a talking agent in 90
seconds and to a rollback in 90 minutes has lost. The strategy is therefore two
clocks and one trust ladder, measured together and traded off explicitly.

### North star

**Weekly Proven Agents (WPA)** — the number of agents that had **at least one
successful production conversation in the last 7 days**, counted per account.

Why this one:

- It only moves when a person configured an agent, tested it, deployed it, and it
  worked for a real caller. Every step of the builder is upstream of it.
- It cannot be gamed by clicks, page views or drafts.
- It is a *count of working agents*, not revenue, so design decisions can move it
  directly. Revenue (minutes billed) is the business metric it feeds.

Input metrics (the four numbers a design change is allowed to claim):

| Input | Question it answers | Owner surface |
| --- | --- | --- |
| **TTFA** — Time To First Answer | How fast from "I want an agent" to hearing it reply? | Builder §1–§4 |
| **TTFD** — Time To First Deploy | How fast from first answer to a live agent? | Builder §5 |
| **TCR** — Trusted Change Rate | Share of publishes that survive 24h without rollback or disable | Deploy + Monitor |
| **AR7** — Agent Retention @ 7d | Share of first agents still holding real conversations a week later | Monitor |

`WPA = new agents deployed × AR7`, so TTFA and TTFD buy the numerator and TCR/AR7
stop us buying it with garbage.

### Guardrails (a change that wins on speed and loses here has not won)

- Publish failure rate (`operation_failed` on `agent_publish`) must not rise.
- 24h rollback/disable rate must not rise.
- Support/Concierge contacts per new agent must not rise.
- Median production response latency must not rise (see §4).

## 2. The clocks — definitions, baselines, targets

All clocks are **server-anchored where possible** and computed in PostHog from
already-instrumented operations, not from client-side journey state (schema 2.1.0
forbids generic `journey_*` state; see §6 for how we stay inside that rule).

### Naming warning

The voice industry already uses **TTFAB — time to first audio byte** for *runtime*
latency (caller stops speaking → agent audio starts). That is a different clock
from ours. In this repo:

- **TTFA** = *Time To First Answer* — a **human onboarding** clock, minutes.
- **TTFAB / response latency** = a **runtime quality** clock, milliseconds, already
  parsed in `src/lib/latency-metrics.ts` (`e2eLatencyMs`, plus `asr_ttlw`,
  `llm_ttft`, `tts_ttfb`, `transport`).

Never put them on the same axis or in the same sentence without units.

### 2.1 TTFA — Time To First Answer

**Start:** `operation_started{operation:"agent_create"}` — or, for imports, the
import submit. **Stop:** first `agent_test_session_succeeded` with `turnCount ≥ 1`
for that agent. **Unit:** wall-clock minutes, per person, first agent only.

| | Value | Basis |
| --- | --- | --- |
| Baseline | **unknown — not instrumented** | there is no test-session event today |
| Target, median | **≤ 3 min** | assumption A0, see §3 |
| Target, p75 | **≤ 6 min** | |
| Hard ceiling | **10 min** | past this the session is a failure, not a slow success |

Report `TTFA_active` alongside it: the same clock with idle gaps > 120 s removed,
so "went to lunch mid-prompt" does not read as a broken builder.

### 2.2 TTFD — Time To First Deploy

**Start:** first successful test (the TTFA stop). **Stop:**
`operation_succeeded{operation:"agent_publish"}` **and** first production session
for that agent within 24h (a publish nobody calls is not a deploy).

Target: median **≤ 20 min**, p75 **≤ 45 min**, same-session conversion **≥ 45 %**
of people who reached a first answer.

### 2.3 How long may a user sit on one task? — dwell budgets

A budget is a **design contract**: if p75 active dwell on a row exceeds it, the row
is the defect — not the user. Budgets are per builder section and per decision,
measured from first interaction inside the section to its completion signal, idle
> 60 s removed.

| Builder section | Decision | p75 budget | Completion signal |
| --- | --- | --- | --- |
| §1 Voice & Models — preset | pick a stack | **45 s** | `agent_model_stack_selected` |
| §1 Voice picker (01) | pick a voice | **90 s** | `agent_voice_selected` |
| §1 Advanced speech (02) | turn-taking preset | **60 s** | `agent_speech_preset_selected` |
| §1 Manual models + backup (03/07) | per-component vendor | **2 min** | sheet saved |
| §3 Prompt & Opening (04) | greeting + disclosure | **5 min** | `greeting_previewed` then blur |
| §4 Test | hear it answer | **90 s** | `agent_test_session_succeeded` |
| §5 Go Live (05/08) | preflight → deploy | **60 s** | `agent_publish` succeeded |

Read the budgets as two sums, not one. The **first-answer path** a new user
actually walks — preset (45 s) + voice (90 s) + opening/prompt (300 s) + test
(90 s) = **8 min 45 s p75 worst case** — is where the **10-minute TTFA ceiling**
comes from. The 3-minute median target assumes what A11 assumes: defaults carry
§1 and the first prompt is short. The **full configure budget**, every section
touched, is 12 min 45 s p75, and with the 60-second deploy budget it is where the
20-minute TTFD target comes from. These are sums of parts, not round numbers
picked for a slide.

Session Replay is **disabled** by policy (`docs/observability/privacy.md`), so we
cannot watch a struggling user. We infer struggle from **allowlisted scalar
signals** instead, and any row over budget is read together with them:

- `doc_link_viewed` / `external_link_opened` fired from inside the section,
- `operation_failed` on the section's save,
- **config churn**: number of `agent_update` operations touching the same field
  group before the first test (≥ 3 = thrash),
- **sheet re-entry count**: same sheet opened ≥ 3 times without a save,
- Concierge invoked with `route pattern` = the builder.

### 2.4 Confidence in production

| Metric | Definition | Target |
| --- | --- | --- |
| **Preflight pass rate** | first `agent_publish` attempts that pass preflight with no blocking issue | ≥ 90 % |
| **First-publish failure rate** | `operation_failed` on the first `agent_publish` per agent | ≤ 5 % |
| **TCR — Trusted Change Rate** | publishes not rolled back / disabled / re-published within 24h | ≥ 95 % |
| **Tested-before-live rate** | agents whose first publish was preceded by ≥ 1 successful test | ≥ 85 % |
| **Simulation coverage** | agents with ≥ 5 scenario runs before first publish (once §4 simulations ship) | ≥ 40 % |
| **Failover exercised** | agents with a backup provider configured (07) | 15 % → **35 %** |

## 3. Assumptions ledger

Every design change on the tracker is written here as a falsifiable claim. Format:

> **Change → Assumption → Expected effect (with a number) → Instrument →
> Decision rule if it does not land.**

`A0` is the framing assumption everything else inherits; `A1`–`A9` map onto
ClickUp Design Tracker rows 01–11.

**A0 — Baseline.** *Assumption:* today's median TTFA in ng-console is **8–12 min**
for a first-time user, because the test panel, the model config and the prompt live
on different tabs and nothing tells the user what to do next. *Expected:* the
changes below take it under 3 min. *Instrument:* ship the TTFA funnel first and
read two weeks of untouched baseline **before** any builder change lands behind a
flag. *Decision rule:* if the measured baseline is already under 4 min, the speed
thesis is wrong for this audience — re-point the work at TCR and AR7 instead.

| # | Change (tracker row) | Assumption | Expected effect | Instrument | If it does not land |
| --- | --- | --- | --- | --- | --- |
| **A1** | Model-stack **preset** with $/min + TTFT recap, manual config collapsed (§1) | ~70 % of first agents never need per-component vendors | **−45 s** median TTFA · manual-config rate **< 30 %** of first agents | `agent_model_stack_selected{mode:"preset"\|"manual", preset}` + dwell | If manual > 40 %, the preset *names* are wrong (not the control) — rename against the cost/latency the user actually reads |
| **A2** | **Test available from the first section**, before save (§4) | The single biggest TTFA cost is not knowing you may test a draft | **−60 s** median TTFA · test-attempt rate **+12 pp** | `agent_test_session_started{agentState:"draft"\|"saved"}` | If attempts rise but success does not, the blocker is credentials/quota → move the fix to preflight |
| **A3** | **Opening section** — who speaks first, disclosure, "Hear the opening" (04, live) | Hearing the first line early replaces a full test call for the greeting decision | **+8 pp** of first agents hear audio before deploy · **−20 %** greeting edits *after* first publish | `greeting_previewed` (exists) + post-publish `agent_update` on greeting | If post-publish greeting edits stay flat, preview fidelity is the problem, not placement |
| **A4** | **Backup provider inside each model sheet** (07, live) | Backup is skipped because it lived in a separate section, not because users reject it | Backup attach rate **15 % → 35 %** · sheet dwell **+ ≤ 10 s** | `agent_backup_configured{component, vendor, credentialMode}` | If attach rises and dwell rises > 20 s, split the recap line out of the sheet |
| **A5** | **Recommended voices** in one table, frozen header (01) | Users audition ~6 voices because nothing ranks them | Voice dwell **−40 s** · previews before pick **6 → 3** | `agent_voice_previewed` count per `agent_voice_selected` | If previews stay at 6, the ranking is not trusted — badge the *reason*, not the rank |
| **A6** | **Turn-taking presets** resolving to visible ms (02) | Raw ms fields are a dead end for non-engineers | Speech-section completion **+15 pp** · custom-mode use **< 25 %** | `agent_speech_preset_selected{preset, resolvedFromCustom}` | If custom > 40 %, presets bracket the wrong ranges — re-derive from production `e2eLatencyMs` |
| **A7** | **Import from Vapi / Retell** (09) | Migrators are the fastest path to a proven agent — they arrive with a working config | TTFA for importers **≤ 90 s** · **25 %** of imports reach first deploy in the same session | `agent_import_started/succeeded{source, mappedCount, changedCount, skippedCount}` | If imports stall after the report, the mapping report is a wall — default to "import anyway, flag later" |
| **A8** | **Preflight before Go Live** (05) | Most first publishes fail on credentials, number binding or quota — all knowable before the click | First-publish failure **−50 %** · cost **+15 s** dwell on Deploy | preflight check results as `agent_preflight_evaluated{blockingCount, warningCount}` | If failures do not drop, the checks are not the real failure modes — re-derive from `errorStage` distribution |
| **A9** | **Simulations** with a printed verdict (§4) | Confidence, not speed, is what blocks the second deploy | Tested-before-live **≥ 85 %** · TCR **≥ 95 %** | `agent_simulation_run{scenarioCount, passCount, judge:"llm"\|"rule"}` | If TCR does not move, simulations are theatre — tie them to the failures Monitor actually records |

### Trade-off assumptions (state them, or they get made accidentally)

- **A10 — Speed vs. trust.** We assume TTFA can fall by 50 % with no rise in
  24h rollback. If a variant buys speed *and* pushes rollback above 5 %, the
  variant loses even if TTFA wins. TCR is the tiebreaker, always.
- **A11 — Defaults carry the speed.** We assume a good default stack is worth more
  than any control we could add. Every new control on the first-run path must show
  it pays for its dwell budget, or it belongs behind Advanced.
- **A12 — Statistical reality.** UI funnel changes are testable on people (a few
  hundred per arm). **Agent-behaviour** changes are not: independent testing puts
  ~1,000 calls per variant at 95 % confidence for voice-quality comparisons. Do not
  ship a behaviour claim off a 40-call demo.

## 4. Runtime KPIs we can already claim (and must not lose)

`src/lib/latency-metrics.ts` already parses per-turn latency from the runtime
`turn-finished` payload: `e2eLatencyMs` plus `asr_ttlw`, `llm_ttft`, `tts_ttfb`,
`transport`. That is a shipped competitive weapon; nothing in the builder work may
regress it, and the builder should *show* it.

Independent 2026 benchmarks of end-of-caller-speech → first agent audio:

| Platform | Median | p95 |
| --- | --- | --- |
| Retell | 680 ms | 920 ms |
| ElevenLabs | 1,424 ms | 1,768 ms |
| Vapi | 1,558 ms | 2,008 ms |

**Our published target: p50 ≤ 900 ms, p95 ≤ 1,500 ms**, reported per model stack so
the preset recap in §1 quotes *our own measured* number rather than a vendor claim.
Vendor-claimed latency (e.g. "sub-100 ms") is component latency and must never be
printed in the console as an end-to-end number.

## 5. How the KPIs drive design decisions

1. **Every tracker row carries one input metric.** A row that cannot name TTFA,
   TTFD, TCR or AR7 is a preference, not a project — it goes to the backlog.
2. **Budgets before pixels.** The dwell budget (§2.3) is written into the brief
   before the design is drawn, so "add one more field" has a visible price.
3. **Ship behind a flag, read the funnel, then decide.** Design review answers *is
   this right?*; the funnel answers *did it work?*. Both are required to close a row.
4. **Counter-metric on every claim.** A win on one clock is reported with its
   guardrail on the same screen (§1).
5. **Kill rule.** If a change does not move its stated metric by half the predicted
   effect within two reporting weeks at sufficient volume, it is reverted or
   re-scoped; it does not quietly stay.

Frameworks this borrows from, for anyone auditing the choices: the North Star +
input-metric tree (alignment), Google's HEART with Goals-Signals-Metrics (turning a
UX goal into a signal we can actually log), and TTFHW / time-to-value from developer
platforms (where activation averages ~37.5 % and the cost of missing an early value
milestone is measured in two-week churn).

## 6. Telemetry plan — PostHog

### 6.1 What exists today (reuse, do not rebuild)

- Facade `src/lib/observability/facade.ts`: `trackPassive(...)` and
  `observeOperation(...)`. PostHog and Sentry SDKs stay isolated under
  `src/lib/observability/`; feature code never imports them (guarded by test).
- Schema **2.1.0**, `eventSource: "ng-console-web"`, base props include env,
  release, route/routePattern, productArea, cohort, traffic classification, and
  the authenticated `cid` as a PostHog **group** — so every metric here is
  breakable down by company without touching customer content.
- Already instrumented: `agent_create`, `agent_update`, `agent_duplicate`,
  `agent_publish`, `agent_deployment_status_update`, `agent_delete`, plus
  `page_viewed`, `greeting_previewed`, `ai_disclosure_enabled`,
  `caller_first_selected`.
- PostHog activates only when `VITE_POSTHOG_KEY` is set; `capture_pageview` is
  off, session recording off, autocapture on.

**The gap is precise:** we can see agents being created and published. We cannot
see anyone **test** one, so TTFA is currently uncomputable. That is the first
thing to fix — before any new builder surface ships.

### 6.2 Schema 2.2.0 — the delta

New `ProductOperation` entries (`src/lib/observability/types.ts`), wrapped with
`observeOperation` at the React Query mutation seam like every existing operation:

```ts
| "agent_test_session"      // start → succeeded/failed, durationMs = session length
| "agent_simulation_run"
| "agent_import"
| "agent_preflight_evaluate"
```

New `PassiveEventName` entries:

```ts
| "agent_builder_section_viewed"   // { section, agentState, isFirstAgent }
| "agent_model_stack_selected"     // { mode, preset, costPerMinBucket, ttftBucket }
| "agent_voice_previewed"          // { source: "table" | "compare" | "greeting" }
| "agent_voice_selected"           // { recommended: boolean, previewCount }
| "agent_speech_preset_selected"   // { preset, resolvedFromCustom }
| "agent_backup_configured"        // { component, credentialMode }
| "agent_test_turn_observed"       // { turnIndex, e2eLatencyBucket }
```

New allowlisted dimensions on agent operations:

```ts
{
  isFirstAgent: boolean
  agentSource: "blank" | "template" | "import" | "duplicate"
  channel: "batch" | "inbound" | "sdk" | "widget"
  modelConfigMode: "preset" | "manual"
  hasBackup: boolean
  turnCount: number          // test sessions only
  e2eLatencyBucket: "<500" | "500-900" | "900-1500" | ">1500"   // bucketed, never raw
}
```

**Privacy, non-negotiable** (`docs/observability/privacy.md`): no prompt text, no
greeting text, no transcript, no voice ID that identifies a person, no credential
or key, no file name. Latency goes in as **buckets** on product events; raw
per-turn latency stays in the runtime path. Every new property needs the code +
privacy review the sanitizer allowlist already enforces.

### 6.3 Passing the cross-route funnel gate

Schema 2.1.0 forbids speculative `journey_*` state, and the TTFA funnel is exactly
a cross-route journey. It is admissible only when all four stated conditions hold —
here is how each is met:

1. *The workflow exists in current navigation* — Agents → Agent Detail → Test →
   Deploy, all shipped routes.
2. *Start and completion are instrumented operations* — `agent_create` (exists) and
   `agent_test_session` / `agent_publish` (2.2.0).
3. *Completion is a real product outcome* — an agent that answered, and a publish
   that received a production call. Neither is a click.
4. *Implementation and dashboard ship together* — the PostHog dashboard in §6.4 is
   part of the same change, not a follow-up.

Crucially, **the funnel is assembled in PostHog from person-level events**, not from
client-side journey state. No new journey object is added to the client.

### 6.4 PostHog objects to create

| Object | Type | Definition |
| --- | --- | --- |
| **Builder activation** | Funnel | `agent_create` started → succeeded → `agent_test_session` succeeded → `agent_publish` succeeded, 7-day window, breakdown by `agentSource`, `isFirstAgent`, `cid` |
| **TTFA** | Funnel, time-to-convert | Step 1 → step 3 above, median + p75 + p90 |
| **TTFD** | Funnel, time-to-convert | Step 3 → step 4 |
| **Section dwell** | Trend | duration between `agent_builder_section_viewed` and the section's completion signal, p75 by `section` |
| **Struggle index** | Trend | per builder session: doc links + failed saves + sheet re-entries + config churn, by `section` |
| **Trusted change** | Retention/Trend | `agent_publish` succeeded with no `agent_update`/`agent_deployment_status_update`(disable)/re-publish in 24h |
| **AR7** | Retention | agents with a production session in week 0 and week 1 |
| **Latency posture** | Trend | `e2eLatencyBucket` share on test turns, by `modelConfigMode` and preset |
| **Data quality** | Trend | events by `schemaVersion`, unclassified traffic share, events missing `isFirstAgent` |

Default production filters: `environment = production`, `schemaVersion = 2.2.0`,
and **do not** globally exclude internal traffic — keep it visible as its own series.

### 6.5 Experiment plan

- **Feature flags** gate each A-row; the flag key is the assumption id
  (`builder-a1-model-preset`), so the flag, the ClickUp row and the ledger line are
  the same object.
- **Unit of analysis is the person** for builder UI changes; the **agent** for
  configuration-shape changes; the **call** only for behaviour changes — and see
  A12 on the volume that requires.
- Minimum run: 2 reporting weeks or the pre-declared sample, whichever is later.
  Declare the primary metric, the guardrail and the decision rule in the ledger
  **before** the flag goes on.
- No peeking-to-stop. Record the read on the row when the window closes.

## 7. Sequencing

| Wave | Work | Gate to the next wave |
| --- | --- | --- |
| **W0 — See** | Ship 2.2.0 test/publish/import operations + `isFirstAgent`/`agentSource` dimensions; build the Builder activation funnel; read **two weeks of untouched baseline** | A real TTFA/TTFD baseline exists and A0 survives it |
| **W1 — Shorten** | A1 preset, A2 test-from-anywhere, A5 voices, A3 opening (already live) behind flags | TTFA median under 3 min with rollback flat |
| **W2 — Trust** | A8 preflight, A9 simulations, A4 backup attach, A6 speech presets | TCR ≥ 95 % and tested-before-live ≥ 85 % |
| **W3 — Widen** | A7 import, templates, second-agent path | AR7 and WPA moving together |

## 8. Open decisions for the owner

1. **North star sign-off** — is Weekly Proven Agents the number we report, or does
   the business need billable minutes on the same board?
2. **TTFA stop condition** — does "first answer" mean a console test call, or does a
   simulation run count? (Affects A2 and A9 both.)
3. **Baseline freeze** — are we willing to hold builder changes for two weeks of
   clean baseline, or do we accept a modelled baseline and weaker causal claims?
4. **PostHog key in production** — `VITE_POSTHOG_KEY` must be set for the target
   environments before W0 means anything.
5. **A/B position** — tracker row 08 is locked because production A/B collides with
   the builder "no A/B" lock. The experiment plan in §6.5 needs that call: flags in
   the console only, or agent-level variants too?
6. **Who owns the weekly read** — `docs/observability/weekly-report.md` gains a
   "Builder activation" section, or this lives on the design board?

## Sources

- Openbenchmarks, *Voice agent latency benchmark (2026), TTFAB from real phone
  calls* — <https://openbenchmarks.com/voice-agent-latency>
- Hamming AI, *How to evaluate voice agents / testing for production reliability*
  — <https://hamming.ai/resources/how-to-evaluate-voice-agents-2026>
- Coval, *Voice AI agent evaluation guide (2026)* —
  <https://www.coval.ai/blog/voice-ai-agent-evaluation-guide/>
- Moesif, *Developer experience: the metrics that matter most* (TTFHW) —
  <https://www.moesif.com/blog/developer-marketing/api-analytics/Developer-Experience-the-Metrics-That-Matter-Most/>
- Digital Applied, *Time to value: the 2026 SaaS onboarding metrics framework* —
  <https://www.digitalapplied.com/blog/customer-onboarding-time-to-value-2026-saas-metrics-framework>
- Google HEART + Goals-Signals-Metrics — <https://www.productplan.com/glossary/heart-framework>
- PostHog, *Product analytics best practices* — <https://posthog.com/docs/product-analytics/best-practices>
