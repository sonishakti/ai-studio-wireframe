# 08 · Versioning & release ⚠ lock — intake brief (2026-09-10)

Tracker: https://app.clickup.com/t/868m0menv · status → **clarified** (owner-call gate, protocol rule 3). No research,
no directions, no prototype until the owner answers the question at the bottom.

## Scope (from the roadmap tasks)
- **868kykbdw** Add agent versioning, release environments, and rollback — *P0.* Editable drafts separate from immutable
  published versions; change history + readable comparison (prompts, voices, tools, knowledge, flows, guardrails, channel
  settings); name/describe releases; restore a past version **as a new draft**; environment labels (development · staging ·
  production); moving a label deploys the selected version **without rebinding** numbers, widgets, campaigns, integrations;
  the same version references in Studio, public APIs, SDKs, simulations, evals, campaigns, session history; audit history
  (actor · previous version · selected version · environment · time). 4 dependencies.
- **868kykbez** Run production A/B tests across agent versions — *P0.* Experiments across two or more published versions;
  weighted traffic allocation per channel; sticky assignment per conversation; variant recorded on every session; results by
  variant (volume · business outcomes · quality · latency · cost · confidence); start / pause / reallocate / stop / pick a
  winner. Owns traffic allocation + experiment lifecycle; production evaluation owns the scoring. **This is the collision.**
- **868kyjb87** Simulate a pending agent change from Studio configuration — *P0.* A Simulate action on the major
  configuration surfaces runs the *pending* configuration against a scenario or test set while production stays unchanged;
  shows artifacts + comparison with current; never publishes.

## What the Console has today (ng-console `design/sandbox`, rebased on staging 2026-09-10)
- **Publish flow**: `src/components/console/agent-publish-dialog.tsx` (642 lines) — project + App ID, name, description,
  **version note** (`pages.consoleShell.versionNote`), cost overview; `POST /api/studio-v2/projects/$projectId/agent/
  $agentId/publish` (`src/server/studio-v2/handlers.ts`).
- **Version history**: `src/components/console/agent-version-history-sheet.tsx` (151 lines) — rows `{version, versionId,
  createdAt, note, restorable}`, sorted newest first, live version marked, **Restore** button (`onRestore(versionId)` →
  authoring action `{kind:"restore-version"}`); `GET …/version-history`. i18n `pages.agentDetail.versionHistory*`.
- **Draft vs live**: the authoring session (`src/features/agents/agent-detail-authoring/agent-detail-authoring-session.ts`)
  autosaves a draft; "unpublished changes" badge in the shell (`console-shell.tsx` ~:1462, ~:2875); deployment status
  `live | paused` (`src/lib/agents/agent-deployment-history.ts`).
- **No** environment labels, **no** diff/comparison view, **no** experiments, **no** "simulate pending change" (the right-rail
  Test tab previews the *current draft* live — `agent-detail-right-panel.tsx`, `agent-preview-workspace.tsx` — which is
  the closest thing to 868kyjb87 and already runs the pending configuration without publishing).

## Already decided (don't re-litigate)
- **Builder has no A/B.** Test Strip v8 (2026-07-30): one test entry region (Talk · Run simulations · verdict line);
  **A/B prompt testing removed, vetoed** (v6, 2026-07-29). The backlog note (2026-09-03) proposes: *"a Monitor-side
  experiment surface tied to versioning, keeping the builder single-track."*
- Honesty floor (v7): Live/pending truth ("{n} sections edited · not live"), deploy blockers + Fix→, destructive warnings.
- LEARNINGS §8: ElevenLabs **Branches** (git-style agent versioning) is the white-space concept worth borrowing; §13 publish
  cliff concepts P-1..P-5: staged rollout (self → team → % traffic → all), one-click rollback, first-failure observability,
  branch-style version preview.
- North star: first live deployment carrying traffic → paid usage; publishing alone earns $0. Rollback protects that line.

## Agora fact-check
- Engine join contract exposes `pipeline_id` (a published Studio agent as the base configuration; `properties` overrides
  it) — the runtime handle a version label would resolve to. No environment, experiment or traffic-split field exists in
  the Engine API (`agora-agents@2.4.0` `StartAgentsRequest`; https://docs.agora.io/en/ai/release-notes). Versioning,
  environments and experiments are **Studio-backend** work; the Console can only render what Studio's `version-history`
  and `publish` endpoints return today.
- Session evidence per variant needs `properties.labels{}` (custom key-value bound to the agent, returned in every
  notification payload) or a Studio-side variant field — `labels` is the only contract primitive that could carry
  `experiment_id / variant` today.

## Locks that stop this feature at step 0
Production A/B (868kykbez) collides with the builder "no A/B" lock. Research first is re-litigation.

## Owner question (blocking)
**Where does production A/B live?**
1. **Monitor-side experiment surface** (backlog proposal): experiments are created from Monitor/Sessions over two published
   versions; the builder stays single-track; results appear as a variant column in session history. Versioning + rollback
   ship first (868kykbdw), experiments consume them.
2. **Go Live / deploy panel**: allocation is a deployment property next to the version label ("Production: v12 · 10 % v13").
3. **Not in scope for design**: engineering ships allocation via API only; the Console shows the variant on sessions.

Until answered: no `01-jtbd.md`, no directions. When answered, the intake proceeds with 868kykbdw (versions · environments
· restore-as-draft · comparison) as the primary slice and 868kyjb87 folded into the existing Test rail ("this preview runs
your unpublished draft" — the Console already does this, it just doesn't say so).
