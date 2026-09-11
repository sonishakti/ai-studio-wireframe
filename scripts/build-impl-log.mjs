#!/usr/bin/env node
// build-impl-log — one self-contained HTML implementation log from a JSON
// manifest (the ship-protocol deliverable), images inlined as data URIs so the
// file opens anywhere and can be published as an Artifact unchanged.
//
//   node scripts/build-impl-log.mjs <manifest.json> <out.html>
//
// manifest: { title, date, deploy, commits: [{sha, msg}], intro: [..lines],
//             features: [{ n, name, jtbd, verdict, before: {img, caption}, after: [{img, caption, marks:[{name, why}]}],
//                          rationale: [..], copy: [..], next: [..], links: [{label, href}] }],
//             audit: [{id, before, after}], gates: [{name, result}] }
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, dirname, extname, resolve } from "node:path"
import { execFileSync } from "node:child_process"
const [manifestPath, outPath] = process.argv.slice(2)
if (!manifestPath || !outPath) { console.error("usage: build-impl-log.mjs <manifest.json> <out.html>"); process.exit(2) }
const m = JSON.parse(readFileSync(manifestPath, "utf8"))
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
// Embed a 1600 px JPEG (q80) instead of the 3200 px PNG — the log must stay under the 16 MB artifact cap.
const LOG_JPG = (p) => resolve(dirname(p), ".log", basename(p).replace(/\.png$/i, ".jpg"))
const img = (p) => { if (!p) return ""; try { const src = resolve(p); const jpg = LOG_JPG(p); if (!existsSync(jpg)) { mkdirSync(dirname(jpg), { recursive: true }); execFileSync("sips", ["-Z", "1600", "-s", "format", "jpeg", "-s", "formatOptions", "80", src, "--out", jpg], { stdio: "ignore" }) } return `data:image/jpeg;base64,${readFileSync(jpg).toString("base64")}` } catch { try { return `data:image/png;base64,${readFileSync(resolve(p)).toString("base64")}` } catch { return "" } } }
const list = (arr, cls = "") => arr?.length ? `<ul class="${cls}">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""
const shot = (s) => s ? `<figure><img src="${img(s.img)}" alt="${esc(s.caption)}" loading="lazy"><figcaption>${esc(s.caption)}${s.marks?.length ? `<ol class="marks">${s.marks.map((k, i) => `<li><b>${i + 1}. ${esc(k.name)}</b> — ${esc(k.why)}</li>`).join("")}</ol>` : ""}</figcaption></figure>` : ""
const html = `<!doctype html><meta charset="utf-8"><title>${esc(m.title)}</title>
<style>
:root{--ink:#10202a;--ink2:#4c606a;--ink3:#7d8f99;--rule:#d5dfe5;--accent:#00658d;--red:#e5173f;--ground:#f2f6f8}
body{margin:0;font:15px/1.5 Inter,system-ui,sans-serif;color:var(--ink);background:#fff}
main{max-width:1180px;margin:0 auto;padding:40px 32px 96px}
h1{font-size:30px;line-height:1.2;margin:0 0 6px}h2{font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin:48px 0 12px;padding-top:24px;border-top:1px solid var(--rule)}
h3{font-size:20px;margin:28px 0 6px}.sub{color:var(--ink3);margin:0 0 18px}
.meta{display:flex;flex-wrap:wrap;gap:10px 24px;font-size:13px;color:var(--ink2)}.meta code{font:12px ui-monospace,monospace;background:var(--ground);padding:2px 6px;border-radius:4px}
.pill{display:inline-block;font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px;background:#dbeef5;color:var(--accent);margin-right:8px}
.ba{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}.ba>div>p.tag{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin:0 0 8px;color:var(--ink3)}
figure{margin:0 0 20px}figure img{width:100%;border:1px solid var(--rule);border-radius:8px;display:block}figcaption{font-size:13px;color:var(--ink2);margin-top:8px}
ol.marks{margin:8px 0 0;padding-left:0;list-style:none}ol.marks li{margin:4px 0;padding-left:14px;border-left:3px solid var(--red)}ol.marks b{color:var(--red)}
ul{margin:8px 0 0;padding-left:20px}ul li{margin:4px 0}ul.copy li{font:13px ui-monospace,monospace}
.jtbd{background:var(--ground);border-radius:8px;padding:12px 16px;margin:10px 0 16px}.jtbd b{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink3);margin-bottom:4px}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--rule);vertical-align:top}th{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink3)}
a{color:var(--accent)}
</style><main>
<h1>${esc(m.title)}</h1><p class="sub">${esc(m.date)}</p>
<div class="meta">${m.deploy ? `<span>Live: <a href="${esc(m.deploy)}">${esc(m.deploy)}</a></span>` : ""}${(m.commits ?? []).map((c) => `<span><code>${esc(c.sha)}</code> ${esc(c.msg)}</span>`).join("")}</div>
${list(m.intro)}
${m.where?.length ? `<h2>Where each feature lives</h2><table><tr><th>#</th><th>Feature</th><th>Area</th><th>Path in Studio X</th><th>Open</th></tr>${m.where.map((w) => `<tr><td><code>${esc(w.n)}</code></td><td>${esc(w.name)}</td><td>${esc(w.area)}</td><td>${esc(w.path)}</td><td><a href="${esc(w.href)}">preview</a></td></tr>`).join("")}</table>` : ""}
${(m.features ?? []).map((f) => `<h2>${esc(f.n)} · ${esc(f.name)}</h2>
<div class="jtbd"><b>Job to be done</b>${esc(f.jtbd)}</div>
${f.verdict ? `<p><span class="pill">Verdict</span>${esc(f.verdict)}</p>` : ""}
<div class="ba"><div><p class="tag">Before</p>${shot(f.before)}</div><div><p class="tag">After</p>${(f.after ?? []).map(shot).join("")}</div></div>
${f.rationale?.length ? `<h3>Why this shape</h3>${list(f.rationale)}` : ""}
${f.copy?.length ? `<h3>Copy introduced (needs a yes)</h3>${list(f.copy, "copy")}` : ""}
${f.next?.length ? `<h3>Next / open decisions</h3>${list(f.next)}` : ""}
${f.links?.length ? `<p>${f.links.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join(" · ")}</p>` : ""}`).join("")}
${m.audit?.length ? `<h2>Re-audit — what moved</h2><table><tr><th>Finding</th><th>Before</th><th>After</th></tr>${m.audit.map((a) => `<tr><td><code>${esc(a.id)}</code></td><td>${esc(a.before)}</td><td>${esc(a.after)}</td></tr>`).join("")}</table>` : ""}
${m.gates?.length ? `<h2>Gates</h2><table><tr><th>Gate</th><th>Result</th></tr>${m.gates.map((g) => `<tr><td>${esc(g.name)}</td><td>${esc(g.result)}</td></tr>`).join("")}</table>` : ""}
</main>`
writeFileSync(outPath, html)
console.log(`${outPath}  ${Math.round(html.length / 1024)} KB`)
