# P0.14 Change an agent people reach · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.14], a proposed Modify step from P0.8.h with no days budgeted, taken on the owner's request. No ClickUp comments on the task, so there are no change notes. Concept A is the surface.

## Job step

Sam changes an agent that people already reach, without surprising the people talking to that agent.

**Job statement.** When I change an agent that a number or a run points at, I want to know at the moment I save what that save reaches, hear it once myself, and watch the next sessions, so callers get the better version and I find out fast if it is worse.

**Why now.** The v3 API has no draft, no publish step and no versions: every `PATCH /agents/{id}` is what the next session gets. Today the builder shows one plain form on a live agent and nothing names the number it serves (`shots/before-01-agent-greeting-panel.png`). The row designs the honest state of that fact and leaves versions as a question for the API.

## Happy path · P0.14.a

Story: Sam wants to improve a live agent's greeting, so callers hear the better version without a broken session in between.

1. Sam opens Front desk, which `+1 415 555 0142` answers with, and opens **Greeting and failure message** from the System prompt row. The header's meta line reads "Changed Sep 19, 15:02 · Sessions since this change". `builder_opened`
2. Sam rewrites the greeting. The sheet's footer shows the line "+1 415 555 0142 answers with this agent, so the change reaches callers on their next session." beside **Cancel** · **Save** · **Save and test**. `surface_viewed {surface: live_change_notice}`
3. Sam presses **Save and test**. The save lands with the change stamp, the toast carries the same line, and the panel plays the new greeting on the version callers now get. `agent_updated {hasDeployment: true}`, `agent_audio_heard {agentVersion}`
4. Sam presses **Sessions since this change** in the header. Overview opens on Recent sessions narrowed to the change: empty at first, then the sessions on the new greeting as they arrive. `surface_viewed {surface: sessions_since_change, count}`

Done when: the line was on the screen before the save, the new greeting was heard on that version, and the since view is open within a minute of the save (median).

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.14.b | Sam saves a change that breaks the agent | The save reached callers at once; nothing in the API holds the earlier value. The since view reads "3 sessions since the 14:02 change · 2 failed" over the rows. **View last save** shows the PATCH and, under it, `studio · before this change` with the values Studio kept in the browser and one sentence: "To undo, put these values back and save. The API keeps no earlier versions." Sam reverts by hand; agent versions stay an API ask | `surface_viewed {surface: sessions_since_change, failed: 2}` |
| P0.14.c | Sam saves while sessions are running | The line gains a second sentence, "The 3 sessions running now keep the agent they started with." (batch reads the run's count, "The 10 sessions running now keep the agent they started with."; when the count is unknown the sentence drops it). The API team confirms the behaviour before launch (open question 1) | `surface_viewed {surface: live_change_notice, running: 3}` |
| P0.14.d | Someone else saved the agent first (412) | An `Alert` above the footer: "Someone saved this agent at 14:01, while you were editing. Their version is the one people reach now. Your edits are still here." with **Show their version**, which prints their value under it. Sam's draft stays in the editor, the baseline is theirs, and **Save** sends again with the fresh precondition; **Cancel** takes theirs (P3.5.d's sheet grows from this) | `operation_failed {operation: agent_update, code: 412}` |
| P0.14.e | Sam changes the deployment type of a live agent | P0.1.b's dialog, unchanged: "Number +1 415 555 0142 answers with this agent. Remove the agent from that number, then change its type." with **Open number** | `deployment_type_changed` never fires |
| draft | The agent has no deployment | No line in the footer, no change line in the header, nothing to watch: P0.4's row and sheet as they are | none |
| API change | The last change came through the API, so Studio has no change time | The header line reads "Last saved Sep 19, 15:02" and carries no door (P1.1.g); the next Studio save writes the stamp | none |
| unlinked | Sessions are not linked to agents yet (G4) | The since view reads "Arrives when sessions link to agents." in place of rows, never 0 (P1.3.b) | none |

Empty first: on a brand-new account nothing in this row renders until an agent has a deployment; the since view opens empty right after the save with one sentence and no control.

## Measures

- KPI: fewer than 1 in 10 live agent changes are undone within a day (`agent_updated` on agents with `channel_connected`, then `agent_reverted` within 24 h; `agent_reverted` is derived: an `agent_updated` whose changed fields return to their values before the previous one). The `before this change` record is how Studio can show the values; the server derives the event from field diffs, never from Studio.
- Counter metric: live changes saved with no heard test on that version, 30 % or fewer (`agent_updated {hasDeployment: true}` not followed by `agent_audio_heard {agentVersion: that updated_at}`). Above 20 % the PRD asks the API team for a draft and publish step.
- API: Missing. No draft, publish, version or revert on Agent; `updated_at` moves on label writes too, so `labels.studio_config_changed_at` is the change time; sessions since the change need the agent filter (G4, G12); the 412 precondition header is not yet confirmed in the spec (open question 3); running sessions keeping their agent is to be confirmed (open question 1).
