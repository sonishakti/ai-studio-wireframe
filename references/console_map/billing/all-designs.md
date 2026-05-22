# Billing All Designs (UI Preview)
**URL**: https://console.agora.io/billing/all-designs
**Section**: Billing
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Internal UI design preview page showing multiple billing banner/alert states side-by-side. Not a user-facing feature page — serves as a design system reference for billing UI states.

## Content Hierarchy

The page renders several billing UI state variants stacked vertically:

1. **Billing failed banner**: "Billing failed for the period of Apr 2023. Pay Now to ensure zero downtime." — "Pay Now" button ⚠️
2. **Next Payment block**: Next Payment date shown as "06 Jun, 2026" (×2 variants)
3. **Payment Failed block**: "Auto-pay failed on DD-MM-YYYY via Master Card **** 9999. Pay now to avoid project suspension." — "Pay Now" button ⚠️
4. **Next Payment block**: "06 Jun, 2026" (third variant)
5. **Billing section tabs**: Bills | All Transactions | Payment Method | Billing Information
6. **Name on Card**: "-"
7. **Billing Address**: (empty)

## Notes
- This is a developer/designer preview page showing UI states with placeholder/mock data.
- Data shown (e.g. "Apr 2023", "Master Card **** 9999") is mock/placeholder, not real account data.
- Not linked from main navigation — accessed via direct URL from build manifest.
