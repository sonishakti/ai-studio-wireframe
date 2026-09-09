# Daily design agent — protocol

Runs as a **cloud routine** (claude.ai/code/routines) every weekday at **07:00 Asia/Saigon**
(00:00 UTC). One feature per run. The routine's inline prompt only says "follow this file", so
**this file is the contract**: edit it here to change what the agent does tomorrow.

Repos checked out in the run:

| Checkout | Role | Write rules |
|---|---|---|
| `AgoraIO/ng-console` | live Console code; prototypes go here | branch **`design/sandbox` only**; never `main`, `staging`, `preprod`, never `--prod` |
| `AgoraIO-Community/ai-studio-console-redesign` (this repo) | design office: research, briefs, directions, run logs | push to `main` |

## 0. Preflight — stop conditions

1. ClickUp tools **and** Slack tools must be available. If either is missing: stop, change nothing.
2. Read, in this order: `ng-console/AGENTS.md`, `ng-console/docs/design/SANDBOX.md`, this repo's
   `CLAUDE.md`, `references/design-ops-protocol.md`, `references/ship-protocol.md`, and
   `references/research/07-vendors-fallback/` (`00-brief.md`, `01-jtbd.md`, `05-directions.html`) —
   that folder is the **format to mirror**.
3. Read the newest file in `references/automation/runs/` (if any) so you never redo yesterday's pick.

## 1. Pick exactly one feature

- Source of truth: ClickUp list **Design Tracker** `901114875662` (Convo AI › Design Tracker).
- Candidates: tasks in status `added`. Order: **01, 02, 03, 04, 05 first**, then ascending number.
- Skip a task when: its name carries `⚠ lock`, or `references/research/<nn>-*/05-directions.html`
  already exists (someone is on it), or yesterday's run log names it as blocked.
- Read the task description in full (JTBD · What it does · Research/UI/Final · Locks · Roadmap tasks)
  and **every linked roadmap task** with `clickup_get_task` (include `description`). If a task links a
  ClickUp doc ("design page"), read it with `clickup_list_document_pages` + `clickup_get_document_pages`.
- Overlap check in `ng-console`: `git log --all --oneline -i --grep=<keywords>` and
  `git branch -r | grep -i <keywords>`; note any teammate branch/PR that already touches the surface.
  Design **with** their work, not against it.

## 2. Research + brief (this repo)

Create `references/research/<nn>-<slug>/` with exactly these files:

- `00-brief.md` — intake brief, same headings as 07: **Scope** (roadmap tasks), **What the Console has
  today** (grep the real components, name files), **Already decided**, **Agora fact-check**
  (docs.agora.io; mark anything that needs an Engine change), **Competitor evidence**, then two headings
  the reviewer asked for: **What we need** (3–6 bullets, user-visible) and **Tech requirements**
  (contracts, fields, APIs, flags, dependencies, evidence/telemetry).
- `01-jtbd.md` — JTBD sentence (situation · motivation · outcome), personas, activation-linked success
  metric, Agora primitives involved.
- `05-directions.html` — **five directions A–E** as static mocks using the Console tokens (copy the
  scaffold from 07's file), each with a one-line thesis, rationale, and risks; an **audit table**
  scoring all five against: the design-ops protocol, perception laws, CTA/word budgets, state coverage
  (empty/loading/error/locked), accessibility, i18n; and a **Verdict** section that picks **one**
  direction and states the **design rationale** in five bullets.

## 3. Prototype (ng-console, `design/sandbox`)

- `git checkout design/sandbox && git pull --ff-only`. Commit prefix `design(<nn>):`.
- Port the picked direction into the real components (port **patterns**, not wireframe markup).
  Reuse existing UI primitives; one line per control; explanations behind InfoHint.
- Gate before commit: `bun run typecheck`, `bunx vitest run <affected files>`, `bunx biome check --write
  <changed files>`. If the gate fails and cannot be fixed, do not commit; report instead.
- If the prototype cannot be completed in one run, commit a coherent slice and write the remaining
  steps into `05-prototype-log.html` in the research folder.
- Push: `git push origin design/sandbox`.

## 4. Preview deploy (Vercel, preview only)

Git-triggered previews are blocked (commit author not linked to a Vercel seat), so deploy a git-free
export with the team token. Skip this step when `VERCEL_TOKEN` is not set and say so in the report.

```bash
rm -rf /tmp/ng-export && mkdir -p /tmp/ng-export
git -C ng-console archive --format=tar HEAD | tar -x -C /tmp/ng-export
cd /tmp/ng-export
vercel link --yes --project ng-console --scope agoraio --token "$VERCEL_TOKEN" && rm -f .env.local
vercel deploy --scope agoraio --token "$VERCEL_TOKEN" --build-env VITE_NG_CONSOLE_DESIGN_PREVIEW=true
```

Report the deployment URL the CLI prints. Do **not** try to alias it: the Developer seat cannot
manage domains on `agoraio/ng-console` (`vercel alias set` fails with "You don't have access to the
domain"), so every preview has its own URL. Never `--prod`. Never touch `ng-console.agora.io`.

## 5. Report — always, even when partial

1. ClickUp: move the task to `planning`; add a comment with links to the brief, directions, preview,
   and commits.
2. Slack: post **one** message to channel `#design-agent-reviews` titled
   **Review: <Feature name> Design** with: What we need (3 bullets) · JTBD (1 line) · Tech requirements
   (3 bullets) · Design rationale (3 bullets) · Links: Vercel preview, `05-directions.html`, `00-brief.md`,
   ClickUp task, commits · a closing line asking for **approve / change / park**.
   Add a short **Team activity** footer: the 3–5 most recent merged PRs or branches in `ng-console`
   that touch the same surface.
3. Write `references/automation/runs/YYYY-MM-DD.md` (feature, decisions, links, blockers, what tomorrow
   should do), commit, `git push origin main`.

## Guardrails

- No email, ever. Slack is the only notification channel.
- No secrets in commits or messages. Do not paste tokens into the run log.
- Never modify `.github/`, release branches, or Vercel project settings.
- Finish the report before the run ends, whatever state the work is in.
