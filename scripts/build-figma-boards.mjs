#!/usr/bin/env node
// build-figma-boards — one import-ready SVG section board per Design Tracker
// feature, from references/tracker-board/tracker-board.json and the PNGs it
// references. Figma imports SVG as editable frames: text stays text, embedded
// PNGs become image fills. Drag the file onto the "Sandbox New" page of Agora
// Studio X (xaAgeioGlZosBsRquDXLvI) and it lands as a frame named NN · Feature.
//
//   node scripts/build-figma-boards.mjs            # all rows with research
//   node scripts/build-figma-boards.mjs 04 07      # selected rows
//   node scripts/build-figma-boards.mjs --images 04 07   # print the ordered image list (JSON) instead
//
// The SVG embeds 720px thumbnails to stay under Figma's 10 MB upload limit. After
// importing (upload_assets → POST the SVG → use_figma moves the frame into its
// section), replace the fills with the full-resolution PNGs: `--images` prints the
// files in SVG document order, which is the order use_figma's findAll returns the
// image-fill rectangles. Request upload_assets slots (no nodeIds — that path
// reports success without changing fills), POST each PNG, then set each rect's
// fill yourself: rect.fills = [{type:"IMAGE", scaleMode:"FILL", imageHash}] with
// the hash from the POST response. See references/design-ops-protocol.md → Review loop.
//
// Layout per board (reads top to bottom, the review loop):
//   header (NN · name · status · ClickUp)  →  JTBD  →  Competitors (Vapi · Retell ·
//   ElevenLabs · LiveKit, product first then docs, URL under each)  →  Our proposal
//   (red-marked shots)  →  Prototype (preview + review links)  →  Next / decisions.
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "..")
const data = JSON.parse(readFileSync(resolve(root, "references/tracker-board/tracker-board.json"), "utf8"))
const outDir = resolve(root, "references/tracker-board/figma")
mkdirSync(outDir, { recursive: true })

const argv = process.argv.slice(2)
const imagesOnly = argv.includes("--images")
const only = argv.filter((a) => a !== "--images")
const VENDORS = ["Vapi", "Retell", "ElevenLabs", "LiveKit"]
const W = 2400, PAD = 64, GAP = 32
const COL = (W - PAD * 2 - GAP * 3) / 4 // competitor column width
const INK = "#101e26", INK2 = "#4c5f69", INK3 = "#7d8f99", RULE = "#d5dfe5", CARD = "#ffffff", GROUND = "#f2f6f8", ACCENT = "#00658d"
const STATUS = { "Not Done": ["#5b6b74", "#e6ecef"], WIP: ["#8a5a00", "#fbf1d9"], "Pending review": ["#00658d", "#dcedf4"], Done: ["#1a7a4a", "#dff3e8"] }
const FONT = "Inter, Helvetica, Arial, sans-serif"

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// Figma's SVG importer keeps text; it does not wrap, so wrap here by an
// average glyph width (0.55 em for Inter at the sizes used).
const wrap = (text, size, width) => {
  const perLine = Math.max(8, Math.floor(width / (size * 0.55)))
  const words = String(text ?? "").split(/\s+/)
  const lines = []
  let line = ""
  for (const w of words) {
    if ((line + " " + w).trim().length > perLine && line) { lines.push(line); line = w } else line = (line + " " + w).trim()
  }
  if (line) lines.push(line)
  return lines
}
const textBlock = (x, y, lines, size, fill, weight = 400, lh = 1.35) =>
  lines.map((l, i) => `<text x="${x}" y="${y + size + i * size * lh}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(l)}</text>`).join("")
const heightOf = (lines, size, lh = 1.35) => lines.length * size * lh + size * 0.2

// thumbnails: reuse the board's cached <file>.thumb.png (720px) — small SVGs, readable in Figma
const thumb = (file) => {
  const src = resolve(root, file); const t = `${src}.thumb.png`
  if (!existsSync(t) || statSync(t).mtimeMs < statSync(src).mtimeMs) execFileSync("sips", ["-Z", "720", src, "--out", t], { stdio: "ignore" })
  const buf = readFileSync(t)
  // PNG IHDR: width at bytes 16-19, height at 20-23
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20)
  return { href: `data:image/png;base64,${buf.toString("base64")}`, w, h }
}
const image = (x, y, width, file, alt) => {
  const t = thumb(file); const h = Math.round(width * t.h / t.w)
  return { svg: `<rect x="${x}" y="${y}" width="${width}" height="${h}" rx="8" fill="#0b0f13"/><image x="${x}" y="${y}" width="${width}" height="${h}" href="${t.href}" preserveAspectRatio="xMidYMid meet"><title>${esc(alt)}</title></image>`, h }
}
const pill = (x, y, label) => {
  const [fg, bg] = STATUS[label] ?? [INK2, RULE]; const w = label.length * 9 + 28
  return { svg: `<rect x="${x}" y="${y}" width="${w}" height="30" rx="15" fill="${bg}"/><text x="${x + 14}" y="${y + 20}" font-family="${FONT}" font-size="14" font-weight="600" fill="${fg}">${esc(label)}</text>`, w }
}
const sectionTitle = (y, label) => `<text x="${PAD}" y="${y + 18}" font-family="${FONT}" font-size="14" font-weight="600" letter-spacing="1.2" fill="${ACCENT}">${esc(label.toUpperCase())}</text><line x1="${PAD}" y1="${y + 32}" x2="${W - PAD}" y2="${y + 32}" stroke="${RULE}"/>`

function board(r) {
  const parts = []; let y = PAD
  // header
  parts.push(`<text x="${PAD}" y="${y + 40}" font-family="${FONT}" font-size="40" font-weight="600" fill="${INK}">${esc(r.name)}</text>`)
  const p = pill(PAD, y + 62, r.status); parts.push(p.svg)
  parts.push(`<text x="${PAD + p.w + 16}" y="${y + 83}" font-family="${FONT}" font-size="15" fill="${INK3}">${esc(r.tags)}  ·  ClickUp ${esc(r.clickup)}</text>`)
  parts.push(`<text x="${PAD}" y="${y + 116}" font-family="${FONT}" font-size="14" fill="${INK3}">${esc(r.clickupSays)}</text>`)
  y += 150
  // JTBD
  parts.push(sectionTitle(y, "JTBD")); y += 52
  const jl = wrap(r.jtbd, 30, W - PAD * 2); parts.push(textBlock(PAD, y, jl, 30, INK, 500, 1.3)); y += heightOf(jl, 30, 1.3) + 40
  // Competitors
  parts.push(sectionTitle(y, "Competitors — docs and logged-in product")); y += 52
  const cols = VENDORS.map((v, i) => ({ v, x: PAD + i * (COL + GAP), items: (r.secondary ?? []).filter((s) => s.vendor === v).sort((a, b) => (a.kind === "product" ? -1 : 1) - (b.kind === "product" ? -1 : 1)) }))
  let maxH = 0
  for (const c of cols) {
    let cy = y
    parts.push(`<text x="${c.x}" y="${cy + 18}" font-family="${FONT}" font-size="16" font-weight="600" fill="${INK}">${esc(c.v)}</text>`); cy += 32
    if (c.items.length === 0) { parts.push(`<rect x="${c.x}" y="${cy}" width="${COL}" height="120" rx="8" fill="${GROUND}" stroke="${RULE}" stroke-dasharray="6 6"/><text x="${c.x + 16}" y="${cy + 66}" font-family="${FONT}" font-size="15" fill="${INK3}">pending — capture owed</text>`); cy += 136 }
    for (const it of c.items) {
      const im = image(c.x, cy, COL, it.shot, it.label); parts.push(im.svg); cy += im.h + 8
      const cap = wrap(`${it.kind === "product" ? "PRODUCT" : "DOCS"} · ${it.label}`, 14, COL); parts.push(textBlock(c.x, cy, cap, 14, INK2, 400, 1.3)); cy += heightOf(cap, 14, 1.3)
      const url = wrap(it.href ?? "", 12, COL); parts.push(textBlock(c.x, cy, url, 12, ACCENT, 400, 1.3)); cy += heightOf(url, 12, 1.3) + 18
    }
    maxH = Math.max(maxH, cy - y)
  }
  y += maxH + 24
  // Our proposal
  parts.push(sectionTitle(y, "Our proposal — what we built, marked in red")); y += 52
  if (r.shot) {
    const im = image(PAD, y, Math.min(1400, W - PAD * 2), r.shot.file, r.shot.alt); parts.push(im.svg)
    const rl = wrap(r.rationale || "—", 18, W - PAD * 2 - 1400 - GAP)
    parts.push(textBlock(PAD + 1400 + GAP, y, rl, 18, INK2, 400, 1.4)); y += Math.max(im.h, heightOf(rl, 18, 1.4)) + 40
  } else {
    const rl = wrap(r.rationale ? `Direction chosen: ${r.rationale}` : "Not built yet.", 18, W - PAD * 2); parts.push(textBlock(PAD, y, rl, 18, INK2, 400, 1.4)); y += heightOf(rl, 18, 1.4) + 40
  }
  // Prototype / open
  parts.push(sectionTitle(y, "Open — prototype, review page, research")); y += 52
  for (const l of r.open ?? []) { parts.push(`<text x="${PAD}" y="${y + 16}" font-family="${FONT}" font-size="16" fill="${INK}"><tspan font-weight="600">${esc(l.label)}</tspan>  <tspan fill="${ACCENT}">${esc(l.href)}</tspan></text>`); y += 28 }
  y += 20
  // Next
  parts.push(sectionTitle(y, "Next / decisions")); y += 52
  const nl = wrap(r.next, 18, W - PAD * 2); parts.push(textBlock(PAD, y, nl, 18, INK, 400, 1.4)); y += heightOf(nl, 18, 1.4) + PAD
  const H = Math.ceil(y)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${esc(r.name)}</title><rect width="${W}" height="${H}" fill="${CARD}"/>${parts.join("")}</svg>`
}

if (imagesOnly) {
  const list = []
  for (const r of data.rows) {
    if (only.length && !only.includes(r.n)) continue
    let i = 0
    for (const v of VENDORS) {
      const items = (r.secondary ?? []).filter((s) => s.vendor === v).sort((a, b) => (a.kind === "product" ? -1 : 1) - (b.kind === "product" ? -1 : 1))
      for (const it of items) list.push({ n: r.n, i: i++, file: it.shot, label: `${v} ${it.kind}` })
    }
    if (r.shot) list.push({ n: r.n, i: i++, file: r.shot.file, label: "proposal" })
  }
  console.log(JSON.stringify(list, null, 1))
  process.exit(0)
}

let count = 0
for (const r of data.rows) {
  const hasResearch = (r.secondary ?? []).length > 0 || r.shot || (r.open ?? []).some((l) => l.label === "Brief")
  if ((only.length && !only.includes(r.n)) || (!only.length && !hasResearch)) continue
  const svg = board(r)
  const file = resolve(outDir, `${r.n} · ${r.name.replace(/^\d+ · /, "").replace(/[\/\\:]/g, "-")}.svg`)
  writeFileSync(file, svg); count++
  console.log(`${file.split("/").pop()}  ${Math.round(svg.length / 1024)} KB`)
}
console.log(`${count} boards → ${outDir}`)
