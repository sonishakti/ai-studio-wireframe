# Component Migration Mapping — Human-Readable

**Agent**: Migration Agent (Phase 2)
**Date**: 2026-02-20
**Branch evaluated**: main + feat/design-inspect
**Source data**: `component-mapping.json`

---

## Summary

| Status | Count | Description |
|--------|-------|-------------|
| `migrated` | 196 | Functionally complete, UI replaced |
| `migrated-with-issues` | 8 | Migrated but has quality problems |
| `placeholder` | 1 | Stub only, no business logic |
| `not-started` | 7 | Missing entirely from migration |
| `not-needed` | 12 | Deprecated, dev-only, or subsumed |

**Total original components**: 219
**Migration coverage**: ~93% (196 + 8 migrated out of 219)
**Blocking gaps**: 4 (pre-authorization trio + 1 license guard)

---

## UI Primitives (ShadCN Replacements)

All 14 custom Radix UI wrappers have been replaced with ShadCN equivalents:

| Original | ShadCN Replacement | Status | Notes |
|----------|--------------------|--------|-------|
| `Button` (custom) | `Button` (shadcn) | ✅ migrated | Variants differ slightly |
| `Modal` | `Dialog + DialogContent` | ✅ migrated | — |
| `Dropdown` | `DropdownMenu` | ✅ migrated | — |
| `Select` | `Select` (shadcn) | ✅ migrated | — |
| `Input` | `Input` (shadcn) | ✅ migrated | — |
| `Textarea` | `Textarea` (shadcn) | ✅ migrated | — |
| `Table / TableLayout` | `Table` family (shadcn) | ✅ migrated | — |
| `Badge` | `Badge` (shadcn) | ✅ migrated | — |
| `Tooltip` | `Tooltip` (shadcn) | ✅ migrated | — |
| `Alert` | `Alert` (shadcn) | ✅ migrated | — |
| `Card` | `Card` (shadcn) | ✅ migrated | — |
| `Tabs` | `Tabs` (shadcn) | ✅ migrated | — |
| `Checkbox` | `Checkbox` (shadcn) | ✅ migrated | — |
| `Switch` | `Switch` (shadcn) | ✅ migrated | — |

**New additions** not in original: `ButtonGroup`, `SubscriptionCard`, `LayoutCard` — these are wrappers built for migration-specific patterns.

---

## Common Components

All 46 original common/shared components have been evaluated:

### ✅ Fully Migrated (40)

These components exist in `src/components/` and preserve business logic:

- `PageLayout`, `AppLayout`, `AppSidebar`, `AppHeader` — all recreated using shadcn `Sidebar`
- `ProjectManagementLayout` — migrated to nested App Router layout pattern
- `SignallingLayout` — migrated
- `SettingsSidebar` — migrated using shadcn `Sidebar`
- `PermissionGuard`, `AuthGuard` — migrated (client-side only — **no server-side middleware**)
- `DateRangePicker` — extended shadcn Calendar
- `CopyButton`, `CopyInput` — migrated with Lucide icons
- `Spinner`, `LoadingOverlay` — migrated using Lucide `Loader2`
- `FileUpload`, `ImageUpload` — migrated
- `SearchInput` — migrated
- `Pagination` — migrated using shadcn
- `EmptyState` — migrated
- `ConfirmDialog` — migrated using `AlertDialog`
- `Breadcrumb` — migrated using shadcn
- `CodeBlock` — migrated
- `FormField`, `FormSection` — migrated using react-hook-form + zod
- `TagInput` — migrated
- `Timeline` — migrated
- `CountrySelect`, `PhoneInput` — migrated
- All chart components — migrated (recharts library unchanged)

### ⚠️ Migrated With Issues (6)

| Component | Issue |
|-----------|-------|
| `Sidebar` | Uses `.agora-sidebar` CSS class — violates utility-first rule (ISS-003) |
| `DataTable` | Uses `.agora-table` CSS class (ISS-003) |
| `PaymentMethodCard` | Has `: any` type in payment response handler (ISS-007) |
| `BillingDashboard` | Inline `style={{}}` on chart container (ISS-008) |
| `ProjectManagementLayout` | Missing `loading.tsx` fallback (ISS-011) |
| `NotificationList` | `paymentStatus` field uses `!bill.paymentStatus` (falsy check) instead of `=== 0` — logic bug carried over from original (ISS-015) |

### 🚫 Not Started (0 in common layer)

All common components are present. Gaps exist in the **feature layer** (see below).

---

## Feature Components

### Billing Domain

| Component | Status | Notes |
|-----------|--------|-------|
| `Invoices` | ✅ migrated | Full monthly + pre-paid tabs, date range filter, CSV export |
| `LatestInvoice` | ✅ migrated | Dashboard widget, reads from `billingsAtom` |
| `AddCardModal` | ✅ migrated | Stripe integration preserved |
| `ManageCards` | ✅ migrated | — |
| `Transactions` | ✅ migrated | — |
| `WithdrawTransactions` | ✅ migrated | — |
| `PaymentMethod` | ✅ migrated | — |
| `Wallet` | ✅ migrated | — |
| `AutoPay` | ✅ migrated | — |
| `BillingDashboard` (root) | ⚠️ migrated-with-issues | Inline style on chart (ISS-008) |

### License Management Domain

| Component | Status | Notes |
|-----------|--------|-------|
| `PurchaseHistoryTable` (now `OrdersTable`) | ✅ migrated | New name, same logic |
| `QuotaManagement` | ✅ migrated | — |
| `UsagesQuery` | ✅ migrated | — |
| `LicensePermissionGuard` | 🚫 **not-started** | Original guards `purchase-history`, `pre-authorization`, `quota-management`, `usages-query`. Migration has NO equivalent guard — pages are unprotected. **CRITICAL** (ISS-016) |
| `ImportLicensesTab` | 🚫 **not-started** | 390+ lines. Pre-authorization core feature. (ISS-017) |
| `VerifyLicenseTab` | 🚫 **not-started** | 420+ lines. Pre-authorization step 2. (ISS-017) |
| `ImportHistoryTab` | 🚫 **not-started** | Pre-authorization history view. (ISS-017) |

### Project Management Domain

All 58 project management pages use thin page.tsx wrappers that import feature components. The core feature components are all migrated:

| Component | Status | Notes |
|-----------|--------|-------|
| `ProjectTable` | ✅ migrated | List + search + create |
| `CreateProjectModal` | ✅ migrated | react-hook-form + zod ✅ |
| `BasicInfoContent` | ✅ migrated | Uses shadcn Form |
| `EnableChat` | ✅ migrated | — |
| `ChatModerationComponents` (text/image/domain rules, wordlists) | ✅ migrated | 18 pages' worth |
| `OperationManage` (user/chatroom/group) | ✅ migrated | — |
| `RealTimeMetrics` family | ✅ migrated | Recharts unchanged |
| `SignalingConfig` components | ✅ migrated | — |
| `MediaGateway/Pull/Push` | ✅ migrated | — |
| `CloudProxy`, `CloudRecording` | ✅ migrated | — |
| `ConvAI` | ✅ migrated | Complex — RTC + AI integration |
| `FlexibleClassroom` | ✅ migrated | 1226 lines → preserved |
| `WhiteboardServices` | ✅ migrated | 1235 lines → preserved |
| `ProjectNotifications` | ✅ migrated | — |

### Subscriptions Domain

| Component | Status | Notes |
|-----------|--------|-------|
| `AllSubscriptions` | ✅ migrated | — |
| `RtcSubscriptionUsage` | ✅ migrated | ButtonGroup tabs, monthly/top-up |
| `QuotaUsage` | ✅ migrated | Progress bar, alert states |
| `RtcPlans` | ✅ migrated | — |
| `ChatPlans` | ✅ migrated | — |
| `SignalingPlans` | ✅ migrated | — |

### Settings Domain

| Component | Status | Notes |
|-----------|--------|-------|
| `AccountSettings` | ✅ migrated | — |
| `ProfileSettings` | ✅ migrated | OTP, phone, email, password flows |
| `TeamsMembers` | ✅ migrated | — |
| `NotificationPreferences` | ✅ migrated | — |
| `SsoManagement` | ✅ migrated | — |

### Other Domains

| Component | Status | Notes |
|-----------|--------|-------|
| `CredentialsTable` | ✅ migrated | Permission-gated |
| `RestfulApi` | ✅ migrated | — |
| `ExtensionsMarketplace` | ✅ migrated | — |
| `ExtensionDetail` | ✅ migrated | — |
| `MySubmissions` | ✅ migrated | — |
| `UsageDashboard` | ✅ migrated | — |
| `NotificationsPage` | ✅ migrated | — |
| `Onboarding` | ✅ migrated | — |
| `FinancePackages` | ✅ migrated | — |

---

## Hooks

| Hook (original) | Migration equivalent | Status | Notes |
|-----------------|----------------------|--------|-------|
| `usePermission` | `usePermission` | ✅ migrated | — |
| `useAuth` | `useAuth` | ✅ migrated | Client-side only (no middleware) |
| `useProjectList` | `useProjectList` | ✅ migrated | — |
| `useRtcPlans` | `useRtcPlans` | ✅ migrated | — |
| `useRtcQuota` | `useRtcQuota` | ✅ migrated | — |
| `useBilling` | `useBilling` | ✅ migrated | — |
| `useNotifications` | `useNotifications` | ✅ migrated | — |
| `useOnboarding` | `useOnboarding` | ✅ migrated | — |
| `useLicensePermission` | — | 🚫 **not-started** | Guards license management section. Referenced by `LicensePermissionGuard` (ISS-016) |
| `useFreeQuotaUsage` | — | 🚫 **not-started** | Used in billing dashboard free tier display (ISS-018) |
| `useRtcAnnouncementTracking` | — | 🚫 **not-started** | Tracks RTC announcements (ISS-019) |

---

## Stores (Jotai Atoms)

| Store (original) | Migration equivalent | Status | Notes |
|------------------|----------------------|--------|-------|
| `auth.ts` | `auth.ts` | ✅ migrated | — |
| `billing.ts` | `billing.ts` | ✅ migrated | — |
| `project.ts` | `project.ts` | ✅ migrated | — |
| `notifications.ts` | `notifications.ts` | ✅ migrated | — |
| `subscriptions.ts` | `subsciptions.ts` | ⚠️ migrated-with-issues | **Typo in filename** — `subsciptions.ts` (missing 'r'). Will cause import confusion. (ISS-009) |
| `rtcPlans.ts` | `rtcPlans.ts` | ✅ migrated | — |
| `license.ts` | `license.ts` | ✅ migrated | — |
| `usage.ts` | `usage.ts` | ✅ migrated | — |
| `settings.ts` | `settings.ts` | ✅ migrated | — |
| `ui.ts` | `ui.ts` | ✅ migrated | — |
| `onboarding.ts` | `onboarding.ts` | ✅ migrated | — |
| _(all remaining)_ | _(all present)_ | ✅ migrated | 23 other stores confirmed present |
| `rtc-announcement-tracking.ts` | — | 🚫 **not-started** | Tracks shown announcements in localStorage. No migration equivalent. (ISS-019) |

---

## Not-Needed Components

These 12 from the original have intentionally no migration equivalent:

| Original | Reason |
|----------|--------|
| `pages/_app.tsx` | Replaced by `app/layout.tsx` (App Router) |
| `pages/_document.tsx` | Replaced by root layout |
| `pages/404.tsx` | Next.js handles via `not-found.tsx` convention |
| `pages/500.tsx` | Replaced by `app/error.tsx` |
| `pages/play.tsx` | Replaced by `app/playground/[[...componentId]]` |
| `pages/test.tsx` | Dev-only test page, not migrated by design |
| Custom Radix `Sidebar` package | Replaced by ShadCN Sidebar |
| Custom Radix `Dialog` | Replaced by ShadCN Dialog |
| Custom Radix `Select` | Replaced by ShadCN Select |
| Custom Radix `Popover` | Replaced by ShadCN Popover |
| `getServerSideProps` wrappers | Replaced by App Router data fetching |
| `_middleware.ts` (legacy/) | Should become `middleware.ts` — **currently not migrated** (ISS-001) |

---

## Critical Gaps Summary

Four items block feature parity for license management:

1. **`LicensePermissionGuard`** — Permission gating for entire license management section
2. **`ImportLicensesTab`** — Core pre-authorization import flow (~390 lines)
3. **`VerifyLicenseTab`** — License verification step (~420 lines)
4. **`ImportHistoryTab`** — Import history view

These must be implemented before license-management section is production-ready.

See `issues.md` for ISS-016 and ISS-017 for detailed remediation steps.
