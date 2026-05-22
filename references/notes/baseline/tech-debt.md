# Pre-Existing Tech Debt — Original Console

**Agent:** Baseline Agent (Phase 1)
**Date:** 2026-02-20
**Purpose:** Document issues that exist BEFORE migration so the Migration Agent doesn't attribute them to migration work.

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| TODOs/FIXMEs | 9 | Low |
| `any` type usage | 145 files affected (~477 instances) | High |
| console.log statements | 4 | Low |
| eslint-disable comments | 8 | Medium |
| Backup/dead files | 6 pages + 2 dev pages | Low |
| Unused dependencies | 1 confirmed (styled-components) | Low |
| Duplicate dependencies | 3 pairs | Medium |
| Commented-out code | 3 blocks in _app.tsx | Low |
| Build error suppression | Both TS + ESLint ignored | High |
| Files >500 lines | 4+ components | Medium |

---

## 1. TODOs and FIXMEs (9 total)

| # | File | Line | Comment | Severity |
|---|------|------|---------|----------|
| 1 | `src/store/projects.ts` | 80 | `// TODO: Removable after project mgmt is done` | Low — cleanup |
| 2 | `src/utils/transformers/rtcPlanTransformers.ts` | 59 | `// TODO: Check if subscriptionList has two same packageId` | Medium — data integrity |
| 3 | `pages/notifications/index.tsx` | 80 | `// TODO:: Take a look` (typo: double colon) | Low — unclear |
| 4 | `pages/project-management/.../chat/basic-info.tsx` | 71 | `// // TODO move it to a hook or a hoc` | Medium — architecture |
| 5 | `pages/project-management/.../chat/basic-info.tsx` | 267 | `{/* TODO: add */}` | Low — incomplete UI |
| 6 | `src/components/projects/View/Security.tsx` | 319 | `// TODO: handle error states` | Medium — error handling |
| 7 | `src/components/subscriptions/signaling-plans/PricingTable.tsx` | 288 | `// TODO: Signaling - Replace Functionality` | Medium — feature gap |
| 8 | `src/components/dashboard/GetStarted.tsx` | 147 | `// TODO: Figure out anything breaks later` | Low — uncertainty |
| 9 | `src/data/errors/Finance.ts` | 110 | Hardcoded bank code (not TODO but suspicious) | Low |

---

## 2. Type Safety Issues

### `noImplicitAny: false` in tsconfig.json
The TypeScript config explicitly allows implicit `any` types, undermining strict mode.

### `any` Type Usage: ~477 instances across 145 files

**Top offenders (by file):**
- Type definition files (`src/types/*.ts`) — many API response types use `any`
- Form components — Formik values typed as `any`
- API response handlers — `resp.data as { [key: string]: any }`
- Event handlers — `(event: any)` patterns

**Migration impact:** The migration repo has reduced this to 293 instances. The service layer on `feat/design-inspect` is clean (0 `any` types).

---

## 3. Console Statements (4 total)

| # | File | Line | Code |
|---|------|------|------|
| 1 | `src/components/project-management/ConvAIPlayground/AgoraRTCComponent.tsx` | 283 | `.then(console.log)` |
| 2 | `pages/settings/sso-management.tsx` | 148 | `console.log(fieldStatus, !ssoEnabled)` |
| 3 | `src/components/license-management/utils.ts` | 48 | `console.log('unassignedActiveCount', ...)` |
| 4 | `src/components/subscriptions/rtc-plans/monthly/PurchaseHistory.tsx` | 113 | `console.log(error)` |

---

## 4. ESLint Suppressions (8 total)

All are `eslint-disable react-hooks/exhaustive-deps`:

| # | File | Type |
|---|------|------|
| 1 | `src/hooks/useAuth.ts` | File-level |
| 2 | `pages/notifications/index.tsx` | File-level |
| 3 | `src/components/extensions-marketplace/ExtensionNewSubmission.tsx` | File-level |
| 4 | `src/components/usages/UsagesActions.tsx` | File-level |
| 5 | `src/components/common/FileInputField.tsx` | File-level |
| 6 | `src/components/license-management/PreAuthorization/ProjectSelector.tsx` | Inline (line 45) |
| 7 | `src/components/license-management/PreAuthorization/ImportHistoryTab.tsx` | Inline (line 23) |
| 8 | `src/components/license-management/PreAuthorization/BatchDetailsModal.tsx` | Inline (line 18) |

**Risk:** Suppressed exhaustive-deps can cause stale closures and subtle bugs.

---

## 5. Build Configuration Issues

### `ignoreBuildErrors: true` (both TypeScript and ESLint)

```javascript
// next.config.js
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true }
```

This masks real issues during build. Unknown how many TypeScript errors exist — `tsc --noEmit` should be run but was not executed as part of this audit (no `node_modules` installed in original repo).

### `reactStrictMode: false`
Strict mode is disabled — prevents detection of unsafe lifecycle methods, legacy API usage, and side effect issues.

---

## 6. Dead/Backup Files

### Backup Pages (6)
```
pages/project-management/[projectID]/chat/callback-bkup.tsx
pages/project-management/[projectID]/chat/features-overview-bkup.tsx
pages/project-management/[projectID]/chat/push-cert-bkup.tsx
pages/project-management/[projectID]/chat/push-template-bkup.tsx
pages/project-management/[projectID]/chat/wordlist-history-bkup.tsx
pages/project-management/[projectID]/chat/wordlist-rule-config-bkup.tsx
```

### Dev/Test Pages (2)
- `pages/play.tsx` — 451 lines, fully commented out component playground
- `pages/test.tsx` — 785 lines, modal testing page

### Unused Dependency
- `styled-components@6.0.0-rc.3` — 0 imports in codebase

---

## 7. Commented-Out Code

### `_app.tsx`
```tsx
{/* <AnnouncementBanner /> */}           // line 80
{/* <PolicyUpdate policyName="ConvoAI" /> */}  // line 83
{/* <img referrerPolicy="no-referrer-when-downgrade"
    src="https://static.scarf.sh/..." /> */}  // lines 98-101
```

### `SignallingLayout.tsx`
```tsx
// if (e.response.data.code === 6107) {    // Commented out error check
```

---

## 8. Duplicate Dependencies

| Category | Packages | Recommendation |
|----------|----------|---------------|
| ID generation | `nanoid@5.0.9` + `shortid@2.2.16` | Remove shortid |
| Carousel | `@splidejs/react-splide@0.7.12` + `swiper@9.3.1` | Consolidate to one |
| Date handling | `date-fns@2.30.0` + `dayjs@1.11.18` | Standardize on date-fns |
| CSS-in-JS | `styled-components@6.0.0-rc.3` | Remove (unused) |

---

## 9. Large/Monolithic Components

| Component | Lines | Issue |
|-----------|-------|-------|
| `AddCardModal.tsx` | 902 | 7 useState, Stripe + Formik. Should split into CardForm + PaymentFlow |
| `TeamManagementTable.tsx` | 791 | 4 useState + complex modals. Should extract modal logic |
| `Sidebar (ui)` | 747 | Context-heavy compound component |
| `SignalingPricingTable.tsx` | 625 | Complex pricing grid |
| `ChatPricingTable.tsx` | 562 | Complex pricing grid |
| `ConvAIForm.tsx` | 540 | 8 useState + useReducer |
| `ProjectTable.tsx` | 522 | Table + modals + API |
| `MemberManagementTable.tsx` | 514 | Table + modals + API |
| `AgoraRTCComponent.tsx` | 498 | Imperative DOM + WebRTC |
| `UsagesActions.tsx` | 484 | 4 useState + complex filtering |

---

## 10. Architecture Debt

### No Service Layer
Components call axios directly. No abstraction between UI and API transport. The migration repo's `feat/design-inspect` branch addresses this with 13 service files.

### No Error Boundaries
Only `pages/404.tsx` and `pages/500.tsx` for error handling. No React Error Boundaries. Components catching errors do so ad-hoc with try/catch.

### Mixed Export Patterns
Both `export default` and named `export function/const` used inconsistently across components.

### File Naming Inconsistency
Mix of PascalCase (`ProjectTable.tsx`, `CreateProject.tsx`) and kebab-case (`use-mobile.tsx`, `icon-button.tsx`). No consistent convention.

### No Loading States
Pages that fetch data client-side show nothing during loading. Only the global auth loading spinner exists (in `_app.tsx`).

---

## Critical Context for Migration Agent

**Do NOT attribute these to the migration:**
1. 477 `any` types — pre-existing (migration has reduced to 293)
2. 9 TODOs — pre-existing (migration has 132-134 but those are new/different)
3. 4 console.logs — pre-existing (migration has 26 — new ones were added)
4. `ignoreBuildErrors: true` — carried forward from original
5. `noImplicitAny: false` — original config (migration's tsconfig may differ)
6. Formik + Yup — original's form stack (migration is partially converting to RHF + Zod)
7. 4 icon libraries — original's icon sprawl
8. Duplicate dependencies (nanoid/shortid, splide/swiper, date-fns/dayjs)
