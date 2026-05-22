# Notification Preferences
**URL**: https://console.agora.io/settings/notification-preferences
**Section**: Settings
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Configure which notification channels (Email, Text Message, Agora Console/Dashboard) are enabled for each notification category.

## Content Hierarchy

- **Tab navigation**: Account | Teams and Members | Notifications Preferences (active) | SSO Management
- **Heading**: "Notification"
- **Table**: Type | Email | Text Message | Agora Console
  - Header note: Text Message column has "Add Phone Number" link (no phone set)
  - Rows with checkboxes (Email, Text, Dashboard):
    | Type | Email | Text | Dashboard |
    |------|-------|------|-----------|
    | Account | ✓ (editable) | ✓ (editable) | ✓ (disabled/fixed) |
    | Billing | ✓ (disabled/fixed) | ✓ (disabled/fixed) | ✓ (disabled/fixed) |
    | Product | ☐ (editable) | ☐ (disabled — no phone) | ✓ (disabled/fixed) |
    | Promotion | ☐ (editable) | ☐ (disabled — no phone) | ✓ (disabled/fixed) |
    | Operation | ✓ (editable) | ✓ (editable) | ✓ (disabled/fixed) |
    | Tickets | ✓ (editable) | ☐ (disabled) | ✓ (disabled/fixed) |

## Interactive Elements (observed, not activated)

- Checkboxes for Email/Text per notification type (editable rows: Account, Product, Promotion, Operation, Tickets)
- Billing checkboxes are disabled (always-on)
- "Add Phone Number" link (Text Message column header) → /settings/profile
- Dashboard checkboxes are all disabled (always-on)

## Notes
- Text Message column is mostly disabled because no phone number is set on the account.
- Billing notifications cannot be disabled (required).
- Dashboard/Agora Console notifications are always on (cannot be disabled).
