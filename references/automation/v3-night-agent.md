> Superseded on 26 Sep 2026 by `v3-design-agent.md` (four runs a day). Kept for history.

# v3 night design agent · contract

Owner rules, 26 Sep 2026: the agent **starts every evening at 20:00** (Asia/Saigon, UTC+7), weekends included, so
the owner can check the plan before sleeping. It works through the night until the queue is done, posts the review,
then puts the Mac to sleep. The owner reviews the next morning and works **09:00 to 17:00**; when a feature wraps
early, the agent asks for the next pick **the same day**.
This file is the contract. Both scheduled tasks (`v3-night-design`, `v3-day-pick`) only say "follow this file".

## Control: ClickUp status is the queue, the tracker is the sheet

List **Studio v3 · P0–P3 feature board** `901115448379`. One task per PRD feature (`P0.1` …). The tracker
(https://claude.ai/artifact/6YZCRsJvpoBthj4fnm9XAb) mirrors it: one row per feature with Status, two ETAs and the
deliverables. The night run and the day check write rows to the tracker database (collection `features`, doc id =
feature id) through ArtifactData; the page reads them live.

| ClickUp status | Tracker status | Means | Who sets it |
|---|---|---|---|
| `Open` | Planned | in the sheet with an ETA | — |
| `in progress` | WIP | queued or being designed (several allowed, worked in id order across nights) | owner, or the agent's default pick |
| `in review` | Review | Figma + prototype delivered; the owner approves or asks for a redo | night run |
| `completed` | Done | approved and **locked**: Figma section frozen, commit recorded | owner (the agent never sets it) |
| `on hold` | Planned (parked) | parked | owner |

Row fields: `status`, `design_eta` (agent delivers for review), `lock_eta` (should be Done; two days later on a
working day; never after Fri 16 Oct), `web` (prototype at the journey start), `figma` (section URL), `commit` (short
SHA on design/v3, the lock), `locked_at`, `research` (vendor → Done/Partial/Not started), `updated`.

**Redo:** the owner moves the task back to `in progress` and comments the changes; the row shows WIP; the fix jumps
the queue that night. **Approve:** the owner moves the task to `completed` or replies `approve`; the day check
records `locked_at` and the commit on the row, adds a "Locked" comment on the task, and the design is frozen.

**Lock rule.** A Done feature is locked: its Figma section and its routes are never changed by later work unless the
change is inside the later feature's own scope or improves the locked design. In that case the agent keeps the
locked commit untouched, builds the change as part of the new feature, and names the touched locked ids in the
review post so the owner decides. The Plan phase lists locked ids every night.

Slack `#design-agent-reviews` (`C0C0D403FNF`) is the only message channel; never email. Replies are read only from
the owner's Slack id `U03A67AMB5M`, and only to apply a verdict, a pick or a steer (below).

## Night run · 20:00 until done (`v3-night-design`, cron `0 20 * * *`)

**One command, no idle waits.** The scheduled task starts caffeinate and runs one saved workflow,
`references/automation/v3-night-workflow.js`. The workflow pipelines the queue: the next feature's research and
design run while the previous feature builds; the prototype and Figma steps run one feature at a time (same
worktree, same file). Nothing waits for a human. The work takes as long as quality needs: no stretching, no rushing.

| Phase | Does |
|---|---|
| Plan | Queue from ClickUp: `change` fixes first, then `in progress` by id, max 8 a night; none → next `Open`. Also the list of locked ids (`completed`) and their routes, passed to every later phase |
| Research | One Sonnet agent per vendor (4+). Order (owner rule 26 Sep): **Refero MCP first**, then earlier research (feature `shots/` folders, `references/competitors/`, `references/research/`, Figma research boards), and the browser only when context is missing or the docs show something new or changed. Happy and rainy shots into `references/v3/features/<id>/shots/`, each tagged with its source |
| Design | JTBD for Sam (happy `.a`, rainy `.b`+), learnings, before → after, 3–5 directions, one pick, build spec. The first feature's directions trigger the **check-in post** (Slack + push): tonight's ids, directions, the pick, max 3 questions. It does not wait |
| Build | Reads the owner's Slack replies first (direction letter, skip), then the prototype on `design/v3`, gate, local commit, git-free preview deploy. Never push, never `--prod` |
| Figma | File `OIKZExT265nOJotBlmv2Ah`, page per phase, section `<id> · <title>`, child sections 1–8, native hero frames, rationale, red-marked research shots. Load `figma:figma-use` first |
| Track | ClickUp comment + `in review`; tracker row `features/<id>` via ArtifactData: status Review, web, figma, commit, research statuses, updated. Never `completed`, never `locked_at` |
| Report | Morning post (digest when several are in review; prototype link first), run log, release caffeinate, `pmset sleepnow` if the owner is idle ≥ 15 min. Never shut down |

The owner reviews everything; the agent never marks a task `completed`.

## Working day · 09:30 to 16:30 (`v3-day-pick`, cron `30 9-16 * * *`, hourly, silent unless needed)

1. Read owner replies in the channel since the last run (owner id only):
   `approve` → `completed`, then lock the tracker row: status Done, `locked_at` today, `commit` from the task's
   latest review comment, and a task comment "Locked <date> · <commit>" · `change: <notes>` → `in progress` +
   notes as a task comment, tracker row status WIP · `park` → `on hold` · a feature id → that task to `in progress`,
   row status WIP. Also mirror any status the owner changed by hand in ClickUp since the last run into the tracker.
2. **Step by step, never wait (owner, 26 Sep 2026).** One feature at a time. If no design run is active, the day
   check starts the next one itself, without asking: the lowest-id `in progress` task not yet in review, else the
   next `Open` task (moved to `in progress`). It runs the same workflow with `args.only = [<id>]` and
   `args.daytime = true` (no Mac sleep), then posts one line: `Started <id> <name> now.`
3. A run is active while `state.running` names a task still `in progress` and started less than 12 hours ago.
4. State between runs: `references/automation/state.json` (`running`, `picked`, `last_sync`).

## Weekends and unreviewed work

- Never wait for a verdict. Tasks in `in review` stay there; the next night takes the next `in progress` task, or
  the default pick, as usual.
- Saturday and Sunday: the day check asks at most once per day and never posts a last call.
- Feedback on an older task (`change: …`) jumps the queue: fix it first the next night.

## Guardrails

- The Mac must be on, plugged in, lid open, with the Claude app open at 20:00. A run due while the Mac sleeps
  starts on wake.
- No email, no secrets in commits or messages, never `main` / `staging` / `preprod`, never `--prod`, never touch
  `ng-console.agora.io`, never sign in or enter credentials in research.
- Post the morning review whatever state the work is in; release caffeinate before stopping, even on failure.
- The owner's review rules win: link first; reuse, don't redesign; empty first, quiet chrome; copy rules.
