# Analytics Rebuild — Figma → Wireframe + /organize + /fortify

**Source design:** [Figma node 1375-128751](https://www.figma.com/design/nvmnWonCUy9t1NQ4vWL879/Ai-Agent-Studio?node-id=1375-128751&t=jyfvHelJiAw6gevB-1)
**Implemented:** `wireframes/app.html` — Analytics screen, Performance tab
**Date:** 2026-05-25

---

## What shipped

The Performance tab of `Monitor › Analytics` now matches the Figma:

- **Header row** — title + subhead + refresh icon
- **Filter bar** — 5 chips (Date range · Product type · Agents · Call Types · Campaigns)
- **4 KPI cards** — Answered Calls / Answer Rate / Call Duration (Avg) / Call Duration (Total), each with mini sparkline + delta indicator
- **Two-column chart row** — Call Status Distribution donut + Task Success Rate area chart
- **Top Performing list** — ranked agents with horizontal bar visualisation

Implementation: inline SVG for sparklines, donut (stroke-dasharray segments), area chart, and progress bars. No charting library — keeps the wireframe a single static page that runs anywhere. CSS variables drive colors so the same charts work in light and dark mode.

---

## /organize — how a new user views Agent **and** RTE usage from this screen

### The constraint

Studio_X is the asymmetric merge of two products ([LEARNINGS §1](../LEARNINGS.md)): Conv AI (Agents) is the chassis, but Real-Time Engagement (Voice / Video / ILS / Chat / Signaling) still ships in the same project and same App ID. Analytics has to honor that: a user with both products active needs **one place** to see both, but a user with only Agents shouldn't be confused by RTE metrics they don't use.

### The mental model question

A new user lands on Analytics. They ask one of three things:
1. *"How is everything in my project doing?"* — wants a combined view
2. *"How are my agents performing?"* — wants Agent-only
3. *"How is my video calling doing?"* — wants a specific RTE product

A separate "Agent Analytics" page vs "RTE Analytics" page would force users to know which they want before they look. That's wrong — most new users don't carry that vocabulary into the product.

### The IA decision: product type is a filter, not a destination

The screen stays one destination (`Monitor › Analytics`). Product scope becomes a **filter chip** alongside the existing time/agent/call-type/campaign filters. This means:

- **Default for a new user: All Products** → they see total project activity (Agents + RTE rolled up). Familiar pattern from Stripe, Vercel, Linear.
- **Drill down**: click the chip → pick Agents (Conv AI) / Voice / Video / Interactive Live Streaming / Chat / Signaling.
- **Metric set adapts** to the filter:
  - Agents only → "Calls / Sessions" → KPIs are answer rate, call duration, task success
  - Voice/Video only → "Channels / Minutes" → KPIs are concurrent peak, minutes consumed, quality (XLA score)
  - All → unified KPIs using common denominators (sessions, minutes, success-rate-weighted)

This is **faceted analytics**: the same screen renders different metrics for different scopes, like e-commerce category filtering renders different facets per category.

### Why this beats the alternatives

| Alternative considered | Rejected because |
|---|---|
| Separate sidebar items for "Agent Analytics" and "RTE Analytics" | Forces vocabulary on new users who don't know which they want. Doubles sidebar weight. |
| Tabs inside Analytics ("Agents · RTE" with sub-tabs underneath) | Three-level nesting. And once a user has only one product, the empty tab is confusing. |
| Combined view only, no product filter | Falls apart when one product is much larger than the other — combined numbers mask the smaller product's signal. |
| Auto-detect dominant product and show only that | Magic and brittle. Power users want explicit control. |

### Cross-link affordances (the wayfinding glue)

A new user often arrives at Analytics from elsewhere. Each entry point pre-selects the right filter:

| Came from | Lands with filter | Why |
|---|---|---|
| Sidebar `Analytics` link | All Products (default) | No upstream signal |
| Agents › `View analytics for this agent` button | Product: Agents · Agent: \<that one\> | Carry context |
| Realtime Services › Voice card → `Analytics` | Product: Voice | Carry context |
| Home › "Live agent activity" widget → "View full analytics →" | Product: Agents | Already in agent context |
| Notification: "Cloud Recording quota at 80%" → analytics link | Product: Voice (the one Recording rides on) | Specific issue |

This mirrors how Linear's filters carry across views via URL params — the IA does the heavy lifting so the user doesn't have to re-set filters.

### Anchor for future RTE products

When Agora ships a new RTE product (e.g., AR Engagement), it becomes one more option in the Product filter — no IA change. The screen scales by extension, not restructure.

---

## /fortify — hardening Analytics for the world outside the happy path

The current implementation shows a populated, healthy account on a normal day. Real users land on this screen in many other states. Each one needs a defined behavior.

### State inventory (12 states this screen will encounter)

| # | Condition | What we show |
|---|---|---|
| 1 | **Brand-new account, zero data** | Empty hero: "Your analytics will appear here within minutes of your first call." With *Make a test call →* CTA routing to Agents › builder. No KPI cards rendered — empty state takes the whole screen so it can't be misread as "things are 0%" |
| 2 | **First-call-just-happened, < 5 min data** | Banner above charts: "Data lags by ~3 minutes — your most recent call may not yet appear." KPI cards render with the data available. |
| 3 | **One product active, other product never used** | Filter chip "All Products" shows just that one product in the picker; "no data" badge on inactive ones with explainer "Enable Voice in Realtime Services to see metrics here." |
| 4 | **Time range with no traffic** | Charts render as "No data in this range" with a single CTA: *Try Last 30 days →* (one wider window) |
| 5 | **Single agent on the account** | "Top Performing Agent" section hides ranking ("1") and shows just the agent — ranking is meaningless with N=1 |
| 6 | **Agent failing in production (success < 50%)** | Top-perf row gets a red status pill + inline "Investigate →" link to Call History pre-filtered to failed calls for that agent |
| 7 | **Plan-gated metric** (e.g. detailed call recording analytics on Free) | KPI tile renders with lock icon, "Upgrade to unlock →" overlay routing to Billing › Plans. Other tiles unaffected. |
| 8 | **Data fetch fails** | Per-tile error state with "Retry" button — never block the whole page on one failed fetch. Other tiles keep their last-known data with a "Last updated 3m ago" timestamp |
| 9 | **Slow / loading** | Skeleton rectangles in KPI value positions for ≤ 1.5s, then content. Sparkline area shows shimmer. After 5s without data, switch to "Still loading — this is unusual. Refresh." |
| 10 | **Date range too wide for granularity** (1 year @ 5-min granularity) | Banner: "Granularity reduced to daily for ranges > 90 days." Auto-downsample, don't fail. |
| 11 | **No permission to view analytics** (read-only role) | Show charts but hide drilldowns (Call History deep-links). Banner: "Your role can see metrics but not call details. Ask an admin for access." |
| 12 | **Account suspended** (Home `homeSuspended`) | Analytics route blocked — show suspended takeover (same as Home suspended state). Don't show stale "we're doing great" charts on a suspended account. |

### Specific edge cases per element

**KPI card — `Down by 19%`:**
- Honest math: compare current period to previous *equivalent* period (last 7 days vs. previous 7 days). Not vs. "all time."
- If previous period had 0 → don't show percent; show "No prior period to compare" instead of "+∞%"
- Tap the delta to see the comparison detail (which period, exact numbers). Currently the delta is a passive number — users will want to verify it before trusting it

**Donut chart — Call Status Distribution:**
- When one slice is 99%+ (e.g., everything is "Answered"): collapse other slices into a single "Other" wedge to avoid invisible 0.1% slivers
- When `Failed > 20%` (an alert threshold), add a warning border to the chart card and an inline "What's going wrong? →" link to Call History
- Color-blind safety: don't rely on red-vs-green alone. Use icons + patterns where the difference is critical (the current pink for "Transfer Failed" is too close to the red "Failed" for some forms of color blindness — needs a pattern fill or label)

**Area chart — Task Success Rate:**
- Y-axis should auto-scale to data range, not always 0-100%. If success is 92-99%, showing 0-100 wastes the visualization
- Show the actual current value and the trend direction in the chart title, not just "Task Success Rate" — e.g., "Task Success Rate — currently 78%, down from 92% peak"
- Add a horizontal target line ("Target: 85%") if the user has set one in Settings

**Top Performing list:**
- Sort isn't just by success rate — power users want to sort by volume, by recency, by cost. Add a "Sort by ▾" control
- When more than 10 agents, show top 3 + "Show all" → expands to full table
- "Performance" is a composite — clicking the row should reveal the formula (success rate × volume × consistency) and let the user re-weight it

**Filter chips:**
- When a non-default filter is applied, show a visual "active" state (filled background or dot indicator) and a "Clear filters" pill so users don't get stuck in a filtered view by accident
- URL should encode filter state (`?range=7d&product=agents&agent=AgentAlpha`) so links are shareable
- Filter combinations that yield zero results need a graceful empty state — currently each filter is independent; combining "Last 24h" + "Agent Gamma" + "Voicemail" might be a real zero result

### Stress-test scenarios

| Scenario | How it breaks current design | Fix |
|---|---|---|
| 10K agents | "Top Performing Agent" list breaks (DOM grows) | Top 5 + paginated table, server-side sort |
| 1M calls in 24h | Donut chart numbers truncate to "1M" | Always show full number with thousands separators; "4,000,000 Total calls" |
| Locales (DE: decimal comma) | "95%" + "5 min" formats incorrectly | Use `Intl.NumberFormat` per user locale (`/localize`) |
| RTL (Arabic, Hebrew) | Sparkline draws left-to-right time → wrong | Flip sparkline horizontally in RTL contexts |
| Screen reader user | SVG charts are invisible (no aria) | Each chart needs an aria-label + a visually-hidden table fallback (`/include`) |
| Color blind user (8% of men) | Donut "Failed" red vs "Transfer Failed" pink | Add pattern fills or text labels to slices |
| Print / export | Dark mode charts on white paper = invisible | Force light palette for print media query |
| First call within < 5 min | Charts empty → user thinks Analytics broken | "Data lags 3 min" banner (state #2 above) |
| Quota at 100%, account fine | Billing › Current Plan card shows green but Usage tab shows red | Cross-state consistency check before render |
| Concurrent edits to filters | Loading state flickers as queries race | Debounce + cancel stale queries |

### What we are **not** designing (out of scope, hand off explicitly)

- The actual chart library / data layer — that's engineering (`/specify` writes the spec; `/blueprint` reviews the API shape)
- Localized number / currency formatting beyond noting it's required — that's `/localize`
- Screen reader / keyboard accessibility implementation — that's `/include` for the audit and engineering for the markup
- The decision of what counts as "Task Success" — that's a product / measurement question (`/measure`)
- The PII handling in event payloads (caller numbers, transcripts) — covered in [event-taxonomy-review.md §"Two things the team should agree on"](event-taxonomy-review.md)

---

## Open questions for the team

1. **Product filter labels.** "All Products" / "Agents" / "Voice / Video / ILS / Chat / Signaling" — does the team have a preferred naming? Some call RTE "Real-Time", some call it "RTE", some call it by individual product names.
2. **Default time range** for new accounts: Last 7 days might be too wide for a 2-day-old account. Default to "Since account created" until 7 days have passed?
3. **Success metric for RTE.** "Task Success Rate" makes sense for Agents (did the task complete?), less so for Voice/Video (XLA score, call drop rate). When the Product filter is RTE, the chart title needs to change.
4. **Cost tile in KPI grid?** Figma shows 4 KPIs. Some users want spend in the top row — could swap one of the duration tiles or add a 5th.
5. **Real-time vs aggregate.** Should there be a "Live" toggle that shows current-hour rolling stats vs. the historical view? (Some competitors do this.)

These are not blockers for the wireframe — they're decisions for the build-out.
