// compile-css.mjs — compile the repo's Tailwind v4 source (app/globals.css) into a
// static stylesheet for the DS bundle's cssEntry. The repo's globals.css is a
// Tailwind SOURCE (`@import "tailwindcss"`), so utility classes don't exist until
// compiled; this produces the real CSS (token :root/.dark vars + every utility the
// components use) that becomes _ds_bundle.css and ships to designs via styles.css.
//
// Run from the studio-x dir:  node .ds-sync/compile-css.mjs
// Re-run before every package-build.mjs (it's cfg.buildCmd).

import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SRC = 'app/globals.css';
// Virtual `from` at the studio-x root so @source globs resolve from the root.
const FROM = '_ds_compile.css';
const OUT = '.design-sync/.cache/ds-tw.css';

let css = readFileSync(SRC, 'utf8');
// Explicit @source so component + authored-preview classes are always scanned,
// independent of Tailwind's auto-detection (which can skip dot-dirs / be cwd-sensitive).
css +=
  '\n@source "./components/**/*.{ts,tsx}";' +
  '\n@source "./app/**/*.{ts,tsx}";' +
  '\n@source "./.design-sync/previews/**/*.tsx";\n';

mkdirSync(dirname(OUT), { recursive: true });
const result = await postcss([tailwindcss()]).process(css, { from: FROM, to: OUT });
writeFileSync(OUT, result.css);
console.error(`compile-css: ${SRC} -> ${OUT} (${(result.css.length / 1024).toFixed(0)} KB)`);
