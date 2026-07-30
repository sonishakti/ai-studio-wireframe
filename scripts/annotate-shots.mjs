#!/usr/bin/env node
/**
 * annotate-shots — desktop screenshots of the live build with red design
 * markers baked in (name + rationale per marker).
 *
 * WHY THIS EXISTS
 * Two things make the obvious approaches fail:
 *   1. The in-app browser pane caps at ~616 CSS px, so it renders the console
 *      in its NARROW layout. Useless for reviewing a desktop console.
 *   2. `chrome --headless --screenshot` can't inject script, so you can't draw
 *      markers, and you can't drive the UI into the state worth capturing
 *      (a sheet open, a dropdown expanded, a test in its success state).
 * So: headless Chrome at a real desktop size, driven over the DevTools
 * Protocol with Node's built-in WebSocket (Node 22+). Inject, then capture.
 *
 * USAGE
 *   node scripts/annotate-shots.mjs <config.json> [outDir]
 *
 * CONFIG — an array of shots:
 * [{
 *   "name": "01-sessions-list",              // output filename (no extension)
 *   "url":  "https://…/sessions",
 *   "wait": 4000,                            // ms after navigation (default 3500)
 *   "pre":  "(async()=>{ … })()",            // OPTIONAL: JS to drive the UI first
 *   "preWait": 1200,                         // ms after `pre` (default 900)
 *   "full": false,                           // capture beyond the viewport
 *   "marks": [{
 *     "text": "p95 response",                // find by visible text …
 *     "sel":  "#some-id",                    // … or by CSS selector (wins)
 *     "tags": "th",                          // restrict the text search
 *     "up":   1,                             // walk N parents after matching
 *     "maxH": 500,                           // ignore matches taller than this
 *     "name": "p95 on the row",              // ← the WHAT (bold)
 *     "why":  "Triage happens in the list."  // ← the WHY (second line)
 *   }]
 * }]
 *
 * Every marker MUST carry both `name` and `why`. A red box with no rationale
 * tells a reviewer where to look but not what decision they're reviewing —
 * which is the whole point of the annotated shot.
 *
 * The script exits non-zero if any marker fails to match, so a stale selector
 * is a build failure rather than a silently unmarked screenshot.
 */
import { spawn } from "node:child_process"
import { writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs"
import { setTimeout as sleep } from "node:timers/promises"

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const PORT = Number(process.env.CDP_PORT || 9333)
const WIDTH = Number(process.env.SHOT_WIDTH || 1600)
const HEIGHT = Number(process.env.SHOT_HEIGHT || 1200)

const configPath = process.argv[2]
const OUTDIR = process.argv[3] || "references/shots"
if (!configPath) {
  console.error("usage: node scripts/annotate-shots.mjs <config.json> [outDir]")
  process.exit(2)
}
const SHOTS = JSON.parse(readFileSync(configPath, "utf8"))

mkdirSync(OUTDIR, { recursive: true })
const profile = `/tmp/annotate-shots-${Date.now()}`

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  "--force-device-scale-factor=2",
  "about:blank",
], { stdio: "ignore" })

/** Injected into the page. Draws a red box + a two-line label per marker. */
const ANNOT = String.raw`
window.__annot = function (specs) {
  document.querySelectorAll('.__annot').forEach(e => e.remove());
  let n = 0; const report = []; const placed = [];
  const overlaps = (a, b) =>
    a.l < b.r + 6 && a.r + 6 > b.l && a.t < b.b + 4 && a.b + 4 > b.t;
  for (const spec of specs) {
    let el = null;
    if (spec.sel) el = document.querySelector(spec.sel);
    if (!el && spec.text) {
      const tags = spec.tags || 'th,td,button,a,h1,h2,h3,p,span,label,code,pre,li';
      el = [...document.querySelectorAll(tags)].find(e =>
        e.textContent.trim().toLowerCase().includes(spec.text.toLowerCase())
        && e.offsetHeight > 0 && e.offsetHeight < (spec.maxH || 500));
    }
    if (!el) { report.push('MISS::' + (spec.name || spec.text || spec.sel)); continue; }
    if (spec.up) for (let i = 0; i < spec.up && el.parentElement; i++) el = el.parentElement;
    n++;
    const r = el.getBoundingClientRect();

    const box = document.createElement('div');
    box.className = '__annot';
    Object.assign(box.style, {
      position: 'absolute',
      left: (r.left + scrollX - 5) + 'px', top: (r.top + scrollY - 5) + 'px',
      width: (r.width + 10) + 'px', height: (r.height + 10) + 'px',
      border: '3px solid #e11d48', borderRadius: '7px',
      zIndex: 2147483646, pointerEvents: 'none',
      boxShadow: '0 0 0 3px rgba(225,29,72,.15)',
    });

    const tag = document.createElement('div');
    tag.className = '__annot';
    const label = document.createElement('div');
    label.textContent = n + '. ' + (spec.name || '');
    Object.assign(label.style, { font: '700 13px ui-sans-serif,system-ui,sans-serif' });
    tag.appendChild(label);
    if (spec.why) {
      const why = document.createElement('div');
      why.textContent = spec.why;
      Object.assign(why.style, {
        font: '400 12px ui-sans-serif,system-ui,sans-serif',
        opacity: '.92', marginTop: '1px', whiteSpace: "normal", lineHeight: "1.35",
      });
      tag.appendChild(why);
    }
    // Label above when there's headroom, else below. Nudge left so a marker on
    // a right-edge element doesn't run off the page, then walk it clear of any
    // label already placed — two-line labels are wide and WILL collide, and a
    // rationale clipped by the next marker defeats the point of writing one.
    const estW = Math.min(470, Math.max(170, (spec.why || '').length * 6.3 + 44));
    const h = spec.why ? 48 : 27;
    const left = Math.max(scrollX + 8,
      Math.min(r.left + scrollX - 5, scrollX + innerWidth - estW - 12));
    const above = r.top > h + 10;
    let top = above ? r.top + scrollY - h - 6 : r.bottom + scrollY + 8;

    for (let guard = 0; guard < 24; guard++) {
      const rect = { l: left, r: left + estW, t: top, b: top + h };
      const hit = placed.find((p) => overlaps(rect, p));
      if (!hit) break;
      top = above ? hit.t - h - 6 : hit.b + 6;
      if (top < scrollY + 4) { top = r.bottom + scrollY + 8; }
    }
    placed.push({ l: left, r: left + estW, t: top, b: top + h });

    Object.assign(tag.style, {
      position: 'absolute',
      left: left + 'px', top: top + 'px',
      width: estW + 'px',
      background: '#e11d48', color: '#fff',
      padding: '5px 10px', borderRadius: '6px',
      zIndex: 2147483647, pointerEvents: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,.3)',
      boxSizing: 'border-box',
    });

    document.body.appendChild(box);
    document.body.appendChild(tag);
    report.push('OK::' + n + '::' + (spec.name || ''));
  }
  return report.join('\n');
};`

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      return (await r.json()).webSocketDebuggerUrl
    } catch { await sleep(250) }
  }
  throw new Error("Chrome did not start — check CHROME_PATH")
}

const ws = new WebSocket(await connect())
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

let msgId = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
}
const send = (method, params = {}, sessionId) =>
  new Promise((res) => {
    const id = ++msgId
    pending.set(id, res)
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })

const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" })
const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true })
await send("Page.enable", {}, sessionId)
await send("Runtime.enable", {}, sessionId)
await send("Emulation.setDeviceMetricsOverride",
  { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: false }, sessionId)

let missed = 0
for (const shot of SHOTS) {
  await send("Page.navigate", { url: shot.url }, sessionId)
  await sleep(shot.wait ?? 3500)

  if (shot.pre) {
    const p = await send("Runtime.evaluate",
      { expression: shot.pre, awaitPromise: true, returnByValue: true }, sessionId)
    const v = p.result?.result?.value
    if (v !== undefined) console.log(`  pre → ${v}`)
    await sleep(shot.preWait ?? 900)
  }

  await send("Runtime.evaluate", { expression: ANNOT }, sessionId)
  const r = await send("Runtime.evaluate", {
    expression: `__annot(${JSON.stringify(shot.marks ?? [])})`, returnByValue: true,
  }, sessionId)

  console.log(`\n[${shot.name}]`)
  for (const line of String(r.result?.result?.value ?? "").split("\n").filter(Boolean)) {
    const [status, ...rest] = line.split("::")
    if (status === "MISS") { missed++; console.log(`  ✗ MISS  ${rest.join("::")}`) }
    else console.log(`  ✓ ${rest[0]}. ${rest[1]}`)
  }

  const cap = await send("Page.captureScreenshot",
    { format: "png", captureBeyondViewport: !!shot.full }, sessionId)
  if (cap.result?.data) {
    const out = `${OUTDIR}/${shot.name}.png`
    writeFileSync(out, Buffer.from(cap.result.data, "base64"))
    console.log(`  saved ${out}`)
  } else {
    console.log("  ✗ CAPTURE FAILED"); missed++
  }
}

ws.close()
chrome.kill()
try { rmSync(profile, { recursive: true, force: true, maxRetries: 3 }) } catch {}

if (missed) {
  console.error(`\n${missed} marker(s) failed to match — fix the selectors, don't ship an unmarked shot.`)
  process.exit(1)
}
console.log("\nall markers matched")
