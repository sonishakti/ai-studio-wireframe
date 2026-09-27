# P0.15 Retire an agent · Directions

Surface: concept A, the agent header's **···** menu, which today holds Change type, View labels and View last save. The sibling that already renders "a deployment holds this agent" is P0.1.b's `ChangeTypeDialog` blocked state ("Remove the deployment first", **Close** + **Open number** / **Open run**). The doors that move a number (Disconnect on the Deployment tab, Connect on another inbound agent) and stop a run (the run row menu: Pause, Cancel run) already exist.

## Three directions

### 1. One delete dialog that lists what holds the agent, then asks for the name

**Delete agent** at the bottom of the **···** menu opens one `AlertDialog`. While a number or a non-final run references the agent, the dialog lists each one as a row with a single door to the place that already changes it (**Open number**, **Open run**) and the footer is **Close** only. When the list is empty, the same dialog shows the name field, the code line and **Delete agent** (destructive). This is P0.1.b's blocked dialog grown by a list and a name field.

### 2. Inline controls inside the dialog

Same dialog, but each number row carries a `Select` "Answer with" (another inbound agent) plus **Disconnect**, and each run row carries **Pause** and **Cancel run**. Sam never leaves the dialog. It is the fastest path, and it is what row.md step 2 literally describes.

### 3. A Danger zone panel at the end of the builder

A red-bordered `Panel` after Advanced settings (GitHub pattern), always visible, listing what uses the agent and holding the name field and **Delete agent**. No dialog.

## Audit

| Check | 1. List + name in one dialog | 2. Inline controls | 3. Danger zone panel |
|---|---|---|---|
| Existing DS (ADR 0015: delete is a `Dialog`/`AlertDialog`) | Yes | Yes | No, a panel for a one-off action |
| Extends the sibling that renders this | Yes, P0.1.b's blocked dialog | Partly; adds new controls | No |
| One door per action | Yes; moving a number and cancelling a run keep their one door each | No; second doors for Disconnect, re-point, Pause, Cancel run | Yes |
| Empty first, quiet chrome | Nothing on the page until Sam asks | Busy dialog | A red panel on every agent, all the time |
| API truth | Re-reads numbers and runs on open; states the unconfirmed server rule as a refused state | Same, but writes three resources from one dialog | Same |
| Honest about code (.e) and no undo (.f) | Yes | Yes | Yes |
| Steps for Sam on Payment reminders | 3 trips out and back | 0 trips | 3 trips, page scroll |

Direction 2 is faster, but it copies three actions into a second place and re-pointing a number from a dropdown hides that the number moves off another agent's Deployment tab (Retell's two-views-disagree bug is the failure it invites). Direction 3 spends permanent chrome on a rare action.

## Pick: direction 1, one delete dialog that lists what holds the agent

- One entry, **Delete agent**, last in the header **···** menu under a separator, red text. Not on the agents list.
- The dialog re-reads numbers and runs from the server on open (never the cached agent), so the list is the truth the server will judge.
- Blocking runs are `scheduled`, `running` and `paused`; `completed`, `canceled`, `failed` never block.
- Doors: **Open number** goes to the Deployment tab (`tab=deploy`) where Disconnect lives; **Open run** opens the run sheet (`run=<id>`) where Pause and Cancel run live. Closing either returns to the agent, and choosing Delete again re-reads.
- Clear state: name field, the code line, the secret set line when it applies, **Cancel** + **Delete agent**.
- After the delete: agents list, toast, history badge **Agent deleted** (G4 dependent).

## Questions for the owner (max 3)

1. Sign-off: is this Conclude step in scope for v3, and does direction 1's "Open number / Open run" replace row.md's "offers Pause or Cancel" inside the dialog? (One door per action says yes.)
2. API team: does `DELETE /agents/{id}` refuse (409) while a number's `inbound.agent` or a non-final run references the agent? The design blocks in Studio either way and shows a refused state if the server disagrees.
3. Secret sets: confirm they are kept by default with a pointer to Secrets (P3.1), never deleted from this dialog.
