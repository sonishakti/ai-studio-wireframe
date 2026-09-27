# P0.4 Tell the agent its job · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.4]. Change notes from the owner: none (no ClickUp comments). Depends on P0.1 (the agent exists with a type), P0.2 (Voice & models) and P0.3 (Advanced points at this door for the failure message). Requirements 5, 9, 11, 40; team ask 9 (one door next to the system prompt).

## Job step

Sam tells the agent its role and job, the first thing to say, and what to say when something fails.

- **Job.** Tell the agent its job.
- **Situation.** The agent exists on a preset with a voice. Its prompt is empty, it has no first line, and nothing is set for the moment the language model fails. Sam knows the task and wants the agent to do it in the next test.
- **Sam wants to** write the prompt where the builder opens, see the `{{variables}}` the prompt uses and give each one a default when it makes sense, set the greeting and the failure message behind one door, and hear the result.
- **So that** callers get the job done in one session, and nothing the agent says aloud is left to chance.

## Happy path · P0.4.a

Story: Sam wants the agent to handle a real task, so callers get the job done in one session.

1. The builder opens on **System prompt**, the first block after Voice & models. The editor is empty; under it sit **Use the starter prompt** and the door **Greeting and failure message**, without a tick. `builder_opened {section: prompt}`
2. Sam writes the prompt. Every `{{name}}` becomes a chip on the Variables line as Sam types; a chip opens a small default field. Sam gives `office_hours` a default and leaves `customer_name` and `appointment_time` to the contact list. The row footer shows **Cancel**, **Save**, **Save and test**. `prompt_edited` (on blur, once per change)
3. Sam opens **Greeting and failure message**. Who speaks first is the agent; Sam writes the first line, keeps Delay at 0 ms, and presses **Use a suggested line** under the empty Failure message. `greeting_configured {speaksFirst: agent, delayMs: 0, hasFailureMessage: true}`
4. Sam presses **Save and test**. The row saves, the test panel opens and asks once for the two variables without a default, then plays the greeting with them filled. `operation_succeeded {operation: agent_update}`, `agent_updated {surface: prompt, fields: [instructions, variables]}`, then `agent_audio_heard {surface: test_panel, agentVersion}`
5. Optional: Sam scrolls to **Analysis** and says what a successful session looks like (P1.9 owns that row).

Done when: the agent saves with `instructions`, `variables`, `greeting` and `failure_message`, and Sam hears the greeting in the same builder session.

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.4.b | Sam clears the prompt | Save and Save and test turn off; the footer line says "Write the system prompt to save it." **Use the starter prompt** puts the starter for the agent's type back in the editor; Cancel restores the saved text | none |
| P0.4.c | A `{{variable}}` has no default | The test panel asks for a value once, before Start test, with the defaults pre-filled and remembered for later tests in the session. For batch, New run maps each variable to a list column; a variable without a column shows its default, and one with neither shows the warning | none |
| P0.4.d | No failure message is set | The (i) beside Failure message says the agent stays silent when the language model fails; under the empty field one link, **Use a suggested line**, fills *"Sorry, I lost track there. Could you say that again?"* | `greeting_configured {hasFailureMessage: true, source: suggested}` |
| P0.4.e | The agent speaks first but the greeting is empty | Save names the empty line under Greeting: "Write the greeting, or let the caller speak first." Sam writes one, or picks The caller and the greeting fields give way to one line: "No greeting. The agent waits for the caller." | none |
| P0.4.f | Sam tests with unsaved prompt edits | The header **Test** saves the draft first, toasts "Prompt saved." and opens the panel, so Sam never hears an old prompt. A draft that cannot save (empty prompt) opens the panel on the existing line "Write the system prompt to talk to the agent." | `agent_updated {surface: prompt, trigger: test}` |

Type variants, not new rainy ids: a code agent has no Who speaks first (the greeting plays when the software starts a session, empty means the agent waits) and shows When it plays; a realtime agent hides Failure message with one line. Closing the sheet with edits asks Save, Discard or Keep editing (P0.3's guard).

Empty account: a brand-new account has no agent, so this row has no surface until P0.1 creates one. The first agent then opens exactly like step 1: empty editor, starter link, door without a tick.

## Measures

- KPI: median 2 active minutes or less from `builder_opened` to the first `prompt_edited` or `greeting_configured` followed by `agent_updated` with `instructions` or `greeting`. Funnel read: at least 80 % of `agent_created {source: console}` reach `agent_configured` within 14 days.
- Counter metric: prompt churn (3 or more `prompt_edited` with no `agent_audio_heard` between them) in 20 % of builder sessions or fewer. Save and test in the row and in the sheet exists to keep this low.
- Assumption to test: putting the prompt first, with a starter one click away, gets people configured faster than today's builder. Kill if the median does not drop by 20 % against the W0 baseline.
- API: Ready for `instructions`, `greeting {mode, on, delay_ms, text}`, `variables` and `pipeline.llm.failure_message`. Studio-only: who speaks first (derived from greeting presence), the empty-prompt block, the suggested line. Missing: `greeting.interruptible` (PATCH lists it null-only), a failure message on a realtime model, any AI-disclosure field. `agentVersion` reads `updated_at`.
