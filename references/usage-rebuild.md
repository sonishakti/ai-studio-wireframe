# Usage Tab — Adapted from Agora Console Figma

**Source design:** [Figma node 3098:155855 (Agora Console Usage page)](https://www.figma.com/design/uDhpQnKHRYCMffKra5FDTO/Agora-Console?node-id=3098-155855)
**Reference frame:** `3098:157383` (1.1_Usage_Default_Landing_Screen_with_breakdown) + `3098:156901` (6_Usage_No_Data)
**Implemented:** `wireframes/app.html` — `Monitor › Analytics › Usage` tab
**Date:** 2026-05-25

---

## What the Agora Console Usage page does well

The Console's Usage page has 11 state variations on the same skeleton — a strong sign the team iterated on this surface. The skeleton:

1. **Total Usage Summary hero** — one BIG number (e.g., `190,112 MIN`) anchored top-right, with cycle context top-left. The user's primary mental model is *"how much am I burning?"* — this answers it in the first second.
2. **Usage Details filter row** — Period · Project · Feature dropdowns + "View Breakdown" toggle. Three slicing dimensions cover ~95% of slicing intents.
3. **Tier KPI strip** — colored-dot legend with per-tier values (Video SD/HD/FHD/2K/2K+/Audio/Chat). Doubles as chart legend AND quick reference. Each tier has its own unit (MIN for video/audio, USER for Chat) which is honest about heterogeneous data.
4. **Multi-series line chart** — log-scale Y-axis (0/100/1k/10k/100k) so series at wildly different scales coexist. Hover tooltip with date + per-series values is the deep-read affordance.
5. **Sortable table** — same data tabular for users who don't trust eyeballs. Date column + one column per tier.
6. **Notes block** — 5 honest disclaimers (UTC vs local, 2h latency, pricing pointer, by-seconds-vs-by-minutes caveat, 1-year retention). Builds trust by saying what's true rather than hiding it.
7. **"Looking for in-depth analytics?" CTA** — links to Agora Analytics (premium product). Lives at the bottom so it doesn't compete with the data, but stays discoverable.

The **No Data** variant keeps the same skeleton — same hero with `0 MIN`, same notes, same CTA. The chart area becomes a single empty rectangle saying "No Data". No new layout — same map of the territory, just empty cells.

---

## How it was adapted for Studio_X

Studio_X has the same Console product surface area (RTC: Voice/Video/ILS/Chat/Signaling) **plus** Agents (Conv AI). The Console's Usage page was RTC-only. Three adaptations:

### 1. Product as a fourth filter dimension

Added `Product` dropdown between Period and Project: `All / Agents (Conv AI) / Voice (Audio) / Video / Interactive Live Streaming / Chat / Signaling`. Default `All` so new users see combined usage. This matches the [`/organize` decision from analytics-rebuild.md](analytics-rebuild.md#organize--how-a-new-user-views-agent-and-rte-usage-from-this-screen) — product is a filter, not a destination.

### 2. Tier strip includes Agent Sessions

Added an `Agent Sessions` tier to the colored-dot strip (primary blue, `SESSIONS` unit). Sits at the front of the strip since Agents are Studio_X's center of gravity. RTC tiers (Video SD/HD/FHD/2K, Audio, Chat) follow. The unit varies honestly per tier (SESSIONS / MIN / DAU) — same pattern as Console.

### 3. Cross-link to Cost tab (not just Billing)

The Console page links to Billing for the invoice ledger. Studio_X has a sibling **Cost tab** in Analytics (the third tab) that shows spend-against-activity in real time. Added a `Going deeper on $` note above the bottom CTA pointing to both. Billing is still linked (for actual invoices), but the Cost tab is the natural next step for someone asking *"what are these minutes buying me?"*

### 4. Visual adaptation

- shadcn design tokens (no hardcoded colors except the tier dots, which need to be perceptually distinct)
- Lucide icons replace emoji (download icon on Export CSV, chevron-down on sortable headers, external-link on the bottom CTA)
- Light/dark mode supported automatically via tokens (Agora Console figma is dark-only; Studio_X follows system preference)
- Filter row uses our `.field` + `.input` pattern with shadcn-styled select chevrons

What we kept identical to Console:
- The BIG number hero on the top right
- The colored-dot tier KPI legend doubling as chart legend
- Per-tier units in the legend itself
- The 5-bullet honest notes block at the bottom
- The "Visit Agora Analytics" external-link CTA at the bottom

---

## Component primitives introduced

Reusable for other surfaces:

| Primitive | Class | Where used |
|---|---|---|
| BIG-number hero | `.usage-hero` + `.usage-num` + `.usage-unit` | Any "total" surface (could replace the credits block long-form view) |
| Tier KPI strip | `.usage-tiers` + `.tier-kpi` | Any per-category breakdown alongside a chart |
| Multi-series line chart | `.usage-chart-wrap` + `.usage-chart` | Could be used in Realtime Services for per-feature trend |
| Hover tooltip card | `.usage-tooltip` + `.tip-row` | Any chart that benefits from a multi-series readout |
| Sortable data table | `.usage-table` (distinct from `.agent-table` which is row-oriented) | Per-time-bucket tables anywhere |
| Notes block | `.usage-notes` | Bottom-of-page disclaimers / honest caveats |
| Upsell CTA card | `.usage-cta` | Promoting paid features without dark-pattern urgency |

---

## States covered (vs Agora Figma's 11 frames)

| Console frame | Studio_X coverage |
|---|---|
| 1 Default landing | ✓ shipped |
| 1.1 With breakdown | ✓ shipped (default state — breakdown ON since it's more informative) |
| 2/2.x Dropdown selection open | Existing select element handles natively |
| 3 Project & Feature selected with view breakdown | Filter row supports it; data would re-query in real product |
| 4.0 Tablet 744 / 4.1 Desktop 1440 | Responsive — filters wrap, tiers wrap, table scrolls horizontally on narrow screens |
| 5/5.1 Period dropdown / Custom | Period select with "Custom range…" option (full date-picker is `/specify` work) |
| **6 No Data** | Needs to be implemented as a toggleable state — same skeleton with `0 MIN` + empty chart frame + same notes/CTA. Tracking as P1. |
| Excess Usage Notification (nested in Agora CHAT subsection) | Pattern documented in [`analytics-rebuild.md` /fortify state #7](analytics-rebuild.md#state-inventory-12-states-this-screen-will-encounter); needs implementation alongside billing alerts |

---

## What's NOT in the wireframe but should ship

These were in the Agora Figma or are necessary for production:

1. **Real-time data freshness indicator** — "Updated 2 min ago" timestamp next to the BIG number. Honest about latency.
2. **No-data state** — when toggled (use a `?state=empty` URL flag or a "View no-data state" toggle button like Home has). Currently the wireframe always shows populated data.
3. **Custom date range picker** — the "Custom range…" option in Period needs a real date picker, not a select. (Out of scope this pass — `/specify`)
4. **Sort interaction** — column headers have chevron icons but don't actually re-sort. Wire up in real implementation.
5. **CSV export** — button is wired to a toast; real implementation generates a CSV from the filtered view.
6. **Excess-usage banner** — when usage approaches plan cap, surface an inline warning (with upgrade CTA routing to Billing › Plans).
7. **Project switcher pre-fill** — if user is currently in `My first project`, the Project filter should default to that, not `All`.
8. **Tooltip on hover** — currently a static tooltip card is shown for the wireframe. Real implementation tracks mouse X position and updates the tooltip + vertical guideline.

---

## Open question

The Agora Console uses **log-scale Y-axis** (0 / 100 / 1k / 10k / 100k) because tier usage spans orders of magnitude — Chat at 106 DAU vs Audio at 933k minutes both need to be visible on the same chart. **Should Studio_X keep log scale, or split into two charts?**

Two charts (one for "minutes" series, one for "user/session count" series) is more honest about heterogeneous units. One log-scale chart is denser and matches Console UX. Recommend deciding after the team has seen real customer data — log scale works if 80% of users have all tiers active; two charts work better if most users have only one product family.

This is a `/measure` follow-up: instrument both views in an A/B once live.
