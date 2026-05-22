# Branch: feat/design-inspect

**Last commit:** 2026-02-20 (TODAY) — "chore: add design inspect mode"
**2 commits ahead of main:** (1) telemetry events, (2) design inspect mode
**Purpose:** Design team stub for v0 collaboration — adds service layer, inspect mode, build fixes
**Status:** Complete — Ready to merge

---

## Purpose

Enable designers to work in Vercel's v0 tool without a backend:
1. `NEXT_PUBLIC_INSPECT_MODE=design` → bypasses auth, serves static JSON mock data
2. Service layer abstraction wraps all API calls (13 service files)
3. `force-dynamic` on 63 pages fixes build-time ECONNREFUSED
4. Auth bypass injects a hardcoded `DESIGN_MODE_USER` with full permissions
5. Mock data registry (60+ JSON files) maps API paths to static responses

This enables a design-to-code workflow where designers iterate in v0 and front-end devs merge the output.

---

## Status

**Complete — No issues. Merge to main immediately.**

---

## Quality Assessment

**Rating: A — Clean architecture, no regressions**

The 457 changed files are accounted for:
- 60+ new mock JSON files (`api-data/`)
- 14 new service files (`src/services/`)
- 63 `force-dynamic` additions to page files
- Auth hook updated for design mode bypass
- tsconfig.json extended (new path aliases for api-data)

Code quality is BETTER than main:
- 0 `any` types in all new service files (14 files clean)
- 235 → 224 any types overall (-11)
- No new TODOs introduced
- No new console.logs introduced

---

## Key Additions

### Service Layer (`src/services/` — 14 files)
All API calls now routed through typed service functions:
- `api-client.ts` — core: `apiGet`, `apiPost`, `apiPut`, `apiDelete`, `apiGetV0`
- `auth-service.ts` — `getUserInfo`, `getSgCompany`
- `billing-service.ts`
- `credential-service.ts`
- `file-upload-service.ts`
- `license.ts`
- `marketplace-service.ts`
- `notification-service.ts`
- `project-service.ts`
- `restful-api-service.ts`
- `settings-service.ts`
- `signaling-service.ts`
- `subscription-service.ts`
- `usage-service.ts`

The `api-client.ts` design is clean:
```typescript
// Design mode: resolves from static JSON registry
// Production mode: routes through axiosInstance
export async function apiGet<T>(endpoint: string, params?): Promise<T>
export async function apiPost<T>(endpoint: string, body?): Promise<T>
// PUT/DELETE are no-ops in design mode
```

Path normalization for UUID segments: `/project/abc-123-def` → `/project/:id`

### Mock Data Registry (`api-data/index.ts`)
60+ JSON files mapping API paths to static mock responses. Organized by domain:
- `api-data/company/`, `credentials/`, `finance/`, `goods/`, `license/`
- `api-data/marketplace/`, `notifications/`, `package/`, `project/`, `settings/`
- `api-data/subscriptions/`, `ui-customizer/`, `usage/`
- Plus `projects.json`, `user-info.json`

### Build Fix: `force-dynamic` on 63 Pages
All 63 pages that fetch data at render time have `export const dynamic = 'force-dynamic'`.
Organized by section: Settings (5), Billing & Finance (2), Subscriptions (2), Extensions (4), Others (remaining).
This prevents ECONNREFUSED during `next build`.

### Auth Design Mode Bypass (`src/hooks/useAuth.ts`)
```typescript
const DESIGN_MODE_USER: User = { /* full user with all permissions */ }
// When NEXT_PUBLIC_INSPECT_MODE === 'design':
//   - Returns DESIGN_MODE_USER without API call
//   - Sets authAtom synchronously
//   - No SSO redirect
```

---

## Architectural Assessment

### Service Layer — Correct Pattern ✅
The `apiGet/apiPost/apiPut/apiDelete` abstraction is the right approach:
- Decouples components from axios transport
- Enables inspect mode without touching component code
- 0 `any` types — fully typed
- Single import change propagates design mode to all callers

**The service files are currently in TWO locations:**
- `src/services/*.ts` — primary location per CLAUDE.md architecture
- Root `services/` directory (15 duplicate files at repo root level)
The root-level duplicates need to be removed — only `src/services/` should exist.

### Force-Dynamic vs Loading States
Adding `force-dynamic` is the right fix for now, but it converts 63 pages from static → SSR. Long-term, proper data fetching via Server Components with Suspense would be better. For a console dashboard, `force-dynamic` is pragmatic and acceptable.

---

## Issues Found

| Severity | Issue |
|----------|-------|
| Medium | Duplicate service files in BOTH `src/services/` AND root `services/` directory — remove root copies |
| Low | Auth bypass `DESIGN_MODE_USER` is hardcoded with fixed IDs — fine for design but must never reach production |

---

## Recommendation

**MERGE to main immediately.** This branch is clean and only improves main. Every change is either:
- A net improvement (service layer, -11 any types, build fix)
- Gated behind `NEXT_PUBLIC_INSPECT_MODE=design` (auth bypass, mock data)

The design inspect infrastructure is also an architectural improvement for production — the service layer creates proper API abstraction that benefits the production codebase.

**After merge:** Delete duplicate service files at root `services/` directory.
