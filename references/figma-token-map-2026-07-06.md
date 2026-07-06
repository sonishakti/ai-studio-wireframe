# Figma → studio_x_2 token map (2026-07-06)

> Source: Figma file `Agora-Studio-X` (xaAgeioGlZosBsRquDXLvI) — library variable
> collection **shadcn/ui** ("Agora x Shadcn"), modes **StudioX/Light** (`8708:0`) and
> **StudioX/Dark** (`8708:2`). Extracted with the FigCli plugin
> (`figma.teamLibrary.getVariablesInLibraryCollectionAsync` → `importVariableByKeyAsync`
> → `valuesByMode`), 55 variables. Applied to `studio_x_2/app/globals.css` as exact
> hex→oklch conversions. Raw dump: session scratchpad `shadcn-vars.json`.

## Core colors (Figma name → CSS token, StudioX/Dark · StudioX/Light)

| Figma variable | CSS token | Dark | Light |
|---|---|---|---|
| background | --background | #050505 | #fdfcfc |
| foreground | --foreground | #fdfcfc | #0a0a0a |
| card / card-foreground | --card / --card-foreground | #0a0a0a / #fdfcfc | #ffffff / #0a0a0a |
| popover / popover-foreground | --popover / --popover-foreground | #0a0a0a / #fdfcfc | #ffffff / #0a0a0a |
| primary / primary-foreground | --primary / --primary-foreground | **#ffffff** / #171717 | #050505 / #fdfcfc |
| secondary / secondary-foreground | --secondary / --secondary-foreground | #212121 / #fdfcfc | #f8f3f1 / #171717 |
| muted / muted-foreground | --muted / --muted-foreground | #212121 / #b3b3b3 | #f8f3f1 / #757575 |
| bg-accent-50 (base) | --accent | #27272a | #f4f4f5 |
| accent-foreground | --accent-foreground | #fdfcfc | #171717 |
| **accent** (brand cyan) | **--brand** (new) | **#00c2ff** | #00658d |
| destructive / destructive-foreground | --destructive / … | #dc383e / #fdfcfc | #de2134 / #fdfcfc |
| success | --success | #42b03d | #308d2c |
| Warning | --warning | #f59e0b | #f59e0b |
| border | --border | #212121 | #e7e6e6 |
| input | --input | #101010 | #fdfcfc |
| ring | --ring | #b3b3b3 | #757575 |

## Role decision — Figma `accent` vs shadcn `--accent`

Figma's `accent` is the **cyan brand highlight** (#00c2ff), used for e.g.
`sidebar/primary`. shadcn's `--accent` is the **hover-surface role** consumed by
every component (`hover:bg-accent`). Binding cyan to `--accent` would paint every
dropdown/row hover neon — visibly NOT what the frames show (their hover surfaces
use `bg-accent-50` = zinc-800/50). So: `--accent` ← `bg-accent-50` base;
Figma `accent` ← new `--brand` token (`--color-brand` in `@theme`). This is the
only name-level deviation; everything else maps 1:1.

## Sidebar

| Figma | CSS | Dark | Light |
|---|---|---|---|
| sidebar/background | --sidebar | #171717 | #fdfcfc |
| sidebar/foreground | --sidebar-foreground | #f8f3f1 | #383838 |
| sidebar/primary | --sidebar-primary | #00c2ff | #00658d |
| sidebar/primary-foreground | --sidebar-primary-foreground | #ffffff | #fdfcfc |
| sidebar/accent / accent-foreground | --sidebar-accent / … | #212121 / #f8f3f1 | #f8f3f1 / #171717 |
| sidebar/border | --sidebar-border | #212121 | #e7e6e6 |
| sidebar/ring | --sidebar-ring | #d6d6d6 | #b3b3b3 |

## Charts (5 of the 10 Figma chart colors, mapped in order)

chart-1 Chart-blue (#2563eb / #1d4ed8) · chart-2 Chart-teal (#2dd4bf / #0d9488) ·
chart-3 Chart-purple (#c46ffb / #a634e9) · chart-4 Chart-orange (#f97316) ·
chart-5 Chart-pink (#ec4899 / #db2777).
Unmapped extras available in Figma: sky, emerald ("Chart-emrald"), violet, indigo, rose.

## Typography & radius (Figma Typography + Primitives collections)

- font-sans: **Instrument Sans** (was DM Sans) — confirmed in-frame (53 text nodes)
- font-mono: **Space Mono** (was Geist Mono) — confirmed in-frame (7 nodes)
- radius: **8px** base (`radius/radius` → rounded-lg 8) · sm 4px (×0.5) · md 6px (×0.75)
  → `--radius: 0.5rem`; xl = 12px matches the frames' card corner radius.

## Not yet consumed by the app (extracted, available)

`hover:primary` #d6d6d6, `hover:secondary` #383838, `hover:destructive` #9a172f,
`hover:succes` [sic] #308d2c, `neon-green` #adfa1d, `content-panel/background` #171717,
`content-panel/accent/rose` #dc383e, `content-panel/accent/pink` #ec4899,
opacity ramps (`bg-muted-40/50`, `border-muted-40`, `bg-destructive-10`,
`border-destructive-50`, `hover:destructive-20`, `sidebar/foreground-70`).

## Figma-side nits found during extraction (designer's list)

- Typo variables: `hover:succes` (→ success), `Chart/Chart-emrald` (→ emerald)
- `Warning` is the only capitalized core token
- Only 3 local variables exist in the file ("Color System": background, primary,
  color/destructive/default with light/zinc + dark/zinc modes) — they duplicate
  library tokens and are bound to nothing obvious; consider deleting.
