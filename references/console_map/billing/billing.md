# Billing
**URL**: https://console.agora.io/billing
**Section**: Billing
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Central billing page showing account balance, billing information, payment methods, invoice history, and transaction history. Provides access to add payment cards and manage billing details.

## Content Hierarchy

- **Heading**: "Billing"
- **Account Balance widget**
  - Balance: $0.00 (Available Balance)
  - "Top-up Wallet" button ⚠️
  - "Add Card" button ⚠️
  - "Customise options" kebab button
- **Billing Information section**
  - "Add Billing Information" button
  - Name on Card: — (not set)
  - Billing Address: (not set)
- **Payment Method section**
  - "Credit Card" tab button
  - "Bank Transfer" tab button
  - "Card for Payment" sub-section: "No Cards Added"
  - "Add New Card" button ⚠️
- **Your Invoices section**
  - "View All" link → /billing/invoices
  - Table columns: Issue date | Billing Period | Due Date | Amount | Status | Action
  - Current state: "No Invoices"
- **Your Transactions section**
  - "View All" link → /billing/transactions
  - Table columns: Issue date | Transaction ID | Transaction Type | Amount | Balance
  - Current state: "No Transactions"
- **NOTES section** (billing policy notes):
  1. For customers under contract, billing will be processed according to contract terms.
  2. Monthly bills available on 2nd of following month; amount reflected in balance on 6th.
  3. Balance negative >5 days → account auto-suspended; reactivated upon full payment.
  4. Bill payment status calculated from balance, recharges, deductions, transfers, etc.
  5. Payments applied chronologically (oldest first); refunds in reverse order.
  6. Bank transfer: select "OUR" to cover bank charges on both sides.
  7. Balance and outstanding bills may have occasional delays in status updates.
  8. "Billing Policies" link → https://docs.agora.io/en/voice-calling/reference/billing-policies

## "Add New Card" Modal (observed)

Triggered by "Add Card", "Add Billing Information", and "Add New Card" buttons — all open the same modal.

- **Title**: "Add New Card"
- **Fields**:
  - Card Number (text input)
  - Name on Card (text input, `name="nameOnCard"`)
  - Expiration Date (text input)
  - CVC (text input)
  - Checkbox: "Set this card as default for future payments" (`id="checkboxCard"`)
- **Actions**: "Continue" button ⚠️
- **Footer text**: "By clicking on continue you agree to our Terms of Service. For more info on our data processing see our Privacy Policy."
- No cancel/close button visible in DOM — dismissible via Escape key or clicking outside.

## "Bank Transfer" Tab Content (observed)

When "Bank Transfer" tab is selected, the Payment Method section shows Agora's wire transfer details:

- **Note**: CID: 200027986 — add to bank transfer's "Notes" field
- **Beneficiary's Name**: AGORA LAB INC
- **Beneficiary's Account Number**: 120024888
- **Beneficiary's Bank**: HSBC Bank USA NA
- **Swift Code**: MRMDUS33
- **Routing Number**: 021001088
- **Bank Address**: 66 Hudson Blvd. New York, New York 10001

## Interactive Elements

- "Top-up Wallet" button ⚠️ — **disabled** (requires a payment card on file first)
- "Add Card" / "Add Billing Information" / "Add New Card" buttons ⚠️ — all open the "Add New Card" modal above
- "Credit Card" / "Bank Transfer" tab buttons — switches payment method view (no state change)
- "View All" (Invoices) → /billing/invoices
- "View All" (Transactions) → /billing/transactions
- "Billing Policies" link → https://docs.agora.io/en/voice-calling/reference/billing-policies

## Notes
- Account has $0.00 balance, no cards, no invoices, no transactions — fresh/new account.
- "Top-up Wallet" is disabled until a card is added.
- "Add Billing Information" and "Add New Card" are synonymous — both open the card entry modal. Billing address is derived from the card.
- Sub-pages: /billing/invoices, /billing/transactions, /billing/manage-cards, /billing/withdraw-transactions
