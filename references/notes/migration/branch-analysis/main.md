# Branch: main

**Last commit:** 2026-02-16 (`c10358f` — "chore: update pages")
**Purpose:** Complete App Router migration of all 87 active feature pages
**Status:** Incomplete — build is FAILING, 3 critical issues, 1 feature placeholder

---

## Purpose

The primary migration branch. Contains the full 87-page migration from Next.js 13 Pages Router to Next.js 16 App Router, with shadcn/ui component system and Tailwind CSS 4.

---

## Status

**Overall: ⚠️ Functionally Incomplete — requires feat/design-inspect merge + targeted fixes**

The 87 pages are present and structurally migrated. However:
- Build FAILS in production (ECONNREFUSED during static generation — no `force-dynamic`)
- Auth middleware is absent (security gap)
- 1 page is a placeholder (pre-authorization)
- 11 forms still use Formik/Yup (0 migration progress from original)

---

## Quality Assessment

**Rating: C+ — Structurally sound, operationally blocked**

The skeleton is correct: correct routing, correct shadcn setup, correct Tailwind 4, correct Jotai state. But significant gaps prevent production readiness.

---

## Framework Migration Assessment

### App Router Adoption ✅
- 87 `page.tsx` files under `app/` — 100% page coverage
- Dynamic routes preserved: `[projectID]`, `[messageID]`, `[name]`, `[id]`
- Redirects implemented as Server Components using `next/navigation`
- Root `layout.tsx` with JotaiProvider, ThemeProvider, Toaster

### Layouts ❌ INCOMPLETE
- **1 root layout only** (app/layout.tsx)
- **0 nested layouts** — the 30 chat pages under `[projectID]/chat/` share no layout
- **0 loading.tsx files**
- **1 root error.tsx** — no section-level error boundaries

### Server vs Client Boundaries ❌ SUBOPTIMAL
- `'use client'` count: 186 in src/ + 154 in app/ = **340 total**
- Nearly all `page.tsx` files are `'use client'` — Server Component benefits lost
- Reason: Jotai atoms require client-side rendering for all consumer pages
- Nuance: Given the console's interactive nature, most `'use client'` is legitimate; the issue is that `page.tsx` itself could be a Server Component shell

### Build Status ❌ FAILING
- `force-dynamic` not set on any page in main
- Next.js tries to statically generate pages during build
- Pages call Jotai atoms/axios at render time → ECONNREFUSED
- **Fix exists on `feat/design-inspect`** (63 pages fixed)

### Middleware ❌ MISSING — CRITICAL
- `middleware.ts` does NOT exist in migration repo (only in `legacy/`)
- Original middleware: cookie check → POST to login validation → SSO redirect
- Migration has `AuthProvider` component + `useAuth` hook (client-side check)
- **Gap:** No server-side auth enforcement. Unauthenticated users may see page shells before redirect.
- `feat/design-inspect` has auth bypass for design mode — needs proper middleware for production

---

## Tailwind CSS 4 Assessment ✅

- No `tailwind.config.js` — correct (CSS-based config for TW4)
- `@import 'tailwindcss'` in globals.css — correct
- `tw-animate-css` imported — correct TW4 animation setup
- oklch() color space for design tokens — modern and correct
- **Issue:** `.agora-card`, `.agora-button-primary`, `.agora-button-secondary`, `.agora-sidebar`, `.agora-table`, `.agora-input`, `.agora-status-*` CSS component classes defined in globals.css — these bypass shadcn (violates utility-first principle)
- **Issue:** Some `components/ui/*.tsx` files directly use `agora-*` CSS tokens as className values (alert-dialog.tsx, date-range-picker.tsx, time-picker.tsx) — these are CUSTOM builds in the `ui/` directory, not pure shadcn

---

## Component System Assessment ✅ Mostly Good

### shadcn/ui Setup
- `components.json` properly configured (new-york style, RSC-aware)
- **76 UI components installed** — comprehensive coverage
- Custom Agora-extended components: action-group, alert-box, announcement-banner, base-card, button-group, data-table, date-range-picker, empty-state, file-uploader, filter-dropdown, horizontal-card, icon-button, image-carousel, input-copy, input-editable, input-file, input-group, input-layout, item, kbd, layout-card, lottie, month-range-picker, page-pagination, select-field, select-multiple, select-nested, spinner, suspension-banner, table-pagination, textarea-highlight, time-picker, timeline

### Feature Component Coverage
All major domains have feature components:
- `features/billing/` — 14 components ✅
- `features/subscriptions/` — 16 components ✅
- `features/project-management/` — 15 components + conv-ai sub-folder ✅
- `features/license-management/` — 7 components (⚠️ pre-authorization MISSING)
- `features/settings/` — 5 components ✅
- `features/usages/` — 9 components ✅
- `features/extensions-marketplace/` — 9 components ✅
- `features/dashboard/` — 8 components ✅
- `features/notifications/` — 4 components ✅
- `features/onboarding/` — 8 components (⚠️ PascalCase naming violations)
- `features/two-factor-authentication/` — 1 component ✅
- `features/restful-api/` — 1 component ✅
- `features/auto-pay/` — 1 component ✅

### Rule Violations in components/ui/
The `components/ui/` directory contains custom Agora-extended components (not just pure shadcn). Several directly embed `agora-*` CSS class names. Per RULE.md: "Never modify `components/ui/*` directly." This is a systematic violation across the custom components.

---

## Code Quality Scan

| Metric | Count | Assessment |
|--------|-------|------------|
| `any` types | 235 | High — improvement from 477 (original) but regression from claimed 293 |
| TODOs | 134 total (100 src + 34 app) | 100% are "// TODO: Add telemetry event" — systematic work item |
| console.log (src/) | 2 | Low: agora-rtc-component.tsx (pre-existing), help-us-improve-modal.tsx |
| console.log (app/) | 10 | All in `app/playground/` demos — not production code |
| eslint-disable | 2 | Only in dashboard/usages.tsx — improvement from original's 8 |
| Inline styles | 20 | Violates RULE.md — should be 0 |
| Formik imports | 11 | Zero progress from original (11 files) |
| Yup imports | 11 | Zero progress from original (11 files) |
| RHF imports | 4 | form.tsx (wrapper) + 2 feature components + 1 profile page |
| Zod imports | 4 | Minimal adoption |
| iconsax-react | 6 files | Unconsolidated: add-card-modal, invoices, latest-invoice-table, rtc-subscription-usage, settings/profile, billing/all-designs |
| react-toastify | 2 files | Dual toast libraries: add-card-modal.tsx + Toast.tsx utility wrapper |
| PascalCase files | 8+ | src/components/features/onboarding/*.tsx (8 files) + all src/assets/icons/*.tsx |

---

## Missing vs Baseline

### Missing Hooks (3)
- `useLicensePermission` — in original, not migrated
- `useFreeQuotaUsage` — in original, not migrated
- `useRtcAnnouncementTracking` — in original, not migrated
- Hook filename convention violations: `useAuth.ts`, `usePermission.ts`, `useRtcPlans.ts`, `useRtcQuota.ts` should be `use-auth.ts` etc.

### Missing/Wrong Stores (2)
- `rtc-announcement-tracking.ts` — completely absent
- `subscriptions.ts` → exists as `subsciptions.ts` (typo in filename)

### Large Files (>500 lines — violates 200-line rule)
| File | Lines | Issue |
|------|-------|-------|
| `app/project-management/[projectID]/flexible-classroom/page.tsx` | 1,092 | Monolithic page — should extract components |
| `app/project-management/[projectID]/whiteboard-services/page.tsx` | 790 | Monolithic page |
| `src/components/features/settings/team-management-table.tsx` | 1,056 | Pre-existing — carried forward |
| `app/settings/profile/page.tsx` | 863 | Profile page — massive, needs decomposition |
| `src/components/features/billing/add-card-modal.tsx` | 952 | Pre-existing — carried forward |
| `src/components/features/project-management/conv-ai-playground/turn-detection-settings/` | 573 | |

---

## Issues Found

| ID | Severity | Issue |
|----|----------|-------|
| ISS-001 | Critical | No middleware.ts — auth enforcement missing |
| ISS-002 | Critical | Build fails on main (no force-dynamic) |
| ISS-003 | Critical | pre-authorization page is a placeholder ("coming soon") |
| ISS-004 | High | Formik/Yup not migrated (11 files each) |
| ISS-005 | High | 3 hooks missing (useLicensePermission, useFreeQuotaUsage, useRtcAnnouncementTracking) |
| ISS-006 | High | rtc-announcement-tracking.ts store missing |
| ISS-007 | High | `ignoreBuildErrors: true` — TypeScript errors masked |
| ISS-008 | High | 100 TODOs: telemetry events not implemented |
| ISS-009 | Medium | .agora-* CSS component classes in globals.css (bypass shadcn) |
| ISS-010 | Medium | `components/ui/*` directly embeds agora-* CSS tokens (violates RULE.md) |
| ISS-011 | Medium | 20 inline styles (style={{...}}) — violates RULE.md |
| ISS-012 | Medium | 8 PascalCase files in onboarding (naming violation) |
| ISS-013 | Medium | subsciptions.ts typo in store filename |
| ISS-014 | Medium | iconsax-react in 6 files (not consolidated to lucide) |
| ISS-015 | Medium | react-toastify + sonner dual toast libraries |
| ISS-016 | Medium | 0 loading.tsx, 1 root error.tsx (no nested boundaries) |
| ISS-017 | Medium | 0 nested layouts for project-management/chat, signaling, settings |
| ISS-018 | Low | Hook files named camelCase (useAuth.ts vs use-auth.ts) |

---

## Recommendation

**Revise** before merge to production. Specific required fixes:

1. **Immediate:** Merge `feat/design-inspect` → fixes build (ISS-002) and adds service layer
2. **Before prod:** Add `middleware.ts` for SSO auth enforcement (ISS-001)
3. **Before prod:** Complete pre-authorization page (ISS-003)
4. **Sprint:** Form migration from Formik/Yup → RHF/Zod for 11 remaining files (ISS-004)
5. **Sprint:** Add 3 missing hooks (ISS-005)
