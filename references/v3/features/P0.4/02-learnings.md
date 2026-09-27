# P0.4 Tell the agent its job · Learnings

Research phase done 26 Sep (`02-research.md`, 11 shots). Order followed: Refero first (no voice-AI builder indexed), then the archive (Vapi, Retell, ElevenLabs, LiveKit product shots and our own greeting exploration), then vendor docs for the failure-message gap; no sign-in. All four vendors Done.

## 1. The prompt is the page; the first line sits beside it, never in front of it

- Vapi puts "First Message" above the System Prompt, so the prompt starts below the fold (`shots/vapi-assistant-model.png`). Retell, ElevenLabs and LiveKit put the prompt first and the welcome line under it (`shots/retell-agent-editor.png`, `shots/elevenlabs-agent-agent.png`, `shots/livekit-19-agent-builder-conversation.png`).
- The KPI is time to the first prompt change, so the editor must be the first thing the eye lands on. **Change:** the System prompt row stays the first block after Voice & models with the textarea as its only control above the fold; the greeting keeps its one door on the row's footer (team ask 9, requirement 9), the way today's builder already does (`shots/before-01-system-prompt-row.png`).

## 2. Say what an empty field does, where the field is

- ElevenLabs writes the empty-state behaviour under First message: "If empty, the agent will wait for the user to start the conversation" (`shots/elevenlabs-agent-agent.png`). No other vendor says what an empty field means; Retell's "Security & Fallback Settings" even reads like the failure message and is not (`shots/retell-agent-editor.png`).
- **Change:** the (i) on Failure message says "Spoken when the language model fails. Empty means the agent stays silent." (the API's own words: no fallback is implied when omitted), and caller first shows the live Console's line "No greeting. The agent waits for the caller." Tooltip over helper text (requirement 11), but the consequence of empty is never hidden.

## 3. The failure message stays one door away, not three

- The only vendor field for what the agent says on failure is ElevenLabs's Advanced, Soft timeout, "Use LLM-generated message" (alpha), then a required Fallback (`shots/elevenlabs-docs-01-soft-timeout-failure-message.png`): three clicks, scoped to timeout filler. Vapi and Retell have none; LiveKit's is code only (`shots/livekit-docs-speech-greeting.png`).
- Our earlier exploration already placed Failure message right under the Opening block (`shots/05-silence-recap.png`), and today's door holds both (`shots/before-02-greeting-sheet-open.png`). **Change:** keep greeting and failure message in one compact sheet behind one door, and give the empty field one link, **Use a suggested line**, so the .d recovery is one click.

## 4. Variables are typed, then seen; the default lives on the chip

- LiveKit offers "Insert variable" on the Instructions toolbar and again on the Welcome message; ElevenLabs says "Type {{ to add variables" under both fields (`shots/livekit-19-agent-builder-conversation.png`, `shots/elevenlabs-agent-agent.png`). Neither shows a default value on the agent; ElevenLabs can fail a test outright when a required variable has no value (research gap 2).
- Today's row already reads the names out of the prompt into chips, but a chip is a dead end and the batch fixture shows no default anywhere (`shots/before-03-empty-greeting-no-default.png`). **Change:** the chip is the door to its default (a `Popover` with one field); the greeting's variables join the same line; and a variable with no default is normal, not an error: the test asks once, a run fills it from the list.

## 5. Disable with a reason, never silently

- Our earlier exploration disabled "Hear the opening" with the reason "nothing to hear" instead of hiding it (`shots/07-hear-disabled.png`), and P0.3 hides realtime rows with a line. **Change:** Save stays off with the reason in the footer line ("Write the system prompt to save it."), and a realtime agent replaces Failure message with "A realtime model has no failure message. The greeting still plays."

## 6. What we do not copy

- Vapi's greeting mode dropdown mixing "speaks first" with the message and its Generate button (`shots/vapi-assistant-model.png`): who speaks first is one select, the text is one field, and Studio writes nothing for Sam.
- Retell's "Pause Before Speaking" hidden behind a disclosure arrow and its "Dynamic message" mode (`shots/retell-agent-editor.png`): Delay is a plain number with its default in the (i); the greeting is text only, since the API's audio mode is API-only.
- LiveKit's interrupt checkbox on the welcome message and the live Console's "Callers can interrupt the greeting" switch: the v3 API has no `interruptible` on create, so no control.
- A second home for the failure message: Advanced (P0.3) points here in one line and holds nothing.
