# Studio_X Wireframe — Handoff

**Date:** 2026-05-26 (updated post-Usage-polyhierarchy)
**Source repo:** [AgoraIO-Community/ai-studio-console-redesign](https://github.com/AgoraIO-Community/ai-studio-console-redesign)
**Mirror (Vercel deploys from this):** [sonishakti/ai-studio-wireframe](https://github.com/sonishakti/ai-studio-wireframe)
**Live preview:** [https://ai-studio-console-redesign.vercel.app](https://ai-studio-console-redesign.vercel.app)

---

## What this project is (in one paragraph)

Studio_X is the IA + UX wireframe for merging **Agora Console** (operational control plane — projects, credentials, billing, usage, extensions) and **Conv AI Studio** (where developers design and publish voice AI agents) into one unified surface. Asymmetric merge — Studio is the chassis, Console grafts in. RTE (Real-Time Engagement: voice / video / live streaming / chat / signaling) is preserved but no longer the center of gravity. The wireframe in `wireframes/app.html` is the living IA reference — vanilla HTML/CSS/JS so it deploys instantly and stays editable by designers. A future React + Vite + shadcn + `@agora/*` registry implementation (Path A) is planned but blocked on a registry token.

**Don't re-litigate the strategic frame.** It's documented in `LEARNINGS.md` (~520 lines, paid-for research). The §2 funnel data (~93% drop at the Console↔Studio seam) is the project's reason for being.

---

## Read order for a designer joining now

| # | Doc | What it gives you |
|---|---|---|
| 1 | `LEARNINGS.md` | Strategic frame, funnel data, personas, principles, hypothesis stack, decision log. Read first. |
| 2 | `references/ia-mapping.md` | Console → Studio_X URL-by-URL coverage. 56/56 mapped. Final lean sidebar shape. |
| 3 | `references/journey-map.md` | Screen-by-screen flows for non-core surfaces (Realtime Services enable, Billing top-up, Webhooks, Audit, etc.). |
| 4 | `references/measurement-framework.md` | 8-stage activation journey · GSM chains · 3 A/B test plans · counter-metrics · ethical floor. |
| 5 | `references/event-taxonomy-review.md` | 28-event canonical taxonomy with 7 P0/P1 fixes flagged on the Notion KPI doc. |
| 6 | `references/analytics-rebuild.md` | Analytics Performance tab — Figma → wireframe + `/organize` (Agent vs RTE) + `/fortify` (12-state inventory). |
| 7 | `references/usage-rebuild.md` | Analytics Usage tab — Agora Console Figma → adapted Studio_X version. |
| 8 | `references/billing-journey.md` | Billing 10 end-to-end journeys mapped: top-up, pay invoice, upgrade, view usage, manage cards, download, audit transaction, bank transfer, bill-shock, suspended-account. |
| 9 | `wireframes/app.html` + `style.css` + `app.css` + `app.js` | The wireframe itself. ~2000 lines of HTML after the Billing rebuild, fully tokenized. |

---

## Where things are in the wireframe

**Sidebar (final lean shape — 10 items, 4 groups):**

```
Home
BUILD     ›  Agents · Integrations
DEPLOY    ›  Phone Numbers · Campaign
MONITOR   ›  Analytics · Call History · Session History
PROJECT   ›  Project Settings · Realtime Services · Credentials
```

**Footer:** Search ⌘K · Project chip · Avatar

**Topbar:** Bell · ✦ Ask

**Avatar dropdown (just leaned again — 9 items + theme + credits, was 25):**
- Workspace (current + switch)
- Theme: Light · Dark · System (segmented control)
- Free 10,000 Minutes credits block
- Billing
- Extensions Marketplace
- **Developer →** (hub: RESTful API · AA Embedded · Webhooks · Audit · Toolkit · Licensing)
- **Help →** (hub: Support tickets · Contact Sales · What's new · Docs ↗ · Community ↗ · Status ↗)
- Try Agora Analytics ↗
- Preferences
- Log out

**Analytics is a tabbed surface** (Performance · Usage) at `Monitor › Analytics`. Usage merged in from a separate sidebar item — route `/usage` still works as an alias. Performance matches the Studio Figma; Usage matches the Agora Console Figma.

**Cost tab deleted 2026-05-26** after audit. The tab claimed per-vendor cost breakdown (LLM/TTS/ASR rates, "what you're paying for · per minute") that required data Agora doesn't have — vendor invoices go directly from OpenAI/ElevenLabs/Deepgram to the user, not through Agora. Engineering open question B7 (LEARNINGS §15 — "Current cost-cap / circuit-breaker architecture?") confirmed no cost-cap API field exists. Agora platform spend now lives in Billing › Overview › Current Plan card (Agora's own data). Pre-commitment per-minute estimates live in the Deploy modal Cost tab (published vendor rates, clearly labeled as estimate). The Analytics > Cost surface was never in the Figma — it was added in commit `d64587c` without an explicit IA lock. See `references/analytics-rebuild.md`, `references/usage-rebuild.md`, `references/billing-journey.md` for the references updates.

**Billing rebuilt 2026-05-26 to match Figma node 142-7864:**
- 4 tabs only: **Overview · Transactions · Invoices · Payment Methods**
- **Plans + Add-ons** moved to a separate `/billing-plans` route (accessed from Overview's "Upgrade Plan" CTA)
- **Withdrawals** absorbed into Transactions as a Type filter value
- **Account-level Usage** (briefly added as a Billing tab in an earlier turn) reverted — the **Current Plan card** on Overview now answers "am I near my cap?" via a STARTER badge + product-family seg-tabs + 64% Used progress + minute counters + "View Usage →" deep-link to Monitor for the full chart
- New shadcn-faithful components in `style.css`: `.card`, `.seg-tabs`, `.progress`, `.combo`, `.pagination`, `.alert`, `.copy-input`, `.data-table`, `.status-badge`, `.mono-num`. Space Mono added for currency amounts (matches Figma)
- See `references/billing-journey.md` for the 10 end-to-end billing flows (top-up, pay invoice, upgrade, bank transfer, suspended-account recovery, bill-shock prevention, etc.)

---

## What's done — recent commits worth knowing

```
a252200 Project Settings UI fix + /organize all Agora services into Realtime Services
c9ae9ae Project + Profile pages: rebuild to Figma fidelity, strip wireframe notes
4769c8d Audit: delete Analytics Cost tab + scaffold Integrations + Figma 142-7866 gap inventory
9510b8f Revert "Billing: visual polish pass — sleeker cards, tighter type, refined micro-interactions"
8c3226e Revert "HANDOFF: stamp Billing polish commit hash"
a8ad720 Billing: rebuild from Figma node 142-7864 + /organize 4-tab IA + /journey 10 flows
99e2047 HANDOFF: stamp the Usage polyhierarchy commit hash
a019d07 /organize: Usage polyhierarchy — project + account scopes with cross-links (superseded by Figma rebuild)
3aed61a /organize: lean avatar dropdown via Developer + Help hubs
1c79750 Usage tab: rebuild from Agora Console Figma, adapted for Studio_X
503a4f0 Analytics: rebuild Performance tab to match Figma + /organize + /fortify
ffa2b17 Sidebar pinned to viewport + Light/Dark/System theme toggle
f510e0c Icons: swap all chrome emoji for Lucide
bbd4577 Visual refactor: adopt shadcn design tokens, Agora blue accent
d64587c Merge Usage into Analytics as a tab (one Observe surface)
23a64e4 Cleanup: remove orphan screens, absorbed duplicates, dead CSS/JS
6d32095 Journey map: fill Console parity gaps for non-core surfaces
91cf507 Lean IA: sidebar simplified, switchers move to footer
e1f0d55 Agents page: rebuild to match new design
6cdd17e Console → Studio IA mapping: 100% coverage, lean
```

Run `git log --oneline -20` for the full recent history.

---

## What's NOT done (open work)

Listed by document — each doc's own "what's NOT done" section is authoritative.

### Wireframe gaps still labelled "placeholder"
- `Deploy › Phone Numbers` (buy / port / assign) — not in Figma 142-7866
- `Deploy › Campaign` (outbound dialer) — not in Figma 142-7866
- `Monitor › Call History` (searchable list) — not in Figma 142-7866
- `Monitor › Session History` (multi-turn sessions) — not in Figma 142-7866
- Notification Center filter tabs (Billing/Product/Ops/Tickets — only "All" is populated)

These are flagged in commits as **Studio-core surfaces** the team is iterating separately.

### Figma 142-7866 → wireframe gap inventory (2026-05-26)

After auditing the "Final designs" Figma file, here's the coverage of every section against the wireframe. **Bold** = rough scaffold added this pass.

| Figma section | Figma frame | Wireframe destination | State |
|---|---|---|---|
| 01 / Agents Pages | Agent_Landing_pro_user (90:14468) | `agents` | ✓ Built — close to Figma, may need refresh: agent table headers (Agent · Agent ID · Project/App ID · Last Published · Last Edited · Status), "Pre-built by agora" list, Interactive Voice Response side panel with orb + Start Call |
| 01 / Agents Pages | Agent_Landing (90:14575) | `agents` (first-run mode) | ✓ Built — has first-run state, may need verification against Figma |
| 02 / Connectors | Adding Connector 1.0 (90:15477) | **`integrations`** | **🆕 Scaffolded this pass** — Knowledge Base / MCP / Connectors seg-tabs, search input, 6-card connector grid (Hubspot, Airtable, Jira active; PayPal, Whatsapp, Zendesk Coming Soon). Knowledge Base + MCP tabs are stub panels with rough copy + CTA. |
| 03 / Project | Projects_Overview (90:15739) | `project-settings` | ✓ Built — App ID, App Certificate (Primary + Secondary rotation), Temporary Token. Visual treatment uses `.row` patterns vs Figma's input+copy-button pattern. Functionally complete, visually diverges. |
| 03 / Project | Projects_RTE × 2 (90:15778, 90:16296) | `realtime-services` | ✓ Built — left-side service list (Chat, Cloud Recording, Whiteboard, Media Pull/Push/Gateway, Video Screenshot Upload) + right-side configuration with toggles. May need visual refresh. |
| 04 / Profile Menu / Billing | 5 frames (90:16767, 140:19049, 140:19192, 140:19118 + Profile-Menu) | `billing-subs` | ✓ Rebuilt 2026-05-26 from this Figma section. 4 tabs: Overview · Transactions · Invoices · Payment Methods. |
| 05 / Profile Menu / Other Screens | Extension Marketplace (95:18696) | `extensions` | ✓ Built — Marketplace / My Submissions tabs, Platform filter, extension cards with Install. May diverge from Figma. |
| 05 / Profile Menu / Other Screens | View all plans (140:22149) | `billing-plans` | ✓ Built 2026-05-26 as part of Billing rebuild. Figma shows Agent Studio / RTC Prepaid / Signaling / Chat tabs with Monthly/Top-Up sub-tabs and 5-tier pricing cards (Free / Starter / Pro / Business / Business Pro). **Current wireframe is simpler — just lists tiers in rows.** Refresh recommended. |
| 05 / Profile Menu / Other Screens | Profile/Preferences (90:16646) | `preferences` | ✓ Built — needs verification: Figma has Profile / Notifications / Teams & Members / SSO / Account sub-tabs + Personal Info + Security (2FA, password) + Company Info + Danger Zone (Delete account). |
| 05 / Profile Menu / Other Screens | Profile / RESTful API (90:16721) | `restful-api` | ✓ Built — Customer ID + Customer Secret + Download + Note + Delete row pattern. Matches Figma direction. |

**Notable IA discrepancy:** Figma sidebar shows **Usage as a standalone PROJECT-level item**, not as an Analytics tab. Our wireframe merged Usage into `Monitor › Analytics › Usage` per a prior `/organize` decision. The route alias `/usage` still works, but it doesn't appear in the sidebar as a top-level item. Decision needed: revert the merge (separate sidebar item) or keep the merge.

### What needs full Figma-fidelity rebuilds (vs the rough scaffolds in this pass)

In priority order:
1. **`billing-plans`** — Figma's "View all plans" is a sophisticated pricing tier UI (5 tiers, Monthly/Top-Up sub-tabs, "Need a custom plan?" CTA, purchase notice). Current implementation is row-based. Worth a proper rebuild.
2. **`preferences`** — needs the 5-tab structure (Profile / Notifications / Teams & Members / SSO / Account) with the cards-and-fields layout.
3. **`extensions`** (Extension Marketplace) — Figma shows platform pill badges (Web · macOS · iOS) and Install buttons. Current implementation may need refresh.
4. **`integrations`** Knowledge Base + MCP panels — currently stub copy. Need full design (presumably exists in another Figma node not in 142-7866).
5. **`agents`** — minor refresh to match Figma table columns + side-panel orb pattern.

### Production readiness items (from `references/usage-rebuild.md` §8)
1. Data-freshness indicator ("Updated 2 min ago")
2. No-data state toggle (Agora Figma frame 6_Usage_No_Data not yet wired)
3. Real date-range picker (currently a select)
4. Sort interaction on table column headers (chevrons present, no behavior)
5. CSV export wiring
6. Excess-usage banner near quota cap
7. Project filter pre-fill from current context
8. Mouse-tracking tooltip on chart hover (static for now)

### Event instrumentation (from `references/event-taxonomy-review.md`)
- 7 P0/P1 fixes on the Notion KPI doc — most critical: split `agent_configured` into 4 events, add `_succeeded` qualifier to each Aha, add `provider_default_kept` counter to `credentials_added` Revenue Leak.

### Tech-stack migration (Path A)
`LEARNINGS.md §19` documents the Console redesign target stack: React + Vite + TanStack Router + shadcn + Tailwind + MSW. The wireframe is **CSS-token-compatible** with that stack today — the same `--primary` / `--foreground` / `--ring` variables move over unchanged. Blocker: `AGORA_REGISTRY_TOKEN` for the `@agora/*` registry (private Vercel deployment of `agora-console-ui` repo, `revamp` branch, in the `agora-gdxe` Vercel team).

---

## How the deploy works

- `git push origin main` → pushes to **both** GitHub repos (origin has dual push URL — `AgoraIO-Community/ai-studio-console-redesign` and `sonishakti/ai-studio-wireframe`)
- Vercel watches **`sonishakti/ai-studio-wireframe`** main branch via the Vercel-for-GitHub integration
- Production URL: `https://ai-studio-console-redesign.vercel.app` (project name from the AgoraIO-Community repo)
- ~60s from push to live
- Vercel project ID: `prj_QgMd1HPK3QusHIxwS6dX18Dk0jxe` (team `soni28shaktigmailcoms-projects`)

There is no build step — Vercel serves `wireframes/app.html` statically.

---

## Tech stack of the wireframe itself

- **Vanilla HTML / CSS / JS** — no bundler, no framework
- **CSS variables** under shadcn convention (`--background`, `--foreground`, `--primary`, etc.) with `.dark` overrides
- **Lucide icons** via CDN (`unpkg.com/lucide@latest/dist/umd/lucide.min.js`) — called once on init with `stroke-width: 1.75`
- **Inter font** via Google Fonts with preconnect
- **Light / Dark / System** theme, persisted in `localStorage`, pre-paint script in `<head>` prevents FOUC
- **Sidebar pinned to viewport** — `.main` is the scroll region; `body` has `overflow: hidden`
- **Dropdowns use `position: fixed`** so they escape the sidebar's overflow clipping
- **`#main` element** scrolls on route change (not `window`)

No Tailwind. No build step. No npm install. Open `wireframes/app.html` and it just works.

---

## Open decisions for the team

These are explicitly listed across the reference docs. None are blockers — but each is a decision the team owes itself before shipping production.

1. **Log-scale single chart vs split charts** for heterogeneous Usage units (Agent sessions + RTE minutes + Chat DAU). Recommend A/B once live (`/measure`).
2. **What "Task Success Rate" means for RTE** in Analytics Performance tab. Makes sense for Agents; for Voice/Video, XLA score is the right metric. Title needs to swap on product filter change.
3. **Cost tile in Analytics KPI grid?** Figma shows 4 KPIs; some users want spend visible top-row.
4. **Default time range for new accounts.** "Last 7 days" is too wide for a 2-day-old account. Default to "Since account created" until 7 days have passed?
5. **`AGORA_REGISTRY_TOKEN` access.** Currently blocking the Path A React migration. Either grab the token from the `agora-gdxe` Vercel team, or commit to shadcn-fallback indefinitely.
6. **Product filter labels.** "All Products / Agents / Voice / Video / ILS / Chat / Signaling" — does the team have established naming?

---

## Suggested skills for the next session

Triggered by name and what they own:

| Skill | When to invoke |
|---|---|
| **`/organize`** | More IA work — anything navigational, hierarchical, or "where should X live?" |
| **`/journey`** | Designing a new flow end-to-end — the Studio-core placeholder screens (Integrations, Phone Numbers, Campaign, Call History, Session History) need this |
| **`/fortify`** | Edge cases — anywhere you find `class="empty">Wireframe placeholder` or want a 12-state inventory |
| **`/articulate`** | Tightening copy — the Help hub, Contact Sales form, error messages |
| **`/measure`** | Defining or refining metrics — paired with the [event taxonomy](references/event-taxonomy-review.md) |
| **`/include`** | Accessibility pass on the new charts (SVGs currently have no aria-labels, donut color-blind concerns flagged in `references/analytics-rebuild.md`) |
| **`/specify`** | Engineering handoff — turning the wireframe into a real spec for the React port |
| **`/evaluate`** | UX assessment of any specific surface before ship |
| **`/transpose`** | Mobile / responsive adaptation (currently desktop-first) |
| **`/localize`** | i18n / RTL / number-format work (flagged in `references/analytics-rebuild.md` stress-tests) |
| **`vercel-plugin:deploy`** | If you need to force a manual deploy |
| **`run`** | If you want to open the wireframe in a local browser for screenshot testing |

---

## Two skills explicitly NOT needed (yet)

- **`/strategize`** — strategic frame is locked. Don't re-open without new evidence (per LEARNINGS §3 constraint).
- **`/blueprint`** — backend / service architecture is documented in LEARNINGS §19 + §20. Don't redesign the system; design the UI on top of it.

---

## How to verify state in 5 minutes

```bash
cd "/Users/shaktisoni/Documents/Agora Design & FE/ai-studio-console-redesign"
git log --oneline -5            # recent commits
git status --short              # working tree state
ls references/                  # reference docs
open https://ai-studio-console-redesign.vercel.app  # live wireframe
```

If you see anything stale in the references, the rule is: **commits are the truth, docs cite them**. Fix the doc, don't second-guess the wireframe.

---

## Sensitive items redacted from this handoff

- No API keys, tokens, or credentials in the repo
- Vercel project ID is publicly visible in dashboard URLs (not sensitive)
- The `AGORA_REGISTRY_TOKEN` is referenced by name only — actual value lives in Vercel env vars
- LEARNINGS.md and other docs reference internal funnel numbers (e.g. "93% drop") — keep these in the repo for context but don't post screenshots externally
