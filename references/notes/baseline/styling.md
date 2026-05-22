# Styling Architecture — Original Console

**Agent:** Baseline Agent (Phase 1)
**Date:** 2026-02-20

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Utility Framework | Tailwind CSS | 3.2.7 |
| Config Format | JavaScript (`tailwind.config.js`) | TW3 JS config |
| PostCSS | postcss + tailwindcss/nesting | 8.4.21 |
| Animation Plugin | tailwindcss-animate | 1.0.7 |
| Class Composition | class-variance-authority (CVA) + clsx + tailwind-merge | 0.7.1 / 2.1.1 / 3.4.0 |
| Theme Switching | next-themes | 0.4.6 |
| CSS-in-JS | styled-components (INSTALLED BUT UNUSED) | 6.0.0-rc.3 |

---

## CSS File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `src/styles/app.css` | 141 | Entry point. @tailwind directives + @layer base (76 CSS variables for light/dark) |
| `src/styles/_base.css` | 33 | Webkit scrollbar styling, link colors, font families |
| `src/styles/_override.css` | 189 | Third-party library overrides (Toastify, Day Picker, Splide, Recharts, Stripe, JoyRide) |
| `src/styles/_misc.css` | 10 | Utility classes (multilayer menu, link styling) |
| `src/styles/_content.css` | 77 | Markdown/MDX content styling (h1-h6, p, ul, ol, img) |
| **Total** | **450** | |

---

## Tailwind Configuration

### Custom Colors (Extensive Palette)

```
Gray:    50 → 950 (#f7f9fa → #83888A) — 11 shades
Dark:    25 → 800 (#565A61 → #020509) — 10 shades (app-specific dark theme)
Primary: 50 → 900 + bright (#e8f6ff → #02436E, bright: #089CFD)
Green:   100 → 900 (#D6E1D8 → #19381A)
Purple:  300, 400, 600 (#B55FEC, #9F73F1, #7409FD)
Indigo:  500 (#4077F8)
Red:     100 → 900 (#E3DDE0 → #692330)
Teal:    500 (#4BB4D3)
Orange:  300, 500, 600, 700 (#E78F6C → #8A663B)
Yellow:  100 → 900 (#EDE9DD → #4A3E12)
```

### Semantic Colors (CSS Variable-Based)

```
background, foreground, card, popover, primary, secondary,
muted, accent, destructive, border, input, ring, chart-1..5,
sidebar (background, foreground, primary, accent, border, ring)
```

Uses `hsl(var(--name))` pattern — compatible with shadcn.

### Custom Fonts
- **Primary:** Source Sans 3 (with fallbacks: ui-sans-serif, system-ui, Segoe UI, Roboto, Ubuntu)
- **Bold weight:** Custom 675 (heavier than default 700)

### Custom Breakpoints

| Token | Value | Notes |
|-------|-------|-------|
| `xl` | 1240px | Non-standard (default is 1280px) |
| `xxl` | 1280px | Custom addition |
| `2xl` | 1366px | Non-standard (default is 1536px) |

### Custom Animations (8 keyframes)

```
slideDownAndFade, slideLeftAndFade, slideUpAndFade, slideRightAndFade
  → 400ms cubic-bezier(0.16, 1, 0.3, 1) — for Radix popover/dropdown
overlayShow, contentShow
  → 150ms cubic-bezier — for Radix dialog
accordion-down, accordion-up
  → 0.2s ease-out — for accordion components
```

### Other Custom Values
- `gridTemplateColumns.pml`: `235px 1fr` — project management sidebar grid
- `borderRadius`: lg/md/sm use `var(--radius)` CSS variable

### Plugin
- `tailwindcss-animate` — Provides animation utility classes

---

## Theme System (CSS Variables)

### Light Mode (:root) — 37 variables

```css
--background: 0 0% 100%
--foreground: 0 0% 3.9%
--primary: 0 0% 9%
--destructive: 0 84.2% 60.2%
--radius: 0.5rem
/* ... (full list in app.css @layer base) */
```

### Dark Mode (.dark) — Same 37 variables, inverted

**Pattern:** HSL values without `hsl()` wrapper, consumed via `hsl(var(--name))` in Tailwind config. This is the standard shadcn pattern.

---

## @apply Usage

**Total: 62 @apply directives** across CSS files

| File | Count | Purpose |
|------|-------|---------|
| `_override.css` | 36 | Third-party library style overrides |
| `_content.css` | 18 | Markdown/MDX content formatting |
| `_base.css` | 4 | Scrollbar + link base styles |
| `_misc.css` | 2 | Utility classes |
| `app.css` | 2 | Base layer setup |

**Migration note:** @apply is compatible with Tailwind 4 but the migration repo uses `@import 'tailwindcss'` + `@theme inline` instead of `@tailwind` directives.

---

## Inline Styles

**Total: 11 occurrences** (all justified)

| Type | Count | Examples |
|------|-------|---------|
| Dynamic width/height | 5 | `style={{ width: ${width}px }}` |
| Dynamic color | 2 | `style={{ background: color }}` |
| SVG mask | 4 | `style={{ maskType: 'alpha' }}` |

**No structural inline styles.** All are dynamic calculations or SVG rendering requirements.

---

## CSS Modules
**None.** Zero `.module.css` or `.module.scss` files.

---

## styled-components
**Installed but not used.** `styled-components@6.0.0-rc.3` is in `package.json` with 0 imports in source code. Dead dependency.

---

## Responsive Design

**Total breakpoint modifiers: 52**

| Breakpoint | Count | Examples |
|-----------|-------|---------|
| `md:` | 18 | Layout switching, visibility |
| `lg:` | 14 | Desktop-specific layouts |
| `xl:` | 12 | Wide desktop flex basis |
| `xxl:` | 5 | Layout switching (xxl:flex-row) |
| `2xl:` | 3 | Ultra-wide adjustments |

**Strategy:** Desktop-first dashboard with breakpoint adjustments. Not mobile-first.

---

## Dark Mode

**CSS variable approach (primary):** 37 CSS variables in `:root` and `.dark` classes.

**Tailwind dark: modifiers:** Only 10 occurrences — dark mode relies on CSS variables, not `dark:` utility modifiers.

**Implementation:** `next-themes` with `attribute="class"` and `defaultTheme="dark"`.

---

## Hardcoded Colors in TSX

**Total: ~227 occurrences**

Most are in:
- Recharts chart colors (stroke/fill)
- SVG icon fill values
- Stripe Element styling

**Problematic ones:**
- `#BDCFDB` in JSX should reference `gray-800` from Tailwind config
- `#38bdf8` in CSS ripple indicator should be a CSS variable

---

## Migration Implications

1. **Tailwind 3 → 4:** JS config → CSS config. All custom colors, fonts, animations, breakpoints must be converted to `@theme inline` format.
2. **CSS variables:** Already using shadcn-compatible `hsl(var(--name))` pattern — good foundation.
3. **@apply:** 62 directives are portable to TW4 (syntax unchanged).
4. **Third-party overrides:** 189 lines of override CSS will need updating if library versions change.
5. **styled-components:** Remove from dependencies (unused).
6. **Custom breakpoints:** Non-standard xl/2xl values must be preserved in migration.
7. **Dark mode:** CSS variable approach is compatible with shadcn's theme system.
