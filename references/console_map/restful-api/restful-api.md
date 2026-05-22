# RESTful API
**URL**: https://console.agora.io/restful-api
**Section**: Developer Toolkit (inferred — sidebar item)
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Manage Customer ID and Customer Secret key pairs for authenticating Agora RESTful API calls. These credentials are used in server-side integrations with Agora's cloud APIs.

## Content Hierarchy

- **Heading**: "RESTful API"
- **"Add a Secret"** button ⚠️
- **Table**:
  - Columns: Customer ID | Customer Secret | Note | Action
  - Per-row actions: **Download** (Customer Secret) | **Add Note** | **Delete icon** ⚠️ (trash icon button, no label)
  - Empty state: "No Restful API keys found"
- **Notes section**:
  1. "You need the ID and secret below to use Agora RESTful API"
  2. "RESTful API, please visit Console RESTful API Document." (link → Agora docs)
  3. A maximum 10 active keys/secrets are permitted per account

## "Add a Secret" Behavior (observed)

⚠️ **No confirmation modal** — clicking "Add a Secret" **immediately generates** a new Customer ID + Customer Secret pair. The secret is shown once and must be downloaded via the "Download" button; it is not stored or redisplayed. The button is NOT a form that opens first.

## Interactive Elements

- "Add a Secret" button ⚠️ — generates a key pair immediately (no modal, no confirmation)
- "Download" button per row — downloads the Customer Secret file
- "Add Note" button per row — (modal not tested; likely opens an inline note field)
- Delete icon button per row ⚠️ — removes the key pair

## Notes
- ⚠️ **Mapping note**: "Add a Secret" was clicked twice during the observation pass, unintentionally creating 2 key pairs. Customer IDs have been redacted ([REDACTED]). The account owner should delete these keys if not needed.
- "Add a Secret" creates keys directly with no intermediate form or modal — unlike most other "Add" buttons on the console.
- The Customer Secret is only available for download at creation time; it cannot be retrieved later from the console.
- Maximum of 10 active credential pairs per account.
- The "Add a Secret" button is labeled differently from the heading "RESTful API" — the page heading describes the section, the button action is "Add a Secret".
