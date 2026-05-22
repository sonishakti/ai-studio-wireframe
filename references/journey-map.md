# Journey Map — Console → Studio_X (non-core surfaces)

**Generated:** 2026-05-22
**Scope:** Missing or thin journeys that bring Console functionality into Studio_X. Excludes Studio-core surfaces (Agents, Integrations, Phone Numbers, Campaign, Analytics, Call History, Session History) per direction.
**Target:** [wireframes/app.html](../wireframes/app.html)

Each journey lists entry, key steps, exit, edge cases, and rationale. Implementation lives in the wireframe; this is the design rationale.

---

## 1. Realtime Services — enable an add-on

**User context.** Builder is configuring an agent and discovers the agent needs Cloud Recording / Media Push / RT-STT / etc. They land here from: (a) the sidebar PROJECT › Realtime Services link, (b) a "Browse extensions →" CTA in Project Settings, or (c) a contextual prompt inside the agent builder.

**North-star metric.** Time from "I need recording" to "recording is enabled in this project" ≤ 30 seconds.

**Flow.**

```
[Sidebar PROJECT › Realtime Services]
   │
   ▼
[Gallery — two sections]
   ├── Core RTC products (Voice, Video, ILS, Chat, Signaling, Whiteboard, Flexible Classroom)
   │     → click card → drill into config tabs (separate journey)
   │
   └── Add-on capabilities (Cloud Recording, Media Push/Pull/Gateway, RT-STT, Video Screenshot Upload)
         → click "Enable" → inline confirmation + status flips to "Enabled"
         → click card → drill into add-on config (S3 bucket, RTMP destination, etc.)

[After enabling] toast: "Cloud Recording enabled in My first project" + status pill flips
```

**Edge cases.**
- **Already enabled** → button is replaced by "Configure" / "Disable"
- **Plan-gated** (some add-ons need Pro+) → button shows "Upgrade to enable" routing to Billing › Plans
- **Dependency missing** (e.g. Media Push needs an RTMP destination) → click Enable opens a small "Set destination first" modal

**Copy specs.**
- Section headers: "Core RTC products" / "Add-on capabilities"
- Card title: short name ("Cloud Recording")
- Card subtitle: outcome, not feature ("Record agent calls to S3 / GCS")
- Primary CTA on idle: "Enable"
- After enabled: pill "Enabled" + secondary CTA "Configure"

**Why this design.** Console scatters these 6 add-ons across the project sidebar — users had to discover each separately. Studio_X surfaces them all in one gallery so the "what's possible here" mental model loads in one screen.

---

## 2. Billing — top-up wallet

**User context.** Returning user with low balance, or first-time prepaid customer. Often triggered by an alert ("Project Beta hit 80% of cap") or a suspended-state banner.

**North-star metric.** Time from "I need credit" to "balance updated" ≤ 60 seconds. Zero abandons due to fee surprise.

**Flow.**

```
[Avatar dropdown → Billing] or [Home › Needs attention alert]
   │
   ▼
[Billing › Overview tab]
   │
   │   row: Available balance · $0.00 · [+ Top-up wallet]
   ▼
[Top-up modal]
   ├── Amount (preset chips: $25 / $50 / $100 / $200 + custom)
   ├── Payment method (radio: existing cards + "use new card")
   ├── Summary: amount · processing fee · total · what minutes that buys
   └── [Cancel] [Top up $X.XX]
   │
   ▼
[Processing — spinner, button disabled, "Charging Visa •••• 4242…"]
   │
   ▼
[Success — toast "$50 added to wallet" + Available balance flips immediately]
   │
   ▼
If failure → inline error in modal with specific reason + retry / use different card
```

**Edge cases.**
- **No card on file** → top-up button opens Add Card flow first (channel transition to "Payment methods" tab, returns after card saved)
- **Card declined** → stay in modal, show "Card declined — try a different card or update card details"
- **Account flagged for fraud review** → modal blocks with "Verification needed — contact support" + link
- **3-D Secure challenge** → modal swaps to bank verification iframe
- **Partial top-up resumes mid-flow** → if user closes mid-charge, on return show "Charge in progress" until backend confirms

**Copy specs.**
- Modal title: "Top up wallet"
- Amount label: "Add to balance" (not "Amount")
- Fee disclosure: "Includes 2.9% + $0.30 processing fee"
- Outcome microcopy: "$50 = ~500 minutes at current rates"
- Confirm CTA: "Top up $51.75" (exact total, not "Submit")
- Error: specific (e.g. "Your bank declined this card — try another or contact your bank")

**Why this design.** Money flows must be predictable. Show fees inline, not after click. Show outcome in minutes (the user's vocabulary), not just dollars.

---

## 3. Billing — change plan

**User context.** User on Starter hits a usage ceiling or wants more concurrent agents. Or downgrading after a project ends.

**Flow.**

```
[Avatar › Billing] → [Plans tab]
   │
   ▼
[Plans comparison grid: FREE · STARTER (current) · PRO · BUSINESS]
   │   each card: name, price, included minutes, concurrent agents,
   │              support tier · [Select plan]
   ▼
[Confirmation modal]
   ├── Plan diff (from Starter → Pro)
   ├── New monthly cost · prorated charge today · next renewal date
   ├── What you gain (5 bullets) · What you lose if downgrading (5 bullets)
   └── [Cancel] [Confirm upgrade — pay $X today]
   │
   ▼
[Processing → Success — plan card now reads "Current" on Pro]
```

**Edge cases.**
- **Downgrade with active usage above new cap** → block with "You're using 280K mins this month; the Starter plan covers 50K. Wait until next billing cycle or pause projects."
- **Annual plan switch** → modal shows annual savings + commitment terms
- **Business plan** → "Select" routes to Contact Sales (separate journey) instead of self-serve
- **Failed payment on upgrade** → roll back to previous plan, show banner

**Copy specs.** Plan names ALL CAPS for scan, price prominent. "Current" tag replaces button on current plan. Avoid "Upgrade" pressure framing — use neutral "Select plan."

---

## 4. Project Notifications (absorbed into Project Settings)

**Decision.** Remove the standalone `project-notifications` screen. The Console URL `/project-management/.../notifications` lands at **Project Settings › Notifications** section.

**Why.** It's project-scoped config used at setup time, not daily. Doesn't deserve a sidebar item when it can live as a section within Project Settings (which is already the project-config home).

**Section content.**
- Trigger rules: agent lifecycle events, billing thresholds, security alerts (table with toggle + threshold field)
- Webhook routes: per-event URL destinations (link out to Webhooks page for full setup)
- Recipient routing: by event type, route to email / Slack / webhook

**Why this design.** Console's "Project Notifications" was a separate page but in practice users configure it once and forget it. Folding into Project Settings reduces sidebar weight.

---

## 5. Webhooks — list + create

**User context.** Account-level. Developer wiring agent events into their own systems (CRM, monitoring, billing).

**Flow.**

```
[Avatar → Developer Settings → Webhooks]
   │
   ▼
[List view]
   │   Active webhooks: URL · events subscribed · last delivery · status
   │   Inactive webhooks (collapsed)
   │   [+ Add webhook] button
   ▼
[Add webhook modal]
   ├── URL (https://...)
   ├── Events checkboxes (agent.deployed, call.completed, billing.threshold, ...)
   ├── Signing secret (auto-generated, copyable, one-time reveal)
   ├── Test delivery button (sends a dummy event, shows response)
   └── [Cancel] [Save webhook]
   │
   ▼
[Webhook detail — last 100 deliveries]
   │   Each: timestamp · event · response code · duration · retry count
   │   Per-delivery: redeliver button, inspect payload, inspect response
```

**Edge cases.**
- **URL unreachable on test** → red banner, keep modal open, "Check your endpoint and retry"
- **Failing deliveries** → list view shows red status, click-through to recent failures
- **Secret rotation** → "Rotate signing secret" button, shows new secret once, old continues working for 24h grace
- **Disabled by repeated failures** → after 100 consecutive failures over 24h, system auto-disables and emails admin

**Copy specs.**
- Header: "Webhooks"
- Subhead: "Receive agent events at your own endpoints"
- Empty state: "No webhooks yet. Subscribe your systems to agent lifecycle, billing, and security events."

---

## 6. Audit logs

**User context.** Compliance admin or security officer reviewing what happened across the account. SOC 2 evidence collection.

**Flow.**

```
[Avatar → Developer Settings → Audit logs]
   │
   ▼
[Filterable log view]
   │   Filters bar: date range · actor · event type · resource
   │   Table: timestamp · actor (user/api) · event · resource · IP · result
   │   Click row → side panel with full payload + before/after diff
   ▼
[Export] button → CSV download (filtered set)
```

**Edge cases.**
- **No events match filter** → empty state with "broaden filters" hint
- **Date range > 90 days on Free plan** → upsell banner "Audit log retention is 30 days on Free; upgrade for 1 year retention"
- **Bulk export > 100K rows** → background job, email when ready

**Copy specs.** Event names are dot.notation (`agent.deployed`, `member.invited`). Result column: "Success" / "Failed" / "Denied" with reason on hover.

---

## 7. Developer Toolkit

**User context.** Developer setting up local dev environment or generating tokens for testing.

**Sections.**

1. **Quick start** — code snippets per language (Node, Python, Go) with copy-to-clipboard
2. **CLI** — install command, common commands, link to full docs
3. **SDK downloads** — language picker → download links
4. **Token generator** — interactive form: app ID, channel, UID, expiry → outputs token + cURL example
5. **Request inspector** — paste a webhook payload or API response, get a parsed view + signature verification

**Why this design.** Console's `/credentials` page mixed AA embedded keys, REST credentials, and dev tools all in one. Studio_X separates them: AA Embedded Credentials, RESTful API, Developer Toolkit — each focused on its task.

---

## 8. AA Embedded Credentials — create

**Flow.** Already has list + active credentials. Adds inline create flow.

```
[List] [+ Create credential]
   │
   ▼
[Inline panel slides down (no modal — lighter weight)]
   ├── Name (e.g. "aa-embed-prod")
   ├── Allowed origins (comma-separated domains)
   ├── Allowed dashboards (multi-select or "all")
   └── [Cancel] [Create]
   │
   ▼
[Success — new credential appears at top of list, secret revealed ONCE in modal]
   │
   │   "Save this secret now — you won't see it again"
   │   [Copy secret] [Download .env]
   ▼
[Acknowledge] → modal closes
```

**Edge cases.**
- **Duplicate name** → inline validation
- **Lost secret** → user must rotate (rotate button on the credential row)

---

## 9. Contact Sales

**User context.** Business plan inquiry, custom pricing, enterprise procurement.

**Form fields.**
- Company size (radio: 1-10, 11-50, 51-200, 201-1000, 1000+)
- Use case (radio: voice agents, video calling, chat, signaling, other)
- Estimated monthly volume (radio: <10K mins, 10K-100K, 100K-1M, 1M+)
- Timeline (radio: this week, this month, this quarter, exploring)
- Free-text: "Anything specific you want us to know?"
- Contact (auto-filled email, phone optional)

**Submission.** → "We'll be in touch within 1 business day" + creates a record. Drop a copy into Support tickets list for tracking.

**Why this design.** Sales-qualified lead form. Volume + use case + timeline are the three signals that route the lead to the right rep tier.

---

## 10. Support tickets

**Flow.**

```
[Avatar → Help → Support tickets]
   │
   ▼
[Ticket list — open + closed]
   │   Each: #ID · subject · status · last update · assignee
   │   [+ New ticket]
   ▼
[New ticket modal]
   ├── Category (radio: billing, technical, security, feature request)
   ├── Severity (radio: low, medium, high, urgent — explain SLAs)
   ├── Subject (single line)
   ├── Description (rich text, attachments, code blocks)
   ├── Affected project/agent (auto-filled from current context)
   └── [Cancel] [Submit ticket]
   │
   ▼
[Ticket detail thread — like email/Slack]
   │   Updates, attachments, status changes, agent + user messages
   │   [Reply] [Close] [Reopen]
```

**Edge cases.**
- **Free plan + urgent severity** → modal warns "Urgent tickets require a paid plan; we'll handle this as High"
- **Outage in progress** → banner "We're aware of an issue with X — check status.agora.io"

---

## 11. Licensing — unlocked state

**Current state.** Gated banner only. Adds an unlocked variant.

**When unlocked (Enterprise plan + license pack purchased):**

```
[Tabs: Quota · Pre-authorization · Purchase history · Usage queries]

Quota tab:
  - Allocated by project: editable table
  - Total used / available
  - Reallocation history

Pre-authorization tab:
  - Reserve seats per event/channel before activation
  - Auto-release after N hours

Purchase history tab:
  - License pack purchase log
  - Renewal dates, term length

Usage queries tab:
  - Query interface: by date, project, license type
  - Reconciliation report download
```

**Why this design.** Maps Console's 4 license-management sub-pages into one tabbed page. Most users will never see this; those who do are doing serious reconciliation work and need all four views together.

---

## 12. Extensions — my submissions

**Current:** empty state.

**Populated state (when user has submitted extensions):**
- Status per submission: Draft · Review · Approved · Published · Rejected
- Submission detail: reviewer notes, requested changes, ability to resubmit
- "+ Submit new extension" CTA

**Why.** Even though most users are extension consumers (not authors), the surface needs a real state so the navigation feels honest.

---

## Multi-channel touches

| Touch | Channel | Purpose |
|---|---|---|
| Wallet low balance | Email + in-app banner | Recovery — top-up before suspension |
| Account suspended | Email + login takeover | Critical — re-engage payment |
| Webhook delivery failures | Email digest + status pill | Developer awareness without spam |
| Ticket reply | Email + bell notification | Channel continuity — reply from email lands in ticket |
| Plan change | Email confirmation + in-app banner | Receipt + record |
| Audit log anomaly | Email to admins | Security |

---

## What we are NOT designing (out of scope this pass)

- Per-channel notification template design (`/articulate` work)
- Detailed accessibility audit of these new screens (`/include`)
- Localization of forms and date/currency formats (`/localize`)
- Backend webhook signing implementation details (`/blueprint`)
- Engineering specs for handoff (`/specify`)

---

## Implementation status

After this pass, every screen reachable from the lean sidebar or avatar dropdown has *content*, not a placeholder. Specifics shipped: see commit log.
