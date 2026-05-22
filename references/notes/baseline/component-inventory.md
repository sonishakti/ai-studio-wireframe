# Component Inventory — Original Console

**Agent:** Baseline Agent (Phase 1)
**Date:** 2026-02-20

---

## Summary

| Category | Count | Examples |
|----------|-------|---------|
| Primitive UI | ~15 | Button, InputField, Badge, Chip, Loading, Skeleton |
| Composite UI | ~60 | SimpleModal, TableLayout, BoxLayoutCard, DateRangePicker |
| Layout | ~12 | PageLayout, FullPageLayout, SubPageLayout, CardLayout |
| Page-Level | ~80 | Bills, ProjectTable, UsagesActions, TeamManagementTable |
| Utility/Hook | ~11 | useAuth, usePermission, useRtcPlans |
| **Total** | **219 components + 11 hooks + 27 stores + 13 utils** | |

### Complexity Distribution

| Complexity | Count | Criteria |
|------------|-------|----------|
| Simple | ~80 | <100 LOC, minimal props, no state |
| Moderate | ~90 | 100-300 LOC, some state/effects |
| Complex | ~49 | 300+ LOC, multiple effects, API calls, 5+ state vars |

---

## Migration-Critical Components

### Largest / Most Complex (Require Special Attention)

| Component | Lines | Domain | Why It's Critical |
|-----------|-------|--------|------------------|
| `AddCardModal` | 902 | billing | Stripe Elements + Formik + 7 useState. Largest single component |
| `TeamManagementTable` | 791 | settings | 4 useState + modals + API calls. Heavy table logic |
| `Sidebar` (ui) | 747 | ui | Context-based compound component. Layout backbone |
| `SignalingPricingTable` | 625 | subscriptions | Complex pricing grid with comparison |
| `ChatPricingTable` | 562 | subscriptions | Complex pricing grid with comparison |
| `ConvAIForm` | 540 | project-management | 8 useState + useReducer. Agora RTC integration |
| `MemberManagementTable` | 514 | settings | 3 useState + modals + API calls |
| `ProjectTable` | 522 | projects | 2 useState + useAtom + modals + API |
| `AgoraRTCComponent` | 498 | project-management | Web Audio API + Agora SDK. Imperative DOM |
| `UsagesActions` | 484 | usages | 4 useState + complex filtering |
| `TurnDetectionSettings` | 465 | project-management | 4 useState + radio groups |
| `Security` | 431 | projects | 2 useState + useRef for DOM. Key management |
| `TwoFactorAuth` | 430 | auth | Multi-step verification flow |
| `UsagesInput` | 412 | usages | 2 useState + useRef + complex input |
| `Bills` | 408 | billing | 4 useState + Jotai atoms + date filtering |
| `AgoraAnalytics` | 406 | subscriptions | 3 useState + modals + payment |

---

## Compound Component Patterns

These components use the compound pattern (SubComponent via dot notation):

| Component | Sub-Components | Pattern |
|-----------|---------------|---------|
| `SimpleModal` | `.Header`, `.Body`, `.Footer` | Radix Dialog + children slots |
| `TableLayout` | `.Head`, `.Body`, `.Row`, `.Details` | Semantic table + custom sorting |
| `BoxLayoutCard` | `.Header`, `.Body`, `.ActionRight` | Card sections with loading state |

---

## Key Architectural Patterns in Components

### 1. CVA (Class Variance Authority)
Used in: `Button`, `Chip`, `Skeleton`, `IconButton`
Pattern: Type-safe variant composition for Tailwind classes.

### 2. Formik Integration
Components that integrate with Formik forms:
- `InputField` (forwardRef, accepts Formik field props)
- `SelectField` (manages Formik state)
- `FileInputField` (file upload with Formik)
- All billing/settings forms

### 3. Jotai Atom Consumption
Components that directly consume Jotai atoms (not through hooks):
- `Bills` — billingAtom, authAtom
- `ProjectTable` — projectGroupAtom, authAtom
- All dashboard components
- Most page-level components

### 4. Direct API Calls
Components that call axios directly (not through a service layer):
- `ProjectManagementLayout` — 6 parallel API calls via Promise.all
- `SignallingLayout` — RTM data fetch
- `Bills` — invoice fetch
- `Security` — key management APIs
- Most page-level components

**Migration note:** The migration repo's `feat/design-inspect` branch introduces a service layer abstraction. This pattern should replace direct axios calls.

### 5. Framer Motion Usage
8 components use framer-motion for animations:
- `PricingTable` (signaling) — expand/collapse
- `PurchaseHistory` — list animation
- `RadioInputCard` — selection animation
- `ResponsiveSidebar` — slide in/out
- `SimpleCollapsible` — expand/collapse

---

## Custom Hooks Detail

| Hook | Purpose | Key Dependencies | Migration Notes |
|------|---------|-----------------|-----------------|
| `useAuth` | Fetch /userInfo, set authAtom, check onboarding | authAtom, sgCompanyAtom, axios, router | Core hook — must be replicated exactly |
| `usePermission` | Check user permissions against authAtom | authAtom | Simple, portable |
| `useLicensePermission` | Check license management access | Custom API call | Newer hook (from upstream) |
| `useRtcPlans` | Fetch RTC subscription plans | Custom API call | Could use SWR in migration |
| `useRtcQuota` | Fetch RTC quota data | Custom API call | Could use SWR in migration |
| `useFreeQuotaUsage` | Track free tier quota | Custom API call | Newer hook (from upstream) |
| `useRtcAnnouncementTracking` | Track announcement dismissal | Store + localStorage | State persistence |
| `useElementDimension` | Measure DOM element | ResizeObserver, useRef | Browser API dependent |
| `useOnClickOutside` | Click outside detection | useRef, useEffect | Common utility |
| `use-mobile` | Viewport detection | matchMedia | Simple, portable |

---

## Jotai Store Architecture

### 27 atom files covering:

| Domain | Files | Key Atoms | Notes |
|--------|-------|-----------|-------|
| Auth | 1 | authAtom, updateExtraInfoAtom | User data + extras |
| Projects | 1 | projectAtom, projectGroupAtom, extensionStatusAtom, signallingAtom, whiteBoardAtom, backupCertAtom | 8+ atoms in one file — large |
| Billing | 1 | billingAtom, refreshCashInfoAtom, balanceAtom | Financial data |
| Cards | 1 | creditCardsAtom | Payment methods |
| Subscriptions | 4 | rtcPlansAtom, chatPlansAtom, signalingPlansAtom, allSubscriptionsAtom | One file per plan type |
| Usage | 1 | usagesDataAtom, usagesFilterAtom | Analytics data + filters |
| License | 1 | quotaAtom, ordersAtom, preAuthAtom | License management |
| Notifications | 1 | notificationsAtom, unreadCountAtom | Notification center |
| Others | 15+ | Various | Tour, session, analytics, autopay, etc. |

**Total atoms:** ~50+ across 27 files

---

## Icon System

### 4 Icon Libraries + 100+ Custom SVGs

| Library | Package | Usage Pattern |
|---------|---------|--------------|
| Lucide React | `lucide-react@0.562.0` | Primary icon library (newer additions) |
| Radix Icons | `@radix-ui/react-icons@1.3.0` | UI component icons |
| iconsax-react | `iconsax-react@0.0.8` | Used in AddCardModal (payment icons) |
| Material Design | `@material-design-icons/svg@0.14.5` | Sparse usage |
| Custom SVGs | `src/assets/icons/` | 100+ hand-built React icon components |

**Migration strategy:** Consolidate to lucide-react. Map custom SVGs to Lucide equivalents where possible. Keep unique Agora-branded icons as custom components.
