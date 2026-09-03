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

## Sequencing default

Due month, then priority, then size. Today: 26 · 16 · 22 · 27 · 09 · 07 · 11 · 17 · 02 · 04 (all P0-Sep),
then 24 · 25 (P0-Aug, overdue), then the undated P0s (03 · 05 · 08 · 14 · 18 · 19 · 21 · 23), then P1/P2.
Owner calls first: 08 · 12 · 16 · 18.
