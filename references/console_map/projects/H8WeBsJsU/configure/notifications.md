# Configure — Notifications
**Project**: Default Project (`H8WeBsJsU`)
**URL**: https://console.agora.io/project-management/H8WeBsJsU/notifications
**Section path**: Configure > Notifications
**Accessed**: 2026-05-21T00:00:00Z

## Features in this section

### Notifications (Webhook Event Callbacks)
- **State**: enabled (badge: "Active")
- **Toggle**: not present at top level
- **Plan gate**: none visible
- **Description**: none
- **Notes**: Page lists 8 collapsible webhook service sections. Each service has a shared Event configuration structure (see child settings below). All services show a masked Secret field. 6 of 8 are currently expanded showing Event 01 configurations.

---

### Service Sections (accordion)

| # | Service Name | Expanded | Event 01 Status Switch |
|---|---|---|---|
| 1 | RTC Channel Event Callbacks | yes | on |
| 2 | Media Push Restful API | no (collapsed) | — |
| 3 | Media Pull | yes | on |
| 4 | Cloud Recording | yes | on |
| 5 | Conversational AI Engine | yes | on |
| 6 | Real-time STT v7.x | yes | on |
| 7 | Real-time STT v5.x/v6.x | no (collapsed) | — |
| 8 | Media Gateway | yes | on |

---

### Per-Service Event Configuration (repeated pattern for each expanded section)

- **Secret**: masked display (`••••••••••`)
- **Event 01** label + expandable config:
  - "Delete event configuration" button ⚠️
  - "Enabled" status indicator
  - Event: select dropdown (no value selected — "Select" placeholder)
  - Receiving Server Region: dropdown
  - Receiving Server URL Endpoint: text input (placeholder: "Url Endpoint")
  - Status toggle: on (all expanded events)
  - Whitelist: checkbox + label
  - Health Check: "Check" button
  - "Add Another Event" button — adds an additional event config row
  - "Apply Settings" button ⚠️ — saves the notification configuration

## Interactive Elements (observed, not activated)

- 8 accordion expand/collapse buttons (service names)
- "Delete event configuration" buttons ⚠️ — removes event config
- Event selector dropdowns — selects event type
- Receiving Server Region dropdowns — sets geographic region
- Receiving Server URL Endpoint text inputs — webhook URL
- Status toggle switches (all on) ⚠️
- Whitelist checkboxes
- "Check" (Health Check) buttons
- "Add Another Event" buttons
- "Apply Settings" buttons ⚠️ — saves settings

## Notes
- Default quota: 20 PCW. Sidebar note for higher quota: contact support.
- "How to Configure?" help link points to `#` anchor on same page (no external doc).
- Secret values are masked for all services.
