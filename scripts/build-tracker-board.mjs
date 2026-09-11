#!/usr/bin/env node
// build-tracker-board — renders references/tracker-board/tracker-board.json into
// references/tracker-board/index.html (self-contained: thumbnails inlined).
//
//   node scripts/build-tracker-board.mjs
//
// Rows come from the ClickUp Design Tracker (list 901114875662) in ClickUp
// order and are never reordered here. Edit the JSON, rebuild, republish the
// same Artifact. Status tags are exactly: Not Done · WIP · Pending review · Done.
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "..")
const dataPath = resolve(root, "references/tracker-board/tracker-board.json")
const outPath = resolve(root, "references/tracker-board/index.html")
const data = JSON.parse(readFileSync(dataPath, "utf8"))

const STATUS = {
  "Not Done": "s-notdone",
  WIP: "s-wip",
  "Pending review": "s-review",
  Done: "s-done",
}

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

// Thumbnails keep the board small: each image is inlined as an 800px-wide
// copy (<file>.thumb.png, generated with macOS sips and cached next to the
// original). The full-size capture stays in the repo for close reading.
const THUMB_WIDTH = 1080
// Each unique image is inlined ONCE in a registry at the end of the page; every
// <img> carries data-img="<key>" and a tiny script copies the src in on load,
// so a shot used on three rows costs one base64 payload, not three.
const registry = new Map()
const imageKey = (file) => {
  if (!registry.has(file)) registry.set(file, `i${registry.size + 1}`)
  return registry.get(file)
}
const inlineImage = (file) => {
  const src = resolve(root, file)
  const thumb = `${src}.thumb.png`
  const stale =
    !existsSync(thumb) || statSync(thumb).mtimeMs < statSync(src).mtimeMs
  if (stale) {
    execFileSync("sips", ["-Z", String(THUMB_WIDTH), src, "--out", thumb], {
      stdio: "ignore",
    })
  }
  return `data:image/png;base64,${readFileSync(thumb).toString("base64")}`
}

const links = (items) =>
  items
    .map(
      (l) =>
        `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`
    )
    .join('<span class="sep">·</span>')

// Secondary research: one entry per competitor screen — a red-marked or plain
// screenshot plus the URL it came from. Vendors without a capture show as
// "pending" so the gap is visible on every row.
const VENDORS = ["Vapi", "Retell", "ElevenLabs", "LiveKit"]
const secondary = (items = []) => {
  const byVendor = new Map(VENDORS.map((v) => [v, []]))
  for (const it of items) {
    if (!byVendor.has(it.vendor)) byVendor.set(it.vendor, [])
    byVendor.get(it.vendor).push(it)
  }
  return [...byVendor.entries()]
    .map(([vendor, its]) => {
      if (its.length === 0)
        return `<div class="sr"><b>${esc(vendor)}</b><span class="none">pending</span></div>`
      const shots = its
        .map((it) => {
          const img = it.shot
            ? `<button class="thumb sm" type="button" aria-label="Open screenshot: ${esc(it.label)}"><img alt="${esc(it.label)}" loading="lazy" data-img="${imageKey(it.shot)}"></button>`
            : ""
          const link = it.href
            ? `<a href="${esc(it.href)}" target="_blank" rel="noopener">${esc(it.label)}</a>`
            : esc(it.label)
          return `<div class="sr-item">${img}<div class="sr-cap">${link}${it.kind ? ` <span class="kind">${esc(it.kind)}</span>` : ""}</div></div>`
        })
        .join("")
      return `<div class="sr"><b>${esc(vendor)}</b>${shots}</div>`
    })
    .join("")
}

const row = (r) => {
  const cls = STATUS[r.status]
  if (!cls) throw new Error(`row ${r.n}: unknown status "${r.status}"`)
  const shot = r.shot
    ? `<button class="thumb" type="button" aria-label="Open screenshot: ${esc(r.shot.alt)}"><img alt="${esc(r.shot.alt)}" loading="lazy" data-img="${imageKey(r.shot.file)}"></button>`
    : `<span class="none">—</span>`
  return `<tr id="f${r.n}">
  <td class="n">${esc(r.n)}</td>
  <td class="feat"><a href="${esc(r.clickup)}" target="_blank" rel="noopener"><b>${esc(r.name)}</b></a><div class="tags">${esc(r.tags)}</div><div class="says">${esc(r.clickupSays)}</div></td>
  <td><span class="pill ${cls}">${esc(r.status)}</span></td>
  <td class="jtbd">${esc(r.jtbd)}</td>
  <td class="open">${links(r.open)}</td>
  <td class="shot">${shot}</td>
  <td class="sec">${secondary(r.secondary)}</td>
  <td class="why">${esc(r.rationale) || '<span class="none">—</span>'}</td>
  <td class="next">${esc(r.next)}</td>
</tr>`
}

const counts = Object.keys(STATUS).map(
  (s) => `<span class="pill ${STATUS[s]}">${esc(s)}</span> ${data.rows.filter((r) => r.status === s).length}`
).join('<span class="sep">·</span>')

const html = `<title>Design Delivery Board</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
:root{--ground:#f2f6f8;--card:#fff;--ink:#101e26;--ink-2:#4c5f69;--ink-3:#7d8f99;--rule:#d5dfe5;--accent:#00658d;--accent-soft:#dcedf4;
  --notdone:#5b6b74;--notdone-bg:#e6ecef;--wip:#8a5a00;--wip-bg:#fbf1d9;--review:#00658d;--review-bg:#dcedf4;--done:#1a7a4a;--done-bg:#dff3e8;--shot:#0b0f13}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ground:#0c1317;--card:#131c22;--ink:#e7eef2;--ink-2:#9fb1bb;--ink-3:#6f8390;--rule:#22313a;--accent:#5cc8f0;--accent-soft:#10303f;
  --notdone:#9fb1bb;--notdone-bg:#1b262d;--wip:#e2b95c;--wip-bg:#2c2410;--review:#5cc8f0;--review-bg:#10303f;--done:#5fd39a;--done-bg:#0f2b1e;--shot:#000}}
:root[data-theme="dark"]{--ground:#0c1317;--card:#131c22;--ink:#e7eef2;--ink-2:#9fb1bb;--ink-3:#6f8390;--rule:#22313a;--accent:#5cc8f0;--accent-soft:#10303f;
  --notdone:#9fb1bb;--notdone-bg:#1b262d;--wip:#e2b95c;--wip-bg:#2c2410;--review:#5cc8f0;--review-bg:#10303f;--done:#5fd39a;--done-bg:#0f2b1e;--shot:#000}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:"Instrument Sans",system-ui,sans-serif;font-size:13.5px;line-height:1.45}
a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:2px}
a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
code{font-family:"JetBrains Mono",monospace;font-size:.9em;background:var(--accent-soft);padding:1px 4px;border-radius:3px}
.wrap{max-width:1680px;margin:0 auto;padding:28px 22px 80px}
.eyebrow{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);font-weight:600;margin:0 0 6px}
h1{font-size:26px;font-weight:600;letter-spacing:-.01em;margin:0 0 6px}
.meta{color:var(--ink-2);font-size:13px;margin:0 0 14px;display:flex;flex-wrap:wrap;gap:6px 0;align-items:center}
.sep{color:var(--ink-3);padding:0 7px}
.pill{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.04em;padding:2px 9px;border-radius:999px;white-space:nowrap}
.s-notdone{color:var(--notdone);background:var(--notdone-bg)}.s-wip{color:var(--wip);background:var(--wip-bg)}
.s-review{color:var(--review);background:var(--review-bg)}.s-done{color:var(--done);background:var(--done-bg)}
.tablewrap{overflow-x:auto;border:1px solid var(--rule);border-radius:8px;background:var(--card)}
table{width:100%;min-width:1700px;border-collapse:collapse}
th{position:sticky;top:0;background:var(--card);z-index:1;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3);text-align:left;padding:10px 12px;border-bottom:1px solid var(--rule);font-weight:600}
td{padding:11px 12px;border-bottom:1px solid var(--rule);vertical-align:top}
tr:last-child td{border-bottom:0}
td.n{font-family:"JetBrains Mono",monospace;color:var(--ink-3);font-variant-numeric:tabular-nums;width:38px}
td.feat{min-width:200px;max-width:240px}
td.feat b{font-weight:600}
.tags{color:var(--ink-3);font-size:11.5px;margin-top:2px}
.says{color:var(--ink-3);font-size:11.5px;margin-top:4px}
td.jtbd{min-width:210px;max-width:260px;color:var(--ink-2)}
td.open{min-width:170px;max-width:220px;line-height:1.7}
td.shot{width:280px}
.thumb{display:block;width:264px;padding:0;border:1px solid var(--rule);border-radius:6px;background:var(--shot);overflow:hidden;cursor:zoom-in}
.thumb img{display:block;width:100%;height:auto}
td.sec{min-width:250px;max-width:300px}
.sr{display:grid;gap:4px;padding:4px 0;border-bottom:1px dashed var(--rule)}
.sr:last-child{border-bottom:0}
.sr>b{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:600}
.sr-item{display:grid;gap:3px}
.thumb.sm{width:230px}
.sr-cap{font-size:12px;line-height:1.35}
.kind{color:var(--ink-3);font-size:11px}
td.why{min-width:240px;max-width:320px;color:var(--ink-2)}
td.next{min-width:200px;max-width:260px}
.none{color:var(--ink-3)}
.legend{font-size:12.5px;color:var(--ink-2);margin:14px 0 0}
.lb{position:fixed;inset:0;background:rgba(6,12,16,.86);display:none;place-items:center;padding:24px;z-index:9;cursor:zoom-out}
.lb.open{display:grid}
.lb img{max-width:100%;max-height:100%;border-radius:8px;border:1px solid var(--rule);background:var(--shot)}
</style>
<div class="wrap">
  <p class="eyebrow">Convo AI · Design Tracker · delivery</p>
  <h1>Design Delivery Board</h1>
  <p class="meta">${counts}<span class="sep">·</span>updated ${esc(data.updated)}<span class="sep">·</span>rows from <a href="${esc(data.source.url)}" target="_blank" rel="noopener">${esc(data.source.label)}</a>, in ClickUp order</p>
  <div class="tablewrap"><table>
    <thead><tr><th>#</th><th>Feature</th><th>Status</th><th>JTBD</th><th>Open</th><th>What we built</th><th>Secondary research</th><th>Rationale</th><th>Next</th></tr></thead>
    <tbody>
${data.rows.map(row).join("\n")}
    </tbody>
  </table></div>
  <p class="legend"><b>Status:</b> Not Done = nothing started · WIP = research or build in progress · Pending review = built or blocked, needs your review or a decision · Done = reviewed and accepted. <b>Secondary research:</b> one screenshot per competitor (Vapi · Retell · ElevenLabs · LiveKit) of the equivalent screen — <span class="kind">docs</span> = public documentation, <span class="kind">product</span> = the logged-in builder UI; "pending" marks a capture still to do. Rows are never reordered. Source: <code>references/tracker-board/tracker-board.json</code> → <code>node scripts/build-tracker-board.mjs</code>.</p>
</div>
<div class="lb" id="lb" role="dialog" aria-label="Screenshot"><img alt="" id="lbimg"></div>
<script type="application/json" id="imgs">${JSON.stringify(Object.fromEntries([...registry].map(([file, key]) => [key, inlineImage(file)])))}</script>
<script>
(function(){var m=JSON.parse(document.getElementById('imgs').textContent);document.querySelectorAll('img[data-img]').forEach(function(im){var src=m[im.getAttribute('data-img')];if(src)im.src=src})})();
</script>
<script>
(function(){var lb=document.getElementById('lb'),img=document.getElementById('lbimg');
document.querySelectorAll('.thumb').forEach(function(b){b.addEventListener('click',function(){img.src=b.querySelector('img').src;img.alt=b.querySelector('img').alt;lb.classList.add('open')})});
function close(){lb.classList.remove('open');img.src=''}
lb.addEventListener('click',close);document.addEventListener('keydown',function(e){if(e.key==='Escape')close()})})();
</script>
`
writeFileSync(outPath, html)
console.log(`wrote ${outPath} (${Math.round(html.length / 1024)} KB, ${data.rows.length} rows)`)
