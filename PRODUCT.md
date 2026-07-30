# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Same audience across the two products being merged; different modes. Sourced from `LEARNINGS.md` §4.

| Persona | Mode | Primary jobs |
|---|---|---|
| **P1 — Integrating Developer** ("the hustler") — *primary* | Task-focused, mid-coding, zero patience for friction | Create a voice AI agent · get App ID / credentials · verify config · debug production |
| **P2 — Product Manager** | Oversight | Billing & subscription status · agents in production · compliance posture |
| **P3 — TAM / Team Lead** | Decision support, low-frequency | Burn rate · renewal posture · overages · account health |
| **P4 — Engineering Manager / Founder** | Infrequent, low IA familiarity | At-a-glance account health · incident context |
| **Legacy — RTE Developer** | First-class but no longer primary | Build video / voice / live-streaming on the Agora SDK |

**P1 is broader than Agora's traditional developer base.** P1 is any hustler who has considered or used LiveKit, ElevenLabs, Retell.ai, or Vapi. The competitive frame is AI-agent platforms, not RTC consoles — which raises the bar on time-to-first-agent well above Agora's historical norm.

## Product Purpose

Studio_X merges Agora's two developer-facing products into one surface:

- **Conv AI Studio** — where developers design, test, and publish voice AI agents.
- **Agora Console** — the operational control plane: projects, credentials, billing, usage, extensions.

The merge is **asymmetric**: Studio is the chassis, Console grafts in as a secondary surface. RTE (voice / video / live streaming / chat / signaling) is preserved but is no longer the center of gravity.

This is a **funnel rescue project that happens to require product consolidation.** Two of the three largest drops in the funnel sit at the Console↔Studio seam:

| Stage transition | Drop |
|---|---|
| Signup → account created | 81.7% (~85,500 lost) |
| Login → agent-creation started | ~93% (686 of ~10,113) — **the seam** |
| Create-Agent opened → published | 77.7% (153 of 686) |

**Product north star (locked 2026-06-17):** Signup → first live deployment carrying traffic → first paid usage. This supersedes the earlier "Signup → First Agent Published" — publishing an agent earns Agora $0; revenue is minutes consumed on a live deployment. The old funnel ended exactly where revenue starts.

**Success for this artifact:** it is a living design reference, not a project with a finish line. It stays the canonical, continuously deployed expression of Studio_X's IA and UX, absorbing roadmap waves as they land. It is not aiming at stakeholder sign-off as an end state, nor at being a frozen engineering handoff spec.

## Positioning

- **One record, two UIs — not two products.** Console and Studio already share one Okta SSO client and cookie, one account → one project → one App ID consumed by every Agora product. Verified by code audit. The seam is **wayfinding**, not authentication or data integration. No competitor can copy this because no competitor is carrying two mature products over one backend.
- **Agora owns both halves of the pipeline** — the real-time transport layer *and* the agent orchestration on top of it. Competitors own one or rent the other. This is the source of the load-bearing whitespace: e.g. correlating the SIP/telephony ladder and the agent pipeline waterfall on a single time axis, which nobody in the category can do.
- **300 free minutes/month** is materially more generous than Retell's $10 credit or ElevenLabs' unspecified tier — and is currently under-leveraged in messaging.

Competitive benchmark set (P1's actual comparison set): ElevenLabs Conversational AI ("5 min" to first agent), LiveKit Agents ("<10 min"), Retell AI ("go live in minutes"), Vapi ("try in minutes, deploy in days").

## Operating Context

- **Where the work happens:** the developer is mid-integration, usually with an IDE and docs open, often on a deadline. Studio_X is a task tool they pass through, not a place they stay.
- **The lifecycle the product must serve:** Land → Believe → Connect → Consume → Convert. A default agent (Aria) is auto-provisioned and live on signup; first-run is *talk to it, then put it to work* (believe-then-scale), with campaign as the flagship channel. There is deliberately no build-an-agent-first wall.
- **Agent vs. Deployment (2026-06-11 architecture):** an **Agent** is a reusable Stack + Persona (no prompt, no vars); a **Deployment** carries the full prompt, custom code, and CSV-derived dynamic variables. One agent ↔ one channel; multichannel orchestration was dropped.
- **Deploy is intent-first:** Inbound · Batch Calls · Phone Numbers · Code.
- **Vendor reality:** LLM / TTS / ASR are per-component **managed or BYO** (`credential_mode` is per asr/llm/tts, never global). Managed *includes* vendor usage, making managed cheaper than BYO — the inverse of every competitor's pricing model. Telephony is BYO SIP.
- **External dependencies:** Okta · Stripe (or equivalent) · LLM providers · TTS/ASR vendors · email/notifications · global RTC edge.

## Capabilities and Constraints

**Standing constraints — do not break:**

1. **Studio UI is frozen.** 9+ months of production work behind it. Every intervention is **additive only** — net-new surfaces consuming existing backend data. Don't restyle, remove, or rename existing Studio flows.
2. **Mock data only. No backend, ever.** This is an IA + UX artifact. Every screen runs on fixtures.
3. **Solo designer / small team.** Every deliverable must be scoped for one person to ship.
4. **Regulated:** HIPAA · GDPR · SOC 2 · EU AI Act trajectory. Applies at every stage, not just at the end.
5. **Time-on-page, session length, and DAU-without-task-completion are rejected as KPIs.** Utility-first: success is the user accomplishing the goal and leaving.
6. **Cite `docs.agora.io/en/` for any Agora-primitive design call.** Training data on Agora APIs is likely outdated.
7. **Design tokens only** — no hardcoded colors, no arbitrary `text-[Npx]`. `buoy drift check` validates.

**What ships next is decided by the Q3 roadmap; how it's designed is decided by LEARNINGS.md.** The official Convo AI Q3 roadmap (111 ClickUp tasks → 7 epics → 4 waves) sets sequence and scope. LEARNINGS.md's constraints, personas, voice, and anti-decisions govern execution. Where the two conflict on *what*, the roadmap wins; where they conflict on *how*, LEARNINGS wins.

**Verified terminology (do not re-litigate):**

- **Monitor**, never "Analytics" — Agora Analytics is a separate product.
- **Live activity**, never "Telemetry."
- **Real-Time**, never "Console," as the mode toggle label.
- **Vendor Credentials** — bare "Credentials" is rejected; the word has three distinct meanings in this product and must always be scoped.
- **Sessions** = agent conversation runs. **Chat History** = text-channel agent conversations. **RTE** = per-minute usage, not sessions.
- Builder section labels (locked 2026-07-30): **Voice & Models · Deployment · Prompt & knowledge · Test · Go Live.** Never reintroduce "Channel" or "Context."

**Explicitly undecided — record, don't invent:**

- Entitlements model — plan / org / role / trial gating.
- Which regulated verticals and jurisdictions specifically.
- Rollout timeline — phased vs. single cutover.
- AI disclosure default — opt-in recommended, not confirmed.
- Whether the Conversational AI Engine supports agent states beyond Draft / Live (blocks staged rollout).
- Current cost-cap / circuit-breaker architecture (no cost-cap API field discovered).
- Whether Agora Analytics exposes a programmatic API or only an embedded-credentials product.

## Brand Commitments

**Voice attributes:** Honest · Direct · Calm · Confident.

**Voice principles:**

1. **Specific over vague** — name the thing, the dollar amount, the time penalty.
2. **Present-tense, active** — "This pauses the agent," not "The agent will be paused."
3. **Honest** — bad news told straight. No softening adverbs (*just, simply, unfortunately*), no corporate hedging (*there appears to be an issue*).
4. **No fake urgency, no fake friendliness.** No emoji in error messages. No "Oops!"

**Error pattern:** recovery in the same line as the failure, naming the vendor and its dashboard. *"OpenAI rejected this key. Verify it's still active in your OpenAI dashboard."*

**Ethical stance:** utility-first, no engagement optimization that conflicts with user goals. Highest-risk anti-patterns for this product, all rejected: Hidden Costs (usage-based pricing invites deferred cost disclosure), Forced Continuity, Prechecked Consent, Inaccessible Unsubscribe, Undisclosed AI Decisions, Simulated Understanding (agents appearing more competent than they are causes downstream harm), Permission Harassment, Notification Spam, Confirmshaming, Missing Feedback, Destructive Defaults, Broken Error Recovery.

Studio_X's users build for end-users who may include vulnerable populations — disclosure, consent, and moderation affordances must be surfaced so users can treat *their* users ethically.

## Evidence on Hand

- **`LEARNINGS.md`** — funnel data, personas, hypothesis stack, competitive benchmark, service blueprint, decision log. Paid for in research; don't re-derive.
- **`references/prd-q3-roadmap-execution-2026-07-29.html`** + `TODO-Q3-ROADMAP.md` — the official Q3 roadmap mapped to epics and waves.
- **`references/ia-mapping.md`** — Console → Studio 56/56 URL coverage. **`references/sitemap.md`** — original Console structure. **`references/realtime-services-blueprint.md`** — 13-service Real-Time map.
- **`references/ia-revamp-agent-vs-deployment.md`** — the Agent/Deployment split blueprint.
- **`screenshots/`** and **`references/console_map/`** — reference captures of the real products.
- **`studio_x_2/`** — the live app, deployed at https://ai-studio-console-redesign.vercel.app. `studio-x/` is the previous app (reference only); `wireframes/app.html` is the superseded origin.
- **Simulated user-testing transcripts** — three developer personas, run per shipped commit (`references/user-testing-protocol.md`).

**Absences future work must not fabricate:** there are no real customers, testimonials, case studies, benchmarks, or press for Studio_X — it is an unreleased internal redesign. There is no live backend and no real usage data beyond the funnel table above. Agora does not currently sell or port phone numbers (telephony is BYO SIP), and there is no published concurrency or CPS ceiling.

## Product Principles

1. **Get out of the way.** This is a task tool, not an engagement product. The user's win is finishing and leaving.
2. **Credentials are sacred.** App IDs, keys, and tokens must be findable, masked, copyable, and never ambiguous about which of the three kinds of "credential" is meant.
3. **Surface problems before they become crises.** Billing thresholds, expiries, and failures appear early and in context — not in a place the user has to think to visit.
4. **Density over decoration.** Information density is a feature for this audience. Whitespace that costs a developer a scroll is a tax.
5. **No visible seams.** Handoffs between building an agent and managing the project, billing, or credentials must read as one product.
6. **Revenue is minutes, not milestones.** Every surface is judged on whether it moves the user toward live traffic — not toward a completed form.

## Accessibility & Inclusion

**Target: WCAG 2.2 AA.** Chosen as the enterprise/regulated-SaaS baseline and the EAA-aligned bar, consistent with the product's SOC 2 / GDPR / EU AI Act posture.

Known gaps to close rather than defend:

- Chart SVGs currently lack `aria-label`s and accessible text alternatives.
- Mobile, RTL, and voice-control support were explicitly deferred in the resilience pass and remain unaddressed.
- Focus appearance and dragging alternatives (2.2-specific criteria) have not been audited.

Conformance has not been formally tested or certified — do not claim it.
