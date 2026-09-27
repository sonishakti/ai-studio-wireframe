# P0.14 Change an agent people reach · Learnings

Research order (owner rule, 26 Sep): Refero first (no hit for a voice-agent draft, publish or versions panel), then the shots already captured, then vendor public docs fetched live; the built-in browser for this row's own before shot. All shots are in `shots/`; `02-research.md` names each source and region. No vendor reaches the everyday case this row designs (a save that reaches callers at once, with no publish step), so learnings 1 and 4 are ported shapes, 2, 3 and 5 are anti-patterns to avoid, and 6 is our own gap.

## 1. Say what the save reaches at the point of action, in one pinned line

- Vapi's versioning page carries one callout right where the lifecycle is explained: "The current version is the configuration used by live calls. Publishing a draft makes the new version current." (`vapi-01-draft-publish-versioning.png`, region 720,1552,1760,112).
- Vercel's rollback restates exactly what changes and what does not, in plain sentences, immediately before the one confirm button (`vercel-02-confirm-rollback-warning.png`, region 880,144,1440,736).
- **The line names the number or run and says the change reaches callers on their next session, in the footer slot next to Save, before the save. Not a dialog: the footer already has the slot and Save and test is already the one press.**

## 2. A separate Publish is not available to us, and faking one would lie

- Vapi and Retell both split draft from published and let the draft "not affect live calls" (`vapi-01`, region 720,1552,1760,112; `retell-01-draft-published-versions.png`, region 790,784,1534,208); the v3 API has no such object, every PATCH is production.
- ElevenLabs makes versioning opt-in and a one-way door, stated plainly before it is turned on (`elevenlabs-01-versioning-overview.png`, region 800,1600,1600,96).
- **Studio states the one-way truth the same plainly (the save reaches callers now) and never holds a browser-side "draft" that the API, a teammate or another browser cannot see. Publish stays a never-word; versions stay an API ask.**

## 3. Silent last-write-wins is the wrong answer to two people saving

- ElevenLabs resolves conflicting edits by timestamp with no dialog, only an API `force` flag and a `preview_merge` call developers can run first (`elevenlabs-02-resolving-merge-conflicts.png`, region 800,312,1600,152).
- **A 412 keeps Sam's edits in the editor, names who saved and when, shows their value on request, and lets the one Save button send again with the fresh precondition. P3.5.d's sheet grows from this alert, not from a merge flag.**

## 4. Compare is worth having only when there is something to compare with

- Retell offers Compare from history and from inside the publish modal, draft beside last published (`retell-02-compare-agent-versions.png`, region 790,808,1504,448).
- The v3 API keeps no earlier version, so the only "before" that exists after a save is the form's baseline in Sam's browser at the moment of Save.
- **Studio keeps that baseline as `studio · before this change` under View last save (P0.3's door, P0.13's entry kind) and says where it lives; a hand revert is possible without pretending the API has versions.**

## 5. Recovery must not be a plan tier

- LiveKit gates instant rollback to paid Cloud plans and tells free users to revert their code and redeploy (`livekit-02-rolling-back-cli.png`, region 981,685,1272,192).
- **Revert guidance is one kept record and one sentence for every account; nothing here has a tier, and no price appears (P0.2's rule).**

## 6. Our own page says nothing at all

- The Agent tab on a live, connected agent is one plain editable form: prompt, greeting and voice directly editable, no line naming `+1 415 555 0142`, no change time, no way to see what a save reached (`before-01-agent-greeting-panel.png`, region 976,1144,1504,440).
- **The line goes in the footer Sam already reads, the change time and the watch door go in the header P1.1 will own, and the since view lands on the Recent sessions block P0.13 already built. No new surface.**
