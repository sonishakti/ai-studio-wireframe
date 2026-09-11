#!/usr/bin/env node
// Phase 0 audit helper — counts hardcoded values outside tokens and duplicate
// component patterns in app/, components/, lib/, hooks/ (ds-bundle excluded).
// Usage: node scripts/revamp/hardcoded.mjs [--json]
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
const ROOTS = ["app", "components", "lib", "hooks"]
const files = []
const walk = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); const s = statSync(p); if (s.isDirectory()) { if (!/node_modules|ds-bundle|\.design-sync/.test(p)) walk(p) } else if (/\.(tsx|ts|css)$/.test(e)) files.push(p) } }
for (const r of ROOTS) { try { walk(r) } catch {} }
const RULES = {
  "raw hex colours": /#[0-9a-fA-F]{6}\b/g,
  "arbitrary px classes (w-[240px] …)": /\b[a-z-]+-\[[0-9.]+px\]/g,
  "arbitrary text sizes (text-[..])": /\btext-\[[^\]]+\]/g,
  "arbitrary radii (rounded-[..])": /\brounded(-[a-z]+)?-\[[^\]]+\]/g,
  "arbitrary shadows (shadow-[..])": /\bshadow-\[[^\]]+\]/g,
  "arbitrary colour classes (bg-[#..] …)": /\b(bg|text|border|ring|from|to)-\[(#|rgb|hsl|oklch)[^\]]*\]/g,
  "Tailwind palette colours (text-emerald-500 …)": /\b(bg|text|border|ring|fill|stroke|from|to)-(red|rose|emerald|green|amber|yellow|sky|blue|violet|purple|zinc|neutral|slate|gray|orange|cyan|teal|indigo|pink)-[0-9]{2,3}\b/g,
  "raw <button> elements": /<button\b/g,
  "<Button> usages": /<Button\b/g,
  "hand-rolled pills (rounded-full … px-)": /rounded-full[^"]*\bpx-[0-9]/g,
  "<Badge> usages": /<Badge\b/g,
  "hand-rolled cards (rounded-* border … bg-card)": /rounded-(lg|xl|md) border[^"]*bg-card/g,
  "<Card> usages": /<Card\b/g,
}
const out = {}
for (const [name, re] of Object.entries(RULES)) {
  let total = 0; const byFile = {}
  for (const f of files) { const n = (readFileSync(f, "utf8").match(re) || []).length; if (n) { total += n; byFile[relative(".", f)] = n } }
  out[name] = { total, files: Object.keys(byFile).length, top: Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 6) }
}
const pages = files.filter((f) => f.endsWith("page.tsx"))
const has = (re) => files.filter((f) => re.test(readFileSync(f, "utf8"))).length
out.states = { pages: pages.length, filesWithEmptyState: has(/empty state|EmptyState|nothing (here|yet)|No [A-Za-z ]+ yet/i), filesWithErrorState: has(/went wrong|ErrorState|could not load|failed to load/i), filesWithLoading: has(/<Skeleton|isLoading|aria-busy/) }
if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 1))
else for (const [k, v] of Object.entries(out)) console.log(k.padEnd(48), typeof v.total === "number" ? `${v.total} in ${v.files} files — top: ${v.top.map(([f, n]) => `${f} (${n})`).join(", ")}` : JSON.stringify(v))
