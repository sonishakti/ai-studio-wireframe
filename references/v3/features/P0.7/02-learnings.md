# P0.7 Check the agent answers as intended · Learnings

Research phase done 26 Sep (`02-research.md`, 11 shots). Order followed: the row's existing product shots for Vapi, Retell, ElevenLabs and LiveKit (reused, none re-captured), Refero for the two rainy gaps (Rox's payment gate, Acctual's unsaved-changes confirm), the prototype's own before shots. Retell's test tabs are docs-only. No vendor or Refero screen shows a concurrency refusal on a voice test, a test on unsaved edits, a tool failing mid-test or a silent session; those four states are designed from the API shape and the row's own recovery text.

## 1. The test door lives in the persistent header, and every row already has its own Save and test

- Vapi puts **Talk** beside Publish in the header, reachable from every tab (`shots/vapi-07-talk-button-header.png`); Retell puts **Test** in the same place (`shots/retell-09-test-audio-test-llm-run-test.png`). Our header **Test** button is that door already (`shots/before-01-test-panel-closed-state.png`), and P0.3 to P0.6 gave each row footer and sheet footer a **Save and test**.
- **Change:** keep both doors and give them one panel. Save and test saves, opens the panel on Talk and starts the session in one press; the header Test opens the panel on Start test (saving a dirty draft first, P0.4 .f). No third door, no section, no drawer.

## 2. One sentence that says why, then the one control

- LiveKit's empty Live preview reads why before the button and then shows one **START CALL** (`shots/livekit-12-start-call-live-preview.png`); LiveKit's Console then repeats the same message in a second place once an agent is selected (`02-research.md`, avoid). Our idle panel already has one line and one button (`shots/before-01-test-panel-closed-state.png`).
- **Change:** the idle state stays one line and one button, and the line changes with the agent, not the chrome: the values-first body for an agent with variables (P0.4), "No system prompt yet. The agent answers from the model alone." for an untouched preset (Aha 1), one extra sentence for an inbound agent, "The number is not dialled." (Retell's habit of naming a limit before it bites). Nothing is repeated in a banner.

## 3. Connection state is a label, not a guess from the button

- LiveKit's Console keeps a CURRENT STATUS chip, IDLE here, beside Start session at every moment (`shots/livekit-13-console-idle-no-agent.png`); our live state shows a stopwatch and a bare "Listening" line (`shots/before-02-test-panel-live-state.png`), and nothing between Start test and the first bubble.
- **Change:** the existing bottom line becomes the status line and always reads one of Saving, Starting, Listening, Running, no sound yet, or Ended with the length. .h is that line plus a speaker check; the button text never has to carry the state.

## 4. A failure inside the transcript column needs one next step, not a stack

- Vapi stacks three identical red toasts inside the transcript panel with no retry (`shots/vapi-08-web-call-room-deleted-error.png`); ElevenLabs renders "Permission denied" as bare red text under "Call started" and duplicates it in a toast (`shots/elevenlabs-11-mic-permission-denied.png`). Neither names what to do.
- **Change:** every way the test fails to start is one `Alert` in the panel body with one sentence and one action: mic denied gets Try again and a text simulation, a refusal gets Add card in place of Start test, a start failure gets the code and Try again, a BYOK failure names the module and offers Replace key (P0.6's door). The transcript column stays for transcript lines; a tool failure mid-test is one line in it (P0.5), never a toast.

## 5. The refusal names the blocker and gives the one door, and nothing else interrupts

- Rox gates a blocked action with a modal that names the exact blocker and one primary action, Add Payment Method, plus Cancel (`shots/refero-rox-06-no-payment-method-modal.png`). Acctual interrupts a close with "Unsaved changes, keep editing or close without saving" (`shots/refero-acctual-05-unsaved-changes-modal.png`), the pattern this row refuses: .b's recovery is to save silently and test the saved version.
- **Change:** free minutes used up and a suspended account read as one line naming the blocker with **Add card** where Start test was, inside the panel, no modal; unsaved edits never ask, Save and test and the header Test save first and the session starts from `agent_id`. The concurrency refusal follows the Rox shape with the API's own numbers ("10 of 10 sessions are running") since no voice product shows one.

## 6. Voice and text share one pane, and only the voice counts

- ElevenLabs gives one preview pane with a phone door and a text composer under it (`shots/elevenlabs-10-preview-pane-call-chat-door.png`); Retell splits Test Audio and Test LLM into tabs beside one Run Test (`shots/retell-09-test-audio-test-llm-run-test.png`, avoid the mode picker). Studio X 2 opens its rail on the Simulations tab by default, which hides Talk and costs a click of TTFA (`references/telemetry/event-spec.json`, `test_panel_opened`).
- **Change:** one panel with two tabs, **Talk** and **Simulations**, opening on Talk every time. Simulations is Studio X 2's tab ported as it is (requirement 52) and is the .c fallback when the mic is denied; a simulation is text, so it never fires `agent_audio_heard` and never counts toward Aha 1 or 2.
