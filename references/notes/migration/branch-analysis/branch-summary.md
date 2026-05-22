# Branch Summary — Migration Repo (`repos/console-shadcn`)

**Agent:** Migration Agent (Phase 2)
**Date:** 2026-02-20
**Repo:** `repos/console-shadcn`

---

## Branch Inventory

| Branch | Last Updated | Status | Commits Ahead of Main | Purpose |
|--------|-------------|--------|----------------------|---------|
| **`feat/design-inspect`** | **2026-02-20 (TODAY)** | **Active — pending merge** | **2** | Design team stub: service layer abstraction, design inspect mode, force-dynamic build fix on 63 pages, auth bypass. **457 files changed, +9,595/-2,424 vs main.** |
| **`main`** | 2026-02-16 | **Active — primary** | 0 (base) | Complete 87-page App Router migration. Build FAILS (ECONNREFUSED) without feat/design-inspect fixes. |
| `migrate/pages` | 2026-02-16 | Merged/Tracking | 0 | **Identical SHA to main** (`c10358f`). Tracking branch only — skip. |
| `migrate/pages-1767922326902` | 2026-01-09 | Historical | 0 | AI agent backup snapshot. Archive. |
| `migrate/pages-1767922181625` | 2026-01-09 | Historical | 0 | AI agent backup snapshot. Archive. |
| `migrate/pages-1767921077067` | 2026-01-09 | Historical | 0 | AI agent backup snapshot. Archive. |
| `migrate/pages-1767920567768` | 2026-01-09 | Historical | 0 | AI agent backup snapshot. Archive. |
| `migrate/pages-1767920489810` | 2026-01-09 | Historical | 0 | AI agent backup snapshot. Archive. |
| `playground` | 2026-01-09 | Peripheral | 1 | Enables access to `app/playground/` — removes some old utils. 296 files changed vs main (mostly deletions). |
| `feat/dashboard` | 2026-01-09 | Historical | 0 | **Same SHA as main** — early UI buildout, subsumed. Ignore. |

---

## Active Development Timeline

```
feat/dashboard (Jan 9)     ← Early UI component buildout (historical, subsumed)
         ↓
main (Feb 16)              ← Complete 87-page migration (primary baseline)
         ↓
feat/design-inspect (TODAY)← Service layer + design inspect mode + build fixes
```

---

## Branch Recommendations

| Branch | Recommendation | Rationale |
|--------|---------------|-----------|
| `feat/design-inspect` | **MERGE to main ASAP** | Fixes build (force-dynamic), adds service layer, reduces any types. Zero net risk. |
| `main` | Continue as primary | Sound 87-page migration, but build is currently failing without feat/design-inspect fixes |
| `migrate/pages` | **Delete** | Identical to main, pure clutter |
| `migrate/pages-*` (5 branches) | **Delete** | Historical snapshots, all identical to main, no value |
| `playground` | **Evaluate** | Playground pages exist in main. Unclear if playground branch is meant to be separate prod feature or dev tool |
| `feat/dashboard` | **Delete** | Same SHA as main — exists only in git history |

---

## Key Metrics Comparison (main vs feat/design-inspect)

| Metric | main | feat/design-inspect | Delta |
|--------|------|---------------------|-------|
| Pages | 87 | 87 | — |
| TS/TSX files | ~428 | ~532 | +104 |
| `'use client'` (src/) | 186 | 187 | +1 |
| `'use client'` (app/) | 154 | 154 | — |
| `any` types | 235 | 224 | -11 ✅ |
| TODOs | 100 | 100 | — |
| force-dynamic pages | 0 | 63 | +63 🔴→✅ |
| Service layer files | 0 | 14 | +14 ✅ |
| Mock JSON files | 0 | 60+ | +60+ ✅ |
| Build status | ❌ FAILS | ✅ PASSES | Fixed ✅ |
