// v3-figma-runner — runs inside use_figma with `const PLAN = {...}` prepended
// (built by make-figma-plan.py, hashes filled in by upload_assets + curl).
// Modeled on scripts/figma-section-runner.js. Builds ONE new row section on
// page "v3 · P0 Agent config" of file OIKZExT265nOJotBlmv2Ah, placed to the
// right of the last existing top-level section, matching the dark visual
// language of the reference row P0.3 (node 131:5755): 5 child sections in
// order — 1 JTBD, 2 Research, 3 Flow, 4 Hero, 5 Rationale.
//
// PLAN shape (see make-figma-plan.py):
// { id, title, name, jtbd: {job, situation, wantsTo, soThat, happySteps, rainyTitles},
//   research: {images: [{path,hash,label}], finding},
//   flow: [{path,hash,caption,rainyId?}], hero: [{path,hash,caption}],
//   rationale: [string], links: {clickup, tracker, prototype},
//   samAssetImageHash?: string }
//
// Every image entry with hash === null draws as a "pending upload" tile —
// upload it (upload_assets -> POST -> hash), fill the JSON, re-run.

const PAGE_ID = "62:2" // "v3 · P0 Agent config"
const page = await figma.getNodeByIdAsync(PAGE_ID)
if (!page || page.type !== "PAGE") throw new Error("page not found: " + PAGE_ID)
await figma.setCurrentPageAsync(page)
for (const s of ["Regular", "Medium", "Semi Bold"]) await figma.loadFontAsync({ family: "Inter", style: s })

// palette matched to the P0.3 reference section (131:5755)
const PAGE_BG = { r: 0.1286, g: 0.1286, b: 0.1286 }
const CARD = { r: 0.07, g: 0.07, b: 0.07 }
const BORDER = { r: 1, g: 1, b: 1 } // section stroke, thin
const FRAME_BG = { r: 0.102, g: 0.102, b: 0.102 }
const FRAME_BORDER = { r: 0.165, g: 0.165, b: 0.165 }
const TILE_BG = { r: 0.039, g: 0.039, b: 0.039 }
const INK = { r: 0.929, g: 0.929, b: 0.929 } // primary text
const INK2 = { r: 0.604, g: 0.604, b: 0.604 } // field labels (Job/Situation/...)
const INK3 = { r: 0.416, g: 0.416, b: 0.416 } // captions / section sub-labels
const LINK = { r: 0.49, g: 0.827, b: 0.988 } // "Open this step" sky link color
const PENDING = { r: 0.3, g: 0.3, b: 0.3 }

const solid = (c) => [{ type: "SOLID", color: c }]
const text = (chars, size, color, style = "Regular", width) => {
  const t = figma.createText()
  t.fontName = { family: "Inter", style }
  t.fontSize = size
  t.characters = chars && chars.length ? chars : " "
  t.fills = solid(color)
  t.lineHeight = { value: Math.round(size * 1.4), unit: "PERCENT" }
  t.textAutoResize = "HEIGHT"
  if (width) t.resize(width, 10)
  return t
}
const linkText = (label, url, size = 13) => {
  const t = text(label, size, LINK, "Regular")
  if (url) t.setRangeHyperlink(0, t.characters.length, { type: "URL", value: url })
  return t
}
// NOTE: resize() resets both sizing modes to FIXED as a side effect, so the
// explicit AUTO/FIXED assignment always happens AFTER resize(), never before.
const autoV = (name, gap, props = {}) => {
  const f = figma.createAutoLayout("VERTICAL")
  f.name = name
  f.itemSpacing = gap
  f.fills = [] // a bare auto-layout frame defaults to a WHITE fill in Figma;
  // this must stay transparent so the dark section fill shows through —
  // callers that want a visible background (e.g. buildFlow's story card)
  // set .fills explicitly afterward.
  if (props.width) {
    f.resize(props.width, 10)
    f.primaryAxisSizingMode = "AUTO" // height hugs content
    f.counterAxisSizingMode = "FIXED" // width fixed
  } else {
    f.primaryAxisSizingMode = "AUTO"
    f.counterAxisSizingMode = "AUTO"
  }
  return f
}
const autoH = (name, gap, props = {}) => {
  const f = figma.createAutoLayout("HORIZONTAL")
  f.name = name
  f.itemSpacing = gap
  f.fills = [] // see autoV — bare auto-layout frames default to WHITE
  if (props.wrap) f.layoutWrap = "WRAP"
  if (props.width) {
    f.resize(props.width, 10)
    f.primaryAxisSizingMode = "FIXED" // width fixed
    f.counterAxisSizingMode = "AUTO" // height hugs / wraps
  } else {
    f.primaryAxisSizingMode = "AUTO"
    f.counterAxisSizingMode = "AUTO"
  }
  return f
}
const pad = (f, t, r = t, b = t, l = r) => { f.paddingTop = t; f.paddingRight = r; f.paddingBottom = b; f.paddingLeft = l; return f }

// every image node built with no hash yet is recorded here so a follow-up
// upload_assets call (nodeIds targeting these exact ids, in this exact
// order) can drop the real image straight onto the placeholder — no
// re-run of this script needed. See IMAGE_SLOTS in the return value.
const IMAGE_SLOTS = []

// an image tile: uses PLAN-supplied hash if present, else a plain dark
// placeholder (registered in IMAGE_SLOTS for the upload_assets follow-up —
// no overlay text, so the node is a clean target for a later image fill)
const imageTile = (item, width, height, radius = 8) => {
  const box = figma.createFrame()
  box.name = "shot · " + (item?.label || item?.caption || "")
  box.resize(width, height)
  box.cornerRadius = radius
  box.strokes = solid(FRAME_BORDER)
  box.strokeWeight = 1
  box.clipsContent = true
  if (item && item.hash) {
    box.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: item.hash }]
  } else {
    box.fills = solid(TILE_BG)
    if (item && item.path) IMAGE_SLOTS.push({ path: item.path, nodeId: box.id })
  }
  return box
}

const CONTENT_W = 2400 // matches P0.3's inner content width (section is 5280 wide incl. 40px margins + gutter)

const AVATAR_SLOTS = []
function makeAvatar(hash) {
  const e = figma.createEllipse()
  e.resize(48, 48)
  if (hash) { e.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: hash }] } else { e.fills = solid(PENDING); AVATAR_SLOTS.push(e.id) }
  return e
}

// ---- section 1 · JTBD ----
function buildJTBD(plan) {
  const root = autoV("JTBD", 32)
  root.appendChild(text("JTBD", 32, INK, "Semi Bold"))

  const jobBlock = autoV("Job", 12)
  root.appendChild(jobBlock)
  for (const [label, value] of [
    ["Job", plan.jtbd.job],
    ["Situation", plan.jtbd.situation],
    ["Sam wants to", plan.jtbd.wantsTo],
    ["So that", plan.jtbd.soThat],
  ]) {
    const row = autoH(label, 24)
    jobBlock.appendChild(row)
    row.appendChild(text(label, 22, INK2, "Medium", 200))
    row.appendChild(text(value || "pending", 22, INK, "Regular", CONTENT_W - 200 - 24))
  }

  const paths = autoH("Paths", 80)
  root.appendChild(paths)
  const happy = autoV("Happy path", 10)
  paths.appendChild(happy)
  happy.appendChild(text("Happy path", 16, INK3, "Semi Bold"))
  const steps = plan.jtbd.happySteps && plan.jtbd.happySteps.length ? plan.jtbd.happySteps : ["pending — written at Stop 1"]
  steps.forEach((s, i) => happy.appendChild(text(`${i + 1}  ${s}`, 18, INK, "Regular", 700)))

  const rainy = autoV("Rainy paths", 10)
  paths.appendChild(rainy)
  rainy.appendChild(text("Rainy paths", 16, INK3, "Semi Bold"))
  const rainyTitles = plan.jtbd.rainyTitles && plan.jtbd.rainyTitles.length ? plan.jtbd.rainyTitles : []
  if (!rainyTitles.length) rainy.appendChild(text("pending — no rainy ids in row.md", 18, INK, "Regular", 500))
  for (const r of rainyTitles) rainy.appendChild(text(`${r.id}  ${r.title}`, 18, INK, "Regular", 500))

  return root
}

// ---- section 2 · Research ----
function buildResearch(plan) {
  const root = autoV("Research", 32)
  root.appendChild(text("Research", 32, INK, "Semi Bold"))
  const shots = autoH("Shots", 40, { width: CONTENT_W, wrap: true })
  root.appendChild(shots)
  const images = plan.research.images || []
  if (!images.length) {
    shots.appendChild(text("pending — capture owed, see row.md “Research already done”", 16, INK3))
  }
  for (const img of images) {
    const col = autoV(img.label || "shot", 12)
    shots.appendChild(col)
    col.appendChild(text(img.label || "", 14, INK3, "Medium"))
    col.appendChild(imageTile(img, 560, 350))
  }
  if (plan.research.finding) {
    root.appendChild(text(plan.research.finding, 18, INK, "Regular", CONTENT_W))
  }
  return root
}

// ---- section 3 · Flow (story frames) ----
function buildFlow(plan, samHash) {
  const root = autoV("Flow", 32)
  root.appendChild(text("Flow", 32, INK, "Semi Bold"))
  const frames = autoH("Frames", 40, { width: CONTENT_W, wrap: true })
  root.appendChild(frames)
  const steps = plan.flow || []
  if (!steps.length) frames.appendChild(text("pending — no flow/*.png captured yet", 16, INK3))
  steps.forEach((step, i) => {
    const card = autoV(`${String(i + 1).padStart(2, "0")} · ${step.rainyId ? "Rainy " + step.rainyId : "Happy"}`, 20, { width: 1162 })
    pad(card, 24)
    card.fills = solid(FRAME_BG)
    card.strokes = solid(FRAME_BORDER)
    card.strokeWeight = 1
    card.cornerRadius = 12
    frames.appendChild(card)

    const samRow = autoH("Sam", 16)
    card.appendChild(samRow)
    samRow.appendChild(makeAvatar(samHash))
    const lines = autoV("Lines", 2)
    samRow.appendChild(lines)
    lines.appendChild(text(step.rainyId ? "Rainy " + step.rainyId : `Happy · ${i + 1}`, 12, INK3, "Medium"))
    lines.appendChild(text(step.caption || "Sam continues", 20, INK, "Medium", 1064))

    card.appendChild(imageTile(step, 1112, 695, 6))
    card.appendChild(linkText("Open this step in the prototype", plan.links.prototype, 13))
  })
  return root
}

// ---- section 4 · Hero ----
function buildHero(plan) {
  const root = autoV("Hero", 32)
  root.appendChild(text("Hero", 32, INK, "Semi Bold"))
  const row = autoH("Hero shots", 40)
  root.appendChild(row)
  const shots = plan.hero || []
  if (!shots.length) {
    row.appendChild(text("pending — the hero shots are the row's two main happy-path screenshots", 16, INK3))
  }
  for (const h of shots) {
    const col = autoV(h.caption || "hero", 12)
    row.appendChild(col)
    col.appendChild(imageTile(h, 1160, 725, 12))
    col.appendChild(text(h.caption || "", 16, INK, "Regular", 1160))
  }
  return root
}

// ---- section 5 · Rationale ----
function buildRationale(plan) {
  const root = autoV("Rationale", 20)
  root.appendChild(text("Rationale", 32, INK, "Semi Bold"))
  const lines = plan.rationale && plan.rationale.length ? plan.rationale : ["pending — written at Stop 5/6"]
  lines.forEach((l, i) => root.appendChild(text(`${i + 1}  ${l}`, 20, INK, "Regular", CONTENT_W)))
  root.appendChild(linkText(plan.links.clickup ? "ClickUp" : "ClickUp (pending link in row.md)", plan.links.clickup, 16))
  root.appendChild(linkText(plan.links.tracker ? "Design Delivery Board" : "Design Delivery Board (pending link)", plan.links.tracker, 16))
  root.appendChild(linkText(plan.links.prototype ? "Prototype" : "Prototype (pending link)", plan.links.prototype, 16))
  return root
}

// ---- place a child section, matching P0.3's section chrome ----
function placeChildSection(parent, name, card, y) {
  const sec = figma.createSection()
  sec.name = name
  sec.fills = solid(CARD)
  sec.strokes = solid(BORDER)
  sec.strokeWeight = 1
  sec.cornerRadius = 2
  parent.appendChild(sec)
  sec.appendChild(card)
  card.x = 40
  card.y = 40
  sec.resizeWithoutConstraints(CONTENT_W + 80, card.height + 80)
  sec.x = 40
  sec.y = y
  return sec
}

// ---- find where to place the new row section (to the right of the last one) ----
function nextRowX() {
  const sections = page.children.filter((c) => c.type === "SECTION")
  if (!sections.length) return 0
  const rightmost = sections.reduce((a, b) => (a.x + a.width > b.x + b.width ? a : b))
  return rightmost.x + rightmost.width + 200 // fixed gutter, matches existing P0.1->P0.2->P0.3 spacing
}

// PLAN is provided by the `const PLAN = {...}` line prepended ahead of this
// script (see the compose step in the report / rules.md convention).
const samHash = PLAN.samAssetImageHash || null

const row = figma.createSection()
row.name = PLAN.name
row.fills = solid(PAGE_BG)
figma.currentPage.appendChild(row)
row.x = nextRowX()
row.y = 0

const title = text(PLAN.name, 48, INK, "Semi Bold")
row.appendChild(title)
title.x = 40
title.y = 40

const childDefs = [
  ["1 JTBD", buildJTBD(PLAN)],
  ["2 Research", buildResearch(PLAN)],
  ["3 Flow", buildFlow(PLAN, samHash)],
  ["4 Hero", buildHero(PLAN)],
  ["5 Rationale", buildRationale(PLAN)],
]

let y = 120
const madeIds = []
for (const [name, card] of childDefs) {
  const sec = placeChildSection(row, name, card, y)
  y += sec.height + 40
  madeIds.push(sec.id)
}
row.resizeWithoutConstraints(CONTENT_W + 160, y)

return {
  rowSectionId: row.id,
  name: row.name,
  x: row.x,
  y: row.y,
  width: row.width,
  height: Math.round(row.height),
  childSectionIds: madeIds,
  createdNodeIds: [row.id, ...madeIds],
  // follow-up: call upload_assets with fileKey, currentPageId=PAGE_ID,
  // nodeIds = imageSlots.map(s => s.nodeId) (same order), POST each file at
  // imageSlots[i].path to its returned upload URL. Same for avatarSlots if
  // PLAN.samAssetImageHash was not supplied (upload sam-dark.webp once,
  // cache the returned hash in sam-asset-ref.json, reuse for every row).
  imageSlots: IMAGE_SLOTS,
  avatarSlots: samHash ? [] : AVATAR_SLOTS,
}
