#!/usr/bin/env node
/**
 * dom-layers — extract a page's visible boxes and text as flat "layers" so a
 * use_figma runner can rebuild the screen as NATIVE, editable Figma nodes
 * (rectangles + text) next to a locked screenshot. This is the "one expanded
 * full design to tweak in Figma" deliverable (user, 2026-09-11) without hand
 * drawing every control.
 *
 *   node scripts/dom-layers.mjs <url> <outBase> [--width 1440] [--wait 5000] [--pre "<js>"]
 *
 * Writes <outBase>.json  { width, height, layers: [ {t:"rect",x,y,w,h,fill,stroke,sw,r}
 *                                                    {t:"text",x,y,w,h,s,fs,fw,c,lh,ta} ] }
 * and    <outBase>.png   a 1× full-page screenshot at the same width (the
 *                        reference frame the editable rebuild sits beside).
 *
 * Headless Chrome over CDP with Node's built-in WebSocket (same idiom as
 * annotate-shots.mjs). No profile, no login.
 */
import { spawn } from "node:child_process"
import { writeFileSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { setTimeout as sleep } from "node:timers/promises"

const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d }
const positional = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--width", "--wait", "--pre", "--viewport"].includes(argv[i - 1])))
const [url, outBase] = positional
if (!url || !outBase) { console.error("usage: node scripts/dom-layers.mjs <url> <outBase> [--width 1440] [--wait 5000] [--pre <js>]"); process.exit(2) }
const WIDTH = +flag("--width", 1440)
const WAIT = +flag("--wait", 5000)
const PRE = flag("--pre", "")
// --viewport H: capture ONLY an H-px-tall viewport (dialogs and sheets are
// fixed-position — on a full-height viewport they float mid-page).
const VIEWPORT = flag("--viewport") ? +flag("--viewport") : 0
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const CDP = 9251 + Math.floor(Math.random() * 40)

const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${CDP}`, `--window-size=${WIDTH},1000`, "--no-first-run", "--user-data-dir=/tmp/dom-layers-profile-" + CDP, "about:blank"], { stdio: "ignore" })
let wsUrl = null
for (let i = 0; i < 60 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${CDP}/json/version`)).json(); wsUrl = j.webSocketDebuggerUrl } catch { await sleep(250) } }
if (!wsUrl) { console.error("Chrome did not start"); process.exit(1) }
const ws = new WebSocket(wsUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 0; const pending = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
const send = (method, params = {}, sessionId) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" })
const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true })
await send("Page.enable", {}, sessionId); await send("Runtime.enable", {}, sessionId)
await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId)
const evalIn = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || "eval failed"); return r.result?.result?.value }

// Light scheme unless --dark: the Figma boards and the before shots are light.
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: argv.includes("--dark") ? "dark" : "light" }] }, sessionId)
await send("Page.navigate", { url }, sessionId)
await sleep(WAIT)
if (PRE) { await evalIn(PRE); await sleep(1200) }

// Expand the page to its full height so sticky/overflow do not clip, then extract.
const height = VIEWPORT || await evalIn("Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))")
await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height, deviceScaleFactor: 1, mobile: false }, sessionId)
await sleep(800)

const EXTRACT = `(() => {
  const out = []
  // Any CSS color (rgb, oklch, color(srgb …)) → rgba via a 1×1 canvas; cached.
  const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true }); const cache = new Map()
  const toRGBA = (s) => { if (!s || s === "transparent" || s === "none") return null; if (cache.has(s)) return cache.get(s)
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; const a = d[3] / 255
    const v = a === 0 ? null : { r: d[0] / 255, g: d[1] / 255, b: d[2] / 255, a: Math.round(a * 100) / 100 }; cache.set(s, v); return v }
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 }
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "TEMPLATE", "HEAD", "META", "LINK"])
  const walk = (el, depth) => {
    if (SKIP.has(el.tagName)) return
    if (el.tagName === "svg" || el.tagName === "SVG") { const r = el.getBoundingClientRect(); if (r.width > 0) out.push({ t: "icon", x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, c: toRGBA(getComputedStyle(el).color) }); return }
    if (!vis(el)) return
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect()
    const fill = toRGBA(cs.backgroundColor)
    const bw = parseFloat(cs.borderTopWidth) || 0
    const stroke = bw > 0 ? toRGBA(cs.borderTopColor) : null
    const radius = parseFloat(cs.borderTopLeftRadius) || 0
    const isSwitch = el.getAttribute("role") === "switch" || el.getAttribute("role") === "checkbox"
    if (fill || stroke || isSwitch) out.push({ t: "rect", x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, fill, stroke, sw: bw, r: Math.min(radius, Math.min(r.width, r.height) / 2), n: (el.tagName.toLowerCase() + (el.id ? "#" + el.id : "")).slice(0, 40) })
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const v = el.value || el.placeholder || ""; if (v) { const pl = parseFloat(cs.paddingLeft) || 0; const pt = parseFloat(cs.paddingTop) || 0; out.push({ t: "text", x: r.left + scrollX + pl, y: r.top + scrollY + pt, w: r.width - pl * 2, h: r.height - pt * 2, s: v.slice(0, 600), fs: parseFloat(cs.fontSize), fw: +cs.fontWeight || 400, c: toRGBA(el.value ? cs.color : "rgba(120,120,120,1)"), lh: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3, ta: cs.textAlign, ff: cs.fontFamily.split(",")[0].replace(/"/g, "") }) }
    }
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const s = n.textContent.replace(/\\s+/g, " ").trim(); if (!s) continue
        const rg = document.createRange(); rg.selectNodeContents(n); const rr = rg.getBoundingClientRect(); if (rr.width < 0.5 || rr.height < 0.5) continue
        out.push({ t: "text", x: rr.left + scrollX, y: rr.top + scrollY, w: Math.max(rr.width, 4), h: rr.height, s, fs: parseFloat(cs.fontSize), fw: +cs.fontWeight || 400, c: toRGBA(cs.color), lh: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3, ta: cs.textAlign, ff: cs.fontFamily.split(",")[0].replace(/"/g, ""), tt: cs.textTransform, ls: parseFloat(cs.letterSpacing) || 0 })
      } else if (n.nodeType === 1) walk(n, depth + 1)
    }
  }
  walk(document.body, 0)
  return { width: document.documentElement.clientWidth, height: document.documentElement.scrollHeight, bg: toRGBA(getComputedStyle(document.body).backgroundColor), layers: out }
})()`
const data = await evalIn(EXTRACT)
if (VIEWPORT) { data.height = VIEWPORT; data.layers = data.layers.filter((L) => L.y < VIEWPORT && L.y + L.h > 0).map((L) => ({ ...L, h: Math.min(L.h, VIEWPORT - L.y) })) }
mkdirSync(dirname(outBase), { recursive: true })
writeFileSync(outBase + ".json", JSON.stringify(data))
const cap = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: !VIEWPORT }, sessionId)
writeFileSync(outBase + ".png", Buffer.from(cap.result.data, "base64"))
console.log(`${outBase}.json  ${data.layers.length} layers  ${data.width}×${data.height}   +  ${outBase}.png`)
chrome.kill(); process.exit(0)
