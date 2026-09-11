# Design Ops Protocol — one feature, research to review

> **Standing, user-directed (2026-09-03).** Runs via `/design-feature <nn>`. Tracker lives in ClickUp:
> **Convo AI › Design Tracker** — list `901114875662`,
> https://app.clickup.com/8556478/v/l/li/901114875662. One task per feature (28), each linking the
> Q3 roadmap tasks it covers (list `901114080734`). Backlog source:
> `references/design-backlog-q3-roadmap-2026-09-03.html`.

## The design process — seven stops (standing, user-directed 2026-09-11)

This is what anyone — designer, PM, or agent — sees when a feature is asked to be designed or built. The
detailed how-to for each stop is in **Steps 0–8** below; the seven stops are the contract and the shape of
every artefact. Nothing is "done" until all seven exist for the feature.

| # | Stop | What must exist | Where it lives |
|---|---|---|---|
| 1 | **JTBD — all types** | One headline JTBD, then the **happy scenario first**, then every **rainy / unexpected** scenario (empty states, vendor down, caller silent, wrong language, limits hit, permissions off…). Each scenario is one sentence in the user's words. | `research/<nn>-*/01-jtbd.md` · `tracker-board.json` → `scenarios.{happy,rainy}` · Figma section **1 · JTBD** |
| 2 | **Research, happy + rainy, ≥ 4 competitors** | Screenshots (docs **and** logged-in product) from Vapi · Retell · ElevenLabs · LiveKit at least, for the happy path **and** the rainy paths. An empty state is not research: **act in the environment** to reach the populated state — enable the setting, run a short test call, open the panel — using `scripts/drive.mjs` on the signed-in profile. Every shot carries red outline marks + tags on what to look at. | `references/competitors/{public-docs,product/<vendor>}/` · `secondary[]` with `scenario: happy|rainy`, `marks[]` · Figma **2 · Research** (one row per scenario, four vendor columns) |
| 3 | **Learnings** | 3–5 sentences: what the competitor environments taught us that changes our design (patterns to adopt, to avoid, the whitespace). Each names its evidence shot. | `00-brief.md` §Competitors · `learnings[]` · Figma **3 · Learnings** |
| 4 | **Diverge 3–5, audit one** | Three to five directions, each a paragraph + low-fi, audited against the JTBD and the learnings; one verdict with the reason. | `05-directions.html` · `directions[]`, `verdict` · Figma **4 · Directions** |
| 5 | **Prototype for the viewer** | The chosen direction built on the live Console (`design/sandbox`, design mode = no login), deep-linked; red-marked screenshots of what changed. | `05-prototype-log.html` · `open[]` (Preview, Review page) + `shot` · Figma **5 · Prototype** |
| 6 | **Hero screens for the designer** | A few native, editable Figma frames of the happy scenario (real text layers, auto-layout where it matters) placed next to the research, so copy and quick UI changes can be made in Figma without touching code. Rationale listed underneath each hero. | Figma **6 · Hero screens** (node ids recorded in `hero[]`) |
| 7 | **Tracker** | The one sheet that links ClickUp task ↔ Figma section ↔ prototype ↔ status tag, in ClickUp order, never reshuffled. | `tracker-board.json` → Design Delivery Board (Artifact) + ClickUp task links |

**Figma layout (page *Sandbox New*, parent section *Design Tracker · research & proposals*):** one section per
feature `NN · <ClickUp name>`, containing seven child sections in this order — `1 · JTBD`, `2 · Research`,
`3 · Learnings`, `4 · Directions`, `5 · Prototype`, `6 · Hero screens`, `7 · Tracker`. A reviewer scrolls to the
feature, then walks the stops top to bottom. Everything is generated from `tracker-board.json` by
`scripts/build-figma-sections.mjs` + `use_figma` (see *Review loop*); hero screens are hand-built once per chosen
prototype and then owned by the designer.

**Rainy-day rule:** "observability disabled", "no calls yet", "no logs" are rainy scenarios, not research
results. Reach the real state first (enable, run a 30-second test call, wait for ingestion), capture it, and
only then keep the empty state as its own rainy shot. Never buy, upgrade a plan, or change billing to get there;
if a state needs money or the user's credentials, stop and ask.

## Rules that sit above every step

1. **Connector before browser.** ClickUp, Figma, Slack, Linear all have MCP/plugin tools. Use them.
   Browser automation is for things with no API — a competitor's logged-in UI is the only case here.
2. **Don't re-litigate.** `LEARNINGS.md` + `references/` are paid-for research. Read before researching.
3. **Owner-call gate.** Features marked ⚠ lock (08 · 12 · 16 · 18, plus templates in 09 and capacity
   SKUs in 22) stop at step 0 until the owner decides. Research first is just re-litigation.
4. **Agora fact-check gate.** Cite `docs.agora.io/en/` for every primitive. If the API doesn't expose
   it yet, stop and report — design against a spec, not a wish.
5. **Copy discipline + stroke tokens** apply to every prototype (CLAUDE.md working rules).
6. **I never enter credentials.** Competitor logins are yours; I drive the tab after you sign in.

## The tracker

Each feature task's description carries the row in a fixed template — keep the labels exact, the
skill parses them:

```
**Tags:** <surface> · <P0-Mon>
**JTBD:** User wants to …
**What it does:** …
**Research:** Pending | WIP | Done · **UI:** None | Exists | Partial | Shipped · **Final:** N | Y
**Locks:** …
**Roadmap tasks:** - [name](https://app.clickup.com/t/<id>) …
**Research folder:** references/research/<nn>-<slug>/
```

Custom fields (add in the ClickUp UI — the API cannot create fields; once they exist, the skill
writes them alongside the description):

| Field | Type | Options |
|---|---|---|
| JTBD | Text | — |
| What it does | Text | — |
| Research | Dropdown | Pending · WIP · Done |
| UI | Dropdown | None · Exists · Partial · Shipped |
| Final | Checkbox | — |
| Figma | URL | competitor board + prototype frames |
| Tags | Labels | builder · voices · engine · monitor · test · deploy · telephony · knowledge · billing · workflows · governance · platform · onboarding · devx |

List statuses (inherited from the Convo AI folder) map to pipeline stage:
`added` = not started · `clarified` = research (steps 1–4) · `planning` = prototyping (5–6) ·
`in version` = designer review (7) · `delivered` = Final Y (8).

Evidence lives in the repo, not in memory: `references/research/<nn>-<slug>/` with
`00-brief.md`, `01-jtbd.md`, `02-interviews/`, `03-competitors/`, `04-synthesis.md`,
`05-prototype-log.html`, `06-proposal.html`, `07-review.md`.

## Steps

### 0 · Intake
- Pull the feature task + its linked roadmap tasks via ClickUp API (`clickup_get_task`).
- Baseline: `/evaluate` the surface Studio_X has today. Note what exists, what's partial, what's missing.
- Read `LEARNINGS.md` sections + `references/` that touch this feature. List what's already decided.
- If ⚠ lock: write the owner question in `00-brief.md`, set status `clarified`, post the question in chat, **stop**.
- Output: `00-brief.md` — scope, existing surface, prior decisions, open questions.

### 1 · JTBD + success metric
- Write the JTBD statement (situation · motivation · outcome). One sentence, user's words.
- Define the activation-linked success event (`references/event-taxonomy-review.md`, `/measure`).
  Time-on-page, session length, DAU are rejected KPIs.
- Agora fact-check: which `docs.agora.io/en/` primitives carry this? Which API fields? If none — stop, report.
- Output: `01-jtbd.md`.

### 2 · People
- Interview guide (6–8 questions, no leading, ends with "what did you try before?").
- Simulated pass first: `.claude/workflows/user-test.js` with 3 personas on the *current* surface — cheap, finds the obvious.
- Real sessions: the customers tagged on the roadmap tasks are the candidates (Entel · Concentrix · Moveo · Hilton · Cresta). You recruit; I prep the guide and synthesize notes.
- Synthesis: goals · motivations · problems · verbatims · surprises. Tag each insight with its source.
- Output: `02-interviews/guide.md`, `02-interviews/<session>.md`, `04-synthesis.md` (started).

### 3 · Competitors
- Targets: Vapi · Retell · LiveKit (+ ElevenLabs, Bland where relevant — all exist as `Source` labels on the roadmap list).
- You sign in to each in Chrome. I navigate to the equivalent feature, capture screenshots + notes
  (Claude in Chrome — legitimate here: no API exposes a competitor's UI).
- Push screenshots to the Figma **"Convo AI — Competitor research"** file via `figma-cli`
  (the Figma MCP is read-only). One page per feature, one frame per competitor, caption = what to
  learn from it. Add the Figma link to the tracker task.
- Teardown: patterns to adopt · patterns to avoid · gaps nobody fills (the whitespace).
- Output: `03-competitors/<vendor>-*.png`, `03-competitors/teardown.md`, Figma page link.

### 4 · Merge
- One research brief: JTBD · top insights · competitor patterns · Agora constraints → **3–5 design
  principles** for this feature (each principle names the evidence behind it).
- Set Research = Done in the tracker.
- Output: `04-synthesis.md` (complete).

### 5 · Prototype
- Diverge → converge: 2–3 directions sketched as low-fi (ASCII or quick HTML), pick one with a stated reason.
- **Where to build (2026-09-08):** if the surface exists in the live Console, build on
  `AgoraIO/ng-console` branch **`design/sandbox`** (sibling folder `../ng-console`, its own Claude project) —
  real data models, automatic Vercel Preview per push. If the surface doesn't exist there yet, build in
  `studio_x_2/` with mock data. Either way additive only.
- Branch convention on ng-console: `design/sandbox` = the one scratch branch, never merges, rebased on
  `staging`; `design/<nn>-<slug>` = a shippable slice cut from `origin/staging` → PR → `staging`.
  ⛔ Never push to `main`, `preprod`, `staging`. See `ng-console/docs/design/SANDBOX.md`.
- Passes before review: `/fortify` (empty · error · loading · edge), `/include` (a11y — `--stroke`
  on every control, both themes), `/articulate` (copy — no new UI text beyond the reference without asking).
- Output: working prototype on the live build + `05-prototype-log.html` (ship-protocol log with annotated shots).

### 6 · Propose
- Flow doc with the Agora-specific wiring: docs URLs, API fields, how it works in *our* context
  (e.g. `credential_mode` per component, `geofence.area`, SIP ladder events).
- `/measure`: the success event from step 1 is added to `lib/analytics.ts` taxonomy.
- Output: `06-proposal.html` (styled HTML + Artifact, per doc standard).

### 7 · Review
- Ship protocol: commit · push · `vercel deploy --prod --yes` · red-annotated screenshots (name + why) · HTML log.
- Set status `in version`. Designer reviews on the live build; feedback lands in `07-review.md`.
- Iterate until the designer says done. Then Final = Y, status `delivered`.

### 8 · Push
- Merge one feature at a time (features can be grouped when they share a surface — say so in the log).
- Update the tracker task (description template + custom fields) via API.
- Decision-log entry in `LEARNINGS.md` §20 for any non-trivial choice.
- `/specify` handoff spec for engineering.

## Review loop — one path from ClickUp to the live prototype (standing, user-directed 2026-09-11)

Every feature is reviewable the same way, by anyone, from any account or agent. The reviewer goes:
**Figma page → feature → JTBD → competitors → our proposal → prototype link.** Nothing is delivered until all
five stops exist.

| Stop | Where | Source of truth |
|---|---|---|
| 1 · Delivery board | Artifact **Design Delivery Board** https://claude.ai/code/artifact/a1d57eb9-2121-484c-b2f6-2d728cbd1466 — one row per ClickUp task, ClickUp order, never reshuffled; status tags exactly `Not Done` · `WIP` · `Pending review` · `Done` | `references/tracker-board/tracker-board.json` → `node scripts/build-tracker-board.mjs` → republish the same URL |
| 2 · Figma sandbox | File **Agora Studio X** `xaAgeioGlZosBsRquDXLvI`, node `2861-52038` — one section per feature named `NN · <ClickUp name>`, containing in order: **JTBD** (the sentence from `01-jtbd.md`) · **Competitors** (Vapi · Retell · ElevenLabs · LiveKit screenshots, docs + product, source URL under each) · **Our proposal** (red-marked screenshots of the prototype, one marker per shot, name + why) · **Prototype** (the design-mode preview URL and the review Artifact) · **Status + decisions** (the board's tag and the owner questions). Two ways to populate it: (a) **import-ready SVG boards** — `node scripts/build-figma-boards.mjs` writes `references/tracker-board/figma/NN · <name>.svg`, one per researched feature; drag the file onto the page and Figma creates an editable frame (text stays text, screenshots become image fills); (b) **programmatic** (done 2026-09-11, the standing route): with the Figma connector authorized (see *Figma write access* below) the agent calls `upload_assets` for N slots, POSTs each SVG with curl (`-F 'file=@NN.svg;type=image/svg+xml;filename=NN'`, ASCII names — rename on the canvas), then one `use_figma` script moves each imported frame into its section. All feature sections live inside the parent section **Design Tracker · research & proposals** (`3122-40583`, below the Jul 29–Aug 4 section); section ids per feature are in `tracker-board.json` → each row's `open` link labelled *Figma*. **Image quality:** Figma's SVG importer resamples embedded rasters to ~800 px, so every screenshot must be re-bound afterwards: `node scripts/build-figma-boards.mjs --images NN` prints the files in document order; `use_figma` `frame.findAll(n => n.fills?.some(f => f.type === "IMAGE"))` returns the rectangles in the same order; request `upload_assets` slots, POST each full-res PNG (multipart `file`, ≤10 MB, ≤4096 px per side), take the `imageHash` from each POST response and set it yourself — `rect.fills = [{type:"IMAGE", scaleMode:"FILL", imageHash}]`. Two gotchas: passing `nodeIds` to `upload_assets` returned success but did **not** change the fills; and `figma.getImageByHash(hash)` is `null` until some node references the hash, so bind first, validate after (`getSizeAsync`). Re-import = delete the old frame inside the section, upload the rebuilt SVG, move it in, re-bind the images.

**Red review marks (standing, user-directed 2026-09-11):** every competitor screenshot carries thin red outlines (3 px, no fill, radius 4) around the controls the reviewer should look at, each with a small red tag (Inter Semi Bold 11, white, ≤ 3 words) sitting just above the outline. Outline only — nothing is hidden. Marks live in `tracker-board.json` → `secondary[].marks = [{box:[x0,y0,x1,y1] as fractions of the image, tag, why}]`; the SVG builder draws them, and in Figma they are sibling nodes of each screenshot, grouped as `marks · <rect id>` inside the board frame, so they can be nudged or deleted without touching the image. Regions are located per feature row (the same screenshot gets different marks on rows 01, 04 and 07) by Sonnet subagents that read the PNG and return normalized boxes (≤ 3 per screenshot, each under ~45 % of the image). Our-proposal shots are already marked at capture time by `scripts/annotate-shots.mjs` and are left alone. Either way the board row is the source and the Figma section mirrors it. | the same JSON row + the PNGs under `references/research/<nn>-*/05-shots/` and `references/competitors/` |
| 3 · Secondary research | Screenshots, not fetched text: for each feature the four vendors' docs page **and** logged-in product screen. Captured with `CHROME_PROFILE=$HOME/.agora-design/chrome-competitors node scripts/annotate-shots.mjs <config> <outDir>` after the user signs in once in a headed Chrome on that profile | `references/competitors/public-docs/`, `references/competitors/product/<vendor>/`; cited in `00-brief.md` |
| 4 · Our proposal | Red-marked shots of the real page in design mode (`bunx vite dev --config design-kit/vite.config.ts` in ng-console) | `references/research/<nn>-*/05-shots/`, `05-prototype-log.html` |
| 5 · Prototype link | The design-mode Vercel build of `design/sandbox` (git-free export, `vercel.json` `buildCommand` = the prototype config) deep-linked to the feature's page | `ng-console/docs/design/SANDBOX.md` |

Delivery order in chat: **the link first**, then the board row. Then a desktop notification (`PushNotification`)
— the user is not always at the terminal. Screenshot, browse and parse work runs on Sonnet/Haiku subagents;
design verdicts and builds stay on the strongest model.

### Figma write access — one-time setup per person and machine (verified 2026-09-11)

Two Figma MCP servers exist and only one can edit the canvas:

| Server | Shows up as | Tools | Can edit? |
|---|---|---|---|
| Figma desktop app, local Dev Mode server | `Figma` (kind desktop, 10 tools: get_metadata, get_screenshot, get_design_context, …) | read-only | **No** — Figma ships "write to canvas" on the remote server only |
| Figma **remote** MCP server `https://mcp.figma.com/mcp` | `plugin:product-management:figma` (the `figma@claude-plugins-official` plugin) **or** the claude.ai **Figma connector** | `use_figma`, `create_new_file`, `whoami`, `search_design_system`, `upload_assets`, `generate_figma_design` + the read tools | **Yes** (beta, free for now) |

The remote server needs a Figma OAuth sign-in. Claude cannot run that flow inside a session — the user does it once, then every later session on that machine and account has the write tools.

**Path A — Claude Code plugin (works in the terminal and in the desktop app's Code tab)**
1. Open Terminal in the project folder and start an interactive session: `claude`.
2. Type `/mcp`. Pick `figma` (listed as `plugin:product-management:figma`, or `figma` if the standalone plugin is installed with `claude plugin install figma@claude-plugins-official`).
3. Choose **Authenticate**. A browser opens on figma.com — sign in with the Figma account that has **edit** rights on *Agora Studio X* (Dev or Full seat on the Agora plan) and approve.
4. Back in the terminal `/mcp` shows the server as connected. The token lives in the macOS Keychain (`Claude Code-credentials`) and is reused by every later session of this Claude account on this Mac, including the desktop app.
5. Start (or restart) the Code-tab session. Any agent then verifies with `session_connectors_status` (row `plugin:product-management:figma` = `connected`) and `ToolSearch select:use_figma,whoami,create_new_file`.

**Path B — claude.ai connector (works in claude.ai and the desktop app; nothing to install)**
1. Claude desktop app → Settings → Connectors → *Browse connectors* → **Figma** → Connect → same Figma sign-in.
2. In the Code tab composer, `+` → Connectors → switch **Figma** on (or let an agent call `set_session_connector_enabled("Figma", true)`; it takes effect next turn).
3. Verify: `session_connectors_status` shows a row **Figma** of kind `connector` with more than 10 tools.

**First call every agent makes after either path**
1. Load the `figma:figma-use` skill.
2. `whoami` → confirm the plan and that the seat is Dev/Full (view/collab seats are capped at 6 calls a month and cannot write).
3. Read-only smoke test on the file: `use_figma` with fileKey `xaAgeioGlZosBsRquDXLvI` and script `return figma.root.children.map(p => ({id: p.id, name: p.name}))` — expect a page **Sandbox New** (`2861:52038`).
4. Then write: `await figma.setCurrentPageAsync(page)` once per call, ≤ 10 operations per call, load Inter before touching text, return every created node ID, screenshot to verify.

**Done 2026-09-11 via Path B** (claude.ai connector, account shakti.soni@agora.io, Full seat on Agora Lab, Inc.): 14 boards imported and sectioned under `3122-40583`.

**Rules** — the sign-in is personal: each teammate signs in with their own Figma account, once per machine (Path A) or once per claude.ai account (Path B). Never paste tokens into chat, files or env. If neither path is authorized the fallback stays the import-ready SVG boards in `references/tracker-board/figma/` (drag onto the page).

## Effort + capacity (agreed 2026-09-04)

**Team:** one designer + Claude. **Window:** Sep 2026 → Feb 2027 (6 months).
26 weeks × 5 days × 70 % ≈ 90 designer-days; Claude roughly doubles prototype throughput →
**~180 effective days**. Total scope below is **≈356 days** — about half fits. The rest is
explicitly deferred, not silently squeezed. ClickUp carries the estimate on every task
(native *Time Estimate*, days × 8 h) and start/due only on the 14 scheduled features.

Sizing: S ≈ one control group on an existing surface · M ≈ a new section or flow ·
L ≈ a new surface · XL ≈ a new surface with a purchase / compliance / canvas dimension.
Days are designer-days by stage: research (JTBD + interviews + competitor teardown + synthesis),
proto (build + copy / a11y / edge passes), review (designer iterations).

| # | Feature | Size | Research | Proto | Review | Total | Why |
|---|---|---|---|---|---|---|---|
| 01 | Voice picker & recommendations | M | 5 | 5 | 2 | 12 | Preference test + cloning consent flow |
| 02 | Turn-taking & listening | M | 5 | 4 | 2 | 11 | Card sort (R1) shared with 03–05 |
| 03 | Recognition & failover | M | 3 | 4 | 2 | 9 | Rides R1; failover UI is new |
| 04 | Greeting, filler & disclaimer | S | 2 | 3 | 1 | 6 | Extends the greeting field |
| 05 | Call behavior rules | M | 3 | 4 | 2 | 9 | Rides R1; DTMF/IVR is a new pattern |
| 06 | TTS expression & personality | S | 2 | 3 | 1 | 6 | Controls only |
| 07 | Vendors & provider fallback | M | 2 | 5 | 2 | 9 | Research done; fallback UI is new |
| 08 | Versioning & release ⚠ | L | 6 | 8 | 3 | 17 | Envs + rollback + A/B placement |
| 09 | First run, templates & import | L | 3 | 8 | 3 | 14 | Research done; gallery + import flow |
| 10 | Session & call logs | M | 3 | 5 | 2 | 10 | Wave 1 base; audio/transcript alignment |
| 11 | SIP & latency diagnostics | S | 1 | 2 | 1 | 4 | Shipped Wave 2; verify vs final payloads |
| 12 | Live monitoring & operator controls ⚠ | L | 6 | 8 | 3 | 17 | New real-time surface |
| 13 | Dashboards & alerts | L | 6 | 8 | 3 | 17 | Dashboard builder + alert rules |
| 14 | Evals & scorecards | XL | 8 | 10 | 4 | 22 | Whole eval loop (R4) |
| 15 | Simulations | M | 3 | 5 | 2 | 10 | Rides R4; panel exists |
| 16 | Phone number purchase ⚠ | XL | 8 | 12 | 4 | 24 | Buy → verify → assign + billing + compliance |
| 17 | SIP trunk setup | L | 5 | 8 | 3 | 16 | 8 telephony sub-features |
| 18 | Channels ⚠ | XL | 8 | 12 | 4 | 24 | 3 new channels + SDK/widget |
| 19 | Tools & connectors | L | 5 | 8 | 3 | 16 | Marketplace + tool builder |
| 20 | Knowledge sources | M | 3 | 5 | 2 | 10 | Crawl config on existing KB |
| 21 | CRM & contacts | L | 5 | 8 | 3 | 16 | Context + write-back + audiences |
| 22 | Usage, credits & concurrency | M | 3 | 6 | 2 | 11 | Research done; purchase path new |
| 23 | Handoffs & routing | XL | 8 | 14 | 4 | 26 | Workflow canvas — biggest single surface |
| 24 | Retention, PII & compliance | M | 4 | 5 | 2 | 11 | Settings-heavy, policy-driven |
| 25 | Developer platform | S | 2 | 3 | 1 | 6 | Surfaces exist |
| 26 | Unified login | S | 3 | 2 | 1 | 6 | Mostly stakeholder interview |
| 27 | Responsiveness audit | M | 1 | 8 | 2 | 11 | ~90 routes to sweep |
| 28 | DevX & docs | S | 2 | 3 | 1 | 6 | Outside Studio_X — parked |
| | **Total** | | **125** | **178** | **65** | **≈356** | |

## Waves (the sequencing — locked 2026-09-04)

| Month | Start → Due | Features | Days | Logic |
|---|---|---|---|---|
| Sep 2026 | 09-07 → 09-30 | Owner calls on 08·12·16·18 · **26 · 11 · 07 · 22** | 30 | Research already done → quick wins; unblock the locks |
| Oct 2026 | 10-01 → 10-30 | **02 · 03 · 04 · 05** | 35 | One card sort (R1) covers all four builder-control features |
| Nov 2026 | 11-02 → 11-30 | **16 · 10** | 34 | Numbers are the biggest activation bet; logs are half-built |
| Dec 2026 | 12-01 → 12-23 | **14 · 15** | 32 | One eval-loop study (R4) covers both |
| Jan 2027 | 01-04 → 01-29 | **18 · 08** | 41 | Channels + versioning — both depend on Sep owner calls |
| Feb 2027 | 02-01 → 02-26 | **23 · 09** | 40 | Canvas last (biggest, least constrained); first-run closes the loop |

**Deferred (≈144 days, estimate only, no dates):** 01 · 06 · 12 · 13 · 17 · 19 · 20 · 21 · 24 · 25 · 27 · 28.
Cheap swaps if priorities move: 01 + 06 (18 days) can replace 09 in Feb. 17 · 19 · 21 are the painful cuts.

Note: the `P0-Sep` / `P0-Aug` / `P0-Oct` suffixes in each task's **Tags** line are the *engineering*
due months from the roadmap, kept as context. Design dates are the wave dates above, never those.
