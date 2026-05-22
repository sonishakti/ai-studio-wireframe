# Migration Issues Catalog — Human-Readable

**Agent**: Migration Agent (Phase 2)
**Date**: 2026-02-20
**Machine-readable source**: `issues.json`

---

## Issues Overview

| ID | Severity | Category | Status | Blocking? |
|----|----------|----------|--------|-----------|
| ISS-001 | 🔴 Critical | Security | Open | ✅ YES |
| ISS-002 | 🔴 Critical | Build | Partial fix | ✅ YES |
| ISS-016 | 🔴 Critical | Security | Open | ✅ YES |
| ISS-017 | 🔴 Critical | Missing Feature | Open | ✅ YES |
| ISS-003 | 🟠 Major | Styling | Open | No |
| ISS-004 | 🟠 Major | Code Quality | Open | No |
| ISS-005 | 🟠 Major | Migration Incomplete | Open | No |
| ISS-006 | 🟠 Major | Architecture | Open | No |
| ISS-007 | 🟠 Major | Code Quality | Open | No |
| ISS-011 | 🟠 Major | Architecture | Open | No |
| ISS-014 | 🟠 Major | Code Quality | Open | No |
| ISS-018 | 🟠 Major | Missing Feature | Open | No |
| ISS-008 | 🟡 Minor | Styling | Open | No |
| ISS-009 | 🟡 Minor | Naming | Open | No |
| ISS-010 | 🟡 Minor | Code Quality | Open | No |
| ISS-012 | 🟡 Minor | Code Quality | Open | No |
| ISS-013 | 🟡 Minor | Repository | Open | No |
| ISS-015 | 🟡 Minor | Correctness | Open | No |
| ISS-019 | 🟡 Minor | Missing Feature | Open | No |

**4 issues block production deployment. 0 of those are fixed on main. 1 is partially fixed on feat/design-inspect.**

---

## 🔴 Critical Issues

---

### ISS-001: No middleware.ts — Authentication Bypass Possible

**Severity**: Critical | **Category**: Security | **Effort**: ~4h

**The Problem**

The original console enforces authentication at the middleware layer — before any React code runs. The migration has NO `middleware.ts` at the project root. Authentication is enforced purely client-side via the `useAuth` hook.

This means:
1. A browser request hits Next.js and gets served server-rendered HTML
2. React hydrates on the client
3. `useAuth` runs and redirects to login if unauthenticated

During step 1–2, the unauthenticated user receives the page HTML. This is a security regression.

**Evidence**

```
# Only in legacy/ subdirectory — not active:
repos/console-shadcn/legacy/middleware.ts

# Root middleware.ts: DOES NOT EXIST
ls repos/console-shadcn/middleware.ts → No such file
```

**Fix**

Create `middleware.ts` at `repos/console-shadcn/`:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/onboarding', '/login', '/api/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check auth cookie (port exact logic from legacy/middleware.ts)
  const authToken = request.cookies.get('console_token');
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

Port the SSO redirect logic and cookie name from `legacy/middleware.ts`.

---

### ISS-002: Main Branch Build Fails — No force-dynamic

**Severity**: Critical | **Category**: Build | **Effort**: ~2h | **Partially fixed on feat/design-inspect**

**The Problem**

Next.js App Router statically generates pages at build time by default. Pages that use Jotai atoms, `useEffect`, or `axiosInstance` fail with `ECONNREFUSED` during the build because there's no backend at build time.

**Evidence**

```bash
# On main branch:
grep -rl "force-dynamic" app/ --include="*.tsx" | wc -l
# → 0

# Build error:
# connect ECONNREFUSED 127.0.0.1:3000
# Error: Page /billing couldn't be rendered statically because it used...
```

**Partial Fix (feat/design-inspect)**

```typescript
// feat/design-inspect adds to 63 page.tsx files:
'use client'
export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
// ...
```

**Fix**

1. Merge `feat/design-inspect` into `main` (this fixes 63 pages)
2. Audit remaining 17 pages that still need `force-dynamic`
3. Add `export const dynamic = 'force-dynamic'` to each

**Long-term**: Replace with React Suspense + Server Component data fetching to eliminate the need for `force-dynamic` on most pages. This enables streaming, which is App Router's key performance advantage.

---

### ISS-016: LicensePermissionGuard Not Implemented — Pages Unprotected

**Severity**: Critical | **Category**: Security | **Effort**: ~1 day

**The Problem**

The original console wraps the entire license-management section in `LicensePermissionGuard`, which uses `useLicensePermission()` to verify the user's account has license capabilities before showing the section. Neither the guard nor the hook exists in the migration.

**Evidence**

```typescript
// Original: pages/license-management/purchase-history.tsx
import { LicensePermissionGuard } from '@/components/license-management/LicensePermissionGuard';

export default function PurchaseHistoryPage() {
  return (
    <PageLayout>
      <LicensePermissionGuard>
        <PurchaseHistoryTable />
      </LicensePermissionGuard>
    </PageLayout>
  );
}

// Migration: app/license-management/purchase-history/page.tsx
// → No guard. OrdersTable renders directly.
```

**Affected Pages**
- `/license-management/purchase-history` — unprotected
- `/license-management/pre-authorization` — placeholder (ISS-017)
- `/license-management/quota-management` — unprotected
- `/license-management/usages-query` — unprotected

**Fix**

```typescript
// 1. Implement hook: src/hooks/use-license-permission.ts
'use client';
import { useAtomValue } from 'jotai';
import { authAtom } from '@/store/auth';

export function useLicensePermission() {
  const auth = useAtomValue(authAtom);
  // Port exact permission check logic from original
  const hasLicenseAccess = auth?.permissions?.includes('license-management') ?? false;
  return { hasLicenseAccess, isLoading: !auth };
}

// 2. Implement guard: src/components/features/license-management/license-permission-guard.tsx
'use client';
import { useLicensePermission } from '@/hooks/use-license-permission';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LicensePermissionGuard({ children }: { children: React.ReactNode }) {
  const { hasLicenseAccess, isLoading } = useLicensePermission();
  if (isLoading) return <Spinner />;
  if (!hasLicenseAccess) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Your account does not have access to license management.
        </AlertDescription>
      </Alert>
    );
  }
  return <>{children}</>;
}

// 3. Alternatively: implement as App Router layout
// app/license-management/layout.tsx — guards all sub-pages at routing level
```

---

### ISS-017: Pre-Authorization Page Is a Placeholder

**Severity**: Critical | **Category**: Missing Feature | **Effort**: ~3–4 days

**The Problem**

The `/license-management/pre-authorization` page renders a "coming soon" stub. Three complex components from the original are not migrated.

**Evidence**

```typescript
// Current: app/license-management/pre-authorization/page.tsx
export default function PreAuthorizationPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold">Pre Authorization</h1>
      <p className="text-muted-foreground mt-4">
        Pre-authorization functionality coming soon.
      </p>
    </div>
  );
}
```

**Missing Components**

| Component | Lines | Description |
|-----------|-------|-------------|
| `ImportLicensesTab` | ~390 | File upload + license key input, validation, API submission |
| `VerifyLicenseTab` | ~420 | License verification with status polling |
| `ImportHistoryTab` | ~? | Import history table with pagination |

**Fix**

Migrate each component from the original, following the "Copy the Brain, Change the Face" pattern:
1. Port business logic (state, handlers, API calls) unchanged
2. Replace Formik + Yup → react-hook-form + zod
3. Replace custom UI components → shadcn equivalents
4. Apply LicensePermissionGuard (ISS-016) to the page

---

## 🟠 Major Issues

---

### ISS-003: Agora CSS Component Classes Violate Utility-First Rule

**Severity**: Major | **Category**: Styling | **Effort**: 3–5 days

**The Problem**

`src/styles/globals.css` defines semantic CSS component classes that violate RULE.md's utility-first requirement:

```css
/* Found in globals.css: */
.agora-card { ... }
.agora-button-primary { ... }
.agora-button-secondary { ... }
.agora-sidebar { ... }
.agora-table { ... }
.agora-input { ... }
.agora-status-active { ... }
.agora-status-inactive { ... }
```

These classes appear in 80+ app pages. They mirror what ShadCN components already provide, creating an unmaintainable dual system.

**Fix**: Replace each usage with Tailwind utilities or `cn()` wrapper on shadcn components. Not blocking — ship first, refactor after.

---

### ISS-004: typescript.ignoreBuildErrors Silences Type Errors

**Severity**: Major | **Category**: Code Quality | **Effort**: 4–8h

```typescript
// next.config.ts
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ← This must be removed
  },
};
```

This silences all TypeScript errors during `bun run build`. Combined with `reactStrictMode: false` (ISS-010), the development feedback loop is severely degraded. Remove this flag and fix the resulting errors.

---

### ISS-005: Formik + Yup Not Migrated to react-hook-form + Zod

**Severity**: Major | **Category**: Migration Incomplete | **Effort**: 2–4 days

**Evidence**

```bash
grep -rl "from 'formik'" src/ app/ | wc -l  # → 11 files
grep -rl "from 'yup'" src/ app/ | wc -l     # → 11 files
# Same count as original — zero migration progress
```

**Affected Areas**: Settings forms (profile, SSO, teams), project management creation flows, billing forms.

**Fix Pattern**

```typescript
// Before (Formik):
import { Formik, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const schema = Yup.object({ email: Yup.string().email().required() });

<Formik initialValues={{ email: '' }} validationSchema={schema} onSubmit={handleSubmit}>
  {({ errors }) => (
    <Field name="email" />
  )}
</Formik>

// After (react-hook-form + zod):
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({ resolver: zodResolver(schema) });

<Form {...form}>
  <form onSubmit={form.handleSubmit(handleSubmit)}>
    <FormField control={form.control} name="email" render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  </form>
</Form>
```

---

### ISS-006: 340 'use client' Directives — App Router Benefits Eliminated

**Severity**: Major | **Category**: Architecture | **Effort**: 1–2 weeks

The migration has 340 files with `'use client'`. This replicates the Pages Router model inside App Router. The primary benefit of App Router — Server Components with zero client JS — is unused.

```bash
grep -rl "'use client'" src/ app/ | wc -l  # → 340
```

**Not blocking now** — address in a follow-up architectural sprint.

---

### ISS-007: 15 Files with 'any' Type

**Severity**: Major | **Category**: Code Quality | **Effort**: 4–8h

```bash
grep -rn ": any\|as any\|<any>" app/ src/ --include="*.tsx"
# → 15 files
```

RULE.md: "No `any` type ever." Fix each with `unknown` + type narrowing or explicit API response types.

---

### ISS-011: No Nested Layouts or Loading States

**Severity**: Major | **Category**: Architecture | **Effort**: 2–3 days

- **1 layout.tsx** total (root only)
- **0 loading.tsx** files anywhere
- Section layouts exist as components, not App Router layouts
- No streaming skeleton states for any section

Not blocking for shipping, but limits performance optimization.

---

### ISS-014: 134 TODO Comments

**Severity**: Major | **Category**: Code Quality | **Effort**: 1–2 days

```bash
grep -rn "TODO\|FIXME\|HACK\|TEMP" src/ app/ | wc -l  # → 134
```

RULE.md prohibits commented-out code and TODO markers. Each must become a tracked issue or be deleted.

---

### ISS-018: useFreeQuotaUsage Hook Not Migrated

**Severity**: Major | **Category**: Missing Feature | **Effort**: 4h

The `useFreeQuotaUsage` hook provides free-tier quota data to billing dashboard components. It is absent from `src/hooks/`. Free-tier users may see incorrect or empty quota displays.

**Fix**: Port from original console. Check all call sites. Verify free-tier billing display.

---

## 🟡 Minor Issues

---

### ISS-008: Inline style={{}} on 2 Components

```typescript
// Example: BillingDashboard
<div style={{ height: '340px' }}>  // ← Use className="h-[340px]"
```

Replace with Tailwind arbitrary values.

---

### ISS-009: Store File Typo — subsciptions.ts

```
src/store/subsciptions.ts  // ← should be subscriptions.ts
```

Rename and update imports. 15-minute fix.

---

### ISS-010: reactStrictMode: false

```typescript
// next.config.ts
reactStrictMode: false  // ← Enable this
```

Strict mode catches accidental side effects and deprecated API usage during development.

---

### ISS-012: Duplicate Service Files in feat/design-inspect

`feat/design-inspect` has `src/services/` (correct) AND a root-level `services/` (stale duplicate). Delete root-level copy before merging.

---

### ISS-013: 8 Stale Git Branches

Delete: `migrate/pages`, `migrate/pages-*` (5 branches), `feat/dashboard`. Evaluate `playground` for useful commits.

---

### ISS-015: Payment Status Logic Bug in latest-invoice-table.tsx

```typescript
// Line 214: latest-invoice-table.tsx — INCORRECT
{'paymentStatus' in bill && !bill.paymentStatus ? (
  <Badge variant="warning">Unpaid</Badge>   // shows for ANY falsy value
) : (
  <Badge variant="success">Paid</Badge>    // shows for ANY truthy value
)}

// invoices.tsx — CORRECT (explicit enum check)
{bill.paymentStatus === 2 ? (
  <Badge variant="warning">Partial Paid</Badge>
) : bill.paymentStatus === 1 ? (
  <Badge variant="success">Paid</Badge>
) : (
  <Badge variant="danger">Unpaid</Badge>
)}
```

Align the two components. Partial payments may show as "Paid" on the dashboard widget.

---

### ISS-019: RTC Announcement Tracking Not Migrated

`useRtcAnnouncementTracking` hook and `rtc-announcement-tracking.ts` store are missing. Without them, dismissed RTC announcements reappear on every page load.

**Fix**: Port hook + create Jotai atom with `atomWithStorage` for localStorage persistence (~2h).

---

## Remediation Priority

**Phase 1 — Before Production Deployment** (blocking):
1. ISS-001: Create middleware.ts (4h)
2. ISS-002: Merge feat/design-inspect, fix remaining 17 pages (2h)
3. ISS-016: Implement LicensePermissionGuard + useLicensePermission (1 day)
4. ISS-017: Migrate pre-authorization components (3–4 days)

**Phase 2 — Before Public Launch** (quality):
5. ISS-004: Remove ignoreBuildErrors (4–8h)
6. ISS-005: Migrate forms to react-hook-form + zod (2–4 days)
7. ISS-007: Fix 'any' types (4–8h)
8. ISS-015: Fix payment status logic (1h)
9. ISS-018: Port useFreeQuotaUsage (4h)
10. ISS-009, ISS-012, ISS-013, ISS-019: Quick fixes (2h total)

**Phase 3 — Post-Launch Refinement** (architectural):
11. ISS-003: Remove agora CSS classes (3–5 days)
12. ISS-006: Reduce 'use client' usage (1–2 weeks)
13. ISS-011: Add nested layouts + loading states (2–3 days)
14. ISS-010: Enable reactStrictMode (1h + fixes)
15. ISS-014: Resolve 134 TODOs (1–2 days)
