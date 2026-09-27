# P0.7 Check the agent answers as intended · Directions

Track: **v3**. Constraints: extend `TestPanel` and the two doors that already open it (the header **Test**, every row's **Save and test**), do not redraw; existing design system only; one door per action; no control for what Agora does by default; empty first, quiet chrome; locked words (test, session, answer, simulation, free minutes, suspended; never call, conversation, chat, preview, demo, playground, credits, quota, live for running); the v3 API's `POST /sessions`, its refusals and the fact that `client_reference` is never returned; the Simulations tab is Studio X 2's and stays as it is; production surprises are P1.2.

## Three directions

### 1. The panel grows a session, a state and a transcript (the extension)
Keep the header Test and every row's Save and test, and give them one panel. Save and test saves, opens the panel on Talk and starts the session in one press; Test opens it on Start test, saving a dirty draft first. The panel gets two text tabs, Talk and Simulations, opens on Talk, and follows the live builder's layout: a non-modal sheet below xl, docked from xl. Start test asks for the mic, posts the session from `agent_id` with the `studio_test:` reference, stores the id and joins. The bottom line becomes the status line (Saving, Starting, Listening, Running, no sound yet, Ended with the length); the transcript becomes a list of agent, person, tool (P0.5), key (P0.6) and divider lines. Every way the start can fail is one `Alert` with one sentence and one action in the panel body; a refusal puts Add card where Start test was; a silent session offers a tone and a retry that keeps the transcript; an untouched preset tests at once with one line. Nothing new in the design system.
Research: `shots/vapi-07-talk-button-header.png` (the header door), `shots/livekit-13-console-idle-no-agent.png` (the status label), `shots/livekit-12-start-call-live-preview.png` (one line, one button), `shots/refero-rox-06-no-payment-method-modal.png` (the refusal shape), `shots/before-02-test-panel-live-state.png` (what the transcript grows from).

### 2. A Talk split button in the header with the transcript as a bottom drawer (Vapi)
Make the header Test a split button, Talk and Simulations, and show the running session as a drawer along the bottom of the builder, so the rows keep their full width and the transcript reads like a log. Vapi's Talk dropdown is exactly this door. But it adds a third door (the row footers already say Save and test), moves the transcript away from the row Sam is editing, the Console ships no bottom drawer and DESIGN.md §6 already fixes where the test panel goes, and a drawer on a 1000 px tall viewport hides the rows it was meant to leave visible.
Research: `shots/vapi-07-talk-button-header.png`, `shots/vapi-08-web-call-room-deleted-error.png` (the transcript column as an error log, what to avoid).

### 3. A Test section in the builder with Audio, Events and Logs tabs (LiveKit Console, Studio X 2's Test section)
Put the test into the page as a section of its own under the rows: a transcript, an events tab, a logs tab, a status chip, session details on the side. LiveKit's Console page and Studio X 2's Test section both do this, and everything a developer might want during a test is on one screen. But it is a new surface (v3.1, not a redesign of the existing Console), the API defers events, turns and transcripts past launch so two of the three tabs would be empty by design, the session view is P2's, the live builder already decided the test is the docked panel (ADR 0017), and Retell's mode tabs show what a picker does to the one press between save and answer.
Research: `shots/livekit-13-console-idle-no-agent.png`, `shots/retell-09-test-audio-test-llm-run-test.png`, `shots/elevenlabs-10-preview-pane-call-chat-door.png` (one pane, not a page).

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 The panel grows | 2 Header split, drawer | 3 Test section |
|---|---|---|---|
| Extend, do not redraw | 5 | 3 | 1 |
| One door per action | 5 | 2 | 3 |
| Save to first answer in one press (KPI) | 5 | 4 | 3 |
| Rows editable during and after the test (.a step 4) | 5 | 3 | 4 |
| Empty first, quiet chrome | 5 | 4 | 2 |
| Rainy .b to .h in one place | 5 | 3 | 4 |
| API fit (sessions only; no events, turns or transcript endpoints) | 5 | 4 | 2 |
| Layout already decided (DESIGN.md §6, ADR 0017) | 5 | 1 | 2 |
| Touches P0.3 to P0.6 (in review) | 4 (the panel they share) | 3 | 2 |
| **Total / 45** | **44** | **27** | **23** |

Cut: 2 adds a door and a surface the Console does not ship; 3 is v3.1 and promises tabs the API cannot fill at launch.

## Pick: direction 1, the panel grows a session, a state and a transcript

1. **Two doors, one press fewer.** Talk lives in the persistent header at Vapi (`shots/vapi-07-talk-button-header.png`) and ours already does; every row's Save and test now lands in a running session instead of on Start test, so TTFA loses one press and the header Test keeps the explicit start the A/B flag needs (`trigger` never auto).
2. **The state is a label.** LiveKit keeps a status chip beside Start session (`shots/livekit-13-console-idle-no-agent.png`); the panel's bottom line reads Saving, Starting, Listening, Running, no sound yet, or Ended with the length, which is what .h needs and what the before shot lacked (`shots/before-02-test-panel-live-state.png`).
3. **One alert, one action, never a stack or bare red text.** Vapi stacks toasts with no retry (`shots/vapi-08-web-call-room-deleted-error.png`) and ElevenLabs prints "Permission denied" with no next step (`shots/elevenlabs-11-mic-permission-denied.png`); every start failure here is one `Alert` in the body with the code or the blocker and Try again, Add card, or Replace key (P0.6's door) as the one way out.
4. **The refusal names the blocker, and unsaved edits never ask.** Rox names the exact gate and gives one primary action (`shots/refero-rox-06-no-payment-method-modal.png`), so Add card takes Start test's place; Acctual's unsaved-changes dialog (`shots/refero-acctual-05-unsaved-changes-modal.png`) is what .b refuses, because Save and test and the header Test save first and the session always starts from `agent_id`.
5. **Quiet where Agora does the work.** The idle state is one line and one button (`shots/livekit-12-start-call-live-preview.png`); an untouched preset gets one line and Start test so Aha 1 can fire; Simulations is a text tab, ported as it is, that opens second (Studio X 2 opened on it and hid Talk); the transcript's tool marks are P0.5's lines and the key line is P0.6's, so nothing in this row is new chrome.

## Questions for the owner (max 3)

1. **Aha 1 on an untouched preset.** The API accepts a session on an agent with no instructions, so the panel starts the empty agent as it is saved and says "The agent answers from the model alone." The alternative sends the type's starter prompt as a session override and says so in the line. Test the agent as saved, or test it with the starter?
2. **Save and test starts the session; Test lands on Start test.** One press fewer after a save, but the browser's mic prompt then appears without a Start press. Keep the two behaviours, or make both land on Start test?
3. **Where the transcript comes from.** The API defers transcript, turns and events past launch, so the panel reads the RTC data stream the agent publishes during the session, as the current preview does. Confirm that stream carries the agent's and the person's turns and a tool event; if not, tool marks (P0.5) stay design-mode until P1.4.
