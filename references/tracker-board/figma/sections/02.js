const PLANS = [{"n":"02","name":"02 · Turn-taking & listening","sectionId":"3122:40586","status":"Pending review","clickup":"https://app.clickup.com/t/868m0mef4","tags":"builder · engine · P0-Sep","clickupSays":"ClickUp: research Pending · UI partial (turn-detection controls) · status added","jtbd":{"headline":"User wants the agent to interrupt, wait and listen like a person.","happy":[{"title":"Caller interrupts, agent listens","jtbd":"A caller talks over the agent mid-sentence; it stops, waits and answers what was said."}],"rainy":[{"title":"Noisy line, false stops","jtbd":"Background noise keeps cutting the agent off; I need to make it less trigger-happy without a ms table."},{"title":"Pause mid-thought","jtbd":"The caller pauses to think and the agent jumps in; I want it to wait a beat longer."},{"title":"Caller-first and silence","jtbd":"Caller speaks first is on but nobody says anything; the call must not hang dead."},{"title":"Kiosk keyword misfires","jtbd":"A wake/interrupt keyword fires on unrelated speech in a kiosk deployment."}]},"research":[{"scenario":"happy","titles":["Caller interrupts, agent listens"],"columns":[{"vendor":"Vapi","items":[{"vendor":"Vapi","kind":"docs","label":"Speech configuration (start/stop speaking plans)","href":"https://docs.vapi.ai/customization/speech-configuration","hash":"9aa4c1775166c9adc1aa5c2e01dee213e0f380a9","dims":{"w":1400,"h":962},"marks":[{"box":[0.225,0.525,0.771,0.624],"tag":"Speaking plan components"},{"box":[0.225,0.78,0.771,0.972],"tag":"Start Speaking Plan"}],"scenario":"happy","redo":null}]},{"vendor":"Retell","items":[{"vendor":"Retell","kind":"docs","label":"Create agent — responsiveness, interruption sensitivity, backchannel","href":"https://docs.retellai.com/api-references/create-agent","hash":"170f001ae77b973a276782fb3c1c4198a2c76ea7","dims":{"w":1400,"h":962},"marks":[{"box":[0.241,0.509,0.645,0.65],"tag":"Agent body params"},{"box":[0.684,0.811,0.954,0.967],"tag":"Voice pacing fields"}],"scenario":"happy","redo":null}]},{"vendor":"ElevenLabs","items":[{"vendor":"ElevenLabs","kind":"product","label":"Agent tab — First message · Interruptible · Turn V3","href":"https://elevenlabs.io/app/agents","hash":"bddd417e92ec409bcde487080c95d0be0a125da7","dims":{"w":3200,"h":2000},"marks":[{"box":[0.184,0.695,0.696,0.86],"tag":"First message"},{"box":[0.594,0.86,0.697,0.892],"tag":"Interruptible toggle"},{"box":[0.184,0.93,0.696,1],"tag":"Turn V3 model"}],"scenario":"happy","redo":null},{"vendor":"ElevenLabs","kind":"docs","label":"Conversation flow — turn timeout, eagerness","href":"https://elevenlabs.io/docs/agents-platform/customization/conversation-flow","hash":"334709bb6175e4e3f6d1d7216ab36167d5fc502e","dims":{"w":1400,"h":962},"marks":[{"box":[0.505,0.403,0.752,0.548],"tag":"Turn timeout"},{"box":[0.248,0.741,0.497,0.896],"tag":"Turn eagerness"}],"scenario":"happy","redo":null}]},{"vendor":"LiveKit","items":[{"vendor":"LiveKit","kind":"product","label":"Agents dashboard — Avg Turns · Interrupted · E2E Median per agent","href":"https://cloud.livekit.io","hash":"9b2cc84104a94f09fab1a2b4d405af9a70a8d7cb","dims":{"w":3200,"h":2000},"marks":[{"box":[0.515,0.126,0.685,0.19],"tag":"Turn & interruption metrics"}],"scenario":"happy","redo":null},{"vendor":"LiveKit","kind":"docs","label":"Turn detector model","href":"https://docs.livekit.io/agents/build/turns/turn-detector/","hash":"cd47522ec5240a89caccab1699c4ea405a10baef","dims":{"w":1400,"h":962},"marks":[{"box":[0.306,0.556,0.704,0.686],"tag":"Audio turn detector"},{"box":[0.306,0.774,0.704,0.993],"tag":"Turn detector comparison"}],"scenario":"happy","redo":null},{"vendor":"LiveKit","kind":"docs","label":"Speech & audio — session.say · generate_reply · interruptions · background audio","href":"https://docs.livekit.io/agents/build/audio/","hash":"7ad99cf08f6f1f3e306f0c67db4013cabbb84e67","dims":{"w":3200,"h":2000},"marks":[{"box":[0.747,0.454,0.897,0.542],"tag":"Interruption controls"},{"box":[0.021,0.878,0.16,0.918],"tag":"Turn detection nav"}],"scenario":"happy","redo":null}]}]},{"scenario":"rainy","titles":["Noisy line, false stops","Pause mid-thought","Caller-first and silence","Kiosk keyword misfires"],"columns":[{"vendor":"Vapi","items":[]},{"vendor":"Retell","items":[]},{"vendor":"ElevenLabs","items":[]},{"vendor":"LiveKit","items":[]}]}],"learnings":["Every vendor hides the ms behind words: Vapi 'Start speaking plan', ElevenLabs 'Turn timeout' + 'Eagerness', LiveKit a named turn detector (docs).","Retell keeps interruption controls on the agent, next to the welcome message — the two are one decision (agent editor).","Nobody offers a live 'try interrupting' test; the whitespace is proving the setting on the Test rail."],"directions":["A · Turn-taking row, user words + recap","B · One slider, Responsive ↔ Patient","C · \"Listening\" group, honest homes for Engine work","D · \"Who speaks first\", tied to the greeting","E · \"Try interrupting\" on the live test"],"verdict":"Verdict — converge A + C + E","directionsPage":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/02-turn-taking/05-directions.html","prototype":{"open":[{"label":"ClickUp","href":"https://app.clickup.com/t/868m0mef4"},{"label":"Preview (Studio X)","href":"https://ai-studio-console-redesign.vercel.app/agents/agt_default/edit?focus=turn-taking"},{"label":"Brief","href":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/02-turn-taking/00-brief.md"},{"label":"Directions","href":"https://github.com/AgoraIO-Community/ai-studio-console-redesign/blob/main/references/research/02-turn-taking/05-directions.html"},{"label":"Hero (Figma)","href":"https://www.figma.com/design/xaAgeioGlZosBsRquDXLvI/Agora-Studio-X?node-id=3173-40595"}],"shot":{"alt":"Agent Speech Settings opening on the Turn-taking row and the Listening group — marked in red","hash":"513cb86b5a6691ca0cf1bcc87c33d8822980d934","dims":{"w":3200,"h":2400}},"moreShots":[],"rationale":"Agent Speech Settings opens on a Turn-taking row — Responsive · Balanced · Patient · Custom with a recap that resolves the preset to visible milliseconds; a Listening group renames SAL to 'Lock onto one speaker' and gives Backchannels and Preemptive replies honest Requires-Engine rows; 'Try interrupting' on the live test prints the verdict.","next":"Review on the preview. Decide: replace the raw preset cards or keep them under Custom? Which month to print on the inert rows."},"before":[{"alt":"Quick Presets cards with no recap; SAL named after the algorithm","source":"Studio X 2 live (main @ 0c27a1a, 2026-09-11) — Voice & Models › Advanced Speech Settings","wrong":["Responsive / Balanced / Patient never say what they do in milliseconds — 'presets resolve to visible values' is the ticket's bar and it is not met.","'Selective attention locking' is named after the algorithm, not what the agent does (lock onto one speaker).","Backchannels and preemptive replies have no home at all, so reviewers cannot tell Engine work from Studio work; 'try interrupting' cannot be felt on the test call."],"hash":"f2a694cad834d329faba79eeac74e68e4aa33384","dims":{"w":3200,"h":2400}}],"hero":[{"node":"3140:40982","frame":"3173:40595","name":"Hero · 02 Agent Speech Settings — Turn-taking · Listening","url":"https://www.figma.com/design/xaAgeioGlZosBsRquDXLvI/Agora-Studio-X?node-id=3140-40982","editable":"Agent Speech Settings sheet — editable (3173:40595), 267 native layers"}],"tracker":{"board":"https://claude.ai/code/artifact/a1d57eb9-2121-484c-b2f6-2d728cbd1466","clickup":"https://app.clickup.com/t/868m0mef4","figma":"https://www.figma.com/design/xaAgeioGlZosBsRquDXLvI/Agora-Studio-X?node-id=3122-40586"}}]
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
