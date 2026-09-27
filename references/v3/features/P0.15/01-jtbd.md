# P0.15 Retire an agent · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `row.md` (sheet row P0.15), a proposed Conclude step with no days budgeted, pending owner sign-off. Concept A is the surface. P0.14 left no `summary.md`; continuity comes from its row: the agent header's **···** menu, the `panel=` URL key, P0.1.b's "Remove the deployment first" dialog, and the G4 line "Arrives when sessions link to agents."

## Job step

Sam retires an agent without leaving a number or run pointing at nothing.

**Job statement.** When an agent is no longer needed, I want to see everything that still uses it, move or stop each thing, and then delete it on purpose, so no caller reaches a dead number and no run dials with a missing agent.

**Why now.** The builder has no delete at all: the **···** menu on Payment reminders, which carries two numbers and a running run, offers only Change type, View labels and View last save (`shots/before-01-agent-overview.png`, `shots/before-02-kebab-menu.png`). `DELETE /agents/{id}` exists in the v3 API with no undo, and nothing says whether the server refuses it while a number or run references the agent. Every vendor researched deletes silently (ElevenLabs, Vapi, Retell) or names only categories (Vercel); none lists the actual dependents.

## Happy path · P0.15.a

Story: Sam wants to remove an old agent, so no caller reaches a dead number and no run dials with a missing agent.

1. Sam opens Payment reminders and chooses **Delete agent**, the last item in the header's **···** menu, in red under a separator. `surface_viewed {surface: agent_delete}`
2. The dialog **Delete Payment reminders** reads "2 numbers and 1 run use this agent. Move or stop each one, then delete." and lists `+1 415 555 0187`, `+1 415 555 0188` and Run 3 · Sep 24 (Running), each with one door: **Open number** or **Open run**. `agent_delete_blocked {numberCount: 2, runCount: 1}`
3. Sam opens each number on the Deployment tab and disconnects it (or connects it from another inbound agent, which moves it), then opens Run 3 and chooses **Cancel run**. Back in the dialog, the list is empty.
4. The dialog now shows the name field, "Type Payment reminders to confirm", and the standing line "Sessions your code starts with `agent_payments` will fail after the delete." Sam types the name; **Delete agent** turns on; Sam presses it. `operation_succeeded {operation: agent_delete}`
5. Studio lands on the agents list with the toast "Payment reminders deleted." Its past sessions and error groups stay in history with an outline **Agent deleted** badge beside the name (P1.4.g, P2.1.b; needs G4).

Done when: no number or run references the agent at the moment of the delete, and the delete was typed on purpose.

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | URL state | Event |
|---|---|---|---|---|
| P0.15.b | A number still points at the agent | Front desk: "1 number uses this agent. Move or stop it, then delete." Row `+1 415 555 0142` with **Open number**. No name field, footer is **Close** only. If the server refuses the delete anyway (rule unconfirmed), an `Alert`: "The delete did not go through. A number or run still uses this agent." and the list re-reads | `del=number`, `del=refused` | `agent_delete_blocked {numberCount: 1, runCount: 0}`, `operation_failed {operation: agent_delete, code: 409}` |
| P0.15.c | A scheduled, running or paused run uses the agent | The run row names the run and its status badge; **Open run** lands on the run sheet, where **Pause** and **Cancel run** already live. Pause alone does not clear the block, since a paused run can resume | `del=run` | `agent_delete_blocked {numberCount: 0, runCount: 1}` |
| P0.15.d | The agent's secret set is used by no other agent | Once nothing blocks, a line under the name field: "Secret set Tutor keys is used by no other agent. It stays after the delete." with **Open secrets** (P3.1). Kept by default; nothing to tick | `del=secrets` | none |
| P0.15.e | The team's code still starts sessions with this agent | Studio cannot see code. Every clear dialog carries "Sessions your code starts with `agent_tutor` will fail after the delete." No count, no guess | `del=clear` | none |
| P0.15.f | Sam deletes by mistake | No undo in the v3 spec. **Delete agent** stays off until the typed name matches exactly; a mismatch on Enter shows "The name does not match." under the field | `del=typo` | none |
| failed | The request fails (network or 5xx) | `Alert` in the dialog: "The delete did not go through. Try again." The typed name stays | `del=failed` | `operation_failed {operation: agent_delete}` |
| deleted | Sam opens history for a deleted agent | Sessions and error groups show the name with the **Agent deleted** badge; the name is not a link. Until sessions carry an agent id (G4) the badge reads nothing and history shows "Arrives when sessions link to agents." | `del=deleted` (lands on the list) | none |

Empty first: nothing in this row shows on a brand-new account; with no agents there is nothing to delete. Deleting the last agent lands on the agents list's existing empty state, unchanged.

## Measures

- Target: 0 numbers or runs reference a deleted agent (`orphan_deployment`, derived by a daily server scan of numbers `inbound.agent` and non-final runs).
- Counter: deletes followed by a new agent with the same name within 24 h at or below 5 % (`operation_succeeded {operation: agent_delete}` then `agent_created` with an equal name).
- Events: `surface_viewed {surface: agent_delete}`, `agent_delete_blocked {numberCount, runCount}`, `operation_succeeded {operation: agent_delete}`, `operation_failed {operation: agent_delete, code}`, `orphan_deployment` (derived).
