# P0.14 Change an agent people reach · Directions

Track: **v3**. Constraints: concept A; existing design system only, no new token; reuse, do not redesign; empty first, quiet chrome; locked words (deployment, number, run, session, test, production; never publish, deploy, live for running); the API has no draft, publish, version or revert, so every direction is honest about one fact, the save reaches callers now, and differs only in where Sam reads it and what Studio keeps.

## Three directions

### 1. The line where the button is, the door in the header
On a deployed agent every dirty footer prints the deployment line in the reason slot it already has, next to Save and Save and test; a second sentence names the running sessions. The save stamps the change time and keeps the previous values. The header gains one meta line, the change time and **Sessions since this change**, which opens Overview's Recent sessions narrowed to the change, empty first. View last save gains `before this change` and the undo sentence. A 412 is an alert on the same footer with their version on request and Sam's draft kept. No new surface, no dialog, no mode.
Research: Vapi's pinned callout at the point of action (`vapi-01`); Vercel's restate-then-confirm shape without the extra step (`vercel-02`); Retell's compare as the kept before values (`retell-02`); ElevenLabs' silent merge as the thing .d avoids (`elevenlabs-02`); Refero Frame.io and Cursor for the toast after a settings save (`88b22f4c`, `a80078ae`).

### 2. Confirm before every save on a deployed agent
Save and Save and test on a deployed agent open an `AlertDialog`, "Save to +1 415 555 0142?", with the line and the running sentence, buttons **Cancel** · **Save** · **Save and test**; a draft agent saves without it. Vercel's verify step made literal (`vercel-02`), Doppler's consequence confirm (Refero `c790959c`), Wittl's draft to active confirm (Refero `11636afb`).
Loses: a dialog on every save of every live agent is friction on the everyday path Vercel reserves for a rare rollback; it adds a control for what Agora does by default (the save reaches production); the counter metric (a heard test on the new version) is served by Save and test and Readiness reopening (P0.8), not by a second press; Sam learns to click through it.

### 3. A browser-held draft with Publish
Edits on a deployed agent are held in the browser as a draft; a **Publish** button sends the PATCH; Studio shows "Draft" until then. Vapi's and Retell's shape (`vapi-01`, `retell-01`), Mocha's staged changes with a note (Refero `be786978`).
Loses: the API has no draft, so the browser's copy is invisible to the API, a teammate and another browser, and lies about what callers get; conflicts multiply (every held draft ages toward a 412); "publish" is a never-word for deployment; it is the API ask dressed as UI. Kept only as the words of open question 2.

Cut before scoring: a Revert or Restore button from the kept values (the PRD says Sam reverts by hand; a one-click restore is a version feature the API does not have, open question 2); a version number in the header (nothing numbers versions); a "New since change" badge in the header (P1.1 owns the error badge; this row shows the count on the since view); a change note field at save (Mocha, `be786978`; nothing stores it).

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 Line and header door | 2 Confirm dialog | 3 Browser draft |
|---|---|---|---|
| Fits the PRD steps (line before the save, heard, since view) and the KPI | 5 | 4 | 2 |
| Honest to the v3 API (no draft, no version, every PATCH is production) | 5 | 5 | 1 |
| Reuse, one door, no new surface | 5 | 3 | 2 |
| Empty first, quiet chrome, no control for the default | 5 | 2 | 2 |
| Rainy b (revert by hand possible) | 5 | 4 | 3 |
| Rainy d (conflict shown, edits kept) | 5 | 4 | 2 |
| Continues into P1.1, P1.3 and P3.5 without a second door | 5 | 3 | 2 |
| Everyday cost per save | 5 | 2 | 3 |
| **Total / 40** | **40** | **27** | **17** |

## Pick: direction 1, the line where the button is, the door in the header

1. **The line sits where the decision is.** Vapi pins the "used by live calls" fact at the point of action (`vapi-01`) and Vercel restates what changes before the one button (`vercel-02`); the footer's reason slot is already there (`before-01` shows it empty), so the line costs no chrome and no press.
2. **No dialog, no mode, one press.** Save and test stays the one door to hearing the version callers get; the counter metric (unheard live changes at 30 % or fewer) rides on that press and on Readiness reopening after the save (P0.8), not on a confirm Sam would learn to click through.
3. **Honest about versions.** The API keeps no earlier value, so Studio keeps the form's baseline as `before this change` beside the PATCH it sent and says where it lives, the way Retell puts the compare beside publish (`retell-02`); a hand revert is possible for every account, unlike LiveKit's paid rollback (`livekit-02`), and versions stay an API ask.
4. **A conflict is shown, not lost.** Against ElevenLabs' timestamp merge (`elevenlabs-02`), the 412 keeps Sam's edits, names who saved and when, shows their value on request and re-sends with one Save; P3.5.d grows from this alert.
5. **The watch door goes where P1.1 puts it.** The change time and the door live in the header's meta line, the since view lands on P0.13's Recent sessions block, and the failed count is the fact P1.1 later lifts into its badge; the KPI's `agent_reverted` is derivable server side from the same field diffs.

## Questions for the owner (max 3)

1. Running sessions keep the agent they started with (P0.14.c): the line says so on the PRD's word. Ask the API team to confirm before launch; if a running session can pick up a PATCH mid-session, the sentence is cut and the line says the change reaches sessions at once.
2. Versions: raise the API ask (agent versions, Retell's numbering `V2 (draft)` to `V2`, a `version` on Session). Until it ships, Studio keeps the previous values in the browser and Sam reverts by hand. Should Studio also offer one press that puts those values back into the draft (never saves), or stay hand-revert only?
3. The 412: the PATCH must carry a precondition (`If-Match` or the spec's own field on `updated_at`) for the conflict to exist. Confirm with the parity script which header the v3 API honours; without one, rainy d cannot ship and saves overwrite silently.
