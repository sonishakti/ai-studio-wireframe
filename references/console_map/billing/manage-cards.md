# Manage Cards
**URL**: https://console.agora.io/billing/manage-cards
**Section**: Billing
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Add and manage payment cards for auto-pay billing.

## Content Hierarchy

- **"Back To Billing"** link
- **Heading**: "Manage Cards"
- **"Add a Card"** button ⚠️
- **Table columns**: Card | Expiration | Status | Action
- **Empty state**: "No Cards Added"

## "Add a Card" Modal (observed)

Same modal as billing page "Add New Card":
- **Title**: "Add New Card"
- **Fields**: Card Number | Name on Card | Expiration Date | CVC | "Set as default" checkbox
- **Actions**: "Continue" ⚠️
- **Footer**: Terms of Service + Privacy Policy links

## Interactive Elements

- "Back To Billing" link → /billing
- "Add a Card" button ⚠️ — opens "Add New Card" modal (same as on /billing)

## Notes
- Account has no saved payment cards.
- This page is reached via the Billing section.
