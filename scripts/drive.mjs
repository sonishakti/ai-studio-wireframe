#!/usr/bin/env node
/**
 * drive — act inside a competitor's product (or ours) from the shell, on the
 * persistent signed-in Chrome profile, one command at a time. Built so an agent
 * can reach the states research needs (enable a setting, run a test call,
 * open a right-rail panel) instead of screenshotting empty pages.
 *
 *   node scripts/drive.mjs serve [--headed] [--port 9333] [--profile <dir>] [--size 1600x1000]
 *   node scripts/drive.mjs goto <url> [waitMs]
 *   node scripts/drive.mjs url                      → current URL + title
 *   node scripts/drive.mjs find "<text>"            → visible elements containing text (tag · text · rect)
 *   node scripts/drive.mjs click "<css>" | "text=<visible text>" [--index n]   real mouse click at the centre
 *   node scripts/drive.mjs type "<text>"            → inserts text into the focused field
 *   node scripts/drive.mjs key <Enter|Tab|Escape|ArrowDown|ArrowUp|Backspace>
 *   node scripts/drive.mjs eval "<js expression>"   → JSON result (await allowed)
 *   node scripts/drive.mjs shot <out.png> [--full]  → PNG at 2× of the current page
 *   node scripts/drive.mjs wait <ms>
 *   node scripts/drive.mjs stop
 *
 * Rules: one Chrome per profile — close the headed window before `serve`
 * unless you pass --headed and want to watch. Never enter credentials or pay
 * for anything from here; if a page asks to sign in, stop and tell the user.
 * Default profile: $CHROME_PROFILE or ~/.agora-design/chrome-competitors.
 */
import { spawn } from "node:child_process"
import { createServer, request as httpRequest } from "node:http"
import { writeFileSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { homedir } from "node:os"
import { setTimeout as sleep } from "node:timers/promises"

const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d }
const has = (n) => argv.includes(n)
const positional = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && !["--headed", "--full"].includes(argv[i - 1])))
const cmd = positional[0]
const PORT = +flag("--port", process.env.DRIVE_PORT || 9333)
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if (!cmd || cmd === "--help") { console.log(String(await import("node:fs").then(fs => fs.readFileSync(new URL(import.meta.url), "utf8"))).split("*/")[0]); process.exit(0) }

if (cmd === "serve") {
  const profile = flag("--profile", process.env.CHROME_PROFILE || `${homedir()}/.agora-design/chrome-competitors`)
  const [W, H] = flag("--size", "1600x1000").split("x").map(Number)
  const CDP = 9222 + (PORT % 1000)
  const args = [has("--headed") ? "--new-window" : "--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`, `--window-size=${W},${H}`, "--no-first-run", "--force-device-scale-factor=2", "about:blank"]
  const chrome = spawn(CHROME, args, { stdio: "ignore" })
  let wsUrl = null
  for (let i = 0; i < 60 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${CDP}/json/version`)).json(); wsUrl = j.webSocketDebuggerUrl } catch { await sleep(250) } }
  if (!wsUrl) { console.error("Chrome did not start (is another Chrome using this profile?)"); process.exit(1) }
  const ws = new WebSocket(wsUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0; const pending = new Map()
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
  const send = (method, params = {}, sessionId) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
  const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" })
  const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true })
  await send("Page.enable", {}, sessionId); await send("Runtime.enable", {}, sessionId)
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: false }, sessionId)
  const evalJs = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || "eval failed"); return r.result?.result?.value }
  const FIND = (q, index) => `(() => { const q = ${JSON.stringify(q)}; const idx = ${index}; const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" }
    let els; if (q.startsWith("text=")) { const t = q.slice(5).toLowerCase(); els = [...document.querySelectorAll("button,a,[role=button],[role=tab],[role=menuitem],[role=option],label,summary,li,td,th,h1,h2,h3,span,div,p,input,textarea,select")].filter(e => vis(e) && e.textContent.trim().toLowerCase().includes(t) && e.textContent.trim().length < 200); els.sort((a, b) => a.textContent.trim().length - b.textContent.trim().length) } else els = [...document.querySelectorAll(q)].filter(vis)
    return els.slice(0, 20).map((e, i) => { const r = e.getBoundingClientRect(); return { i, tag: e.tagName.toLowerCase(), role: e.getAttribute("role"), text: e.textContent.trim().slice(0, 80), x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) } }) })()`
  const handlers = {
    async goto({ url, wait = 3500 }) { await send("Page.navigate", { url }, sessionId); await sleep(+wait); return await evalJs("({url: location.href, title: document.title})") },
    async url() { return await evalJs("({url: location.href, title: document.title})") },
    async find({ q }) { return await evalJs(FIND(q, 0)) },
    async click({ q, index = 0 }) {
      const list = await evalJs(FIND(q, index)); const el = list[+index]
      if (!el) return { error: `no visible match for ${q}`, candidates: list.slice(0, 5) }
      await evalJs(`(() => { const q = ${JSON.stringify(q)}; const idx = ${+index}; ${FIND(q, index).replace(/^\(\(\) => \{/, "").replace(/\}\)\(\)$/, "")} })()`).catch(() => {})
      // scroll target into view, then dispatch real mouse events at its centre
      const c = await evalJs(`(() => { const list = ${FIND(q, index)}; return list[${+index}] })()`)
      await evalJs(`(() => { const t = ${JSON.stringify(q)}; const all = ${FIND(q, index)}; return true })()`)
      const { x, y } = c
      for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }, sessionId)
      await sleep(600)
      return { clicked: c, url: await evalJs("location.href") }
    },
    async type({ text }) { await send("Input.insertText", { text }, sessionId); return { typed: text.length } },
    async key({ key }) { const codes = { Enter: 13, Tab: 9, Escape: 27, ArrowDown: 40, ArrowUp: 38, Backspace: 8, ArrowLeft: 37, ArrowRight: 39 }; const vk = codes[key]; for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key, code: key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }, sessionId); await sleep(300); return { key } },
    async eval({ js }) { return await evalJs(js) },
    async shot({ out, full = false }) { const cap = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: !!full }, sessionId); if (!cap.result?.data) return { error: "capture failed" }; mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, Buffer.from(cap.result.data, "base64")); return { saved: out, bytes: cap.result.data.length * 3 / 4 | 0 } },
    async wait({ ms }) { await sleep(+ms); return { waited: +ms } },
    async stop() { setTimeout(() => { try { chrome.kill() } catch {} process.exit(0) }, 100); return { stopping: true } },
  }
  createServer((req, res) => { let b = ""; req.on("data", d => b += d); req.on("end", async () => { try { const { cmd, args } = JSON.parse(b || "{}"); const h = handlers[cmd]; if (!h) throw new Error("unknown cmd " + cmd); const out = await h(args || {}); res.end(JSON.stringify(out ?? null)) } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) } }) }).listen(PORT, "127.0.0.1", () => console.log(`drive: serving on http://127.0.0.1:${PORT}  profile=${profile}  ${has("--headed") ? "headed" : "headless"}`))
  process.on("SIGINT", () => { chrome.kill(); process.exit(0) })
} else {
  const args = { goto: { url: positional[1], wait: positional[2] }, url: {}, find: { q: positional[1] }, click: { q: positional[1], index: flag("--index", 0) }, type: { text: positional[1] }, key: { key: positional[1] }, eval: { js: positional[1] }, shot: { out: positional[1], full: has("--full") }, wait: { ms: positional[1] }, stop: {} }[cmd]
  if (!args) { console.error("unknown command " + cmd); process.exit(2) }
  const body = JSON.stringify({ cmd, args })
  const req = httpRequest({ host: "127.0.0.1", port: PORT, method: "POST", path: "/", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (res) => { let d = ""; res.on("data", c => d += c); res.on("end", () => { console.log(d); process.exit(res.statusCode === 200 ? 0 : 1) }) })
  req.on("error", () => { console.error("drive server not running — start it with: node scripts/drive.mjs serve"); process.exit(1) })
  req.end(body)
}
