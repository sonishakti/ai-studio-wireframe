# Route Manifest — Original Console

**Agent:** Baseline Agent (Phase 1)
**Date:** 2026-02-20

---

## Summary

| Metric | Count |
|--------|-------|
| Total pages | 95 (excl. _app, _doc) |
| Active feature pages | 87 |
| Backup pages (-bkup) | 6 |
| Dev/test pages | 2 |
| API routes | 7 |
| Redirect-only pages | 3 |

### Route Sections

| Section | Pages | Complexity Profile |
|---------|-------|--------------------|
| Root/System | 6 | 2 simple, 2 moderate, 0 complex |
| Billing | 6 | 5 simple, 0 moderate, 1 complex |
| Project Management | 58 | 4 simple, 46 moderate, 8 complex |
| Subscriptions | 5 | 2 simple, 0 moderate, 3 complex |
| License Management | 5 | 2 simple, 3 moderate, 0 complex |
| Settings | 5 | 0 simple, 1 moderate, 4 complex |
| Other (credentials, usage, etc.) | 10 | 2 simple, 5 moderate, 3 complex |

---

## Layout Hierarchy

```
_app.tsx (Jotai Provider → ThemeProvider → WithWrapper[auth, 2FA, banners])
├── PageLayout (standard pages: billing, projects, extensions, usage, subscriptions)
│   ├── SubPageLayout (settings, notifications — with sidebar)
│   │   └── SettingsSidebar
│   └── FullPageLayout (credentials — full-height)
├── ProjectManagementLayout (project-management/[projectID]/*)
│   ├── BasicSetting + Security (project header)
│   ├── MultiLayerNavigation (service sidebar)
│   └── SignallingLayout (signaling/* subset — wraps PML)
│       └── GuideBox + StatusBadge
└── None (error pages, onboarding)
```

**Migration note:** The `ProjectManagementLayout` is the most complex layout. It performs 6 parallel API calls via `Promise.all` on mount (project data, extension settings, cloud proxy, whiteboard, flexible classroom, chat status). In App Router, this should become a `layout.tsx` with data fetching in a Server Component shell.

---

## Data Fetching Patterns

| Pattern | Count | Notes |
|---------|-------|-------|
| Client-side useEffect + axios | ~60 | Dominant pattern |
| Component delegation (page wraps child) | ~20 | Page is thin, child fetches |
| Jotai atoms (global state) | ~10 | Dashboard, usage, notifications |
| getServerSideProps (redirect only) | 3 | No SSR data fetching |
| None (static) | ~8 | Error pages, onboarding, redirects |

**Key insight:** Zero pages use server-side data fetching for actual data. All data is client-side. This means migrating to Server Components would change the data fetching paradigm entirely.

---

## Auth/Permission Matrix

| Auth Method | Pages Using It |
|-------------|---------------|
| `usePermission(resource, action)` | Dashboard, billing, credentials |
| `useAuth()` hook (role check) | Settings pages, RESTful API |
| `useAtomValue(authAtom)` direct | Billing, RESTful API |
| `LicensePermissionGuard` wrapper | All license-management pages |
| Implicit (via layout) | All project-management pages |
| None | Error pages, onboarding, play, test |

---

## Special Route Behaviors

### iframe Embeds
- `/project-management/[projectID]/chat/features-overview` — embeds `chat.agora.io` in dynamic iframe

### Shallow Routing
- `/notifications` — uses shallow routing for message detail view (URL param, no full page load)

### Redirects
- `/project-management/[projectID]` → `/project-management/[projectID]/chat/basic-info`
- `/project-management/[projectID]/chat` → `/project-management/[projectID]/chat/basic-info`
- `/subscriptions` → `/license-management/purchase-history`

### Backup Pages (Excluded from Migration)
All in `chat/` subdirectory:
- `callback-bkup.tsx`, `features-overview-bkup.tsx`, `push-cert-bkup.tsx`
- `push-template-bkup.tsx`, `wordlist-rule-config-bkup.tsx`, `wordlist-history-bkup.tsx`

---

## Largest Pages (by line count)

| Page | Lines | Section | Notes |
|------|-------|---------|-------|
| `whiteboard-services.tsx` | 1,235 | project-management | Whiteboard service config |
| `flexible-classroom.tsx` | 1,226 | project-management | Classroom solution |
| `test.tsx` | 785 | root | Dev test page |
| `settings/profile.tsx` | 717 | settings | OTP, phone, email, password, OAuth |
| `notifications.tsx` (project) | 598 | project-management | Project notification config |
| `play.tsx` | 451 | root | Dev playground (commented) |
| `settings/index.tsx` | 346 | settings | Account settings |
| `billing/index.tsx` | 337 | billing | Billing dashboard |
