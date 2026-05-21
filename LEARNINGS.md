# Studio_X — Portable Learnings

A self-contained brief carrying the load-bearing decisions, hypotheses, and constraints from the Studio_X design project into the next repo. Drop this into a new GitHub project as `CLAUDE.md`, `LEARNINGS.md`, or the project's onboarding doc.

> **Read this before any non-trivial design or implementation work.** Everything below was paid for in research, audits, stakeholder reviews, or competitor benchmarking. Don't re-litigate without new evidence.

---

## 1. The product in one paragraph

Studio_X merges Agora's two developer-facing products — **Studio** (where developers design and publish voice AI agents) and **Console** (the operational control plane: projects, credentials, billing, usage, extensions) — into one unified surface. The merge is **asymmetric**: Studio is the chassis; Console grafts in as a secondary surface. RTE (Real-Time Engagement — video / voice calling, live streaming) remains supported, but the center of gravity has moved to voice AI agents.

This is not a UX consolidation project. It is a **funnel rescue project** that happens to require product consolidation.

---

## 2. The brief — funnel data

| Stage transition | Drop | Where it lives |
|---|---|---|
| Signup → account created | **81.7%** (~85,500 lost) | Console (provisioning) |
| Login → agent-creation started | **~93%** (only 686 of ~10,113) | **Console ↔ Studio seam** |
| Create-Agent opened → published | **77.7%** (153 of 686) | Studio-internal |

**Two of the three biggest leaks sit at the seam between the two products.** That seam *is* the redesign target. North-star metric: **Signup → First Agent Published.** If 10% of the seam leak is recovered, that's ~8,500 more activated accounts per cohort — the business case.

---

## 3. Standing constraints (do not break)

1. **Studio UI is frozen.** 9+ months of production work. All interventions are **additive only** — net-new surfaces that consume existing backend data. Don't restyle, remove, or rename existing flows.
2. **Console and Studio share one backend.** One account → one project → one App ID → consumed by every Agora product. Verified by code audit and Agora docs. **Don't design integration for a "seam" that is, in fact, one record displayed in two UIs.**
3. **Solo designer / small team.** Every deliverable must be scoped for one person to ship.
4. **Regulated.** HIPAA · GDPR · SOC 2 · EU AI Act trajectory. Applies at every stage.
5. **Time-on-page is NOT a KPI.** Utility-first. Success = user accomplished their goal and left.
6. **Consult [docs.agora.io](https://docs.agora.io/en/) first** for any technical decision and cite the URL. Training data on Agora APIs is likely outdated.

---

## 4. Users

Same audience across both products. Different modes.

| Persona | Mode | Primary jobs |
|---|---|---|
| **P1 — Integrating Developer** ("the hustler") — *primary* | Task-focused, mid-coding, zero patience for friction | Create voice AI agent · get App ID / credentials · verify config · debug production |
| **P2 — Product Manager** | Oversight | Billing & subscription status · agents in production · compliance posture |
| **P3 — TAM / Team Lead** | Decision support, low-frequency | Burn rate · renewal posture · overages · account health |
| **P4 — Engineering Manager / Founder** | Infrequent, low IA familiarity | At-a-glance account health · incident context |
| **Legacy — RTE Developer** | First-class but no longer primary | Build video / voice / live-streaming with Agora SDK |

**Critical:** P1 is broader than Agora's traditional developer base. P1 is **"any hustler"** who has considered or used LiveKit, ElevenLabs, or Retell.ai. Studio_X's competitive frame is AI-agent platforms, not RTC consoles. This raises the bar on time-to-first-agent.

---

## 5. Design principles

### Intent core (apply globally)
1. Respect user autonomy
2. Design for real conditions
3. Make intent visible
4. Evidence over intuition
5. Systems over screens
6. Ethical defaults

### Project-specific (apply on top)
1. **Get out of the way** — task tool, not engagement product
2. **Credentials are sacred** — App IDs, keys, tokens findable, masked, copyable
3. **Surface problems before they become crises** — billing, expiry, thresholds visible early
4. **Density over decoration** — info density is a feature for this audience
5. **Agents first, RTE accessible** — Studio's shape wins; Console grafts in
6. **No visible seams** — handoffs between agent-building and project/billing must feel like one product

---

## 6. Ethical stance

- Utility-first; no engagement optimization that conflicts with user goals
- Time-on-page, session length, and DAU-without-task-completion are **rejected as KPIs**
- AI disclosure: recommend opt-in default (EU AI Act trajectory makes this required ground)
- Studio_X's users build for end-users who may include vulnerable populations — surface disclosure / consent / moderation affordances so users can treat *their* users ethically
- All Intent anti-pattern categories are rejected; watchlist below

### Anti-pattern watchlist (highest risk in this product)
| Pattern | Why risky here |
|---|---|
| Hidden Costs | Usage-based pricing + AI costs = temptation to defer cost disclosure |
| Forced Continuity | Paid subscription product — renewal must be honest |
| Prechecked Consent | GDPR direct conflict |
| Inaccessible Unsubscribe | SOC 2 + GDPR + CA click-to-cancel — symmetry required |
| Undisclosed AI Decisions | Studio is the AI surface — disclosure is load-bearing |
| Simulated Understanding | Agents appearing more competent than they are causes downstream harm |
| Permission Harassment | Mic / camera prompts in agent testing |
| Notification Spam | Agent-activity alerts can feel surveillance-y |
| Confirmshaming | Plan-downgrade and cancellation flows |
| Missing Feedback | Credential copy, token rotation, deploy actions |
| Destructive Defaults | Project deletion, credential revocation, publish |
| Broken Error Recovery | "Account suspended" with no explanation = worst case |

---

## 7. Hypothesis stack (the strategic frame)

The work reframed from "funnel rescue" to **lifecycle growth.** Five hypotheses, sequenced:

| # | Stage | One-liner | Status |
|---|---|---|---|
| **H1 v3** | Activation | Surface App ID / App Cert / tokens inline in Studio (one-record display, not integration) + confidence scaffolding (staged rollout, rollback, first-failure observability, cost cap). **Target: published-and-kept-7-days ≥ 60%.** | Primary; design started |
| **H2** | Onboarding | Console-internal signup redesign. Collapse four sequential decisions to one mandatory + reversible defaults. | Parallel track |
| **H3** | Engagement | First-time-returner behavior predicts 30-day retention. Studio renders post-publish telemetry the user owns. | Deferred until H1/H2 baseline |
| **H4** | Expansion | Shared project means RTE attach is *feature discovery*, not new signup. Project-overview surfaces all children. **Target: 10–15% RTE-attach within 60d.** | Deferred |
| **H5** | Retention | Bill-shock is the #1 churn driver in usage-SaaS. Studio shell shows billing health continuously. | Deferred |

H1 v3's key insight: **credentials are a one-record UI framing problem, not a cross-product integration problem.** Studio and Console already share auth (same Okta cookie at `staging-sso.agora.io`) and the same project record — switching between Agents and Real-Time requires zero re-authentication.

---

## 8. Competitive landscape (the real benchmark)

P1 compares Agora to these, not to other RTC consoles:

| Competitor | Time-to-first-agent claim | Notable convention |
|---|---|---|
| **ElevenLabs Conversational AI** | "5 min" · "5M+ agents launched" | Uses **Workspace** (outlier), **Operate**, **Service Accounts and API Keys**. Has **Branches** (git-style agent versioning) — white-space concept worth borrowing. |
| **LiveKit Agents** | "<10 min" · Agent Builder no-code | Uses **project** identically · **observability** (engineering-shaped) |
| **Retell AI** | "Go live in minutes" · $10 credits + 20 free concurrent calls | Uses **Monitor** as top-level — closest to hustler P1's mental model |
| **Vapi** | "Try in minutes. Deploy in days" · 300M+ calls · 2.5M+ assistants | Pre-production simulation + A/B on prompts/voices |

Agora's **300 free minutes/month** is materially more generous than Retell's $10 / ElevenLabs unspecified tier — currently under-leveraged in messaging.

### Label decisions driven by this research
- `Observe → Monitor` (Retell convention; closest to P1 mental model)
- `Telemetry → Live activity` (no competitor uses "telemetry" user-facing)
- Keep `Project` (LiveKit + Studio canon — two of three signals agree)
- Keep `Publish` button (Studio-frozen) but new staged CTA reads `Preview` (matches Vercel "Preview deployments")
- Toggle label `[Agents | Real-Time]` (not `Console`) — matches Agora RTE family + ElevenLabs "Conversational" framing + Twilio "Real-Time"

---

## 9. The "credentials" disambiguation (load-bearing)

The word *credentials* means **three different things** across the surface area. Conflating them is the #1 source of nav confusion.

| Meaning | Where it lives | New label |
|---|---|---|
| (1) Analytics-embedded auth | Console `/credentials` page | **Analytics credentials** |
| (2) Agora platform identity (App ID, App Cert, tokens) | One per project; surfaced as Console dashboard cards + new Studio `Project > Project credentials` | **Project credentials** |
| (3) Vendor API keys (OpenAI, ElevenLabs, Deepgram…) | Studio `Build > Integration > Credentials` tab — per-project profiles agent configs reference | Studio-frozen; relabel impossible. Add disambiguating microcopy and cross-routing footers. |

**Rule:** new surfaces must name which credential. Never use bare "Credentials" in a nav item, page H1, or empty state without a scope qualifier.

---

## 10. IA at a glance — Unified Console + Studio (locked 2026-05-21)

> **Revised 2026-05-21 v2** — full Console + Studio merge after inventorying 18 production Console screenshots. 48 distinct destinations consolidated into 6 top-level sidebar groups + structured account dropdown. **"Build Agents ↗" external link to Studio is deleted; Agents are now a first-class nav item.**

### Critical IA decisions
1. **Console is the chassis** (in this merge direction) — Studio's surfaces fold in as peer nav items, not as a section. User never leaves Console.
2. **Workspace + Project tenant model** locked. Workspace = rare switch (profile). Project = common switch (top of sidebar).
3. **No "Settings" top-level item** — split into specific destinations under profile.
4. **Real-Time products** sit as peers of Agents in BUILD — not as a separate Console-mode toggle.
5. **Extensions Marketplace** lives in DISCOVER. Toggling enabled/disabled per-project lives in Project settings (polyhierarchy by design).

### Sidebar
```
[workspace chip ▾]        (opens account dropdown to Workspaces section)
[Project switcher ▾]      (top of sidebar — Decision #6)

HOME                      workspace-level overview

BUILD
  Agents                  Studio merged in — list, builder, test, deploy
  Real-Time products      Video · Voice · ILS · Chat · Signaling · Whiteboard
  Integrations            Twilio · Salesforce · Zapier · HubSpot connectors

DEPLOY
  Phone Numbers
  Web SDK
  Campaign
  ··· more                SIP · WhatsApp · Mobile SDKs · Embedded

MONITOR
  Analytics               per-agent + per-RTE-app
  Call History
  Session History
  Usage                   per-project minutes with filters
  Agora Analytics ↗       external advanced product

DISCOVER
  Extensions Marketplace  Cloud Recording, Media Push, ActiveFence, DeepAR, ...
  Templates               pre-built agents
  Docs ↗
  Community ↗

PROJECT
  Project settings        App ID, App Cert, temp token, service toggles
  Vendor Credentials      LLM/TTS/ASR keys
  Notifications           project-level service config
```

### Sidebar footer (4 peer items)
Avatar (opens account menu) · Bell (in-product notification feed) · Credits meter (free-tier visibility, ambient) · ⌘K

### Account dropdown
```
[email · role]
WORKSPACES   ✓ current · alternatives · + Create
ACCOUNT      Account Overview · Billing & Subscriptions · Teams & Members ·
             SSO Management · Notification Preferences · Profile
DEVELOPER    RESTful API · Webhooks · Audit logs · Developer Toolkit
HELP         Docs ↗ · Community ↗ · Contact Sales · Support tickets ·
             System status ↗ · What's new
Sign out
```

### Label changes from old Console + Studio
| Was | Now |
|---|---|
| `Settings` (top-level) | split — specific destinations under profile |
| `Build Agents ↗` external | `Agents` in BUILD |
| `Subscriptions` separate | merged into `Billing & Subscriptions` |
| `Real-Time Services` (prior wireframe) | `Real-Time products` (RTC family) |
| `Conversational AI` | `Agents` (LiveKit/Retell convention) |
| `More from agora` section | replaced by `DISCOVER` group |
| `Developer Toolkit` in sidebar | profile → Developer |
| `Build Agents ↗` promo card | deleted (feature, not banner) |
| Bare `Credentials` | `Vendor Credentials` (project) or `RESTful API` (account) |
| `Project Overview` (prior wireframe) | `Project settings` (avoids Home/Overview dup) |

### Anti-decisions (added 2026-05-21 v2)
- ❌ External `Build Agents ↗` link to Studio (the Console/Studio seam)
- ❌ "Conversational AI Agents are here!" promo card (it's a feature, not a banner)
- ❌ "More from agora" section header (marketing label, not nav)
- ❌ `Settings` as a top-level item (too vague — must be specific)
- ❌ "Subscriptions" separate from "Billing" (one destination for money)
- ❌ Developer Toolkit in main sidebar (account-level, belongs in profile)

### Open questions added 2026-05-21 v2
- **B13** — Webhooks project-scoped or account-only? (Currently account.)
- **B14** — Notification Preferences per-project or only account-level?
- **B15** — User-creatable agent templates, or only Agora-supplied?
- **B16** — Real-Time products: one listing screen, or 6 dedicated children (Video/Voice/ILS/Chat/Signaling/Whiteboard)?

---

## 10b. Prior IA notes (pre-merge, retained for context)

> **Revised 2026-05-21** — moved from "L0 product toggle" pattern to grouped sidebar after testing. Tenant model also clarified: workspace + project are two distinct levels.

### Sidebar shell
- **Top of sidebar — tenant context, top-down:**
  1. Agora logo + collapse icon
  2. Workspace chip (rare switch; opens workspace switcher in profile if clicked, but ambient label here)
  3. **Project switcher** (Decision #6: top of workspace, not in profile) — `Project Alpha ▾`
- **Group headers, ordered:** `BUILD` → `DEPLOY` → `MONITOR` → `PROJECT`. (Dropped the prior `Build → Deploy → Monitor → Phone Numbers → Project credentials → Billing & Usage` flat order in favor of grouped headers + Phone Numbers nested under DEPLOY.)
- **Items per group (final):**
  - **Home** (workspace-level overview — above all groups)
  - **BUILD** — Agents · Integrations
  - **DEPLOY** — Phone Numbers · Campaign · Web SDK · …more
  - **MONITOR** — Analytics · Call History · Session History
  - **PROJECT** — Project settings · Real-Time Services · Vendor Credentials · Usage
  - **(promoted)** — Extensions Marketplace (top-level, between MONITOR and PROJECT or above BUILD)
- **Footer = three peer-weighted icon buttons** — avatar (initials, opens account menu) · credits meter (circular % or progress bar, free-tier visibility on every screen) · ⌘K.
- **Dropped:** `[Agents | Real-Time]` L0 toggle. Real-Time is now a project-nav item (`Real-Time Services`), not a product-toggle peer of Agents.

### Tenant model
- **Workspace** = identity-adjacent tenant (GitHub-org-like). Switching is rare. Lives **inside profile dropdown** under a "Workspaces" group.
- **Project** = work-context tenant (GitHub-repo-like). Switching is common. Lives **at top of sidebar**.
- Internal type IDs stay `'agents' | 'console'` for code stability; only user-facing labels changed.

### Profile dropdown (behind avatar) — locked structure
1. Email · role header (non-interactive)
2. **Workspaces** — current + alternatives + Create workspace
3. **Account** — Account Overview · Billing & Plans · Team & SSO · Preferences
4. **Developer** — RESTful API · Webhooks · Audit logs · Documentation ↗
5. **Help** — Help & Support · System status ↗ · What's new
6. Log out

### Anti-decisions (added 2026-05-21)
- ❌ Credits meter buried in profile dropdown — it must be ambient in sidebar footer
- ❌ "Settings" as a bare profile-menu label — rename to "Preferences" and split workspace-level config out
- ❌ "View all plans" + "Billing" as separate items — merge into "Billing & Plans"
- ❌ Bare "Credentials" in nav — must be scoped (`Vendor Credentials` in project nav; Agora project keys live in `Project settings`)
- ❌ Extensions Marketplace buried in profile — promoted to top-level nav (discovery surface)
- ❌ Notifications-only as a profile-menu link — needs a global 🔔 bell in the top bar when notifications exist

### Home page (workspace-level overview)

**North star (strategize, 2026-05-21):**
- Returning user: time-to-resume-work ≤ 2 clicks from sign-in
- First-time user: time-to-first-test-call ≤ 90 seconds
- Hypothesis tested: H3 — first-time-returner behavior predicts 30-day retention

**Page modes (structurally distinct, not conditional blocks):**
1. **First-run** — 0 agents → "Try a pre-built agent" hero (full-page)
2. **Returning default** — stack of 7 blocks below
3. **Billing suspended** — recovery card replaces page; nothing else renders

**Content blocks for returning default, priority-ordered:**
1. **Resume work** — most recent agent edited, one-click reopen
2. **Health alerts** (only when present) — failed agent, invalid vendor key, billing-in-trouble, cost cap hit. Never render an empty "no alerts ✓" trophy.
3. **Live agent activity** (last 24h: calls, errors, p95 latency)
4. **Projects grid** — cards per project, click to enter. Cap at 6 + "View all"
5. **Quick actions** — New agent · Import · Try a pre-built
6. **Workspace usage roll-up** (across projects, current period)
7. **What's new** (compact, dismissible per-user)

Explicitly **not** on Home: marketing hero copy, engagement-bait widgets, cross-promotion to RTE, dense analytics charts, "you haven't deployed in N days" guilt prompts, modal overlays on first load.

**Blueprint (2026-05-21):**
- Home touches all three gateways from §12 (`axiosStudio` + `axiosInstance` + analytics) — most data-fan-out page in the product
- Per-block failure isolation is mandatory (no cascade)
- Caching: health alerts no-cache (must be fresh), live activity 5min SWR, usage 1min, projects per-workspace cache, static + quick-start always available
- Blocked on engineering questions B2 (analytics programmatic API) and B7 (cost-cap event bus); new B12 (workspace usage roll-up aggregation)

**Fortify edge cases (12, priority-tagged P0–P3):**
- P0: per-block failure isolation; billing-suspended takeover; first-run works without backend; SSR shell
- P1: workspace switch full re-fetch (no stale flash); 24h activity local-cached; bill-shock alerts pre-emptive at ≥80% cap; empty alerts block collapses
- P2: per-block retry; Resume Work localStorage hint; What's New dismissible & remembered
- P3: A/B test What's New presence; click-instrument every block to validate priority

---

## 11. Voice & content

### Four voice attributes
Honest · Direct · Calm · Confident.

### Four voice principles
1. **Specific over vague** — name the thing, the dollar amount, the time penalty.
2. **Present-tense, active** — *"This pauses the agent,"* not *"The agent will be paused."*
3. **Honest** — bad news told straight. No softening adverbs (*just, simply, unfortunately*). No corporate hedging (*there appears to be an issue*).
4. **No fake urgency, no fake friendliness.** No emoji in error messages. No "Oops!"

### Error pattern
Recovery in the same line as the failure. Name the vendor and the dashboard URL pattern.
> *"OpenAI rejected this key. Verify it's still active in your OpenAI dashboard."*

### Notification spam defense
First-failure email rate-limited to one per error class per 24h. Suppressed-alert acknowledgment in-app on return.

---

## 12. Service blueprint — verified architecture

From a code-grounded audit (not assumed):

- **Auth:** Studio and Console share the same Okta SSO client + cookie. The seam is **wayfinding**, not auth.
- **Project record:** verified same entity in both products. Returns `id`, `name`, `key`, `signkey`, `projectType`, `stage`, `status`.
- **Three-gateway API topology:** Console uses `axiosInstance` (`/projects`, billing); Studio uses `axiosStudio` (deployed agents); a third gateway handles auth/`/userInfo`.
- **15 extension services** are enumerated from Console's `extensionInitialState`: ConvoaiGlobal, Whiteboard, CloudRecording, CloudPlayer, MediaPush, Signaling, AgoraChat, RealTimeSTT, etc. License Manager API gates entitlements.
- **Agent lifecycle:** 4-state client / 2-state deploy. (Open question B1 — whether the engine supports states beyond Draft/Live.)
- **Billing health:** `GET /finance/cashInfo` returns `financialStatus: 0|1|2` via polled read. No event bus on threshold breaches today (open question B7 — no cost-cap API field discovered).
- **External dependencies:** Okta · Stripe (or equivalent) · LLM providers (OpenAI, Anthropic) · TTS / ASR vendors · email/notifications · global RTC edge.

---

## 13. Key flow interventions

### Adoption → Activation (the ~93% Stage-2 leak)
**Surface F — try-before-build.** Pre-built agents landing page. Sticky Test panel + orb + Start Call. Templates-first Create Agent modal. Hustler P1's mental model is *"let me hear an Agora agent"* — competitors all expose working demos at zero friction. Studio currently asks for full agent config before producing any audible output.

### Evaluation cliff — 10 concepts ideated (E-1..E-5)
Test environment hardening, sample-agent gallery, fork-from path, in-browser dial-in demo, vendor-config import (paste your Retell/Vapi/LiveKit config and Studio maps fields).

### Publish cliff — 10 concepts ideated (P-1..P-5)
Staged rollout (self → team → % traffic → all), one-click rollback, first-failure observability, cost-bounded pilot tier, branch-style version preview.

### Returning-user pattern
"Your agents" section above "Pre-built by Agora" — preserve user work above marketing surface. Suppress section header (don't show empty list) when no agents exist yet.

---

## 14. Edge cases & resilience baseline

State inventory across 5 surfaces. **12 top edge cases** with UI flows specified:
- Network drop · token-gen timeout · two-tab concurrency · analytics-down degraded mode · cost cap hit · signed-out preview URL · session expire · browser-back · email bounce · billing all-critical-at-once · overflow ×2

**4 first-run patterns. 18 resilience recs prioritized P0–P3.** Every edge-case surface is **additive** — Studio-frozen survives. Mobile / RTL / voice-control deferred.

---

## 15. Open questions to carry forward

### Engineering / API (block design lock)
| # | Question | Blocks |
|---|---|---|
| B1 | Does Conversational AI Engine support agent states beyond Draft / Live? | H1 v3 staged rollout |
| B2 | Does Agora Analytics expose a programmatic API, or only embedded-credentials product? | H3 telemetry surface |
| B5 | Who owns post-login routing logic? | H2 signup redesign |
| B6 | Enterprise tier with support-ticket cancellation? (Dark-pattern audit) | Ethics compliance |
| B7 | Current cost-cap / circuit-breaker architecture? | H5 + ethics |
| B8–B11 | Discovered in 2026-05-04 code audit — see prior case study §2.14 | Various |

### IA (need stakeholder/user input)
- IA-7..IA-10: polyhierarchy boundaries, mode-switch auto-redirect logic
- CW-1..CW-7: copy-lock pending (incl. CW-7 Studio-frozen relax for in-tab copy)
- SP-1..SP-6: server-contract questions from spec phase

### Project-level
- Entitlements model — plan / org / role / trial gating
- Which regulated verticals / jurisdictions specifically
- Timeline — phased rollout vs. single cutover
- AI disclosure — opt-in default or user-toggleable (recommend opt-in)

---

## 16. Anti-decisions (things explicitly rejected)

- ❌ A balanced merge of Studio + Console (it's asymmetric — Studio is chassis)
- ❌ Renaming the existing Studio `Publish` button (Studio-frozen)
- ❌ Time-on-page or session-length as success metrics
- ❌ Engagement optimization at expense of task completion
- ❌ "Telemetry" as a user-facing label (rename to `Live activity`)
- ❌ "Observe" as a user-facing section header (rename to `Monitor`)
- ❌ "Console" as the toggle label (use `Real-Time`)
- ❌ Bare "Credentials" as a nav item (three meanings — must scope)
- ❌ Cross-product integration mental model for credentials (it's a one-record UI framing problem)
- ❌ Generative interviews as MVI Priority 1 (heuristic eval + project-primitive audit go first — products already exist)

---

## 17. Success metrics

### North star
- **Signup → First Agent Published** conversion rate (end-to-end across the three leaks)

### Per-stage funnel recovery
- Signup → Account activated (Leak 1)
- Login → Create-Agent opened (Leak 2 — the seam)
- Create-Agent opened → Published (Leak 3)

### Task-level quality
- Time-to-App-ID
- Time-to-first-published-agent (headline competitive metric)
- Billing-section interaction without confusion (rage clicks, dead ends, tickets)
- Subscription status visibility rate
- Project configuration health visibility

### Activation quality (added in lifecycle reframe)
- Published-and-kept-7-days (the H1 v3 north-star)
- RTE-attach within 60d (H4)
- 90-day active-project rate (H5)
- Bill-shock churn rate (H5 counter-metric)

### Rejected as KPIs
- Time-on-page · session length · DAU without task-completion qualifier

---

## 18. Agora documentation index (cite the URL)

Primary reference: **https://docs.agora.io/en/**

### Most relevant
| Topic | URL |
|---|---|
| Conversational AI Engine (Studio's core) | https://docs.agora.io/en/conversational-ai/overview/product-overview |
| Conversational AI — Quickstart | https://docs.agora.io/en/conversational-ai/get-started/quickstart |
| Conversational AI — Pricing | https://docs.agora.io/en/conversational-ai/overview/pricing |
| Conversational AI — REST API (agent join) | https://docs.agora.io/en/conversational-ai/rest-api/agent/join |
| Convo AI Device Kit R1 | https://docs.agora.io/en/convo-ai-device-kit/overview/product-overview |
| OpenAI Realtime integration | https://docs.agora.io/en/open-ai-integration/overview/product-overview |

### RTE family
Video Calling · Voice Calling · Interactive Live Streaming · Broadcast Streaming · Chat · Signaling · Whiteboard · IoT SDK · Cloud Recording · Analytics · Real-Time STT — all under https://docs.agora.io/en/<product>/overview/product-overview.

**Auth / App ID / token workflow** typically lives under each product's *Develop → Authentication* section.

---

## 19. Stack notes

### Studio (the chassis — preserved as-is)
Next.js App Router · pnpm · i18n (`messages/`) · Playwright e2e · `instrumentation.ts`.

### Console
- **In repo:** Next.js Pages Router · yarn · `mock-db` · Okta · License Manager API.
- **Described as redesign target:** React + Vite + TanStack Router + shadcn + Tailwind + MSW.
- ⚠ Discrepancy unresolved — resolve before structural work.

### Prototype that was actually built
`studio-x-prototype/` — **TanStack Start + Vite + bun** (not Next.js). `@agora/*` registry components deferred pending bypass token; prototype substituted shadcn primitives in same visual envelope. 8 MVP surfaces functional. React-best-practices review pass clean.

---

## 20. Decision log highlights (chronological)

| Date | Decision |
|---|---|
| 2026-04-23 | `/strategize` framed funnel rescue; H1 defined |
| 2026-04-23 | `/philosopher` reframed H1 to v2 — *"speed is a consequence of confidence, not the goal"* |
| 2026-04-23 | Competitive landscape mapped — ElevenLabs (5 min), LiveKit (<10 min), Retell ("minutes"), Vapi |
| 2026-04-24 | Lifecycle growth reframe — H1 v3 simplified; H3–H5 added |
| 2026-04-24 | Service blueprint via `/blueprint` — actors, dependencies, ownership voids, B1–B7 opened |
| 2026-04-24 | Project primitive resolved — same entity, different surface framing |
| 2026-04-25 | IA round 3 — sidebar collapsed to `[Agents | Real-Time]` toggle |
| 2026-04-25 | Section header `Observe → Monitor`; item `Telemetry → Live activity` (competitor-validated) |
| 2026-04-25 | Credentials disambiguated into three meanings — leaf renamed "Project credentials" |
| 2026-04-25 | Voice & content locked — 4 attributes, 4 principles, 14 key screens copy-locked |
| 2026-04-25 | Edge cases / resilience — 12 flows, 18 P0–P3 recs |
| 2026-04-25 | Spec phase landed + prototype built end-to-end |
| 2026-05-03 | 10-concept ideation round for evaluate + publish cliffs |
| 2026-05-04 | Code-grounded blueprint revision — three-gateway API, 15 extension services, CashInfo polling, B3/B4 resolved, B8–B11 opened |

---

## 21. How to use this doc in the new repo

1. **Drop in as `CLAUDE.md`, `LEARNINGS.md`, or `docs/CONTEXT.md`.** All three work — pick the one that matches the new repo's conventions.
2. **Re-validate §15 open questions** in the first session — some may now be answered.
3. **Re-check the §19 Console stack discrepancy** — likely the first thing to lock before any UI work.
4. **Keep a decision log** (this file's §20 pattern) in the new repo. Decisions evaporate without one.
5. **Cite docs.agora.io for any Agora-primitive design call** and put the URL in PRs.
6. **The original case study** (~2,900 lines, design-thinking structured) lived at `docs/case-study.md` in the source project. If the full reasoning behind any decision here is unclear, that document has the receipts.
