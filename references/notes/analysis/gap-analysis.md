# Gap Analysis — Console Migration

**Agent:** Analysis Agent (Phase 3)
**Date:** 2026-02-20
**Source data:** `notes/baseline/*`, `notes/migration/*`
**Branch evaluated:** main (quality), feat/design-inspect (build status)

---

## 1. Page Migration Status

**Total original active pages:** 87
**Migration pages:** 87 (100% route coverage)

| Section | Total | ✅ Complete | ↩️ Redirect | 🚧 Placeholder | ➖ N/A |
|---------|-------|------------|------------|----------------|-------|
| Root | 4 | 2 | 0 | 0 | 2 |
| Billing | 6 | 6 | 0 | 0 | 0 |
| Project Management | 58 | 57 | 1 | 0 | 0 |
| Subscriptions | 5 | 4 | 1 | 0 | 0 |
| License Management | 5 | 3 | 1 | **1** | 0 |
| Settings | 5 | 5 | 0 | 0 | 0 |
| Other (credentials, usage, notifications, etc.) | 11 | 11 | 0 | 0 | 0 |
| **TOTAL** | **94** | **88** | **3** | **1** | **2** |

> Note: 2 new pages added during migration (purchase-history, playground), bringing app total to 89 pages.

### Quality Breakdown

All 88 "complete" and "redirect" pages carry a **🟡 yellow** quality rating on main branch due to:
- Missing `export const dynamic = 'force-dynamic'` (80 pages fail to build on main)
- Many pages use `.agora-*` CSS classes instead of Tailwind utilities (ISS-003)

Only 1 page is **🔴 red:** `/license-management/pre-authorization` — placeholder stub with no business logic.

On `feat/design-inspect`, 63/80 data-fetching pages are fixed for build. Yellow → green when merged + remaining 17 fixed.

### Pages Requiring Manual QA

| Page | Risk | Reason |
|------|------|--------|
| `/settings/profile` | High | OTP, phone, email, password forms — Formik still present |
| `/project-management/.../flexible-classroom` | High | 1,226-line component — complex real-time integration |
| `/project-management/.../whiteboard-services` | High | 1,235-line component — complex WebRTC integration |
| `/project-management/.../convo-ai` | Medium | Agora RTC + AI SDK integration |
| `/billing/manage-cards` | Medium | Stripe 1.x → 8.x version upgrade — verify card element API |
| `/settings/teams-members` | Medium | Complex member management table with modals |

---

## 2. Component Migration Status

**Total original components (excl. UI primitives):** 219
**Migration coverage:** 93% (204/219 accounted for)

| Domain | Total | ✅ Migrated | ⚠️ Issues | 🚧 Placeholder | 🚫 Not Started | ➖ N/A |
|--------|-------|------------|----------|----------------|----------------|-------|
| UI Primitives | 14 | 14 | 0 | 0 | 0 | 0 |
| Common/Shared | 46 | 40 | 6 | 0 | 0 | 0 |
| Billing | 10 | 9 | 1 | 0 | 0 | 0 |
| License Management | 7 | 3 | 0 | 1 | **4** | 0 |
| Project Management | 42+ | 42+ | 0 | 0 | 0 | 0 |
| Subscriptions | 6 | 6 | 0 | 0 | 0 | 0 |
| Settings | 5 | 5 | 0 | 0 | 0 | 0 |
| Other domains | 51 | 51 | 0 | 0 | 0 | 0 |
| Not-needed | 12 | — | — | — | — | 12 |
| **TOTAL** | **219** | **196** | **8** | **1** | **7** | **12** |

### Components With Issues (8)

| Component | Issue | Severity |
|-----------|-------|----------|
| `Sidebar` | `.agora-sidebar` CSS class | Major |
| `DataTable` | `.agora-table` CSS class | Major |
| `PaymentMethodCard` | `: any` type in payment response handler | Major |
| `BillingDashboard` | `style={{}}` inline style on chart container | Minor |
| `ProjectManagementLayout` | Missing `loading.tsx` fallback | Major |
| `NotificationList` | `!bill.paymentStatus` (falsy check) vs explicit `=== 1` enum check | Minor |
| `subscriptions store` | Filename typo: `subsciptions.ts` (missing 'r') | Minor |
| Multiple (80+) | `.agora-*` CSS classes used broadly | Major |

### Components Not Started (7) — All Blocking License Management

| Component | Lines | Criticality | Issue |
|-----------|-------|-------------|-------|
| `LicensePermissionGuard` | ~50 | **CRITICAL — security gate** | ISS-016 |
| `ImportLicensesTab` | ~390 | **CRITICAL — core feature** | ISS-017 |
| `VerifyLicenseTab` | ~420 | **CRITICAL — core feature** | ISS-017 |
| `ImportHistoryTab` | ~150 | **CRITICAL — core feature** | ISS-017 |
| `useLicensePermission` | ~30 | **CRITICAL — hook for guard** | ISS-016 |
| `useFreeQuotaUsage` | ~40 | Major — billing free tier | ISS-018 |
| `useRtcAnnouncementTracking` | ~30 | Minor — announcement state | ISS-019 |

---

## 3. Feature Parity Checklist

| Feature | Original | Migration | Parity |
|---------|----------|-----------|--------|
| Authentication flow (client-side) | ✅ | ✅ | ✅ Full |
| **Server-side auth middleware** | ✅ middleware.ts | ❌ MISSING | 🔴 Broken |
| Dashboard / home | ✅ | ✅ | ✅ Full |
| Billing overview + wallet | ✅ | ✅ | ✅ Full |
| Invoices (monthly + pre-paid) | ✅ | ✅ | ✅ Full |
| Invoice payment status | ✅ Enum (0/1/2) | ⚠️ Falsy check | ⚠️ Partial |
| Manage cards (Stripe) | ✅ Stripe 1.x | ✅ Stripe 8.x | ⚠️ Needs QA |
| Transactions + withdrawals | ✅ | ✅ | ✅ Full |
| Auto-pay configuration | ✅ | ✅ | ✅ Full |
| All 58 project management pages | ✅ | ✅ | ✅ Full |
| ProjectManagementLayout | ✅ | ✅ Component | ⚠️ No App Router layout |
| ConvAI Playground (Agora RTC) | ✅ | ✅ | ✅ Full |
| Whiteboard services | ✅ 1,235 lines | ✅ Preserved | ⚠️ Needs QA |
| Flexible classroom | ✅ 1,226 lines | ✅ Preserved | ⚠️ Needs QA |
| All subscriptions + plans | ✅ | ✅ | ✅ Full |
| **License: purchase history** | ✅ + guard | ✅ no guard | 🔴 Unprotected |
| **License: quota management** | ✅ + guard | ✅ no guard | 🔴 Unprotected |
| **License: usages query** | ✅ + guard | ✅ no guard | 🔴 Unprotected |
| **License: pre-authorization** | ✅ 3 complex tabs | 🚧 Placeholder | 🔴 Not implemented |
| Settings: account | ✅ | ✅ | ✅ Full |
| Settings: profile (OTP, phone, etc.) | ✅ Formik | ✅ Formik | ⚠️ Forms not migrated |
| Settings: teams & members | ✅ Formik | ✅ Formik | ⚠️ Forms not migrated |
| Settings: SSO management | ✅ Formik | ✅ Formik | ⚠️ Forms not migrated |
| Settings: notification preferences | ✅ | ✅ | ✅ Full |
| Credentials | ✅ | ✅ | ✅ Full |
| RESTful API keys | ✅ | ✅ | ✅ Full |
| Extensions marketplace | ✅ | ✅ | ✅ Full |
| Finance/packages | ✅ | ✅ | ✅ Full |
| Usage analytics | ✅ | ✅ | ✅ Full |
| Notifications (shallow routing) | ✅ | ✅ | ✅ Full |
| Onboarding flow | ✅ | ✅ | ✅ Full |
| Free tier quota display | ✅ useFreeQuotaUsage | ❌ Hook missing | 🔴 Broken for free tier |
| RTC announcement tracking | ✅ localStorage | ❌ Store missing | 🔴 Announcements reappear |
| Dark/light theme | ✅ next-themes | ✅ next-themes | ✅ Full |
| Chat service iframe | ✅ | ✅ | ✅ Full |
| ConvoAI Studio iframe | ✅ | ✅ | ✅ Full |
| 2FA modal | ✅ | ✅ | ✅ Full |
| Suspension/credit card banners | ✅ | ✅ | ✅ Full |
| Design inspect mode | ❌ N/A | ✅ feat/design-inspect | ✨ New capability |
| Service layer abstraction | ❌ N/A | ✅ feat/design-inspect | ✨ Architectural improvement |

**Feature parity summary:**
- ✅ Full parity: 30 features
- ⚠️ Partial / needs QA: 8 features
- 🔴 Broken / missing: 7 features

---

## 4. Regression Risks

Items that work in the original but are broken or degraded in the migration:

| Risk | Severity | Original | Migration | Impact |
|------|----------|----------|-----------|--------|
| Server-side auth enforcement | 🔴 Critical | middleware.ts validates cookie server-side | Client-side only — server HTML served before auth check | Unauthenticated users receive page HTML |
| License section access control | 🔴 Critical | LicensePermissionGuard gates 4 pages | No guard exists | Any authenticated user can access license management |
| Pre-authorization feature | 🔴 Critical | 3 functional tabs (~960 lines) | "Coming soon" stub | Feature is 0% functional |
| Free tier billing display | 🔴 Major | useFreeQuotaUsage provides data | Hook missing | Free tier quota widgets show no data |
| RTC announcement state | 🔴 Major | localStorage persistence | Store missing | Dismissed announcements re-appear every page load |
| Invoice payment status display | 🟠 Major | Explicit status codes (0/1/2) | Falsy check (`!bill.paymentStatus`) | Partial payments may display as "Paid" |
| Build (deployability) | 🔴 Critical | N/A (Pages Router) | 0 force-dynamic on main → ECONNREFUSED | Cannot deploy main branch |
| Console.log statements | 🟡 Minor | 4 total | 16 total | Debug output visible in production |
| TypeScript type safety | 🟠 Major | 477 any types | 293 any types (48 in app/) | Improvement, but still high |
| Form consistency | 🟠 Major | Formik + Yup consistently | Dual Formik + RHF (11 each) | Inconsistent behavior, two bundles |

---

## 5. Hooks & Stores Gap

### Hooks

| Hook | Original | Migration | Status |
|------|----------|-----------|--------|
| `usePermission` | ✅ | ✅ | Migrated |
| `useAuth` | ✅ | ✅ Client-only | Migrated (server-side gap: ISS-001) |
| `useProjectList` | ✅ | ✅ | Migrated |
| `useRtcPlans` | ✅ | ✅ | Migrated |
| `useRtcQuota` | ✅ | ✅ | Migrated |
| `useBilling` | ✅ | ✅ | Migrated |
| `useNotifications` | ✅ | ✅ | Migrated |
| `useOnboarding` | ✅ | ✅ | Migrated |
| `useLicensePermission` | ✅ | ❌ MISSING | Not started — blocks ISS-016 |
| `useFreeQuotaUsage` | ✅ | ❌ MISSING | Not started — ISS-018 |
| `useRtcAnnouncementTracking` | ✅ | ❌ MISSING | Not started — ISS-019 |

**Hook coverage: 8/11 (72.7%)**

### Stores (Jotai Atoms)

| Store | Original | Migration | Status |
|-------|----------|-----------|--------|
| All 26 domain stores | ✅ 27 files | ✅ 26 files | Migrated |
| `subscriptions.ts` | ✅ | ⚠️ `subsciptions.ts` (typo) | Migrated with typo |
| `rtc-announcement-tracking.ts` | ✅ | ❌ MISSING | Not started |

**Store coverage: 26/27 (96.3%)**

---

## 6. API Routes Gap

| Route | Original | Migration | Status |
|-------|----------|-----------|--------|
| `/api/console-proxy/[endpoint]` | ✅ | ✅ | Migrated |
| `/api/onboarding` | ✅ | ✅ | Migrated |
| `/api/mock-flow` | ✅ | ✅ (design inspect) | Migrated |
| `/api/source/download` | ✅ | ✅ | Migrated |
| `/api/ui-customizer/features` | ✅ | ✅ | Migrated |

**API route coverage: 5/7 (100% of non-dev routes)**

---

## Summary: What's Missing

### Blocking Production (Must Fix Before Deploy)

1. **middleware.ts** — server-side auth enforcement (ISS-001)
2. **export const dynamic = 'force-dynamic'** on 80 pages — build fix (ISS-002; 63 fixed on feat/design-inspect)
3. **LicensePermissionGuard + useLicensePermission** — license section access control (ISS-016)
4. **Pre-authorization: ImportLicensesTab, VerifyLicenseTab, ImportHistoryTab** — core feature (ISS-017)

### Missing Before Launch (Quality Gate)

5. **useFreeQuotaUsage hook** — free tier billing display (ISS-018)
6. **useRtcAnnouncementTracking + rtc-announcement-tracking store** — announcement persistence (ISS-019)
7. **Form migration** — 11 Formik forms → react-hook-form + zod (ISS-005)
8. **Invoice payment status** — align falsy check with enum check (ISS-015)
9. **Remove typescript.ignoreBuildErrors** (ISS-004)
10. **Fix 48 `any` types in app/** (ISS-007)

### Post-Launch Refinement (Architectural)

11. **Nested App Router layouts** for project-management, billing, settings (ISS-011)
12. **Remove .agora-* CSS component classes** (ISS-003)
13. **Reduce 'use client' usage** — push to leaf components (ISS-006)
14. **Enable reactStrictMode: true** (ISS-010)
15. **Resolve 134 TODO comments** (ISS-014)
