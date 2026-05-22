# Risk Register — Console Migration

**Agent:** Analysis Agent (Phase 3)
**Date:** 2026-02-20
**Scope:** All risks identified across 4-phase evaluation pipeline

---

## Risk Matrix

| Risk | Likelihood | Impact | Priority | Mitigation |
|------|-----------|--------|----------|------------|
| Auth bypass via missing middleware | High | Critical | 🔴 P0 | Create middleware.ts before any deployment |
| License management accessible to unauthorized users | High | Critical | 🔴 P0 | Implement LicensePermissionGuard + useLicensePermission |
| Main branch cannot be deployed (build fails) | High | Critical | 🔴 P0 | Merge feat/design-inspect immediately; fix remaining 17 pages |
| Pre-authorization feature ships as stub | High | Critical | 🔴 P0 | Migrate 3 components (ImportLicensesTab, VerifyLicenseTab, ImportHistoryTab) |
| Feature drift between repos accelerates | High | High | 🟠 P1 | Establish regular sync cadence; merge and close gap ASAP |
| Form regression in settings/profile (OTP, password) | Medium | High | 🟠 P1 | Manual QA settings profile; complete form migration |
| Stripe API regression (1.x → 8.x) | Medium | High | 🟠 P1 | Manual QA card management, payment flows |
| Free-tier billing display broken | High | Medium | 🟠 P1 | Port useFreeQuotaUsage hook |
| 48 any-types in app/ surface as production bugs | Medium | Medium | 🟠 P1 | Remove ignoreBuildErrors; fix types |
| 134 TODOs represent unfinished features | Medium | High | 🟠 P1 | Audit and classify each TODO before launch |
| White-label pages (whiteboard, flexible classroom) have regressions | Medium | High | 🟠 P1 | Manual QA these 1,200+ line components |
| RTC announcements reappear per page load | High | Low | 🟡 P2 | Port useRtcAnnouncementTracking |
| .agora-* CSS classes diverge over time | Medium | Medium | 🟡 P2 | Post-launch: migrate to shadcn utilities |
| 340 'use client' files limit App Router performance gains | Low | Medium | 🟡 P3 | Post-launch architectural sprint |
| ConvAI/Agora RTC SDK behavioral changes | Low | High | 🟠 P1 | Test ConvAI Playground end-to-end in staging |
| Missing nested layouts degrade navigation performance | Low | Low | 🟢 P4 | Add during post-launch polish phase |
| Historical branches create developer confusion | High | Low | 🟢 P3 | Delete 7 stale branches (30min task) |

---

## Detailed Risk Analysis

### RISK-001: Authentication Bypass (Server-Side)

**Likelihood**: High — occurs on every unauthenticated request
**Impact**: Critical — server-rendered HTML is delivered before auth check runs
**Status**: Open — no mitigation in place on any branch

**Scenario**: An unauthenticated user navigates to `/billing`. Next.js serves the page HTML (dashboard shell, loading states) before React hydrates and the `useAuth` hook fires the redirect. The user may see partial content — or a crawl bot indexes dashboard pages.

**Mitigation**:
1. Create `middleware.ts` at repo root — port exact logic from `legacy/middleware.ts`
2. Test with unauthenticated browser — verify redirect fires before any page content loads
3. Add E2E test: unauthenticated GET → expect 302 to login URL

**Acceptance criteria**: Direct navigation to any authenticated route while unauthenticated results in an immediate redirect, with no page HTML served.

---

### RISK-002: License Management Access Control Bypass

**Likelihood**: High — every authenticated user can navigate directly to license pages
**Impact**: Critical — license management contains purchase, quota, and import data for enterprise customers
**Status**: Open — no guard on any branch

**Scenario**: An authenticated user without license permissions navigates to `/license-management/purchase-history` and views purchase data, quotas, or usage data that should be gated by license access.

**Mitigation**:
1. Implement `useLicensePermission` hook — port exact permission check from original
2. Implement `LicensePermissionGuard` component
3. Apply guard to all 4 license-management pages
4. Consider App Router route group `(protected)/layout.tsx` for server-side gating

---

### RISK-003: Feature Drift — Original vs Legacy Copy

**Likelihood**: High — `repos/console-orig` has 90+ branches; `legacy/` is synced manually
**Impact**: High — features shipping in original may never reach migration
**Status**: Partially mitigated — `feat/design-inspect` shows active syncing today (210+ `legacy/` files updated)

**Scenario**: The `repos/console-orig` production codebase ships a new feature. The `legacy/` copy inside `repos/console-shadcn` is not updated. The migration ships without the new feature. Customer discovers the regression after launch.

**Mitigation**:
1. Establish a weekly `git diff repos/console-orig/main legacy/` check
2. Track any `console-orig` PRs and add corresponding tasks to the migration
3. Merge `feat/design-inspect` immediately to close the current gap
4. Before launch: run a final comprehensive diff between `console-orig/main` and `legacy/` on the migration's main branch

---

### RISK-004: Stripe API Regression (1.x → 8.x)

**Likelihood**: Medium — Stripe has significant API changes between major versions
**Impact**: High — payment flows are revenue-critical
**Status**: Unverified — upgrade happened but no QA evidence

**Scenario**: The card management UI renders correctly but a subtle Stripe API change (different field names, different error handling, different element config) causes payment failures in production.

**Mitigation**:
1. Manual end-to-end test of the complete payment flow: add card → set default → remove card
2. Verify `NEXT_PUBLIC_STRIPE_SG` (Singapore region key) continues to work with Stripe 8.x
3. Review Stripe 2.x → 8.x migration guide for breaking changes in `CardElement` and `CardNumberElement` APIs
4. Set up Stripe test mode for CI

---

### RISK-005: Complex Page Regressions (Whiteboard, Flexible Classroom)

**Likelihood**: Medium — large (1,200+ line) pages were preserved as-is; subtle integration issues possible
**Impact**: High — these are differentiating features for enterprise customers

**Scenario**: `whiteboard-services.tsx` (1,235 lines) and `flexible-classroom.tsx` (1,226 lines) were migrated by the "Copy the Brain, Change the Face" approach. A subtle difference in how the Agora SDK hooks interact with React 19's stricter concurrent mode could cause silent failures.

**Mitigation**:
1. Manual QA: launch whiteboard services and flexible classroom end-to-end
2. Enable `reactStrictMode: true` before QA to catch concurrent mode issues
3. Test with Agora SDK in a sandbox environment

---

### RISK-006: Settings Form Regression (OTP, Password Reset)

**Likelihood**: Medium — Formik forms not migrated; forms preserved as-is but not converted to RHF
**Impact**: High — profile settings control account security (OTP, 2FA, password, email)

**Scenario**: The settings/profile forms were copied from the original with Formik intact. A subtle difference in how shadcn Input components interact with Formik's `Field` component causes form validation or submission to fail silently.

**Mitigation**:
1. Manual QA: test each settings form flow completely (OTP verification, phone update, email update, password reset)
2. Complete form migration (ISS-005) before launch
3. Add integration tests for auth-changing form flows

---

### RISK-007: 134 TODOs as Hidden Feature Gaps

**Likelihood**: Medium — 34 files have TODOs; some represent deferred features
**Impact**: High — TODOs adjacent to business logic could mean incomplete implementations

**Scenario**: A TODO comment marks an incomplete validation handler, error state, or API call. The code ships. A user triggers the edge case and gets a broken experience.

**Mitigation**:
1. Audit all 134 TODOs before launch — classify as code change, tracked issue, or delete
2. Any TODO adjacent to form validation, API calls, or error handling is HIGH priority
3. Run `grep -rn "TODO\|FIXME" src/ app/` and review each in context

---

### RISK-008: TypeScript Hidden Errors Behind ignoreBuildErrors

**Likelihood**: Medium — build error suppression is active; unknown count of type errors
**Impact**: Medium — type errors that compile can cause runtime crashes

**Scenario**: A TypeScript error in a payment or auth flow is hidden by `ignoreBuildErrors: true`. The code ships. The runtime type mismatch causes a production exception.

**Mitigation**:
1. Run `tsc --noEmit` from `repos/console-shadcn/`
2. If zero errors (as claimed by feat/design-inspect's build notes), remove the flag immediately
3. If errors present, classify and fix before launch

---

## Risk Prioritization Matrix

```
                    IMPACT
                Low     Medium    High     Critical
            ┌────────┬─────────┬────────┬──────────┐
High        │ ISS-013│ ISS-003 │ ISS-014│ ISS-001  │
Likelihood  │ ISS-019│ ISS-009 │ ISS-005│ ISS-002  │
            │        │ ISS-007 │        │ ISS-016  │
            │        │         │        │ ISS-017  │
            ├────────┼─────────┼────────┼──────────┤
Medium      │ ISS-010│ ISS-004 │ ISS-005│ Stripe   │
Likelihood  │ ISS-011│ ISS-006 │ ISS-014│ Whitebrd │
            │        │         │ ISS-018│          │
            ├────────┼─────────┼────────┼──────────┤
Low         │        │ ISS-011 │ ISS-006│          │
Likelihood  │        │         │        │          │
            └────────┴─────────┴────────┴──────────┘
```

**P0 (High × Critical):** ISS-001, ISS-002, ISS-016, ISS-017
**P1 (High × High or Medium × High):** ISS-005, ISS-014, ISS-018, Stripe QA, whiteboard QA
**P2 (Medium × Medium):** ISS-004, ISS-007
**P3+ (Low/Medium × Low/Medium):** ISS-003, ISS-006, ISS-010, ISS-011, ISS-013
