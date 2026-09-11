#!/usr/bin/env node
// build-figma-sections — one JSON "plan" per feature for the Figma seven-stop
// layout (page Sandbox New → section NN → child sections 1 · JTBD … 8 · Tracker).
// The plan is consumed by scripts/figma-section-runner.js inside use_figma.
//
//   node scripts/build-figma-sections.mjs            # all rows with a Figma section
//   node scripts/build-figma-sections.mjs 04 11      # selected rows
//
// Output: references/tracker-board/figma/plans/NN.json (gitignored). Images are
// referenced by their Figma image hash (secondary[].figmaHash / shot.figmaHash);
// a shot without a hash is a "pending upload" slot the runner draws as a
// placeholder — upload it (upload_assets → POST → hash into the JSON) and re-run.
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const data = JSON.parse(readFileSync(resolve(root, "references/tracker-board/tracker-board.json"), "utf8"))
const out = resolve(root, "references/tracker-board/figma/plans"); mkdirSync(out, { recursive: true })
const only = process.argv.slice(2)
const VENDORS = ["Vapi", "Retell", "ElevenLabs", "LiveKit"]
const dims = (file) => { const p = resolve(root, file); if (!existsSync(p)) return null; const s = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", p]).toString(); return { w: +s.match(/pixelWidth: (\d+)/)[1], h: +s.match(/pixelHeight: (\d+)/)[1] } }
const figmaLink = (r) => (r.open ?? []).find((l) => l.label === "Figma")?.href
let count = 0
for (const r of data.rows) {
  if (only.length ? !only.includes(r.n) : !figmaLink(r)) continue
  const sectionId = (figmaLink(r) || "").split("node-id=")[1]?.replace("-", ":")
  const item = (s) => ({ vendor: s.vendor, kind: s.kind, label: s.label, href: s.href, hash: s.figmaHash || null, dims: dims(s.shot), marks: (s.marks ?? []).map((m) => ({ box: m.box, tag: m.tag })), scenario: s.scenario || "happy", redo: s.redo || null })
  const scenarios = []
  for (const sc of ["happy", "rainy"]) {
    const items = (r.secondary ?? []).filter((s) => (s.scenario || "happy") === sc)
    const titles = (r.scenarios?.[sc] ?? []).map((x) => x.title)
    scenarios.push({ scenario: sc, titles, columns: VENDORS.map((v) => ({ vendor: v, items: items.filter((s) => s.vendor === v).sort((a, b) => (a.kind === "product" ? -1 : 1) - (b.kind === "product" ? -1 : 1)).map(item) })) })
  }
  const plan = {
    n: r.n, name: r.name, sectionId, status: r.status, clickup: r.clickup, tags: r.tags, clickupSays: r.clickupSays,
    jtbd: { headline: r.jtbd, happy: r.scenarios?.happy ?? [], rainy: r.scenarios?.rainy ?? [] },
    research: scenarios,
    learnings: r.learnings ?? [],
    directions: r.directions ?? [], verdict: r.verdict ?? null, directionsPage: r.directionsPage ?? null,
    prototype: { open: (r.open ?? []).filter((l) => l.label !== "Figma"), shot: r.shot ? { alt: r.shot.alt, hash: r.shot.figmaHash || null, dims: dims(r.shot.file) } : null, moreShots: (r.afterShots ?? []).map((s) => ({ alt: s.alt, hash: s.figmaHash || null, dims: dims(s.file) })), rationale: r.rationale, next: r.next },
    before: (r.before ?? []).map((b) => ({ alt: b.alt, source: b.source, wrong: b.wrong ?? [], hash: b.figmaHash || null, dims: dims(b.file) })),
    hero: r.hero ?? [],
    tracker: { board: "https://claude.ai/code/artifact/a1d57eb9-2121-484c-b2f6-2d728cbd1466", clickup: r.clickup, figma: figmaLink(r) },
  }
  writeFileSync(resolve(out, `${r.n}.json`), JSON.stringify(plan))
  count++; console.log(`${r.n}.json  ${Math.round(JSON.stringify(plan).length / 1024)} KB  section ${sectionId}`)
}
console.log(`${count} plans → ${out}`)
