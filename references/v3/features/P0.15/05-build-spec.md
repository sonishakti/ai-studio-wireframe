# P0.15 Retire an agent · Build spec

Direction 1 from `04-directions.md`. Concept A only. Prototype at `WT/src/prototypes/agent-builder-v3/`. Proposed row: build behind owner sign-off (question 1).

Link opens where Sam starts: `/v3?concept=a&view=agent&agent=agent_payments`.

## 1. The flow

### Happy path (P0.15.a)
1. **···** menu, **Delete agent** (last, separator above, `text-destructive`) sets `panel=delete`.
2. Dialog re-reads what holds the agent and lists it; footer **Close**.
3. **Open number** closes the dialog and sets `tab=deploy`; **Open run** sets `run=<id>` (run sheet). Sam disconnects or moves the numbers and cancels the run with the existing controls.
4. **Delete agent** again: the list is empty, the name field shows. Typing "Payment reminders" turns **Delete agent** on.
5. Delete removes the agent from the store, navigates `view=list`, toast.

### Rainy paths and URL states

`del=` is a review key like `pr=` and `adv=`: read on open, never written by the dialog. With `del` absent, the state is derived from the agent.

| Id | URL | Agent | Shows |
|---|---|---|---|
| a (step 2) | `panel=delete&del=both` | agent_payments | 2 numbers + Run 3 · Sep 24 |
| P0.15.b | `panel=delete&del=number` | agent_frontdesk | `+1 415 555 0142` |
| P0.15.b refused | `panel=delete&del=refused` | agent_tutor | clear state + 409 `Alert` |
| P0.15.c | `panel=delete&del=run` | agent_payments | the run row only (numbers hidden for review) |
| P0.15.d | `panel=delete&del=secrets` | agent_tutor | clear state + secret set line |
| P0.15.e | `panel=delete&del=clear` | agent_tutor | clear state, code line |
| P0.15.f | `panel=delete&del=typo` | agent_tutor | "In-app tuter" typed, mismatch error |
| failed | `panel=delete&del=failed` | agent_tutor | clear state + failed `Alert`, name kept |
| deleted | `view=list&del=deleted` | none | list without the agent, toast shown once |

All URLs are `/v3?concept=a&view=agent&agent=<id>&…` unless `view=list`.

## 2. Data

- `store.tsx`: add `del?: DeleteReviewState` to `ProtoSearch`, `pick()` it like `pr`; type `"both" | "number" | "run" | "refused" | "secrets" | "clear" | "typo" | "failed" | "deleted"`.
- `data.ts`: `deleteHolds(agent, agents)` returns `{ numbers: string[]; runs: Run[] }`; runs with status `scheduled | running | paused`. Numbers come from `agent.numbers` (inbound routing lives on the number, `inbound.agent`).
- Store action `deleteAgent(id)`: filters the agent out of the stored list. In the prototype the agent's past sessions are dropped with it; history badges are a Figma-only state until G4 (below).
- Secret set: no fixture exists. Add `secretSet?: { name: string; sharedWith: number }` on `agent_tutor` only: `{ name: "Tutor keys", sharedWith: 0 }`. The line shows when `sharedWith === 0`. Gap D2 below.
- API calls to name in the code comment: `GET /numbers` (filter `inbound.agent`), `GET /campaigns?agent=` (non-final), `DELETE /agents/{id}`. No undo endpoint.

### Gaps
- **D1** (API team): whether `DELETE /agents/{id}` returns 409 while referenced. Studio blocks client-side regardless; `del=refused` covers the server saying no.
- **D2**: secret sets per agent (which sets an agent uses, who else uses them) are not in the v3 Agent object; the line needs a way to read it (P3.1).
- **G4**: sessions and error groups do not carry an agent id yet, so the **Agent deleted** badge has nothing to hang on. Until then history shows "Arrives when sessions link to agents." (P1.3.b wording).

## 3. Components to reuse

| Need | Use |
|---|---|
| Menu entry | `DropdownMenuSeparator` + `DropdownMenuItem className="text-destructive"` in the existing header menu (`a-tabs.tsx`, after View last save) |
| Dialog | `AlertDialog`, same shell as `ChangeTypeDialog` blocked state (`parts/deployment-type.tsx`) |
| Holding rows | the bordered row list from `InboundNumbers` (`parts/deploy.tsx`): value left, muted label under, ghost `xs` button right |
| Run status | the run list's status `Badge` (outline) |
| Name field | `Field` + `Input`, error text through `Field`'s error slot |
| Code line, agent id | inline `code` span as in P0.14's footer line |
| Failure | `Alert` destructive tint inside `AlertDialogContent` |
| Done | `sonner` toast |
| Deleted tag | `Badge variant="outline"` |

Nothing new in the design system.

## 4. The dialog, piece by piece

### Blocked (holds > 0)
- Title `Delete {name}`.
- Description: counts in words. "2 numbers and 1 run use this agent. Move or stop each one, then delete." Singular forms: "1 number uses this agent. Move or stop it, then delete." / "1 run uses this agent. Stop it, then delete."
- Rows: numbers first, then runs. Number row: number (tabular), label under ("SIP trunk" fallback as today), **Open number**. Run row: run name, status badge, **Open run**.
- Footer: **Close** only. No name field, no disabled Delete.

### Clear (holds = 0)
- Title `Delete {name}`.
- Description: "This deletes the agent for good. Past sessions stay in history."
- Line, muted: "Sessions your code starts with `{id}` will fail after the delete."
- Secret set line (when D2 data says unshared): "Secret set {set} is used by no other agent. It stays after the delete." + ghost link **Open secrets**; the link only renders once P3.1 exists.
- Field label: "Type {name} to confirm". Empty input, no placeholder.
- Footer: **Cancel** · **Delete agent** (`destructive`, off until the trimmed input equals the name, case-sensitive). Enter with a mismatch shows the error.
- Pending: button shows `Spinner`, dialog cannot close.

## 5. Behaviour

- Open: compute holds from the live store (prototype) or the two GET calls (product), never from the agent object fetched with the page. Fire `surface_viewed {surface: agent_delete}`; when holds > 0 also `agent_delete_blocked {numberCount, runCount}`.
- A door closes the dialog (`panel` cleared) and navigates; re-choosing Delete re-reads.
- Delete success: `operation_succeeded {operation: agent_delete}`, remove from store, `view=list`, toast "{name} deleted.".
- 409: stay open, `Alert` refused copy, re-read holds, `operation_failed {operation: agent_delete, code: 409}`.
- Other failure: `Alert` failed copy, keep typed name, `operation_failed {operation: agent_delete}`.
- A draft agent (no deployment ever) takes the clear path directly.
- Deleting the last agent: the list's existing empty state, unchanged.
- `orphan_deployment` is server-derived (daily scan); nothing in the client.

## 6. Copy

| Where | Text |
|---|---|
| Menu | Delete agent |
| Title | Delete Payment reminders |
| Blocked, both | 2 numbers and 1 run use this agent. Move or stop each one, then delete. |
| Blocked, number | 1 number uses this agent. Move or stop it, then delete. |
| Blocked, run | 1 run uses this agent. Stop it, then delete. |
| Row doors | Open number · Open run |
| Clear | This deletes the agent for good. Past sessions stay in history. |
| Code line | Sessions your code starts with `agent_tutor` will fail after the delete. |
| Secret set | Secret set Tutor keys is used by no other agent. It stays after the delete. |
| Field | Type In-app tutor to confirm |
| Mismatch | The name does not match. |
| Refused | The delete did not go through. A number or run still uses this agent. |
| Failed | The delete did not go through. Try again. |
| Toast | In-app tutor deleted. |
| History badge | Agent deleted |
| History, before G4 | Arrives when sessions link to agents. |

Vocabulary: agent, number, run, session, secret set, error group. Never "assistant", "campaign" for a run, "archive", "undo", "permanently" in a button. No arrows, no em dashes, sentence case, no prices.

## 7. Gate before the commit

`bun run typecheck`; `bunx vitest run src/prototypes/agent-builder-v3` (add tests: `deleteHolds` counts only non-final runs; `del` parses; mismatch keeps the button off); `bunx biome check --write --vcs-use-ignore-file=false <changed files>`; `git diff --check`. One local commit `design(v3/P0.15): Sam can delete an agent once nothing uses it`.

## 8. Figma (after the build)

Page `v3 · P0 Agent config`, section P0.15, style from P0.3 `131:5755`, dark. Story frames for .a steps 1, 2, 4, 5 and one frame per rainy id from the URL table; plus a history frame with the **Agent deleted** badge on a session row and error group row (P1.4.g, P2.1.b), marked G4.
