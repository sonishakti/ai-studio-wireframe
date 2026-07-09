# Roadmap Features — PRD (design-ready spec)

> **Purpose.** The buildable companion to
> [`roadmap-activation-strategy-2026-07-09.md`](roadmap-activation-strategy-2026-07-09.md).
> That doc argues *why* and *in what order*; this one is *what to design*. It carries the full
> **42-feature register** (strategic impact + technicality for every item, as asked), full PRD
> cards for the **P0/P1** set, data-model deltas, acceptance criteria, and a per-feature "run
> this skill next" starter so any future session can pick up a single feature and design it
> without re-deriving context.
>
> **Status:** PRD v1, 2026-07-09. Mock/wireframe scope only (studio_x_2 has no backend). Feature
> IDs are stable — cite them across sessions (e.g. "designing **A3**").
>
> **Read order for a future session:** §1 (context + the 5 hard facts) → §2 (find your feature
> in the register) → §3/§4 (its card, if P0/P1) → run the named skill. If your feature is P2/P3,
> the register row + §5 cross-cutting reqs are enough to start a `/journey`.

---

## 1. Global context (every card assumes this)

**North star.** Signup → **first live deployment carrying traffic** → **first paid usage**.
Stages: Land → Believe → Connect → Consume → Convert → Retain (`LEARNINGS.md` §20).

**Five hard facts that override intuition (full detail = strategy §2):**
1. **Free tier = 300 min/month**, shared with STT+Translation (NOT 10,000 — that's core RTC).
   → *volume* is the conversion event.
2. **Agora does not sell phone numbers.** Telephony = **BYO SIP** (Twilio/Telnyx/Exotel). Number
   resell is net-new + Partnership-gated.
3. **MLLM and MCP already ship** in the engine. "MLLM"/"Marketplace" work is Studio *surfacing*,
   not net-new pipeline.
4. **Billing is postpaid**, $0.10/min managed (bundles ASR+LLM+TTS), BYOK supported. → spend
   caps matter.
5. **No live-call monitoring and no WhatsApp** exist today for ConvoAI. Both are net-new.

**IA primitives (current studio_x_2, source `app-sidebar.tsx`; supersedes CLAUDE.md sidebar):**
`BUILD` = Agents (`/agents`, app root) · Composer. `OBSERVE` = Monitor (`/monitor`, badge →
Diagnostics). `MANAGE` = Resources (`/integrations` — Knowledge · MCP · Connectors · Deployment
Channels) · Realtime Services · Project Settings. Agent creation = one 5-step wizard at
`/agents/[id]/edit` (Voice → Type → Prompt → Configure → Test & Publish). **Deploy channels are
reached from the agent (ChannelHero), not top-level nav.**

**Data models (from `references/ia-revamp-agent-vs-deployment.md`, still canonical for the
split; note prompt is per-deployment again per the 06-24 rebuild):**
- **Agent** = reusable Stack (LLM/ASR/TTS + preset) + Persona (personality/tone/language) +
  Knowledge[] + Actions[]. Auto-provisioned default = "Aria."
- **Deployment** = one agent on one channel; owns prompt + greeting + custom code; batch
  deployments own the CSV whose columns become `{{vars}}`.

**Owning teams (dependency gates):** Engine · SIP Manager · Partnership · Console. A card's
"Depends on" names which — design can only expose what that team ships.

---

## 2. The feature register (all 42 — strategic impact + technicality)

**Legend.** Stage = funnel stage the feature primarily serves. Today = Agora status (✓ shipped ·
◐ partial/undocumented · ✗ net-new). Comp = competitive status (TS table-stakes · WS whitespace ·
— neutral). Pri = P0/P1/P2/park.

### Shipped — Milestone v2 (baseline; don't rebuild, extend)

| ID | Feature | Stage | Strategic impact | Technicality |
|---|---|---|---|---|
| V1 | Concierge | Believe | AI onboarding differentiator (only Bland "Norm" comparable, 1/5). Extend → prompt-to-agent. | Chat UI over REST API + analytics read; already ships. |
| V2 | Connectors — HubSpot | Convert | First native connector; seeds Marketplace (B3) + deepens investment. | OAuth + auto tool-binding to the agent. |
| V3 | Custom Tools (HTTP) | Convert | Table-stakes parity (5/5). | Function-calling via `enable_tools`; HTTP tool schema. |
| V4 | Voice Formatting | Retain | First-impression quality (TTS sounds right). | Text normalization pre-TTS. |
| V5 | Pronunciation Dictionary | Retain | Fixes MiniMax TTS gaps → fewer embarrassing calls. | Lexicon/phoneme overrides in TTS stage. |
| V6 | Transfer to SIP Address | Connect/Retain | Human-handoff safety net → enterprise trust. | SIP REFER to any destination. |
| V7 | Dynamic SIP Headers | Connect | Enables real telephony workflows (routing/metadata). | Per-call SIP header injection on join. |
| V8 | MLLM | Believe | Lower latency / better convo = stronger aha. | Multimodal pipeline (OpenAI Realtime/Gemini Live/Grok) — in engine. |
| V9 | UI Redesign | All | "Fastest time to revenue" — the studio_x_2 rebuild itself. | Agent-centric IA + 5-step wizard. |

### A — Onboarding & Growth

| ID | Feature | Stage | Pri | Today/Comp | Strategic impact | Technicality |
|---|---|---|---|---|---|---|
| A1 | Improve Onboarding | Land | **P0 ✅ SHIPPED 2026-07-09** | ✗ / TS | Highest-frequency friction; every stage inherits it. Project creation >30s, weak templates, defaults trail Retell. | Shipped: provisioning ceremony (`provisioning-ceremony.tsx`, once-per-browser, `?provision=1` replays) + named-default strip + trust line + template stack chips + `lib/journey-progress.ts` (checklist deleted); commit `a1387f7`. Design doc: `references/design/a1-first-run.html`. The Console-side >30s fix itself stays a Console-team dependency — this is the Studio-side presentation of that wait. |
| A2 | Phone Number Resell | Connect | P1 | ✗ / **WS (intl)** | Self-serve on-ramp for users w/o a carrier; international is 0/5 whitespace. | **Net-new + Partnership** carrier deal. Number inventory + provisioning + billing + routing UI. |
| A3 | Easy ITSP Onboarding | Connect | **P0** | ✗ / near-WS (1/5) | Collapses the #1 BYO-telephony pain; unblocks Connect for the BYO majority. | Auto-configure Elastic SIP Trunk from a Twilio/Telnyx **API key** (replaces ~6 manual steps). |
| A4 | Import Agents from Competitors | Land | P1 | ✗ / **WS (0/5)** | Acquisition wedge: turns rivals' install base into Agora top-of-funnel. +110% first-week activation precedent (Streak). | Parse Vapi/Bland/Retell agent export → map to Agent+Deployment. **Feasibility spike required.** |
| A5 | Growth Hacking | — | park | — | Umbrella, not a feature. | Route to `/measure` + experimentation program. |
| A6 | Self-Serve Concurrency Purchase | Convert | **P0** | ✗ / **TS gap (5/5)** | The literal free→paid Convert UI; removes a sales wall (CAC-accretive). | Studio/Billing UI + Engine quota API. **Confirm real default ceiling (F8) before designing the number.** |

### B — Platform & APIs

| ID | Feature | Stage | Pri | Today/Comp | Strategic impact | Technicality |
|---|---|---|---|---|---|---|
| B1 | Stable Public REST API | Platform | dep | ◐ / TS | Foundation the marketplace, import, programmatic activation build on. | **Engine-owned.** Unify with engine; publish one versioned stable contract. |
| B2 | Stable Studio SDK Release | Platform | dep | ◐ / TS | Lets partners/devs build on Studio → ecosystem. | **Engine-owned.** External SDKs unified w/ engine + stability contract. |
| B3 | Connector Marketplace (MCP+Native) | Convert | P1 | ◐ / TS+ | Stickiness + expansion; each connector raises switch-out cost. | Discovery/1-click-install **UI over existing MCP + native**; auto tool-binding; BYO-MCP escape hatch. |
| B4 | Engine–Studio Vendor Alignment | Retain | dep | ✗ / — | Parity policy: Studio supports every engine vendor within X days. | Standing sync process + generated vendor config surface. |
| B5 | Couchbase RAG Provider | Convert | P2 | ✗ / — | Paid retrieval backend for heavy-KB users. | Retrieval-provider integration into the existing KB. |

### C — Conversation Quality (mostly Retain; do not lead the build here)

| ID | Feature | Stage | Pri | Today/Comp | Strategic impact | Technicality |
|---|---|---|---|---|---|---|
| C1 | Agent Handbook | Believe | P2 | ✗ / — | Easier persona/tone → believable agent faster. | Persona/tone presets in wizard Voice/Persona step. |
| C2 | Agent Handoff | Retain | P2 | ✗ / — | Multi-agent escalation → handle complex calls, keep traffic. | **Engine-owned.** Runtime agent→agent live transfer. |
| C3 | Backchanneling | Retain | P2 | ✗ / — | "Mm-hmm" cues → more human, higher completion. | Engine turn-taking; injected TTS cues mid-turn. |
| C4 | Dynamic Filler Words | Retain | P2 | ✗ / — | Masks LLM latency → feels responsive. | Engine; filler injection during model wait. |
| C5 | Background Sound | Retain | P2 | ✗ / — | Realistic call environment (contact-center feel). | Audio-bed mixing in the pipeline. |
| C6 | Voice Cloning | Retain | P2 | ✗ / **TS gap (4/5)** | BYO-voice branding; parity gap vs Retell/Bland/EL. | Native or BYO-key TTS clone; tier-gate. |
| C7 | In-Call Sentiment Analysis | Retain | P2 | ✗ / — | Live convo-health read → feeds monitoring/QA. | Real-time sentiment on the transcript stream. |
| C8 | Self-Improving Agent | Retain | P2 | ✗ / — | Compounding quality → long-run retention moat. | Outcome loop → prompt/eval tuning. **Hardest; depends on Evals.** |
| C9 | MLLM Resell | Convert | P2 | ◐ / — | Premium model tier to sell up. | **Partnership** + engine vendor add. |

### D — Telephony & Reliability

| ID | Feature | Stage | Pri | Today/Comp | Strategic impact | Technicality |
|---|---|---|---|---|---|---|
| D1 | Call Throttling | Consume | **P0** | ✗ / — | Makes batch actually *complete* → volume → paid. Dropped calls = churn. | **SIP Manager.** Auto-adjust CPS to trunk; queue + retry vs drop. |
| D2 | STT/TTS Backup Vendor | Retain | P1 | ✗ / — | Reliability = enterprise expansion + churn defense (API downtime +60% YoY). | **Engine.** Health-check + automatic vendor failover. |
| D3 | Call Queue | Connect/Consume | P2 | ✗ / — | Queue inbound instead of rejecting → capture demand. | SIP Manager/engine inbound queue. |
| D4 | WhatsApp Voice | Connect | P2 | ✗ / — | New channel/audience, but **highest uncertainty**. | **Net-new, no Agora support (F6); third-party build.** |
| D5 | Split Inbound/Outbound Concurrency | Consume | P2 | ✗ / — | A batch blast can't starve inbound (protects both revenue streams). | Engine quota split per direction. |
| D6 | Alerting | Retain | P1 | ✗ / — | Counter-metric to "drive volume"; catches payment/concurrency/retry/TTS spikes. | Webhooks + threshold rules → notifications; surfaces in Monitor › Diagnostics. |

### E — Knowledge & Data

| ID | Feature | Stage | Pri | Today/Comp | Strategic impact | Technicality |
|---|---|---|---|---|---|---|
| E1 | KB Web Crawl | Retain | P2 | ◐ / — | Faster/better knowledge → better answers → retention. | Crawler → chunk → index into existing native KB. |
| E2 | KB Chunking & Similarity Tuning | Retain | P2 | ◐ / — | Power-user retrieval quality control. | Expose chunking strategy + similarity thresholds on the KB. |
| E3 | Text-Only Agents | Believe | P2 | ✗ / — | Lowers trial barrier (test in chat) + opens non-voice use cases. | Disable ASR/TTS legs; chat transport; wizard **Type** option. |

### F — Trust, Safety & Ops

| ID | Feature | Stage | Pri | Today/Comp | Strategic impact | Technicality |
|---|---|---|---|---|---|---|
| F-Sec | Security (retention + PII redaction) | Retain | P1 | ✗ / — | Unblocks regulated buyers (HIPAA/GDPR); table-stakes for enterprise. | Configurable retention + automatic PII redaction in transcript pipeline. |
| F-Mon | Live Call Monitoring | Retain | P1 | ✗ / diff (~2/5) | Live listen/whisper/takeover; Retell shipped Jun 2026 → becoming table-stakes. | **Net-new for ConvoAI (F7).** Live audio+transcript stream + in-call controls. |
| F-Eval | Evals / Simulation | Retain/Quality | **P0** | ✗ / **TS gap (5/5)** | All 5 competitors shipped this in ~12mo; **defensive parity**, gates confidence to scale. | Simulated-caller persona agents + assertions/LLM-judge + CI; author in Test step, results in Monitor. |
| F-Phys | Physical AI | — | park | ✗ / — | Exploratory ("beyond the phone"). Not an activation lever this cycle. | TBD. |

### Synthesized P0 (not on the deck, but the fact-checks demand it)

| ID | Feature | Stage | Pri | Strategic impact | Technicality |
|---|---|---|---|---|---|
| X1 | Correct free-tier meter + spend cap + alert | Convert/guardrail | **P0 ✅ SHIPPED 2026-07-09** | Trust in a postpaid model; the counter-metric that makes "drive volume" safe (no bill-shock churn). Corrects the stale 10k-min surfaces (F1). | Shipped as the Billing "Usage & spend" card (`components/usage-spend-card.tsx`, commit `24ad614`; diverge round `a570f62…3342b3e`). Design doc: `references/design/x1-usage-spend.html`. Research corrected the plan: usage belongs on Billing (all 5 competitors), NOT persistent chrome — the account-menu ring stays the glance. |

---

## 3. P0 PRD cards (Phase 1 — design now)

Each card: **Problem · User story · Activation hypothesis · Scope · UX surface & flow ·
Data-model delta · Depends on · Acceptance criteria · Metrics · Open Qs · Run next.**

### A1 — Improve Onboarding Experience
- **Problem.** New project creation takes >30s; default templates undersell; pipeline defaults
  trail Retell (no smart-model-by-default, worse voices). First-run friction taxes every
  downstream stage.
- **User story.** *As Maya (solo builder), I sign up and reach a working, good-sounding agent I
  can talk to in under a minute — without picking vendors I don't understand.*
- **Activation hypothesis.** If we cut time-to-first-project and ship strong defaults, then
  Believe-stage aha rate rises, because the user hears competence before hitting any decision.
- **Scope.** IN: provisioning speed, default template quality, smart-model + good-voice defaults,
  latency parity. OUT: the wizard redesign (done), Aria provisioning (done).
- **UX surface & flow.** Signup → `/agents` Aria journey widget (exists). Improve: instant
  project readiness (no >30s spinner), a stronger default agent, a "talk to Aria now" primary
  action already present — make it the unmistakable first move.
- **Data-model delta.** None (defaults tuning). Possibly a `provisioningState` for the
  first-run loading pattern (`/fortify`).
- **Depends on.** **Console** (provisioning speed) — the one P0 with no cross-team blocker on the
  Studio side, but the >30s fix is Console's.
- **Acceptance.** Project ready < 5s p50; a first-time user reaches a spoken Aria reply in
  < 60s; default agent uses smart model + a top-tier voice with no user choice required.
- **Metrics.** `project_created` duration; `aria_conversation_started` rate; time-to-first-reply.
- **Open Qs.** What's the real provisioning bottleneck (Console)? Which default
  model/voice per the Stack preset (needs Agora-docs-grounded list, IA-revamp Q1)?
- **Run next.** `/journey` (first-run) + `/fortify` (provisioning/loading states).

### A3 — Easy ITSP Onboarding
- **Problem.** Connecting BYO telephony (the only telephony Agora has, F2) is a ~6-step manual
  SIP trunk setup — the single most-cited Connect-stage pain, and every competitor still makes it
  manual (only ElevenLabs auto-configures, 1/5).
- **User story.** *As Devan (agency), I paste my Twilio/Telnyx API key and Agora configures the
  SIP trunk for me — I don't hand-build termination/origination/whitelists.*
- **Activation hypothesis.** If SIP setup becomes "paste a key," then Connect-stage completion
  rises sharply for the BYO majority, because the highest-friction manual step disappears.
- **Scope.** IN: Twilio + Telnyx key → auto-provision Elastic SIP Trunk; validation + clear
  errors. OUT: buying a number (that's A2); non-Twilio/Telnyx carriers (manual fallback stays).
- **UX surface & flow.** Builder **Configure/Deploy** step (ChannelHero) → "Connect telephony" →
  choose provider → paste key → auto-configure → green "trunk connected." Mirror in
  **Resources › Deployment Channels**.
- **Data-model delta.** Deployment/channel gains `sipTrunk: { provider, status, credentialRef }`.
- **Depends on.** **Engine/SIP Manager** for the auto-config API from a carrier key. Confirm it
  exists or is planned before designing the "auto" path (else it degrades to guided-manual).
- **Acceptance.** Twilio/Telnyx key → connected trunk in ≤ 4 fields, no manual trunk config;
  invalid key → specific, recoverable error; success deep-links to "deploy Aria here."
- **Metrics.** `sip_trunk_connected` rate + time; Connect-stage completion; error rate by cause.
- **Open Qs.** Does an auto-config-from-key API exist today? Which carriers beyond Twilio/Telnyx?
- **Run next.** `/journey` (the connect flow) + `/fortify` (invalid key / partial config /
  provider outage) + `/articulate` (the error copy).

### A6 — Self-Serve Concurrency Purchase
- **Problem.** Raising concurrency today means a support ticket (F8); all 5 competitors let you
  self-serve it. This is a **table-stakes gap** sitting directly on the Convert transition — the
  user hits a wall exactly when their launch needs more lines.
- **User story.** *As Devan, when my batch campaign needs more concurrent lines, I buy them in
  the app in a minute — no sales call, no ticket.*
- **Activation hypothesis.** If concurrency is self-serve, then free→paid conversion rises and
  CAC drops, because we remove a sales wall at the exact moment of expansion intent.
- **Scope.** IN: view current concurrency + usage, buy more (per-line pricing), see the new
  limit take effect. OUT: setting the *default* ceiling (Engine); enterprise contract tiers.
- **UX surface & flow.** Two entry points: (1) **Project Settings/Billing › Concurrency** (browse
  + buy); (2) **contextual nudge at the wall** — when a deployment is throttled by concurrency,
  surface "Add concurrency" inline. Show current limit honestly (don't invent a number, F8).
- **Data-model delta.** Project gains `concurrency: { limit, used, purchasedAddOns }`.
- **Depends on.** **Engine** quota API (raise limit programmatically) + confirmed default ceiling.
- **Acceptance.** User sees real current limit + usage; can purchase add-on lines; new limit
  reflected without a ticket; purchase respects the X1 spend cap.
- **Metrics.** `concurrency_purchased`, free→paid rate, `concurrency_wall_hit` (counter — how
  often users hit the wall without a self-serve path).
- **Open Qs.** Real default ceiling + per-line price? Instant or provisioning delay on raise?
- **Run next.** `/journey` (buy flow + the at-the-wall nudge) + `/measure` (conversion event).

### D1 — Call Throttling
- **Problem.** A batch campaign that dials faster than the SIP trunk allows **drops calls
  silently**. The user sees a failed campaign and churns — right at the Consume stage that's
  supposed to burn free minutes toward paid.
- **User story.** *As Devan, my 5,000-row batch dials at a rate the trunk can handle, and calls
  that can't connect now queue and retry instead of vanishing.*
- **Activation hypothesis.** If throttling + queue/retry replace silent drops, then batch
  completion rate rises → more minutes consumed → more free-tier exhaustion → more conversion.
- **Scope.** IN: auto-adjust CPS to trunk capacity; queue + retry policy; visible throttle state.
  OUT: the concurrency *purchase* (A6); inbound queue (D3).
- **UX surface & flow.** Batch-calls deployment settings (throttle/retry config, sensible
  defaults) + **Monitor** shows live throttle state and retry counts so a "slow" campaign reads
  as *working*, not broken.
- **Data-model delta.** Batch deployment gains `throttle: { cps, retryPolicy }`; call records
  gain `queued|retried|dropped` status.
- **Depends on.** **SIP Manager** (CPS auto-adjust + queue/retry engine).
- **Acceptance.** Over-fast dialing no longer drops calls (queues+retries); user can see the
  campaign is throttled, not failed; completion rate measurably higher than un-throttled.
- **Metrics.** `batch_completed` rate, `calls_dropped` (counter → target 0), retry success rate.
- **Open Qs.** Auto-detect trunk CPS or user-set? Retry backoff defaults?
- **Run next.** `/fortify` (the drop/queue/retry state inventory) + `/journey` (batch monitor).

### F-Eval — Evals / Simulation (first cut)
- **Problem.** Every competitor (5/5) shipped automated evals/simulated-call testing in ~12
  months; Agora has none. Without it, users (and Agora) can't gain confidence to scale minutes —
  a **defensive parity gap**, and a prerequisite for C8 Self-Improving Agent.
- **User story.** *As Devan, before I put a client's agent live, I run a suite of simulated
  callers and see pass/fail on the behaviors that matter.*
- **Activation hypothesis.** If users can prove an agent works before going live, then Connect→
  Consume confidence rises and post-launch churn (from bad live calls) drops.
- **Scope (first cut).** IN: define test cases (persona + expected behavior/structured output),
  run simulated calls, see pass/fail + transcript. OUT (later): full CI integration, auto QA
  analyst, self-improvement loop.
- **UX surface & flow.** Author in the wizard **Test & Publish** step ("add a test" alongside the
  quick-test); results surface in **Monitor** (a Tests/Evals view). One failing real call → "save
  as test" (Vapi's pattern).
- **Data-model delta.** New `EvalSuite { id, agentId, cases[] }`; `EvalRun { suiteId, results[] }`.
- **Depends on.** **Engine** (simulate a caller against an agent; assertion/judge hooks).
- **Acceptance.** User defines ≥1 test case, runs it, sees pass/fail + why, and can save a live
  call as a regression test.
- **Metrics.** `eval_suite_created`, `eval_run` count, correlation of eval-users → d7 retention.
- **Open Qs.** Does the engine expose an agent-vs-agent simulation hook? Judge = rules, LLM, or
  both?
- **Run next.** `/journey` (author + run + read results) — it spans Build and Observe, so map the
  cross-surface flow carefully.

### X1 — Correct free-tier meter + spend cap + alert
- **Problem.** Some surfaces still show "10,000 free minutes" (that's core RTC, not ConvoAI — the
  real ConvoAI free tier is **300 min/month**, F1). Under **postpaid** billing (F9), driving
  volume without a spend cap risks bill-shock → churn + refund tickets. This is the guardrail
  that makes the whole "drive volume" strategy safe.
- **User story.** *As Maya, I always see how many of my 300 free minutes remain, and I set a hard
  spend cap so a runaway batch can't surprise me.*
- **Activation hypothesis.** If the free tier is shown honestly and a cap exists, then trust
  rises and bill-shock churn falls — protecting the conversions that volume produces.
- **Scope.** IN: persistent minutes-used meter (300-min truth) in chrome/Billing; spend cap +
  threshold alert; correct the stale 10k copy. OUT: changing the actual pricing/tier.
- **UX surface & flow.** A minutes meter visible from minute one (already a §20 intent); Project
  Settings/Billing → spend cap + alert threshold; alert fires via D6 plumbing when built.
- **Data-model delta.** Project gains `freeMinutes: { included: 300, used }`, `spendCap`,
  `alertThreshold`.
- **Depends on.** Studio-side (meter/cap UI); **Console/Billing** for the real usage number +
  enforcing the cap.
- **Acceptance.** Meter shows correct 300-min tier + live usage; user can set a cap; hitting the
  threshold warns *before* overage; no surface shows 10k for ConvoAI.
- **Metrics.** `free_tier_exhausted`, `spend_cap_set` rate, surprise-invoice/refund rate
  (counter).
- **Open Qs.** Reconcile with `project_activation_claim_your_number.md` (150+150 nudge) — is the
  canonical number 300/month or a designed 150+150? Enforce cap hard or soft?
- **Run next.** `/articulate` (honest free-tier + billing copy) + `/journey` (cap-setting) +
  `/measure` (counter-metrics).

---

## 4. P1 PRD cards (Phase 2 — condensed)

### A4 — Import Agents from Competitors ⭐ whitespace
Bring a Vapi/Bland/Retell agent into Agora in one step. **Wedge** (0/5 competitors; +110% Streak
precedent). **Surface:** `/agents` Create flow → Import accelerator (a stub already exists in the
wizard). **Data:** parser maps competitor export → Agent (Stack+Persona) + Deployment
(prompt/vars). **Depends on:** feasibility of parsing each competitor's export (spike first).
**Acceptance:** upload/paste a competitor agent → a working Agora draft with prompt, voice, tools
mapped + a clear diff of what didn't map. **Run next:** feasibility spike → `/journey` +
`/fortify` (partial/unmappable imports).

### A2 — Phone Number Resell ⭐ whitespace (international)
Provision numbers in-product. **Net-new + Partnership-gated** (Agora sells none today, F2).
International self-serve is 0/5 whitespace. **Surface:** ChannelHero → "Get a number"; inventory
under Deploy. **Data:** `PhoneNumber { e164, country, status, monthlyCost }`. **Depends on:**
Partnership carrier deal (design the UI *after* it's real). **Acceptance:** search → buy → attach
a number to a deployment self-serve; billing reflects the monthly cost. **Run next:** confirm
Partnership status → `/journey` (buy+attach) + `/articulate` (per-country pricing clarity).

### B3 — Connector Marketplace (MCP + Native)
Marketplace UI over **existing** MCP + native connectors (F4); 1-click install, auto tool-binding,
BYO-MCP escape hatch. **The big Convert/expansion surface.** **Surface:** **Resources**
(`/integrations`) → Marketplace tab. **Data:** `Connector { id, kind: native|mcp, authState }`;
attach to Agent.actions[]. **Depends on:** engine MCP (exists); a curated catalog. **Acceptance:**
browse catalog → install → agent gains the tool without manual config; BYO-MCP server URL works.
**Run next:** `/organize` (this feature is big enough for its own card-sort/tree-test) → `/journey`.

### D2 + D6 — Backup Vendor + Alerting (reliability floor)
**D2:** automatic STT/TTS failover when a vendor degrades (Engine). **D6:** threshold alerts on
payment-failure / concurrency / LLM-retry / TTS-error spikes (Webhooks → Monitor › Diagnostics).
Together = the enterprise reliability floor + the volume counter-metric. **Surface:** D2 in
Resources/Realtime vendor config; D6 in **Monitor › Diagnostics** (extends the existing
critical-issues badge). **Data:** `vendorFailover policy`; `AlertRule { metric, threshold,
channel }`. **Depends on:** Engine (D2), Webhooks (D6, exists). **Acceptance:** primary vendor
outage → call continues on backup; a configured spike → an alert fires + shows in Diagnostics.
**Run next:** `/fortify` (failure modes) + `/journey` (alert config).

### F-Sec — Security (retention + PII redaction)
Configurable transcript retention + automatic PII redaction. **Unblocks regulated buyers**
(HIPAA/GDPR/SOC2 — a standing constraint). **Surface:** **Project Settings › Security.** **Data:**
`Project.security { retentionDays, piiRedaction }`. **Depends on:** Engine/pipeline redaction hook.
**Acceptance:** set retention window; PII auto-redacted in stored transcripts; settings auditable.
**Run next:** `/fortify` + `/include` (compliance) + `/articulate` (trust copy).

### F-Mon — Live Call Monitoring
Watch/listen live calls + whisper/takeover. **Net-new for ConvoAI** (F7); becoming table-stakes
(Retell shipped Jun 2026). **Surface:** **Monitor** → live view. **Data:** live audio+transcript
stream (Signaling) + in-call control API. **Depends on:** Engine live-stream + control hooks.
**Acceptance:** see active calls; listen to one live; inject a whisper / take over. **Run next:**
`/journey` (the live console) + `/fortify` (many-concurrent-calls, permissions).

---

## 5. Cross-cutting requirements (apply to every card)

- **Honesty in a postpaid model.** Every surface that can cost money shows the projected cost and
  respects the X1 spend cap. Never show the 10k free-minute figure for ConvoAI.
- **Additive only.** No restyle/rename/removal of frozen Studio flows or the agent-centric IA.
  New features attach to existing surfaces (wizard step, deployment config, Resources, Monitor)
  before they earn new nav.
- **Regulated by default.** PII, retention, and auditability considered on any feature touching
  call content (transcripts, monitoring, evals, KB).
- **Solo-designer scope.** Each slice must be shippable by one person; prefer extending a surface
  over inventing one. Only ~5 features warrant genuinely new sub-surfaces (A2, A6, F-Mon, F-Eval,
  D4).
- **Accessibility.** New charts/meters get aria-labels (existing debt per CLAUDE.md `/include`).
- **Dependency gating.** Do not ship UI for an Engine/SIP/Partnership capability ahead of a
  confirmed date — design it, but hold the release behind the team.

---

## 6. Sequenced build backlog (what a future session picks up first)

1. **X1** free-tier meter + spend cap — Studio-side, unblocks trust, corrects the fact-check. →
   `/articulate` + `/journey`.
2. **A1** onboarding defaults — Console dep, but the Studio first-run polish is designable now. →
   `/journey` + `/fortify`.
3. **A6** self-serve concurrency — the Convert UI; confirm the ceiling number, then design. →
   `/journey`.
4. **A3** easy ITSP onboarding — confirm the auto-config API, then the connect flow. → `/journey`
   + `/fortify` + `/articulate`.
5. **D1** call throttling — SIP-dep; design the monitor/state now. → `/fortify`.
6. **F-Eval** evals first cut — cross-surface (Build+Observe); map the flow. → `/journey`.
7. Then P1: **A4** (spike first) · **A2** (Partnership first) · **B3** (`/organize` first) ·
   **D2+D6** · **F-Sec** · **F-Mon**.
8. P2/P3: the register rows in §2 are enough to start a `/journey` per feature when demand
   signals (via `/measure`) justify it.

**Each feature's "Run next" names the skill.** Start there; the register row + this PRD's context
(§1) give a fresh session everything it needs to design a single feature without re-deriving the
strategy.

---

## Appendix — provenance

Built 2026-07-09 from the cn2meet roadmap deck + three research briefs (Agora ground-truth docs
sweep · competitor teardown of Vapi/Retell/Bland/ElevenLabs/Synthflow · PLG activation evidence).
Strategy rationale, competitive detail, and citations live in
[`roadmap-activation-strategy-2026-07-09.md`](roadmap-activation-strategy-2026-07-09.md) §4, §10,
§12. Fact-checks (§2 there) are load-bearing — re-verify the 300-min free tier and postpaid
billing in-app before shipping billing/onboarding copy.
