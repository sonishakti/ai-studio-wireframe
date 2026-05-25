# Billing — End-to-End Journey Map

**Generated:** 2026-05-26
**Surface:** Account › Billing (rebuilt from Figma node 142-7864)
**Tabs:** Overview · Transactions · Invoices · Payment Methods
**Separate destinations:** `/billing-plans` (Plans + Add-ons), `topupModal`, `changePlanModal`
**Personas:** P1 (hustler/dev), P2 (PM), P3 (TAM/team lead), P4 (EM/founder)

This document maps the ten user journeys the rebuilt Billing surface must support. Each journey identifies the entry, path, exit, and the personas it serves. Cross-links to other surfaces (Monitor, Home, Notification Center) are called out where load-bearing.

---

## Journey shape (per the Intent /journey lens)

| | What it means here |
|---|---|
| **Entry** | Where the user enters the flow — a click, a notification, a landing |
| **Path** | The screen sequence and decisions inside the flow |
| **Exit** | The success/recovery state the flow lands in |
| **Failure** | What "broken" looks like and the recovery path |

---

## J1 — Top-up wallet

| | |
|---|---|
| **Personas** | P1, P2, P3 (anyone whose balance is low) |
| **Entry** | Billing › Overview › "Top-up Wallet" button **OR** Payment Methods tab › Wallet card › "Top-up Wallet" **OR** any place balance shows $0 |
| **Path** | Click → `topupModal` opens → pick amount (preset: $50/$200/$500 or custom) → confirm payment method (Visa •••• 6328 default) → "Pay" → 200ms processing → toast "Wallet topped up · $200 added" |
| **Exit** | Overview Wallet card refreshes: Available Balance updates · Transactions tab will show a new "Wallet top-up" row tomorrow |
| **Failure** | Card declined → modal stays open, inline error "Your card was declined. Try another card or contact your bank." Recovery: switch card → retry |
| **Voice** (LEARNINGS §11) | "Pay" not "Submit Payment Now". Decline copy names the vendor: "Visa rejected this charge." |

## J2 — Pay an overdue invoice

| | |
|---|---|
| **Personas** | P2 (gets the bill), P3 (renewals), P4 (sees the alert) |
| **Entry** | Billing › Invoices row with Status=Failed/Issued → "Pay Now" **OR** Home › Health alert "Invoice INV-2026-04 failed — $18.60" → click |
| **Path** | "Pay Now" → modal opens with invoice summary, default payment method, total due → "Pay" → processing → success |
| **Exit** | Invoice row updates Status to Paid · Wallet balance recalculated · agents resume if they were paused |
| **Failure** | Same card-decline path as J1. If the user has no valid card → modal CTA "Add a card →" deep-links to Payment Methods tab |
| **Cross-link** | If account was suspended due to this invoice, the suspended-state takeover (LEARNINGS §10b Home page modes) was blocking everything; J2 success exits that state |

## J3 — Upgrade plan

| | |
|---|---|
| **Personas** | P3 (TAM), P4 (founder) — usually triggered by quota pressure |
| **Entry** | Billing › Overview › Current Plan card › "Upgrade Plan" button **OR** Home › Workspace usage tile › "Manage plan →" **OR** the Pro/Business row on `/billing-plans` page |
| **Path** | "Upgrade Plan" → `billing-plans` screen → review Available Plans (FREE/STARTER/PRO/BUSINESS) → click "Upgrade" on a row → `changePlanModal` opens with billing preview (prorated charge, new quota, what changes) → "Confirm upgrade" → success |
| **Exit** | Overview Current Plan card: STARTER badge → PRO badge · quota bar rescales (e.g. 64% used of 50K → 16% used of 200K) · Transactions tab will show the prorated charge |
| **Failure** | Insufficient wallet balance → modal CTA "Top-up wallet first →" routes to J1 then resumes J3 |
| **Compliance note** | EU AI Act / GDPR — confirm upgrade screen must show new T&Cs link, change is reversible per CA click-to-cancel symmetry |

## J4 — Inspect usage trend (cross-surface flow)

| | |
|---|---|
| **Personas** | P1 mid-debug, P3 doing quota check |
| **Entry** | Billing › Overview › Current Plan card › "View Usage →" link **OR** Home › Workspace usage tile › "View billing & quota →" (reverse) |
| **Path** | "View Usage →" routes to `Monitor › Analytics › Usage` (project-scoped per the current project chip) — full chart, per-day granularity, feature breakdown |
| **Exit** | User is now in Monitor — they can keep drilling (Cost tab, Performance tab) or jump back to Billing via the "Going deeper" note at the bottom of Usage |
| **Cross-link** | This is the seam between Billing (financial) and Monitor (operational). The Current Plan quota digest is the ambient "where am I against my cap" view; Monitor › Usage is the diagnostic view. |

## J5 — Add / replace a credit card

| | |
|---|---|
| **Personas** | All — required at signup, again at expiry |
| **Entry** | Billing › Payment Methods tab › "Add Card +" button **OR** Overview Card 3 › kebab menu on the Default Card |
| **Path** | "Add Card" → modal (wireframe stub) → card details form → save → success |
| **Exit** | Card list (Payment Methods tab) shows the new row · if it's the first card, becomes Default automatically · Overview Card 3 updates |
| **Failure** | Invalid card / Luhn check fails → inline error on the modal field. No silent dismissal. |
| **Compliance** | PCI — never log full card number. Last-4 + brand only on display. |

## J6 — Download an invoice

| | |
|---|---|
| **Personas** | P2 (filing for finance), P3 (audit) |
| **Entry** | Billing › Invoices row with Status=Paid (or Failed, retroactively) › "Download" button |
| **Path** | Click → PDF generated server-side → browser download triggered |
| **Exit** | PDF lands in Downloads. No state change in Studio. |
| **Cross-link** | Bulk download? Future flow — Export CSV via the top-right icon in the Invoices toolbar gets the ledger; PDF per-row is for filing |

## J7 — Audit a single transaction

| | |
|---|---|
| **Personas** | P3, P4 — reconciliation or "what was this charge?" |
| **Entry** | Billing › Transactions row click (future drill-in — currently stub) |
| **Path** | Row click → modal/drawer with transaction details: ID, method, amount, balance impact, related invoice/refund/top-up |
| **Exit** | Close drawer · Transactions table preserved · breadcrumb unchanged |
| **Filter** | Withdrawals + Refunds are visible via the Type filter (Show All / Credit Card Payment / Bank Transfer / Monthly Bill / Withdrawal / Refund) — Withdrawals is no longer a separate tab |

## J8 — Wire payment by bank transfer

| | |
|---|---|
| **Personas** | P3 (enterprise contracts), P4 (large prepay) |
| **Entry** | Billing › Payment Methods tab › Bank Transfer section (bottom) |
| **Path** | (1) Copy CID (488406) into bank-app "Notes" field — CRITICAL, warning alert. (2) Copy each beneficiary field (Name, Account #, Bank, Swift, Routing, Address) → bank-app form. (3) Execute the wire externally. (4) Wait 1–5 business days for Agora to credit. |
| **Exit** | Transactions tab shows "Bank Transfer" row when settled · Wallet balance updates · CID-less transfers may take longer or be disregarded (warning copy is load-bearing) |
| **Failure** | User forgot the CID — the warning alert says "transactions made without providing this information will have to be disregarded." Recovery is manual: contact Agora support with proof of wire. |
| **Voice** | Be explicit about consequence (disregarded transfers), not hedging. |

## J9 — Bill-shock prevention (LEARNINGS H5 — retention driver #1)

| | |
|---|---|
| **Personas** | All — applies whenever quota burn forecasts overage |
| **Entry** | (Passive) Notification bell → "Approaching cap" alert **OR** (passive) Home › Health alert (only when ≥80% cap) |
| **Path** | Alert → click → routes to Billing › Overview · Current Plan card scope-stamped with quota progress bar in warning state if ≥80% · two action paths: Upgrade Plan (J3) or top-up (J1) for overage cap |
| **Exit** | Quota cap restored · forecast shows safe burn rate · alert cleared |
| **Anti-pattern guardrail** | This is NOT a "buy now" upsell. Show the burn rate honestly. Let the user pick downgrade-usage as a path too (`View Usage` link → Monitor → identify the spiking agent) |
| **LEARNINGS** | §10b Home page block #2 (Health alerts) — never render an empty "✓ no alerts" trophy. Show only when triggered. |

## J10 — Resume a suspended account

| | |
|---|---|
| **Personas** | All — applies when balance is negative >30 days OR contract terms hit |
| **Entry** | Login → suspended-state takeover (replaces Home, per LEARNINGS §10b Home page mode 3) |
| **Path** | "Pay balance & resume →" → routes to Billing (Pay Now on the overdue invoice or top-up wallet to cover) → J1 or J2 → success → suspension lifted |
| **Exit** | Account unlocked · agents resume serving · Home › default mode restored |
| **Failure** | No valid payment method → must add one (J5) before J2/J1 can complete. Suspended-state UI must not soft-lock the user. |
| **Compliance** | Per LEARNINGS §3 — HIPAA / SOC 2 / GDPR. Suspension reason must be visible. Recovery path must not be hidden. |

---

## Cross-surface seams (where Billing meets the rest of the app)

```
Monitor › Analytics › Cost      ↔  Billing › Overview (Current Plan quota)
Monitor › Analytics › Usage     ↔  Billing › Overview "View Usage →" link
Home › Workspace usage tile     →  Billing › Overview ("View billing & quota →")
Home › Health alerts            →  Billing › Invoices (Failed row) OR Overview
Notification Center › Billing   →  Billing › Invoices (filtered to event)
Suspended-state takeover        →  Billing (single recovery path)
Agents › agent-paused state     →  Billing › Overview (balance is the cause)
```

---

## Mode-aware (responsive / mobile)

The current wireframe is desktop-first. Per `/transpose` discussions:
- Billing › Transactions and Invoices tables → mobile: cards (not tables), one column, primary action on each row
- Bank Transfer 6-field grid → mobile: 1-column stacked, copy-button still visible (mobile-critical for the wire flow)
- Wallet hero row → mobile: stack vertically (balances above actions)

Deferred to a `/transpose` pass.

---

## Accessibility considerations (per /include)

- Status badges (Issued / Failed / Paid) MUST have non-color cues — Figma uses color only. Add icon (✓ / ⚠ / —) inside the badge or text-only fallback.
- Currency amounts use Space Mono — needs a fallback stack to system mono for users with limited fonts.
- Copy-input fields' trailing copy buttons need accessible labels ("Copy CID 488406 to clipboard") not just the icon.
- Bank Transfer warning alert: `role="alert"` so screen readers announce on render.
- Pagination "…" ellipsis should not be a button — `aria-hidden="true"` on the static span.

Deferred to a dedicated `/include` pass.

---

## What was NOT decided here

These are explicitly out of scope of this journey doc and need separate work:
- The **billing modal contents** themselves (topupModal, changePlanModal) — wireframe stubs exist, copy-locked via `/articulate` later
- The **suspended-state takeover screen** — exists in `screen[data-screen="home"]` (Home page mode 3) but the recovery copy needs `/articulate` pass
- **Invoice PDF format** — engineering decision (currently toast stub)
- **Bank transfer reconciliation rules** — back-office concern, surfaced only via the disclaimer copy
- **Currency localization** — all $ today; multi-currency is a `/localize` task
- **Tax info** — Figma doesn't show this; deferred until enterprise pilot users surface the need

---

## Open questions for the team

| # | Question | Blocks |
|---|---|---|
| BJ-1 | Should Pay Now on a Failed invoice retry the same card or always prompt method selection? | J2 |
| BJ-2 | Is the prorated upgrade preview a hard server quote or an estimate? Honesty constraint (LEARNINGS §11) — if estimate, must say so. | J3 |
| BJ-3 | Wallet top-up minimum and maximum? Default amounts? | J1 |
| BJ-4 | Bank transfer reconciliation SLA — what do we tell the user about timing? | J8 |
| BJ-5 | When account is suspended, does the user still get notification emails? | J10 |
| BJ-6 | Quota warning threshold — 80% (per LEARNINGS) or product-tier-specific? | J9 |
