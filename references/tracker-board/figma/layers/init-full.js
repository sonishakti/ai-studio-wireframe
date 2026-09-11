const JOB = {"step":"init","width":1440,"height":5695,"bg":{"r":0.9921568627450981,"g":0.9882352941176471,"b":0.9882352941176471,"a":1},"sectionName":"00 · Agent builder — expanded, editable (2026-09-11)","parentSectionId":null,"imageHash":"e8fb3b01932ec3c3edf416f173dfdcd8558b2dee","frameName":"Agent builder — expanded (editable)","placeAt":{"x":-5576,"y":24400},"rationale":["The whole agent builder, every section expanded, as the live build serves it on 2026-09-11 (main f3664d0) — the one design to tweak and play with.","Left: the locked screenshot for reference. Right: every label, value, recap line and box is a native layer — move, restyle, retype; nothing here is an image.","What changed today: the Future-scope switch is gone, every top icon is a bordered button with a word, section bodies are indented 44 px, and Backup providers (07) + Opening (04) are new rows; the voice picker (01) and speech settings (02) open from their buttons.","Icons are dashed placeholders (lucide glyphs are not exported as vectors); swap them for the icon library when the NG token pass lands.","The NG look (Phase 1 tokens) is still ahead — this is the Studio X look with the AA-safe muted text token."]}
const page = figma.root.children.find(p => p.id === "2861:52038")
await figma.setCurrentPageAsync(page)
const FONTS = { 400: "Regular", 500: "Medium", 600: "Semi Bold", 700: "Bold" }
for (const s of Object.values(FONTS)) await figma.loadFontAsync({ family: "Inter", style: s })
const solid = (c, opacity) => c ? [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: opacity ?? c.a ?? 1 }] : []
const weightStyle = (fw) => FONTS[fw >= 700 ? 700 : fw >= 600 ? 600 : fw >= 500 ? 500 : 400]

if (JOB.step === "init") {
  const parent = JOB.parentSectionId ? await figma.getNodeByIdAsync(JOB.parentSectionId) : null
  let section = (parent && parent.type === "SECTION" ? parent.children : page.children).find(n => n.type === "SECTION" && n.name === JOB.sectionName)
  if (section) { for (const c of [...section.children]) c.remove() }
  else { section = figma.createSection(); section.name = JOB.sectionName; (parent && parent.type === "SECTION" ? parent : page).appendChild(section) }
  const GAP = 80, PAD = 40
  const W = JOB.width, H = JOB.height
  const ref = figma.createFrame(); ref.name = "Reference — screenshot (locked)"; ref.resize(W, H); ref.x = PAD; ref.y = PAD + 60
  ref.fills = JOB.imageHash ? [{ type: "IMAGE", scaleMode: "FILL", imageHash: JOB.imageHash }] : solid(JOB.bg)
  ref.locked = true; section.appendChild(ref)
  const edit = figma.createFrame(); edit.name = JOB.frameName || "Editable rebuild — text layers"; edit.resize(W, H); edit.x = PAD + W + GAP; edit.y = PAD + 60
  edit.fills = solid(JOB.bg || { r: 1, g: 1, b: 1 }); edit.clipsContent = true
  edit.strokes = [{ type: "SOLID", color: { r: .898, g: .09, b: .247 } }]; edit.strokeWeight = 2; edit.dashPattern = [10, 8]
  section.appendChild(edit)
  const cap = (name, x, chars, size) => { const t = figma.createText(); t.fontName = { family: "Inter", style: "Semi Bold" }; t.fontSize = size; t.characters = chars; t.fills = solid({ r: .063, g: .118, b: .149 }); t.x = x; t.y = PAD + 16; t.name = name; section.appendChild(t); return t }
  cap("caption · reference", PAD, "Reference — the live build, locked", 20)
  cap("caption · editable", PAD + W + GAP, "Editable — every label, value and box is a native layer. Tweak here.", 20)
  let extra = 0
  if (JOB.rationale && JOB.rationale.length) {
    const card = figma.createAutoLayout("VERTICAL"); card.name = "Rationale"; card.itemSpacing = 8; card.paddingTop = card.paddingBottom = 24; card.paddingLeft = card.paddingRight = 32
    card.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; card.cornerRadius = 12; card.resize(W, 10); card.counterAxisSizingMode = "FIXED"; card.primaryAxisSizingMode = "AUTO"
    section.appendChild(card); card.x = PAD + W + GAP; card.y = PAD + 60 + H + 24
    const h = figma.createText(); h.fontName = { family: "Inter", style: "Semi Bold" }; h.fontSize = 13; h.characters = "WHY THIS HERO — RATIONALE"; h.fills = solid({ r: 0, g: .396, b: .553 }); h.letterSpacing = { value: 1.2, unit: "PIXELS" }; card.appendChild(h)
    for (const line of JOB.rationale) { const t = figma.createText(); t.fontName = { family: "Inter", style: "Regular" }; t.fontSize = 15; t.characters = "• " + line; t.fills = solid({ r: .298, g: .373, b: .412 }); t.lineHeight = { value: 21, unit: "PIXELS" }; t.textAutoResize = "HEIGHT"; t.resize(W - 64, 10); card.appendChild(t); t.layoutSizingHorizontal = "FILL" }
    extra = card.height + 24
  }
  section.resizeWithoutConstraints(PAD * 2 + W * 2 + GAP, PAD * 2 + 60 + H + extra)
  if (JOB.placeAt) { section.x = JOB.placeAt.x; section.y = JOB.placeAt.y }
  return { sectionId: section.id, refId: ref.id, frameId: edit.id }
}

if (JOB.step === "layers") {
  const frame = await figma.getNodeByIdAsync(JOB.frameId)
  if (!frame) throw new Error("frame missing " + JOB.frameId)
  let made = 0
  for (const L of JOB.layers) {
    if (L.t === "rect") {
      if (!L.fill && !L.stroke) continue
      const r = figma.createRectangle(); r.resize(Math.max(1, L.w), Math.max(1, L.h)); r.x = L.x; r.y = L.y
      r.fills = solid(L.fill); if (L.stroke) { r.strokes = solid(L.stroke); r.strokeWeight = Math.max(1, L.sw || 1); r.strokeAlign = "INSIDE" }
      r.cornerRadius = L.r || 0; r.name = L.n || "box"; frame.appendChild(r); made++
    } else if (L.t === "icon") {
      const r = figma.createRectangle(); r.resize(Math.max(1, L.w), Math.max(1, L.h)); r.x = L.x; r.y = L.y
      r.fills = []; r.strokes = solid(L.c || { r: .5, g: .5, b: .5, a: 1 }); r.strokeWeight = 1.25; r.cornerRadius = 3; r.dashPattern = [2, 2]; r.name = "icon"; frame.appendChild(r); made++
    } else if (L.t === "text") {
      const t = figma.createText(); t.fontName = { family: "Inter", style: weightStyle(L.fw) }; t.fontSize = Math.max(6, L.fs || 13)
      t.characters = L.tt === "uppercase" ? L.s.toUpperCase() : L.s
      t.fills = solid(L.c || { r: 0, g: 0, b: 0, a: 1 }); t.lineHeight = { value: L.lh || Math.round((L.fs || 13) * 1.35), unit: "PIXELS" }
      if (L.ls) t.letterSpacing = { value: L.ls, unit: "PIXELS" }
      t.textAlignHorizontal = L.ta === "center" ? "CENTER" : L.ta === "right" ? "RIGHT" : "LEFT"
      t.textAutoResize = "HEIGHT"; t.resize(Math.max(8, L.w + 2), Math.max(8, L.h)); t.x = L.x; t.y = L.y; t.name = L.s.slice(0, 40)
      frame.appendChild(t); made++
    }
  }
  return { made, total: frame.children.length }
}
throw new Error("unknown step " + JOB.step)

