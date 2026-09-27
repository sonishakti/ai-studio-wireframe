import { chromium } from "/Users/shaktisoni/Documents/Agora Design & FE/ai-studio-console-redesign/studio_x_2/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs"
const BASE = "https://ng-console-dcgukcxah-agoraio.vercel.app/v3"
const OUT = process.argv[2]
const shots = [
  ["00-list", "?concept=a"],
  ["a1-create", "?concept=a&panel=create", async (p) => { await p.locator("[data-slot=sheet-content]").getByText("Batch calls", { exact: true }).click(); await p.locator("#a-name").fill("Loan follow-ups") }],
  ["a2-agent-tab", "?concept=a&view=agent&agent=agent_survey&tab=agent"],
  ["a3-overview", "?concept=a&view=agent&agent=agent_payments&tab=overview"],
  ["a4-runs", "?concept=a&view=agent&agent=agent_payments&tab=deploy"],
  ["a5-new-run", "?concept=a&view=agent&agent=agent_payments&tab=deploy", async (p) => {
    await p.getByRole("button", { name: "New run" }).first().click(); await p.waitForTimeout(600)
    await p.getByText("Drop a CSV", { exact: false }).click(); await p.waitForTimeout(300)
  }],
  ["b1-build", "?concept=b&view=agent&agent=agent_frontdesk&tab=build"],
  ["b2-create-menu", "?concept=b", async (p) => { await p.getByRole("button", { name: "Create agent" }).click() }],
  ["b3-performance", "?concept=b&view=agent&agent=agent_frontdesk&tab=performance"],
  ["c1-create", "?concept=c&view=create", async (p) => { await p.getByText("Batch calls", { exact: true }).first().click() }],
  ["c2-setup", "?concept=c&view=agent&agent=agent_survey"],
  ["c3-monitor", "?concept=c&view=agent&agent=agent_payments"],
  ["d1-canvas", "?concept=d&view=agent&agent=agent_payments"],
  ["d2-create", "?concept=d&view=create"],
  ["d3-go-live", "?concept=d&view=agent&agent=agent_frontdesk&panel=go-live"],
  ["e1-runs", "?concept=e&view=agent&agent=agent_payments"],
  ["e2-edit", "?concept=e&view=agent&agent=agent_payments&panel=edit"],
  ["e3-create", "?concept=e&panel=create"],
  ["x1-advanced", "?concept=a&view=agent&agent=agent_frontdesk&tab=agent", async (p) => {
    await p.getByRole("button", { name: "Advanced settings" }).click(); await p.waitForTimeout(500)
  }],
  ["x2-context-add", "?concept=a&view=agent&agent=agent_frontdesk&tab=agent", async (p) => {
    await p.getByRole("button", { name: "Add", exact: true }).first().click()
  }],
  ["x3-greeting", "?concept=a&view=agent&agent=agent_payments&tab=agent", async (p) => {
    await p.getByRole("button", { name: /Greeting and failure message/ }).click()
  }],
]
const browser = await chromium.launch({ channel: "chrome", headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "dark" })
for (const [name, q, act] of shots.filter(([n]) => !process.argv[3] || n === process.argv[3])) {
  const page = await ctx.newPage()
  try {
    await page.goto(BASE + q, { waitUntil: "networkidle", timeout: 60000 })
    await page.waitForSelector("[data-v3-concept]", { timeout: 30000 })
    await page.waitForTimeout(1200)
    if (act) { await act(page); await page.waitForTimeout(900) }
    await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82 })
    console.log("ok", name)
  } catch (e) { console.log("FAIL", name, e.message.split("\n")[0]) }
  await page.close()
}
await browser.close()
