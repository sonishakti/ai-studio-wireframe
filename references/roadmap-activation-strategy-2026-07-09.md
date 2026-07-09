# Roadmap → Self-Service Activation — Strategy

> **Purpose.** The cn2meet roadmap deck (Agora ConvoAI Studio · July 2026) lists ~42 features
> (9 shipped in Milestone v2 + 33 in the pipeline). This doc reframes that flat wishlist as an
> **activation engine**: which feature moves which stage of the funnel, what it costs, where it
> lives in the product, and what to build first. It pairs with the design-ready spec in
> [`roadmap-features-prd-2026-07-09.md`](roadmap-features-prd-2026-07-09.md).
>
> **Status:** Strategy proposal for sign-off. Authored 2026-07-09 (`/strategize` → `/blueprint`
> → `/organize`, evidence-backed). No screens built yet. Does **not** re-litigate the locked
> frame in `LEARNINGS.md` — it extends it with a feature-level activation plan.
>
> **How a future session picks this up:** read §0 (TL;DR) → §2 (fact-checks — critical, several
> correct stale project assumptions) → §5 (the funnel reframe, the core idea) → then the PRD.
> Everything is cited; the three research briefs behind it are archived in §12.

---

## 0. TL;DR — the one-page thesis

Agora monetizes **minutes on a live deployment**, not published agents. The north star is
already set (`LEARNINGS.md` §2/§20): **Signup → first live deployment carrying traffic → first
paid usage**, funnel stages **Land → Believe → Connect → Consume → Convert → Retain**. The
cn2meet roadmap is, whether or not it was framed this way, a list of unblockers for those six
stages. Read that way, three things fall out:

1. **The roadmap's own categories bury the strategy.** Grouping by "Conversation Quality" vs
   "Telephony" hides the fact that ~8 features attack the *same* activation bottleneck — getting
   a signed-up user to a live, traffic-carrying deployment fast — while ~15 others are
   retention/quality plays that matter only *after* activation. Re-clustered by funnel stage
   (§5), the build order becomes obvious.

2. **Two roadmap items sit in genuine competitive whitespace.** Across Vapi, Retell, Bland,
   ElevenLabs, and Synthflow, **nobody** offers competitor-agent import or self-serve
   international numbers (0/5 each). "Import Agents from Competitors" and "Phone Number Resell"
   are therefore not catch-up — they are wedge features that lower the switching cost *into*
   Agora. (§4)

3. **One roadmap item is already table stakes we're missing.** All 5 competitors shipped
   automated **evals / simulated-call testing** within the last ~12 months. Agora has none.
   This is a gap to close defensively, not an opportunity to celebrate. (§4)

The single sharpest activation lever, though, is a pricing fact most of the deck ignores:
**ConvoAI's free tier is 300 minutes/month, shared with Real-Time STT and Translation** — not
the 10,000 minutes some project surfaces still show (§2). 300 minutes is ~5 hours. A single
test call is unmonetized, but **one batch campaign exhausts the free tier in an afternoon.**
So the activation job isn't "get them to publish" — it's "get them to *volume*," fast. Every
"Connect" and "Consume" feature (numbers, SIP onboarding, concurrency, throttling, batch
calls) is really a lever on the same conversion: **free 300 minutes → paid.**

**Recommended Phase-1 scope (P0):** Improve Onboarding, Easy ITSP Onboarding, Self-Serve
Concurrency Purchase, Call Throttling, and a first cut of Evals — plus surfacing the *correct*
free-tier meter and a spend cap. Rationale, sequencing, and metrics below.

---

## 1. Where this feature list came from

Source: **https://cn2meet.vercel.app/** — a reveal.js deck titled *"Agora · Conversational AI —
ConvoAI Studio Roadmap · July 2026."* It has three parts:

- **Milestone v2 (shipped):** 9 features — Concierge, Connectors–HubSpot, Custom Tools, Voice
  Formatting, Pronunciation Dictionary, Transfer to SIP Address, Dynamic SIP Headers, MLLM,
  UI Redesign.
- **Future roadmap (pipeline):** 33 features in six lettered categories —
  **A** Onboarding & Growth (6), **B** Platform & APIs (5), **C** Conversation Quality (9),
  **D** Telephony & Reliability (6), **E** Knowledge & Data (3), **F** Trust, Safety & Ops (4
  shown; deck labels it 5). The deck self-describes as "30+ initiatives."
- **Sequencing:** cross-team dependencies on four partner teams — **Engine**, **SIP Manager**,
  **Partnership**, **Console**. The deck itself flags that Console owns onboarding speed
  ("project creation currently >30s"), Engine is the "biggest unlock," Partnership owns
  number/MLLM resell deals, and SIP Manager owns throttling + WhatsApp voice.

The full verbatim inventory is the master register in the PRD (§3 there). This strategy doc
works from that inventory but does not re-list it item-by-item until §5.

---

## 2. Ground-truth fact-checks (read before designing anything)

A docs sweep of `docs.agora.io` (July 2026) surfaced several facts that **correct assumptions
baked into the deck and into stale project surfaces.** Get these wrong and the activation math
is wrong.

| # | Claim to correct | Ground truth (with source) | Consequence for design |
|---|---|---|---|
| **F1** | "10,000 free minutes" (still shown in the avatar dropdown / some Billing copy) | ConvoAI free tier is **300 min/month, shared with Real-Time STT + Translation**. The 10,000-min figure belongs to **core RTC voice/video**, a different product. [pricing](https://docs.agora.io/en/conversational-ai/overview/pricing) | The free-tier meter must show the *right, small* number. 300 min reframes activation around **volume-to-paid**, not "try it once." Reconcile with the memory note `project_activation_claim_your_number.md` (150+150 nudge). |
| **F2** | Roadmap "Phone Number Resell" implies Agora sells numbers | Agora **does not provision or sell numbers** — telephony is **BYO SIP trunk** (Twilio, Telnyx, Exotel named). [sip-trunk](https://docs.agora.io/en/conversational-ai/studio/deploy/sip-trunk) | Resell is **net-new** and needs a **Partnership** carrier deal. It is a real wedge (0/5 competitors do international self-serve), not a UI tweak. |
| **F3** | "MLLM" reads as unshipped on the future list, yet also appears in v2 | MLLM (speech-to-speech) is **already live in the Engine**: OpenAI Realtime, Google Gemini Live, xAI Grok. [product-overview](https://docs.agora.io/en/conversational-ai/overview/product-overview) | "MLLM" work is **Studio surfacing** of an existing engine capability + **MLLM Resell** (Partnership). Not net-new pipeline. |
| **F4** | "Connector Marketplace" / MCP reads as greenfield | Function/tool-calling and **MCP are already supported** (engine `llm.mcp_servers`; Studio "+ Add MCP Server"). [join API](https://docs.agora.io/en/conversational-ai/rest-api/agent/join) | Marketplace = a **discovery/1-click-install UI** over an existing capability. Lower risk than it looks. |
| **F5** | "Knowledge Base Web Crawl / Chunking" reads as building a KB | A **native KB already exists** (agent Actions → "+ Add Knowledge Base"), but the retrieval mechanism, limits, and provider are **undocumented/unconfirmed**. | These are **enhancements to a shallow existing feature.** Couchbase RAG Provider is a swappable backend for it. Validate the current KB's real depth first. |
| **F6** | "WhatsApp Voice" reads as a channel toggle | **No Agora-native WhatsApp** integration exists anywhere (Chat or ConvoAI). | WhatsApp Voice is a **third-party build**, not a channel flip. Highest-uncertainty item on the deck. |
| **F7** | "Live Call Monitoring" reads as extending Observe | ConvoAI **Observe is post-call/aggregate** — no live listen-in. (The separate *Agora Analytics* product has a live Call Inspector, but that's RTC QoE, not ConvoAI.) [analytics](https://docs.agora.io/en/conversational-ai/studio/observe/analytics) | Live monitoring is **net-new** for ConvoAI. ~2/5 competitors have it self-serve. |
| **F8** | Concurrency ceiling is knowable | **No public ConvoAI concurrency/CPS limit** is documented; a "20 PCU" figure floating around actually belongs to Signaling/RTM. Quota increases go through `support@agora.io`. | Do **not** cite a specific ceiling in UI or docs. "Self-Serve Concurrency Purchase" replaces a support-ticket flow — confirm the real default with Engine before designing the number. |
| **F9** | Billing is prepaid credits | ConvoAI billing is **monthly postpaid**; managed mode bundles ASR+LLM+TTS at **$0.10/min**; BYOK supported. | Spend caps/alerts matter *more* under postpaid (bill-shock risk). Design the cap before scaling concurrency. |

**These are the load-bearing corrections.** F1 and F2 in particular change the strategy: the
free tier is small enough that *volume* is the conversion event, and numbers are a partnership
wedge, not a feature toggle.

*Access caveat: docs.agora.io is a JS-rendered SPA; the sweep used a text-extraction proxy.
Re-verify any decision-critical number in-browser before it ships in UI or contracts.*

---

## 3. Strategic frame (`/strategize`)

**Context.** Agora is a real-time-comms infrastructure company whose ConvoAI Studio competes in
a crowded, fast-moving voice-agent market (Vapi at ~$500M valuation and 1M+ developers; Retell
at ~$60M ARR up 650% YoY; Bland Series C; ElevenLabs Agents at platform scale). The category's
onboarding bar has converged on: no-card signup → template → **talk to the agent in-browser in
minutes** → self-serve number → self-serve concurrency → evals in the same session. Agora's own
funnel (`LEARNINGS.md` §2) loses **81.7%** at signup→account, **~93%** at the Console↔Studio
seam, and **77.7%** create→publish. Two of the three biggest leaks are activation leaks.

**Gap.** The product has been rebuilt around this (studio_x_2: Aria auto-provisioned and live,
agent-centric IA, a 5-step creation wizard). But the *revenue* line — free 300 min → paid — is
still mostly unserved: the surfaces that would drive a new user from "I heard Aria talk" to "my
batch campaign is burning minutes" (self-serve concurrency, SIP onboarding, throttling, a
correct free-tier meter, a spend cap) are exactly the roadmap items sitting unbuilt. Meanwhile
the deck's largest category by count (Conversation Quality, 9 items) is almost entirely
post-activation.

**Opportunity.** Reframed by funnel stage, ~8 roadmap features compound on the single
highest-value transition (Connect→Consume→Convert). Recovering even 10% of the seam leak is
~8,500 more activated accounts per cohort (`LEARNINGS.md` §2); with the agent pre-provisioned,
each activated account is now *one batch campaign* away from exhausting the free tier and
converting. Self-serve CAC in this market runs ~**$702 vs ~$11,400 sales-led** (a 16× gap) —
so every feature that removes a "talk to sales" wall (concurrency, numbers, ITSP) is directly
CAC-accretive. [CAC benchmarks](https://ltvcacbook.com/blog/cac-benchmarks-2026)

**Goals.**
- **Primary:** raise the rate of `signup → first live deployment carrying traffic`, then
  `→ free-tier exhausted → first paid usage`.
- **Secondary:** lower switching cost *into* Agora (import, ITSP), and reduce post-activation
  churn (reliability/evals/monitoring) to protect the minutes once they're flowing.
- **Guardrail:** don't regress the frozen Studio UI or the agent-centric IA; additive only.

**Constraints (from `LEARNINGS.md` §3 — do not break).** Studio UI frozen (additive only);
Console + Studio share one backend/one project record (the seam is wayfinding, not auth);
solo designer / small team (every slice ships by one person); regulated (HIPAA · GDPR · SOC 2 ·
EU AI Act); time-on-page is not a KPI. Plus the roadmap's own hard dependency: most items need
**Engine**, **SIP Manager**, or **Partnership** — Console/Studio design can only expose what
those teams ship (§6).

**Guiding principles.**
1. **Volume is the conversion event, not "publish."** Optimize every stage toward a live
   deployment carrying *enough* traffic to cross the 300-min line.
2. **Remove sales walls before adding features.** A self-serve version of an existing
   ticket-gated flow beats a brand-new capability for activation ROI.
3. **Meet developers where the category already is.** Table stakes (evals, self-serve
   concurrency, in-browser test) must reach parity before differentiators (import, resell) can
   win — a great wedge into a leaky funnel just leaks faster.
4. **Additive, IA-respecting, honest.** Surface the *real* free tier and the *real* spend;
   trust is a retention feature in a postpaid usage model.

**Key assumptions & open questions.**
- *Assumes* the 300-min free tier and postpaid billing are current (F1/F9) — **verify in-app.**
- *Assumes* Engine exposes a stable-enough API for Studio to build the marketplace/import on
  (Item B1) — **confirm timeline with Engine.**
- *Open:* real default concurrency and CPS ceilings (F8) — blocks the concurrency-purchase UI
  number.
- *Open:* the true depth of the existing native KB (F5) — decides whether E-cluster is
  "enhance" or "rebuild."
- *Open:* is "Import from Competitors" legally/technically feasible (parsing Vapi/Retell agent
  exports)? — the wedge depends on it.

**Proposed scope (Phase 1).** See §7. Ships the Connect→Consume→Convert spine + the two
fact-check corrections that unblock everything else (correct free-tier meter, spend cap).

---

## 4. Competitive landscape (`/strategize` Q5)

Teardown of Vapi, Retell, Bland, ElevenLabs, Synthflow (July 2026). Full per-competitor detail
is archived in §12; the strategic cut:

**Table stakes — 3+/5 competitors have it, so parity is mandatory, not differentiating:**

| Capability | Coverage | Agora today | Roadmap item |
|---|---|---|---|
| Self-serve domestic number purchase | 4/5 (not ElevenLabs) | ✗ (BYO SIP only) | A2 Phone Number Resell |
| No-card free tier / signup credit | 4/5 (not Synthflow) | Partial (300 min) | A1 Onboarding |
| Custom HTTP/webhook tools | 5/5 | ✓ (shipped v2) | — |
| MCP support | 5/5 | ✓ (engine + Studio) | B3 Connector Marketplace (UI) |
| **Automated evals / simulated-call testing** | **5/5** | **✗** | **F Evals/Simulation** |
| Native self-serve voice cloning | 4/5 (not Vapi) | ✗ (BYO key) | C6 Voice Cloning |
| Some self-serve concurrency top-up | 5/5 | ✗ (ticket-gated) | A6 Self-Serve Concurrency |
| In-browser test call before telephony | 5/5 | ✓ (Aria/Playground) | — |

**Differentiators — 0–1/5 have it, so this is where Agora can actually win:**

| Capability | Coverage | Roadmap item | Read |
|---|---|---|---|
| **Competitor agent import/migration** | **0/5 — whitespace** | A4 Import from Competitors | Lowers switching cost *into* Agora. Streak saw **+110%** first-week import completion when it improved import UX. [OneSchema](https://www.oneschema.co/case-studies/improve-onboarding-conversion-rate) |
| **Self-serve international numbers** | **0/5 — whitespace** | A2 Phone Number Resell | Everyone stops at US/CA(/AU); rest is BYO or sales. Agora's global SD-RTN + a carrier deal could serve the underserved geographies. |
| Auto-configured SIP from just a Twilio credential | 1/5 (ElevenLabs) | A3 Easy ITSP Onboarding | Turns a ~6-step manual trunk setup into 4 fields. Big Connect-stage unlock. |
| Prompt-to-full-agent generation | 1/5 (Bland "Norm") | (adjacent to Concierge, shipped) | Agora's Concierge already configures agents via chat — extend toward one-turn generation. |
| Non-gated live call monitoring | ~2/5 (Vapi, Retell) | F Live Call Monitoring | Retell shipped live listen/whisper/takeover Jun 2026. Becoming a differentiator→table-stake. |

**Positioning read.** Agora is *behind* on evals and self-serve concurrency (must-fix parity),
*at parity* on in-browser test + tools + MCP, and *ahead or uncontested* on AI-concierge
onboarding, competitor import, and international numbers. **Win condition:** reach parity on the
must-fix trio fast, then lean the differentiators (import + international numbers + concierge)
as the acquisition wedge. Do not lead marketing with a wedge while the funnel behind it still
leaks at evals/concurrency.

---

## 5. The activation reframe — features by funnel stage (the core idea)

The deck's six categories (A–F) are an *org chart*, not a *funnel*. Below, every pipeline
feature is re-slotted against the six activation stages from `LEARNINGS.md` §20
(**Land → Believe → Connect → Consume → Convert → Retain**). This is the doc's central
contribution: it turns "30+ initiatives" into a sequenced activation machine and makes the
P0 set self-evident. (Shipped v2 features are shown in *italics* at the stage they serve.)

### Stage 1 — LAND · signup → account (attack the 81.7% + acquisition)
The user has heard of Agora and is deciding whether to start. Friction and switching cost win
or lose them here.
- **A1 Improve Onboarding Experience** — project creation >30s, weak default templates, pipeline
  defaults trailing Retell. *Console-owned; the deck's own callout.* **Highest-frequency
  friction; every downstream stage inherits it.**
- **A4 Import Agents from Competitors** ⭐ *whitespace* — bring a Vapi/Bland/Retell agent over in
  one step. Turns a competitor's install base into Agora's top-of-funnel.
- **A5 Growth Hacking** — data-driven UX optimization; an umbrella, not a feature. Route to
  `/measure`.
- *UI Redesign (v2, shipped)* — "designed around fastest time to revenue."

### Stage 2 — BELIEVE · talk to it, <60s, free (the "aha")
The user must *hear a competent agent* before any setup. This is where studio_x_2 already
invests (Aria live on signup). Roadmap items that deepen the aha:
- *Concierge (v2, shipped)* ⭐ — chat configures agents / launches campaigns / reads analytics.
  Only Bland's "Norm" is comparable (1/5). **Extend toward prompt-to-agent.**
- **C1 Agent Handbook** — easier personality/tone customization → a believable agent faster.
- **E3 Text-Only Agents** — same pipeline without the voice leg; lets a skeptic test in chat
  first, and opens non-voice use cases. Lowers the trial barrier.
- *MLLM (v2)* — better, lower-latency conversation makes the first impression land.

### Stage 3 — CONNECT · get it live on a channel (the seam the market has standardized)
Aria works in-browser; now the user must attach a real channel. **This is the make-or-break
transition and where the deck has the most leverage.**
- **A3 Easy ITSP Onboarding** ⭐ *near-whitespace* — drop in a Twilio/Telnyx key, we configure
  the SIP trunk. Collapses the single most-cited BYO-telephony pain (all 5 competitors still
  make this manual).
- **A2 Phone Number Resell** ⭐ *whitespace (international)* — provision numbers in-product.
  Partnership-gated (F2). The self-serve on-ramp for users without their own carrier.
- **D3 Call Queue** — queue inbound demand instead of rejecting it (needed the moment inbound
  goes live).
- **D4 WhatsApp Voice** — a whole new channel; highest uncertainty (F6, third-party build).

### Stage 4 — CONSUME · drive volume → burn the 300 free minutes
Because the free tier is small (F1), *volume* is the event that leads to revenue. These features
make a deployment actually carry enough traffic to matter.
- **A6 Self-Serve Concurrency Purchase** ⭐ *table-stakes gap* — buy concurrency without sales.
  Directly gates how much traffic a deployment can carry. (5/5 competitors self-serve this.)
- **D1 Call Throttling** — auto-adjust CPS to the trunk; queue + retry instead of dropping. A
  batch campaign that *drops* calls never reaches volume. Makes Consume reliable.
- **D5 Split Inbound/Outbound Concurrency** — independent pools so a batch blast doesn't starve
  inbound (and vice-versa). Protects both revenue streams.
- *Batch Calls / campaigns (existing flagship)* — the outbound engine that burns the free tier
  fastest; the reason Consume exists as a stage.

### Stage 5 — CONVERT · free → paid, and expansion
The 300-min line is crossed; the user decides to keep going and pay.
- **A6 Self-Serve Concurrency** (again) — the *purchase* moment; the literal conversion UI.
- **B3 Connector Marketplace (MCP + Native)** ⭐ — 1-click integrations (HubSpot shipped as the
  first). Each connector deepens investment → raises willingness to pay and switching cost *out*.
- **C9 MLLM Resell** / *MLLM* — premium model tiers to sell up.
- **B5 Couchbase RAG Provider** — a paid retrieval backend for heavier knowledge use.

### Stage 6 — RETAIN · protect the minutes once they flow (reduce churn, enable enterprise)
Post-activation. Reliability and quality keep the traffic (and the revenue) from leaving. Global
API downtime rose ~60% YoY in 2025 — reliability is a *widening* competitive gap, and
competitors already market their uptime number. [Uptrends](https://www.uptrends.com/blog/global-api-downtime-increases-in-2025)
- **Reliability:** **D2 STT/TTS Backup Vendor** (failover), **D6 Alerting** (payment-failure /
  concurrency / LLM-retry / TTS-error spikes), **B4 Engine–Studio Vendor Alignment** (parity SLA).
- **Trust/Safety:** **F Security** (retention controls + PII redaction — table stakes for
  regulated buyers), **F Live Call Monitoring** (listen/whisper/takeover live).
- **Quality→outcomes:** **F Evals/Simulation** ⭐ *table-stakes gap* (test suites, simulated
  callers — 5/5 competitors), **C7 In-Call Sentiment**, **C8 Self-Improving Agent**,
  **C2 Agent Handoff**, **C3 Backchanneling**, **C4 Dynamic Filler Words**, **C5 Background
  Sound**, **C6 Voice Cloning**, **E1 KB Web Crawl**, **E2 KB Chunking & Similarity Tuning**.

### Cross-cutting — PLATFORM enablers (not a stage; they unblock all stages)
- **B1 Stable Public REST API** + **B2 Stable Studio SDK** — the foundation the marketplace,
  import, and programmatic activation all build on. *Engine-owned; the deck's "biggest unlock."*
- **F Physical AI** — exploratory ("voice agents beyond the phone"). Park it; not an activation
  lever this cycle.

**What the reframe reveals:** the deck's biggest category (Conversation Quality, 9) is almost
entirely **Retain**. Valuable, but it does not move activation and should not lead the build.
The activation spine is a handful of **Connect + Consume + Convert** features plus the two LAND
fixes. That spine is Phase 1.

---

## 6. System & dependency view (`/blueprint`)

**The pipeline every feature attaches to.** ConvoAI joins an agent into an Agora RTC channel and
runs one of two pipelines: **Cascade** (ASR → LLM → TTS, separate vendors) or **MLLM** (one
multimodal model). Around it: an **Agent Runtime** (turn-taking, interruptions, memory, tool
orchestration), a **models** layer (14 TTS / 5 ASR / 9 LLM vendors), **Signaling/RTM** for
agent-state events, and **Webhooks** for backend monitoring. Telephony reaches the channel via a
**BYO SIP trunk** (Elastic SIP Trunk). [product-overview](https://docs.agora.io/en/conversational-ai/overview/product-overview)

**Four partner teams gate the roadmap (from the deck's own Sequencing slide):**

| Team | Owns / unlocks | Roadmap items gated on it | Console/Studio design can only… |
|---|---|---|---|
| **Engine** | Public REST API, onboarding defaults, STT/TTS failover, agent handoff, MLLM resell, vendor alignment, WhatsApp voice | B1, B2, B4, D2, C2, C9, D4, A1(defaults) | …surface capabilities once shipped; can't fake them |
| **SIP Manager** | Call throttling (CPS auto-adjust, queue+retry), WhatsApp voice | D1, D4 | …expose throttle/queue state + config UI |
| **Partnership** | Phone-number resell, MLLM resell vendor deals | A2, C9 | …build the buy-a-number UI *after* the carrier deal exists |
| **Console** | Onboarding speed (project creation >30s) | A1 | …own this end-to-end (no external dependency) |

**Strategic implication of the dependency map:** the two items with **no external dependency** —
**A1 (Console-owned onboarding)** and the **Studio-side self-serve concurrency UI (A6)** and the
**correct free-tier meter / spend cap (F1/F9)** — are the ones a solo designer can move *now*.
Everything with an Engine/SIP/Partnership dependency should be **designed in parallel but
sequenced behind a confirmed ship date** from that team, or it becomes vaporware in the UI.

**Failure modes to design for (`/fortify` targets):**
- *Batch campaign dials faster than the trunk allows* → without **D1 Call Throttling**, calls
  drop silently; the user sees a "failed" campaign and churns. Throttling + queue/retry is what
  makes Consume trustworthy.
- *Primary TTS/STT vendor degrades mid-call* → without **D2 backup vendor**, live calls fail;
  enterprise won't scale on a single-vendor pipeline.
- *Postpaid bill-shock* (F9) → without a **spend cap + alert**, a runaway batch produces a
  surprise invoice → churn + refund tickets. This is the counter-metric to "drive volume."
- *Concurrency ceiling hit unexpectedly* (F8) → without a self-serve raise + clear current
  limit, the user hits an invisible wall at the worst moment (their launch).

---

## 7. Prioritization & phasing

Scored on **Activation impact** (which stage, how many users), **Whitespace** (competitive
differentiation), and **Effort/Dependency** (can a solo designer + confirmed team ship it).
Full per-feature scoring is the register in the PRD (§3 there). The phased cut:

### P0 — Phase 1: the activation spine (design now)
The Connect→Consume→Convert transition + the fact-check unblocks. Chosen because they move the
revenue line, several have **no external dependency**, and two close **table-stakes gaps**.
1. **A1 Improve Onboarding** — Console-owned, highest-frequency, no external dep.
2. **A3 Easy ITSP Onboarding** — near-whitespace, unblocks Connect for BYO-telephony users.
3. **A6 Self-Serve Concurrency Purchase** — table-stakes gap; the literal Convert UI; Studio-side.
4. **D1 Call Throttling** — makes Consume (batch) actually complete; needs SIP Manager.
5. **Evals/Simulation (first cut)** — table-stakes gap all 5 competitors closed; defensive.
6. **Free-tier meter correction + spend cap (F1/F9)** — trust + the counter-metric to volume;
   Studio-side, unblocks everything.

### P1 — Phase 2: the acquisition wedges + reliability floor
7. **A4 Import Agents from Competitors** ⭐ — whitespace acquisition; gated on feasibility spike.
8. **A2 Phone Number Resell** ⭐ — whitespace; gated on Partnership carrier deal.
9. **B3 Connector Marketplace** — Convert/expansion; UI over existing MCP.
10. **D2 STT/TTS Backup Vendor** + **D6 Alerting** — the reliability floor for enterprise.
11. **F Security** (retention + PII redaction) — unblocks regulated buyers.
12. **F Live Call Monitoring** — becoming table stakes.

### P2 — Phase 3: quality & depth (post-activation polish)
Conversation Quality cluster (C2–C8), KB enhancements (E1–E2), B5 Couchbase, C9/MLLM Resell,
E3 Text-Only Agents, D5 Split Concurrency, D3 Call Queue, D4 WhatsApp Voice (highest
uncertainty). Sequence by user demand signal (route to `/measure`).

### Deferred / park
**F Physical AI** (exploratory), **A5 Growth Hacking** (an umbrella → `/measure`, not a
buildable feature). **B1/B2 (API/SDK stability)** are Engine-owned platform work — critical, but
not a Studio-design deliverable; track as a dependency, not a design slice.

---

## 8. Personas (human-centric lens)

Reconcile with the canonical personas in `LEARNINGS.md` before locking; these are the
activation-relevant cut:

- **Maya, the solo builder / indie dev.** Signed up to evaluate Agora against Vapi/Retell over a
  weekend. Wants to hear a working agent in minutes and ship one real use case cheaply. **Dies
  at:** onboarding friction (A1), manual SIP (A3), an invisible concurrency wall (A6). **Won
  by:** import from her existing Vapi agent (A4), a number she can buy in 30s (A2).
- **Devan, the agency / SI.** Ships voice agents for 5 clients. Cares about repeatability,
  reliability, and not getting a surprise bill across accounts. **Dies at:** no failover (D2),
  no alerting (D6), bill-shock (F9). **Won by:** evals to prove quality to clients (Evals),
  connector marketplace to wire client CRMs (B3), spend caps.
- **Priya, the enterprise pilot lead.** Running a regulated pilot (healthcare/finance). Needs
  PII redaction, retention controls, live monitoring, and an SLA before scaling minutes. **Dies
  at:** no security controls (F Security), no live monitoring (F), single-vendor fragility (D2).
  **Won by:** the Retain cluster — which is why Retain, though not an activation stage, protects
  the largest deployments.

The reframe in §5 maps cleanly onto these: **Maya is a LAND/CONNECT problem, Devan a
CONSUME/CONVERT problem, Priya a RETAIN problem.** Phase 1 wins Maya; Phase 2 wins Devan; Phase 3
holds Priya.

---

## 9. Information architecture (`/organize`) — where each feature lives

Placed against the **current studio_x_2 IA** (source: `app-sidebar.tsx`, 2026-06-24 agent-centric
rebuild — *this supersedes the older CLAUDE.md sidebar*):

```
BUILD     Agents (/agents — app root + entry point)   ·  Composer (/composer)
OBSERVE   Monitor (/monitor — badge = open critical issues → Diagnostics)
MANAGE    Resources (/integrations — Knowledge · MCP · Connectors · Deployment Channels)
          Realtime Services (/realtime-services)  ·  Project Settings (/project/settings)
```

Agent creation is one **5-step wizard** at `/agents/[id]/edit` (Voice → Type → Prompt →
Configure → Test & Publish); deploy channels are reached *from* the agent (ChannelHero in the
builder), **not** a top-level nav item.

**Placement map (design principle: activation features attach to the surface where the user
already is at that funnel stage — don't make them navigate to find them):**

| Feature | Lives in | Surface / route | New route? |
|---|---|---|---|
| A1 Onboarding | First-run | Signup → `/agents` (Aria journey widget) | extend existing |
| A4 Import from Competitors | BUILD | `/agents` "Create" flow → **Import accelerator** (exists as a stub in the wizard) | extend |
| C1 Agent Handbook | Wizard | `/agents/[id]/edit` → **Voice/Persona** step | extend |
| E3 Text-Only Agents | Wizard | `/agents/[id]/edit` → **Type** step (add "text-only") | extend |
| A3 Easy ITSP Onboarding | CONNECT | Builder **Configure/Deploy** step (ChannelHero) → telephony setup; + **Resources › Deployment Channels** | extend |
| A2 Phone Number Resell | CONNECT | ChannelHero → "Get a number"; number inventory under Deploy | new sub-surface |
| D3 Call Queue / D5 Split Concurrency | CONNECT/CONSUME | Deployment config (inbound/batch settings) | extend |
| A6 Self-Serve Concurrency | CONVERT | **Project Settings** or **Billing** → Concurrency; nudge at the wall in a deployment | new sub-surface |
| D1 Call Throttling | CONSUME | Batch-calls deployment settings + Monitor (throttle state) | extend |
| Free-tier meter + spend cap | CONVERT | Billing + a persistent meter in chrome; cap in Project Settings | extend + new |
| B3 Connector Marketplace | CONVERT | **Resources** (`/integrations`) → Marketplace tab | extend (the big one) |
| B5 Couchbase RAG | Resources | **Resources › Knowledge** (provider picker) | extend |
| D2 Backup Vendor / B4 Vendor Alignment | Retain | **Resources** (vendor config) + Realtime Services | extend |
| D6 Alerting | OBSERVE | **Monitor › Diagnostics** (the critical-issues badge already lives here) | extend |
| F Live Call Monitoring | OBSERVE | **Monitor** → live view (new) | new sub-surface |
| F Evals/Simulation | BUILD/OBSERVE | Builder **Test & Publish** step (author) + **Monitor** (results) | new sub-surface |
| F Security (retention/PII) | MANAGE | **Project Settings › Security** | extend/new |
| C2–C8 Conversation Quality | Wizard | `/agents/[id]/edit` → Voice/Advanced (Playground) | extend |
| E1/E2 KB enhancements | Resources | **Resources › Knowledge** | extend |
| C9/MLLM Resell | Wizard | Voice step → model stack (Playground) | extend |
| D4 WhatsApp Voice | CONNECT | ChannelHero → new channel | new (high uncertainty) |

**IA takeaways:**
1. **Most activation features are wizard/deployment extensions, not new nav.** The agent-centric
   IA means Connect/Consume features attach to the builder's Configure step and the deployment
   surface — respecting "Go Live place gone; reached from the agent."
2. **Resources (`/integrations`) is the natural home for the Marketplace, KB, and vendor work** —
   it's already the shared resource library. The Connector Marketplace is its flagship expansion.
3. **Monitor › Diagnostics is the reliability home.** Alerting, Evals results, and Live
   Monitoring all extend the existing critical-issues loop rather than fragmenting Observe.
4. **Only ~5 features need genuinely new sub-surfaces** (number resell, concurrency purchase,
   live monitoring, evals authoring, WhatsApp). Everything else is additive to existing surfaces —
   which fits the solo-designer constraint.

*(A dedicated `/organize` card-sort/tree-test may be warranted for the Connector Marketplace
specifically — it's the one feature large enough to have its own IA.)*

---

## 10. Metrics (`/measure` tie-in)

Per-stage instrumentation, aligned to the existing taxonomy (`references/event-taxonomy-review.md`,
`references/measurement-framework.md`). North-star events already moved off `agent_published`
onto `deployment_went_live` / `first_minutes_consumed` / `free_tier_exhausted` (§20).

| Stage | Primary metric | Key events | Roadmap features measured |
|---|---|---|---|
| Land | signup→account rate; time-to-project | `project_created` (+ duration), `agent_imported` | A1, A4 |
| Believe | % who talk to Aria; time-to-first-utterance | `aria_conversation_started`, `first_agent_reply` | Concierge, C1, E3 |
| Connect | % reaching a live channel; time-to-live | `deployment_went_live`, `number_provisioned`, `sip_trunk_connected` | A2, A3, D3 |
| Consume | minutes/active deployment; batch completion rate | `first_minutes_consumed`, `batch_completed`, `calls_dropped` (counter) | D1, D5, A6 |
| Convert | free→paid rate; concurrency purchased | `free_tier_exhausted`, `concurrency_purchased`, `first_paid_minute` | A6, B3 |
| Retain | 7-day minute retention; churn | `deployment_active_d7`, `failover_triggered`, `alert_fired` | D2, D6, F* |

**Counter-metrics (guard against dark-pattern "volume at all costs"):** surprise-invoice rate,
refund/dispute tickets, `spend_cap_hit` without warning, dropped-call rate. Volume that produces
bill-shock is churn, not revenue. Validate any "activated" definition with the **2× retention
test** (activated users must retain ≥2× non-activated, or the metric is mis-defined —
[Lenny's](https://www.lennysnewsletter.com/p/what-is-a-good-activation-rate)).

**Benchmarks to aim at:** dev-tool activation median ~25–34%; "good" ≈ 60th percentile; AI/ML
products average ~55% activation. Time-to-value target: single session for the Believe aha; <15
min to a live call (Retell's documented number). [Lenny's](https://www.lennysnewsletter.com/p/what-is-a-good-activation-rate),
[Retell quickstart](https://docs.retellai.com/get-started/quick-start)

---

## 11. Risks, open questions, and what we deliberately deferred

**Top risks.**
- **Dependency risk (highest).** ~20 of 33 items need Engine/SIP/Partnership. Designing UI ahead
  of a confirmed ship date produces vaporware. *Mitigation:* gate each P1/P2 slice behind a
  team-confirmed date; build the no-dependency P0 set first.
- **Fact-check risk.** If F1 (300 min) or F9 (postpaid) is stale, the volume-to-paid thesis
  shifts. *Mitigation:* verify in-app before Phase 1 copy ships.
- **Whitespace-feasibility risk.** A4 (import) assumes competitor agent exports are parseable;
  A2 (numbers) assumes a carrier deal closes. Both are the wedge — if they slip, Phase 2's
  acquisition story weakens. *Mitigation:* run a feasibility spike on A4 and confirm A2's
  Partnership status *before* committing them to a roadmap date.
- **Parity-vs-wedge sequencing risk.** Leading with import/international-numbers while evals and
  self-serve concurrency are still missing pours acquisition into a leaky funnel. *Mitigation:*
  the P0/P1 ordering (parity first, wedge second) is deliberate — hold it.

**Open questions (blockers flagged in §3):** real concurrency/CPS ceiling (F8); true KB depth
(F5); A4 legal/technical feasibility; whether the correct free tier is 300/month or a designed
150+150 nudge (reconcile `project_activation_claim_your_number.md`).

**Deliberately out of scope this cycle:** Physical AI (exploratory); a full CPaaS-wide
reliability rebuild (only the ConvoAI-relevant failover/alerting slice is in); re-litigating the
Agent/Deployment split or the agent-centric IA (locked); anything that restyles the frozen Studio
UI.

---

## 12. Research provenance (for the next session to trust or re-verify)

Three parallel research briefs backed this doc (July 2026). Key sources inline above; the fuller
findings:

- **Agora ground truth** (docs.agora.io sweep): ConvoAI = Cascade/MLLM pipeline; $0.10/min,
  **300 free min/month shared** with STT+Translation; **BYO SIP** (no number sales); MLLM +
  MCP already shipped; native-but-undocumented KB; **no** WhatsApp; **no** live-call listen-in;
  postpaid billing; concurrency ceiling not public. *SPA access via text-proxy — re-verify
  decision-critical numbers in-browser.*
- **Competitor teardown** (Vapi, Retell, Bland, ElevenLabs, Synthflow): table-stakes =
  self-serve numbers, no-card trial, custom tools, MCP, **evals (5/5)**, voice cloning,
  self-serve concurrency; whitespace = **competitor import (0/5)**, **self-serve international
  numbers (0/5)**, prompt-to-agent (1/5 Bland), auto-SIP (1/5 ElevenLabs). Best-in-class
  onboarding ≈ Retell's <15-min signup-to-live-call.
- **PLG activation evidence:** activation = "first live traffic" (Stripe's "first live charge"
  analogue); self-serve CAC ~$702 vs ~$11,400 sales-led (16×); size free tier in product-units
  not dollars; two-stage the card gate; expose spend caps/alerts/projected bill; import tooling
  drove +110% first-week activation at Streak; concierge/AI onboarding lifts completion; treat
  reliability as a growth lever.

Full per-brief text is preserved in this session's transcript and summarized in the PRD's
appendix. Primary Agora citations: `docs.agora.io/en/conversational-ai/{overview/pricing,
overview/product-overview, studio/deploy/sip-trunk, rest-api/agent/join, studio/observe/analytics}`.

---

*Next: the design-ready spec — [`roadmap-features-prd-2026-07-09.md`](roadmap-features-prd-2026-07-09.md)
— carries the full 42-feature register, P0/P1 PRD cards, data-model deltas, acceptance criteria,
and a per-feature "which skill to run next" starter.*
