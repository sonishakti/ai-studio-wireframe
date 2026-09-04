# Design Ops Protocol — one feature, research to review

> **Standing, user-directed (2026-09-03).** Runs via `/design-feature <nn>`. Tracker lives in ClickUp:
> **Convo AI › Design Tracker** — list `901114875662`,
> https://app.clickup.com/8556478/v/l/li/901114875662. One task per feature (28), each linking the
> Q3 roadmap tasks it covers (list `901114080734`). Backlog source:
> `references/design-backlog-q3-roadmap-2026-09-03.html`.

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
- Build in `studio_x_2/`, mock data only, additive only (Studio UI is frozen).
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
