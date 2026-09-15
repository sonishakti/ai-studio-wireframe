#!/usr/bin/env node
// copy-lint — catches product copy that talks about the design instead of the
// product. The rule it enforces is in CLAUDE.md, "Product copy — write for
// someone who arrived a minute ago".
//
//   node scripts/copy-lint.mjs         # high-confidence hits only; exits 1 on any
//   node scripts/copy-lint.mjs --all   # also print the softer heuristics
//
// It reads string and JSX text out of studio_x_2 components, skips comments, and
// matches a small list of patterns that have actually reached production here.
// It is deliberately narrow: a linter that cries wolf gets ignored.

import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "..")
const APP = resolve(root, "studio_x_2")
const ALL = process.argv.includes("--all")

/** Words that belong to us, not to the reader. */
const ARTEFACT = /\b(wireframe|prototype|mock(?:ed|up)?|simulated|the picker|the main flow|this section of the builder|placeholder copy)\b/i

/** Sentences that defend a decision rather than state a fact. */
const DEFENSIVE = [
  /\bon purpose\b/i,
  /\bnot money\b/i,
  /\bdoes not change it\b/i,
  /\bno longer (?:a|an|the|competes|reads)\b/i,
  /\bwe (?:decided|chose|moved|removed|replaced)\b/i,
  /\bused to (?:be|live|sit|say)\b/i,
  /\bpreviously\b/i,
  /\binstead of (?:a |an |the )?(?:separate|second|another|our)\b/i,
]

/** Explaining the widget instead of being one. */
const EXPLAINS_WIDGET = [
  /^read-only\b/i,
  /\bthis (?:field|box|control|panel|section) is\b/i,
  /\bthe (?:field|box|control) above\b/i,
]

/** Softer: worth a human look, not a failure. */
const SOFT = [
  /\bactually\b/i,
  /\brather than\b/i,
  /\bin other words\b/i,
  /\bas you can see\b/i,
]

const SKIP_FILES = /\/(analytics|telemetry|campaign-data|__tests__)\.tsx?$/

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx$/.test(full) && !SKIP_FILES.test(full)) out.push(full)
  }
  return out
}

/** Strip comments so a rationale comment never trips the lint. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + m.slice(p.length).replace(/./g, " "))
}

/** User-facing text: quoted strings of real prose, and text between JSX tags. */
function strings(src) {
  const out = []
  const lines = stripComments(src).split("\n")
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(/"([^"\\]{12,300})"/g)) out.push({ n: i + 1, text: m[1] })
    for (const m of lines[i].matchAll(/>\s*([A-Z][^<>{}\n]{14,300}?)\s*</g)) out.push({ n: i + 1, text: m[1] })
  }
  return out
}

const hits = []
const soft = []
for (const file of walk(APP)) {
  const src = readFileSync(file, "utf8")
  for (const { n, text } of strings(src)) {
    // Class names and import paths are not copy.
    if (/^[a-z-]+(\s+[a-z0-9:[\]/.%#-]+)+$/.test(text)) continue
    if (/^[@./]/.test(text) || /^https?:/.test(text)) continue
    const where = `${relative(root, file)}:${n}`
    if (ARTEFACT.test(text)) hits.push([where, "artefact", text])
    else if (DEFENSIVE.some((r) => r.test(text))) hits.push([where, "defensive", text])
    else if (EXPLAINS_WIDGET.some((r) => r.test(text))) hits.push([where, "explains-widget", text])
    else if (ALL && SOFT.some((r) => r.test(text))) soft.push([where, "soft", text])
  }
}

const show = (list) => {
  for (const [where, kind, text] of list) {
    console.log(`  ${kind.padEnd(16)} ${where}`)
    console.log(`    ${text.length > 150 ? text.slice(0, 150) + "…" : text}`)
  }
}

if (hits.length) {
  console.log(`\ncopy-lint: ${hits.length} string${hits.length === 1 ? "" : "s"} talk about the design, not the product.\n`)
  show(hits)
  console.log("\nSee CLAUDE.md → \"Product copy — write for someone who arrived a minute ago\".\n")
}
if (ALL && soft.length) {
  console.log(`\nSofter hits (${soft.length}) — read them, most are fine:\n`)
  show(soft)
}
if (!hits.length) console.log("copy-lint: clean.")
process.exit(hits.length ? 1 : 0)
