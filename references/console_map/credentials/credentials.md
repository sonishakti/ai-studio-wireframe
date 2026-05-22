# Agora Analytics Credentials
**URL**: https://console.agora.io/credentials
**Section**: Developer Toolkit (inferred — sidebar item)
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Manage Customer ID and Customer Secret key pairs for Agora Analytics Embedded (AA Embedded). These credentials are required to embed Agora Analytics dashboards into external applications.

## Content Hierarchy

- **Heading**: "Agora Analytics Credentials"
- **Description**: "You need the ID and secret below to use AA Embedded."
- **"Add Credential"** button ⚠️
- **Table**:
  - Columns: Customer ID | Customer Secret | Action
  - Empty state: "You don't have any ID and secret. Add one to start."
- **Notes**:
  1. To learn more about Agora Analytics Embedded, visit Agora Analytics Embedded Document (link)
  2. A maximum of 10 active keys/secrets are permitted per account

## "Add Credential" Confirmation Dialog (observed)

Clicking "Add Credential" opens a confirmation dialog **before** creating anything:

- **Title**: "Create New Agora Analytics Credential"
- **Body**: "A new credential will be created and automatically downloaded. The secret will not be stored or displayed again. Please keep the downloaded file in a safe place."
- **Actions**:
  - "Cancel" — dismisses without creating
  - "Create & Download" ⚠️ — generates credential and downloads the secret file

This differs from RESTful API ("Add a Secret" creates immediately without a dialog).

## Interactive Elements

- "Add Credential" button — opens confirmation dialog above
- "Create & Download" ⚠️ (in dialog) — generates and downloads credential

## Notes
- Account has no credentials (fresh account).
- The secret is auto-downloaded as a file and never shown again in the UI.
- This page is for AA Embedded specifically, not for general REST API credentials.
- Maximum of 10 active credential pairs per account.
