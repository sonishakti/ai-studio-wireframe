# IA Mapping — Console → Studio (100% coverage)

**Generated:** 2026-05-22
**Source inventory:** [console_map/_index.md](console_map/_index.md) — 56 pages mapped
**Target:** Studio_X interactive wireframe — [wireframes/app.html](../wireframes/app.html)

This document proves every page in the existing Agora Console has a home in the new Studio IA, organised leanly (sub-tabs and drill-ins over new top-level items).

---

## Destination groups

```
Studio_X sidebar (LEAN — final shape)
├── Home
├── BUILD
│   ├── Agents
│   └── Integrations
├── DEPLOY
│   ├── Phone Numbers
│   └── Campaign
├── MONITOR
│   ├── Analytics                 ← tabs: Performance · Usage · Cost
│   ├── Call History
│   └── Session History
└── PROJECT
    ├── Project Settings
    ├── Realtime Services         ← absorbs Real-Time products + RTC add-ons
    └── Credentials                third-party LLM/TTS/ASR keys

Studio_X sidebar (account mode)
├── ACCOUNT
│   ├── Account Overview
│   ├── Billing & Subscriptions   ← Overview · Usage (account-scoped) ·
│   │                                Plans · Invoices · Transactions ·
│   │                                Payment methods · Withdrawals ·
│   │                                Add-on packages
│   ├── Teams & Members
│   ├── SSO Management
│   ├── Notification Preferences
│   └── Profile
├── DEVELOPER
│   ├── RESTful API               Customer ID + Secret
│   ├── AA Embedded Credentials   ← Agora Analytics embedded keys (NEW slot)
│   ├── Webhooks
│   ├── Audit logs
│   └── Developer Toolkit
└── HELP
    ├── Docs ↗
    ├── Community ↗
    ├── Contact Sales
    ├── Support tickets
    ├── System status ↗
    └── What's new

Standalone destinations
├── Notification Center           ← /notifications (bell-click full page)
└── Licensing                     ← /license-management (gated)
```

---

## Page-by-page mapping

### Overview & Projects (2 pages)
| Console URL | Studio destination |
|---|---|
| `/` | sidebar › **Home** |
| `/project-management` | project switcher (top-of-sidebar) + Home › Projects grid |

### Project configure (18 pages) — collapsed into 5 Studio destinations
| Console URL | Studio destination | Treatment |
|---|---|---|
| `/conv-ai` | Build › **Agents** | The agent builder is this |
| `/chat/basic-info` | Build › Real-Time products › **Chat** | Drill-in tab |
| `/signaling/basic` | Build › Real-Time products › **Signaling** › Basic | Sub-tab |
| `/signaling/presence-configuration` | Build › Real-Time products › Signaling › Presence | Sub-tab |
| `/signaling/storage-configuration` | Build › Real-Time products › Signaling › Storage | Sub-tab |
| `/signaling/stream-channel-configuration` | Build › Real-Time products › Signaling › Stream Channel | Sub-tab |
| `/whiteboard-basic` | Build › Real-Time products › **Whiteboard** | Drill-in |
| `/whiteboard-services` | Build › Real-Time products › Whiteboard › Services | Sub-tab |
| `/cloud-recording` | Discover › Extensions › **Cloud Recording** | Add-on capability |
| `/media-push` | Discover › Extensions › **Media Push** | Add-on |
| `/media-pull` | Discover › Extensions › **Media Pull** | Add-on |
| `/media-gateway` | Discover › Extensions › **Media Gateway** | Add-on |
| `/real-time-stt` | Discover › Extensions › **Real-Time STT** | Add-on |
| `/video-screenshot-upload` | Discover › Extensions › **Video Screenshot Upload** | Add-on (moderation) |
| `/cloud-proxy` | Project › Project settings › **Networking** | Project-scoped infra |
| `/cohost-authentication` | Project › Project settings › **Security** | Project-scoped auth |
| `/flexible-classroom` | Build › Real-Time products › **Flexible Classroom** | Vertical solution |
| `/notifications` (project) | Project › **Notifications** | Already wired |

### Usage (1 page → 2 destinations, polyhierarchy)
| Console URL | Studio destination |
|---|---|
| `/usage` | Monitor › **Analytics › Usage** tab (route alias preserves 1-click access) — **project-scoped** |
| `/account-usage` (new alias) | Account › **Billing & Subscriptions › Usage** tab — **account-scoped roll-up across all projects** |

> **2026-05-22 update.** Usage was previously a standalone PROJECT sidebar item. It now lives as a tab inside `Monitor › Analytics`, alongside Performance and Cost. Rationale: all three answer the same root question — *"how are my agents doing in production?"* — at different aggregations. Splitting forced context-switching mid-debug. Route `/usage` still works via alias and auto-activates the Usage tab.
>
> **2026-05-26 update — polyhierarchy added.** P1 (the hustler) lives in Monitor and debugs per-project; P2 PM / P3 TAM / P4 EM live in Billing and need account-wide oversight. Usage legitimately exists at two scopes. Added `Account › Billing & Subscriptions › Usage` as the second destination — same component, account-scoped default, per-project breakdown table with drill-in. Project-Usage subhead now scope-stamps the current project ("My first project · Current billing cycle") and surfaces a conditional cross-link ("Workspace has 3 projects. View usage across all projects →") for multi-project users only. Single-project workspaces don't see the cross-link. Three entry points converge on the account view: Home › Workspace usage tile CTA, Billing tab, and the cross-link inside Monitor › Usage. Pattern matches the Extensions polyhierarchy (DISCOVER browse + Project settings enable).

### Billing (5 pages, all merged)
| Console URL | Studio destination |
|---|---|
| `/billing` | Account › Billing & Subscriptions › **Overview** tab |
| `/billing/invoices` | Account › Billing & Subscriptions › **Invoices** tab |
| `/billing/transactions` | Account › Billing & Subscriptions › **Transactions** tab |
| `/billing/manage-cards` | Account › Billing & Subscriptions › **Payment methods** tab |
| `/billing/withdraw-transactions` | Account › Billing & Subscriptions › **Withdrawals** tab |

### Subscriptions (4 pages, all merged)
| Console URL | Studio destination |
|---|---|
| `/subscriptions` | Account › Billing & Subscriptions › **Plans** section |
| `/subscriptions/rtc-plans` | Plans › RTC |
| `/subscriptions/chat-plans` | Plans › Chat |
| `/subscriptions/signaling-plans` | Plans › Signaling |

### Extension Marketplace (11 pages)
| Console URL | Studio destination |
|---|---|
| `/extensions-marketplace` | Discover › **Extensions Marketplace** (gallery) |
| `/extensions-marketplace/agora-noise-suppression` | gallery card → detail |
| `/extensions-marketplace/agora-spatial-audio` | gallery card → detail |
| `/extensions-marketplace/byteplus-effects` | gallery card → detail |
| `/extensions-marketplace/conversation-intelligence` | gallery card → detail |
| `/extensions-marketplace/activefence-video-moderation` | gallery card → detail |
| `/extensions-marketplace/synervoz-voice-fx` | gallery card → detail |
| `/extensions-marketplace/deepar` | gallery card → detail |
| `/extensions-marketplace/faceunity-ar-filter` | gallery card → detail |
| `/extensions-marketplace/banuba-face-ar` | gallery card → detail |
| `/extensions-marketplace/my-submissions` | gallery › **My submissions** tab |

### Developer Toolkit (2 pages)
| Console URL | Studio destination |
|---|---|
| `/credentials` (AA Embedded) | Account › Developer › **AA Embedded Credentials** — NEW slot |
| `/restful-api` | Account › Developer › **RESTful API** |

### Settings (4 pages)
| Console URL | Studio destination |
|---|---|
| `/settings/profile` | Account › **Profile** |
| `/settings/teams-members` | Account › **Teams & Members** |
| `/settings/notification-preferences` | Account › **Notification Preferences** |
| `/settings/sso-management` | Account › **SSO Management** (gated) |

### Notifications (1 page)
| Console URL | Studio destination |
|---|---|
| `/notifications` | **Notification Center** — full page (bell-click destination) |

### Finance (1 page)
| Console URL | Studio destination |
|---|---|
| `/finance/packages` | Account › Billing & Subscriptions › **Add-on packages** section |

### License Management (1 page, gated)
| Console URL | Studio destination |
|---|---|
| `/license-management` | **Licensing** — gated stub (preserves plan-aware route) |

### External (1 link)
| Console URL | Studio destination |
|---|---|
| `analytics-lab.agora.io` | Monitor › Agora Analytics ↗ |

### Studio — already-Studio pages (4 pages)
These exist in the old Console under `/studio/*` and survive into Studio_X. Listing them keeps coverage genuinely 100%.

| Console URL | Studio destination | Treatment |
|---|---|---|
| `/studio/agents` | Build › **Agents** | Same surface, deeper builder |
| `/studio/integration/credentials` | Project › **Vendor Credentials** | Renamed and promoted to project-level |
| `/studio/integration/knowledge-bases` | Build › Agents › **Knowledge** tab | Inside the agent builder |
| `/studio/integration/mcps` | Build › Agents › **Integrations** tab | Inside the agent builder (MCP connectors) |
| `/studio/campaign` | Deploy › **Campaign** | Same surface |
| `/studio/analytics` | Monitor › **Analytics** | Same surface |

### Out of scope (2 pages)
Counted in `console_map/_index.md` but intentionally not migrated.

| Console URL | Status | Reason |
|---|---|---|
| `/billing/all-designs` | Drop | Internal UI preview, not in old Console navigation |
| `/play` | Drop | Empty Next.js stub route, no content |

---

## Diff summary

**Net change vs. previous wireframe state:**

- **+ 3 new screens**: AA Embedded Credentials, Notification Center, Licensing
- **+ 1 tab pattern**: Billing & Subscriptions now hosts Overview/Invoices/Transactions/Payment Methods/Withdrawals/Plans/Add-on packages
- **+ 10 detail cards**: Extension Marketplace gallery now lists every Console extension by name
- **+ 2 project-settings sections**: Networking (Cloud Proxy), Security (Co-Host Authentication)
- **+ 1 RT product**: Flexible Classroom listed in Real-Time products
- **No new top-level nav items.** All long-tail Console pages absorbed by existing sidebar groups.

**Coverage:** 56 of 56 Console pages accounted for — 54 mapped to a Studio_X destination, 2 dropped with explicit reason. Zero orphans, zero duplicates.

| Source group | Console pages | Mapped | Dropped |
|---|---|---|---|
| Overview | 1 | 1 | 0 |
| Projects (list + configure) | 19 | 19 | 0 |
| Usage | 1 | 1 | 0 |
| Billing | 6 | 5 | 1 (`/billing/all-designs`) |
| Extension Marketplace | 11 | 11 | 0 |
| Subscriptions | 4 | 4 | 0 |
| Developer Toolkit | 2 | 2 | 0 |
| Settings | 4 | 4 | 0 |
| Notifications | 1 | 1 | 0 |
| Studio (existing) | 4 | 4 | 0 |
| Finance | 1 | 1 | 0 |
| License Management | 1 | 1 | 0 |
| Other (`/play`) | 1 | 0 | 1 |
| **Total** | **56** | **54** | **2** |

---

## Why this stays lean

1. **Sub-tabs beat new nav items.** Billing has 5 Console URLs; Studio surfaces them as one destination with tabs — users only need to remember "Billing & Subscriptions," not five separate routes.
2. **Add-on capabilities live in Extensions Marketplace, not project nav.** The Console scatters Cloud Recording, Media Push, Real-Time STT, etc. across the project sidebar. Studio treats them as what they are — opt-in extensions browsed and enabled from one gallery.
3. **Three credential types kept distinct, not merged.** Vendor Credentials (third-party LLM/TTS keys) ≠ AA Embedded Credentials (analytics) ≠ RESTful API (Customer ID + Secret). Merging would cause more confusion than the small extra surface area.
4. **Gated routes get stubs, not silence.** Licensing exists as a destination so plan-gated users see "requires Premium/Enterprise" rather than a redirect with no explanation.
