#!/usr/bin/env node
// Phase 0 audit — screenshots (1440 + 390) and an axe scan for every screen.
// Usage: BASE=http://localhost:3020 node scripts/revamp/scan.mjs [routes.json]
// Writes docs/revamp/before/<slug>-1440.png, <slug>-390.png and docs/revamp/axe.json.
import { chromium } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
const BASE = process.env.BASE || "http://localhost:3020"
const OUT = process.env.OUT || "docs/revamp/before"
const routes = JSON.parse(readFileSync(process.argv[2] || "scripts/revamp/routes.json", "utf8"))
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch(process.env.EXEC ? { executablePath: process.env.EXEC } : {})
const results = []
for (const r of routes) {
  // resolve: { from, selector } — read a real id off a list page (mock data is generated at runtime)
  if (r.resolve) {
    const ctx0 = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p0 = await ctx0.newPage()
    try { await p0.goto(BASE + r.resolve.from, { waitUntil: "networkidle", timeout: 60000 }); const href = await p0.locator(r.resolve.selector).first().getAttribute("href", { timeout: 10000 }); if (href) r.path = href } catch (e) { console.log("resolve failed for", r.path, e.message.slice(0, 80)) }
    await ctx0.close()
  }
  const slug = r.slug || r.path.replace(/^\//, "").replace(/[\/?=&]+/g, "-").replace(/-$/, "") || "home"
  const row = { path: r.path, area: r.area, slug, title: null, axe: null, missingLabels: null, error: null }
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light" })
    const page = await ctx.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)))
    try {
      await page.goto(BASE + r.path, { waitUntil: "networkidle", timeout: 60000 })
      await page.waitForTimeout(r.wait ?? 1200)
      if (r.pre) await page.evaluate(r.pre)
      await page.screenshot({ path: `${OUT}/${slug}-${w}.png`, fullPage: true })
      if (w === 1440) {
        row.title = await page.title()
        row.h1 = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim() || null)
        const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze()
        row.axe = axe.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes[0]?.target?.[0] }))
        row.missingLabels = await page.evaluate(() => {
          const ctrls = [...document.querySelectorAll("button, a[href], input, select, textarea, [role=button], [role=tab], [role=switch]")]
          const bad = ctrls.filter((el) => { const t = (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title") || el.textContent || "").trim(); const lab = el.id && document.querySelector(`label[for="${el.id}"]`); return !t && !lab && !(el.closest("label")) && !el.hidden })
          return { controls: ctrls.length, unlabeled: bad.length, samples: bad.slice(0, 5).map((el) => `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ").slice(0, 2).join(".") : ""}`) }
        })
        row.focusVisible = await page.evaluate(() => { const css = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].map((r) => r.cssText) } catch { return [] } }).join("\n"); return { outlineNone: (css.match(/outline:\s*none|outline-style:\s*none|outline:\s*0/g) || []).length, focusVisibleRules: (css.match(/:focus-visible/g) || []).length } })
      }
    } catch (e) { row.error = String(e.message).slice(0, 200) }
    if (errors.length) row.pageErrors = errors.slice(0, 3)
    await ctx.close()
  }
  results.push(row)
  const sc = (row.axe || []).filter((v) => v.impact === "serious" || v.impact === "critical").reduce((a, v) => a + v.nodes, 0)
  console.log(`${row.slug.padEnd(44)} ${row.error ? "ERROR " + row.error : `axe serious/critical nodes: ${sc} · unlabeled controls: ${row.missingLabels?.unlabeled ?? "?"}/${row.missingLabels?.controls ?? "?"}`}`)
}
await browser.close()
writeFileSync("docs/revamp/axe.json", JSON.stringify(results, null, 1))
console.log(`\n${results.length} screens → ${OUT}, docs/revamp/axe.json`)
