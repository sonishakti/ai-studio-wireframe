# P0.14 Change an agent people reach · Before and after

Track: **v3**, in the existing Console design system. Before shot captured 26 Sep 2026 at 1600 px, scale 2, dark, from the design/v3 preview (`ng-console-2lwgznvzi-agoraio.vercel.app/v3?concept=a`, P0.3's commit) with design-mode fixtures, no sign-in.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-agent-greeting-panel.png` | `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=agent` | Front desk (inbound, Live badge): the Agent tab with Voice & models, the System prompt editor, the ghost door **Greeting and failure message** with its gray tick, Knowledge and tools; the header **Test**, **Connect a number**, the menu |

## Before · concept A today (dfdbb2fa, P0.3's commit)

1. **Nothing names what a save reaches.** The prompt editor and the greeting door sit on an agent that `+1 415 555 0142` answers with, and no line on the page says so or says that a save reaches callers on their next session (`before-01`, region 976,1144,1504,440). Red: the row's whole question is unanswered where Sam decides.
2. **The header still reads Live and offers Connect a number** (`before-01`, region 2660,140,520,80). P0.8's spec renames these (Production, no primary on a live inbound agent) and it is not built yet; amber, P0.8 owns it.
3. **No change time, no watch door.** The header carries name, type and status only; nothing says when the agent last changed in Studio or lets Sam open the sessions since then. Red for step 4.
4. **A broken save cannot be read back.** View last save (P0.3) shows the PATCH body Studio sent and nothing about what was there before, so a hand revert means remembering the old greeting. Red for rainy b.
5. **A conflicting save is invisible.** The prototype's save writes the store unconditionally; nothing carries a precondition or handles a 412, so a teammate's save is silently overwritten (ElevenLabs' pattern, `shots/elevenlabs-02-resolving-merge-conflicts.png`). Red for rainy d.
6. **Running sessions are not mentioned.** Nothing says whether a save changes the sessions in progress. Amber for rainy c, pending the API team's answer.
7. **The type change dialog already names the number** (P0.1.b, `ChangeTypeDialog` on `deploymentHold`). Green: rainy e is covered as is.

## After

The same surfaces, extended in place. On a deployed agent, every dirty footer (the prompt row, the greeting sheet, Voice & models, Advanced settings, the integration sheets) prints one line in the reason slot it already has, "+1 415 555 0142 answers with this agent, so the change reaches callers on their next session.", with a second sentence when sessions are running. Save and test stays the one press; the save stamps `labels.studio_config_changed_at` and keeps the fields' previous values beside the PATCH body. The toast keeps P0.8.h's line; on Save and test it drops the Test action because the panel is already playing the new greeting. The header gains one meta line under the name, "Changed today, 14:02 · Sessions since this change", the door P1.1 will keep; it reads "Last saved Sep 19, 15:02" with no door when the change came through the API, and nothing on a draft agent. The door opens Overview with Recent sessions narrowed to the change: one sentence while nothing has arrived, the rows as they come, a count line "3 sessions since the 14:02 change · 2 failed" when any failed, and **All sessions** to go back. View last save gains `studio · before this change` with the kept values and the sentence "To undo, put these values back and save. The API keeps no earlier versions." A 412 keeps Sam's draft, refreshes the baseline, and shows an alert naming who saved and when with **Show their version**; Save sends again. Changing the type of a live agent stays P0.1.b's dialog.

| Before | After | Why |
|---|---|---|
| A plain footer with Cancel · Save · Save and test | The same footer with the deployment line in its reason slot | Learning 1; `vercel-02`, `vapi-01`; `before-01` |
| Nothing about sessions in progress | A second sentence with the running count when known | Rainy c; open question 1 |
| Header: name, type, status | One meta line: change time and the Sessions since this change door | Learning 6; P1.1's header |
| No way to watch the effect | Recent sessions narrowed to the change, empty first, with a failed count | Rainy b; the KPI |
| View last save shows the PATCH only | Plus `studio · before this change` and the undo sentence | Learning 4; `retell-02`; rainy b |
| Saves overwrite silently | 412 alert with their version on request, Sam's draft kept, one Save | Learning 3; `elevenlabs-02`; rainy d |
| Change type dialog names the number | Unchanged | P0.1.b; rainy e |

Nothing new enters the design system: the footer's `text-xs text-muted-foreground` reason line (P0.1's create sheet, P0.4's row), `Button variant="link" size="sm"` (P0.8's fix link), `Alert` with the warning tint (P0.8's minutes banner), `CodeBlock` in P0.3's dialog with P0.13's muted title, `EmptyRow`, `SessionsTable` and the ghost xs door in the title row (P0.13). One label and one kept record are data, not tokens.
