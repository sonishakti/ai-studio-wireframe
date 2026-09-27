# P0.6 Run the agent on the team's own accounts · Directions

Track: **v3**. Constraints: extend P0.3's model rows and `ProviderKeyControl`, do not redraw; existing design system only; one door per action; no control for what Agora does by default; empty first, quiet chrome; locked words (secret, BYOK, managed, test, session; never credential, vault, API key alone, token, own keys, Agora keys); the v3 API's `ModelCredential`, `/secrets` and its 409s; this agent's keys only, sharing across agents is P3.1; no check call exists.

## Three directions

### 1. The key is a field of the module row, committed by the sheet's Save (the extension)
Keep P0.3's door: **Use my key** beside the module's vendor and model in Advanced settings. The button opens a password field that behaves like the Headers field below it: the value sits in the sheet's draft, the footer's Save and Save and test turn on, and Save does the work (one secret set per module key, a `$secrets` reference in the credential, a suffix on 409, a label recording the set). After save the row reads **Key saved** with the reference in an (i), Replace (PUT) and Remove (managed, then DELETE; a 409 keeps the set and names the agent). The test panel's transcript gains one line per rejected key, module and code, with **Replace key** under it, and the row carries **Key rejected in last test** with the time. A model Agora runs shows one line and no control; a vendor change on a saved key shows one line; a `$secrets` reference pasted is used as is; saved sets are pickable behind the flag.
Research: today's control (`shots/before-01-advanced-provider-keys.png`, `shots/before-02-key-paste-field.png`, `shots/before-03-key-saved.png`), LiveKit's in-builder placement (`shots/livekit-18-agent-builder-advanced-telephony.png`), OpenAI's revoke dialog for what the 409 must add (`shots/refero-openai-01-revoke-confirm.png`).

### 2. One Provider keys group listing every module (the earlier sheet, LiveKit's Secrets group)
Put the keys back into one group at the end of the sheet, one row per module with **Use my key**, so Sam sees every key in one glance and the model rows stay short. Rotation across modules reads like a table. But the group repeats the module list the sheet already has (Listen, Think, Speak), separates the key from the vendor select it depends on (the vendor-changed case needs a second look), shows three rows on every account when every one is managed (LiveKit's empty table, our before shot), and the P0.3 sheet already removed it in review.
Research: `shots/before-01-advanced-provider-keys.png`, `shots/livekit-18-agent-builder-advanced-telephony.png`, `shots/livekit-19-agent-configuration-secrets.png`.

### 3. A Model Credentials page first, pick in the builder (the current Console and Vapi)
Keys become project objects on a page; the module row offers a select of saved ones and a link to add one. Reuse across agents comes free and the page can show "used by". But it is the page exit the counter metric measures, the current Console's own pattern that the PRD is replacing, a second empty state for a new account, a select on every module row for something most accounts never use, and P3.1 already owns that page with "created by agent X" context the name convention from direction 1 provides.
Research: desk notes on Vapi's Integrations tab (`02-research.md`), Doppler's project-level list (`shots/refero-doppler-01-validation-error.png`).

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 Field of the row | 2 One keys group | 3 Page first |
|---|---|---|---|
| Extend, do not redraw | 5 | 3 | 2 |
| One door per action | 5 | 3 | 2 |
| Use my key to tested, one minute (KPI) | 5 | 4 | 2 |
| No page exit (counter metric) | 5 | 5 | 1 |
| Saved is not tested, the test is the proof (.c, .f) | 5 | 4 | 3 |
| Empty first, quiet chrome | 5 | 2 | 2 |
| Rainy .b to .g in one place | 5 | 3 | 3 |
| API fit (one set per module key, 409s, no used_by) | 5 | 4 | 3 |
| Touches P0.3 to P0.5 (in review) | 4 (test panel line, events) | 2 | 3 |
| **Total / 45** | **44** | **30** | **21** |

Cut: 2 repeats the module list and reopens what P0.3 closed; 3 rebuilds the page exit the KPI counts against and takes P3.1's scope.

## Pick: direction 1, the key is a field of the module row, committed by the sheet's Save

1. **The door is already right; it lacked the API.** Our row shows Use my key beside every module (`shots/before-01-advanced-provider-keys.png`) and LiveKit keeps secrets inside the builder too (`shots/livekit-18-agent-builder-advanced-telephony.png`); adding `POST /secrets`, the `$secrets` reference and the label gives stage 6 `byok_enabled` its client twin with no new surface.
2. **Write-only stays write-only and looks like Headers.** The saved state never echoes the value (`shots/before-03-key-saved.png`, Doppler's masked rows in `shots/refero-doppler-01-validation-error.png`), and committing through the sheet's Save instead of a second button removes the false Key saved and matches P0.3's Headers field two lines below.
3. **The test is the proof, on the module.** No vendor shows a rejected key on screen (`02-research.md` gaps) and the API has no check call; the transcript line with module and code and the row's **Key rejected in last test** give the KPI its numerator and denominator, the way P0.5 proved tools.
4. **Remove is honest about the 409.** OpenAI warns without naming dependents (`shots/refero-openai-01-revoke-confirm.png`); our line names the agent the API returns and keeps the set, and the module runs managed either way.
5. **Quiet where Agora does the work.** A managed module shows one button, a model on SuperNode shows one line, the collision on a set name resolves itself with a suffix, and the picker appears only when sets exist and only behind the flag (`shots/livekit-19-agent-configuration-secrets.png` is the empty table we refuse).

## Questions for the owner (max 3)

1. **Delete on Remove.** The register logs three answers (never delete; delete and recreate; delete when unreferenced). The row deletes the Studio-made set on save once the module is managed, and a 409 keeps it and names the agent. Keep that, or leave every delete to P3.1's Secrets page and only switch the mode here?
2. **A check step now or later.** Vapi validates at save; the v3 API has no check call and the PRD adds a step only below 80 % of tested keys. Ship the test as the only proof, or ask the API team for a validate call before launch?
3. **Which module rejected the key.** `POST /sessions` returns `Problem.provider` and `Session.message` names the vendor, not the module; Studio maps vendor to module and flags both rows when two modules share a vendor. Accept that, or ask for a `module` field on the failure?
