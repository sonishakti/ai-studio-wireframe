#!/usr/bin/env node
// prints one use_figma script that rebuilds SEVERAL feature sections:
//   node scripts/compose-figma-sections.mjs 01 02 03   → const PLANS=[…] + runner as buildFeature(PLAN) + loop
// Keep each batch under ~45 KB (use_figma code limit is 50 000 chars).
import { readFileSync } from "node:fs"; import { dirname, resolve } from "node:path"; import { fileURLToPath } from "node:url"
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const plans = process.argv.slice(2).map((n) => readFileSync(resolve(root, `references/tracker-board/figma/plans/${n}.json`), "utf8"))
let runner = readFileSync(resolve(root, "scripts/figma-section-runner.js"), "utf8")
// hoist the page switch + font loads out of the per-feature body
const hoist = ['const page = figma.root.children.find(p => p.id === "2861:52038")', "await figma.setCurrentPageAsync(page)", 'for (const s of ["Regular", "Medium", "Semi Bold", "Bold"]) await figma.loadFontAsync({ family: "Inter", style: s })']
for (const line of hoist) runner = runner.replace(line + "\n", "")
runner = runner.split("\n").filter((l) => !l.startsWith("//")).join("\n")
const out = `const PLANS = [${plans.join(",")}]\n${hoist.join("\n")}\nasync function buildFeature(PLAN) {\n${runner}\n}\nconst results = []\nfor (const P of PLANS) { try { results.push(await buildFeature(P)) } catch (e) { results.push({ n: P.n, error: e.message }) } }\nreturn results\n`
process.stdout.write(out)
console.error(`${plans.length} plans, ${out.length} chars`)
