---
name: design-feature
description: >
  Run the Design Ops Protocol for one tracked feature: intake → JTBD → interviews →
  competitor teardown → synthesis → prototype → proposal → designer review → push, updating
  the ClickUp Design Tracker as it goes. Trigger on: "/design-feature 16", "let's do the phone
  number feature", "start research on voices", "what's next on the design tracker", "update
  the tracker", or any request to research, design, or review a feature from the Q3 roadmap
  design backlog.
version: 1.0.0
user-invocable: true
---

# /design-feature — one feature through the design pipeline

Protocol: `references/design-ops-protocol.md` (read it first, every time).
Tracker: ClickUp list `901114875662` (Convo AI › Design Tracker), workspace `8556478`.
Backlog: `references/design-backlog-q3-roadmap-2026-09-03.html`.

## Arguments

```
/design-feature <nn|name>            run the next incomplete step for that feature
/design-feature <nn> --step <0-8>    run a specific step
/design-feature next                 pick the next feature by the sequencing default
/design-feature status               print the tracker as a table (Research · UI · Final per row)
```

## Procedure

1. **Load the row.** `clickup_filter_tasks` on list `901114875662`, match `<nn> ·` in the name, then
   `clickup_get_task` for the description. Parse the template labels (Tags · JTBD · What it does ·
   Research · UI · Final · Locks · Roadmap tasks · Research folder). Never scrape ClickUp in a browser.
2. **Decide the step.** If `--step` given, run it. Else: no `00-brief.md` → step 0; Research=Pending
   → steps 1–3; Research=WIP with `04-synthesis.md` incomplete → step 4; Research=Done and no
   prototype log → step 5; prototype but no proposal → step 6; proposal and Final=N → step 7;
   Final=Y → step 8 or "done".
3. **Gates before doing anything.**
   - ⚠ lock in Tags or Locks and no owner decision recorded in `00-brief.md` → write the question,
     set status `clarified`, ask in chat, stop.
   - Step 1 Agora fact-check fails → report which primitive is missing, stop.
   - Step 3 needs the user signed in to each competitor → ask, wait, never enter credentials.
4. **Run the step** exactly as the protocol describes, writing outputs into the feature's research
   folder. Use the existing skills for the passes the protocol names: `/evaluate` (baseline),
   `/measure` (success event), `/fortify` · `/include` · `/articulate` (pre-review), `/specify` (handoff).
   Simulated user tests: `.claude/workflows/user-test.js`.
5. **Update the tracker** via `clickup_update_task`: rewrite the description template with the new
   Research / UI / Final values and any new links (Figma, proposal artifact); set the list status per
   the stage map; set custom fields if they exist (`clickup_get_custom_fields` on the list first).
6. **Report** in chat: step run · what was produced (paths + links) · what changed in the tracker ·
   the next step and what it needs from the user (logins, recruits, an owner call).

## Hard rules

- Connector before browser. The only browser work in this skill is competitor screenshots.
- Don't re-research what `LEARNINGS.md` already settles; cite it.
- Copy discipline, `--stroke` on every control, additive-only changes, mock data only.
- Ship protocol on every prototype commit (deploy · annotated shots · log).
- One feature at a time unless the user groups them; say when grouping.
