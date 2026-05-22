# RTC Pre-paid Plans
**URL**: https://console.agora.io/subscriptions/rtc-plans
**Section**: Subscriptions
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Manage RTC pre-paid subscription plans and top-up packages. Shows plan tiers with pricing, current subscription status, purchase history, and policy notices.

## Content Hierarchy

- **Heading**: "RTC Packages"
- **Tab navigation**: Monthly Packs | Top-Ups
- **Monthly Packs tab** (URL: `?tab=monthly`):
  - **Plan cards** (left to right):
    | Plan | Price/mo | Original | Savings | Minutes | Bonus | Status |
    |------|----------|----------|---------|---------|-------|--------|
    | FREE | $0 | — | — | 10K standard | — | CURRENT / Subscribed |
    | STARTER | $45.99 | $49.5 | 7% | 50K standard | +3,500 | Upgrade button ⚠️ |
    | PRO | $133.99 | $148.5 | 10% | 150K standard | +15K | Upgrade button ⚠️ |
    | BUSINESS | $339.99 | $396 | 14% | 400K standard | +56K | Upgrade button ⚠️ |
    | BUSINESS PLUS | $1,217.99 | $1,485 | 18% | 1.5M standard | +270K | Upgrade button ⚠️ |
  - All plans include: Media Encryption, Analytics Starter Plan, Advanced Audio Processing
  - FREE additionally has: Overuse suspension
  - Paid plans have: Overage Post-Payment
  - **Enterprise Package**: "Design a custom package – available for businesses with higher volume requirement or unique business models." → "Contact Sales" button
  - **Purchase History section**:
    - Table columns: Plan Name, Unit Price, Purchase Date, Effective Date, Expiration Date, Status
    - Current row: RTC Free Package | $0 | 2026-05-21 | 2026-05-01 | 2026-06-01 | ACTIVE
  - **Purchase Notice**:
    1. Activation & Renewal: activated on payment, auto-renews 48 hours before end-of-month expiration unless canceled
    2. Usage & Duration: covers audio/video usage within same calendar month; overages covered by top-up packages
    3. Conversion Rules: time converted based on tiered rates for voice/video calls and live streaming; see documentation
    4. Upgrading: takes effect immediately, cost/quota extended to beginning of current month; negative balance charged first then package fee
    5. Downgrading: takes effect when current package expires (if requested before 48hr auto-renewal window)
    6. Validity: included minutes expire at end of current month

- **Top-Ups tab** (URL: `?tab=top-up`):
  - **Top-up package cards**:
    | Package | Price | Original | Savings | Minutes | Validity |
    |---------|-------|----------|---------|---------|---------|
    | TOP-UP PACKAGE 25K | $23.5 | $24.75 | 5% | 25K standard | 1 year |
    | TOP-UP PACKAGE 250K (BEST VALUE) | $230 | $247.5 | 7% | 250K standard | 1 year |
    | TOP-UP PACKAGE 1000K | $891 | $990 | 10% | 1M standard | 1 year |
  - Each package: "Add to your current plan anytime", quantity selector (default: 1), "Buy Now" button ⚠️
  - **Enterprise Package**: "Contact Sales" button
  - **Purchase History section**:
    - Table columns: Plan Name, Unit Price, Purchase Date, Effective Date, Expiration Date, Usage
    - Current state: N/A (no top-up purchases)

## Interactive Elements (observed, not activated)

- "Monthly Packs" / "Top-Ups" tab buttons
- "Upgrade" buttons ⚠️ (×4 monthly plans)
- "Contact Sales" button (Enterprise)
- Quantity input field (Top-Ups)
- "Buy Now" buttons ⚠️ (×3 top-up packages)

## Notes
- Account is currently on FREE plan (RTC Free Package, activated 2026-05-21, expires 2026-06-01).
- Minutes in monthly plans are "standard minutes" which convert at tiered rates.
- Top-up packages valid for 1 year from purchase (unlike monthly plans which expire at month end).
- URL query parameter controls active tab: `?tab=monthly` or `?tab=top-up`.
