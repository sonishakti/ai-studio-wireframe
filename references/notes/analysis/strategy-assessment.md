# Phase 0: Migration Strategy Assessment

**Agent:** Strategy Agent
**Date:** 2026-02-20 (revised after thorough branch analysis)
**Repos Scanned:** `repos/console-orig` (external original), `repos/console-shadcn` (migration — contains `legacy/` copy of original)

---

## Verdict: ⚠️ STRATEGY NEEDS ADJUSTMENT — Flag Before Continuing

The core migration approach is sound — the target stack (Next.js 16, React 19, App Router, Tailwind 4, shadcn/ui) is correct, and the team has made impressive progress (87/88 feature pages migrated, 100% claimed). Active development is ongoing as of today. However, there are **six significant inefficiencies** that, if unaddressed, will result in a codebase that is worse than the original in several dimensions despite being on a better stack.

**The pipeline should continue**, but the Analysis Agent (Phase 3) must incorporate these as #1 priority recommendations.

---

## 1. Repository & Branch Structure

### Critical structural finding: `legacy/` is inside the migration repo

The migration repo (`console-shadcn`) contains the original codebase as a `legacy/` subdirectory. This means:
- Both old and new code live in the **same repo** — feature drift is trackable via git diff
- `repos/console-orig` is a separate external copy with its own git history (90+ branches)
- The `legacy/` copy inside the migration repo gets synced/updated as upstream features land

### Branch Map (10 branches, sorted by activity)

| Branch | Last Updated | Status | Purpose |
|--------|-------------|--------|---------|
| **`feat/design-inspect`** | **TODAY** (2026-02-20) | **Active** | Design team stub for v0 — adds service layer, design inspect mode, 60+ mock JSON files, telemetry. **457 files changed, +9,595/-2,424 vs main.** |
| **`main`** | 2026-02-16 | Active | Primary migration branch. 87 pages, complete migration. |
| `migrate/pages` | 2026-02-16 | Merged | Identical to main (same SHA `c10358f`). Tracking branch. |
| `migrate/pages-*` (x5) | 2026-01-09 | Historical | Timestamped AI agent backup snapshots from migration runs. |
| `feat/dashboard` | 2026-01-09 | Historical | **Early UI foundation phase** — only 12 pages, 80 UI components. Predates the page migration. Not active. 214 files deleted vs main (because main has surpassed it). |
| `playground` | 2026-01-09 | Historical | Component playground access. |

### Active development workflow

```
feat/dashboard (Jan 9)     ← Early UI component buildout (historical)
         ↓
    main (Feb 16)           ← Complete 87-page migration
         ↓
feat/design-inspect (TODAY) ← Design team v0 stub (457 files changed)
```

The `feat/design-inspect` branch is a **design team stub** built on top of main. Its purpose:
1. Designers work in **v0** (Vercel's AI design tool) using design inspect mode — no backend needed
2. `NEXT_PUBLIC_INSPECT_MODE=design` serves static JSON mock data for all API calls
3. Designers produce refined components
4. Front-end dev team pulls those components back into the main migration

This is a smart collaboration pattern that keeps design work unblocked.

---

## 2. Executive Summary — Both Repos at a Glance

| Dimension | Original (`legacy/`) | Migration (`console-shadcn` main) | `feat/design-inspect` (today) |
|---|---|---|---|
| **Framework** | Next.js 13.2.4 | Next.js 16.1.1 | Next.js 16.1.1 |
| **React** | 18.2 | 19.2.3 | 19.2.3 |
| **Router** | Pages Router | App Router | App Router |
| **Tailwind** | 3.2.7 (JS config) | 4.x (CSS config) | 4.x (CSS config) |
| **Components** | Custom Radix primitives | shadcn/ui (new-york) | shadcn/ui + service layer |
| **TypeScript** | 4.9.5 | 5.x | 5.x |
| **Total TS/TSX files** | 568 | 1,176 | ~1,280 (+104 new files) |
| **Pages** | 97 (incl. 6 backups, _app, _doc) | 87 App Router pages | 87 App Router pages |
| **Components** | 219 | 212 (+ 76 shadcn UI) | 212 (+ 76 shadcn UI) |
| **Service layer** | Direct axios calls | Direct axios calls | ✅ 13 service files wrapping all API calls |
| **Design inspect mode** | N/A | N/A | ✅ Complete (60+ mock JSON files) |
| **`any` types** | 477 | 293 | ~293 (service files are clean) |
| **TODOs/FIXMEs** | 9 | 134 | 132 (slight improvement) |
| **console.log** | 4 | 26 | ~26 |
| **`'use client'`** | N/A (Pages Router) | 340 directives | ~341 |
| **Forms** | Formik + Yup | Mixed: Formik(11) + RHF(5) | Mixed (unchanged) |
| **Build errors** | `ignoreBuildErrors: true` | `ignoreBuildErrors: true` | `ignoreBuildErrors: true` |
| **Build status** | N/A | Unknown | ✅ Passing (confirmed in INSPECT_MODE_PLAN) |
| **`force-dynamic`** | N/A | Not set | ✅ Added to 63 pages (fixes build ECONNREFUSED) |
| **Layouts** | N/A (Pages Router) | 1 root layout only | 1 root layout only |

---

## 3. What the Team Got Right

### 3.1 Migration Strategy: "Copy the Brain, Change the Face"
The documented philosophy (`.claude/plans/PLAN.md`) is excellent: preserve 100% of business logic, replace only the UI layer. This is the correct approach for a console dashboard — the value is in the API integrations, state management, and business rules, not the UI framework.

### 3.2 shadcn/ui Setup is Correct
- `components.json` properly configured: new-york style, RSC-aware, correct aliases
- 76 UI components installed — comprehensive coverage
- Custom Agora design tokens defined as CSS variables in `globals.css`
- Component mapping document exists (`.claude/contexts/LEGACY_COMPONENT_MAPPING.md`) — **20 legacy components mapped with specific replacement instructions**

### 3.3 Tailwind 4 Migration Done Right
- No `tailwind.config.js` (correct for TW4 — CSS-based config)
- PostCSS configured with `@tailwindcss/postcss`
- `@import 'tailwindcss'` and `@theme inline` used correctly
- `tw-animate-css` replaces the old `tailwindcss-animate`
- Design tokens use `oklch()` color space for light theme (modern, perceptually uniform)

### 3.4 App Router Page Structure is Correct
- Proper directory-based routing (e.g., `billing/manage-cards/page.tsx` vs. old `billing/manage-cards.tsx`)
- Dynamic routes preserved (e.g., `[projectID]`, `[messageID]`, `[name]`)
- Backup pages from original (`*-bkup.tsx`) intentionally skipped — correct decision

### 3.5 Design Inspect Mode + v0 Workflow (feat/design-inspect)
The team built a complete design collaboration pipeline:
- **Service layer abstraction** (13 new files in `src/services/`) wraps all API calls
- **Mock data registry** (`api-data/index.ts`) maps 60+ API paths to static JSON files
- **Auth bypass** in design mode — no login required
- **POST/PUT/DELETE are silent no-ops** — UI state updates work, no errors
- **Build passing** with 0 TypeScript errors and 87 routes generated
- **`force-dynamic` added to 63 pages** — fixes build-time ECONNREFUSED errors

This enables designers to work in **v0** producing real components that front-end devs can integrate. The service layer is also an architectural improvement that will benefit production — it creates a proper abstraction between components and the API transport layer.

### 3.6 Methodical AI-Assisted Migration
The commit history reveals a systematic page-by-page migration with progress tracking:
```
feat(migration): migrate /billing/all-designs page ... (85/96 pages - 89%)
feat(migration): migrate /license-management/usages-query page (84/96 pages - 88%)
```
This is disciplined, traceable work with a "Ralph Loop" workflow (`.claude/RALPH_LOOP_GUIDE.md`).

### 3.7 Dependency Modernization
Key upgrades beyond framework:
- `@stripe/stripe-js`: 1.x → 8.x
- `@stripe/react-stripe-js`: 2.x → 5.x
- `react-hook-form` + `zod` added (target form stack)
- `@tanstack/react-table` added (data table standard)
- `sonner` replaces `react-toastify` (shadcn-compatible)
- `cmdk` added (command palette)
- `ai` SDK added (Anthropic/Vercel AI SDK)
- Removed: `styled-components`, `react-speech-recognition`, `next-transpile-modules`

### 3.8 Legacy Code is Co-Located
The original codebase lives in `legacy/` inside the migration repo. This means:
- Side-by-side reference during migration (no context-switching between repos)
- Feature drift is visible in the same git diff
- New upstream features (e.g., PreAuthorization components, new hooks) can be synced into `legacy/` and then migrated

---

## 4. Separate Repo vs. Incremental — Was Big Bang the Right Call?

### Assessment: The Right Call

**Arguments for separate repo (which the team chose):**
1. Next.js 13 Pages Router → 16 App Router is a fundamental routing paradigm shift
2. Custom Radix primitives → shadcn means different APIs and composition patterns
3. Tailwind 3 JS config → 4 CSS config is a config format change
4. Clean repo = clean git history, no "migration in progress" half-states
5. Design Inspect Mode allows designers to work in v0 without backend

**Feature drift is mitigated** (not eliminated):
- The `legacy/` directory inside the migration repo tracks the original
- The `feat/design-inspect` branch (today) shows active syncing of upstream features: new PreAuthorization components (7 files), new hooks (`useLicensePermission`, `useFreeQuotaUsage`, `useRtcAnnouncementTracking`), updated license-management store, and ~210 modified legacy files
- The external `repos/console-orig` has 90+ branches — not all of these are in `legacy/` yet

**Remaining risk:** The Baseline Agent should diff `repos/console-orig/main` against `legacy/` in the migration repo to quantify any unsynced changes.

---

## 5. The Six Issues That Need Adjustment

### Issue 1: ⚠️ 340 `'use client'` Directives — Server Component Benefits Underutilized

**What's wrong:** In an App Router application, Server Components are the default and primary benefit. Having 340 `'use client'` directives in a codebase of ~1,176 files means **~29% of all files are explicitly client-side**.

**Why it matters:** The entire point of migrating from Pages Router to App Router is to get Server Components. If every page is immediately `'use client'`, the team has done all the migration work while getting less of the performance benefit.

**Root cause:** The "Copy the Brain, Change the Face" approach treated existing `useState`/`useEffect` usage as a signal to mark the file as client. In App Router, the correct pattern is to refactor pages into a Server Component shell that passes data to small, targeted Client Components.

**Nuance:** For a console dashboard that's heavily interactive (forms, state, real-time data), a high percentage of `'use client'` is expected. Not all 340 are wrong. But the `page.tsx` files themselves should ideally be Server Components that compose client children. The Baseline Agent should sample 10-15 pages to assess how many genuinely need `'use client'` at the page level vs. could be refactored.

**Effort to fix:** HIGH — requires rethinking data flow per page. Recommend prioritizing the top-level section pages first.

### Issue 2: ⚠️ Custom CSS Classes in globals.css Duplicate shadcn

**What's wrong:** The `globals.css` file contains custom CSS component classes:
- `.agora-card`, `.agora-card:hover`
- `.agora-button-primary`, `.agora-button-secondary`
- `.agora-sidebar`, `.agora-sidebar-item`
- `.agora-table th/td/tr`
- `.agora-input`, `.agora-input:focus`
- `.agora-status-ready/draft/stopped/deployed/live/paused`

These are **custom CSS component classes** that bypass both Tailwind utilities and shadcn components.

**Why it matters:** The coding rules state: "Utility-first, no custom CSS unless unavoidable." The design tokens (CSS variables like `--agora-accent-blue`) are correct. The component classes (`.agora-card`, `.agora-button-primary`) should be replaced by shadcn component variants + Tailwind utilities.

**What to fix:**
- **Keep:** CSS variables (design tokens) — correct approach
- **Remove:** `.agora-card`, `.agora-button-*`, `.agora-sidebar-*`, `.agora-table`, `.agora-input` — replace with shadcn component usage + Tailwind
- **Convert:** `.agora-status-*` badges → shadcn `Badge` variants

**Effort to fix:** MEDIUM.

### Issue 3: ⚠️ Form Library Migration Incomplete

**What's wrong:** The codebase has dual form stacks:
- **Formik + Yup:** 11 formik imports, 11 yup imports
- **react-hook-form + Zod:** 5 RHF imports, 4 zod imports

The coding rules mandate: "Always use react-hook-form + zod + ShadCN Form components."

**Why it matters:** Two form libraries = two patterns, two bundles, inconsistent form UX. Formik + Yup doesn't integrate with shadcn's `Form` component.

**Effort to fix:** MEDIUM — ~11 forms to convert.

### Issue 4: ⚠️ 134 TODOs — 15x Increase from Original

**What's wrong:** The original had 9 TODOs. The migration has 134 (132 on the latest `feat/design-inspect` branch — slight improvement). These represent unfinished work, deferred decisions, and known gaps.

**Why it matters:** 134 unresolved items in a migration context means 134 places where feature parity may be broken.

**What the Migration Agent should do:** Catalog ALL TODOs. Classify as: (a) genuinely deferred, (b) critical gaps, (c) noise to delete.

**Effort to fix:** Depends on classification.

### Issue 5: ⚠️ Missing Nested Layouts, Loading, and Error States

**What's wrong:**
- **1 layout file** (root `app/layout.tsx`) for 87 pages with deeply nested routes
- **0 `loading.tsx` files**
- **1 `error.tsx`** (root only)

The `project-management/[projectID]/chat/` section alone has 30+ pages sharing common layout.

**Why it matters:** Missing layouts = full-page re-renders when navigating between sibling routes, no layout persistence, no streaming/suspense benefits.

**Effort to fix:** MEDIUM — adding 5-8 strategic `layout.tsx` + `loading.tsx` files.

### Issue 6: ⚠️ `ignoreBuildErrors: true` Masks Real Issues

**What's wrong:** `next.config.ts` has `typescript: { ignoreBuildErrors: true }`. This was carried over from the original.

**Positive signal:** The `feat/design-inspect` branch's INSPECT_MODE_PLAN.md claims "TypeScript: No errors" and "Build: No size regression" after touching 170 files. If true, this flag can be safely removed.

**What to verify:** Run `tsc --noEmit` on main and on `feat/design-inspect`. If both pass, remove the flag.

**Effort to fix:** LOW (if types are clean) to HIGH (if hidden errors exist).

---

## 6. Strategy Questions — Answered

### Full rewrite vs. incremental migration?
**Answer:** Full rewrite was the right call given the scope. The `legacy/` co-location pattern mitigates the drift risk that normally kills big-bang rewrites.

### Feature drift risk?
**Answer:** MODERATE (downgraded from HIGH). The `legacy/` directory inside the migration repo is being actively synced — the `feat/design-inspect` branch (today) shows 210+ modified legacy files including new features (PreAuthorization). However, `repos/console-orig` has 90+ branches not all represented in `legacy/`. The Baseline Agent should diff the two.

### Component migration strategy — 1:1 or rethought?
**Answer:** Mostly 1:1 with good mapping documentation. Correct approach.

### shadcn setup — npx shadcn add or hand-built?
**Answer:** Proper `npx shadcn add` setup confirmed by `components.json`. Some custom components in `ui/` extend beyond standard shadcn. Migration Agent should flag which are standard vs. custom.

### Codemods and automation?
**Answer:** Not used — expected for a greenfield rewrite. The AI-assisted "Ralph Loop" workflow served as the automation.

### Does App Router adoption follow composition patterns skill?
**Answer:** PARTIALLY. shadcn components follow compound patterns correctly. Server/Client boundaries are not well-designed (340 `'use client'`). The `vercel-composition-patterns` skill's "push client boundaries down" principle hasn't been fully applied.

### Are Server/Client boundaries following react best practices skill?
**Answer:** Needs improvement. The service layer on `feat/design-inspect` is a positive step (proper API abstraction), but the page-level `'use client'` pattern prevents Server Component benefits.

---

## 7. Recommendations — Prioritized

| # | Issue | Priority | Effort | Impact |
|---|---|---|---|---|
| 1 | Merge `feat/design-inspect` service layer + build fixes into main | HIGH | LOW | Unblocks designers, fixes build issues |
| 2 | Reduce `'use client'` — refactor key pages into Server Component shells | HIGH | HIGH | Unlocks core App Router benefits |
| 3 | Remove `ignoreBuildErrors: true` (verify with `tsc --noEmit` first) | HIGH | LOW-HIGH | Reveals hidden issues |
| 4 | Complete form migration (Formik→RHF, Yup→Zod) | MEDIUM | MEDIUM | Consistency, bundle size |
| 5 | Add nested layouts for project-management, billing, settings | MEDIUM | MEDIUM | Navigation UX, streaming |
| 6 | Remove `.agora-*` CSS component classes from globals.css | MEDIUM | MEDIUM | Style system consistency |
| 7 | Triage 134 TODOs — classify and resolve | MEDIUM | VARIES | Code quality, completeness |
| 8 | Add loading.tsx and error.tsx to key sections | LOW | LOW | UX polish |
| 9 | Diff `repos/console-orig` vs `legacy/` to quantify unsynced changes | MEDIUM | LOW | Quantifies remaining drift |

---

## 8. For the Baseline Agent

The pipeline continues. Here's what the Baseline Agent needs to know:

1. **The original codebase exists in two places:** `repos/console-orig` (external, with its own 90+ branch git history) AND `legacy/` inside `repos/console-shadcn` (synced copy, updated as recently as today on `feat/design-inspect`). **Use `legacy/` as the primary reference** since it's co-located and reflects the latest synced state.

2. **`ignoreBuildErrors: true` is present in both** — run `tsc --noEmit` on the original to establish a baseline TypeScript error count.

3. **The original has 477 `any` types** — the migration reduced this to 293. The new service layer files on `feat/design-inspect` are clean (0 `any` types).

4. **Active upstream feature development** is visible in `feat/design-inspect`'s `legacy/` changes: new PreAuthorization module (7 components), `useLicensePermission` hook, `useFreeQuotaUsage` hook, `useRtcAnnouncementTracking` hook, updated license-management store. These represent features that need to be migrated to the new codebase.

5. **Key original patterns to document:** custom Radix component APIs (how they differ from shadcn), Formik form patterns, layout/page composition, icon system (iconsax-react + radix-icons + react-icons + lucide-react — 4 icon libraries).

6. **The component mapping exists** at `.claude/contexts/LEGACY_COMPONENT_MAPPING.md` — validate against actual components.

7. **The `feat/design-inspect` branch is the most current state** — 457 files changed vs main. When the Migration Agent runs, it should evaluate BOTH main and this branch. The service layer, build fixes (`force-dynamic` on 63 pages), and design inspect infrastructure on this branch are architecturally significant and likely destined for main.
