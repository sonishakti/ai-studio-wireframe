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
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "..")
const dataPath = resolve(root, "references/tracker-board/tracker-board.json")
const outPath = resolve(root, "references/tracker-board/index.html")
const data = JSON.parse(readFileSync(dataPath, "utf8"))
// The strategy panel is optional: the board still builds without it.
const strategyPath = resolve(root, "references/tracker-board/strategy.json")
const strategy = existsSync(strategyPath) ? JSON.parse(readFileSync(strategyPath, "utf8")) : null

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

// Thumbnails keep the board small: each image is inlined as a 1080px-wide JPEG
// (<file>.thumb.jpg, generated with macOS sips and cached next to the
// original). The full-size capture stays in the repo for close reading.
//
// JPEG, not PNG: with five more features carrying seven vendors each the PNG
// board reached 25 MB, and the artifact cap is 16. Same pass the impl log made
// for the same reason.
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
  const thumb = `${src}.thumb.jpg`
  const stale =
    !existsSync(thumb) || statSync(thumb).mtimeMs < statSync(src).mtimeMs
  if (stale) {
    execFileSync("sips", [
      "-s", "format", "jpeg", "-s", "formatOptions", "72",
      "-Z", String(THUMB_WIDTH), src, "--out", thumb,
    ], { stdio: "ignore" })
  }
  return `data:image/jpeg;base64,${readFileSync(thumb).toString("base64")}`
}

// EXTERNAL IMAGE MODE (BOARD_EXTERNAL_IMAGES=1). Inlining every thumbnail as
// base64 put the board at 14.1 MB against the 16 MB artifact cap, and rows
// 13 to 22 would not have fitted. With the flag set, each thumbnail is written
// to references/tracker-board/img/<key>.jpg and the registry holds that path
// instead of a data URL. The loader at the foot of the page assigns whatever
// the registry gives it, so nothing else changes and the board is published as
// a page plus its images rather than one enormous file.
const EXTERNAL = process.env.BOARD_EXTERNAL_IMAGES === "1"
const IMG_DIR = resolve(root, "references/tracker-board/img")
const imageSrc = (file) => {
  if (!EXTERNAL) return inlineImage(file)
  const src = resolve(root, file)
  const thumb = `${src}.thumb.jpg`
  if (!existsSync(thumb) || statSync(thumb).mtimeMs < statSync(src).mtimeMs) {
    execFileSync("sips", [
      "-s", "format", "jpeg", "-s", "formatOptions", "72",
      "-Z", String(THUMB_WIDTH), src, "--out", thumb,
    ], { stdio: "ignore" })
  }
  mkdirSync(IMG_DIR, { recursive: true })
  const name = `${registry.get(file)}.jpg`
  copyFileSync(thumb, resolve(IMG_DIR, name))
  return `img/${name}`
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

const BAR_COLORS = ["#00658d", "#0b7ba6", "#1b8fb8", "#2fa2c6", "#4bb4d2", "#6cc4dc", "#92d3e6"]

function strategyPanel(s) {
  if (!s) return ""
  const ns = s.northStar
  const stages = s.budget.stages
  const totalSec = stages.reduce((n, x) => n + x.seconds, 0)
  return `
  <nav class="nav" aria-label="Sections">
    <a href="#northstar">North star</a><a href="#inputs">Input metrics</a><a href="#budget">Time budget</a>
    <a href="#guardrails">Guardrails</a><a href="#assumptions">Assumptions</a><a href="#next">Next</a>
    <a href="#telemetry">Telemetry</a><a href="#pricing">Pricing</a><a href="#decisions">Decisions for you</a><a href="#delivery">Delivery</a>
  </nav>

  <h2 id="northstar">The bet, and the one number that says whether it worked</h2>
  <div class="ns">
    <div class="ns-l">
      <p class="ns-def" style="color:var(--ink);font-size:15px;margin-bottom:16px">${esc(s.bet)}</p>
      <p class="ns-name">${esc(ns.name)} <span class="ns-abbr">${esc(ns.short)} · ${esc(ns.status)}</span></p>
      <p class="ns-def">${esc(ns.definition)}</p>
      <p class="ns-note"><b>The gaming test.</b> ${esc(ns.gaming)}</p>
      <p class="ns-note"><b>Why no count target.</b> ${esc(ns.counter)}</p>
    </div>
    <div class="ns-r">
      <p class="tiny">${esc(ns.targetLabel)} — target</p>
      <p class="big">${esc(ns.target)}</p>
      <p class="tiny" style="margin-top:16px">Today</p>
      <p class="big" style="color:var(--ink-3);font-size:22px">${esc(ns.current)}</p>
      <p class="ns-note">${esc(ns.currentNote)}</p>
    </div>
  </div>

  <h2 id="inputs">Input metrics — the four numbers a design change may claim</h2>
  <div class="cards">
    ${s.inputs.map((i) => `<div class="card">
      <h3>${esc(i.name)} <span>${esc(i.id)}</span></h3>
      <p class="full">${esc(i.full)}</p>
      <p>${esc(i.definition)}</p>
      <div class="kv"><b>Target</b><span class="mono">${esc(i.target)}</span></div>
      <div class="kv"><b>Baseline</b><span class="mono">${esc(i.baseline)}</span></div>
      <div class="kv"><b>Owner</b><span>${esc(i.owner)}</span></div>
      <div class="chips">${i.levers.map((l) => `<span class="chip">${esc(l)}</span>`).join("")}</div>
    </div>`).join("")}
  </div>
  <p class="note">The first two pull against each other on purpose: making testing easier pulls in slower, less confident users, which raises the test rate and raises the clock. Read them as a pair. A speed win with a test-rate loss is a selection effect, not an improvement.</p>

  <h2 id="budget">Time budget — how the ${esc(s.budget.total)} target is spent</h2>
  <div class="bar">
    ${stages.map((x, n) => `<div style="flex:${x.seconds};background:${BAR_COLORS[n % BAR_COLORS.length]}" title="${esc(x.stage)} — ${x.seconds}s">${x.seconds >= 20 ? x.seconds + "s" : ""}</div>`).join("")}
  </div>
  <div class="budget">
    ${stages.map((x) => `<div><b>${x.seconds}s</b><i>${esc(x.stage)}</i><span>${esc(x.note)}</span></div>`).join("")}
  </div>
  <p class="note"><b>Total ${totalSec}s.</b> The ${esc(s.budget.ceiling)} ceiling is not a sum. ${esc(s.budget.ceilingNote)} A budget is a design contract: if p75 active dwell on a row exceeds it, the row is the defect, not the user.</p>

  <h2 id="guardrails">Guardrails — a change that wins on speed and loses here has not won</h2>
  <table class="s"><tr><th>Guardrail</th><th>Threshold</th><th>On breach</th><th>Owner</th></tr>
    ${s.guardrails.map((g) => `<tr>
      <td><span class="pill t-${esc(g.tier)}">${esc(g.tier)}</span> ${esc(g.name)}</td>
      <td class="mono">${esc(g.threshold)}</td>
      <td>${esc(g.onBreach)}</td>
      <td>${g.owner === "unowned" ? `<span class="unowned">unowned</span>` : esc(g.owner)}</td>
    </tr>`).join("")}
  </table>
  <p class="note">${esc(s.guardrailNote)}</p>

  <h2 id="assumptions">Assumptions — what we are betting, and what would prove us wrong</h2>
  <table class="s"><tr><th>#</th><th>Change</th><th>Predicted, raw</th><th>Plan with</th><th>The event that would refute it</th><th>Powered?</th></tr>
    ${s.assumptions.map((a) => `<tr>
      <td class="mono">${esc(a.id)}</td>
      <td>${esc(a.change)}</td>
      <td>${esc(a.raw)}</td>
      <td class="mono"><b>${esc(a.discounted)}</b></td>
      <td class="mono">${esc(a.metric)}</td>
      <td><span class="${a.powered === "yes" ? "yes" : a.powered === "no" ? "no" : ""}">${esc(a.powered)}</span><br><span style="color:var(--ink-3);font-size:11.5px">${esc(a.poweredNote)}</span></td>
    </tr>`).join("")}
  </table>
  <p class="note">${esc(s.assumptionNote)}</p>

  <h2 id="next">Next, ranked by expected effect on the north star</h2>
  <ol class="ranked">
    ${s.next.map((n) => `<li><em>${esc(n.effort)}</em><b>${esc(n.rank)}. ${esc(n.name)}</b><span>${esc(n.why)}</span></li>`).join("")}
  </ol>

  <h2 id="telemetry">Telemetry — what has to exist before any of this is readable</h2>
  <div class="cards" style="margin-bottom:14px">
    <div class="card"><p class="tiny">Events specified</p><p class="big">${s.telemetry.events}</p><p style="margin-top:6px">${s.telemetry.p0} of them P0. Spec: <code>${esc(s.telemetry.spec)}</code></p></div>
    <div class="card"><p class="tiny">Instrumented today</p><p class="big" style="color:var(--ink-3)">${s.telemetry.instrumented}</p><p style="margin-top:6px">And all three lose their payload to the live console's 48-key sanitiser allowlist.</p></div>
    <div class="card"><p class="tiny">Front-end contract</p><p style="margin-top:6px"><code>${esc(s.telemetry.module)}</code> carries the typed event names and the active-time clock. It no-ops until a PostHog key exists, so the builder can be wired now and switched on later.</p></div>
  </div>
  <table class="s"><tr><th>Wave</th><th>Work</th><th>Unlocks</th><th>Status</th><th>Owner</th></tr>
    ${s.telemetry.waves.map((w) => `<tr>
      <td class="mono">${esc(w.wave)}</td><td>${esc(w.work)}</td><td>${esc(w.unlocks)}</td>
      <td>${w.status === "UNOWNED" ? `<span class="unowned">${esc(w.status)}</span>` : esc(w.status)}</td>
      <td>${w.owner === "needs a name" ? `<span class="unowned">${esc(w.owner)}</span>` : esc(w.owner)}</td>
    </tr>`).join("")}
  </table>
  <p class="note"><b>Rules the spec obeys.</b></p>
  <ul class="note" style="padding-left:18px">${s.telemetry.rules.map((r) => `<li style="margin:4px 0">${esc(r)}</li>`).join("")}</ul>

  ${s.pricing ? `<h2 id="pricing">What the pricing docs changed</h2>
  <div class="ns">
    <div class="ns-l">
      <p class="ns-def" style="color:var(--ink);font-size:15px;margin-bottom:14px">${esc(s.pricing.headline)}</p>
      <ul style="margin:0;padding-left:18px">${s.pricing.facts.map((f) => `<li style="margin:5px 0;font-size:12.5px;color:var(--ink-2)">${esc(f)}</li>`).join("")}</ul>
    </div>
    <div class="ns-r">
      <p class="tiny">What changed in the builder</p>
      <p class="ns-note" style="margin-top:6px">${esc(s.pricing.change)}</p>
      <p class="tiny" style="margin-top:16px">Source</p>
      <p class="ns-note" style="margin-top:4px"><a href="https://${esc(s.pricing.source)}" target="_blank" rel="noopener">${esc(s.pricing.source)}</a></p>
    </div>
  </div>` : ""}

  <h2 id="decisions">Decisions waiting on you</h2>
  <ul class="qs">
    ${s.decisions.map((d) => `<li><b>${esc(d.q)}</b><span>${esc(d.why)}</span></li>`).join("")}
  </ul>
`
}

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
/* ── Strategy panel ─────────────────────────────────────────────────────── */
.nav{display:flex;flex-wrap:wrap;gap:0 18px;font-size:12.5px;margin:0 0 20px;padding:9px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.nav a{color:var(--ink-2);text-decoration:none}.nav a:hover{color:var(--accent);text-decoration:underline}
h2{font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);font-weight:600;margin:34px 0 12px}
.ns{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:0;border:1px solid var(--rule);border-radius:10px;background:var(--card);overflow:hidden}
@media(max-width:900px){.ns{grid-template-columns:1fr}}
.ns-l{padding:20px 22px}
.ns-r{padding:20px 22px;border-left:1px solid var(--rule);background:var(--accent-soft)}
@media(max-width:900px){.ns-r{border-left:0;border-top:1px solid var(--rule)}}
.ns-name{font-size:21px;font-weight:600;letter-spacing:-.01em;margin:0 0 2px;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.ns-abbr{font-family:"JetBrains Mono",monospace;font-size:12px;color:var(--ink-3);font-weight:400}
.ns-def{color:var(--ink-2);margin:0 0 14px;max-width:62ch}
.ns-note{font-size:12.5px;color:var(--ink-2);margin:10px 0 0;max-width:62ch}
.ns-note b{font-weight:600;color:var(--ink)}
.big{font-family:"JetBrains Mono",monospace;font-size:30px;font-weight:500;letter-spacing:-.02em;color:var(--accent);font-variant-numeric:tabular-nums;line-height:1.1}
.tiny{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3);font-weight:600;margin:0 0 3px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));gap:12px}
.card{border:1px solid var(--rule);border-radius:9px;background:var(--card);padding:15px 16px}
.card h3{margin:0 0 3px;font-size:14.5px;font-weight:600;display:flex;align-items:baseline;gap:7px}
.card h3 span{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--ink-3);font-weight:400}
.card .full{font-size:12px;color:var(--ink-3);margin:0 0 8px}
.card p{margin:0 0 9px;font-size:12.5px;color:var(--ink-2)}
.kv{display:flex;gap:7px;font-size:12px;margin:0 0 3px}
.kv b{font-weight:600;color:var(--ink-3);min-width:62px;font-size:11px;letter-spacing:.05em;text-transform:uppercase;padding-top:1px}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}
.chip{font-size:11px;padding:2px 8px;border-radius:999px;background:var(--accent-soft);color:var(--accent);white-space:nowrap}
.bar{display:flex;height:34px;border-radius:7px;overflow:hidden;border:1px solid var(--rule);margin:0 0 10px}
.bar div{display:flex;align-items:center;justify-content:center;font-family:"JetBrains Mono",monospace;font-size:11px;color:#fff;border-right:1px solid rgba(255,255,255,.28);min-width:0;overflow:hidden}
.bar div:last-child{border-right:0}
.budget{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0 26px}
.budget div{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--rule);font-size:12.5px;align-items:baseline}
.budget b{font-family:"JetBrains Mono",monospace;font-weight:500;color:var(--accent);min-width:42px;text-align:right;font-variant-numeric:tabular-nums}
.budget i{font-style:normal;font-weight:600;min-width:118px}
.budget span{color:var(--ink-2);min-width:0}
table.s{min-width:0;width:100%;border:1px solid var(--rule);border-radius:9px;background:var(--card);border-collapse:separate;border-spacing:0;overflow:hidden}
table.s th{position:static;border-bottom:1px solid var(--rule)}
table.s td{font-size:12.5px;border-bottom:1px solid var(--rule)}
table.s tr:last-child td{border-bottom:0}
.t-stop{color:var(--wip);background:var(--wip-bg)}.t-trade{color:var(--review);background:var(--review-bg)}
.t-quality{color:var(--notdone);background:var(--notdone-bg)}.t-cost{color:var(--done);background:var(--done-bg)}
.yes{color:var(--done);font-weight:600}.no{color:var(--wip);font-weight:600}
.mono{font-family:"JetBrains Mono",monospace;font-size:11.5px}
.note{font-size:12.5px;color:var(--ink-2);margin:10px 0 0;max-width:96ch}
.ranked{counter-reset:r;list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:10px}
.ranked li{border:1px solid var(--rule);border-radius:9px;background:var(--card);padding:13px 15px}
.ranked b{display:block;font-size:13.5px;margin-bottom:3px}
.ranked span{font-size:12.5px;color:var(--ink-2)}
.ranked em{font-style:normal;font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--ink-3);float:right}
.qs{list-style:none;padding:0;margin:0}
.qs li{border-left:2px solid var(--accent);padding:2px 0 2px 13px;margin:0 0 13px}
.qs b{display:block;font-size:13.5px;margin-bottom:2px}
.qs span{font-size:12.5px;color:var(--ink-2)}
.unowned{color:var(--wip);font-weight:600}
.lb{position:fixed;inset:0;background:rgba(6,12,16,.86);display:none;place-items:center;padding:24px;z-index:9;cursor:zoom-out}
.lb.open{display:grid}
.lb img{max-width:100%;max-height:100%;border-radius:8px;border:1px solid var(--rule);background:var(--shot)}
</style>
<div class="wrap">
  <p class="eyebrow">Convo AI · Design Tracker · delivery</p>
  <h1>Design Delivery Board</h1>
  <p class="meta">${counts}<span class="sep">·</span>updated ${esc(data.updated)}<span class="sep">·</span>rows from <a href="${esc(data.source.url)}" target="_blank" rel="noopener">${esc(data.source.label)}</a>, in ClickUp order</p>
  ${strategyPanel(strategy)}
  <h2 id="delivery">Delivery — one row per tracker task</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>#</th><th>Feature</th><th>Status</th><th>JTBD</th><th>Open</th><th>What we built</th><th>Secondary research</th><th>Rationale</th><th>Next</th></tr></thead>
    <tbody>
${data.rows.map(row).join("\n")}
    </tbody>
  </table></div>
  <p class="legend"><b>Status:</b> Not Done = nothing started · WIP = research or build in progress · Pending review = built or blocked, needs your review or a decision · Done = reviewed and accepted. <b>Secondary research:</b> one screenshot per competitor (Vapi · Retell · ElevenLabs · LiveKit) of the equivalent screen — <span class="kind">docs</span> = public documentation, <span class="kind">product</span> = the logged-in builder UI; "pending" marks a capture still to do. Rows are never reordered. Source: <code>references/tracker-board/tracker-board.json</code> → <code>node scripts/build-tracker-board.mjs</code>.</p>
</div>
<div class="lb" id="lb" role="dialog" aria-label="Screenshot"><img alt="" id="lbimg"></div>
<script type="application/json" id="imgs">${JSON.stringify(Object.fromEntries([...registry].map(([file, key]) => [key, imageSrc(file)])))}</script>
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
