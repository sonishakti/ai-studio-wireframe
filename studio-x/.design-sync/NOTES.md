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
  `cfg.buildCmd` = `node .ds-sync/compile-css.mjs` compiles it (via the repo's own
  `@tailwindcss/postcss`) to `.design-sync/.cache/ds-tw.css`, which `cfg.cssEntry`
  points at → becomes `_ds_bundle.css`. **Re-run compile-css before every package-build.**
- **`process` shim (critical).** Because this is a Next.js app, the React 19 dev
  vendor (`process.emit`) and `next/*` code (`process.env.__NEXT_*`, `process.nextTick`)
  reference Node's `process`, which browsers lack → "process is not defined" in every
  preview. `node .ds-sync/postbuild.mjs ./ds-bundle` injects a no-clobber `process`
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
node .ds-sync/compile-css.mjs
node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle
node .ds-sync/postbuild.mjs ./ds-bundle
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

## Known render warns
(none recorded yet)

## Re-sync risks
- The `process` shim + production-vs-dev React vendor is applied by `postbuild.mjs` AFTER
  each `package-build`. The `resync.mjs` driver runs build internally and will NOT run
  postbuild — so after a driver run, re-run `node .ds-sync/postbuild.mjs ./ds-bundle` before
  validate/capture/upload, or every card breaks again.
- `cfg.extraFonts` points into `.ds-sync/node_modules/@fontsource/dm-sans` (gitignored).
  Re-install fontsource on a fresh clone before building.
- The self-symlink and Chrome path are environment-specific (macOS path hardcoded).
