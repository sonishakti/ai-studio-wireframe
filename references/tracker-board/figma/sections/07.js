const PLANS = [{"n":"07","name":"07 · Vendors & provider fallback","sectionId":"3122:40591","status":"Pending review","clickup":"https://app.clickup.com/t/868m0men7","tags":"builder · vendors · P0-Sep","clickupSays":"ClickUp: research Done · UI exists (Voice & Models · Vendor Credentials) · status planning","jtbd":{"headline":"User wants to trust that models keep running across vendors and regions.","happy":[{"title":"Backup takes over, nobody paged","jtbd":"The primary LLM slows; the backup answers and the caller notices nothing."}],"rainy":[{"title":"Backup also failing","jtbd":"Both vendors are degraded; the agent must degrade gracefully and I must be told."},{"title":"Backup credentials invalid","jtbd":"The backup key expired or its quota is exhausted; fallback fails at the worst moment."},{"title":"Region-blocked vendor","jtbd":"A vendor is blocked in the caller's region; routing must avoid it."},{"title":"Fallback changes the persona","jtbd":"The backup voice or model sounds different; callers hear a switch mid-call."}]},"research":[{"scenario":"happy","titles":["Backup takes over, nobody paged"],"columns":[{"vendor":"Vapi","items":[{"vendor":"Vapi","kind":"product","label":"Assistant tab — First Message · Assistant speaks first · Transcriber/Model/Voice cards","href":"https://dashboard.vapi.ai/assistants","hash":"e571d6f70d1ff4d3f430ecb406cbdebc2799d7e5","dims":{"w":3200,"h":2000},"marks":[{"box":[0.342,0.236,0.555,0.352],"tag":"Transcriber vendor"},{"box":[0.564,0.236,0.769,0.352],"tag":"Model vendor"},{"box":[0.777,0.236,0.981,0.352],"tag":"Voice vendor"}],"scenario":"happy","redo":null},{"vendor":"Vapi","kind":"product","label":"Advanced tab — Fallback Voices · Fallback Transcriber · Webhook Server","href":"https://dashboard.vapi.ai/assistants","hash":"24340cac940e972ef468282ed6d61ffbd7d5f242","dims":{"w":3200,"h":2000},"marks":[{"box":[0.343,0.239,0.982,0.311],"tag":"Fallback voices"},{"box":[0.343,0.332,0.982,0.404],"tag":"Fallback transcriber"},{"box":[0.343,0.824,0.982,1],"tag":"Webhook server"}],"scenario":"happy","redo":null},{"vendor":"Vapi","kind":"product","label":"Voice settings panel — Voice model · Speed · Background Sound (Off / Office / Default / Custom)","href":"https://dashboard.vapi.ai/assistants","hash":"78ae20746d9cd26b987241cd0eb34a1b8b01ba69","dims":{"w":3200,"h":2000},"marks":[{"box":[0.749,0.152,0.995,0.21],"tag":"Voice model"},{"box":[0.604,0.24,0.727,0.354],"tag":"Voice provider card"}],"scenario":"happy","redo":null},{"vendor":"Vapi","kind":"docs","label":"Voice fallback plan","href":"https://docs.vapi.ai/voice-fallback-plan","hash":"59faf3f7f866c6a78972f092335c6bef8f897a4d","dims":{"w":1400,"h":962},"marks":[{"box":[0.22,0.505,0.775,0.75],"tag":"Fallback sequence"}],"scenario":"happy","redo":null}]},{"vendor":"Retell","items":[{"vendor":"Retell","kind":"product","label":"Agent editor — Welcome Message · AI speaks first · Realtime Transcription · Security & Fallback","href":"https://dashboard.retellai.com/agents","hash":"df09548e74b9c68980905deac11aa281459a46aa","dims":{"w":3200,"h":2000},"marks":[{"box":[0.045,0.1,0.148,0.142],"tag":"Model vendor"},{"box":[0.15,0.1,0.235,0.142],"tag":"Voice vendor"}],"scenario":"happy","redo":null},{"vendor":"Retell","kind":"product","label":"Agent editor — Kate voice · English (US) · Welcome Message · AI speaks first · Pause Before Speaking","href":"https://dashboard.retellai.com/agents","hash":"50d0623679788383e3bd24fe868b6cfc07bf0e46","dims":{"w":3200,"h":2000},"marks":[{"box":[0.045,0.1,0.148,0.142],"tag":"Model vendor"},{"box":[0.15,0.1,0.235,0.142],"tag":"Voice vendor"}],"scenario":"happy","redo":null},{"vendor":"Retell","kind":"docs","label":"List Voices API — voice_id · provider · gender · accent · age · preview","href":"https://docs.retellai.com/api-references/list-voices","hash":"7d5a2d05a30da15700f6de3b6c2b1cf04b7b7c0d","dims":{"w":3200,"h":2000},"marks":[{"box":[0.675,0.4,0.955,0.684],"tag":"Provider field"}],"scenario":"happy","redo":null}]},{"vendor":"ElevenLabs","items":[{"vendor":"ElevenLabs","kind":"docs","label":"Models — provider cascade if one fails · backup LLM configuration","href":"https://elevenlabs.io/docs/eleven-agents/customization/llm","hash":"71a35bdc81a69a6f18f22297ef93cc6370553f0d","dims":{"w":3200,"h":2000},"marks":[{"box":[0.25,0.458,0.65,0.505],"tag":"Provider cascade"},{"box":[0.869,0.325,0.99,0.352],"tag":"Backup LLM config"}],"scenario":"happy","redo":null}]},{"vendor":"LiveKit","items":[{"vendor":"LiveKit","kind":"product","label":"Voices — Custom vs Default voices · voice-clone upsell","href":"https://cloud.livekit.io","hash":"f6e56ed982d86d02fc675b4ae311483e87702bb6","dims":{"w":3200,"h":2000},"marks":[{"box":[0.171,0.032,0.325,0.09],"tag":"Default voices tab"},{"box":[0.465,0.368,0.695,0.6],"tag":"Multi-provider TTS"}],"scenario":"happy","redo":null},{"vendor":"LiveKit","kind":"product","label":"Default voices table — provider / language / gender filters","href":"https://cloud.livekit.io","hash":"dfe04f1fa3079c1c340dbb6fc3730226a89fe88c","dims":{"w":3200,"h":2000},"marks":[{"box":[0.767,0.32,0.983,0.62],"tag":"Provider column"},{"box":[0.705,0.24,0.8,0.276],"tag":"Provider filter"}],"scenario":"happy","redo":null},{"vendor":"LiveKit","kind":"docs","label":"STT models — provider/model table (Deepgram Flux) · custom STT","href":"https://docs.livekit.io/agents/models/stt/","hash":"13b1d3930c44c48557cedf3c9ff6821e2d3ceddc","dims":{"w":3200,"h":2000},"marks":[{"box":[0.305,0.8,0.75,1],"tag":"STT vendor"},{"box":[0.747,0.284,0.85,0.308],"tag":"Plugins (other STT vendors)"}],"scenario":"happy","redo":null},{"vendor":"LiveKit","kind":"docs","label":"TTS models — custom voices · expressive mode · Cartesia Sonic 3","href":"https://docs.livekit.io/agents/models/tts/","hash":"7371fa855d4e28c5e71d9ca9e3c763c0f49622a2","dims":{"w":3200,"h":2000},"marks":[{"box":[0.305,0.799,0.75,1],"tag":"Model vendor"},{"box":[0.747,0.376,0.85,0.404],"tag":"Plugins (other vendors)"}],"scenario":"happy","redo":null}]}]},{"scenario":"rainy","titles":["Backup also failing","Backup credentials invalid","Region-blocked vendor","Fallback changes the persona"],"columns":[{"vendor":"Vapi","items":[]},{"vendor":"Retell","items":[]},{"vendor":"ElevenLabs","items":[]},{"vendor":"LiveKit","items":[]}]}],"learnings":["Vapi shows provider per component (transcriber · model · voice) as cards with an ordered fallback list (assistant fallback).","Retell and ElevenLabs expose the vendor as a field per component; ElevenLabs adds a backup-LLM cascade (agent settings, docs).","LiveKit's plugins table is the vendor catalogue; fallback is code (docs)."],"directions":["A · One row, zero-config","B · Backup column in manual config","C · Policy + prove it"],"verdict":null,"directionsPage":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/07-vendors-fallback/05-directions.html","prototype":{"open":[{"label":"ClickUp","href":"https://app.clickup.com/t/868m0men7"},{"label":"Preview (Studio X)","href":"https://ai-studio-console-redesign.vercel.app/agents/agt_default/edit?focus=backup-providers"},{"label":"Brief","href":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/07-vendors-fallback/00-brief.md"},{"label":"Directions","href":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/07-vendors-fallback/05-directions.html"},{"label":"Log","href":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/07-vendors-fallback/05-prototype-log.html"}],"shot":{"alt":"Voice & Models › Backup providers row under the model stack — marked in red","hash":"f05be5b7e9e834af3357894c0d066ff9d04995d0","dims":{"w":3200,"h":2400}},"moreShots":[],"rationale":"One Backup providers row under the model stack, on by default: primary → backup per component in a mono recap, a status chip (3 of 3 covered / TTS has no backup), Change backups folds to the ordered pool with eligibility (language, pinned region), BYO components ask for a second key, and Test failover names the Engine dependency (Nov) instead of pretending.","next":"Owner: agent property or deployment property? Confirm the backup pool vendors and the Nov Engine date on the button."},"before":[{"alt":"Model stack slider and manual config — no fallback concept","source":"Studio X 2 live (main @ 0c27a1a, 2026-09-11) — Voice & Models › model stack","wrong":["A vendor outage becomes the builder's outage: there is no backup, no eligibility rule, no way to see what covers a component.","BYO components carry no hint that a backup needs a second key; a pinned hosting region silently costs failover."],"hash":"a9e727946afbe0977ede148a5cad59d859268aa3","dims":{"w":3200,"h":2400}}],"hero":[],"tracker":{"board":"https://claude.ai/code/artifact/a1d57eb9-2121-484c-b2f6-2d728cbd1466","clickup":"https://app.clickup.com/t/868m0men7","figma":"https://www.figma.com/design/xaAgeioGlZosBsRquDXLvI/Agora-Studio-X?node-id=3122-40591"}}]
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
