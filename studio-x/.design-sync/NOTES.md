# design-sync notes — studio-x

This repo is a **Next.js App Router app**, not a packaged component library. The sync
treats `studio-x/` as the "package" and bundles its source components directly
(synth-entry mode, no `dist/`). These notes capture the non-obvious setup so a
re-sync doesn't re-derive it.

## Build setup (how this repo is made to work)

- **Self-symlink** `node_modules/studio-x -> ..` makes `PKG_DIR = <nm>/studio-x`
  resolve to the source root, so the converter's package model works without a
  published package. Recreate on a fresh clone: `cd studio-x/node_modules && ln -sfn .. studio-x`.
  (node_modules is gitignored, so this symlink must be recreated every clone.)
- **No `--entry`** is passed → synth-entry mode (`export *` from each `components/**`
  source file). All components use **named exports**, so `export *` captures them all.
- **`srcDir: "components"`** is required — the converter's default source root is
  `src→lib→components`, and this repo has a `lib/` (utils, mock data) that would
  otherwise win.
- **CSS must be compiled first.** `app/globals.css` is a Tailwind v4 *source*
  (`@import "tailwindcss"`), so utility classes don't exist until compiled.
  `cfg.buildCmd` = `node .design-sync/scripts/compile-css.mjs` compiles it (via the repo's own
  `@tailwindcss/postcss`) to `.design-sync/.cache/ds-tw.css`, which `cfg.cssEntry`
  points at → becomes `_ds_bundle.css`. **Re-run compile-css before every package-build.**
- **`process` shim (critical).** Because this is a Next.js app, the React 19 dev
  vendor (`process.emit`) and `next/*` code (`process.env.__NEXT_*`, `process.nextTick`)
  reference Node's `process`, which browsers lack → "process is not defined" in every
  preview. `node .design-sync/scripts/postbuild.mjs ./ds-bundle` injects a no-clobber `process`
  shim into `_vendor/react.js` and `_ds_bundle.js`. **Run after every `package-build.mjs`**
  (preview-rebuild does NOT regenerate the vendor/bundle, so it doesn't need it).
- **Fonts:** DM Sans is loaded via `next/font/google` (no shippable `@font-face`), so it's
  shipped for real via `@fontsource/dm-sans` latin 400/500/600/700 (`cfg.extraFonts`).
  Install on re-sync: `cd .ds-sync && npm i @fontsource/dm-sans`. (Geist Mono is used via
  `font-mono` but `--font-mono` isn't in `@theme`, so it falls to the default mono stack —
  acceptable; not shipped.)
- **Render check uses system Chrome** — no Playwright Chromium downloaded. Install the
  npm package only (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright` in `.ds-sync`)
  and run validate/capture with `DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.

## Standard build sequence

```
cd studio-x
node .design-sync/scripts/compile-css.mjs
node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle
node .design-sync/scripts/postbuild.mjs ./ds-bundle
DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node .ds-sync/package-validate.mjs ./ds-bundle
```

## Preview authoring contract

- Import components from `'studio-x'` (→ `window.StudioX`). Each named export in a
  `.design-sync/previews/<Name>.tsx` = one card cell. Lucide icons (`from 'lucide-react'`)
  and `@/lib/*` bundle normally.
- Use only common Tailwind utility classes for layout glue (flex/grid/gap-*/p-*/text-*/
  w-*/etc.) — all are already in the compiled `ds-tw.css`. The orchestrator recompiles CSS
  on each full rebuild; subagents (preview-rebuild only) can't, so avoid exotic classes.

## Component facts

- ~206 exports discovered (shadcn primitive families expand to many sub-parts).
- **14 feature components import `next/navigation`** (sidebars, *Nav, command-palette,
  dashboard-header, project-switcher, composer-*, add-phone-number-sheet,
  agent-deployment-panel) → they can't render without a Next router → they stay floor cards.
- Prototypes (`components/prototypes/`) are NOT discovered (untracked, excluded).

## Authoring recipes (proven across all batches)

- **Overlays render via the OPEN state.** Radix root takes `open`/`defaultOpen`. Wrap in a
  height container (`h-80`/`h-96`/`h-[600px]`) so portal content has room; `fullPage:false`
  capture at 900×700 catches centered/popper content.
  - Dialog/AlertDialog: `<Dialog open>`. Sheet: `<Sheet open><SheetContent side="right">` +
    `modal={false}` so the scroll-lock doesn't fight the capture.
  - Select: `<Select defaultOpen>` + `<SelectContent position="popper">`.
  - DropdownMenu: `<DropdownMenu open>` + `<DropdownMenuContent w-56>`.
  - **Tooltip MUST be wrapped in `<TooltipProvider>`** + `<Tooltip open>`, else blank.
  - NavigationMenu open: `<NavigationMenu value="x" viewport={false}>` + `<NavigationMenuItem value="x">`
    (controlled value + inline content; the JS-measured viewport collapses to 0 in static capture).
  - Collapsible: `defaultOpen`.
- **Sub-parts are authored as the full parent composition** that features them (TableCell→full
  table, SheetHeader→full open sheet, SidebarMenuItem→full sidebar, AvatarBadge→avatar w/ badge).
  Correct, not a hack — they have no meaningful standalone render.
- **Sidebar requires `<SidebarProvider>`** wrapping `<Sidebar>` (context), inside a fixed-height row.
- **Sparkline color goes on the component** (`<Sparkline className="text-primary">`), not a wrapper —
  the svg's own className wins; same for MetricCard/MetricSection chart slots.
- **AvatarImage offline**: use a `data:image/svg+xml;utf8,<svg…>` literal (encode `#` as `%23`),
  always paired with an `AvatarFallback`.
- **Feature components that gate on data/URL**: pick props that surface a non-null state —
  CredentialRiskBanner needs `agentId="agt_collections"` (cheapest stack → expiring Anthropic key);
  DeployContextBar reads `window.location.search` so seed `?agent=…` via `window.history.replaceState`
  at module scope before mount. FreeMinutesNudge/FreeMinutesBlock/ActivationChecklist read mock
  singletons/localStorage and render their data-default state.
- Two exports sharing one source file → one preview file (e.g. SecuredModeBanner + SecuredModePill).

## Known render warns
- `! <Name>: no <Name>.tsx … skipped` for a second export covered inside a sibling's preview file
  (e.g. SecuredModePill is exercised inside SecuredModeBanner.tsx) — EXPECTED, informational.
- Toggle pressed / ToggleGroupItem selected use a muted-gray bg (`aria-pressed:bg-muted`), not
  cyan — DS design, graded good.

## Re-sync risks
- The `process` shim + production-vs-dev React vendor is applied by `postbuild.mjs` AFTER
  each `package-build`. The `resync.mjs` driver runs build internally and will NOT run
  postbuild — so after a driver run, re-run `node .design-sync/scripts/postbuild.mjs ./ds-bundle` before
  validate/capture/upload, or every card breaks again.
- `cfg.extraFonts` points into `.ds-sync/node_modules/@fontsource/dm-sans` (gitignored).
  Re-install fontsource on a fresh clone before building.
- The self-symlink and Chrome path are environment-specific (macOS path hardcoded).
- Some feature previews depend on mock data in `lib/campaign-data.ts` / `lib/diagnostics.ts`:
  FreeMinutesNudge renders only its "unlock 150 more" state while `PLAN_USAGE` has used==ungated
  and no card on file; CredentialRiskBanner's preview agentId must map to a stack using an
  expiring vendor credential. If that mock data changes, re-verify those cards (they can go blank).
