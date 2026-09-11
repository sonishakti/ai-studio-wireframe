#!/usr/bin/env node
// compose-figma-layers — turns a dom-layers.mjs capture into use_figma scripts.
//
//   node scripts/compose-figma-layers.mjs init  <capture.json> --section "<name>" [--parent 3122:40583] [--image <hash>] [--frame "<name>"] [--x N --y N]
//       → prints ONE script (paste into use_figma) that creates the section + frames; it returns { sectionId, refId, frameId }
//   node scripts/compose-figma-layers.mjs layers <capture.json> --frame-id <id> [--chunk 40000] [--min-font 9]
//       → writes references/tracker-board/figma/layers/<basename>.<i>.js, one script per chunk (each < 45 KB);
//         run them in order with use_figma. Each returns { made, total }.
//
// Filtering (keeps the rebuild editable, not noisy): rects thinner than 1 px
// are dropped; page-wide rects (the body background) are dropped; text under
// --min-font px is dropped; layers are sorted top-to-bottom so z-order follows
// DOM order (already the case in the capture — we keep it).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { basename, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d }
const VALUE_FLAGS = ["--section", "--parent", "--image", "--frame", "--x", "--y", "--frame-id", "--chunk", "--min-font", "--rationale"]
const positional = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUE_FLAGS.includes(argv[i - 1])))
const [mode, capturePath] = positional
if (!mode || !capturePath) { console.error("usage: compose-figma-layers.mjs init|layers <capture.json> …"); process.exit(2) }
const cap = JSON.parse(readFileSync(resolve(capturePath), "utf8"))
let runner = readFileSync(resolve(root, "scripts/figma-layers-runner.js"), "utf8").split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n")
// The layers step only needs the layers branch — keep each script small enough to read and paste in one go.
const LAYERS_RUNNER = `const page = figma.root.children.find(p => p.id === "2861:52038")
await figma.setCurrentPageAsync(page)
const FONTS = { 400: "Regular", 500: "Medium", 600: "Semi Bold", 700: "Bold" }
for (const s of Object.values(FONTS)) await figma.loadFontAsync({ family: "Inter", style: s })
const solid = (c) => c ? [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a ?? 1 }] : []
const ws = (fw) => FONTS[fw >= 700 ? 700 : fw >= 600 ? 600 : fw >= 500 ? 500 : 400]
const frame = await figma.getNodeByIdAsync(JOB.frameId); if (!frame) throw new Error("frame missing " + JOB.frameId)
let made = 0
for (const L of JOB.layers) {
  if (L.t === "rect") { if (!L.fill && !L.stroke) continue; const r = figma.createRectangle(); r.resize(Math.max(1, L.w), Math.max(1, L.h)); r.x = L.x; r.y = L.y; r.fills = solid(L.fill); if (L.stroke) { r.strokes = solid(L.stroke); r.strokeWeight = Math.max(1, L.sw || 1); r.strokeAlign = "INSIDE" } r.cornerRadius = L.r || 0; r.name = "box"; frame.appendChild(r); made++ }
  else if (L.t === "icon") { const r = figma.createRectangle(); r.resize(Math.max(1, L.w), Math.max(1, L.h)); r.x = L.x; r.y = L.y; r.fills = []; r.strokes = solid({ r: .5, g: .5, b: .5 }); r.strokeWeight = 1.25; r.cornerRadius = 3; r.dashPattern = [2, 2]; r.name = "icon"; frame.appendChild(r); made++ }
  else if (L.t === "text") { const t = figma.createText(); t.fontName = { family: "Inter", style: ws(L.fw || 400) }; t.fontSize = Math.max(6, L.fs || 13); t.characters = L.tt === "uppercase" ? L.s.toUpperCase() : L.s; t.fills = solid(L.c || { r: 0, g: 0, b: 0 }); t.lineHeight = { value: L.lh || Math.round((L.fs || 13) * 1.35), unit: "PIXELS" }; if (L.ls) t.letterSpacing = { value: L.ls, unit: "PIXELS" }; t.textAlignHorizontal = L.ta === "center" ? "CENTER" : L.ta === "right" ? "RIGHT" : "LEFT"; t.textAutoResize = "HEIGHT"; t.resize(Math.max(8, L.w + 2), Math.max(8, L.h)); t.x = L.x; t.y = L.y; t.name = L.s.slice(0, 40); frame.appendChild(t); made++ }
}
return { made, total: frame.children.length, mutatedNodeIds: [frame.id] }`

if (mode === "init") {
  const job = {
    step: "init", width: Math.round(cap.width), height: Math.round(cap.height), bg: cap.bg,
    sectionName: flag("--section", "00 · Full page — editable"), parentSectionId: flag("--parent", null),
    imageHash: flag("--image", null), frameName: flag("--frame", null),
    placeAt: flag("--x") ? { x: +flag("--x"), y: +flag("--y", 0) } : null,
    rationale: flag("--rationale") ? JSON.parse(readFileSync(resolve(flag("--rationale")), "utf8")) : null,
  }
  process.stdout.write(`const JOB = ${JSON.stringify(job)}\n${runner}\n`)
  process.exit(0)
}

if (mode === "layers") {
  const frameId = flag("--frame-id"); if (!frameId) { console.error("--frame-id required"); process.exit(2) }
  const CHUNK = +flag("--chunk", 24000); const MIN_FONT = +flag("--min-font", 9)
  const W = cap.width, H = cap.height
  const layers = cap.layers.filter((L) => {
    if (L.t === "rect") return L.w >= 1 && L.h >= 1 && !(L.w >= W - 2 && L.h >= H - 2)
    if (L.t === "text") return (L.fs || 0) >= MIN_FONT && L.s.trim().length > 0
    return L.t === "icon" && L.w >= 8
  }).map((L) => { const o = { ...L }; for (const k of ["x", "y", "w", "h", "fs", "lh", "ls", "sw", "r"]) if (typeof o[k] === "number") o[k] = Math.round(o[k]); if (o.fill) o.fill = rnd(o.fill); if (o.stroke) o.stroke = rnd(o.stroke); if (o.c) o.c = rnd(o.c); delete o.ff; if (o.tt === "none") delete o.tt; if (!o.ls) delete o.ls; if (o.t === "text" && Math.abs((o.lh || 0) - Math.round(o.fs * 1.35)) <= 2) delete o.lh; if (o.ta === "start" || o.ta === "left") delete o.ta; if (o.t === "rect") delete o.n; if (o.t === "icon") delete o.c; if (o.fw === 400) delete o.fw; if (o.stroke === null) delete o.stroke; if (o.sw === 0 || o.sw === 1) delete o.sw; if (o.r === 0) delete o.r; if (o.fill === null) delete o.fill; return o })
  const outDir = resolve(root, "references/tracker-board/figma/layers"); mkdirSync(outDir, { recursive: true })
  const base = basename(capturePath).replace(/\.json$/, "")
  const chunks = []; let cur = []; let size = 0
  for (const L of layers) { const s = JSON.stringify(L).length + 1; if (size + s > CHUNK && cur.length) { chunks.push(cur); cur = []; size = 0 } cur.push(L); size += s }
  if (cur.length) chunks.push(cur)
  chunks.forEach((c, i) => { const job = { frameId, layers: c }; const code = `const JOB = ${JSON.stringify(job)}\n${LAYERS_RUNNER}\n`; writeFileSync(resolve(outDir, `${base}.${i + 1}.js`), code) })
  console.log(`${layers.length} layers → ${chunks.length} scripts in ${outDir}/${base}.<i>.js (run in order, frame ${frameId})`)
  process.exit(0)
}
function rnd(c) { return { r: +c.r.toFixed(2), g: +c.g.toFixed(2), b: +c.b.toFixed(2), ...(c.a != null && c.a < 1 ? { a: +c.a.toFixed(2) } : {}) } }
console.error("unknown mode " + mode); process.exit(2)
