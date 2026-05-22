# Baseline Architecture — Original Console (`repos/console-orig`)

**Agent:** Baseline Agent (Phase 1)
**Date:** 2026-02-20
**Repo:** `repos/console-orig` (Next.js 13 Pages Router)

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (Pages Router) | 13.2.4 |
| React | React + ReactDOM | 18.2.0 |
| TypeScript | TypeScript | 4.9.5 |
| Styling | Tailwind CSS | 3.2.7 |
| State Management | Jotai | 2.0.3 |
| Data Fetching | Axios + SWR (minimal) | 1.3.4 / 2.1.3 |
| Forms | Formik + Yup | 2.2.9 / 1.1.1 |
| UI Primitives | Radix UI (20 packages) | 1.x |
| Charts | Recharts | 2.6.2 |
| Icons | Lucide + Radix Icons + iconsax + Material Design | Mixed |
| Animation | Framer Motion + Lottie | 10.6.1 / 2.4.1 |
| Payments | Stripe | 1.54.0 / 2.1.0 |
| RTC | Agora RTC SDK | 4.23.1 |
| Notifications | react-toastify | 9.1.2 |
| Theme | next-themes | 0.4.6 |
| SEO | next-seo | 6.4.0 |

---

## 2. Codebase Statistics

| Metric | Count |
|--------|-------|
| Total TS/TSX files | 566 |
| Total lines of code | ~62,253 |
| Pages (excl. _app, _doc) | 95 |
| Components (excl. ui/) | 219 |
| UI components (Radix-based) | 14 |
| Custom hooks | 11 |
| Jotai store files | 27 |
| Utility files | 13 |
| CSS files | 5 (450 lines) |
| API routes | 7 |
| Backup pages (-bkup) | 6 |
| Icon components (src/assets/icons) | 100+ |

---

## 3. Project Structure

```
repos/console-orig/
├── pages/                          # Next.js Pages Router
│   ├── _app.tsx                    # App wrapper: Jotai Provider, ThemeProvider, ToastContainer, auth
│   ├── _document.tsx               # HTML document shell
│   ├── 404.tsx / 500.tsx           # Error pages
│   ├── index.tsx                   # Dashboard (home)
│   ├── onboarding.tsx              # User onboarding flow
│   ├── play.tsx / test.tsx         # Dev playground/test pages
│   ├── api/                        # API routes (7 files)
│   │   ├── console-proxy/          # CORS proxy for docs.agora.io
│   │   ├── onboarding.ts           # File-based onboarding state
│   │   ├── mock-flow.ts            # Mock data flow
│   │   └── source/download.ts      # File download
│   ├── billing/                    # 6 pages
│   ├── credentials/                # 1 page
│   ├── extensions-marketplace/     # 4 pages
│   ├── finance/                    # 1 page
│   ├── license-management/         # 5 pages
│   ├── notifications/              # 2 pages
│   ├── packages/aa/pay/            # 1 page
│   ├── project-management/         # 58 pages (largest section)
│   │   └── [projectID]/
│   │       ├── chat/               # 28 pages (moderation, config, analytics)
│   │       ├── signaling/          # 4 pages
│   │       └── [14 service pages]  # cloud-proxy, recording, whiteboard, etc.
│   ├── restful-api/                # 1 page
│   ├── settings/                   # 5 pages
│   ├── subscriptions/              # 5 pages
│   └── usage/                      # 1 page
├── src/
│   ├── assets/icons/               # 100+ custom SVG icon components
│   ├── components/
│   │   ├── ui/                     # 14 Radix-based UI primitives (button, dialog, etc.)
│   │   ├── common/                 # Shared wrappers (Button, Modal, Table, Input, etc.)
│   │   ├── sidebar/                # App sidebar (nav-main, nav-user, team-switcher)
│   │   ├── billing/                # Billing domain components
│   │   ├── subscriptions/          # Subscription plans (RTC, Chat, Signaling)
│   │   ├── projects/               # Project CRUD + settings
│   │   ├── project-management/     # Feature-specific (ConvAI, media, etc.)
│   │   ├── license-management/     # License, quota, pre-auth
│   │   ├── extensions-marketplace/ # Marketplace UI
│   │   ├── settings/               # Settings domain components
│   │   ├── usages/                 # Usage analytics
│   │   ├── notifications/          # Notification center
│   │   ├── onboarding/             # Onboarding flow
│   │   ├── dashboard/              # Dashboard widgets
│   │   ├── charts/                 # Recharts wrappers
│   │   ├── two-factor-authentication/ # 2FA modal
│   │   ├── auto-pay/               # Auto-pay config
│   │   ├── policy-update/          # Policy acceptance
│   │   └── restful-api/            # API key management
│   ├── hooks/                      # 11 custom hooks
│   ├── store/                      # 27 Jotai atom files
│   ├── utils/                      # 13 utility files
│   ├── layout/                     # 2 custom layouts
│   ├── types/                      # 18 type definition files
│   ├── data/                       # 30+ data/config/error definition files
│   └── styles/                     # 5 CSS files
├── public/                         # Static assets (SVGs, PNGs, manifest)
├── mock-db/                        # File-based mock data
├── middleware.ts                    # Auth cookie check + SSO redirect
├── next.config.js                  # MDX, rewrites, image patterns
├── tailwind.config.js              # Custom colors, fonts, animations
├── tsconfig.json                   # strict: true, noImplicitAny: false
└── package.json                    # 70+ dependencies
```

---

## 4. Routing Architecture

**Pattern:** Next.js Pages Router — file-based routing under `pages/`

### Route Hierarchy

```
/                                  → Dashboard (index.tsx)
/onboarding                        → Onboarding flow
/billing/*                         → Billing (6 pages)
/credentials                       → Agora Analytics credentials
/extensions-marketplace/*           → Marketplace (4 pages)
/finance/packages                  → Package management
/license-management/*              → License mgmt (5 pages)
/notifications/*                   → Notification center (2 pages)
/packages/aa/pay                   → AA payment
/project-management/               → Project list
/project-management/[projectID]/   → Project detail (58 pages)
  ├── chat/*                       → Chat service (28 pages)
  ├── signaling/*                  → Signaling service (4 pages)
  └── [services]                   → RTC services (14 pages)
/restful-api                       → RESTful API keys
/settings/*                        → Account settings (5 pages)
/subscriptions/*                   → Subscription plans (5 pages)
/usage                             → Usage analytics
```

### Layout Wrappers (Manual — No App Router Layouts)

| Layout | File | Used By | Purpose |
|--------|------|---------|---------|
| `_app.tsx` | `pages/_app.tsx` | All pages | Jotai Provider, ThemeProvider, ToastContainer, auth check, 2FA modal, banners |
| `PageLayout` | `src/components/common/PageLayout.tsx` | Most pages | Standard page shell with title |
| `SubPageLayout` | `src/components/common/SubPagePageLayout.tsx` | Settings pages | Page shell with subtitle |
| `FullPageLayout` | `src/components/common/FullPageLayout.tsx` | Credentials | Full-height shell |
| `ProjectManagementLayout` | `src/layout/ProjectManagementLayout.tsx` | All `/project-management/[projectID]/*` pages | Project header, sidebar nav, extension status fetching |
| `SignallingLayout` | `src/layout/SignallingLayout.tsx` | `/project-management/[projectID]/signaling/*` | Wraps ProjectManagementLayout + signaling sidebar |

---

## 5. Data Fetching Architecture

### Axios Instances

```typescript
// src/utils/axios.ts
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true  // Cookie-based auth
});

export const axiosLM = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? '/console/lm'
    : process.env.NEXT_PUBLIC_LICENSE_API_BASE_URL,
  withCredentials: true
});

export const axiosV0 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_V0_BASE_URL,
  withCredentials: true
});
```

### Data Fetching Patterns

| Pattern | Usage | Examples |
|---------|-------|---------|
| `useEffect` + `axiosInstance.get()` | **Dominant** — most pages | Billing, projects, settings, extensions |
| `getServerSideProps` (redirect only) | 2 pages | `/project-management/[projectID]` → chat/basic-info, `/subscriptions` → license-management |
| Jotai atoms + async effects | Global state | Auth, notifications, credentials, chart data |
| Component delegation | Pages wrap child components | Invoices page → `<Invoices />` component |
| SWR | **Minimal** — not primary pattern | Isolated usage in some components |

**Key observation:** No Server-Side Rendering for data. All data is fetched client-side via useEffect + axios. The two getServerSideProps usages are only for redirects.

---

## 6. Authentication & Authorization

### Auth Flow

```
1. middleware.ts
   ├── Check for auth cookie (NEXT_PUBLIC_COOKIE_NAME)
   ├── POST to NEXT_PUBLIC_LOGIN_CHECK_URL to validate
   └── Redirect to SSO login if invalid

2. _app.tsx → WithWrapper → useAuth()
   ├── Fetch /userInfo via axios
   ├── Set authAtom (Jotai)
   ├── Fetch /finance/sg-company (billing context)
   ├── Check onboarding completion
   ├── Show 2FA modal if !auth.verified
   └── Show suspension/credit card expired banners

3. Per-page authorization
   ├── usePermission(resource, action) → boolean check
   ├── useAtomValue(authAtom) → role-based (isMember, isRoot)
   └── LicensePermissionGuard → wrapper component for license pages
```

### Permission Model

```typescript
type User = {
  id, firstName, lastName, email, accountId, language,
  companyId, extrasInfo (JSON string),
  company: { id, name, appLimit, memberLimit, ... },
  permissions: { Usage, FinanceCenter, ProjectManagement, ... },
  verified (2FA), isRoot, isMember
}
```

---

## 7. State Management Architecture

### Jotai Atoms (27 store files)

| Domain | Store File | Key Atoms |
|--------|-----------|-----------|
| Auth | auth.ts | `authAtom`, `updateExtraInfoAtom` |
| Projects | projects.ts | `projectAtom`, `projectGroupAtom`, `extensionStatusAtom`, `signallingAtom`, `whiteBoardAtom` |
| Billing | billing.ts | `billingAtom`, `refreshCashInfoAtom`, `balanceAtom` |
| Cards | cards.ts | `creditCardsAtom` |
| Subscriptions | subscriptions.ts | `suspendedAtom`, `allSubscriptionsAtom` |
| RTC Plans | rtc-plans.ts | `activeSubscriptionAtom`, `rtcPlansAtom`, `topUpPlansAtom` |
| Chat Plans | chat-plans.ts | `chatPlansAtom`, `chatSubscriptionAtom` |
| Signaling Plans | signaling-plans.ts | `signalingPlansAtom`, `signalingSubscriptionAtom` |
| Usage | usages.ts | `usagesDataAtom`, `usagesFilterAtom` |
| License | license-management.ts | `quotaAtom`, `ordersAtom`, `preAuthAtom` |
| Credentials | credentials.ts | `credentialsAtom` |
| Notifications | notification.ts | `notificationsAtom`, `unreadCountAtom` |
| Onboarding | onboarding.ts, onboarding-flow.ts | `onboardingStepAtom`, `completedStepsAtom` |
| Session | session.ts | `sessionAtom` |
| Tour | tour.ts | `tourAtom` |
| Marketplace | extension-marketplace.ts | `extensionsAtom`, `submissionsAtom` |
| Analytics | analytics.ts | `analyticsAtom` |
| Others | autopay.ts, sg-company.ts, restful-api.ts, chat.ts, default-card-detail.ts, rtc-announcement-tracking.ts, ui-customizer.ts | Various |

### State Flow

```
User Action → Component useState (local) → Jotai atom (global) → axios call → API
                                                                      ↓
                                                              Jotai atom update
                                                                      ↓
                                                         All subscribing components re-render
```

---

## 8. Next.js Configuration

### `next.config.js` — Key Settings

```javascript
{
  eslint: { ignoreDuringBuilds: true },        // ESLint errors ignored
  typescript: { ignoreBuildErrors: true },      // TS errors ignored
  reactStrictMode: false,                       // Strict mode OFF
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],  // MDX support
  webpack: { optimization: { innerGraph: false } },
  images: { remotePatterns: ['**.agora.io', '**.aliyuncs.com'] },
  rewrites: [
    '/studio' → ConvoAI Studio (external Vercel app),
    '/console/lm/*' → staging API (dev only),
    '/console/api/*' → staging API (dev only)
  ]
}
```

### `tsconfig.json` — Key Settings

```json
{
  "strict": true,
  "noImplicitAny": false,     // ALLOWS implicit any — weakens strict
  "target": "es6",
  "paths": { "@/*": ["./src/*"] }
}
```

---

## 9. Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BASE_URL` | App base URL |
| `NEXT_PUBLIC_BASE_PATH` | Base path prefix |
| `NEXT_PUBLIC_API_BASE_URL` | Main API endpoint |
| `NEXT_PUBLIC_API_V0_BASE_URL` | V0 API endpoint |
| `NEXT_PUBLIC_LICENSE_API_BASE_URL` | License management API |
| `NEXT_PUBLIC_COOKIE_NAME` | Auth cookie name |
| `NEXT_PUBLIC_LOGIN_CHECK_URL` | Login validation endpoint |
| `NEXT_PUBLIC_LOGIN_URL` | SSO login redirect URL |
| `NEXT_PUBLIC_CHAT_URL` | Chat service iframe URL |
| `NEXT_PUBLIC_CONVO_STUDIO_URL` | ConvoAI Studio URL |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_STRIPE_SG` | Stripe SG region key |
| `NEXT_PUBLIC_DOCS_ALLOWED_ORIGINS` | CORS proxy allowed origins |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |

---

## 10. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/console-proxy/[endpoint]` | GET, POST, OPTIONS | CORS proxy forwarding auth-protected calls from docs.agora.io |
| `/api/onboarding` | GET, POST | File-based onboarding state tracking |
| `/api/mock-flow` | — | Mock data flow utility |
| `/api/source/download` | — | File download handler |
| `/api/ui-customizer/features` | — | Feature flag / UI config |

---

## 11. Key Architecture Patterns

### Pattern 1: Layout Composition (Manual)
Pages manually import and wrap their layout. No automatic nesting — each page chooses its layout.

```tsx
// pages/project-management/[projectID]/chat/basic-info.tsx
const BasicInfoPage = () => (
  <ProjectManagementLayout title="Chat > Basic Info">
    <BasicInfoContent />
  </ProjectManagementLayout>
);
```

### Pattern 2: Jotai Atom-Driven Pages
Pages read global atoms and trigger effects to fetch data.

```tsx
const BillingPage = () => {
  const auth = useAtomValue(authAtom);
  const [billing, setBilling] = useAtom(billingAtom);
  useEffect(() => { /* fetch data */ }, []);
  return <PageLayout>...</PageLayout>;
};
```

### Pattern 3: Compound Components
Complex UI components use compound pattern with sub-components.

```tsx
<BoxLayoutCard>
  <BoxLayoutCard.Header title="..." />
  <BoxLayoutCard.Body loading={loading}>...</BoxLayoutCard.Body>
</BoxLayoutCard>
```

### Pattern 4: CVA (Class Variance Authority) Variants
UI primitives use CVA for type-safe variant composition.

```tsx
const buttonVariants = cva("base-classes", {
  variants: { variant: { primary: "...", ghost: "..." }, size: { sm: "...", lg: "..." } }
});
```

---

## 12. Migration-Critical Architecture Notes

1. **No SSR data fetching** — All data is client-side. Migration to Server Components would be a pattern change, not just a framework change.
2. **27 Jotai atoms** are the backbone of state — these must be preserved 1:1 in migration.
3. **ProjectManagementLayout** is the most complex layout — it fetches project data, extension status, chat info, cloud proxy status, whiteboard status, and flexible classroom status via `Promise.all`. This must be carefully replicated.
4. **58 pages under project-management** — the largest route section. All share ProjectManagementLayout context.
5. **Custom layouts are imperative** (Pages Router) — Migration must convert to declarative App Router `layout.tsx` files.
6. **Middleware pattern** is simple and portable — cookie check + redirect.
7. **`_app.tsx` WithWrapper** orchestrates auth, 2FA, banners, and global providers — this maps to App Router `layout.tsx` + client boundary components.
8. **iframe embeds** (Chat features-overview, ConvoAI Studio) require `'use client'` in migration.
9. **4 icon libraries** (lucide-react, @radix-ui/react-icons, iconsax-react, @material-design-icons/svg) + 100+ custom SVG icons — icon consolidation is a major migration task.
