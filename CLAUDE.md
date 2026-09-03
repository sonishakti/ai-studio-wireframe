# Studio_X — Project memory

> Auto-loaded each session. Full handoff is in `HANDOFF-2026-06-18.md` (latest — what just shipped + what's next; older: `HANDOFF-2026-06-02.md`); this file is the 60-second orientation so a fresh chat doesn't re-derive context.

## ⚑ Ship protocol — the default loop for EVERY request

> **Standing, user-directed 2026-07-30. Full detail: [`references/ship-protocol.md`](references/ship-protocol.md).**
> Reusable research prompts + workflow commands: [`references/prompt-library.md`](references/prompt-library.md).

```
research (if the ask is new) → build → tsc + next build → commit + push
   → vercel deploy --prod --yes → annotated screenshots → HTML log
```

Every step runs **without being asked**. Skip one only if the user says so *in that request* —
and say which you skipped and why. Specifically:

1. **Commit + push every time.** The user reviews the live site, not the working tree.
2. **Deploy every time** — `vercel deploy --prod --yes` from the **repo root**. Git auto-deploy
   is BROKEN; a push alone leaves the site stale. Verify the route returns 200 afterwards.
3. **Annotated screenshots every time**, red-marked, against the live build:
   `node scripts/annotate-shots.mjs <config.json> references/<feature>-shots`
   Each marker carries a **name** (what it is) *and* a **why** (the design rationale). Both are
   required — a red box with no rationale doesn't tell a reviewer what decision they're judging.
4. **A log** at `references/<feature>-implementation-log-<date>.html` — styled self-contained
   HTML, plus an Artifact copy with images inlined. Never a markdown dump.

## Live preview

- **App (start here):** https://ai-studio-console-redesign.vercel.app
- ⚠️ **The live app is `studio_x_2/`** — the wizard fork became canonical when the prod project's
  Root Directory was repointed `studio-x/` → `studio_x_2/`. Deploy from the **repo root**.
  Older text in this file that says `studio-x/` is the live app is STALE.
- `studio-x/` — the previous app; still builds, no longer deployed. Reference only.
- Legacy: `wireframes/app.html` — the original vanilla HTML wireframe. Superseded; don't edit.
- Gate before every commit: `cd studio_x_2 && pnpm tsc --noEmit && pnpm next build`

## What this is

Studio_X = IA + UX wireframe merging **Agora Console** (ops control plane: projects, credentials, billing, usage, extensions) and **Conv AI Studio** (where developers design and publish voice AI agents) into one surface. **Asymmetric merge** — Studio is the chassis, Console grafts in. RTE (voice/video/streaming/chat/signaling) is preserved but no longer the center of gravity.

This is a **funnel rescue project** that happens to require product consolidation. The ~93% drop at the Console↔Studio seam (LEARNINGS §2) is the reason it exists. **North-star (2026-06-17 realignment): Signup → First live deployment carrying traffic → first paid usage.** This supersedes the old "Signup → First Agent Published" — publishing an agent earns Agora $0; revenue = minutes consumed on a live deployment. See LEARNINGS §20 (2026-06-17).

## Read order

0. `references/ship-protocol.md` — **how every request ships** (commit · deploy · annotated shots · log) + `references/prompt-library.md` for the research prompts and workflow reruns
0b. `references/design-ops-protocol.md` — **how a feature gets designed** (intake → JTBD → interviews → competitor teardown → synthesis → prototype → proposal → designer review → push). Tracker: ClickUp **Convo AI › Design Tracker** (list `901114875662`, 28 features ↔ 189 roadmap tasks). Run it with `/design-feature <nn>`. Backlog: `references/design-backlog-q3-roadmap-2026-09-03.html`.
1. `references/prd-q3-roadmap-execution-2026-07-29.html` + `TODO-Q3-ROADMAP.md` — the **official Convo AI Q3 roadmap** (111 ClickUp tasks) mapped to 7 epics / 4 waves. **Wave 1 shipped 2026-07-29** — see `references/wave1-implementation-log-2026-07-29.html`. ⚠️ It reverses three older fact-checks: Agora **will** resell phone numbers (P0, Sep), live monitoring **is** planned, WhatsApp voice **is** P0.
2. `HANDOFF-2026-06-18.md` — prior state, commits, deploy, the shipped Diagnostics feature + the next slice (§4); `HANDOFF-2026-06-02.md` is the one before
3. `LEARNINGS.md` — strategic frame, funnel data, personas, hypothesis stack, decision log (paid for in research — **don't re-litigate**)
4. `references/roadmap-activation-strategy-2026-07-09.md` + `references/roadmap-features-prd-2026-07-09.md` — **the cn2meet roadmap (42 features) reframed as an activation engine** + design-ready PRD (register, P0/P1 cards, per-feature "run this skill next"). Load-bearing fact-checks inside (300-min free tier NOT 10k; Agora sells no numbers; MLLM+MCP already ship; postpaid billing; no live-monitoring/WhatsApp). Proposal — not yet built.
5. `references/ia-mapping.md` — Console → Studio 56/56 URL coverage
6. `references/sitemap.md` — original Agora Console structure
7. `references/realtime-services-blueprint.md` — 13-service Real-Time map
8. `studio_x_2/` — **the live app**; `studio-x/` is the previous one, `wireframes/app.html` the superseded HTML origin

## Current sidebar (LOCKED 2026-06-05 — labeled groups; Build folds in deploy)

> ⚠️ **2026-06-17 — ACTIVATION-REVENUE REALIGNMENT (built).** Revenue = minutes on a
> live deployment, not a published agent. Center of gravity moved from "build an agent"
> to "get live traffic, fast." **"Go Live"** (the deploy hub) is now BUILD #1 and the
> app root (`/` → `/deploy`); **Agents is demoted** to a reusable library. A **default
> agent (Aria) is auto-provisioned and live** on signup — the first-run home is *talk to
> it, then put it to work* (believe-then-scale), **campaign as the flagship channel**.
> Built in `components/go-live-home.tsx`. Keeps 06-11 intact (Agent/Deployment split;
> Batch Calls = outbound). See LEARNINGS §20 (2026-06-17). Text below is superseded
> where it conflicts.

> ⚠️ **2026-06-11 — IA REVAMP IN FLIGHT (blueprint signed off, build pending).** The
> agent splits into **Agent = reusable Stack+Persona** (no prompt/vars) and
> **Deployment = the whole prompt + custom code + CSV-derived dynamic vars**. Deploy
> goes **intent-first** (Inbound · Batch Calls · Phone Numbers · Code), surfaced up
> front; **Campaigns → Batch Calls**; **one agent ↔ one channel** (multichannel dropped).
> These **reverse four locks below** — see `references/ia-revamp-agent-vs-deployment.md`
> and LEARNINGS §20 (2026-06-11). The sidebar/route text in this section reflects the
> *pre-revamp* state until screens are migrated; the blueprint is the forward truth.

```
Composer
BUILD     Go Live · Agents · Integrations   (2026-06-17: Go Live = deploy hub @ /deploy, now #1 + app root; Agents demoted to a library)
OBSERVE   Monitor   (hub: Overview · Call History · Chat History · Sessions · RTE usage →)
MANAGE    Project Settings · Realtime Services · Vendor Credentials
Search ⌘K
```

Rendered as three labeled groups with **uppercase `SidebarGroupLabel` headers**
(BUILD · OBSERVE · MANAGE), Composer floating above and Search below. Build folds
in the full make-and-launch arc (agent → integrations → number → campaign);
**"Campaign" is singular** — the deployment surface. Monitor gains an "RTE usage →"
outlink to `/billing/usage`. Root `/` → `/deploy` (2026-06-17; was `/agents`). **2026-06-05 reversal: section
labels are BACK, overriding the earlier "no headers" + "'Observe' header rejected"
locks — per explicit user direction (Vapi-informed).** Prior rationale in
`HANDOFF-2026-06-02.md` §3.

Key rules (do NOT re-litigate — user gave explicit final direction 2026-06-02):
- **Campaign = the deployment surface.** `/campaigns/[id]` is the hub for a
  deployment — tabs **Overview · Configuration · Monitor · Calls · Chats ·
  Sessions** — cross-linking to its agent and its phone number(s).
  Configuration is the editable "reconfigure a live deployment" view. The
  **Campaigns list is channel-tabbed: All · Inbound · Outbound · WhatsApp · Web**
  (a campaign can span several; empty tabs offer a configure CTA).
- **Deploy is one hub** (2026-06-05, Opt 3) at `/deploy` — tabs **Overview ·
  Campaigns · Phone Numbers · Web Widget · API & SDK** (via `DeployNav`). Replaced
  the separate top-level Phone Numbers + Campaign items, fixing the asymmetry where
  telephony was the only channel with a top-level home. WhatsApp/SMS/Slack are added
  *inside* a campaign (the wizard, where `/deploy/{sms,whatsapp,slack}` redirect) —
  not standalone pages. Phone numbers stay first-class as the **Phone Numbers** tab.
  "Campaign" = outbound batch; the inbound-copy cleanup is a separate pass.
- **Observability is campaign-first.** Global **Monitor** is ONE sidebar item — a
  hub (Overview · Call History · Chat History · Sessions, via `MonitorNav`).
  **Sessions = AGENT conversation sessions** (`/sessions`, Conversational AI runs),
  NOT RTC telemetry. Label is **"Monitor"**, never "Analytics" (collides with the
  separate Agora Analytics product).
- **RTE = usage, not sessions.** Realtime Services (`/realtime-services`) is the
  Agora RTE catalog (Voice/Video/Live/Chat/Signaling = human↔human comms); it has
  **no Sessions tab** — only "View usage →" CTAs to `/billing/usage`. RTC
  session-quality telemetry is **Agora Analytics** (a separate product, external).
- **Chat History** (`/chats`, text-channel agent convos) ≠ **agent Sessions**
  (`/sessions`, voice/AI conversation runs). Different surfaces — both in Monitor.
- Reference Figma (`Ai-Agent-Studio`) sidebar is INCONSISTENT across frames —
  its page *content* is canonical, its sidebar is not.

History (why it churned): Insights group → dissolved to per-campaign → restored
as a global Observe trio → collapsed to one Monitor hub + folded into the campaign
deployment hub (session 2) → **triage-driven cleanup (session 3): removed `/home`
(root → `/agents`); RTE reframed as *usage* (no Sessions in Realtime Services);
agent **Sessions** moved into Monitor (`/sessions`); **Phone Numbers** promoted to
top-level; Campaigns list went channel-tabbed**. Decisions grounded in Agora docs
(RTE = per-minute usage; Agora Analytics = RTC session quality, separate product;
Conversational AI = agent sessions) + competitor patterns (Vapi/Retell/HighLevel:
number is first-class, "campaign" = outbound). **2026-06-05: section labels re-added (BUILD · OBSERVE · MANAGE) + Phone Numbers/Campaign folded into Build, per user direction.** Earlier: section labels removed;
"Credentials" → "Vendor Credentials".

- Footer: Search ⌘K · Project chip · Avatar
- Topbar: Bell · ✦ Ask
- Avatar dropdown (9 items + theme + credits): Workspace · Theme · Free credits · Billing · Extensions Marketplace · Developer hub → · Help hub → · Try Agora Analytics ↗ · Preferences · Log out

## Don't re-litigate

- **⚠️ 2026-06-17 realignment (overrides conflicting items below) — see LEARNINGS §20:**
  (1) **North star = First live deployment carrying traffic → first paid usage** (was "First Agent Published"; publishing earns Agora $0). The funnel ended right where revenue starts.
  (2) **"Go Live" is BUILD #1 and the app root** (`/` → `/deploy`); **Agents is demoted** to a reusable library, never the entry point. The agent is the engine — auto-provisioned, edited on demand from inside a deployment.
  (3) **A default agent (Aria) is auto-provisioned & live on signup.** First-run = talk-to-it (in-browser, free) → put-it-to-work, **campaign as the flagship channel**. Don't reintroduce a build-an-agent-first wall.
  Keeps 06-11 intact (Agent = Stack+Persona / Deployment = prompt+vars; Batch Calls = outbound).
- **⚠️ 2026-06-11 reversals (override the matching items below) — see `references/ia-revamp-agent-vs-deployment.md`:**
  (1) **One agent ↔ one channel** — multichannel orchestration dropped (was "multichannel is the architecture").
  (2) **Campaigns → Batch Calls** (outbound) — inbound is a peer Deploy surface (was "Campaign = the deployment surface").
  (3) **Deploy is intent-first** — Inbound · Batch Calls · Phone Numbers · Code, surfaced up front (was deploy-as-channel-hub).
  (4) **Prompt + dynamic vars live in the Deployment, not the agent** — Agent = reusable Stack+Persona only; vars auto-detected from CSV columns.
- Strategic frame is locked (LEARNINGS §3). No new `/strategize` without new evidence.
- Studio UI is **frozen** — interventions are additive only. Don't restyle, remove, or rename existing Studio flows.
- Console and Studio share one backend, one Okta cookie, one project record. The seam is **wayfinding**, not auth.
- `Time on page` / session length / DAU are **rejected** as KPIs.
- Bare "Credentials" as a nav item is rejected — must be scoped (LEARNINGS §9).
- "Telemetry" as user-facing label rejected → use "Live activity".
- **2026-06-05 reversal:** BUILD · OBSERVE · MANAGE section labels are back (per user direction); the *item* under OBSERVE stays "Monitor", never "Analytics".
- "Console" as a toggle label rejected → use "Real-Time".
- "Analytics" as a sidebar label rejected → use "Monitor" (Agora Analytics is a separate product).
- Global **Monitor** is a single sidebar item — a hub (Overview · Call History · Chat History · Sessions). Observability also folds into each campaign as scoped tabs. Don't re-split Monitor back into separate flat Call/Chat History sidebar items (2026-06-02 session 2).

## Open IA tensions (do litigate)

1. **Realtime Services** is in PROJECT today; LEARNINGS §10 v2 specs it as a BUILD peer of Agents. Misclassified.
2. **Call History + Session History** — same root question ("what happened?") split across two destinations.
3. **Integrations** (agent-scoped: KB · MCP · CRM connectors) vs **Extensions Marketplace** (project-scoped: Cloud Recording, Spatial Audio, ActiveFence) — labels don't make the distinction clear.
4. **Two Credentials items** in PROJECT — "Project Credentials" + bare "Credentials" (vendor keys). Second violates LEARNINGS §9 — should be "Vendor Credentials".
5. **Usage** — Figma 142-7866 shows it as standalone PROJECT item; wireframe has it as an Analytics tab. Decision pending.
6. **Cost in Analytics** — Cost tab was deleted 2026-05-26 after audit (Agora doesn't have per-vendor cost data). Pre-commitment estimates live in Deploy modal; platform spend in Billing › Overview.

## Tech stack

- **Current app (`studio_x_2/`):** Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · oklch design tokens · cyan primary · DM Sans · Lucide icons · Light/Dark/System theme. Build with `pnpm` (`pnpm tsc --noEmit`, `pnpm next build`). **Mock data only — no backend.**
- **Legacy origin:** `wireframes/app.html` — the original vanilla HTML/CSS/JS wireframe the app was ported from. Superseded; don't edit for new work.
- **Token parity:** the same `--primary` / `--foreground` / `--ring` CSS variables carry from the legacy wireframe into `studio_x_2/` unchanged.

## Where things live

| What | Where |
|---|---|
| App routes (pages) | `studio_x_2/app/(dashboard)/**/page.tsx` |
| Components | `studio_x_2/components/` |
| Mock data + helpers | `studio_x_2/lib/campaign-data.ts` |
| Analytics taxonomy | `studio_x_2/lib/analytics.ts` |
| Reference screenshots | `screenshots/` (newest), `references/console_map/` |
| Open work checklist | `TODO-Q3-ROADMAP.md` (roadmap backlog) · `HANDOFF-2026-06-02.md` §5 |
| Ship protocol + prompts | `references/ship-protocol.md` · `references/prompt-library.md` |
| Design ops protocol + tracker | `references/design-ops-protocol.md` · ClickUp list `901114875662` · `/design-feature` |
| Annotated screenshot tool | `scripts/annotate-shots.mjs` |
| Reference docs | `references/*.md` |
| Legacy HTML wireframe | `wireframes/app.html` (superseded) |
| Recent commits | `git log --oneline -20` |

## Working rules

- **⛔ COPY DISCIPLINE (standing, user-directed 2026-08-10): never ADD UI text without asking.**
  No new helper lines, captions, glosses, banners, or explanatory prose beyond what the
  reference design shows — propose the words in chat first and wait for a yes. Explanations
  go behind progressive disclosure (InfoHint, tooltip, `title`), never inline. Design for
  F-pattern scanning: max ONE short line under a control, never repeat a caption per row,
  and prefer deleting words over qualifying them. Figma copy is the ceiling, not the floor.
- **⛔ CONTROL STROKES (standing, user-repeated, P0 2026-08-10): every input,
  select, textarea, checkbox, radio, and switch boundary uses the `--stroke`
  token (≥3:1 vs its surface in BOTH themes, WCAG 1.4.11) — never `--border`
  (decorative hairline) or `--input` (well fill). New form controls must use
  `border-stroke`; check dark AND light before shipping.**
- **⛔ CONNECTOR BEFORE BROWSER (standing, user-directed 2026-09-03):** ClickUp, Figma, Slack, Linear etc. have MCP/plugin tools — use them. Claude in Chrome only for things with no API (competitor UI screenshots). A ClickUp browser scrape cost 330× the API call.
- Cite `docs.agora.io/en/` URLs for any Agora-primitive design call.
- Commits are the truth — docs cite them. If a doc is stale, fix the doc; don't second-guess the wireframe.
- Keep a decision log entry (LEARNINGS.md §20 pattern) for any non-trivial choice.
- `studio_x_2/` is the source of truth; `studio-x/` and the legacy `wireframes/app.html` are reference-only. Design tokens only — no hardcoded colors / arbitrary `text-[Npx]`; `buoy drift check` validates.

## Skills to reach for

| Skill | When |
|---|---|
| `/design-feature <nn>` | **Start here for any roadmap feature** — runs the design-ops pipeline and updates the ClickUp tracker |
| `/organize` | Anything navigational, hierarchical, "where should X live" |
| `/journey` | New flow end-to-end — agent create → first campaign, or onboarding flow |
| `/articulate` | Tightening copy — Help hub, Contact Sales, error messages |
| `/fortify` | Edge cases — anywhere you see `class="empty">Wireframe placeholder` |
| `/measure` | Metrics work, paired with `references/event-taxonomy-review.md` |
| `/evaluate` | UX critique of a specific surface before ship |
| `/include` | Accessibility pass on charts (SVGs currently lack aria-labels) |
| `/specify` | Engineering handoff — wireframe → React spec |
| `vercel-plugin:deploy` | Force a manual deploy |

**Not needed (yet):** `/strategize` (frame locked), `/blueprint` (architecture documented).

## Useful one-liners

```bash
# Verify state in 60s
git log --oneline -5
git status --short
ls references/
open https://ai-studio-console-redesign.vercel.app

# Search the wireframe
grep -n "data-route" wireframes/app.html | head -20

# Find a screen by route
grep -n 'id="route-' wireframes/app.html
```

## Design System

## Design System Rules

This project uses the ai-studio-console-redesign Design System. Follow these rules when generating code:

### Token Requirements

**NEVER hardcode these values:**
- Colors: Use design tokens or utility classes
- Typography: Use font tokens

**Quick Reference:**
- --background: 0 0% 100%
- --color-sidebar-ring: var(--sidebar-ring)
- --color-sidebar-border: var(--sidebar-border)

### Anti-Patterns

AVOID:
- `<div onClick>` - Use `<Button>` or semantic elements
- Inline styles for colors/spacing - Use tokens or classes
- Creating component variants that already exist
- Arbitrary values (e.g., `p-[13px]`) - Use scale values

### Validation

Run before committing:
```bash
buoy drift check          # Quick validation
buoy show drift          # Detailed drift analysis
buoy drift fix --dry-run  # See suggested fixes
```
