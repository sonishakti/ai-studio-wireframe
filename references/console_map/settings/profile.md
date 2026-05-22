# Profile (Account Settings)
**URL**: https://console.agora.io/settings/profile
**Section**: Settings
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Manage personal account profile including name, contact details, password, and third-party login method connections.

## Content Hierarchy

- **Tab navigation**: Account (active) | Teams and Members | Notifications Preferences | SSO Management
- **Section: Profile**
  - First Name input (required ✱)
  - Last Name input (required ✱)
- **Section: Security**
  - Phone Number: "Add Phone Number" button ⚠️
  - Email: "Update Email ID" button ⚠️
  - Password: "Update Password" button ⚠️
- **Section: Login Methods**
  - Google: "Disconnect" button ⚠️ (currently connected)
  - Github: "Connect" button ⚠️ (not connected)
  - WeChat: "Connect" button ⚠️ (not connected)

## "Update Phone Number" Modal (observed)

- **Title**: "Update Phone Number"
- **Fields**:
  - Country code selector (full international country list, defaults to "International")
  - Phone number input (`type="tel"`, placeholder: "Enter phone number")
- **Actions**: "Cancel" | "Continue" ⚠️

## "Change Password" Modal (observed)

- **Title**: "Change Password"
- **Fields**:
  - Old Password (`type="password"`, `name="current"`, required ✱)
  - New Password (`type="password"`, `name="new"`, required ✱)
  - Confirm New Password (`type="password"`, `name="verify"`, required ✱)
- **Actions**: "Forgot Password?" button | "Cancel" | "Update" ⚠️

## "Update Email ID" Button Behavior (observed)

Does **not** open a modal. Clicking it produces no immediate UI change — likely triggers a verification email to the current address.

## Interactive Elements

- "Add Phone Number" button — opens "Update Phone Number" modal
- "Update Email ID" button ⚠️ — no modal; likely sends verification email
- "Update Password" button — opens "Change Password" modal
- "Disconnect" (Google) ⚠️ — state-changing, not activated
- "Connect" (Github, WeChat) ⚠️ — initiates OAuth, not activated

## Notes
- Profile page has inline-editable First Name / Last Name fields (always visible, no separate "Edit" button needed).
- Account is authenticated via Google (only connected login method).
- Settings tabs: /settings/profile, /settings/teams-members, /settings/notification-preferences, /settings/sso-management.
- Settings accessed from the user profile menu (not main sidebar).
