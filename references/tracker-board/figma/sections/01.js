const PLANS = [{"n":"01","name":"01 · Voice picker & recommendations","sectionId":"3122:40585","status":"Pending review","clickup":"https://app.clickup.com/t/868m0medx","tags":"builder · voices · P0-Sep","clickupSays":"ClickUp: research Pending · UI exists (voice select) · status planning","jtbd":{"headline":"User wants to pick a voice that fits the use case without auditioning the whole catalog.","happy":[{"title":"Pick once, go live","jtbd":"When I've written the greeting, I hear the recommended voice say it and ship without auditioning the catalog."}],"rainy":[{"title":"No voice in my language","jtbd":"The recommended voice doesn't exist for my locale; I need the next best and a way to preview it."},{"title":"Preview fails","jtbd":"The voice vendor errors or is slow when I press play; I still need to choose without guessing."},{"title":"Cloned voice not ready","jtbd":"My cloned voice is pending consent or rejected; callers must not hear a placeholder unannounced."},{"title":"Voice changed after go-live","jtbd":"A vendor model update changed how my agent sounds; I need to notice and pin or revert."}]},"research":[{"scenario":"happy","titles":["Pick once, go live"],"columns":[{"vendor":"Vapi","items":[{"vendor":"Vapi","kind":"product","label":"Voice settings panel — Voice model · Speed · Background Sound (Off / Office / Default / Custom)","href":"https://dashboard.vapi.ai/assistants","hash":"78ae20746d9cd26b987241cd0eb34a1b8b01ba69","dims":{"w":3200,"h":2000},"marks":[{"box":[0.749,0.152,0.995,0.21],"tag":"Voice model"},{"box":[0.749,0.228,0.995,0.346],"tag":"Voice library"}],"scenario":"happy","redo":null},{"vendor":"Vapi","kind":"docs","label":"Voice fallback plan","href":"https://docs.vapi.ai/voice-fallback-plan","hash":"59faf3f7f866c6a78972f092335c6bef8f897a4d","dims":{"w":1400,"h":962},"marks":[{"box":[0.22,0.168,0.78,0.45],"tag":"Voice fallback overview"}],"scenario":"happy","redo":null}]},{"vendor":"Retell","items":[{"vendor":"Retell","kind":"product","label":"Agent editor — Kate voice · English (US) · Welcome Message · AI speaks first · Pause Before Speaking","href":"https://dashboard.retellai.com/agents","hash":"50d0623679788383e3bd24fe868b6cfc07bf0e46","dims":{"w":3200,"h":2000},"marks":[{"box":[0.15,0.1,0.235,0.142],"tag":"Voice selector"},{"box":[0.238,0.1,0.33,0.142],"tag":"Language selector"}],"scenario":"happy","redo":null},{"vendor":"Retell","kind":"docs","label":"List Voices API — voice_id · provider · gender · accent · age · preview","href":"https://docs.retellai.com/api-references/list-voices","hash":"7d5a2d05a30da15700f6de3b6c2b1cf04b7b7c0d","dims":{"w":3200,"h":2000},"marks":[{"box":[0.675,0.4,0.955,0.684],"tag":"Voice attributes"}],"scenario":"happy","redo":null}]},{"vendor":"ElevenLabs","items":[{"vendor":"ElevenLabs","kind":"product","label":"Voice library — Trending · language/style filters · use-case picks","href":"https://elevenlabs.io/app/agents/voice-library","hash":"b20dba6eff6f5fbecee72553b191fd4c83e35ea4","dims":{"w":3200,"h":2000},"marks":[{"box":[0.219,0.282,0.715,0.322],"tag":"Style filters"},{"box":[0.219,0.352,0.665,0.556],"tag":"Trending voices"},{"box":[0.175,0.614,0.888,0.824],"tag":"Use-case picks"}],"scenario":"happy","redo":null},{"vendor":"ElevenLabs","kind":"docs","label":"Voice library","href":"https://elevenlabs.io/docs/product-guides/voices/voice-library","hash":"cab267c9c98d22f90d092a93f290408a7bf8d5b8","dims":{"w":1400,"h":962},"marks":[{"box":[0.351,0.379,0.75,0.499],"tag":"Trending voices"},{"box":[0.351,0.525,0.75,0.65],"tag":"Handpicked collections"}],"scenario":"happy","redo":null}]},{"vendor":"LiveKit","items":[{"vendor":"LiveKit","kind":"product","label":"Voices — Custom vs Default voices · voice-clone upsell","href":"https://cloud.livekit.io","hash":"f6e56ed982d86d02fc675b4ae311483e87702bb6","dims":{"w":3200,"h":2000},"marks":[{"box":[0.171,0.032,0.325,0.09],"tag":"Voice tabs"},{"box":[0.465,0.368,0.695,0.6],"tag":"Voice-clone upsell"}],"scenario":"happy","redo":null},{"vendor":"LiveKit","kind":"product","label":"Default voices table — provider / language / gender filters","href":"https://cloud.livekit.io","hash":"dfe04f1fa3079c1c340dbb6fc3730226a89fe88c","dims":{"w":3200,"h":2000},"marks":[{"box":[0.171,0.234,0.983,0.278],"tag":"Voice filters"},{"box":[0.171,0.32,0.983,0.62],"tag":"Voices table"}],"scenario":"happy","redo":null},{"vendor":"LiveKit","kind":"docs","label":"TTS models — custom voices · expressive mode · Cartesia Sonic 3","href":"https://docs.livekit.io/agents/models/tts/","hash":"7371fa855d4e28c5e71d9ca9e3c763c0f49622a2","dims":{"w":3200,"h":2000},"marks":[{"box":[0.305,0.799,0.75,1],"tag":"TTS model table"},{"box":[0.747,0.308,0.9,0.352],"tag":"Custom & suggested voices"}],"scenario":"happy","redo":null}]}]},{"scenario":"rainy","titles":["No voice in my language","Preview fails","Cloned voice not ready","Voice changed after go-live"],"columns":[{"vendor":"Vapi","items":[]},{"vendor":"Retell","items":[]},{"vendor":"ElevenLabs","items":[]},{"vendor":"LiveKit","items":[]}]}],"learnings":["Vapi and Retell put the voice choice inside the assistant editor as a card with provider + model, not a separate gallery (Vapi voice panel, Retell agent editor).","ElevenLabs sells discovery: style filters, trending and use-case picks before any list (voice library).","LiveKit exposes voices only as a table per TTS vendor — no recommendation layer at all (docs: TTS voices)."],"directions":["A · Recommended first","B · Compare tray","C · Voice in the row","D · Add your own voice","E · Voices, plural (inert)"],"verdict":"Verdict — converged A + B + D","directionsPage":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/01-voice-picker/05-directions.html","prototype":{"open":[{"label":"ClickUp","href":"https://app.clickup.com/t/868m0medx"},{"label":"Preview (Studio X)","href":"https://ai-studio-console-redesign.vercel.app/agents/agt_default/edit?focus=voice-recommended"},{"label":"Brief","href":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/01-voice-picker/00-brief.md"},{"label":"Directions","href":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/01-voice-picker/05-directions.html"},{"label":"Hero (Figma)","href":"https://www.figma.com/design/xaAgeioGlZosBsRquDXLvI/Agora-Studio-X?node-id=3173-40584"}],"shot":{"alt":"Select voice with the Recommended strip, the Compare column and Add your own voice — marked in red","hash":"09bd34ee6fc47e239d5417d504f9a3516a0248c8","dims":{"w":3200,"h":2400}},"moreShots":[],"rationale":"Inside the existing Select voice dialog: a Recommended strip (three voices ranked from the prompt's use case — tags, not benchmarks), a Compare column with a tray to hear ≤3 on the same script, and Add your own voice (id · name · consent · scope). The catalog, filters and paging are untouched.","next":"Review on the preview. Decide: may we say 'Recommended' from tags before the benchmark? Sign off the strip copy and the consent line."},"before":[{"alt":"Flat catalog: table, filters, paging — no recommendation, no way to compare","source":"Studio X 2 live (main @ 0c27a1a, 2026-09-11) — Voice & Models › Select voice","wrong":["Every voice is equal: the builder must audition a 14-row catalog to find one that fits the prompt (rainy: 'no voice in my language' has no signal either).","Use voice is the only action — no shortlist of two or three voices on the same script, so comparing means opening and closing the dialog repeatedly.","No way to bring your own voice; cloning lives outside the picker with no consent step."],"hash":"8269959ec4c74091e51f70a54462cc1d6b512d51","dims":{"w":3200,"h":2400}}],"hero":[{"node":"3140:40790","frame":"3173:40584","name":"Hero · 01 Select voice — Recommended · Compare · Add your own voice","url":"https://www.figma.com/design/xaAgeioGlZosBsRquDXLvI/Agora-Studio-X?node-id=3140-40790","editable":"Select voice dialog — editable (3173:40584), 372 native layers"}],"tracker":{"board":"https://claude.ai/code/artifact/a1d57eb9-2121-484c-b2f6-2d728cbd1466","clickup":"https://app.clickup.com/t/868m0medx","figma":"https://www.figma.com/design/xaAgeioGlZosBsRquDXLvI/Agora-Studio-X?node-id=3122-40585"}}]
const page = figma.root.children.find(p => p.id === "2861:52038")
await figma.setCurrentPageAsync(page)
for (const s of ["Regular", "Medium", "Semi Bold", "Bold"]) await figma.loadFontAsync({ family: "Inter", style: s })
async function buildFeature(PLAN) {
const INK = { r: .063, g: .118, b: .149 }, INK2 = { r: .298, g: .373, b: .412 }, INK3 = { r: .49, g: .56, b: .6 }, RULE = { r: .835, g: .875, b: .898 }
const ACCENT = { r: 0, g: .396, b: .553 }, RED = { r: .898, g: .09, b: .247 }, WHITE = { r: 1, g: 1, b: 1 }, GROUND = { r: .949, g: .965, b: .973 }, DARK = { r: .04, g: .06, b: .07 }
const STATUS = { "Not Done": [{ r: .357, g: .42, b: .455 }, { r: .902, g: .925, b: .937 }], WIP: [{ r: .541, g: .353, b: 0 }, { r: .984, g: .945, b: .851 }], "Pending review": [ACCENT, { r: .863, g: .929, b: .957 }], Done: [{ r: .102, g: .478, b: .29 }, { r: .875, g: .953, b: .91 }] }
const W = 2400, PAD = 48, COLW = 544, GAP = 32
const solid = c => [{ type: "SOLID", color: c }]
const text = (chars, size, color, style = "Regular", width = W - PAD * 2) => { const t = figma.createText(); t.fontName = { family: "Inter", style }; t.fontSize = size; t.characters = chars || " "; t.fills = solid(color); t.lineHeight = { value: Math.round(size * 1.35), unit: "PIXELS" }; t.textAutoResize = "HEIGHT"; t.resize(width, 10); return t }
const linkText = (label, url, size = 16, width = W - PAD * 2) => { const t = text(label ? `${label}  ${url}` : url, size, ACCENT, "Regular", width); t.setRangeHyperlink(0, t.characters.length, { type: "URL", value: url }); if (label) { t.setRangeFontName(0, label.length, { family: "Inter", style: "Semi Bold" }); t.setRangeFills(0, label.length, solid(INK)) } return t }
const stack = (dir, o = {}) => { const f = figma.createAutoLayout(dir); f.name = o.name || "stack"; f.itemSpacing = o.gap ?? 16; f.paddingTop = f.paddingBottom = o.py ?? o.pad ?? 0; f.paddingLeft = f.paddingRight = o.px ?? o.pad ?? 0; f.fills = o.fill ? solid(o.fill) : []; f.cornerRadius = o.radius ?? 0; if (o.stroke) { f.strokes = solid(o.stroke); f.strokeWeight = 1; if (o.dash) f.dashPattern = [6, 6] } if (o.width) { f.resize(o.width, 10); if (dir === "VERTICAL") { f.counterAxisSizingMode = "FIXED"; f.primaryAxisSizingMode = "AUTO" } else { f.primaryAxisSizingMode = "FIXED"; f.counterAxisSizingMode = "AUTO" } } return f }
const add = (parent, child, fill = true) => { parent.appendChild(child); if (fill && child.type !== "FRAME" || (fill && child.layoutMode)) { try { child.layoutSizingHorizontal = "FILL" } catch {} } return child }
const rule = (parent) => { const r = figma.createRectangle(); r.resize(100, 1); r.fills = solid(RULE); parent.appendChild(r); r.layoutSizingHorizontal = "FILL"; return r }
const card = (name) => stack("VERTICAL", { name, gap: 20, pad: PAD, fill: WHITE, radius: 12, width: W })
const heading = (parent, label, sub) => { add(parent, text(label.toUpperCase(), 14, ACCENT, "Semi Bold")).letterSpacing = { value: 1.2, unit: "PIXELS" }; if (sub) add(parent, text(sub, 15, INK3)); rule(parent) }
const pill = (label, fg, bg, size = 12) => { const p = stack("HORIZONTAL", { name: "pill · " + label, px: 8, py: 3, fill: bg, radius: 4 }); const t = figma.createText(); t.fontName = { family: "Inter", style: "Semi Bold" }; t.fontSize = size; t.characters = label; t.fills = solid(fg); p.appendChild(t); return p }
const tile = (item, width) => {
  const d = item.dims || { w: 16, h: 10 }; const h = Math.round(width * d.h / d.w)
  const box = figma.createFrame(); box.name = "shot · " + (item.label || item.alt || ""); box.resize(width, h); box.fills = solid(DARK); box.cornerRadius = 8; box.clipsContent = true
  if (item.hash) {
    const r = figma.createRectangle(); r.name = "image"; r.resize(width, h); r.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: item.hash }]; box.appendChild(r); r.x = 0; r.y = 0
    const marks = []
    for (const m of item.marks || []) {
      const [x0, y0, x1, y1] = m.box; const bx = x0 * width, by = y0 * h, bw = Math.max(8, (x1 - x0) * width), bh = Math.max(8, (y1 - y0) * h)
      const o = figma.createRectangle(); o.name = "mark · " + m.tag; o.resize(bw, bh); o.fills = []; o.strokes = solid(RED); o.strokeWeight = 3; o.cornerRadius = 4; box.appendChild(o); o.x = bx; o.y = by
      const p = pill(m.tag, WHITE, RED, 11); p.name = "tag · " + m.tag; box.appendChild(p)
      const above = by - p.height - 2 >= 0; p.x = Math.min(above ? bx : bx + 3, width - p.width - 2); p.y = above ? by - p.height - 2 : by + 3
      if (marks.some(q => q.x < p.x + p.width && q.x + q.width > p.x && q.y < p.y + p.height && q.y + q.height > p.y)) { p.x = Math.min(bx, width - p.width - 2); p.y = by + bh + 2; if (p.y + p.height > h) { p.x = bx + 3; p.y = by + 3 } }
      marks.push(p)
    }
  } else { const t = text("pending upload — " + (item.label || ""), 14, INK3, "Regular", width - 32); box.appendChild(t); t.x = 16; t.y = Math.max(16, h / 2 - 12) }
  return box
}
const placeholder = (label, width, height = 120) => { const f = stack("VERTICAL", { name: "pending", pad: 16, fill: GROUND, radius: 8, stroke: RULE, dash: true, width }); f.resize(width, height); f.primaryAxisSizingMode = "FIXED"; f.counterAxisSizingMode = "FIXED"; f.appendChild(text(label, 14, INK3, "Regular", width - 32)); return f }

const feature = await figma.getNodeByIdAsync(PLAN.sectionId)
if (!feature || feature.type !== "SECTION") throw new Error("feature section missing " + PLAN.sectionId)
feature.name = PLAN.name
const old = [...feature.children]
const hero = old.find(c => c.type === "SECTION" && c.name.includes("Hero screens"))
const cards = []

{ const c = card("1 · JTBD"); heading(c, "1 · JTBD — all types", "Headline first, then the happy scenario, then every rainy / unexpected scenario.")
  add(c, text(PLAN.jtbd.headline || "—", 30, INK, "Medium"))
  const two = stack("HORIZONTAL", { name: "scenarios", gap: GAP }); add(c, two)
  for (const [key, label, color] of [["happy", "Happy scenario", { r: .102, g: .478, b: .29 }], ["rainy", "Rainy / unexpected", RED]]) {
    const colm = stack("VERTICAL", { name: label, gap: 10 }); two.appendChild(colm); colm.layoutSizingHorizontal = "FILL"
    add(colm, pill(label, WHITE, color, 13), false)
    const list = PLAN.jtbd[key] || []; if (!list.length) add(colm, text("pending — written at Stop 1", 16, INK3))
    for (const s of list) { const t = text(`${s.title} — ${s.jtbd}`, 17, INK2, "Regular", (W - PAD * 2 - GAP) / 2); t.setRangeFontName(0, s.title.length, { family: "Inter", style: "Semi Bold" }); t.setRangeFills(0, s.title.length, solid(INK)); add(colm, t) }
  }
  cards.push(c) }
{ const c = card("2 · Research"); heading(c, "2 · Research — happy + rainy, ≥ 4 competitors", "Docs and logged-in product per vendor. Red = what to look at. Empty states are rainy scenarios, not results.")
  for (const sc of PLAN.research) {
    const label = sc.scenario === "happy" ? "Happy scenario" : "Rainy / unexpected"; const color = sc.scenario === "happy" ? { r: .102, g: .478, b: .29 } : RED
    const head = stack("HORIZONTAL", { name: "scenario head", gap: 12 }); add(head, pill(label, WHITE, color, 13), false); if (sc.titles.length) add(head, text(sc.titles.join(" · "), 15, INK3, "Regular", W - PAD * 2 - 220)); add(c, head)
    const row = stack("HORIZONTAL", { name: "vendors", gap: GAP }); add(c, row)
    for (const col of sc.columns) {
      const v = stack("VERTICAL", { name: col.vendor, gap: 8, width: COLW }); row.appendChild(v)
      add(v, text(col.vendor, 16, INK, "Semi Bold", COLW))
      if (!col.items.length) { v.appendChild(placeholder("pending — capture owed (act in the environment: enable, run a test call, then capture)", COLW)); continue }
      for (const it of col.items) {
        v.appendChild(tile(it, COLW))
        add(v, text(`${it.kind === "product" ? "PRODUCT" : "DOCS"} · ${it.label}`, 14, INK2, "Regular", COLW))
        if (it.href) add(v, linkText("", it.href, 12, COLW))
        if (it.redo) add(v, text("↻ " + it.redo, 13, RED, "Semi Bold", COLW))
      }
    }
  }
  cards.push(c) }
{ const c = card("3 · Learnings"); heading(c, "3 · Learnings — what the competitor environments taught us", "Each names its evidence. These are the constraints the directions must respect.")
  const list = PLAN.learnings.length ? PLAN.learnings : ["pending — written at Stop 3 after the research rows are filled"]
  for (const l of list) add(c, text("•  " + l, 18, INK2))
  cards.push(c) }
{ const c = card("4 · Before → After"); heading(c, "4 · Before → After", "What exists today (Studio live, a colleague's branch, or the sandbox before our change), what is wrong or must be fixed, then the after with its rationale.")
  const row = stack("HORIZONTAL", { name: "before/after", gap: GAP }); add(c, row); const half = (W - PAD * 2 - GAP) / 2
  const left = stack("VERTICAL", { name: "Before", gap: 10, width: half }); row.appendChild(left); add(left, pill("Before", WHITE, INK2, 13), false)
  if (PLAN.before && PLAN.before.length) { for (const b of PLAN.before) { left.appendChild(tile(b, half)); add(left, text(`${b.source || "existing"} — ${b.alt || ""}`, 14, INK2, "Regular", half)); for (const w of b.wrong || []) add(left, text("✗  " + w, 16, RED, "Regular", half)) } }
  else left.appendChild(placeholder("pending — capture the existing design (Studio live / a colleague's branch / the sandbox before the change) and list what is wrong", half))
  const right = stack("VERTICAL", { name: "After", gap: 10, width: half }); row.appendChild(right); add(right, pill("After", WHITE, { r: .102, g: .478, b: .29 }, 13), false)
  if (PLAN.prototype.shot) { for (const sh of [PLAN.prototype.shot, ...(PLAN.prototype.moreShots || [])]) { right.appendChild(tile(sh, half)); if (sh.alt) add(right, text(sh.alt, 14, INK2, "Regular", half)) } add(right, text(PLAN.prototype.rationale || "", 16, INK2, "Regular", half)) }
  else right.appendChild(placeholder("pending — the after is the chosen direction, built at Stop 6", half))
  cards.push(c) }
{ const c = card("5 · Directions"); heading(c, "5 · Diverge 3–5, audit one", "Directions considered, then the verdict with its reason.")
  if (PLAN.directions.length) { for (const d of PLAN.directions) add(c, text(d, 18, INK)); if (PLAN.verdict) { const t = text(PLAN.verdict, 20, INK, "Semi Bold"); add(c, t) } if (PLAN.directionsPage) add(c, linkText("Directions page", PLAN.directionsPage)) }
  else add(c, text("pending — 3–5 directions are written at Stop 4", 16, INK3))
  cards.push(c) }
{ const c = card("6 · Prototype"); heading(c, "6 · Prototype for the viewer", "The Preview link opens at the start of the user journey — no manual navigation. The after screenshot is in Stop 4.")
  if (!PLAN.prototype.shot) add(c, text(PLAN.prototype.rationale ? "Direction chosen: " + PLAN.prototype.rationale : "Not built yet.", 17, INK2))
  for (const l of PLAN.prototype.open) add(c, linkText(l.label, l.href))
  if (PLAN.prototype.next) { add(c, text("Next / decisions", 14, ACCENT, "Semi Bold")); add(c, text(PLAN.prototype.next, 17, INK)) }
  cards.push(c) }
let heroCard = null
if (hero) hero.name = "7 · Hero screens"
if (!hero) { heroCard = card("7 · Hero screens"); heading(heroCard, "7 · Hero screens — for the designer", "Native, editable frames of the happy scenario, built once the prototype is chosen. Rationale listed under each. Edit freely; this section is never regenerated."); add(heroCard, text("pending — built after Stop 6", 16, INK3)) }
{ const c = card("8 · Tracker"); heading(c, "8 · Tracker", "One sheet links ClickUp ↔ Figma ↔ prototype. ClickUp order, never reshuffled.")
  const row = stack("HORIZONTAL", { name: "status", gap: 12 }); const [fg, bg] = STATUS[PLAN.status] || [INK2, RULE]; add(row, pill(PLAN.status, fg, bg, 14), false); add(row, text(`${PLAN.tags}  ·  ${PLAN.clickupSays}`, 15, INK3, "Regular", W - PAD * 2 - 200)); add(c, row)
  add(c, linkText("Design Delivery Board", PLAN.tracker.board)); add(c, linkText("ClickUp", PLAN.tracker.clickup)); if (PLAN.tracker.figma) add(c, linkText("This section", PLAN.tracker.figma))
  cards.push(c) }

const order = ["1 · JTBD", "2 · Research", "3 · Learnings", "4 · Before → After", "5 · Directions", "6 · Prototype", "7 · Hero screens", "8 · Tracker"]
const made = []; let y = 40
for (const name of order) {
  let sec
  if (name === "7 · Hero screens" && hero) { sec = hero } else {
    const c = name === "7 · Hero screens" ? heroCard : cards.find(k => k.name === name)
    sec = figma.createSection(); sec.name = name; sec.fills = solid(GROUND); feature.appendChild(sec); sec.appendChild(c); c.x = 40; c.y = 40; sec.resizeWithoutConstraints(W + 80, c.height + 80)
  }
  sec.x = 40; sec.y = y; y += sec.height + 40; made.push(sec.id)
}
feature.resizeWithoutConstraints(W + 160, y)
for (const c of old) if (c !== hero) c.remove()
return { sectionId: feature.id, name: feature.name, height: Math.round(feature.height), childSections: made, createdNodeIds: made }

}
const results = []
for (const P of PLANS) { try { results.push(await buildFeature(P)) } catch (e) { results.push({ n: P.n, error: e.message }) } }
return results
