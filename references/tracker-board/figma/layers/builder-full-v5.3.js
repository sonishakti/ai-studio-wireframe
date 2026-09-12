const JOB = {"frameId":"3173:40629","layers":[{"t":"rect","x":994,"y":6205,"w":422,"h":67,"stroke":{"r":0.91,"g":0.9,"b":0.9}},{"t":"text","x":994,"y":6215,"w":122,"h":17,"s":"Avg. e2e latency","fs":12,"c":{"r":0.42,"g":0.42,"b":0.42},"tt":"uppercase"},{"t":"text","x":1372,"y":6215,"w":44,"h":17,"s":"750 ms","fs":12,"c":{"r":0.04,"g":0.04,"b":0.04}},{"t":"text","x":994,"y":6235,"w":99,"h":17,"s":"Avg. LLM TTFT","fs":12,"c":{"r":0.42,"g":0.42,"b":0.42},"tt":"uppercase"},{"t":"text","x":1379,"y":6235,"w":37,"h":17,"s":"56 ms","fs":12,"c":{"r":0.04,"g":0.04,"b":0.04}},{"t":"text","x":994,"y":6255,"w":69,"h":17,"s":"Avg. cost","fs":12,"c":{"r":0.42,"g":0.42,"b":0.42},"tt":"uppercase"},{"t":"text","x":1335,"y":6255,"w":81,"h":17,"s":"$0.10 / min","fs":12,"c":{"r":0.04,"g":0.04,"b":0.04}},{"t":"text","x":994,"y":6280,"w":119,"h":15,"s":"Wireframe estimates.","fs":12,"c":{"r":0.41,"g":0.41,"b":0.41,"a":0.7}}]}
const page = figma.root.children.find(p => p.id === "2861:52038")
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
return { made, total: frame.children.length, mutatedNodeIds: [frame.id] }
