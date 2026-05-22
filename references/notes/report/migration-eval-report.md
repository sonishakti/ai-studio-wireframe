# Console Dashboard Migration Evaluation Report

Generated: 2026-02-20
Evaluation Pipeline: Strategy Agent → Baseline Agent → Migration Agent → Analysis Agent
Repos: `repos/console-orig` (original) | `repos/console-shadcn` (migration)

---

## 0. Migration Strategy Verdict

**Verdict: ⚠️ STRATEGY SOUND — 6 Adjustments Required Before Production**

The core migration approach is correct. The team chose the right stack (Next.js 16, React 19, App Router, Tailwind 4, shadcn/ui) and has made impressive quantitative progress (100% route coverage, 93% component coverage). The "Copy the Brain, Change the Face" philosophy is documented and followed consistently.

**However, there are 4 blocking issues that prevent any production deployment:**

1. **No server-side authentication middleware** — security regression
2. **Main branch build fails** — 80 data-fetching pages produce ECONNREFUSED during static generation
3. **License management section unprotected** — any authenticated user can access enterprise license data
4. **Pre-authorization feature is a "coming soon" stub** — critical enterprise feature not implemented

**Skill guidelines that informed this verdict:**

- **Vercel Composition Patterns**: The migration violates "push 'use client' boundaries down" with 340 `'use client'` directives. App Router's primary benefit — Server Components — is unused. The `feat/design-inspect` service layer is the correct foundation for correcting this.
- **Vercel React Best Practices**: All data fetching is client-side via `useEffect` + axios. The migration preserves the original's pattern rather than adopting React Server Component data fetching. This is a missed optimization, not a defect.
- **Web Design Guidelines**: The `.agora-*` CSS component classes in `globals.css` create a parallel style system that undermines shadcn's design token architecture. This should be eliminated post-launch.

**Adjustments required (ordered by priority):**
1. Create `middleware.ts` — server-side auth enforcement (4h)
2. Merge `feat/design-inspect` → main immediately — fixes build + adds service layer (1h)
3. Implement `LicensePermissionGuard` and `useLicensePermission` (1 day)
4. Migrate pre-authorization tab components (3–4 days)
5. Complete form migration from Formik to react-hook-form + zod (2–4 days)
6. Remove `typescript.ignoreBuildErrors: true` after verifying clean build (4–8h)

---

## 1. Executive Summary

**Overall Migration Health: 🟡 Yellow**
**Estimated Completion: ~87% feature-complete; ~0% deployment-ready on main**

The Console Dashboard migration is functionally well-advanced. Of 87 original pages, 88 have migration equivalents (100% route coverage). Of 219 original components, 204 are migrated or confirmed not-needed (93%). The shadcn/ui integration is complete, Tailwind 4 migration was done correctly, and the new dependency stack represents genuine modernization.

However, the migration cannot be deployed in its current state. The main branch fails to build due to missing `force-dynamic` directives on 80 pages. Two critical security regressions exist: no server-side auth middleware and no license permission gate. The pre-authorization feature — a key enterprise capability — ships as a non-functional placeholder. These are not minor polish issues; they are blockers that require targeted implementation work before any production deployment.

The `feat/design-inspect` branch (updated today) is a significant positive development. It fixes 63 of 80 broken pages, introduces a clean service layer abstraction across 14 files, and enables design-team collaboration via static mock data. This branch should be merged into main immediately. Doing so would move deployment readiness from ~0% to ~60%.

**Top 3 Risks:**
1. Auth bypass: Server-rendered HTML delivered to unauthenticated users before client-side redirect fires
2. License data exposure: 4 enterprise license management pages accessible to any authenticated user
3. Feature regression: Pre-authorization tab is a stub; any user navigating there sees "coming soon"

**Top 3 Wins:**
1. 100% route coverage: every original user-facing URL has a working migration equivalent
2. `feat/design-inspect` service layer: clean API abstraction with full mock data for design-dev collaboration
3. shadcn/ui complete: all 14 custom Radix primitives replaced; 76 shadcn components installed and in use

**Recommended Priority Shift:**
The team should pause new feature work and complete a focused "deployment readiness sprint" targeting the 4 blocking issues. Estimated effort: ~6–8 developer-days. After that sprint, the migration is ready for staging deployment and expanded QA.

---

## 2. Architecture Comparison

| Dimension | Original (console-orig) | Migration (console-shadcn) | Assessment |
|-----------|------------------------|---------------------------|------------|
| **Framework** | Next.js 13.2.4 (Pages Router) | Next.js 16.1.1 (App Router) | ✅ Major upgrade |
| **React** | React 18.2 | React 19.2 | ✅ Latest |
| **TypeScript** | 4.9.5 (`noImplicitAny: false`) | 5.x (strict) | ✅ Improvement |
| **Styling** | Tailwind 3.2 (JS config) | Tailwind 4.x (CSS config) | ✅ Modern |
| **UI Components** | Custom CVA wrappers on Radix | shadcn/ui (new-york) | ✅ Standardized |
| **Routing** | Pages Router (file-based) | App Router (directory-based) | ✅ App Router |
| **Layouts** | Manual layout composition (6 custom) | 1 root layout.tsx only | ⚠️ Incomplete |
| **Server Components** | N/A (Pages Router) | 0 used (340 'use client') | ⚠️ Unused |
| **Data Fetching** | useEffect + axios (client only) | useEffect + axios (client only) | ➡️ Unchanged |
| **Service Layer** | None (direct axios calls) | 14 service files (feat/design-inspect) | ✅ Improvement (pending merge) |
| **State Management** | Jotai (27 stores, 50+ atoms) | Jotai (27 stores, 50+ atoms) | ✅ Preserved 1:1 |
| **Forms** | Formik + Yup (18 forms) | Formik + Yup (11 files) + RHF (5 files) | ⚠️ Dual stacks |
| **Auth (server)** | middleware.ts cookie check + SSO | None (client-side only) | 🔴 Regression |
| **Auth (client)** | useAuth hook | useAuth hook | ✅ Preserved |
| **Build** | TS/ESLint errors suppressed | TS/ESLint errors suppressed | ➡️ Unchanged (bad) |
| **Bundle size** | 4 icon libraries + custom SVGs | Lucide-react primary | ✅ Improvement |
| **Payments** | Stripe 1.x + react-stripe 2.x | Stripe 8.x + react-stripe 5.x | ✅ Upgrade (needs QA) |
| **Notifications** | react-toastify | sonner (shadcn-compatible) | ✅ Upgrade |
| **Design collab** | N/A | Design inspect mode (feat/design-inspect) | ✨ New capability |
| **`any` type count** | 477 | 293 (48 in app/ dir) | ✅ Reduced 39% |
| **TODO count** | 9 | 134 | 🔴 15x increase |
| **console.log count** | 4 | 16 | ⚠️ 4x increase |

**Where the migration improves:**
- Stack modernization is genuine and complete
- shadcn/ui standardizes UI patterns across all 87 pages
- Service layer abstraction (pending merge) improves testability and design collaboration
- TypeScript `any` types reduced 39% (477 → 293)
- Dependency sprawl partially cleaned (removed styled-components, react-speech-recognition, etc.)

**Where the migration regresses:**
- Server-side authentication removed (middleware.ts not ported)
- Permission gating for license management not implemented
- TODO count increased 15x (9 → 134)
- console.log count increased 4x (4 → 16)
- App Router adopted structurally but Server Component benefits not used

---

## 3. Progress Dashboard

| Category | Total | ✅ Done | 🔄 In Progress | ❌ Not Started | ⚠️ Issues |
|----------|-------|---------|-----------------|----------------|-----------|
| Pages | 87 | 80 | 0 | 1 (pre-auth) | 6 (need QA) |
| Redirects | 4 | 4 | — | — | — |
| Components | 219 | 196 | 0 | 7 | 8 |
| Hooks | 11 | 8 | 0 | 3 | 0 |
| Jotai Stores | 27 | 26 | 0 | 1 | 1 (typo) |
| API Routes | 5 | 5 | — | — | — |
| UI Primitives | 14 | 14 | — | — | — |
| Forms (Formik→RHF) | 11 | 0 | 0 | 11 | — |

**Key numbers:**
- Route coverage: **100%** (87/87 pages)
- Component coverage: **93%** (204/219)
- Hook coverage: **73%** (8/11)
- Store coverage: **96%** (26/27)
- Form migration: **0%** (0/11 Formik forms converted)
- Build status: **❌ FAILS** on main / **✅ PASSES** on feat/design-inspect

---

## 4. Branch-by-Branch Analysis

### Branch: `main`

**Purpose:** Primary migration — 87-page App Router migration of the entire original console
**Status:** Complete (structurally) — **Build FAILS in CI**
**Quality:** ⚠️ Yellow

**Key Findings:**
- All 87 routes present and structurally correct
- 0 `export const dynamic = 'force-dynamic'` directives — every data-fetching page fails to build with ECONNREFUSED
- `middleware.ts` does not exist at repo root — security regression
- 134 TODO comments, 16 console.logs, 293 any types
- Components preserved at 93% coverage; 7 critical components not started (all in license-management)

**Recommendation: DO NOT deploy from main as-is. Merge feat/design-inspect, implement ISS-001, ISS-016, ISS-017, then main becomes the primary deployment target.**

---

### Branch: `feat/design-inspect`

**Purpose:** Design team stub for v0 design collaboration — adds service layer, design inspect mode, build fixes
**Status:** Active — **2 commits ahead of main** — **Build PASSES**
**Quality:** ✅ Green (best branch in repo)

**Key Findings (`+9,595/-2,424` lines vs main):**
- `export const dynamic = 'force-dynamic'` added to 63 pages — fixes build for most data-fetching pages
- 14 service layer files in `src/services/` — clean `apiGet`/`apiPost`/`apiPut`/`apiDelete` abstraction with design inspect mode support
- 60+ JSON mock files in `api-data/` — enables full no-backend UI development
- Auth bypass in `useAuth.ts` — `NEXT_PUBLIC_INSPECT_MODE=design` injects hardcoded user
- 11 `any` types eliminated vs main (235 → 224)
- Duplicate `services/` directory at repo root (not in `src/`) — must be cleaned before merge (ISS-012)
- Missing `force-dynamic` on 17 pages vs. full 80-page coverage

**Recommendation: MERGE to main immediately. This is the most valuable pending work in the repo. Clean up ISS-012 first (15min).**

---

### Branch: `migrate/pages` (and `feat/dashboard`)

**Purpose:** `migrate/pages` = tracking branch, `feat/dashboard` = early UI buildout
**Status:** Both identical to main SHA (`c10358f`) — subsumed
**Quality:** N/A

**Recommendation: DELETE both. Zero value, 100% confusion potential.**

---

### Branches: `migrate/pages-*` (5 branches)

**Purpose:** AI agent timestamped backup snapshots from Jan 9 migration run
**Status:** Historical — all behind main
**Quality:** N/A

**Recommendation: DELETE all 5. Historical only — source-of-truth is main.**

---

### Branch: `playground`

**Purpose:** Enables `app/playground/` route — removes some utility files (296 file deletions vs main)
**Status:** 1 commit ahead of main — distinct purpose
**Quality:** Needs evaluation

**Recommendation: Evaluate whether playground functionality is needed in main. If yes, cherry-pick the relevant commits. Do not merge wholesale (296 deletions).**

---

## 5. Efficiency Issues & Recommendations

*Full code examples in `notes/analysis/efficiency-review.md`. Summary below:*

### ISS-001 — No Server-Side Authentication Middleware
**Severity:** 🔴 Critical | **Effort:** 4h

Create `middleware.ts` at the repo root. Port the SSO redirect logic and cookie name from `legacy/middleware.ts`. Every authenticated route must redirect to the SSO login URL when the auth cookie is absent, before any page HTML is served.

---

### ISS-002 — Build Fails on Main (No force-dynamic)
**Severity:** 🔴 Critical | **Effort:** 2h (post-merge)

Merge `feat/design-inspect` first (fixes 63/80 pages). Then audit the remaining 17 pages and add `export const dynamic = 'force-dynamic'`. Long-term: replace `force-dynamic` with React Suspense + Server Component data fetching using the existing `apiGet` service layer.

---

### ISS-016 — License Section Unprotected
**Severity:** 🔴 Critical | **Effort:** 1 day

Implement `useLicensePermission` hook and `LicensePermissionGuard` component. Best implementation: App Router route group `app/license-management/(protected)/layout.tsx` guards all sub-pages at the routing layer.

---

### ISS-017 — Pre-Authorization Is a Placeholder
**Severity:** 🔴 Critical | **Effort:** 3–4 days

Migrate `ImportLicensesTab` (~390 lines), `VerifyLicenseTab` (~420 lines), and `ImportHistoryTab` from `legacy/src/components/license-management/PreAuthorization/`. Replace Formik with react-hook-form + zod. Replace custom file upload with shadcn-compatible pattern. Apply `LicensePermissionGuard`.

---

### ISS-003 — Custom CSS Classes Duplicate shadcn
**Severity:** 🟠 Major | **Effort:** 3–5 days

Remove `.agora-card`, `.agora-button-*`, `.agora-sidebar-*`, `.agora-table`, `.agora-input` from `globals.css`. Replace each usage with shadcn component + Tailwind utilities. Keep CSS custom properties (design tokens). Schedule as post-launch sprint.

---

### ISS-004 — ignoreBuildErrors Silences Type Errors
**Severity:** 🟠 Major | **Effort:** 4–8h

Remove `typescript: { ignoreBuildErrors: true }` from `next.config.ts`. Run `tsc --noEmit` to surface any hidden errors. Fix all resulting errors. Also remove `eslint: { ignoreDuringBuilds: true }`.

---

### ISS-005 — Form Migration Stalled at 0%
**Severity:** 🟠 Major | **Effort:** 2–4 days

Convert all 11 Formik + 11 Yup files to react-hook-form + zod + shadcn Form components. Priority order: `settings/profile` (OTP, password, email flows) → `settings/sso-management` → `settings/teams-members` → remaining billing and project-management forms.

---

### ISS-006 — 340 'use client' Directives
**Severity:** 🟠 Major | **Effort:** 1–2 weeks

Not blocking. Post-launch architectural sprint. Push `'use client'` to leaf components. Use the existing `apiGet` service layer (from feat/design-inspect) in Server Components. Start with read-only pages (billing, usage, credentials).

---

### ISS-007 — 48 'any' Types in app/ Directory
**Severity:** 🟠 Major | **Effort:** 4–8h

Run `grep -rn ": any\|as any" app/` and fix each. Replace with `unknown` + type narrowing or explicit API response types.

---

### ISS-011 — No Nested Layouts or Loading States
**Severity:** 🟠 Major | **Effort:** 2–3 days

Add `layout.tsx` + `loading.tsx` to: `project-management/[projectID]/`, `billing/`, `settings/`, `license-management/`. This enables persistent section navigation and streaming skeleton states.

---

### ISS-014 — 134 TODO Comments
**Severity:** 🟠 Major | **Effort:** 1–2 days

Audit all 134 TODOs. For each: convert to tracked issue, make the code change, or delete. RULE.md prohibits TODO comments in shipped code.

---

### ISS-018 — useFreeQuotaUsage Hook Missing
**Severity:** 🟠 Major | **Effort:** 4h

Port from `legacy/src/hooks/`. Verify free-tier billing dashboard displays quota data correctly.

---

### ISS-015 — Invoice Payment Status Logic Bug
**Severity:** 🟡 Minor | **Effort:** 1h

`latest-invoice-table.tsx` uses `!bill.paymentStatus` (falsy check). `invoices.tsx` uses explicit `=== 1` / `=== 2` enum checks. Align both components to use explicit status codes. Partial payments (status 2) currently display as "Paid" on the dashboard widget.

---

### ISS-019 — RTC Announcement Tracking Missing
**Severity:** 🟡 Minor | **Effort:** 2h

Port `useRtcAnnouncementTracking` hook and create `rtc-announcement-tracking.ts` store using Jotai `atomWithStorage` for localStorage persistence.

---

### ISS-009 — Store Filename Typo
**Severity:** 🟡 Minor | **Effort:** 15min

Rename `src/store/subsciptions.ts` → `subscriptions.ts`. Update all imports.

---

### ISS-012 — Duplicate Service Directory
**Severity:** 🟡 Minor | **Effort:** 15min

Delete root-level `services/` directory before merging `feat/design-inspect`. Only `src/services/` is canonical.

---

### ISS-008 — Inline styles on 2 Components
**Severity:** 🟡 Minor | **Effort:** 30min

Replace `style={{ height: '340px' }}` with `className="h-[340px]"`.

---

### ISS-010 — reactStrictMode Disabled
**Severity:** 🟡 Minor | **Effort:** 1h + bug fixes

Enable `reactStrictMode: true` in `next.config.ts`. Fix any double-render issues that surface — they indicate real bugs.

---

### ISS-013 — 8 Stale Git Branches
**Severity:** 🟡 Minor | **Effort:** 30min

Delete: `migrate/pages`, `migrate/pages-*` (5), `feat/dashboard`. Evaluate `playground` before deciding.

---

## 6. Technical Debt Introduced (Migration-Specific)

*This section distinguishes new debt from pre-existing issues documented in `notes/baseline/tech-debt.md`.*

### New Debt (Not Present in Original)

| Issue | Original | Migration | Notes |
|-------|----------|-----------|-------|
| **Missing middleware.ts** | ✅ Exists | ❌ Missing | Critical security regression |
| **Missing LicensePermissionGuard** | ✅ Exists | ❌ Missing | Critical feature regression |
| **Pre-auth placeholder** | ✅ 3 components | 🚧 Stub | Feature gap |
| **Missing useFreeQuotaUsage** | ✅ Exists | ❌ Missing | Free tier regression |
| **Missing useRtcAnnouncementTracking** | ✅ Exists | ❌ Missing | UX regression |
| **134 TODOs** | 9 | 134 | 15x increase — migration added 125 new TODOs |
| **16 console.logs** | 4 | 16 | 4x increase — migration added 12 new debug statements |
| **`subsciptions.ts` typo** | `subscriptions.ts` | `subsciptions.ts` | Introduced during migration |
| **Dual form stacks** | Formik only | Formik + RHF (not yet swapped) | Incomplete migration |
| **`export const dynamic` absent** | N/A (Pages Router) | Required but missing on 80 pages | App Router-specific |
| **0 loading.tsx files** | N/A (Pages Router) | App Router expects these | Missed App Router pattern |

### Pre-Existing Debt Carried Forward (DO NOT Attribute to Migration)

| Issue | Original | Migration | Status |
|-------|----------|-----------|--------|
| 477 `any` types | 477 | 293 | ✅ Improved (39% reduction) |
| `ignoreBuildErrors: true` | ✅ Original had it | ✅ Carried forward | Carried over — fix it |
| `noImplicitAny: false` | ✅ Original tsconfig | Status unknown in migration | Verify tsconfig |
| 4 icon libraries | 4 libraries | Lucide primary | ✅ Improved |
| Duplicate deps (nanoid/shortid, splide/swiper, date-fns/dayjs) | Present | Check migration package.json | Unclear if cleaned |
| styled-components (unused) | Present | Check migration | Should be removed |

---

## 7. Remaining Work: Ordered Task List

### Phase A: Foundation — Immediate Blockers (est. ~6–8 dev-days)

**Task A1: Merge feat/design-inspect into main**
- Dependency: None
- Complexity: S
- Files: repo root git merge
- Steps: (1) Delete root-level `services/` on feat/design-inspect (ISS-012, 15min). (2) Merge `feat/design-inspect` into `main`. (3) Verify build passes post-merge. (4) Verify all 63 force-dynamic pages are present.

**Task A2: Create middleware.ts — Server-Side Authentication**
- Dependency: None
- Complexity: S
- Files: Create `middleware.ts` at repo root
- Steps: (1) Read `legacy/middleware.ts` — extract cookie name, SSO URL, validation logic. (2) Port to Next.js 15/16 edge middleware API (`NextRequest`, `NextResponse`). (3) Add `matcher` config to protect all authenticated routes. (4) Test: unauthenticated browser navigation → verify redirect fires before page HTML is served. (5) Test: `NEXT_PUBLIC_INSPECT_MODE=design` must bypass middleware for local dev.

**Task A3: Add force-dynamic to Remaining 17 Pages**
- Dependency: A1 (need to know which pages are still missing after merge)
- Complexity: S
- Files: 17 `app/*/page.tsx` files
- Steps: (1) Run `grep -rL "force-dynamic" app/ --include="page.tsx"` post-merge. (2) Add `export const dynamic = 'force-dynamic'` to each. (3) Verify `bun run build` passes with zero ECONNREFUSED errors.

**Task A4: Implement useLicensePermission + LicensePermissionGuard**
- Dependency: None
- Complexity: M
- Files: `src/hooks/use-license-permission.ts`, `src/components/features/license-management/license-permission-guard.tsx`, optionally `app/license-management/(protected)/layout.tsx`
- Steps: (1) Read `legacy/src/hooks/useLicensePermission.ts` — extract exact permission check logic. (2) Create `src/hooks/use-license-permission.ts` — port hook, replace old import paths with migration equivalents. (3) Create `license-permission-guard.tsx` — use shadcn `Alert` for denied state. (4) Apply guard to all 4 license-management pages OR create App Router route group with `layout.tsx`. (5) Test: user without license permission → verify access denied state renders. (6) Test: user with license permission → verify content renders.

**Task A5: Migrate Pre-Authorization Feature (3 Components)**
- Dependency: A4 (need LicensePermissionGuard)
- Complexity: L
- Files: `src/components/features/license-management/import-licenses-tab.tsx`, `verify-license-tab.tsx`, `import-history-tab.tsx`; update `app/license-management/pre-authorization/page.tsx`
- Steps: (1) Read `legacy/src/components/license-management/PreAuthorization/ImportLicensesTab.tsx` (~390 lines). (2) Port business logic: state, handlers, API calls, polling — preserve 100%. (3) Replace Formik with react-hook-form + zod; create `pre-authorization-schema.ts`. (4) Replace custom UI with shadcn: `Input`, `Button`, `Form`, `Progress`, `Alert`. (5) Repeat for `VerifyLicenseTab` and `ImportHistoryTab`. (6) Compose all three into shadcn `Tabs` in `page.tsx`. (7) Apply `LicensePermissionGuard`. (8) End-to-end test: upload file → validate → verify → view history.

### Phase B: Quality Gate — Pre-Launch (est. ~5–7 dev-days)

**Task B1: Port useFreeQuotaUsage Hook**
- Dependency: None
- Complexity: S
- Files: `src/hooks/use-free-quota-usage.ts`
- Steps: (1) Read `legacy/src/hooks/useFreeQuotaUsage.ts`. (2) Port to migration — update axios instance reference to service layer. (3) Find all components in `app/` and `src/` that need this data. (4) Wire it in. (5) Test with a free-tier account mock in design inspect mode.

**Task B2: Port useRtcAnnouncementTracking + Store**
- Dependency: None
- Complexity: S
- Files: `src/store/rtc-announcement-tracking.ts`, `src/hooks/use-rtc-announcement-tracking.ts`
- Steps: (1) Create store with `atomWithStorage('rtc-dismissed-announcements', [])`. (2) Port hook logic from original. (3) Wire into components that render RTC announcements. (4) Test: dismiss announcement → refresh page → announcement does not reappear.

**Task B3: Remove TypeScript ignoreBuildErrors**
- Dependency: None
- Complexity: S–M (depends on hidden error count)
- Files: `next.config.ts`
- Steps: (1) Run `tsc --noEmit` from repo root. Count and classify errors. (2) If zero errors: remove `ignoreBuildErrors: true` immediately. (3) If errors present: fix each before removing the flag. (4) Run `bun run build` to confirm no regressions.

**Task B4: Fix invoice payment status logic**
- Dependency: None
- Complexity: S
- Files: `src/components/features/billing/latest-invoice-table.tsx` line 214
- Steps: (1) Replace `!bill.paymentStatus` falsy check with explicit `=== 1` / `=== 2` enum check matching `invoices.tsx`. (2) Add "Partial Paid" badge for status 2. (3) Verify both billing components show consistent status labels.

**Task B5: Fix 48 'any' Types in app/ Directory**
- Dependency: B3 (ignoreBuildErrors removed, so types will be enforced)
- Complexity: M
- Files: 15 files in `app/`
- Steps: (1) Run `grep -rn ": any\|as any" app/ --include="*.tsx"`. (2) For each: create explicit type or use `unknown` + narrowing. (3) Verify build passes after each fix.

**Task B6: Complete Form Migration (Formik → RHF + Zod)**
- Dependency: None
- Complexity: L
- Files: 11 form files in `src/components/features/settings/`, `billing/`, `project-management/`
- Priority order: `settings/profile` → `settings/sso-management` → `settings/teams-members` → remainder
- Steps per form: (1) Create `[form-name]-schema.ts` with zod schema. (2) Replace `Formik`/`Field`/`ErrorMessage` with `useForm`/`Form`/`FormField`/`FormControl`/`FormMessage`. (3) Replace `Yup` schema with `z.object`. (4) Preserve all existing `onSubmit` handlers and business logic. (5) Verify form submit, validation errors, and success states work identically.

**Task B7: Manual QA Sprint**
- Dependency: A1–A5, B1–B6
- Complexity: M (time-based, not code)
- Scope: `/settings/profile`, `/project-management/.../flexible-classroom`, `/project-management/.../whiteboard-services`, `/billing/manage-cards`, `/settings/teams-members`
- Steps: (1) Test each critical page end-to-end against the original console behavior. (2) Document any behavioral differences. (3) Fix regressions before launch.

### Phase C: Page Migration — Complete Build Coverage (est. 1–2 days)

**Task C1: Fix store filename typo**
- Dependency: None
- Complexity: XS
- Files: `src/store/subsciptions.ts` → `subscriptions.ts`
- Steps: Rename file. Update all import references. Run build to verify.

**Task C2: Fix inline styles**
- Dependency: None
- Complexity: XS
- Files: `BillingDashboard` + 1 other component
- Steps: Replace `style={{ height: '340px' }}` with `className="h-[340px]"`.

**Task C3: Clean up stale git branches**
- Dependency: None
- Complexity: XS
- Steps: Delete 7 identified stale branches (see Section 4). Evaluate `playground` branch.

**Task C4: Enable reactStrictMode: true**
- Dependency: A1, B3
- Complexity: S
- Files: `next.config.ts`
- Steps: Enable strict mode. Fix any double-render issues that emerge (they indicate real bugs).

### Phase D: Integration & Polish (est. 1 week)

**Task D1: Add Nested App Router Layouts + Loading States**
- Dependency: A1
- Complexity: M
- Files: Create `app/project-management/[projectID]/layout.tsx`, `app/billing/layout.tsx`, `app/settings/layout.tsx`, `app/license-management/(protected)/layout.tsx` + corresponding `loading.tsx` files
- Steps: (1) Convert each section's layout component into an App Router `layout.tsx`. (2) Add `loading.tsx` with skeleton states. (3) Test that navigation between sibling routes uses the persistent layout.

**Task D2: Remove .agora-* CSS Component Classes**
- Dependency: None
- Complexity: L
- Files: `src/styles/globals.css` + 80+ pages
- Steps: (1) Inventory all `.agora-*` class usages with `grep -rn "agora-" app/ src/`. (2) For each: replace with equivalent Tailwind utilities or `cn()` + shadcn variant. (3) Remove class definitions from `globals.css`. Keep CSS custom properties (design tokens).

**Task D3: Resolve 134 TODOs**
- Dependency: None
- Complexity: M (audit) + S/M/L (per item)
- Steps: (1) Run full TODO audit. (2) Classify each as code change, tracked issue, or delete. (3) Execute all code changes. (4) Delete noise TODOs. (5) Create tickets for legitimate deferred work.

### Phase E: Verification (est. 1–2 days)

**Task E1: Remove ignoreBuildErrors and Verify Clean Build**
- Steps: (1) `bun run build` with `ignoreBuildErrors: false`. (2) Fix all errors. (3) Confirm zero TypeScript errors, zero ESLint errors.

**Task E2: Performance Baseline**
- Steps: Run Lighthouse on key pages (dashboard, billing, project management). Establish baseline scores before post-launch optimization sprint.

**Task E3: Reduce 'use client' Usage (Architectural Sprint)**
- Dependency: Service layer from feat/design-inspect merged (A1)
- Complexity: XL (1–2 weeks)
- Steps: (1) Audit top 10 highest-traffic pages. (2) For read-only pages: move data fetching to Server Components using `apiGet`. (3) Pass data as props to `'use client'` child components. (4) Remove `force-dynamic` from pages that become true Server Components. (5) Measure and document performance delta.

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auth bypass — no server-side middleware | High | Critical | Create middleware.ts (Task A2) before any deployment |
| License data accessible to unauthorized users | High | Critical | Implement LicensePermissionGuard (Task A4) |
| Build cannot be deployed | High | Critical | Merge feat/design-inspect (Task A1) |
| Pre-authorization ships as stub | High | Critical | Migrate 3 components (Task A5) |
| Feature drift: console-orig ships while migration lags | High | High | Establish weekly sync cadence; merge ASAP |
| Settings form regression (OTP, password) | Medium | High | Manual QA + complete form migration (Task B6) |
| Stripe 1.x → 8.x payment regression | Medium | High | Manual QA payment flows (Task B7) |
| Whiteboard/flexible-classroom regressions | Medium | High | Manual QA (Task B7) |
| 134 TODOs as hidden feature gaps | Medium | High | Audit before launch (Task D3) |
| Free-tier billing display broken | High | Medium | Port useFreeQuotaUsage (Task B1) |
| TypeScript hidden errors | Medium | Medium | Remove ignoreBuildErrors (Task B3/E1) |
| RTC announcements reappear | High | Low | Port announcement tracking (Task B2) |
| .agora-* CSS accumulates maintenance debt | Medium | Medium | Remove in Phase D (Task D2) |
| 340 'use client' limits performance gains | Low | Medium | Post-launch architectural sprint (Task E3) |
| Missing nested layouts impact UX | Low | Low | Add in Phase D (Task D1) |

---

## 9. Recommendations

### Recommendation 1: Merge feat/design-inspect Into Main Today

**Priority:** Immediate — do this before anything else.

This single action resolves the build failure on 63/80 pages, adds a clean service layer used for design collaboration and the foundation of future Server Component adoption, adds 60+ static mock files for design inspect mode, and eliminates 11 `any` types. It is 2 commits ahead of main, was committed today, and has a confirmed passing build.

Before merging: delete the root-level `services/` directory (duplicate of `src/services/`, 15-minute task). After merging: add `force-dynamic` to the remaining 17 pages to achieve a fully passing build.

**Impact:** Moves build status from ❌ to ✅. Enables staging deployment.

---

### Recommendation 2: Complete the Security Sprint Before Any Deployment

**Priority:** Before any staging or production deployment.

Two security regressions exist that are worse than the original:
1. No `middleware.ts` — unauthenticated users receive server-rendered HTML
2. No `LicensePermissionGuard` — all authenticated users can access license management

Combined estimated effort: ~5 developer-days (middleware: 4h; LicensePermissionGuard: 1 day; pre-authorization: 3–4 days). This is a focused, bounded sprint with clear acceptance criteria. Do not deploy to staging until these 3 issues (ISS-001, ISS-016, ISS-017) are resolved.

---

### Recommendation 3: Remove typescript.ignoreBuildErrors and Fix the Gaps

**Priority:** Before launch, after security sprint.

This flag silences every TypeScript error in the build pipeline. Combined with `reactStrictMode: false`, the developer feedback loop is significantly degraded. The `feat/design-inspect` build notes claim zero TypeScript errors — if true, removing this flag costs nothing. Run `tsc --noEmit` first. If errors surface, each one is a real potential production bug. Budget 4–8 hours to fix.

---

### Recommendation 4: Complete Form Migration in Settings as a Single Sprint

**Priority:** Before launch.

The settings/profile page contains the highest-risk forms in the application: OTP verification, phone number update, email change, and password reset. These forms are preserved with Formik intact — not because they were migrated, but because form migration was deferred entirely. RULE.md mandates react-hook-form + zod. Complete these 11 Formik conversions as a single focused sprint, starting with the highest-risk forms. Budget 2–4 developer-days.

---

### Recommendation 5: Establish a Post-Launch Architectural Sprint for Server Components

**Priority:** Post-launch (1–3 months out).

The migration's 340 `'use client'` directives replicate the Pages Router client model inside App Router. This is not a defect — the app works — but it means the team has done all the migration work while leaving most of the performance benefit on the table. After launch, run a focused sprint targeting the top 10 highest-traffic, simplest pages (billing, usage, credentials, dashboard): move data fetching into Server Components using the existing `apiGet` service layer from `feat/design-inspect`. Measure Time to Interactive improvement after each conversion. This sprint will also reduce the number of pages needing `force-dynamic`, improving build times.

---

*End of report. Full supporting data:*
- *Gap analysis: `notes/analysis/gap-analysis.md`*
- *Efficiency review with code examples: `notes/analysis/efficiency-review.md`*
- *Risk register: `notes/analysis/risk-register.md`*
- *Session logs: `notes/_session-log.md`*
