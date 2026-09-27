# P0.7 Check the agent answers as intended · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 x 1000, scale 2, dark, from the latest preview of concept A on Payment reminders (`agent_payments`). They show the panel as P0.3's commit (`4bf260c7`) left it; P0.4, P0.5 and P0.6 (in review, builds not yet landed) add the values-first body, the tool lines and the key line to the same panel and change nothing below.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-test-panel-closed-state.png` | `…&agent=agent_payments&tab=deploy`, header **Test** pressed | A modal right sheet titled Test with Close; one line "Talk to the agent with your microphone."; **Start test** |
| `shots/before-02-test-panel-live-state.png` | same, Start test pressed | "Aria · 0:01", one greeting bubble, "Listening", **End call** (P0.3's spec renamed it End test; the shot predates the build) |

## Before · Concept A at P0.3 (4bf260c7)

`TestPanel` in `src/prototypes/agent-builder-v3/parts/list-and-create.tsx`, opened by the header **Test** in `AgentA` (`concepts/a-tabs.tsx`) inside a modal `Sheet`, and by `onSaveAndTest` from the Advanced sheet (P0.3). The door is right and the shape is right: a right panel titled Test, one line, one button, the greeting as a line in quotes and italics. What is wrong against the JTBD and the v3 spec:

1. **Start test starts nothing.** No `POST /sessions`, no `agent_session_id` stored, no `client_reference`. The first answer is a two-second timer. (red, .a step 2)
2. **The panel is modal.** The rows behind it are inert, so "Sam ends the test and edits again" cannot happen; DESIGN.md §6 says the open test panel docks from xl and is a non-modal sheet below it, which the live builder already does. (red, .a step 4)
3. **Save and test lands one press short.** After a save the panel opens on Start test; a second press is needed before the first answer, and TTFA pays for it. (amber, .a step 1)
4. **One bubble is the transcript.** No person turn, no turn count, no ordering with the tool lines P0.5 adds. `agent_audio_heard` cannot carry `turnCount`. (amber, .a step 3)
5. **State is guessed from the button.** Nothing between Start test and the bubble; "Listening" is the only word, before and after the answer. (amber, .h)
6. **No Simulations.** The panel has no tabs; Studio X 2's Simulations tab is not ported, and the mic-denied fallback has nowhere to go. (amber, .a step 4, .c, requirement 52)
7. **Mic denied does nothing.** The browser is never asked, so the denial never shows. (red, .c)
8. **No refusal.** A suspended account, exhausted free minutes or a full concurrency limit all read "Listening". (red, .d, .e)
9. **No start failure.** No code, no retry, no module named when a BYOK key fails at start. (red, .f)
10. **An untouched preset cannot be tested.** `ready` needs a prompt, so the new agent from P0.1 says "Write the system prompt to talk to the agent." and Aha 1 never fires. (amber, KPI)
11. **End test drops the transcript.** The timer resets to zero and the lines vanish, so a retry cannot keep them and there is nothing to re-read while editing. (amber, .h, .a step 4)
12. **No event trail.** `test_panel_opened`, `agent_test_started`, `agent_test_ended`, `test_refused` are not fired; the funnel's stages 4 and 8 cannot be derived. (amber, KPI)

## After

The same panel, the same door, grown into a session with a state. **Save and test** saves the row, opens the panel on **Talk** and starts the session in one press; the header **Test** opens it on Start test, saving a dirty draft first. The panel has two text tabs, Talk and Simulations, and opens on Talk every time; below xl it is a non-modal right sheet, from xl it docks on the right and stays in view while the rows scroll. Start test asks the browser for the mic, sends `POST /sessions` with `agent: <agent_id>`, an rtc transport and `client_reference: studio_test:…`, stores the id and joins. The status line at the bottom always says where the session is: Saving, Starting, Listening, Running, no sound yet, or Ended with the length. The transcript is a list: the agent's lines in quotes and italics, Sam's own turns as plain lines on the right, each tool as P0.5's meta line with its code and time, a rejected key as P0.6's line, a divider between retries. Every failure to start is one `Alert` with one sentence and one action inside the panel body: mic denied (Try again, or a text simulation on the other tab), refused (Add card in place of Start test), too many sessions (the numbers from the Problem, Try again), failed to start (the code, Try again; a BYOK failure names the module and offers Replace key). A running session that plays nothing for 10 s reads so on the status line and offers a tone and a retry that keeps the transcript. End test keeps the lines and the length, and the rows stay editable beside them. An untouched preset agent tests at once with one line saying it answers from the model alone.

```
Test                                                      Close
Talk   Simulations
────────────────────────────────────────────────────────────────
Mia · 0:42
  “Hi, this is Mia at Acme Outfitters. How can I help?”
                                       Where is order 4471?
  ⌂ search_orders · 200 · 0.4 s
  “Order 4471 left the warehouse yesterday and should arrive
   on Tuesday.”

○ Ended · 0:42
────────────────────────────────────────────────────────────────
[            Start test            ]
```

```
Test                                                      Close
Talk   Simulations
────────────────────────────────────────────────────────────────
Aria · 0:11
  “Hi, this is Aria from Acme Energy. Is this Alex?”

⚠ Running, but nothing has played for 10 s. Check the browser's
  output device, or play a tone.       [Play a tone] [Try again]

◌ Running, no sound yet
────────────────────────────────────────────────────────────────
[            End test               ]
```

| Before | After | Why |
|---|---|---|
| Start test starts nothing | `POST /sessions` from `agent_id` with the `studio_test:` reference; the id stored; stop on End test, Close and leaving | .a step 2, learning 1 |
| Modal sheet | Non-modal sheet below xl, docked from xl (the live builder's panel) | .a step 4, DESIGN.md §6 |
| Save and test lands on Start test | Save and test starts the session; the header Test lands on Start test | .a step 1, KPI, learning 1 |
| One bubble | A transcript list: agent, person, tool, key, divider lines | .a step 3, .g, learning 4 |
| State from the button | The status line: Saving, Starting, Listening, Running, no sound yet, Ended · 0:42 | .h, learning 3 |
| No tabs | Talk and Simulations, opening on Talk; Simulations ported as it is | .a step 4, .c, learning 6 |
| Mic never asked | Asked before the session; denied shows the alert with Try again and the text fallback | .c, learning 4 |
| No refusal | One alert naming the blocker, Add card in place; the concurrency numbers from the Problem | .d, .e, learning 5 |
| No start failure | The code and Try again; 400 names the field; a BYOK 502 names the module and offers Replace key | .f, learning 4 |
| Untouched preset blocked | One line, Start test on, `agent_tested_baseline` on the first answer | Aha 1, KPI |
| End test drops everything | Transcript and length kept; a retry adds a divider | .h, .a step 4 |
| No events | The nine events of the row fired once per action through `trackProto` | KPI |

Nothing new enters the design system: `Sheet`, `Tabs` with text triggers, `Alert`, `Button`, `Spinner`, `Separator`, `sonner` and lucide icons all ship today; the docking is the live `AgentBuilderTestPanel`'s branch, the tool line is P0.5's, the key line and Replace key are P0.6's, the values body is P0.4's.
