# Integration Surface — Original Console

**Agent:** Baseline Agent (Phase 1)
**Date:** 2026-02-20

---

## Dependencies Overview

**Total dependencies:** ~70
**Total devDependencies:** ~10

---

## 1. Core Framework

| Package | Version | Notes |
|---------|---------|-------|
| next | 13.2.4 | Pages Router |
| react | 18.2.0 | |
| react-dom | 18.2.0 | |
| typescript | 4.9.5 | `noImplicitAny: false` |

---

## 2. UI Component Libraries

### Radix UI (20 packages)

```
@radix-ui/react-accordion     @radix-ui/react-alert-dialog
@radix-ui/react-aspect-ratio   @radix-ui/react-avatar
@radix-ui/react-checkbox       @radix-ui/react-collapsible
@radix-ui/react-context-menu   @radix-ui/react-dialog
@radix-ui/react-dropdown-menu  @radix-ui/react-hover-card
@radix-ui/react-icons          @radix-ui/react-label
@radix-ui/react-menubar        @radix-ui/react-navigation-menu
@radix-ui/react-popover        @radix-ui/react-progress
@radix-ui/react-radio-group    @radix-ui/react-scroll-area
@radix-ui/react-select         @radix-ui/react-separator
@radix-ui/react-slider         @radix-ui/react-slot
@radix-ui/react-switch         @radix-ui/react-tabs
@radix-ui/react-toggle         @radix-ui/react-toggle-group
@radix-ui/react-tooltip
```

**Usage:** Custom CVA-styled wrappers around Radix primitives in `src/components/ui/`. These are the migration target — replaced by shadcn/ui components.

### Other UI Libraries

| Package | Version | Usage | Migration Notes |
|---------|---------|-------|-----------------|
| `@base-ui/react` | 1.1.0 | Minimal | May not be needed post-migration |
| `class-variance-authority` | 0.7.1 | Button, Chip, Skeleton variants | Kept in shadcn (same pattern) |
| `clsx` | 2.1.1 | Class merging everywhere | Replaced by `cn()` in migration |
| `tailwind-merge` | 3.4.0 | Tailwind conflict resolution | Part of `cn()` in migration |

---

## 3. State Management

| Package | Version | Usage |
|---------|---------|-------|
| `jotai` | 2.0.3 | Primary state (27 store files, 50+ atoms) |
| `jotai-cache` | 0.3.0 | Atom caching utility |

**Pattern:** `useAtom`, `useAtomValue`, `useSetAtom` throughout components. Provider wraps app in `_app.tsx`.

---

## 4. Data Fetching

| Package | Version | Usage |
|---------|---------|-------|
| `axios` | 1.3.4 | Primary HTTP client (3 instances) |
| `swr` | 2.1.3 | Minimal — not primary pattern |

### Axios Instances

```typescript
axiosInstance  → NEXT_PUBLIC_API_BASE_URL      (main API)
axiosLM        → NEXT_PUBLIC_LICENSE_API_BASE_URL (license mgmt)
axiosV0        → NEXT_PUBLIC_API_V0_BASE_URL    (v0 schema API)
```

All use `withCredentials: true` (cookie-based auth).

### Key API Endpoints

```
/userInfo                    → Auth user data
/finance/sg-company          → SG billing context
/project/list                → Project listing
/project/{id}                → Project details
/project/{id}/extension-setting → Extension toggles
/project/{id}/cloud-proxy/status → Cloud proxy
/project/{id}/netless/check  → Whiteboard status
/project/{id}/apaas          → Flexible classroom
/project/{id}/chat/info      → Chat service
/project/{id}/rtmpg          → Media gateway
/{id}/RTM2/data              → Signaling config
/finance/*                   → Billing data
/credentials/*               → API keys
/message/site-messages       → Notifications
/goods/*                     → Products/packages
/usage/metadata              → Usage analytics
/marketplace/*               → Extensions
```

---

## 5. Forms & Validation

| Package | Version | Usage | Files |
|---------|---------|-------|-------|
| `formik` | 2.2.9 | Form state management | ~18 files |
| `yup` | 1.1.1 | Schema validation | ~18 files |
| `yup-password` | 0.2.2 | Password validation rules | Settings/profile |

**Migration note:** All Formik + Yup forms must be converted to react-hook-form + Zod + shadcn Form components. This is ~18 files of form refactoring.

---

## 6. Charts & Visualization

| Package | Version | Usage |
|---------|---------|-------|
| `recharts` | 2.6.2 | LineChart, AreaChart in usage/analytics |

Used in: `src/components/charts/LineChart.tsx`, `AreaChart.tsx`, dashboard widgets.

---

## 7. Icons (4 Libraries + Custom)

| Library | Package | Usage Pattern |
|---------|---------|--------------|
| Lucide React | `lucide-react@0.562.0` | Primary (newer components) |
| Radix Icons | `@radix-ui/react-icons@1.3.0` | UI component icons |
| iconsax-react | `iconsax-react@0.0.8` | Payment icons (AddCardModal) |
| Material Design | `@material-design-icons/svg@0.14.5` | Sparse |
| Custom SVGs | `src/assets/icons/` | 100+ hand-built components |

**Migration plan:** Consolidate to lucide-react. Map custom SVGs to Lucide where possible.

---

## 8. Payments (Stripe)

| Package | Version |
|---------|---------|
| `@stripe/stripe-js` | 1.54.0 |
| `@stripe/react-stripe-js` | 2.1.0 |

**Usage:** Isolated to `AddCardModal.tsx` (902 lines):
- `loadStripe()` with environment-specific keys (primary + SG region)
- `<Elements>` wrapper + `CardElement`, `CardNumberElement`, etc.
- Formik integration for card form
- Dual Stripe keys: `NEXT_PUBLIC_STRIPE_KEY` (primary) + `NEXT_PUBLIC_STRIPE_SG` (Singapore)

**Migration:** Stripe 1.x → 8.x + react-stripe 2.x → 5.x (already in migration repo).

---

## 9. RTC/Media (Agora SDK)

| Package | Version |
|---------|---------|
| `agora-rtc-sdk-ng` | 4.23.1 |
| `agora-rtc-react` | 2.3.0 |

**Usage:** Confined to ConvAI Playground:
- `AgoraRTCComponent.tsx` — Web Audio API + Agora SDK for voice interaction
- `AgoraRTCSTT.tsx` — Speech-to-text via Agora
- Uses `useRTCClient`, `useIsConnected` hooks

**Migration risk:** LOW — isolated to single feature area.

---

## 10. Animation

| Package | Version | Usage |
|---------|---------|-------|
| `framer-motion` | 10.6.1 | 8 files (PricingTable, ResponsiveSidebar, etc.) |
| `lottie-react` | 2.4.1 | Sidebar tours, loading states |

---

## 11. Date/Time

| Package | Version | Usage |
|---------|---------|-------|
| `date-fns` | 2.30.0 | Primary date formatting |
| `date-fns-tz` | 2.0.0 | Timezone support |
| `dayjs` | 1.11.18 | Secondary (minimal usage) |

**Duplicate concern:** Both date-fns and dayjs present. Should standardize on date-fns.

---

## 12. Other Input Libraries

| Package | Version | Usage |
|---------|---------|-------|
| `react-phone-number-input` | 3.2.23 | Phone number formatting (settings/profile) |
| `react-select` | 5.7.3 | Custom select dropdowns |
| `react-day-picker` | 8.7.1 | Date picker component |

---

## 13. Notifications & UX

| Package | Version | Usage |
|---------|---------|-------|
| `react-toastify` | 9.1.2 | Toast notifications (20+ files) |
| `react-joyride` | 2.5.4 | Product tours (sidebar) |

**Migration:** react-toastify → sonner (shadcn-compatible, already in migration repo).

---

## 14. Audio & Speech

| Package | Version | Usage |
|---------|---------|-------|
| `react-audio-visualize` | 1.2.0 | Audio visualization |
| `react-speech-recognition` | 3.10.0 | Web Speech API |
| `@speechly/speech-recognition-polyfill` | 1.3.0 | Speech API polyfill |

**Usage:** ConvAI Playground only. Limited migration impact.

---

## 15. Documentation & MDX

| Package | Version | Usage |
|---------|---------|-------|
| `@next/mdx` | 13.2.4 | MDX page support |
| `@mdx-js/loader` | 2.3.0 | MDX webpack loader |
| `@code-hike/mdx` | 0.8.0 | Code syntax highlighting in MDX |

---

## 16. Other Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `lodash` | 4.17.21 | General utilities |
| `lodash.clonedeep` | 4.5.0 | Deep cloning |
| `crypto-js` | 4.1.1 | Cryptography |
| `nanoid` | 5.0.9 | Unique ID generation |
| `shortid` | 2.2.16 | Short unique IDs (**DUPLICATE of nanoid**) |
| `cheerio` | 1.1.2 | Server-side DOM parsing |
| `octokit` | 3.1.2 | GitHub API client (marketplace) |
| `@vercel/blob` | 2.0.0 | Blob storage |
| `regenerator-runtime` | 0.14.1 | Async/await polyfill |

---

## 17. Carousel/Slider

| Package | Version | Notes |
|---------|---------|-------|
| `@splidejs/react-splide` | 0.7.12 | Carousel |
| `swiper` | 9.3.1 | Slider (**DUPLICATE**) |

**Both carousel libraries installed.** Should consolidate to one.

---

## 18. SEO & Theme

| Package | Version | Usage |
|---------|---------|-------|
| `next-seo` | 6.4.0 | SEO metadata in `_app.tsx` |
| `next-themes` | 0.4.6 | Dark/light mode switching |

---

## External Integrations Summary

| Integration | Type | Risk |
|-------------|------|------|
| Agora Console API | REST (3 axios instances) | Core — must work |
| Stripe Payment | Card elements + API | Medium — version upgrade |
| Agora RTC SDK | WebRTC | Low — isolated |
| Chat Service | iframe embed | Low — URL-based |
| ConvoAI Studio | iframe/rewrite | Low — URL-based |
| GitHub (Octokit) | REST API | Low — marketplace only |
| Vercel Blob | File storage | Low — minimal usage |

---

## Duplicate Dependencies (Cleanup Candidates)

| Duplicate | Packages | Recommendation |
|-----------|----------|---------------|
| ID generation | nanoid + shortid | Keep nanoid, remove shortid |
| Carousel | splide + swiper | Keep one, remove other |
| Date library | date-fns + dayjs | Standardize on date-fns |
| CSS-in-JS | styled-components (unused) | Remove entirely |
